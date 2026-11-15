import json
import logging
import os
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.app.providers.power import NasaPowerProvider
from backend.app.providers.ndvi import NdviProvider
from backend.app.providers.smap import SmapProvider
from backend.app.providers.imerg import ImergProvider
from backend.app.providers.soilgrids import SoilGridsProvider, TerrainProvider, EcostressProvider
from backend.app.pipeline.harmonize import harmonize_to_weekly
from backend.app.pipeline.indicators import compute_derived_indicators
from backend.app.engine import ComparisonEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("field_shift")

app = FastAPI(
    title="Field Shift API",
    description="NASA Space Apps Challenge 2026: Crop Rotation Decision-Support Tool",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

KNOWLEDGE_DIR = Path(__file__).resolve().parent / "knowledge"
CACHE_DIR = Path(__file__).resolve().parent / "cache"

power_provider = NasaPowerProvider()
ndvi_provider = NdviProvider()
smap_provider = SmapProvider()
imerg_provider = ImergProvider()
soilgrids_provider = SoilGridsProvider()
terrain_provider = TerrainProvider()
ecostress_provider = EcostressProvider()
comparison_engine = ComparisonEngine()

class CompareRequest(BaseModel):
    location: Optional[Dict[str, float]] = {"lat": 25.5941, "lon": 85.1376}
    existing_rotation: Optional[str] = "rice-wheat"
    priorities: Optional[Dict[str, float]] = {
        "water_conservation": 0.8,
        "income": 0.7,
        "nitrogen_fixation": 0.8,
        "erosion_reduction": 0.6,
        "organic_matter": 0.7,
        "forage_value": 0.3,
        "low_labour": 0.4
    }
    constraints: Optional[Dict[str, Any]] = {
        "irrigation": "limited",
        "equipment": "small_tractor",
        "land_size_ha": 1.0,
        "flood_prone": False
    }
    scenario: Optional[Dict[str, float]] = {
        "rainfall_change_pct": 0.0,
        "temp_change_c": 0.0
    }
    zone: Optional[str] = "Zone IIIB"

def load_json(filename: str):
    path = KNOWLEDGE_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=500, detail=f"Knowledge file {filename} not found.")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

@app.get("/api/health")
async def health_check():
    """Health check endpoint and data sources registry."""
    cache_ready = (CACHE_DIR / "bihar_power_default.json").exists()

    data_sources = [
        {
            "name": "NASA POWER Agroclimatology",
            "resolution": "0.5° × 0.5° (~50 km)",
            "coverage": "Global, 1981-present",
            "status": "connected",
            "is_cached": cache_ready,
            "is_fallback": False,
            "role": "Air temperature, precipitation, solar radiation, humidity, frost & heat risk"
        },
        {
            "name": "NASA SMAP",
            "resolution": "9-36 km",
            "coverage": "Global",
            "status": "connected",
            "is_cached": True,
            "is_fallback": False,
            "role": "Surface & root-zone soil moisture anomalies & drought onset"
        },
        {
            "name": "GPM IMERG",
            "resolution": "0.1° (~10 km)",
            "coverage": "Global",
            "status": "connected",
            "is_cached": True,
            "is_fallback": False,
            "role": "Precipitation calibration and extreme storm events"
        },
        {
            "name": "Landsat / Sentinel-2",
            "resolution": "10-30 m",
            "coverage": "Global",
            "status": "connected",
            "is_cached": True,
            "is_fallback": False,
            "role": "Vegetation index (NDVI/EVI), bare-field and crop-stress detection"
        },
        {
            "name": "SRTM / NASADEM",
            "resolution": "30 m",
            "coverage": "Global",
            "status": "connected",
            "is_cached": True,
            "is_fallback": False,
            "role": "Elevation, slope, and simple runoff risk proxy"
        },
        {
            "name": "ISRIC SoilGrids",
            "resolution": "250 m",
            "coverage": "Global",
            "status": "connected",
            "is_cached": True,
            "is_fallback": False,
            "role": "Soil texture (clay/silt/sand), pH, bulk density, and organic carbon"
        },
        {
            "name": "ECOSTRESS / MODIS",
            "resolution": "70–500 m",
            "coverage": "Global",
            "status": "connected",
            "is_cached": True,
            "is_fallback": False,
            "role": "Land surface temperature, evaporative stress index (ESI), canopy cooling"
        }
    ]

    return {
        "status": "healthy",
        "service": "Field Shift Decision Support Backend",
        "version": "1.0.0",
        "featured_region": "Bihar, India",
        "bihar_offline_cache_ready": cache_ready,
        "support_not_replace_notice": "This tool highlights patterns and possibilities. It does not replace farmer judgment or local agricultural expertise.",
        "data_sources": data_sources
    }

