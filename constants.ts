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
    key: 'wd',
    label: 'Werkwoordelijk Deel',
    shortLabel: 'WD',
    colorClass: 'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-100',
    borderColorClass: 'border-rose-200 dark:border-rose-600'
  },
  {
    key: 'nwd',
    label: 'Naamwoordelijk Deel',
    shortLabel: 'NWD',
    colorClass: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-100',
    borderColorClass: 'border-yellow-200 dark:border-yellow-600'
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
  1: ['pv', 'ow', 'lv', 'mv', 'bwb', 'wg', 'nwd'],
  2: ['pv', 'ow', 'lv', 'mv', 'bwb', 'vv', 'wg', 'nwd'],
  3: ['pv', 'ow', 'lv', 'mv', 'bwb', 'vv', 'bijst', 'bijzin', 'vw_neven', 'wg', 'nwd'],
  4: ['pv', 'ow', 'lv', 'mv', 'bwb', 'vv', 'bijst', 'bijzin', 'vw_neven', 'wg', 'nwd', 'wd'],
};

export const FEEDBACK_STRUCTURE = {
  TOO_MANY_SPLITS: "Hier is te vroeg geknipt. Welke woorden horen nog bij elkaar in één blok?",
  MISSING_SPLIT: "In dit blok zit nog een grens. Gebruik de verplaatsingsproef om de juiste knip te vinden.",
  INCONSISTENT: "Dit blok trekt twee kanten op. Kijk goed welke woorden echt bij elkaar blijven."
};

