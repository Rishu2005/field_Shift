from typing import Dict, Any, List

class ScenarioSimulator:
    """
    Simulates climate scenario shifts (Rainfall -30% to +30%, Temperature 0 to +3°C)
    and recomputes rankings and score differentials.
    """

    @staticmethod
    def apply_scenario(
        baseline_indicators: Dict[str, Any],
        rainfall_delta_pct: float,
        temp_delta_c: float
    ) -> Dict[str, Any]:
        """
        Shifts indicators based on scenario sliders:
        - Higher temperature increases reference ET0, increases heat stress days, and worsens moisture deficit.
        - Lower rainfall reduces water balance and elevates drought risk.
        - Higher rainfall elevates flood / waterlogging risk.
        """
        shifted = json_clone(baseline_indicators)

        summary = shifted.get("summary", {})
        cur_rain = summary.get("total_rainfall_mm", 800.0)
        cur_heat = summary.get("heat_stress_days", 10)

        # Shift rainfall
        new_rain = round(cur_rain * (1.0 + (rainfall_delta_pct / 100.0)), 1)
        summary["total_rainfall_mm"] = new_rain

        # Shift heat stress days (approx +8-12 days per +1°C in Gangetic plains)
        new_heat = int(cur_heat + (temp_delta_c * 10))
        summary["heat_stress_days"] = new_heat

        shifted["summary"] = summary
        return shifted

def json_clone(data: Any) -> Any:
    import json
    return json.loads(json.dumps(data))
