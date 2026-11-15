from typing import Dict, Any, List, Optional

def compute_derived_indicators(
    weekly_series: List[Dict[str, Any]],
    lat: float,
    lon: float,
    ndvi_time_series: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Computes derived agroclimatic indicators from harmonized weekly data:
    1. Bare-field periods (consecutive weeks with bare soil / NDVI < 0.20)
    2. Crop-stress windows (terminal heat stress, cold wave, monsoon dry spells, flood risk)
    3. Water balance proxy (P - ET0)
    4. Rainfall reliability and extremes
    5. Erosion risk proxy
    """

    bare_field_weeks: List[int] = []
    heat_stress_weeks: List[int] = []
    frost_weeks: List[int] = []
    dry_spell_weeks: List[int] = []
    flood_risk_weeks: List[int] = []

    seasonal_metrics = {
        "kharif": {"rainfall_mm": 0.0, "et0_mm": 0.0, "heat_stress_days": 0, "heavy_rain_days": 0, "weeks_count": 0},
        "rabi": {"rainfall_mm": 0.0, "et0_mm": 0.0, "frost_risk_days": 0, "heat_stress_days": 0, "weeks_count": 0},
        "zaid": {"rainfall_mm": 0.0, "et0_mm": 0.0, "heat_stress_days": 0, "bare_field_weeks": 0, "weeks_count": 0}
    }

    # If satellite NDVI is provided, check actual values; otherwise use seasonal fallow detection
    ndvi_lookup = {item["week_number"]: item["ndvi"] for item in (ndvi_time_series or [])}

    for w in weekly_series:
        w_num = w["week_number"]
        season = w["season"]
        precip = w["precipitation_mm"]
        et0 = w["reference_et0_mm"]
        tmax = w["tmax"]
        tmin = w["tmin"]
        wb = w["water_balance_mm"]

        # Track seasonal sums
        if season in seasonal_metrics:
            s_dict = seasonal_metrics[season]
            s_dict["weeks_count"] += 1
            s_dict["rainfall_mm"] = round(s_dict["rainfall_mm"] + precip, 1)
            s_dict["et0_mm"] = round(s_dict["et0_mm"] + et0, 1)
            if "heat_stress_days" in s_dict:
                s_dict["heat_stress_days"] += w["heat_stress_days"]

        # 1. Bare-field detection
        # In typical IGP rice-wheat systems without zaid legume, weeks 13-24 (late March to mid June) are fallow
        has_satellite_bare = (w_num in ndvi_lookup and ndvi_lookup[w_num] < 0.22)
        is_zaid_fallow = (season == "zaid" and precip < 25.0)

        if has_satellite_bare or is_zaid_fallow:
            bare_field_weeks.append(w_num)
            seasonal_metrics["zaid"]["bare_field_weeks"] += 1

        # 2. Terminal Heat Stress (wheat grain-filling in March / early April: weeks 9 to 14)
        if 9 <= w_num <= 14 and (tmax >= 32.0 or w["heat_stress_days"] >= 1):
            heat_stress_weeks.append(w_num)

        # 3. Frost / Cold Wave (late Dec to Jan: weeks 51, 52, 1, 2, 3)
        if (w_num >= 50 or w_num <= 4) and (tmin <= 6.0 or w["frost_risk_days"] >= 1):
            frost_weeks.append(w_num)

        # 4. Monsoon Dry Spells (Kharif: weeks 26 to 37 with sharp deficit)
        if 26 <= w_num <= 37 and precip < 15.0 and wb < -15.0:
            dry_spell_weeks.append(w_num)

        # 5. Flood / Waterlogging risk (weekly precip > 90mm or >= 2 heavy rain days)
        if precip >= 90.0 or w["heavy_rain_days"] >= 2:
            flood_risk_weeks.append(w_num)

    # Consolidate stress windows into narrative descriptions for farmers
    stress_windows = []

    if heat_stress_weeks:
        stress_windows.append({
            "id": "terminal_heat",
            "hazard": "Terminal Heat Stress",
            "season": "Rabi (Late Grain-Filling)",
            "weeks": heat_stress_weeks,
            "period": "Early March – Early April (Weeks 9–14)",
            "severity": "High" if len(heat_stress_weeks) >= 2 else "Medium",
            "description": f"Detected across {len(heat_stress_weeks)} calendar weeks where maximum temperatures exceed 32–35°C during wheat reproductive flowering and grain fill.",
            "impact": "Can force premature ripening of wheat, shrinking grain size and causing 15–25% yield penalties.",
            "agronomic_advice": "Consider shorter duration wheat (e.g. DBW 187, HD 2967) sown before Nov 15, or intercropping/rotation with early rabi legumes."
        })

    if frost_weeks:
        stress_windows.append({
            "id": "cold_wave",
            "hazard": "Winter Cold Wave & Fog",
            "season": "Rabi (Mid-Winter)",
            "weeks": frost_weeks,
            "period": "Late December – Mid January (Weeks 50–3)",
            "severity": "Medium",
            "description": f"Detected across {len(frost_weeks)} weeks with minimum night temperatures falling towards 4–6°C coupled with high humidity.",
            "impact": "Aphid flare-ups and flower abortion in yellow mustard; late blight vulnerability in potato.",
            "agronomic_advice": "Provide light evening irrigation prior to forecasted cold spells to stabilize root-zone soil temperature."
        })

    if dry_spell_weeks:
        stress_windows.append({
            "id": "monsoon_break",
            "hazard": "Monsoon Dry Spell / Vegetative Drought",
            "season": "Kharif (Monsoon)",
            "weeks": dry_spell_weeks,
            "period": "July – August",
            "severity": "High" if len(dry_spell_weeks) >= 3 else "Medium",
            "description": f"Detected {len(dry_spell_weeks)} critical deficit weeks during active vegetative growth where weekly rainfall dropped below 15 mm under high evaporative demand.",
            "impact": "Stunted tillering and weed out-competition in transplanted paddy.",
            "agronomic_advice": "Enhance soil organic matter with green manuring (dhaincha) or mulching to increase root-zone water holding capacity."
        })

    if flood_risk_weeks:
        stress_windows.append({
            "id": "waterlogging",
            "hazard": "Heavy Rainfall / Waterlogging Inundation",
            "season": "Kharif (Peak Monsoon)",
            "weeks": flood_risk_weeks,
            "period": "July – September",
            "severity": "High" if len(flood_risk_weeks) >= 3 else "Medium",
            "description": f"Detected {len(flood_risk_weeks)} weeks with excessive downpours (≥ 90 mm/week or multiple days with ≥ 25 mm/day).",
            "impact": "Kharif maize or pulse mortality due to root hypoxia; lowlands submerged.",
            "agronomic_advice": "In lowlands, ensure submergence-tolerant paddy (Swarna Sub-1) or wetland makhana integration."
        })

    # Bare field window summary
    bare_field_periods = []
    if bare_field_weeks:
        bare_field_periods.append({
            "season": "zaid",
            "season_label": "Zaid (Summer Fallow)",
            "consecutive_weeks": len(bare_field_weeks),
            "calendar_range": "Late March to Early June (Weeks 13–23)",
            "severity": "High",
            "description": f"Field remains unplanted for approximately {len(bare_field_weeks)} consecutive weeks during the hottest period of the year.",
            "consequences": [
                "Intense solar radiation oxidizes and degrades topsoil organic carbon",
                "Loose, unshielded topsoil is vulnerable to pre-monsoon wind and water erosion",
                "Zero economic return or forage yield generated during this 70–80 day window"
            ],
            "solution": "Plant 60-day summer mung bean (moong) for pulse harvest, or 45-day Sesbania (dhaincha) green manure to rebuild biological nitrogen."
        })

    # Erosion risk proxy computation:
    # High if high monsoon rain + extended bare-field window in zaid
    zaid_bare_count = seasonal_metrics["zaid"]["bare_field_weeks"]
    kharif_rain = seasonal_metrics["kharif"]["rainfall_mm"]
    if zaid_bare_count >= 8 and kharif_rain >= 800.0:
        erosion_risk_rating = "High"
        erosion_explanation = "Extended bare soil through summer followed by intense monsoon downpours leaves topsoil highly vulnerable to detachment and sheetwash erosion."
    elif zaid_bare_count >= 5 or kharif_rain >= 500.0:
        erosion_risk_rating = "Medium"
        erosion_explanation = "Moderate bare-field exposure prior to monsoon onset; introducing summer cover crops significantly stabilizes topsoil."
    else:
        erosion_risk_rating = "Low"
        erosion_explanation = "Shorter fallow periods or well-distributed precipitation minimize detachment risk."

    return {
        "location": {"lat": lat, "lon": lon},
        "plain_language_summary": f"Your field is typically bare for ~{len(bare_field_weeks)} weeks from late March to June, exposing topsoil to intense heat and erosion. {len(stress_windows)} climatic stress windows were detected across the annual cycle.",
        "bare_field_periods": bare_field_periods,
        "stress_windows": stress_windows,
        "seasonal_breakdown": seasonal_metrics,
        "erosion_risk_proxy": {
            "rating": erosion_risk_rating,
            "explanation": erosion_explanation
        }
    }
