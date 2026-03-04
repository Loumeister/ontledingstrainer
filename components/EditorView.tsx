import React, { useState, useEffect, useCallback } from 'react';
import { ROLES } from '../constants';
import { loadAllSentences } from '../data/sentenceLoader';
import { SentenceUsageData } from '../types';
import {
  loadUsageData,
  updateTeacherData,
  clearUsageData,
  exportUsageDataAsJson,
} from '../usageData';
import {
  getCustomSentences,
  deleteCustomSentence,
  exportCustomSentences,
  buildShareUrl,
} from '../data/customSentenceStore';
import type { Sentence } from '../types';

const EDITOR_PASSWORD = 'docent2025';

type Tab = 'stats' | 'sentences';
type SortKey = 'id' | 'attempts' | 'errorRate' | 'showAnswer' | 'flagged';

interface Props {
  darkMode: boolean;
}

export function EditorView({ darkMode }: Props) {
  // ── Auth ─────────────────────────────────────────────────────
  const [authed, setAuthed] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // ── Navigation ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('stats');

  // ── All sentences (loaded async) ──────────────────────────────
  const [allSentences, setAllSentences] = useState<Sentence[]>([]);
  const [loadingSentences, setLoadingSentences] = useState(false);

  // ── Stats tab state ─────────────────────────────────────────
  const [usageData, setUsageData] = useState<Record<number, SentenceUsageData>>({});
  const [sortKey, setSortKey] = useState<SortKey>('errorRate');
  const [sortDesc, setSortDesc] = useState(true);
  const [filterFlagged, setFilterFlagged] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingNote, setEditingNote] = useState<{ id: number; text: string } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // ── Sentences tab state ──────────────────────────────────────
  const [customSentences, setCustomSentences] = useState<Sentence[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // ── Dark mode ────────────────────────────────────────────────
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // ── Data loaders ─────────────────────────────────────────────
  const refreshStats = useCallback(() => setUsageData(loadUsageData()), []);
  const refreshCustom = useCallback(() => setCustomSentences(getCustomSentences()), []);

  useEffect(() => {
    if (authed) {
      refreshStats();
      refreshCustom();
      setLoadingSentences(true);
      loadAllSentences()
        .then(setAllSentences)
        .catch((err) => console.error('Failed to load sentences:', err))
        .finally(() => setLoadingSentences(false));
    }
  }, [authed, refreshStats, refreshCustom]);

  // ── Auth ─────────────────────────────────────────────────────
  const handleLogin = () => {
    if (passwordInput === EDITOR_PASSWORD) { setAuthed(true); setPasswordError(false); }
    else setPasswordError(true);
  };

  // ── Stats tab actions ─────────────────────────────────────────
  const toggleFlag = (id: number) => {
    updateTeacherData(id, { flagged: !(usageData[id]?.flagged ?? false) });
    refreshStats();
  };

  const saveNote = (id: number, text: string) => {
    updateTeacherData(id, { note: text });
    setEditingNote(null);
    refreshStats();
  };

  // ── Sentences tab actions ─────────────────────────────────────
  const handleDelete = (id: number) => {
    deleteCustomSentence(id);
    refreshCustom();
    setConfirmDeleteId(null);
  };

  const handleCopyShareUrl = () => {
    const url = buildShareUrl(customSentences);
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    });
  };

  const handleExport = () => {
    const json = exportCustomSentences();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `docentzinnen_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenEditor = () => {
    window.location.hash = '#/editor';
    // Let App.tsx's hashchange listener take over
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };

  // ── PASSWORD SCREEN ───────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 w-full max-w-sm">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Docentenomgeving</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Voer het wachtwoord in om door te gaan.</p>
          <input
            type="password"
            value={passwordInput}
            onChange={e => setPasswordInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Wachtwoord"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white mb-2 outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {passwordError && <p className="text-red-600 dark:text-red-400 text-sm mb-3">Wachtwoord onjuist.</p>}
          <button onClick={handleLogin} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
            Inloggen
          </button>
        </div>
      </div>
    );
  }

  // ── MAIN LAYOUT ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">
      {/* Top bar with tabs */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 py-3 flex items-center gap-4">
        <div className="flex-1">
          <span className="font-bold text-slate-800 dark:text-white text-lg">Docentenomgeving</span>
          <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">Zinsontledingstrainer</span>
        </div>
        <nav className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${activeTab === 'stats' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            Statistieken
          </button>
          <button
            onClick={() => { setActiveTab('sentences'); refreshCustom(); }}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${activeTab === 'sentences' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            Mijn zinnen
            {customSentences.length > 0 && (
              <span className="ml-1.5 bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{customSentences.length}</span>
            )}
          </button>
        </nav>
      </div>

      {/* ── TAB: STATISTIEKEN ─────────────────────────────────── */}
      {activeTab === 'stats' && (
        <StatsTab
          allSentences={allSentences}
          loadingSentences={loadingSentences}
          usageData={usageData}
          sortKey={sortKey} setSortKey={setSortKey}
          sortDesc={sortDesc} setSortDesc={setSortDesc}
          filterFlagged={filterFlagged} setFilterFlagged={setFilterFlagged}
          search={search} setSearch={setSearch}
          expandedId={expandedId} setExpandedId={setExpandedId}
          editingNote={editingNote} setEditingNote={setEditingNote}
          confirmClear={confirmClear} setConfirmClear={setConfirmClear}
          toggleFlag={toggleFlag}
          saveNote={saveNote}
          onClearStats={() => { clearUsageData(); setConfirmClear(false); refreshStats(); }}
          onExportStats={() => exportUsageDataAsJson(usageData)}
        />
      )}

      {/* ── TAB: MIJN ZINNEN ──────────────────────────────────── */}
      {activeTab === 'sentences' && (
        <SentencesTab
          customSentences={customSentences}
          confirmDeleteId={confirmDeleteId}
          setConfirmDeleteId={setConfirmDeleteId}
          copySuccess={copySuccess}
          onDelete={handleDelete}
          onCopyShareUrl={handleCopyShareUrl}
          onExport={handleExport}
          onOpenEditor={handleOpenEditor}
        />
      )}
    </div>
  );
}

// ─── Stats Tab ─────────────────────────────────────────────────────────────────

interface StatsTabProps {
  allSentences: Sentence[];
  loadingSentences: boolean;
  usageData: Record<number, SentenceUsageData>;
  sortKey: SortKey; setSortKey: (k: SortKey) => void;
  sortDesc: boolean; setSortDesc: (v: boolean) => void;
  filterFlagged: boolean; setFilterFlagged: (v: boolean) => void;
  search: string; setSearch: (v: string) => void;
  expandedId: number | null; setExpandedId: (v: number | null) => void;
  editingNote: { id: number; text: string } | null;
  setEditingNote: (v: { id: number; text: string } | null) => void;
  confirmClear: boolean; setConfirmClear: (v: boolean) => void;
  toggleFlag: (id: number) => void;
  saveNote: (id: number, text: string) => void;
  onClearStats: () => void;
  onExportStats: () => void;
}

function StatsTab({
  allSentences, loadingSentences, usageData, sortKey, setSortKey, sortDesc, setSortDesc,
  filterFlagged, setFilterFlagged, search, setSearch,
  expandedId, setExpandedId, editingNote, setEditingNote,
  confirmClear, setConfirmClear,
  toggleFlag, saveNote, onClearStats, onExportStats,
}: StatsTabProps) {

  const handleSort = (k: SortKey) => {
    if (sortKey === k) setSortDesc(!sortDesc);
    else { setSortKey(k); setSortDesc(true); }
  };

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <th onClick={() => handleSort(k)} className="px-3 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 select-none whitespace-nowrap">
      {label} {sortKey === k ? (sortDesc ? '↓' : '↑') : ''}
    </th>
  );

  const levelLabel = (l: number) => ['', 'Basis', 'Middel', 'Hoog', 'Expert'][l] ?? String(l);

  const rows = allSentences.map(s => {
    const u = usageData[s.id];
    const attempts = u?.attempts ?? 0;
    const perfectCount = u?.perfectCount ?? 0;
    const showAnswerCount = u?.showAnswerCount ?? 0;
    const splitErrors = u?.splitErrors ?? 0;
    const roleErrors: Record<string, number> = u?.roleErrors ?? {};
    const errorRate = attempts > 0 ? (attempts - perfectCount) / attempts : null;
    const topError = Object.entries(roleErrors).sort((a, b) => b[1] - a[1])[0] ?? null;
    const flagged = u?.flagged ?? false;
    const note = u?.note ?? '';
    const lastAttempted = u?.lastAttempted ?? null;
    return { s, attempts, perfectCount, showAnswerCount, splitErrors, roleErrors, errorRate, topError, flagged, note, lastAttempted };
  });

  const filtered = rows.filter(r => {
    if (filterFlagged && !r.flagged) return false;
    if (search && !r.s.label.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    if (sortKey === 'id') diff = a.s.id - b.s.id;
    else if (sortKey === 'attempts') diff = a.attempts - b.attempts;
    else if (sortKey === 'errorRate') diff = (a.errorRate ?? -1) - (b.errorRate ?? -1);
    else if (sortKey === 'showAnswer') diff = a.showAnswerCount - b.showAnswerCount;
    else if (sortKey === 'flagged') diff = (a.flagged ? 1 : 0) - (b.flagged ? 1 : 0);
    return sortDesc ? -diff : diff;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xl max-w-sm w-full border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white mb-2">Alle statistieken wissen?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Dit verwijdert alle gebruiksstatistieken, vlaggen en notities permanent.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmClear(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors">Annuleer</button>
              <button onClick={onClearStats} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">Ja, wissen</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <div className="flex flex-wrap gap-3">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoek zin..." className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 w-56" />
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none">
            <input type="checkbox" checked={filterFlagged} onChange={e => setFilterFlagged(e.target.checked)} className="w-4 h-4 rounded" />
            Alleen gevlagd
          </label>
          <span className="text-sm text-slate-400 dark:text-slate-500 self-center">{sorted.length} zinnen</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onExportStats} className="px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Exporteer JSON</button>
          <button onClick={() => setConfirmClear(true)} className="px-4 py-2 text-sm font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">Data wissen</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
            <tr>
              <SortHeader label="#" k="id" />
              <th className="px-3 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Zin</th>
              <th className="px-3 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Niv.</th>
              <SortHeader label="Pogingen" k="attempts" />
              <SortHeader label="Foutrate" k="errorRate" />
              <SortHeader label="Antw.getoond" k="showAnswer" />
              <th className="px-3 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Topfout</th>
              <SortHeader label="Vlag" k="flagged" />
              <th className="px-3 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Notitie</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {loadingSentences ? (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-slate-400 dark:text-slate-500">Zinnen laden…</td></tr>
            ) : sorted.map(({ s, attempts, perfectCount, showAnswerCount, splitErrors, roleErrors, errorRate, topError, flagged, note, lastAttempted }) => (
              <React.Fragment key={s.id}>
                <tr className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${flagged ? 'bg-orange-50 dark:bg-orange-900/10' : ''}`} onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
                  <td className="px-3 py-2.5 text-slate-400 dark:text-slate-500 font-mono text-xs">{s.id}</td>
                  <td className="px-3 py-2.5 text-slate-700 dark:text-slate-200 max-w-xs"><span className="line-clamp-1">{s.label}</span></td>
                  <td className="px-3 py-2.5"><span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{levelLabel(s.level)}</span></td>
                  <td className="px-3 py-2.5 text-slate-700 dark:text-slate-200 font-mono">{attempts || '—'}</td>
                  <td className="px-3 py-2.5">
                    {errorRate === null ? <span className="text-slate-400 dark:text-slate-600">—</span> : (
                      <span className={`font-bold ${errorRate >= 0.6 ? 'text-red-600 dark:text-red-400' : errorRate >= 0.3 ? 'text-orange-500 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                        {Math.round(errorRate * 100)}%
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700 dark:text-slate-200 font-mono">{showAnswerCount || '—'}</td>
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 text-xs">{topError ? <><span className="font-semibold">{topError[0]}</span> ({topError[1]}×)</> : '—'}</td>
                  <td className="px-3 py-2.5">
                    <button onClick={e => { e.stopPropagation(); toggleFlag(s.id); }} title={flagged ? 'Vlag verwijderen' : 'Markeer als verdacht'} className={`text-lg transition-transform hover:scale-125 ${flagged ? 'opacity-100' : 'opacity-30 hover:opacity-70'}`}>
                      {flagged ? '🚩' : '⚑'}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 max-w-[140px]">
                    {editingNote?.id === s.id ? (
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <input autoFocus value={editingNote!.text} onChange={e => setEditingNote({ id: s.id, text: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') saveNote(s.id, editingNote!.text); if (e.key === 'Escape') setEditingNote(null); }} className="text-xs px-2 py-1 rounded border border-blue-400 bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none w-full" />
                        <button onClick={() => saveNote(s.id, editingNote!.text)} className="text-xs text-blue-600 font-bold px-1">✓</button>
                      </div>
                    ) : (
                      <button onClick={e => { e.stopPropagation(); setEditingNote({ id: s.id, text: note }); }} className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-left truncate max-w-full" title={note || 'Voeg notitie toe'}>
                        {note || <span className="italic opacity-40">+ notitie</span>}
                      </button>
                    )}
                  </td>
                </tr>

                {expandedId === s.id && (
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <td colSpan={9} className="px-4 py-4">
                      <div className="flex flex-wrap gap-6 text-sm">
                        <div className="flex-1 min-w-60">
                          <div className="font-semibold text-slate-600 dark:text-slate-300 mb-2">Correcte ontleding</div>
                          <div className="flex flex-wrap gap-1">
                            {(() => {
                              const chunks: { text: string; role: string }[] = [];
                              let cur: string[] = []; let curRole = '';
                              s.tokens.forEach((t, i) => {
                                const isNew = i === 0 || t.role !== s.tokens[i - 1].role || t.newChunk;
                                if (isNew && cur.length > 0) { chunks.push({ text: cur.join(' '), role: curRole }); cur = []; }
                                cur.push(t.text); curRole = t.role;
                              });
                              if (cur.length > 0) chunks.push({ text: cur.join(' '), role: curRole });
                              return chunks.map((c, i) => {
                                const rd = ROLES.find(r => r.key === c.role);
                                return <span key={i} className={`inline-flex flex-col items-center px-2 py-1 rounded border text-xs ${rd?.colorClass ?? ''} ${rd?.borderColorClass ?? ''}`}><span>{c.text}</span><span className="opacity-60 font-bold text-[10px]">{rd?.shortLabel ?? c.role}</span></span>;
                              });
                            })()}
                          </div>
                        </div>
                        <div className="min-w-48">
                          <div className="font-semibold text-slate-600 dark:text-slate-300 mb-2">Statistieken</div>
                          <dl className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                            <div className="flex gap-2"><dt className="font-medium w-32">Pogingen:</dt><dd>{attempts}</dd></div>
                            <div className="flex gap-2"><dt className="font-medium w-32">Foutloos (1e keer):</dt><dd>{perfectCount}</dd></div>
                            <div className="flex gap-2"><dt className="font-medium w-32">Antw. getoond:</dt><dd>{showAnswerCount}</dd></div>
                            {lastAttempted && <div className="flex gap-2"><dt className="font-medium w-32">Laatste poging:</dt><dd>{new Date(lastAttempted).toLocaleDateString('nl-NL')}</dd></div>}
                          </dl>
                        </div>
                        {(Object.keys(roleErrors).length > 0 || splitErrors > 0) && (
                          <div className="min-w-40">
                            <div className="font-semibold text-slate-600 dark:text-slate-300 mb-2">Fouten per rol</div>
                            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                              {Object.entries(roleErrors).sort((a, b) => b[1] - a[1]).map(([role, count]) => (
                                <li key={role} className="flex justify-between gap-4"><span>{role}</span><span className="font-bold text-red-600 dark:text-red-400">{count}×</span></li>
                              ))}
                              {splitErrors > 0 && <li className="flex justify-between gap-4"><span>Verdeling</span><span className="font-bold text-red-600 dark:text-red-400">{splitErrors}×</span></li>}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex gap-4 text-xs text-slate-400 dark:text-slate-500">
                        <span>ID: {s.id}</span><span>Niveau: {levelLabel(s.level)}</span><span>Gezegde: {s.predicateType}</span><span>{s.tokens.length} woorden</span>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {sorted.length === 0 && <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400 dark:text-slate-600">Geen zinnen gevonden.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-600 mt-4 text-center">Data wordt per browser opgeslagen. Exporteer om gegevens van meerdere apparaten samen te voegen.</p>
    </div>
  );
}

// ─── Sentences Tab ─────────────────────────────────────────────────────────────

interface SentencesTabProps {
  customSentences: Sentence[];
  confirmDeleteId: number | null;
  setConfirmDeleteId: (id: number | null) => void;
  copySuccess: boolean;
  onDelete: (id: number) => void;
  onCopyShareUrl: () => void;
  onExport: () => void;
  onOpenEditor: () => void;
}

function SentencesTab({
  customSentences, confirmDeleteId, setConfirmDeleteId,
  copySuccess, onDelete, onCopyShareUrl, onExport, onOpenEditor,
}: SentencesTabProps) {
  const levelLabel = (l: number) => ['', 'Basis', 'Middel', 'Hoog'][l] ?? String(l);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xl max-w-sm w-full border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white mb-2">Zin verwijderen?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Deze actie kan niet ongedaan worden gemaakt.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors">Annuleer</button>
              <button onClick={() => onDelete(confirmDeleteId)} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">Verwijderen</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">
          Mijn zinnen
          <span className="ml-2 text-sm font-normal text-slate-400 dark:text-slate-500">{customSentences.length} opgeslagen</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={onOpenEditor} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors">
            + Zinnen maken / bewerken
          </button>
          {customSentences.length > 0 && (
            <>
              <button
                onClick={onCopyShareUrl}
                className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${copySuccess ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
              >
                {copySuccess ? '✓ Link gekopieerd!' : 'Deel met leerlingen'}
              </button>
              <button onClick={onExport} className="px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Exporteer JSON
              </button>
            </>
          )}
        </div>
      </div>

      {customSentences.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 mb-4 text-sm text-blue-800 dark:text-blue-200">
          <strong>Deel met leerlingen:</strong> klik "Deel met leerlingen" om een speciale URL te kopiëren. Stuur die naar je leerlingen — ze zien een oranje banner en kunnen direct met jouw zinnen oefenen.
        </div>
      )}

      {customSentences.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-12 text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-4">Nog geen zinnen gemaakt.</p>
          <button onClick={onOpenEditor} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
            Open zinneneditor
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {customSentences.map(s => {
            const chunks: { text: string; role: string }[] = [];
            let cur: string[] = []; let curRole = '';
            s.tokens.forEach((t, i) => {
              const isNew = i === 0 || t.role !== s.tokens[i - 1].role || t.newChunk;
              if (isNew && cur.length > 0) { chunks.push({ text: cur.join(' '), role: curRole }); cur = []; }
              cur.push(t.text); curRole = t.role;
            });
            if (cur.length > 0) chunks.push({ text: cur.join(' '), role: curRole });

            return (
              <div key={s.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 dark:text-white text-base leading-snug">{s.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">{levelLabel(s.level)}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">{s.predicateType}</span>
                    </div>
                  </div>
                  <button onClick={() => setConfirmDeleteId(s.id)} className="flex-shrink-0 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1" title="Verwijder zin">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {chunks.map((c, i) => {
                    const rd = ROLES.find(r => r.key === c.role);
                    return (
                      <span key={i} className={`inline-flex flex-col items-center px-2 py-1 rounded-lg border text-xs ${rd?.colorClass ?? 'bg-slate-100 text-slate-600'} ${rd?.borderColorClass ?? 'border-slate-200'}`}>
                        <span className="font-medium">{c.text}</span>
                        <span className="opacity-60 text-[10px] font-bold">{rd?.shortLabel ?? c.role}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
