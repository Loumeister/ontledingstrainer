
import { RoleDefinition, Sentence } from './types';

export const ROLES: RoleDefinition[] = [
  // Core Constituents
  { 
    key: 'pv', 
    label: 'Persoonsvorm', 
    shortLabel: 'PV', 
    colorClass: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200', 
    borderColorClass: 'border-red-300 dark:border-red-700' 
  },
  { 
    key: 'ow', 
    label: 'Onderwerp', 
    shortLabel: 'OW', 
    colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200', 
    borderColorClass: 'border-blue-300 dark:border-blue-700' 
  },
  { 
    key: 'lv', 
    label: 'Lijdend Voorwerp', 
    shortLabel: 'LV', 
    colorClass: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200', 
    borderColorClass: 'border-green-300 dark:border-green-700' 
  },
  { 
    key: 'mv', 
    label: 'Meewerkend Voorwerp', 
    shortLabel: 'MV', 
    colorClass: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200', 
    borderColorClass: 'border-violet-300 dark:border-violet-700' 
  },
  { 
    key: 'bwb', 
    label: 'Bijwoordelijke Bepaling', 
    shortLabel: 'BWB', 
    colorClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200', 
    borderColorClass: 'border-amber-300 dark:border-amber-700' 
  },
  { 
    key: 'vv', 
    label: 'Voorzetselvoorwerp', 
    shortLabel: 'VV', 
    colorClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200', 
    borderColorClass: 'border-teal-300 dark:border-teal-700' 
  },
  { 
    key: 'bijst', 
    label: 'Bijstelling', 
    shortLabel: 'BIJST', 
    colorClass: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-200', 
    borderColorClass: 'border-pink-300 dark:border-pink-700' 
  },
  
  // Predicate Parts (WG/NG)
  { 
    key: 'wg', 
    label: 'Werkwoordelijk Gezegde', 
    shortLabel: 'WG', 
    colorClass: 'bg-rose-200 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200', 
    borderColorClass: 'border-rose-300 dark:border-rose-700' 
  },
  { 
    key: 'nwd', 
    label: 'Naamwoordelijk Gezegde', 
    shortLabel: 'NG', 
    colorClass: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200', 
    borderColorClass: 'border-yellow-300 dark:border-yellow-700' 
  },

  // Structural/Clause Roles
  { 
    key: 'bijzin', 
    label: 'Bijzin', 
    shortLabel: 'BIJZIN', 
    colorClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200', 
    borderColorClass: 'border-indigo-300 dark:border-indigo-700' 
  },
  { 
    key: 'vw_neven', 
    label: 'Nevenschikkend VW', 
    shortLabel: 'NEVEN', 
    colorClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200', 
    borderColorClass: 'border-slate-300 dark:border-slate-600' 
  },
  
  // Internal Structure (Sub-roles)
  { 
    key: 'bijv_bep', 
    label: 'Bijvoeglijke Bepaling', 
    shortLabel: 'BB', 
    colorClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200', 
    borderColorClass: 'border-emerald-300 dark:border-emerald-700', 
    isSubOnly: true 
  },
  { 
    key: 'vw_onder', 
    label: 'Onderschikkend VW', 
    shortLabel: 'ONDER', 
    colorClass: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200', 
    borderColorClass: 'border-neutral-300 dark:border-neutral-600', 
    isSubOnly: true 
  },
];

// Feedback for structural errors (Step 1)
export const FEEDBACK_STRUCTURE = {
  TOO_MANY_SPLITS: "Dit zinsdeel is nog niet compleet. Er hoort nog een woord (of meerdere woorden) bij.",
  MISSING_SPLIT: "Dit blokje is te lang. Er zitten meerdere zinsdelen in verstopt die je nog moet splitsen.",
  INCONSISTENT: "De woorden in dit blokje horen grammaticaal niet bij elkaar. Probeer de zin anders te verdelen."
};

// Matrix for Role Mismatch Feedback (Step 2)
export const FEEDBACK_MATRIX: Record<string, Record<string, string>> = {
  'ow': {
    'lv': "Ondergaat dit zinsdeel de handeling? Check: Wie of wat + gezegde + onderwerp?",
    'mv': "Kun je hier 'aan' of 'voor' voor zetten? Zo nee, check of dit zinsdeel de handeling uitvoert (het onderwerp).",
    'bwb': "Dit zinsdeel geeft geen antwoord op 'waar', 'wanneer' of 'hoe'. Het is degene die de actie uitvoert."
  },
  'pv': {
    'wg': "Dit hoort zeker bij het gezegde, maar het is niet de persoonsvorm (het werkwoord dat van tijd verandert)."
  },
  'wg': {
    'pv': "Dit is inderdaad onderdeel van het gezegde, maar benoem dit specifieke woord als de Persoonsvorm.",
    'ng': "Let op: in deze zin staat een koppelwerkwoord (zijn, worden, blijven...). De rest van het gezegde heet dan Naamwoordelijk Gezegde.",
    'lv': "Is dit een 'ding' of 'persoon'? Dit lijkt eerder een werkwoord (bijv. voltooid deelwoord of infinitief)."
  },
  'ng': {
    'wg': "Is er een koppelwerkwoord? Zo niet, dan is het gewoon een Werkwoordelijk Gezegde.",
    'lv': "Let op: de zin heeft een koppelwerkwoord. Dit zinsdeel zegt een eigenschap van het onderwerp, het is geen LV.",
    'bwb': "Dit zegt iets over de toestand of eigenschap van het onderwerp (gekoppeld door het werkwoord), niet over de manier waarop (hoe)."
  },
  'lv': {
    'ond': "Voert dit zinsdeel de actie uit? Of ondergaat het de actie? (Check: Wie/wat + gezegde?)",
    'vv': "Kijk goed naar het begin. Dit zinsdeel begint met een vast voorzetsel. Dan is het meestal geen Lijdend Voorwerp.",
    'bwb': "Zegt dit 'wat' er gedaan wordt? Of geeft het aan 'waar', 'wanneer' of 'hoe' iets gebeurt?",
    'mv': "Aan wie of voor wie wordt dit gegeven/gezegd? Als dat er niet staat, is het waarschijnlijk geen MV."
  },
  'mv': {
    'ond': "Dit is niet degene die de handeling uitvoert. Kun je er 'aan' of 'voor' voor denken?",
    'lv': "Haal je twee vragen door elkaar? Probeer er 'aan' of 'voor' voor te zetten. Als dat past, is het MV.",
    'vv': "Als je 'aan' of 'voor' kunt weglaten (of erbij denken), is het Meewerkend Voorwerp. Bij een VV zit het voorzetsel 'vast'."
  },
  'vv': {
    'bwb': "Dit begint met een voorzetsel, maar hoort dat voorzetsel vast bij het werkwoord (bijv. wachten *op*)? Dan is het een VV.",
    'lv': "Een Lijdend Voorwerp begint (bijna) nooit met een voorzetsel. Kijk goed of het voorzetsel bij het werkwoord hoort.",
    'mv': "Bij een VV hoort het voorzetsel vast bij het werkwoord. Bij een MV kun je 'aan/voor' vaak weglaten."
  },
  'bwb': {
    'vv': "Hoort dit voorzetsel vast bij het werkwoord (figuurlijk)? Of geeft het gewoon een plaats of tijd aan (letterlijk)?",
    'lv': "Wordt dit zinsdeel 'gedaan'? Of geeft het extra informatie (waar/wanneer/waarom)?",
    'bijzin': "Dit zinsdeel is een complete bijzin (met een eigen persoonsvorm). Gebruik het blokje 'Bijzin'."
  },
  'bijst': {
    'bijv_bep': "Dit staat tussen komma's en is een andere naam voor het zinsdeel ervoor. Dat noemen we een Bijstelling."
  },
  'bijzin': {
    'bwb': "Hoewel deze bijzin functioneert als een BWB, noemen we het in deze oefening een 'Bijzin'.",
    'ond': "Deze hele zin functioneert als onderwerp, maar noem het hier een 'Bijzin'.",
    'lv': "Deze hele zin functioneert als lijdend voorwerp, maar noem het hier een 'Bijzin'."
  },
  'vw_onder': {
    'vw_neven': "Dit is een onderschikkend voegwoord, want het leidt een bijzin in."
  },
  'vw_neven': {
    'vw_onder': "Dit is een nevenschikkend voegwoord (zoals 'en', 'maar', 'want'). Het verbindt twee hoofdzinnen."
  }
};

export const HINTS = {
  MISSING_PV: "Tip: Zoek eerst de persoonsvorm. Doe de tijds- of getalsproef.",
  MISSING_OW: "Tip: Zoek het onderwerp. Vraag: Wie of wat + persoonsvorm?",
  MISSING_WG: "Tip: Maak het gezegde compleet. Welke andere werkwoorden staan er in de zin?",
  MISSING_NG: "Tip: Dit is een zin met een koppelwerkwoord. Zoek het Naamwoordelijk Gezegde (wat wordt er gezegd over het onderwerp?).",
  MISSING_LV: "Tip: Is er een Lijdend Voorwerp? Vraag: Wie of wat + gezegde + onderwerp?",
  generic: (roleLabel: string) => `Tip: Probeer het zinsdeel '${roleLabel}' te vinden.`
};

