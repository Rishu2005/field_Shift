import React from 'react';
import {
  Sliders,
  Droplets,
  DollarSign,
  Sprout,
  ShieldAlert,
  Sparkles,
  Tractor,
  Layers,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import type { FarmerPriorities, FarmerConstraints } from '../lib/api';

interface PriorityFormProps {
  priorities: FarmerPriorities;
  constraints: FarmerConstraints;
  existingRotation: string;
  onPrioritiesChange: (p: FarmerPriorities) => void;
  onConstraintsChange: (c: FarmerConstraints) => void;
  onExistingRotationChange: (r: string) => void;
  onReset: () => void;
  loading?: boolean;
}

export const BIHAR_ROTATION_PRESETS = [
  { id: 'rice-wheat', label: 'Rice – Wheat (धान – गेहूं)', desc: 'Dominant staple rotation across Indo-Gangetic Plains' },
  { id: 'rice-maize', label: 'Rice – Winter Rabi Maize (धान – रबी मक्का)', desc: 'High yield & silage potential in North Bihar' },
  { id: 'rice-lentil', label: 'Rice – Lentil / Paira (धान – मसूर)', desc: 'Low-water pulse rotation in South Bihar' },
  { id: 'rice-mustard', label: 'Rice – Mustard (धान – सरसों)', desc: 'Short-duration oilseed rotation before heat onset' },
  { id: 'rice-wheat-moong', label: 'Rice – Wheat – Summer Moong (धान – गेहूं – मूँग)', desc: 'Triple-cropping with 60-day summer pulse' },
  { id: 'sesbania-rice-lentil', label: 'Dhaincha – Rice – Lentil (ढैंचा – धान – मसूर)', desc: 'Green manure bio-fertilization & low groundwater draft' },
  { id: 'makhana-wheat', label: 'Makhana – Wheat (मखाना – गेहूं)', desc: 'Wetland superfood cropping in Mithila/Kosi basin' },
];

export const PriorityForm: React.FC<PriorityFormProps> = ({
  priorities,
  constraints,
  existingRotation,
  onPrioritiesChange,
  onConstraintsChange,
  onExistingRotationChange,
  onReset,
  loading = false,
}) => {
  const handleSliderChange = (key: keyof FarmerPriorities, val: number) => {
    onPrioritiesChange({
      ...priorities,
      [key]: val / 100, // convert 0-100 to 0.0-1.0
    });
  };

  const handleConstraintChange = <K extends keyof FarmerConstraints>(
    key: K,
    val: FarmerConstraints[K]
  ) => {
    onConstraintsChange({
      ...constraints,
      [key]: val,
    });
  };

  const applyPreset = (presetType: 'water' | 'income' | 'soil' | 'flood') => {
    if (presetType === 'water') {
      onPrioritiesChange({
        water_conservation: 1.0,
        income: 0.6,
        nitrogen_fixation: 0.8,
        erosion_reduction: 0.7,
        organic_matter: 0.8,
        forage_value: 0.3,
        low_labour: 0.5,
      });
      onConstraintsChange({
        ...constraints,
        irrigation: 'limited',
      });
    } else if (presetType === 'income') {
      onPrioritiesChange({
        water_conservation: 0.5,
        income: 1.0,
        nitrogen_fixation: 0.4,
        erosion_reduction: 0.4,
        organic_matter: 0.5,
        forage_value: 0.6,
        low_labour: 0.8,
      });
    } else if (presetType === 'soil') {
      onPrioritiesChange({
        water_conservation: 0.7,
        income: 0.5,
        nitrogen_fixation: 1.0,
        erosion_reduction: 0.9,
        organic_matter: 1.0,
        forage_value: 0.4,
        low_labour: 0.4,
      });
    } else if (presetType === 'flood') {
      onPrioritiesChange({
        water_conservation: 0.4,
        income: 0.8,
        nitrogen_fixation: 0.7,
        erosion_reduction: 0.8,
        organic_matter: 0.7,
        forage_value: 0.5,
        low_labour: 0.5,
      });
      onConstraintsChange({
        ...constraints,
        flood_prone: true,
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-emerald-700" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Farmer Profile & Decision Priorities
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 2.1 Rule: Environmental data modifies criterion scores, but never overrides your priorities.
          </p>
        </div>

        {/* Quick Presets & Reset */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-medium mr-1">Presets:</span>
          <button
            type="button"
            onClick={() => applyPreset('water')}
            className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition cursor-pointer"
          >
            💧 Water-Smart
          </button>
          <button
            type="button"
            onClick={() => applyPreset('soil')}
            className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
          >
            🌱 Soil Health
          </button>
          <button
            type="button"
            onClick={() => applyPreset('income')}
            className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
          >
            💰 Max Income
          </button>
          <button
            type="button"
            onClick={onReset}
            title="Reset to default settings"
            className="text-[11px] font-medium p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Baseline Rotation & Constraints (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* 1. Existing Rotation Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1. Current Baseline Cropping System
            </label>
            <select
              value={existingRotation}
              onChange={(e) => onExistingRotationChange(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            >
              {BIHAR_ROTATION_PRESETS.map((rot) => (
                <option key={rot.id} value={rot.id}>
                  {rot.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1 italic">
              {BIHAR_ROTATION_PRESETS.find((r) => r.id === existingRotation)?.desc || 'Custom rotation sequence'}
            </p>
          </div>

          {/* 2. Farm Constraints */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Tractor className="w-3.5 h-3.5 text-slate-600" />
              <span>Farm Constraints & Capabilities</span>
            </div>

            {/* Irrigation Access */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Irrigation Availability</span>
                <span className="text-emerald-700 capitalize font-medium">
                  {constraints.irrigation === 'none'
                    ? 'Rainfed only'
                    : constraints.irrigation === 'limited'
                    ? 'Limited (1–2 tubewell rounds)'
                    : 'Reliable (Perennial/Canal)'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['none', 'limited', 'reliable'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleConstraintChange('irrigation', mode)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition cursor-pointer capitalize ${
                      constraints.irrigation === mode
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {mode === 'none' ? 'Rainfed' : mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Equipment Access */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Equipment & Machinery</span>
                <span className="text-emerald-700 capitalize font-medium">
                  {constraints.equipment === 'manual'
                    ? 'Manual / Bullock'
                    : constraints.equipment === 'small_tractor'
                    ? 'Small Tractor / Rotavator'
                    : 'Full Modern Machinery'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['manual', 'small_tractor', 'full'] as const).map((eq) => (
                  <button
                    key={eq}
                    type="button"
                    onClick={() => handleConstraintChange('equipment', eq)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition cursor-pointer capitalize ${
                      constraints.equipment === eq
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {eq === 'small_tractor' ? 'Small Tractor' : eq}
                  </button>
                ))}
              </div>
            </div>

            {/* Land Size & Flood Prone Row */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Plot Area (Hectares)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    max="50"
                    step="0.5"
                    value={constraints.land_size_ha}
                    onChange={(e) =>
                      handleConstraintChange('land_size_ha', parseFloat(e.target.value) || 1.0)
                    }
                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-2.5 top-1.5 text-[11px] text-slate-400 font-medium">
                    ha
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Flood Prone Land
                </label>
                <button
                  type="button"
                  onClick={() => handleConstraintChange('flood_prone', !constraints.flood_prone)}
                  className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center justify-between ${
                    constraints.flood_prone
                      ? 'bg-sky-100 text-sky-800 border-sky-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{constraints.flood_prone ? '🌊 Yes (Prone)' : '🛡️ No (Upland)'}</span>
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      constraints.flood_prone ? 'text-sky-600' : 'text-slate-300'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Farmer Priority Sliders (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Weight Your Priorities (Normalized 0 – 100%)</span>
            </span>
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <HelpCircle className="w-3 h-3" />
              Drives 8-criterion ranking
            </span>
          </div>

          <div className="space-y-3.5 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
            {/* Water Conservation */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-600" />
                  Conserve Groundwater / Water Efficiency
                </span>
                <span className="font-bold text-sky-700 text-xs">
                  {Math.round(priorities.water_conservation * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={Math.round(priorities.water_conservation * 100)}
                onChange={(e) => handleSliderChange('water_conservation', parseInt(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
              />
            </div>

            {/* Supplemental Income */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                  Supplemental Farm Income & Marketability
                </span>
                <span className="font-bold text-amber-700 text-xs">
                  {Math.round(priorities.income * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={Math.round(priorities.income * 100)}
                onChange={(e) => handleSliderChange('income', parseInt(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
              />
            </div>

            {/* Nitrogen Fixation */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                  Biological Nitrogen Fixation (Reduce Urea)
                </span>
                <span className="font-bold text-emerald-700 text-xs">
                  {Math.round(priorities.nitrogen_fixation * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={Math.round(priorities.nitrogen_fixation * 100)}
                onChange={(e) => handleSliderChange('nitrogen_fixation', parseInt(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
              />
            </div>

            {/* Organic Matter */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-600" />
                  Soil Organic Matter & Residue Return
                </span>
                <span className="font-bold text-teal-700 text-xs">
                  {Math.round(priorities.organic_matter * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={Math.round(priorities.organic_matter * 100)}
                onChange={(e) => handleSliderChange('organic_matter', parseInt(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
              />
            </div>

            {/* Erosion Reduction */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
                  Erosion Reduction & Summer Soil Shielding
                </span>
                <span className="font-bold text-indigo-700 text-xs">
                  {Math.round(priorities.erosion_reduction * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={Math.round(priorities.erosion_reduction * 100)}
                onChange={(e) => handleSliderChange('erosion_reduction', parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
              />
            </div>

            {/* Low Labour */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Tractor className="w-3.5 h-3.5 text-slate-600" />
                  Low Labour & Easy Equipment Fit
                </span>
                <span className="font-bold text-slate-700 text-xs">
                  {Math.round(priorities.low_labour * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={Math.round(priorities.low_labour * 100)}
                onChange={(e) => handleSliderChange('low_labour', parseInt(e.target.value))}
                className="w-full accent-slate-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
              />
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 py-2 rounded-lg animate-pulse">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>Recalculating multi-strategy comparison...</span>
        </div>
      )}
    </div>
  );
};
