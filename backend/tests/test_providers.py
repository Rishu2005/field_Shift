import asyncio
from backend.app.providers.smap import SmapProvider
from backend.app.providers.imerg import ImergProvider
from backend.app.providers.soilgrids import SoilGridsProvider, TerrainProvider, EcostressProvider

def test_smap_provider():
    provider = SmapProvider()
    data = asyncio.run(provider.fetch_point_data(25.5941, 85.1376))
    assert "weekly_smap" in data
    assert len(data["weekly_smap"]) == 52
    assert "statistics" in data
    assert data["provenance"]["source_name"] == "NASA SMAP Surface & Root-Zone Soil Moisture"
    assert "9–36 km" in data["provenance"]["resolution"]

def test_imerg_provider():
    provider = ImergProvider()
    data = asyncio.run(provider.fetch_point_data(25.5941, 85.1376))
    assert "weekly_imerg" in data
    assert len(data["weekly_imerg"]) == 52
    assert "statistics" in data
    assert data["statistics"]["annual_precipitation_mm"] > 500.0
    assert "monsoon_dynamics" in data

def test_soilgrids_provider():
    provider = SoilGridsProvider()
    data = asyncio.run(provider.fetch_point_data(25.5941, 85.1376))
    assert "properties" in data
    props = data["properties"]
    assert props["clay_fraction_pct"] + props["silt_fraction_pct"] + props["sand_fraction_pct"] == 100.0
    assert "ph_h2o" in props
    assert props["soil_organic_matter_pct"] > 0

def test_terrain_provider():
    provider = TerrainProvider()
    data = asyncio.run(provider.fetch_point_data(25.5941, 85.1376))
    assert "terrain" in data
    t = data["terrain"]
    assert 30.0 <= t["elevation_m_asl"] <= 100.0
    assert t["slope_pct"] >= 0.0
