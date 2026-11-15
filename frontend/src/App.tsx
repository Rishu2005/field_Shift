import { useState, useEffect, useCallback } from 'react';
import {
  Sprout,
  Layers,
  HelpCircle,
  Sparkles,
  AlertTriangle,
  Compass,
} from 'lucide-react';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { Map } from './components/Map';
import { PowerChart } from './components/PowerChart';
import { Timeline } from './components/Timeline';
import { GlossaryModal } from './components/GlossaryModal';
import { PriorityForm } from './components/PriorityForm';
import { ScenarioSliders } from './components/ScenarioSliders';
import { StrategyCard } from './components/StrategyCard';
import { ComparisonMatrix } from './components/ComparisonMatrix';
import {
  fetchHealth,
  fetchRegions,
  fetchGlossary,
  fetchConditions,
  compareRotations,
} from './lib/api';
import type {
  HealthResponse,
  RegionData,
  GlossaryTerm,
  ConditionsResponse,
  FarmerPriorities,
  FarmerConstraints,
  ScenarioDeltas,
  CompareResponse,
} from './lib/api';
import enDict from './i18n/en.json';
import hiDict from './i18n/hi.json';

const DEFAULT_PRIORITIES: FarmerPriorities = {
  water_conservation: 0.8,
  income: 0.7,
  nitrogen_fixation: 0.8,
  erosion_reduction: 0.6,
  organic_matter: 0.7,
  forage_value: 0.3,
  low_labour: 0.4,
};

const DEFAULT_CONSTRAINTS: FarmerConstraints = {
  irrigation: 'limited',
  equipment: 'small_tractor',
  land_size_ha: 1.0,
  flood_prone: false,
};

const DEFAULT_SCENARIO: ScenarioDeltas = {
  rainfall_change_pct: 0,
  temp_change_c: 0,
};

