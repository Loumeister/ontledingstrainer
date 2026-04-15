import React, { useState, useMemo } from 'react';
import type { Sentence } from '../types';

interface SentencePickerProps {
  sentences: Sentence[];
  isLoading: boolean;
  onStartSession: (sentenceIds: number[]) => void;
}

/**
 * Multi-select sentence picker with search.
 * Replaces the single-sentence dropdown on the HomeScreen.
 * Allows students to select multiple sentences and start a session with them.
 */
export const SentencePicker: React.FC<SentencePickerProps> = ({
  sentences,
  isLoading,
  onStartSession,
}) => {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return sentences;
    const q = search.toLowerCase();
    return sentences.filter(s => s.label.toLowerCase().includes(q));
  }, [sentences, search]);

  const toggleId = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filtered.map(s => s.id)));
  };

  const clearAll = () => {
    setSelectedIds(new Set());
  };

  const handleStart = () => {
    if (selectedIds.size === 0) return;
    onStartSession(Array.from(selectedIds));
    setSelectedIds(new Set());
    setExpanded(false);
    setSearch('');
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="font-bold text-slate-700 dark:text-slate-200 text-center flex items-center justify-center gap-2"
        aria-expanded={expanded}
      >
        Kies zinnen
        <span className="text-xs text-slate-400 dark:text-slate-500">{expanded ? '▲' : '▼'}</span>
      </button>

      {selectedIds.size > 0 && !expanded && (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-blue-600 dark:text-blue-300 font-medium">
            {selectedIds.size} {selectedIds.size === 1 ? 'zin' : 'zinnen'} geselecteerd
          </span>
          <button
            onClick={handleStart}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start
          </button>
        </div>
      )}

      {expanded && (
        <div className="mt-3 flex flex-col gap-2">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek op zinstekst…"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            aria-label="Zoek zinnen"
          />

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {filtered.length} {filtered.length === 1 ? 'zin' : 'zinnen'}
              {selectedIds.size > 0 && ` · ${selectedIds.size} geselecteerd`}
            </span>
            <span className="flex gap-2">
              <button onClick={selectAll} className="text-blue-600 dark:text-blue-400 hover:underline" type="button">
                Alles
              </button>
              <button onClick={clearAll} className="text-slate-400 dark:text-slate-500 hover:underline" type="button">
                Wis
              </button>
            </span>
          </div>

          <ul
            className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-lg divide-y divide-slate-100 dark:divide-slate-700"
            role="listbox"
            aria-label="Zinnenlijst"
            aria-multiselectable="true"
          >
            {isLoading ? (
              <li className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500 text-center">Laden…</li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500 text-center">Geen zinnen gevonden</li>
            ) : (
              filtered.map(s => {
                const isSelected = selectedIds.has(s.id);
                return (
                  <li
                    key={s.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggleId(s.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleId(s.id);
                      }
                    }}
                    tabIndex={0}
                    className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={e => e.stopPropagation()}
                      onChange={() => toggleId(s.id)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-500 text-blue-600 flex-shrink-0"
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                    <span className="truncate">{s.label}</span>
                    <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">
                      N{s.level}
                    </span>
                  </li>
                );
              })
            )}
          </ul>

          {selectedIds.size > 0 && (
            <button
              onClick={handleStart}
              className="w-full py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start met {selectedIds.size} {selectedIds.size === 1 ? 'zin' : 'zinnen'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
