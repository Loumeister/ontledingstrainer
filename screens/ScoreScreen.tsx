import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { TrainerState } from '../hooks/useTrainer';
import { SCORE_TIPS } from '../constants';

type ScoreScreenProps = Pick<TrainerState,
  | 'sessionStats'
  | 'mistakeStats'
  | 'resetToHome'
  | 'startSession'
>;

export const ScoreScreen: React.FC<ScoreScreenProps> = ({
  sessionStats,
  mistakeStats,
  resetToHome,
  startSession,
}) => {
  const scorePercentage = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;
  const topMistakes = Object.entries(mistakeStats).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 3);

  useEffect(() => {
    if (scorePercentage === 100) {
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.4 } });
    } else if (scorePercentage >= 80) {
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
    }
  }, []);

  const encouragement = scorePercentage >= 90
    ? 'Uitstekend! Je beheerst de zinsontleding goed. 🌟'
    : scorePercentage >= 75
    ? 'Goed gedaan! Met nog wat oefening word je een expert.'
    : scorePercentage >= 55
    ? 'Je bent op de goede weg. Oefen vooral de aandachtspunten hieronder.'
    : 'Niet getreurd – oefening baart kunst! Focus op de basisonderdelen: PV en OW.';

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
        <div className="flex justify-center gap-4">
          <button onClick={resetToHome} className="px-8 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Terug naar Home</button>
          <button onClick={startSession} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors">Nog een keer</button>
        </div>
      </main>
    </div>
  );
};
