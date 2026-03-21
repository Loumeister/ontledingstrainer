/**
 * Persistente rolbeheersing: bijhoudt hoe lang een rol foutloos is bijgehouden.
 * Een rol is "beheerst" als hij 3 sessies achter elkaar geen fouten heeft opgeleverd.
 */

const STORAGE_KEY = 'zinsontleding_role_mastery_v1';

export interface RoleMasteryEntry {
  consecutiveClean: number; // sessies achter elkaar zonder fouten
  mastered: boolean;        // true zodra consecutiveClean >= 3
  achievedAt?: string;      // ISO-datum van eerste keer mastered
}

export type RoleMasteryStore = Record<string, RoleMasteryEntry>;

export function loadRoleMastery(): RoleMasteryStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RoleMasteryStore) : {};
  } catch {
    return {};
  }
}

function saveRoleMastery(store: RoleMasteryStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage may be unavailable
  }
}

/**
 * Updates role mastery after a session.
 *
 * @param allRoleLabels  All role labels that exist in the app (from ROLES constant)
 * @param mistakeStats   Error counts per role label for the current session
 * @returns Updated store + list of role labels newly mastered this session
 */
export function updateRoleMastery(
  allRoleLabels: string[],
  mistakeStats: Record<string, number>,
): { store: RoleMasteryStore; newlyMastered: string[] } {
  const store = loadRoleMastery();
  const newlyMastered: string[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const label of allRoleLabels) {
    const hadError = label in mistakeStats && mistakeStats[label] > 0;
    const prev = store[label] ?? { consecutiveClean: 0, mastered: false };
    const consecutiveClean = hadError ? 0 : prev.consecutiveClean + 1;
    const justMastered = !prev.mastered && consecutiveClean >= 3;
    store[label] = {
      consecutiveClean,
      mastered: prev.mastered || consecutiveClean >= 3,
      achievedAt: justMastered ? today : prev.achievedAt,
    };
    if (justMastered) newlyMastered.push(label);
  }

  saveRoleMastery(store);
  return { store, newlyMastered };
}
