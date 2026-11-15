# Field Shift: Crop Rotation Decision-Support Tool

NASA Space Apps Challenge 2026 — "Field Shift: Adapting Farms with NASA Data"

This document is the build spec for a coding agent. Build exactly what is described here. Where a choice is marked **(DEFAULT)**, it was chosen by the spec author and may be changed, but flag the change.

---

## 1. Goal

Build a web app that helps farmers explore crop-rotation strategies that could improve soil health and adapt to changing weather and water conditions. The tool combines NASA Earth observations with soil data, crop characteristics, and farmer priorities.

The tool **supports, and does not replace,** farmer judgment and local agricultural expertise. This must be visible in the UI (see section 9).

### Scope decision
- The tool works for **any location on Earth** using global datasets.
- **Bihar, India is the featured region**: the map opens on Bihar by default, and Bihar has preloaded data, a Bihar crop and season knowledge base, and a demo flow.
- Region-specific data sources plug in through optional adapters (section 5). When a region has no local adapter, fall back to global layers and tell the user.

### Challenge requirements this spec must satisfy
1. Use NASA Earth observation data together with local soil information, crop characteristics, and farmer priorities.
2. **Compare at least three rotation strategies, one of which is the farmer's existing rotation.**
3. For each strategy, show: why it was suggested, what evidence supports it, what benefits it may offer, where information gaps exist, and risks that need local review.
4. Highlight bare-field periods and seasons when current crops look more vulnerable.
5. Be understandable to farmers with limited technical or geospatial experience.
6. Let farmers enter their own priorities and constraints.
7. State clearly that the tool supports but does not replace local expertise.

### Target users
- **Primary:** smallholder farmers in Bihar (low to medium digital literacy, mobile-first, possibly low bandwidth).
- **Secondary:** extension workers, agronomists, and the hackathon judges.

---

## 2. Features

### 2.1 MVP (must ship)
1. **Location selection:** click a point on the map, search a place, or pick a Bihar district from a dropdown. Optional: draw a plot polygon.
2. **Conditions dashboard** for the selected location (time series plus plain-language summary):
   - Rainfall (GPM IMERG)
   - Temperature, solar radiation, humidity, frost risk (NASA POWER)
   - Surface soil moisture and anomalies (SMAP)
   - Vegetation index, NDVI/EVI (Landsat, MODIS/VIIRS, Sentinel-2)
   - Land-surface temperature and evapotranspiration (ECOSTRESS, or MODIS ET as fallback)
   - Terrain: elevation, slope, simple runoff and erosion proxy (SRTM/NASADEM)
3. **Vulnerability and bare-field detection:**
   - Detect bare-field periods from the NDVI time series (NDVI below threshold for N consecutive weeks).
   - Detect high-stress periods (soil-moisture anomaly, heat, NDVI drop vs. climatology).
   - Show both on a seasonal timeline with the kharif/rabi/zaid bands.
4. **Farmer input form:**
   - Current rotation (dropdown of Bihar rotations plus custom).
   - Priorities, ranked or weighted with sliders: conserve water, supplemental income, nitrogen fixation, erosion reduction, organic matter, forage value, market suitability, low labour/equipment needs.
   - Constraints: irrigation availability (none / limited / reliable), equipment (manual / small tractor / full), land size, flood-prone (yes/no/unknown), market access.
5. **Rotation comparison engine:** compare **at least 3 strategies**: the existing rotation plus 2 or more generated alternatives. Show a side-by-side comparison with the "strategy card" format in section 7.
6. **Scenario sliders:** rainfall change (-30% to +30%) and temperature change (0 to +3 °C). The comparison updates when sliders move.
7. **Explainability:** every score has an expandable "Why this score?" showing the inputs and evidence.
8. **Uncertainty and information gaps:** every strategy shows a confidence level and a list of what is unknown.
9. **Glossary / "What does this mean?"** tooltips: evapotranspiration, soil moisture anomaly, NDVI, frost risk, water balance, satellite vs. ground data.
10. **Support-not-replace disclaimers** in context (section 9).

