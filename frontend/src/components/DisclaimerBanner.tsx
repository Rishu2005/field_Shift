import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  lang?: 'en' | 'hi';
}

export const DisclaimerBanner: React.FC<Props> = ({ lang = 'en' }) => {
  return (
    <aside 
      aria-label="Agricultural Decision Support Notice"
      className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-amber-900"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs md:text-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span className="font-semibold text-amber-950">
            {lang === 'hi' ? 'निर्णय सहायता सूचना:' : 'Decision Support Notice:'}
          </span>
          <span className="text-amber-800">
            {lang === 'hi'
              ? 'यह उपकरण संभावनाओं और पैटर्नों को दर्शाता है। यह आपके अनुभव या स्थानीय कृषि विशेषज्ञों की सलाह का स्थान नहीं लेता है।'
              : 'This tool highlights patterns and possibilities. It does not replace farmer judgment or advice from local agricultural experts.'}
          </span>
        </div>
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-amber-700 font-medium">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>NASA Space Apps 2026</span>
        </div>
      </div>
    </aside>
  );
};
