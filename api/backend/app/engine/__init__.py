from typing import Dict, Any, List, Optional
import json
from pathlib import Path

from .candidates import StrategyCandidateGenerator
from .scoring import RotationScoringEngine
from .confidence import StrategyConfidenceEvaluator
from .explain import StrategyExplainer
from .scenarios import ScenarioSimulator

KNOWLEDGE_DIR = Path(__file__).resolve().parent.parent / "knowledge"

def load_crops() -> Dict[str, Any]:
    with open(KNOWLEDGE_DIR / "crops.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        return {c["id"]: c for c in data}

class ComparisonEngine:
    """
    Core rotation comparison engine orchestrating:
    - Candidate generation (existing rotation + alternatives)
    - 8-criterion rule-based scoring with farmer weightings
    - Confidence & Information gaps
    - Explainable Strategy Cards
    - Scenario recalculations
    """

    def __init__(self):
        self.crop_library = load_crops()
        self.candidates_gen = StrategyCandidateGenerator()
        self.scorer = RotationScoringEngine()
        self.confidence_eval = StrategyConfidenceEvaluator()
        self.explainer = StrategyExplainer()

    def compare(
        self,
        location: Dict[str, float],
        existing_rotation_id: str,
        priorities: Dict[str, float],
        constraints: Dict[str, Any],
        indicators: Dict[str, Any],
        scenario_deltas: Optional[Dict[str, float]] = None,
        zone: Optional[str] = "Zone IIIB"
    ) -> Dict[str, Any]:
        deltas = scenario_deltas or {"rainfall_change_pct": 0.0, "temp_change_c": 0.0}

        # 1. Generate candidate strategies (always at least 3)
        candidates = self.candidates_gen.generate_strategies(
            existing_rotation_id=existing_rotation_id,
            priorities=priorities,
            constraints=constraints,
            indicators=indicators,
            zone=zone
        )

        strategy_cards = []

        for candidate in candidates:
            # 2. Score candidate strategy against 8 criteria
            scores = self.scorer.score_strategy(
                strategy=candidate,
                priorities=priorities,
                constraints=constraints,
                indicators=indicators,
                scenario_deltas=deltas
            )

            # 3. Evaluate confidence & gaps
            conf = self.confidence_eval.evaluate(
                strategy=candidate,
                indicators=indicators,
                crop_library=self.crop_library
            )

            # 4. Generate explainable strategy card
            card = self.explainer.generate_card(
                strategy=candidate,
                scores=scores,
                confidence_info=conf,
                priorities=priorities,
                indicators=indicators,
                crop_library=self.crop_library
            )
            strategy_cards.append(card)

        # Sort strategies by composite score descending (best first)
        strategy_cards.sort(key=lambda x: x["composite_score"], reverse=True)

        # Side-by-side comparison matrix for radar chart / comparison table
        criteria_keys = [
            ("water_efficiency", "Water Efficiency"),
            ("drought_heat_resilience", "Drought & Heat Resilience"),
            ("flood_resilience", "Flood Resilience"),
            ("soil_health", "Soil Health"),
            ("erosion_reduction", "Erosion Reduction"),
            ("pest_disruption", "Pest Cycle Break"),
            ("income_market", "Income & Market"),
            ("feasibility", "Feasibility")
        ]

        matrix = []
        for key, label in criteria_keys:
            row = {"criterion": key, "label": label}
            for s in strategy_cards:
                row[s["id"]] = s["criteria_scores"].get(key, 0.0)
            matrix.append(row)

        baseline_card = next((s for s in strategy_cards if s.get("is_baseline")), strategy_cards[0])
        top_card = strategy_cards[0]

        return {
            "location": location,
            "scenario_applied": deltas,
            "total_strategies": len(strategy_cards),
            "strategies": strategy_cards,
            "comparison_matrix": matrix,
            "summary_insights": {
                "top_recommendation": top_card["name"],
                "score_improvement_over_baseline": round(top_card["composite_score"] - baseline_card["composite_score"], 1),
                "baseline_score": baseline_card["composite_score"],
                "top_score": top_card["composite_score"]
            }
        }

__all__ = ["ComparisonEngine", "StrategyCandidateGenerator", "RotationScoringEngine", "StrategyConfidenceEvaluator", "StrategyExplainer", "ScenarioSimulator"]
