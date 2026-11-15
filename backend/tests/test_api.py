import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["featured_region"] == "Bihar, India"
    assert "support_not_replace_notice" in data
    assert len(data["data_sources"]) >= 4

def test_regions_endpoint():
    response = client.get("/api/regions")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "bihar"
    assert len(data["agro_climatic_zones"]) == 4
    assert len(data["districts"]) >= 10

def test_crops_endpoint():
    response = client.get("/api/crops")
    assert response.status_code == 200
    crops = response.json()
    assert len(crops) >= 12
    # Verify each crop has botanical name, water demand, and source citations
    for crop in crops:
        assert "name" in crop
        assert "family" in crop
        assert "water_demand" in crop
        assert "source_notes" in crop

def test_rotations_endpoint():
    response = client.get("/api/rotations/presets")
    assert response.status_code == 200
    rotations = response.json()
    assert len(rotations) >= 5
    baseline_found = any(r.get("is_preset_baseline") for r in rotations)
    assert baseline_found

def test_glossary_endpoint():
    response = client.get("/api/glossary")
    assert response.status_code == 200
    terms = response.json()
    assert len(terms) >= 5
    satellite_term = any("Satellite vs. Ground" in t["term"] for t in terms)
    assert satellite_term

def test_conditions_endpoint():
    # Patna coordinates
    response = client.get("/api/conditions?lat=25.5941&lon=85.1376&start=20230101&end=20230110")
    assert response.status_code == 200
    data = response.json()
    assert "provenance" in data
    assert "summary" in data
    assert "daily" in data
    assert len(data["daily"]) == 10
    assert data["provenance"]["source_name"] == "NASA POWER Agroclimatology"
