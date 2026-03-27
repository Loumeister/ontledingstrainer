import type { FeedbackEntry } from '../types';

const STORAGE_KEY = 'feedbackOverrides';

export type FeedbackOverrides = Record<string, Record<string, FeedbackEntry>>;

export function getFeedbackOverrides(): FeedbackOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setFeedbackOverride(
  sourceRole: string,
  targetRole: string,
  value: FeedbackEntry,
): void {
  const overrides = getFeedbackOverrides();
  if (!overrides[sourceRole]) overrides[sourceRole] = {};
  overrides[sourceRole][targetRole] = value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

export function resetFeedbackOverride(sourceRole: string, targetRole: string): void {
  const overrides = getFeedbackOverrides();
  if (overrides[sourceRole]) {
    delete overrides[sourceRole][targetRole];
    if (Object.keys(overrides[sourceRole]).length === 0) {
      delete overrides[sourceRole];
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

export function clearAllFeedbackOverrides(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportFeedbackOverrides(): string {
  return JSON.stringify(getFeedbackOverrides(), null, 2);
}
