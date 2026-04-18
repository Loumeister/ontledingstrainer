import { ROLES } from '../constants';
import { RoleKey, DifficultyLevel, Sentence } from '../types';
import { getConsistentRole, ChunkData, ValidationResult } from './validation';

export interface LadderStage {
  id: number;
  name: string;
  question: string;
  activeRoles: RoleKey[];
  maxSentenceLevel: DifficultyLevel;
}

export const LADDER_STAGES: LadderStage[] = [
  {
    id: 1,
    name: 'Persoonsvorm vinden',
    question: 'Welk woord verandert als je de zin in een andere tijd zet? (tijdsproef)',
    activeRoles: ['pv'],
    maxSentenceLevel: 0,
  },
  {
    id: 2,
    name: 'Onderwerp vinden',
    question: 'Wie of wat + persoonsvorm?',
    activeRoles: ['pv', 'ow'],
    maxSentenceLevel: 0,
  },
  {
    id: 3,
    name: 'Alle werkwoorden vinden',
    question: 'Zijn er meer werkwoorden? Groepeer ze in stap 1.',
    activeRoles: ['pv', 'ow'],
    maxSentenceLevel: 1,
  },
  {
    id: 4,
    name: 'WG of NG bepalen',
    question: 'Is het gezegde werkwoordelijk (WG) of naamwoordelijk (NG)?',
    activeRoles: ['pv', 'ow', 'wg', 'ng'],
    maxSentenceLevel: 1,
  },
  {
    id: 5,
    name: 'Lijdend voorwerp / Naamwoordelijk deel',
    question: 'WG: wie of wat + gezegde (+ OW)? | NG: wat is het naamwoordelijk deel?',
    activeRoles: ['pv', 'ow', 'wg', 'ng', 'lv'],
    maxSentenceLevel: 2,
  },
  {
    id: 6,
    name: 'Meewerkend voorwerp',
    question: 'Aan of voor wie + gezegde (+ OW + LV)?',
    activeRoles: ['pv', 'ow', 'wg', 'ng', 'lv', 'mv'],
    maxSentenceLevel: 2,
  },
  {
    id: 7,
    name: 'Bijwoordelijke bepaling',
    question: 'Waar, wanneer, hoe of waarom + gezegde?',
    activeRoles: ['pv', 'ow', 'wg', 'ng', 'lv', 'mv', 'bwb'],
    maxSentenceLevel: 3,
  },
  {
    id: 8,
    name: 'Samengestelde zinnen',
    question: 'Wat is de functie van de bijzin (bijzinlabel)?',
    activeRoles: ['pv', 'ow', 'wg', 'ng', 'lv', 'mv', 'bwb', 'vv', 'bijst', 'bijzin', 'vw_neven'],
    maxSentenceLevel: 4,
  },
];

export function getLadderStage(id: number): LadderStage | undefined {
  return LADDER_STAGES.find(s => s.id === id);
}

export function isRoleActiveInStage(role: RoleKey, stageId: number): boolean {
  const stage = getLadderStage(stageId);
  if (!stage) return true;
  return stage.activeRoles.includes(role);
}

export function getLadderSentenceFilter(stageId: number): (s: Sentence) => boolean {
  const stage = getLadderStage(stageId);
  if (!stage) return () => true;
  return (s: Sentence) => {
    if (s.level > stage.maxSentenceLevel) return false;
    if (stageId < 8 && s.tokens.some(t => t.role === 'bijzin' || t.role === 'vw_neven')) return false;
    return true;
  };
}

export interface PromotionResult {
  shouldPromote: boolean;
  shouldSuggestDemote: boolean;
  windowScore: number;
  windowSize: number;
}

export function computeLadderPromotion(
  recentScores: { score: number; total: number }[],
  promotionThreshold = 0.8,
  promotionWindow = 10,
  demoteThreshold = 0.5,
  demoteWindow = 5,
): PromotionResult {
  if (recentScores.length === 0) {
    return { shouldPromote: false, shouldSuggestDemote: false, windowScore: 0, windowSize: 0 };
  }

  const promoteWindow = recentScores.slice(-promotionWindow);
  const promoteTotal = promoteWindow.reduce((sum, s) => sum + s.total, 0);
  const promoteCorrect = promoteWindow.reduce((sum, s) => sum + s.score, 0);
  const windowScore = promoteTotal > 0 ? promoteCorrect / promoteTotal : 0;
  const windowSize = promoteWindow.length;
  const hasFullPromoteWindow = windowSize >= promotionWindow;
  const shouldPromote = hasFullPromoteWindow && windowScore >= promotionThreshold;

  const demWindow = recentScores.slice(-demoteWindow);
  const demTotal = demWindow.reduce((sum, s) => sum + s.total, 0);
  const demCorrect = demWindow.reduce((sum, s) => sum + s.score, 0);
  const demScore = demTotal > 0 ? demCorrect / demTotal : 0;
  const hasFullDemoteWindow = demWindow.length >= demoteWindow;
  const shouldSuggestDemote = hasFullDemoteWindow && !shouldPromote && demScore < demoteThreshold;

  return { shouldPromote, shouldSuggestDemote, windowScore, windowSize };
}

export function filterValidationForStage(
  result: ValidationResult,
  mistakes: Record<string, number>,
  stageId: number,
  chunks: ChunkData[],
): { result: ValidationResult; mistakes: Record<string, number> } {
  const stage = getLadderStage(stageId);
  if (!stage) return { result, mistakes };

  const activeSet = new Set<RoleKey>(stage.activeRoles);
  const newChunkStatus = { ...result.chunkStatus };
  let newScore = 0;
  let newTotal = 0;

  chunks.forEach((chunk, idx) => {
    const effectiveRole = getConsistentRole(chunk.tokens) ?? chunk.tokens[0].role;
    if (!activeSet.has(effectiveRole)) {
      newChunkStatus[idx] = 'correct';
    } else {
      newTotal++;
      if (newChunkStatus[idx] === 'correct') newScore++;
    }
  });

  const newIsPerfect = newTotal > 0
    ? Object.entries(newChunkStatus).every(([idxStr, status]) => {
        const idx = Number(idxStr);
        const chunk = chunks[idx];
        if (!chunk) return true;
        const effectiveRole = getConsistentRole(chunk.tokens) ?? chunk.tokens[0].role;
        return !activeSet.has(effectiveRole) || status === 'correct';
      })
    : result.isPerfect;

  // Filter mistakes to active-stage roles only (by matching role key via ROLES label)
  const activeLabels = new Set(
    ROLES.filter(r => activeSet.has(r.key)).map(r => r.label)
  );
  const activeKeys = new Set(stage.activeRoles.map(k => k as string));
  const filteredMistakes: Record<string, number> = {};
  for (const [key, count] of Object.entries(mistakes)) {
    if (activeLabels.has(key) || activeKeys.has(key)) {
      filteredMistakes[key] = count;
    }
  }

  return {
    result: {
      ...result,
      chunkStatus: newChunkStatus,
      score: newScore,
      total: newTotal,
      isPerfect: newIsPerfect,
      bijzinWarningChunks: result.bijzinWarningChunks,
    },
    mistakes: filteredMistakes,
  };
}
