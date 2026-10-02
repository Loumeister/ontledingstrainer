/**
 * UsageLogScreen — Teacher analytics dashboard (/#/usage)
 *
 * Thin shell: auth gate, data loading, tab bar, and tab rendering.
 * All UI logic lives in the tab components under src/components/usage/.
 *
 * Access:
 *   Docent   → tabs: Overzicht, Leerlingen, Zinnen, Beheer
 *   Eigenaar → all of the above + Eigenaar tab
 *
 * Central data is loaded from the authorized own API, scoped to student ownership.
 * Local/offline reports and event logs are not merged into received pupil work.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { RequireAccount } from '../components/RequireAccount';
import { api, type AccountSession } from '../services/secureApi';
import { fetchReports } from '../services/googleDriveSync';
import { loadAllSentences } from '../data/sentenceLoader';
import { getCustomSentences } from '../data/customSentenceStore';
import { decodeReport } from '../services/sessionReport';
import type { SessionReport } from '../services/sessionReport';
import type { SentenceUsageData, Sentence } from '../types';
import type { EnrichedUsage } from '../components/usage/types';
import type { UserStats } from '../services/interactionLog';

// Tab components
import { OverviewTab } from '../components/usage/OverviewTab';
import { LearnersTab } from '../components/usage/LearnersTab';
import { SentencesTab } from '../components/usage/SentencesTab';
import { OwnerTab } from '../components/usage/OwnerTab';
import { StudentRegister } from '../components/usage/StudentRegister';

// ---------------------------------------------------------------------------
// mergeReportDataIntoUsage — overlays imported session reports on local usage
// ---------------------------------------------------------------------------

function mergeReportDataIntoUsage(
  localStore: Record<number, SentenceUsageData>,
  reports: SessionReport[]
): Record<number, SentenceUsageData> {
  const merged: Record<number, SentenceUsageData> = JSON.parse(JSON.stringify(localStore));
  const ensureEntry = (sid: number) => {
    if (!merged[sid]) {
      merged[sid] = { attempts: 0, perfectCount: 0, showAnswerCount: 0, roleErrors: {}, splitErrors: 0, flagged: false, note: '', lastAttempted: '' };
    }
  };
  for (const r of reports) {
    if (r.res && r.res.length > 0) {
      for (const { sid, ok } of r.res) {
        ensureEntry(sid);
        merged[sid].attempts += 1;
        if (ok) merged[sid].perfectCount += 1;
        if (!merged[sid].lastAttempted || r.ts > merged[sid].lastAttempted) {
          merged[sid].lastAttempted = r.ts;
        }
      }
    } else {
      const isPerfectSession = r.t > 0 && r.c === r.t;
      for (const sid of r.sids) {
        ensureEntry(sid);
        merged[sid].attempts += 1;
        if (isPerfectSession) merged[sid].perfectCount += 1;
        if (!merged[sid].lastAttempted || r.ts > merged[sid].lastAttempted) {
          merged[sid].lastAttempted = r.ts;
        }
      }
    }
  }
  return merged;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabId = 'overzicht' | 'leerlingen' | 'zinnen' | 'beheer' | 'eigenaar';

interface UsageLogScreenProps {
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS: Array<{ id: TabId; label: string; eigenaarOnly?: boolean }> = [
  { id: 'overzicht', label: 'Overzicht' },
  { id: 'leerlingen', label: 'Leerlingen' },
  { id: 'zinnen', label: 'Zinnen' },
  { id: 'beheer', label: 'Beheer' },
  { id: 'eigenaar', label: 'Eigenaar', eigenaarOnly: true },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const UsageLogScreen: React.FC<UsageLogScreenProps> = ({ onBack }) => {
  return <RequireAccount roles={['teacher', 'owner']}>{user => <UsageLogContent onBack={onBack} user={user} />}</RequireAccount>;
};
const UsageLogContent: React.FC<UsageLogScreenProps & { user: AccountSession }> = ({ onBack, user }) => {
  const isEigenaar = user.role === 'owner';

  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>('overzicht');

  // Core data
  const [enrichedData, setEnrichedData] = useState<EnrichedUsage[]>([]);
  const [sentenceMap, setSentenceMap] = useState<Map<number, Sentence>>(new Map());
  const perUserStats: UserStats[] = [];

  // Drive fetch state (not persisted — fetched fresh each time)
  const [driveStatus, setDriveStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');
  const [driveError, setDriveError] = useState('');
  const [driveReports, setDriveReports] = useState<SessionReport[]>([]);

  // Shared filter state (used by OverviewTab + LearnersTab)
  const [filterKlas, setFilterKlas] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterTimeFrom, setFilterTimeFrom] = useState('');
  const [filterTimeTo, setFilterTimeTo] = useState('');

  const handleReportsChanged = useCallback(() => {
    setDriveStatus('fetching'); setDriveError('');
    void fetchReports().then(rows => {
      setDriveReports(rows.flatMap(row => {
        const report = decodeReport(row.code);
        return report ? [{ ...report, studentId: row.studentId }] : [];
      }));
      setDriveStatus('success');
    }).catch(error => { setDriveReports([]); setDriveStatus('error'); setDriveError(error.message); });
  }, []);
  useEffect(handleReportsChanged, [handleReportsChanged]);

  // Load sentence data + build enrichedData whenever reports change
  useEffect(() => {
    const customSentences = getCustomSentences();
    loadAllSentences().then(builtIn => {
      const all = [
        ...builtIn.map(s => ({ ...s, _isCustom: false })),
        ...customSentences.map(s => ({ ...s, _isCustom: true })),
      ];

      // Build sentence token map for solution display
      const tokenMap = new Map<number, Sentence>();
      for (const s of all) tokenMap.set(s.id, s);
      setSentenceMap(tokenMap);

      const mergedStore = mergeReportDataIntoUsage({}, driveReports);
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

      // Include usage data for sentences no longer in the active set
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
  }, [driveReports]);
  const allReports = driveReports;

  // Visible tabs based on role
  const visibleTabs = TABS.filter(t => !t.eigenaarOnly || isEigenaar);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-2 md:p-4 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-4">

        {/* Header */}
        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
                  Hoe gaat het met de klas?
                </span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Overzicht van hoe leerlingen het doen met de zinsontleding
              </p>
            </div>
            <button onClick={onBack} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              ← Terug
            </button>
            <button type="button" onClick={() => { void api('/auth/logout', {}).then(() => { window.location.hash = '#/'; }).catch(() => setDriveError('Afmelden niet gelukt. Probeer opnieuw.')); }} className="px-3 py-2 border rounded-lg text-slate-700 dark:text-slate-200">Afmelden</button>
          </div>
        </div>
        <div className="text-sm text-slate-700 dark:text-slate-200 space-x-3">
          <span role="status">{driveStatus === 'fetching' ? 'Rapporten laden…' : `${driveReports.length} ingestuurde rapporten`}</span>
          <button type="button" disabled={driveStatus === 'fetching'} onClick={handleReportsChanged} className="underline">Verversen</button>
          {driveError && <p role="alert" className="text-red-600 dark:text-red-400">{driveError}</p>}
        </div>

        {/* Tab bar */}
        <div role="tablist" className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1 flex gap-1 overflow-x-auto">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active tab */}
        {activeTab === 'overzicht' && (
          <OverviewTab
            allReports={allReports}
            enrichedData={enrichedData}
            perUserStats={perUserStats}
            filterDate={filterDate}
            setFilterDate={setFilterDate}
            filterTimeFrom={filterTimeFrom}
            setFilterTimeFrom={setFilterTimeFrom}
            filterTimeTo={filterTimeTo}
            setFilterTimeTo={setFilterTimeTo}
            filterKlas={filterKlas}
            setFilterKlas={setFilterKlas}
            filterStudent={filterStudent}
            setFilterStudent={setFilterStudent}
          />
        )}

        {activeTab === 'leerlingen' && (
          <LearnersTab
            allReports={allReports}
            enrichedData={enrichedData}
            sentenceMap={sentenceMap}
            perUserStats={perUserStats}
            filterKlas={filterKlas}
            setFilterKlas={setFilterKlas}
          />
        )}

        {activeTab === 'zinnen' && (
          <SentencesTab enrichedData={enrichedData} allReports={allReports} sentenceMap={sentenceMap} />
        )}

        {activeTab === 'beheer' && (
          <StudentRegister onChanged={handleReportsChanged} />
        )}

        {activeTab === 'eigenaar' && isEigenaar && (
          <OwnerTab
            allReports={allReports}
            driveReports={driveReports}
            driveStatus={driveStatus}
            driveError={driveError}
            onReportsChanged={handleReportsChanged}
            setDriveReports={setDriveReports}
            setDriveStatus={setDriveStatus}
            setDriveError={setDriveError}
          />
        )}
      </div>
    </div>
  );
};

export default UsageLogScreen;
