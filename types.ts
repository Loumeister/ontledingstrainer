
export type RoleKey = 'pv' | 'ow' | 'lv' | 'mv' | 'bwb' | 'bijv_bep' | 'vv' | 'wg' | 'nwd' | 'bijst';

export type PredicateType = 'WG' | 'NG';

export type DifficultyLevel = 1 | 2 | 3; // 1 = Basis, 2 = Gemiddeld, 3 = Gevorderd

export interface Token {
  id: string;
  text: string;
  role: RoleKey; // The main constituent role this word belongs to
  subRole?: RoleKey; // The internal role (e.g. bijv_bep inside an OW)
  newChunk?: boolean; // Explicitly marks the start of a new constituent, even if the role is the same as previous
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
