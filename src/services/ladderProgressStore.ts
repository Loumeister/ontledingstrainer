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

export function loadLadderProgress(): LadderProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<LadderProgress>;
    return {
      enabled: parsed.enabled ?? false,
      currentStage: parsed.currentStage ?? 1,
      lastChangedAt: parsed.lastChangedAt ?? new Date().toISOString(),
      recentScores: parsed.recentScores ?? [],
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
