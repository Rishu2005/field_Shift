# Field Shift: Crop Rotation Decision-Support Tool

> **NASA Space Apps Challenge 2026** — *"Field Shift: Adapting Farms with NASA Data"*

Field Shift is an explainable, farmer-centered crop-rotation decision-support platform designed to help smallholder farmers adapt to climatic hazards (erratic monsoon breaks, severe flood inundation, terminal heat spikes) and restore soil health using NASA Earth observations. The system operates globally for any coordinate on Earth, with **Bihar, India (Middle Indo-Gangetic Plains)** as the featured default region with preloaded agronomic baselines and offline-capable cached benchmarks.

---

## 🌾 Core Features & Completed Build Steps

- **Default Bihar Focus & Global Point Selection**: Leaflet map centered on Bihar (`25.6° N, 85.1° E`, zoom level 7) with 1-click district switching across all 4 Bihar agro-climatic zones (Zone I, Zone II, Zone IIIA, Zone IIIB) and global point selection.
- **Hydrological Hazard Overlay**: Interactive map toggle rendering basin floodways (Kosi Basin Floodway, Bagmati/Kamala Chaur wetlands, Mokama Tal depression).
- **Multi-Source Space Suite (7 Satellite & Reanalysis Datasets)**:
  1. **NASA POWER Agroclimatology** (~50 km, NASA LaRC): Daily $T_{mean}$, $T_{max}$, $T_{min}$, solar radiation, relative humidity, $ET_0$, and water balance ($P - ET_0$).
  2. **NASA SMAP** (9–36 km, NASA JPL/GSFC): Surface (0–5 cm) and root-zone (0–100 cm) volumetric soil moisture ($m^3/m^3$) with standardized anomaly z-scores ($\sigma$).
  3. **GPM IMERG** (0.1° / ~10 km, NASA GSFC/JAXA): Multi-satellite calibrated precipitation with convective storm surges ($\ge 50$ mm/day, $\ge 85$ mm/week inundation thresholds).
  4. **Sentinel-2 & Landsat 8/9** (10–30 m, ESA/USGS/NASA): 52-week harmonized NDVI canopy curve with algorithmic bare-soil detection ($NDVI < 0.20$ for $\ge 3$ consecutive weeks).
  5. **ISRIC SoilGrids 250m**: Topsoil physical and chemical properties (clay/silt/sand %, pH, organic carbon $g/kg$, bulk density).
  6. **SRTM / NASADEM 30m**: Digital elevation model, slope %, and simple runoff velocity risk proxy.
  7. **ECOSTRESS / MODIS ET** (70–500 m): Land surface temperature and evaporative stress index (ESI).
- **Harmonized 52-Week Seasonal Timeline**: Visual representation of Kharif (Monsoon), Rabi (Winter), and Zaid (Summer) bands with detected bare-field gaps (e.g. 11-week unshielded summer fallow) and stress windows (March terminal heat, cold wave, vegetative drought).
- **Explainable Multi-Strategy Rotation Engine**:
  - Automatically evaluates at least 3 strategies: Farmer Baseline (e.g. Rice–Wheat) plus 2+ tailored alternatives (e.g. Summer Moong legume intensification, Dhaincha water-smart rotation, or Makhana wetland adaptation).
  - 8-criterion rule-based scoring (0–100 scale): Water efficiency, Drought/heat resilience, Flood resilience, Soil health & N-fixation, Erosion reduction, Pest-cycle break, Income/market, Feasibility.
  - Normalizes scores according to farmer priority weights.
- **Dynamic Climate Scenario Sliders**: Real-time simulation of precipitation shifts ($-30\%$ to $+30\%$) and temperature warming ($0$ to $+3.0^\circ\text{C}$), demonstrating how rankings change under extreme climate stress.
- **100% Offline Cached Demo for Bihar**: All 18 Bihar districts are pre-fetched and disk-cached (`backend/app/cache/`) ensuring zero-latency, 100% offline demonstration reliability.
- **Bilingual Interface (English & Hindi)**: Full UI localization toggle (`en.json` and `hi.json`) with persistent "Support, Not Replace" advisory framing.

---

## 🚀 Setup & Quickstart

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run complete test suite (22 unit, engine, and integration tests)
PYTHONPATH=. pytest tests/

# Start FastAPI backend server
PYTHONPATH=. uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API is running at `http://localhost:8000`. Test the health endpoint at `http://localhost:8000/api/health`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run build     # Production bundle verification
npm run dev       # Start Vite development server
```
Open `http://localhost:5173` in your browser.

### 3. Pre-fetch Bihar Cache (Offline Demo Prep)
```bash
PYTHONPATH=. backend/venv/bin/python backend/scripts/prefetch_bihar.py
```
This batch-downloads and caches agroclimatic and satellite layers across all 18 Bihar districts into `backend/app/cache/`.

---

## 🔑 Environment Variables

Credentials are never committed directly. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend port | `8000` |
| `HOST` | Backend binding host | `0.0.0.0` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:5173,http://localhost:3000` |
| `EARTHDATA_USERNAME` | NASA Earthdata Login (optional; cached benchmarks provided) | *empty* |
| `EARTHDATA_PASSWORD` | NASA Earthdata Password | *empty* |
| `CACHE_DIR` | Disk cache directory | `./backend/app/cache` |

---

## 🛰️ NASA & Space Agency Data Sources

| Source | Resolution | Parameter / Role |
|---|---|---|
| **NASA POWER** | 0.5° (~50 km) | Air temperature, solar radiation, relative humidity, frost & terminal heat days |
| **NASA SMAP** | 9–36 km | Surface & root-zone soil moisture ($m^3/m^3$) and drought anomalies |
| **GPM IMERG** | 0.1° (~10 km) | Precipitation calibration and extreme convective storm detection |
| **Landsat / Sentinel-2** | 10–30 m | 52-week NDVI vegetation canopy time-series and bare-field detection |
| **SRTM / NASADEM** | 30 m | Digital elevation (m asl), slope %, and simple overland runoff risk |
| **ISRIC SoilGrids** | 250 m | Machine-learning topsoil texture (clay/silt/sand %), pH, organic carbon |
| **ECOSTRESS** | 70–500 m | Land surface temperature and evaporative stress index (ESI) |

---

## ⚠️ Scientific Limitations & Ground Data Differences

- **Grid Resolution vs. Farm Scale**: Satellite agroclimatology (~10–50 km) provides regional weather trends and multi-week hazard patterns. It does not replace field-level microclimate or localized water table observations.
- **Decision Support Framing**: All suggestions are probabilistic ("may", "tends to", "could"). Farmers should always review variety choices, soil test results, and market commitments with local Krishi Vigyan Kendras (KVK).
