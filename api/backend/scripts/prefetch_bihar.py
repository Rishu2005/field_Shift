import asyncio
import json
import logging
from pathlib import Path
import sys

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.app.providers.power import NasaPowerProvider
from backend.app.providers.ndvi import NdviProvider
from backend.app.providers.smap import SmapProvider
from backend.app.providers.imerg import ImergProvider
from backend.app.providers.soilgrids import SoilGridsProvider, TerrainProvider
from backend.app.pipeline.harmonize import harmonize_to_weekly
from backend.app.pipeline.indicators import compute_derived_indicators

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("prefetch_bihar")

async def prefetch_all_bihar_districts():
    base_dir = Path(__file__).resolve().parent.parent
    knowledge_dir = base_dir / "app" / "knowledge"
    cache_dir = base_dir / "app" / "cache"
    cache_dir.mkdir(parents=True, exist_ok=True)

    with open(knowledge_dir / "regions.json", "r", encoding="utf-8") as f:
        region_data = json.load(f)

    districts = region_data.get("districts", [])
    logger.info(f"Starting batch prefetch for {len(districts)} Bihar districts...")

    power_provider = NasaPowerProvider()
    ndvi_provider = NdviProvider()
    smap_provider = SmapProvider()
    imerg_provider = ImergProvider()
    soilgrids_provider = SoilGridsProvider()
    terrain_provider = TerrainProvider()

    all_cached_districts = {}

    for idx, d in enumerate(districts, 1):
        name = d["name"]
        lat = d["lat"]
        lon = d["lon"]
        d_id = d["id"]
        logger.info(f"[{idx}/{len(districts)}] Processing {name} ({lat}, {lon}) - {d['zone']}...")

        # 1. Fetch & cache POWER
        power_data = await power_provider.fetch_point_data(lat, lon, "20230101", "20231231")

        # 2. Fetch & cache NDVI
        ndvi_data = await ndvi_provider.fetch_point_data(lat, lon, "20230101", "20231231")

        # 3. Fetch & cache SMAP
        smap_data = await smap_provider.fetch_point_data(lat, lon)

        # 4. Fetch & cache IMERG
        imerg_data = await imerg_provider.fetch_point_data(lat, lon)

        # 5. Fetch & cache SoilGrids & Terrain
        soil_data = await soilgrids_provider.fetch_point_data(lat, lon)
        terrain_data = await terrain_provider.fetch_point_data(lat, lon)

        # 6. Harmonize and compute indicators
        daily = power_data.get("daily", [])
        weekly = harmonize_to_weekly(daily, lat)
        indicators = compute_derived_indicators(weekly, lat, lon, ndvi_data.get("weekly_ndvi"))

        all_cached_districts[d_id] = {
            "metadata": d,
            "summary": power_data.get("summary"),
            "weekly_count": len(weekly),
            "bare_weeks": indicators.get("bare_field_periods", [{}])[0].get("consecutive_weeks", 11),
            "heat_stress_days": power_data.get("summary", {}).get("heat_stress_days", 0),
            "annual_rain_mm": power_data.get("summary", {}).get("total_rainfall_mm", 0),
            "soil_texture": soil_data.get("properties", {}).get("texture_class"),
            "elevation_m": terrain_data.get("terrain", {}).get("elevation_m_asl")
        }

    # Save consolidated index
    index_file = cache_dir / "bihar_districts_index.json"
    with open(index_file, "w", encoding="utf-8") as f:
        json.dump(all_cached_districts, f, indent=2)

    logger.info(f"Batch prefetch complete! All {len(districts)} districts cached in {cache_dir}.")

if __name__ == "__main__":
    asyncio.run(prefetch_all_bihar_districts())
