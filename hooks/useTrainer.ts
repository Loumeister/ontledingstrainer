import { useState, useEffect, useMemo } from 'react';
import { ROLES, FEEDBACK_MATRIX, FEEDBACK_STRUCTURE, FEEDBACK_SWAP, FEEDBACK_BIJZIN_FUNCTIE, HINTS } from '../constants';
import { Sentence, PlacementMap, RoleKey, Token, DifficultyLevel, ValidationState } from '../types';
import { useSentences } from './useSentences';
import { getCustomSentences } from '../data/customSentenceStore';
import { recordAttempt, recordShowAnswer } from '../usageData';

export type AppStep = 'split' | 'label';
export type Mode = 'free' | 'session';
export type PredicateMode = 'ALL' | 'WG' | 'NG';

export interface ChunkData {
  tokens: Token[];
  originalIndices: number[];
}

export interface ValidationResult {
  score: number;
  total: number;
  chunkStatus: Record<number, ValidationState>;
  chunkFeedback: Record<number, string>;
  isPerfect: boolean;
}

export interface TrainerState {
  // Config
  predicateMode: PredicateMode;
  setPredicateMode: (mode: PredicateMode) => void;
  selectedLevel: DifficultyLevel | null;
  setSelectedLevel: (level: DifficultyLevel | null) => void;
  customSessionCount: number;
  setCustomSessionCount: (count: number) => void;

  // Focus filters
  focusLV: boolean;
  setFocusLV: (v: boolean) => void;
  focusMV: boolean;
  setFocusMV: (v: boolean) => void;
  focusVV: boolean;
  setFocusVV: (v: boolean) => void;
  focusBijzin: boolean;
  setFocusBijzin: (v: boolean) => void;

  // Complexity filters
  includeBijst: boolean;
  setIncludeBijst: (v: boolean) => void;
  includeBB: boolean;
  setIncludeBB: (v: boolean) => void;
  includeVV: boolean;

  // Session
  mode: Mode;
  sessionQueue: Sentence[];
  sessionIndex: number;
  sessionStats: { correct: number; total: number };
  mistakeStats: Record<string, number>;
  isSessionFinished: boolean;

  // Trainer
  currentSentence: Sentence | null;
  step: AppStep;
  splitIndices: Set<number>;
  chunkLabels: PlacementMap;
  subLabels: PlacementMap;
  bijzinFunctieLabels: PlacementMap;
  bijvBepLinks: Record<string, string>; // sourceId -> targetTokenId (for bvb reference tracking)
  linkingBijvBepId: string | null; // chunk/token ID currently in "linking mode"
  validationResult: ValidationResult | null;
  showAnswerMode: boolean;
  hintMessage: string | null;
  confirmAction: 'answer' | 'abort' | null;
  setConfirmAction: (action: 'answer' | 'abort' | null) => void;

  // UI
  showHelp: boolean;
  setShowHelp: (v: boolean) => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  largeFont: boolean;
  setLargeFont: (v: boolean) => void;

  // Loading
  isLoadingSentences: boolean;
  sentenceLoadError: string | null;

  // Derived
  userChunks: ChunkData[];
  availableSentences: Sentence[];

  // Actions
  refreshCustomSentences: () => void;
  startSession: () => void;
  startSharedSession: (sentences: Sentence[]) => void;
  nextSessionSentence: () => void;
  handleSentenceSelect: (sentenceId: number) => void;
  toggleSplit: (tokenIndex: number) => void;
  handleNextStep: () => void;
  handleBackStep: () => void;
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, roleKey: string) => void;
  handleDropChunk: (e: React.DragEvent<HTMLDivElement>, chunkId: string) => void;
  handleDropWord: (e: React.DragEvent<HTMLSpanElement>, tokenId: string) => void;
  removeLabel: (chunkId: string) => void;
  removeSubLabel: (tokenId: string) => void;
  handleDropBijzinFunctie: (e: React.DragEvent<HTMLDivElement>, chunkId: string) => void;
  removeBijzinFunctieLabel: (chunkId: string) => void;
  startBijvBepLinking: (sourceId: string) => void;
  completeBijvBepLink: (targetTokenId: string) => void;
  cancelBijvBepLinking: () => void;
  removeBijvBepLink: (sourceId: string) => void;
  handleHint: () => void;
  handleCheck: () => void;
  handleShowAnswerRequest: () => void;
  handleAbortRequest: () => void;
  handleConfirmAction: () => void;
  resetToHome: () => void;
}

