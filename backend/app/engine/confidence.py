from typing import Dict, Any, List

class StrategyConfidenceEvaluator:
    """
    Evaluates confidence level (High / Medium / Low) and compiles explicit
    information gaps for each crop-rotation strategy.
    """

    def evaluate(
        self,
        strategy: Dict[str, Any],
        indicators: Dict[str, Any],
        crop_library: Dict[str, Any]
    ) -> Dict[str, Any]:
        seq = strategy.get("sequence", [])
        crop_ids = [s["crop_id"] for s in seq if s.get("crop_id")]
        crop_objs = [crop_library.get(cid) for cid in crop_ids if cid in crop_library]

        confidence_score = 100
        reasons_for_penalty = []
        information_gaps = [
            "No field-level laboratory soil test (NPK, pH, organic C); relying on regional agro-climatic zone baseline.",
            "Satellite agroclimatology (~50 km NASA POWER) provides macro-regional trends and does not capture microclimate variations within your parcel.",
            "Local mandi spot market prices fluctuate daily; economic returns are estimated from seasonal baseline price trends."
        ]

        # Check for missing knowledge values in crops
        for c in crop_objs:
            gaps = c.get("information_gaps", [])
            for g in gaps:
                if g not in information_gaps:
                    information_gaps.append(f"{c['name']}: {g}")

        # Check if strategy requires high water with limited ground data
        has_high_water = any(c.get("water_demand") == "High" for c in crop_objs)
        if has_high_water:
            information_gaps.append("Local tubewell aquifer depth and pumping hours are unmetered.")
            confidence_score -= 10

        # Inundation uncertainty for wetland crops
        if any(c.get("id") == "makhana" for c in crop_objs):
            information_gaps.append("Makhana water-depth maintenance requires field-specific bunding and de-watering infrastructure.")
            confidence_score -= 10

        # Classify confidence level
        if confidence_score >= 85:
            level = "High"
            explanation = "High confidence supported by continuous daily NASA Earth observations and well-documented regional crop practices."
        elif confidence_score >= 70:
            level = "Medium"
            explanation = "Medium confidence: Sound agronomic evidence, but relies on coarse satellite grids (~50 km) and lacks parcel-level soil testing."
        else:
            level = "Low"
            explanation = "Low confidence: Multiple local agronomic parameters require on-farm expert verification before committing capital."

        return {
            "level": level,
            "explanation": explanation,
            "score": confidence_score,
            "information_gaps": information_gaps
        }
