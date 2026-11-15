const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  featured_region: string;
  bihar_offline_cache_ready: boolean;
  support_not_replace_notice: string;
  data_sources: Array<{
    name: string;
    resolution: string;
    coverage: string;
    status: string;
    is_cached: boolean;
    is_fallback: boolean;
    role: string;
  }>;
}

export interface RegionData {
  id: string;
  name: string;
  country: string;
  center: { lat: number; lon: number; default_zoom: number };
  bounding_box: { min_lat: number; max_lat: number; min_lon: number; max_lon: number };
  description: string;
  agro_climatic_zones: Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    annual_rainfall_mm: number;
    districts: string[];
  }>;
  districts: Array<{
    id: string;
    name: string;
    zone: string;
    lat: number;
    lon: number;
    hazard: string;
    dominant_rotation: string;
  }>;
}

export interface DailyRecord {
  date: string;
  t2m: number;
  t2m_max: number;
  t2m_min: number;
  precipitation_mm: number;
  solar_radiation_mj: number;
  rh_pct: number;
  heat_stress: boolean;
  frost_risk: boolean;
}

export interface ConditionsSummary {
  total_rainfall_mm: number;
  avg_temperature_c: number;
  max_temperature_c: number;
  min_temperature_c: number;
  heat_stress_days: number;
  frost_risk_days: number;
  heavy_rain_days: number;
  total_days: number;
}

export interface MonthlyRecord {
  month: string;
  precipitation_mm: number;
  avg_tmax: number;
  avg_tmin: number;
}

export interface ProvenanceInfo {
  source_name: string;
  resolution: string;
  agency: string;
  is_cached: boolean;
  is_fallback: boolean;
  date_range: string;
  spatial_notice: string;
  note: string;
}

export interface WeeklyRecord {
  week_number: number;
  season: 'kharif' | 'rabi' | 'zaid';
  season_label: string;
  start_date: string;
  end_date: string;
  tmax: number;
  tmin: number;
  tmean: number;
  precipitation_mm: number;
  reference_et0_mm: number;
  water_balance_mm: number;
  heat_stress_days: number;
  frost_risk_days: number;
  heavy_rain_days: number;
  relative_humidity: number;
  solar_radiation: number;
}

export interface StressWindow {
  id: string;
  hazard: string;
  season: string;
  weeks: number[];
  period: string;
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  impact: string;
  agronomic_advice: string;
}

export interface BareFieldPeriod {
  season: string;
  season_label: string;
  consecutive_weeks: number;
  calendar_range: string;
  severity: string;
  description: string;
  consequences: string[];
  solution: string;
}

export interface DerivedIndicators {
  location: { lat: number; lon: number };
  plain_language_summary: string;
  bare_field_periods: BareFieldPeriod[];
  stress_windows: StressWindow[];
  seasonal_breakdown: Record<string, any>;
  erosion_risk_proxy: {
    rating: 'Low' | 'Medium' | 'High';
    explanation: string;
  };
}

export interface NdviWeeklyRecord {
  week_number: number;
  season: 'kharif' | 'rabi' | 'zaid';
  ndvi: number;
  is_bare_soil: boolean;
  canopy_status: string;
}

export interface NdviDetection {
  is_detected: boolean;
  threshold_used: number;
  total_bare_weeks: number;
  max_consecutive_weeks: number;
  bare_weeks: number[];
  bare_season: string;
  narrative: string;
}

export interface NdviResponse {
  location: { lat: number; lon: number };
  provenance: ProvenanceInfo;
  statistics: {
    max_ndvi: number;
    min_ndvi: number;
    mean_ndvi: number;
    peak_kharif_ndvi: number;
    peak_rabi_ndvi: number;
  };
  bare_field_detection: NdviDetection;
  weekly_ndvi: NdviWeeklyRecord[];
}

export interface SmapWeeklyRecord {
  week_number: number;
  season: 'kharif' | 'rabi' | 'zaid';
  surface_sm_m3_m3: number;
  rootzone_sm_m3_m3: number;
  anomaly_sigma: number;
  is_dry_stress: boolean;
  is_saturated: boolean;
  status: string;
}

export interface SmapResponse {
  location: { lat: number; lon: number };
  provenance: ProvenanceInfo;
  statistics: {
    mean_surface_sm_m3_m3: number;
    min_surface_sm_m3_m3: number;
    max_surface_sm_m3_m3: number;
    dry_stress_weeks_count: number;
    saturated_weeks_count: number;
  };
  stress_detection: {
    dry_stress_weeks: number[];
    saturated_weeks: number[];
    summer_depletion_severity: string;
    narrative: string;
  };
  weekly_smap: SmapWeeklyRecord[];
}

export interface ImergWeeklyRecord {
  week_number: number;
  season: 'kharif' | 'rabi' | 'zaid';
  imerg_precipitation_mm: number;
  heavy_storm_days: number;
  inundation_risk: boolean;
  intensity_category: string;
}

export interface ImergResponse {
  location: { lat: number; lon: number };
  provenance: ProvenanceInfo;
  statistics: {
    annual_precipitation_mm: number;
    monsoon_share_pct: number;
    heavy_rain_weeks_count: number;
    inundation_risk_weeks: number[];
    peak_weekly_rain_mm: number;
  };
  monsoon_dynamics: {
    onset_window: string;
    peak_flood_period: string;
    withdrawal_window: string;
    narrative: string;
  };
  weekly_imerg: ImergWeeklyRecord[];
}

