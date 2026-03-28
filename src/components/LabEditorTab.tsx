import React, { useState } from 'react';
import { CONSTRUCTION_FRAMES } from '../data/constructionFrames';
import { CHUNK_CARDS } from '../data/chunkCards';
import { getCustomFrames } from '../services/labFrameStore';
import { getCustomCards } from '../services/labChunkCardStore';
import { LabFrameEditor } from './LabFrameEditor';
import { LabCardEditor } from './LabCardEditor';

type Tab = 'frames' | 'kaarten';

function exportRemixset(): void {
  const data = {
    exportedAt: new Date().toISOString(),
    frames: {
      builtin: CONSTRUCTION_FRAMES,
      custom: getCustomFrames(),
    },
    cards: {
      builtin: CHUNK_CARDS,
      custom: getCustomCards(),
    },
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zinsdeellab_remixset_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

const LabEditorTab: React.FC = () => {
  const [tab, setTab] = useState<Tab>('frames');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Zinsdeellab — Frames &amp; Kaarten</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Beheer ingebouwde en eigen frames en woordkaarten.</p>
        </div>
        <button
          onClick={exportRemixset}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
        >
          Exporteer remixset (JSON)
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden w-fit">
        {(['frames', 'kaarten'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            {t === 'frames' ? 'Frames' : 'Kaarten'}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'frames' && <LabFrameEditor />}
      {tab === 'kaarten' && <LabCardEditor />}
    </div>
  );
};

export default LabEditorTab;