### 2.2 Stretch (only if MVP is done)
- Layer overlays on the map (NDVI vs. soil moisture vs. rainfall), with a transparency slider.
- GRACE/GRACE-FO groundwater/water-storage trend for Bihar.
- Flood-risk layer for the Kosi/Gandak/Bagmati basins (historical flood extent from Sentinel-1 or MODIS).
- Hindi UI (i18n-ready from day one; ship English first).
- Offline-friendly / low-bandwidth mode and PDF export of the comparison.
- Voice or icon-based input for low-literacy users.

### 2.3 Non-goals
- No yield prediction with numeric promises. Show relative scores and qualitative ranges only.
- No fertilizer or pesticide dosage advice.
- No user accounts or payments.
- Not a replacement for local advice. Never present output as a guaranteed recommendation.

---

## 3. Bihar context (featured region)

Bake this into the knowledge base and demo.

**Seasons**
- Kharif: roughly June to October (monsoon crops)
- Rabi: roughly November to March (winter crops)
- Zaid: roughly March to June (summer crops)

**Hazards to model**
- Floods in the north (Kosi, Gandak, Bagmati, Mahananda basins), with waterlogging in kharif.
- Drought and groundwater stress, mainly in south Bihar (e.g., Gaya, Aurangabad, Nawada, Jehanabad areas).
- Heat stress during wheat grain filling (March) and rising temperatures overall.
- Erratic monsoon onset and breaks.
- Frost or cold-wave exposure in winter for sensitive crops (low frequency, so keep it modest).

**Agro-climatic zones:** North-West alluvial (Zone I), North-East alluvial (Zone II), South Bihar alluvial (Zones IIIA and IIIB). Use as a lookup for default soil and climate context. Verify zone boundaries against an official source before display.

**Common rotations (seed data for the existing-rotation dropdown)**
- Rice (kharif) → Wheat (rabi) — dominant baseline
- Rice → Maize (rabi)
- Rice → Pulses (lentil/chickpea) (rabi)
- Rice → Mustard (rabi)
- Maize (kharif) → Wheat/Pulses (rabi)
- Rice → Wheat → Moong (zaid) — adds a summer legume
- Rice → Wheat → Fallow (bare field in zaid)

**Candidate crop library (initial):** rice, wheat, maize, lentil (masoor), chickpea (gram), pigeon pea (arhar), mung bean (moong), mustard, sugarcane, jute, sesbania/dhaincha (green manure), berseem (forage), potato, vegetables. Add more if time allows (e.g., makhana in water-logged areas).

---

## 4. Tech stack (DEFAULT)

Change only if the coding agent has a strong reason, and note the change.

| Layer | Choice |
|---|---|
| Frontend | React + TypeScript, Vite or Next.js |
| UI | Tailwind CSS, mobile-first, large touch targets |
| Map | MapLibre GL JS (or Leaflet as simpler fallback) |
| Charts | Recharts or Apache ECharts |
| Backend | Python 3.11+ with FastAPI |
| Geo / data libs | xarray, rasterio, rioxarray, numpy, pandas, shapely, pystac-client, requests |
| Storage (MVP) | Files plus SQLite for cached results; PostGIS only if needed |
| Caching | Pre-computed JSON/Parquet for Bihar districts; on-demand fetch plus disk cache for other points |
| Hosting | Frontend on Vercel/Netlify; backend on Render/Fly/Railway or similar free tier |
| Config | `.env` for credentials, with `.env.example` committed |

**Principle:** the app must work and demo reliably even if a live data API is slow or down. Use pre-fetched cached data for the Bihar demo and degrade gracefully elsewhere.

---

## 5. Data sources

Rule: **prefer sources that are free, global, and accessible without heavy authentication.** NASA Earthdata products need a free Earthdata Login account; do not hardcode credentials.

### 5.1 Tier 1: use in MVP (global)

