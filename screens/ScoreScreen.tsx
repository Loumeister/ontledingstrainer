import React, { useState } from 'react';
import { TrainerState } from '../hooks/useTrainer';
import { SCORE_TIPS } from '../constants';
import { buildReport, encodeReport } from '../sessionReport';

type ScoreScreenProps = Pick<TrainerState,
  | 'sessionStats'
  | 'mistakeStats'
  | 'resetToHome'
  | 'startSession'
  | 'sessionQueue'
  | 'selectedLevel'
>;

export const ScoreScreen: React.FC<ScoreScreenProps> = ({
  sessionStats,
  mistakeStats,
  resetToHome,
  startSession,
  sessionQueue,
  selectedLevel,
}) => {
  const [studentName, setStudentName] = useState('');
  const [reportCode, setReportCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const scorePercentage = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;
  const topMistakes = Object.entries(mistakeStats).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 3);

  const encouragement = scorePercentage >= 90
    ? 'Uitstekend! Je beheerst de zinsontleding goed. 🌟'
    : scorePercentage >= 75
    ? 'Goed gedaan! Met nog wat oefening word je een expert.'
    : scorePercentage >= 55
    ? 'Je bent op de goede weg. Oefen vooral de aandachtspunten hieronder.'
    : 'Niet getreurd – oefening baart kunst! Focus op de basisonderdelen: PV en OW.';

  const handleGenerateReport = () => {
    const sentenceIds = sessionQueue.map(s => s.id);
    const report = buildReport(
      studentName.trim(),
      sessionStats.correct,
      sessionStats.total,
      mistakeStats,
      selectedLevel,
      sentenceIds,
    );
    setReportCode(encodeReport(report));
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 font-sans flex items-center justify-center transition-colors duration-300">
      <main className="max-w-xl w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg text-center border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Sessie Voltooid! 🎉</h2>
        <div className="mb-4">
          <div className={`text-6xl font-black mb-2 ${scorePercentage >= 80 ? 'text-green-600 dark:text-green-400' : scorePercentage >= 55 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>{scorePercentage}%</div>
          <p className="text-slate-500 dark:text-slate-400">Je hebt {sessionStats.correct} van de {sessionStats.total} zinsdelen goed benoemd.</p>
        </div>
        <p className="text-slate-600 dark:text-slate-300 mb-8 font-medium">{encouragement}</p>
        {topMistakes.length > 0 && (
          <div className="mb-8 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800 text-left">
            <h3 className="font-bold text-orange-800 dark:text-orange-200 mb-2">Aandachtspunten:</h3>
            <ul className="space-y-2 text-sm text-orange-800 dark:text-orange-200">
              {topMistakes.map(([role, count]) => (
                <li key={role}>
                  <div className="flex items-start gap-1">
                    <span className="font-semibold shrink-0">{role}:</span>
                    <span>{count}x fout</span>
                  </div>
                  {SCORE_TIPS[role] && (
                    <p className="mt-0.5 text-xs text-orange-700 dark:text-orange-300 italic pl-1">💡 {SCORE_TIPS[role]}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Share with teacher */}
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-left">
          <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2 text-sm">📤 Deel met je docent</h3>
          {!reportCode ? (
            <div className="space-y-2">
              <input
                type="text"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                placeholder="Je naam (optioneel)"
                className="w-full px-3 py-2 text-sm rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:border-blue-500 outline-none"
              />
              <button
                onClick={handleGenerateReport}
                className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Maak rapportcode aan
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-blue-700 dark:text-blue-300">Kopieer deze code en geef hem aan je docent:</p>
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
                  {copied ? '✓ Gekopieerd' : 'Kopieer'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-4">
          <button onClick={resetToHome} className="px-8 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Terug naar Home</button>
          <button onClick={startSession} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors">Nog een keer</button>
        </div>
      </main>
    </div>
  );
};