export const SENTENCES: Sentence[] = [
  {
    id: 1,
    label: "Zin 1: De nieuwe buurvrouw",
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: "s1t1", text: "De", role: "ow" },
      { id: "s1t2", text: "nieuwe", role: "ow", subRole: "bijv_bep" },
      { id: "s1t3", text: "buurvrouw", role: "ow" },
      { id: "s1t4", text: "leest", role: "pv" },
      { id: "s1t5", text: "’s ochtends", role: "bwb" },
      { id: "s1t6", text: "rustig", role: "bwb", newChunk: true },
      { id: "s1t7", text: "de", role: "lv" },
      { id: "s1t8", text: "krant", role: "lv" },
      { id: "s1t9", text: "in", role: "bwb" },
      { id: "s1t10", text: "haar", role: "bwb", subRole: "bijv_bep" },
      { id: "s1t11", text: "keuken.", role: "bwb" }
    ]
  },
  {
    id: 2,
    label: "Zin 2: Gigantische cactus",
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: "s2t1", text: "In", role: "bwb" },
      { id: "s2t2", text: "het", role: "bwb" },
      { id: "s2t3", text: "midden", role: "bwb" },
      { id: "s2t4", text: "van", role: "bwb" },
      { id: "s2t5", text: "de", role: "bwb" },
      { id: "s2t6", text: "zaal", role: "bwb" },
      { id: "s2t7", text: "staat", role: "pv" },
      { id: "s2t8", text: "een", role: "ow" },
      { id: "s2t9", text: "gigantische", role: "ow", subRole: "bijv_bep" },
      { id: "s2t10", text: "cactus.", role: "ow" }
    ]
  },
  {
    id: 3,
    label: "Zin 3: Uitnodiging",
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: "s3t1", text: "Hebben", role: "pv" },
      { id: "s3t2", text: "jullie", role: "ow" },
      { id: "s3t3", text: "de", role: "lv" },
      { id: "s3t4", text: "uitnodiging", role: "lv" },
      { id: "s3t5", text: "voor", role: "lv", subRole: "bijv_bep" },
      { id: "s3t6", text: "zaterdag", role: "lv", subRole: "bijv_bep" },
      { id: "s3t7", text: "al", role: "bwb" },
      { id: "s3t8", text: "ontvangen?", role: "wg" }
    ]
  },
  {
    id: 4,
    label: "Zin 4: Oom Kees",
    predicateType: 'WG',
    level: 3,
    tokens: [
      { id: "s4t1", text: "De", role: "ow" },
      { id: "s4t2", text: "bakker,", role: "ow" },
      { id: "s4t3", text: "mijn", role: "bijst", subRole: "bijv_bep" },
      { id: "s4t4", text: "oom", role: "bijst" },
      { id: "s4t5", text: "Kees,", role: "bijst" },
      { id: "s4t6", text: "maakt", role: "pv" },
      { id: "s4t7", text: "elke", role: "bwb" },
      { id: "s4t8", text: "vrijdag", role: "bwb" },
      { id: "s4t9", text: "verse", role: "lv", subRole: "bijv_bep" },
      { id: "s4t10", text: "bolussen.", role: "lv" }
    ]
  },
  {
    id: 5,
    label: "Zin 5: Inzicht",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s5t1", text: "Wij", role: "ow" },
      { id: "s5t2", text: "vertrouwen", role: "pv" },
      { id: "s5t3", text: "op", role: "vv" },
      { id: "s5t4", text: "jouw", role: "vv", subRole: "bijv_bep" },
      { id: "s5t5", text: "inzicht.", role: "vv" }
    ]
  },
  {
    id: 6,
    label: "Zin 6: Sticker",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s6t1", text: "De", role: "ow" },
      { id: "s6t2", text: "kinderen", role: "ow" },
      { id: "s6t3", text: "kregen", role: "pv" },
      { id: "s6t4", text: "van", role: "mv" },
      { id: "s6t5", text: "de", role: "mv" },
      { id: "s6t6", text: "juf", role: "mv" },
      { id: "s6t7", text: "een", role: "lv" },
      { id: "s6t8", text: "sticker", role: "lv" },
      { id: "s6t9", text: "na", role: "bwb" },
      { id: "s6t10", text: "de", role: "bwb" },
      { id: "s6t11", text: "toets.", role: "bwb" }
    ]
  },
  {
    id: 7,
    label: "Zin 7: Groente",
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: "s7t1", text: "Eet", role: "pv" },
      { id: "s7t2", text: "jij", role: "ow" },
      { id: "s7t3", text: "eigenlijk", role: "bwb" },
      { id: "s7t4", text: "wel", role: "bwb", newChunk: true },
      { id: "s7t5", text: "genoeg", role: "lv" },
      { id: "s7t6", text: "groente?", role: "lv" }
    ]
  },
  {
    id: 8,
    label: "Zin 8: Koppige man",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s8t1", text: "Mijn", role: "ow", subRole: "bijv_bep" },
      { id: "s8t2", text: "opa", role: "ow" },
      { id: "s8t3", text: "blijft", role: "pv" },
      { id: "s8t4", text: "altijd", role: "bwb" },
      { id: "s8t5", text: "een", role: "nwd" },
      { id: "s8t6", text: "koppige", role: "nwd", subRole: "bijv_bep" },
      { id: "s8t7", text: "man.", role: "nwd" }
    ]
  },
  {
    id: 10,
    label: "Zin 10: Teleurgesteld",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s10t1", text: "Hij", role: "ow" },
      { id: "s10t2", text: "lijkt", role: "pv" },
      { id: "s10t3", text: "een", role: "nwd", subRole: "bijv_bep" },
      { id: "s10t4", text: "beetje", role: "nwd", subRole: "bijv_bep" },
      { id: "s10t5", text: "teleurgesteld.", role: "nwd" }
    ]
  },
  {
    id: 11,
    label: "Zin 11: Wegrennen",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s11t1", text: "De", role: "ow" },
      { id: "s11t2", text: "agent", role: "ow" },
      { id: "s11t3", text: "zag", role: "pv" },
      { id: "s11t4", text: "de", role: "lv" },
      { id: "s11t5", text: "verdachte", role: "lv" },
      { id: "s11t6", text: "hard", role: "bwb" },
      { id: "s11t7", text: "wegrennen.", role: "wg" }
    ]
  },
  {
    id: 12,
    label: "Zin 12: Badmeester",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s12t1", text: "Mijn", role: "ow", subRole: "bijv_bep" },
      { id: "s12t2", text: "zus", role: "ow" },
      { id: "s12t3", text: "werd", role: "pv" },
      { id: "s12t4", text: "tijdens", role: "bwb" },
      { id: "s12t5", text: "het", role: "bwb" },
      { id: "s12t6", text: "zwemmen", role: "bwb" },
      { id: "s12t7", text: "geholpen", role: "wg" },
      { id: "s12t8", text: "door", role: "bwb", newChunk: true },
      { id: "s12t9", text: "een", role: "bwb" },
      { id: "s12t10", text: "badmeester.", role: "bwb" }
    ]
  },
  {
    id: 13,
    label: "Zin 13: Zonnebloemen",
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: "s13t1", text: "In", role: "bwb" },
      { id: "s13t2", text: "onze", role: "bwb" },
      { id: "s13t3", text: "tuin", role: "bwb" },
      { id: "s13t4", text: "groeien", role: "pv" },
      { id: "s13t5", text: "elk", role: "bwb", newChunk: true },
      { id: "s13t6", text: "jaar", role: "bwb" },
      { id: "s13t7", text: "prachtige", role: "ow", subRole: "bijv_bep" },
      { id: "s13t8", text: "zonnebloemen.", role: "ow" }
    ]
  },
  {
    id: 14,
    label: "Zin 14: Chef-kok",
    predicateType: 'NG',
    level: 3,
    tokens: [
      { id: "s14t1", text: "De", role: "ow" },
      { id: "s14t2", text: "chef-kok,", role: "ow" },
      { id: "s14t3", text: "meneer", role: "bijst" },
      { id: "s14t4", text: "Lu,", role: "bijst" },
      { id: "s14t5", text: "werd", role: "pv" },
      { id: "s14t6", text: "vanmorgen", role: "bwb" },
      { id: "s14t7", text: "woedend.", role: "nwd" }
    ]
  },
  {
    id: 15,
    label: "Zin 15: Een kans",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s15t1", text: "Hebben", role: "pv" },
      { id: "s15t2", text: "jullie", role: "ow" },
      { id: "s15t3", text: "hem", role: "mv" },
      { id: "s15t4", text: "toen", role: "bwb" },
      { id: "s15t5", text: "een", role: "lv" },
      { id: "s15t6", text: "kans", role: "lv" },
      { id: "s15t7", text: "gegeven?", role: "wg" }
    ]
  },
  {
    id: 16,
    label: "Zin 16: Spekglad",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s16t1", text: "De", role: "ow" },
      { id: "s16t2", text: "regen", role: "ow" },
      { id: "s16t3", text: "maakt", role: "pv" },
      { id: "s16t4", text: "de", role: "lv" },
      { id: "s16t5", text: "straat", role: "lv" },
      { id: "s16t6", text: "spekglad.", role: "bwb" }
    ]
  },
  {
    id: 17,
    label: "Zin 17: Hotel",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s17t1", text: "Wij", role: "ow" },
      { id: "s17t2", text: "kozen", role: "pv" },
      { id: "s17t3", text: "voor", role: "vv" },
      { id: "s17t4", text: "een", role: "vv" },
      { id: "s17t5", text: "rustig", role: "vv", subRole: "bijv_bep" },
      { id: "s17t6", text: "hotel", role: "vv" },
      { id: "s17t7", text: "aan", role: "bwb" },
      { id: "s17t8", text: "het", role: "bwb" },
      { id: "s17t9", text: "strand.", role: "bwb" }
    ]
  },
  {
    id: 18,
    label: "Zin 18: Gebroken vaasje",
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: "s18t1", text: "Het", role: "ow" },
      { id: "s18t2", text: "meisje", role: "ow" },
      { id: "s18t3", text: "vond", role: "pv" },
      { id: "s18t4", text: "een", role: "lv" },
      { id: "s18t5", text: "gebroken", role: "lv", subRole: "bijv_bep" },
      { id: "s18t6", text: "vaasje", role: "lv" },
      { id: "s18t7", text: "in", role: "bwb" },
      { id: "s18t8", text: "de", role: "bwb" },
      { id: "s18t9", text: "kelder.", role: "bwb" }
    ]
  },
  {
    id: 19,
    label: "Zin 19: Binnenkort vijftig",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s19t1", text: "Mijn", role: "ow" },
      { id: "s19t2", text: "vader", role: "ow" },
      { id: "s19t3", text: "wordt", role: "pv" },
      { id: "s19t4", text: "binnenkort", role: "bwb" },
      { id: "s19t5", text: "vijftig.", role: "nwd" }
    ]
  },
  {
    id: 20,
    label: "Zin 20: Lange mail",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s20t1", text: "De", role: "ow" },
      { id: "s20t2", text: "student", role: "ow" },
      { id: "s20t3", text: "stuurde", role: "pv" },
      { id: "s20t4", text: "zijn", role: "mv", subRole: "bijv_bep" },
      { id: "s20t5", text: "docent", role: "mv" },
      { id: "s20t6", text: "gisteren", role: "bwb" },
      { id: "s20t7", text: "een", role: "lv" },
      { id: "s20t8", text: "lange", role: "lv", subRole: "bijv_bep" },
      { id: "s20t9", text: "mail.", role: "lv" }
    ]
  },
  {
    id: 21,
    label: "Zin 21: Weet jij...",
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: "s21t1", text: "Weet", role: "pv" },
      { id: "s21t2", text: "jij", role: "ow" },
      { id: "s21t3", text: "waarom", role: "bijzin" },
      { id: "s21t4", text: "hij", role: "bijzin" },
      { id: "s21t5", text: "zo", role: "bijzin" },
      { id: "s21t6", text: "boos", role: "bijzin" },
      { id: "s21t7", text: "is?", role: "bijzin" }
    ]
  },
  {
    id: 22,
    label: "Zin 22: Telefoon kwijt",
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: "s22t1", text: "Mijn", role: "ow" },
      { id: "s22t2", text: "nichtje", role: "ow" },
      { id: "s22t3", text: "raakte", role: "pv" },
      { id: "s22t4", text: "per", role: "bwb" },
      { id: "s22t5", text: "ongeluk", role: "bwb" },
      { id: "s22t6", text: "haar", role: "lv" },
      { id: "s22t7", text: "telefoon", role: "lv" },
      { id: "s22t8", text: "kwijt.", role: "wg" }
    ]
  },
  {
    id: 23,
    label: "Zin 23: Kleine hondjes",
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: "s23t1", text: "Langs", role: "bwb" },
      { id: "s23t2", text: "het", role: "bwb" },
      { id: "s23t3", text: "pad", role: "bwb" },
      { id: "s23t4", text: "liepen", role: "pv" },
      { id: "s23t5", text: "drie", role: "ow", subRole: "bijv_bep" },
      { id: "s23t6", text: "kleine", role: "ow", subRole: "bijv_bep" },
      { id: "s23t7", text: "hondjes.", role: "ow" }
    ]
  },
  {
    id: 24,
    label: "Zin 24: Even bellen",
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: "s24t1", text: "Zal", role: "pv" },
      { id: "s24t2", text: "ik", role: "ow" },
      { id: "s24t3", text: "jou", role: "mv" },
      { id: "s24t4", text: "straks", role: "bwb" },
      { id: "s24t5", text: "even", role: "bwb", newChunk: true },
      { id: "s24t6", text: "bellen?", role: "wg" }
    ]
  },
  {
    id: 25,
    label: "Zin 25: Met opzet",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s25t1", text: "De", role: "ow" },
      { id: "s25t2", text: "atleet", role: "ow" },
      { id: "s25t3", text: "schijnt", role: "pv" },
      { id: "s25t4", text: "met", role: "bwb" },
      { id: "s25t5", text: "opzet", role: "bwb" },
      { id: "s25t6", text: "te", role: "wg" },
      { id: "s25t7", text: "hebben", role: "wg" },
      { id: "s25t8", text: "verloren.", role: "wg" }
    ]
  },
  {
    id: 26,
    label: "Zin 26: Stuk groter",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s26t1", text: "Het", role: "ow" },
      { id: "s26t2", text: "huis", role: "ow" },
      { id: "s26t3", text: "lijkt", role: "pv" },
      { id: "s26t4", text: "na", role: "bwb" },
      { id: "s26t5", text: "de", role: "bwb" },
      { id: "s26t6", text: "verbouwing", role: "bwb" },
      { id: "s26t7", text: "een", role: "nwd", subRole: "bijv_bep" },
      { id: "s26t8", text: "stuk", role: "nwd", subRole: "bijv_bep" },
      { id: "s26t9", text: "groter.", role: "nwd" }
    ]
  },
  {
    id: 27,
    label: "Zin 27: Onze kat",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s27t1", text: "Onze", role: "ow", subRole: "bijv_bep" },
      { id: "s27t2", text: "kat", role: "ow" },
      { id: "s27t3", text: "jaagt", role: "pv" },
      { id: "s27t4", text: "’s nachts", role: "bwb" },
      { id: "s27t5", text: "op", role: "vv" },
      { id: "s27t6", text: "muizen.", role: "vv" }
    ]
  },
  {
    id: 28,
    label: "Zin 28: Rapport mee",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s28t1", text: "De", role: "ow" },
      { id: "s28t2", text: "leerlingen", role: "ow" },
      { id: "s28t3", text: "kregen", role: "pv" },
      { id: "s28t4", text: "vanmiddag", role: "bwb" },
      { id: "s28t5", text: "hun", role: "lv", subRole: "bijv_bep" },
      { id: "s28t6", text: "rapport", role: "lv" },
      { id: "s28t7", text: "mee.", role: "wg" }
    ]
  },
  {
    id: 29,
    label: "Zin 29: Witte reiger",
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: "s29t1", text: "Bij", role: "bwb" },
      { id: "s29t2", text: "het", role: "bwb" },
      { id: "s29t3", text: "meer", role: "bwb" },
      { id: "s29t4", text: "zag", role: "pv" },
      { id: "s29t5", text: "ik", role: "ow" },
      { id: "s29t6", text: "gisteren", role: "bwb", newChunk: true },
      { id: "s29t7", text: "een", role: "lv" },
      { id: "s29t8", text: "witte", role: "lv", subRole: "bijv_bep" },
      { id: "s29t9", text: "reiger", role: "lv" },
      { id: "s29t10", text: "landen.", role: "wg" }
    ]
  },
  {
    id: 31,
    label: "Zin 31: Uitslapen",
    predicateType: 'WG',
    level: 3,
    tokens: [
      { id: "s31t1", text: "Ondanks", role: "bwb" },
      { id: "s31t2", text: "zijn", role: "bwb" },
      { id: "s31t3", text: "schoolverplichtingen", role: "bwb" },
      { id: "s31t4", text: "sliep", role: "pv" },
      { id: "s31t5", text: "de", role: "ow" },
      { id: "s31t6", text: "14-jarige", role: "ow", subRole: "bijv_bep" },
      { id: "s31t7", text: "jongen", role: "ow" },
      { id: "s31t8", text: "sinds", role: "bwb", newChunk: true },
      { id: "s31t9", text: "de", role: "bwb" },
      { id: "s31t10", text: "meivakantie", role: "bwb" },
      { id: "s31t11", text: "iedere", role: "bwb", newChunk: true },
      { id: "s31t12", text: "ochtend", role: "bwb" },
      { id: "s31t13", text: "uit.", role: "wg" }
    ]
  },
  {
    id: 32,
    label: "Zin 32: Feedback",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s32t1", text: "Na", role: "bwb" },
      { id: "s32t2", text: "het", role: "bwb" },
      { id: "s32t3", text: "tentamen", role: "bwb" },
      { id: "s32t4", text: "gaf", role: "pv" },
      { id: "s32t5", text: "de", role: "ow" },
      { id: "s32t6", text: "professor", role: "ow" },
      { id: "s32t7", text: "elke", role: "mv", subRole: "bijv_bep" },
      { id: "s32t8", text: "student", role: "mv" },
      { id: "s32t9", text: "uitgebreide", role: "lv", subRole: "bijv_bep" },
      { id: "s32t10", text: "feedback.", role: "lv" }
    ]
  },
  {
    id: 33,
    label: "Zin 33: Droogte",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s33t1", text: "De", role: "ow" },
      { id: "s33t2", text: "bevolking", role: "ow" },
      { id: "s33t3", text: "bleef", role: "pv" },
      { id: "s33t4", text: "afhankelijk", role: "nwd" },
      { id: "s33t5", text: "van", role: "vv" },
      { id: "s33t6", text: "internationale", role: "vv", subRole: "bijv_bep" },
      { id: "s33t7", text: "hulp", role: "vv" },
      { id: "s33t8", text: "tijdens", role: "bwb" },
      { id: "s33t9", text: "de", role: "bwb" },
      { id: "s33t10", text: "droogte.", role: "bwb" }
    ]
  },
  {
    id: 34,
    label: "Zin 34: Jubileumfeest",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s34t1", text: "Helaas", role: "bwb" },
      { id: "s34t2", text: "serveerde", role: "pv" },
      { id: "s34t3", text: "de", role: "ow" },
      { id: "s34t4", text: "chef", role: "ow" },
      { id: "s34t5", text: "zijn", role: "mv", subRole: "bijv_bep" },
      { id: "s34t6", text: "gasten", role: "mv" },
      { id: "s34t7", text: "tijdens", role: "bwb", newChunk: true },
      { id: "s34t8", text: "het", role: "bwb" },
      { id: "s34t9", text: "jubileumfeest", role: "bwb" },
      { id: "s34t10", text: "een", role: "lv" },
      { id: "s34t11", text: "aangebrand", role: "lv", subRole: "bijv_bep" },
      { id: "s34t12", text: "hoofdgerecht.", role: "lv" }
    ]
  },
  {
    id: 35,
    label: "Zin 35: Ex-voetballer",
    predicateType: 'WG',
    level: 3,
    tokens: [
      { id: "s35t1", text: "Door", role: "bwb" },
      { id: "s35t2", text: "die", role: "bwb" },
      { id: "s35t3", text: "ex-voetballer", role: "bwb" },
      { id: "s35t4", text: "wordt", role: "pv" },
      { id: "s35t5", text: "aan", role: "mv" },
      { id: "s35t6", text: "de", role: "mv" },
      { id: "s35t7", text: "kijker", role: "mv" },
      { id: "s35t8", text: "een", role: "ow" },
      { id: "s35t9", text: "geweldige", role: "ow", subRole: "bijv_bep" },
      { id: "s35t10", text: "analyse", role: "ow" },
      { id: "s35t11", text: "gegeven.", role: "wg" }
    ]
  },
  {
    id: 36,
    label: "Zin 36: Journalist",
    predicateType: 'WG',
    level: 3,
    tokens: [
      { id: "s36t1", text: "De", role: "ow" },
      { id: "s36t2", text: "journalist", role: "ow" },
      { id: "s36t3", text: "leek", role: "pv" },
      { id: "s36t4", text: "tijdens", role: "bwb" },
      { id: "s36t5", text: "het", role: "bwb" },
      { id: "s36t6", text: "debat", role: "bwb" },
      { id: "s36t7", text: "de", role: "lv" },
      { id: "s36t8", text: "nieuwe", role: "lv", subRole: "bijv_bep" },
      { id: "s36t9", text: "minister", role: "lv" },
      { id: "s36t10", text: "met", role: "vv" },
      { id: "s36t11", text: "zijn", role: "vv", subRole: "bijv_bep" },
      { id: "s36t12", text: "voorganger", role: "vv" },
      { id: "s36t13", text: "te", role: "wg" },
      { id: "s36t14", text: "vergelijken.", role: "wg" }
    ]
  },
  {
    id: 37,
    label: "Zin 37: Nieuwe strategie",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s37t1", text: "De", role: "ow" },
      { id: "s37t2", text: "nieuwe", role: "ow", subRole: "bijv_bep" },
      { id: "s37t3", text: "strategie", role: "ow" },
      { id: "s37t4", text: "is", role: "pv" },
      { id: "s37t5", text: "volgens", role: "bwb" },
      { id: "s37t6", text: "recente", role: "bwb" },
      { id: "s37t7", text: "onderzoeken", role: "bwb" },
      { id: "s37t8", text: "aanzienlijk", role: "nwd", subRole: "bijv_bep" },
      { id: "s37t9", text: "effectiever", role: "nwd" },
      { id: "s37t10", text: "dan", role: "nwd" },
      { id: "s37t11", text: "de", role: "nwd" },
      { id: "s37t12", text: "vorige.", role: "nwd" }
    ]
  },
  {
    id: 38,
    label: "Zin 38: Stadscentra",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s38t1", text: "Tegenwoordig", role: "bwb" },
      { id: "s38t2", text: "wil", role: "pv" },
      { id: "s38t3", text: "de", role: "ow" },
      { id: "s38t4", text: "overheid", role: "ow" },
      { id: "s38t5", text: "in", role: "bwb", newChunk: true },
      { id: "s38t6", text: "drukke", role: "bwb", subRole: "bijv_bep" },
      { id: "s38t7", text: "stadscentra", role: "bwb" },
      { id: "s38t8", text: "de", role: "lv" },
      { id: "s38t9", text: "luchtkwaliteit", role: "lv" },
      { id: "s38t10", text: "verbeteren.", role: "wg" }
    ]
  },
  {
    id: 39,
    label: "Zin 39: Herkomst",
    predicateType: 'WG',
    level: 3,
    tokens: [
      { id: "s39t1", text: "Tijdens", role: "bwb" },
      { id: "s39t2", text: "een", role: "bwb" },
      { id: "s39t3", text: "zoektocht", role: "bwb" },
      { id: "s39t4", text: "naar", role: "bwb" },
      { id: "s39t5", text: "zijn", role: "bwb" },
      { id: "s39t6", text: "ouders", role: "bwb" },
      { id: "s39t7", text: "werd", role: "pv" },
      { id: "s39t8", text: "hem", role: "mv" },
      { id: "s39t9", text: "inzicht", role: "ow" },
      { id: "s39t10", text: "in", role: "ow" },
      { id: "s39t11", text: "zijn", role: "ow" },
      { id: "s39t12", text: "herkomst", role: "ow" },
      { id: "s39t13", text: "geschonken.", role: "wg" }
    ]
  },
  {
    id: 40,
    label: "Zin 40: Kogelvis",
    predicateType: 'WG',
    level: 3,
    tokens: [
      { id: "s40t1", text: "De", role: "ow" },
      { id: "s40t2", text: "bioloog", role: "ow" },
      { id: "s40t3", text: "scheen", role: "pv" },
      { id: "s40t4", text: "op", role: "bwb" },
      { id: "s40t5", text: "excursie", role: "bwb" },
      { id: "s40t6", text: "een", role: "lv" },
      { id: "s40t7", text: "zeepaardje", role: "lv" },
      { id: "s40t8", text: "met", role: "vv" },
      { id: "s40t9", text: "een", role: "vv" },
      { id: "s40t10", text: "kogelvis", role: "vv" },
      { id: "s40t11", text: "te", role: "wg" },
      { id: "s40t12", text: "verwarren.", role: "wg" }
    ]
  },
  {
    id: 41,
    label: "Zin 41: Mentor",
    predicateType: 'NG',
    level: 3,
    tokens: [
      { id: "s41t1", text: "De", role: "ow" },
      { id: "s41t2", text: "mentor,", role: "ow" },
      { id: "s41t3", text: "mevrouw", role: "bijst" },
      { id: "s41t4", text: "Van", role: "bijst" },
      { id: "s41t5", text: "Vliet,", role: "bijst" },
      { id: "s41t6", text: "blijkt", role: "pv" },
      { id: "s41t7", text: "na", role: "bwb" },
      { id: "s41t8", text: "alle", role: "bwb" },
      { id: "s41t9", text: "gesprekken", role: "bwb" },
      { id: "s41t10", text: "heel", role: "nwd", subRole: "bijv_bep" },
      { id: "s41t11", text: "tevreden.", role: "nwd" }
    ]
  },
  {
    id: 42,
    label: "Zin 42: Lastig",
    predicateType: 'WG',
    level: 3,
    tokens: [
      { id: "s42t1", text: "Wij", role: "ow" },
      { id: "s42t2", text: "vinden", role: "pv" },
      { id: "s42t3", text: "het", role: "lv" },
      { id: "s42t4", text: "soms", role: "bwb" },
      { id: "s42t5", text: "lastig", role: "nwd" }, // User specified 'ng-deel'
      { id: "s42t6", text: "om", role: "vv" },
      { id: "s42t7", text: "iedereen", role: "vv" },
      { id: "s42t8", text: "tegelijk", role: "vv", subRole: "bijv_bep" },
      { id: "s42t9", text: "te", role: "vv" },
      { id: "s42t10", text: "helpen.", role: "vv" }
    ]
  },
  {
    id: 43,
    label: "Zin 43: Gevaarlijke populist",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s43t1", text: "De", role: "ow" },
      { id: "s43t2", text: "journalist", role: "ow" },
      { id: "s43t3", text: "noemde", role: "pv" },
      { id: "s43t4", text: "de", role: "mv" },
      { id: "s43t5", text: "politicus", role: "mv" },
      { id: "s43t6", text: "tijdens", role: "bwb" },
      { id: "s43t7", text: "het", role: "bwb" },
      { id: "s43t8", text: "debat", role: "bwb" },
      { id: "s43t9", text: "een", role: "lv" },
      { id: "s43t10", text: "gevaarlijke", role: "lv", subRole: "bijv_bep" },
      { id: "s43t11", text: "populist.", role: "lv" }
    ]
  },
  {
    id: 44,
    label: "Zin 44: Parkeerplaats",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s44t1", text: "Op", role: "bwb" },
      { id: "s44t2", text: "de", role: "bwb" },
      { id: "s44t3", text: "parkeerplaats", role: "bwb" },
      { id: "s44t4", text: "werden", role: "pv" },
      { id: "s44t5", text: "twee", role: "ow", subRole: "bijv_bep" },
      { id: "s44t6", text: "auto’s", role: "ow" },
      { id: "s44t7", text: "door", role: "bwb", newChunk: true },
      { id: "s44t8", text: "onbekenden", role: "bwb" },
      { id: "s44t9", text: "opengebroken.", role: "wg" }
    ]
  },
  {
    id: 45,
    label: "Zin 45: Ervaren gamer",
    predicateType: 'WG',
    level: 3,
    tokens: [
      { id: "s45t1", text: "Mijn", role: "ow" },
      { id: "s45t2", text: "broer,", role: "ow" },
      { id: "s45t3", text: "een", role: "bijst" },
      { id: "s45t4", text: "ervaren", role: "bijst", subRole: "bijv_bep" },
      { id: "s45t5", text: "gamer,", role: "bijst" },
      { id: "s45t6", text: "kocht", role: "pv" },
      { id: "s45t7", text: "gisteren", role: "bwb" },
      { id: "s45t8", text: "voor", role: "mv" },
      { id: "s45t9", text: "zijn", role: "mv", subRole: "bijv_bep" },
      { id: "s45t10", text: "vrienden", role: "mv" },
      { id: "s45t11", text: "een", role: "lv" },
      { id: "s45t12", text: "nieuwe", role: "lv", subRole: "bijv_bep" },
      { id: "s45t13", text: "controller.", role: "lv" }
    ]
  },
  {
    id: 46,
    label: "Zin 46: Eerlijke kans",
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: "s46t1", text: "Hebben", role: "pv" },
      { id: "s46t2", text: "jullie", role: "ow" },
      { id: "s46t3", text: "hem", role: "mv" },
      { id: "s46t4", text: "gisteren", role: "bwb" },
      { id: "s46t5", text: "nog", role: "bwb", newChunk: true },
      { id: "s46t6", text: "een", role: "lv" },
      { id: "s46t7", text: "eerlijke", role: "lv", subRole: "bijv_bep" },
      { id: "s46t8", text: "kans", role: "lv" },
      { id: "s46t9", text: "gegeven?", role: "wg" }
    ]
  },
  {
    id: 47,
    label: "Zin 47: Directeur",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s47t1", text: "De", role: "ow" },
      { id: "s47t2", text: "directeur", role: "ow" },
      { id: "s47t3", text: "laat", role: "pv" },
      { id: "s47t4", text: "zijn", role: "mv", subRole: "bijv_bep" },
      { id: "s47t5", text: "assistent", role: "mv" },
      { id: "s47t6", text: "alle", role: "lv", subRole: "bijv_bep" },
      { id: "s47t7", text: "documenten", role: "lv" },
      { id: "s47t8", text: "zorgvuldig", role: "bwb" },
      { id: "s47t9", text: "archiveren.", role: "wg" }
    ]
  },
  {
    id: 48,
    label: "Zin 48: Om hulp",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s48t1", text: "In", role: "bwb" },
      { id: "s48t2", text: "de", role: "bwb" },
      { id: "s48t3", text: "verte", role: "bwb" },
      { id: "s48t4", text: "hoorde", role: "pv" },
      { id: "s48t5", text: "ik", role: "ow" },
      { id: "s48t6", text: "iemand", role: "lv" },
      { id: "s48t7", text: "luid", role: "bwb", newChunk: true },
      { id: "s48t8", text: "om", role: "bwb", newChunk: true },
      { id: "s48t9", text: "hulp", role: "bwb" },
      { id: "s48t10", text: "roepen.", role: "wg" }
    ]
  },
  {
    id: 49,
    label: "Zin 49: Leraar Nederlands",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s49t1", text: "Onze", role: "ow", subRole: "bijv_bep" },
      { id: "s49t2", text: "leraar", role: "ow" },
      { id: "s49t3", text: "Nederlands", role: "ow" },
      { id: "s49t4", text: "lijkt", role: "pv" },
      { id: "s49t5", text: "de", role: "bwb" },
      { id: "s49t6", text: "laatste", role: "bwb" },
      { id: "s49t7", text: "tijd", role: "bwb" },
      { id: "s49t8", text: "iets", role: "nwd", subRole: "bijv_bep" },
      { id: "s49t9", text: "strenger", role: "nwd" },
      { id: "s49t10", text: "dan", role: "bwb", newChunk: true },
      { id: "s49t11", text: "vorig", role: "bwb" },
      { id: "s49t12", text: "jaar.", role: "bwb" }
    ]
  },
  {
    id: 51,
    label: "Zin 51: Verfrommeld briefje",
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: "s51t1", text: "Onder", role: "bwb" },
      { id: "s51t2", text: "zijn", role: "bwb", subRole: "bijv_bep" },
      { id: "s51t3", text: "bed", role: "bwb" },
      { id: "s51t4", text: "vond", role: "pv" },
      { id: "s51t5", text: "hij", role: "ow" },
      { id: "s51t6", text: "een", role: "lv" },
      { id: "s51t7", text: "half", role: "lv", subRole: "bijv_bep" },
      { id: "s51t8", text: "verfrommeld", role: "lv", subRole: "bijv_bep" },
      { id: "s51t9", text: "briefje", role: "lv" },
      { id: "s51t10", text: "van", role: "lv", subRole: "bijv_bep" },
      { id: "s51t11", text: "zijn", role: "lv", subRole: "bijv_bep" },
      { id: "s51t12", text: "broer.", role: "lv", subRole: "bijv_bep" }
    ]
  },
  {
    id: 52,
    label: "Zin 52: Wat uitleg",
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: "s52t1", text: "Konden", role: "pv" },
      { id: "s52t2", text: "jullie", role: "ow" },
      { id: "s52t3", text: "mij", role: "mv" },
      { id: "s52t4", text: "vanochtend", role: "bwb" },
      { id: "s52t5", text: "misschien", role: "bwb", newChunk: true },
      { id: "s52t6", text: "wat", role: "lv" },
      { id: "s52t7", text: "uitleg", role: "lv" },
      { id: "s52t8", text: "geven?", role: "wg" }
    ]
  },
  {
    id: 54,
    label: "Zin 54: Conditie verbeteren",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s54t1", text: "Ik", role: "ow" },
      { id: "s54t2", text: "probeer", role: "pv" },
      { id: "s54t3", text: "al", role: "bwb" },
      { id: "s54t4", text: "maanden", role: "bwb" },
      { id: "s54t5", text: "mijn", role: "lv", subRole: "bijv_bep" },
      { id: "s54t6", text: "conditie", role: "lv" },
      { id: "s54t7", text: "te", role: "wg" },
      { id: "s54t8", text: "verbeteren.", role: "wg" }
    ]
  },
  {
    id: 55,
    label: "Zin 55: Volledig gebroken",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s55t1", text: "Het", role: "ow" },
      { id: "s55t2", text: "team", role: "ow" },
      { id: "s55t3", text: "is", role: "pv" },
      { id: "s55t4", text: "na", role: "bwb" },
      { id: "s55t5", text: "de", role: "bwb" },
      { id: "s55t6", text: "nederlaag", role: "bwb" },
      { id: "s55t7", text: "volledig", role: "nwd", subRole: "bijv_bep" },
      { id: "s55t8", text: "gebroken.", role: "nwd" }
    ]
  },
  {
    id: 56,
    label: "Zin 56: Vrijwilligerswerk",
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: "s56t1", text: "Veel", role: "ow", subRole: "bijv_bep" },
      { id: "s56t2", text: "mensen", role: "ow" },
      { id: "s56t3", text: "hebben", role: "pv" },
      { id: "s56t4", text: "nog", role: "bwb" },
      { id: "s56t5", text: "nooit", role: "bwb" },
      { id: "s56t6", text: "vrijwilligerswerk", role: "lv" },
      { id: "s56t7", text: "gedaan.", role: "wg" }
    ]
  },
  {
    id: 57,
    label: "Zin 57: Vogelnesten",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s57t1", text: "Het", role: "ow" },
      { id: "s57t2", text: "terugvinden", role: "ow" },
      { id: "s57t3", text: "van", role: "ow" },
      { id: "s57t4", text: "vogelnesten", role: "ow" },
      { id: "s57t5", text: "blijft", role: "pv" },
      { id: "s57t6", text: "een", role: "nwd" },
      { id: "s57t7", text: "moeilijke", role: "nwd", subRole: "bijv_bep" },
      { id: "s57t8", text: "klus.", role: "nwd" }
    ]
  },
  {
    id: 58,
    label: "Zin 58: Meesterwerk",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s58t1", text: "De", role: "ow" },
      { id: "s58t2", text: "kunsthistoricus", role: "ow" },
      { id: "s58t3", text: "beschrijft", role: "pv" },
      { id: "s58t4", text: "dat", role: "lv", subRole: "bijv_bep" },
      { id: "s58t5", text: "schilderij", role: "lv" },
      { id: "s58t6", text: "in", role: "bwb" },
      { id: "s58t7", text: "deze", role: "bwb", subRole: "bijv_bep" },
      { id: "s58t8", text: "brochure", role: "bwb" },
      { id: "s58t9", text: "als", role: "vv" },
      { id: "s58t10", text: "een", role: "vv" },
      { id: "s58t11", text: "meesterwerk.", role: "vv" }
    ]
  },
  {
    id: 59,
    label: "Zin 59: Overheidsspionnen",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s59t1", text: "Vier", role: "ow", subRole: "bijv_bep" },
      { id: "s59t2", text: "Russische", role: "ow", subRole: "bijv_bep" },
      { id: "s59t3", text: "overheidsspionnen", role: "ow" },
      { id: "s59t4", text: "probeerden", role: "pv" },
      { id: "s59t5", text: "het", role: "lv" },
      { id: "s59t6", text: "wifi-netwerk", role: "lv" },
      { id: "s59t7", text: "bij", role: "lv", subRole: "bijv_bep" },
      { id: "s59t8", text: "de", role: "lv", subRole: "bijv_bep" },
      { id: "s59t9", text: "OPCW", role: "lv", subRole: "bijv_bep" },
      { id: "s59t10", text: "te", role: "wg" },
      { id: "s59t11", text: "kraken.", role: "wg" }
    ]
  },
  {
    id: 60,
    label: "Zin 60: Dictator",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s60t1", text: "Door", role: "bwb" },
      { id: "s60t2", text: "die", role: "bwb", subRole: "bijv_bep" },
      { id: "s60t3", text: "snor", role: "bwb" },
      { id: "s60t4", text: "lijkt", role: "pv" },
      { id: "s60t5", text: "hij", role: "ow" },
      { id: "s60t6", text: "heel", role: "bwb" },
      { id: "s60t7", text: "erg", role: "bwb" },
      { id: "s60t8", text: "op", role: "vv" },
      { id: "s60t9", text: "zo’n", role: "vv", subRole: "bijv_bep" },
      { id: "s60t10", text: "dictator.", role: "vv" }
    ]
  },
  {
    id: 61,
    label: "Zin 61: Politieke geweten",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s61t1", text: "De", role: "ow" },
      { id: "s61t2", text: "verslaggevers", role: "ow" },
      { id: "s61t3", text: "verweten", role: "pv" },
      { id: "s61t4", text: "hem", role: "mv" },
      { id: "s61t5", text: "zijn", role: "lv", subRole: "bijv_bep" },
      { id: "s61t6", text: "slechte", role: "lv", subRole: "bijv_bep" },
      { id: "s61t7", text: "politieke", role: "lv", subRole: "bijv_bep" },
      { id: "s61t8", text: "geweten.", role: "lv" }
    ]
  },
  {
    id: 62,
    label: "Zin 62: Enorme beer",
    predicateType: 'WG',
    level: 3,
    tokens: [
      { id: "s62t1", text: "Twee", role: "ow", subRole: "bijv_bep" },
      { id: "s62t2", text: "Russen", role: "ow" },
      { id: "s62t3", text: "op", role: "ow", subRole: "bijv_bep" },
      { id: "s62t4", text: "een", role: "ow", subRole: "bijv_bep" },
      { id: "s62t5", text: "sneeuwscooter", role: "ow", subRole: "bijv_bep" },
      { id: "s62t6", text: "gaven", role: "pv" },
      { id: "s62t7", text: "vorige", role: "bwb", subRole: "bijv_bep" },
      { id: "s62t8", text: "maand", role: "bwb" },
      { id: "s62t9", text: "uit", role: "bwb", newChunk: true },
      { id: "s62t10", text: "nood", role: "bwb" },
      { id: "s62t11", text: "een", role: "lv" },
      { id: "s62t12", text: "klap", role: "lv" },
      { id: "s62t13", text: "aan", role: "mv" },
      { id: "s62t14", text: "een", role: "mv" },
      { id: "s62t15", text: "enorme", role: "mv", subRole: "bijv_bep" },
      { id: "s62t16", text: "beer.", role: "mv" }
    ]
  },
  {
    id: 63,
    label: "Zin 63: Onhoudbaar",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s63t1", text: "In", role: "bwb" },
      { id: "s63t2", text: "Zuid-Spanje", role: "bwb" },
      { id: "s63t3", text: "werd", role: "pv" },
      { id: "s63t4", text: "de", role: "ow" },
      { id: "s63t5", text: "situatie", role: "ow" },
      { id: "s63t6", text: "na", role: "bwb", newChunk: true },
      { id: "s63t7", text: "de", role: "bwb" },
      { id: "s63t8", text: "hevige", role: "bwb", subRole: "bijv_bep" },
      { id: "s63t9", text: "regenbuien", role: "bwb" },
      { id: "s63t10", text: "onhoudbaar.", role: "nwd" }
    ]
  },
  {
    id: 64,
    label: "Zin 64: Groot succes",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s64t1", text: "De", role: "ow" },
      { id: "s64t2", text: "vergadering", role: "ow" },
      { id: "s64t3", text: "werd", role: "pv" },
      { id: "s64t4", text: "uiteindelijk", role: "bwb" },
      { id: "s64t5", text: "een", role: "nwd" },
      { id: "s64t6", text: "groot", role: "nwd", subRole: "bijv_bep" },
      { id: "s64t7", text: "succes.", role: "nwd" }
    ]
  },
  {
    id: 65,
    label: "Zin 65: Oplossing",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s65t1", text: "Wij", role: "ow" },
      { id: "s65t2", text: "hopen", role: "pv" },
      { id: "s65t3", text: "op", role: "vv" },
      { id: "s65t4", text: "een", role: "vv" },
      { id: "s65t5", text: "oplossing", role: "vv" },
      { id: "s65t6", text: "voor", role: "vv" },
      { id: "s65t7", text: "dit", role: "vv", subRole: "bijv_bep" },
      { id: "s65t8", text: "probleem.", role: "vv" }
    ]
  },
  {
    id: 66,
    label: "Zin 66: Defecte verwarmingssysteem",
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: "s66t1", text: "De", role: "ow" },
      { id: "s66t2", text: "technicus", role: "ow" },
      { id: "s66t3", text: "repareerde", role: "pv" },
      { id: "s66t4", text: "gisteren", role: "bwb" },
      { id: "s66t5", text: "het", role: "lv" },
      { id: "s66t6", text: "defecte", role: "lv", subRole: "bijv_bep" },
      { id: "s66t7", text: "verwarmingssysteem.", role: "lv" }
    ]
  },
  {
    id: 67,
    label: "Zin 67: Helder",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s67t1", text: "De", role: "ow" },
      { id: "s67t2", text: "lucht", role: "ow" },
      { id: "s67t3", text: "boven", role: "ow", subRole: "bijv_bep" },
      { id: "s67t4", text: "de", role: "ow", subRole: "bijv_bep" },
      { id: "s67t5", text: "stad", role: "ow", subRole: "bijv_bep" },
      { id: "s67t6", text: "bleef", role: "pv" },
      { id: "s67t7", text: "de", role: "bwb" },
      { id: "s67t8", text: "hele", role: "bwb", subRole: "bijv_bep" },
      { id: "s67t9", text: "avond", role: "bwb" },
      { id: "s67t10", text: "helder.", role: "nwd" }
    ]
  },
  {
    id: 68,
    label: "Zin 68: Wetenschappelijk artikel",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s68t1", text: "De", role: "ow" },
      { id: "s68t2", text: "student", role: "ow" },
      { id: "s68t3", text: "gaf", role: "pv" },
      { id: "s68t4", text: "zijn", role: "mv", subRole: "bijv_bep" },
      { id: "s68t5", text: "moeder", role: "mv" },
      { id: "s68t6", text: "trots", role: "bwb" },
      { id: "s68t7", text: "zijn", role: "lv", subRole: "bijv_bep" },
      { id: "s68t8", text: "eerste", role: "lv", subRole: "bijv_bep" },
      { id: "s68t9", text: "wetenschappelijke", role: "lv", subRole: "bijv_bep" },
      { id: "s68t10", text: "artikel.", role: "lv" }
    ]
  },
  {
    id: 69,
    label: "Zin 69: Beter licht",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s69t1", text: "De", role: "ow" },
      { id: "s69t2", text: "natuurfotograaf", role: "ow" },
      { id: "s69t3", text: "rekent", role: "pv" },
      { id: "s69t4", text: "op", role: "vv" },
      { id: "s69t5", text: "beter", role: "vv", subRole: "bijv_bep" },
      { id: "s69t6", text: "licht", role: "vv" },
      { id: "s69t7", text: "in", role: "vv", subRole: "bijv_bep", newChunk: true },
      { id: "s69t8", text: "de", role: "vv", subRole: "bijv_bep" },
      { id: "s69t9", text: "namiddag.", role: "vv", subRole: "bijv_bep" }
    ]
  },
  {
    id: 70,
    label: "Zin 70: Efficiënter",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s70t1", text: "Het", role: "ow" },
      { id: "s70t2", text: "nieuwe", role: "ow", subRole: "bijv_bep" },
      { id: "s70t3", text: "systeem", role: "ow" },
      { id: "s70t4", text: "lijkt", role: "pv" },
      { id: "s70t5", text: "veel", role: "nwd", subRole: "bijv_bep" },
      { id: "s70t6", text: "efficiënter", role: "nwd" },
      { id: "s70t7", text: "dan", role: "nwd" },
      { id: "s70t8", text: "het", role: "nwd" },
      { id: "s70t9", text: "oude.", role: "nwd" }
    ]
  },
  {
    id: 71,
    label: "Zin 71: Onbekende artefacten",
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: "s71t1", text: "Langs", role: "bwb" },
      { id: "s71t2", text: "de", role: "bwb" },
      { id: "s71t3", text: "kust", role: "bwb" },
      { id: "s71t4", text: "vonden", role: "pv" },
      { id: "s71t5", text: "archeologen", role: "ow" },
      { id: "s71t6", text: "een", role: "lv" },
      { id: "s71t7", text: "reeks", role: "lv" },
      { id: "s71t8", text: "onbekende", role: "lv", subRole: "bijv_bep" },
      { id: "s71t9", text: "artefacten.", role: "lv" }
    ]
  },
  {
    id: 72,
    label: "Zin 72: Herinnering",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s72t1", text: "De", role: "ow" },
      { id: "s72t2", text: "vrijwilliger", role: "ow" },
      { id: "s72t3", text: "stuurde", role: "pv" },
      { id: "s72t4", text: "gistermiddag", role: "bwb" },
      { id: "s72t5", text: "aan", role: "mv" },
      { id: "s72t6", text: "alle", role: "mv", subRole: "bijv_bep" },
      { id: "s72t7", text: "deelnemers", role: "mv" },
      { id: "s72t8", text: "een", role: "lv" },
      { id: "s72t9", text: "herinnering.", role: "lv" }
    ]
  },
  {
    id: 73,
    label: "Zin 73: Zwaarbewapende agenten",
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: "s73t1", text: "Bij", role: "bwb" },
      { id: "s73t2", text: "de", role: "bwb" },
      { id: "s73t3", text: "ingang", role: "bwb" },
      { id: "s73t4", text: "zag", role: "pv" },
      { id: "s73t5", text: "ik", role: "ow" },
      { id: "s73t6", text: "plotseling", role: "bwb", newChunk: true },
      { id: "s73t7", text: "twee", role: "lv", subRole: "bijv_bep" },
      { id: "s73t8", text: "zwaarbewapende", role: "lv", subRole: "bijv_bep" },
      { id: "s73t9", text: "agenten", role: "lv" },
      { id: "s73t10", text: "verschijnen.", role: "wg" }
    ]
  },
  {
    id: 74,
    label: "Zin 74: Luchtkwaliteit",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s74t1", text: "In", role: "bwb" },
      { id: "s74t2", text: "veel", role: "bwb", subRole: "bijv_bep" },
      { id: "s74t3", text: "Europese", role: "bwb", subRole: "bijv_bep" },
      { id: "s74t4", text: "steden", role: "bwb" },
      { id: "s74t5", text: "blijkt", role: "pv" },
      { id: "s74t6", text: "de", role: "ow" },
      { id: "s74t7", text: "luchtkwaliteit", role: "ow" },
      { id: "s74t8", text: "na", role: "bwb" },
      { id: "s74t9", text: "de", role: "bwb" },
      { id: "s74t10", text: "pandemiejaren", role: "bwb" },
      { id: "s74t11", text: "aanzienlijk", role: "nwd" },
      { id: "s74t12", text: "slechter", role: "nwd" },
      { id: "s74t13", text: "dan", role: "nwd" },
      { id: "s74t14", text: "verwacht.", role: "nwd" }
    ]
  },
  {
    id: 75,
    label: "Zin 75: Structurele problemen",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s75t1", text: "Volgens", role: "bwb" },
      { id: "s75t2", text: "recente", role: "bwb", subRole: "bijv_bep" },
      { id: "s75t3", text: "rapporten", role: "bwb" },
      { id: "s75t4", text: "heeft", role: "pv" },
      { id: "s75t5", text: "de", role: "ow" },
      { id: "s75t6", text: "regering", role: "ow" },
      { id: "s75t7", text: "de", role: "lv" },
      { id: "s75t8", text: "structurele", role: "lv", subRole: "bijv_bep" },
      { id: "s75t9", text: "problemen", role: "lv" },
      { id: "s75t10", text: "jarenlang", role: "bwb" },
      { id: "s75t11", text: "bewust", role: "bwb", newChunk: true },
      { id: "s75t12", text: "onderbelicht", role: "bwb", newChunk: true },
      { id: "s75t13", text: "gelaten.", role: "wg" }
    ]
  },
  {
    id: 76,
    label: "Zin 76: Kanteling in debat",
    predicateType: 'WG',
    level: 3,
    tokens: [
      { id: "s76t1", text: "De", role: "ow" },
      { id: "s76t2", text: "onderzoekers", role: "ow" },
      { id: "s76t3", text: "noemen", role: "pv" },
      { id: "s76t4", text: "deze", role: "lv" }, // User called it LV, technically Obj1
      { id: "s76t5", text: "onverwachte", role: "lv", subRole: "bijv_bep" },
      { id: "s76t6", text: "uitkomst", role: "lv" },
      { id: "s76t7", text: "in", role: "bwb" },
      { id: "s76t8", text: "hun", role: "bwb", subRole: "bijv_bep" },
      { id: "s76t9", text: "publicatie", role: "bwb" },
      { id: "s76t10", text: "een", role: "bwb", newChunk: true }, // Treating as BWB/Predicative Adjunct to fit user schema of LV/MV
      { id: "s76t11", text: "belangrijke", role: "bwb", subRole: "bijv_bep" },
      { id: "s76t12", text: "kanteling", role: "bwb" },
      { id: "s76t13", text: "in", role: "bwb" },
      { id: "s76t14", text: "het", role: "bwb" },
      { id: "s76t15", text: "debat.", role: "bwb" }
    ]
  },
  {
    id: 77,
    label: "Zin 77: Tekort aan personeel",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s77t1", text: "Sommige", role: "ow", subRole: "bijv_bep" },
      { id: "s77t2", text: "deskundigen", role: "ow" },
      { id: "s77t3", text: "waarschuwen", role: "pv" },
      { id: "s77t4", text: "al", role: "bwb" },
      { id: "s77t5", text: "jaren", role: "bwb" },
      { id: "s77t6", text: "voor", role: "vv" },
      { id: "s77t7", text: "een", role: "vv" },
      { id: "s77t8", text: "mogelijk", role: "vv", subRole: "bijv_bep" },
      { id: "s77t9", text: "tekort", role: "vv" },
      { id: "s77t10", text: "aan", role: "vv" },
      { id: "s77t11", text: "personeel.", role: "vv" }
    ]
  },
  {
    id: 78,
    label: "Zin 78: Positie minister",
    predicateType: 'NG',
    level: 3,
    tokens: [
      { id: "s78t1", text: "De", role: "ow" },
      { id: "s78t2", text: "positie", role: "ow" },
      { id: "s78t3", text: "van", role: "ow" },
      { id: "s78t4", text: "de", role: "ow" },
      { id: "s78t5", text: "minister", role: "ow" },
      { id: "s78t6", text: "bleef", role: "pv" },
      { id: "s78t7", text: "ondanks", role: "bwb" },
      { id: "s78t8", text: "de", role: "bwb" },
      { id: "s78t9", text: "zware", role: "bwb", subRole: "bijv_bep" },
      { id: "s78t10", text: "kritiek", role: "bwb" },
      { id: "s78t11", text: "politiek", role: "nwd" },
      { id: "s78t12", text: "zeer", role: "nwd" },
      { id: "s78t13", text: "kwetsbaar.", role: "nwd" }
    ]
  },
  {
    id: 79,
    label: "Zin 79: Lastige vragen",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s79t1", text: "Tijdens", role: "bwb" },
      { id: "s79t2", text: "het", role: "bwb" },
      { id: "s79t3", text: "debat", role: "bwb" },
      { id: "s79t4", text: "stelden", role: "pv" },
      { id: "s79t5", text: "verschillende", role: "ow", subRole: "bijv_bep" },
      { id: "s79t6", text: "Kamerleden", role: "ow" },
      { id: "s79t7", text: "lastige", role: "lv", subRole: "bijv_bep" },
      { id: "s79t8", text: "vragen", role: "lv" },
      { id: "s79t9", text: "over", role: "lv", subRole: "bijv_bep" },
      { id: "s79t10", text: "de", role: "lv", subRole: "bijv_bep" },
      { id: "s79t11", text: "financiering", role: "lv", subRole: "bijv_bep" },
      { id: "s79t12", text: "van", role: "lv", subRole: "bijv_bep" },
      { id: "s79t13", text: "het", role: "lv", subRole: "bijv_bep" },
      { id: "s79t14", text: "plan.", role: "lv", subRole: "bijv_bep"  }
    ]
  },
  {
    id: 80,
    label: "Zin 80: Commissie",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s80t1", text: "De", role: "ow" },
      { id: "s80t2", text: "commissie", role: "ow" },
      { id: "s80t3", text: "rekent", role: "pv" },
      { id: "s80t4", text: "op", role: "vv" },
      { id: "s80t5", text: "een", role: "vv" },
      { id: "s80t6", text: "snelle", role: "vv", subRole: "bijv_bep" },
      { id: "s80t7", text: "reactie", role: "vv" },
      { id: "s80t8", text: "van", role: "vv" },
      { id: "s80t9", text: "de", role: "vv" },
      { id: "s80t10", text: "betrokken", role: "vv", subRole: "bijv_bep" },
      { id: "s80t11", text: "instanties.", role: "vv" }
    ]
  },
  {
    id: 81,
    label: "Zin 81: Toon debat",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s81t1", text: "De", role: "ow" },
      { id: "s81t2", text: "toon", role: "ow" },
      { id: "s81t3", text: "van", role: "ow" },
      { id: "s81t4", text: "het", role: "ow" },
      { id: "s81t5", text: "debat", role: "ow" },
      { id: "s81t6", text: "is", role: "pv" },
      { id: "s81t7", text: "volgens", role: "bwb" },
      { id: "s81t8", text: "critici", role: "bwb" },
      { id: "s81t9", text: "de", role: "bwb", newChunk: true },
      { id: "s81t10", text: "afgelopen", role: "bwb", subRole: "bijv_bep" },
      { id: "s81t11", text: "jaren", role: "bwb" },
      { id: "s81t12", text: "verhard.", role: "nwd" }
    ]
  },
  {
    id: 82,
    label: "Zin 82: Toelichting",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s82t1", text: "In", role: "bwb" },
      { id: "s82t2", text: "de", role: "bwb" },
      { id: "s82t3", text: "toelichting", role: "bwb" },
      { id: "s82t4", text: "op", role: "bwb" },
      { id: "s82t5", text: "het", role: "bwb" },
      { id: "s82t6", text: "wetsvoorstel", role: "bwb" },
      { id: "s82t7", text: "verduidelijkte", role: "pv" },
      { id: "s82t8", text: "de", role: "ow" },
      { id: "s82t9", text: "minister", role: "ow" },
      { id: "s82t10", text: "gisteren", role: "bwb" },
      { id: "s82t11", text: "een", role: "lv" },
      { id: "s82t12", text: "aantal", role: "lv", subRole: "bijv_bep" },
      { id: "s82t13", text: "kernbegrippen.", role: "lv" }
    ]
  },
  {
    id: 83,
    label: "Zin 83: Uitgangspunten",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s83t1", text: "De", role: "ow" },
      { id: "s83t2", text: "uitgangspunten", role: "ow" },
      { id: "s83t3", text: "van", role: "ow", subRole: "bijv_bep" },
      { id: "s83t4", text: "het", role: "ow", subRole: "bijv_bep" },
      { id: "s83t5", text: "beleid", role: "ow", subRole: "bijv_bep" },
      { id: "s83t6", text: "lijken", role: "pv" },
      { id: "s83t7", text: "voor", role: "bwb" },
      { id: "s83t8", text: "veel", role: "bwb", subRole: "bijv_bep" },
      { id: "s83t9", text: "burgers", role: "bwb" },
      { id: "s83t10", text: "onvoldoende", role: "nwd" },
      { id: "s83t11", text: "doordacht.", role: "nwd" }
    ]
  },
  {
    id: 84,
    label: "Zin 84: Opa fit",
    predicateType: 'NG',
    level: 1,
    tokens: [
      { id: "s84t1", text: "Mijn", role: "ow", subRole: "bijv_bep" },
      { id: "s84t2", text: "opa", role: "ow" },
      { id: "s84t3", text: "is", role: "pv" },
      { id: "s84t4", text: "nog", role: "bwb" },
      { id: "s84t5", text: "steeds", role: "bwb" },
      { id: "s84t6", text: "erg", role: "nwd" },
      { id: "s84t7", text: "fit.", role: "nwd" }
    ]
  },
  {
    id: 85,
    label: "Zin 85: Lucht grijs",
    predicateType: 'NG',
    level: 1,
    tokens: [
      { id: "s85t1", text: "De", role: "ow" },
      { id: "s85t2", text: "lucht", role: "ow" },
      { id: "s85t3", text: "boven", role: "bwb", subRole: "bijv_bep" },
      { id: "s85t4", text: "de", role: "bwb", subRole: "bijv_bep" },
      { id: "s85t5", text: "stad", role: "bwb", subRole: "bijv_bep" },
      { id: "s85t6", text: "bleef", role: "pv" },
      { id: "s85t7", text: "de", role: "bwb" },
      { id: "s85t8", text: "hele", role: "bwb", subRole: "bijv_bep" },
      { id: "s85t9", text: "dag", role: "bwb" },
      { id: "s85t10", text: "grijs.", role: "nwd" }
    ]
  },
  {
    id: 86,
    label: "Zin 86: Leraar streng",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s86t1", text: "Onze", role: "ow", subRole: "bijv_bep" },
      { id: "s86t2", text: "leraar", role: "ow" },
      { id: "s86t3", text: "Nederlands", role: "ow" },
      { id: "s86t4", text: "is", role: "pv" },
      { id: "s86t5", text: "een", role: "nwd" },
      { id: "s86t6", text: "strenge", role: "nwd", subRole: "bijv_bep" },
      { id: "s86t7", text: "maar", role: "nwd" },
      { id: "s86t8", text: "rechtvaardige", role: "nwd", subRole: "bijv_bep" },
      { id: "s86t9", text: "docent.", role: "nwd" }
    ]
  },
  {
    id: 87,
    label: "Zin 87: Zaal modern",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s87t1", text: "De", role: "ow" },
      { id: "s87t2", text: "zaal", role: "ow" },
      { id: "s87t3", text: "werd", role: "pv" },
      { id: "s87t4", text: "na", role: "bwb" },
      { id: "s87t5", text: "de", role: "bwb" },
      { id: "s87t6", text: "verbouwing", role: "bwb" },
      { id: "s87t7", text: "een", role: "nwd" },
      { id: "s87t8", text: "moderne", role: "nwd", subRole: "bijv_bep" },
      { id: "s87t9", text: "ontmoetingsplek.", role: "nwd" }
    ]
  },
  {
    id: 88,
    label: "Zin 88: Sfeer gespannen",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s88t1", text: "De", role: "ow" },
      { id: "s88t2", text: "sfeer", role: "ow" },
      { id: "s88t3", text: "in", role: "ow" },
      { id: "s88t4", text: "de", role: "ow" },
      { id: "s88t5", text: "klas", role: "ow" },
      { id: "s88t6", text: "is", role: "pv" },
      { id: "s88t7", text: "de", role: "bwb" },
      { id: "s88t8", text: "laatste", role: "bwb", subRole: "bijv_bep" },
      { id: "s88t9", text: "weken", role: "bwb" },
      { id: "s88t10", text: "behoorlijk", role: "nwd" },
      { id: "s88t11", text: "gespannen.", role: "nwd" }
    ]
  },
  {
    id: 89,
    label: "Zin 89: Uitleg onduidelijk",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s89t1", text: "Zijn", role: "ow", subRole: "bijv_bep" },
      { id: "s89t2", text: "uitleg", role: "ow" },
      { id: "s89t3", text: "blijft", role: "pv" },
      { id: "s89t4", text: "voor", role: "bwb" },
      { id: "s89t5", text: "mij", role: "bwb" },
      { id: "s89t6", text: "nogal", role: "nwd" },
      { id: "s89t7", text: "onduidelijk.", role: "nwd" }
    ]
  },
  {
    id: 90,
    label: "Zin 90: Regels ingewikkeld",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s90t1", text: "De", role: "ow" },
      { id: "s90t2", text: "nieuwe", role: "ow", subRole: "bijv_bep" },
      { id: "s90t3", text: "regels", role: "ow" },
      { id: "s90t4", text: "lijken", role: "pv" },
      { id: "s90t5", text: "voor", role: "bwb" },
      { id: "s90t6", text: "veel", role: "bwb", subRole: "bijv_bep" },
      { id: "s90t7", text: "mensen", role: "bwb" },
      { id: "s90t8", text: "te", role: "nwd" },
      { id: "s90t9", text: "ingewikkeld.", role: "nwd" }
    ]
  },
  {
    id: 91,
    label: "Zin 91: Boek aanrader",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s91t1", text: "Dit", role: "ow" },
      { id: "s91t2", text: "boek", role: "ow" },
      { id: "s91t3", text: "is", role: "pv" },
      { id: "s91t4", text: "voor", role: "bwb" },
      { id: "s91t5", text: "mij", role: "bwb" },
      { id: "s91t6", text: "een", role: "nwd" },
      { id: "s91t7", text: "echte", role: "nwd", subRole: "bijv_bep" },
      { id: "s91t8", text: "aanrader.", role: "nwd" }
    ]
  },
  {
    id: 92,
    label: "Zin 92: Resultaten positief",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s92t1", text: "De", role: "ow" },
      { id: "s92t2", text: "resultaten", role: "ow" },
      { id: "s92t3", text: "van", role: "ow", subRole: "bijv_bep" },
      { id: "s92t4", text: "het", role: "ow", subRole: "bijv_bep" },
      { id: "s92t5", text: "onderzoek", role: "ow", subRole: "bijv_bep" },
      { id: "s92t6", text: "blijken", role: "pv" },
      { id: "s92t7", text: "verrassend", role: "nwd" },
      { id: "s92t8", text: "positief.", role: "nwd" }
    ]
  },
  {
    id: 93,
    label: "Zin 93: Buurman voorzitter",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s93t1", text: "Mijn", role: "ow", subRole: "bijv_bep" },
      { id: "s93t2", text: "buurman", role: "ow" },
      { id: "s93t3", text: "is", role: "pv" },
      { id: "s93t4", text: "sinds", role: "bwb" },
      { id: "s93t5", text: "kort", role: "bwb" },
      { id: "s93t6", text: "voorzitter", role: "nwd" },
      { id: "s93t7", text: "van", role: "nwd", subRole: "bijv_bep" },
      { id: "s93t8", text: "de", role: "nwd", subRole: "bijv_bep" },
      { id: "s93t9", text: "vereniging.", role: "nwd", subRole: "bijv_bep" }
    ]
  },
  {
    id: 94,
    label: "Zin 94: Sfeer gezelliger",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s94t1", text: "De", role: "ow" },
      { id: "s94t2", text: "sfeer", role: "ow" },
      { id: "s94t3", text: "op", role: "ow", subRole: "bijv_bep" },
      { id: "s94t4", text: "het", role: "ow", subRole: "bijv_bep" },
      { id: "s94t5", text: "feest", role: "ow", subRole: "bijv_bep" },
      { id: "s94t6", text: "werd", role: "pv" },
      { id: "s94t7", text: "laat", role: "bwb" },
      { id: "s94t8", text: "op", role: "bwb" },
      { id: "s94t9", text: "de", role: "bwb" },
      { id: "s94t10", text: "avond", role: "bwb" },
      { id: "s94t11", text: "steeds", role: "nwd" },
      { id: "s94t12", text: "gezelliger.", role: "nwd" }
    ]
  },
  {
    id: 95,
    label: "Zin 95: Opgave uitdaging",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s95t1", text: "Deze", role: "ow" },
      { id: "s95t2", text: "opgave", role: "ow" },
      { id: "s95t3", text: "blijkt", role: "pv" },
      { id: "s95t4", text: "voor", role: "bwb" },
      { id: "s95t5", text: "veel", role: "bwb", subRole: "bijv_bep" },
      { id: "s95t6", text: "leerlingen", role: "bwb" },
      { id: "s95t7", text: "een", role: "nwd" },
      { id: "s95t8", text: "grote", role: "nwd", subRole: "bijv_bep" },
      { id: "s95t9", text: "uitdaging.", role: "nwd" }
    ]
  },
  {
    id: 96,
    label: "Zin 96: Idee realistisch",
    predicateType: 'NG',
    level: 3,
    tokens: [
      { id: "s96t1", text: "Jouw", role: "ow", subRole: "bijv_bep" },
      { id: "s96t2", text: "idee", role: "ow" },
      { id: "s96t3", text: "is", role: "pv" },
      { id: "s96t4", text: "op", role: "bwb" },
      { id: "s96t5", text: "dit", role: "bwb" },
      { id: "s96t6", text: "moment", role: "bwb" },
      { id: "s96t7", text: "het", role: "nwd" },
      { id: "s96t8", text: "meest", role: "nwd", subRole: "bijv_bep" },
      { id: "s96t9", text: "realistische", role: "nwd", subRole: "bijv_bep" },
      { id: "s96t10", text: "plan.", role: "nwd" }
    ]
  },
  {
    id: 97,
    label: "Zin 97: Stemming somber",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s97t1", text: "De", role: "ow" },
      { id: "s97t2", text: "stemming", role: "ow" },
      { id: "s97t3", text: "in", role: "ow", subRole: "bijv_bep" },
      { id: "s97t4", text: "het", role: "ow", subRole: "bijv_bep" },
      { id: "s97t5", text: "land", role: "ow", subRole: "bijv_bep" },
      { id: "s97t6", text: "blijft", role: "pv" },
      { id: "s97t7", text: "na", role: "bwb" },
      { id: "s97t8", text: "het", role: "bwb" },
      { id: "s97t9", text: "schandaal", role: "bwb" },
      { id: "s97t10", text: "erg", role: "nwd" },
      { id: "s97t11", text: "somber.", role: "nwd" }
    ]
  },
  {
    id: 98,
    label: "Zin 98: Opmerkingen kwetsend",
    predicateType: 'NG',
    level: 2,
    tokens: [
      { id: "s98t1", text: "Zijn", role: "ow", subRole: "bijv_bep" },
      { id: "s98t2", text: "opmerkingen", role: "ow" },
      { id: "s98t3", text: "waren", role: "pv" },
      { id: "s98t4", text: "tijdens", role: "bwb" },
      { id: "s98t5", text: "het", role: "bwb" },
      { id: "s98t6", text: "gesprek", role: "bwb" },
      { id: "s98t7", text: "bijzonder", role: "nwd" },
      { id: "s98t8", text: "kwetsend.", role: "nwd" }
    ]
  },
  {
    id: 99,
    label: "Zin 99: Lever in",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s99t1", text: "Lever", role: "pv" },
      { id: "s99t2", text: "die", role: "lv" },
      { id: "s99t3", text: "opdracht", role: "lv" },
      { id: "s99t4", text: "uiterlijk", role: "bwb" },
      { id: "s99t5", text: "morgen", role: "bwb" },
      { id: "s99t6", text: "in.", role: "wg" }
    ]
  },
  {
    id: 100,
    label: "Zin 100: Noteer direct",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s100t1", text: "Noteer", role: "pv" },
      { id: "s100t2", text: "dat", role: "lv" },
      { id: "s100t3", text: "telefoonnummer", role: "lv" },
      { id: "s100t4", text: "direct", role: "bwb" },
      { id: "s100t5", text: "in", role: "bwb", newChunk: true },
      { id: "s100t6", text: "je", role: "bwb", subRole: "bijv_bep" },
      { id: "s100t7", text: "agenda.", role: "bwb" }
    ]
  },
  {
    id: 101,
    label: "Zin 101: Denk na",
    predicateType: 'WG',
    level: 3,
    tokens: [
      { id: "s101t1", text: "Denk", role: "pv" },
      { id: "s101t2", text: "maar", role: "bwb" },
      { id: "s101t3", text: "eens", role: "bwb", newChunk: true },
      { id: "s101t4", text: "goed", role: "bwb", newChunk: true },
      { id: "s101t5", text: "na", role: "wg" },
      { id: "s101t6", text: "over", role: "vv" },
      { id: "s101t7", text: "jouw", role: "vv", subRole: "bijv_bep" },
      { id: "s101t8", text: "toekomst.", role: "vv" }
    ]
  },
  {
    id: 102,
    label: "Zin 102: Geef aan",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s102t1", text: "Geef", role: "pv" },
      { id: "s102t2", text: "me", role: "mv" },
      { id: "s102t3", text: "dat", role: "lv" },
      { id: "s102t4", text: "boek", role: "lv" },
      { id: "s102t5", text: "eens", role: "bwb" },
      { id: "s102t6", text: "aan.", role: "wg" }
    ]
  },
  {
    id: 103,
    label: "Zin 103: Ben stil",
    predicateType: 'NG',
    level: 3,
    tokens: [
      { id: "s103t1", text: "Ben", role: "pv" },
      { id: "s103t2", text: "eens", role: "bwb" },
      { id: "s103t3", text: "even", role: "bwb", newChunk: true },
      { id: "s103t4", text: "stil.", role: "nwd" }
    ]
  },
  {
    id: 104,
    label: "Zin 104: Twee duiven",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s104t1", text: "Er", role: "bwb" },
      { id: "s104t2", text: "zitten", role: "pv" },
      { id: "s104t3", text: "twee", role: "ow", subRole: "bijv_bep" },
      { id: "s104t4", text: "duiven", role: "ow" },
      { id: "s104t5", text: "op", role: "bwb" },
      { id: "s104t6", text: "het", role: "bwb" },
      { id: "s104t7", text: "dak.", role: "bwb" }
    ]
  },
  {
    id: 105,
    label: "Zin 105: Ernstig ongeluk",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s105t1", text: "Er", role: "bwb" },
      { id: "s105t2", text: "is", role: "pv" },
      { id: "s105t3", text: "gisteren", role: "bwb" },
      { id: "s105t4", text: "een", role: "ow" },
      { id: "s105t5", text: "ernstig", role: "ow", subRole: "bijv_bep" },
      { id: "s105t6", text: "ongeluk", role: "ow" },
      { id: "s105t7", text: "gebeurd.", role: "wg" }
    ]
  },
  {
    id: 106,
    label: "Zin 106: Vreemde sfeer",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s106t1", text: "Er", role: "bwb" },
      { id: "s106t2", text: "hangt", role: "pv" },
      { id: "s106t3", text: "een", role: "ow" },
      { id: "s106t4", text: "vreemde", role: "ow", subRole: "bijv_bep" },
      { id: "s106t5", text: "sfeer", role: "ow" },
      { id: "s106t6", text: "in", role: "bwb" },
      { id: "s106t7", text: "dit", role: "bwb" },
      { id: "s106t8", text: "huis.", role: "bwb" }
    ]
  },
  {
    id: 107,
    label: "Zin 107: Ontbrekende pagina's",
    predicateType: 'WG',
    level: 3,
    tokens: [
      { id: "s107t1", text: "Er", role: "bwb" },
      { id: "s107t2", text: "ontbreken", role: "pv" },
      { id: "s107t3", text: "drie", role: "ow", subRole: "bijv_bep" },
      { id: "s107t4", text: "belangrijke", role: "ow", subRole: "bijv_bep" },
      { id: "s107t5", text: "pagina's", role: "ow" },
      { id: "s107t6", text: "in", role: "bwb" },
      { id: "s107t7", text: "dit", role: "bwb" },
      { id: "s107t8", text: "rapport.", role: "bwb" }
    ]
  },
  {
    id: 108,
    label: "Zin 108: Wolven",
    predicateType: 'WG',
    level: 3,
    tokens: [
      { id: "s108t1", text: "Er", role: "bwb" },
      { id: "s108t2", text: "schijnen", role: "pv" },
      { id: "s108t3", text: "in", role: "bwb" },
      { id: "s108t4", text: "dit", role: "bwb" },
      { id: "s108t5", text: "gebied", role: "bwb" },
      { id: "s108t6", text: "wolven", role: "ow" },
      { id: "s108t7", text: "te", role: "wg" },
      { id: "s108t8", text: "leven.", role: "wg" }
    ]
  },
  {
    id: 109,
    label: "Zin 109: Verheugen (WG)",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s109t1", text: "Wij", role: "ow" },
      { id: "s109t2", text: "verheugen", role: "pv" },
      { id: "s109t3", text: "ons", role: "wg" },
      { id: "s109t4", text: "op", role: "vv" },
      { id: "s109t5", text: "het", role: "vv" },
      { id: "s109t6", text: "schoolreisje.", role: "vv" }
    ]
  },
  {
    id: 110,
    label: "Zin 110: Scheren (LV)",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s110t1", text: "De", role: "ow" },
      { id: "s110t2", text: "acteur", role: "ow" },
      { id: "s110t3", text: "scheert", role: "pv" },
      { id: "s110t4", text: "zich", role: "wg" },
      { id: "s110t5", text: "voor", role: "bwb" },
      { id: "s110t6", text: "de", role: "bwb" },
      { id: "s110t7", text: "spiegel.", role: "bwb" }
    ]
  },
  {
    id: 111,
    label: "Zin 111: Terugtrekken (WG)",
    predicateType: 'WG',
    level: 3,
    tokens: [
      { id: "s111t1", text: "De", role: "ow" },
      { id: "s111t2", text: "vijand", role: "ow" },
      { id: "s111t3", text: "trok", role: "pv" },
      { id: "s111t4", text: "zich", role: "wg" },
      { id: "s111t5", text: "gisteren", role: "bwb" },
      { id: "s111t6", text: "terug.", role: "wg" }
    ]
  },
  {
    id: 112,
    label: "Zin 112: Herinneren (WG)",
    predicateType: 'WG',
    level: 3,
    tokens: [
      { id: "s112t1", text: "Ik", role: "ow" },
      { id: "s112t2", text: "herinner", role: "pv" },
      { id: "s112t3", text: "me", role: "wg" },
      { id: "s112t4", text: "dat", role: "lv" },
      { id: "s112t5", text: "voorval", role: "lv" },
      { id: "s112t6", text: "nog", role: "bwb" },
      { id: "s112t7", text: "goed.", role: "bwb", newChunk: true }
    ]
  },
  {
    id: 114,
    label: "Zin 114: Dat geheim",
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: "s114t1", text: "Dat", role: "lv", subRole: "bijv_bep" },
      { id: "s114t2", text: "geheim", role: "lv" },
      { id: "s114t3", text: "vertel", role: "pv" },
      { id: "s114t4", text: "ik", role: "ow" },
      { id: "s114t5", text: "niemand.", role: "mv" }
    ]
  },
  {
    id: 115,
    label: "Zin 115: Veel lawaai",
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: "s115t1", text: "Veel", role: "lv", subRole: "bijv_bep" },
      { id: "s115t2", text: "lawaai", role: "lv" },
      { id: "s115t3", text: "maakten", role: "pv" },
      { id: "s115t4", text: "ze", role: "ow" },
      { id: "s115t5", text: "niet.", role: "bwb" }
    ]
  },
  {
    id: 116,
    label: "Zin 116: Die film",
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: "s116t1", text: "Die", role: "lv" },
      { id: "s116t2", text: "film", role: "lv" },
      { id: "s116t3", text: "wil", role: "pv" },
      { id: "s116t4", text: "ik", role: "ow" },
      { id: "s116t5", text: "absoluut", role: "bwb" },
      { id: "s116t6", text: "zien.", role: "wg" }
    ]
  },
  {
    id: 117,
    label: "Zin 117: Jouw mening",
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: "s117t1", text: "Jouw", role: "lv", subRole: "bijv_bep" },
      { id: "s117t2", text: "mening", role: "lv" },
      { id: "s117t3", text: "deel", role: "pv" },
      { id: "s117t4", text: "ik", role: "ow" },
      { id: "s117t5", text: "niet.", role: "bwb" }
    ]
  },
  {
    id: 118,
    label: "Zin 118: Prachtige cadeau",
    predicateType: 'WG',
    level: 3,
    tokens: [
      { id: "s118t1", text: "Dat", role: "lv", subRole: "bijv_bep" },
      { id: "s118t2", text: "prachtige", role: "lv", subRole: "bijv_bep" },
      { id: "s118t3", text: "cadeau", role: "lv" },
      { id: "s118t4", text: "heeft", role: "pv" },
      { id: "s118t5", text: "mijn", role: "ow", subRole: "bijv_bep" },
      { id: "s118t6", text: "tante", role: "ow" },
      { id: "s118t7", text: "zelf", role: "bwb" },
      { id: "s118t8", text: "gemaakt.", role: "wg" }
    ]
  },
  {
    id: 119,
    label: "Zin 119: Opruimen?",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s119t1", text: "Ruim", role: "pv" },
      { id: "s119t2", text: "jij", role: "ow" },
      { id: "s119t3", text: "je", role: "lv", subRole: "bijv_bep" },
      { id: "s119t4", text: "rommel", role: "lv" },
      { id: "s119t5", text: "even", role: "bwb" },
      { id: "s119t6", text: "op?", role: "wg" }
    ]
  },
  {
    id: 120,
    label: "Zin 120: Terechtwijzen?",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s120t1", text: "Wijs", role: "pv" },
      { id: "s120t2", text: "jij", role: "ow" },
      { id: "s120t3", text: "de", role: "lv" },
      { id: "s120t4", text: "nieuwe", role: "lv", subRole: "bijv_bep" },
      { id: "s120t5", text: "leerling", role: "lv" },
      { id: "s120t6", text: "even", role: "bwb" },
      { id: "s120t7", text: "terecht?", role: "wg" }
    ]
  },
  {
    id: 121,
    label: "Zin 121: Inleveren?",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s121t1", text: "Leveren", role: "pv" },
      { id: "s121t2", text: "jullie", role: "ow" },
      { id: "s121t3", text: "de", role: "lv" },
      { id: "s121t4", text: "boeken", role: "lv" },
      { id: "s121t5", text: "vandaag", role: "bwb" },
      { id: "s121t6", text: "weer", role: "bwb", newChunk: true },
      { id: "s121t7", text: "in?", role: "wg" }
    ]
  },
  {
    id: 122,
    label: "Zin 122: Uitstellen?",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s122t1", text: "Stel", role: "pv" },
      { id: "s122t2", text: "jij", role: "ow" },
      { id: "s122t3", text: "de", role: "lv" },
      { id: "s122t4", text: "vergadering", role: "lv" },
      { id: "s122t5", text: "weer", role: "bwb" },
      { id: "s122t6", text: "uit?", role: "wg" }
    ]
  },
  {
    id: 123,
    label: "Zin 123: Meenemen?",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s123t1", text: "Neem", role: "pv" },
      { id: "s123t2", text: "jij", role: "ow" },
      { id: "s123t3", text: "morgen", role: "bwb" },
      { id: "s123t4", text: "iets", role: "lv", subRole: "bijv_bep" },
      { id: "s123t5", text: "lekkers", role: "lv" },
      { id: "s123t6", text: "mee?", role: "wg" }
    ]
  },
  {
    id: 124,
    label: "Zin 124: Soep serveren",
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: "s124t1", text: "De", role: "ow" },
      { id: "s124t2", text: "ober", role: "ow" },
      { id: "s124t3", text: "serveert", role: "pv" },
      { id: "s124t4", text: "ons", role: "mv" },
      { id: "s124t5", text: "de", role: "lv" },
      { id: "s124t6", text: "soep.", role: "lv" }
    ]
  },
  {
    id: 125,
    label: "Zin 125: Mooie ketting",
    predicateType: 'WG',
    level: 3,
    tokens: [
      { id: "s125t1", text: "Mijn", role: "ow", subRole: "bijv_bep" },
      { id: "s125t2", text: "vader", role: "ow" },
      { id: "s125t3", text: "kocht", role: "pv" },
      { id: "s125t4", text: "mijn", role: "mv", subRole: "bijv_bep" },
      { id: "s125t5", text: "moeder", role: "mv" },
      { id: "s125t6", text: "een", role: "lv" },
      { id: "s125t7", text: "mooie", role: "lv", subRole: "bijv_bep" },
      { id: "s125t8", text: "ketting.", role: "lv" }
    ]
  },
  {
    id: 126,
    label: "Zin 126: Hoofdpijn",
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: "s126t1", text: "Die", role: "ow" },
      { id: "s126t2", text: "grapjassen", role: "ow" },
      { id: "s126t3", text: "bezorgden", role: "pv" },
      { id: "s126t4", text: "de", role: "mv" },
      { id: "s126t5", text: "leraar", role: "mv" },
      { id: "s126t6", text: "hoofdpijn.", role: "lv" }
    ]
  },
  {
    id: 127,
    label: "Zin 127: Van harte gunnen",
    predicateType: 'WG',
    level: 2,
    tokens: [
      { id: "s127t1", text: "Ik", role: "ow" },
      { id: "s127t2", text: "gun", role: "pv" },
      { id: "s127t3", text: "jou", role: "mv" },
      { id: "s127t4", text: "die", role: "lv" },
      { id: "s127t5", text: "eerste", role: "lv", subRole: "bijv_bep" },
      { id: "s127t6", text: "prijs", role: "lv" },
      { id: "s127t7", text: "van", role: "bwb" },
      { id: "s127t8", text: "harte.", role: "bwb" }
    ]
  },
  {
    id: 128,
    label: "Zin 128: Toegang weigeren",
    predicateType: 'WG',
    level: 1,
    tokens: [
      { id: "s128t1", text: "Ze", role: "ow" },
      { id: "s128t2", text: "weigerde", role: "pv" },
      { id: "s128t3", text: "hem", role: "mv" },
      { id: "s128t4", text: "de", role: "lv" },
      { id: "s128t5", text: "toegang.", role: "lv" }
    ]
  },
  {
    id: 201,
    label: "Zin 201: Thuiswerken",
    predicateType: 'WG',
    level: 4,
    tokens: [
      { id: "c1t1", text: "Omdat", role: "bijzin", subRole: "vw_onder" },
      { id: "c1t2", text: "ik", role: "bijzin" },
      { id: "c1t3", text: "verkouden", role: "bijzin" },
      { id: "c1t4", text: "ben,", role: "bijzin" },
      { id: "c1t5", text: "werk", role: "pv" },
      { id: "c1t6", text: "ik", role: "ow" },
      { id: "c1t7", text: "vandaag", role: "bwb" },
      { id: "c1t8", text: "thuis.", role: "bwb" }
    ]
  },
  {
    id: 202,
    label: "Zin 202: Beroemde zanger",
    predicateType: 'WG',
    level: 4,
    tokens: [
      { id: "c2t1", text: "De", role: "ow" },
      { id: "c2t2", text: "beroemde", role: "ow", subRole: "bijv_bep" },
      { id: "c2t3", text: "zanger", role: "ow" },
      { id: "c2t4", text: "rende", role: "pv" },
      { id: "c2t5", text: "naar", role: "bwb" },
      { id: "c2t6", text: "zijn", role: "bwb", subRole: "bijv_bep" },
      { id: "c2t7", text: "auto,", role: "bwb" },
      { id: "c2t8", text: "omdat", role: "bijzin", subRole: "vw_onder" },
      { id: "c2t9", text: "een", role: "bijzin" },
      { id: "c2t10", text: "horde", role: "bijzin" },
      { id: "c2t11", text: "fans", role: "bijzin" },
      { id: "c2t12", text: "hem", role: "bijzin" },
      { id: "c2t13", text: "achtervolgde.", role: "bijzin" }
    ]
  },
  {
    id: 203,
    label: "Zin 203: In de war (Nevenschikking)",
    predicateType: 'NG',
    level: 4,
    tokens: [
      { id: "c3t1", text: "Ik", role: "ow" },
      { id: "c3t2", text: "ben", role: "pv" },
      { id: "c3t3", text: "in", role: "nwd" },
      { id: "c3t4", text: "de", role: "nwd" },
      { id: "c3t5", text: "war,", role: "nwd" },
      { id: "c3t6", text: "maar", role: "vw_neven" }, // Nevenschikking splits de zinnen
      { id: "c3t7", text: "ik", role: "ow" },
      { id: "c3t8", text: "bedenk", role: "pv" },
      { id: "c3t9", text: "wel", role: "bwb" },
      { id: "c3t10", text: "een", role: "lv" },
      { id: "c3t11", text: "oplossing.", role: "lv" }
    ]
  },
  {
    id: 204,
    label: "Zin 204: Max piloot (Nevenschikking)",
    predicateType: 'NG',
    level: 4,
    tokens: [
      { id: "c4t1", text: "Sinds", role: "bwb" },
      { id: "c4t2", text: "vorig", role: "bwb", subRole: "bijv_bep" },
      { id: "c4t3", text: "jaar", role: "bwb" },
      { id: "c4t4", text: "is", role: "pv" },
      { id: "c4t5", text: "Max,", role: "ow" },
      { id: "c4t6", text: "mijn", role: "bijst" },
      { id: "c4t7", text: "buurjongen,", role: "bijst" },
      { id: "c4t8", text: "piloot,", role: "nwd" },
      { id: "c4t9", text: "want", role: "vw_neven" },
      { id: "c4t10", text: "hij", role: "ow" },
      { id: "c4t11", text: "heeft", role: "pv" },
      { id: "c4t12", text: "zijn", role: "lv", subRole: "bijv_bep" },
      { id: "c4t13", text: "studie", role: "lv" },
      { id: "c4t14", text: "afgerond.", role: "wg" }
    ]
  },
  {
    id: 205,
    label: "Zin 205: Schoonmoeder",
    predicateType: 'NG',
    level: 4,
    tokens: [
      { id: "c5t1", text: "Mijn", role: "ow", subRole: "bijv_bep" },
      { id: "c5t2", text: "schoonmoeder", role: "ow" },
      { id: "c5t3", text: "is", role: "pv" },
      { id: "c5t4", text: "zeer", role: "nwd", subRole: "bijv_bep" },
      { id: "c5t5", text: "goedgelovig,", role: "nwd" },
      { id: "c5t6", text: "daardoor", role: "bijzin", subRole: "vw_onder" }, // Voegwoordelijk bijwoord, fungeert als verbinding
      { id: "c5t7", text: "wordt", role: "bijzin" },
      { id: "c5t8", text: "zij", role: "bijzin" },
      { id: "c5t9", text: "vaak", role: "bijzin" },
      { id: "c5t10", text: "bedrogen.", role: "bijzin" }
    ]
  },
  {
    id: 206,
    label: "Zin 206: Schurk",
    predicateType: 'WG',
    level: 4,
    tokens: [
      { id: "c6t1", text: "Terwijl", role: "bijzin", subRole: "vw_onder" },
      { id: "c6t2", text: "zij", role: "bijzin" },
      { id: "c6t3", text: "haar", role: "bijzin" },
      { id: "c6t4", text: "auto", role: "bijzin" },
      { id: "c6t5", text: "achteruit", role: "bijzin" },
      { id: "c6t6", text: "inparkeerde,", role: "bijzin" },
      { id: "c6t7", text: "trok", role: "pv" },
      { id: "c6t8", text: "een", role: "ow" },
      { id: "c6t9", text: "schurk", role: "ow" },
      { id: "c6t10", text: "het", role: "lv" },
      { id: "c6t11", text: "portier", role: "lv" },
      { id: "c6t12", text: "open.", role: "wg" }
    ]
  },
  {
    id: 207,
    label: "Zin 207: Sleutel kwijt (Nevenschikking)",
    predicateType: 'WG',
    level: 4,
    tokens: [
      { id: "c7t1", text: "Ik", role: "ow" },
      { id: "c7t2", text: "had", role: "pv" },
      { id: "c7t3", text: "willen", role: "wg" },
      { id: "c7t4", text: "komen,", role: "wg" },
      { id: "c7t5", text: "maar", role: "vw_neven" },
      { id: "c7t6", text: "ik", role: "ow" },
      { id: "c7t7", text: "was", role: "pv" },
      { id: "c7t8", text: "mijn", role: "lv", subRole: "bijv_bep" },
      { id: "c7t9", text: "sleutel", role: "lv" },
      { id: "c7t10", text: "kwijt", role: "wg" }, // 'kwijt' is deel van WG 'kwijt zijn'
      { id: "c7t11", text: "waardoor", role: "bijzin", subRole: "vw_onder" },
      { id: "c7t12", text: "ik", role: "bijzin" },
      { id: "c7t13", text: "niet", role: "bijzin" },
      { id: "c7t14", text: "kon", role: "bijzin" },
      { id: "c7t15", text: "afsluiten.", role: "bijzin" }
    ]
  },
  {
    id: 208,
    label: "Zin 208: Reis Azië",
    predicateType: 'WG',
    level: 4,
    tokens: [
      { id: "c8t1", text: "Toen", role: "bijzin", subRole: "vw_onder" },
      { id: "c8t2", text: "ik", role: "bijzin" },
      { id: "c8t3", text: "droomde", role: "bijzin" },
      { id: "c8t4", text: "over", role: "bijzin" },
      { id: "c8t5", text: "een", role: "bijzin" },
      { id: "c8t6", text: "verre", role: "bijzin" },
      { id: "c8t7", text: "reis", role: "bijzin" },
      { id: "c8t8", text: "door", role: "bijzin" },
      { id: "c8t9", text: "Azië,", role: "bijzin" },
      { id: "c8t10", text: "werd", role: "pv" },
      { id: "c8t11", text: "ik", role: "ow" },
      { id: "c8t12", text: "plotseling", role: "bwb" },
      { id: "c8t13", text: "gebeld.", role: "wg" }
    ]
  },
  {
    id: 209,
    label: "Zin 209: Groen drankje (Nevenschikking)",
    predicateType: 'WG',
    level: 4,
    tokens: [
      { id: "c9t1", text: "Hij", role: "ow" },
      { id: "c9t2", text: "gaf", role: "pv" },
      { id: "c9t3", text: "mij", role: "mv" },
      { id: "c9t4", text: "een", role: "lv" },
      { id: "c9t5", text: "groen", role: "lv", subRole: "bijv_bep" },
      { id: "c9t6", text: "drankje", role: "lv" },
      { id: "c9t7", text: "maar", role: "vw_neven" },
      { id: "c9t8", text: "ik", role: "ow" },
      { id: "c9t9", text: "weigerde", role: "pv" },
      { id: "c9t10", text: "het.", role: "lv" }
    ]
  },
  {
    id: 210,
    label: "Zin 210: Hamburgers of kip (Nevenschikking)",
    predicateType: 'WG',
    level: 4,
    tokens: [
      { id: "c10t1", text: "Houd", role: "pv" },
      { id: "c10t2", text: "je", role: "ow" },
      { id: "c10t3", text: "van", role: "vv" },
      { id: "c10t4", text: "hamburgers", role: "vv" },
      { id: "c10t5", text: "of", role: "vw_neven" },
      { id: "c10t6", text: "heb", role: "pv" },
      { id: "c10t7", text: "je", role: "ow" },
      { id: "c10t8", text: "liever", role: "bwb" },
      { id: "c10t9", text: "kip?", role: "lv" }
    ]
  }
];