import React, { useState } from 'react';
import {
  Calendar,
  AlertTriangle,
  Sun,
  CloudRain,
  Flame,
  Snowflake,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import type { WeeklyRecord, DerivedIndicators } from '../lib/api';

interface Props {
  weeklyData?: WeeklyRecord[];
  indicators?: DerivedIndicators;
}

export const Timeline: React.FC<Props> = ({ weeklyData = [], indicators }) => {
  const [selectedWeek, setSelectedWeek] = useState<WeeklyRecord | null>(null);

  if (!weeklyData || weeklyData.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-slate-200 text-center text-slate-500">
        <Calendar className="w-8 h-8 mx-auto text-slate-400 mb-2" />
        <p className="text-sm font-medium">Harmonized seasonal timeline will appear here once location is loaded.</p>
      </div>
    );
  }

  const barePeriods = indicators?.bare_field_periods || [];
  const stressWindows = indicators?.stress_windows || [];
  const erosionProxy = indicators?.erosion_risk_proxy;

  // Active stress week sets for quick lookup
  const heatWeeks = new Set(stressWindows.find((s) => s.id === 'terminal_heat')?.weeks || []);
  const frostWeeks = new Set(stressWindows.find((s) => s.id === 'cold_wave')?.weeks || []);
  const floodWeeks = new Set(stressWindows.find((s) => s.id === 'waterlogging')?.weeks || []);
  const drySpellWeeks = new Set(stressWindows.find((s) => s.id === 'monsoon_break')?.weeks || []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 md:p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg md:text-xl font-bold text-slate-900">
              Seasonal Timeline: Bare-Field & Crop-Stress Windows
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            52-week harmonized agroclimatic cycle mapped across Kharif, Rabi, and Zaid seasons.
          </p>
        </div>

        {erosionProxy && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <div>
              <span className="font-semibold">Topsoil Erosion Risk: </span>
              <span className="font-bold text-amber-950 uppercase">{erosionProxy.rating}</span>
            </div>
          </div>
        )}
      </div>

      {/* Plain Language Summary Box */}
      {indicators?.plain_language_summary && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl p-4 text-amber-950 text-xs md:text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Agroclimatic Diagnosis:</span>
            <p className="text-amber-900 leading-relaxed">
              {indicators.plain_language_summary}
            </p>
          </div>
        </div>
      )}

      {/* Seasonal Bands Bar (Kharif, Rabi, Zaid) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>Seasonal Cropping Bands</span>
          <span className="text-[11px] text-slate-400 font-normal">Click any week to inspect details</span>
        </div>

        {/* 52-Week Visual Grid */}
        <div className="relative pt-6 pb-2">
          {/* Season Labels Header */}
          <div className="absolute top-0 inset-x-0 grid grid-cols-12 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
            <div className="col-span-3 text-sky-700 bg-sky-50 py-0.5 rounded-l border border-sky-100">
              Rabi (Jan-Mar)
            </div>
            <div className="col-span-3 text-amber-700 bg-amber-50 py-0.5 border border-amber-100">
              Zaid (Summer Fallow)
            </div>
            <div className="col-span-4 text-emerald-700 bg-emerald-50 py-0.5 border border-emerald-100">
              Kharif (Monsoon)
            </div>
            <div className="col-span-2 text-sky-700 bg-sky-50 py-0.5 rounded-r border border-sky-100">
              Rabi (Nov-Dec)
            </div>
          </div>

          {/* 52 Segment Bars */}
          <div className="grid grid-cols-52 gap-[2px] h-10 bg-slate-100 rounded-lg p-1 border border-slate-200 mt-2">
            {weeklyData.map((w) => {
              const isBare = w.season === 'zaid';
              const isHeat = heatWeeks.has(w.week_number);
              const isFrost = frostWeeks.has(w.week_number);
              const isFlood = floodWeeks.has(w.week_number);
              const isSelected = selectedWeek?.week_number === w.week_number;

              let bgClass = 'bg-slate-300';
              if (isHeat) bgClass = 'bg-rose-500 hover:bg-rose-600';
              else if (isFrost) bgClass = 'bg-sky-400 hover:bg-sky-500';
              else if (isFlood) bgClass = 'bg-indigo-500 hover:bg-indigo-600';
              else if (drySpellWeeks.has(w.week_number)) bgClass = 'bg-amber-600 hover:bg-amber-700';
              else if (isBare) bgClass = 'bg-amber-400 hover:bg-amber-500';
              else if (w.season === 'kharif') bgClass = 'bg-emerald-500 hover:bg-emerald-600';
              else if (w.season === 'rabi') bgClass = 'bg-teal-500 hover:bg-teal-600';

              return (
                <button
                  key={w.week_number}
                  onClick={() => setSelectedWeek(w)}
                  title={`Week ${w.week_number} (${w.season_label}): ${w.start_date}`}
                  className={`h-full rounded-xs transition-all relative ${bgClass} ${
                    isSelected ? 'ring-2 ring-slate-900 scale-110 z-10' : ''
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 pt-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-amber-400"></span>
              <span>Bare Field (Zaid Fallow)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-rose-500"></span>
              <span>Terminal Heat Risk (Wheat)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-sky-400"></span>
              <span>Frost / Cold Wave</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-indigo-500"></span>
              <span>Flood / Waterlogging Risk</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500"></span>
              <span>Active Vegetative Canopy</span>
            </span>
          </div>
        </div>
      </div>

      {/* Selected Week Detail Card */}
      {selectedWeek && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in">
          <div>
            <span className="text-slate-500 block">Selected Period:</span>
            <span className="font-bold text-slate-800 text-sm">
              Week {selectedWeek.week_number} ({selectedWeek.season_label})
            </span>
            <span className="text-[11px] text-slate-500 block">{selectedWeek.start_date}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Temperatures:</span>
            <span className="font-semibold text-slate-800">
              {selectedWeek.tmin}°C to {selectedWeek.tmax}°C
            </span>
            <span className="text-[11px] text-slate-500 block">Mean: {selectedWeek.tmean}°C</span>
          </div>
          <div>
            <span className="text-slate-500 block">Rainfall vs. ET0:</span>
            <span className="font-semibold text-blue-700">
              {selectedWeek.precipitation_mm} mm rain
            </span>
            <span className="text-[11px] text-slate-500 block">ET0: {selectedWeek.reference_et0_mm} mm</span>
          </div>
          <div>
            <span className="text-slate-500 block">Water Balance:</span>
            <span
              className={`font-bold text-sm ${
                selectedWeek.water_balance_mm >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {selectedWeek.water_balance_mm > 0 ? '+' : ''}
              {selectedWeek.water_balance_mm} mm
            </span>
            <span className="text-[11px] text-slate-500 block">
              {selectedWeek.water_balance_mm >= 0 ? 'Moisture Surplus' : 'Deficit (P < ET0)'}
            </span>
          </div>
        </div>
      )}

      {/* Water Balance Chart (P - ET0) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>Weekly Water Balance Proxy (Rainfall P – Reference ET0)</span>
          <span className="text-[11px] text-slate-500 font-normal">Positive = Surplus (recharge/runoff); Negative = Deficit</span>
        </div>

        <div className="w-full h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={weeklyData} margin={{ top: 10, right: 10, bottom: 20, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week_number" stroke="#94a3b8" fontSize={10} unit="w" />
              <YAxis unit=" mm" stroke="#94a3b8" fontSize={10} />
              <Tooltip
                formatter={(val: any, name: any) => [`${val} mm`, name]}
                labelFormatter={(w: any) => `Calendar Week ${w}`}
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px' }}
              />
              <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />
              <Bar dataKey="water_balance_mm" name="Water Balance (P - ET0)" fill="#3b82f6" />
              <Line type="monotone" dataKey="reference_et0_mm" name="Reference ET0 (Demand)" stroke="#f97316" dot={false} strokeWidth={1.5} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detected Hazard Windows Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100">
        {barePeriods.map((bp, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/60 transition flex flex-col justify-between text-xs"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-600" />
                  Bare-Field Window ({bp.season_label})
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                  {bp.consecutive_weeks} Weeks Bare
                </span>
              </div>
              <p className="text-amber-800 font-medium mb-1.5">{bp.calendar_range}</p>
              <p className="text-slate-700 mb-2 leading-relaxed">{bp.description}</p>
              <div className="bg-white/80 p-2 rounded-lg border border-amber-200/60 text-slate-700 mb-2">
                <span className="font-semibold text-amber-950">Vulnerabilities: </span>
                <ul className="list-disc list-inside space-y-0.5 mt-1 text-[11px] text-slate-600">
                  {bp.consequences.map((c, cIdx) => (
                    <li key={cIdx}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-start gap-1.5 text-emerald-800 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>Recommended Action: {bp.solution}</span>
            </div>
          </div>
        ))}

        {stressWindows.map((sw) => (
          <div
            key={sw.id}
            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition flex flex-col justify-between text-xs"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  {sw.id === 'terminal_heat' && <Flame className="w-4 h-4 text-rose-600" />}
                  {sw.id === 'cold_wave' && <Snowflake className="w-4 h-4 text-sky-600" />}
                  {sw.id === 'waterlogging' && <CloudRain className="w-4 h-4 text-indigo-600" />}
                  {sw.id === 'monsoon_break' && <Sun className="w-4 h-4 text-amber-600" />}
                  {sw.hazard}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    sw.severity === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {sw.severity} Risk
                </span>
              </div>
              <p className="text-slate-500 font-medium mb-1.5">{sw.period}</p>
              <p className="text-slate-600 mb-2 leading-relaxed">{sw.description}</p>
              <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60 text-slate-700">
                <span className="font-semibold text-slate-900">Crop Impact: </span>
                <span>{sw.impact}</span>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-start gap-1.5 text-emerald-800 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>Mitigation: {sw.agronomic_advice}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
