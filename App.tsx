import React, { useState, useEffect } from 'react';
import { SENTENCES, ROLES, FEEDBACK_MATRIX, FEEDBACK_STRUCTURE, HINTS } from './constants';
import { Sentence, PlacementMap, RoleKey, Token, RoleDefinition, DifficultyLevel, ValidationState } from './types';
import { DraggableRole } from './components/WordChip';
import { SentenceChunk } from './components/DropZone';

type AppStep = 'split' | 'label';
type Mode = 'free' | 'session';
type PredicateMode = 'ALL' | 'WG' | 'NG';

interface ChunkData {
  tokens: Token[];
  originalIndices: number[]; // Global indices
}

export default function App() {
  const [mode, setMode] = useState<Mode>('free');
  
  // Configuration State
  const [predicateMode, setPredicateMode] = useState<PredicateMode>('ALL');
  
  // Focus Filters (Require specific parts)
  const [focusLV, setFocusLV] = useState(false);
  const [focusMV, setFocusMV] = useState(false);
  const [focusVV, setFocusVV] = useState(false);
  const [focusBijzin, setFocusBijzin] = useState(false); 

  // Complexity Filters (Exclude complex parts if unchecked)
  const [includeBijst, setIncludeBijst] = useState(false);
  const [includeBB, setIncludeBB] = useState(false);
  const [includeVV, setIncludeVV] = useState(false);
  
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
  
  // Splitting State: Set of indices where split occurs AFTER token[index]
  const [splitIndices, setSplitIndices] = useState<Set<number>>(new Set());

  // Labeling State
  const [chunkLabels, setChunkLabels] = useState<PlacementMap>({}); // Main Role (Chunk)
  const [subLabels, setSubLabels] = useState<PlacementMap>({}); // Sub Role (Word)
  
  const [validationResult, setValidationResult] = useState<{
    score: number;
    total: number;
    chunkStatus: Record<number, ValidationState>;
    chunkFeedback: Record<number, string>;
    isPerfect: boolean;
  } | null>(null);

  const [showAnswerMode, setShowAnswerMode] = useState(false);
  const [hintMessage, setHintMessage] = useState<string | null>(null);

  // --- Session Logic ---

  const getFilteredSentences = () => {
    return SENTENCES.filter(s => {
      // 1. Predicate Type Filter
      if (predicateMode === 'WG' && s.predicateType !== 'WG') return false;
      if (predicateMode === 'NG' && s.predicateType !== 'NG') return false;
      
      // 2. Focus Filters (OR Logic)
      const focusFiltersActive = focusLV || focusMV || focusVV || focusBijzin;
      
      if (focusFiltersActive) {
        const matchesFocus = (
            (focusLV && s.tokens.some(t => t.role === 'lv')) ||
            (focusMV && s.tokens.some(t => t.role === 'mv')) ||
            (focusVV && s.tokens.some(t => t.role === 'vv')) ||
            (focusBijzin && s.tokens.some(t => t.role === 'bijzin'))
        );
        if (!matchesFocus) return false;
      }
      
      const isBijzinTarget = focusBijzin && s.tokens.some(t => t.role === 'bijzin');

      // 3. Complexity Filters based on Level
      const isLevelHighOrAll = selectedLevel === 3 || selectedLevel === null;
      const isLevelMid = selectedLevel === 2;
      const isLevelLow = selectedLevel === 1;

      // Filter Bijstelling: Exclude if (Low or Mid) AND not checked AND not a specific target
      if (!isLevelHighOrAll && !includeBijst && !isBijzinTarget && s.tokens.some(t => t.role === 'bijst')) {
          return false;
      }
      
      // Filter VV: Exclude if (Low) AND not checked AND not focused/target
      if (isLevelLow && !includeVV && !focusVV && !isBijzinTarget && s.tokens.some(t => t.role === 'vv')) {
          return false;
      }
      
      // 4. Level Filter
      if (selectedLevel !== null && s.level !== selectedLevel) return false;

      return true;
    });
  };

  const startSession = () => {
    const pool = getFilteredSentences();
    if (pool.length === 0) {
      alert("Geen zinnen beschikbaar met de huidige filters. Probeer minder filters te selecteren.");
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

  // --- Editor Logic ---

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
    
    // 1. Priority: Persoonsvorm
    if (!usedRoles.includes('pv')) {
        setHintMessage(HINTS.MISSING_PV);
        return;
    }
    
    // 2. Priority: Onderwerp
    if (!usedRoles.includes('ow')) {
        setHintMessage(HINTS.MISSING_OW);
        return;
    }

    // 3. Check what roles are ACTUALLY in the sentence tokens
    const actualRolesInSentence = new Set<RoleKey>();
    currentSentence.tokens.forEach(t => {
        actualRolesInSentence.add(t.role);
    });

    // Only hint for WG if there are actual 'wg' tokens (parts of the verb other than PV)
    if (actualRolesInSentence.has('wg') && !usedRoles.includes('wg')) {
        setHintMessage(HINTS.MISSING_WG);
        return;
    }

    // Only hint for NG if there are actual 'nwd' tokens
    if (actualRolesInSentence.has('nwd') && !usedRoles.includes('nwd')) {
        setHintMessage(HINTS.MISSING_NG);
        return;
    }

    // 4. Objects & Others
    if (actualRolesInSentence.has('lv') && !usedRoles.includes('lv')) {
        setHintMessage(HINTS.MISSING_LV);
        return;
    }

    // 5. Fallback: Find first missing role in sentence
    const remainingMissing = Array.from(actualRolesInSentence).find(r => !usedRoles.includes(r));

    if (remainingMissing) {
        const roleDef = ROLES.find(r => r.key === remainingMissing);
        if (roleDef) {
            setHintMessage(HINTS.generic(roleDef.label));
        }
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
      
      // 1. Structure Logic
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
        if (!isConsistentRole || missedInternalSplit) {
            chunkFeedback[idx] = FEEDBACK_STRUCTURE.INCONSISTENT;
        } else if (splitTooEarly || startedTooLate) {
            chunkFeedback[idx] = FEEDBACK_STRUCTURE.TOO_MANY_SPLITS;
        } else {
            chunkFeedback[idx] = "De verdeling klopt niet.";
        }
      } else {
        // 2. Main Role Logic
        const userLabel = chunkLabels[firstTokenId];
        const isMainRoleCorrect = userLabel === firstTokenRole;
        
        if (isMainRoleCorrect) {
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
    
    // Subrole check
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
        if (i === 0 || t.role !== currentSentence.tokens[i-1].role || t.newChunk) {
            realChunkCount++;
        }
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

  const handleShowAnswer = () => {
    if (!currentSentence) return;
    setHintMessage(null);
    
    const correctSplits = new Set<number>();
    currentSentence.tokens.forEach((t, i) => {
      const next = currentSentence.tokens[i + 1];
      if (next && (t.role !== next.role || next.newChunk)) {
        correctSplits.add(i);
      }
    });
    setSplitIndices(correctSplits);
    setStep('label');

    const correctChunkLabels: PlacementMap = {};
    const correctSubLabels: PlacementMap = {};
    
    let currentChunkStartId = currentSentence.tokens[0].id;
    correctChunkLabels[currentChunkStartId] = currentSentence.tokens[0].role;

    currentSentence.tokens.forEach((t, i) => {
      if (t.subRole) {
        if (t.subRole === 'bijv_bep' && !includeBB) {
           // Skip
        } else {
           correctSubLabels[t.id] = t.subRole;
        }
      }
      if (correctSplits.has(i - 1)) {
         currentChunkStartId = t.id;
         correctChunkLabels[currentChunkStartId] = t.role;
      }
    });

    if (mode === 'session' && !validationResult) {
        let realChunkCount = 0;
        currentSentence.tokens.forEach((t, i) => {
            if (i === 0 || t.role !== currentSentence.tokens[i-1].role || t.newChunk) {
                realChunkCount++;
            }
        });
        setSessionStats(prev => ({
            correct: prev.correct,
            total: prev.total + realChunkCount
        }));
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
  };

  const userChunks = getUserChunks();
  const availableSentences = getFilteredSentences();

  // --- HOME SCREEN ---
  if (!currentSentence && !isSessionFinished) {
      return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans flex items-center justify-center">
            <main className="max-w-6xl w-full bg-white p-8 rounded-2xl shadow-lg space-y-8 border border-slate-200">
                <div className="text-center border-b pb-6">
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-2">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        Zinsontledingstrainer
                        </span>
                    </h1>
                    <p className="text-slate-500 text-lg">Stel je training samen:</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Filters */}
                    <div className="space-y-6">
                        <div>
                           <h3 className="font-bold text-slate-700 mb-2">Moeilijkheidsgraad</h3>
                           <div className="flex gap-2">
                              {[null, 1, 2, 3].map((lvl) => (
                                <button 
                                  key={lvl || 'all'}
                                  onClick={() => setSelectedLevel(lvl as DifficultyLevel)}
                                  className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all
                                    ${selectedLevel === lvl 
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}
                                  `}
                                >
                                  {lvl === null ? 'Alles' : lvl === 1 ? 'Basis' : lvl === 2 ? 'Middel' : 'Hoog'}
                                </button>
                              ))}
                           </div>
                        </div>
                        <div>
                           <h3 className="font-bold text-slate-700 mb-2">Soort Zinnen & Gezegde</h3>
                           <div className="flex flex-col gap-2">
                                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${predicateMode === 'WG' ? 'bg-blue-50 border-blue-500 text-blue-800' : 'hover:bg-slate-50 border-slate-200'}`}>
                                    <input type="radio" name="pred" className="w-4 h-4 text-blue-600" checked={predicateMode === 'WG'} onChange={() => setPredicateMode('WG')} />
                                    <span className="font-bold text-sm">Alleen Werkwoordelijk (WG)</span>
                                </label>
                                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${predicateMode === 'NG' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' : 'hover:bg-slate-50 border-slate-200'}`}>
                                    <input type="radio" name="pred" className="w-4 h-4 text-yellow-600" checked={predicateMode === 'NG'} onChange={() => setPredicateMode('NG')} />
                                    <span className="font-bold text-sm">Alleen Naamwoordelijk (NG)</span>
                                </label>
                                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${predicateMode === 'ALL' ? 'bg-indigo-50 border-indigo-500 text-indigo-800' : 'hover:bg-slate-50 border-slate-200'}`}>
                                    <input type="radio" name="pred" className="w-4 h-4 text-indigo-600" checked={predicateMode === 'ALL'} onChange={() => setPredicateMode('ALL')} />
                                    <span className="font-bold text-sm">Allebei (Mix)</span>
                                </label>
                           </div>
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-bold text-slate-700 mb-2">Specifiek Oefenen (Focus)</h3>
                            <p className="text-xs text-slate-400 mb-2">Vink aan om alleen zinnen te tonen met dit onderdeel.</p>
                            <div className="space-y-2">
                                <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                                    <span className="font-bold text-slate-700 block text-sm">Lijdend Voorwerp</span>
                                    <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" checked={focusLV} onChange={(e) => setFocusLV(e.target.checked)} />
                                </label>

                                <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                                    <span className="font-bold text-slate-700 block text-sm">Meewerkend Voorwerp</span>
                                    <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" checked={focusMV} onChange={(e) => setFocusMV(e.target.checked)} />
                                </label>

                                <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                                    <span className="font-bold text-slate-700 block text-sm">Voorzetselvoorwerp</span>
                                    <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" checked={focusVV} onChange={(e) => setFocusVV(e.target.checked)} />
                                </label>

                                <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                                    <span className="font-bold text-slate-700 block text-sm">Samengestelde Zinnen (Bijzin)</span>
                                    <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" checked={focusBijzin} onChange={(e) => setFocusBijzin(e.target.checked)} />
                                </label>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-slate-700 mb-2">Onderdelen (Moeilijkheid)</h3>
                            <p className="text-xs text-slate-400 mb-2">Vink aan om te oefenen met het benoemen van deze zinsdelen</p>
                            <div className="space-y-2">
                                <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                                    <span className="font-bold text-slate-700 block text-sm">Bijstelling</span>
                                    <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" checked={includeBijst} onChange={(e) => setIncludeBijst(e.target.checked)} />
                                </label>

                                <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                                    <span className="font-bold text-slate-700 block text-sm">Bijvoeglijke Bepaling</span>
                                    <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" checked={includeBB} onChange={(e) => setIncludeBB(e.target.checked)} />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center flex flex-col justify-center flex-1">
                            <h3 className="font-bold text-blue-800 text-xl mb-2">Start Oefensessie</h3>
                            <div className="text-sm text-blue-600 mb-4 font-medium">{availableSentences.length} zinnen beschikbaar</div>
                            <div className="flex flex-col items-center gap-3">
                                <div className="flex flex-col items-center gap-1">
                                    <label className="text-xs font-bold text-blue-800 uppercase">Aantal zinnen</label>
                                    <input type="number" min="1" max={availableSentences.length} value={customSessionCount} onChange={(e) => setCustomSessionCount(Math.max(1, Math.min(availableSentences.length, parseInt(e.target.value) || 1)))} className="w-full px-3 py-2 text-lg font-bold text-center border-2 border-blue-200 rounded-lg focus:border-blue-500 outline-none text-blue-900" />
                                </div>
                                <button onClick={startSession} className="w-full h-[46px] px-8 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all">Start</button>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-center">
                            <h3 className="font-bold text-slate-700 mb-2 text-center">Kies één zin</h3>
                            <select className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-700" onChange={(e) => handleSentenceSelect(Number(e.target.value))} defaultValue="">
                                <option value="" disabled>-- Selecteer --</option>
                                {availableSentences.map(s => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </main>
        </div>
      );
  }

  // --- SCORE SCREEN ---
  if (isSessionFinished) {
    const scorePercentage = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;
    const topMistakes = Object.entries(mistakeStats).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 3);

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans flex items-center justify-center">
            <main className="max-w-xl w-full bg-white p-8 rounded-2xl shadow-lg text-center border border-slate-200 animate-in zoom-in-95 duration-300">
                <h2 className="text-3xl font-bold text-slate-800 mb-6">Sessie Voltooid! 🎉</h2>
                <div className="mb-8">
                    <div className={`text-6xl font-black mb-2 ${scorePercentage >= 80 ? 'text-green-600' : scorePercentage >= 55 ? 'text-blue-600' : 'text-orange-600'}`}>{scorePercentage}%</div>
                    <p className="text-slate-500">Je hebt {sessionStats.correct} van de {sessionStats.total} zinsdelen goed benoemd.</p>
                </div>
                {topMistakes.length > 0 && (
                   <div className="mb-8 bg-orange-50 p-4 rounded-xl border border-orange-100 text-left">
                     <h3 className="font-bold text-orange-800 mb-2">Aandachtspunten:</h3>
                     <ul className="list-disc list-inside space-y-1 text-sm text-orange-800">
                        {topMistakes.map(([role, count]) => (
                           <li key={role}><span className="font-semibold">{role}</span>: {count}x fout</li>
                        ))}
                     </ul>
                   </div>
                )}
                <div className="flex justify-center gap-4">
                    <button onClick={resetToHome} className="px-8 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">Terug naar Home</button>
                    <button onClick={startSession} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors">Nog een keer</button>
                </div>
            </main>
        </div>
    );
  }

  // --- ACTIVE TRAINER UI ---
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <main className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Zinsontledingstrainer</h1>
            {mode === 'session' && <p className="text-sm text-slate-500">Zin {sessionIndex + 1} van {sessionQueue.length}</p>}
          </div>
          
          <div className="flex items-center gap-4 text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
             <div className={`flex items-center gap-2 cursor-pointer transition-colors ${step === 'split' ? 'text-blue-600 font-bold' : 'text-slate-400'}`} onClick={() => !showAnswerMode && setStep('split')}>
               <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${step === 'split' ? 'border-blue-600 bg-blue-50' : 'border-slate-300'}`}>1</span>Verdelen
             </div>
             <span className="text-slate-300">→</span>
             <div className={`flex items-center gap-2 cursor-pointer transition-colors ${step === 'label' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
               <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${step === 'label' ? 'border-blue-600 bg-blue-50' : 'border-slate-300'}`}>2</span>Benoemen
             </div>
          </div>

          <div className="flex gap-2">
             {mode === 'free' && <button onClick={resetToHome} className="text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-1 bg-white border border-slate-200 rounded-lg">Stoppen</button>}
             {mode === 'session' && <button onClick={resetToHome} className="text-sm font-medium text-red-400 hover:text-red-600 px-3 py-1">Afbreken</button>}
          </div>
        </header>

        {/* Info Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="font-medium text-slate-700">{currentSentence && currentSentence.label}</div>
          <div className="flex gap-3">
              {!showAnswerMode && !validationResult?.isPerfect && (
                 <button onClick={handleShowAnswer} className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded hover:bg-blue-50 transition-colors">Toon antwoord</button>
              )}
              {mode === 'free' && <button onClick={() => loadSentence(currentSentence!)} className="text-sm text-slate-500 hover:text-red-500 underline decoration-red-200">Reset zin</button>}
          </div>
        </div>

        <div className="space-y-6">
            
            {/* Feedback Block */}
            {validationResult && (
               <div className={`p-4 rounded-xl text-center font-bold text-lg animate-in slide-in-from-top-2 duration-300 ${validationResult.isPerfect ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-orange-50 text-orange-800 border border-orange-200'}`}>
                 {validationResult.isPerfect ? "🎉 Perfect! Alles goed verdeeld en benoemd." : `Je hebt ${validationResult.score} van de ${validationResult.total} zinsdelen goed.`}
               </div>
            )}
            
            {hintMessage && !validationResult && (
               <div className="p-4 rounded-xl text-center font-bold text-lg bg-yellow-50 text-yellow-800 border border-yellow-200 animate-in slide-in-from-top-2 duration-300">
                 💡 {hintMessage}
               </div>
            )}

            {showAnswerMode && <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg text-center font-bold">Dit is de juiste oplossing.</div>}

            {/* STEP 1: SPLITTING VIEW */}
            {step === 'split' && currentSentence && (
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center animate-in fade-in duration-300">
                <h2 className="text-xl font-bold text-slate-700 mb-2">Stap 1: Verdelen</h2>
                <p className="text-slate-500 mb-8">Klik tussen de woorden om de zin in zinsdelen te knippen.</p>
                
                <div className="flex flex-wrap items-center justify-center gap-y-6 text-xl md:text-2xl leading-loose select-none py-4">
                  {currentSentence.tokens.map((token, idx) => (
                    <React.Fragment key={token.id}>
                      <span className="px-2 py-2 hover:bg-slate-50 rounded text-slate-800 font-medium transition-colors">{token.text}</span>
                      {idx < currentSentence.tokens.length - 1 && (
                        <div onClick={() => toggleSplit(idx)} className="group relative w-10 h-12 mx-0 cursor-pointer flex items-center justify-center transition-all">
                          <div className={`w-1 h-8 rounded-full transition-all duration-200 ${splitIndices.has(idx) ? 'bg-blue-500 h-10 shadow-[0_0_12px_rgba(59,130,246,0.6)]' : 'bg-slate-200 group-hover:bg-slate-300'}`}></div>
                          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full shadow-md border flex items-center justify-center text-sm transition-all duration-200 pointer-events-none z-10 ${splitIndices.has(idx) ? 'opacity-100 border-blue-500 text-blue-500 scale-100' : 'opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 text-slate-400'}`}>✂️</div>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <div className="mt-12 flex justify-center">
                  <button onClick={handleNextStep} className="group px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 hover:shadow-blue-200 hover:-translate-y-0.5 transition-all flex items-center gap-3">Naar benoemen<span className="group-hover:translate-x-1 transition-transform">→</span></button>
                </div>
              </div>
            )}

            {/* STEP 2: LABELING VIEW */}
            {step === 'label' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 {!showAnswerMode && (
                   <div className="bg-white p-3 md:p-4 -mx-4 md:mx-0 px-4 md:px-4 rounded-b-xl md:rounded-xl shadow-md border-y md:border border-slate-200 sticky top-0 z-[100] transition-all">
                      <div className="flex flex-col gap-2 md:gap-4">
                        <div>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Zinsdelen & Gezegde:</p>
                           <div className="flex flex-wrap gap-2">
                            {ROLES.filter(r => !r.isSubOnly)
                                  .filter(r => (includeVV || focusVV) || r.key !== 'vv')
                                  .filter(r => (includeLV || focusLV) || r.key !== 'lv')
                                  .filter(r => (includeMV || focusMV) || r.key !== 'mv')
                                  .filter(r => r.key !== 'bijzin' || focusBijzin || selectedLevel === 3)
                                  .map(role => (
                              <DraggableRole key={role.key} role={role} onDragStart={handleDragStart} />
                            ))}
                           </div>
                        </div>
                        {includeBB && (
                        <div className="border-t pt-3">
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sleep op specifieke woorden:</p>
                           <div className="flex flex-wrap gap-2">
                            {ROLES.filter(r => r.isSubOnly).map(role => (
                              <DraggableRole key={role.key} role={role} onDragStart={handleDragStart} />
                            ))}
                           </div>
                        </div>
                        )}
                      </div>
                   </div>
                 )}

                 <div className="flex flex-wrap gap-y-6 gap-x-2 justify-center items-start pt-4 px-2">
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
                          />
                          
                          {idx < userChunks.length - 1 && (
                            <div className="flex items-center self-center px-1">
                              <button onClick={() => toggleSplit(mergeIndex)} disabled={showAnswerMode} className="w-6 h-6 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-300 hover:text-blue-500 border border-slate-200 hover:border-blue-300 flex items-center justify-center transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" title="Samenvoegen"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg></button>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                 </div>

                 <div className="flex justify-between items-center bg-slate-100 p-4 rounded-xl border border-slate-200 mt-8">
                    <button onClick={handleBackStep} className="text-slate-500 font-medium hover:text-slate-800 flex items-center gap-2 px-4 py-2 hover:bg-slate-200 rounded-lg transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12"></path></svg>Terug</button>

                    {!showAnswerMode && (
                      <div className="flex gap-2">
                        <button 
                            onClick={handleHint}
                            disabled={!currentSentence}
                            className="px-6 py-3 bg-yellow-400 text-yellow-900 rounded-xl font-bold shadow-lg hover:bg-yellow-500 hover:-translate-y-0.5 transition-all"
                        >
                            Geef Hint
                        </button>
                        <button 
                            onClick={handleCheck}
                            disabled={Object.keys(chunkLabels).length === 0}
                            className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-green-200 hover:-translate-y-0.5 transition-all"
                        >
                            Controleren
                        </button>
                      </div>
                    )}

                    {mode === 'session' && (validationResult || showAnswerMode) && (
                        <button onClick={nextSessionSentence} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center gap-2">Volgende Zin<span>→</span></button>
                    )}
                 </div>
              </div>
            )}
          </div>
      </main>
    </div>
  );
}