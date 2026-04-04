/**
 * Score color helpers — shared across usage analytics tabs.
 */

/** Class/aggregate average: stricter thresholds */
export function scoreColorAggregate(pct: number): string {
  if (pct >= 90) return 'text-emerald-600 dark:text-emerald-400';
  if (pct >= 80) return 'text-yellow-600 dark:text-yellow-400';
  if (pct >= 65) return 'text-orange-500 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

/** "In een keer goed" rate: more lenient thresholds */
export function scoreColorPerfectRate(pct: number): string {
  if (pct >= 70) return 'text-emerald-600 dark:text-emerald-400';
  if (pct >= 55) return 'text-yellow-600 dark:text-yellow-400';
  if (pct >= 35) return 'text-orange-500 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

/** Describe a success rate in plain Dutch */
export function describeRate(rate: number): { text: string; emoji: string; colorClass: string } {
  if (rate >= 70) return { text: 'Goed begrepen', emoji: '🟢', colorClass: 'text-emerald-600 dark:text-emerald-400' };
  if (rate >= 55) return { text: 'Redelijk', emoji: '🟡', colorClass: 'text-yellow-600 dark:text-yellow-400' };
  if (rate >= 35) return { text: 'Lastig', emoji: '🟠', colorClass: 'text-orange-500 dark:text-orange-400' };
  return { text: 'Erg moeilijk', emoji: '🔴', colorClass: 'text-red-600 dark:text-red-400' };
}
