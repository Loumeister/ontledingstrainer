import { useState, useEffect, useMemo } from 'react';
import { ROLES, HINTS } from '../constants';
import { Sentence, PlacementMap, RoleKey, DifficultyLevel } from '../types';
import { useSentences } from './useSentences';
import { getCustomSentences } from '../data/customSentenceStore';
import { recordAttempt, recordShowAnswer } from '../usageData';
import { logInteraction } from '../interactionLog';
import {
  buildUserChunks,
  countRealChunks,
  computeCorrectSplits,
  validateAnswer,
  ChunkData,
  ValidationResult,
} from '../validation';

export type { ChunkData, ValidationResult };
export type AppStep = 'split' | 'label';
export type Mode = 'free' | 'session';
export type PredicateMode = 'ALL' | 'WG' | 'NG';

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
    logInteraction('sentence_start', sentence.id);
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
    logInteraction('session_start', undefined, `count=${count}`);
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
    logInteraction('session_start', undefined, `shared,count=${shuffled.length}`);
    loadSentence(shuffled[0]);
  };

  const nextSessionSentence = () => {
    const nextIndex = sessionIndex + 1;
    if (nextIndex < sessionQueue.length) {
      setSessionIndex(nextIndex);
      loadSentence(sessionQueue[nextIndex]);
    } else {
      logInteraction('session_finish');
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
    logInteraction('split_toggle', currentSentence?.id, `index=${tokenIndex}`);

    const newSplits = new Set(splitIndices);
    if (newSplits.has(tokenIndex)) {
      newSplits.delete(tokenIndex);
    } else {
      newSplits.add(tokenIndex);
    }
    setSplitIndices(newSplits);
  };

  const handleNextStep = () => {
    logInteraction('step_forward', currentSentence?.id);
    setStep('label');
    setValidationResult(null);
    setHintMessage(null);
  };

  const handleBackStep = () => {
    logInteraction('step_back', currentSentence?.id);
    setStep('split');
    setValidationResult(null);
    setHintMessage(null);
  };

  const getUserChunks = (): ChunkData[] => {
    if (!currentSentence) return [];
    return buildUserChunks(currentSentence.tokens, splitIndices);
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
      logInteraction('label_drop', currentSentence?.id, `chunk=${chunkId},role=${roleKey}`);
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
      logInteraction('sub_label_drop', currentSentence?.id, `token=${tokenId},role=${roleKey}`);
      setSubLabels(prev => ({ ...prev, [tokenId]: roleKey }));
      setValidationResult(null);
      setHintMessage(null);
    }
  };

  const removeLabel = (chunkId: string) => {
    if (showAnswerMode) return;
    logInteraction('label_remove', currentSentence?.id, `chunk=${chunkId}`);
    const newLabels = { ...chunkLabels };
    delete newLabels[chunkId];
    setChunkLabels(newLabels);
    setValidationResult(null);
    setHintMessage(null);
  };

  const removeSubLabel = (tokenId: string) => {
    if (showAnswerMode) return;
    logInteraction('sub_label_remove', currentSentence?.id, `token=${tokenId}`);
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
      logInteraction('bijzin_functie_drop', currentSentence?.id, `chunk=${chunkId},role=${roleKey}`);
      setBijzinFunctieLabels(prev => ({ ...prev, [chunkId]: roleKey }));
      setValidationResult(null);
      setHintMessage(null);
    }
  };

  const removeBijzinFunctieLabel = (chunkId: string) => {
    if (showAnswerMode) return;
    logInteraction('bijzin_functie_remove', currentSentence?.id, `chunk=${chunkId}`);
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
    logInteraction('bijvbep_link', currentSentence?.id, `source=${linkingBijvBepId},target=${targetTokenId}`);
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
    logInteraction('bijvbep_unlink', currentSentence?.id, `source=${sourceId}`);
    const newLinks = { ...bijvBepLinks };
    delete newLinks[sourceId];
    setBijvBepLinks(newLinks);
    setValidationResult(null);
    setHintMessage(null);
  };

  const handleHint = () => {
    if (!currentSentence) return;
    logInteraction('hint', currentSentence.id);

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
    logInteraction('check', currentSentence.id);

    const { result: vResult, mistakes: currentMistakes } = validateAnswer(
      currentSentence, splitIndices, chunkLabels, subLabels, includeBB,
      bijzinFunctieLabels, bijvBepLinks
    );

    setValidationResult(vResult);

    // Log individual errors for diagnostics
    for (const [idx, status] of Object.entries(vResult.chunkStatus)) {
      if (status === 'incorrect-split') {
        logInteraction('error_split', currentSentence.id, `chunk=${idx}`);
      } else if (status === 'incorrect-role') {
        const feedback = vResult.chunkFeedback[Number(idx)] || '';
        logInteraction('error_role', currentSentence.id, `chunk=${idx},feedback=${feedback}`);
      }
    }
    for (const idx of vResult.bijzinWarningChunks) {
      logInteraction('error_bijzin_functie', currentSentence.id, `chunk=${idx}`);
    }

    const realChunkCount = countRealChunks(currentSentence.tokens);

    // Guard: only update stats and record usage on the FIRST check per sentence.
    // Prevents double-counting when the student clicks Controleer multiple times.
    if (!validationResult) {
      if (mode === 'session') {
        const newTotal = sessionStats.total + realChunkCount;
        const newCorrect = sessionStats.correct + vResult.score;
        setSessionStats({ correct: newCorrect, total: newTotal });
        const newMistakeStats = { ...mistakeStats };
        Object.entries(currentMistakes).forEach(([role, count]) => {
           newMistakeStats[role] = (newMistakeStats[role] || 0) + count;
        });
        setMistakeStats(newMistakeStats);
      }
      const splitErrorCount = Object.values(vResult.chunkStatus).filter(s => s === 'incorrect-split').length;
      recordAttempt(currentSentence.id, vResult.isPerfect, currentMistakes, splitErrorCount);
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
    logInteraction('show_answer', currentSentence.id);
    setHintMessage(null);
    const correctSplits = computeCorrectSplits(currentSentence.tokens);
    setSplitIndices(correctSplits);
    setStep('label');

    const correctChunkLabels: PlacementMap = {};
    const correctSubLabels: PlacementMap = {};
    const correctBijzinFunctieLabels: PlacementMap = {};
    const correctBijvBepLinks: Record<string, string> = {};
    let currentChunkStartId = currentSentence.tokens[0].id;
    correctChunkLabels[currentChunkStartId] = currentSentence.tokens[0].role;
    if (currentSentence.tokens[0].bijzinFunctie) {
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
      const realChunkCount = countRealChunks(currentSentence.tokens);
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
    logInteraction('abort', currentSentence?.id);
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
