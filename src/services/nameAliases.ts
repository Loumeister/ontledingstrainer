/**
 * Name Aliases: persistent local mapping of old → new class/student names.
 *
 * When a teacher renames a class or student, the alias is stored here so that
 * Drive-fetched reports are renamed consistently on every re-fetch, even before
 * the remote Sheet has been updated.
 */

import type { SessionReport } from './sessionReport';

const STORAGE_KEY = 'zinsontleding_aliases_v1';

interface AliasStore {
  /** Normalised old class name → normalised new class name */
  klas: Record<string, string>;
  /** Normalised old student name → display new student name */
  student: Record<string, string>;
}

function loadStore(): AliasStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { klas: {}, student: {} };
    const parsed = JSON.parse(raw) as Partial<AliasStore>;
    return {
      klas: parsed.klas ?? {},
      student: parsed.student ?? {},
    };
  } catch {
    return { klas: {}, student: {} };
  }
}

function saveStore(store: AliasStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage may be unavailable
  }
}

/** Read the full alias store. */
export function getAliases(): AliasStore {
  return loadStore();
}

/** Store a class alias: all occurrences of `oldKlas` will be renamed to `newKlas`. */
export function setKlasAlias(oldKlas: string, newKlas: string): void {
  const normOld = oldKlas.trim().toLowerCase();
  const normNew = newKlas.trim().toLowerCase();
  if (!normOld || !normNew || normOld === normNew) return;
  const store = loadStore();
  store.klas[normOld] = normNew;
  saveStore(store);
}

/** Remove a class alias. */
export function clearKlasAlias(oldKlas: string): void {
  const normOld = oldKlas.trim().toLowerCase();
  const store = loadStore();
  delete store.klas[normOld];
  saveStore(store);
}

/** Store a student alias: all occurrences of `oldName` will be renamed to `newName`. */
export function setStudentAlias(oldName: string, newName: string): void {
  const normOld = oldName.trim().toLowerCase();
  if (!normOld || !newName.trim()) return;
  const store = loadStore();
  store.student[normOld] = newName.trim();
  saveStore(store);
}

/** Remove a student alias. */
export function clearStudentAlias(oldName: string): void {
  const normOld = oldName.trim().toLowerCase();
  const store = loadStore();
  delete store.student[normOld];
  saveStore(store);
}

/**
 * Apply stored aliases to a report in-place.
 * Should be called after decoding every Drive-fetched report.
 */
export function applyAliases(report: SessionReport): void {
  const store = loadStore();

  if (report.klas) {
    const normKlas = report.klas.trim().toLowerCase();
    if (store.klas[normKlas]) {
      report.klas = store.klas[normKlas];
    }
  }

  if (report.name) {
    const normName = report.name.trim().toLowerCase();
    if (store.student[normName]) {
      report.name = store.student[normName];
    }
  }
}
