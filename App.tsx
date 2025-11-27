import React, { useState, useEffect } from 'react';
import { SENTENCES, ROLES, FEEDBACK_MATRIX, FEEDBACK_STRUCTURE, HINTS } from './constants';
import { Sentence, PlacementMap, RoleKey, Token, RoleDefinition, DifficultyLevel, ValidationState } from './types';
import { DraggableRole } from './components/WordChip';
import { SentenceChunk } from './components/DropZone';
import { HelpModal } from './components/HelpModal';

type AppStep = 'split' | 'label';
type Mode = 'free' | 'session';
type PredicateMode = 'ALL' | 'WG' | 'NG';

interface ChunkData {
  tokens: Token[];
  originalIndices: number[]; // Global indices
}

// Simple Confirmation Modal Component
const ConfirmationModal = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel 
}: { 
  isOpen: boolean; 
  title: string; 
  message: string; 
  onConfirm: () => void; 
  onCancel: () => void; 
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
       <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm w-full animate-in zoom-in-95 duration-200">
          <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-white">{title}</h3>
          <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">{message}</p>
          <div className="flex gap-3 justify-end">
             <button 
               onClick={onCancel} 
               className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium transition-colors"
             >
               Nee, ga terug
             </button>
             <button 
               onClick={onConfirm} 
               className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-sm transition-colors"
             >
               Ja, zeker
             </button>
          </div>
       </div>
    </div>
  );
};

