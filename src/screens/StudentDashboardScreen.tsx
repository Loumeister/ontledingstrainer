/**
 * StudentDashboardScreen — Persoonlijke voortgang voor de ingelogde student.
 *
 * Route: #/mijn-voortgang
 *
 * Toont:
 * - Overzicht van voltooide sessies (score, datum, niveau)
 * - Gemiddelde en beste score
 * - Top-5 rolfouten (heatmap-stijl)
 *
 * Databron: trainerSubmissionStore + analyticsHelpers
 * Bestaande flows (SessionHistory, ScoreScreen) blijven ongewijzigd.
 */

import React, { useMemo } from 'react';
import { getOrCreateStudent } from '../services/studentStore';
import { getSubmissionsForStudent } from '../services/trainerSubmissionStore';
import { computeTrainerStudentProgress } from '../logic/analyticsHelpers';
import { ROLES } from '../constants';

interface StudentDashboardScreenProps {
  /** Volledige naam van de student, zoals ingevoerd bij het aanmelden. */
  studentName: string;
  /** Initiaal van de student (bijv. "J."), gebruikt voor weergave. */
  studentInitiaal: string;
  /** Klasnaam van de student (bijv. "2B"), gebruikt als zoeksleutel in studentStore. */
  studentKlas: string;
  /** Callback die wordt aangeroepen als de gebruiker op "Terug" klikt. */
  onBack: () => void;
  /** Als `true`, wordt de dark-mode CSS-class op de pagina gezet. */
  darkMode?: boolean;
}

const LEVEL_LABELS: Record<number, string> = {
  0: 'Instap', 1: 'Basis', 2: 'Middel', 3: 'Hoog', 4: 'Samengesteld',
};

/**
 * Scherm voor de persoonlijke voortgang van een leerling.
 *
 * Laadt de studentidentiteit via `studentStore.getOrCreateStudent()` op basis
 * van naam en klas, haalt de bijbehorende submissions op, en berekent een
 * samenvatting via `computeTrainerStudentProgress()`.
 *
 * Heeft geen schrijf-side-effects: laadt enkel data uit localStorage en toont
 * berekende statistieken. Submissies worden aangemaakt door `useTrainer.ts`.
 */
export const StudentDashboardScreen: React.FC<StudentDashboardScreenProps> = ({
  studentName,
  studentInitiaal,
  studentKlas,
  onBack,
  darkMode,
}) => {
  const student = useMemo(
    () => getOrCreateStudent(studentName, studentInitiaal, studentKlas),
    [studentName, studentInitiaal, studentKlas],
  );

  const submissions = useMemo(
    () => getSubmissionsForStudent(student.id),
    [student.id],
  );

  const progress = useMemo(
    () => computeTrainerStudentProgress(submissions, student.id),
    [submissions, student.id],
  );

  const completedSubs = useMemo(
    () =>
      submissions
        .filter(s => s.completedAt)
        .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!)),
    [submissions],
  );

  const pageClass = `min-h-screen p-4 ${darkMode ? 'dark bg-slate-900' : 'bg-slate-100'}`;

  return (
    <div className={pageClass}>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Mijn voortgang</h1>
              {studentName && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {studentName}{studentKlas ? ` · ${studentKlas}` : ''}
                </p>
              )}
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors"
            >
              Terug
            </button>
          </div>

          {completedSubs.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm py-8 text-center">
              Nog geen voltooide oefensessies gevonden. Start een sessie om je voortgang bij te houden.
            </p>
          ) : (
            <>
              {/* Samenvattingskaarten */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-center">
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{progress.sessionCount}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">sessies</p>
                </div>
                <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-center">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{Math.round(progress.bestScore)}%</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">beste score</p>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-center">
                  <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{Math.round(progress.avgScore)}%</p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">gemiddeld</p>
                </div>
              </div>

              {/* Rolfouten */}
              {progress.topErrors.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Meest gemaakte fouten</h2>
                  <div className="space-y-1.5">
                    {progress.topErrors.map(({ role, count }) => {
                      const roleDef = ROLES.find(r => r.key === role);
                      const maxCount = progress.topErrors[0]?.count ?? 1;
                      const pct = Math.round((count / maxCount) * 100);
                      return (
                        <div key={role} className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${roleDef?.colorClass ?? 'bg-slate-200 text-slate-700'} min-w-[3.5rem] text-center`}>
                            {roleDef?.shortLabel ?? role}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-red-400 dark:bg-red-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 w-6 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sessieoverzicht */}
              <div>
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Recente sessies</h2>
                <div className="space-y-2">
                  {completedSubs.slice(0, 10).map(s => {
                    const pct = s.scoreTotal > 0 ? Math.round((s.scoreCorrect / s.scoreTotal) * 100) : 0;
                    const scoreColor =
                      pct >= 90 ? 'text-green-600 dark:text-green-400' :
                      pct >= 75 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400';
                    const date = new Date(s.completedAt!).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
                    return (
                      <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500 dark:text-slate-400">{date}</span>
                          {s.levelPlayed !== null && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {LEVEL_LABELS[s.levelPlayed] ?? `N${s.levelPlayed}`}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {s.scoreCorrect}/{s.scoreTotal}
                          </span>
                          <span className={`text-sm font-bold ${scoreColor}`}>{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
