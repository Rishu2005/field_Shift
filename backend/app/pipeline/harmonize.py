import math
from typing import Dict, Any, List, Optional
import datetime

def calculate_hargreaves_et0(tmin: float, tmax: float, tmean: float, ra_mj: float) -> float:
    """
    FAO-56 Hargreaves-Samani reference evapotranspiration (ET0) approximation (mm/day).
    ET0 = 0.0023 * (Tmean + 17.8) * sqrt(Tmax - Tmin) * Ra
    Ra in mm/day equivalent: 1 MJ/m^2/day approx 0.408 mm/day of water evaporation.
    """
    delta_t = max(0.1, tmax - tmin)
    ra_mm = max(0.0, ra_mj * 0.408)
    et0 = 0.0023 * (tmean + 17.8) * math.sqrt(delta_t) * ra_mm
    return max(0.5, min(12.0, et0))

def harmonize_to_weekly(daily_records: List[Dict[str, Any]], lat: float) -> List[Dict[str, Any]]:
    """
    Aggregates daily records into standard ISO calendar weeks (1 to 52/53).
    Computes weekly totals for rainfall, average temperatures, weekly ET0 estimate,
    and rolling water balance proxy (P - ET0).
    """
    weekly_buckets: Dict[int, Dict[str, Any]] = {}

    for rec in daily_records:
        date_str = rec["date"]
        d = datetime.date.fromisoformat(date_str)
        iso_year, iso_week, _ = d.isocalendar()

        if iso_week not in weekly_buckets:
            weekly_buckets[iso_week] = {
                "week_number": iso_week,
                "start_date": date_str,
                "end_date": date_str,
                "days_count": 0,
                "tmax_sum": 0.0,
                "tmin_sum": 0.0,
                "tmean_sum": 0.0,
                "precip_sum": 0.0,
                "srad_sum": 0.0,
                "rh_sum": 0.0,
                "heat_stress_days": 0,
                "frost_risk_days": 0,
                "heavy_rain_days": 0
            }

        w = weekly_buckets[iso_week]
        w["end_date"] = date_str
        w["days_count"] += 1
        w["tmax_sum"] += rec["t2m_max"]
        w["tmin_sum"] += rec["t2m_min"]
        w["tmean_sum"] += rec["t2m"]
        w["precip_sum"] += rec["precipitation_mm"]
        w["srad_sum"] += rec.get("solar_radiation_mj", 15.0)
        w["rh_sum"] += rec.get("rh_pct", 65.0)

        if rec.get("heat_stress", False):
            w["heat_stress_days"] += 1
        if rec.get("frost_risk", False):
            w["frost_risk_days"] += 1
        if rec.get("precipitation_mm", 0) >= 25.0:
            w["heavy_rain_days"] += 1

    weekly_series: List[Dict[str, Any]] = []

    for week_num in sorted(weekly_buckets.keys()):
        w = weekly_buckets[week_num]
        cnt = max(1, w["days_count"])

        avg_tmax = round(w["tmax_sum"] / cnt, 1)
        avg_tmin = round(w["tmin_sum"] / cnt, 1)
        avg_tmean = round(w["tmean_sum"] / cnt, 1)
        total_precip = round(w["precip_sum"], 1)
        avg_srad = round(w["srad_sum"] / cnt, 1)
        avg_rh = round(w["rh_sum"] / cnt, 1)

        # Estimate weekly reference ET0
        daily_et0 = calculate_hargreaves_et0(avg_tmin, avg_tmax, avg_tmean, avg_srad)
        weekly_et0 = round(daily_et0 * cnt, 1)
        water_balance_mm = round(total_precip - weekly_et0, 1)

        # Map calendar week to Bihar agronomic season
        # Kharif: weeks ~24 to 43 (June to October)
        # Rabi: weeks ~44 to 12 (November to March)
        # Zaid: weeks ~13 to 23 (Late March to June)
        if 24 <= week_num <= 43:
            season = "kharif"
            season_label = "Kharif (Monsoon)"
        elif week_num >= 44 or week_num <= 12:
            season = "rabi"
            season_label = "Rabi (Winter)"
        else:
            season = "zaid"
            season_label = "Zaid (Summer)"

        weekly_series.append({
            "week_number": week_num,
            "season": season,
            "season_label": season_label,
            "start_date": w["start_date"],
            "end_date": w["end_date"],
            "tmax": avg_tmax,
            "tmin": avg_tmin,
            "tmean": avg_tmean,
            "precipitation_mm": total_precip,
            "reference_et0_mm": weekly_et0,
            "water_balance_mm": water_balance_mm,
            "heat_stress_days": w["heat_stress_days"],
            "frost_risk_days": w["frost_risk_days"],
            "heavy_rain_days": w["heavy_rain_days"],
            "relative_humidity": avg_rh,
            "solar_radiation": avg_srad
        })

    return weekly_series
