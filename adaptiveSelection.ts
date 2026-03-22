/**
 * Adaptive sentence selection: calculates per-role confidence scores from
 * historical performance data and uses weighted random sampling to prioritise
 * sentences that contain roles the student struggles with.
 *
 * Design: ~35% of the weight is random so selection is never fully
 * deterministic ("in enige mate, maar niet volledig adaptief").
 */

import { Sentence, RoleKey, SentenceUsageData } from './types';
import { loadSessionHistory } from './sessionHistory';
import { loadUsageData } from './usageData';
import { ROLES } from './constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoleConfidence {
  role: RoleKey;
  confidence: number;   // 0.0 (weak) – 1.0 (strong)
  totalEncounters: number;
  recentErrors: number;
}

// ---------------------------------------------------------------------------
// Role-confidence calculation
// ---------------------------------------------------------------------------

const CONFIDENCE_STORAGE_KEY = 'zinsontleding_role_confidence_v1';

/**
 * Compute a confidence score per role based on recent session history.
 *
 * Uses the `mistakeStats` from the last N sessions (default: all available,
 * capped at 20 by sessionHistory). For each role we count how often it
 * appeared in a session and how many errors were recorded.
 */
export function computeRoleConfidences(): Map<RoleKey, RoleConfidence> {
  const history = loadSessionHistory();
  const allRoleKeys = ROLES.map(r => r.key);

  // Aggregate: per role how many sessions contained it, how many errors total
  const encounters: Record<string, number> = {};
  const errors: Record<string, number> = {};

  for (const session of history) {
    // Every session implicitly "encounters" the core roles (PV, OW at least).
    // We count a role as encountered if either (a) it had errors or (b) it was
    // part of a session where at least some scoring happened. Since we don't
    // store per-role correct counts, we approximate: every role that exists in
    // mistakeStats OR was likely present (we count all roles per session, since
    // the student practiced a mix of sentences).
    //
    // Better heuristic: count per role how many sessions had mistakes, and use
    // total sessions as the denominator.
    for (const roleKey of allRoleKeys) {
      const roleLabel = ROLES.find(r => r.key === roleKey)?.label ?? roleKey;
      encounters[roleKey] = (encounters[roleKey] ?? 0) + 1;
      const errCount = session.mistakeStats[roleLabel] ?? 0;
      if (errCount > 0) {
        errors[roleKey] = (errors[roleKey] ?? 0) + errCount;
      }
    }
  }

  const result = new Map<RoleKey, RoleConfidence>();

  for (const roleKey of allRoleKeys) {
    const totalEnc = encounters[roleKey] ?? 0;
    const totalErr = errors[roleKey] ?? 0;

    let confidence: number;
    if (totalEnc === 0) {
      // Never encountered → neutral
      confidence = 0.5;
    } else {
      // Simple ratio: fraction of sessions without errors for this role.
      // Each session adds 1 encounter; each error-session can add multiple
      // errors, so we cap the ratio.
      confidence = Math.max(0.1, Math.min(1.0, 1 - (totalErr / (totalEnc * 2))));
    }

    result.set(roleKey, {
      role: roleKey,
      confidence,
      totalEncounters: totalEnc,
      recentErrors: totalErr,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

export function saveRoleConfidences(confidences: Map<RoleKey, RoleConfidence>): void {
  try {
    const obj: Record<string, RoleConfidence> = {};
    confidences.forEach((v, k) => { obj[k] = v; });
    localStorage.setItem(CONFIDENCE_STORAGE_KEY, JSON.stringify(obj));
  } catch { /* ignore */ }
}

export function loadRoleConfidences(): Map<RoleKey, RoleConfidence> | null {
  try {
    const raw = localStorage.getItem(CONFIDENCE_STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as Record<string, RoleConfidence>;
    const map = new Map<RoleKey, RoleConfidence>();
    for (const [k, v] of Object.entries(obj)) {
      map.set(k as RoleKey, v);
    }
    return map;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Weighted sentence selection
// ---------------------------------------------------------------------------

/** Weight configuration – tuneable constants */
const ROLE_WEIGHT_FACTOR = 0.35;      // How much "weak roles" matter
const FRESHNESS_WEIGHT_FACTOR = 0.15; // How much "not recently seen" matters
const ERROR_WEIGHT_FACTOR = 0.15;     // How much "previously failed" matters
const RANDOM_WEIGHT_FACTOR = 0.35;    // Random component for variety

/**
 * Select `count` sentences from `pool` using adaptive weighted sampling.
 *
 * Each sentence receives a priority score composed of:
 * 1. Role weight – sum of (1 - confidence) for each role present
 * 2. Freshness – bonus for sentences not recently attempted
 * 3. Error history – bonus for sentences with low perfect ratio
 * 4. Random noise – ensures variety
 */
export function selectAdaptiveQueue(
  pool: Sentence[],
  count: number,
  roleConfidences: Map<RoleKey, RoleConfidence>,
): Sentence[] {
  if (pool.length === 0) return [];
  const n = Math.min(count, pool.length);

  const usageStore = loadUsageData();
  const now = Date.now();

  // Compute raw scores
  const scored = pool.map(sentence => {
    const score = computeSentenceScore(sentence, roleConfidences, usageStore, now);
    return { sentence, score };
  });

  // Weighted random sampling without replacement
  const selected: Sentence[] = [];
  const remaining = [...scored];

  for (let i = 0; i < n; i++) {
    const totalWeight = remaining.reduce((sum, item) => sum + item.score, 0);
    if (totalWeight <= 0) {
      // Fallback: pick randomly from remaining
      const idx = Math.floor(Math.random() * remaining.length);
      selected.push(remaining[idx].sentence);
      remaining.splice(idx, 1);
      continue;
    }

    let r = Math.random() * totalWeight;
    let picked = remaining.length - 1;
    for (let j = 0; j < remaining.length; j++) {
      r -= remaining[j].score;
      if (r <= 0) {
        picked = j;
        break;
      }
    }

    selected.push(remaining[picked].sentence);
    remaining.splice(picked, 1);
  }

  // Shuffle selected sentences so the order is not score-based
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  return selected;
}

/**
 * Compute a single sentence's priority score.
 * All sub-scores are normalised to [0, 1] before weighting.
 */
export function computeSentenceScore(
  sentence: Sentence,
  roleConfidences: Map<RoleKey, RoleConfidence>,
  usageStore: Record<number, SentenceUsageData>,
  now: number,
): number {
  // 1. Role weight: average (1 - confidence) across roles in this sentence
  const rolesInSentence = new Set(sentence.tokens.map(t => t.role));
  let roleScore = 0;
  let roleCount = 0;
  for (const role of rolesInSentence) {
    const conf = roleConfidences.get(role);
    roleScore += 1 - (conf?.confidence ?? 0.5);
    roleCount++;
  }
  const avgRoleScore = roleCount > 0 ? roleScore / roleCount : 0.5;

  // 2. Freshness: days since last attempt (capped at 30 days = score 1.0)
  const usage = usageStore[sentence.id];
  let freshnessScore = 1.0; // never attempted = maximum freshness
  if (usage?.lastAttempted) {
    const daysSince = (now - new Date(usage.lastAttempted).getTime()) / (1000 * 60 * 60 * 24);
    freshnessScore = Math.min(1.0, daysSince / 30);
  }

  // 3. Error history: low perfect ratio = higher score
  let errorScore = 0.5; // default for unattempted sentences
  if (usage && usage.attempts > 0) {
    const perfectRatio = usage.perfectCount / usage.attempts;
    errorScore = 1 - perfectRatio; // 0 = always perfect, 1 = never perfect
  }

  // 4. Random noise
  const randomScore = Math.random();

  // Weighted sum (all components are [0, 1])
  const total =
    avgRoleScore * ROLE_WEIGHT_FACTOR +
    freshnessScore * FRESHNESS_WEIGHT_FACTOR +
    errorScore * ERROR_WEIGHT_FACTOR +
    randomScore * RANDOM_WEIGHT_FACTOR;

  // Ensure non-negative (floor at a small positive value so every sentence has a chance)
  return Math.max(0.01, total);
}
