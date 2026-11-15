import React from 'react';
import { X, BookOpen, Layers } from 'lucide-react';
import type { GlossaryTerm } from '../lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  terms: GlossaryTerm[];
}

export const GlossaryModal: React.FC<Props> = ({ isOpen, onClose, terms }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="p-4 md:p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-emerald-700" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Glossary: Satellite Agroclimatology & Soil Health
              </h2>
              <p className="text-xs text-slate-500">
                Plain-language explanations of scientific remote sensing terms and ground realities.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scrollable */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-6 divide-y divide-slate-100">
          {terms.map((t, idx) => (
            <div key={idx} className={idx > 0 ? 'pt-6' : ''}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {t.category}
                </span>
                <h3 className="text-base font-bold text-slate-900">{t.term}</h3>
              </div>

              <p className="text-sm font-medium text-slate-700 mb-2">
                {t.short_definition}
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 text-xs text-slate-600">
                <div>
                  <span className="font-semibold text-slate-800">What it means for your field: </span>
                  <span>{t.farmer_meaning}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">NASA & Earth Observation Source: </span>
                  <span className="text-slate-700">{t.satellite_source}</span>
                </div>
                <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 text-amber-900 flex items-start gap-2">
                  <Layers className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-amber-950">Satellite vs. Ground Reality: </span>
                    <span>{t.ground_difference}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition"
          >
            Close Glossary
          </button>
        </div>
      </div>
    </div>
  );
};
