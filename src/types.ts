export type RoleKey = 'pv' | 'ow' | 'lv' | 'mv' | 'bwb' | 'bijv_bep' | 'vv' | 'wg' | 'ng' | 'nwd' | 'wd' | 'wwd' | 'bijst' | 'bijzin' | 'vw_neven' | 'vw_onder';

export type PredicateType = 'WG' | 'NG';

export type DifficultyLevel = 0 | 1 | 2 | 3 | 4; // 0 = Instap, 1 = Basis, 2 = Middel, 3 = Hoog, 4 = Samengesteld

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

  /**
   * Zinnenlab-annotaties — optioneel, alleen ingevuld als de docent dit heeft
   * opgegeven of als de corpusgrouper het automatisch heeft gedetecteerd.
   *
   * owNumber: getal van het onderwerp (enkelvoud/meervoud) — nodig voor de
   *   congruentiecheck OW↔PV in het Zinnenlab.
   * pvTense: werkwoordstijd van de persoonsvorm (tt/vt) — nodig om te controleren
   *   dat "gisteren" (vt-referentie) niet met een tt-persoonsvorm gecombineerd wordt.
   */
  owNumber?: 'sg' | 'pl';
  pvTense?: 'present' | 'past';

  /**
   * Structurele categorielabels — uitsluitend zichtbaar voor docenten.
   * Worden nooit aan leerlingen getoond. Gebruik ze om snel te zien welk
   * soort constructie een zin bevat bij het samenstellen van oefensets.
   *
   * Voorbeelden: "basisvolgorde", "inversie", "samengestelde tijd",
   *   "nevenschikking", "ow op afstand", "bijvoeglijke bijzin (dat)"
   */
  structuralTags?: string[];
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
  note: string;                        // Teacher note (legacy — new notes go to teacherNoteStore)
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
 * Studentpoging op een specifieke versie van een Zinsdeellab-oefening.
 * Eén submission = één voltooid of afgebroken lab-traject.
 *
 * domain: 'lab' — discriminator voor AnySubmission union (activityStore).
 * Bestaande opgeslagen records zonder domain-veld worden bij uitlezen
 * als 'lab' behandeld door labSubmissionStore.getSubmissions().
 */
