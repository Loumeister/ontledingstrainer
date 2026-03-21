import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { TrainerState } from '../hooks/useTrainer';
import { SCORE_TIPS, ENCOURAGEMENT_POOLS, STREAK_MILESTONES, ROLES } from '../constants';
import { ScoreRing } from '../components/ScoreRing';
import { SentenceResultCard } from '../components/SentenceResultCard';
import { ProgressChart } from '../components/ProgressChart';
import { loadSessionHistory, getStreak } from '../sessionHistory';
import { buildReport, encodeReport } from '../sessionReport';
import { postReport, getScriptUrl } from '../googleDriveSync';

type ScoreScreenProps = Pick<TrainerState,
  | 'sessionStats'
  | 'mistakeStats'
  | 'sessionSentenceResults'
  | 'resetToHome'
  | 'startSession'
  | 'sessionQueue'
  | 'selectedLevel'
>;

const STUDENT_INFO_KEY = 'student_info_v1';

export const ScoreScreen: React.FC<ScoreScreenProps> = ({
  sessionStats,
  mistakeStats,
  sessionSentenceResults,
  resetToHome,
  startSession,
  sessionQueue,
  selectedLevel,
}) => {
  const [studentName, setStudentName] = useState('');
  const [studentKlas, setStudentKlas] = useState('');
  const [reportCode, setReportCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState('');

  // Pre-fill from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STUDENT_INFO_KEY);
      if (saved) {
        const { name, klas } = JSON.parse(saved) as { name?: string; klas?: string };
        if (name) setStudentName(name);
        if (klas) setStudentKlas(klas);
      }
    } catch { /* ignore */ }
  }, []);

  const scorePercentage = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;

  // Session history (includes the just-saved session as the last entry)
  const history = useMemo(() => loadSessionHistory(), []);
  const previousScore = history.length >= 2 ? history[history.length - 2].scorePercentage : null;
  const streak = useMemo(() => getStreak(), []);

  // All mistakes sorted by frequency
  const sortedMistakes = useMemo(() =>
    Object.entries(mistakeStats).sort((a, b) => (b[1] as number) - (a[1] as number)),
    [mistakeStats]
  );

  // Badges
  const perfectSentences = sessionSentenceResults.filter(r => r.isPerfect).length;
  const totalSentences = sessionSentenceResults.length;
  const isImproved = previousScore !== null && scorePercentage > previousScore;

  // Mastered roles: roles that had errors in previous sessions but none now
  const previousMistakeRoles = useMemo(() => {
    if (history.length < 2) return new Set<string>();
    const prev = history[history.length - 2];
    return new Set(Object.keys(prev.mistakeStats));
  }, [history]);
  const masteredRoles = useMemo(() => {
    const currentErrorRoles = new Set(Object.keys(mistakeStats));
    return [...previousMistakeRoles].filter(r => !currentErrorRoles.has(r));
  }, [previousMistakeRoles, mistakeStats]);

  useEffect(() => {
    if (scorePercentage === 100) {
      // Gold/yellow perfection burst
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.4 }, colors: ['#FFD700', '#FFA500', '#FF6347', '#FFD700'] });
    } else if (scorePercentage >= 80 && isImproved && previousScore !== null && scorePercentage - previousScore > 10) {
      // Big improvement: blue/green growth burst
      confetti({ particleCount: 100, spread: 90, origin: { y: 0.5 }, colors: ['#3B82F6', '#10B981', '#06B6D4'] });
    } else if (scorePercentage >= 80) {
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
    }
    if (streak >= 7) {
      // Flame burst for weekly streak milestone
      setTimeout(() => confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 }, colors: ['#EF4444', '#F97316', '#FBBF24'] }), 600);
    }
  }, []);

  const encouragement = useMemo(() => {
    const tier = scorePercentage >= 90 ? 3 : scorePercentage >= 75 ? 2 : scorePercentage >= 55 ? 1 : 0;
    const pool = ENCOURAGEMENT_POOLS[tier];
    return pool[Math.floor(Math.random() * pool.length)];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scorePercentage]);

  // Recommended action
  const weakestRole = sortedMistakes.length > 0 ? sortedMistakes[0][0] : null;
  const recommendation = scorePercentage >= 80
    ? { text: 'Klaar voor een nieuwe uitdaging! Probeer een nieuwe set zinnen.', buttonText: 'Nieuwe sessie' }
    : scorePercentage >= 55
    ? { text: weakestRole ? `Focus op ${weakestRole} en probeer het nog een keer.` : 'Probeer het nog een keer.', buttonText: 'Nog een keer' }
    : { text: 'Probeer dezelfde zinnen opnieuw om je score te verbeteren.', buttonText: 'Opnieuw proberen' };

  // Collapsible sections
  const [showSentences, setShowSentences] = useState(scorePercentage < 70);
  const [showProgress, setShowProgress] = useState(false);

  const driveConfigured = !!getScriptUrl();

  const buildAndEncodeReport = () => {
    const sentenceIds = sessionQueue.map(s => s.id);
    const report = buildReport(
      studentName.trim(),
      sessionStats.correct,
      sessionStats.total,
      mistakeStats,
      selectedLevel,
      sentenceIds,
      undefined,
      studentKlas.trim() || undefined,
    );
    return encodeReport(report);
  };

  const handleSendReport = async () => {
    const naam = studentName.trim();
    const klas = studentKlas.trim();
    if (!naam || !klas) return;

    // Save for next time
    try {
      localStorage.setItem(STUDENT_INFO_KEY, JSON.stringify({ name: naam, klas }));
    } catch { /* ignore */ }

    const code = buildAndEncodeReport();
    setReportCode(code);
    setCopied(false);
    setSubmitStatus('sending');
    setSubmitError('');
    try {
      await postReport(naam, '', klas, code);
      setSubmitStatus('success');
    } catch (err) {
      setSubmitStatus('error');
      setSubmitError(err instanceof Error ? err.message : 'Onbekende fout');
    }
  };

  const handleCopyCode = () => {
    if (reportCode) {
      navigator.clipboard.writeText(reportCode)
        .then(() => setCopied(true))
        .catch(() => {
          // Fallback: select the text in the input so user can copy manually
          const input = document.querySelector<HTMLInputElement>('input[readonly]');
          if (input) { input.select(); input.setSelectionRange(0, input.value.length); }
        });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 font-sans transition-colors duration-300">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* === Section 0: Send to teacher (top — so students submit immediately) === */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 text-left shadow-lg">
          <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2 text-sm">📤 Stuur resultaten naar je docent</h3>
          {submitStatus !== 'success' ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  placeholder="Voornaam *"
                  maxLength={40}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:border-blue-500 outline-none"
                />
                <input
                  type="text"
                  value={studentKlas}
                  onChange={e => setStudentKlas(e.target.value)}
                  placeholder="Klas * (bv. 1ga)"
                  maxLength={10}
                  className="w-32 px-3 py-2 text-sm rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:border-blue-500 outline-none"
                />
              </div>
              {submitStatus === 'error' && (
                <p className="text-xs text-red-600 dark:text-red-400">{submitError}</p>
              )}
              {!driveConfigured && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  De Drive-koppeling is nog niet ingesteld door de docent.
                  {reportCode && ' Kopieer de code hieronder als alternatief.'}
                </p>
              )}
              <button
                onClick={handleSendReport}
                disabled={!studentName.trim() || !studentKlas.trim() || submitStatus === 'sending'}
                className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitStatus === 'sending' ? 'Versturen…' : 'Verstuur naar docent'}
              </button>
              {/* Fallback: show code after it's been generated (even on error) */}
              {reportCode && (
                <div className="pt-2 border-t border-blue-100 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Reservecode (gebruik als het versturen mislukt):</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={reportCode}
                      className="flex-1 px-2 py-1.5 text-xs font-mono rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 select-all"
                      onFocus={e => e.target.select()}
                    />
                    <button
                      onClick={handleCopyCode}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700'}`}
                    >
                      {copied ? <span aria-live="polite">✓ Gekopieerd</span> : 'Kopieer'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-green-700 dark:text-green-300 font-semibold text-sm">
                ✓ Resultaten verstuurd naar de docent!
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {studentName} — klas {studentKlas.toLowerCase()}
              </p>
            </div>
          )}
        </div>

        {/* === Section 1: Score Summary === */}
        <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center animate-in zoom-in-95 duration-300">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Sessie Voltooid!</h2>

          <div className="flex flex-col items-center gap-3 mb-4">
            <ScoreRing percentage={scorePercentage} />

            <p className="text-slate-500 dark:text-slate-400">
              {sessionStats.correct} van de {sessionStats.total} zinsdelen goed
            </p>

            {/* Comparison with previous session */}
            {previousScore !== null && (
              <div className="flex items-center gap-1.5 text-sm">
                {scorePercentage > previousScore ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    &#9650; {scorePercentage - previousScore}% hoger dan vorige sessie
                  </span>
                ) : scorePercentage < previousScore ? (
                  <span className="text-orange-600 dark:text-orange-400 font-medium">
                    &#9660; {previousScore - scorePercentage}% lager dan vorige sessie
                  </span>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400">
                    Gelijk aan vorige sessie
                  </span>
                )}
              </div>
            )}
          </div>

          <p className="text-slate-600 dark:text-slate-300 font-medium">{encouragement}</p>

          {/* Badges row */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {perfectSentences > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full border border-green-200 dark:border-green-800">
                &#9733; {perfectSentences}/{totalSentences} perfect
              </span>
            )}
            {isImproved && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full border border-blue-200 dark:border-blue-800">
                &#9650; Stijger!
              </span>
            )}
            {streak >= 2 && (() => {
              const milestone = STREAK_MILESTONES.find(([min]) => streak >= min);
              if (!milestone) return null;
              const [, emoji, msg] = milestone;
              const isNumberPrefix = /^\d/.test(msg);
              return (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full border border-amber-200 dark:border-amber-800">
                  {emoji} {isNumberPrefix ? msg : `${streak} dagen ${msg}`}
                </span>
              );
            })()}
            {masteredRoles.map((role, idx) => (
              <span
                key={role}
                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full border border-purple-200 dark:border-purple-800 animate-in fade-in slide-in-from-bottom duration-300"
                style={{ animationDelay: `${idx * 200}ms` }}
              >
                &#127942; {role} onder de knie!
              </span>
            ))}
          </div>

          {/* Rollenkas – mastery trophy wall */}
          <RollenKas mistakeStats={mistakeStats} />
        </section>

        {/* === Section 2: Per-sentence overview === */}
        {sessionSentenceResults.length > 0 && (
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button
              onClick={() => setShowSentences(!showSentences)}
              aria-expanded={showSentences}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <h3 className="font-bold text-slate-800 dark:text-white">
                Per zin bekijken
                <span className="text-sm font-normal text-slate-400 dark:text-slate-500 ml-2">
                  ({perfectSentences}/{totalSentences} perfect)
                </span>
              </h3>
              <span className={`text-slate-400 dark:text-slate-500 transition-transform ${showSentences ? 'rotate-180' : ''}`}>
                &#9660;
              </span>
            </button>
            {showSentences && (
              <div className="px-4 pb-4 space-y-2">
                {sessionSentenceResults.map((result, idx) => (
                  <SentenceResultCard key={result.sentence.id} result={result} index={idx} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* === Section 3: Mistake Analysis === */}
        {sortedMistakes.length > 0 && (
          <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">Foutenanalyse</h3>

            {/* Split errors separate */}
            {mistakeStats['Verdeling'] && (
              <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-orange-800 dark:text-orange-200 text-sm">Verdelingsfouten</span>
                  <span className="text-orange-600 dark:text-orange-300 text-xs font-medium">{mistakeStats['Verdeling']}x</span>
                </div>
                {SCORE_TIPS['Verdeling'] && (
                  <p className="text-xs text-orange-700 dark:text-orange-300 italic mt-1">{SCORE_TIPS['Verdeling']}</p>
                )}
              </div>
            )}

            {/* Role errors with frequency bars */}
            <div className="space-y-3">
              {sortedMistakes
                .filter(([role]) => role !== 'Verdeling')
                .map(([role, count]) => {
                  const maxCount = sortedMistakes[0][1] as number;
                  const barWidth = Math.max(10, ((count as number) / maxCount) * 100);
                  return (
                    <div key={role}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">{role}</span>
                        <span className="text-slate-500 dark:text-slate-400 text-xs">{count}x fout</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-red-400 dark:bg-red-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      {SCORE_TIPS[role] && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-1">{SCORE_TIPS[role]}</p>
                      )}
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {/* === Section 4: Progress over time === */}
        {history.length >= 2 && (
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button
              onClick={() => setShowProgress(!showProgress)}
              aria-expanded={showProgress}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <h3 className="font-bold text-slate-800 dark:text-white">
                Voortgang
                <span className="text-sm font-normal text-slate-400 dark:text-slate-500 ml-2">
                  ({history.length} sessies)
                </span>
              </h3>
              <span className={`text-slate-400 dark:text-slate-500 transition-transform ${showProgress ? 'rotate-180' : ''}`}>
                &#9660;
              </span>
            </button>
            {showProgress && (
              <div className="px-6 pb-5 space-y-3">
                <ProgressChart history={history} />
                <WeakestRoleOverTime history={history} />
              </div>
            )}
          </section>
        )}

        {/* === Section 5: Recommended action === */}
        <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">{recommendation.text}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={resetToHome}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Terug naar Home
            </button>
            <button
              onClick={startSession}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
            >
              {recommendation.buttonText}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

// --- Helper sub-components ---

function RollenKas({ mistakeStats }: { mistakeStats: Record<string, number> }) {
  const [open, setOpen] = React.useState(false);
  const errorRoles = new Set(Object.keys(mistakeStats));

  return (
    <div className="mt-4 border-t border-slate-100 dark:border-slate-700 pt-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center gap-1 mx-auto"
      >
        <span>{open ? '▲' : '▼'}</span> Bekijk je rollenkas
      </button>
      {open && (
        <div className="mt-3 grid grid-cols-4 gap-2 animate-in fade-in slide-in-from-top duration-200">
          {ROLES.map(role => {
            const mastered = !errorRoles.has(role.label);
            return (
              <div
                key={role.key}
                className={`flex flex-col items-center p-2 rounded-xl border text-xs font-medium transition-all ${
                  mastered
                    ? `${role.colorClass} ${role.borderColorClass}`
                    : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 opacity-40 grayscale'
                }`}
              >
                <span className="text-lg leading-none">{mastered ? '✓' : '○'}</span>
                <span className="mt-1 text-center leading-tight">{role.shortLabel}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WeakestRoleOverTime({ history }: { history: import('../types').SessionHistoryEntry[] }) {
  // Aggregate mistakes across all sessions
  const aggregated: Record<string, number> = {};
  for (const session of history) {
    for (const [role, count] of Object.entries(session.mistakeStats)) {
      aggregated[role] = (aggregated[role] || 0) + count;
    }
  }
  const sorted = Object.entries(aggregated).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;

  const top3 = sorted.slice(0, 3);
  return (
    <div className="text-center">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Meest lastige onderdelen (alle sessies):</p>
      <div className="flex flex-wrap justify-center gap-2">
        {top3.map(([role, count]) => (
          <span
            key={role}
            className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full"
          >
            {role} ({count}x)
          </span>
        ))}
      </div>
    </div>
  );
}
