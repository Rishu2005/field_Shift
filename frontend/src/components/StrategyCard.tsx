import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  TrendingUp,
  Droplets,
  Calendar,
  Layers,
  FileQuestion,
  UserCheck,
} from 'lucide-react';
import type { StrategyCardData } from '../lib/api';

interface StrategyCardProps {
  strategy: StrategyCardData;
  rank: number;
}

const CROP_ICONS: Record<string, string> = {
  rice: '🌾',
  wheat: '🍞',
  maize: '🌽',
  lentil: '🥣',
  chickpea: '🧆',
  mungbean: '🌱',
  mustard: '🌼',
  sesbania: '🌿',
  berseem: '☘️',
  makhana: '🪷',
  pigeonpea: '🍲',
  potato: '🥔',
  sunflower: '🌻',
  jute: '🧵',
  fallow: '🪵',
};

const CROP_NAMES: Record<string, string> = {
  rice: 'Kharif Rice (धान)',
  wheat: 'Rabi Wheat (गेहूं)',
  maize: 'Rabi / Kharif Maize (मक्का)',
  lentil: 'Lentil (मसूर)',
  chickpea: 'Gram (चना)',
  mungbean: 'Summer Moong (मूँग)',
  mustard: 'Mustard (सरसों)',
  sesbania: 'Dhaincha Green Manure (ढैंचा)',
  berseem: 'Berseem Clover (बरसीम)',
  makhana: 'Foxnut (मखाना)',
  pigeonpea: 'Arhar / Tur (अरहर)',
  potato: 'Potato (आलू)',
  sunflower: 'Sunflower (सूरजमुखी)',
  jute: 'Jute (पटसन)',
  fallow: 'Bare Soil (खाली खेत)',
};

const CRITERIA_METRICS: Array<{ key: keyof StrategyCardData['criteria_scores']; label: string; icon: string }> = [
  { key: 'water_efficiency', label: 'Water Efficiency', icon: '💧' },
  { key: 'drought_heat_resilience', label: 'Drought & Heat Resilience', icon: '☀️' },
  { key: 'flood_resilience', label: 'Flood Resilience', icon: '🌊' },
  { key: 'soil_health', label: 'Soil Health & N-Fixation', icon: '🌱' },
  { key: 'erosion_reduction', label: 'Erosion Reduction', icon: '🛡️' },
  { key: 'pest_disruption', label: 'Pest Cycle Disruption', icon: '🔄' },
  { key: 'income_market', label: 'Income & Market Return', icon: '💰' },
  { key: 'feasibility', label: 'Farm Equipment Feasibility', icon: '🚜' },
];