@app.get("/api/regions")
async def get_regions():
    """Returns featured regions, agro-climatic zones, and Bihar districts."""
    return load_json("regions.json")

@app.get("/api/crops")
async def get_crops():
    """Returns crop library with agronomic characteristics and citations."""
    return load_json("crops.json")

@app.get("/api/rotations/presets")
async def get_rotations(region: Optional[str] = "bihar"):
    """Returns common rotations and alternative strategies."""
    return load_json("rotations.json")

@app.get("/api/seasons")
async def get_seasons():
    """Returns season characteristics and satellite signatures."""
    return load_json("seasons.json")

@app.get("/api/glossary")
async def get_glossary():
    """Returns educational glossary and satellite vs ground explanations."""
    return load_json("glossary.json")

@app.get("/api/conditions")
async def get_conditions(
    lat: float = Query(25.5941, description="Latitude of selected point"),
    lon: float = Query(85.1376, description="Longitude of selected point"),
    start: Optional[str] = Query("20230101", description="Start date YYYYMMDD"),
    end: Optional[str] = Query("20231231", description="End date YYYYMMDD")
):
    """
    Returns multi-source Earth Observation conditions for a point:
    - NASA POWER (Temperature, Radiation, Humidity, Water Balance)
    - Sentinel-2 & Landsat (NDVI time series & bare-soil detection)
    - NASA SMAP (Surface & root-zone soil moisture & anomalies)
    - GPM IMERG (10 km calibrated rainfall & extreme storm events)
    - ISRIC SoilGrids (Clay/Silt/Sand texture, pH, SOC)
    - SRTM 30m (Elevation, slope, runoff proxy)
    - ECOSTRESS (Land surface temperature & canopy microclimate)
    """
    try:
        power_data = await power_provider.fetch_point_data(lat, lon, start, end)
        ndvi_data = await ndvi_provider.fetch_point_data(lat, lon, start, end)
        smap_data = await smap_provider.fetch_point_data(lat, lon, start, end)
        imerg_data = await imerg_provider.fetch_point_data(lat, lon, start, end)
        soil_data = await soilgrids_provider.fetch_point_data(lat, lon, start, end)
        terrain_data = await terrain_provider.fetch_point_data(lat, lon, start, end)
        ecostress_data = await ecostress_provider.fetch_point_data(lat, lon, start, end)

        daily = power_data.get("daily", [])
        weekly = harmonize_to_weekly(daily, lat)
        indicators = compute_derived_indicators(weekly, lat, lon, ndvi_data.get("weekly_ndvi"))

        power_data["weekly"] = weekly
        power_data["indicators"] = indicators
        power_data["ndvi"] = ndvi_data
        power_data["smap"] = smap_data
        power_data["imerg"] = imerg_data
        power_data["soil"] = soil_data
        power_data["terrain"] = terrain_data
        power_data["ecostress"] = ecostress_data
        return power_data
    except Exception as e:
        logger.error(f"Error fetching conditions for ({lat}, {lon}): {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/conditions/district/{district_id}")
async def get_district_conditions(district_id: str):
    """Returns multi-source Earth observations and indicators for a specific Bihar district."""
    regions = load_json("regions.json")
    matching = [d for d in regions.get("districts", []) if d["id"].lower() == district_id.lower()]
    if not matching:
        raise HTTPException(status_code=404, detail=f"District '{district_id}' not found in Bihar.")

    district = matching[0]
    lat = district["lat"]
    lon = district["lon"]

    power_data = await power_provider.fetch_point_data(lat, lon, "20230101", "20231231")
    ndvi_data = await ndvi_provider.fetch_point_data(lat, lon, "20230101", "20231231")
    smap_data = await smap_provider.fetch_point_data(lat, lon, "20230101", "20231231")
    imerg_data = await imerg_provider.fetch_point_data(lat, lon, "20230101", "20231231")
    soil_data = await soilgrids_provider.fetch_point_data(lat, lon, "20230101", "20231231")
    terrain_data = await terrain_provider.fetch_point_data(lat, lon, "20230101", "20231231")
    ecostress_data = await ecostress_provider.fetch_point_data(lat, lon, "20230101", "20231231")

    daily = power_data.get("daily", [])
    weekly = harmonize_to_weekly(daily, lat)
    indicators = compute_derived_indicators(weekly, lat, lon, ndvi_data.get("weekly_ndvi"))

    power_data["weekly"] = weekly
    power_data["indicators"] = indicators
    power_data["ndvi"] = ndvi_data
    power_data["smap"] = smap_data
    power_data["imerg"] = imerg_data
    power_data["soil"] = soil_data
    power_data["terrain"] = terrain_data
    power_data["ecostress"] = ecostress_data
    power_data["district_metadata"] = district
    return power_data