| Data | Used for | Link |
|---|---|---|
| NASA SMAP | surface soil moisture, anomalies, freeze/thaw | https://www.earthdata.nasa.gov/data/platforms/space-based-platforms/smap |
| GPM / IMERG | rainfall amounts, extreme events | https://gpm.nasa.gov/data |
| Landsat and MODIS/VIIRS | NDVI/EVI, bare-field and stress timing | https://earthexplorer.usgs.gov/ , https://lpdaac.usgs.gov/products/ , https://search.earthdata.nasa.gov/search?q=VIIRS |
| NASA POWER | temperature, radiation, humidity, frost risk, crop water use | https://power.larc.nasa.gov/ |
| SRTM | elevation, slope, runoff and erosion proxy | https://www.earthdata.nasa.gov/data/instruments/srtm |
| ECOSTRESS | land-surface temperature, evapotranspiration, hotspots | https://ecostress.jpl.nasa.gov/data |
| ERA5 (ECMWF) | gap filling, long-term climate trends | https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview |
| Sentinel-2 (ESA) | 10-20 m NDVI, bare soil, field-scale monitoring | https://dataspace.copernicus.eu/ |
| FAO GAEZ | crop suitability and yield potential, global agronomic baseline | https://gaez.fao.org/ |
| Earthdata portal (general search) | discovery for NLDAS/GLDAS, GRACE, others | https://www.earthdata.nasa.gov/ |

### 5.2 Tier 2: stretch / optional

| Data | Used for | Link |
|---|---|---|
| GEDI | canopy and biomass context around fields | https://gedi.umd.edu/data |
| NLDAS/GLDAS | soil moisture, ET proxies, drought onset (search inside Earthdata Search) | https://www.earthdata.nasa.gov/ |
| GRACE / GRACE-FO | groundwater / water-storage trend | via Earthdata Search |

### 5.3 US-only adapters (load only when the selected point is in the US)

These do **not** cover Bihar. Implement as optional adapters behind a common interface, lowest priority.

| Data | Link |
|---|---|
| USDA Ag Data Commons | https://www.nal.usda.gov/services/agdatacommons |
| Web Soil Survey | https://websoilsurvey.nrcs.usda.gov/app/ |
| USDA NRCS soils (SSURGO/STATSGO2) | https://www.nrcs.usda.gov/resources/data-and-reports/soils |
| Cropland Data Layer (CropScape) | https://nassgeodata.gmu.edu/CropScape/ |
| PRISM climate | https://prism.oregonstate.edu/ |
| NAIP imagery | https://naip-usdaonline.hub.arcgis.com/ |
| NLCD land cover | https://www.usgs.gov/centers/eros/science/national-land-cover-database |
| CoCoRaHS rain observations | https://www.cocorahs.org/Maps |
| USGS NWIS water data | https://waterdata.usgs.gov/nwis |
| USDA AMS Market News | https://www.ams.usda.gov/market-news |
| USDA NASS QuickStats | https://quickstats.nass.usda.gov/ |
| OpenET (western US) | https://openetdata.org/ |
| LANDFIRE | https://www.landfire.gov/ |

### 5.4 Bihar / global replacements for the US-only sources
These are **suggestions that must be verified** (URLs, access method, licence) before relying on them.

| Need | US source | Replacement to evaluate |
|---|---|---|
| Soil properties (texture, organic carbon, pH, water holding) | SSURGO / WSS | ISRIC SoilGrids (global, REST API); ICAR-NBSS&LUP for India soil maps |
| Land cover / cropland | CDL / NLCD | ESA WorldCover, MODIS land cover, Sentinel-2 classification |
| Local climate normals | PRISM | ERA5, NASA POWER, IMD gridded data |
| Ground rainfall validation | CoCoRaHS | IMD station and gridded rainfall |
| Crop statistics | NASS QuickStats | Bihar agriculture department statistics, Indian government agri-statistics portals |
| Market prices | AMS Market News | Agmarknet (mandi prices) |
| Evapotranspiration | OpenET | MODIS ET, ECOSTRESS |
| Groundwater / hydrology | NWIS | CGWB groundwater level data, GRACE/GRACE-FO |

### 5.5 Data-access suggestions (DEFAULT, verify before use)
- **NASA POWER:** public REST API with no key. Use it first for temperature, radiation, humidity, and frost indicators.
- **SoilGrids:** public REST API for point queries.
- **Landsat / Sentinel-2 / MODIS / NASADEM:** consider the Microsoft Planetary Computer STAC API or Google Earth Engine as easier alternatives to raw downloads, if credentials and licences allow.
- **SMAP, IMERG, ECOSTRESS:** require Earthdata Login. Pre-process Bihar into small cached files rather than querying live in the app.
- **ERA5:** requires a Copernicus CDS account and API key; cache results.
- Keep every integration behind a `DataProvider` interface so a source can be swapped or mocked.

