const STORAGE_KEY = 'zinsontleding_ladder_v1';

export interface LadderProgress {
  enabled: boolean;
  currentStage: number;    // 1–8
  lastChangedAt: string;   // ISO
  recentScores: { score: number; total: number }[];
}

const DEFAULT_PROGRESS: LadderProgress = {
  enabled: false,
  currentStage: 1,
  lastChangedAt: new Date().toISOString(),
  recentScores: [],
};

function sanitizeCurrentStage(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 1;
  }

  return Math.min(8, Math.max(1, Math.trunc(value)));
}

function sanitizeRecentScores(value: unknown): { score: number; total: number }[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (
      entry,
    ): entry is {
      score: number;
      total: number;
    } =>
      typeof entry === 'object' &&
      entry !== null &&
      'score' in entry &&
      'total' in entry &&
      typeof entry.score === 'number' &&
      Number.isFinite(entry.score) &&
      entry.score >= 0 &&
      typeof entry.total === 'number' &&
      Number.isFinite(entry.total) &&
      entry.total > 0 &&
      entry.score <= entry.total,
  );
}

export function loadLadderProgress(): LadderProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<LadderProgress>;
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : false,
      currentStage: sanitizeCurrentStage(parsed.currentStage),
      lastChangedAt:
        typeof parsed.lastChangedAt === 'string'
          ? parsed.lastChangedAt
          : new Date().toISOString(),
      recentScores: sanitizeRecentScores(parsed.recentScores),
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveLadderProgress(progress: LadderProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // localStorage may be unavailable
  }
}

export function appendLadderScore(score: number, total: number): void {
  const progress = loadLadderProgress();
  const updated = [...progress.recentScores, { score, total }].slice(-20);
  saveLadderProgress({ ...progress, recentScores: updated });
}
