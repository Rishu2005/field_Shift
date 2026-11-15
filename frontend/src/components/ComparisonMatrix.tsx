import React, { useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { BarChart3, Table as TableIcon, Sparkles, TrendingUp } from 'lucide-react';
import type { StrategyCardData, ComparisonMatrixRow } from '../lib/api';

interface ComparisonMatrixProps {
  strategies: StrategyCardData[];
  matrixRows: ComparisonMatrixRow[];
  summaryInsights?: {
    top_recommendation: string;
    score_improvement_over_baseline: number;
    baseline_score: number;
    top_score: number;
  };
}

const STRATEGY_COLORS = [
  '#059669', // Emerald
  '#0284c7', // Sky
  '#d97706', // Amber
  '#7c3aed', // Purple
  '#e11d48', // Rose
];

export const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({
  strategies,
  matrixRows,
  summaryInsights,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'radar'>('table');

  if (!strategies || strategies.length === 0) return null;

  // Format data for Recharts Radar Chart
  // Recharts Radar expects: [{ subject: 'Water Efficiency', strategy_a: 60, strategy_b: 85, fullMark: 100 }, ...]
  const radarData = matrixRows.map((row) => {
    const item: Record<string, any> = {
      subject: row.label,
      fullMark: 100,
    };
    strategies.forEach((s) => {
      item[s.id] = row[s.id] !== undefined ? Math.round(Number(row[s.id])) : 0;
    });
    return item;
  });

  const baselineStrategy = strategies.find((s) => s.is_baseline) || strategies[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 flex flex-col gap-5">
      {/* Header with Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Side-by-Side Strategy Evaluation Matrix
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Compare trade-offs across all 8 agronomic & climate criteria simultaneously.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Comparison Table</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('radar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              viewMode === 'radar'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Multi-Axis Radar</span>
          </button>
        </div>
      </div>

      {/* Summary Highlight Pill */}
      {summaryInsights && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="text-emerald-900 font-medium">
              Top Ranked:{' '}
              <strong className="font-bold text-emerald-950">
                {summaryInsights.top_recommendation}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-3 font-semibold text-emerald-800">
            <span>
              Baseline:{' '}
              <span className="font-bold">{Math.round(summaryInsights.baseline_score)}</span>
            </span>
            <span>→</span>
            <span>
              Recommended:{' '}
              <span className="font-bold text-emerald-700">
                {Math.round(summaryInsights.top_score)}
              </span>
            </span>
            <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[11px]">
              +{summaryInsights.score_improvement_over_baseline} pts gain
            </span>
          </div>
        </div>
      )}

      {/* View 1: Side-by-Side Comparison Table */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-3 font-bold text-slate-700 min-w-[180px]">Evaluation Criterion</th>
                {strategies.map((s, idx) => (
                  <th
                    key={s.id}
                    className={`p-3 font-bold text-slate-800 min-w-[170px] ${
                      s.is_baseline ? 'bg-slate-100/70 border-x border-slate-200' : ''
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: STRATEGY_COLORS[idx % STRATEGY_COLORS.length] }}
                        />
                        <span className="line-clamp-1">{s.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal">
                        {s.is_baseline ? 'Baseline' : `Alternative #${idx}`}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {/* Composite Score Row */}
              <tr className="bg-slate-50/50 font-bold">
                <td className="p-3 text-slate-900">Overall Weighted Score</td>
                {strategies.map((s) => (
                  <td
                    key={s.id}
                    className={`p-3 ${
                      s.is_baseline ? 'bg-slate-100/50 border-x border-slate-200' : ''
                    }`}
                  >
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${
                        s.composite_score >= 70
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.composite_score >= 55
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {Math.round(s.composite_score)} / 100
                    </span>
                  </td>
                ))}
              </tr>

              {/* 8 Criterion Rows */}
              {matrixRows.map((row) => (
                <tr key={row.criterion} className="hover:bg-slate-50/70 transition">
                  <td className="p-3 font-semibold text-slate-800 flex items-center justify-between">
                    <span>{row.label}</span>
                  </td>
                  {strategies.map((s) => {
                    const val = Math.round(Number(row[s.id] || 0));
                    const baseVal = Math.round(Number(row[baselineStrategy.id] || 0));
                    const diff = val - baseVal;

                    return (
                      <td
                        key={s.id}
                        className={`p-3 ${
                          s.is_baseline ? 'bg-slate-100/30 border-x border-slate-200' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold ${
                              val >= 75
                                ? 'text-emerald-700'
                                : val >= 50
                                ? 'text-slate-800'
                                : 'text-amber-700'
                            }`}
                          >
                            {val}
                          </span>
                          {!s.is_baseline && diff !== 0 && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                diff > 0
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Confidence Row */}
              <tr className="bg-slate-50/30 font-medium">
                <td className="p-3 text-slate-800">Observation Confidence</td>
                {strategies.map((s) => (
                  <td
                    key={s.id}
                    className={`p-3 ${
                      s.is_baseline ? 'bg-slate-100/50 border-x border-slate-200' : ''
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.confidence.level === 'High'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {s.confidence.level}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* View 2: Multi-Axis Radar Chart */}
      {viewMode === 'radar' && (
        <div className="w-full h-80 flex flex-col items-center justify-center pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
              />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: '10px',
                  fontSize: '11px',
                }}
              />
              {strategies.map((s, idx) => (
                <Radar
                  key={s.id}
                  name={s.name}
                  dataKey={s.id}
                  stroke={STRATEGY_COLORS[idx % STRATEGY_COLORS.length]}
                  fill={STRATEGY_COLORS[idx % STRATEGY_COLORS.length]}
                  fillOpacity={s.is_baseline ? 0.15 : 0.35}
                  strokeWidth={s.is_baseline ? 1.5 : 2}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