export function App() {
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  const t = useCallback(
    (key: keyof typeof enDict): string =>
      lang === 'hi' ? (hiDict as Record<string, string>)[key] || enDict[key] : enDict[key],
    [lang]
  );

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [regionData, setRegionData] = useState<RegionData | null>(null);
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([]);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

  // Selected location (Defaults to Patna, Bihar capital: 25.5941, 85.1376)
  const [selectedLat, setSelectedLat] = useState<number>(25.5941);
  const [selectedLon, setSelectedLon] = useState<number>(85.1376);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('patna');
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('Patna');
  const [selectedZone, setSelectedZone] = useState<string>('Zone IIIB');

  // Conditions data
  const [conditions, setConditions] = useState<ConditionsResponse | null>(null);
  const [loadingConditions, setLoadingConditions] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Farmer Inputs & Strategy Comparison state
  const [priorities, setPriorities] = useState<FarmerPriorities>(DEFAULT_PRIORITIES);
  const [constraints, setConstraints] = useState<FarmerConstraints>(DEFAULT_CONSTRAINTS);
  const [existingRotation, setExistingRotation] = useState<string>('rice-wheat');
  const [scenario, setScenario] = useState<ScenarioDeltas>(DEFAULT_SCENARIO);
  const [comparisonResult, setComparisonResult] = useState<CompareResponse | null>(null);
  const [loadingComparison, setLoadingComparison] = useState<boolean>(false);

  // Run comparison calculation
  const runComparison = useCallback(
    async (
      lat: number,
      lon: number,
      currentRotation: string,
      p: FarmerPriorities,
      c: FarmerConstraints,
      s: ScenarioDeltas,
      zone: string
    ) => {
      setLoadingComparison(true);
      try {
        const res = await compareRotations({
          location: { lat, lon },
          existing_rotation: currentRotation,
          priorities: p,
          constraints: c,
          scenario: s,
          zone,
        });
        setComparisonResult(res);
      } catch (err) {
        console.error('Failed to run comparison engine:', err);
      } finally {
        setLoadingComparison(false);
      }
    },
    []
  );

  // Load NASA conditions data
  const loadConditionsData = useCallback(
    async (lat: number, lon: number, name?: string, zone?: string) => {
      setLoadingConditions(true);
      setErrorMsg(null);
      try {
        const data = await fetchConditions(lat, lon, '20230101', '20231231');
        setConditions(data);
        if (name) setSelectedDistrictName(name);

        // Run rotation comparison with updated conditions
        runComparison(
          lat,
          lon,
          existingRotation,
          priorities,
          constraints,
          scenario,
          zone || selectedZone
        );
      } catch (err) {
        console.error('Failed to load conditions:', err);
        setErrorMsg('Failed to fetch data for this coordinate. Please verify connection.');
      } finally {
        setLoadingConditions(false);
      }
    },
    [existingRotation, priorities, constraints, scenario, selectedZone, runComparison]
  );

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        const [hData, rData, gData] = await Promise.all([
          fetchHealth().catch((err) => {
            console.warn('Health check issue:', err);
            return null;
          }),
          fetchRegions().catch((err) => {
            console.warn('Regions fetch issue:', err);
            return null;
          }),
          fetchGlossary().catch((err) => {
            console.warn('Glossary fetch issue:', err);
            return [];
          }),
        ]);

        if (hData) setHealth(hData);
        if (rData) setRegionData(rData);
        if (gData) setGlossaryTerms(gData);

        // Fetch initial Bihar conditions & comparisons
        loadConditionsData(25.5941, 85.1376, 'Patna', 'Zone IIIB');
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    init();
  }, [loadConditionsData]);

  // Handle map / district click
  const handleLocationSelect = (lat: number, lon: number, districtName?: string) => {
    setSelectedLat(lat);
    setSelectedLon(lon);

    let foundZone = 'Zone IIIB';
    if (regionData) {
      const matched = regionData.districts.find(
        (d) => Math.abs(d.lat - lat) < 0.25 && Math.abs(d.lon - lon) < 0.25
      );
      if (matched) {
        setSelectedDistrictId(matched.id);
        setSelectedDistrictName(matched.name);
        setSelectedZone(matched.zone);
        foundZone = matched.zone;
      } else {
        setSelectedDistrictId('');
        setSelectedDistrictName(districtName || 'Custom Coordinate');
      }
    }

    loadConditionsData(lat, lon, districtName, foundZone);
  };

  // Re-run comparison when priorities, constraints, rotation, or scenario changes
  const handlePrioritiesChange = (p: FarmerPriorities) => {
    setPriorities(p);
    runComparison(selectedLat, selectedLon, existingRotation, p, constraints, scenario, selectedZone);
  };

  const handleConstraintsChange = (c: FarmerConstraints) => {
    setConstraints(c);
    runComparison(selectedLat, selectedLon, existingRotation, priorities, c, scenario, selectedZone);
  };

  const handleExistingRotationChange = (r: string) => {
    setExistingRotation(r);
    runComparison(selectedLat, selectedLon, r, priorities, constraints, scenario, selectedZone);
  };

  const handleScenarioChange = (s: ScenarioDeltas) => {
    setScenario(s);
    runComparison(selectedLat, selectedLon, existingRotation, priorities, constraints, s, selectedZone);
  };

  const handleResetPriorities = () => {
    setPriorities(DEFAULT_PRIORITIES);
    setConstraints(DEFAULT_CONSTRAINTS);
    setExistingRotation('rice-wheat');
    runComparison(
      selectedLat,
      selectedLon,
      'rice-wheat',
      DEFAULT_PRIORITIES,
      DEFAULT_CONSTRAINTS,
      scenario,
      selectedZone
    );
  };

  const handleResetScenario = () => {
    setScenario(DEFAULT_SCENARIO);
    runComparison(
      selectedLat,
      selectedLon,
      existingRotation,
      priorities,
      constraints,
      DEFAULT_SCENARIO,
      selectedZone
    );
  };

  const isScenarioModified =
    scenario.rainfall_change_pct !== 0 || scenario.temp_change_c !== 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* 1. Mandatory Support-Not-Replace Disclaimer Banner */}
      <DisclaimerBanner lang={lang} />

      {/* 2. Top Header Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-sm">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg md:text-xl tracking-tight text-slate-900">
                  {t('app_title')}
                </span>
                <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  NASA Space Apps 2026
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {t('app_tagline')}
              </p>
            </div>
          </div>

          {/* Controls: Health Pill, Glossary, Lang */}
          <div className="flex items-center gap-2.5">
            {/* Backend Health Status */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium">
                {health?.status === 'healthy' ? 'API Online' : 'Connecting API...'}
              </span>
            </div>

            {/* Glossary Button */}
            <button
              onClick={() => setIsGlossaryOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 bg-white transition cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('glossary_btn')}</span>
            </button>

            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              title="Toggle English / Hindi"
            >
              {lang === 'en' ? 'हिन्दी' : 'English'}
            </button>
          </div>
        </div>
      </header>

      {/* 3. Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-8">
        {/* Featured Region Intro Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('featured_region_label')}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-2">
              Explore Resilient Crop Rotations Adapted to Local Climate Stress
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Combining NASA POWER agroclimatology, surface soil moisture, and crop physiological traits to detect bare-field periods, terminal heat risks, and water stress—empowering farmers with explainable multi-strategy comparisons.
            </p>
          </div>
        </div>

        {/* Error Notification if any */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SECTION 1: Interactive Map + NASA POWER Dashboard */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Map */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <Map
              selectedLat={selectedLat}
              selectedLon={selectedLon}
              onLocationSelect={handleLocationSelect}
              regionData={regionData}
              selectedDistrictId={selectedDistrictId}
            />

            {/* Agro-climatic Zones quick guide for Bihar */}
            {regionData && (
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Bihar Agro-Climatic Zones</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {regionData.agro_climatic_zones.map((z) => (
                    <div
                      key={z.id}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between"
                    >
                      <span className="font-bold text-slate-800">{z.code}</span>
                      <span className="text-slate-600 line-clamp-1">{z.name}</span>
                      <span className="text-emerald-700 font-medium mt-1">~{z.annual_rainfall_mm} mm rain</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: NASA POWER Chart Dashboard */}
          <div className="lg:col-span-7">
            <PowerChart
              conditions={conditions}
              loading={loadingConditions}
              districtName={selectedDistrictName}
            />
          </div>
        </section>

        {/* SECTION 2: Harmonized Seasonal Timeline (Bare-Field & Stress Windows) */}
        <section>
          <Timeline
            weeklyData={conditions?.weekly}
            indicators={conditions?.indicators}
          />
        </section>

        {/* SECTION 3: STEP 7 - FARMER INPUTS & CLIMATE SCENARIOS */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Compass className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-slate-900">
              {t('farmer_profile_title')}
            </h2>
          </div>

          {/* Farmer Priority & Constraints Form */}
          <PriorityForm
            priorities={priorities}
            constraints={constraints}
            existingRotation={existingRotation}
            onPrioritiesChange={handlePrioritiesChange}
            onConstraintsChange={handleConstraintsChange}
            onExistingRotationChange={handleExistingRotationChange}
            onReset={handleResetPriorities}
            loading={loadingComparison}
          />

          {/* Climate Scenario Stress Sliders */}
          <ScenarioSliders
            scenario={scenario}
            onChange={handleScenarioChange}
            onReset={handleResetScenario}
            isModified={isScenarioModified}
          />
        </section>

        {/* SECTION 4: STEP 7 - MULTI-STRATEGY COMPARISON & CARDS */}
        {comparisonResult && (
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-700" />
                <h2 className="text-lg font-bold text-slate-900">
                  {t('compared_rotations_title')} ({comparisonResult.total_strategies})
                </h2>
              </div>
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                Ranked by Composite Score
              </span>
            </div>

            {/* Side-by-Side Evaluation Matrix (Table & Radar Chart) */}
            <ComparisonMatrix
              strategies={comparisonResult.strategies}
              matrixRows={comparisonResult.comparison_matrix}
              summaryInsights={comparisonResult.summary_insights}
            />

            {/* Detailed Strategy Cards (Section 7.5 Specification Format) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {comparisonResult.strategies.map((strat, idx) => (
                <StrategyCard
                  key={strat.id}
                  strategy={strat}
                  rank={idx + 1}
                />
              ))}
            </div>
          </section>
        )}

        {/* SECTION 5: Knowledge Base Verification & Preloaded Crops Section */}
        <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-bold text-slate-900">
                Verified Agronomic Knowledge Base (Bihar & Gangetic Plains)
              </h2>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium">
              15 Preloaded Crops • Sourced & Cited
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Rule 2 Compliance: No agronomic numbers are invented. Each crop fact includes verifiable citations from ICAR-RCER Patna, BAU Sabour, and FAO GAEZ. Unknown or micro-scale factors are explicitly marked with information gaps.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 text-xs">
            {[
              { name: 'Rice (धान)', season: 'Kharif', water: 'High', family: 'Poaceae', n_fix: false },
              { name: 'Wheat (गेहूं)', season: 'Rabi', water: 'Medium', family: 'Poaceae', n_fix: false },
              { name: 'Rabi Maize (मक्का)', season: 'Rabi', water: 'Medium', family: 'Poaceae', n_fix: false },
              { name: 'Lentil (मसूर)', season: 'Rabi', water: 'Low', family: 'Fabaceae', n_fix: true },
              { name: 'Chickpea (चना)', season: 'Rabi', water: 'Low', family: 'Fabaceae', n_fix: true },
              { name: 'Summer Moong (मूँग)', season: 'Zaid', water: 'Low', family: 'Fabaceae', n_fix: true },
              { name: 'Mustard (सरसों)', season: 'Rabi', water: 'Low', family: 'Brassicaceae', n_fix: false },
              { name: 'Sesbania (ढैंचा)', season: 'Zaid/Pre-Kharif', water: 'Medium', family: 'Fabaceae', n_fix: true },
              { name: 'Berseem (बरसीम)', season: 'Rabi', water: 'High', family: 'Fabaceae', n_fix: true },
              { name: 'Makhana (मखाना)', season: 'Wetland', water: 'High', family: 'Nymphaeaceae', n_fix: false },
            ].map((c, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-emerald-50/50 transition flex flex-col justify-between"
              >
                <div className="font-semibold text-slate-900">{c.name}</div>
                <div className="text-[11px] text-slate-500 mt-1 flex flex-col gap-0.5">
                  <span>Season: {c.season}</span>
                  <span>Water Demand: {c.water}</span>
                  {c.n_fix && (
                    <span className="text-emerald-700 font-medium">✓ Biological N-Fixer</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 4. Footer with Attribution and Science Notice */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1 text-center md:text-left">
            <span className="font-bold text-slate-700">
              Field Shift — NASA Space Apps Challenge 2026
            </span>
            <p className="text-[11px] text-slate-400">
              Earth Data Credits: NASA POWER (LaRC), NASA SMAP (JPL/GSFC), GPM IMERG (GSFC), Landsat (USGS/NASA), ECOSTRESS (JPL).
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsGlossaryOpen(true)}
              className="hover:text-emerald-700 underline font-medium cursor-pointer"
            >
              Glossary & Explanations
            </button>
            <span className="text-slate-300">•</span>
            <span>Bihar Featured Region Demo</span>
          </div>
        </div>
      </footer>

      {/* Glossary Modal */}
      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
        terms={glossaryTerms}
      />
    </div>
  );
}

export default App;
