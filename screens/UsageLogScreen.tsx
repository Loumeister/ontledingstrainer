import React, { useState, useEffect } from 'react';
import { loadUsageData, clearUsageData, exportUsageDataAsJson } from '../usageData';
import { loadInteractionLog, clearInteractionLog, exportInteractionLogAsJson, computeClickthroughStats } from '../interactionLog';
import { loadAllSentences } from '../data/sentenceLoader';
import { getCustomSentences } from '../data/customSentenceStore';
import type { SentenceUsageData } from '../types';

const EDITOR_PIN = '1234';
const DEV_PIN = '4321';
const PIN_SESSION_KEY = 'editor-pin-ok';
const DEV_SESSION_KEY = 'dev-pin-ok';

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
  const [isDev, setIsDev] = useState(() => sessionStorage.getItem(DEV_SESSION_KEY) === 'true');

  const [enrichedData, setEnrichedData] = useState<EnrichedUsage[]>([]);
  const [sortField, setSortField] = useState<SortField>('attempts');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterSource, setFilterSource] = useState<'all' | 'builtin' | 'custom'>('all');
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [showRawData, setShowRawData] = useState(false);
  const [showInteractionLog, setShowInteractionLog] = useState(false);

  useEffect(() => {
    if (!authenticated) return;
    const customSentences = getCustomSentences();
    loadAllSentences().then(builtIn => {
      const all = [
        ...builtIn.map(s => ({ ...s, _isCustom: false })),
        ...customSentences.map(s => ({ ...s, _isCustom: true })),
      ];

      const usageStore = loadUsageData();
      const enriched: EnrichedUsage[] = [];

      for (const s of all) {
        const usage = usageStore[s.id];
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
      for (const [idStr, usage] of Object.entries(usageStore)) {
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
  }, [authenticated]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === DEV_PIN) {
      sessionStorage.setItem(PIN_SESSION_KEY, 'true');
      sessionStorage.setItem(DEV_SESSION_KEY, 'true');
      setAuthenticated(true);
      setIsDev(true);
      setPinError(false);
    } else if (pinInput === EDITOR_PIN) {
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
  const topRoleErrors = Object.entries(globalRoleErrors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Difficult sentences: low perfect rate with >= 3 attempts
  const difficultSentences = enrichedData
    .filter(d => d.usage.attempts >= 3 && d.perfectRate < 40)
    .sort((a, b) => a.perfectRate - b.perfectRate)
    .slice(0, 5);

  // Sentences where students often gave up (show answer)
  const gaveUpSentences = enrichedData
    .filter(d => d.usage.showAnswerCount >= 2)
    .sort((a, b) => b.usage.showAnswerCount - a.usage.showAnswerCount)
    .slice(0, 5);

  // Easy sentences: high perfect rate with >= 3 attempts
  const easySentences = enrichedData
    .filter(d => d.usage.attempts >= 3 && d.perfectRate >= 80)
    .sort((a, b) => b.perfectRate - a.perfectRate)
    .slice(0, 5);

  // Helper: describe the success rate in plain Dutch
  const describeRate = (rate: number): { text: string; emoji: string; colorClass: string } => {
    if (rate >= 80) return { text: 'Goed begrepen', emoji: '🟢', colorClass: 'text-emerald-600 dark:text-emerald-400' };
    if (rate >= 50) return { text: 'Redelijk', emoji: '🟡', colorClass: 'text-amber-600 dark:text-amber-400' };
    if (rate >= 25) return { text: 'Lastig', emoji: '🟠', colorClass: 'text-orange-600 dark:text-orange-400' };
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
            <div className="text-3xl mb-1">{avgPerfectRate >= 60 ? '🎉' : avgPerfectRate >= 30 ? '💪' : '📚'}</div>
            <div className={`text-2xl font-bold ${avgPerfectRate >= 60 ? 'text-emerald-600 dark:text-emerald-400' : avgPerfectRate >= 30 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>{avgPerfectRate.toFixed(0)}%</div>
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

        {/* Second insights row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gave-up sentences */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-700 dark:text-white text-base mb-1">🏳️ Opgegeven zinnen</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Zinnen waar leerlingen het antwoord meteen bekeken hebben</p>
            {gaveUpSentences.length === 0 ? (
              <p className="text-slate-400 text-sm italic">Leerlingen proberen het zelf — prima!</p>
            ) : (
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
            )}
          </div>

          {/* Easy sentences */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-700 dark:text-white text-base mb-1">✅ Goed begrepen zinnen</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Zinnen die leerlingen goed beheersen</p>
            {easySentences.length === 0 ? (
              <p className="text-slate-400 text-sm italic">
                {totalAttempts < 10 ? 'Nog niet genoeg data.' : 'Nog geen zinnen consequent goed gemaakt.'}
              </p>
            ) : (
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
            )}
          </div>
        </div>

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

        {/* Per-sentence cards (mobile-friendly) */}
        <div className="space-y-3">
          {sorted.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <p className="text-slate-400 text-sm">Geen gebruiksdata beschikbaar. Zodra leerlingen oefenen verschijnen hier de resultaten.</p>
            </div>
          ) : sorted.map(d => {
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
            } else if (d.perfectRate >= 80) {
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
        </div>

        {/* Developer-only sections — requires dev PIN */}
        {isDev && (
          <>
            {/* Clickthrough Stats */}
            {(() => {
              const interactionLog = loadInteractionLog();
              const ctStats = computeClickthroughStats(interactionLog);
              return (
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-700 dark:text-white text-sm mb-3">Clickthrough &amp; Error Statistieken <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 font-medium ml-1">dev</span></h3>
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
              );
            })()}

            {/* Interaction Log */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setShowInteractionLog(!showInteractionLog)}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showInteractionLog ? '▼ Interactielog verbergen' : '▶ Interactielog tonen'} <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 font-medium ml-1">dev</span>
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
                {showRawData ? '▼ Ruwe data verbergen' : '▶ Ruwe data tonen'} <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 font-medium ml-1">dev</span>
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
