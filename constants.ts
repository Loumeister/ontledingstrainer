
import { RoleDefinition } from './types';

export const ROLES: RoleDefinition[] = [
  // Core Constituents
  { 
    key: 'pv', 
    label: 'Persoonsvorm', 
    shortLabel: 'PV', 
    colorClass: 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-100', 
    borderColorClass: 'border-red-200 dark:border-red-700' 
  },
  { 
    key: 'ow', 
    label: 'Onderwerp', 
    shortLabel: 'OW', 
    colorClass: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-100', 
    borderColorClass: 'border-blue-200 dark:border-blue-700' 
  },
  { 
    key: 'lv', 
    label: 'Lijdend Voorwerp', 
    shortLabel: 'LV', 
    colorClass: 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-100', 
    borderColorClass: 'border-green-200 dark:border-green-700' 
  },
  { 
    key: 'mv', 
    label: 'Meewerkend Voorwerp', 
    shortLabel: 'MV', 
    colorClass: 'bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-100', 
    borderColorClass: 'border-purple-200 dark:border-purple-700' 
  },
  { 
    key: 'bwb', 
    label: 'Bijwoordelijke Bepaling', 
    shortLabel: 'BWB', 
    colorClass: 'bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-100', 
    borderColorClass: 'border-orange-200 dark:border-orange-700' 
  },
  { 
    key: 'vv', 
    label: 'Voorzetselvoorwerp', 
    shortLabel: 'VZV', 
    colorClass: 'bg-pink-50 text-pink-700 dark:bg-pink-900/40 dark:text-pink-100', 
    borderColorClass: 'border-pink-200 dark:border-pink-700' 
  },
  { 
    key: 'bijst', 
    label: 'Bijstelling', 
    shortLabel: 'BIJST', 
    colorClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-100', 
    borderColorClass: 'border-indigo-200 dark:border-indigo-700' 
  },
  
  // Predicate Parts (WG/NG)
  { 
    key: 'wg', 
    label: 'Werkwoordelijk Gezegde', 
    shortLabel: 'WG', 
    colorClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-100', 
    borderColorClass: 'border-rose-300 dark:border-rose-600' 
  },
  { 
    key: 'nwd', 
    label: 'Naamwoordelijk Gezegde', 
    shortLabel: 'NG', 
    colorClass: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-100', 
    borderColorClass: 'border-yellow-200 dark:border-yellow-600' 
  },

  // Structural/Clause Roles
  { 
    key: 'bijzin', 
    label: 'Bijzin', 
    shortLabel: 'BIJZIN', 
    colorClass: 'bg-purple-100 text-purple-800 dark:bg-fuchsia-900/40 dark:text-fuchsia-100', 
    borderColorClass: 'border-purple-300 dark:border-fuchsia-700' 
  },
  { 
    key: 'vw_neven', 
    label: 'Nevenschikkend VW', 
    shortLabel: 'NEVEN', 
    colorClass: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200', 
    borderColorClass: 'border-stone-300 dark:border-stone-600' 
  },
  
  // Internal Structure (Sub-roles)
  { 
    key: 'bijv_bep', 
    label: 'Bijvoeglijke Bepaling', 
    shortLabel: 'BB', 
    colorClass: 'bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-100', 
    borderColorClass: 'border-teal-200 dark:border-teal-700', 
    isSubOnly: true 
  },
  { 
    key: 'vw_onder', 
    label: 'Onderschikkend VW', 
    shortLabel: 'ONDER', 
    colorClass: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200', 
    borderColorClass: 'border-stone-300 dark:border-stone-600', 
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
  // ONDERWERP
  'ow': {
    'pv': "Is dit een werkwoord? Check: Wie of wat + PV?",
    'lv': "Ondergaat dit de handeling, of voert het die uit? Check: Wie of wat + PV?",
    'mv': "Ontvangt dit iets, of doet het zelf iets? Check: Wie of wat + PV?",
    'bwb': "Geeft dit plaats/tijd/manier aan? Of is het antwoord op: Wie of wat + PV?",
    'wg': "Is dit de uitvoerder van de handeling, of drukt het de handeling zelf uit?"
  },

  // PERSOONSVORM
  'pv': {
    'wg': "Je pakte het hele gezegde. Welk werkwoord verandert van tijd? Dat is de PV.",
    'ow': "Dit is geen werkwoord. Zoek het werkwoord dat van tijd kan veranderen."
  },

  // WERKWOORDELIJK GEZEGDE
  'wg': {
    'pv': "Dit is maar één woord. Welke werkwoorden horen er nog bij?",
    'ng': "Drukt het werkwoord iets uit wat er wordt gedaan, of iets wat er is of wordt?",
    'lv': "Is dit een 'ding'/'persoon', of een werkwoordsvorm die bij het gezegde hoort?",
    'bwb': "Is dit een werkwoord, of geeft het extra info over tijd, plaats of manier?",
    'ow': "Is dit de handeling zelf, of de uitvoerder ervan?"
  },

  // NAAMWOORDELIJK GEZEGDE
  'ng': {
    'wg': "Drukt het werkwoord iets uit wat er wordt gedaan, of iets wat er is of wordt?",
    'lv': "Beschrijft dit een eigenschap van het OW, of ondergaat het een handeling?",
    'bwb': "Zegt dit iets over de toestand van het OW, of geeft het aan hoe iets gebeurt?",
    'ow': "Voert dit de actie uit? Check: Wie of wat + PV?"
  },

  // LIJDEND VOORWERP
  'lv': {
    'ow': "Voert dit de actie uit of ondergaat het die? Check: Wie of wat + PV?",
    'vv': "Begint dit met een voorzetsel dat vast bij het werkwoord hoort?",
    'bwb': "Geeft dit info over waar, wanneer of waarom?",
    'mv': "Kun je 'aan' of 'voor' voor dit zinsdeel denken?",
    'ng': "Drukt het werkwoord iets uit wat er is of wordt, of een actie?",
    'bijst': "Is dit een andere naam voor een eerder zinsdeel? Kun je het weglaten?"
  },

  // MEEWERKEND VOORWERP
  'mv': {
    'ow': "Voert dit de actie uit? Check: Wie of wat + PV?",
    'lv': "Wie/wat ondergaat de handeling, of aan/voor wie?",
    'vv': "Kun je 'aan'/'voor' weglaten, of zit het voorzetsel vast bij het werkwoord?",
    'bwb': "Geeft dit extra info over hoe, waar of wanneer, of ontvangt het de handeling?"
  },

  // VOORZETSELVOORWERP
  'vv': {
    'bwb': "Geeft dit los van het werkwoord een plaats of tijd aan?",
    'lv': "Hoort het voorzetsel echt vast bij het werkwoord?",
    'mv': "Kun je het voorzetsel vervangen door 'aan' of 'voor'?"
  },

  // BIJWOORDELIJKE BEPALING
  'bwb': {
    'vv': "Hoort dit voorzetsel vast bij het werkwoord?",
    'lv': "Ondergaat dit zinsdeel de actie?",
    'ow': "Kun je 'Wie of wat + PV?' beantwoorden met dit zinsdeel?",
    'bijzin': "Heeft dit zinsdeel een eigen PV?",
    'mv': "Kun je 'aan' of 'voor' voor dit zinsdeel denken?",
    'ng': "Zegt dit iets over de toestand van het OW via het werkwoord?",
    'bijst': "Staat dit tussen komma's als andere naam voor een eerder zinsdeel?"
  },

  // BIJSTELLING
  'bijst': {
    'bijv_bep': "Voegt dit een eigenschap toe aan een zinsdeel, of is het een andere naam daarvoor?",
    'ow': "Voert dit de actie uit? Check: Wie of wat + PV?",
    'lv': "Ondergaat dit de actie?",
    'bwb': "Geeft dit tijd, plaats of manier aan?"
  },

  // BIJZIN
  'bijzin': {
    'bwb': "Staat de PV achteraan in dit zinsdeel? Zo niet, geeft het dan extra info over tijd, plaats of manier?",
    'ow': "Staat de PV achteraan in dit zinsdeel? Zo niet, wie of wat voert de actie dan uit?",
    'lv': "Staat de PV achteraan in dit zinsdeel? Zo niet, wat ondergaat de handeling dan?",
    'mv': "Staat de PV achteraan in dit zinsdeel? Zo niet, aan of voor wie is de handeling dan gericht?",
    'vv': "Staat de PV achteraan in dit zinsdeel? Zo niet, hoort het voorzetsel dan vast bij het werkwoord?"
  },

  // ONDERSCHIKKEND VOEGWOORD
  'vw_onder': {
    'vw_neven': "Verbindt dit twee gelijkwaardige zinnen, of leidt het een bijzin in?",
    'bwb': "Leidt dit echt een bijzin in, of geeft het extra info over tijd, plaats of manier?"
  },

  // NEVENSCHIKKEND VOEGWOORD
  'vw_neven': {
    'vw_onder': "Verbindt dit twee gelijkwaardige zinnen, of leidt het een bijzin in?",
    'bwb': "Knoopt dit twee hoofdzinnen aaneen, of geeft het extra info over tijd, plaats of manier?"
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
