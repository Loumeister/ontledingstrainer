export type RoleKey = 'pv' | 'ow' | 'lv' | 'mv' | 'bwb' | 'bijv_bep' | 'vv' | 'wg' | 'ng' | 'nwd' | 'wd' | 'wwd' | 'bijst' | 'bijzin' | 'vw_neven' | 'vw_onder';

export type PredicateType = 'WG' | 'NG';

export type DifficultyLevel = 0 | 1 | 2 | 3 | 4; // 0 = Instap, 1 = Basis, 2 = Middel, 3 = Gevorderd, 4 = Expert

export interface Token {
  id: string;
  text: string;
  role: RoleKey; // The main constituent role this word belongs to
  subRole?: RoleKey; // The internal role (e.g. bijv_bep inside an OW)
  newChunk?: boolean; // Explicitly marks the start of a new constituent, even if the role is the same as previous
  alternativeRole?: RoleKey; // An acceptable alternative role for ambiguous sentences
  bijzinFunctie?: RoleKey; // The grammatical function of a bijzin in the sentence (e.g. lv, bwb, ow)
  bijvBepTarget?: string; // Token ID of the word this bijv_bep modifies (for bvb sub-roles and bijzin bvb functions)
}

export interface Sentence {
  id: number;
  label: string;
  tokens: Token[];
  predicateType: PredicateType;
  level: DifficultyLevel; // New field for filtering
}

export interface RoleDefinition {
  key: RoleKey;
  label: string;
  shortLabel: string;
  colorClass: string;
  borderColorClass: string;
  isMainOnly?: boolean; // If true, usually applied to chunks
  isSubOnly?: boolean;  // If true, usually applied to words
}

export type PlacementMap = Record<string, RoleKey>; // key is the id of the first token in the chunk OR the specific token id

// Update validation state to include 'warning'
export type ValidationState = 'correct' | 'incorrect-role' | 'incorrect-split' | 'warning' | null;

export interface SentenceResult {
  sentence: Sentence;
  score: number;
  total: number;
  chunkStatus: Record<number, ValidationState>;
  chunkFeedback: Record<number, FeedbackEntry>;
  isPerfect: boolean;
  mistakes: Record<string, number>;
  showAnswerUsed: boolean;
  /** User's chunk labels keyed by first token ID */
  userLabels: PlacementMap;
  /** User's split indices */
  splitIndices: number[];
}

export interface SessionHistoryEntry {
  date: string;               // ISO date string
  scorePercentage: number;
  correct: number;
  total: number;
  mistakeStats: Record<string, number>;
  sentenceCount: number;
}

export interface RichFeedbackEntry {
  /** Korte herstelvraag (≤15 woorden), altijd inline zichtbaar */
  herstelvraag: string;
  /** Exact één woord uit herstelvraag — triggert expand bij tap/klik */
  sleutelwoord: string;
  uitleg: {
    /** "Je hebt waarschijnlijk..." — 1-2 zinnen */
    diagnose: string;
    /** Waar de denkfout zit — 1-2 zinnen */
    redenering: string;
    /** Één scherpe herstelvraag of instructie */
    herstap: string;
  };
}

/** Union type: simpele string voor triviale feedback, RichFeedbackEntry voor contrastieve paren */
export type FeedbackEntry = string | RichFeedbackEntry;

export interface SentenceUsageData {
  attempts: number;                    // Times a student checked this sentence (first check only)
  perfectCount: number;                // Times answered perfectly on first check
  showAnswerCount: number;             // Times show-answer was used without checking
  roleErrors: Record<string, number>;  // roleName -> count of wrong role assignments
  splitErrors: number;                 // Cumulative incorrect-split chunks across attempts
  flagged: boolean;                    // Teacher-flagged as suspect (possible label error)
  note: string;                        // Teacher note
  lastAttempted: string;               // ISO date string
}

// ── Zinsbouwlab / Zinsdeellab domain ────────────────────────────────────────

/** Slot-sleutels in een constructieframe (subset van RoleKey, uitgebreid met 'nwd') */
export type FrameSlotKey =
  | 'ow' | 'pv' | 'wg' | 'ng' | 'lv' | 'mv' | 'vv' | 'bwb' | 'nwd';

