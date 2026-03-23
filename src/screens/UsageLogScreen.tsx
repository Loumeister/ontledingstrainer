import React, { useState, useEffect } from 'react';
import { loadUsageData, clearUsageData, exportUsageDataAsJson } from '../services/usageData';
import { loadInteractionLog, clearInteractionLog, exportInteractionLogAsJson, computeClickthroughStats, computeSessionFlowStats, computePerUserStats } from '../services/interactionLog';
import { loadAllSentences } from '../data/sentenceLoader';
import { getCustomSentences } from '../data/customSentenceStore';
import { decodeReport, addReport, loadReports, clearReports, computeAggregateStats, computeStudentStats, normaliseKlas, renameKlas, deleteReportByIndex } from '../services/sessionReport';
import type { SessionReport, JaarlaagStats } from '../services/sessionReport';
import { fetchReports as fetchReportsFromDrive, getScriptUrl, setScriptUrl, getApiKey, setApiKey, isConfigFromEnv } from '../services/googleDriveSync';
import type { DriveRow } from '../services/googleDriveSync';
import type { SentenceUsageData } from '../types';

// Score colours — twee varianten (advies: Grammar Coach)
//
// Klas-/jaarlaaggemiddelde: strenger — een 75% klasgemiddelde is een signaal
function scoreColorAggregate(pct: number): string {
  if (pct >= 90) return 'text-emerald-600 dark:text-emerald-400';
  if (pct >= 80) return 'text-yellow-600 dark:text-yellow-400';
  if (pct >= 65) return 'text-orange-500 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

// "In één keer goed"-rate: lager plafond — automatisering realistisch bij ≥70%
function scoreColorPerfectRate(pct: number): string {
  if (pct >= 70) return 'text-emerald-600 dark:text-emerald-400';
  if (pct >= 55) return 'text-yellow-600 dark:text-yellow-400';
  if (pct >= 35) return 'text-orange-500 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

function mergeReportDataIntoUsage(
  localStore: Record<number, SentenceUsageData>,
  reports: SessionReport[]
): Record<number, SentenceUsageData> {
  const merged: Record<number, SentenceUsageData> = JSON.parse(JSON.stringify(localStore));
  for (const r of reports) {
    const isPerfectSession = r.t > 0 && r.c === r.t;
    for (const sid of r.sids) {
      if (!merged[sid]) {
        merged[sid] = { attempts: 0, perfectCount: 0, showAnswerCount: 0, roleErrors: {}, splitErrors: 0, flagged: false, note: '', lastAttempted: '' };
      }
      merged[sid].attempts += 1;
      if (isPerfectSession) merged[sid].perfectCount += 1;
      if (!merged[sid].lastAttempted || r.ts > merged[sid].lastAttempted) {
        merged[sid].lastAttempted = r.ts;
      }
    }
  }
  return merged;
}

const DOCENT_PIN = '1234';
const EIGENAAR_PIN = '4321';
const PIN_SESSION_KEY = 'editor-pin-ok';
// Keep legacy key name for backward compat with existing browser sessions
const EIGENAAR_SESSION_KEY = 'eigenaar-pin-ok';

type SortField = 'id' | 'attempts' | 'perfectRate' | 'showAnswer' | 'splitErrors' | 'lastAttempted';
type SortDir = 'asc' | 'desc';

interface UsageLogScreenProps {
  onBack: () => void;
}

interface EnrichedUsage {
  sentenceId: number;
  label: string;
  level: number;
  isCustom: boolean;
  usage: SentenceUsageData;
  perfectRate: number;
  totalRoleErrors: number;
}

export const UsageLogScreen: React.FC<UsageLogScreenProps> = ({ onBack }) => {
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem(PIN_SESSION_KEY) === 'true');
  const [isEigenaar, setIsEigenaar] = useState(() => sessionStorage.getItem(EIGENAAR_SESSION_KEY) === 'true');

  const [enrichedData, setEnrichedData] = useState<EnrichedUsage[]>([]);
  const [sortField, setSortField] = useState<SortField>('attempts');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterSource, setFilterSource] = useState<'all' | 'builtin' | 'custom'>('all');
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [showRawData, setShowRawData] = useState(false);
  const [showInteractionLog, setShowInteractionLog] = useState(false);

  // Report import state (manual paste)
  const [reportInput, setReportInput] = useState('');
  const [reportMsg, setReportMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [reports, setReports] = useState(() => loadReports());

  // Drive fetch state (not persisted – fetched fresh each time)
  const [driveStatus, setDriveStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');
  const [driveError, setDriveError] = useState('');
  const [driveReports, setDriveReports] = useState<SessionReport[]>([]);

  // Filter state for reports
  const [filterKlas, setFilterKlas] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterTimeFrom, setFilterTimeFrom] = useState('');
  const [filterTimeTo, setFilterTimeTo] = useState('');

  // Editable class name state
  const [editingKlas, setEditingKlas] = useState<string | null>(null);
  const [editingKlasValue, setEditingKlasValue] = useState('');

  // Sort state for the per-student table
  type StudentSortField = 'name' | 'sessions' | 'avg' | 'best' | 'latest';
  const [studentSortField, setStudentSortField] = useState<StudentSortField>('name');
  const [studentSortDir, setStudentSortDir] = useState<SortDir>('asc');

  // Drive settings state (eigenaar only)
  const [driveUrlInput, setDriveUrlInput] = useState(() => getScriptUrl());
  const [apiKeyInput, setApiKeyInput] = useState(() => getApiKey());
  const [driveSettingsSaved, setDriveSettingsSaved] = useState(false);

  useEffect(() => {
    if (!authenticated) return;
    const customSentences = getCustomSentences();
    loadAllSentences().then(builtIn => {
      const all = [
        ...builtIn.map(s => ({ ...s, _isCustom: false })),
        ...customSentences.map(s => ({ ...s, _isCustom: true })),
      ];

      const mergedStore = mergeReportDataIntoUsage(loadUsageData(), [...reports, ...driveReports]);
      const enriched: EnrichedUsage[] = [];

      for (const s of all) {
        const usage = mergedStore[s.id];
        if (!usage) continue;
        enriched.push({
          sentenceId: s.id,
          label: s.label,
          level: s.level,
          isCustom: (s as typeof all[number])._isCustom,
          usage,
          perfectRate: usage.attempts > 0 ? (usage.perfectCount / usage.attempts) * 100 : 0,
          totalRoleErrors: Object.values(usage.roleErrors).reduce((a, b) => a + b, 0),
        });
      }

      // Also include usage data for sentences no longer in the set
      for (const [idStr, usage] of Object.entries(mergedStore)) {
        const id = Number(idStr);
        if (all.some(s => s.id === id)) continue;
        enriched.push({
          sentenceId: id,
          label: `(Verwijderd) Zin ${id}`,
          level: 0,
          isCustom: false,
          usage,
          perfectRate: usage.attempts > 0 ? (usage.perfectCount / usage.attempts) * 100 : 0,
          totalRoleErrors: Object.values(usage.roleErrors).reduce((a, b) => a + b, 0),
        });
      }

      setEnrichedData(enriched);
    });
  }, [authenticated, reports, driveReports]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === EIGENAAR_PIN) {
      sessionStorage.setItem(PIN_SESSION_KEY, 'true');
      sessionStorage.setItem(EIGENAAR_SESSION_KEY, 'true');
      setAuthenticated(true);
      setIsEigenaar(true);
      setPinError(false);
    } else if (pinInput === DOCENT_PIN) {
      sessionStorage.setItem(PIN_SESSION_KEY, 'true');
      setAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleClearData = () => {
    if (confirm('Alle gebruiksdata wissen? Dit kan niet ongedaan worden.')) {
      clearUsageData();
      setEnrichedData([]);
    }
  };

  const handleImportReport = () => {
    const decoded = decodeReport(reportInput);
    if (!decoded) {
      setReportMsg({ text: 'Ongeldige rapportcode. Vraag de leerling om een nieuwe code te genereren.', ok: false });
      return;
    }
    addReport(decoded);
    setReports(loadReports());
    const name = decoded.name || 'Anoniem';
    setReportMsg({ text: `✓ Rapport van ${name} toegevoegd (${decoded.c}/${decoded.t} goed)`, ok: true });
    setReportInput('');
  };

  const handleRefreshData = () => {
    setReports(loadReports());
    // driveReports stay in memory – re-trigger enrichment by updating reports
  };

  const handleRenameKlas = (oldKlas: string) => {
    const newKlas = editingKlasValue.trim().toLowerCase();
    if (newKlas && newKlas !== oldKlas) {
      renameKlas(oldKlas, newKlas);
      setReports(loadReports());
    }
    setEditingKlas(null);
    setEditingKlasValue('');
  };

  const handleDeleteReport = (index: number) => {
    if (confirm('Dit rapport verwijderen? Dit kan niet ongedaan worden.')) {
      deleteReportByIndex(index);
      setReports(loadReports());
    }
  };

  const handleClearReports = () => {
    if (confirm('Alle leerlingrapporten wissen? Dit kan niet ongedaan worden.')) {
      clearReports();
      setReports([]);
    }
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
          // Merge Drive metadata (naam/initiaal/klas) into the report if not in the code
          if (!r.name && row.naam) r.name = row.naam;
          if (!r.initiaal && row.initiaal) r.initiaal = row.initiaal;
          if (!r.klas && row.klas) r.klas = normaliseKlas(row.klas);
          else if (r.klas) r.klas = normaliseKlas(r.klas);
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

  const handleSaveDriveSettings = () => {
    setScriptUrl(driveUrlInput);
    setApiKey(apiKeyInput);
    setDriveSettingsSaved(true);
    setTimeout(() => setDriveSettingsSaved(false), 2000);
  };

  // Combined reports: local (manually pasted) + Drive (fetched)
  const allReports = [...reports, ...driveReports];

  // Date/time filtered reports (for the "Overzicht leerlingrapporten" section)
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

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <form onSubmit={handlePinSubmit} className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 max-w-sm w-full space-y-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white text-center">Gebruiksdata</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center">Voer de pincode in om de gebruiksdata te bekijken.</p>
          <input
            type="password"
            inputMode="numeric"
            maxLength={8}
            value={pinInput}
            onChange={e => { setPinInput(e.target.value); setPinError(false); }}
            className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:border-blue-500 outline-none"
            autoFocus
            placeholder="****"
          />
          {pinError && <p className="text-red-500 text-sm text-center font-medium">Onjuiste pincode</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onBack} className="flex-1 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Terug</button>
            <button type="submit" className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors">Open</button>
          </div>
        </form>
      </div>
    );
  }

  // --- Sorting & Filtering ---
  const filtered = enrichedData.filter(d => {
    if (filterSource === 'custom' && !d.isCustom) return false;
    if (filterSource === 'builtin' && d.isCustom) return false;
    if (filterLevel !== null && d.level !== filterLevel) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'id': cmp = a.sentenceId - b.sentenceId; break;
      case 'attempts': cmp = a.usage.attempts - b.usage.attempts; break;
      case 'perfectRate': cmp = a.perfectRate - b.perfectRate; break;
      case 'showAnswer': cmp = a.usage.showAnswerCount - b.usage.showAnswerCount; break;
      case 'splitErrors': cmp = a.usage.splitErrors - b.usage.splitErrors; break;
      case 'lastAttempted': cmp = a.usage.lastAttempted.localeCompare(b.usage.lastAttempted); break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const handleSortChange = (value: string) => {
    const [field, dir] = value.split('-') as [SortField, SortDir];
    setSortField(field);
    setSortDir(dir);
  };

  // --- Summary stats ---
  const totalAttempts = enrichedData.reduce((s, d) => s + d.usage.attempts, 0);
  const totalPerfect = enrichedData.reduce((s, d) => s + d.usage.perfectCount, 0);
  const totalShowAnswer = enrichedData.reduce((s, d) => s + d.usage.showAnswerCount, 0);
  const avgPerfectRate = totalAttempts > 0 ? (totalPerfect / totalAttempts) * 100 : 0;

  // Top 5 role errors across all sentences
  const globalRoleErrors: Record<string, number> = {};
  enrichedData.forEach(d => {
    for (const [role, count] of Object.entries(d.usage.roleErrors)) {
      globalRoleErrors[role] = (globalRoleErrors[role] || 0) + count;
    }
  });
  // Add role errors from imported reports (session-level, not per-sentence)
  for (const r of allReports) {
    for (const [role, count] of Object.entries(r.err)) {
      globalRoleErrors[role] = (globalRoleErrors[role] || 0) + count;
    }
  }
  const topRoleErrors = Object.entries(globalRoleErrors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Difficult sentences: low perfect rate with >= 3 attempts
  const difficultSentences = enrichedData
    .filter(d => d.usage.attempts >= 3 && d.perfectRate < 55)
    .sort((a, b) => a.perfectRate - b.perfectRate)
    .slice(0, 5);

  // Sentences where students often gave up (show answer)
  const gaveUpSentences = enrichedData
    .filter(d => d.usage.showAnswerCount >= 2)
    .sort((a, b) => b.usage.showAnswerCount - a.usage.showAnswerCount)
    .slice(0, 5);

  // Easy sentences: high perfect rate with >= 3 attempts
  const easySentences = enrichedData
    .filter(d => d.usage.attempts >= 3 && d.perfectRate >= 70)
    .sort((a, b) => b.perfectRate - a.perfectRate)
    .slice(0, 5);

  // --- New teacher-level stats ---

  // Level distribution: how many attempts per difficulty level
  const levelDistribution: Record<number, number> = {};
  enrichedData.forEach(d => {
    if (d.level > 0) {
      levelDistribution[d.level] = (levelDistribution[d.level] || 0) + d.usage.attempts;
    }
  });

  // Split errors vs role errors ratio
  const totalSplitErrors = enrichedData.reduce((s, d) => s + d.usage.splitErrors, 0);
  const totalRoleErrorCount = enrichedData.reduce((s, d) => s + d.totalRoleErrors, 0);

  // Aggregated stats from imported student reports (local + Drive), with optional filters
  const aggregateStats = computeAggregateStats(dateFilteredReports, filterKlas || undefined, filterStudent || undefined);

  // Helper: describe the success rate in plain Dutch
  const describeRate = (rate: number): { text: string; emoji: string; colorClass: string } => {
    if (rate >= 70) return { text: 'Goed begrepen', emoji: '🟢', colorClass: 'text-emerald-600 dark:text-emerald-400' };
    if (rate >= 55) return { text: 'Redelijk', emoji: '🟡', colorClass: 'text-yellow-600 dark:text-yellow-400' };
    if (rate >= 35) return { text: 'Lastig', emoji: '🟠', colorClass: 'text-orange-500 dark:text-orange-400' };
    return { text: 'Erg moeilijk', emoji: '🔴', colorClass: 'text-red-600 dark:text-red-400' };
  };

  const usageStore = loadUsageData();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-2 md:p-4 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
                  📊 Hoe gaat het met de klas?
                </span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Overzicht van hoe leerlingen het doen met de zinsontleding
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={handleRefreshData} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                🔄 Vernieuw
              </button>
              <button onClick={() => exportUsageDataAsJson(usageStore)} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
                ⬇ Download gegevens
              </button>
              <button onClick={handleClearData} className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">
                🗑 Wis alles
              </button>
              <button onClick={onBack} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                ← Terug
              </button>
            </div>
          </div>
        </div>

        {/* Quick Snapshot for teachers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-3xl mb-1">📝</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{enrichedData.length}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Zinnen geoefend</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-3xl mb-1">🔄</div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{totalAttempts}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Keer gecontroleerd</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-3xl mb-1">{avgPerfectRate >= 90 ? '🎉' : avgPerfectRate >= 75 ? '💪' : '📚'}</div>
            <div className={`text-2xl font-bold ${scoreColorPerfectRate(avgPerfectRate)}`}>{avgPerfectRate.toFixed(0)}%</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">In één keer goed</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-3xl mb-1">👀</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalShowAnswer}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Antwoord bekeken</div>
          </div>
        </div>

        {/* Teacher-friendly insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Where do students struggle? */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-700 dark:text-white text-base mb-1">🤔 Waar gaat het mis?</h3>
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
                        <span className="text-xs text-slate-400">{count}× fout</span>
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

          {/* Which sentences need attention? */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-700 dark:text-white text-base mb-1">⚠️ Zinnen die aandacht nodig hebben</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
              Zinnen waar leerlingen moeite mee hebben (meerdere pogingen, weinig goed)
            </p>
            {difficultSentences.length === 0 ? (
              <p className="text-slate-400 text-sm italic">
                {totalAttempts < 10 ? 'Er is nog niet genoeg geoefend om dit te bepalen.' : 'Geen opvallend moeilijke zinnen gevonden!'}
              </p>
            ) : (
              <div className="space-y-2">
                {difficultSentences.map(d => (
                  <div key={d.sentenceId} className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40">
                    <span className="text-base">🔴</span>
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

        {/* Second insights row — only shown when there's data */}
        {(gaveUpSentences.length > 0 || easySentences.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gave-up sentences */}
          {gaveUpSentences.length > 0 && (
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-700 dark:text-white text-base mb-1">🏳️ Opgegeven zinnen</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Zinnen waar leerlingen het antwoord meteen bekeken hebben</p>
            <div className="space-y-2">
              {gaveUpSentences.map(d => (
                <div key={d.sentenceId} className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40">
                  <span className="text-base">👀</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 block truncate">{d.label}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {d.usage.showAnswerCount}× antwoord bekeken
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Easy sentences */}
          {easySentences.length > 0 && (
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-700 dark:text-white text-base mb-1">✅ Goed begrepen zinnen</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Zinnen die leerlingen goed beheersen</p>
            <div className="space-y-2">
              {easySentences.map(d => (
                <div key={d.sentenceId} className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-base">🟢</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 block truncate">{d.label}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {d.perfectRate.toFixed(0)}% goed bij {d.usage.attempts} pogingen
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
        )}

        {/* Third insights row: level distribution + split vs label */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Level distribution */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-700 dark:text-white text-base mb-1">📊 Verdeling per niveau</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Hoe vaak wordt elk niveau geoefend?</p>
            {Object.keys(levelDistribution).length === 0 ? (
              <p className="text-slate-400 text-sm italic">Nog geen data.</p>
            ) : (
              <div className="space-y-2">
                {[1, 2, 3, 4].map(lvl => {
                  const count = levelDistribution[lvl] || 0;
                  const maxCount = Math.max(...Object.values(levelDistribution), 1);
                  const pct = (count / maxCount) * 100;
                  const labels = ['', 'Basis', 'Middel', 'Hoog', 'Samengesteld'];
                  const colors = ['', 'from-green-300 to-green-500', 'from-blue-300 to-blue-500', 'from-purple-300 to-purple-500', 'from-red-300 to-red-500'];
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

          {/* Split vs Label errors */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-700 dark:text-white text-base mb-1">⚖️ Verdelen vs. Benoemen</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Waar gaat het vaker mis: verdelen of benoemen?</p>
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
                    ? '💡 Leerlingen hebben meer moeite met het verdelen van zinnen in zinsdelen.'
                    : totalRoleErrorCount > totalSplitErrors
                    ? '💡 Leerlingen verdelen goed, maar benoemen de zinsdelen nog niet altijd juist.'
                    : '💡 Verdelen en benoemen gaan ongeveer even goed.'}
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Imported reports summary — visible for both docent and eigenaar */}
        {allReports.length > 0 && (
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-700 dark:text-white text-base mb-0.5">👥 Overzicht leerlingrapporten</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Geaggregeerde resultaten (Drive + handmatig)</p>
              </div>
              <button
                onClick={handleClearReports}
                className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 font-medium hover:bg-red-200 transition-colors"
              >
                Wis lokale rapporten
              </button>
            </div>

            {/* Date/time + class/student filters */}
            <div className="space-y-2 mb-3">
              {/* Date and time row — always visible */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">Datum:</span>
                <input
                  type="date"
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="text-sm px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                />
                <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">Tijd:</span>
                <input
                  type="time"
                  value={filterTimeFrom}
                  onChange={e => setFilterTimeFrom(e.target.value)}
                  className="text-sm px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                  title="Vanaf tijdstip"
                />
                <span className="text-xs text-slate-400 dark:text-slate-500">t/m</span>
                <input
                  type="time"
                  value={filterTimeTo}
                  onChange={e => setFilterTimeTo(e.target.value)}
                  className="text-sm px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                  title="Tot en met tijdstip"
                />
              </div>
              {/* Class and student row — only when klassen available */}
              {aggregateStats.klassen.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">Klas:</span>
                  <select
                    value={filterKlas}
                    onChange={e => { setFilterKlas(e.target.value); setFilterStudent(''); }}
                    className="text-sm px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                  >
                    <option value="">Alle klassen</option>
                    {aggregateStats.klassen.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                  <select
                    value={filterStudent}
                    onChange={e => setFilterStudent(e.target.value)}
                    className="text-sm px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                  >
                    <option value="">Alle leerlingen</option>
                    {aggregateStats.studentNames.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              )}
              {/* Clear all filters */}
              {(filterKlas || filterStudent || filterDate || filterTimeFrom || filterTimeTo) && (
                <button
                  onClick={() => { setFilterKlas(''); setFilterStudent(''); setFilterDate(''); setFilterTimeFrom(''); setFilterTimeTo(''); }}
                  className="text-xs px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  ✕ Alle filters wissen
                </button>
              )}
            </div>

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
                  {Object.entries(aggregateStats.globalRoleErrors)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([role, count]) => (
                      <span key={role} className="text-[11px] px-2 py-1 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-medium">
                        {role} ({count}×)
                      </span>
                    ))}
                </div>
              </div>
            )}
            {/* Activity per day from reports */}
            {Object.keys(aggregateStats.reportsPerDay).length > 1 && (
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700">
                <span className="text-xs text-slate-400 block mb-2">Rapporten per dag:</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(aggregateStats.reportsPerDay)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([day, count]) => (
                      <span key={day} className="text-[11px] px-2 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium">
                        {new Date(day).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}: {count}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Per-class breakdown */}
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
                        <tr
                          key={ks.klas}
                          className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
                          onClick={() => setFilterKlas(ks.klas)}
                        >
                          <td className="py-1 pr-3 font-medium text-blue-600 dark:text-blue-400">
                            {editingKlas === ks.klas ? (
                              <span className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editingKlasValue}
                                  onChange={e => setEditingKlasValue(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') handleRenameKlas(ks.klas); if (e.key === 'Escape') setEditingKlas(null); }}
                                  className="w-20 px-1 py-0.5 text-xs rounded border border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none"
                                  autoFocus
                                />
                                <button onClick={() => handleRenameKlas(ks.klas)} className="text-emerald-600 hover:text-emerald-700 text-xs" title="Opslaan">✓</button>
                                <button onClick={() => setEditingKlas(null)} className="text-slate-400 hover:text-slate-600 text-xs" title="Annuleren">✕</button>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                {ks.klas}
                                <button
                                  onClick={e => { e.stopPropagation(); setEditingKlas(ks.klas); setEditingKlasValue(ks.klas); }}
                                  className="text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 text-[10px]"
                                  title="Klasnaam wijzigen"
                                >✎</button>
                              </span>
                            )}
                          </td>
                          <td className="py-1 pr-3 text-center text-slate-600 dark:text-slate-300">{ks.reportCount}</td>
                          <td className="py-1 pr-3 text-center text-slate-600 dark:text-slate-300">{ks.uniqueStudents}</td>
                          <td className="py-1 text-center">
                            <span className={`font-bold ${scoreColorAggregate(ks.avgScore)}`}>
                              {ks.avgScore.toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Klik op een klas om te filteren. Klik ✎ om een klasnaam te wijzigen (alleen lokaal).</p>
              </div>
            )}

            {/* Per-student breakdown — only shown when a class is selected */}
            {filterKlas && (() => {
              const studentStats = computeStudentStats(dateFilteredReports, filterKlas);
              if (studentStats.length === 0) return null;

              const handleStudentSort = (field: StudentSortField) => {
                if (field === studentSortField) {
                  setStudentSortDir(d => d === 'asc' ? 'desc' : 'asc');
                } else {
                  setStudentSortField(field);
                  setStudentSortDir('asc');
                }
              };
              const sortedStudents = [...studentStats].sort((a, b) => {
                let cmp = 0;
                switch (studentSortField) {
                  case 'name':    cmp = a.name.localeCompare(b.name, 'nl'); break;
                  case 'sessions': cmp = a.sessionCount - b.sessionCount; break;
                  case 'avg':    cmp = a.avgScore - b.avgScore; break;
                  case 'best':   cmp = a.bestScore - b.bestScore; break;
                  case 'latest': cmp = a.latestTs.localeCompare(b.latestTs); break;
                }
                return studentSortDir === 'asc' ? cmp : -cmp;
              });
              const arrow = (f: StudentSortField) =>
                studentSortField === f ? (studentSortDir === 'asc' ? ' ↑' : ' ↓') : '';
              const thClass = (f: StudentSortField) =>
                `pb-1 pr-2 font-medium cursor-pointer select-none hover:text-slate-600 dark:hover:text-slate-200 transition-colors${studentSortField === f ? ' text-blue-500 dark:text-blue-400' : ''}`;

              return (
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-xs text-slate-400 block mb-2">
                    Leerlingen in klas <strong className="text-slate-600 dark:text-slate-300">{filterKlas}</strong>:
                  </span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-700">
                          <th className={thClass('name')} onClick={() => handleStudentSort('name')}>Leerling{arrow('name')}</th>
                          <th className={thClass('sessions') + ' text-center'} onClick={() => handleStudentSort('sessions')}>Sessies{arrow('sessions')}</th>
                          <th className={thClass('avg') + ' text-center'} onClick={() => handleStudentSort('avg')}>Gem.{arrow('avg')}</th>
                          <th className={thClass('best') + ' text-center'} onClick={() => handleStudentSort('best')}>Beste{arrow('best')}</th>
                          <th className={thClass('latest') + ' text-center'} onClick={() => handleStudentSort('latest')}>Laatste{arrow('latest')}</th>
                          <th className="pb-1 font-medium">Zwakste punt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedStudents.map(ss => (
                          <tr
                            key={ss.name}
                            className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
                            onClick={() => setFilterStudent(ss.name.toLowerCase())}
                          >
                            <td className="py-1.5 pr-2 font-medium text-blue-600 dark:text-blue-400 capitalize">{ss.name}</td>
                            <td className="py-1.5 pr-2 text-center text-slate-500">{ss.sessionCount}</td>
                            <td className={`py-1.5 pr-2 text-center font-bold ${scoreColorAggregate(ss.avgScore)}`}>
                              {ss.avgScore.toFixed(0)}%
                            </td>
                            <td className={`py-1.5 pr-2 text-center font-bold ${scoreColorAggregate(ss.bestScore)}`}>
                              {ss.bestScore.toFixed(0)}%
                            </td>
                            <td className="py-1.5 pr-2 text-center text-slate-400">
                              {new Date(ss.latestTs).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                            </td>
                            <td className="py-1.5 text-slate-500">
                              {ss.topErrors[0]?.role ?? '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Klik op een leerling om in te zoomen.</p>
                </div>
              );
            })()}

            {/* Student detail drill-down — individual reports */}
            {filterStudent && (() => {
              const sentenceMap = new Map(enrichedData.map(e => [e.sentenceId, e.label]));
              const studentReports = allReports
                .map((r, idx) => ({ report: r, originalIndex: idx < reports.length ? idx : -1 }))
                .filter(({ report: r }) => r.name.toLowerCase() === filterStudent.toLowerCase())
                .sort((a, b) => b.report.ts.localeCompare(a.report.ts));

              if (studentReports.length === 0) return null;

              return (
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-xs text-slate-400 block mb-2">
                    Sessies van <strong className="text-slate-600 dark:text-slate-300 capitalize">{filterStudent}</strong>:
                  </span>
                  <div className="space-y-3">
                    {studentReports.map(({ report: r, originalIndex }, i) => {
                      const pct = r.t > 0 ? Math.round((r.c / r.t) * 100) : 0;
                      const errEntries = Object.entries(r.err || {}).sort((a, b) => b[1] - a[1]);
                      return (
                        <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">
                                {new Date(r.ts).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                                {' '}
                                {new Date(r.ts).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {r.lvl && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium">Niv. {r.lvl}</span>}
                              <span className={`text-xs font-bold ${scoreColorAggregate(pct)}`}>{pct}%</span>
                              <span className="text-[10px] text-slate-400">({r.c}/{r.t} goed)</span>
                            </div>
                            {originalIndex >= 0 && (
                              <button
                                onClick={() => handleDeleteReport(originalIndex)}
                                className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                                title="Verwijder dit rapport"
                              >🗑</button>
                            )}
                          </div>
                          {errEntries.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              <span className="text-[10px] text-slate-400">Fouten:</span>
                              {errEntries.map(([role, count]) => (
                                <span key={role} className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-medium">
                                  {role} ({count}×)
                                </span>
                              ))}
                            </div>
                          )}
                          {r.sids && r.sids.length > 0 && (
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-1">Zinnen ({r.sids.length}):</span>
                              <div className="flex flex-wrap gap-1">
                                {r.sids.map(sid => (
                                  <span key={sid} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-600/50 text-slate-600 dark:text-slate-300" title={sentenceMap.get(sid) || `Zin ${sid}`}>
                                    {sentenceMap.get(sid)?.replace(/^Zin \d+:\s*/, '') || `#${sid}`}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

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
                        <span className={`ml-auto font-bold text-sm ${scoreColorAggregate(js.avgScore)}`}>
                          {js.avgScore.toFixed(0)}%
                        </span>
                      </div>
                      {js.topRoleErrors.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[10px] text-slate-400">Veelste fouten:</span>
                          {js.topRoleErrors.map(e => (
                            <span key={e.role} className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-medium">
                              {e.role} ({e.count}×)
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Gebaseerd op het eerste cijfer van de klasnaam (bv. "1" uit "1ga").</p>
              </div>
            )}
          </div>
        )}

        {/* Per-user activity from interaction log (local device data) */}
        {(() => {
          const interactionLog = loadInteractionLog();
          const userStats = computePerUserStats(interactionLog);
          if (userStats.length === 0) return null;
          return (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-700 dark:text-white text-base mb-1">👤 Activiteit per leerling (dit apparaat)</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Op basis van het lokale interactielog van dit apparaat</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-700">
                      <th className="pb-1 pr-3 font-medium">Leerling</th>
                      <th className="pb-1 pr-3 font-medium text-center">Sessies</th>
                      <th className="pb-1 pr-3 font-medium text-center">Zinnen</th>
                      <th className="pb-1 pr-3 font-medium text-center">Checks</th>
                      <th className="pb-1 pr-3 font-medium text-center">Hints</th>
                      <th className="pb-1 pr-3 font-medium text-center">Antw. bekeken</th>
                      <th className="pb-1 pr-3 font-medium text-center">Fouten</th>
                      <th className="pb-1 font-medium text-center">Laatst actief</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userStats.map(us => (
                      <tr key={us.userName} className="border-b border-slate-50 dark:border-slate-800">
                        <td className="py-1.5 pr-3 font-medium text-blue-600 dark:text-blue-400">{us.userName}</td>
                        <td className="py-1.5 pr-3 text-center text-slate-600 dark:text-slate-300">{us.sessions}</td>
                        <td className="py-1.5 pr-3 text-center text-slate-600 dark:text-slate-300">{us.sentencesStarted}</td>
                        <td className="py-1.5 pr-3 text-center text-slate-600 dark:text-slate-300">{us.checks}</td>
                        <td className="py-1.5 pr-3 text-center text-amber-600 dark:text-amber-400">{us.hints}</td>
                        <td className="py-1.5 pr-3 text-center text-amber-600 dark:text-amber-400">{us.showAnswers}</td>
                        <td className="py-1.5 pr-3 text-center text-red-600 dark:text-red-400">{us.splitErrors + us.roleErrors}</td>
                        <td className="py-1.5 text-center text-slate-400">{new Date(us.lastActive).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">🔍 Bekijk:</span>
            <select
              value={filterSource}
              onChange={e => setFilterSource(e.target.value as 'all' | 'builtin' | 'custom')}
              className="text-sm px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
            >
              <option value="all">Alle zinnen</option>
              <option value="builtin">Ingebouwde zinnen</option>
              <option value="custom">Eigen zinnen</option>
            </select>
            <select
              value={filterLevel ?? ''}
              onChange={e => setFilterLevel(e.target.value ? Number(e.target.value) : null)}
              className="text-sm px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
            >
              <option value="">Alle niveaus</option>
              <option value="1">Niveau 1 – Basis</option>
              <option value="2">Niveau 2 – Middel</option>
              <option value="3">Niveau 3 – Hoog</option>
              <option value="4">Niveau 4 – Samengesteld</option>
            </select>
            <select
              value={`${sortField}-${sortDir}`}
              onChange={e => handleSortChange(e.target.value)}
              className="text-sm px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
            >
              <option value="attempts-desc">Meest geoefend</option>
              <option value="attempts-asc">Minst geoefend</option>
              <option value="perfectRate-asc">Moeilijkst eerst</option>
              <option value="perfectRate-desc">Makkelijkst eerst</option>
              <option value="showAnswer-desc">Meest antwoord bekeken</option>
              <option value="lastAttempted-desc">Laatst geoefend</option>
            </select>
            <span className="text-xs text-slate-400 ml-auto">{sorted.length} zinnen</span>
          </div>
        </div>

        {/* Per-sentence cards — grouped by level when no level filter active */}
        {(() => {
          const LEVEL_META: Record<number, { label: string; color: string; bg: string }> = {
            1: { label: 'Niveau 1 — Basis', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
            2: { label: 'Niveau 2 — Middel', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
            3: { label: 'Niveau 3 — Hoog', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' },
            4: { label: 'Niveau 4 — Samengesteld', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
            0: { label: 'Overig / Eigen zinnen', color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600' },
          };

          if (sorted.length === 0) {
            return (
              <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-slate-400 text-sm">Geen gebruiksdata beschikbaar. Zodra leerlingen oefenen verschijnen hier de resultaten.</p>
              </div>
            );
          }

          // When a specific level is filtered: flat list. Otherwise: group by level.
          const useGrouping = filterLevel === null;
          const groups = useGrouping
            ? [1, 2, 3, 4, 0]
                .map(lvl => ({ lvl, items: sorted.filter(d => d.level === lvl) }))
                .filter(g => g.items.length > 0)
            : [{ lvl: filterLevel ?? -1, items: sorted }];

          return (
            <div className="space-y-4">
              {groups.map(({ lvl, items }) => {
                const meta = LEVEL_META[lvl] ?? LEVEL_META[0];
                const avgPerfect = items.reduce((s, d) => s + d.perfectRate, 0) / items.length;
                return (
                  <LevelGroup
                    key={lvl}
                    title={useGrouping ? meta.label : ''}
                    color={meta.color}
                    bg={meta.bg}
                    count={items.length}
                    avgPerfect={useGrouping ? avgPerfect : null}
                    useGrouping={useGrouping}
                  >
                    {items.map(d => {
            const roleErrorEntries = Object.entries(d.usage.roleErrors)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3);
            const rateInfo = d.usage.attempts > 0 ? describeRate(d.perfectRate) : { text: 'Nog niet gecontroleerd', emoji: '⚪', colorClass: 'text-slate-400' };
            // Show-answer ratio: how often students gave up vs checked
            const totalInteractions = d.usage.attempts + d.usage.showAnswerCount;
            const gaveUpOften = totalInteractions > 0 && (d.usage.showAnswerCount / totalInteractions) > 0.5;

            // Pick a single, most relevant tip (priority order)
            let tip = '';
            if (d.perfectRate < 25 && d.usage.attempts >= 3) {
              tip = '💡 Tip: Deze zin is erg moeilijk. Overweeg om hem eerst klassikaal te bespreken.';
            } else if (gaveUpOften && totalInteractions >= 3) {
              tip = '💡 Tip: Leerlingen bekijken hier vaak het antwoord. Misschien is extra uitleg nodig.';
            } else if (d.perfectRate >= 25 && d.perfectRate < 50 && d.usage.splitErrors > d.usage.attempts) {
              tip = '💡 Tip: Leerlingen splitsen deze zin vaak verkeerd. Oefen het herkennen van zinsdelen.';
            } else if (d.perfectRate >= 25 && d.perfectRate < 50 && roleErrorEntries.length > 0) {
              tip = `💡 Tip: Leerlingen verwarren hier vaak het ${roleErrorEntries[0][0]}. Extra uitleg kan helpen.`;
            } else if (d.perfectRate >= 90) {
              tip = '✨ Deze zin wordt goed beheerst!';
            }

            return (
              <div key={d.sentenceId} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                {/* Title row */}
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-lg flex-shrink-0">{rateInfo.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-slate-700 dark:text-slate-200 block truncate">{d.label}</span>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`text-xs font-bold ${rateInfo.colorClass}`}>{rateInfo.text}</span>
                      {d.isCustom && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 font-medium">Eigen zin</span>}
                      {d.usage.flagged && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 font-medium">⚑ Gemarkeerd</span>}
                    </div>
                  </div>
                  {d.usage.lastAttempted && (
                    <span className="text-[10px] text-slate-400 flex-shrink-0">{new Date(d.usage.lastAttempted).toLocaleDateString('nl-NL')}</span>
                  )}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                    <div className="font-bold text-slate-700 dark:text-slate-200">{d.usage.attempts}</div>
                    <div className="text-slate-400">pogingen</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                    <div className={`font-bold ${rateInfo.colorClass}`}>{d.usage.attempts > 0 ? `${d.perfectRate.toFixed(0)}%` : '—'}</div>
                    <div className="text-slate-400">in één keer goed</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                    <div className={`font-bold ${d.usage.showAnswerCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>{d.usage.showAnswerCount}×</div>
                    <div className="text-slate-400">antwoord bekeken</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                    <div className={`font-bold ${d.usage.splitErrors > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`}>{d.usage.splitErrors}</div>
                    <div className="text-slate-400">verdeelfouten</div>
                  </div>
                </div>

                {/* Role errors detail */}
                {roleErrorEntries.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                    <span className="text-[11px] text-slate-400 block mb-1">Meest verwarde zinsdelen:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {roleErrorEntries.map(([role, count]) => (
                        <span key={role} className="text-[11px] px-2 py-1 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-medium">
                          {role} ({count}×)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Teacher-friendly insight */}
                {d.usage.attempts >= 2 && tip && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      {tip}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
                  </LevelGroup>
                );
              })}
            </div>
          );
        })()}

        {/* Eigenaar-only sections — requires eigenaar PIN */}
        {isEigenaar && (
          <>
            {/* Drive fetch + import student reports */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-700 dark:text-white text-base mb-1">
                📥 Leerlingrapporten ophalen
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 font-medium ml-1">eigenaar</span>
              </h3>

              {/* Fetch from Drive */}
              <div className="mb-4">
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Haal alle ingestuurde resultaten op uit Google Drive</p>
                <button
                  onClick={handleFetchFromDrive}
                  disabled={driveStatus === 'fetching' || !getScriptUrl()}
                  className="w-full py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {driveStatus === 'fetching' ? 'Ophalen…' : `📡 Haal resultaten op uit Drive${driveReports.length > 0 ? ` (${driveReports.length} geladen)` : ''}`}
                </button>
                {driveStatus === 'success' && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    ✓ {driveReports.length} rapport{driveReports.length !== 1 ? 'en' : ''} opgehaald
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

              {/* Manual fallback import */}
              <details className="border-t border-slate-100 dark:border-slate-700 pt-3">
                <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">
                  Handmatig rapportcode plakken (reserve / offline)
                </summary>
                <div className="space-y-2 mt-2">
                  <textarea
                    value={reportInput}
                    onChange={e => { setReportInput(e.target.value); setReportMsg(null); }}
                    placeholder="Plak rapportcode hier (begint met v1:)..."
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:border-blue-500 outline-none resize-none h-16"
                  />
                  <button
                    onClick={handleImportReport}
                    disabled={!reportInput.trim()}
                    className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Importeer rapport
                  </button>
                  {reportMsg && (
                    <p className={`text-xs font-medium ${reportMsg.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {reportMsg.text}
                    </p>
                  )}
                </div>
              </details>

              {allReports.length > 0 && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  Totaal: {allReports.length} rapport{allReports.length !== 1 ? 'en' : ''} van {computeAggregateStats(allReports).uniqueStudents} leerling{computeAggregateStats(allReports).uniqueStudents !== 1 ? 'en' : ''}
                </p>
              )}
            </div>

            {/* Drive Settings */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-700 dark:text-white text-sm mb-3">
                🔗 Google Drive koppeling
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 font-medium ml-1">eigenaar</span>
              </h3>
              <div className="space-y-3">
                {isConfigFromEnv() && (
                  <p className="text-[10px] text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1.5 rounded-lg border border-green-200 dark:border-green-800">
                    ✓ Koppeling is ingebakken in de build (env var). Alle leerlingen uploaden automatisch naar het Google Sheet. Waarden die je hieronder opslaat hebben voorrang.
                  </p>
                )}
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Apps Script Web App URL</label>
                  <input
                    type="url"
                    value={driveUrlInput}
                    onChange={e => setDriveUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                    API-sleutel <span className="text-[10px] text-slate-400">(kopieer en plak ook in de Apps Script eigenschappen)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={apiKeyInput}
                      onChange={e => setApiKeyInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:border-blue-500 outline-none"
                    />
                    <button
                      onClick={() => { const k = crypto.randomUUID(); setApiKeyInput(k); }}
                      className="px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      title="Genereer nieuwe sleutel"
                    >
                      ↻ Nieuw
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(apiKeyInput)}
                      className="px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      Kopieer
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleSaveDriveSettings}
                  className="w-full py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
                >
                  {driveSettingsSaved ? '✓ Opgeslagen' : 'Sla koppeling op'}
                </button>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  Zie <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">docs/google-drive-koppeling.md</code> voor stap-voor-stap setup-instructies.
                </p>
              </div>
            </div>

            {/* Session Flow Stats */}
            {(() => {
              const interactionLog = loadInteractionLog();
              const ctStats = computeClickthroughStats(interactionLog);
              const flowStats = computeSessionFlowStats(interactionLog);
              const formatDuration = (sec: number) => {
                if (sec < 60) return `${Math.round(sec)} sec`;
                return `${Math.floor(sec / 60)} min ${Math.round(sec % 60)} sec`;
              };
              return (
                <>
                  {/* Session flow overview */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-700 dark:text-white text-sm mb-3">
                      🔄 Sessie-statistieken
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 font-medium ml-1">eigenaar</span>
                    </h3>
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

                  {/* Clickthrough Stats */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-700 dark:text-white text-sm mb-3">
                      🖱️ Clickthrough &amp; Error Statistieken
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 font-medium ml-1">eigenaar</span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-sm">
                      <div><span className="font-bold text-blue-600 dark:text-blue-400">{ctStats.totalSessions}</span><br/><span className="text-xs text-slate-500">Sessies</span></div>
                      <div><span className="font-bold text-indigo-600 dark:text-indigo-400">{ctStats.totalSentencesStarted}</span><br/><span className="text-xs text-slate-500">Zinnen gestart</span></div>
                      <div><span className="font-bold text-emerald-600 dark:text-emerald-400">{ctStats.totalChecks}</span><br/><span className="text-xs text-slate-500">Checks</span></div>
                      <div><span className="font-bold text-amber-600 dark:text-amber-400">{ctStats.totalHints}</span><br/><span className="text-xs text-slate-500">Hints</span></div>
                      <div><span className="font-bold text-orange-600 dark:text-orange-400">{ctStats.totalShowAnswers}</span><br/><span className="text-xs text-slate-500">Antwoord bekeken</span></div>
                      <div><span className="font-bold text-red-600 dark:text-red-400">{ctStats.totalSplitErrors}</span><br/><span className="text-xs text-slate-500">Splitfouten</span></div>
                      <div><span className="font-bold text-red-600 dark:text-red-400">{ctStats.totalRoleErrors}</span><br/><span className="text-xs text-slate-500">Rolfouten</span></div>
                      <div><span className="font-bold text-red-600 dark:text-red-400">{ctStats.totalBijzinFunctieErrors}</span><br/><span className="text-xs text-slate-500">Bijzin-functiefouten</span></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Gem. acties per zin: {ctStats.avgActionsPerSentence.toFixed(1)}</p>
                  </div>
                </>
              );
            })()}

            {/* Interaction Log */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setShowInteractionLog(!showInteractionLog)}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showInteractionLog ? '▼ Interactielog verbergen' : '▶ Interactielog tonen'} <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 font-medium ml-1">eigenaar</span>
                </button>
                <div className="flex gap-2">
                  <button onClick={() => exportInteractionLogAsJson()} className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 font-medium hover:bg-emerald-200 transition-colors">Export log</button>
                  <button onClick={() => { if (confirm('Interactielog wissen?')) clearInteractionLog(); }} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 font-medium hover:bg-red-200 transition-colors">Wis log</button>
                </div>
              </div>
              {showInteractionLog && (
                <pre className="mt-3 p-3 bg-slate-900 text-green-400 rounded-lg text-xs overflow-auto max-h-96 font-mono">
                  {JSON.stringify(loadInteractionLog().slice(-200), null, 2)}
                </pre>
              )}
            </div>

            {/* Raw Usage Data */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowRawData(!showRawData)}
                className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {showRawData ? '▼ Ruwe data verbergen' : '▶ Ruwe data tonen'} <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 font-medium ml-1">eigenaar</span>
              </button>
              {showRawData && (
                <pre className="mt-3 p-3 bg-slate-900 text-green-400 rounded-lg text-xs overflow-auto max-h-96 font-mono">
                  {JSON.stringify(usageStore, null, 2)}
                </pre>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
};

// --- Helper component: collapsible level group ---

interface LevelGroupProps {
  title: string;
  color: string;
  bg: string;
  count: number;
  avgPerfect: number | null;
  useGrouping: boolean;
  children: React.ReactNode;
}

function LevelGroup({ title, color, bg, count, avgPerfect, useGrouping, children }: LevelGroupProps) {
  const [open, setOpen] = React.useState(false);

  if (!useGrouping) {
    return <div className="space-y-3">{children}</div>;
  }

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-2.5 text-left ${bg} border-b border-slate-200 dark:border-slate-700 hover:brightness-95 transition-all`}
      >
        <span className={`font-bold text-sm ${color}`}>{title}</span>
        <div className="flex items-center gap-3">
          {avgPerfect !== null && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              gem. {avgPerfect.toFixed(0)}% goed · {count} {count === 1 ? 'zin' : 'zinnen'}
            </span>
          )}
          <span className={`text-slate-400 dark:text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>
      {open && (
        <div className="bg-white dark:bg-slate-800 p-3 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}
