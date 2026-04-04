/**
 * OwnerTab — "Eigenaar" tab in usage analytics.
 *
 * Only visible for eigenaar role. Contains:
 *   Tier 1 — Owner management tools (prominent):
 *     - Feedback beheren (FeedbackEditorTab)
 *     - Drive fetch + manual import
 *     - Drive settings
 *   Tier 2 — Technical diagnostics (collapsible):
 *     - Session flow stats
 *     - Clickthrough stats
 *     - Lab activity section
 *     - Interaction log viewer
 *     - Raw usage data viewer
 */
import React, { useState } from 'react';
import type { SessionReport } from '../../services/sessionReport';
import { computeAggregateStats, decodeReport, addReport } from '../../services/sessionReport';
import { loadInteractionLog, clearInteractionLog, exportInteractionLogAsJson, computeClickthroughStats, computeSessionFlowStats } from '../../services/interactionLog';
import { loadUsageData } from '../../services/usageData';
import { fetchReports as fetchReportsFromDrive, getScriptUrl, setScriptUrl, getApiKey, setApiKey, isConfigFromEnv } from '../../services/googleDriveSync';
import type { DriveRow } from '../../services/googleDriveSync';
import { applyAliases } from '../../services/nameAliases';
import { normaliseKlas } from '../../services/sessionReport';
import FeedbackEditorTab from '../FeedbackEditorTab';
import LabActivitySection from '../LabActivitySection';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface OwnerTabProps {
  allReports: SessionReport[];
  driveReports: SessionReport[];
  driveStatus: 'idle' | 'fetching' | 'success' | 'error';
  driveError: string;
  onReportsChanged: () => void;
  setDriveReports: (reports: SessionReport[]) => void;
  setDriveStatus: (status: 'idle' | 'fetching' | 'success' | 'error') => void;
  setDriveError: (error: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const OwnerTab: React.FC<OwnerTabProps> = ({
  allReports,
  driveReports,
  driveStatus,
  driveError,
  onReportsChanged,
  setDriveReports,
  setDriveStatus,
  setDriveError,
}) => {
  // Drive settings
  const [driveUrlInput, setDriveUrlInput] = useState(() => getScriptUrl());
  const [apiKeyInput, setApiKeyInput] = useState(() => getApiKey());
  const [driveSettingsSaved, setDriveSettingsSaved] = useState(false);

  // Manual import
  const [reportInput, setReportInput] = useState('');
  const [reportMsg, setReportMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Collapsible sections
  const [showInteractionLog, setShowInteractionLog] = useState(false);
  const [showRawData, setShowRawData] = useState(false);

  const handleSaveDriveSettings = () => {
    setScriptUrl(driveUrlInput);
    setApiKey(apiKeyInput);
    setDriveSettingsSaved(true);
    setTimeout(() => setDriveSettingsSaved(false), 2000);
  };

  const handleImportReport = () => {
    const decoded = decodeReport(reportInput);
    if (!decoded) {
      setReportMsg({ text: 'Ongeldige rapportcode.', ok: false });
      return;
    }
    addReport(decoded);
    setReportMsg({ text: `Rapport van ${decoded.name || 'Anoniem'} toegevoegd (${decoded.c}/${decoded.t} goed)`, ok: true });
    setReportInput('');
    onReportsChanged();
  };

  const handleFetchFromDrive = async () => {
    setDriveStatus('fetching');
    setDriveError('');
    try {
      const rows: DriveRow[] = await fetchReportsFromDrive();
      const decoded: SessionReport[] = rows
        .map(row => {
          const r = decodeReport(row.code);
          if (!r) return null;
          if (!r.name && row.naam) r.name = row.naam;
          if (!r.initiaal && row.initiaal) r.initiaal = row.initiaal;
          if (!r.klas && row.klas) r.klas = normaliseKlas(row.klas);
          else if (r.klas) r.klas = normaliseKlas(r.klas);
          applyAliases(r);
          return r;
        })
        .filter((r): r is SessionReport => r !== null);
      setDriveReports(decoded);
      setDriveStatus('success');
    } catch (err) {
      setDriveError(err instanceof Error ? err.message : 'Onbekende fout');
      setDriveStatus('error');
    }
  };

  const formatDuration = (sec: number) => {
    if (sec < 60) return `${Math.round(sec)} sec`;
    return `${Math.floor(sec / 60)} min ${Math.round(sec % 60)} sec`;
  };

  const interactionLog = loadInteractionLog();
  const ctStats = computeClickthroughStats(interactionLog);
  const flowStats = computeSessionFlowStats(interactionLog);
  const usageStore = loadUsageData();

  return (
    <div className="space-y-6">

      {/* ================================================================= */}
      {/* TIER 1: Owner management tools                                     */}
      {/* ================================================================= */}

      {/* Feedback beheren — FIRST SECTION, prominently placed */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border-2 border-violet-200 dark:border-violet-800">
        <h3 className="font-bold text-slate-700 dark:text-white text-base mb-1">
          Feedback beheren
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
          Pas de feedbackteksten aan die leerlingen te zien krijgen bij een fout.
          Klik op een rol om de verwarringsparen uit te klappen.
        </p>
        <FeedbackEditorTab />
      </div>

      {/* Drive fetch + import */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-700 dark:text-white text-base mb-1">
          Leerlingrapporten ophalen
        </h3>

        {/* Fetch from Drive */}
        <div className="mb-4">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Haal alle ingestuurde resultaten op uit Google Drive</p>
          <button onClick={handleFetchFromDrive}
            disabled={driveStatus === 'fetching' || !getScriptUrl()}
            className="w-full py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {driveStatus === 'fetching' ? 'Ophalen...' : `Haal resultaten op uit Drive${driveReports.length > 0 ? ` (${driveReports.length} geladen)` : ''}`}
          </button>
          {driveStatus === 'success' && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              {driveReports.length} rapport{driveReports.length !== 1 ? 'en' : ''} opgehaald
            </p>
          )}
          {driveStatus === 'error' && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{driveError}</p>
          )}
          {!getScriptUrl() && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Drive-koppeling niet ingesteld. Configureer de Apps Script URL hieronder.
            </p>
          )}
        </div>

        {/* Manual import */}
        <details className="border-t border-slate-100 dark:border-slate-700 pt-3">
          <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">
            Handmatig rapportcode plakken (reserve / offline)
          </summary>
          <div className="space-y-2 mt-2">
            <textarea value={reportInput}
              onChange={e => { setReportInput(e.target.value); setReportMsg(null); }}
              placeholder="Plak rapportcode hier (begint met v1:)..."
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:border-blue-500 outline-none resize-none h-16" />
            <button onClick={handleImportReport} disabled={!reportInput.trim()}
              className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Importeer rapport
            </button>
            {reportMsg && (
              <p className={`text-xs font-medium ${reportMsg.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {reportMsg.text}
              </p>
            )}
          </div>
        </details>

        {allReports.length > 0 && (() => {
          const stats = computeAggregateStats(allReports);
          return (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Totaal: {allReports.length} rapport{allReports.length !== 1 ? 'en' : ''} van {stats.uniqueStudents} leerling{stats.uniqueStudents !== 1 ? 'en' : ''}
            </p>
          );
        })()}
      </div>

      {/* Drive Settings */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-700 dark:text-white text-sm mb-3">Google Drive koppeling</h3>
        <div className="space-y-3">
          {isConfigFromEnv() && (
            <p className="text-[10px] text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1.5 rounded-lg border border-green-200 dark:border-green-800">
              Koppeling is ingebakken in de build (env var). Alle leerlingen uploaden automatisch naar het Google Sheet. Waarden die je hieronder opslaat hebben voorrang.
            </p>
          )}
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Apps Script Web App URL</label>
            <input type="url" value={driveUrlInput} onChange={e => setDriveUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              API-sleutel <span className="text-[10px] text-slate-400">(kopieer en plak ook in de Apps Script eigenschappen)</span>
            </label>
            <div className="flex gap-2">
              <input type="text" value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:border-blue-500 outline-none" />
              <button onClick={() => { const k = crypto.randomUUID(); setApiKeyInput(k); }}
                className="px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                title="Genereer nieuwe sleutel">Nieuw</button>
              <button onClick={() => navigator.clipboard.writeText(apiKeyInput)}
                className="px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Kopieer</button>
            </div>
          </div>
          <button onClick={handleSaveDriveSettings}
            className="w-full py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors">
            {driveSettingsSaved ? 'Opgeslagen' : 'Sla koppeling op'}
          </button>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Zie <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">docs/google-drive-koppeling.md</code> voor stap-voor-stap setup-instructies.
          </p>
        </div>
      </div>

      {/* ================================================================= */}
      {/* TIER 2: Technical diagnostics                                      */}
      {/* ================================================================= */}

      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <h3 className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-4 uppercase tracking-wider">Technische diagnostiek</h3>

        {/* Session flow stats */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
          <h3 className="font-bold text-slate-700 dark:text-white text-sm mb-3">Sessie-statistieken</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center text-sm">
            <div>
              <span className="font-bold text-blue-600 dark:text-blue-400">{flowStats.sessionsStarted}</span>
              <br/><span className="text-xs text-slate-500">Sessies gestart</span>
            </div>
            <div>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{flowStats.sessionsFinished}</span>
              <br/><span className="text-xs text-slate-500">Sessies voltooid</span>
            </div>
            <div>
              <span className="font-bold text-orange-600 dark:text-orange-400">{flowStats.sessionsAborted}</span>
              <br/><span className="text-xs text-slate-500">Afgebroken</span>
            </div>
            <div>
              <span className={`font-bold ${flowStats.completionRate >= 70 ? 'text-emerald-600 dark:text-emerald-400' : flowStats.completionRate >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                {flowStats.completionRate.toFixed(0)}%
              </span>
              <br/><span className="text-xs text-slate-500">Voltooiingspercentage</span>
            </div>
            <div>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {flowStats.avgSessionDurationSec != null ? formatDuration(flowStats.avgSessionDurationSec) : '—'}
              </span>
              <br/><span className="text-xs text-slate-500">Gem. sessieduur</span>
            </div>
          </div>
          {flowStats.activeDays.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <span className="text-xs text-slate-400 block mb-2">Actieve dagen ({flowStats.activeDays.length}):</span>
              <div className="flex flex-wrap gap-1.5">
                {flowStats.activeDays.slice(-14).map(day => (
                  <span key={day} className="text-[11px] px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-medium">
                    {new Date(day).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                    <span className="text-[10px] text-indigo-400 ml-1">({flowStats.activityPerDay[day]})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clickthrough stats */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
          <h3 className="font-bold text-slate-700 dark:text-white text-sm mb-3">Doorklik- en foutstatistieken</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-sm">
            <div><span className="font-bold text-blue-600 dark:text-blue-400">{ctStats.totalSessions}</span><br/><span className="text-xs text-slate-500">Sessies</span></div>
            <div><span className="font-bold text-indigo-600 dark:text-indigo-400">{ctStats.totalSentencesStarted}</span><br/><span className="text-xs text-slate-500">Zinnen gestart</span></div>
            <div><span className="font-bold text-emerald-600 dark:text-emerald-400">{ctStats.totalChecks}</span><br/><span className="text-xs text-slate-500">Controles</span></div>
            <div><span className="font-bold text-amber-600 dark:text-amber-400">{ctStats.totalHints}</span><br/><span className="text-xs text-slate-500">Hints</span></div>
            <div><span className="font-bold text-orange-600 dark:text-orange-400">{ctStats.totalShowAnswers}</span><br/><span className="text-xs text-slate-500">Antwoord bekeken</span></div>
            <div><span className="font-bold text-red-600 dark:text-red-400">{ctStats.totalSplitErrors}</span><br/><span className="text-xs text-slate-500">Splitfouten</span></div>
            <div><span className="font-bold text-red-600 dark:text-red-400">{ctStats.totalRoleErrors}</span><br/><span className="text-xs text-slate-500">Rolfouten</span></div>
            <div><span className="font-bold text-red-600 dark:text-red-400">{ctStats.totalBijzinFunctieErrors}</span><br/><span className="text-xs text-slate-500">Bijzin-functiefouten</span></div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Gem. acties per zin: {ctStats.avgActionsPerSentence.toFixed(1)}</p>
        </div>

        {/* Lab activity */}
        <div className="mb-4">
          <LabActivitySection />
        </div>

        {/* Interaction log */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => setShowInteractionLog(!showInteractionLog)}
              className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              {showInteractionLog ? 'Interactielog verbergen' : 'Interactielog tonen'}
            </button>
            <div className="flex gap-2">
              <button onClick={() => exportInteractionLogAsJson()} className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 font-medium hover:bg-emerald-200 transition-colors">Exporteer log</button>
              <button onClick={() => { if (confirm('Interactielog wissen?')) clearInteractionLog(); }} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 font-medium hover:bg-red-200 transition-colors">Wis log</button>
            </div>
          </div>
          {showInteractionLog && (
            <pre className="mt-3 p-3 bg-slate-900 text-green-400 rounded-lg text-xs overflow-auto max-h-96 font-mono">
              {JSON.stringify(interactionLog.slice(-200), null, 2)}
            </pre>
          )}
        </div>

        {/* Raw usage data */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <button onClick={() => setShowRawData(!showRawData)}
            className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            {showRawData ? 'Ruwe data verbergen' : 'Ruwe data tonen'}
          </button>
          {showRawData && (
            <pre className="mt-3 p-3 bg-slate-900 text-green-400 rounded-lg text-xs overflow-auto max-h-96 font-mono">
              {JSON.stringify(usageStore, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerTab;
