import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.pipeline.harmonize import calculate_hargreaves_et0, harmonize_to_weekly
from backend.app.pipeline.indicators import compute_derived_indicators

client = TestClient(app)

def test_hargreaves_et0_calculation():
    # Cold winter day
    et_winter = calculate_hargreaves_et0(tmin=8.0, tmax=22.0, tmean=15.0, ra_mj=14.0)
    assert 1.0 <= et_winter <= 4.0

    # Hot dry summer day in Zaid
    et_summer = calculate_hargreaves_et0(tmin=26.0, tmax=42.0, tmean=34.0, ra_mj=24.0)
    assert et_summer > et_winter
    assert et_summer >= 4.0

def test_harmonization_and_indicators():
    # Mock a sample daily record
    sample_daily = []
    import datetime
    cur = datetime.date(2023, 1, 1)
    end = datetime.date(2023, 12, 31)

    while cur <= end:
        iso = cur.isoformat()
        m = cur.month
        tmax = 38.0 if m in [4, 5] else (34.0 if m == 3 else 25.0)
        tmin = 25.0 if m in [6, 7] else (4.0 if m == 1 else 16.0)
        p = 25.0 if m in [7, 8] else 0.0
        sample_daily.append({
            "date": iso,
            "t2m": (tmax + tmin) / 2.0,
            "t2m_max": tmax,
            "t2m_min": tmin,
            "precipitation_mm": p,
            "solar_radiation_mj": 18.0,
            "rh_pct": 60.0,
            "heat_stress": tmax >= 35.0,
            "frost_risk": tmin <= 4.0
        })
        cur += datetime.timedelta(days=1)

    weekly = harmonize_to_weekly(sample_daily, lat=25.5941)
    assert len(weekly) >= 52
    assert all("water_balance_mm" in w for w in weekly)
    assert all("season" in w for w in weekly)

    indicators = compute_derived_indicators(weekly, lat=25.5941, lon=85.1376)
    assert "bare_field_periods" in indicators
    assert len(indicators["bare_field_periods"]) >= 1
    assert "stress_windows" in indicators
    assert any(s["id"] == "terminal_heat" for s in indicators["stress_windows"])
    assert "erosion_risk_proxy" in indicators

def test_indicators_api_endpoint():
    response = client.get("/api/indicators?lat=25.5941&lon=85.1376")
    assert response.status_code == 200
    data = response.json()
    assert "bare_field_periods" in data
    assert "stress_windows" in data
    assert "erosion_risk_proxy" in data
    assert "plain_language_summary" in data

def test_conditions_with_weekly_and_indicators():
    response = client.get("/api/conditions?lat=25.5941&lon=85.1376&start=20230101&end=20231231")
    assert response.status_code == 200
    data = response.json()
    assert "weekly" in data
    assert len(data["weekly"]) >= 52
    assert "indicators" in data
    assert "bare_field_periods" in data["indicators"]
