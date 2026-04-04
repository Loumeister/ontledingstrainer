/**
 * LearnersTab — "Leerlingen" tab in usage analytics.
 *
 * Shows per-student analytics with behavior patterns, session history,
 * and detailed answer comparisons.
 */
import React, { useState, useMemo } from 'react';
import { SessionReport, computeStudentStats } from '../../services/sessionReport';
import type { UserStats } from '../../services/interactionLog';
import type { Sentence } from '../../types';
import type { EnrichedUsage, SortDir } from './types';
import { scoreColorAggregate } from './colorHelpers';
import { SentenceComparison } from './SentenceComparison';
import { ErrorLegend } from './ErrorLegend';
import { compareSentence } from '../../logic/sentenceAnalysis';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LearnersTabProps {
  allReports: SessionReport[];
  enrichedData: EnrichedUsage[];
  sentenceMap: Map<number, Sentence>;
  perUserStats: UserStats[];
  filterKlas: string;
  setFilterKlas: (v: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type StudentSortField = 'name' | 'sessions' | 'avg' | 'best' | 'latest';

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso.slice(0, 16);
  }
}

/** Match a UserStats entry to a student name (case-insensitive contains). */
function findUserStats(perUserStats: UserStats[], studentName: string): UserStats | undefined {
  const lower = studentName.trim().toLowerCase();
  return perUserStats.find(u => u.userName.toLowerCase().includes(lower));
}

/** Compute trend arrow: compare avg of last 3 vs first 3 sessions. */
function computeTrend(reports: SessionReport[]): 'up' | 'down' | 'flat' {
  if (reports.length < 2) return 'flat';
  const sorted = [...reports].sort((a, b) => a.ts.localeCompare(b.ts));
  const first3 = sorted.slice(0, 3);
  const last3 = sorted.slice(-3);
  const avg = (rs: SessionReport[]) => {
    const total = rs.reduce((s, r) => s + (r.t > 0 ? (r.c / r.t) * 100 : 0), 0);
    return total / rs.length;
  };
  const diff = avg(last3) - avg(first3);
  if (diff >= 5) return 'up';
  if (diff <= -5) return 'down';
  return 'flat';
}

function trendIcon(trend: 'up' | 'down' | 'flat'): string {
  if (trend === 'up') return '\u2191'; // up arrow
  if (trend === 'down') return '\u2193'; // down arrow
  return '\u2192'; // right arrow (flat)
}

function trendColor(trend: 'up' | 'down' | 'flat'): string {
  if (trend === 'up') return 'text-emerald-600 dark:text-emerald-400';
  if (trend === 'down') return 'text-red-600 dark:text-red-400';
  return 'text-slate-500 dark:text-slate-400';
}

