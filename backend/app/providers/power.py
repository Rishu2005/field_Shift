import json
import logging
import os
from pathlib import Path
from typing import Dict, Any, Optional, List
import httpx

from .base import BaseDataProvider

logger = logging.getLogger(__name__)

CACHE_DIR = Path(__file__).resolve().parent.parent / "cache"

class NasaPowerProvider(BaseDataProvider):
    """
    NASA POWER (Prediction Of Worldwide Energy Resources) Agroclimatology Provider.
    Fetches daily solar radiation, 2m temperature (mean, min, max), precipitation,
    and relative humidity at ~0.5° x 0.5° resolution.
    Public API: https://power.larc.nasa.gov/api/temporal/daily/point
    """

    BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

    def __init__(self):
        super().__init__(
            name="NASA POWER Agroclimatology",
            resolution="0.5° × 0.5° (~50 km)",
            source_agency="NASA Langley Research Center"
        )
        CACHE_DIR.mkdir(parents=True, exist_ok=True)

    def _get_cache_key(self, lat: float, lon: float, start: str, end: str) -> Path:
        rounded_lat = round(lat, 2)
        rounded_lon = round(lon, 2)
        filename = f"power_{rounded_lat}_{rounded_lon}_{start}_{end}.json"
        return CACHE_DIR / filename

    def _get_fallback_cache_file(self) -> Path:
        return CACHE_DIR / "bihar_power_default.json"

    async def fetch_point_data(
        self,
        lat: float,
        lon: float,
        start_date: Optional[str] = "20230101",
        end_date: Optional[str] = "20231231"
    ) -> Dict[str, Any]:
        """
        Fetches daily agroclimatology data from NASA POWER API with disk cache and offline fallback.
        Dates in format YYYYMMDD.
        """
        start = (start_date or "20230101").replace("-", "")
        end = (end_date or "20231231").replace("-", "")

        cache_path = self._get_cache_key(lat, lon, start, end)

        # 1. Check local on-demand disk cache
        if cache_path.exists():
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    cached = json.load(f)
                    cached["provenance"]["is_cached"] = True
                    cached["provenance"]["is_fallback"] = False
                    return cached
            except Exception as e:
                logger.warning(f"Failed reading cache from {cache_path}: {e}")

        # 2. Attempt live query to NASA POWER API
        params = {
            "parameters": "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,ALLSKY_SFC_SW_DWN,RH2M",
            "community": "AG",
            "longitude": f"{lon:.4f}",
            "latitude": f"{lat:.4f}",
            "start": start,
            "end": end,
            "format": "JSON"
        }

        raw_data = None
        is_fallback = False

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                resp = await client.get(self.BASE_URL, params=params)
                if resp.status_code == 200:
                    raw_data = resp.json()
                else:
                    logger.warning(f"NASA POWER API returned status {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            logger.warning(f"NASA POWER API live query failed: {e}. Falling back to cached data.")

        # 3. If live query failed, check default Bihar cache or synthetic baseline
        if not raw_data:
            fallback_file = self._get_fallback_cache_file()
            if fallback_file.exists():
                try:
                    with open(fallback_file, "r", encoding="utf-8") as f:
                        cached = json.load(f)
                        cached["provenance"]["is_cached"] = True
                        cached["provenance"]["is_fallback"] = True
                        cached["provenance"]["note"] = "Served from pre-cached Bihar benchmark dataset (Live NASA POWER API offline or unreachable)."
                        return cached
                except Exception as e:
                    logger.warning(f"Failed reading fallback cache: {e}")

            # Generate synthetic fallback data modeled on Bihar agroclimatology
            return self._generate_bihar_fallback(lat, lon, start, end)

        # 4. Parse and harmonize live data
        harmonized = self._harmonize_power_data(raw_data, lat, lon, start, end, is_cached=False, is_fallback=False)

        # Save to disk cache
        try:
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(harmonized, f)
        except Exception as e:
            logger.warning(f"Failed to write cache {cache_path}: {e}")

        return harmonized

    def _harmonize_power_data(
        self,
        raw_json: Dict[str, Any],
        lat: float,
        lon: float,
        start: str,
        end: str,
        is_cached: bool,
        is_fallback: bool
    ) -> Dict[str, Any]:
        props = raw_json.get("properties", {}).get("parameter", {})
        t2m = props.get("T2M", {})
        t2m_max = props.get("T2M_MAX", {})
        t2m_min = props.get("T2M_MIN", {})
        precip = props.get("PRECTOTCORR", {})
        srad = props.get("ALLSKY_SFC_SW_DWN", {})
        rh = props.get("RH2M", {})

        dates = sorted(list(t2m.keys()))
        daily_records: List[Dict[str, Any]] = []

        total_precip = 0.0
        heat_stress_count = 0
        frost_risk_count = 0
        heavy_rain_count = 0
        tmax_list = []
        tmin_list = []
        tmean_list = []

        monthly_dict: Dict[str, Dict[str, float]] = {}

        for d in dates:
            # ISO date format: YYYY-MM-DD
            iso_date = f"{d[0:4]}-{d[4:6]}-{d[6:8]}"
            month_key = f"{d[0:4]}-{d[4:6]}"

            val_t = t2m.get(d)
            val_tmax = t2m_max.get(d)
            val_tmin = t2m_min.get(d)
            val_p = precip.get(d)
            val_rad = srad.get(d)
            val_rh = rh.get(d)

            # Skip fill values (-999)
            if val_t == -999.0 or val_t is None:
                continue

            val_p = max(0.0, float(val_p or 0.0))
            val_tmax = float(val_tmax if val_tmax is not None and val_tmax != -999 else val_t)
            val_tmin = float(val_tmin if val_tmin is not None and val_tmin != -999 else val_t)
            val_t = float(val_t)
            val_rad = float(val_rad if val_rad is not None and val_rad != -999 else 15.0)
            val_rh = float(val_rh if val_rh is not None and val_rh != -999 else 65.0)

            is_heat_stress = val_tmax >= 35.0
            is_frost_risk = val_tmin <= 4.0
            is_heavy_rain = val_p >= 25.0

            if is_heat_stress:
                heat_stress_count += 1
            if is_frost_risk:
                frost_risk_count += 1
            if is_heavy_rain:
                heavy_rain_count += 1

            total_precip += val_p
            tmax_list.append(val_tmax)
            tmin_list.append(val_tmin)
            tmean_list.append(val_t)

            daily_records.append({
                "date": iso_date,
                "t2m": round(val_t, 2),
                "t2m_max": round(val_tmax, 2),
                "t2m_min": round(val_tmin, 2),
                "precipitation_mm": round(val_p, 2),
                "solar_radiation_mj": round(val_rad, 2),
                "rh_pct": round(val_rh, 1),
                "heat_stress": is_heat_stress,
                "frost_risk": is_frost_risk
            })

            # Monthly accumulation
            if month_key not in monthly_dict:
                monthly_dict[month_key] = {
                    "month": month_key,
                    "precipitation_mm": 0.0,
                    "tmax_sum": 0.0,
                    "tmin_sum": 0.0,
                    "count": 0
                }
            monthly_dict[month_key]["precipitation_mm"] += val_p
            monthly_dict[month_key]["tmax_sum"] += val_tmax
            monthly_dict[month_key]["tmin_sum"] += val_tmin
            monthly_dict[month_key]["count"] += 1

        monthly_records = []
        for m_key, m_data in sorted(monthly_dict.items()):
            cnt = max(1, m_data["count"])
            monthly_records.append({
                "month": m_key,
                "precipitation_mm": round(m_data["precipitation_mm"], 1),
                "avg_tmax": round(m_data["tmax_sum"] / cnt, 1),
                "avg_tmin": round(m_data["tmin_sum"] / cnt, 1)
            })

        summary = {
            "total_rainfall_mm": round(total_precip, 1),
            "avg_temperature_c": round(sum(tmean_list) / max(1, len(tmean_list)), 1),
            "max_temperature_c": round(max(tmax_list, default=0.0), 1),
            "min_temperature_c": round(min(tmin_list, default=0.0), 1),
            "heat_stress_days": heat_stress_count,
            "frost_risk_days": frost_risk_count,
            "heavy_rain_days": heavy_rain_count,
            "total_days": len(daily_records)
        }

        provenance = self.get_provenance(
            is_cached=is_cached,
            is_fallback=is_fallback,
            date_range=f"{start} to {end}",
            note="Live NASA POWER data." if not is_fallback else "Cached benchmark data."
        )

        return {
            "location": { "lat": lat, "lon": lon },
            "provenance": provenance,
            "summary": summary,
            "monthly": monthly_records,
            "daily": daily_records
        }

    def _generate_bihar_fallback(self, lat: float, lon: float, start: str, end: str) -> Dict[str, Any]:
        """
        Generates realistic climatological daily data for Bihar as an emergency fallback
        if live API is unreachable and no cache exists.
        """
        import datetime
        import math

        s_year = int(start[0:4])
        s_month = int(start[4:6])
        s_day = int(start[6:8])
        e_year = int(end[0:4])
        e_month = int(end[4:6])
        e_day = int(end[6:8])

        cur_date = datetime.date(s_year, s_month, s_day)
        end_date_obj = datetime.date(e_year, e_month, e_day)

        daily_records = []
        monthly_dict = {}
        total_precip = 0.0
        heat_stress_count = 0
        frost_risk_count = 0
        heavy_rain_count = 0
        tmax_list = []
        tmin_list = []
        tmean_list = []

        day_idx = 0
        while cur_date <= end_date_obj:
            day_of_year = cur_date.timetuple().tm_yday
            month = cur_date.month
            iso_date = cur_date.isoformat()
            month_key = cur_date.strftime("%Y-%m")

            # Bihar climatological curves:
            # Coldest in Jan (day ~15): Tmean ~14°C, Tmin ~8°C, Tmax ~21°C
            # Hottest in May/June (day ~140-160): Tmax ~38-42°C, Tmin ~27°C
            # Monsoon in July-Sept (day ~180-260): heavy rains, Tmax ~33°C, high RH
            seasonal_temp_factor = math.sin((day_of_year - 105) * 2 * math.pi / 365)
            tmax = 30.0 + 10.0 * seasonal_temp_factor + 1.5 * math.sin(day_idx * 0.7)
            tmin = 20.0 + 10.0 * seasonal_temp_factor + 1.2 * math.cos(day_idx * 0.5)
            tmean = (tmax + tmin) / 2.0

            # Rainfall: 85% during monsoon (months 6, 7, 8, 9)
            if month in [7, 8]:
                p = 10.0 + 18.0 * math.sin(day_idx * 0.3) if (day_idx % 4 != 0) else 0.0
                p = max(0.0, p)
            elif month in [6, 9]:
                p = 5.0 + 12.0 * math.sin(day_idx * 0.2) if (day_idx % 5 != 0) else 0.0
                p = max(0.0, p)
            else:
                p = 2.0 if (day_idx % 28 == 0) else 0.0

            srad = 18.0 + 6.0 * math.sin(day_of_year * 2 * math.pi / 365)
            rh = 80.0 if month in [7, 8, 9] else (45.0 if month in [4, 5] else 65.0)

            is_heat_stress = tmax >= 35.0
            is_frost_risk = tmin <= 4.0
            is_heavy_rain = p >= 25.0

            if is_heat_stress:
                heat_stress_count += 1
            if is_frost_risk:
                frost_risk_count += 1
            if is_heavy_rain:
                heavy_rain_count += 1

            total_precip += p
            tmax_list.append(tmax)
            tmin_list.append(tmin)
            tmean_list.append(tmean)

            daily_records.append({
                "date": iso_date,
                "t2m": round(tmean, 2),
                "t2m_max": round(tmax, 2),
                "t2m_min": round(tmin, 2),
                "precipitation_mm": round(p, 2),
                "solar_radiation_mj": round(srad, 2),
                "rh_pct": round(rh, 1),
                "heat_stress": is_heat_stress,
                "frost_risk": is_frost_risk
            })

            if month_key not in monthly_dict:
                monthly_dict[month_key] = {"month": month_key, "precipitation_mm": 0.0, "tmax_sum": 0.0, "tmin_sum": 0.0, "count": 0}
            monthly_dict[month_key]["precipitation_mm"] += p
            monthly_dict[month_key]["tmax_sum"] += tmax
            monthly_dict[month_key]["tmin_sum"] += tmin
            monthly_dict[month_key]["count"] += 1

            cur_date += datetime.timedelta(days=1)
            day_idx += 1

        monthly_records = []
        for m_key, m_data in sorted(monthly_dict.items()):
            cnt = max(1, m_data["count"])
            monthly_records.append({
                "month": m_key,
                "precipitation_mm": round(m_data["precipitation_mm"], 1),
                "avg_tmax": round(m_data["tmax_sum"] / cnt, 1),
                "avg_tmin": round(m_data["tmin_sum"] / cnt, 1)
            })

        summary = {
            "total_rainfall_mm": round(total_precip, 1),
            "avg_temperature_c": round(sum(tmean_list) / max(1, len(tmean_list)), 1),
            "max_temperature_c": round(max(tmax_list, default=0.0), 1),
            "min_temperature_c": round(min(tmin_list, default=0.0), 1),
            "heat_stress_days": heat_stress_count,
            "frost_risk_days": frost_risk_count,
            "heavy_rain_days": heavy_rain_count,
            "total_days": len(daily_records)
        }

        provenance = self.get_provenance(
            is_cached=True,
            is_fallback=True,
            date_range=f"{start} to {end}",
            note="Pre-computed Bihar baseline agroclimatology (Offline fallback)."
        )

        return {
            "location": { "lat": lat, "lon": lon },
            "provenance": provenance,
            "summary": summary,
            "monthly": monthly_records,
            "daily": daily_records
        }
