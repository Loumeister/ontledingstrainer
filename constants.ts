
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
  TOO_MANY_SPLITS: "Dit zinsdeel is nog niet compleet – er hoort nog minstens één woord bij. Welke woorden vormen samen één zinsdeel? Voeg ze samen.",
  MISSING_SPLIT: "Dit blokje bevat meer dan één zinsdeel. Lees de woorden één voor één en kijk waar een nieuw zinsdeel begint – knip daar.",
  INCONSISTENT: "De woorden in dit blokje horen bij verschillende zinsdelen. Kijk goed welke woorden echt bij elkaar horen en verdeel opnieuw."
};

// Matrix for Role Mismatch Feedback (Step 2)
// Indexed as FEEDBACK_MATRIX[studentLabel][correctLabel]
export const FEEDBACK_MATRIX: Record<string, Record<string, string>> = {
  // Student zegt ONDERWERP, maar het is eigenlijk…
  'ow': {
    'pv': "Dit is een vervoegd werkwoord, geen onderwerp. Doe de tijdsproef: zet de zin in een andere tijd – welk woord verandert mee? Dat is de persoonsvorm.",
    'lv': "Stel de vraag 'Wie of wat + PV?' – het antwoord daarop is het onderwerp. Dit zinsdeel beantwoordt juist de vraag 'Wie of wat + gezegde + OW?' en is dus het lijdend voorwerp.",
    'mv': "Het onderwerp vind je met 'Wie of wat + PV?' Dit zinsdeel beantwoordt juist 'Aan/voor wie + gezegde + OW + LV?' – het is het meewerkend voorwerp.",
    'bwb': "Dit zinsdeel geeft extra informatie (waar? wanneer? hoe?) en is een bijwoordelijke bepaling. Het onderwerp vind je met 'Wie of wat + PV?'",
    'wg': "Dit zinsdeel drukt de handeling zelf uit (het gezegde); het is niet de uitvoerder ervan. Het onderwerp vind je met 'Wie of wat + PV?'",
    'nwd': "Het werkwoord in deze zin is een koppelwerkwoord (zijn, worden, lijken…). Dit zinsdeel zegt iets over het onderwerp en is het naamwoordelijk gezegde.",
    'vv': "Hoort het voorzetsel in dit zinsdeel vast bij het werkwoord? Dan is het een voorzetselvoorwerp. Het onderwerp vind je met 'Wie of wat + PV?'",
    'bijzin': "Dit zinsdeel bevat een eigen onderwerp en persoonsvorm – het is een bijzin. Het onderwerp van de hoofdzin vind je met 'Wie of wat + PV?'",
    'bijst': "Dit zinsdeel hernoemt een ander zinsdeel en staat vaak tussen komma's – het is een bijstelling, geen onderwerp.",
  },

  // Student zegt PERSOONSVORM, maar het is eigenlijk…
  'pv': {
    'wg': "Er zitten meerdere werkwoorden in het gezegde. De PV is alleen het werkwoord dat verandert bij tijdsverandering – de rest hoort bij het werkwoordelijk gezegde.",
    'ow': "De persoonsvorm is altijd een vervoegd werkwoord. Dit zinsdeel is geen werkwoord: het is het antwoord op 'Wie of wat + PV?'",
    'lv': "De persoonsvorm is een vervoegd werkwoord. Dit zinsdeel is geen werkwoord – het beantwoordt 'Wie of wat + gezegde + OW?'",
    'bwb': "De persoonsvorm is een vervoegd werkwoord. Dit zinsdeel is geen werkwoord, maar geeft extra informatie (waar, wanneer, hoe).",
    'nwd': "De persoonsvorm is het vervoegde werkwoord. Dit zinsdeel beschrijft een eigenschap van het onderwerp – het is het naamwoordelijk gezegde.",
    'mv': "De persoonsvorm is een vervoegd werkwoord. Dit zinsdeel is geen werkwoord – het is de ontvanger van de handeling (aan/voor wie).",
    'vv': "De persoonsvorm is een vervoegd werkwoord. Dit zinsdeel bevat een voorzetsel dat vast bij het werkwoord hoort: het is een voorzetselvoorwerp.",
  },

  // Student zegt WERKWOORDELIJK GEZEGDE, maar het is eigenlijk…
  'wg': {
    'pv': "De PV is het ene werkwoord dat verandert als je de zin in een andere tijd zet. Het werkwoordelijk gezegde omvat alle werkwoorden samen. Welk specifiek woord verandert hier?",
    'nwd': "Is het werkwoord in deze zin een koppelwerkwoord (zijn, worden, lijken, schijnen, blijven)? Dan is dit het naamwoordelijk gezegde, niet het werkwoordelijk gezegde.",
    'lv': "Het gezegde bestaat uit werkwoorden. Dit zinsdeel is geen werkwoord – het beantwoordt de vraag 'Wie of wat + gezegde + OW?' en is het lijdend voorwerp.",
    'bwb': "Het gezegde bestaat uit werkwoorden. Dit zinsdeel geeft extra informatie over hoe, waar of wanneer: het is een bijwoordelijke bepaling.",
    'ow': "Dit zinsdeel voert de handeling uit – het is het onderwerp, niet de handeling zelf. Het onderwerp vind je met 'Wie of wat + PV?'",
    'mv': "Dit zinsdeel is de ontvanger (aan/voor wie), niet het gezegde. Het meewerkend voorwerp vind je met 'Aan/voor wie + gezegde + OW + LV?'",
    'vv': "Dit zinsdeel bevat een voorzetsel dat vast bij het werkwoord hoort: het is een voorzetselvoorwerp, geen deel van het gezegde.",
  },

  // Student zegt NAAMWOORDELIJK GEZEGDE, maar het is eigenlijk…
  'nwd': {
    'wg': "Kijk naar het hoofdwerkwoord: is het een koppelwerkwoord (zijn, worden, lijken, schijnen)? Zo niet, dan is het een werkwoordelijk gezegde, geen naamwoordelijk gezegde.",
    'lv': "Het naamwoordelijk gezegde beschrijft het onderwerp via een koppelwerkwoord. Dit zinsdeel ondergaat juist een handeling – het beantwoordt 'Wie of wat + gezegde + OW?'",
    'bwb': "Het naamwoordelijk gezegde zegt iets over het onderwerp via een koppelwerkwoord. Dit zinsdeel geeft juist extra informatie over hoe, waar of wanneer.",
    'ow': "Het naamwoordelijk gezegde beschrijft het onderwerp. Dit zinsdeel ís het onderwerp: het voert de handeling uit. Vraag: 'Wie of wat + PV?'",
    'pv': "Het naamwoordelijk gezegde is geen werkwoord – het beschrijft een eigenschap. De persoonsvorm is het vervoegde werkwoord dat bij tijdsverandering meeverandert.",
    'mv': "Dit zinsdeel is de ontvanger van de handeling, geen eigenschap van het onderwerp. Vraag: 'Aan/voor wie + gezegde + OW + LV?'",
    'vv': "Hoort het voorzetsel vast bij het werkwoord? Dan is dit een voorzetselvoorwerp, geen naamwoordelijk gezegde.",
  },

  // Student zegt LIJDEND VOORWERP, maar het is eigenlijk…
  'lv': {
    'ow': "Stel de vraag 'Wie of wat + PV?' – het antwoord is het onderwerp. Dit zinsdeel voert de handeling uit, het ondergaat die niet.",
    'vv': "Let op het voorzetsel: hoort het vast bij het werkwoord (bijv. 'wachten op')? Dan is dit een voorzetselvoorwerp, geen lijdend voorwerp.",
    'bwb': "Dit zinsdeel geeft extra informatie over waar, wanneer of hoe – het is een bijwoordelijke bepaling. Het LV beantwoordt 'Wie of wat + gezegde + OW?'",
    'mv': "Dit zinsdeel is de ontvanger (aan/voor wie), niet degene die de handeling ondergaat. Het LV beantwoordt 'Wie of wat + gezegde + OW?', het MV 'Aan/voor wie?'",
    'nwd': "Is het werkwoord een koppelwerkwoord (zijn, worden, lijken)? Dan beschrijft dit zinsdeel een eigenschap van het onderwerp: het is het naamwoordelijk gezegde.",
    'bijst': "Dit zinsdeel hernoemt een eerder zinsdeel, vaak tussen komma's – het is een bijstelling. Het LV beantwoordt 'Wie of wat + gezegde + OW?'",
    'pv': "De persoonsvorm is een vervoegd werkwoord. Dit zinsdeel is geen werkwoord.",
    'wg': "Het gezegde bestaat uit werkwoorden. Dit zinsdeel bevat geen werkwoord – het beantwoordt 'Wie of wat + gezegde + OW?'",
    'bijzin': "Dit zinsdeel bevat een eigen onderwerp en persoonsvorm – het is een bijzin, geen lijdend voorwerp. Kijk of er een voegwoord aan het begin staat.",
  },

  // Student zegt MEEWERKEND VOORWERP, maar het is eigenlijk…
  'mv': {
    'ow': "Het onderwerp voert de handeling uit: 'Wie of wat + PV?' Dit zinsdeel is niet de ontvanger.",
    'lv': "Het lijdend voorwerp ondergaat de handeling: 'Wie of wat + gezegde + OW?' Het MV beantwoordt juist 'Aan/voor wie?'",
    'vv': "Hoort het voorzetsel vast bij het werkwoord (bijv. 'denken aan')? Dan is het een voorzetselvoorwerp. Bij het MV kun je 'aan' of 'voor' ervoor zetten.",
    'bwb': "Dit zinsdeel geeft informatie over hoe, waar of wanneer – het is een bijwoordelijke bepaling, geen meewerkend voorwerp.",
    'pv': "De persoonsvorm is een vervoegd werkwoord. Dit zinsdeel is geen werkwoord.",
    'wg': "Dit zinsdeel bevat werkwoorden die samen het gezegde vormen, geen meewerkend voorwerp.",
    'nwd': "Is het werkwoord een koppelwerkwoord? Dan beschrijft dit het onderwerp – het is het naamwoordelijk gezegde.",
    'bijzin': "Dit zinsdeel bevat een eigen onderwerp en persoonsvorm – het is een bijzin.",
  },

  // Student zegt VOORZETSELVOORWERP, maar het is eigenlijk…
  'vv': {
    'bwb': "Hoort het voorzetsel echt vast bij het werkwoord? Als het los extra informatie geeft (waar, wanneer), is het een bijwoordelijke bepaling.",
    'lv': "Bij een voorzetselvoorwerp hoort het voorzetsel vast bij het werkwoord. Is dat hier zo? Kun je vragen: 'Wie of wat + gezegde + OW?' Dan is het het LV.",
    'mv': "Bij het MV kun je 'aan' of 'voor' ervoor zetten. Bij een VZV is het voorzetsel niet verwisselbaar: het hoort vast bij het werkwoord.",
    'ow': "Dit zinsdeel voert de handeling uit: vraag 'Wie of wat + PV?' Het is geen voorzetselvoorwerp.",
    'pv': "De persoonsvorm is een vervoegd werkwoord. Dit zinsdeel is geen werkwoord.",
    'wg': "Dit zinsdeel bevat werkwoorden van het gezegde, geen voorzetselvoorwerp.",
    'nwd': "Dit is het naamwoordelijk gezegde (eigenschap van het onderwerp via een koppelwerkwoord), geen voorzetselvoorwerp.",
    'bijzin': "Dit zinsdeel bevat een eigen onderwerp en persoonsvorm – het is een bijzin.",
  },

  // Student zegt BIJWOORDELIJKE BEPALING, maar het is eigenlijk…
  'bwb': {
    'vv': "Hoort het voorzetsel vast bij het werkwoord (bijv. 'wachten op', 'denken aan')? Dan is het een voorzetselvoorwerp, geen bijwoordelijke bepaling.",
    'lv': "Dit zinsdeel ondergaat de handeling – vraag: 'Wie of wat + gezegde + OW?' Een bijwoordelijke bepaling beantwoordt 'Hoe? Waar? Wanneer?'",
    'ow': "Dit zinsdeel voert de handeling uit: 'Wie of wat + PV?' Een bijwoordelijke bepaling beantwoordt juist 'Hoe? Waar? Wanneer?'",
    'bijzin': "Dit zinsdeel bevat een eigen onderwerp en persoonsvorm – het is een bijzin. Kijk of er een voegwoord aan het begin staat.",
    'mv': "Dit zinsdeel is de ontvanger van de handeling: 'Aan/voor wie?' Een bijwoordelijke bepaling beantwoordt 'Hoe? Waar? Wanneer?'",
    'nwd': "Dit zinsdeel zegt iets over de toestand van het onderwerp via een koppelwerkwoord – het is het naamwoordelijk gezegde.",
    'bijst': "Dit zinsdeel hernoemt een ander zinsdeel, vaak tussen komma's – het is een bijstelling, geen bijwoordelijke bepaling.",
    'pv': "De persoonsvorm is een vervoegd werkwoord. Dit zinsdeel is geen werkwoord.",
    'wg': "Dit zinsdeel bevat werkwoorden die samen het gezegde vormen, geen bijwoordelijke bepaling.",
  },

  // Student zegt BIJSTELLING, maar het is eigenlijk…
  'bijst': {
    'bijv_bep': "Een bijvoeglijke bepaling voegt een eigenschap toe aan één woord (bijv. 'de grote hond'). Een bijstelling hernoemt een heel zinsdeel, vaak tussen komma's.",
    'ow': "Dit zinsdeel voert de handeling uit: 'Wie of wat + PV?' Het is geen bijstelling.",
    'lv': "Dit zinsdeel ondergaat de handeling: 'Wie of wat + gezegde + OW?' Het is geen bijstelling.",
    'bwb': "Dit zinsdeel geeft informatie over hoe, waar of wanneer – het is een bijwoordelijke bepaling, geen bijstelling.",
    'pv': "De persoonsvorm is een vervoegd werkwoord, geen bijstelling.",
    'mv': "Dit zinsdeel is de ontvanger (aan/voor wie) – het is het meewerkend voorwerp, geen bijstelling.",
    'vv': "Hoort het voorzetsel vast bij het werkwoord? Dan is het een voorzetselvoorwerp, geen bijstelling.",
    'bijzin': "Dit zinsdeel bevat een eigen onderwerp en persoonsvorm – het is een bijzin, geen bijstelling.",
  },

  // Student zegt BIJZIN, maar het is eigenlijk…
  'bijzin': {
    'bwb': "Een bijzin heeft een eigen onderwerp en persoonsvorm. Bevat dit zinsdeel die? Zo niet, dan geeft het extra informatie (hoe, waar, wanneer) en is het een bijwoordelijke bepaling.",
    'ow': "Een bijzin bevat een eigen onderwerp en persoonsvorm. Bevat dit zinsdeel die? Zo niet, dan voert het de handeling uit en is het het onderwerp.",
    'lv': "Een bijzin bevat een eigen onderwerp en persoonsvorm. Bevat dit zinsdeel die? Zo niet, dan ondergaat het de handeling en is het het lijdend voorwerp.",
    'mv': "Een bijzin bevat een eigen onderwerp en persoonsvorm. Bevat dit zinsdeel die? Zo niet, dan is het de ontvanger en is het het meewerkend voorwerp.",
    'vv': "Een bijzin bevat een eigen onderwerp en persoonsvorm. Bevat dit zinsdeel die? Zo niet, hoort het voorzetsel vast bij het werkwoord? Dan is het een voorzetselvoorwerp.",
    'pv': "De persoonsvorm is een vervoegd werkwoord. Dit zinsdeel is geen bijzin.",
    'wg': "Dit zinsdeel bevat werkwoorden van het gezegde, geen bijzin.",
  },

  // Student zegt ONDERSCHIKKEND VOEGWOORD, maar het is eigenlijk…
  'vw_onder': {
    'vw_neven': "Een onderschikkend voegwoord leidt een bijzin in (omdat, dat, als, toen, wanneer). Een nevenschikkend voegwoord verbindt twee gelijkwaardige zinnen (en, maar, want, of, dus).",
    'bwb': "Een onderschikkend voegwoord leidt een bijzin in. Dit zinsdeel geeft juist extra informatie (hoe, waar, wanneer) en is een bijwoordelijke bepaling.",
  },

  // Student zegt NEVENSCHIKKEND VOEGWOORD, maar het is eigenlijk…
  'vw_neven': {
    'vw_onder': "Een nevenschikkend voegwoord verbindt gelijkwaardige zinnen (en, maar, want, of, dus). Een onderschikkend voegwoord leidt juist een bijzin in (omdat, dat, als, toen).",
    'bwb': "Een voegwoord verbindt zinnen. Dit zinsdeel geeft extra informatie over hoe, waar of wanneer – het is een bijwoordelijke bepaling.",
  },
};

