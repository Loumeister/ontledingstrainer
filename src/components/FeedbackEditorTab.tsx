import { useState, useCallback, useEffect } from 'react';
import { FEEDBACK_MATRIX, ROLES } from '../constants';
import type { FeedbackEntry, RichFeedbackEntry } from '../types';
import {
  getFeedbackOverrides,
  setFeedbackOverride,
  resetFeedbackOverride,
  clearAllFeedbackOverrides,
  exportFeedbackOverrides,
  type FeedbackOverrides,
} from '../services/feedbackOverrides';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRoleLabel(key: string): string {
  const role = ROLES.find(r => r.key === key);
  if (role) return `${role.label} (${role.shortLabel})`;
  // Fallback for keys not in ROLES (vw_onder, vw_neven use shortLabel only)
  const labelMap: Record<string, string> = {
    vw_onder: 'Onderschikkend Voegwoord',
    vw_neven: 'Nevenschikkend Voegwoord',
    bijst: 'Bijstelling',
    bijzin: 'Bijzin',
  };
  return labelMap[key] ?? key.toUpperCase();
}

function isRich(entry: FeedbackEntry): entry is RichFeedbackEntry {
  return typeof entry === 'object';
}

function entryToForm(entry: FeedbackEntry): PairForm {
  if (isRich(entry)) {
    return {
      type: 'rich',
      herstelvraag: entry.herstelvraag,
      sleutelwoord: entry.sleutelwoord,
      diagnose: entry.uitleg.diagnose,
      redenering: entry.uitleg.redenering,
      herstap: entry.uitleg.herstap,
    };
  }
  return { type: 'string', value: entry };
}

function formToEntry(form: PairForm): FeedbackEntry {
  if (form.type === 'rich') {
    return {
      herstelvraag: form.herstelvraag,
      sleutelwoord: form.sleutelwoord,
      uitleg: {
        diagnose: form.diagnose,
        redenering: form.redenering,
        herstap: form.herstap,
      },
    };
  }
  return form.value;
}

