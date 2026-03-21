import { RoleDefinition, DifficultyLevel, RoleKey } from './types';

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
  1: ['pv', 'ow', 'lv', 'mv', 'bwb', 'wg', 'ng'],
  2: ['pv', 'ow', 'lv', 'mv', 'bwb', 'vv', 'wg', 'ng'],
  3: ['pv', 'ow', 'lv', 'mv', 'bwb', 'vv', 'bijst', 'bijzin', 'vw_neven', 'wg', 'ng'],
  4: ['pv', 'ow', 'lv', 'mv', 'bwb', 'vv', 'bijst', 'bijzin', 'vw_neven', 'wg', 'ng'],
};

export const FEEDBACK_STRUCTURE = {
  TOO_MANY_SPLITS: "Hier is teveel geknipt.",
  MISSING_SPLIT: "Hier hoort ergens nog een knip.",
  INCONSISTENT: "Dit deel bevat woorden die niet bij elkaar horen."
};

export const FEEDBACK_MATRIX: Record<string, Record<string, string>> = {
  'ow': {
    'pv': "Kijk welk woord verandert als je de tijd aanpast.",
    'lv': "Dit deel doet iets — maar welk deel ondergaat de handeling?",
    'mv': "Dit deel doet iets — maar wie ontvangt er iets in de zin?",
    'bwb': "Geeft dit deel extra info, of is het een woord als 'niet', 'wel' of 'ook'?",
    'wg': "Bestaat dit deel uit werkwoorden die een actie beschrijven?",
    'ng': "Zegt dit gezegde wat het onderwerp is of wordt?",
    'vv': "Hoort het voorzetsel vast bij een ander woord in de zin?",
    'bijzin': "Heeft dit deel een eigen onderwerp en persoonsvorm?",
    'bijst': "Geeft dit deel een extra naam aan iets wat al eerder genoemd is?",
  },

  'pv': {
    'wg': "Het WG zijn alle werkwoorden die samen de handeling uitdrukken.",
    'ow': "Denk na over wie of wat er in deze zin iets doet of is.",
    'lv': "Dit is een werkwoord — welk deel ondergaat de handeling?",
    'bwb': "Geeft dit deel extra info, of is het een woord als 'niet' of 'ook'?",
    'ng': "Zegt dit gezegde wat het onderwerp is of wordt?",
    'mv': "Dit is een werkwoord — welk deel ontvangt er iets?",
    'vv': "Hoort het voorzetsel vast bij een specifiek woord in de zin?",
  },

  'wg': {
    'pv': "Kijk welk woord van vorm verandert als je de tijd aanpast.",
    'ng': "Drukken deze woorden een actie uit, of zeggen ze wat het onderwerp is of wordt?",
    'lv': "Dit zijn de werkwoorden — welk deel ondergaat de handeling?",
    'bwb': "Geeft dit deel extra info, of is het een woord als 'niet' of 'ook'?",
    'ow': "Denk na over wie of wat er in deze zin iets doet of is.",
    'mv': "Dit zijn de werkwoorden — welk deel ontvangt er iets?",
    'vv': "Hoort het voorzetsel vast bij een specifiek woord in de zin?",
    'wwd': "Het WWD hoort bij een naamwoordelijk gezegde, niet bij een werkwoordelijk.",
  },

  'ng': {
    'wg': "Drukken deze werkwoorden een actie uit, of beschrijven ze een eigenschap?",
    'lv': "Dit zegt wat het OW is — welk deel ondergaat de handeling?",
    'bwb': "Geeft dit deel extra info, of is het een woord als 'niet' of 'wel'?",
    'ow': "Denk na over wie of wat er in deze zin iets doet of is.",
    'pv': "Kijk welk werkwoord verandert als je de tijd aanpast.",
    'mv': "Dit zegt wat het OW is — welk deel ontvangt er iets?",
    'vv': "Hoort het voorzetsel vast bij een specifiek woord in de zin?",
    'wwd': "Zoek het woord dat zegt wát het onderwerp is of wordt.",
  },

  'lv': {
    'ow': "Denk na over wie of wat er in deze zin iets doet of is.",
    'vv': "Hoort het voorzetsel onlosmakelijk bij een woord in de zin?",
    'bwb': "Dit deel ondergaat niets — geeft het extra info over de omstandigheid?",
    'mv': "Ontvangt dit deel iets, of ondergaat het iets?",
    'ng': "Dit deel ondergaat iets — zegt het ook wat het OW is of wordt?",
    'bijst': "Geeft dit deel een extra naam aan een woord dat al genoemd is?",
    'pv': "Kijk welk woord verandert bij de tijdproef.",
    'wg': "Dit deel ondergaat niets — dit zijn de werkwoorden die de handeling uitdrukken.",
    'bijzin': "Heeft dit deel intern een eigen onderwerp en persoonsvorm?",
  },

  'mv': {
    'ow': "Denk na over wie of wat er in deze zin iets doet of is.",
    'lv': "Ontvangt dit deel iets, of ondergaat het iets?",
    'vv': "Dit deel is geen ontvanger — het hangt via een vast voorzetsel aan een ander woord.",
    'bwb': "Dit deel ontvangt niets — geeft het extra info over de omstandigheid?",
    'pv': "Kijk welk woord verandert als je de tijd aanpast.",
    'wg': "Dit deel ontvangt niets — dit zijn de werkwoorden die de handeling uitdrukken.",
    'ng': "Dit deel ontvangt niets — zegt het wat het OW is of wordt?",
    'bijzin': "Heeft dit deel intern een eigen onderwerp en persoonsvorm?",
  },

  'vv': {
    'bwb': "Duidt het voorzetsel een plaats of tijd aan, of hoort het vast bij een specifiek woord?",
    'lv': "Dit hangt vast aan een ander woord — welk deel ondergaat de handeling?",
    'mv': "Dit hangt vast aan een ander woord — welk deel ontvangt er iets?",
    'ow': "Denk na over wie of wat er in deze zin iets doet of is.",
    'pv': "Kijk welk werkwoord verandert bij de tijdproef.",
    'wg': "Het WG zijn werkwoorden die een handeling uitdrukken — dit deel begint met een voorzetsel.",
    'ng': "Zegt dit deel wat het onderwerp is of wordt?",
    'bijzin': "Heeft dit deel intern een eigen onderwerp en persoonsvorm?",
  },

  'bwb': {
    'vv': "Hoort het voorzetsel onlosmakelijk bij een specifiek woord in de zin?",
    'lv': "Dit geeft extra info — welk deel ondergaat de handeling?",
    'ow': "Denk na over wie of wat er in deze zin iets doet of is.",
    'bijzin': "Heeft dit deel een eigen onderwerp en persoonsvorm?",
    'mv': "Dit geeft extra info — welk deel ontvangt er iets?",
    'ng': "Zegt dit gezegde wat het onderwerp is of wordt?",
    'bijst': "Geeft dit deel een extra naam aan een zinsdeel dat er direct voor staat?",
    'pv': "Kijk welk woord verandert als je de tijd aanpast.",
    'wg': "Bestaat dit deel uit werkwoorden die een handeling beschrijven?",
  },

  'bijst': {
    'bijv_bep': "Zegt dit alleen iets over één woord, of hernoemt het een heel zinsdeel?",
    'ow': "Denk na over wie of wat er in deze zin iets doet of is.",
    'lv': "Dit is een extra naam — welk deel ondergaat de handeling?",
    'bwb': "Geeft dit deel info over de omstandigheden, of is het een woord als 'niet' of 'ook'?",
    'pv': "Kijk welk woord van vorm verandert bij de tijdproef.",
    'mv': "Dit is een extra naam — wie ontvangt er iets in de zin?",
    'vv': "Kijk of het voorzetsel onlosmakelijk bij een woord in de zin hoort.",
    'bijzin': "Heeft dit deel intern een eigen onderwerp en persoonsvorm?",
  },

  'bijzin': {
    'bwb': "Heeft dit deel een eigen onderwerp én persoonsvorm, of is het extra info?",
    'ow': "Heeft dit deel een eigen onderwerp én persoonsvorm?",
    'lv': "Dit deel heeft geen eigen persoonsvorm — welk deel ondergaat de handeling?",
    'mv': "Dit deel heeft geen eigen persoonsvorm — welk deel ontvangt er iets?",
    'vv': "Hoort het voorzetsel vast bij een specifiek woord — heeft dit deel echt een eigen PV?",
    'pv': "Kijk welk enkel woord van vorm verandert bij de tijdproef.",
    'wg': "Bestaat dit deel uit de werkwoorden van de zin die een actie beschrijven?",
  },

  'vw_onder': {
    'vw_neven': "Verbindt dit twee gelijke zinnen, of maakt het één deel afhankelijk?",
    'bwb': "Is dit een verbindingswoord, of een woord dat info geeft over tijd of plaats?",
    'pv': "Kijk welk woord van vorm verandert als je de tijd aanpast.",
    'ow': "Denk na over wie of wat er in deze zin iets doet of is.",
    'lv': "Dit is een verbindingswoord — welk deel ondergaat de handeling?",
    'mv': "Dit is een verbindingswoord — welk deel ontvangt er iets?",
    'wg': "Het WG zijn werkwoorden — dit woord verbindt een bijzin, het is zelf geen werkwoord.",
    'ng': "Zegt dit gezegde wat het onderwerp is of wordt?",
    'bijzin': "Kies je hier één woord of de volledige zin die volgt?",
  },

  'vw_neven': {
    'vw_onder': "Leidt dit een bijzin in, of verbindt het twee gelijke hoofdzinnen?",
    'bwb': "Is dit een verbindingswoord, of een woord dat info geeft over tijd of plaats?",
    'pv': "Kijk welk woord van vorm verandert als je de tijd aanpast.",
    'ow': "Denk na over wie of wat er in deze zin iets doet of is.",
    'lv': "Dit is een verbindingswoord — welk deel ondergaat de handeling?",
    'mv': "Dit is een verbindingswoord — welk deel ontvangt er iets?",
    'wg': "Hoort dit woord bij de werkwoorden die de handeling vormen?",
    'ng': "Zegt dit gezegde wat het onderwerp is of wordt?",
    'bijzin': "Kies je hier alleen het verbindingswoord of de hele bijzin?",
  },
};

export const FEEDBACK_SWAP = {
  BIJZIN_HAS_FUNCTIE: (_functieName: string) =>
    "Dit deel heeft een rol in de hoofdzin, maar bevat zelf ook een onderwerp en persoonsvorm. Welke vorm hoort daar bij?"
};

export const FEEDBACK_BIJZIN_FUNCTIE = {
  MISSING: "De bijzin is goed! Welke rol speelt dit deel nu binnen de hoofdzin?",
  WRONG: (_expected: string) => "Bekijk de bijzin als één geheel. Welke vraag beantwoordt dit deel in de hoofdzin?"
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
  SUBLABEL_NEEDS_MAIN_ROLE: "Tip: Geef dit deel eerst een hoofdlabel (bijv. WG of NG) voordat je een deelrol op een woord plaatst.",
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
