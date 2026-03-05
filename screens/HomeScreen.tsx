import React, { useRef, useState } from 'react';
import { DifficultyLevel, Sentence } from '../types';
import { HelpModal } from '../components/HelpModal';
import { TrainerState } from '../hooks/useTrainer';
import { importCustomSentences, getCustomSentences } from '../data/customSentenceStore';

type HomeScreenProps = Pick<TrainerState,
  | 'predicateMode' | 'setPredicateMode'
  | 'selectedLevel' | 'setSelectedLevel'
  | 'customSessionCount' | 'setCustomSessionCount'
  | 'focusLV' | 'setFocusLV'
  | 'focusMV' | 'setFocusMV'
  | 'focusVV' | 'setFocusVV'
  | 'focusBijzin' | 'setFocusBijzin'
  | 'includeBijst' | 'setIncludeBijst'
  | 'includeBB' | 'setIncludeBB'
  | 'showHelp' | 'setShowHelp'
  | 'darkMode' | 'setDarkMode'
  | 'largeFont' | 'setLargeFont'
  | 'availableSentences'
  | 'isLoadingSentences'
  | 'sentenceLoadError'
  | 'refreshCustomSentences'
  | 'startSession'
  | 'handleSentenceSelect'
  | 'startSharedSession'
> & {
  sharedSentences: Sentence[];
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  predicateMode, setPredicateMode,
  selectedLevel, setSelectedLevel,
  customSessionCount, setCustomSessionCount,
  focusLV, setFocusLV,
  focusMV, setFocusMV,
  focusVV, setFocusVV,
  focusBijzin, setFocusBijzin,
  includeBijst, setIncludeBijst,
  includeBB, setIncludeBB,
  showHelp, setShowHelp,
  darkMode, setDarkMode,
  largeFont, setLargeFont,
  availableSentences,
  isLoadingSentences,
  sentenceLoadError,
  refreshCustomSentences,
  startSession,
  handleSentenceSelect,
  startSharedSession,
  sharedSentences,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const customCount = getCustomSentences().length;

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = importCustomSentences(text);
      refreshCustomSentences();
      setImportMsg(`${imported.length} docent-zinnen geladen.`);
      setTimeout(() => setImportMsg(null), 3000);
    } catch (err) {
      setImportMsg(`Fout: ${err instanceof Error ? err.message : 'Ongeldig bestand'}`);
      setTimeout(() => setImportMsg(null), 4000);
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-2 md:p-4 font-sans flex items-center justify-center relative transition-colors duration-300">
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      <main className="max-w-6xl w-full bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-lg space-y-6 border border-slate-200 dark:border-slate-700 transition-colors duration-300">
        <div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-1">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Zinsontledingstrainer
              </span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Stel je training samen:</p>
          </div>

          {/* Top Right Controls */}
          <div className="flex gap-2 mt-4 md:mt-0">
            <button onClick={() => setLargeFont(!largeFont)} className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold transition-all border ${largeFont ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-200' : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'}`} title="Lettergrootte">aA</button>
            <button onClick={() => setDarkMode(!darkMode)} className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all" title="Donkere modus">
              {darkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" strokeWidth="2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
              )}
            </button>
            <button onClick={() => setShowHelp(true)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-100 dark:border-blue-800 hover:bg-blue-100 transition-colors" title="Instructies">?</button>
          </div>
        </div>

        {/* Shared sentences banner */}
        {sharedSentences.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 text-center">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-1">Zinnen van je docent</p>
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
              Je docent heeft {sharedSentences.length} {sharedSentences.length === 1 ? 'zin' : 'zinnen'} voor je klaargezet.
            </p>
            <button
              onClick={() => startSharedSession(sharedSentences)}
              className="w-full py-2.5 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
            >
              Oefenen met docentzinnen
            </button>
          </div>
        )}

        {/* Filter Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Level & Predicate */}
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2 text-sm uppercase tracking-wider">Moeilijkheidsgraad</h3>
              <div className="flex gap-2">
                {[null, 1, 2, 3, 4].map((lvl) => (
                  <button key={lvl || 'all'} onClick={() => setSelectedLevel(lvl as DifficultyLevel)} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${selectedLevel === lvl ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                    {lvl === null ? 'Alles' : lvl === 1 ? 'Basis' : lvl === 2 ? 'Middel' : lvl === 3 ? 'Hoog' : 'Expert'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2 text-sm uppercase tracking-wider">Soort Zinnen & Gezegde</h3>
              <div className="flex flex-col gap-2">
                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${predicateMode === 'WG' ? 'bg-blue-50 border-blue-500 text-blue-800 dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-500' : 'hover:bg-slate-50 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-600 dark:text-slate-300'}`}>
                  <input type="radio" name="pred" className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500" checked={predicateMode === 'WG'} onChange={() => setPredicateMode('WG')} />
                  <span className="font-bold text-sm">Alleen Werkwoordelijk (WG)</span>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${predicateMode === 'NG' ? 'bg-yellow-50 border-yellow-500 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-100 dark:border-yellow-500' : 'hover:bg-slate-50 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-600 dark:text-slate-300'}`}>
                  <input type="radio" name="pred" className="w-4 h-4 text-yellow-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500" checked={predicateMode === 'NG'} onChange={() => setPredicateMode('NG')} />
                  <span className="font-bold text-sm">Alleen Naamwoordelijk (NG)</span>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${predicateMode === 'ALL' ? 'bg-indigo-50 border-indigo-500 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-100 dark:border-indigo-500' : 'hover:bg-slate-50 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-600 dark:text-slate-300'}`}>
                  <input type="radio" name="pred" className="w-4 h-4 text-indigo-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500" checked={predicateMode === 'ALL'} onChange={() => setPredicateMode('ALL')} />
                  <span className="font-bold text-sm">Allebei (Mix)</span>
                </label>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <label className="flex items-center justify-between p-3 rounded-lg border border-blue-100 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:hover:bg-blue-900/40 cursor-pointer transition-colors">
                  <span className="font-bold text-blue-900 dark:text-blue-200 block text-sm">Samengestelde zinnen</span>
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500" checked={focusBijzin} onChange={(e) => setFocusBijzin(e.target.checked)} />
                </label>
              </div>
            </div>
          </div>

          {/* Column 2: Focus & Complexity */}
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2 text-sm uppercase tracking-wider">Specifiek Oefenen (Focus)</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Vink aan om alleen zinnen te tonen met dit onderdeel.</p>
              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer transition-colors">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block text-sm">Lijdend Voorwerp</span>
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded bg-gray-100 border-slate-300" checked={focusLV} onChange={(e) => setFocusLV(e.target.checked)} />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer transition-colors">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block text-sm">Meewerkend Voorwerp</span>
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded bg-gray-100 border-slate-300" checked={focusMV} onChange={(e) => setFocusMV(e.target.checked)} />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer transition-colors">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block text-sm">Voorzetselvoorwerp</span>
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded bg-gray-100 border-slate-300" checked={focusVV} onChange={(e) => setFocusVV(e.target.checked)} />
                </label>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2 text-sm uppercase tracking-wider">Onderdelen (Moeilijkheid)</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Vink aan om te oefenen met het benoemen van deze zinsdelen</p>
              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer transition-colors">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block text-sm">Bijstelling</span>
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded bg-gray-100 border-slate-300" checked={includeBijst} onChange={(e) => setIncludeBijst(e.target.checked)} />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer transition-colors">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block text-sm">Bijvoeglijke Bepaling</span>
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded bg-gray-100 border-slate-300" checked={includeBB} onChange={(e) => setIncludeBB(e.target.checked)} />
                </label>
              </div>
            </div>
          </div>

          {/* Column 3: Start & Select */}
          <div className="flex flex-col gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800 text-center flex flex-col justify-center flex-1">
              <h3 className="font-bold text-blue-800 dark:text-blue-200 text-xl mb-2">Start Oefensessie</h3>
              {isLoadingSentences ? (
                <div className="text-sm text-blue-500 dark:text-blue-300 mb-4 font-medium">Zinnen laden...</div>
              ) : sentenceLoadError ? (
                <div className="text-sm text-red-500 dark:text-red-300 mb-4 font-medium">{sentenceLoadError}</div>
              ) : (
                <div className="text-sm text-blue-600 dark:text-blue-300 mb-4 font-medium">{availableSentences.length} zinnen beschikbaar</div>
              )}
              <div className="flex flex-col items-center gap-3">
                <div className="flex flex-col items-center gap-1 w-full">
                  <label className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase">Aantal zinnen</label>
                  <input type="number" min="1" max={availableSentences.length} value={customSessionCount} onChange={(e) => setCustomSessionCount(Math.max(1, Math.min(availableSentences.length, parseInt(e.target.value) || 1)))} className="w-full px-3 py-3 text-lg font-bold text-center border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-100 rounded-lg focus:border-blue-500 outline-none" />
                </div>
                <button onClick={startSession} disabled={isLoadingSentences || availableSentences.length === 0} className="w-full h-[46px] px-8 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {isLoadingSentences ? 'Laden...' : 'Start'}
                </button>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-center">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2 text-center">Kies één zin</h3>
              <select className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" onChange={(e) => handleSentenceSelect(Number(e.target.value))} defaultValue="" disabled={isLoadingSentences}>
                <option value="" disabled>{isLoadingSentences ? 'Laden...' : '-- Selecteer --'}</option>
                {availableSentences.map(s => (<option key={s.id} value={s.id}>{s.label}</option>))}
              </select>
            </div>

            {/* Import teacher sentences */}
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800 flex flex-col items-center gap-2">
              <h3 className="font-bold text-green-800 dark:text-green-200 text-sm">Docent-zinnen</h3>
              {customCount > 0 && (
                <p className="text-xs text-green-600 dark:text-green-300">{customCount} eigen zinnen geladen</p>
              )}
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors">
                Importeer zinnen (.json)
              </button>
              {importMsg && (
                <p className={`text-xs font-medium ${importMsg.startsWith('Fout') ? 'text-red-600 dark:text-red-300' : 'text-green-600 dark:text-green-300'}`}>{importMsg}</p>
              )}
            </div>
          </div>
        </div>
        <div className="text-center pt-6 border-t border-slate-100 dark:border-slate-700 flex flex-col items-center gap-2">
          <button onClick={() => setShowHelp(true)} className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium flex items-center justify-center gap-2 mx-auto transition-colors"><span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">i</span>Instructies & Uitleg</button>
          <a href="#/docent" className="text-slate-300 dark:text-slate-600 hover:text-slate-400 dark:hover:text-slate-500 text-xs transition-colors">Docentenomgeving</a>
        </div>
      </main>
    </div>
  );
};
