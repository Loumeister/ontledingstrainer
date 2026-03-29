import type { FrameSlotKey, RoleKey, DifficultyLevel } from '../types';

/**
 * Één zinsdeel-kaart binnen een pool-entry, met grammaticale annotaties.
 * De annotaties worden doorgesluisd naar ChunkCard via poolToCards().
 */
export interface PoolChunk {
  slot: FrameSlotKey;
  tokens: Array<{ text: string; role: RoleKey; subRole?: RoleKey }>;
  /** Getal (ev/mv) — voor OW en PV, nodig voor congruentiecheck */
  number?: 'sg' | 'pl';
  /** Werkwoordstijd (tt/vt) — voor PV, nodig voor tijdcongruentiecheck */
  verbTense?: 'present' | 'past';
  /** Tijdsreferentie — voor BWB-kaarten met temporeel karakter */
  timeRef?: 'past' | 'present';
}

/**
 * Eén bronzin binnen een pool: levert één kaart per slot.
 * sourceLabel is voor docenten (preview in editor), niet zichtbaar voor leerlingen.
 */
export interface SentencePoolEntry {
  sourceLabel: string;
  chunks: PoolChunk[];
}

/**
 * Een groep bronzinnen met dezelfde slotstructuur.
 * Leerlingen kiezen per slot één kaart (uit willekeurige bronzinnen) en
 * bouwen zo een nieuwe, al dan niet correcte zin.
 */
export interface SentencePool {
  id: string;
  label: string;
  prompt: string;
  level: DifficultyLevel;
  predicateType: 'WG' | 'NG';
  /** Basisvolgorde van slots — ook gebruikt door v2WordOrders() */
  slots: FrameSlotKey[];
  entries: SentencePoolEntry[];
}

// ── Pool 1: OW + PV + LV (WG, niveau 1) ─────────────────────────────────────

const poolOwPvLv: SentencePool = {
  id: 'pool-wg-ow-pv-lv',
  label: 'OW + PV + LV (remixzinnen)',
  prompt: 'Bouw een zin met een onderwerp, persoonsvorm en lijdend voorwerp. Welk zinsdeel zet je voorop?',
  level: 1,
  predicateType: 'WG',
  slots: ['ow', 'pv', 'lv'],
  entries: [
    {
      sourceLabel: 'De leerling leest een boek.',
      chunks: [
        { slot: 'ow', tokens: [{text: 'De', role: 'ow'}, {text: 'leerling', role: 'ow'}], number: 'sg' },
        { slot: 'pv', tokens: [{text: 'leest', role: 'pv'}], number: 'sg', verbTense: 'present' },
        { slot: 'lv', tokens: [{text: 'een', role: 'lv'}, {text: 'boek', role: 'lv'}] },
      ],
    },
    {
      sourceLabel: 'De kinderen kopen de krant.',
      chunks: [
        { slot: 'ow', tokens: [{text: 'De', role: 'ow'}, {text: 'kinderen', role: 'ow'}], number: 'pl' },
        { slot: 'pv', tokens: [{text: 'kopen', role: 'pv'}], number: 'pl', verbTense: 'present' },
        { slot: 'lv', tokens: [{text: 'de', role: 'lv'}, {text: 'krant', role: 'lv'}] },
      ],
    },
    {
      sourceLabel: 'Mijn broer zag de film.',
      chunks: [
        { slot: 'ow', tokens: [{text: 'Mijn', role: 'ow'}, {text: 'broer', role: 'ow'}], number: 'sg' },
        { slot: 'pv', tokens: [{text: 'zag', role: 'pv'}], number: 'sg', verbTense: 'past' },
        { slot: 'lv', tokens: [{text: 'de', role: 'lv'}, {text: 'film', role: 'lv'}] },
      ],
    },
    {
      sourceLabel: 'De docenten lazen het verhaal.',
      chunks: [
        { slot: 'ow', tokens: [{text: 'De', role: 'ow'}, {text: 'docenten', role: 'ow'}], number: 'pl' },
        { slot: 'pv', tokens: [{text: 'lazen', role: 'pv'}], number: 'pl', verbTense: 'past' },
        { slot: 'lv', tokens: [{text: 'het', role: 'lv'}, {text: 'verhaal', role: 'lv'}] },
      ],
    },
    {
      sourceLabel: 'De lerares pakt de pen.',
      chunks: [
        { slot: 'ow', tokens: [{text: 'De', role: 'ow'}, {text: 'lerares', role: 'ow'}], number: 'sg' },
        { slot: 'pv', tokens: [{text: 'pakt', role: 'pv'}], number: 'sg', verbTense: 'present' },
        { slot: 'lv', tokens: [{text: 'de', role: 'lv'}, {text: 'pen', role: 'lv'}] },
      ],
    },
  ],
};

