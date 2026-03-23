import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { TrainerState } from '../hooks/useTrainer';
import { SCORE_TIPS, ENCOURAGEMENT_POOLS, STREAK_MILESTONES, ROLES } from '../constants';
import { ScoreRing } from '../components/ScoreRing';
import { SentenceResultCard } from '../components/SentenceResultCard';
import { ProgressChart } from '../components/ProgressChart';
import {
  loadSessionHistory, getStreak,
  getPersonalRecord, updatePersonalRecord,
  getConsistencyStreak,
  getPerfectSessionCount, incrementPerfectSessionCount,
} from '../services/sessionHistory';
import { updateRoleMastery, RoleMasteryStore } from '../services/rolemastery';
import { computeRoleConfidences } from '../logic/adaptiveSelection';
import { buildReport, encodeReport } from '../services/sessionReport';
import { getScriptUrl } from '../services/googleDriveSync';

type ScoreScreenProps = Pick<TrainerState,
  | 'sessionStats'
  | 'mistakeStats'
  | 'sessionSentenceResults'
  | 'resetToHome'
  | 'startSession'
  | 'sessionQueue'
  | 'selectedLevel'
  | 'autoSendStatus'
  | 'autoSendError'
  | 'studentName'
  | 'studentInitiaal'
  | 'studentKlas'
>;

// Niveau-afhankelijke drempels (advies Grammar Coach): [green, yellow, orange]
const SCORE_THRESHOLDS: Record<number, [number, number, number]> = {
  1: [90, 80, 65],
  2: [90, 75, 60],
  3: [90, 75, 55],
  4: [85, 70, 50],
};

