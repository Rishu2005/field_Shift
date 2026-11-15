import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.engine import (
    ComparisonEngine,
    StrategyCandidateGenerator,
    RotationScoringEngine,
    StrategyConfidenceEvaluator,
    StrategyExplainer
)

client = TestClient(app)

def test_candidate_generation():
    generator = StrategyCandidateGenerator()
    candidates = generator.generate_strategies(
        existing_rotation_id="rice-wheat",
        priorities={"conserve_water": 0.8, "income": 0.6},
        constraints={"irrigation": "limited", "equipment": "small_tractor", "flood_prone": False},
        zone="Zone IIIB"
    )
    # Spec 2.1 item 5: Compare at least 3 strategies, one of which is existing
    assert len(candidates) >= 3
    assert candidates[0]["is_baseline"] is True
    assert "Rice – Wheat" in candidates[0]["name"]
    # Check alternatives generated
    alt_ids = [c["id"] for c in candidates if not c.get("is_baseline")]
    assert len(alt_ids) >= 2

def test_scoring_engine_8_criteria():
    engine = RotationScoringEngine()
    dummy_strategy = {
        "id": "test_strat",
        "name": "Rice - Wheat - Moong",
        "sequence": [
            {"season": "kharif", "crop_id": "rice"},
            {"season": "rabi", "crop_id": "wheat"},
            {"season": "zaid", "crop_id": "mungbean"}
        ]
    }
    dummy_indicators = {
        "bare_field_periods": [{"consecutive_weeks": 11}],
        "stress_windows": [{"id": "terminal_heat"}],
        "summary": {"total_rainfall_mm": 850.0, "heat_stress_days": 15}
    }
    scores = engine.score_strategy(
        strategy=dummy_strategy,
        priorities={"conserve_water": 0.7, "organic_matter": 0.8, "income": 0.6},
        constraints={"irrigation": "limited", "equipment": "small_tractor", "flood_prone": False},
        indicators=dummy_indicators
    )

    assert "composite_score" in scores
    assert 0.0 <= scores["composite_score"] <= 100.0
    crit = scores["criteria_scores"]
    assert len(crit) == 8
    for c_key in [
        "water_efficiency", "drought_heat_resilience", "flood_resilience",
        "soil_health", "erosion_reduction", "pest_disruption", "income_market", "feasibility"
    ]:
        assert c_key in crit
        assert 0.0 <= crit[c_key] <= 100.0

def test_compare_api_endpoint():
    payload = {
        "location": {"lat": 25.5941, "lon": 85.1376},
        "existing_rotation": "rice-wheat",
        "priorities": {
            "conserve_water": 0.8,
            "income": 0.7,
            "nitrogen_fixation": 0.9,
            "organic_matter": 0.8
        },
        "constraints": {
            "irrigation": "limited",
            "equipment": "small_tractor",
            "flood_prone": False
        },
        "scenario": {
            "rainfall_change_pct": -10.0,
            "temp_change_c": 1.5
        },
        "zone": "Zone IIIB"
    }

    response = client.post("/api/compare", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "strategies" in data
    assert len(data["strategies"]) >= 3

    # Check strategy card sections (Spec Section 7.5)
    for card in data["strategies"]:
        assert "why_suggested" in card
        assert "evidence" in card
        assert "benefits" in card
        assert "information_gaps" in card
        assert "risks_needing_local_review" in card
        assert "confidence" in card
        assert "criteria_scores" in card

    # Check side-by-side comparison matrix
    assert "comparison_matrix" in data
    assert len(data["comparison_matrix"]) == 8

def test_scenario_sliders_shift_scores():
    base_payload = {
        "location": {"lat": 25.5941, "lon": 85.1376},
        "existing_rotation": "rice-wheat",
        "priorities": {"conserve_water": 0.8, "income": 0.6},
        "constraints": {"irrigation": "limited"},
        "scenario": {"rainfall_change_pct": 0.0, "temp_change_c": 0.0}
    }
    hot_payload = {
        "location": {"lat": 25.5941, "lon": 85.1376},
        "existing_rotation": "rice-wheat",
        "priorities": {"conserve_water": 0.8, "income": 0.6},
        "constraints": {"irrigation": "limited"},
        "scenario": {"rainfall_change_pct": -25.0, "temp_change_c": 2.5}
    }

    res_base = client.post("/api/compare", json=base_payload).json()
    res_hot = client.post("/api/compare", json=hot_payload).json()

    # Scores should react to climate shifts
    baseline_strat_base = next(s for s in res_base["strategies"] if s.get("is_baseline"))
    baseline_strat_hot = next(s for s in res_hot["strategies"] if s.get("is_baseline"))

    assert baseline_strat_hot["composite_score"] < baseline_strat_base["composite_score"]

def test_bihar_regional_walkthrough_differentiation():
    """Step 12 acceptance test: South Bihar drought vs North Bihar flood-prone."""
    # 1. South Bihar (Gaya): Drought-prone, water conservation priority
    res_south = client.post("/api/compare", json={
        "location": {"lat": 24.7955, "lon": 85.0002},
        "zone": "Zone IIIB",
        "existing_rotation": "rice-wheat",
        "priorities": {"water_conservation": 1.0, "nitrogen_fixation": 0.8},
        "constraints": {"irrigation": "limited", "flood_prone": False}
    }).json()
    assert res_south["total_strategies"] >= 3
    top_south = res_south["strategies"][0]
    assert "Dhaincha" in top_south["name"] or "Water-Smart" in top_south["name"] or "Moong" in top_south["name"]

    # 2. North Bihar (Darbhanga): Flood-prone lowland wetland
    res_north = client.post("/api/compare", json={
        "location": {"lat": 26.1542, "lon": 85.8918},
        "zone": "Zone I",
        "existing_rotation": "rice-wheat",
        "priorities": {"income": 0.9, "erosion_reduction": 0.8},
        "constraints": {"irrigation": "reliable", "flood_prone": True}
    }).json()
    assert res_north["total_strategies"] >= 3
    strat_names = [s["name"] for s in res_north["strategies"]]
    assert any("Makhana" in n for n in strat_names)