export default function App() {
  const [mode, setMode] = useState<Mode>('free');
  
  // Configuration State
  const [predicateMode, setPredicateMode] = useState<PredicateMode>('ALL');
  
  // Focus Filters
  const [focusLV, setFocusLV] = useState(false);
  const [focusMV, setFocusMV] = useState(false);
  const [focusVV, setFocusVV] = useState(false);
  const [focusBijzin, setFocusBijzin] = useState(false); 

  // Complexity Filters
  const [includeBijst, setIncludeBijst] = useState(false);
  const [includeBB, setIncludeBB] = useState(false);
  const [includeVV] = useState(false); 
  
  // New Configuration: Level & Count
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel | null>(null); // null = all
  const [customSessionCount, setCustomSessionCount] = useState<number>(10);

  // Session State
  const [sessionQueue, setSessionQueue] = useState<Sentence[]>([]);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [mistakeStats, setMistakeStats] = useState<Record<string, number>>({});
  const [isSessionFinished, setIsSessionFinished] = useState(false);

  // Current Sentence State
  const [currentSentence, setCurrentSentence] = useState<Sentence | null>(null);
  const [step, setStep] = useState<AppStep>('split');
  
  // UI State
  const [showHelp, setShowHelp] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [largeFont, setLargeFont] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'answer' | 'abort' | null>(null);
  
  // Splitting State
  const [splitIndices, setSplitIndices] = useState<Set<number>>(new Set());

  // Labeling State
  const [chunkLabels, setChunkLabels] = useState<PlacementMap>({}); 
  const [subLabels, setSubLabels] = useState<PlacementMap>({}); 
  
  const [validationResult, setValidationResult] = useState<{
    score: number;
    total: number;
    chunkStatus: Record<number, ValidationState>;
    chunkFeedback: Record<number, string>;
    isPerfect: boolean;
  } | null>(null);

  const [showAnswerMode, setShowAnswerMode] = useState(false);
  const [hintMessage, setHintMessage] = useState<string | null>(null);

  // --- Effects ---
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // --- Logic ---

  const getFilteredSentences = () => {
    return SENTENCES.filter(s => {
      const isCompound = s.level === 4;
      if (isCompound && !focusBijzin) return false;

      if (predicateMode === 'WG' && s.predicateType !== 'WG') return false;
      if (predicateMode === 'NG' && s.predicateType !== 'NG') return false;
      
      const specificFocusActive = focusLV || focusMV || focusVV;
      
      if (specificFocusActive) {
        const matchesFocus = (
            (focusLV && s.tokens.some(t => t.role === 'lv')) ||
            (focusMV && s.tokens.some(t => t.role === 'mv')) ||
            (focusVV && s.tokens.some(t => t.role === 'vv')) ||
            (focusBijzin && isCompound)
        );
        if (!matchesFocus) return false;
      } else if (focusBijzin) {
         if (!isCompound) return false;
      }

      const isLevelHighOrAll = selectedLevel === 3 || selectedLevel === null;
      const isLevelLow = selectedLevel === 1;

      if (!isCompound && !isLevelHighOrAll && !includeBijst && s.tokens.some(t => t.role === 'bijst')) {
          return false;
      }
      
      if (!isCompound && isLevelLow && !includeVV && !focusVV && s.tokens.some(t => t.role === 'vv')) {
          return false;
      }
      
      if (selectedLevel !== null) {
          if (s.level !== selectedLevel) return false;
      } else {
          if (s.level === 4 && !focusBijzin) return false;
      }

      return true;
    });
  };

  const startSession = () => {
    const pool = getFilteredSentences();
    if (pool.length === 0) {
      alert("Geen zinnen beschikbaar met de huidige filters.");
      return;
    }
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const count = Math.min(Math.max(1, customSessionCount), shuffled.length);
    const selected = shuffled.slice(0, count);

    setSessionQueue(selected);
    setSessionIndex(0);
    setSessionStats({ correct: 0, total: 0 });
    setMistakeStats({});
    setIsSessionFinished(false);
    setMode('session');
    loadSentence(selected[0]);
  };

  const nextSessionSentence = () => {
    const nextIndex = sessionIndex + 1;
    if (nextIndex < sessionQueue.length) {
      setSessionIndex(nextIndex);
      loadSentence(sessionQueue[nextIndex]);
    } else {
      setIsSessionFinished(true);
      setCurrentSentence(null);
    }
  };

  const loadSentence = (sentence: Sentence) => {
    setCurrentSentence(sentence);
    setStep('split');
    setSplitIndices(new Set());
    setChunkLabels({});
    setSubLabels({});
    setValidationResult(null);
    setShowAnswerMode(false);
    setHintMessage(null);
    setConfirmAction(null);
  };

  const handleSentenceSelect = (sentenceId: number) => {
    if (sentenceId === -1) {
        setCurrentSentence(null);
        return;
    }
    const selected = SENTENCES.find(s => s.id === sentenceId);
    if (selected) {
      setMode('free');
      loadSentence(selected);
    }
  };

  const toggleSplit = (tokenIndex: number) => {
    if (showAnswerMode) return;
    if (validationResult) setValidationResult(null);
    setHintMessage(null);
    
    const newSplits = new Set(splitIndices);
    if (newSplits.has(tokenIndex)) {
      newSplits.delete(tokenIndex);
    } else {
      newSplits.add(tokenIndex);
    }
    setSplitIndices(newSplits);
  };

  const handleNextStep = () => {
    setStep('label');
    setValidationResult(null);
    setHintMessage(null);
  };

  const handleBackStep = () => {
    setStep('split');
    setValidationResult(null);
    setHintMessage(null);
  };

  const getUserChunks = (): ChunkData[] => {
    if (!currentSentence) return [];
    const chunks: ChunkData[] = [];
    let currentChunkTokens: Token[] = [];
    let currentChunkIndices: number[] = [];

    currentSentence.tokens.forEach((token, index) => {
      currentChunkTokens.push(token);
      currentChunkIndices.push(index);

      if (splitIndices.has(index) || index === currentSentence.tokens.length - 1) {
        chunks.push({
          tokens: currentChunkTokens,
          originalIndices: currentChunkIndices
        });
        currentChunkTokens = [];
        currentChunkIndices = [];
      }
    });
    return chunks;
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, roleKey: string) => {
    e.dataTransfer.setData("text/role", roleKey);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDropChunk = (e: React.DragEvent<HTMLDivElement>, chunkId: string) => {
    e.preventDefault();
    if (showAnswerMode) return;
    const roleKey = e.dataTransfer.getData("text/role") as RoleKey;
    if (roleKey) {
      setChunkLabels(prev => ({ ...prev, [chunkId]: roleKey }));
      setValidationResult(null);
      setHintMessage(null);
    }
  };

  const handleDropWord = (e: React.DragEvent<HTMLSpanElement>, tokenId: string) => {
    e.preventDefault();
    if (showAnswerMode) return;
    const roleKey = e.dataTransfer.getData("text/role") as RoleKey;
    if (roleKey) {
      setSubLabels(prev => ({ ...prev, [tokenId]: roleKey }));
      setValidationResult(null);
      setHintMessage(null);
    }
  };

  const removeLabel = (chunkId: string) => {
    if (showAnswerMode) return;
    const newLabels = { ...chunkLabels };
    delete newLabels[chunkId];
    setChunkLabels(newLabels);
    setValidationResult(null);
    setHintMessage(null);
  };

  const removeSubLabel = (tokenId: string) => {
    if (showAnswerMode) return;
    const newLabels = { ...subLabels };
    delete newLabels[tokenId];
    setSubLabels(newLabels);
    setValidationResult(null);
    setHintMessage(null);
  };

  const handleHint = () => {
    if (!currentSentence) return;
    
    const usedRoles = Object.values(chunkLabels);
    if (!usedRoles.includes('pv')) { setHintMessage(HINTS.MISSING_PV); return; }
    if (!usedRoles.includes('ow')) { setHintMessage(HINTS.MISSING_OW); return; }

    const actualRolesInSentence = new Set<RoleKey>();
    currentSentence.tokens.forEach(t => {
        actualRolesInSentence.add(t.role);
    });

    if (actualRolesInSentence.has('wg') && !usedRoles.includes('wg')) { setHintMessage(HINTS.MISSING_WG); return; }
    if (actualRolesInSentence.has('nwd') && !usedRoles.includes('nwd')) { setHintMessage(HINTS.MISSING_NG); return; }
    if (actualRolesInSentence.has('lv') && !usedRoles.includes('lv')) { setHintMessage(HINTS.MISSING_LV); return; }
    
    const remainingMissing = Array.from(actualRolesInSentence).find(r => !usedRoles.includes(r));
    if (remainingMissing) {
        const roleDef = ROLES.find(r => r.key === remainingMissing);
        if (roleDef) { setHintMessage(HINTS.generic(roleDef.label)); }
    } else {
        setHintMessage("Je hebt alle labels gebruikt. Controleer of ze op de juiste plek staan!");
    }
  };

  const handleCheck = () => {
    if (!currentSentence) return;
    
    const userChunks = getUserChunks();
    const chunkStatus: Record<number, ValidationState> = {};
    const chunkFeedback: Record<number, string> = {};
    let correctChunksCount = 0;
    const currentMistakes: Record<string, number> = {};

    userChunks.forEach((chunk, idx) => {
      const chunkTokens = chunk.tokens;
      const firstTokenId = chunkTokens[0].id;
      const firstTokenRole = chunkTokens[0].role;
      const missedInternalSplit = chunkTokens.slice(1).some(t => t.newChunk);
      const isConsistentRole = chunkTokens.every(t => t.role === firstTokenRole);
      const lastTokenId = chunkTokens[chunkTokens.length - 1].id;
      const lastTokenIndex = currentSentence.tokens.findIndex(t => t.id === lastTokenId);
      const nextToken = currentSentence.tokens[lastTokenIndex + 1];
      const splitTooEarly = nextToken && nextToken.role === firstTokenRole && !nextToken.newChunk;
      const firstTokenIndexInSent = currentSentence.tokens.findIndex(t => t.id === firstTokenId);
      const prevToken = currentSentence.tokens[firstTokenIndexInSent - 1];
      const startedTooLate = prevToken && prevToken.role === firstTokenRole && !chunkTokens[0].newChunk;
      const isValidSplit = isConsistentRole && !splitTooEarly && !startedTooLate && !missedInternalSplit;

      if (!isValidSplit) {
        chunkStatus[idx] = 'incorrect-split';
        if (!isConsistentRole || missedInternalSplit) chunkFeedback[idx] = FEEDBACK_STRUCTURE.INCONSISTENT;
        else if (splitTooEarly || startedTooLate) chunkFeedback[idx] = FEEDBACK_STRUCTURE.TOO_MANY_SPLITS;
        else chunkFeedback[idx] = "De verdeling klopt niet.";
      } else {
        const userLabel = chunkLabels[firstTokenId];
        if (userLabel === firstTokenRole) {
          chunkStatus[idx] = 'correct';
          correctChunksCount++;
        } else {
          if (firstTokenRole === 'pv' && userLabel === 'wg') {
             chunkStatus[idx] = 'warning';
             chunkFeedback[idx] = FEEDBACK_MATRIX['wg'] && FEEDBACK_MATRIX['wg']['pv'] ? FEEDBACK_MATRIX['wg']['pv'] : "Dit hoort bij het gezegde.";
          } else {
             chunkStatus[idx] = 'incorrect-role';
             if (userLabel && FEEDBACK_MATRIX[userLabel] && FEEDBACK_MATRIX[userLabel][firstTokenRole]) {
                 chunkFeedback[idx] = FEEDBACK_MATRIX[userLabel][firstTokenRole];
             } else {
                 const userRoleName = ROLES.find(r => r.key === userLabel)?.label || "Gekozen";
                 const correctRoleName = ROLES.find(r => r.key === firstTokenRole)?.label || "Juiste";
                 chunkFeedback[idx] = `Dit is niet het ${userRoleName}, maar het ${correctRoleName}.`;
             }
             const roleName = ROLES.find(r => r.key === firstTokenRole)?.label || firstTokenRole;
             currentMistakes[roleName] = (currentMistakes[roleName] || 0) + 1;
          }
        }
      }
    });
    
    let subRoleMismatch = false;
    currentSentence.tokens.forEach(t => {
       const userSub = subLabels[t.id];
       let expectedSub = t.subRole;
       if (!includeBB && expectedSub === 'bijv_bep') expectedSub = undefined;
       if (userSub !== expectedSub) subRoleMismatch = true;
    });

    const isSplitPerfect = correctChunksCount === userChunks.length;
    let realChunkCount = 0;
    currentSentence.tokens.forEach((t, i) => {
        if (i === 0 || t.role !== currentSentence.tokens[i-1].role || t.newChunk) realChunkCount++;
    });
    const reallyPerfect = isSplitPerfect && userChunks.length === realChunkCount && !subRoleMismatch;

    setValidationResult({
      score: correctChunksCount,
      total: userChunks.length,
      chunkStatus,
      chunkFeedback,
      isPerfect: reallyPerfect
    });

    if (mode === 'session') {
        const newTotal = sessionStats.total + realChunkCount;
        const newCorrect = sessionStats.correct + correctChunksCount;
        setSessionStats({ correct: newCorrect, total: newTotal });
        const newMistakeStats = { ...mistakeStats };
        Object.entries(currentMistakes).forEach(([role, count]) => {
           newMistakeStats[role] = (newMistakeStats[role] || 0) + count;
        });
        setMistakeStats(newMistakeStats);
    }
  };

  const handleShowAnswerRequest = () => {
    setConfirmAction('answer');
  };

  const handleAbortRequest = () => {
    if (mode === 'session') {
      setConfirmAction('abort');
    } else {
      resetToHome();
    }
  };

  const handleConfirmAction = () => {
    if (confirmAction === 'answer') {
        executeShowAnswer();
    } else if (confirmAction === 'abort') {
        resetToHome();
    }
    setConfirmAction(null);
  };

  const executeShowAnswer = () => {
    if (!currentSentence) return;
    setHintMessage(null);
    const correctSplits = new Set<number>();
    currentSentence.tokens.forEach((t, i) => {
      const next = currentSentence.tokens[i + 1];
      if (next && (t.role !== next.role || next.newChunk)) correctSplits.add(i);
    });
    setSplitIndices(correctSplits);
    setStep('label');

    const correctChunkLabels: PlacementMap = {};
    const correctSubLabels: PlacementMap = {};
    let currentChunkStartId = currentSentence.tokens[0].id;
    correctChunkLabels[currentChunkStartId] = currentSentence.tokens[0].role;

    currentSentence.tokens.forEach((t, i) => {
      if (t.subRole) {
        if (t.subRole === 'bijv_bep' && !includeBB) { /* skip */ } 
        else { correctSubLabels[t.id] = t.subRole; }
      }
      if (correctSplits.has(i - 1)) {
         currentChunkStartId = t.id;
         correctChunkLabels[currentChunkStartId] = t.role;
      }
    });

    if (mode === 'session' && !validationResult) {
        let realChunkCount = 0;
        currentSentence.tokens.forEach((t, i) => {
            if (i === 0 || t.role !== currentSentence.tokens[i-1].role || t.newChunk) realChunkCount++;
        });
        setSessionStats(prev => ({ correct: prev.correct, total: prev.total + realChunkCount }));
    }

    setChunkLabels(correctChunkLabels);
    setSubLabels(correctSubLabels);
    setShowAnswerMode(true);
    setValidationResult(null);
  };

  const resetToHome = () => {
    setCurrentSentence(null);
    setMode('free');
    setSessionQueue([]);
    setValidationResult(null);
    setIsSessionFinished(false);
    setHintMessage(null);
    setConfirmAction(null);
  };

  const userChunks = getUserChunks();
  const availableSentences = getFilteredSentences();

  // --- HOME SCREEN ---
  if (!currentSentence && !isSessionFinished) {
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

                {/* ... (Filter Grid - Remains same as previous, ensures Checkboxes have explicit light bg on mobile) ... */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     {/* ... (Code for filters omitted for brevity, same as previous but ensure checkbox bg-gray-100 is present) ... */}
                     {/* Re-inserting full grid content for correctness */}
                    <div className="space-y-4">
                        <div>
                           <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2 text-sm uppercase tracking-wider">Moeilijkheidsgraad</h3>
                           <div className="flex gap-2">
                              {[null, 1, 2, 3].map((lvl) => (
                                <button key={lvl || 'all'} onClick={() => setSelectedLevel(lvl as DifficultyLevel)} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${selectedLevel === lvl ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                  {lvl === null ? 'Alles' : lvl === 1 ? 'Basis' : lvl === 2 ? 'Middel' : 'Hoog'}
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

                    <div className="flex flex-col gap-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800 text-center flex flex-col justify-center flex-1">
                            <h3 className="font-bold text-blue-800 dark:text-blue-200 text-xl mb-2">Start Oefensessie</h3>
                            <div className="text-sm text-blue-600 dark:text-blue-300 mb-4 font-medium">{availableSentences.length} zinnen beschikbaar</div>
                            <div className="flex flex-col items-center gap-3">
                                <div className="flex flex-col items-center gap-1 w-full">
                                    <label className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase">Aantal zinnen</label>
                                    <input type="number" min="1" max={availableSentences.length} value={customSessionCount} onChange={(e) => setCustomSessionCount(Math.max(1, Math.min(availableSentences.length, parseInt(e.target.value) || 1)))} className="w-full px-3 py-3 text-lg font-bold text-center border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-100 rounded-lg focus:border-blue-500 outline-none" />
                                </div>
                                <button onClick={startSession} className="w-full h-[46px] px-8 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all">Start</button>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-center">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2 text-center">Kies één zin</h3>
                            <select className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" onChange={(e) => handleSentenceSelect(Number(e.target.value))} defaultValue="">
                                <option value="" disabled>-- Selecteer --</option>
                                {availableSentences.map(s => (<option key={s.id} value={s.id}>{s.label}</option>))}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="text-center pt-6 border-t border-slate-100 dark:border-slate-700">
                   <button onClick={() => setShowHelp(true)} className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium flex items-center justify-center gap-2 mx-auto transition-colors"><span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">i</span>Instructies & Uitleg</button>
                </div>
            </main>
        </div>
      );
  }

  // --- SCORE SCREEN ---
  if (isSessionFinished) {
      // ... Same as above
      // Re-using Score Screen Logic from previous
      const scorePercentage = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;
    const topMistakes = Object.entries(mistakeStats).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 3);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 font-sans flex items-center justify-center transition-colors duration-300">
            <main className="max-w-xl w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg text-center border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Sessie Voltooid! 🎉</h2>
                <div className="mb-8">
                    <div className={`text-6xl font-black mb-2 ${scorePercentage >= 80 ? 'text-green-600 dark:text-green-400' : scorePercentage >= 55 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>{scorePercentage}%</div>
                    <p className="text-slate-500 dark:text-slate-400">Je hebt {sessionStats.correct} van de {sessionStats.total} zinsdelen goed benoemd.</p>
                </div>
                {topMistakes.length > 0 && (
                   <div className="mb-8 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800 text-left">
                     <h3 className="font-bold text-orange-800 dark:text-orange-200 mb-2">Aandachtspunten:</h3>
                     <ul className="list-disc list-inside space-y-1 text-sm text-orange-800 dark:text-orange-200">
                        {topMistakes.map(([role, count]) => (<li key={role}><span className="font-semibold">{role}</span>: {count}x fout</li>))}
                     </ul>
                   </div>
                )}
                <div className="flex justify-center gap-4">
                    <button onClick={resetToHome} className="px-8 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Terug naar Home</button>
                    <button onClick={startSession} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors">Nog een keer</button>
                </div>
            </main>
        </div>
    );
  }

  // --- ACTIVE TRAINER UI ---
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-2 md:p-4 font-sans transition-colors duration-300 flex flex-col">
      
      <ConfirmationModal 
         isOpen={confirmAction === 'answer'} 
         title="Antwoord tonen?" 
         message="Weet je zeker dat je het antwoord wilt zien? Je krijgt dan geen punten voor deze zin." 
         onConfirm={handleConfirmAction} 
         onCancel={() => setConfirmAction(null)} 
      />

      <ConfirmationModal 
         isOpen={confirmAction === 'abort'} 
         title="Sessie afbreken?" 
         message="Weet je zeker dat je wilt stoppen? Je voortgang in deze sessie gaat verloren." 
         onConfirm={handleConfirmAction} 
         onCancel={() => setConfirmAction(null)} 
      />
      
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      <main className="max-w-6xl mx-auto w-full flex flex-col gap-4 flex-1 mb-20"> {/* Add mb-20 for bottom bar space */}
        
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Zinsontledingstrainer</h1>
          </div>

          <div className="flex gap-2">
               <button onClick={() => setLargeFont(!largeFont)} className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-all border ${largeFont ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-200' : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'}`} title="Lettergrootte">aA</button>
                <button onClick={() => setDarkMode(!darkMode)} className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all" title="Donkere modus">
                  {darkMode ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" strokeWidth="2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>}
                </button>
                <button onClick={() => setShowHelp(true)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-100 dark:border-blue-800 hover:bg-blue-100 transition-colors" title="Instructies">?</button>
          </div>
        </header>

        {/* Progress Stepper */}
        <div className="flex justify-center">
             <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
                 <div className={`flex items-center gap-2 cursor-pointer transition-colors ${step === 'split' ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}`} onClick={() => !showAnswerMode && setStep('split')}>
                   <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border ${step === 'split' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/50 dark:border-blue-400' : 'border-slate-300 dark:border-slate-600'}`}>1</span>Verdelen
                 </div>
                 <span className="text-slate-300 dark:text-slate-600">→</span>
                 <div className={`flex items-center gap-2 cursor-pointer transition-colors ${step === 'label' ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}`}>
                   <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border ${step === 'label' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/50 dark:border-blue-400' : 'border-slate-300 dark:border-slate-600'}`}>2</span>Benoemen
                 </div>
              </div>
        </div>

        {/* --- Main Content Area --- */}
        <div className="space-y-4 flex-1 flex flex-col">
            {/* Feedback Block */}
            {validationResult && (
               <div className={`p-3 rounded-xl text-center font-bold animate-in slide-in-from-top-2 duration-300 ${validationResult.isPerfect ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 border border-green-200 dark:border-green-800' : 'bg-orange-50 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200 border border-orange-200 dark:border-orange-800'}`}>
                 {validationResult.isPerfect ? "🎉 Perfect! Alles goed verdeeld en benoemd." : `Je hebt ${validationResult.score} van de ${validationResult.total} zinsdelen goed.`}
               </div>
            )}
            
            {/* Hint Message (Moved ABOVE controls) */}
            {hintMessage && !validationResult && (
               <div className="p-3 rounded-xl text-center font-bold bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800 animate-in slide-in-from-bottom-2 duration-300">
                 💡 {hintMessage}
               </div>
            )}

            {showAnswerMode && <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-lg text-center font-bold">Dit is de juiste oplossing.</div>}

            {/* STEP 1: SPLITTING VIEW */}
            {step === 'split' && currentSentence && (
              <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center animate-in fade-in duration-300 flex-1 flex flex-col justify-center">
                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Stap 1: Verdelen</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Klik tussen de woorden om de zin in zinsdelen te knippen.</p>
                
                <div className={`flex flex-wrap items-center justify-center gap-y-6 select-none py-4 ${largeFont ? 'text-2xl md:text-3xl leading-relaxed' : 'text-xl md:text-2xl leading-loose'}`}>
                  {currentSentence.tokens.map((token, idx) => (
                    <React.Fragment key={token.id}>
                      <span className="px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded text-slate-800 dark:text-slate-100 font-medium transition-colors">{token.text}</span>
                      {idx < currentSentence.tokens.length - 1 && (
                        <div onClick={() => toggleSplit(idx)} className="group relative w-10 h-12 mx-0 cursor-pointer flex items-center justify-center transition-all">
                          <div className={`w-1 h-8 rounded-full transition-all duration-200 ${splitIndices.has(idx) ? 'bg-blue-500 h-10 shadow-[0_0_12px_rgba(59,130,246,0.6)]' : 'bg-slate-200 dark:bg-slate-600 group-hover:bg-slate-300 dark:group-hover:bg-slate-500'}`}></div>
                          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-white dark:bg-slate-700 rounded-full shadow-md border dark:border-slate-600 flex items-center justify-center text-sm transition-all duration-200 pointer-events-none z-10 ${splitIndices.has(idx) ? 'opacity-100 border-blue-500 text-blue-500 scale-100' : 'opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 text-slate-400'}`}>✂️</div>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <div className="mt-8 flex justify-center">
                  <button onClick={handleNextStep} className="group px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 hover:shadow-blue-200 hover:-translate-y-0.5 transition-all flex items-center gap-3">Naar benoemen<span className="group-hover:translate-x-1 transition-transform">→</span></button>
                </div>
              </div>
            )}

            {/* STEP 2: LABELING VIEW */}
            {step === 'label' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col">
                 {!showAnswerMode && (
                   <div className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 sticky top-0 z-[100] transition-all">
                      <div className="flex flex-col gap-2 md:gap-4">
                        <div>
                           <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Zinsdelen & Gezegde:</p>
                           <div className="flex flex-wrap gap-2">
                            {ROLES.filter(r => !r.isSubOnly)
                                  .filter(r => (includeVV || focusVV || selectedLevel === 2 || selectedLevel === 3 || selectedLevel === 4 || selectedLevel === null || (currentSentence && currentSentence.tokens.some(t => t.role === 'vv'))) || r.key !== 'vv')
                                  .filter(r => r.key !== 'bijzin' || focusBijzin || selectedLevel === 3 || selectedLevel === 4 || selectedLevel === null || (currentSentence && currentSentence.tokens.some(t => t.role === 'bijzin')))
                                  .filter(r => r.key !== 'vw_neven' || focusBijzin || selectedLevel === 3 || selectedLevel === 4 || selectedLevel === null || (currentSentence && currentSentence.tokens.some(t => t.role === 'vw_neven')))
                                  .map(role => (
                              <DraggableRole key={role.key} role={role} onDragStart={handleDragStart} isLargeFont={largeFont} />
                            ))}
                           </div>
                        </div>
                        {includeBB && (
                        <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
                           <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Sleep op specifieke woorden:</p>
                           <div className="flex flex-wrap gap-2">
                            {ROLES.filter(r => r.isSubOnly)
                                  .filter(r => r.key !== 'vw_onder' || focusBijzin || selectedLevel === 3 || selectedLevel === 4 || selectedLevel === null || (currentSentence && currentSentence.tokens.some(t => t.subRole === 'vw_onder')))
                                  .map(role => (
                              <DraggableRole key={role.key} role={role} onDragStart={handleDragStart} isLargeFont={largeFont} />
                            ))}
                           </div>
                        </div>
                        )}
                      </div>
                   </div>
                 )}

                 <div className="flex flex-wrap gap-y-6 gap-x-2 justify-center items-start pt-2 px-1 flex-1 content-start">
                    {userChunks.map((chunk, idx) => {
                      const startTokenId = chunk.tokens[0].id;
                      const assignedRoleKey = chunkLabels[startTokenId];
                      const roleDef = assignedRoleKey ? ROLES.find(r => r.key === assignedRoleKey) || null : null;
                      const chunkSubRoles: Record<string, RoleDefinition> = {};
                      chunk.tokens.forEach(t => {
                        if (subLabels[t.id]) {
                          const found = ROLES.find(r => r.key === subLabels[t.id]);
                          if (found) chunkSubRoles[t.id] = found;
                        }
                      });
                      const mergeIndex = chunk.originalIndices[chunk.originalIndices.length - 1];

                      return (
                        <React.Fragment key={startTokenId}>
                          <SentenceChunk
                            chunkIndex={idx}
                            tokens={chunk.tokens}
                            startIndex={chunk.originalIndices[0]}
                            assignedRole={roleDef}
                            subRoles={chunkSubRoles}
                            onDropChunk={handleDropChunk}
                            onDropWord={handleDropWord}
                            onRemoveRole={removeLabel}
                            onRemoveSubRole={removeSubLabel}
                            onToggleSplit={toggleSplit}
                            validationState={validationResult?.chunkStatus[idx]}
                            feedbackMessage={validationResult?.chunkFeedback[idx]}
                            isLargeFont={largeFont}
                          />
                          
                          {idx < userChunks.length - 1 && (
                            <div className="flex items-center self-center px-1">
                              <button onClick={() => toggleSplit(mergeIndex)} disabled={showAnswerMode} className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900 text-slate-300 dark:text-slate-500 hover:text-blue-500 border border-slate-200 dark:border-slate-600 hover:border-blue-300 flex items-center justify-center transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" title="Samenvoegen"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg></button>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                 </div>
              </div>
            )}
          </div>

          {/* --- NEW BOTTOM BAR --- */}
          <footer className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-[500] p-3">
             <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
                 
                 {/* Left: Sentence Label */}
                 <div className="font-medium text-slate-800 dark:text-white text-sm md:text-base truncate max-w-[50%]">
                     {currentSentence ? currentSentence.label : "Geen zin geselecteerd"}
                 </div>

                 {/* Center: Session Progress (Only in session mode) */}
                 {mode === 'session' && (
                     <div className="flex flex-col items-center w-full md:w-auto">
                         <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                             Zin {sessionIndex + 1} / {sessionQueue.length}
                         </div>
                         <div className="w-32 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                             <div 
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${((sessionIndex + 1) / sessionQueue.length) * 100}%` }}
                             ></div>
                         </div>
                     </div>
                 )}

                 {/* Right: Actions */}
                 <div className="flex gap-2">
                    {step === 'split' ? (
                        <div className="flex gap-2">
                            <button onClick={handleBackStep} className="hidden"></button> {/* Dummy for alignment if needed */}
                            <button onClick={handleNextStep} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors text-sm">
                                Naar benoemen →
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                             <button onClick={handleBackStep} className="px-3 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium text-sm transition-colors">
                                ← Terug
                             </button>
                             
                             {!showAnswerMode && (
                                <>
                                    <button 
                                        onClick={handleHint}
                                        className="px-3 py-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:hover:bg-yellow-900/50 font-bold rounded-lg transition-colors text-sm"
                                    >
                                        Hint
                                    </button>
                                    <button 
                                        onClick={handleCheck}
                                        disabled={Object.keys(chunkLabels).length === 0}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                                    >
                                        Check
                                    </button>
                                </>
                             )}

                             {mode === 'session' && (validationResult || showAnswerMode) && (
                                <button onClick={nextSessionSentence} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors text-sm">
                                    Volgende
                                </button>
                             )}

                             {!showAnswerMode && !validationResult?.isPerfect && (
                                <button onClick={handleShowAnswerRequest} className="px-3 py-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg font-medium text-sm transition-colors">
                                    Antwoord
                                </button>
                             )}
                        </div>
                    )}
                    
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-600 mx-2"></div>

                    <button 
                        onClick={handleAbortRequest} 
                        className="px-3 py-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg font-medium text-sm transition-colors"
                    >
                        {mode === 'free' ? 'Stop' : 'Afbreken'}
                    </button>
                 </div>
             </div>
          </footer>

      </main>
    </div>
  );
}