@app.get("/api/ndvi")
async def get_ndvi(
    lat: float = Query(25.5941, description="Latitude"),
    lon: float = Query(85.1376, description="Longitude"),
    year: Optional[str] = Query("2023", description="Year YYYY")
):
    """Returns 52-week harmonized Sentinel-2 & Landsat NDVI profile with bare-field detection."""
    return await ndvi_provider.fetch_point_data(lat, lon, f"{year}0101", f"{year}1231")

@app.get("/api/smap")
async def get_smap(
    lat: float = Query(25.5941, description="Latitude"),
    lon: float = Query(85.1376, description="Longitude")
):
    """Returns NASA SMAP surface and root-zone soil moisture with standardized anomaly indicators."""
    return await smap_provider.fetch_point_data(lat, lon)

@app.get("/api/imerg")
async def get_imerg(
    lat: float = Query(25.5941, description="Latitude"),
    lon: float = Query(85.1376, description="Longitude")
):
    """Returns GPM IMERG 10 km calibrated precipitation and storm statistics."""
    return await imerg_provider.fetch_point_data(lat, lon)

@app.get("/api/indicators")
async def get_indicators(
    lat: float = Query(25.5941, description="Latitude"),
    lon: float = Query(85.1376, description="Longitude"),
    start: Optional[str] = Query("20230101", description="Start date YYYYMMDD"),
    end: Optional[str] = Query("20231231", description="End date YYYYMMDD")
):
    """
    Derived indicators: bare-field periods, stress windows, water balance proxy,
    and erosion risk proxy calculated from NASA POWER and satellite NDVI data.
    """
    conditions = await power_provider.fetch_point_data(lat, lon, start, end)
    ndvi_data = await ndvi_provider.fetch_point_data(lat, lon, start, end)
    daily = conditions.get("daily", [])
    weekly = harmonize_to_weekly(daily, lat)
    indicators = compute_derived_indicators(weekly, lat, lon, ndvi_data.get("weekly_ndvi"))
    indicators["provenance"] = conditions.get("provenance")
    indicators["ndvi_provenance"] = ndvi_data.get("provenance")
    indicators["ndvi_detection"] = ndvi_data.get("bare_field_detection")
    indicators["summary"] = conditions.get("summary")
    return indicators

@app.post("/api/compare")
async def compare_rotations(req: CompareRequest):
    """
    Compares candidate crop rotation strategies against farmer existing rotation.
    Evaluates 8 explainable criteria, confidence, information gaps, and local review risks.
    Dynamic scenario sliders shift environmental inputs and recompute rankings.
    """
    loc = req.location or {"lat": 25.5941, "lon": 85.1376}
    lat = loc.get("lat", 25.5941)
    lon = loc.get("lon", 85.1376)

    # Fetch agroclimatic conditions and satellite NDVI
    conditions = await power_provider.fetch_point_data(lat, lon, "20230101", "20231231")
    ndvi_data = await ndvi_provider.fetch_point_data(lat, lon, "20230101", "20231231")
    daily = conditions.get("daily", [])
    weekly = harmonize_to_weekly(daily, lat)
    indicators = compute_derived_indicators(weekly, lat, lon, ndvi_data.get("weekly_ndvi"))
    indicators["summary"] = conditions.get("summary")

    # Run multi-strategy comparison engine
    result = comparison_engine.compare(
        location={"lat": lat, "lon": lon},
        existing_rotation_id=req.existing_rotation or "rice-wheat",
        priorities=req.priorities or {},
        constraints=req.constraints or {},
        indicators=indicators,
        scenario_deltas=req.scenario or {},
        zone=req.zone or "Zone IIIB"
    )

    result["provenance"] = [
        conditions.get("provenance"),
        ndvi_data.get("provenance")
    ]
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
