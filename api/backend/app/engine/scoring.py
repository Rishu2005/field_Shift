import json
from pathlib import Path
from typing import Dict, Any, List, Optional

KNOWLEDGE_DIR = Path(__file__).resolve().parent.parent / "knowledge"

def load_json(name: str) -> Any:
    with open(KNOWLEDGE_DIR / name, "r", encoding="utf-8") as f:
        return json.load(f)

class RotationScoringEngine:
    """
    Explainable, rule-based 8-criterion scoring engine.
    Calculates 0-100 scores for:
    1. Water efficiency
    2. Drought & heat resilience
    3. Flood & waterlogging resilience
    4. Soil health
    5. Erosion reduction
    6. Pest-cycle disruption
    7. Income & market potential
    8. Feasibility & equipment fit
    """

    def __init__(self):
        self.crops = {c["id"]: c for c in load_json("crops.json")}

    def score_strategy(
        self,
        strategy: Dict[str, Any],
        priorities: Dict[str, float],
        constraints: Dict[str, Any],
        indicators: Dict[str, Any],
        scenario_deltas: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        deltas = scenario_deltas or {}
        rain_delta_pct = deltas.get("rainfall_change_pct", 0.0) # -30 to +30
        temp_delta_c = deltas.get("temp_change_c", 0.0)         # 0 to +3.0

        seq = strategy.get("sequence", [])
        crop_objs = [self.crops.get(s["crop_id"]) for s in seq if s.get("crop_id")]
        crop_objs = [c for c in crop_objs if c]

        # Environmental indicator inputs
        bare_weeks = indicators.get("bare_field_periods", [{}])[0].get("consecutive_weeks", 10) if indicators.get("bare_field_periods") else 0
        stress_windows = indicators.get("stress_windows", [])
        has_terminal_heat = any(s.get("id") == "terminal_heat" for s in stress_windows) or (temp_delta_c >= 1.5)
        has_monsoon_deficit = any(s.get("id") == "monsoon_break" for s in stress_windows) or (rain_delta_pct <= -15.0)
        is_flood_prone = constraints.get("flood_prone", False) or (rain_delta_pct >= 20.0)
        irrigation = constraints.get("irrigation", "limited") # none, limited, reliable
        equipment = constraints.get("equipment", "small_tractor") # manual, small_tractor, full

        # 1. WATER EFFICIENCY (0-100)
        # Ratio of low/medium water crops vs high water crops
        high_water_crops = [c for c in crop_objs if c.get("water_demand") == "High"]
        low_water_crops = [c for c in crop_objs if c.get("water_demand") == "Low"]

        base_water = 70.0
        if len(high_water_crops) >= 2:
            base_water -= 25.0
        elif len(high_water_crops) == 1:
            base_water -= 10.0

        base_water += len(low_water_crops) * 15.0

        if irrigation == "none":
            base_water -= len(high_water_crops) * 20.0
        elif irrigation == "reliable":
            base_water += 10.0

        if rain_delta_pct < 0:
            # Under drought scenario, water efficiency of water-hungry crops drops further
            base_water += (rain_delta_pct * 0.3) if len(high_water_crops) >= 1 else (rain_delta_pct * 0.1)

        score_water = round(max(20.0, min(98.0, base_water)), 1)

        # 2. DROUGHT & HEAT RESILIENCE (0-100)
        base_drought = 65.0
        heat_tol_scores = {"High": 15.0, "Medium": 5.0, "Low": -15.0}
        drought_tol_scores = {"High": 15.0, "Medium": 5.0, "Low": -15.0}

        for c in crop_objs:
            base_drought += heat_tol_scores.get(c.get("heat_tolerance", "Medium"), 0.0) / len(crop_objs)
            base_drought += drought_tol_scores.get(c.get("drought_tolerance", "Medium"), 0.0) / len(crop_objs)

        if has_terminal_heat:
            # Wheat is notably vulnerable to terminal heat
            has_wheat = any(c.get("id") == "wheat" for c in crop_objs)
            if has_wheat:
                base_drought -= (15.0 + temp_delta_c * 5.0)

        if temp_delta_c > 0:
            base_drought -= (temp_delta_c * 4.0)

        score_drought_heat = round(max(15.0, min(95.0, base_drought)), 1)

        # 3. FLOOD & WATERLOGGING RESILIENCE (0-100)
        base_flood = 60.0
        for c in crop_objs:
            ft = c.get("flood_tolerance", "Medium")
            if ft == "High":
                base_flood += 12.0
            elif ft == "Low":
                base_flood -= 10.0

        if is_flood_prone:
            # Severe penalty if rotation contains crops sensitive to waterlogging (maize/pulses in kharif)
            sensitive = [c for c in crop_objs if c.get("flood_tolerance") == "Low" and "kharif" in c.get("seasons", [])]
            base_flood -= len(sensitive) * 25.0

        score_flood = round(max(15.0, min(98.0, base_flood)), 1)

        # 4. SOIL HEALTH (0-100)
        # N-fixation + organic residue + root architecture
        n_fixers = [c for c in crop_objs if c.get("nitrogen_fixation", {}).get("is_fixer", False)]
        high_residue = [c for c in crop_objs if c.get("residue_organic_matter") == "High"]
        deep_roots = [c for c in crop_objs if c.get("root_depth") == "Deep"]

        base_soil = 40.0
        base_soil += len(n_fixers) * 22.0
        base_soil += len(high_residue) * 12.0
        base_soil += len(deep_roots) * 10.0

        score_soil_health = round(max(25.0, min(98.0, base_soil)), 1)

        # 5. EROSION REDUCTION (0-100)
        # Full season ground cover vs bare fallow
        has_zaid_crop = any(s.get("season") == "zaid" and s.get("crop_id") for s in seq)
        base_erosion = 50.0
        if has_zaid_crop:
            base_erosion = 88.0 # Covers the critical zaid fallow
        else:
            base_erosion = 38.0 # Leaves ground bare during hot zaid and pre-monsoon rains

        score_erosion = round(max(20.0, min(96.0, base_erosion)), 1)

        # 6. PEST-CYCLE DISRUPTION (0-100)
        # Plant family diversity
        families = [c.get("family") for c in crop_objs if c.get("family")]
        unique_families = len(set(families))

        if len(families) >= 2 and unique_families == 1:
            score_pest = 35.0 # Continuous Poaceae monoculture (Rice-Wheat)
        elif unique_families == 2:
            score_pest = 72.0
        elif unique_families >= 3:
            score_pest = 92.0 # Rotates Poaceae -> Fabaceae -> Brassicaceae
        else:
            score_pest = 55.0

        # 7. INCOME & MARKET POTENTIAL (0-100)
        base_income = 55.0
        cash_crops = [c for c in crop_objs if any(term in c.get("market_class", "") for term in ["Cash", "High-Value", "Superfood", "GI Tag"])]
        base_income += len(cash_crops) * 16.0
        if len(crop_objs) >= 3:
            base_income += 10.0 # Triple-cropping offers extra seasonal cash flow

        score_income = round(max(30.0, min(96.0, base_income)), 1)

        # 8. FEASIBILITY & EQUIPMENT FIT (0-100)
        base_feasibility = 80.0
        high_labour_crops = [c for c in crop_objs if c.get("labour_equipment_needs") == "High"]
        if equipment == "manual" and len(high_labour_crops) >= 2:
            base_feasibility -= 20.0

        has_sesbania = any(c.get("id") == "sesbania" for c in crop_objs)
        if has_sesbania and equipment == "manual":
            base_feasibility -= 18.0 # Dhaincha incorporation requires tractor rotavator

        score_feasibility = round(max(35.0, min(95.0, base_feasibility)), 1)

        # COMPOSITE SCORE (WEIGHTED SUM FROM FARMER PRIORITIES)
        crit_scores = {
            "water_efficiency": score_water,
            "drought_heat_resilience": score_drought_heat,
            "flood_resilience": score_flood,
            "soil_health": score_soil_health,
            "erosion_reduction": score_erosion,
            "pest_disruption": score_pest,
            "income_market": score_income,
            "feasibility": score_feasibility
        }

        # Weight mapping from farmer inputs
        weights = {
            "water_efficiency": priorities.get("conserve_water", 0.6),
            "drought_heat_resilience": priorities.get("drought_resilience", 0.5),
            "flood_resilience": 0.8 if is_flood_prone else 0.4,
            "soil_health": priorities.get("organic_matter", 0.6) + priorities.get("nitrogen_fixation", 0.6),
            "erosion_reduction": priorities.get("erosion_reduction", 0.5),
            "pest_disruption": 0.5,
            "income_market": priorities.get("income", 0.7),
            "feasibility": 0.6
        }

        total_weight = sum(weights.values())
        weighted_sum = sum(crit_scores[k] * weights[k] for k in crit_scores)
        composite_score = round(weighted_sum / total_weight, 1)

        return {
            "composite_score": composite_score,
            "criteria_scores": crit_scores,
            "weights_used": {k: round(v / total_weight, 3) for k, v in weights.items()}
        }
