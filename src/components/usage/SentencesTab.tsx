/**
 * SentencesTab — "Zinnen" tab in usage analytics.
 *
 * Per-sentence analytics with filter, sort, and level grouping.
 */
import React, { useState } from 'react';
import type { EnrichedUsage } from './types';
import { describeRate } from './colorHelpers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortField = 'id' | 'attempts' | 'perfectRate' | 'showAnswer' | 'splitErrors' | 'lastAttempted';
type SortDir = 'asc' | 'desc';

interface SentencesTabProps {
  enrichedData: EnrichedUsage[];
}

// ---------------------------------------------------------------------------
// LevelGroup helper
// ---------------------------------------------------------------------------

interface LevelGroupProps {
  title: string;
  color: string;
  bg: string;
  count: number;
  avgPerfect: number | null;
  useGrouping: boolean;
  children: React.ReactNode;
}

function LevelGroup({ title, color, bg, count, avgPerfect, useGrouping, children }: LevelGroupProps) {
  const [open, setOpen] = useState(false);
  if (!useGrouping) return <div className="space-y-3">{children}</div>;
  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
      <button onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className={`w-full flex items-center justify-between px-4 py-2.5 text-left ${bg} border-b border-slate-200 dark:border-slate-700 hover:brightness-95 transition-all`}>
        <span className={`font-bold text-sm ${color}`}>{title}</span>
        <div className="flex items-center gap-3">
          {avgPerfect !== null && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              gem. {avgPerfect.toFixed(0)}% goed · {count} {count === 1 ? 'zin' : 'zinnen'}
            </span>
          )}
          <span className={`text-slate-400 dark:text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>
      {open && (
        <div className="bg-white dark:bg-slate-800 p-3 space-y-3">{children}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SentencesTab: React.FC<SentencesTabProps> = ({ enrichedData }) => {
  const [sortField, setSortField] = useState<SortField>('attempts');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterSource, setFilterSource] = useState<'all' | 'builtin' | 'custom'>('all');
  const [filterLevel, setFilterLevel] = useState<number | null>(null);

  const filtered = enrichedData.filter(d => {
    if (filterSource === 'custom' && !d.isCustom) return false;
    if (filterSource === 'builtin' && d.isCustom) return false;
    if (filterLevel !== null && d.level !== filterLevel) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'id': cmp = a.sentenceId - b.sentenceId; break;
      case 'attempts': cmp = a.usage.attempts - b.usage.attempts; break;
      case 'perfectRate': cmp = a.perfectRate - b.perfectRate; break;
      case 'showAnswer': cmp = a.usage.showAnswerCount - b.usage.showAnswerCount; break;
      case 'splitErrors': cmp = a.usage.splitErrors - b.usage.splitErrors; break;
      case 'lastAttempted': cmp = a.usage.lastAttempted.localeCompare(b.usage.lastAttempted); break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const handleSortChange = (value: string) => {
    const [field, dir] = value.split('-') as [SortField, SortDir];
    setSortField(field);
    setSortDir(dir);
  };

  const LEVEL_META: Record<number, { label: string; color: string; bg: string }> = {
    1: { label: 'Niveau 1 — Basis', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
    2: { label: 'Niveau 2 — Middel', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
    3: { label: 'Niveau 3 — Hoog', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' },
    4: { label: 'Niveau 4 — Samengesteld', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
    0: { label: 'Overig / Eigen zinnen', color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600' },
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Bekijk:</span>
          <select value={filterSource} onChange={e => setFilterSource(e.target.value as 'all' | 'builtin' | 'custom')}
            className="text-sm px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
            <option value="all">Alle zinnen</option>
            <option value="builtin">Ingebouwde zinnen</option>
            <option value="custom">Eigen zinnen</option>
          </select>
          <select value={filterLevel ?? ''} onChange={e => setFilterLevel(e.target.value ? Number(e.target.value) : null)}
            className="text-sm px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
            <option value="">Alle niveaus</option>
            <option value="1">Niveau 1 – Basis</option>
            <option value="2">Niveau 2 – Middel</option>
            <option value="3">Niveau 3 – Hoog</option>
            <option value="4">Niveau 4 – Samengesteld</option>
          </select>
          <select value={`${sortField}-${sortDir}`} onChange={e => handleSortChange(e.target.value)}
            className="text-sm px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
            <option value="attempts-desc">Meest geoefend</option>
            <option value="attempts-asc">Minst geoefend</option>
            <option value="perfectRate-asc">Moeilijkst eerst</option>
            <option value="perfectRate-desc">Makkelijkst eerst</option>
            <option value="showAnswer-desc">Meest antwoord bekeken</option>
            <option value="lastAttempted-desc">Laatst geoefend</option>
          </select>
          <span className="text-xs text-slate-400 ml-auto">{sorted.length} zinnen</span>
        </div>
      </div>

      {/* Per-sentence cards — grouped by level */}
      {sorted.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-slate-400 text-sm">Geen gebruiksdata beschikbaar. Zodra leerlingen oefenen verschijnen hier de resultaten.</p>
        </div>
      ) : (() => {
        const useGrouping = filterLevel === null;
        const groups = useGrouping
          ? [1, 2, 3, 4, 0].map(lvl => ({ lvl, items: sorted.filter(d => d.level === lvl) })).filter(g => g.items.length > 0)
          : [{ lvl: filterLevel ?? -1, items: sorted }];

        return (
          <div className="space-y-4">
            {groups.map(({ lvl, items }) => {
              const meta = LEVEL_META[lvl] ?? LEVEL_META[0];
              const avgPerfect = items.reduce((s, d) => s + d.perfectRate, 0) / items.length;
              return (
                <LevelGroup key={lvl} title={useGrouping ? meta.label : ''} color={meta.color} bg={meta.bg}
                  count={items.length} avgPerfect={useGrouping ? avgPerfect : null} useGrouping={useGrouping}>
                  {items.map(d => {
                    const roleErrorEntries = Object.entries(d.usage.roleErrors).sort((a, b) => b[1] - a[1]).slice(0, 3);
                    const rateInfo = d.usage.attempts > 0 ? describeRate(d.perfectRate) : { text: 'Nog niet gecontroleerd', emoji: '⚪', colorClass: 'text-slate-400' };
                    const totalInteractions = d.usage.attempts + d.usage.showAnswerCount;
                    const gaveUpOften = totalInteractions > 0 && (d.usage.showAnswerCount / totalInteractions) > 0.5;

                    let tip = '';
                    if (d.perfectRate < 25 && d.usage.attempts >= 3) {
                      tip = 'Deze zin is erg moeilijk. Overweeg om hem eerst klassikaal te bespreken.';
                    } else if (gaveUpOften && totalInteractions >= 3) {
                      tip = 'Leerlingen bekijken hier vaak het antwoord. Misschien is extra uitleg nodig.';
                    } else if (d.perfectRate >= 25 && d.perfectRate < 50 && d.usage.splitErrors > d.usage.attempts) {
                      tip = 'Leerlingen splitsen deze zin vaak verkeerd. Oefen het herkennen van zinsdelen.';
                    } else if (d.perfectRate >= 25 && d.perfectRate < 50 && roleErrorEntries.length > 0) {
                      tip = `Leerlingen verwarren hier vaak het ${roleErrorEntries[0][0]}. Extra uitleg kan helpen.`;
                    } else if (d.perfectRate >= 90) {
                      tip = 'Deze zin wordt goed beheerst!';
                    }

                    return (
                      <div key={d.sentenceId} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-2 mb-3">
                          <span className="text-lg flex-shrink-0">{rateInfo.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-slate-700 dark:text-slate-200 block truncate">{d.label}</span>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className={`text-xs font-bold ${rateInfo.colorClass}`}>{rateInfo.text}</span>
                              {d.isCustom && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 font-medium">Eigen zin</span>}
                              {d.usage.flagged && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 font-medium">Gemarkeerd</span>}
                            </div>
                          </div>
                          {d.usage.lastAttempted && (
                            <span className="text-[10px] text-slate-400 flex-shrink-0">{new Date(d.usage.lastAttempted).toLocaleDateString('nl-NL')}</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
                          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                            <div className="font-bold text-slate-700 dark:text-slate-200">{d.usage.attempts}</div>
                            <div className="text-slate-400">pogingen</div>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                            <div className={`font-bold ${rateInfo.colorClass}`}>{d.usage.attempts > 0 ? `${d.perfectRate.toFixed(0)}%` : '—'}</div>
                            <div className="text-slate-400">in één keer goed</div>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                            <div className={`font-bold ${d.usage.showAnswerCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>{d.usage.showAnswerCount}x</div>
                            <div className="text-slate-400">antwoord bekeken</div>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                            <div className={`font-bold ${d.usage.splitErrors > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`}>{d.usage.splitErrors}</div>
                            <div className="text-slate-400">verdeelfouten</div>
                          </div>
                        </div>
                        {roleErrorEntries.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                            <span className="text-[11px] text-slate-400 block mb-1">Meest verwarde zinsdelen:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {roleErrorEntries.map(([role, count]) => (
                                <span key={role} className="text-[11px] px-2 py-1 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-medium">
                                  {role} ({count}x)
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {d.usage.attempts >= 2 && tip && (
                          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">{tip}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </LevelGroup>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
};

export default SentencesTab;
