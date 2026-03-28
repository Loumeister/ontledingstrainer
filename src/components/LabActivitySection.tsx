import React, { useState, useEffect } from 'react';
import { getSubmissions, exportSubmissionsAsJson } from '../services/labSubmissionStore';
import { CONSTRUCTION_FRAMES } from '../data/constructionFrames';
import type { LabSubmission } from '../types';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

const LabActivitySection: React.FC = () => {
  const [submissions, setSubmissions] = useState<LabSubmission[]>([]);
  const [filterKlas, setFilterKlas] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [filterFrame, setFilterFrame] = useState('');
  const [showOnlyValid, setShowOnlyValid] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setSubmissions(getSubmissions());
  }, []);

  const refresh = () => setSubmissions(getSubmissions());

  const filtered = submissions.filter(s => {
    if (filterKlas && !s.studentKlas.toLowerCase().includes(filterKlas.toLowerCase())) return false;
    if (filterStudent && !s.studentName.toLowerCase().includes(filterStudent.toLowerCase())) return false;
    if (filterFrame && s.exerciseId !== filterFrame) return false;
    if (showOnlyValid && !s.constructionValid) return false;
    return true;
  });

  // KPIs
  const total = submissions.length;
  const validCount = submissions.filter(s => s.constructionValid).length;
  const validPct = total > 0 ? Math.round((validCount / total) * 100) : null;
  const hintCount = submissions.filter(s => s.usedHint).length;
  const hintPct = total > 0 ? Math.round((hintCount / total) * 100) : null;
  const klassen = [...new Set(submissions.map(s => s.studentKlas).filter(Boolean))].sort();

  const frameLabel = (exerciseId: string) => {
    const frame = CONSTRUCTION_FRAMES.find(f => f.id === exerciseId);
    return frame?.label ?? exerciseId;
  };

  if (!expanded) {
    return (
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => { refresh(); setExpanded(true); }}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="font-bold text-slate-700 dark:text-white text-base">
              Zinsdeellab — Leerlingactiviteit
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {total} {total === 1 ? 'poging' : 'pogingen'} opgeslagen op dit apparaat
            </p>
          </div>
          <span className="text-slate-400 dark:text-slate-500">▶</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-700 dark:text-white text-base">
            Zinsdeellab — Leerlingactiviteit
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Resultaten opgeslagen op dit apparaat</p>
        </div>
        <button onClick={() => setExpanded(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm transition-colors">▼ Inklappen</button>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{total}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pogingen</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 text-center">
          <p className={`text-2xl font-bold ${validPct === null ? 'text-slate-400' : validPct >= 70 ? 'text-emerald-600 dark:text-emerald-400' : validPct >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
            {validPct !== null ? `${validPct}%` : '—'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Geldige zinnen</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{hintPct !== null ? `${hintPct}%` : '—'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Hint gebruikt</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{klassen.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Klassen</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          value={filterStudent}
          onChange={e => setFilterStudent(e.target.value)}
          placeholder="Leerling zoeken…"
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select
          value={filterKlas}
          onChange={e => setFilterKlas(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Alle klassen</option>
          {klassen.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <select
          value={filterFrame}
          onChange={e => setFilterFrame(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Alle oefeningen</option>
          {CONSTRUCTION_FRAMES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
          <input type="checkbox" checked={showOnlyValid} onChange={e => setShowOnlyValid(e.target.checked)} className="accent-emerald-500" />
          Alleen geldige zinnen
        </label>
        {total > 0 && (
          <button
            onClick={exportSubmissionsAsJson}
            className="px-3 py-1.5 text-xs rounded-lg border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
          >
            Exporteren (JSON)
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 italic text-center py-4">
          {total === 0 ? 'Nog geen Zinsdeellab-activiteit opgeslagen.' : 'Geen resultaten voor deze filters.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                <th className="pb-2 pr-3 font-semibold text-slate-500 dark:text-slate-400">Leerling</th>
                <th className="pb-2 pr-3 font-semibold text-slate-500 dark:text-slate-400">Klas</th>
                <th className="pb-2 pr-3 font-semibold text-slate-500 dark:text-slate-400">Oefening</th>
                <th className="pb-2 pr-3 font-semibold text-slate-500 dark:text-slate-400">Gebouwde zin</th>
                <th className="pb-2 pr-3 font-semibold text-slate-500 dark:text-slate-400 text-center">Geldig</th>
                <th className="pb-2 pr-3 font-semibold text-slate-500 dark:text-slate-400 text-center">Hint</th>
                <th className="pb-2 font-semibold text-slate-500 dark:text-slate-400">Datum</th>
              </tr>
            </thead>
            <tbody>
              {[...filtered].reverse().map(s => (
                <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="py-2 pr-3 font-medium text-slate-700 dark:text-slate-200">{s.studentName || <span className="italic text-slate-400">anoniem</span>}</td>
                  <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">{s.studentKlas || '—'}</td>
                  <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">{frameLabel(s.exerciseId)}</td>
                  <td className="py-2 pr-3 text-slate-600 dark:text-slate-300 max-w-[220px] truncate" title={s.builtSentence}>{s.builtSentence}</td>
                  <td className="py-2 pr-3 text-center">{s.constructionValid ? <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span> : <span className="text-red-500 dark:text-red-400 font-bold">✗</span>}</td>
                  <td className="py-2 pr-3 text-center text-slate-500 dark:text-slate-400">{s.usedHint ? 'ja' : '—'}</td>
                  <td className="py-2 text-slate-400 dark:text-slate-500 whitespace-nowrap">{formatDate(s.startedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length < submissions.length && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-right">
              {filtered.length} van {submissions.length} getoond
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default LabActivitySection;