---

## 6. Architecture

```
[Browser: React + MapLibre]
        |  REST/JSON
[FastAPI backend]
   |-- /providers   (one module per data source, common interface)
   |-- /pipeline    (harmonization -> features)
   |-- /engine      (rotation scoring, scenario logic, explanations)
   |-- /knowledge   (crops.json, rotations.json, seasons.json, regions.json)
   |-- /cache       (pre-computed Bihar data, on-demand disk cache)
```

### 6.1 Data harmonization pipeline
Different datasets have different resolutions (SMAP ~9-36 km, IMERG ~10 km, MODIS 250 m-1 km, Landsat 30 m, Sentinel-2 10-20 m, ECOSTRESS ~70 m, SRTM 30 m).

1. Choose an analysis unit: a **point/plot buffer** (default radius configurable, e.g., 1 km) and, for Bihar, **district polygons**.
2. Resample or aggregate every variable to a **common temporal step** (weekly or dekadal) and compute **zonal statistics** for the analysis unit.
3. Compute **anomalies** against a multi-year climatology (e.g., z-score vs. same week in prior years).
4. Store the harmonized table: `unit_id, date, rainfall_mm, tmax, tmin, srad, rh, soil_moisture, sm_anomaly, ndvi, evi, lst, et, ...`.
5. Record **per-variable provenance and resolution** so the UI can explain "this value comes from a ~9 km satellite estimate, not a measurement on your field".

### 6.2 Derived indicators
- **Bare-field periods:** consecutive weeks with NDVI below a threshold (configurable, default ~0.2), mapped to calendar weeks and seasons.
- **Crop-stress windows:** weeks where soil-moisture anomaly is strongly negative, or LST/Tmax exceeds a crop-specific threshold, or NDVI falls sharply versus climatology.
- **Water-balance proxy:** rainfall minus reference or actual ET over rolling windows.
- **Rainfall reliability and extremes:** variability of seasonal totals; count of heavy-rain days; flood and waterlogging flag from rainfall and terrain.
- **Frost risk:** days with minimum temperature at or below a threshold (from POWER/ERA5).
- **Erosion risk proxy:** slope (SRTM) × rainfall intensity × bare-soil duration, plus soil erodibility if available. Present as a relative index (Low/Medium/High), not a measured loss.

---

## 7. Rotation engine

Use an **explainable, rule-based scoring model**. Do not use a black-box model for the core recommendation. A small statistical or ML component may be added only for pattern detection (e.g., stress detection), and must be explained.

### 7.1 Knowledge base (JSON, editable by non-developers)
For each crop store: season(s), duration, water demand (L/M/H), drought tolerance, flood/waterlogging tolerance, heat tolerance, frost sensitivity, nitrogen fixation (yes/no/amount class), root depth, residue/organic-matter contribution, erosion protection (ground cover), pest/disease break value (family, e.g., cereals vs. legumes vs. brassicas), market class, forage value, labour/equipment needs, and source/citation for every field. Mark unknown values explicitly as `null` with a note.

### 7.2 Generating candidate strategies
- Strategy A: **the farmer's existing rotation** (always included).
- Strategies B, C (and optionally D): generated from the crop library by combining season-feasible crops, following simple agronomic rules (e.g., do not repeat the same crop family back to back; include a legume or green manure when nitrogen is a priority; avoid long-duration water-heavy crops when water is limited; prefer short-duration or flood-tolerant options in flood-prone plots).
- Always ensure at least three strategies are displayed.

### 7.3 Scoring
For each strategy, compute criterion scores on a 0-100 scale:

| Criterion | Inputs |
|---|---|
| Water efficiency | crop water demand vs. rainfall reliability, SMAP anomalies, ET, irrigation availability |
| Drought and heat resilience | crop tolerances vs. stress windows and temperature trends |
| Flood/waterlogging resilience | crop tolerance vs. flood flag and terrain |
| Soil health | N fixation, organic-matter contribution, root diversity |
| Erosion reduction | ground cover duration vs. bare-field periods, slope |
| Pest-cycle disruption | crop family diversity across the rotation |
| Income / market | market class, price data if available, supplemental income potential |
| Feasibility | season fit, equipment, labour, land size |