// ── Pool 2: OW + PV + LV + BWB (WG, niveau 1) ───────────────────────────────

const poolOwPvLvBwb: SentencePool = {
  id: 'pool-wg-ow-pv-lv-bwb',
  label: 'OW + PV + LV + BWB (remixzinnen)',
  prompt: 'Bouw een zin met een onderwerp, persoonsvorm, lijdend voorwerp en bijwoordelijke bepaling. Elk zinsdeel kan voorop staan.',
  level: 1,
  predicateType: 'WG',
  slots: ['ow', 'pv', 'lv', 'bwb'],
  entries: [
    {
      sourceLabel: 'De leerling leest de krant thuis.',
      chunks: [
        { slot: 'ow', tokens: [{text: 'De', role: 'ow'}, {text: 'leerling', role: 'ow'}], number: 'sg' },
        { slot: 'pv', tokens: [{text: 'leest', role: 'pv'}], number: 'sg', verbTense: 'present' },
        { slot: 'lv', tokens: [{text: 'de', role: 'lv'}, {text: 'krant', role: 'lv'}] },
        { slot: 'bwb', tokens: [{text: 'thuis', role: 'bwb'}] },
      ],
    },
    {
      sourceLabel: 'Mijn ouders kochten een boek gisteren.',
      chunks: [
        { slot: 'ow', tokens: [{text: 'Mijn', role: 'ow'}, {text: 'ouders', role: 'ow'}], number: 'pl' },
        { slot: 'pv', tokens: [{text: 'kochten', role: 'pv'}], number: 'pl', verbTense: 'past' },
        { slot: 'lv', tokens: [{text: 'een', role: 'lv'}, {text: 'boek', role: 'lv'}] },
        { slot: 'bwb', tokens: [{text: 'gisteren', role: 'bwb'}], timeRef: 'past' },
      ],
    },
    {
      sourceLabel: 'De docent ziet de film op school.',
      chunks: [
        { slot: 'ow', tokens: [{text: 'De', role: 'ow'}, {text: 'docent', role: 'ow'}], number: 'sg' },
        { slot: 'pv', tokens: [{text: 'ziet', role: 'pv'}], number: 'sg', verbTense: 'present' },
        { slot: 'lv', tokens: [{text: 'de', role: 'lv'}, {text: 'film', role: 'lv'}] },
        { slot: 'bwb', tokens: [{text: 'op', role: 'bwb'}, {text: 'school', role: 'bwb'}] },
      ],
    },
    {
      sourceLabel: 'De leerlingen pakten het verhaal gisteren.',
      chunks: [
        { slot: 'ow', tokens: [{text: 'De', role: 'ow'}, {text: 'leerlingen', role: 'ow'}], number: 'pl' },
        { slot: 'pv', tokens: [{text: 'pakten', role: 'pv'}], number: 'pl', verbTense: 'past' },
        { slot: 'lv', tokens: [{text: 'het', role: 'lv'}, {text: 'verhaal', role: 'lv'}] },
        { slot: 'bwb', tokens: [{text: 'gisteren', role: 'bwb'}], timeRef: 'past' },
      ],
    },
    {
      sourceLabel: 'Mijn broer koopt de pen vandaag.',
      chunks: [
        { slot: 'ow', tokens: [{text: 'Mijn', role: 'ow'}, {text: 'broer', role: 'ow'}], number: 'sg' },
        { slot: 'pv', tokens: [{text: 'koopt', role: 'pv'}], number: 'sg', verbTense: 'present' },
        { slot: 'lv', tokens: [{text: 'de', role: 'lv'}, {text: 'pen', role: 'lv'}] },
        { slot: 'bwb', tokens: [{text: 'vandaag', role: 'bwb'}], timeRef: 'present' },
      ],
    },
  ],
};

