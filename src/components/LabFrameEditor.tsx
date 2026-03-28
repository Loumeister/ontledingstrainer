import React, { useState } from 'react';
import { CONSTRUCTION_FRAMES } from '../data/constructionFrames';
import {
  getCustomFrames, saveCustomFrame, deleteCustomFrame, generateFrameId,
} from '../services/labFrameStore';
import type { ConstructionFrame, FrameSlotKey, DifficultyLevel } from '../types';

const ALL_SLOTS: FrameSlotKey[] = ['ow', 'pv', 'wg', 'ng', 'lv', 'mv', 'vv', 'bwb', 'nwd'];
const SLOT_LABELS: Record<FrameSlotKey, string> = {
  ow: 'OW', pv: 'PV', wg: 'WG', ng: 'NG', lv: 'LV', mv: 'MV', vv: 'VV', bwb: 'BWB', nwd: 'NWD',
};

interface FormState {
  id: string;
  label: string;
  level: DifficultyLevel;
  predicateType: 'WG' | 'NG';
  slots: FrameSlotKey[];
  families: string;    // komma-gescheiden
  wordOrders: string[]; // één per entry
  prompt: string;
}

const emptyForm = (): FormState => ({
  id: '', label: '', level: 1, predicateType: 'WG',
  slots: [], families: '', wordOrders: [''], prompt: '',
});

const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400';

