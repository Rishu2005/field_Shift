import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.providers.ndvi import NdviProvider

client = TestClient(app)

def test_ndvi_provider_direct():
    import asyncio
    provider = NdviProvider()
    data = asyncio.run(provider.fetch_point_data(25.5941, 85.1376, "20230101", "20231231"))
    assert "weekly_ndvi" in data
    assert len(data["weekly_ndvi"]) == 52

    # Check bare field detection in Zaid
    detection = data["bare_field_detection"]
    assert detection["is_detected"] is True
    assert detection["total_bare_weeks"] >= 6
    assert any(14 <= w <= 23 for w in detection["bare_weeks"])

    # Check statistics
    stats = data["statistics"]
    assert stats["max_ndvi"] >= 0.70
    assert stats["min_ndvi"] <= 0.20

    # Provenance
    prov = data["provenance"]
    assert "Sentinel-2" in prov["source_name"]
    assert "10–30 m" in prov["resolution"]

def test_ndvi_api_endpoint():
    response = client.get("/api/ndvi?lat=25.5941&lon=85.1376&year=2023")
    assert response.status_code == 200
    data = response.json()
    assert "weekly_ndvi" in data
    assert "bare_field_detection" in data
    assert data["bare_field_detection"]["is_detected"] is True

def test_conditions_includes_ndvi():
    response = client.get("/api/conditions?lat=25.5941&lon=85.1376")
    assert response.status_code == 200
    data = response.json()
    assert "ndvi" in data
    assert "weekly_ndvi" in data["ndvi"]
    assert "bare_field_detection" in data["ndvi"]
    # Check that indicators reflect the NDVI bare field detection
    indicators = data["indicators"]
    assert len(indicators["bare_field_periods"]) >= 1
    assert indicators["bare_field_periods"][0]["consecutive_weeks"] >= 8