// ── Pool 3: OW + PV + NWD + BWB (NG, niveau 2) ──────────────────────────────

const poolOwPvNwdBwb: SentencePool = {
  id: 'pool-ng-ow-pv-nwd-bwb',
  label: 'OW + PV + NWD + BWB (naamwoordelijk gezegde)',
  prompt: 'Bouw een zin met een naamwoordelijk gezegde: onderwerp, koppelwerkwoord, naamwoordelijk deel en bijwoordelijke bepaling.',
  level: 2,
  predicateType: 'NG',
  slots: ['ow', 'pv', 'nwd', 'bwb'],
  entries: [
    {
      sourceLabel: 'Het weer is prachtig vandaag.',
      chunks: [
        { slot: 'ow', tokens: [{text: 'Het', role: 'ow'}, {text: 'weer', role: 'ow'}], number: 'sg' },
        { slot: 'pv', tokens: [{text: 'is', role: 'pv'}], number: 'sg', verbTense: 'present' },
        { slot: 'nwd', tokens: [{text: 'prachtig', role: 'nwd'}] },
        { slot: 'bwb', tokens: [{text: 'vandaag', role: 'bwb'}], timeRef: 'present' },
      ],
    },
    {
      sourceLabel: 'Mijn kamer was chaotisch gisteren.',
      chunks: [
        { slot: 'ow', tokens: [{text: 'Mijn', role: 'ow'}, {text: 'kamer', role: 'ow'}], number: 'sg' },
        { slot: 'pv', tokens: [{text: 'was', role: 'pv'}], number: 'sg', verbTense: 'past' },
        { slot: 'nwd', tokens: [{text: 'chaotisch', role: 'nwd'}] },
        { slot: 'bwb', tokens: [{text: 'gisteren', role: 'bwb'}], timeRef: 'past' },
      ],
    },
    {
      sourceLabel: 'De les lijkt saai vandaag.',
      chunks: [
        { slot: 'ow', tokens: [{text: 'De', role: 'ow'}, {text: 'les', role: 'ow'}], number: 'sg' },
        { slot: 'pv', tokens: [{text: 'lijkt', role: 'pv'}], number: 'sg', verbTense: 'present' },
        { slot: 'nwd', tokens: [{text: 'saai', role: 'nwd'}] },
        { slot: 'bwb', tokens: [{text: 'vandaag', role: 'bwb'}], timeRef: 'present' },
      ],
    },
    {
      sourceLabel: 'De leerlingen waren rustig thuis.',
      chunks: [
        { slot: 'ow', tokens: [{text: 'De', role: 'ow'}, {text: 'leerlingen', role: 'ow'}], number: 'pl' },
        { slot: 'pv', tokens: [{text: 'waren', role: 'pv'}], number: 'pl', verbTense: 'past' },
        { slot: 'nwd', tokens: [{text: 'rustig', role: 'nwd'}] },
        { slot: 'bwb', tokens: [{text: 'thuis', role: 'bwb'}] },
      ],
    },
  ],
};

export const SENTENCE_POOLS: SentencePool[] = [
  poolOwPvLv,
  poolOwPvLvBwb,
  poolOwPvNwdBwb,
];