export const FEEDBACK_MATRIX: Record<string, Record<string, string>> = {
  'ow': {
    'pv': "Kijk welk woord van vorm verandert als je de tijd van de zin aanpast.",
    'lv': "Controleer met de vraag: wie of wat + gezegde + onderwerp?",
    'mv': "Kijk of dit deel antwoord geeft op de vraag: aan of voor wie?",
    'bwb': "Geeft dit deel extra info over de omstandigheden, of is het een woord als 'niet', 'wel' of 'ook'?",
    'wg': "Bestaat dit deel uit werkwoorden die een actie beschrijven (iets doen)?",
    'nwd': "Zegt dit gezegde wat het onderwerp is of wordt (een eigenschap of toestand)?",
    'vv': "Let op het voorzetsel: hoort dit vast bij een ander woord in de zin (zoals een werkwoord of adjectief)?",
    'bijzin': "Heeft dit blok intern een eigen onderwerp en een eigen persoonsvorm?",
    'bijst': "Geeft dit deel een extra naam aan iets wat al eerder genoemd is?",
  },

  'pv': {
    'wg': "Zoek naar het ene werkwoord dat verandert bij de tijdproef.",
    'ow': "Stel de vraag: wie of wat + persoonsvorm?",
    'lv': "Controleer met de vraag: wie of wat + gezegde + onderwerp?",
    'bwb': "Geeft dit deel extra info (plaats, tijd, manier), of is het een woord als 'niet' of 'ook'?",
    'nwd': "Kijk of het gezegde vertelt wat het onderwerp is of wordt, in plaats van wat het doet.",
    'mv': "Geeft dit deel antwoord op de vraag: aan of voor wie?",
    'vv': "Onderzoek of het voorzetsel onlosmakelijk bij een specifiek woord in de zin hoort.",
  },

  'wg': {
    'pv': "Kijk welk woord van vorm verandert als je de tijd aanpast.",
    'nwd': "Benoemen deze woorden een actie (iets doen), of zeggen ze wat het onderwerp is of wordt?",
    'lv': "Controleer met de vraag: wie of wat + gezegde + onderwerp?",
    'bwb': "Kijk of dit deel extra info geeft, of een woord is zoals 'niet', 'wel' of 'ook'.",
    'ow': "Stel de vraag: wie of wat + persoonsvorm?",
    'mv': "Kijk of dit deel antwoord geeft op de vraag: aan of voor wie?",
    'vv': "Hoort het voorzetsel bij een vaste combinatie met een woord in de zin?",
    'wd': "Een werkwoordelijk gezegde drukt een handeling uit, geen toestand. Het WD hoort alleen bij een naamwoordelijk gezegde.",
  },

  'nwd': {
    'wg': "Drukken deze werkwoorden een actie uit (iets doen), of zeggen ze wat het onderwerp is of wordt?",
    'lv': "Controleer met de vraag: wie of wat + gezegde + onderwerp?",
    'bwb': "Is dit deel een toevoeging (plaats, tijd, reden), of een woord zoals 'niet' of 'wel'?",
    'ow': "Stel de vraag: wie of wat + persoonsvorm?",
    'pv': "Kijk welk werkwoord van vorm verandert als je de tijd aanpast.",
    'mv': "Kijk of dit deel de ontvanger aangeeft (aan of voor wie).",
    'vv': "Check of het voorzetsel vastzit aan een specifiek woord in de zin (zoals een werkwoord of adjectief).",
    'wd': "Het naamwoordelijk deel is de eigenschap of toestand, niet het werkwoord. Zoek het woord dat zegt wát het onderwerp is of wordt.",
  },

  'wd': {
    'nwd': "Het naamwoordelijk deel beschrijft een eigenschap of toestand. Zoek het werkwoord dat geen PV is.",
    'wg': "Bij een naamwoordelijk gezegde beschrijven de werkwoorden geen handeling. Welk werkwoord is de PV, en welk is het WD?",
    'pv': "Kijk welk werkwoord van vorm verandert als je de tijd aanpast. Dat is de PV — het andere is het WD.",
    'bwb': "Dit deel is geen extra info over omstandigheden. Het is een werkwoord dat bij het koppelwerkwoord hoort.",
  },

  'lv': {
    'ow': "Stel de vraag: wie of wat + persoonsvorm?",
    'vv': "Let op het voorzetsel: hoort dit onlosmakelijk bij een woord in de zin?",
    'bwb': "Geeft dit deel info (waar, wanneer, waarom), of is het een woord als 'niet', 'ook' of 'wel'?",
    'mv': "Geeft dit deel antwoord op de vraag: aan of voor wie?",
    'nwd': "Vertelt dit deel wat het onderwerp is of wordt, via een werkwoord als zijn of worden?",
    'bijst': "Geeft dit deel een extra naam aan een woord dat al genoemd is?",
    'pv': "Kijk welk woord van vorm verandert bij de tijdproef.",
    'wg': "Bestaat dit deel uit werkwoorden die samen een actie (iets doen) vormen?",
    'bijzin': "Heeft dit blok intern een eigen onderwerp en persoonsvorm?",
  },

  'mv': {
    'ow': "Stel de vraag: wie of wat + persoonsvorm?",
    'lv': "Controleer met de vraag: wie of wat + gezegde + onderwerp?",
    'vv': "Hoort het voorzetsel bij een vaste combinatie met een woord in de zin?",
    'bwb': "Geeft dit deel info over de omstandigheden, of is het een woord als 'niet' of 'ook'?",
    'pv': "Kijk welk woord van vorm verandert als je de tijd aanpast.",
    'wg': "Bestaat dit deel uit werkwoorden die een handeling (doen) beschrijven?",
    'nwd': "Zegt dit deel wat het onderwerp is of wordt (een eigenschap of toestand)?",
    'bijzin': "Heeft dit blok intern een eigen onderwerp en persoonsvorm?",
  },

  'vv': {
    'bwb': "Duidt het voorzetsel een plaats of tijd aan, of hoort het vast bij een specifiek woord?",
    'lv': "Controleer met de vraag: wie of wat + gezegde + onderwerp?",
    'mv': "Kijk of dit deel antwoord geeft op de vraag: aan of voor wie?",
    'ow': "Stel de vraag: wie of wat + persoonsvorm?",
    'pv': "Zoek naar het werkwoord dat van vorm verandert bij de tijdproef.",
    'wg': "Onderzoek of dit deel uit werkwoorden bestaat.",
    'nwd': "Kijk of het gezegde via een koppelwerkwoord zegt wat het onderwerp is of wordt.",
    'bijzin': "Heeft dit blok intern een eigen onderwerp en persoonsvorm?",
  },

  'bwb': {
    'vv': "Let op het voorzetsel: hoort dit onlosmakelijk bij een specifiek woord in de zin?",
    'lv': "Controleer met de vraag: wie of wat + gezegde + onderwerp?",
    'ow': "Stel de vraag: wie of wat + persoonsvorm?",
    'bijzin': "Heeft dit blok intern een eigen onderwerp en persoonsvorm?",
    'mv': "Geeft dit deel antwoord op de vraag: aan of voor wie?",
    'nwd': "Zegt dit gezegde wat het onderwerp is of wordt (een eigenschap of toestand)?",
    'bijst': "Geeft dit deel een extra naam aan een zinsdeel dat er direct voor staat?",
    'pv': "Kijk welk woord van vorm verandert als je de tijd aanpast.",
    'wg': "Bestaat dit deel uit werkwoorden die een handeling beschrijven?",
  },

  'bijst': {
    'bijv_bep': "Zegt dit alleen iets over één woord, of hernoemt het een heel zinsdeel?",
    'ow': "Stel de vraag: wie of wat + persoonsvorm?",
    'lv': "Controleer met de vraag: wie of wat + gezegde + onderwerp?",
    'bwb': "Geeft dit deel info over de omstandigheden, of is het een woord als 'niet' of 'ook'?",
    'pv': "Kijk welk woord van vorm verandert bij de tijdproef.",
    'mv': "Kijk of dit deel antwoord geeft op de vraag: aan of voor wie?",
    'vv': "Kijk of het voorzetsel onlosmakelijk bij een woord in de zin hoort.",
    'bijzin': "Heeft dit blok intern een eigen onderwerp en persoonsvorm?",
  },

  'bijzin': {
    'bwb': "Heeft dit blok een eigen onderwerp én persoonsvorm, of is het extra info (zoals 'niet' of 'gisteren')?",
    'ow': "Heeft dit blok echt een eigen zinskern: een onderwerp én een persoonsvorm?",
    'lv': "Onderzoek of er binnen dit blok een eigen onderwerp en persoonsvorm staan.",
    'mv': "Heeft dit blok intern een eigen werkwoord dat van tijd kan veranderen?",
    'vv': "Zitten er in dit blok een eigen onderwerp en persoonsvorm?",
    'pv': "Kijk welk enkel woord van vorm verandert bij de tijdproef.",
    'wg': "Bestaat dit deel uit de werkwoorden van de zin die een actie beschrijven?",
  },

  'vw_onder': {
    'vw_neven': "Verbindt dit twee gelijke zinnen, of maakt het één deel afhankelijk?",
    'bwb': "Is dit een verbindingswoord, of een woord dat info geeft over tijd of plaats?",
    'pv': "Kijk welk woord van vorm verandert als je de tijd aanpast.",
    'ow': "Stel de vraag: wie of wat + persoonsvorm?",
    'lv': "Controleer met de vraag: wie of wat + gezegde + onderwerp?",
    'mv': "Geeft dit deel antwoord op de vraag: aan of voor wie?",
    'wg': "Bestaat dit deel uit werkwoorden?",
    'nwd': "Zegt dit gezegde wat het onderwerp is of wordt?",
    'bijzin': "Kies je hier één woord of de volledige zin die volgt?",
  },

  'vw_neven': {
    'vw_onder': "Leidt dit een bijzin in, of verbindt het twee gelijke hoofdzinnen?",
    'bwb': "Is dit een verbindingswoord, of een woord dat info geeft over tijd of plaats?",
    'pv': "Kijk welk woord van vorm verandert als je de tijd aanpast.",
    'ow': "Kijk welk deel antwoord geeft op: wie of wat + PV?",
    'lv': "Controleer met de vraag: wie of wat + gezegde + onderwerp?",
    'mv': "Geeft dit deel antwoord op de vraag: aan of voor wie?",
    'wg': "Hoort dit woord bij de werkwoorden die de handeling vormen?",
    'nwd': "Zegt dit gezegde wat het onderwerp is of wordt?",
    'bijzin': "Kies je hier alleen het verbindingswoord of de hele bijzin?",
  },
};