function levelLabel(lvl: number | null): string {
  if (lvl === 1) return 'Basis';
  if (lvl === 2) return 'Middel';
  if (lvl === 3) return 'Gevorderd';
  if (lvl === 4) return 'Expert';
  return 'Mix';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const LearnersTab: React.FC<LearnersTabProps> = ({
  allReports,
  enrichedData: _enrichedData,
  sentenceMap,
  perUserStats,
  filterKlas,
  setFilterKlas,
}) => {
  // -- Internal state --
  const [filterStudent, setFilterStudent] = useState('');
  const [studentSortField, setStudentSortField] = useState<StudentSortField>('name');
  const [studentSortDir, setStudentSortDir] = useState<SortDir>('asc');
  const [expandedSols, setExpandedSols] = useState<Set<string>>(new Set());

  // -- Derived data --
  const uniqueKlassen = useMemo(() => {
    const set = new Set<string>();
    for (const r of allReports) {
      if (r.klas) set.add(r.klas.toLowerCase().trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'nl'));
  }, [allReports]);

  const studentStats = useMemo(
    () => (filterKlas ? computeStudentStats(allReports, filterKlas) : []),
    [allReports, filterKlas],
  );

  // Sort student stats
  const sortedStudentStats = useMemo(() => {
    const arr = [...studentStats];
    const dir = studentSortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      switch (studentSortField) {
        case 'name': return dir * a.name.localeCompare(b.name, 'nl');
        case 'sessions': return dir * (a.sessionCount - b.sessionCount);
        case 'avg': return dir * (a.avgScore - b.avgScore);
        case 'best': return dir * (a.bestScore - b.bestScore);
        case 'latest': return dir * a.latestTs.localeCompare(b.latestTs);
        default: return 0;
      }
    });
    return arr;
  }, [studentStats, studentSortField, studentSortDir]);

  // Student reports (for detail panel)
  const studentReports = useMemo(() => {
    if (!filterStudent) return [];
    return allReports
      .filter(r => (r.name || '').toLowerCase() === filterStudent.toLowerCase())
      .sort((a, b) => b.ts.localeCompare(a.ts)); // most recent first
  }, [allReports, filterStudent]);

  // Matched UserStats for selected student
  const matchedUserStats = useMemo(
    () => (filterStudent ? findUserStats(perUserStats, filterStudent) : undefined),
    [perUserStats, filterStudent],
  );

  // Trend for selected student
  const studentTrend = useMemo(
    () => computeTrend(studentReports),
    [studentReports],
  );

  // First-attempt correct % from res fields
  const firstAttemptPct = useMemo(() => {
    let correct = 0;
    let total = 0;
    for (const r of studentReports) {
      if (r.res) {
        for (const entry of r.res) {
          total++;
          if (entry.ok) correct++;
        }
      }
    }
    return total > 0 ? (correct / total) * 100 : null;
  }, [studentReports]);

  // Top 3 recurring error roles
  const topErrors = useMemo(() => {
    const errors: Record<string, number> = {};
    for (const r of studentReports) {
      for (const [role, count] of Object.entries(r.err)) {
        errors[role] = (errors[role] || 0) + count;
      }
    }
    return Object.entries(errors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([role, count]) => ({ role, count }));
  }, [studentReports]);

  // Total hint usage
  const totalHints = useMemo(
    () => studentReports.reduce((s, r) => s + (r.hint ?? 0), 0),
    [studentReports],
  );

  // -- Handlers --
  const handleSortClick = (field: StudentSortField) => {
    if (studentSortField === field) {
      setStudentSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setStudentSortField(field);
      setStudentSortDir(field === 'name' ? 'asc' : 'desc');
    }
  };

  const toggleSols = (key: string) => {
    setExpandedSols(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const sortIndicator = (field: StudentSortField) => {
    if (studentSortField !== field) return '';
    return studentSortDir === 'asc' ? ' \u25B2' : ' \u25BC';
  };

  // -- Render --
  return (
    <div className="space-y-4">
      {/* Class filter */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="klas-filter"
          className="text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Klas:
        </label>
        <select
          id="klas-filter"
          value={filterKlas}
          onChange={e => {
            setFilterKlas(e.target.value);
            setFilterStudent('');
          }}
          className="text-sm border border-slate-300 dark:border-slate-600 rounded px-2 py-1
                     bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
        >
          <option value="">-- Kies een klas --</option>
          {uniqueKlassen.map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>

      {/* Student table */}
      {filterKlas && sortedStudentStats.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-slate-600 dark:text-slate-400">
                {([
                  ['name', 'Naam'],
                  ['sessions', 'Sessies'],
                  ['avg', 'Gem. score'],
                  ['best', 'Beste score'],
                  ['latest', 'Laatste sessie'],
                ] as [StudentSortField, string][]).map(([field, label]) => (
                  <th
                    key={field}
                    className="py-2 px-2 cursor-pointer select-none whitespace-nowrap hover:text-slate-900 dark:hover:text-slate-200"
                    onClick={() => handleSortClick(field)}
                  >
                    {label}{sortIndicator(field)}
                  </th>
                ))}
                <th className="py-2 px-2 whitespace-nowrap">Trend</th>
                <th className="py-2 px-2 whitespace-nowrap">Zwakste punt</th>
                <th className="py-2 px-2 whitespace-nowrap">Opnieuw geprobeerd</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudentStats.map(st => {
                const isSelected = filterStudent.toLowerCase() === st.name.toLowerCase();
                const trend = computeTrend(
                  allReports.filter(r => (r.name || '').toLowerCase() === st.name.toLowerCase()),
                );
                const uStats = findUserStats(perUserStats, st.name);
                return (
                  <tr
                    key={st.name}
                    className={`border-b border-slate-100 dark:border-slate-700/50 cursor-pointer
                      ${isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    onClick={() => setFilterStudent(isSelected ? '' : st.name)}
                  >
                    <td className="py-2 px-2 font-medium text-slate-800 dark:text-slate-200">
                      {st.name}
                    </td>
                    <td className="py-2 px-2 text-slate-600 dark:text-slate-400">
                      {st.sessionCount}
                    </td>
                    <td className={`py-2 px-2 font-medium ${scoreColorAggregate(st.avgScore)}`}>
                      {st.avgScore.toFixed(0)}%
                    </td>
                    <td className={`py-2 px-2 ${scoreColorAggregate(st.bestScore)}`}>
                      {st.bestScore.toFixed(0)}%
                    </td>
                    <td className="py-2 px-2 text-slate-600 dark:text-slate-400">
                      {formatDate(st.latestTs)}
                    </td>
                    <td className={`py-2 px-2 font-medium ${trendColor(trend)}`}>
                      {trendIcon(trend)}
                    </td>
                    <td className="py-2 px-2">
                      {st.topErrors.length > 0 ? (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-medium">
                          {st.topErrors[0].role.toUpperCase()} ({st.topErrors[0].count}x)
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-slate-600 dark:text-slate-400" title="Herhaalpogingen (alleen van dit apparaat)">
                      {uStats ? `${uStats.retries}x` : <span className="text-slate-300 dark:text-slate-600">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filterKlas && sortedStudentStats.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400 italic">
          Geen leerlinggegevens gevonden voor klas {filterKlas}.
        </p>
      )}

      {!filterKlas && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Selecteer een klas om de leerlingresultaten te bekijken.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {uniqueKlassen.length > 0
              ? `${uniqueKlassen.length} ${uniqueKlassen.length === 1 ? 'klas' : 'klassen'} beschikbaar.`
              : 'Nog geen klassen gevonden in de rapporten.'}
          </p>
        </div>
      )}

      {/* Student detail panel */}
      {filterStudent && (
        <div className="mt-4 space-y-4">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            {filterStudent}
          </h3>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            <SummaryCard
              label="Sessies"
              value={String(studentReports.length)}
            />
            <SummaryCard
              label="Gem. score"
              value={
                studentReports.length > 0
                  ? `${(studentReports.reduce((s, r) => s + (r.t > 0 ? (r.c / r.t) * 100 : 0), 0) / studentReports.length).toFixed(0)}%`
                  : '-'
              }
              extra={
                <span className={`text-xs font-medium ${trendColor(studentTrend)}`}>
                  {trendIcon(studentTrend)}
                </span>
              }
            />
            <SummaryCard
              label="Eerste keer goed"
              value={firstAttemptPct != null ? `${firstAttemptPct.toFixed(0)}%` : '-'}
            />
            <SummaryCard
              label="Opnieuw geprobeerd"
              value={`${matchedUserStats?.retries ?? 0}x`}
            />
            <SummaryCard
              label="Antwoord getoond"
              value={`${totalHints}x`}
            />
            <SummaryCard
              label="Doorzettingsvermogen"
              value=""
              extra={(() => {
                const retries = matchedUserStats?.retries ?? 0;
                const checks = matchedUserStats?.checks ?? 0;
                const showAnswers = matchedUserStats?.showAnswers ?? 0;
                // No data from interaction log
                if (checks === 0 && retries === 0 && showAnswers === 0) {
                  return (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                      Geen data
                    </span>
                  );
                }
                // Determine behavior pattern
                const retryRatio = checks > 0 ? retries / checks : 0;
                const giveUpRatio = (checks + retries) > 0 ? showAnswers / (checks + retries) : 0;
                if (retryRatio >= 0.3) {
                  return (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                      Probeert vaak opnieuw
                    </span>
                  );
                } else if (giveUpRatio >= 0.4) {
                  return (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                      Bekijkt snel antwoord
                    </span>
                  );
                } else if (retries > 0) {
                  return (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      Probeert soms opnieuw
                    </span>
                  );
                }
                return (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                    Weinig herhaalpogingen
                  </span>
                );
              })()}
            />
          </div>

          {/* Top 3 error roles */}
          {topErrors.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Meest gemaakte fouten
              </h4>
              <div className="flex flex-wrap gap-2">
                {topErrors.map(({ role, count }) => (
                  <span
                    key={role}
                    className="text-xs px-2 py-1 rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-medium"
                  >
                    {role.toUpperCase()} ({count}x)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Per-session list */}
          <div>
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Sessiegeschiedenis
            </h4>
            <div className="space-y-2">
              {studentReports.map((report, ri) => {
                const sessionKey = `${report.ts}-${ri}`;
                const score = report.t > 0 ? (report.c / report.t) * 100 : 0;
                const isExpanded = expandedSols.has(sessionKey);
                const hasSols = report.sols && report.sols.length > 0;
                const errorRoles = Object.entries(report.err)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3);

                return (
                  <div
                    key={sessionKey}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-800/50"
                  >
                    {/* Session header */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        {formatDateTime(report.ts)}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {levelLabel(report.lvl)}
                      </span>
                      <span className={`font-semibold ${scoreColorAggregate(score)}`}>
                        {score.toFixed(0)}%
                      </span>
                      {errorRoles.map(([role, count]) => (
                        <span
                          key={role}
                          className="text-[10px] px-1 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300"
                        >
                          {role.toUpperCase()} {count}x
                        </span>
                      ))}
                      {hasSols && (
                        <button
                          onClick={() => toggleSols(sessionKey)}
                          className="ml-auto text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600
                                     text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700
                                     transition-colors"
                        >
                          {isExpanded ? 'Verberg antwoorden' : 'Bekijk antwoorden'}
                        </button>
                      )}
                    </div>

                    {/* Expanded solutions */}
                    {isExpanded && hasSols && (
                      <div className="mt-3 space-y-2">
                        <ErrorLegend />
                        {report.sols!.map((sol, si) => {
                          const sentence = sentenceMap.get(sol.sid);
                          if (!sentence) {
                            return (
                              <div
                                key={si}
                                className="text-xs text-slate-400 dark:text-slate-500 italic"
                              >
                                Zin #{sol.sid} niet gevonden
                              </div>
                            );
                          }
                          const comparison = compareSentence(sentence, sol);
                          const isPerfect = comparison.summary.splitErrors === 0 && comparison.summary.labelErrors === 0;
                          return (
                            <SentenceComparison
                              key={si}
                              comparison={comparison}
                              sentenceLabel={sentence.label}
                              isPerfect={isPerfect}
                            />
                          );
                        })}
                      </div>
                    )}

                    {/* Fallback: sentence ID badges when no sols */}
                    {isExpanded && !hasSols && report.sids.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {report.sids.map(sid => (
                          <span
                            key={sid}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                          >
                            #{sid}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* For reports without sols, show toggle for sids fallback */}
                    {!hasSols && report.sids.length > 0 && !isExpanded && (
                      <button
                        onClick={() => toggleSols(sessionKey)}
                        className="mt-1 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        Toon zin-nummers
                      </button>
                    )}
                  </div>
                );
              })}

              {studentReports.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                  Geen sessies gevonden.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// SummaryCard sub-component
// ---------------------------------------------------------------------------

const SummaryCard: React.FC<{
  label: string;
  value: string;
  extra?: React.ReactNode;
}> = ({ label, value, extra }) => (
  <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-2 text-center">
    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">
      {label}
    </div>
    <div className="flex items-center justify-center gap-1">
      {value && (
        <span className="text-lg font-semibold text-slate-800 dark:text-slate-200">{value}</span>
      )}
      {extra}
    </div>
  </div>
);

export default LearnersTab;
