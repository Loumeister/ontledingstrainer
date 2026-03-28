import React, { useState } from 'react';
import { CHUNK_CARDS } from '../data/chunkCards';
import { CONSTRUCTION_FRAMES } from '../data/constructionFrames';
import {
  getCustomCards, saveCustomCard, deleteCustomCard, generateCardId,
} from '../services/labChunkCardStore';
import { getCustomFrames } from '../services/labFrameStore';
import type { ChunkCard, FrameSlotKey, RoleKey } from '../types';

const ALL_SLOTS: FrameSlotKey[] = ['ow', 'pv', 'wg', 'ng', 'lv', 'mv', 'vv', 'bwb', 'nwd'];
const SLOT_LABELS: Record<FrameSlotKey, string> = {
  ow: 'OW', pv: 'PV', wg: 'WG', ng: 'NG', lv: 'LV', mv: 'MV', vv: 'VV', bwb: 'BWB', nwd: 'NWD',
};

interface TokenDraft { text: string; role: RoleKey; }

interface FormState {
  id: string;
  role: FrameSlotKey;
  familyId: string;
  frameIds: string[];
  tokens: TokenDraft[];
  number: '' | 'sg' | 'pl';
  person: '' | '1' | '2' | '3';
  predicateType: '' | 'WG' | 'NG';
}

const emptyForm = (): FormState => ({
  id: '', role: 'ow', familyId: '', frameIds: [],
  tokens: [{ text: '', role: 'ow' }],
  number: '', person: '', predicateType: '',
});

const inputCls = 'px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400';