export const StrategyCard: React.FC<StrategyCardProps> = ({
  strategy,
  rank,
}) => {
  const [showScoreDetails, setShowScoreDetails] = useState(false);
  const [showGaps, setShowGaps] = useState(false);

  const isBaseline = strategy.is_baseline;
  const score = Math.round(strategy.composite_score);

  // Confidence badge color
  const getConfidenceBadge = (level: 'High' | 'Medium' | 'Low') => {
    if (level === 'High') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    if (level === 'Medium') {
      return 'bg-amber-100 text-amber-800 border-amber-300';
    }
    return 'bg-rose-100 text-rose-800 border-rose-300';
  };

  const getScoreColor = (val: number) => {
    if (val >= 75) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (val >= 60) return 'text-sky-700 bg-sky-50 border-sky-200';
    if (val >= 45) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  return (
    <div
      className={`rounded-2xl border transition shadow-xs flex flex-col overflow-hidden bg-white ${
        isBaseline
          ? 'border-slate-300 ring-1 ring-slate-200'
          : rank === 1
          ? 'border-emerald-400 ring-2 ring-emerald-300/40 shadow-sm'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top Banner / Tag */}
      <div
        className={`px-5 py-3 border-b flex items-center justify-between text-xs ${
          isBaseline
            ? 'bg-slate-100/80 border-slate-200 text-slate-700'
            : rank === 1
            ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-200 text-emerald-900'
            : 'bg-slate-50/70 border-slate-200 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-2">
          {isBaseline ? (
            <span className="font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 text-[11px]">
              Current Baseline System
            </span>
          ) : (
            <span
              className={`font-bold px-2.5 py-0.5 rounded-md text-[11px] flex items-center gap-1 ${
                rank === 1
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-800'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Rank #{rank} • {strategy.strategy_type}</span>
            </span>
          )}
        </div>

        {/* Confidence Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${getConfidenceBadge(
              strategy.confidence.level
            )}`}
            title={strategy.confidence.explanation}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Confidence: {strategy.confidence.level}</span>
          </span>
        </div>
      </div>

      <div className="p-5 md:p-6 flex flex-col gap-5">
        {/* Title & Composite Score Row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base md:text-lg font-bold text-slate-900 leading-snug">
              {strategy.name}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isBaseline
                ? 'Your existing crop rotation evaluated against local climate vulnerability'
                : 'Agronomic alternative engineered to close bare-soil gaps and mitigate thermal risk'}
            </p>
          </div>

          <div
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border min-w-[76px] ${getScoreColor(
              score
            )}`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider">Score</span>
            <span className="text-2xl font-black">{score}</span>
            <span className="text-[10px] text-slate-500">/ 100</span>
          </div>
        </div>

        {/* 1. VISUAL ROTATION TIMELINE */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Seasonal Sequence</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {strategy.sequence.map((item, idx) => {
              const icon = CROP_ICONS[item.crop_id] || '🌱';
              const name = CROP_NAMES[item.crop_id] || item.crop_id;
              const isZaid = item.season === 'zaid';

              return (
                <div
                  key={idx}
                  className={`p-2 rounded-lg border flex flex-col items-center text-center justify-between ${
                    isZaid && item.crop_id === 'mungbean'
                      ? 'bg-emerald-50 border-emerald-200'
                      : isZaid && item.crop_id === 'sesbania'
                      ? 'bg-teal-50 border-teal-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    {item.season === 'kharif'
                      ? 'Kharif (Monsoon)'
                      : item.season === 'rabi'
                      ? 'Rabi (Winter)'
                      : 'Zaid (Summer)'}
                  </span>
                  <div className="text-2xl my-1">{icon}</div>
                  <span className="text-xs font-bold text-slate-800 line-clamp-1" title={name}>
                    {name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. WHY IT WAS SUGGESTED */}
        <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-200/80">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Why This Rotation Was Suggested</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-normal">
            {strategy.why_suggested}
          </p>
        </div>

        {/* 3. EARTH OBSERVATION EVIDENCE */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            <span>Space Observation Evidence</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-600">
            {strategy.evidence.map((ev, i) => (
              <li key={i} className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-sky-600 font-bold mt-0.5">•</span>
                <span className="leading-snug">{ev}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 4. AGRONOMIC BENEFITS */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Agronomic Benefits</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {strategy.benefits.map((b, i) => (
              <div key={i} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700 leading-snug">{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. CHECK WITH LOCAL EXPERTS (MANDATORY SECTION 9) */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
            <UserCheck className="w-4 h-4 text-amber-700" />
            <span>Check with Local Experts (Needs Local Review)</span>
          </div>
          <p className="text-[11px] text-amber-800">
            Human judgment is essential for farm-level factors (soil testing, seed variety from KVK, water table depth):
          </p>
          <ul className="space-y-1.5 text-xs text-amber-950 mt-1">
            {strategy.risks_needing_local_review.map((r, i) => (
              <li key={i} className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 6. INFORMATION GAPS (Toggleable) */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowGaps(!showGaps)}
            className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FileQuestion className="w-3.5 h-3.5 text-slate-500" />
              <span>What We Don't Know (Information Gaps & Uncertainty)</span>
            </div>
            {showGaps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showGaps && (
            <div className="p-4 bg-white border-t border-slate-200 text-xs text-slate-600 space-y-2">
              <p className="text-[11px] text-slate-500 italic">
                Rule 2 Compliance: Crop facts with unknown field-level traits are catalogued as gaps rather than fabricated.
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs">
                {strategy.information_gaps.map((gap, i) => (
                  <li key={i} className="leading-snug">
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 7. WHY THIS SCORE? (Expandable Accordion) */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowScoreDetails(!showScoreDetails)}
            className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Why this score? (8-Criterion Rule-Based Breakdown)</span>
            </div>
            {showScoreDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showScoreDetails && (
            <div className="p-4 bg-white border-t border-slate-200 flex flex-col gap-3">
              <p className="text-[11px] text-slate-500">
                Composite Score = Weighted sum of 8 criteria, where weights reflect your normalized priorities.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CRITERIA_METRICS.map((crit) => {
                  const val = Math.round(strategy.criteria_scores[crit.key] || 0);
                  const weight = strategy.weights_used[crit.key]
                    ? Math.round(strategy.weights_used[crit.key] * 100)
                    : null;

                  return (
                    <div key={crit.key} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col gap-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <span>{crit.icon}</span>
                          <span>{crit.label}</span>
                        </span>
                        <span className="font-bold text-slate-800">{val}/100</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            val >= 75
                              ? 'bg-emerald-500'
                              : val >= 55
                              ? 'bg-sky-500'
                              : val >= 40
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${val}%` }}
                        />
                      </div>
                      {weight !== null && (
                        <span className="text-[10px] text-slate-400">
                          Priority weight applied: {weight}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Support Not Replace Footer */}
        <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center gap-2">
          <Droplets className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>{strategy.support_not_replace_reminder}</span>
        </div>
      </div>
    </div>
  );
};