export interface LabSubmission {
  domain: 'lab';              // discriminator voor cross-domain aggregatie
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

// ── Trainer domain (versioned assignments + submissions) ─────────────────────

/**
 * Stabiele student-identiteit.
 * Gegenereerd bij eerste gebruik via studentStore.getOrCreateStudent().
 * Bestaande flows bewaard: student_info_v1 blijft tijdelijk geldig.
 * LabSubmission gebruikt nog studentName strings — migratie deferred.
 */
export interface Student {
  id: string;        // 'std-{ISO-nocolon}-{4random}'
  name: string;
  initiaal: string;
  klas: string;
  createdAt: string; // ISO-8601
}

/**
 * Een versiebare verzameling aangepaste zinnen (docentopdracht voor ontleding).
 * Parallel aan ZinsdeellabExercise — zelfde versioning-patroon:
 *   id (stabiel) + version (incrementeel) + contentHash (btoa).
 * Historische TrainerSubmissions refereren aan assignmentId + assignmentVersion,
 * zodat studentresultaten correct blijven als de opdracht later wordt bewerkt.
 */
export interface TrainerAssignment {
  id: string;            // stabiele slug of 'asgn-{ISO-nocolon}-{4random}'
  title: string;
  version: number;       // incrementeert bij inhoudelijke wijziging van sentenceIds
  contentHash: string;   // btoa-hash voor attributie
  createdAt: string;     // ISO-8601
  updatedAt: string;     // ISO-8601
  sentenceIds: number[]; // snapshot van zin-IDs bij deze versie
}

/**
 * Studentpoging op een ontledingssessie.
 * assignmentId/assignmentVersion zijn null bij vrije oefening.
 *
 * domain: 'trainer' — discriminator voor AnySubmission union (activityStore).
 * Bestaande opgeslagen records zonder domain-veld worden bij uitlezen
 * als 'trainer' behandeld door trainerSubmissionStore.getSubmissions().
 */
export interface TrainerSubmission {
  domain: 'trainer';            // discriminator voor cross-domain aggregatie
  id: string;                   // 'tsub-{ISO-nocolon}-{4random}'
  studentId: string;            // Student.id
  studentName: string;          // gedenormaliseerd voor weergave
  studentKlas: string;          // gedenormaliseerd voor weergave
  assignmentId: string | null;
  assignmentVersion: number | null;
  startedAt: string;            // ISO-8601
  completedAt?: string;         // ISO-8601; ontbreekt als afgebroken
  scoreCorrect: number;
  scoreTotal: number;
  levelPlayed: number | null;
  showAnswerCount: number;
  durationSeconds: number | null;
  mistakeStats: Record<string, number>; // roleKey → foutentelling
}

/**
 * Per-zin poging binnen een TrainerSubmission.
 * Bewaart splitposities en labels zodat docenten de studentoplossing kunnen zien.
 */
export interface TrainerAttempt {
  id: string;           // 'tatt-{ISO-nocolon}-{4random}'
  submissionId: string;
  sentenceId: number;
  startedAt: string;    // ISO-8601
  completedAt?: string; // ISO-8601
  scoreCorrect: number;
  scoreTotal: number;
  showAnswerUsed: boolean;
  splitIndices: number[];
  userLabels: Record<string, string>; // PlacementMap (tokenId → roleKey)
}

/**
 * Event-types voor Trainer activiteitslog.
 * Superset van bestaande InteractionType in interactionLog.ts.
 */
export type TrainerEventType =
  | 'session_start' | 'session_finish' | 'abort'
  | 'sentence_start' | 'check' | 'hint' | 'show_answer' | 'retry'
  | 'split_toggle' | 'step_forward' | 'step_back'
  | 'label_drop' | 'label_remove' | 'sub_label_drop' | 'sub_label_remove'
  | 'bijzin_functie_drop' | 'bijzin_functie_remove'
  | 'bijvbep_link' | 'bijvbep_unlink' | 'word_bijvbep_link'
  | 'error_split' | 'error_role' | 'error_bijzin_functie';

/**
 * Fijnkorrelig event binnen een trainer-traject (per submission gegroepeerd).
 * Complement van interactionLog.ts; beide bestaan tijdelijk naast elkaar.
 */
export interface TrainerActivityEvent {
  submissionId: string;
  studentId?: string;       // Student.id indien beschikbaar
  type: TrainerEventType;
  timestamp: string;        // ISO-8601
  sentenceId?: number;
  detail?: string;
}

/**
 * Docentnotitie bij een zin, student of opdracht.
 * Logisch gescheiden van student-telemetrie (TrainerSubmission, TrainerAttempt).
 * Vervangt op termijn SentenceUsageData.note en .flagged.
 */
export interface TeacherNote {
  id: string;           // 'tnote-{ISO-nocolon}-{4random}'
  targetType: 'sentence' | 'student' | 'assignment';
  targetId: string;     // sentenceId (als string), Student.id of TrainerAssignment.id
  note: string;
  createdAt: string;    // ISO-8601
  updatedAt: string;    // ISO-8601
}

// ── Cross-domain union ────────────────────────────────────────────────────────

/**
 * Discriminated union van alle submission-types.
 * Gebruik `domain` als discriminator in switch/if-statements:
 *
 *   if (sub.domain === 'trainer') { // TrainerSubmission
 *   if (sub.domain === 'lab')     { // LabSubmission
 *
 * Verbruikt door activityStore en analyticsHelpers voor cross-domain aggregatie.
 */
export type AnySubmission = TrainerSubmission | LabSubmission;