export const LabFrameEditor: React.FC = () => {
  const [phase, setPhase] = useState<'list' | 'edit'>('list');
  const [customs, setCustoms] = useState(() => getCustomFrames());
  const [form, setForm] = useState<FormState>(emptyForm());
  const [isNew, setIsNew] = useState(true);

  const allFrames = [...CONSTRUCTION_FRAMES, ...customs];

  const refresh = () => setCustoms(getCustomFrames());

  const startNew = () => { setForm(emptyForm()); setIsNew(true); setPhase('edit'); };

  const startEdit = (f: ConstructionFrame) => {
    setForm({
      id: f.id, label: f.label, level: f.level, predicateType: f.predicateType,
      slots: [...f.slots], families: f.families.join(', '),
      wordOrders: f.wordOrders.length ? [...f.wordOrders] : [''], prompt: f.prompt,
    });
    setIsNew(false); setPhase('edit');
  };

  const startDuplicate = (f: ConstructionFrame) => {
    const allIds = allFrames.map(x => x.id);
    setForm({
      id: generateFrameId(f.label + ' kopie', allIds),
      label: f.label + ' (kopie)', level: f.level, predicateType: f.predicateType,
      slots: [...f.slots], families: f.families.join(', '),
      wordOrders: f.wordOrders.length ? [...f.wordOrders] : [''], prompt: f.prompt,
    });
    setIsNew(true); setPhase('edit');
  };

  const handleDelete = (id: string) => { deleteCustomFrame(id); refresh(); };

  const handleSave = () => {
    if (!form.label.trim() || form.slots.length === 0) return;
    const allIds = allFrames.map(x => x.id);
    saveCustomFrame({
      id: isNew ? (form.id || generateFrameId(form.label, allIds)) : form.id,
      label: form.label.trim(),
      level: form.level,
      predicateType: form.predicateType,
      slots: form.slots,
      families: form.families.split(',').map(s => s.trim()).filter(Boolean),
      wordOrders: form.wordOrders.map(s => s.trim()).filter(Boolean),
      prompt: form.prompt.trim(),
    });
    refresh(); setPhase('list');
  };

  const toggleSlot = (slot: FrameSlotKey) =>
    setForm(f => ({
      ...f,
      slots: f.slots.includes(slot) ? f.slots.filter(s => s !== slot) : [...f.slots, slot],
    }));

  const setWo = (i: number, v: string) =>
    setForm(f => { const wos = [...f.wordOrders]; wos[i] = v; return { ...f, wordOrders: wos }; });

  // ── Edit form ──────────────────────────────────────────────────────────────
  if (phase === 'edit') return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setPhase('list')} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">← Terug</button>
        <h3 className="font-bold text-slate-800 dark:text-white text-sm">{isNew ? 'Nieuw frame' : 'Frame bewerken'}</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="space-y-1 block">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Label *</span>
          <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} className={inputCls} placeholder="b.v. OW + PV + LV" />
        </label>
        <div className="flex gap-2">
          <label className="space-y-1 block flex-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Niveau</span>
            <select value={form.level} onChange={e => setForm(f => ({ ...f, level: Number(e.target.value) as DifficultyLevel }))} className={inputCls}>
              {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="space-y-1 block flex-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Gezegde</span>
            <select value={form.predicateType} onChange={e => setForm(f => ({ ...f, predicateType: e.target.value as 'WG' | 'NG' }))} className={inputCls}>
              <option value="WG">WG</option><option value="NG">NG</option>
            </select>
          </label>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Slots *</span>
        <div className="flex flex-wrap gap-2">
          {ALL_SLOTS.map(slot => (
            <label key={slot} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border cursor-pointer text-sm font-medium transition-colors select-none ${form.slots.includes(slot) ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <input type="checkbox" checked={form.slots.includes(slot)} onChange={() => toggleSlot(slot)} className="sr-only" />
              {SLOT_LABELS[slot]}
            </label>
          ))}
        </div>
      </div>

      <label className="space-y-1 block">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Families (komma-gescheiden)</span>
        <input value={form.families} onChange={e => setForm(f => ({ ...f, families: e.target.value }))} className={inputCls} placeholder="b.v. transitief_sg, transitief_pl" />
      </label>

      <div className="space-y-1.5">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Woordvolgorde(s)</span>
        {form.wordOrders.map((wo, i) => (
          <div key={i} className="flex gap-2">
            <input value={wo} onChange={e => setWo(i, e.target.value)} className={inputCls} placeholder="b.v. ow-pv-lv" />
            {form.wordOrders.length > 1 && (
              <button onClick={() => setForm(f => ({ ...f, wordOrders: f.wordOrders.filter((_, j) => j !== i) }))} className="px-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">×</button>
            )}
          </div>
        ))}
        <button onClick={() => setForm(f => ({ ...f, wordOrders: [...f.wordOrders, ''] }))} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">+ Volgorde toevoegen</button>
      </div>

      <label className="space-y-1 block">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Opdrachttekst</span>
        <textarea value={form.prompt} onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))} rows={2} className={inputCls + ' resize-none'} placeholder="Bouw een zin met..." />
      </label>

      <div className="flex gap-3 pt-1">
        <button onClick={handleSave} disabled={!form.label.trim() || form.slots.length === 0} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Opslaan</button>
        <button onClick={() => setPhase('list')} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Annuleren</button>
      </div>
    </div>
  );

  // ── List ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">{allFrames.length} frames · {customs.length} eigen</p>
        <button onClick={startNew} className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">+ Nieuw frame</button>
      </div>
      {allFrames.map(frame => {
        const builtIn = CONSTRUCTION_FRAMES.some(f => f.id === frame.id);
        return (
          <div key={frame.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-slate-800 dark:text-white">{frame.label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">{frame.predicateType} · N{frame.level}</span>
                {builtIn && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">ingebouwd</span>}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">{frame.id}</p>
            </div>
            <div className="flex gap-1.5 ml-3 shrink-0">
              {builtIn ? (
                <button onClick={() => startDuplicate(frame)} className="px-2.5 py-1 text-xs rounded border border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">Dupliceer</button>
              ) : (<>
                <button onClick={() => startEdit(frame)} className="px-2.5 py-1 text-xs rounded border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">Bewerk</button>
                <button onClick={() => handleDelete(frame.id)} className="px-2.5 py-1 text-xs rounded border border-red-300 dark:border-red-700 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Verwijder</button>
              </>)}
            </div>
          </div>
        );
      })}
    </div>
  );
};