export const FEEDBACK_SWAP = {
  BIJZIN_HAS_FUNCTIE: (functieName: string) =>
    `Goed gezien dat dit ${functieName} is! Maar omdat het een bijzin is (met eigen onderwerp en PV), gebruik je eerst 'Bijzin' als hoofdlabel. Sleep daarna '${functieName}' naar de functierij eronder.`,
};

export const FEEDBACK_BIJZIN_FUNCTIE = {
  MISSING: "Goed, je hebt de bijzin herkend! Welke rol speelt deze bijzin in de hoofdzin? Bijv. lijdend voorwerp, bijwoordelijke bepaling… Sleep het juiste label naar de functierij.",
  WRONG: (expected: string) => `De bijzin is juist! Maar de functie klopt nog niet. Welke vraag beantwoordt deze bijzin in de hoofdzin? Het juiste antwoord is: ${expected}.`,
};

export const HINTS = {
  MISSING_PV: "Tip: Zoek eerst de persoonsvorm. Zet de zin in een andere tijd – welk woord verandert mee? Dat is de PV.",
  MISSING_OW: "Tip: Zoek het onderwerp. Stel de vraag: 'Wie of wat + PV?' Het antwoord is het onderwerp.",
  MISSING_WG: "Tip: Zijn er meer werkwoorden in de zin dan alleen de PV? Die vormen samen met de PV het werkwoordelijk gezegde.",
  MISSING_NG: "Tip: Het werkwoord in deze zin is een koppelwerkwoord (zijn, worden, lijken…). Wat wordt er over het onderwerp gezegd? Dat is het naamwoordelijk gezegde.",
  MISSING_LV: "Tip: Is er een lijdend voorwerp? Vraag: 'Wie of wat + gezegde + OW?' Als je een antwoord vindt, is dat het LV.",
  MISSING_MV: "Tip: Is er een meewerkend voorwerp? Vraag: 'Aan/voor wie + gezegde + OW + LV?'",
  MISSING_VV: "Tip: Staat er een voorzetsel dat vast bij het werkwoord hoort? Bijv. 'wachten op', 'denken aan'. Dat zinsdeel is het voorzetselvoorwerp.",
  MISSING_BWB: "Tip: Geeft een zinsdeel extra informatie over hoe, waar, wanneer of waarom? Dat is een bijwoordelijke bepaling.",
  MISSING_BIJZIN: "Tip: Bevat een deel van de zin een eigen onderwerp en persoonsvorm (ingeleid door een voegwoord)? Dat is een bijzin.",
  MISSING_BIJST: "Tip: Staat er een tussenstukje (vaak tussen komma's) dat een eerder zinsdeel hernoemt? Dat is een bijstelling.",
  MISSING_BIJZIN_FUNCTIE: "Tip: Deze bijzin vervult ook een functie in de hoofdzin (bijv. lijdend voorwerp, bijwoordelijke bepaling). Sleep het juiste label naar de functierij.",
  generic: (roleLabel: string) => `Tip: Er ontbreekt nog een label. Zoek het zinsdeel '${roleLabel}'.`,
  ALL_PLACED: "Goed, je hebt alle labels geplaatst! Controleer nu of elk label op de juiste plek staat.",
};

