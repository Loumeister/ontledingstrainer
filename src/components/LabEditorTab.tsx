import React, { useState } from 'react';
import { CONSTRUCTION_FRAMES } from '../data/constructionFrames';
import { CHUNK_CARDS } from '../data/chunkCards';
import type { ConstructionFrame, FrameSlotKey } from '../types';

const SLOT_LABELS: Record<FrameSlotKey, string> = {
  ow: 'OW',
  pv: 'PV',
  wg: 'WG',
  ng: 'NG',
  lv: 'LV',
  mv: 'MV',
  vv: 'VV',
  bwb: 'BWB',
  nwd: 'NWD',
};

const SLOT_COLORS: Record<FrameSlotKey, string> = {
  ow:  'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border-blue-200 dark:border-blue-700',
  pv:  'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 border-red-200 dark:border-red-700',
  wg:  'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 border-red-200 dark:border-red-700',
  ng:  'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200 border-orange-200 dark:border-orange-700',
  lv:  'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 border-green-200 dark:border-green-700',
  mv:  'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200 border-teal-200 dark:border-teal-700',
  vv:  'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200 border-purple-200 dark:border-purple-700',
  bwb: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700',
  nwd: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border-amber-200 dark:border-amber-700',
};

function SlotBadge({ slot }: { slot: FrameSlotKey }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold border ${SLOT_COLORS[slot]}`}>
      {SLOT_LABELS[slot]}
    </span>
  );
}

interface FrameCardProps {
  frame: ConstructionFrame;
}

function FrameCard({ frame }: FrameCardProps) {
  const [open, setOpen] = useState(false);

  const cardsForFrame = CHUNK_CARDS.filter(c => c.frameIds.includes(frame.id));

  // Group cards by slot
  const bySlot: Partial<Record<FrameSlotKey, typeof cardsForFrame>> = {};
  for (const slot of frame.slots) {
    bySlot[slot] = cardsForFrame.filter(c => c.role === slot);
  }

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-bold text-slate-800 dark:text-white text-sm">{frame.label}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
            frame.predicateType === 'WG'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
              : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
          }`}>{frame.predicateType}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
            Niveau {frame.level}
          </span>
          <div className="flex gap-1 flex-wrap">
            {frame.slots.map(slot => <SlotBadge key={slot} slot={slot} />)}
          </div>
        </div>
        <span className={`text-slate-400 dark:text-slate-500 transition-transform ml-2 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {open && (
        <div className="bg-slate-50 dark:bg-slate-900 p-4 space-y-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">{frame.prompt}</p>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Woordvolgorde(s): </span>
            {frame.wordOrders.join(' · ')}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Families: </span>
            {frame.families.join(', ')}
          </div>

          <div className="space-y-3">
            {frame.slots.map(slot => {
              const cards = bySlot[slot] ?? [];
              return (
                <div key={slot}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <SlotBadge slot={slot} />
                    <span className="text-xs text-slate-500 dark:text-slate-400">{cards.length} kaart{cards.length !== 1 ? 'en' : ''}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cards.map(card => (
                      <div
                        key={card.id}
                        className="flex flex-col items-start px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      >
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                          {card.tokens.map(t => t.text).join(' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">{card.id}</span>
                      </div>
                    ))}
                    {cards.length === 0 && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 italic">Geen kaarten</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const LabEditorTab: React.FC = () => {
  const totalCards = CHUNK_CARDS.length;
  const families = [...new Set(CHUNK_CARDS.map(c => c.familyId))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Zinsdeellab — Frames &amp; Kaarten</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {CONSTRUCTION_FRAMES.length} frames · {totalCards} kaarten · {families.length} families
          </p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-700">
          Alleen-lezen (Sprint 3)
        </span>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Klik op een frame om de compatibele kaarten per zinsdeel te bekijken.
        In een volgende versie kun je hier frames en kaarten bewerken.
      </p>

      <div className="space-y-2">
        {CONSTRUCTION_FRAMES.map(frame => (
          <FrameCard key={frame.id} frame={frame} />
        ))}
      </div>

      <div className="mt-6 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">Alle families ({families.length})</h3>
        <div className="space-y-3">
          {families.map(fam => {
            const famCards = CHUNK_CARDS.filter(c => c.familyId === fam);
            const byRole: Partial<Record<FrameSlotKey, typeof famCards>> = {};
            for (const c of famCards) {
              if (!byRole[c.role]) byRole[c.role] = [];
              byRole[c.role]!.push(c);
            }
            return (
              <div key={fam} className="border-l-2 border-slate-200 dark:border-slate-600 pl-3">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono mb-1">{fam}</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(byRole).map(([role, cards]) => (
                    <span key={role} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {SLOT_LABELS[role as FrameSlotKey] ?? role}: {cards!.length}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LabEditorTab;
