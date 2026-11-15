import React from 'react';
import { CloudRain, Thermometer, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { ScenarioDeltas } from '../lib/api';

interface ScenarioSlidersProps {
  scenario: ScenarioDeltas;
  onChange: (scenario: ScenarioDeltas) => void;
  onReset: () => void;
  isModified: boolean;
}

export const ScenarioSliders: React.FC<ScenarioSlidersProps> = ({
  scenario,
  onChange,
  onReset,
  isModified,
}) => {
  const handleRainChange = (val: number) => {
    onChange({
      ...scenario,
      rainfall_change_pct: val,
    });
  };

  const handleTempChange = (val: number) => {
    onChange({
      ...scenario,
      temp_change_c: val,
    });
  };

  // Interpretation helpers
  const getRainInterpretation = (val: number) => {
    if (val <= -20) return { label: 'Severe Drought Stress (-20% to -30%)', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    if (val < 0) return { label: 'Moderate Dry Spell (-5% to -15%)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    if (val === 0) return { label: 'Historical Climatology Baseline', color: 'text-slate-600 bg-slate-100 border-slate-200' };
    if (val <= 15) return { label: 'Favorable Wet Anomaly (+5% to +15%)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    return { label: 'Monsoon Surcharge / Waterlogging (+20% to +30%)', color: 'text-sky-700 bg-sky-50 border-sky-200' };
  };

  const getTempInterpretation = (val: number) => {
    if (val === 0) return { label: 'Observed Baseline Temperatures', color: 'text-slate-600 bg-slate-100 border-slate-200' };
    if (val <= 1.0) return { label: 'Mild Terminal Heat Increase (+1.0°C)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    if (val <= 2.0) return { label: 'Accelerated Grain Desiccation (+2.0°C)', color: 'text-orange-700 bg-orange-50 border-orange-200' };
    return { label: 'Severe Heatwave Stress (+3.0°C)', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  const rainInfo = getRainInterpretation(scenario.rainfall_change_pct);
  const tempInfo = getTempInterpretation(scenario.temp_change_c);

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 md:p-6 shadow-md border border-slate-800 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Thermometer className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <span>Climate Scenario Stress Testing</span>
              {isModified && (
                <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Simulation Active
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Dynamically shift environmental inputs to test rotation resilience against future climate shocks.
            </p>
          </div>
        </div>

        {isModified && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Reset to Climatology</span>
          </button>
        )}
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rainfall Delta */}
        <div className="flex flex-col gap-2 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-sky-400" />
              Precipitation Shift (Rainfall Delta)
            </span>
            <span
              className={`font-mono font-bold text-sm ${
                scenario.rainfall_change_pct > 0
                  ? 'text-sky-400'
                  : scenario.rainfall_change_pct < 0
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {scenario.rainfall_change_pct > 0 ? '+' : ''}
              {scenario.rainfall_change_pct}%
            </span>
          </div>

          <input
            type="range"
            min="-30"
            max="30"
            step="5"
            value={scenario.rainfall_change_pct}
            onChange={(e) => handleRainChange(parseInt(e.target.value))}
            className="w-full accent-sky-500 cursor-pointer h-2 bg-slate-700 rounded-lg appearance-none mt-1"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-medium">
            <span>-30% (Severe Drought)</span>
            <span>0% (Climatology)</span>
            <span>+30% (Excess Monsoon)</span>
          </div>

          <div
            className={`mt-1 text-[11px] px-2.5 py-1 rounded-md border font-medium flex items-center gap-1.5 ${rainInfo.color}`}
          >
            {scenario.rainfall_change_pct < 0 ? (
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
            )}
            <span>{rainInfo.label}</span>
          </div>
        </div>

        {/* Temperature Delta */}
        <div className="flex flex-col gap-2 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-rose-400" />
              Temperature Warming (+°C)
            </span>
            <span
              className={`font-mono font-bold text-sm ${
                scenario.temp_change_c > 0 ? 'text-rose-400' : 'text-slate-300'
              }`}
            >
              +{scenario.temp_change_c.toFixed(1)}°C
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="3.0"
            step="0.5"
            value={scenario.temp_change_c}
            onChange={(e) => handleTempChange(parseFloat(e.target.value))}
            className="w-full accent-rose-500 cursor-pointer h-2 bg-slate-700 rounded-lg appearance-none mt-1"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-medium">
            <span>+0.0°C (Current)</span>
            <span>+1.5°C (IPCC Mid)</span>
            <span>+3.0°C (High Warming)</span>
          </div>

          <div
            className={`mt-1 text-[11px] px-2.5 py-1 rounded-md border font-medium flex items-center gap-1.5 ${tempInfo.color}`}
          >
            {scenario.temp_change_c > 1.5 ? (
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
            )}
            <span>{tempInfo.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
