/**
 * TeacherDashboardScreen — Overzichtsdashboard voor docenten.
 *
 * Route: #/docent-dashboard
 *
 * Toont (op basis van lokaal opgeslagen TrainerSubmissions):
 * - Klasoverzicht: unieke studenten, sessies, gemiddelde score
 * - Studenten per klas: individuele voortgang
 * - Rolfouten per klas / globaal
 * - Opdrachtstatus (gepubliceerde versies + inzendingen)
 *
 * Supplement aan de bestaande UsageLogScreen (#/usage + #/docent).
 * Vervangt die schermen niet — beide draaien parallel tijdens de migratie.
 *
 * Databron: trainerSubmissionStore + trainerAssignmentStore + analyticsHelpers
 * Authenticatie: PIN via sessionStorage (zelfde key als editor/usage).
 */

import React, { useState, useMemo } from 'react';
import { EDITOR_SESSION_KEY } from '../components/LoginScreen';
import { getSubmissions } from '../services/trainerSubmissionStore';
import { getAssignments } from '../services/trainerAssignmentStore';
import {
  computeTrainerStudentProgress,
  computeTrainerClassProgress,
  computeRoleErrorPatterns,
  computeAssignmentParticipation,
} from '../logic/analyticsHelpers';
import { getStudents } from '../services/studentStore';
import { ROLES } from '../constants';
import type { TrainerSubmission } from '../types';

interface TeacherDashboardScreenProps {
  /** Callback die wordt aangeroepen als de gebruiker op "Terug" klikt. */
  onBack: () => void;
  /** Als `true`, wordt de dark-mode CSS-class op de pagina gezet. */
  darkMode?: boolean;
}