// Study tips per role, shown on the ScoreScreen for common mistakes
export const SCORE_TIPS: Record<string, string> = {
  'Persoonsvorm': 'Doe altijd de tijdsproef: welk woord verandert als je de zin in een andere tijd zet?',
  'Onderwerp': 'Vraag: "Wie of wat + PV?" Het antwoord is het onderwerp.',
  'Lijdend Voorwerp': 'Vraag: "Wie of wat + gezegde + OW?" Het antwoord is het lijdend voorwerp.',
  'Meewerkend Voorwerp': 'Vraag: "Aan/voor wie + gezegde + OW + LV?" Het antwoord is het meewerkend voorwerp.',
  'Bijwoordelijke Bepaling': 'Bijwoordelijke bepalingen beantwoorden: "Hoe? Waar? Wanneer? Waarom?"',
  'Voorzetselvoorwerp': 'Het voorzetsel hoort vast bij het werkwoord (bijv. denken aan, wachten op).',
  'Werkwoordelijk Gezegde': 'Alle werkwoorden samen (inclusief de PV) vormen het werkwoordelijk gezegde.',
  'Naamwoordelijk Gezegde': 'Na een koppelwerkwoord (zijn, worden, lijken) volgt het naamwoordelijk gezegde.',
  'Bijzin': 'Een bijzin heeft een eigen onderwerp en persoonsvorm, vaak ingeleid door een voegwoord.',
  'Bijstelling': 'Een bijstelling hernoemt een eerder zinsdeel en staat vaak tussen komma\'s.',
  'Verdeling': 'Lees de zin woord voor woord en bepaal bij elk woord: hoort dit nog bij het vorige zinsdeel?',
  'Nevenschikkend VW': 'Nevenschikkende voegwoorden: en, maar, want, of, dus. Ze verbinden gelijkwaardige zinnen.',
  'Onderschikkend VW': 'Onderschikkende voegwoorden: omdat, dat, als, toen, wanneer. Ze leiden een bijzin in.',
  'Bijvoeglijke Bepaling': 'Een bijvoeglijke bepaling voegt een eigenschap toe aan een zelfstandig naamwoord.',
};
