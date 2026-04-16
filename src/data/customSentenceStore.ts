import { Sentence } from '../types';

const STORAGE_KEY = 'custom-sentences';

export function getCustomSentences(): Sentence[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomSentence(sentence: Sentence): void {
  const existing = getCustomSentences();
  const idx = existing.findIndex(s => s.id === sentence.id);
  if (idx >= 0) {
    existing[idx] = sentence;
  } else {
    existing.push(sentence);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function deleteCustomSentence(id: number): void {
  const existing = getCustomSentences().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function exportCustomSentences(): string {
  return JSON.stringify(getCustomSentences(), null, 2);
}

/**
 * Exporteert alle zinnen van een bepaald niveau als volledige vervanging voor
 * `sentences-level-N.json`. Custom zinnen met hetzelfde ID als een ingebouwde
 * zin overschrijven de ingebouwde versie (custom wint). De output is gesorteerd
 * op ID en kan direct als vervanging worden gebruikt in src/data/.
 *
 * @param level - Het niveau (0–4) om te exporteren
 * @param builtInSentences - De ingebouwde zinnen voor dat niveau (van sentenceLoader)
 * @param customSentences - Alle custom zinnen (ongefilterd; functie filtert zelf op level)
 */
export function exportMergedLevel(
  level: number,
  builtInSentences: Sentence[],
  customSentences: Sentence[]
): string {
  const customForLevel = customSentences.filter(s => s.level === level);
  const customIds = new Set(customForLevel.map(s => s.id));
  const builtInForLevel = builtInSentences.filter(
    s => s.level === level && !customIds.has(s.id)
  );
  const merged = [...builtInForLevel, ...customForLevel].sort((a, b) => a.id - b.id);
  return JSON.stringify(merged, null, 2);
}

export function importCustomSentences(json: string): Sentence[] {
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) throw new Error('Ongeldig formaat');
  parsed.forEach((s: Record<string, unknown>) => {
    if (!s.id || !s.label || !s.tokens || !s.predicateType || !s.level) {
      throw new Error(`Ongeldige zin: ${s.id || 'onbekend'}`);
    }
  });
  // Merge with existing rather than overwrite
  const existing = getCustomSentences();
  for (const s of parsed as Sentence[]) {
    const idx = existing.findIndex(e => e.id === s.id);
    if (idx >= 0) {
      existing[idx] = s;
    } else {
      existing.push(s);
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  return existing;
}

/**
 * Parse and validate a JSON string as a Sentence[].
 * Does NOT persist to localStorage — use for JSON direct-start sessions.
 *
 * Performs structural validation on each sentence and its tokens so that
 * malformed JSON is caught early instead of causing runtime errors in the
 * trainer.
 */
export function parseAndValidateSentences(json: string): Sentence[] {
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed)) throw new Error('Ongeldig formaat: verwacht een JSON-array');

  const VALID_PREDICATE_TYPES = new Set(['WG', 'NG']);

  return parsed.map((raw: unknown, index: number) => {
    if (typeof raw !== 'object' || raw === null) {
      throw new Error(`Zin op positie ${index} is geen object`);
    }
    const s = raw as Record<string, unknown>;
    const label = `zin ${typeof s.id === 'number' ? s.id : `op positie ${index}`}`;

    if (typeof s.id !== 'number') {
      throw new Error(`${label}: 'id' moet een nummer zijn`);
    }
    if (typeof s.label !== 'string' || s.label.trim() === '') {
      throw new Error(`${label}: 'label' moet een niet-lege string zijn`);
    }
    if (typeof s.predicateType !== 'string' || !VALID_PREDICATE_TYPES.has(s.predicateType)) {
      throw new Error(`${label}: 'predicateType' moet 'WG' of 'NG' zijn`);
    }
    if (typeof s.level !== 'number' || s.level < 0 || s.level > 4) {
      throw new Error(`${label}: 'level' moet een getal 0–4 zijn`);
    }
    if (!Array.isArray(s.tokens) || s.tokens.length === 0) {
      throw new Error(`${label}: 'tokens' moet een niet-lege array zijn`);
    }

    // Validate each token
    (s.tokens as unknown[]).forEach((tok: unknown, ti: number) => {
      if (typeof tok !== 'object' || tok === null) {
        throw new Error(`${label}, token ${ti}: is geen object`);
      }
      const t = tok as Record<string, unknown>;
      if (typeof t.id !== 'string' || t.id.trim() === '') {
        throw new Error(`${label}, token ${ti}: 'id' moet een niet-lege string zijn`);
      }
      if (typeof t.text !== 'string') {
        throw new Error(`${label}, token ${ti}: 'text' moet een string zijn`);
      }
      if (typeof t.role !== 'string' || t.role.trim() === '') {
        throw new Error(`${label}, token ${ti}: 'role' moet een niet-lege string zijn`);
      }
    });

    return raw as Sentence;
  });
}

// Custom sentences use IDs in the 10000+ range to avoid collisions
export function getNextCustomId(): number {
  const existing = getCustomSentences();
  const maxId = existing.reduce((max, s) => Math.max(max, s.id), 10000);
  return maxId + 1;
}

// --- Sharing via URL ---

export function encodeForSharing(sentences: Sentence[]): string {
  try {
    // encodeURIComponent makes JSON ASCII-safe; btoa for compact URL encoding
    return btoa(encodeURIComponent(JSON.stringify(sentences)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  } catch {
    return '';
  }
}

export function decodeShared(encoded: string): Sentence[] {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const pad = (4 - (padded.length % 4)) % 4;
    return JSON.parse(decodeURIComponent(atob(padded + '='.repeat(pad))));
  } catch {
    return [];
  }
}

export function buildShareUrl(sentences: Sentence[]): string {
  const encoded = encodeForSharing(sentences);
  return `${window.location.origin}${window.location.pathname}?zinnen=${encoded}`;
}