export function useTrainer(): TrainerState {
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

  // Level & Count
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel | null>(null);
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
  const [bijzinFunctieLabels, setBijzinFunctieLabels] = useState<PlacementMap>({});
  const [bijvBepLinks, setBijvBepLinks] = useState<Record<string, string>>({});
  const [linkingBijvBepId, setLinkingBijvBepId] = useState<string | null>(null);

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showAnswerMode, setShowAnswerMode] = useState(false);
  const [hintMessage, setHintMessage] = useState<string | null>(null);

  // --- Sentence loading ---
  const { sentences: builtInSentences, isLoading: isLoadingSentences, error: sentenceLoadError, findSentenceById } = useSentences(selectedLevel);
  const [customSentences, setCustomSentences] = useState<Sentence[]>(getCustomSentences());

  const refreshCustomSentences = () => {
    setCustomSentences(getCustomSentences());
  };

  const allSentences = useMemo(() => {
    const custom = selectedLevel !== null
      ? customSentences.filter(s => s.level === selectedLevel)
      : customSentences;
    return [...builtInSentences, ...custom];
  }, [builtInSentences, customSentences, selectedLevel]);

  // --- Effects ---
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // --- Logic ---

  const getFilteredSentences = (): Sentence[] => {
    return allSentences.filter(s => {
      const isCompound = s.level === 4;
      const explicitlySelectedCompoundLevel = selectedLevel === 4;
      if (isCompound && !focusBijzin && !explicitlySelectedCompoundLevel) return false;

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
      }

      return true;
    });
  };

  const loadSentence = (sentence: Sentence) => {
    setCurrentSentence(sentence);
    setStep('split');
    setSplitIndices(new Set());
    setChunkLabels({});
    setSubLabels({});
    setBijzinFunctieLabels({});
    setBijvBepLinks({});
    setLinkingBijvBepId(null);
    setValidationResult(null);
    setShowAnswerMode(false);
    setHintMessage(null);
    setConfirmAction(null);
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

  const startSharedSession = (sentences: Sentence[]) => {
    if (sentences.length === 0) return;
    const shuffled = [...sentences].sort(() => 0.5 - Math.random());
    setSessionQueue(shuffled);
    setSessionIndex(0);
    setSessionStats({ correct: 0, total: 0 });
    setMistakeStats({});
    setIsSessionFinished(false);
    setMode('session');
    loadSentence(shuffled[0]);
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

  const handleSentenceSelect = async (sentenceId: number) => {
    if (sentenceId === -1) {
        setCurrentSentence(null);
        return;
    }
    // Check custom sentences first, then built-in
    const fromCustom = customSentences.find(s => s.id === sentenceId);
    if (fromCustom) {
      setMode('free');
      loadSentence(fromCustom);
      return;
    }
    const selected = await findSentenceById(sentenceId);
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

  const handleDropBijzinFunctie = (e: React.DragEvent<HTMLDivElement>, chunkId: string) => {
    e.preventDefault();
    if (showAnswerMode) return;
    const roleKey = e.dataTransfer.getData("text/role") as RoleKey;
    if (roleKey) {
      setBijzinFunctieLabels(prev => ({ ...prev, [chunkId]: roleKey }));
      setValidationResult(null);
      setHintMessage(null);
    }
  };

  const removeBijzinFunctieLabel = (chunkId: string) => {
    if (showAnswerMode) return;
    const newLabels = { ...bijzinFunctieLabels };
    delete newLabels[chunkId];
    setBijzinFunctieLabels(newLabels);
    // Also remove any bvb link for this chunk
    const newLinks = { ...bijvBepLinks };
    delete newLinks[chunkId];
    setBijvBepLinks(newLinks);
    setValidationResult(null);
    setHintMessage(null);
  };

  const startBijvBepLinking = (sourceId: string) => {
    if (showAnswerMode) return;
    setLinkingBijvBepId(sourceId);
  };

  const completeBijvBepLink = (targetTokenId: string) => {
    if (!linkingBijvBepId) return;
    setBijvBepLinks(prev => ({ ...prev, [linkingBijvBepId]: targetTokenId }));
    setLinkingBijvBepId(null);
    setValidationResult(null);
    setHintMessage(null);
  };

  const cancelBijvBepLinking = () => {
    setLinkingBijvBepId(null);
  };

  const removeBijvBepLink = (sourceId: string) => {
    if (showAnswerMode) return;
    const newLinks = { ...bijvBepLinks };
    delete newLinks[sourceId];
    setBijvBepLinks(newLinks);
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

    // Check for missing bijzin function labels
    const userChunks = getUserChunks();
    for (const chunk of userChunks) {
      const firstToken = chunk.tokens[0];
      const userLabel = chunkLabels[firstToken.id];
      const functie = firstToken.bijzinFunctie;
      // Skip bijv_bep function requirement when includeBB is off
      if (functie === 'bijv_bep' && !includeBB) continue;
      if (userLabel === 'bijzin' && functie && !bijzinFunctieLabels[firstToken.id]) {
        setHintMessage(HINTS.MISSING_BIJZIN_FUNCTIE);
        return;
      }
    }

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
        currentMistakes['Verdeling'] = (currentMistakes['Verdeling'] || 0) + 1;
      } else {
        const userLabel = chunkLabels[firstTokenId];
        if (userLabel === firstTokenRole) {
          chunkStatus[idx] = 'correct';
          correctChunksCount++;
        } else {
          const correctRoleName = ROLES.find(r => r.key === firstTokenRole)?.label || firstTokenRole;
          if (firstTokenRole === 'pv' && userLabel === 'wg') {
             chunkStatus[idx] = 'warning';
             chunkFeedback[idx] = FEEDBACK_MATRIX['wg'] && FEEDBACK_MATRIX['wg']['pv'] ? FEEDBACK_MATRIX['wg']['pv'] : "Dit hoort bij het gezegde.";
             currentMistakes[correctRoleName] = (currentMistakes[correctRoleName] || 0) + 1;
          } else {
             chunkStatus[idx] = 'incorrect-role';
             if (userLabel && FEEDBACK_MATRIX[userLabel] && FEEDBACK_MATRIX[userLabel][firstTokenRole]) {
                 chunkFeedback[idx] = FEEDBACK_MATRIX[userLabel][firstTokenRole];
             } else {
                 const userRoleName = ROLES.find(r => r.key === userLabel)?.label || "Gekozen";
                 chunkFeedback[idx] = `Dit is niet ${userRoleName}, maar het ${correctRoleName}.`;
             }
             currentMistakes[correctRoleName] = (currentMistakes[correctRoleName] || 0) + 1;
          }
        }
      }
    });

    // --- Bijzin double-role detection: when a student labels a bijzin chunk with its function ---
    // E.g. they put "LV" on a chunk that should be "Bijzin" (with function LV).
    // This is a UI/UX confusion, not a grammatical error, so give specific guidance.
    userChunks.forEach((chunk, idx) => {
      if (chunkStatus[idx] !== 'incorrect-role') return;
      const firstToken = chunk.tokens[0];
      const expectedFunctie = firstToken.bijzinFunctie;
      if (firstToken.role !== 'bijzin' || !expectedFunctie) return;
      // Skip bijv_bep function swap detection when includeBB is off
      if (expectedFunctie === 'bijv_bep' && !includeBB) return;
      const userLabel = chunkLabels[firstToken.id];
      if (userLabel === expectedFunctie) {
        // Student labeled with the function (e.g. LV) instead of "Bijzin"
        const functieName = ROLES.find(r => r.key === expectedFunctie)?.label || expectedFunctie;
        chunkFeedback[idx] = FEEDBACK_SWAP.BIJZIN_HAS_FUNCTIE(functieName);
        chunkStatus[idx] = 'warning';
      }
    });

    // --- Bijzin function validation ---
    let bijzinFunctieMismatch = false;
    let bijvBepLinkMismatch = false;
    userChunks.forEach((chunk, idx) => {
      const firstToken = chunk.tokens[0];
      const expectedFunctie = firstToken.bijzinFunctie;
      if (!expectedFunctie) return; // No bijzin function expected for this chunk
      // Skip bijv_bep function validation when includeBB is off
      if (expectedFunctie === 'bijv_bep' && !includeBB) return;
      const userLabel = chunkLabels[firstToken.id];
      if (userLabel !== 'bijzin') return; // Only validate when chunk is correctly labeled as bijzin
      if (chunkStatus[idx] !== 'correct') return; // Only validate bijzin function when chunk is otherwise correct

      const userFunctie = bijzinFunctieLabels[firstToken.id];
      if (userFunctie === expectedFunctie) {
        // Both bijzin label and function are correct
        // For bijv_bep, also validate the target link
        if (expectedFunctie === 'bijv_bep' && firstToken.bijvBepTarget) {
          const userTarget = bijvBepLinks[firstToken.id];
          if (userTarget !== firstToken.bijvBepTarget) {
            bijvBepLinkMismatch = true;
            if (!userTarget) {
              chunkFeedback[idx] = "Goed! Wijs nu het woord aan waar deze bijzin bij hoort.";
              chunkStatus[idx] = 'warning';
            } else {
              const expectedTarget = currentSentence.tokens.find(t => t.id === firstToken.bijvBepTarget);
              chunkFeedback[idx] = `De bijzin hoort bij '${expectedTarget?.text || '?'}', niet het woord dat je hebt gekozen.`;
              chunkStatus[idx] = 'warning';
            }
          }
        }
      } else {
        bijzinFunctieMismatch = true;
        if (!userFunctie) {
          chunkFeedback[idx] = FEEDBACK_BIJZIN_FUNCTIE.MISSING;
          chunkStatus[idx] = 'warning';
        } else {
          const expectedFunctieName = ROLES.find(r => r.key === expectedFunctie)?.label || expectedFunctie;
          chunkFeedback[idx] = FEEDBACK_BIJZIN_FUNCTIE.WRONG(expectedFunctieName);
          chunkStatus[idx] = 'warning';
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
    const reallyPerfect = isSplitPerfect && userChunks.length === realChunkCount && !subRoleMismatch && !bijzinFunctieMismatch && !bijvBepLinkMismatch;

    setValidationResult({
      score: correctChunksCount,
      total: userChunks.length,
      chunkStatus,
      chunkFeedback,
      isPerfect: reallyPerfect
    });

    // Guard: only update stats and record usage on the FIRST check per sentence.
    // Prevents double-counting when the student clicks Controleer multiple times.
    if (!validationResult) {
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
      const splitErrorCount = Object.values(chunkStatus).filter(s => s === 'incorrect-split').length;
      recordAttempt(currentSentence.id, reallyPerfect, currentMistakes, splitErrorCount);
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
    const correctBijzinFunctieLabels: PlacementMap = {};
    const correctBijvBepLinks: Record<string, string> = {};
    let currentChunkStartId = currentSentence.tokens[0].id;
    correctChunkLabels[currentChunkStartId] = currentSentence.tokens[0].role;
    if (currentSentence.tokens[0].bijzinFunctie) {
      // Skip bijv_bep function when includeBB is off
      if (currentSentence.tokens[0].bijzinFunctie !== 'bijv_bep' || includeBB) {
        correctBijzinFunctieLabels[currentChunkStartId] = currentSentence.tokens[0].bijzinFunctie;
        if (currentSentence.tokens[0].bijvBepTarget) {
          correctBijvBepLinks[currentChunkStartId] = currentSentence.tokens[0].bijvBepTarget;
        }
      }
    }

    currentSentence.tokens.forEach((t, i) => {
      if (t.subRole) {
        if (t.subRole === 'bijv_bep' && !includeBB) { /* skip */ }
        else { correctSubLabels[t.id] = t.subRole; }
      }
      if (correctSplits.has(i - 1)) {
         currentChunkStartId = t.id;
         correctChunkLabels[currentChunkStartId] = t.role;
         if (t.bijzinFunctie) {
           // Skip bijv_bep function when includeBB is off
           if (t.bijzinFunctie !== 'bijv_bep' || includeBB) {
             correctBijzinFunctieLabels[currentChunkStartId] = t.bijzinFunctie;
             if (t.bijvBepTarget) {
               correctBijvBepLinks[currentChunkStartId] = t.bijvBepTarget;
             }
           }
         }
      }
    });

    if (!validationResult) {
      let realChunkCount = 0;
      currentSentence.tokens.forEach((t, i) => {
          if (i === 0 || t.role !== currentSentence.tokens[i-1].role || t.newChunk) realChunkCount++;
      });
      if (mode === 'session') {
        setSessionStats(prev => ({ correct: prev.correct, total: prev.total + realChunkCount }));
      }
      recordShowAnswer(currentSentence.id);
    }

    setChunkLabels(correctChunkLabels);
    setSubLabels(correctSubLabels);
    setBijzinFunctieLabels(correctBijzinFunctieLabels);
    setBijvBepLinks(correctBijvBepLinks);
    setLinkingBijvBepId(null);
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

  return {
    // Config
    predicateMode, setPredicateMode,
    selectedLevel, setSelectedLevel,
    customSessionCount, setCustomSessionCount,

    // Focus filters
    focusLV, setFocusLV,
    focusMV, setFocusMV,
    focusVV, setFocusVV,
    focusBijzin, setFocusBijzin,

    // Complexity filters
    includeBijst, setIncludeBijst,
    includeBB, setIncludeBB,
    includeVV,

    // Session
    mode,
    sessionQueue, sessionIndex,
    sessionStats, mistakeStats,
    isSessionFinished,

    // Trainer
    currentSentence, step,
    splitIndices, chunkLabels, subLabels, bijzinFunctieLabels,
    bijvBepLinks, linkingBijvBepId,
    validationResult, showAnswerMode,
    hintMessage, confirmAction, setConfirmAction,

    // Loading
    isLoadingSentences, sentenceLoadError,

    // UI
    showHelp, setShowHelp,
    darkMode, setDarkMode,
    largeFont, setLargeFont,

    // Derived
    userChunks, availableSentences,

    // Actions
    refreshCustomSentences,
    startSession, startSharedSession, nextSessionSentence,
    handleSentenceSelect, toggleSplit,
    handleNextStep, handleBackStep,
    handleDragStart, handleDropChunk, handleDropWord,
    removeLabel, removeSubLabel,
    handleDropBijzinFunctie, removeBijzinFunctieLabel,
    startBijvBepLinking, completeBijvBepLink, cancelBijvBepLinking, removeBijvBepLink,
    handleHint, handleCheck,
    handleShowAnswerRequest, handleAbortRequest,
    handleConfirmAction, resetToHome,
  };
}
