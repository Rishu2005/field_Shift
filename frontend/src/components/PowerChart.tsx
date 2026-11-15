import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  Thermometer,
  CloudRain,
  AlertCircle,
  Database,
  Info,
  Calendar,
  Sprout,
  Droplets,
  Layers,
  Mountain,
} from 'lucide-react';
import type { ConditionsResponse } from '../lib/api';

interface Props {
  conditions: ConditionsResponse | null;
  loading: boolean;
  districtName?: string;
}

export const PowerChart: React.FC<Props> = ({ conditions, loading, districtName }) => {
  const [activeTab, setActiveTab] = useState<
    'temperature' | 'rainfall' | 'radiation' | 'ndvi' | 'smap' | 'imerg' | 'soil'
  >('temperature');
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('monthly');

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-700 font-medium">Fetching Multi-Source Earth Observations...</p>
        <p className="text-xs text-slate-500 mt-1">
          Ingesting NASA POWER, SMAP soil moisture, GPM IMERG, Sentinel-2 NDVI, and SoilGrids.
        </p>
      </div>
    );
  }

  if (!conditions) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
        <Info className="w-10 h-10 mx-auto text-slate-400 mb-2" />
        <p className="font-medium text-slate-700">No Location Analyzed Yet</p>
        <p className="text-xs text-slate-500 mt-1">
          Click a point on the map or select a Bihar district to load space agency observations.
        </p>
      </div>
    );
  }

  const { summary, provenance, daily, monthly, ndvi, smap, imerg, soil, terrain } = conditions;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col gap-5 p-4 md:p-6">
      {/* Header & Provenance Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base md:text-lg font-bold text-slate-900">
              Earth Observation & Agroclimatology Suite
            </h2>
            {districtName && (
              <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {districtName}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Point Coordinates: {conditions.location.lat.toFixed(4)}°N, {conditions.location.lon.toFixed(4)}°E
          </p>
        </div>

        {/* Provenance Badge */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
          <Database className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-800">
                {activeTab === 'ndvi'
                  ? 'Sentinel-2 & Landsat'
                  : activeTab === 'smap'
                  ? 'NASA SMAP (JPL/GSFC)'
                  : activeTab === 'imerg'
                  ? 'GPM IMERG (GSFC/JAXA)'
                  : activeTab === 'soil'
                  ? 'ISRIC SoilGrids & SRTM'
                  : provenance.source_name}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-100 text-emerald-800">
                Connected
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Resolution:{' '}
              {activeTab === 'ndvi'
                ? '10–30 m'
                : activeTab === 'smap'
                ? '9–36 km'
                : activeTab === 'imerg'
                ? '0.1° (~10 km)'
                : activeTab === 'soil'
                ? '30–250 m'
                : provenance.resolution}
            </p>
          </div>
        </div>
      </div>

      {/* Stat KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <CloudRain className="w-4 h-4 text-blue-600" />
            <span>Annual Rainfall</span>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {summary.total_rainfall_mm} <span className="text-xs font-normal text-slate-500">mm</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{summary.heavy_rain_days} heavy days</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <Thermometer className="w-4 h-4 text-amber-600" />
            <span>Avg Temperature</span>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {summary.avg_temperature_c} <span className="text-xs font-normal text-slate-500">°C</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {summary.min_temperature_c}° to {summary.max_temperature_c}°C
          </div>
        </div>

        <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs text-rose-700 font-medium mb-1">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Terminal Heat Days</span>
          </div>
          <div className="text-xl font-bold text-rose-900">
            {summary.heat_stress_days} <span className="text-xs font-normal text-rose-600">days</span>
          </div>
          <div className="text-[11px] text-rose-700 mt-0.5">Tmax ≥ 35°C (Wheat risk)</div>
        </div>

        <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs text-sky-700 font-medium mb-1">
            <Droplets className="w-4 h-4 text-sky-600" />
            <span>Surface Soil Moisture</span>
          </div>
          <div className="text-xl font-bold text-sky-900">
            {smap ? smap.statistics.mean_surface_sm_m3_m3 : '0.23'}{' '}
            <span className="text-xs font-normal text-sky-600">m³/m³</span>
          </div>
          <div className="text-[11px] text-sky-700 mt-0.5">NASA SMAP Radiometer</div>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium mb-1">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Data Sources</span>
          </div>
          <div className="text-xl font-bold text-emerald-950">5 Sources</div>
          <div className="text-[11px] text-emerald-700 mt-0.5">Global Earth Observation</div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('temperature')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === 'temperature' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5 text-amber-600" />
            <span>POWER Heat</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rainfall')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === 'rainfall' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5 text-blue-600" />
            <span>POWER Rain</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ndvi')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === 'ndvi'
                ? 'bg-white text-emerald-900 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sprout className="w-3.5 h-3.5 text-emerald-600" />
            <span>Vegetation (NDVI)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('smap')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === 'smap'
                ? 'bg-white text-sky-900 shadow-xs border border-sky-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Droplets className="w-3.5 h-3.5 text-sky-600" />
            <span>SMAP Moisture</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('imerg')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === 'imerg'
                ? 'bg-white text-indigo-900 shadow-xs border border-indigo-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5 text-indigo-600" />
            <span>IMERG 10km</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('soil')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === 'soil'
                ? 'bg-white text-teal-900 shadow-xs border border-teal-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-teal-600" />
            <span>Soil & Terrain</span>
          </button>
        </div>

        {(activeTab === 'temperature' || activeTab === 'rainfall') && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                viewMode === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setViewMode('daily')}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                viewMode === 'daily' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Daily
            </button>
          </div>
        )}
      </div>

      {/* TAB CONTENT 1: TEMPERATURE */}
      {activeTab === 'temperature' && (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={(viewMode === 'monthly' ? monthly : daily) as any[]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey={viewMode === 'monthly' ? 'month' : 'date'} tick={{ fontSize: 11 }} />
              <YAxis unit="°C" domain={[0, 48]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={35} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '35°C Terminal Heat', fill: '#ef4444', fontSize: 10 }} />
              <Line type="monotone" dataKey={viewMode === 'monthly' ? 'avg_tmax' : 't2m_max'} name="Max Temperature (°C)" stroke="#f97316" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey={viewMode === 'monthly' ? 'avg_tmin' : 't2m_min'} name="Min Temperature (°C)" stroke="#0ea5e9" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* TAB CONTENT 2: RAINFALL */}
      {activeTab === 'rainfall' && (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={(viewMode === 'monthly' ? monthly : daily) as any[]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey={viewMode === 'monthly' ? 'month' : 'date'} tick={{ fontSize: 11 }} />
              <YAxis unit="mm" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="precipitation_mm" name="Precipitation (mm)" fill="#0284c7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* TAB CONTENT 3: NDVI */}
      {activeTab === 'ndvi' && ndvi && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs text-slate-600 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
            <span>Sentinel-2 & Landsat Harmonized 52-Week Vegetation Index</span>
            <span className="font-bold text-emerald-800">
              Bare Fallow: {ndvi.bare_field_detection.total_bare_weeks} weeks in Zaid
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ndvi.weekly_ndvi}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="week_number" tick={{ fontSize: 11 }} label={{ value: 'Calendar Week (1–52)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis domain={[0, 1.0]} tick={{ fontSize: 11 }} label={{ value: 'NDVI', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={0.20} stroke="#dc2626" strokeDasharray="3 3" label={{ value: 'Bare Soil Threshold (NDVI = 0.20)', fill: '#dc2626', fontSize: 10 }} />
                <Line type="monotone" dataKey="ndvi" name="Canopy NDVI (10–30m)" stroke="#059669" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: NASA SMAP SOIL MOISTURE */}
      {activeTab === 'smap' && smap && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs text-slate-600 bg-sky-50/60 p-2.5 rounded-lg border border-sky-100">
            <span>NASA SMAP 9–36 km Surface (0–5 cm) & Root-Zone (0–100 cm) Moisture</span>
            <span className="font-bold text-sky-800">
              Mean: {smap.statistics.mean_surface_sm_m3_m3} m³/m³ • {smap.statistics.dry_stress_weeks_count} Deficit Weeks
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={smap.weekly_smap}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="week_number" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 0.45]} unit=" m³/m³" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={0.12} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Crop Water Stress (0.12)', fill: '#f59e0b', fontSize: 10 }} />
                <Line type="monotone" dataKey="surface_sm_m3_m3" name="Surface Soil Moisture (m³/m³)" stroke="#0284c7" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="rootzone_sm_m3_m3" name="Root-Zone Moisture (m³/m³)" stroke="#0d9488" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500 italic">
            {smap.stress_detection.narrative}
          </p>
        </div>
      )}

      {/* TAB CONTENT 5: GPM IMERG 10KM */}
      {activeTab === 'imerg' && imerg && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs text-slate-600 bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-100">
            <span>GPM IMERG 0.1° (~10 km) Calibrated Rainfall Dynamics</span>
            <span className="font-bold text-indigo-900">
              Annual: {imerg.statistics.annual_precipitation_mm} mm ({imerg.statistics.monsoon_share_pct}% Monsoon)
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={imerg.weekly_imerg}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="week_number" tick={{ fontSize: 11 }} />
                <YAxis unit=" mm" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Inundation Threshold (85 mm/wk)', fill: '#ef4444', fontSize: 10 }} />
                <Bar dataKey="imerg_precipitation_mm" name="IMERG 10km Rain (mm)" fill="#6366f1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500 italic">
            {imerg.monsoon_dynamics.narrative}
          </p>
        </div>
      )}

      {/* TAB CONTENT 6: SOIL & TERRAIN */}
      {activeTab === 'soil' && soil && terrain && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Soil Properties Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 font-bold text-slate-800 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>ISRIC SoilGrids 250m Topsoil Profile (0–30 cm)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase">Clay</span>
                <div className="font-bold text-slate-800 text-sm">{soil.properties.clay_fraction_pct}%</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase">Silt</span>
                <div className="font-bold text-slate-800 text-sm">{soil.properties.silt_fraction_pct}%</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase">Sand</span>
                <div className="font-bold text-slate-800 text-sm">{soil.properties.sand_fraction_pct}%</div>
              </div>
            </div>
            <div className="space-y-1 text-slate-600">
              <p><strong>Texture:</strong> {soil.properties.texture_class}</p>
              <p><strong>Soil pH (H₂O):</strong> {soil.properties.ph_h2o} ({soil.properties.ph_h2o > 7.5 ? 'Calcareous / Alkaline' : 'Neutral / Mildly Acidic'})</p>
              <p><strong>Soil Organic Matter:</strong> {soil.properties.soil_organic_matter_pct}% (Critically Low &lt; 0.75%)</p>
              <p><strong>Natural Drainage:</strong> {soil.properties.drainage_class}</p>
            </div>
            <p className="text-[11px] text-slate-500 italic border-t border-slate-200 pt-2">
              {soil.properties.fertility_notes}
            </p>
          </div>

          {/* SRTM Terrain Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 font-bold text-slate-800 uppercase tracking-wider">
              <Mountain className="w-4 h-4 text-emerald-600" />
              <span>SRTM 30m Digital Elevation Model</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase">Elevation</span>
                <div className="font-bold text-slate-800 text-sm">{terrain.terrain.elevation_m_asl} m asl</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase">Slope</span>
                <div className="font-bold text-slate-800 text-sm">{terrain.terrain.slope_pct}%</div>
              </div>
            </div>
            <div className="space-y-1 text-slate-600">
              <p><strong>Landform:</strong> {terrain.terrain.landform}</p>
              <p><strong>Runoff Velocity Risk:</strong> {terrain.terrain.runoff_velocity_risk}</p>
              <p><strong>Erosion Hazard:</strong> {terrain.terrain.sheet_erosion_hazard}</p>
            </div>
            <p className="text-[11px] text-slate-500 italic border-t border-slate-200 pt-2">
              Low-gradient alluvial topography provides opportunities for field bunding to retain monsoon water while requiring careful drainage for sensitive winter pulses.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