Final score = weighted sum, where **weights come from the farmer's priorities** (normalized). Environmental data modifies criterion scores; it does not override farmer priorities.

Scenario sliders (rain, temperature) shift the environmental inputs and recompute scores. Show how rankings change.

### 7.4 Confidence and gaps
- Confidence per strategy: High / Medium / Low, based on data coverage, resolution mismatch (e.g., coarse SMAP for a small plot), missing crop knowledge fields, and agreement between sources.
- Always list **information gaps** (e.g., "no field-level soil test", "no local market price data", "SMAP resolution is much coarser than your plot").

### 7.5 Strategy card (output format)
Each strategy must render these sections:
1. **Rotation:** crops by season, as a simple visual timeline.
2. **Why it was suggested:** 2-3 plain sentences tied to the farmer's priorities and local conditions.
3. **Evidence:** which datasets and indicators support it (with small charts or values).
4. **Benefits:** soil health, water, income, erosion, pest cycle.
5. **Information gaps:** what the tool does not know.
6. **Risks needing local review:** explicit, specific, flagged for farmer/expert verification.
7. **Confidence** badge and "Why this score?" expander.

Plus a side-by-side comparison table/radar chart across criteria.

---

## 8. UI / UX

### Screens
1. **Landing / region view:** map opens on Bihar; short explanation; "Start" button.
2. **Location + profile:** choose location, fill farmer inputs (section 2.1 item 4).
3. **Conditions:** charts and timeline (rainfall, temperature, soil moisture, NDVI, bare/stress bands) with plain-language summary ("Your field is typically bare from late March to June").
4. **Compare rotations:** strategy cards, comparison table, scenario sliders.
5. **Learn:** glossary and "how this works" (data sources, satellite vs. ground, uncertainty).

### Design rules (farmer-centered)
- Mobile-first, large text, high contrast, minimal jargon, icons for crops and seasons.
- Use plain-language summaries first and details on demand ("Show me the data").
- Use color-blind-safe palettes; never rely on color alone.
- Show units and the date range for every chart.
- i18n-ready (all strings in a locale file); English first, Hindi as stretch.
- Fast on slow connections: lazy-load layers, compress cached data, skeleton loaders.

---

## 9. Support-not-replace messaging

Required, not optional:
- Persistent but non-intrusive banner or footer: "This tool highlights patterns and possibilities. It does not replace your own experience or advice from local agricultural experts."
- On every strategy card, a **"Check with local experts"** section listing the items that need human judgment (soil testing, seed variety and local suitability, disease pressure, market commitments, irrigation access, flood history).
- A short explainer on where human judgment matters most: local microclimate, soil variation within a field, pest and disease history, input costs, market and contract realities.
- Language in results is probabilistic ("may", "tends to", "could"), never guarantees.

---

## 10. API (backend)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/regions` | list featured regions (Bihar and its districts) |
| GET | `/api/conditions?lat=&lon=&start=&end=` | harmonized time series and derived indicators for a point |
| GET | `/api/conditions/district/{id}` | cached district-level data (Bihar) |
| GET | `/api/indicators?lat=&lon=` | bare-field periods, stress windows, erosion/flood flags |
| GET | `/api/crops` | crop knowledge base |
| GET | `/api/rotations/presets?region=` | common rotations for a region |
| POST | `/api/compare` | body: location, farmer profile (priorities, constraints), existing rotation, scenario deltas → ranked strategies with scores, evidence, gaps, risks, confidence |
| GET | `/api/glossary` | terms for tooltips |
| GET | `/api/health` | health and data-source status |

Responses include `data_sources[]` with name, resolution, date range, and `is_cached` / `is_fallback` flags.

---

## 11. Suggested project structure