export interface SoilGridsResponse {
  location: { lat: number; lon: number };
  provenance: ProvenanceInfo;
  properties: {
    texture_class: string;
    clay_fraction_pct: number;
    silt_fraction_pct: number;
    sand_fraction_pct: number;
    ph_h2o: number;
    soil_organic_carbon_g_kg: number;
    soil_organic_matter_pct: number;
    bulk_density_g_cm3: number;
    drainage_class: string;
    fertility_notes: string;
  };
}

export interface TerrainResponse {
  location: { lat: number; lon: number };
  provenance: ProvenanceInfo;
  terrain: {
    elevation_m_asl: number;
    slope_pct: number;
    landform: string;
    runoff_velocity_risk: string;
    sheet_erosion_hazard: string;
  };
}

export interface ConditionsResponse {
  location: { lat: number; lon: number };
  provenance: ProvenanceInfo;
  summary: ConditionsSummary;
  monthly: MonthlyRecord[];
  daily: DailyRecord[];
  weekly?: WeeklyRecord[];
  indicators?: DerivedIndicators;
  ndvi?: NdviResponse;
  smap?: SmapResponse;
  imerg?: ImergResponse;
  soil?: SoilGridsResponse;
  terrain?: TerrainResponse;
  district_metadata?: any;
}

export interface Crop {
  id: string;
  name: string;
  local_name: string;
  botanical_name: string;
  family: string;
  seasons: string[];
  duration_days: { min: number; max: number };
  water_demand: string;
  water_req_mm: { min: number; max: number };
  drought_tolerance: string;
  flood_tolerance: string;
  heat_tolerance: string;
  frost_sensitivity: string;
  nitrogen_fixation: { is_fixer: boolean; amount_class: string; kg_per_ha: number };
  root_depth: string;
  residue_organic_matter: string;
  erosion_protection: string;
  pest_break_family: string;
  market_class: string;
  forage_value: string;
  labour_equipment_needs: string;
  information_gaps: string[];
  source_notes: Record<string, string>;
}

export interface GlossaryTerm {
  term: string;
  category: string;
  short_definition: string;
  how_it_works: string;
  farmer_meaning: string;
  satellite_source: string;
  ground_difference: string;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchRegions(): Promise<RegionData> {
  const res = await fetch(`${API_BASE}/api/regions`);
  if (!res.ok) throw new Error(`Failed to fetch regions: ${res.statusText}`);
  return res.json();
}

export async function fetchCrops(): Promise<Crop[]> {
  const res = await fetch(`${API_BASE}/api/crops`);
  if (!res.ok) throw new Error(`Failed to fetch crops: ${res.statusText}`);
  return res.json();
}

export async function fetchGlossary(): Promise<GlossaryTerm[]> {
  const res = await fetch(`${API_BASE}/api/glossary`);
  if (!res.ok) throw new Error(`Failed to fetch glossary: ${res.statusText}`);
  return res.json();
}

export async function fetchConditions(
  lat: number,
  lon: number,
  start: string = '20230101',
  end: string = '20231231'
): Promise<ConditionsResponse> {
  const params = new URLSearchParams({
    lat: lat.toFixed(4),
    lon: lon.toFixed(4),
    start,
    end
  });
  const res = await fetch(`${API_BASE}/api/conditions?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch conditions: ${res.statusText}`);
  return res.json();
}

export interface FarmerPriorities {
  water_conservation: number;
  income: number;
  nitrogen_fixation: number;
  erosion_reduction: number;
  organic_matter: number;
  forage_value: number;
  low_labour: number;
}

export interface FarmerConstraints {
  irrigation: 'none' | 'limited' | 'reliable';
  equipment: 'manual' | 'small_tractor' | 'full';
  land_size_ha: number;
  flood_prone: boolean;
  market_access?: string;
}

export interface ScenarioDeltas {
  rainfall_change_pct: number;
  temp_change_c: number;
}

export interface CompareRequest {
  location?: { lat: number; lon: number };
  existing_rotation?: string;
  priorities?: Partial<FarmerPriorities>;
  constraints?: Partial<FarmerConstraints>;
  scenario?: Partial<ScenarioDeltas>;
  zone?: string;
}

export interface StrategySequenceItem {
  season: 'kharif' | 'rabi' | 'zaid';
  crop_id: string;
}

export interface StrategyCardData {
  id: string;
  name: string;
  strategy_type: string;
  is_baseline: boolean;
  composite_score: number;
  sequence: StrategySequenceItem[];
  why_suggested: string;
  evidence: string[];
  benefits: string[];
  information_gaps: string[];
  risks_needing_local_review: string[];
  confidence: {
    level: 'High' | 'Medium' | 'Low';
    explanation: string;
  };
  criteria_scores: {
    water_efficiency: number;
    drought_heat_resilience: number;
    flood_resilience: number;
    soil_health: number;
    erosion_reduction: number;
    pest_disruption: number;
    income_market: number;
    feasibility: number;
  };
  weights_used: Record<string, number>;
  support_not_replace_reminder: string;
}

export interface ComparisonMatrixRow {
  criterion: string;
  label: string;
  [strategyId: string]: string | number;
}

export interface CompareResponse {
  location: { lat: number; lon: number };
  scenario_applied: ScenarioDeltas;
  total_strategies: number;
  strategies: StrategyCardData[];
  comparison_matrix: ComparisonMatrixRow[];
  summary_insights: {
    top_recommendation: string;
    score_improvement_over_baseline: number;
    baseline_score: number;
    top_score: number;
  };
  provenance?: ProvenanceInfo[];
}

export async function compareRotations(req: CompareRequest): Promise<CompareResponse> {
  const res = await fetch(`${API_BASE}/api/compare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(req)
  });
  if (!res.ok) throw new Error(`Comparison calculation failed: ${res.statusText}`);
  return res.json();
}