function formsEqual(a: PairForm, b: PairForm): boolean {
  if (a.type !== b.type) return false;
  if (a.type === 'string' && b.type === 'string') return a.value === b.value;
  if (a.type === 'rich' && b.type === 'rich') {
    return (
      a.herstelvraag === b.herstelvraag &&
      a.sleutelwoord === b.sleutelwoord &&
      a.diagnose === b.diagnose &&
      a.redenering === b.redenering &&
      a.herstap === b.herstap
    );
  }
  return false;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RichForm = {
  type: 'rich';
  herstelvraag: string;
  sleutelwoord: string;
  diagnose: string;
  redenering: string;
  herstap: string;
};

type StringForm = { type: 'string'; value: string };
type PairForm = RichForm | StringForm;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface PairCardProps {
  sourceRole: string;
  targetRole: string;
  builtinEntry: FeedbackEntry;
  override: FeedbackEntry | undefined;
  onSave: (sourceRole: string, targetRole: string, value: FeedbackEntry) => void;
  onReset: (sourceRole: string, targetRole: string) => void;
}

function PairCard({ sourceRole, targetRole, builtinEntry, override, onSave, onReset }: PairCardProps) {
  const [expanded, setExpanded] = useState(false);
  const effectiveEntry = override ?? builtinEntry;
  const [form, setForm] = useState<PairForm>(() => entryToForm(effectiveEntry));
  const [saveFlash, setSaveFlash] = useState(false);

  // Re-initialize form when card expands (picks up any external reset)
  useEffect(() => {
    if (expanded) {
      setForm(entryToForm(override ?? builtinEntry));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, override]);

  const builtinForm = entryToForm(builtinEntry);
  const isOverridden = override !== undefined;
  const isDirty = !formsEqual(form, entryToForm(override ?? builtinEntry));

  function handleSave() {
    onSave(sourceRole, targetRole, formToEntry(form));
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1200);
  }

  function handleReset() {
    onReset(sourceRole, targetRole);
    setForm(builtinForm);
  }

  const sourceLabel = getRoleLabel(sourceRole);
  const targetLabel = getRoleLabel(targetRole);

  return (
    <div className={`rounded-lg border transition-colors ${isOverridden ? 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
      {/* Card header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
      >
        <span className="text-slate-400 text-xs w-4 shrink-0">{expanded ? '▼' : '▶'}</span>
        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 flex-1">
          <span className="text-slate-500 dark:text-slate-400">Als leerling </span>
          <span className="font-semibold">{sourceLabel}</span>
          <span className="text-slate-500 dark:text-slate-400"> aanwijst als </span>
          <span className="font-semibold">{targetLabel}</span>
        </span>
        {isOverridden && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 dark:bg-amber-700 dark:text-amber-100 font-semibold shrink-0">
            Aangepast
          </span>
        )}
        {isDirty && !saveFlash && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shrink-0">
            Niet opgeslagen
          </span>
        )}
        {saveFlash && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 shrink-0">
            ✓ Opgeslagen
          </span>
        )}
      </button>

      {/* Expanded form */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-100 dark:border-slate-700">
          {form.type === 'rich' ? (
            <>
              <Field
                label="Herstelvraag"
                hint="Korte vraag (≤15 woorden) — altijd zichtbaar"
                value={form.herstelvraag}
                onChange={v => setForm(f => f.type === 'rich' ? { ...f, herstelvraag: v } : f)}
                rows={1}
                isDirty={form.herstelvraag !== (entryToForm(builtinEntry) as RichForm).herstelvraag}
              />
              <Field
                label="Sleutelwoord"
                hint="Exact één woord uit de herstelvraag — klikbaar"
                value={form.sleutelwoord}
                onChange={v => setForm(f => f.type === 'rich' ? { ...f, sleutelwoord: v } : f)}
                rows={1}
                isInput
                isDirty={form.sleutelwoord !== (entryToForm(builtinEntry) as RichForm).sleutelwoord}
              />
              <Field
                label="Diagnose"
                hint="Wat ging er mis — 1-2 zinnen"
                value={form.diagnose}
                onChange={v => setForm(f => f.type === 'rich' ? { ...f, diagnose: v } : f)}
                rows={2}
                isDirty={form.diagnose !== (entryToForm(builtinEntry) as RichForm).diagnose}
              />
              <Field
                label="Redenering"
                hint="De grammaticaregel / het onderscheid — 1-2 zinnen"
                value={form.redenering}
                onChange={v => setForm(f => f.type === 'rich' ? { ...f, redenering: v } : f)}
                rows={3}
                isDirty={form.redenering !== (entryToForm(builtinEntry) as RichForm).redenering}
              />
              <Field
                label="Herstap"
                hint="Concrete actie voor de leerling — 1 zin"
                value={form.herstap}
                onChange={v => setForm(f => f.type === 'rich' ? { ...f, herstap: v } : f)}
                rows={2}
                isDirty={form.herstap !== (entryToForm(builtinEntry) as RichForm).herstap}
              />
            </>
          ) : (
            <Field
              label="Feedback"
              hint="Tekst die getoond wordt bij deze fout"
              value={form.value}
              onChange={v => setForm({ type: 'string', value: v })}
              rows={3}
              isDirty={form.value !== (entryToForm(builtinEntry) as StringForm).value}
            />
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={!isDirty}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Opslaan
            </button>
            {isOverridden && (
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Reset naar origineel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface FieldProps {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
  isInput?: boolean;
  isDirty?: boolean;
}

function Field({ label, hint, value, onChange, rows, isInput, isDirty }: FieldProps) {
  const dirtyClass = isDirty ? 'border-yellow-400 dark:border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700';
  const baseClass = `w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none focus:border-blue-500 text-slate-700 dark:text-slate-200 placeholder-slate-400 transition-colors ${dirtyClass}`;

  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
        {label}
        <span className="ml-1 font-normal text-slate-400 dark:text-slate-500">— {hint}</span>
      </label>
      {isInput ? (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className={baseClass}
        />
      ) : (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          className={`${baseClass} resize-none`}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function FeedbackEditorTab() {
  const [overrides, setOverrides] = useState<FeedbackOverrides>(() => getFeedbackOverrides());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  // Count total pairs and total overrides
  const totalPairs = Object.values(FEEDBACK_MATRIX).reduce((sum, group) => sum + Object.keys(group).length, 0);
  const totalOverrides = Object.values(overrides).reduce((sum, group) => sum + Object.keys(group).length, 0);

  const handleSave = useCallback((sourceRole: string, targetRole: string, value: FeedbackEntry) => {
    setFeedbackOverride(sourceRole, targetRole, value);
    setOverrides(getFeedbackOverrides());
  }, []);

  const handleReset = useCallback((sourceRole: string, targetRole: string) => {
    resetFeedbackOverride(sourceRole, targetRole);
    setOverrides(getFeedbackOverrides());
  }, []);

  function handleResetAll() {
    clearAllFeedbackOverrides();
    setOverrides({});
    setConfirmReset(false);
  }

  function handleExport() {
    const json = exportFeedbackOverrides();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'feedback-aanpassingen.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleGroup(role: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  }

  const lowerSearch = search.toLowerCase();

  function matchesPair(sourceRole: string, targetRole: string, entry: FeedbackEntry): boolean {
    if (!lowerSearch) return true;
    const src = getRoleLabel(sourceRole).toLowerCase();
    const tgt = getRoleLabel(targetRole).toLowerCase();
    if (src.includes(lowerSearch) || tgt.includes(lowerSearch)) return true;
    if (typeof entry === 'string') return entry.toLowerCase().includes(lowerSearch);
    return (
      entry.herstelvraag.toLowerCase().includes(lowerSearch) ||
      entry.uitleg.diagnose.toLowerCase().includes(lowerSearch) ||
      entry.uitleg.redenering.toLowerCase().includes(lowerSearch) ||
      entry.uitleg.herstap.toLowerCase().includes(lowerSearch)
    );
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Zoek op rol of feedbacktekst…"
          className="flex-1 min-w-48 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-blue-500"
        />
        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
          {totalOverrides} van {totalPairs} paren aangepast
        </span>
        <button
          onClick={handleExport}
          disabled={totalOverrides === 0}
          className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ↓ Exporteer aanpassingen
        </button>
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            disabled={totalOverrides === 0}
            className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Reset alles
          </button>
        ) : (
          <span className="flex items-center gap-1">
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">Zeker weten?</span>
            <button
              onClick={handleResetAll}
              className="px-2 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
            >
              Ja, reset alles
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs hover:bg-slate-200 transition-colors"
            >
              Annuleer
            </button>
          </span>
        )}
      </div>

      {/* Notice about localStorage */}
      <p className="text-xs text-slate-400 dark:text-slate-500">
        Aanpassingen worden opgeslagen in de browser (localStorage) en zijn direct actief in de oefening.
        Ze zijn alleen zichtbaar op dit apparaat.
      </p>

      {/* Source role accordions */}
      <div className="space-y-2">
        {Object.entries(FEEDBACK_MATRIX).map(([sourceRole, targets]) => {
          const overrideCount = Object.keys(overrides[sourceRole] ?? {}).length;
          const pairCount = Object.keys(targets).length;
          const isExpanded = expandedGroups.has(sourceRole);

          // Filter pairs by search
          const visiblePairs = Object.entries(targets).filter(([targetRole, entry]) =>
            matchesPair(sourceRole, targetRole, overrides[sourceRole]?.[targetRole] ?? entry)
          );

          if (lowerSearch && visiblePairs.length === 0) return null;

          return (
            <div
              key={sourceRole}
              className={`rounded-xl border transition-colors ${overrideCount > 0 ? 'border-amber-300 dark:border-amber-600' : 'border-slate-200 dark:border-slate-700'}`}
            >
              {/* Group header */}
              <button
                onClick={() => toggleGroup(sourceRole)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-xl transition-colors"
              >
                <span className="text-slate-400 text-xs w-4 shrink-0">{isExpanded ? '▼' : '▶'}</span>
                <span className="font-semibold text-sm text-slate-700 dark:text-white flex-1">
                  {getRoleLabel(sourceRole)}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {pairCount} paren
                </span>
                {overrideCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-700 dark:text-amber-100 font-semibold">
                    {overrideCount} aangepast
                  </span>
                )}
              </button>

              {/* Pair cards */}
              {isExpanded && (
                <div className="px-3 pb-3 space-y-1.5 border-t border-slate-100 dark:border-slate-700 pt-2">
                  {visiblePairs.map(([targetRole, builtinEntry]) => (
                    <PairCard
                      key={`${sourceRole}::${targetRole}`}
                      sourceRole={sourceRole}
                      targetRole={targetRole}
                      builtinEntry={builtinEntry}
                      override={overrides[sourceRole]?.[targetRole]}
                      onSave={handleSave}
                      onReset={handleReset}
                    />
                  ))}
                  {visiblePairs.length === 0 && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 py-2 px-3">
                      Geen resultaten voor deze zoekopdracht.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