/**
 * Één woordkaart in de Zinsbouwlab woordbank.
 * Bevat interne tokens zodat omzetting naar Sentence exact is zonder tekst-parsing.
 */
export interface ChunkCard {
  id: string;
  role: FrameSlotKey;
  familyId: string;           // compatibiliteitsgroep, b.v. "transitief_sg"
  frameIds: string[];         // in welke frames deze kaart gebruikt mag worden

  /** Interne tokens — elke kaart = één chunk, meerdere tokens mogelijk */
  tokens: Array<{
    text: string;
    role: RoleKey;
    subRole?: RoleKey;
  }>;

  number?: 'sg' | 'pl';
  person?: 1 | 2 | 3;
  predicateType?: 'WG' | 'NG';
  requires?: FrameSlotKey[];  // slots die ook aanwezig moeten zijn
  forbids?: FrameSlotKey[];   // slots die niet aanwezig mogen zijn
  fixedPreposition?: string;  // voor VV-kaarten
  tags?: string[];            // thema-tags b.v. ["school", "sport"]
  verbTense?: 'present' | 'past';    // voor PV-kaarten: werkwoordstijd
  timeRef?: 'past' | 'present';      // voor BWB-kaarten: tijdsreferentie
}

/** Een constructieframe: definieert de slotstructuur van een Zinsbouwlab-oefening */
export interface ConstructionFrame {
  id: string;
  label: string;
  level: DifficultyLevel;
  predicateType: 'WG' | 'NG';
  slots: FrameSlotKey[];
  families: string[];         // toegestane familyIds voor ChunkCards
  wordOrders: string[];       // geldige volgordes b.v. ["ow-pv-lv", "bwb-pv-ow-lv"]
  prompt: string;             // opdrachttekst voor leerling
}

/** Eén constructiepoging door een leerling */
export interface ConstructionAttempt {
  frameId: string;
  selectedChunks: Partial<Record<FrameSlotKey, string>>; // slot → chunkCardId
  renderedSentence: string;
  isValid: boolean;
  feedback: string[];
}

// ── Zinsdeellab domain (foundation voor toekomstige MVP) ────────────────────

/** Soort Zinsdeellab-oefening — nu alleen 'remix', later uitbreidbaar */
export type LabExerciseType = 'remix';

/**
 * Een Zinsdeellab-oefening (definitie, versiebaar).
 * Historische LabSubmissions refereren aan exerciseId + exerciseVersion,
 * zodat studentresultaten altijd attributeerbaar zijn aan de exacte versie.
 */
export interface ZinsdeellabExercise {
  id: string;                 // stabiele slug, b.v. "ex-transitief-sg-001"
  version: number;            // incrementeert bij inhoudelijke wijziging
  contentHash: string;        // hash van geserialiseerde inhoud (voor attributie)
  createdAt: string;          // ISO timestamp
  updatedAt: string;          // ISO timestamp
  exerciseType: LabExerciseType;
  title: string;
  level: DifficultyLevel;
  frameId: string;            // verwijst naar ConstructionFrame.id
}

/**
 * Studentpoging op een specifieke versie van een oefening.
 * Eén submission = één voltooid of afgebroken lab-traject.
 */
export interface LabSubmission {
  id: string;                 // stabiele ID, b.v. ISO-timestamp + random suffix
  exerciseId: string;
  exerciseVersion: number;    // versie actief bij start van deze poging
  studentName: string;
  studentKlas: string;
  startedAt: string;          // ISO
  completedAt?: string;       // ISO; ontbreekt als afgebroken
  constructionValid: boolean;
  builtSentence: string;      // gebouwde zin als leesbare tekst
  parsingScore?: number;      // 0–100 als ontleed-fase gedaan
  usedHint: boolean;
}

/** Fijnkorrelig event binnen een lab-traject (per submission gegroepeerd) */
export interface LabActivityEvent {
  submissionId: string;
  type: LabEventType;
  timestamp: string;          // ISO
  detail?: string;
}

/** Event-types voor Zinsdeellab activiteitslog */
export type LabEventType =
  | 'exercise_start'
  | 'card_placed'
  | 'card_removed'
  | 'construction_submitted'
  | 'construction_valid'
  | 'construction_invalid'
  | 'hint_used'
  | 'parse_started'
  | 'parse_completed'
  | 'exercise_abandoned';
