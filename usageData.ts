import { SentenceUsageData } from './types';

const STORAGE_KEY = 'zinsontleding_usage_v1';

type UsageStore = Record<number, SentenceUsageData>;

export function loadUsageData(): UsageStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveUsageData(data: UsageStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage may be unavailable (private browsing, storage full)
  }
}

export function getOrCreate(store: UsageStore, sentenceId: number): SentenceUsageData {
  if (!store[sentenceId]) {
    store[sentenceId] = {
      attempts: 0,
      perfectCount: 0,
      showAnswerCount: 0,
      roleErrors: {},
      splitErrors: 0,
      flagged: false,
      note: '',
      lastAttempted: '',
    };
  }
  return store[sentenceId];
}

export function recordAttempt(
  sentenceId: number,
  isPerfect: boolean,
  roleErrors: Record<string, number>,
  splitErrors: number,
): void {
  const store = loadUsageData();
  const entry = getOrCreate(store, sentenceId);
  entry.attempts += 1;
  if (isPerfect) entry.perfectCount += 1;
  entry.splitErrors += splitErrors;
  for (const [role, count] of Object.entries(roleErrors)) {
    entry.roleErrors[role] = (entry.roleErrors[role] || 0) + count;
  }
  entry.lastAttempted = new Date().toISOString();
  saveUsageData(store);
}

export function recordShowAnswer(sentenceId: number): void {
  const store = loadUsageData();
  const entry = getOrCreate(store, sentenceId);
  entry.showAnswerCount += 1;
  entry.lastAttempted = new Date().toISOString();
  saveUsageData(store);
}

export function updateTeacherData(
  sentenceId: number,
  patch: Partial<Pick<SentenceUsageData, 'flagged' | 'note'>>,
): void {
  const store = loadUsageData();
  const entry = getOrCreate(store, sentenceId);
  Object.assign(entry, patch);
  saveUsageData(store);
}

export function clearUsageData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportUsageDataAsJson(data: UsageStore): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zinsontleding_data_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