export const ScoreScreen: React.FC<ScoreScreenProps> = ({
  sessionStats,
  mistakeStats,
  sessionSentenceResults,
  resetToHome,
  startSession,
  sessionQueue,
  selectedLevel,
  autoSendStatus,
  autoSendError,
  studentName: studentNameProp,
  studentInitiaal: studentInitiaalProp,
  studentKlas: studentKlasProp,
}) => {
  const [reportCode, setReportCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const scorePercentage = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;

  // Session history (includes the just-saved session as the last entry)
  const history = useMemo(() => loadSessionHistory(), []);
  const previousScore = history.length >= 2 ? history[history.length - 2].scorePercentage : null;
  const streak = useMemo(() => getStreak(), []);

  // PR: check & update once on mount
  const [isNewPR, prevPR] = useMemo(() => {
    const prev = getPersonalRecord();
    const isNew = updatePersonalRecord(scorePercentage);
    return [isNew, prev] as [boolean, number];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Vlekkeloos (100%-teller): update once on mount when perfect
  const perfectCount = useMemo(() => {
    if (scorePercentage === 100) return incrementPerfectSessionCount();
    return getPerfectSessionCount();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // All mistakes sorted by frequency
  const sortedMistakes = useMemo(() =>
    Object.entries(mistakeStats).sort((a, b) => (b[1] as number) - (a[1] as number)),
    [mistakeStats]
  );

  // Badges
  const perfectSentences = sessionSentenceResults.filter(r => r.isPerfect).length;
  const totalSentences = sessionSentenceResults.length;
  const isImproved = previousScore !== null && scorePercentage > previousScore;

  // Mastered roles: roles that had errors in previous sessions but none now (session-diff badge)
  const previousMistakeRoles = useMemo(() => {
    if (history.length < 2) return new Set<string>();
    const prev = history[history.length - 2];
    return new Set(Object.keys(prev.mistakeStats));
  }, [history]);
  const masteredRoles = useMemo(() => {
    const currentErrorRoles = new Set(Object.keys(mistakeStats));
    return [...previousMistakeRoles].filter(r => !currentErrorRoles.has(r));
  }, [previousMistakeRoles, mistakeStats]);

  // Persistente rolbeheersing: update once on mount
  const { roleMasteryStore, newlyMasteredRoles } = useMemo(() => {
    const allLabels = ROLES.map(r => r.label);
    const { store, newlyMastered } = updateRoleMastery(allLabels, mistakeStats);
    return { roleMasteryStore: store, newlyMasteredRoles: newlyMastered };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scorePercentage === 100) {
      // Gold/yellow perfection burst
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.4 }, colors: ['#FFD700', '#FFA500', '#FF6347', '#FFD700'] });
    } else if (isNewPR) {
      // New personal record: coral/orange burst
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 }, colors: ['#F97316', '#EF4444', '#FB923C'] });
    } else if (scorePercentage >= 90 && isImproved && previousScore !== null && scorePercentage - previousScore > 10) {
      // Big improvement: blue/green growth burst
      confetti({ particleCount: 100, spread: 90, origin: { y: 0.5 }, colors: ['#3B82F6', '#10B981', '#06B6D4'] });
    } else if (scorePercentage >= 90) {
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
    }
    // Consistentiestreak ≥ 5: ticker-tape
    if (consistencyStreak >= 5) {
      setTimeout(() => confetti({ particleCount: 100, shapes: ['rect' as import('canvas-confetti').Shape], scalar: 0.5, spread: 100, origin: { y: 0.3 }, colors: ['#10B981', '#6EE7B7', '#34D399'] }), 400);
    }
    if (streak >= 7) {
      // Flame burst for weekly streak milestone
      setTimeout(() => confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 }, colors: ['#EF4444', '#F97316', '#FBBF24'] }), 600);
    }
  }, []);

  // Compute effective thresholds: level-specific, or weighted average for Mixed sessions
  const effectiveThresholds = useMemo((): [number, number, number] => {
    if (selectedLevel && selectedLevel >= 1 && selectedLevel <= 4) {
      return SCORE_THRESHOLDS[selectedLevel];
    }
    // Mixed: weighted average of per-level thresholds based on sentence counts in the queue
    const counts: Record<number, number> = {};
    for (const s of sessionQueue) {
      counts[s.level] = (counts[s.level] || 0) + 1;
    }
    const total = sessionQueue.length;
    if (total === 0) return [90, 75, 55];
    let green = 0, yellow = 0, orange = 0;
    for (const [lvlStr, count] of Object.entries(counts)) {
      const lvl = Number(lvlStr);
      const [g, y, o] = SCORE_THRESHOLDS[lvl] ?? [90, 75, 55];
      const w = count / total;
      green += g * w;
      yellow += y * w;
      orange += o * w;
    }
    return [Math.round(green), Math.round(yellow), Math.round(orange)];
  }, [selectedLevel, sessionQueue]);

  // Consistentiestreak: sessies achter elkaar boven groen
  const [tGreenForStreak] = effectiveThresholds;
  const consistencyStreak = useMemo(
    () => getConsistencyStreak(history, tGreenForStreak),
    [history, tGreenForStreak]
  );

  const encouragement = useMemo(() => {
    const [g, y, o] = effectiveThresholds;
    const tier = scorePercentage >= g ? 3 : scorePercentage >= y ? 2 : scorePercentage >= o ? 1 : 0;
    const pool = ENCOURAGEMENT_POOLS[tier];
    return pool[Math.floor(Math.random() * pool.length)];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scorePercentage]);

  // Recommended action
  const weakestRole = sortedMistakes.length > 0 ? sortedMistakes[0][0] : null;
  const [tGreen, , tOrange] = effectiveThresholds; // tGreenForStreak is the same value, used above
  const recommendation = scorePercentage >= tGreen
    ? { text: 'Klaar voor een nieuwe uitdaging! Probeer een nieuwe set zinnen.', buttonText: 'Nieuwe sessie' }
    : scorePercentage >= tOrange
    ? { text: weakestRole ? `Focus op ${weakestRole} en probeer het nog een keer.` : 'Probeer het nog een keer.', buttonText: 'Nog een keer' }
    : { text: 'Probeer dezelfde zinnen opnieuw om je score te verbeteren.', buttonText: 'Opnieuw proberen' };

  // Collapsible sections
  const [showSentences, setShowSentences] = useState(scorePercentage < 70);
  const [showProgress, setShowProgress] = useState(false);

  const driveConfigured = !!getScriptUrl();

  const buildAndEncodeReport = () => {
    const sentenceIds = sessionQueue.map(s => s.id);
    const report = buildReport(
      studentNameProp.trim(),
      sessionStats.correct,
      sessionStats.total,
      mistakeStats,
      selectedLevel,
      sentenceIds,
      studentInitiaalProp.trim().toUpperCase() || undefined,
      studentKlasProp.trim() || undefined,
    );
    return encodeReport(report);
  };

  const handleGenerateCode = () => {
    const code = buildAndEncodeReport();
    setReportCode(code);
    setCopied(false);
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

        {/* === Section 0: Auto-send status === */}
        {autoSendStatus !== 'idle' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 text-center shadow-lg">
            {autoSendStatus === 'sending' && (
              <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">📤 Resultaten worden verstuurd…</p>
            )}
            {autoSendStatus === 'success' && (
              <div>
                <p className="text-green-700 dark:text-green-300 font-semibold text-sm">
                  ✓ Resultaten verstuurd naar de docent!
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {studentNameProp} {studentInitiaalProp}. — klas {studentKlasProp}
                </p>
              </div>
            )}
            {autoSendStatus === 'error' && (
              <div className="space-y-2">
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">Versturen mislukt: {autoSendError}</p>
                {/* Fallback: manual send or copy code */}
                {!reportCode && (
                  <button
                    onClick={() => {
                      const code = buildAndEncodeReport();
                      setReportCode(code);
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                  >
                    Toon reservecode
                  </button>
                )}
                {reportCode && (
                  <div className="pt-2 border-t border-blue-100 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Reservecode (geef aan je docent):</p>
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
            )}
          </div>
        )}
        {autoSendStatus === 'idle' && !driveConfigured && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 text-left shadow-lg">
            <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2 text-sm">📤 Stuur resultaten naar je docent</h3>
            <div className="space-y-2">
              <p className="text-xs text-amber-600 dark:text-amber-400">
                De Drive-koppeling is nog niet ingesteld door de docent.
              </p>
              <button
                onClick={handleGenerateCode}
                disabled={!!reportCode}
                className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Toon reservecode
              </button>
              {reportCode && (
                <div className="pt-2 border-t border-blue-100 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Reservecode (geef aan je docent):</p>
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
          </div>
        )}

        {/* === Section 1: Score Summary === */}
        <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center animate-in zoom-in-95 duration-300">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Sessie Voltooid!</h2>

          <div className="flex flex-col items-center gap-3 mb-4">
            <div className={scorePercentage === 100 ? 'ring-4 ring-yellow-400 dark:ring-yellow-300 rounded-full animate-pulse-ring' : ''}>
              <ScoreRing percentage={scorePercentage} />
            </div>

            <p className="text-slate-500 dark:text-slate-400">
              {sessionStats.correct} van de {sessionStats.total} zinsdelen goed
            </p>

            {/* Eigen Record sticker */}
            {isNewPR && prevPR > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-semibold rounded-full border border-orange-200 dark:border-orange-700 animate-in zoom-in-95 duration-300">
                🏅 Eigen record!
                <span className="font-normal text-xs ml-1">
                  {scorePercentage - prevPR >= 15
                    ? `Nieuw record — ${scorePercentage}% is jouw nieuwe norm.`
                    : scorePercentage - prevPR >= 6
                    ? `Groot verschil met je vorige record. Goed bezig.`
                    : `Net iets beter dan vorige keer. Kleine stap, maar het telt.`}
                </span>
              </div>
            )}
            {isNewPR && prevPR === 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-semibold rounded-full border border-orange-200 dark:border-orange-700 animate-in zoom-in-95 duration-300">
                🏅 Eigen record — {scorePercentage}%
              </div>
            )}

            {/* Comparison with previous session */}
            {previousScore !== null && !isNewPR && (
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
            {/* Vlekkeloos (100%) */}
            {scorePercentage === 100 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-medium rounded-full border border-yellow-300 dark:border-yellow-700 animate-in zoom-in-95 duration-300">
                ✨ Vlekkeloos
                {perfectCount > 1 && <span className="ml-1 opacity-70">{perfectCount}×</span>}
              </span>
            )}
            {perfectSentences > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full border border-green-200 dark:border-green-800">
                &#9733; {perfectSentences}/{totalSentences} perfect
              </span>
            )}
            {isImproved && !isNewPR && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full border border-blue-200 dark:border-blue-800">
                &#9650; Stijger!
              </span>
            )}
            {/* Consistentiebadges */}
            {consistencyStreak >= 10 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full border border-emerald-200 dark:border-emerald-800 animate-in zoom-in-95 duration-300">
                💎 Ongekend
              </span>
            )}
            {consistencyStreak >= 5 && consistencyStreak < 10 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full border border-emerald-200 dark:border-emerald-800 animate-in zoom-in-95 duration-300">
                🎯 In de Groove
              </span>
            )}
            {consistencyStreak >= 3 && consistencyStreak < 5 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full border border-emerald-200 dark:border-emerald-800 animate-in zoom-in-95 duration-300">
                📈 Op Dreef
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
            {/* Nieuw persistente rolkenner-badges */}
            {newlyMasteredRoles.map((role, idx) => (
              <span
                key={`kenner-${role}`}
                className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-medium rounded-full border border-yellow-300 dark:border-yellow-600 animate-in fade-in slide-in-from-bottom duration-300"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                ★ {ROLES.find(r => r.label === role)?.shortLabel ?? role}-kenner
              </span>
            ))}
            {/* Sessie-diff mastery badges (vorig systeem) */}
            {masteredRoles.filter(r => !newlyMasteredRoles.includes(r)).map((role, idx) => (
              <span
                key={role}
                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full border border-purple-200 dark:border-purple-800 animate-in fade-in slide-in-from-bottom duration-300"
                style={{ animationDelay: `${idx * 200}ms` }}
              >
                &#127942; {role} onder de knie!
              </span>
            ))}
          </div>

          {/* Consistentie bericht */}
          {consistencyStreak >= 3 && scorePercentage < 100 && (
            <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400 animate-in fade-in duration-300">
              {consistencyStreak >= 10
                ? 'Tien sessies boven de norm. Dat is écht sterk.'
                : consistencyStreak >= 5
                ? 'Vijf keer op rij. Je zinsdelen zitten er in.'
                : 'Drie keer op rij boven de grens. Geen toeval meer.'}
            </p>
          )}

          {/* Vlekkeloos bericht */}
          {scorePercentage === 100 && (
            <p className="mt-3 text-sm text-yellow-700 dark:text-yellow-300 font-medium animate-in fade-in duration-500">
              {perfectCount === 1
                ? 'Eerste foutloze sessie. Je weet nu dat het kan.'
                : perfectCount >= 5
                ? `Al ${perfectCount}× vlekkeloos. Consistentie is een vak apart.`
                : 'Alweer geen fouten. Dit is gewoon hoe je dit nu doet.'}
            </p>
          )}

          {/* Rollenkas – mastery trophy wall */}
          <RollenKas mistakeStats={mistakeStats} masteryStore={roleMasteryStore} />
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
                <ProgressChart history={history} personalRecord={getPersonalRecord()} />
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

function RollenKas({ mistakeStats, masteryStore }: { mistakeStats: Record<string, number>; masteryStore: RoleMasteryStore }) {
  const [open, setOpen] = React.useState(false);
  const errorRoles = new Set(Object.keys(mistakeStats));

  // Load role confidence for visual indicators
  const confidences = React.useMemo(() => computeRoleConfidences(), []);

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
            const cleanThisSession = !errorRoles.has(role.label);
            const mastery = masteryStore[role.label];
            const isPersistentMaster = mastery?.mastered ?? false;
            const consecutive = mastery?.consecutiveClean ?? 0;
            return (
              <div
                key={role.key}
                title={isPersistentMaster ? `${role.label} — beheerst` : consecutive > 0 ? `${consecutive}/3 sessies foutloos` : role.label}
                className={`relative flex flex-col items-center p-2 rounded-xl border text-xs font-medium transition-all ${
                  cleanThisSession
                    ? isPersistentMaster
                      ? `${role.colorClass} border-yellow-400 dark:border-yellow-500 ring-1 ring-yellow-400 dark:ring-yellow-500`
                      : `${role.colorClass} ${role.borderColorClass}`
                    : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 opacity-40 grayscale'
                }`}
              >
                <span className="text-lg leading-none">
                  {isPersistentMaster ? '★' : cleanThisSession ? '✓' : '○'}
                </span>
                <span className="mt-1 text-center leading-tight">{role.shortLabel}</span>
                {/* Confidence bar */}
                {(() => {
                  const conf = confidences.get(role.key);
                  const pct = conf ? Math.round(conf.confidence * 100) : 50;
                  const barColor = pct >= 80 ? 'bg-green-400 dark:bg-green-500' : pct >= 50 ? 'bg-yellow-400 dark:bg-yellow-500' : 'bg-red-400 dark:bg-red-500';
                  return (
                    <div className="w-full mt-1 h-1 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden" title={`Beheersing: ${pct}%`}>
                      <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  );
                })()}
                {/* Voortgangsbolletjes: alleen tonen als bezig maar nog niet beheerst */}
                {!isPersistentMaster && consecutive > 0 && cleanThisSession && (
                  <span className="mt-0.5 text-[9px] opacity-60">
                    {'●'.repeat(consecutive)}{'○'.repeat(Math.max(0, 3 - consecutive))}
                  </span>
                )}
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
