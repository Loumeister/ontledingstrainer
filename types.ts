export type RoleKey = 'pv' | 'ow' | 'lv' | 'mv' | 'bwb' | 'bijv_bep' | 'vv' | 'wg' | 'nwd' | 'bijst' | 'bijzin' | 'vw_neven' | 'vw_onder';

export type PredicateType = 'WG' | 'NG';

export type DifficultyLevel = 1 | 2 | 3 | 4; // 1 = Basis, 2 = Gemiddeld, 3 = Gevorderd, 4 = Expert

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