export const LabCardEditor: React.FC = () => {
  const [phase, setPhase] = useState<'list' | 'edit'>('list');
  const [customs, setCustoms] = useState(() => getCustomCards());
  const [form, setForm] = useState<FormState>(emptyForm());
  const [isNew, setIsNew] = useState(true);
  const [filterRole, setFilterRole] = useState<FrameSlotKey | ''>('');

  const allCards = [...CHUNK_CARDS, ...customs];
  const allFrames = [...CONSTRUCTION_FRAMES, ...getCustomFrames()];

  const refresh = () => setCustoms(getCustomCards());

  const cardText = (c: ChunkCard) => c.tokens.map(t => t.text).join(' ');

  const startNew = () => { setForm(emptyForm()); setIsNew(true); setPhase('edit'); };

  const cardToForm = (c: ChunkCard): FormState => ({
    id: c.id, role: c.role, familyId: c.familyId, frameIds: [...c.frameIds],
    tokens: c.tokens.map(t => ({ text: t.text, role: t.role })),
    number: c.number ?? '', person: c.person ? String(c.person) as '1' | '2' | '3' : '',
    predicateType: c.predicateType ?? '',
  });

  const startEdit = (c: ChunkCard) => { setForm(cardToForm(c)); setIsNew(false); setPhase('edit'); };

  const startDuplicate = (c: ChunkCard) => {
    const allIds = allCards.map(x => x.id);
    const newId = generateCardId(c.role, c.familyId, allIds);
    setForm({ ...cardToForm(c), id: newId });
    setIsNew(true); setPhase('edit');
  };

  const handleDelete = (id: string) => { deleteCustomCard(id); refresh(); };

  const handleSave = () => {
    const texts = form.tokens.map(t => t.text.trim()).filter(Boolean);
    if (!form.familyId.trim() || form.frameIds.length === 0 || texts.length === 0) return;
    const allIds = allCards.map(x => x.id);
    const id = isNew ? (form.id || generateCardId(form.role, form.familyId, allIds)) : form.id;
    const card: ChunkCard = {
      id, role: form.role, familyId: form.familyId.trim(), frameIds: form.frameIds,
      tokens: form.tokens.filter(t => t.text.trim()).map(t => ({ text: t.text.trim(), role: t.role })),
      ...(form.number ? { number: form.number } : {}),
      ...(form.person ? { person: Number(form.person) as 1 | 2 | 3 } : {}),
      ...(form.predicateType ? { predicateType: form.predicateType } : {}),
    };
    saveCustomCard(card); refresh(); setPhase('list');
  };

  const setToken = (i: number, field: keyof TokenDraft, val: string) =>
    setForm(f => { const tks = [...f.tokens]; tks[i] = { ...tks[i], [field]: val }; return { ...f, tokens: tks }; });

  const toggleFrame = (fid: string) =>
    setForm(f => ({
      ...f,
      frameIds: f.frameIds.includes(fid) ? f.frameIds.filter(x => x !== fid) : [...f.frameIds, fid],
    }));

  // When role changes, update default token roles to match
  const changeRole = (role: FrameSlotKey) =>
    setForm(f => ({
      ...f, role,
      tokens: f.tokens.map(t => ({ ...t, role: role as unknown as RoleKey })),
    }));

  // ── Edit form ──────────────────────────────────────────────────────────────
  if (phase === 'edit') return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setPhase('list')} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">← Terug</button>
        <h3 className="font-bold text-slate-800 dark:text-white text-sm">{isNew ? 'Nieuwe kaart' : 'Kaart bewerken'}</h3>
      </div>

      {/* Role + family */}
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 block">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Zinsdeel-rol *</span>
          <select value={form.role} onChange={e => changeRole(e.target.value as FrameSlotKey)} className={inputCls + ' w-full'}>
            {ALL_SLOTS.map(s => <option key={s} value={s}>{SLOT_LABELS[s]}</option>)}
          </select>
        </label>
        <label className="space-y-1 block">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Familie *</span>
          <input value={form.familyId} onChange={e => setForm(f => ({ ...f, familyId: e.target.value }))} className={inputCls + ' w-full'} placeholder="b.v. transitief_sg" />
        </label>
      </div>

      {/* Frames */}
      <div className="space-y-1">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Frames (minimaal 1) *</span>
        <div className="flex flex-wrap gap-2">
          {allFrames.map(f => (
            <label key={f.id} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border cursor-pointer text-xs font-medium transition-colors select-none ${form.frameIds.includes(f.id) ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <input type="checkbox" checked={form.frameIds.includes(f.id)} onChange={() => toggleFrame(f.id)} className="sr-only" />
              {f.label}
            </label>
          ))}
        </div>
      </div>

      {/* Tokens */}
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Woorden in kaart *</span>
        {form.tokens.map((tok, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input value={tok.text} onChange={e => setToken(i, 'text', e.target.value)} className={inputCls + ' flex-1'} placeholder="tekst" />
            <select value={tok.role} onChange={e => setToken(i, 'role', e.target.value)} className={inputCls}>
              {ALL_SLOTS.map(s => <option key={s} value={s}>{SLOT_LABELS[s]}</option>)}
            </select>
            {form.tokens.length > 1 && (
              <button onClick={() => setForm(f => ({ ...f, tokens: f.tokens.filter((_, j) => j !== i) }))} className="px-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors text-sm">×</button>
            )}
          </div>
        ))}
        <button onClick={() => setForm(f => ({ ...f, tokens: [...f.tokens, { text: '', role: f.role as unknown as RoleKey }] }))} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">+ Woord toevoegen</button>
      </div>

      {/* Optional fields */}
      <div className="grid grid-cols-3 gap-3">
        <label className="space-y-1 block">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Getal</span>
          <select value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value as FormState['number'] }))} className={inputCls + ' w-full'}>
            <option value="">—</option><option value="sg">sg</option><option value="pl">pl</option>
          </select>
        </label>
        <label className="space-y-1 block">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Persoon</span>
          <select value={form.person} onChange={e => setForm(f => ({ ...f, person: e.target.value as FormState['person'] }))} className={inputCls + ' w-full'}>
            <option value="">—</option><option value="1">1</option><option value="2">2</option><option value="3">3</option>
          </select>
        </label>
        <label className="space-y-1 block">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Gezegde</span>
          <select value={form.predicateType} onChange={e => setForm(f => ({ ...f, predicateType: e.target.value as FormState['predicateType'] }))} className={inputCls + ' w-full'}>
            <option value="">—</option><option value="WG">WG</option><option value="NG">NG</option>
          </select>
        </label>
      </div>

      <div className="flex gap-3 pt-1">
        <button onClick={handleSave} disabled={!form.familyId.trim() || form.frameIds.length === 0 || form.tokens.every(t => !t.text.trim())} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Opslaan</button>
        <button onClick={() => setPhase('list')} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Annuleren</button>
      </div>
    </div>
  );

  // ── List ──────────────────────────────────────────────────────────────────
  const displayed = filterRole ? allCards.filter(c => c.role === filterRole) : allCards;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">{allCards.length} kaarten · {customs.length} eigen</p>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value as FrameSlotKey | '')} className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 focus:outline-none">
            <option value="">Alle rollen</option>
            {ALL_SLOTS.map(s => <option key={s} value={s}>{SLOT_LABELS[s]}</option>)}
          </select>
        </div>
        <button onClick={startNew} className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">+ Nieuwe kaart</button>
      </div>

      <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
        {displayed.map(card => {
          const builtIn = CHUNK_CARDS.some(c => c.id === card.id);
          return (
            <div key={card.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{SLOT_LABELS[card.role]}</span>
                  <span className="text-sm font-medium text-slate-800 dark:text-white">{cardText(card)}</span>
                  {builtIn && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">ingebouwd</span>}
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">{card.familyId} · {card.id}</p>
              </div>
              <div className="flex gap-1.5 ml-3 shrink-0">
                {builtIn ? (
                  <button onClick={() => startDuplicate(card)} className="px-2.5 py-1 text-xs rounded border border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">Dupliceer</button>
                ) : (<>
                  <button onClick={() => startEdit(card)} className="px-2.5 py-1 text-xs rounded border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">Bewerk</button>
                  <button onClick={() => handleDelete(card.id)} className="px-2.5 py-1 text-xs rounded border border-red-300 dark:border-red-700 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Verwijder</button>
                </>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