const PIN_SESSION_KEY = EDITOR_SESSION_KEY;

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(pct: number): string {
  if (pct >= 90) return 'text-green-600 dark:text-green-400';
  if (pct >= 75) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Docentdashboard: overzicht van klassen, studenten en rolfouten.
 *
 * Toont een PIN-gate als de docent nog niet is ingelogd via `#/login`.
 * Na authenticatie wordt het interne `TeacherDashboardContent`-component getoond.
 *
 * Supplement aan de bestaande `UsageLogScreen` (`#/usage`): vervangt dat scherm
 * niet, maar biedt een snellere class-/studentweergave op basis van het nieuwe
 * domeinmodel. Beide schermen kunnen parallel worden gebruikt.
 */
export const TeacherDashboardScreen: React.FC<TeacherDashboardScreenProps> = ({
  onBack,
  darkMode,
}) => {
  const authenticated = sessionStorage.getItem(PIN_SESSION_KEY) === 'true';

  if (!authenticated) {
    return (
      <div className={`min-h-screen p-4 ${darkMode ? 'dark bg-slate-900' : 'bg-slate-100'} flex items-center justify-center`}>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg text-center">
          <p className="text-slate-700 dark:text-slate-200 mb-4">
            Dit dashboard is alleen toegankelijk na inloggen via <code className="text-blue-600">#/login</code>.
          </p>
          <button onClick={onBack} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Terug</button>
        </div>
      </div>
    );
  }

  return <TeacherDashboardContent onBack={onBack} darkMode={darkMode} />;
};

/**
 * Inhoudelijk deel van het docentdashboard.
 *
 * Opgesplitst van `TeacherDashboardScreen` zodat de PIN-check en de data-logica
 * van elkaar gescheiden zijn. Wordt alleen gerenderd na succesvolle authenticatie.
 *
 * Interne state:
 * - `selectedKlas` — filtert de studententabel en rolfoutenkaart op één klas
 * - `selectedStudentId` — schakelt naar de detailweergave van één student
 *
 * Alle data wordt éénmalig geladen bij mount via `useMemo`. Er zijn geen
 * write-side-effects: dit scherm schrijft geen data naar localStorage.
 */
const TeacherDashboardContent: React.FC<{ onBack: () => void; darkMode?: boolean }> = ({ onBack, darkMode }) => {
  const [selectedKlas, setSelectedKlas] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const allSubmissions = useMemo(() => getSubmissions(), []);
  const allStudents = useMemo(() => getStudents(), []);
  const allAssignments = useMemo(() => getAssignments(), []);

  // Alle klassen aanwezig in submissions
  const klassen = useMemo(() => {
    const seen = new Set<string>();
    for (const s of allSubmissions) {
      if (s.studentKlas) seen.add(s.studentKlas.trim().toLowerCase());
    }
    return [...seen].sort();
  }, [allSubmissions]);

  // Studenten in geselecteerde klas (of globaal)
  const visibleSubmissions: TrainerSubmission[] = useMemo(() => {
    if (!selectedKlas) return allSubmissions;
    return allSubmissions.filter(
      s => s.studentKlas.trim().toLowerCase() === selectedKlas,
    );
  }, [allSubmissions, selectedKlas]);

  const globalRoleErrors = useMemo(
    () => computeRoleErrorPatterns(visibleSubmissions),
    [visibleSubmissions],
  );

  // Unieke studenten in zichtbare submissions
  const visibleStudentIds = useMemo(
    () => [...new Set(visibleSubmissions.map(s => s.studentId))],
    [visibleSubmissions],
  );

  // Per-student voortgang voor de tabel
  const studentProgresses = useMemo(
    () =>
      visibleStudentIds.map(id => ({
        id,
        progress: computeTrainerStudentProgress(visibleSubmissions, id),
        name:
          allStudents.find(s => s.id === id)?.name ??
          visibleSubmissions.find(s => s.studentId === id)?.studentName ??
          id,
        klas:
          allStudents.find(s => s.id === id)?.klas ??
          visibleSubmissions.find(s => s.studentId === id)?.studentKlas ??
          '',
      })).sort((a, b) => a.name.localeCompare(b.name, 'nl')),
    [visibleStudentIds, visibleSubmissions, allStudents],
  );

  // Klas-samenvatting voor het geselecteerde filter
  const klasSummary = useMemo(
    () =>
      selectedKlas
        ? computeTrainerClassProgress(allSubmissions, selectedKlas)
        : null,
    [allSubmissions, selectedKlas],
  );

  const pageClass = `min-h-screen p-4 ${darkMode ? 'dark bg-slate-900' : 'bg-slate-100'}`;
  const cardClass = 'bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700';

  // ── Detailweergave: één student ───────────────────────────────────────────
  if (selectedStudentId) {
    const studentInfo = studentProgresses.find(sp => sp.id === selectedStudentId);
    const studentSubs = visibleSubmissions
      .filter(s => s.studentId === selectedStudentId && s.completedAt)
      .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!));

    return (
      <div className={pageClass}>
        <div className="max-w-2xl mx-auto space-y-4">
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                {studentInfo?.name ?? 'Student'}
                {studentInfo?.klas && <span className="text-slate-400 font-normal ml-2">· {studentInfo.klas}</span>}
              </h1>
              <button
                onClick={() => setSelectedStudentId(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm transition-colors"
              >
                Terug
              </button>
            </div>

            {studentInfo && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-center">
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{studentInfo.progress.sessionCount}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">sessies</p>
                </div>
                <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-center">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{Math.round(studentInfo.progress.bestScore)}%</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">beste score</p>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-center">
                  <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{Math.round(studentInfo.progress.avgScore)}%</p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">gemiddeld</p>
                </div>
              </div>
            )}

            {studentInfo && studentInfo.progress.topErrors.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Meest gemaakte fouten</h2>
                <div className="space-y-1.5">
                  {studentInfo.progress.topErrors.map(({ role, count }) => {
                    const roleDef = ROLES.find(r => r.key === role);
                    const maxCount = studentInfo.progress.topErrors[0]?.count ?? 1;
                    const pct = Math.round((count / maxCount) * 100);
                    return (
                      <div key={role} className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${roleDef?.colorClass ?? 'bg-slate-200 text-slate-700'} min-w-[3.5rem] text-center`}>
                          {roleDef?.shortLabel ?? role}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
                          <div className="h-full rounded-full bg-red-400 dark:bg-red-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Sessies</h2>
            {studentSubs.length === 0 ? (
              <p className="text-slate-400 text-sm">Geen voltooide sessies.</p>
            ) : (
              <div className="space-y-1.5">
                {studentSubs.map(s => {
                  const pct = s.scoreTotal > 0 ? Math.round((s.scoreCorrect / s.scoreTotal) * 100) : 0;
                  const date = new Date(s.completedAt!).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: '2-digit' });
                  return (
                    <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <span className="text-sm text-slate-500 dark:text-slate-400">{date}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{s.scoreCorrect}/{s.scoreTotal}</span>
                        <span className={`text-sm font-bold ${scoreColor(pct)}`}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Hoofdoverzicht ────────────────────────────────────────────────────────
  return (
    <div className={pageClass}>
      <div className="max-w-4xl mx-auto space-y-4">
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Docentdashboard</h1>
            <div className="flex gap-2">
              <a
                href="#/usage"
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Uitgebreid logboek
              </a>
              <button
                onClick={onBack}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors"
              >
                Terug
              </button>
            </div>
          </div>

          {allSubmissions.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm py-8 text-center">
              Nog geen inzendingen opgeslagen. Studenten zien hun inzendingen hier zodra ze een sessie voltooien.
            </p>
          ) : (
            <>
              {/* Klasfilter */}
              {klassen.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setSelectedKlas(null)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${selectedKlas === null ? 'bg-blue-600 text-white' : 'border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  >
                    Alle klassen
                  </button>
                  {klassen.map(klas => (
                    <button
                      key={klas}
                      onClick={() => setSelectedKlas(klas)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${selectedKlas === klas ? 'bg-blue-600 text-white' : 'border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                      {klas}
                    </button>
                  ))}
                </div>
              )}

              {/* Klassamenvatting */}
              {klasSummary && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-center">
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{klasSummary.studentCount}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">studenten</p>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-center">
                    <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{klasSummary.sessionCount}</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400">sessies</p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-center">
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{Math.round(klasSummary.avgScore)}%</p>
                    <p className="text-xs text-green-600 dark:text-green-400">gemiddeld</p>
                  </div>
                </div>
              )}

              {/* Studententabel */}
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Studenten</h2>
              <div className="space-y-1">
                {studentProgresses.map(({ id, name, klas, progress }) => {
                  const pct = Math.round(progress.avgScore);
                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedStudentId(id)}
                      className="w-full flex items-center justify-between py-2 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                    >
                      <div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{name}</span>
                        {klas && <span className="text-xs text-slate-400 ml-2">{klas}</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{progress.sessionCount} sessies</span>
                        <span className={`text-sm font-bold min-w-[3rem] text-right ${scoreColor(pct)}`}>{pct}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Rolfouten */}
        {globalRoleErrors.length > 0 && (
          <div className={cardClass}>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Rolfouten {selectedKlas ? `— klas ${selectedKlas}` : '(alle klassen)'}
            </h2>
            <div className="space-y-1.5">
              {globalRoleErrors.slice(0, 8).map(({ role, totalErrors, affectedStudents }) => {
                const roleDef = ROLES.find(r => r.key === role);
                const maxErrors = globalRoleErrors[0]?.totalErrors ?? 1;
                const pct = Math.round((totalErrors / maxErrors) * 100);
                return (
                  <div key={role} className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${roleDef?.colorClass ?? 'bg-slate-200 text-slate-700'} min-w-[3.5rem] text-center`}>
                      {roleDef?.shortLabel ?? role}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
                      <div className="h-full rounded-full bg-orange-400 dark:bg-orange-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 w-8 text-right">{totalErrors}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">({affectedStudents} st.)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Opdrachtstatus */}
        {allAssignments.length > 0 && (
          <div className={cardClass}>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Opdrachten</h2>
            <div className="space-y-2">
              {allAssignments.map(a => {
                const participation = computeAssignmentParticipation(a.id, a.version, allSubmissions);
                return (
                  <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{a.title}</p>
                      <p className="text-xs text-slate-400">versie {a.version} · {new Date(a.updatedAt).toLocaleDateString('nl-NL')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{participation.uniqueStudents} st.</p>
                      <p className="text-xs text-slate-400">{participation.submissionCount} inzendingen</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
