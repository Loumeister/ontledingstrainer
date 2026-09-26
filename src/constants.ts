import { RoleDefinition, DifficultyLevel, RoleKey, FeedbackEntry } from './types';

export const ROLES: RoleDefinition[] = [
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
  {
    key: 'wg',
    label: 'Werkwoordelijk Gezegde',
    shortLabel: 'WG',
    colorClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-100',
    borderColorClass: 'border-rose-300 dark:border-rose-600'
  },
  {
    key: 'wwd',
    label: 'Werkwoordelijk Deel',
    shortLabel: 'WWD',
    colorClass: 'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-100',
    borderColorClass: 'border-rose-200 dark:border-rose-600',
    isSubOnly: true
  },
  {
    key: 'ng',
    label: 'Naamwoordelijk Gezegde',
    shortLabel: 'NG',
    colorClass: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-100',
    borderColorClass: 'border-yellow-200 dark:border-yellow-600'
  },
  {
    key: 'nwd',
    label: 'Naamwoordelijk Deel',
    shortLabel: 'NWD',
    colorClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-100',
    borderColorClass: 'border-yellow-300 dark:border-yellow-500',
    isSubOnly: true
  },
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

// Role sets per difficulty level. A role is shown in the toolbar when it belongs to the
// current level's set (or when the current sentence actually uses it — see RoleToolbar).
export const ROLES_PER_LEVEL: Record<DifficultyLevel, RoleKey[]> = {
  0: ['pv', 'ow', 'lv', 'mv', 'bwb'],
  1: ['pv', 'ow', 'lv', 'mv', 'bwb', 'wg', 'ng'],
  2: ['pv', 'ow', 'lv', 'mv', 'bwb', 'vv', 'wg', 'ng'],
  3: ['pv', 'ow', 'lv', 'mv', 'bwb', 'vv', 'bijst', 'bijzin', 'vw_neven', 'wg', 'ng'],
  4: ['pv', 'ow', 'lv', 'mv', 'bwb', 'vv', 'bijst', 'bijzin', 'vw_neven', 'wg', 'ng'],
};

export const LEVEL_NAMES: Record<DifficultyLevel, string> = {
  0: 'Instap',
  1: 'Basis',
  2: 'Middel',
  3: 'Hoog',
  4: 'Samengesteld',
};

/** Eén regel per niveau: wat kan de leerling verwachten? */
export const LEVEL_SUMMARIES: Record<DifficultyLevel, string> = {
  0: 'Korte zinnen (4-7 woorden), alleen werkwoordelijk gezegde.',
  1: 'Werkwoordelijk én naamwoordelijk gezegde.',
  2: 'Langere zinnen met meer variatie.',
  3: 'Meer zinsdelen, bijstelling, vz.vw en soms een bijzin.',
  4: 'Zinnen met een hoofdzin en een bijzin.',
};

export const LEVEL_TOOLTIPS: Record<DifficultyLevel, string> = {
  0: 'Alleen zinnen met een werkwoordelijk gezegde (WG). Korte, eenvoudige zinnen (4-7 woorden) met: persoonsvorm, onderwerp, lijdend voorwerp, meewerkend voorwerp en bijwoordelijke bepaling.',
  1: 'Zinnen met zowel werkwoordelijk (WG) als naamwoordelijk gezegde (NG). Je leert het verschil herkennen en oefent met samengestelde gezegdes (WG/NG + werkwoordelijk deel).',
  2: 'Langere zinnen met meer variatie en meer bijwoordelijke bepalingen. Heb je het voorzetselvoorwerp al gehad? Zet het dan aan bij "Moeilijke onderdelen".',
  3: 'Het voorzetselvoorwerp doet standaard mee. Bijstellingen en nevenschikking (en, maar, of) komen erbij. Meer zinsdelen per zin en lastiger woordvolgorde. Sommige zinnen bevatten een bijzin.',
  4: 'Samengestelde zinnen met bijzinnen en onderschikking. Je herkent hoofd- en bijzinnen, benoemt hun functie en ontleedt complexe zinsstructuren.',
};

export const FEEDBACK_STRUCTURE = {
  TOO_MANY_SPLITS: "Hier is teveel geknipt.",
  MISSING_SPLIT: "Hier hoort ergens nog een knip.",
  INCONSISTENT: "Dit deel bevat woorden die niet bij elkaar horen."
};

const ROLE_REPAIR: Record<string, string> = {
  pv: "Verander de zin van tijd. Welk werkwoord verandert mee?",
  wwd: "Welk werkwoord hoort bij het naamwoordelijk gezegde, naast de persoonsvorm?",
};

/**
 * Controlestap voor het label dat de leerling KOOS. De leerling toetst zijn eigen keuze
 * aan wat dat zinsdeel doet, en ontdekt zo zelf dat het niet past. We noemen niet het
 * juiste label, want een verkeerd label bewijst niet welke denkfout er achter zit.
 */
const CHOSEN_ROLE_CHECK: Record<string, string> = {
  pv: "Een persoonsvorm verandert mee als je de zin in een andere tijd zet. Gebeurt dat met dit deel?",
  ow: "Het onderwerp bepaalt of de persoonsvorm enkelvoud of meervoud is. Verandert de persoonsvorm als je dit deel meervoud maakt?",
  lv: "Een lijdend voorwerp ondergaat de handeling van het onderwerp. Welke handeling voert het onderwerp hier uit, en ondergaat dit deel die?",
  mv: "Een meewerkend voorwerp krijgt iets of heeft er belang bij. Kun je vragen: aan of voor wie? En is dit deel het antwoord?",
  bwb: "Een bijwoordelijke bepaling geeft extra informatie, zoals tijd, plaats of manier. Blijft de zin compleet als je dit deel weglaat?",
  vv: "Een voorzetselvoorwerp begint met een voorzetsel dat vastzit aan het werkwoord, zoals wachten óp. Begint dit deel met zo'n vast voorzetsel?",
  wg: "Een werkwoordelijk gezegde bestaat alleen uit werkwoorden en zegt wat er gebeurt. Is elk woord in dit deel een werkwoord?",
  ng: "Een naamwoordelijk gezegde heeft een koppelwerkwoord en zegt wat het onderwerp is, wordt of blijft. Kun je het werkwoord vervangen door 'zijn' zonder dat de betekenis verandert?",
  bijzin: "Een bijzin heeft een eigen onderwerp en persoonsvorm. Kun je die allebei in dit deel aanwijzen?",
  bijst: "Een bijstelling geeft een andere naam aan het zinsdeel ervoor. Noemt dit deel hetzelfde nog een keer?",
  vw_onder: "Een onderschikkend voegwoord leidt een bijzin in. Staat na dit woord een deel met een eigen onderwerp en persoonsvorm?",
  vw_neven: "Een nevenschikkend voegwoord verbindt twee gelijkwaardige delen. Kunnen de delen ervoor en erna allebei los staan?",
};

/** Alle doelrollen van één gekozen label krijgen dezelfde controlestap, tenzij een paar een eigen contrast heeft. */
function checkChosen(chosen: string, correctRoles: string[], contrasts: Record<string, FeedbackEntry> = {}): Record<string, FeedbackEntry> {
  const row: Record<string, FeedbackEntry> = {};
  for (const correct of correctRoles) row[correct] = contrasts[correct] ?? CHOSEN_ROLE_CHECK[chosen];
  return row;
}

/**
 * FEEDBACK_MATRIX[gekozen label][juiste rol]. De feedback toetst het GEKOZEN label:
 * wie een NG als LV aanwijst, krijgt de vraag of dit deel wel iets ondergaat —
 * niet de definitie van het NG, want dan verklappen we het antwoord zonder denkstap.
 */
export const FEEDBACK_MATRIX: Record<string, Record<string, FeedbackEntry>> = {
  ow: checkChosen('ow', ['pv', 'lv', 'mv', 'bwb', 'wg', 'ng', 'vv', 'bijzin', 'bijst']),
  pv: checkChosen('pv', ['wg', 'ow', 'lv', 'bwb', 'ng', 'mv', 'vv']),
  wg: checkChosen('wg', ['pv', 'ng', 'lv', 'bwb', 'ow', 'mv', 'vv', 'wwd'], {
    // WG op de PV: gedeeltelijk goed, want de PV hoort bij het gezegde (zie validateAnswer).
    pv: ROLE_REPAIR.pv,
    ng: "Zegt het gezegde wat er gebeurt, of wat het onderwerp is, wordt of blijft?",
    wwd: ROLE_REPAIR.wwd,
  }),
  ng: checkChosen('ng', ['wg', 'lv', 'bwb', 'ow', 'pv', 'mv', 'vv', 'wwd'], {
    wg: "Zegt het gezegde wat het onderwerp is, wordt of blijft, of wat er gebeurt?",
    wwd: ROLE_REPAIR.wwd,
  }),
  lv: checkChosen('lv', ['ow', 'vv', 'bwb', 'mv', 'ng', 'bijst', 'pv', 'wg', 'bijzin']),
  mv: checkChosen('mv', ['ow', 'lv', 'vv', 'bwb', 'pv', 'wg', 'ng', 'bijzin']),
  vv: checkChosen('vv', ['bwb', 'lv', 'mv', 'ow', 'pv', 'wg', 'ng', 'bijzin'], {
    bwb: "Vraagt het gezegde om dit voorzetsel, of kun je de bepaling vrij weglaten of vervangen?",
  }),
  bwb: checkChosen('bwb', ['vv', 'lv', 'ow', 'bijzin', 'mv', 'ng', 'bijst', 'pv', 'wg'], {
    vv: "Is dit vrije omstandigheidsinformatie, of vraagt het gezegde om juist dit voorzetsel?",
  }),
  bijst: checkChosen('bijst', ['bijv_bep', 'ow', 'lv', 'bwb', 'pv', 'mv', 'vv', 'bijzin'], {
    bijv_bep: "Bepaalt dit deel één woord nader, of geeft het een heel zinsdeel een andere naam?",
  }),
  bijzin: checkChosen('bijzin', ['bwb', 'ow', 'lv', 'mv', 'vv', 'pv', 'wg', 'ng', 'bijst']),
  vw_onder: checkChosen('vw_onder', ['vw_neven', 'bwb', 'pv', 'ow', 'lv', 'mv', 'wg', 'ng', 'bijzin'], {
    vw_neven: "Kan het volgende deel zelfstandig als hoofdzin staan, of is het afhankelijk?",
    bijzin: "Kies het hele zinsdeel met eigen onderwerp en persoonsvorm, niet alleen het voegwoord.",
  }),
  vw_neven: checkChosen('vw_neven', ['vw_onder', 'bwb', 'pv', 'ow', 'lv', 'mv', 'wg', 'ng', 'bijzin'], {
    vw_onder: "Leidt het voegwoord een afhankelijke bijzin in, of verbindt het gelijkwaardige delen?",
    bijzin: "Kies het hele zinsdeel met eigen onderwerp en persoonsvorm, niet alleen het voegwoord.",
  }),
};

export const FEEDBACK_SWAP = {
  BIJZIN_HAS_FUNCTIE: (_functieName: string) =>
    "Dit deel heeft een rol in de hoofdzin, maar bevat zelf ook een onderwerp en persoonsvorm. Welke vorm hoort daar bij?"
};

export const FEEDBACK_BIJZIN_FUNCTIE = {
  MISSING: "De bijzin is goed! Welke rol speelt dit deel nu binnen de hoofdzin?",
  WRONG: (_expected: string) => "Bekijk de bijzin als één geheel. Welke vraag beantwoordt dit deel in de hoofdzin?"
};

export const FEEDBACK_PREDICATE_TYPE = {
  MISSING: "Goed, dit is de persoonsvorm! Hoort ze bij een werkwoordelijk (WG) of een naamwoordelijk (NG) gezegde?",
  WRONG: (_expected: string) => "Drukt het gezegde een handeling uit (WG), of zegt het wat het onderwerp is, wordt of blijft (NG)?"
};

export const HINTS = {
  MISSING_PV: "Tip: Pas de tijd van de zin aan. Welk werkwoord verandert?",
  MISSING_OW: "Tip: Denk na over wie of wat er in deze zin iets doet of is.",
  MISSING_WG: "Tip: Zoek de werkwoorden die samen een handeling (iets doen) uitdrukken.",
  MISSING_NG: "Tip: Zegt de zin wat het onderwerp is of wordt? Label de eigenschap of toestand als NG.",
  MISSING_WD: "Tip: Staat er naast de PV nog een werkwoord bij het naamwoordelijk gezegde? Dat is het werkwoordelijk deel (WWD) — het hoort bij het NG-deel.",
  MISSING_LV: "Tip: Welk deel ondergaat de handeling in de zin?",
  MISSING_MV: "Tip: Zoek het deel dat aangeeft voor wie of aan wie iets wordt gedaan.",
  MISSING_VV: "Tip: Zoek een voorzetsel dat onlosmakelijk bij een woord in de zin hoort.",
  MISSING_BWB: "Tip: Zoek info over plaats, tijd, manier, of woorden als 'niet', 'wel' en 'ook'.",
  MISSING_BIJZIN: "Tip: Zoek een zinsdeel met een eigen onderwerp en persoonsvorm.",
  MISSING_BIJST: "Tip: Zoek een extra naam voor iets wat al genoemd is.",
  MISSING_BIJZIN_FUNCTIE: "Tip: Welke vraag beantwoordt de volledige bijzin in de hoofdzin?",
  MISSING_PREDICATE_TYPE: "Tip: Is dit een werkwoordelijk gezegde (WG, een handeling) of een naamwoordelijk gezegde (NG, een eigenschap of toestand)?",
  SUBLABEL_NEEDS_MAIN_ROLE: "Tip: Geef dit deel eerst een hoofdlabel (bijv. WG of NG) voordat je een deelrol op een woord plaatst.",
  GEZEGDE_DEEL_MISSING: (word: string) => `Benoem elk woord van het naamwoordelijk gezegde, ook de PV. Is '${word}' een werkwoord (WWD) of zegt het iets over het onderwerp (NWD)?`,
  GEZEGDE_DEEL_WRONG: (word: string) => `Is '${word}' een werkwoord? Alle werkwoorden van het naamwoordelijk gezegde, ook de PV, vormen samen het werkwoordelijk deel; de rest is het naamwoordelijk deel.`,
  GEZEGDE_DEEL_BIJV_BEP: (word: string) => `Bepaalt '${word}' één ander woord nader? Zo'n woord hoort wel bij het naamwoordelijk deel, maar je geeft het het label bijvoeglijke bepaling (BB) en niet NWD.`,
  GEZEGDE_DEEL_NOT_BIJV_BEP: (word: string) => `Bepaalt '${word}' één ander woord nader? Zo niet, dan hoort het gewoon bij het naamwoordelijk deel (NWD).`,
  VERBINDINGSWOORD_HAS_FUNCTIE: (word: string) => `Verbindt '${word}' alleen de bijzin met de hoofdzin, of doet het ook mee in de bijzin? Vervang '${word}' door het woord waarnaar het verwijst en stel dan de vraag voor het zinsdeel.`,
  GEZEGDE_DEEL_NOT_NG: (word: string) => `Hoort '${word}' bij een naamwoordelijk gezegde? Alleen daarin benoem je een werkwoordelijk en een naamwoordelijk deel.`,
  generic: (_roleLabel: string) => "Tip: Loop je ontleding nog eens rustig stap voor stap door.",
  ALL_PLACED: "Alles staat op een plek. Kijk nog één keer of het echt klopt.",
};

export const FEEDBACK_SHORT_LABELS: Record<string, string> = {
  'incorrect-role': 'Check rol',
  'incorrect-split': 'Check knip',
  'warning': 'Bijna'
};

export const ENCOURAGEMENT_POOLS: string[][] = [
  [
    "Pittige ronde. Pak de vaste vragen er de volgende keer weer bij.",
    "Nog even oefenen, maar je leert wel steeds scherper kijken.",
    "Blijf systematisch werken, dan vallen de stukjes vanzelf op hun plek.",
  ],
  [
    "Je begint de structuur goed te zien. Let nu extra op de werkwoorden.",
    "De basis staat. Kijk de volgende keer nog iets scherper naar de voorwerpen.",
    "Lekker gewerkt, je bent op de goede weg!",
  ],
  [
    "Sterke sessie! De meeste rollen heb je nu echt goed onder de knie.",
    "Mooi werk. Je ziet de opbouw van de zinnen steeds beter.",
    "Heel scherp. Nog een paar details en je bent foutloos.",
  ],
  [
    "Heel scherp ontleed! Je hebt het echt in de vingers.",
    "Foutloze ronde. Heel knap gedaan.",
    "Lekker hoor, dit niveau is echt goed.",
    "Klasse. Je leest de zinsstructuur perfect.",
  ],
];

export const STREAK_MILESTONES: [number, string, string][] = [
  [30, '👑', 'Dertig dagen op rij. Dat is echt sterk.'],
  [14, '🌟', 'Twee weken streak. Wat een doorzettingsvermogen!'],
  [7,  '🔥🔥🔥', 'Een volle week! Je gaat als een speer.'],
  [3,  '🔥🔥', 'Drie dagen achter elkaar. Hou dit vast!'],
  [2,  '🔥', 'Tweede dag op rij. Lekker bezig!'],
];

export const SCORE_TIPS: Record<string, string> = {
  'Persoonsvorm': 'De tijdproef werkt altijd: verander de tijd en vind de PV.',
  'Onderwerp': 'Vraag altijd eerst: "Wie of wat + PV?".',
  'Lijdend Voorwerp': 'Vraag: "Wie of wat + gezegde + onderwerp?".',
  'Meewerkend Voorwerp': 'Vraag: "Aan of voor wie?".',
  'Bijwoordelijke Bepaling': 'Deze geven extra info (waar, wanneer), of zijn woorden zoals "niet" en "ook". Er kunnen er meer in een zin staan.',
  'Voorzetselvoorwerp': 'Het voorzetsel hoort onlosmakelijk bij een specifiek woord (werkwoord of adjectief).',
  'Werkwoordelijk Gezegde': 'Zoek de werkwoorden die samen een handeling (doen) vormen.',
  'Naamwoordelijk Gezegde': 'Dit gezegde vertelt wat het onderwerp is of wordt (een eigenschap of toestand). Het WWD (werkwoordelijk deel, bijv. "geworden") hoort ook bij het NG-deel.',
  'Bijzin': 'Een bijzin heeft intern een eigen onderwerp en persoonsvorm.',
  'Bijstelling': 'Dit geeft een extra naam aan iets wat al is genoemd.',
  'Verdeling': 'Wat je samen voor de PV kunt zetten, is meestal één zinsdeel.',
  'Nevenschikkend VW': 'Verbindt twee gelijke hoofdzinnen (en, maar, want, of, dus).',
  'Onderschikkend VW': 'Begint een bijzin die niet in zijn eentje een zin kan zijn.',
  'Bijvoeglijke Bepaling': 'Zegt iets over een zelfstandig naamwoord binnen een zinsdeel.',
};
