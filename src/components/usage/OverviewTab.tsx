/**
 * OverviewTab — "Overzicht" tab in usage analytics.
 *
 * Shows teacher-meaningful KPIs, class/jaarlaag summaries,
 * and teacher-friendly insights (role errors, difficult/easy sentences).
 */
import React, { useState } from 'react';
import type { SessionReport, JaarlaagStats } from '../../services/sessionReport';
import { computeAggregateStats } from '../../services/sessionReport';
import type { UserStats } from '../../services/interactionLog';
import type { EnrichedUsage } from './types';
import { scoreColorAggregate, scoreColorPerfectRate } from './colorHelpers';
import { computeRecurringErrorStudents } from '../../logic/sentenceAnalysis';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface OverviewTabProps {
  allReports: SessionReport[];
  enrichedData: EnrichedUsage[];
  perUserStats: UserStats[];
  filterDate: string;
  setFilterDate: (v: string) => void;
  filterTimeFrom: string;
  setFilterTimeFrom: (v: string) => void;
  filterTimeTo: string;
  setFilterTimeTo: (v: string) => void;
  filterKlas: string;
  setFilterKlas: (v: string) => void;
  filterStudent: string;
  setFilterStudent: (v: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const OverviewTab: React.FC<OverviewTabProps> = ({
  allReports,
  enrichedData,
  perUserStats,
  filterDate, setFilterDate,
  filterTimeFrom, setFilterTimeFrom,
  filterTimeTo, setFilterTimeTo,
  filterKlas, setFilterKlas,
  filterStudent, setFilterStudent,
}) => {
  const [showSecondary, setShowSecondary] = useState(false);

  // Date/time filter
  const dateFilteredReports = allReports.filter(r => {
    const d = new Date(r.ts);
    if (filterDate) {
      const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (localDate !== filterDate) return false;
    }
    if (filterTimeFrom) {
      const [h, m] = filterTimeFrom.split(':').map(Number);
      if (d.getHours() * 60 + d.getMinutes() < h * 60 + m) return false;
    }
    if (filterTimeTo) {
      const [h, m] = filterTimeTo.split(':').map(Number);
      if (d.getHours() * 60 + d.getMinutes() > h * 60 + m) return false;
    }
    return true;
  });

  const aggregateStats = computeAggregateStats(dateFilteredReports, filterKlas || undefined, filterStudent || undefined);

  // --- Primary KPI computations ---
  const firstAttemptCorrectPct = (() => {
    let ok = 0, total = 0;
    for (const r of allReports) {
      if (r.res) {
        for (const entry of r.res) {
          total++;
          if (entry.ok) ok++;
        }
      }
    }
    return total > 0 ? (ok / total) * 100 : 0;
  })();

  const recurringErrorStudents = computeRecurringErrorStudents(allReports);

  // --- Secondary metrics ---
  const totalShowAnswer =
    enrichedData.reduce((s, d) => s + d.usage.showAnswerCount, 0) +
    allReports.reduce((s, r) => s + (r.hint ?? 0), 0);
  const totalRetries = perUserStats.reduce((s, u) => s + u.retries, 0);
  const totalAttempts = enrichedData.reduce((s, d) => s + d.usage.attempts, 0);
  const sentencesWithAttempts = enrichedData.filter(d => d.usage.attempts > 0).length;
  const avgChecksPerSentence = sentencesWithAttempts > 0 ? totalAttempts / sentencesWithAttempts : 0;

  // --- Insights data ---
  const globalRoleErrors: Record<string, number> = {};
  enrichedData.forEach(d => {
    for (const [role, count] of Object.entries(d.usage.roleErrors)) {
      globalRoleErrors[role] = (globalRoleErrors[role] || 0) + count;
    }
  });
  for (const r of allReports) {
    for (const [role, count] of Object.entries(r.err)) {
      globalRoleErrors[role] = (globalRoleErrors[role] || 0) + count;
    }
  }
  const topRoleErrors = Object.entries(globalRoleErrors).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const difficultSentences = enrichedData
    .filter(d => d.usage.attempts >= 3 && d.perfectRate < 55)
    .sort((a, b) => a.perfectRate - b.perfectRate)
    .slice(0, 5);

  const gaveUpSentences = enrichedData
    .filter(d => d.usage.showAnswerCount >= 2)
    .sort((a, b) => b.usage.showAnswerCount - a.usage.showAnswerCount)
    .slice(0, 5);

  const easySentences = enrichedData
    .filter(d => d.usage.attempts >= 3 && d.perfectRate >= 70)
    .sort((a, b) => b.perfectRate - a.perfectRate)
    .slice(0, 5);

  const levelDistribution: Record<number, number> = {};
  enrichedData.forEach(d => {
    if (d.level > 0) {
      levelDistribution[d.level] = (levelDistribution[d.level] || 0) + d.usage.attempts;
    }
  });

  const totalSplitErrors = enrichedData.reduce((s, d) => s + d.usage.splitErrors, 0);
  const totalRoleErrorCount = enrichedData.reduce((s, d) => s + d.totalRoleErrors, 0);

  return (
    <div className="space-y-6">

      {/* Primary KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center" title="Hoeveel verschillende leerlingen hebben geoefend">
          <div className="text-3xl mb-1">👥</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{aggregateStats.uniqueStudents}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Actieve leerlingen</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center" title="Totaal aantal ingeleverde sessies">
          <div className="text-3xl mb-1">📋</div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{aggregateStats.totalReports}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Afgeronde sessies</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center" title="Percentage zinsdelen dat in de eerste poging correct was">
          <div className="text-3xl mb-1">{firstAttemptCorrectPct >= 70 ? '🎉' : firstAttemptCorrectPct >= 50 ? '💪' : '📚'}</div>
          <div className={`text-2xl font-bold ${scoreColorPerfectRate(firstAttemptCorrectPct)}`}>
            {firstAttemptCorrectPct > 0 ? `${firstAttemptCorrectPct.toFixed(0)}%` : '—'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">In een keer goed</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center" title="Leerlingen die hetzelfde zinsdeel in meerdere sessies fout hebben">
          <div className="text-3xl mb-1">🔁</div>
          <div className={`text-2xl font-bold ${recurringErrorStudents.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {recurringErrorStudents.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Terugkerende fouten</div>
        </div>
      </div>

      {/* Secondary metrics — collapsible */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <button
          onClick={() => setShowSecondary(s => !s)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Meer details</span>
          <span className={`text-slate-400 dark:text-slate-500 text-xs transition-transform ${showSecondary ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {showSecondary && (
          <div className="grid grid-cols-3 gap-3 px-4 pb-4 text-center text-sm">
            <div title="Hoe vaak een leerling het antwoord heeft bekeken in plaats van zelf te proberen">
              <span className="font-bold text-amber-600 dark:text-amber-400">{totalShowAnswer}</span>
              <br/><span className="text-[11px] text-slate-400">Antwoord bekeken</span>
            </div>
            <div title="Hoe vaak leerlingen het na een fout opnieuw hebben geprobeerd">
              <span className="font-bold text-blue-600 dark:text-blue-400">{totalRetries}</span>
              <br/><span className="text-[11px] text-slate-400">Opnieuw geprobeerd</span>
            </div>
            <div>
              <span className="font-bold text-slate-600 dark:text-slate-400">{avgChecksPerSentence.toFixed(1)}</span>
              <br/><span className="text-[11px] text-slate-400">Gem. controles per zin</span>
            </div>
          </div>
        )}
      </div>

      {/* Filters + aggregate stats */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-700 dark:text-white text-base mb-3">Overzicht leerlingrapporten</h3>

        {allReports.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-slate-500 dark:text-slate-400 mb-1">Nog geen leerlingrapporten ontvangen.</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Rapporten worden automatisch verzameld via Google Drive, of je kunt ze handmatig importeren via het tabblad Beheer.</p>
          </div>
        ) : (
          <>
            {/* Date/time + class/student filters */}
            <div className="space-y-2 mb-3">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">Datum:</span>
                <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                  className="text-sm px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200" />
                <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">Tijd:</span>
                <input type="time" value={filterTimeFrom} onChange={e => setFilterTimeFrom(e.target.value)}
                  className="text-sm px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200" title="Vanaf tijdstip" />
                <span className="text-xs text-slate-400 dark:text-slate-500">t/m</span>
                <input type="time" value={filterTimeTo} onChange={e => setFilterTimeTo(e.target.value)}
                  className="text-sm px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200" title="Tot en met tijdstip" />
              </div>
              {aggregateStats.klassen.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">Klas:</span>
                  <select value={filterKlas} onChange={e => { setFilterKlas(e.target.value); setFilterStudent(''); }}
                    className="text-sm px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    <option value="">Alle klassen</option>
                    {aggregateStats.klassen.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                  <select value={filterStudent} onChange={e => setFilterStudent(e.target.value)}
                    className="text-sm px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    <option value="">Alle leerlingen</option>
                    {aggregateStats.studentNames.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              )}
              {(filterKlas || filterStudent || filterDate || filterTimeFrom || filterTimeTo) && (
                <button onClick={() => { setFilterKlas(''); setFilterStudent(''); setFilterDate(''); setFilterTimeFrom(''); setFilterTimeTo(''); }}
                  className="text-xs px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                  ✕ Alle filters wissen
                </button>
              )}
            </div>

            {/* Report summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center text-sm mb-4">
              <div>
                <span className="font-bold text-blue-600 dark:text-blue-400">{aggregateStats.totalReports}</span>
                <br/><span className="text-xs text-slate-500">Rapporten</span>
              </div>
              <div>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{aggregateStats.uniqueStudents}</span>
                <br/><span className="text-xs text-slate-500">Leerlingen</span>
              </div>
              <div>
                <span className={`font-bold ${scoreColorAggregate(aggregateStats.avgScore)}`}>
                  {aggregateStats.avgScore.toFixed(0)}%
                </span>
                <br/><span className="text-xs text-slate-500">Gem. score</span>
              </div>
              <div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{aggregateStats.totalCorrect}</span>
                <br/><span className="text-xs text-slate-500">Totaal goed</span>
              </div>
              <div>
                <span className="font-bold text-slate-600 dark:text-slate-400">{aggregateStats.totalChunks}</span>
                <br/><span className="text-xs text-slate-500">Totaal zinsdelen</span>
              </div>
            </div>

            {/* Top errors from reports */}
            {Object.keys(aggregateStats.globalRoleErrors).length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                <span className="text-xs text-slate-400 block mb-2">Meest voorkomende fouten (uit rapporten):</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(aggregateStats.globalRoleErrors).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([role, count]) => (
                    <span key={role} className="text-[11px] px-2 py-1 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-medium">
                      {role} ({count}x)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reports per day */}
            {Object.keys(aggregateStats.reportsPerDay).length > 1 && (
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700">
                <span className="text-xs text-slate-400 block mb-2">Rapporten per dag:</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(aggregateStats.reportsPerDay).sort(([a], [b]) => a.localeCompare(b)).map(([day, count]) => (
                    <span key={day} className="text-[11px] px-2 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium">
                      {new Date(day).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Per-klas table (read-only — rename/merge is in ManagementTab) */}
            {aggregateStats.klasStats.length > 0 && !filterKlas && (
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700">
                <span className="text-xs text-slate-400 block mb-2">Per klas:</span>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-700">
                        <th className="pb-1 pr-3 font-medium">Klas</th>
                        <th className="pb-1 pr-3 font-medium text-center">Rapporten</th>
                        <th className="pb-1 pr-3 font-medium text-center">Leerlingen</th>
                        <th className="pb-1 font-medium text-center">Gem. score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aggregateStats.klasStats.map(ks => (
                        <tr key={ks.klas}
                          className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
                          onClick={() => setFilterKlas(ks.klas)}>
                          <td className="py-1 pr-3 font-medium text-blue-600 dark:text-blue-400">{ks.klas}</td>
                          <td className="py-1 pr-3 text-center text-slate-600 dark:text-slate-300">{ks.reportCount}</td>
                          <td className="py-1 pr-3 text-center text-slate-600 dark:text-slate-300">{ks.uniqueStudents}</td>
                          <td className="py-1 text-center">
                            <span className={`font-bold ${scoreColorAggregate(ks.avgScore)}`}>{ks.avgScore.toFixed(0)}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Klik op een klas om te filteren. Hernoemen en samenvoegen kan via het tabblad Beheer.</p>
              </div>
            )}

            {/* Per-jaarlaag breakdown */}
            {aggregateStats.jaarlaagStats.length > 0 && (
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700">
                <span className="text-xs text-slate-400 block mb-2">Per jaarlaag:</span>
                <div className="space-y-2">
                  {aggregateStats.jaarlaagStats.map((js: JaarlaagStats) => (
                    <div key={js.jaarlaag} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-slate-700 dark:text-white text-sm">
                          {js.jaarlaag === '?' ? 'Onbekend' : `Klas ${js.jaarlaag}`}
                        </span>
                        <span className="text-xs text-slate-400">{js.reportCount} rapporten · {js.uniqueStudents} leerlingen · {js.uniqueKlassen} {js.uniqueKlassen === 1 ? 'klas' : 'klassen'}</span>
                        <span className={`ml-auto font-bold text-sm ${scoreColorAggregate(js.avgScore)}`}>{js.avgScore.toFixed(0)}%</span>
                      </div>
                      {js.topRoleErrors.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[10px] text-slate-400">Veelste fouten:</span>
                          {js.topRoleErrors.map(e => (
                            <span key={e.role} className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-medium">
                              {e.role} ({e.count}x)
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Gebaseerd op het eerste cijfer van de klasnaam (bv. &quot;1&quot; uit &quot;1ga&quot;).</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Teacher-friendly insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Where do students struggle? */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-700 dark:text-white text-base mb-1">Waar gaat het mis?</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">De zinsdelen die het vaakst fout worden benoemd</p>
          {topRoleErrors.length === 0 ? (
            <p className="text-slate-400 text-sm italic">Er zijn nog geen fouten gemaakt — goed bezig!</p>
          ) : (
            <div className="space-y-2.5">
              {topRoleErrors.map(([role, count]) => {
                const maxCount = topRoleErrors[0][1];
                const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                return (
                  <div key={role}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{role}</span>
                      <span className="text-xs text-slate-400">{count}x fout</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-300 to-red-500 dark:from-red-700 dark:to-red-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Difficult sentences */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-700 dark:text-white text-base mb-1">Zinnen die aandacht nodig hebben</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Zinnen waar leerlingen moeite mee hebben (meerdere pogingen, weinig goed)</p>
          {difficultSentences.length === 0 ? (
            <p className="text-slate-400 text-sm italic">
              {totalAttempts < 10 ? 'Er is nog niet genoeg geoefend om dit te bepalen.' : 'Geen opvallend moeilijke zinnen gevonden!'}
            </p>
          ) : (
            <div className="space-y-2">
              {difficultSentences.map(d => (
                <div key={d.sentenceId} className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 block truncate">{d.label}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {d.usage.attempts} pogingen — slechts {d.perfectRate.toFixed(0)}% goed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Second insights row */}
      {(gaveUpSentences.length > 0 || easySentences.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gaveUpSentences.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-700 dark:text-white text-base mb-1">Opgegeven zinnen</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Zinnen waar leerlingen het antwoord meteen bekeken hebben</p>
              <div className="space-y-2">
                {gaveUpSentences.map(d => (
                  <div key={d.sentenceId} className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 block truncate">{d.label}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{d.usage.showAnswerCount}x antwoord bekeken</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {easySentences.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-700 dark:text-white text-base mb-1">Goed begrepen zinnen</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Zinnen die leerlingen goed beheersen</p>
              <div className="space-y-2">
                {easySentences.map(d => (
                  <div key={d.sentenceId} className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 block truncate">{d.label}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{d.perfectRate.toFixed(0)}% goed bij {d.usage.attempts} pogingen</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Level distribution + split vs label */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-700 dark:text-white text-base mb-1">Verdeling per niveau</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Hoe vaak wordt elk niveau geoefend?</p>
          {Object.keys(levelDistribution).length === 0 ? (
            <p className="text-slate-400 text-sm italic">Nog geen data.</p>
          ) : (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map(lvl => {
                const count = levelDistribution[lvl] || 0;
                if (count === 0 && lvl === 0) return null;
                const maxCount = Math.max(...Object.values(levelDistribution), 1);
                const pct = (count / maxCount) * 100;
                const labels = ['Instap', 'Basis', 'Middel', 'Hoog', 'Expert'];
                const colors = ['from-emerald-300 to-emerald-500', 'from-green-300 to-green-500', 'from-blue-300 to-blue-500', 'from-purple-300 to-purple-500', 'from-red-300 to-red-500'];
                return (
                  <div key={lvl}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{labels[lvl]}</span>
                      <span className="text-xs text-slate-400">{count} pogingen</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${colors[lvl]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-700 dark:text-white text-base mb-1">Zinsdeelproef vs. Benoemen</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Waar gaat het vaker mis: de zinsdeelproef of benoemen?</p>
          {totalSplitErrors === 0 && totalRoleErrorCount === 0 ? (
            <p className="text-slate-400 text-sm italic">Nog geen fouten gemaakt!</p>
          ) : (
            <div className="space-y-3">
              {(() => {
                const errorTotal = totalSplitErrors + totalRoleErrorCount;
                const splitPct = errorTotal > 0 ? (totalSplitErrors / errorTotal) * 100 : 0;
                const rolePct = errorTotal > 0 ? (totalRoleErrorCount / errorTotal) * 100 : 0;
                return (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Verdeelfouten</span>
                        <span className="text-xs text-slate-400">{totalSplitErrors}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-300 to-orange-500 rounded-full transition-all" style={{ width: `${splitPct}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Benoemfouten</span>
                        <span className="text-xs text-slate-400">{totalRoleErrorCount}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-red-300 to-red-500 rounded-full transition-all" style={{ width: `${rolePct}%` }} />
                      </div>
                    </div>
                  </>
                );
              })()}
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                {totalSplitErrors > totalRoleErrorCount
                  ? 'Leerlingen hebben meer moeite met het verdelen van zinnen in zinsdelen.'
                  : totalRoleErrorCount > totalSplitErrors
                  ? 'Leerlingen verdelen goed, maar benoemen de zinsdelen nog niet altijd juist.'
                  : 'Zinsdeelproef en benoemen gaan ongeveer even goed.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