export const FEEDBACK_SWAP = {
  BIJZIN_HAS_FUNCTIE: (_functieName: string) =>
    "Dit blok heeft een rol in de hoofdzin, maar bevat zelf ook een onderwerp en persoonsvorm. Welke vorm hoort daar bij?"
};

export const FEEDBACK_BIJZIN_FUNCTIE = {
  MISSING: "De bijzin is goed! Welke rol speelt dit blok nu binnen de hoofdzin?",
  WRONG: (_expected: string) => "Bekijk de bijzin als één geheel. Welke vraag beantwoordt dit blok in de hoofdzin?"
};

export const HINTS = {
  MISSING_PV: "Tip: Pas de tijd van de zin aan. Welk werkwoord verandert?",
  MISSING_OW: "Tip: Stel de vraag: wie of wat + persoonsvorm?",
  MISSING_WG: "Tip: Zoek de werkwoorden die samen een handeling (iets doen) uitdrukken.",
  MISSING_NG: "Tip: Zegt de zin wat het onderwerp is of wordt? Zoek naar woorden die een eigenschap of toestand beschrijven.",
  MISSING_WD: "Tip: Staat er naast de PV nog een werkwoord bij het naamwoordelijk gezegde? Dat is het werkwoordelijk deel.",
  MISSING_LV: "Tip: Stel de vraag: wie of wat + gezegde + onderwerp?",
  MISSING_MV: "Tip: Zoek het deel dat aangeeft voor wie of aan wie iets wordt gedaan.",
  MISSING_VV: "Tip: Zoek een voorzetsel dat onlosmakelijk bij een woord in de zin hoort.",
  MISSING_BWB: "Tip: Zoek info over plaats, tijd, manier, of woorden als 'niet', 'wel' en 'ook'.",
  MISSING_BIJZIN: "Tip: Zoek een zinsdeel met een eigen onderwerp en persoonsvorm.",
  MISSING_BIJST: "Tip: Zoek een extra naam voor iets wat al genoemd is.",
  MISSING_BIJZIN_FUNCTIE: "Tip: Welke vraag beantwoordt de volledige bijzin in de hoofdzin?",
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
  'Naamwoordelijk Deel': 'Dit gezegde vertelt wat het onderwerp is of wordt (een eigenschap of toestand).',
  'Werkwoordelijk Deel': 'Het WD is het niet-persoonlijke werkwoord in een naamwoordelijk gezegde, zoals "geworden" of "te worden".',
  'Bijzin': 'Een bijzin heeft intern een eigen onderwerp en persoonsvorm.',
  'Bijstelling': 'Dit geeft een extra naam aan iets wat al is genoemd.',
  'Verdeling': 'Wat je samen voor de PV kunt zetten, is meestal één zinsdeel.',
  'Nevenschikkend VW': 'Verbindt twee gelijke hoofdzinnen (en, maar, want, of, dus).',
  'Onderschikkend VW': 'Begint een bijzin die niet in zijn eentje een zin kan zijn.',
  'Bijvoeglijke Bepaling': 'Zegt iets over een zelfstandig naamwoord binnen een zinsdeel.',
};
