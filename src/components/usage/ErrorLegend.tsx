/**
 * ErrorLegend — Explains the color coding used in sentence comparison views.
 *
 * Uses both color swatches AND text labels so the legend is accessible
 * without relying on color perception alone.
 */
import React from 'react';

export const ErrorLegend: React.FC = () => (
  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400 mt-2 mb-1">
    <span className="flex items-center gap-1">
      <span className="inline-block w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700" aria-hidden="true" />
      <span>Goed</span>
    </span>
    <span className="flex items-center gap-1">
      <span className="inline-block w-3 h-3 rounded bg-orange-100 dark:bg-orange-900/40 border border-orange-300 dark:border-orange-700" aria-hidden="true" />
      <span>Verkeerd benoemd (juist gegroepeerd, verkeerd label)</span>
    </span>
    <span className="flex items-center gap-1">
      <span className="inline-block w-3 h-3 rounded bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700" aria-hidden="true" />
      <span>Verkeerd gegroepeerd (zinsdelen anders verdeeld)</span>
    </span>
    <span className="flex items-center gap-1">
      <span className="inline-block w-3 h-3 rounded border-l-4 border-amber-400 dark:border-amber-500 bg-slate-100 dark:bg-slate-700" aria-hidden="true" />
      <span>Eerste afwijking</span>
    </span>
  </div>
);

export default ErrorLegend;