```
field-shift/
  README.md
  spec.md
  .env.example
  frontend/
    src/
      components/ (Map, Timeline, StrategyCard, PriorityForm, ScenarioSliders, Glossary)
      pages/
      i18n/ (en.json, hi.json)
      lib/api.ts
  backend/
    app/
      main.py
      providers/ (power.py, soilgrids.py, imerg.py, smap.py, ndvi.py, terrain.py, ecostress.py, base.py)
      pipeline/ (harmonize.py, indicators.py)
      engine/ (candidates.py, scoring.py, scenarios.py, confidence.py, explain.py)
      knowledge/ (crops.json, rotations.json, seasons.json, regions.json, glossary.json)
      cache/
    scripts/ (prefetch_bihar.py)
    tests/
```

---

## 12. Build plan (prioritized for a hackathon)

1. **Scaffold** frontend and backend, health endpoint, map showing Bihar.
2. **Knowledge base:** crops, seasons, Bihar rotations (JSON), with citations.
3. **First data provider:** NASA POWER (temperature, rainfall proxy, radiation, frost) for any point. Chart it.
4. **Harmonization + indicators** on POWER data; bare-field/stress logic stubbed with NDVI when available.
5. **NDVI provider** (Landsat/Sentinel-2/MODIS) and bare-field detection.
6. **Rotation engine** with three strategies, scoring, explanations, confidence, gaps, risks. Hard-code environmental inputs first, then wire real data.
7. **Farmer input form and compare screen** with strategy cards and scenario sliders.
8. **Add providers** in priority order: IMERG, SMAP, SRTM terrain, SoilGrids, ECOSTRESS/MODIS ET.
9. **Pre-fetch and cache Bihar district data** for a reliable demo.
10. **Polish:** glossary, disclaimers, mobile layout, error and fallback states.
11. **Stretch features** if time remains.
12. **Demo prep:** scripted Bihar walkthrough (e.g., a rice-wheat farmer in a drought-prone south Bihar district vs. a flood-prone north Bihar district) showing how recommendations differ.

---

## 13. Acceptance criteria

- [ ] Map opens on Bihar; user can pick any point worldwide or a Bihar district.
- [ ] Conditions dashboard shows data from at least **4 NASA/space-agency sources** (target: POWER, IMERG, SMAP, and one vegetation source) with source and resolution labelled.
- [ ] Bare-field periods and crop-stress windows are shown on a seasonal timeline.
- [ ] Farmer can enter priorities and constraints, and the results change accordingly.
- [ ] At least **3 strategies** are compared, with one being the existing rotation.
- [ ] Each strategy shows: why suggested, evidence, benefits, information gaps, risks for local review, and confidence.
- [ ] Scenario sliders (rainfall, temperature) update the comparison.
- [ ] Glossary/tooltips explain the key scientific terms; satellite vs. ground data is explained.
- [ ] "Support, not replace" messaging is present on the main views and every strategy card.
- [ ] A non-US location works without errors; US-only layers are hidden or clearly marked unavailable outside the US.
- [ ] App works on a phone-sized screen, and the Bihar demo works with cached data if live APIs fail.
- [ ] README explains setup, env vars, data sources, and limitations.

---

## 14. Risks, assumptions, and open items

- **Assumed (DEFAULT):** React + FastAPI stack; 48-hour hackathon MVP; free hosting; no user accounts. Change if the team's constraints differ.
- Several NASA products require Earthdata Login and can be slow or large. Pre-cache Bihar and show clear fallback messaging.
- Coarse sensors (SMAP, IMERG) do not capture field-level variation. State this plainly in the UI.
- Crop-knowledge values must be sourced and cited. Do not invent agronomic numbers; mark gaps as unknown.
- Replacement data sources in section 5.4 are suggestions only. Verify URLs, licences, and access methods before depending on them.
- Bihar zone boundaries, flood basin geometry, and district lists should be taken from an official or well-known open source, not hand-drawn.
- Not agronomic advice. All outputs are decision support for discussion with local experts.

---

## 15. Attribution and compliance

- Credit NASA, ESA/Copernicus, ECMWF, USDA, USGS, FAO, ISRIC, and any other source in an in-app "Data sources" page.
- NASA does not endorse non-U.S. Government entities; comply with each external site's data-use terms.
- Do not store any Earthdata or API credentials in the repository.
