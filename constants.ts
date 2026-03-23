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

export const FEEDBACK_MATRIX: Record<string, Record<string, FeedbackEntry>> = {

  // ─────────────────────────────────────────────────────────────
  // GROEP 1: OW-paren
  // ─────────────────────────────────────────────────────────────
  'ow': {

    // 1. ow→pv
    'pv': {
      herstelvraag: "Welk woord verandert als je de tijd aanpast?",
      sleutelwoord: "verandert",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het onderwerp gezocht en een werkwoord aangewezen.",
        redenering: "Het onderwerp is wie of wat de handeling doet; de persoonsvorm is het werkwoord dat van vorm verandert bij de tijdproef. Die twee zijn nooit hetzelfde.",
        herstap: "Verander de tijd van de zin (verleden ↔ tegenwoordig). Welk woord verandert van vorm? Dat is de PV.",
      },
    },

    // 2. ow→lv
    'lv': {
      herstelvraag: "Wie of wat ondergaat de handeling — niet wie doet?",
      sleutelwoord: "ondergaat",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk gedacht: dit deel gaat over een persoon of ding, dus het is het onderwerp.",
        redenering: "Het onderwerp doet of is iets; het lijdend voorwerp ondergaat de handeling. Vraag: 'Wie of wat + gezegde + onderwerp?' — dat levert het LV op, niet het OW.",
        herstap: "Vraag: wie of wat + PV + onderwerp? Het antwoord is het lijdend voorwerp.",
      },
    },

    // 3. ow→mv
    'mv': {
      herstelvraag: "Aan of voor wie wordt de handeling verricht?",
      sleutelwoord: "voor",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een persoon als onderwerp aangewezen, maar het is de ontvanger van de handeling.",
        redenering: "Het onderwerp doet iets; het meewerkend voorwerp ontvangt iets. Vraag: 'Aan of voor wie + gezegde + onderwerp + LV?' — dat levert het MV op.",
        herstap: "Vraag: aan of voor wie + gezegde? Het antwoord is het meewerkend voorwerp.",
      },
    },

    // 4. ow→bwb
    'bwb': {
      herstelvraag: "Geeft dit deel extra info, of verricht het de handeling?",
      sleutelwoord: "extra",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk dit deel als handelende persoon of ding gezien, maar het geeft alleen omstandigheden aan.",
        redenering: "Het onderwerp doet of is iets en antwoordt op 'Wie of wat + PV?'. De bijwoordelijke bepaling geeft info over tijd, plaats of manier en kan worden weggelaten.",
        herstap: "Vraag: wie of wat + PV? Geeft dit deel antwoord op die vraag? Zo niet, is het geen onderwerp.",
      },
    },

    // 5. ow→wg
    'wg': {
      herstelvraag: "Zijn dit de werkwoorden die de handeling uitdrukken?",
      sleutelwoord: "werkwoorden",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk de werkwoorden als onderwerp aangewezen.",
        redenering: "Het onderwerp antwoordt op 'Wie of wat + PV?' en is een zelfstandig naamwoord of pronomen. Het werkwoordelijk gezegde bestaat uit de werkwoorden die de handeling vormen.",
        herstap: "Vraag: wie of wat + PV? Het antwoord is het onderwerp. De werkwoorden zelf vormen het WG.",
      },
    },

    // 6. ow→ng
    'ng': {
      herstelvraag: "Zegt dit deel wat het onderwerp is of wordt?",
      sleutelwoord: "wordt",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het deel dat een toestand beschrijft als onderwerp aangewezen.",
        redenering: "Het onderwerp is wie of wat de handeling verricht of de toestand heeft. Het naamwoordelijk gezegde zegt wát het onderwerp is of wordt, en bevat altijd een koppelwerkwoord.",
        herstap: "Vraag: wie of wat + PV? Dat is het onderwerp. De koppelwerkwoorden plus de eigenschap vormen het NG.",
      },
    },

    // 7. ow→vv
    'vv': {
      herstelvraag: "Hoort het voorzetsel hier vast bij een specifiek werkwoord?",
      sleutelwoord: "vast",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een voorzetselgroep als onderwerp aangewezen.",
        redenering: "Het onderwerp antwoordt op 'Wie of wat + PV?' en bevat geen vast voorzetsel. Het voorzetselvoorwerp begint met een voorzetsel dat onlosmakelijk bij een woord in de zin hoort.",
        herstap: "Vraag: wie of wat + PV? Als het antwoord begint met een vast voorzetsel, is het een VV, geen OW.",
      },
    },

    // 8. ow→bijzin
    'bijzin': {
      herstelvraag: "Heeft dit deel een eigen onderwerp én persoonsvorm?",
      sleutelwoord: "eigen",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een bijzin als onderwerp aangewezen — dat kán kloppen als de bijzin de OW-functie vervult, maar hier is de bijzin iets anders.",
        redenering: "Een bijzin heeft intern een eigen onderwerp en persoonsvorm. Het onderwerp van de hoofdzin antwoordt op 'Wie of wat + PV?' en is hier een ander deel.",
        herstap: "Vraag: wie of wat + PV van de hoofdzin? Dat is het onderwerp. Controleer daarna of dit deel intern een eigen PV heeft; zo ja, is het een bijzin.",
      },
    },

    // 9. ow→bijst
    'bijst': {
      herstelvraag: "Is dit een extra naam voor iets wat al eerder is genoemd?",
      sleutelwoord: "extra",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk de bijstelling als onderwerp aangewezen.",
        redenering: "Het onderwerp doet of is iets en antwoordt op 'Wie of wat + PV?'. De bijstelling hernoemt een zinsdeel dat al eerder is benoemd; het staat direct naast dat zinsdeel.",
        herstap: "Vraag: wie of wat + PV? Dat is het onderwerp. Is er daarna een deel dat hetzelfde ding een andere naam geeft? Dat is de bijstelling.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────────
  // GROEP 2: PV-paren
  // ─────────────────────────────────────────────────────────────
  'pv': {

    // 10. pv→wg
    'wg': {
      herstelvraag: "Zijn er meer werkwoorden die samen de handeling vormen?",
      sleutelwoord: "samen",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk alleen de persoonsvorm gelabeld, maar het werkwoordelijk gezegde omvat alle werkwoorden.",
        redenering: "De persoonsvorm is slechts één werkwoord (het enige dat van vorm verandert). Het werkwoordelijk gezegde is het geheel van alle werkwoorden die samen de handeling uitdrukken.",
        herstap: "Tel alle werkwoorden in de zin. Eén daarvan is de PV; samen vormen ze het WG.",
      },
    },

    // 11. pv→ow
    'ow': {
      herstelvraag: "Wie of wat voert de handeling van de PV uit?",
      sleutelwoord: "uitvoert",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een woord als persoonsvorm aangewezen dat eigenlijk aangeeft wie de handeling doet.",
        redenering: "De persoonsvorm verandert bij de tijdproef. Het onderwerp antwoordt op 'Wie of wat + PV?' en is nooit zelf een werkwoord.",
        herstap: "Pas de tijd aan. Welk woord verandert van vorm? Dat is de PV. Vraag daarna: wie of wat + PV?",
      },
    },

    // 12. pv→lv
    'lv': {
      herstelvraag: "Wat ondergaat de handeling — welk deel is geen werkwoord?",
      sleutelwoord: "ondergaat",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een werkwoord als lijdend voorwerp aangewezen, of andersom.",
        redenering: "De persoonsvorm is altijd een werkwoord dat van vorm verandert bij de tijdproef. Het lijdend voorwerp is nooit een werkwoord; het antwoordt op 'Wie of wat + gezegde + onderwerp?'.",
        herstap: "Tijdproef: welk woord verandert bij tegenwoordig → verleden tijd? Dat is de PV. Geen werkwoord = geen PV.",
      },
    },

    // 13. pv→bwb
    'bwb': {
      herstelvraag: "Welk woord geeft extra info — of verandert het bij de tijdproef?",
      sleutelwoord: "tijdproef",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een bijwoordelijke bepaling als persoonsvorm aangewezen.",
        redenering: "De persoonsvorm is een werkwoord dat bij de tijdproef van vorm verandert. Een bijwoordelijke bepaling geeft info over tijd, plaats of manier, en is nooit een werkwoord.",
        herstap: "Pas de tijd aan. Welk woord verandert? Dat is de PV. Een bijwoord of voorzetselgroep verandert nooit bij de tijdproef.",
      },
    },

    // 14. pv→ng
    'ng': {
      herstelvraag: "Zegt dit gezegde wat het onderwerp is of wordt?",
      sleutelwoord: "wordt",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het koppelwerkwoord als persoonsvorm aangewezen, maar hier is het NG het gezegde.",
        redenering: "De persoonsvorm is het werkwoord dat van vorm verandert. Het naamwoordelijk gezegde omvat het koppelwerkwoord én het naamwoordelijk deel. Beide horen bij het NG.",
        herstap: "Is er een koppelwerkwoord (is, was, wordt, lijkt)? Dan is het gezegde een NG. De PV zit erin verwerkt, maar het geheel heet NG.",
      },
    },

    // 15. pv→mv
    'mv': {
      herstelvraag: "Ontvangt dit deel iets, of verandert het bij de tijdproef?",
      sleutelwoord: "ontvangt",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het meewerkend voorwerp als persoonsvorm aangewezen.",
        redenering: "De persoonsvorm is altijd een werkwoord dat van vorm verandert bij de tijdproef. Het meewerkend voorwerp is een persoon of ding dat iets ontvangt, en is geen werkwoord.",
        herstap: "Tijdproef: welk woord verandert van vorm? Dat is de PV. Een ontvanger is nooit de PV.",
      },
    },

    // 16. pv→vv
    'vv': {
      herstelvraag: "Begint dit deel met een vast voorzetsel, of verandert het bij tijdproef?",
      sleutelwoord: "voorzetsel",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een voorzetselgroep als persoonsvorm aangewezen.",
        redenering: "De persoonsvorm is een werkwoord dat bij de tijdproef van vorm verandert. Een voorzetselvoorwerp begint met een vast voorzetsel en is nooit een werkwoord.",
        herstap: "Tijdproef: welk woord verandert? Dat is de PV. Begint het deel met een voorzetsel? Dan is het geen PV.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────────
  // GROEP 3: WG-paren
  // ─────────────────────────────────────────────────────────────
  'wg': {

    // 17. wg→pv
    'pv': {
      herstelvraag: "Welk werkwoord verandert bij de tijdproef — slechts één?",
      sleutelwoord: "slechts",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk alle werkwoorden als één persoonsvorm aangewezen.",
        redenering: "Het werkwoordelijk gezegde omvat alle werkwoorden samen. De persoonsvorm is slechts het ene werkwoord dat bij de tijdproef van vorm verandert.",
        herstap: "Pas de tijd aan. Welk woord verandert? Dat is de PV. De rest van de werkwoorden hoort bij het WG.",
      },
    },

    // 18. wg→ng
    'ng': {
      herstelvraag: "Drukken deze werkwoorden een handeling uit of een toestand?",
      sleutelwoord: "toestand",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een naamwoordelijk gezegde als werkwoordelijk gezegde aangewezen.",
        redenering: "Het werkwoordelijk gezegde bestaat uit werkwoorden die een actie uitdrukken. Het naamwoordelijk gezegde bevat een koppelwerkwoord dat een eigenschap of toestand beschrijft.",
        herstap: "Is er een koppelwerkwoord (is, wordt, lijkt, blijft) plus een eigenschap? Dan is het een NG, geen WG.",
      },
    },

    // 19. wg→lv
    'lv': {
      herstelvraag: "Ondergaat dit deel de handeling, of drukt het de handeling uit?",
      sleutelwoord: "ondergaat",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk de werkwoorden als lijdend voorwerp aangewezen.",
        redenering: "Het werkwoordelijk gezegde bestaat uit werkwoorden die de handeling vormen. Het lijdend voorwerp ondergaat de handeling en is nooit een werkwoord.",
        herstap: "Vraag: wie of wat + gezegde + onderwerp? Dat is het LV. Zijn het werkwoorden? Dan is het het WG.",
      },
    },

    // 20. wg→bwb
    'bwb': {
      herstelvraag: "Zijn dit werkwoorden, of geven ze extra info?",
      sleutelwoord: "werkwoorden",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk de werkwoorden als bijwoordelijke bepaling aangewezen.",
        redenering: "Het werkwoordelijk gezegde bestaat uit werkwoorden. Een bijwoordelijke bepaling geeft info over tijd, plaats of manier en is nooit een werkwoord.",
        herstap: "Zijn het werkwoorden? Dan horen ze bij het WG. Geen werkwoorden = niet het WG.",
      },
    },

    // 21. wg→ow
    'ow': {
      herstelvraag: "Wie of wat doet de handeling — of zijn dit de werkwoorden?",
      sleutelwoord: "doet",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk de werkwoorden als onderwerp aangewezen.",
        redenering: "Het onderwerp antwoordt op 'Wie of wat + PV?' en is een zelfstandig naamwoord of pronomen. Het werkwoordelijk gezegde bestaat uit werkwoorden.",
        herstap: "Vraag: wie of wat + PV? Het antwoord is het onderwerp. De werkwoorden zelf vormen het WG.",
      },
    },

    // 22. wg→mv
    'mv': {
      herstelvraag: "Ontvangt dit deel iets, of voert het de handeling uit?",
      sleutelwoord: "ontvangt",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk de werkwoorden als meewerkend voorwerp aangewezen.",
        redenering: "Het werkwoordelijk gezegde bestaat uit werkwoorden. Het meewerkend voorwerp is een ontvanger en nooit een werkwoord.",
        herstap: "Zijn het werkwoorden? Dan is het het WG. Vraag: aan of voor wie? Dat levert het MV op.",
      },
    },

    // 23. wg→vv
    'vv': {
      herstelvraag: "Begint dit deel met een vast voorzetsel, of zijn het werkwoorden?",
      sleutelwoord: "voorzetsel",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk de werkwoorden als voorzetselvoorwerp aangewezen.",
        redenering: "Het werkwoordelijk gezegde bestaat uit werkwoorden. Het voorzetselvoorwerp begint met een vast voorzetsel en is nooit een werkwoord.",
        herstap: "Zijn het werkwoorden? Dan is het het WG. Begint het deel met een vast voorzetsel? Dan is het een VV.",
      },
    },

    // wg→wwd (blijft string, want wwd is sub-only)
    'wwd': "Het WWD hoort bij een naamwoordelijk gezegde, niet bij een werkwoordelijk. Bestaat dit gezegde uit een koppelwerkwoord plus een eigenschap?",
  },

  // ─────────────────────────────────────────────────────────────
  // GROEP 4: NG-paren
  // ─────────────────────────────────────────────────────────────
  'ng': {

    // 24. ng→wg
    'wg': {
      herstelvraag: "Drukt dit gezegde een actie uit, of een eigenschap of toestand?",
      sleutelwoord: "eigenschap",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een werkwoordelijk gezegde als naamwoordelijk gezegde aangewezen.",
        redenering: "Het naamwoordelijk gezegde bevat een koppelwerkwoord (is, wordt, lijkt) plus een eigenschap of zelfstandig naamwoord. Het werkwoordelijk gezegde drukt een actie uit.",
        herstap: "Is er een koppelwerkwoord plus een eigenschap of naam? Dan is het een NG. Gaat het om een actie? Dan is het een WG.",
      },
    },

    // 25. ng→lv
    'lv': {
      herstelvraag: "Ondergaat dit deel de handeling, of zegt het wat het OW is?",
      sleutelwoord: "ondergaat",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het naamwoordelijk gezegde als lijdend voorwerp aangewezen.",
        redenering: "Het naamwoordelijk gezegde beschrijft een eigenschap of toestand van het onderwerp. Het lijdend voorwerp ondergaat de handeling en antwoordt op 'Wie of wat + gezegde + onderwerp?'.",
        herstap: "Vraag: wie of wat + gezegde + onderwerp? Dat levert het LV op. Zegt het deel iets over wat het OW ís? Dan is het het NG.",
      },
    },

    // 26. ng→bwb
    'bwb': {
      herstelvraag: "Zegt dit deel wat het onderwerp is, of geeft het extra omstandigheidsinfo?",
      sleutelwoord: "omstandigheidsinfo",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het naamwoordelijk gezegde als bijwoordelijke bepaling aangewezen.",
        redenering: "Het naamwoordelijk gezegde zegt wat het onderwerp is of wordt, via een koppelwerkwoord. De bijwoordelijke bepaling geeft info over tijd, plaats of manier.",
        herstap: "Is er een koppelwerkwoord (is, wordt, lijkt) plus een eigenschap? Dan is het het NG. Kan het worden weggelaten zonder dat de zin kapot gaat? Dan is het misschien een BWB.",
      },
    },

    // 27. ng→ow
    'ow': {
      herstelvraag: "Wie of wat doet of ís iets — verwar je het gezegde met het onderwerp?",
      sleutelwoord: "gezegde",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het naamwoordelijk gezegde als onderwerp aangewezen.",
        redenering: "Het onderwerp antwoordt op 'Wie of wat + PV?' en is een zelfstandig naamwoord of pronomen. Het naamwoordelijk gezegde bevat een koppelwerkwoord plus een eigenschap.",
        herstap: "Vraag: wie of wat + PV? Dat is het onderwerp. De koppelwerkwoorden plus de eigenschap vormen het NG.",
      },
    },

    // 28. ng→pv
    'pv': {
      herstelvraag: "Welk werkwoord verandert bij de tijdproef — alleen dat ene?",
      sleutelwoord: "tijdproef",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het koppelwerkwoord als persoonsvorm aangewezen in plaats van het hele naamwoordelijk gezegde.",
        redenering: "De persoonsvorm is het werkwoord dat van vorm verandert. Het naamwoordelijk gezegde omvat dat koppelwerkwoord én het naamwoordelijk deel samen.",
        herstap: "Pas de tijd aan. Het werkwoord dat verandert, is de PV. Maar het gezegde omvat meer: koppelwerkwoord + eigenschap = NG.",
      },
    },

    // 29. ng→mv
    'mv': {
      herstelvraag: "Ontvangt dit deel iets, of beschrijft het een toestand van het OW?",
      sleutelwoord: "beschrijft",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het naamwoordelijk gezegde als meewerkend voorwerp aangewezen.",
        redenering: "Het naamwoordelijk gezegde beschrijft wat het onderwerp is of wordt. Het meewerkend voorwerp is een ontvanger en antwoordt op 'Aan of voor wie?'.",
        herstap: "Vraag: aan of voor wie? Dat levert het MV op. Zegt het deel wat het OW ís? Dan is het het NG.",
      },
    },

    // 30. ng→vv
    'vv': {
      herstelvraag: "Begint dit deel met een vast voorzetsel, of bevat het een koppelwerkwoord?",
      sleutelwoord: "koppelwerkwoord",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het naamwoordelijk gezegde als voorzetselvoorwerp aangewezen.",
        redenering: "Het naamwoordelijk gezegde bevat een koppelwerkwoord plus een eigenschap. Het voorzetselvoorwerp begint met een voorzetsel dat vast bij een woord hoort.",
        herstap: "Is er een koppelwerkwoord (is, wordt, lijkt) plus een eigenschap? Dan is het het NG. Begint het deel met een vast voorzetsel? Dan is het een VV.",
      },
    },

    // ng→wwd (blijft string, want wwd is sub-only)
    'wwd': "Zoek het woord dat zegt wát het onderwerp is of wordt. Is er ook een extra werkwoordelijk deel bij het koppelwerkwoord?",
  },

  // ─────────────────────────────────────────────────────────────
  // GROEP 5: LV-paren
  // ─────────────────────────────────────────────────────────────
  'lv': {

    // 31. lv→ow
    'ow': {
      herstelvraag: "Wie of wat doet de handeling — niet wie ondergaat?",
      sleutelwoord: "doet",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk gedacht: dit deel gaat over een persoon of ding, dus het is het lijdend voorwerp.",
        redenering: "Het lijdend voorwerp ondergaat de handeling ('wie of wat + gezegde + onderwerp?'). Het onderwerp verricht de handeling ('wie of wat + PV?'). Dat zijn twee verschillende zinsdelen.",
        herstap: "Vraag: wie of wat + PV? Dat is het onderwerp. Vraag: wie of wat + gezegde + onderwerp? Dat is het LV.",
      },
    },

    // 32. lv→vv
    'vv': {
      herstelvraag: "Hoort het voorzetsel hier onlosmakelijk bij een werkwoord?",
      sleutelwoord: "onlosmakelijk",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een voorzetselgroep als lijdend voorwerp aangewezen.",
        redenering: "Het lijdend voorwerp antwoordt op 'Wie of wat + gezegde + onderwerp?' en heeft geen vast voorzetsel. Het voorzetselvoorwerp begint met een voorzetsel dat vast bij een specifiek woord hoort.",
        herstap: "Vraag: wie of wat + gezegde + onderwerp? Als het antwoord begint met een vast voorzetsel, is het een VV.",
      },
    },

    // 33. lv→bwb
    'bwb': {
      herstelvraag: "Ondergaat dit deel de handeling, of geeft het extra omstandigheidsinfo?",
      sleutelwoord: "ondergaat",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk gedacht dat dit deel extra informatie geeft, maar het ondergaat juist de handeling.",
        redenering: "Het lijdend voorwerp ondergaat de handeling en antwoordt op 'Wie of wat + gezegde + onderwerp?'. De bijwoordelijke bepaling geeft info over tijd, plaats of manier en kan worden weggelaten.",
        herstap: "Vraag: wie of wat + gezegde + onderwerp? Als dat klopt, is het het LV, niet een BWB.",
      },
    },

    // 34. lv→mv
    'mv': {
      herstelvraag: "Ontvangt dit deel iets, of ondergaat het de handeling?",
      sleutelwoord: "ontvangt",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk gedacht: dit deel is de ontvanger, dus het is het lijdend voorwerp.",
        redenering: "Het lijdend voorwerp ondergaat de handeling ('wie of wat + gezegde + onderwerp?'). Het meewerkend voorwerp ontvangt iets ('aan of voor wie?'). Dat zijn twee aparte zinsdelen.",
        herstap: "Vraag: aan of voor wie? Als dat klopt, is het het MV. Vraag: wie of wat + gezegde + onderwerp? Dat is het LV.",
      },
    },

    // 35. lv→ng
    'ng': {
      herstelvraag: "Zegt dit deel wat het onderwerp is, of ondergaat het de handeling?",
      sleutelwoord: "ondergaat",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het naamwoordelijk gezegde als lijdend voorwerp aangewezen.",
        redenering: "Het lijdend voorwerp ondergaat de handeling. Het naamwoordelijk gezegde beschrijft een eigenschap of toestand van het onderwerp via een koppelwerkwoord.",
        herstap: "Is er een koppelwerkwoord (is, wordt, lijkt) plus een eigenschap? Dan is het het NG. Ondergaat het deel de handeling? Dan is het het LV.",
      },
    },

    // 36. lv→bijst
    'bijst': {
      herstelvraag: "Hernoemt dit deel iets wat al eerder is genoemd?",
      sleutelwoord: "hernoemt",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het lijdend voorwerp als bijstelling aangewezen.",
        redenering: "Het lijdend voorwerp ondergaat de handeling ('wie of wat + gezegde + onderwerp?'). De bijstelling is een extra naam voor iets wat al eerder is benoemd, staat direct naast dat zinsdeel.",
        herstap: "Vraag: wie of wat + gezegde + onderwerp? Dat is het LV. Staat er een extra naam direct naast een zinsdeel? Dan is dat de bijstelling.",
      },
    },

    // 37. lv→pv
    'pv': {
      herstelvraag: "Welk woord verandert bij de tijdproef — is dit een werkwoord?",
      sleutelwoord: "werkwoord",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het lijdend voorwerp als persoonsvorm aangewezen.",
        redenering: "De persoonsvorm is een werkwoord dat van vorm verandert bij de tijdproef. Het lijdend voorwerp is nooit een werkwoord; het antwoordt op 'Wie of wat + gezegde + onderwerp?'.",
        herstap: "Tijdproef: welk woord verandert? Dat is de PV. Een deel dat de handeling ondergaat, is nooit de PV.",
      },
    },

    // 38. lv→wg
    'wg': {
      herstelvraag: "Zijn dit de werkwoorden, of ondergaat dit deel de handeling?",
      sleutelwoord: "werkwoorden",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het lijdend voorwerp als werkwoordelijk gezegde aangewezen.",
        redenering: "Het werkwoordelijk gezegde bestaat uit werkwoorden die de handeling uitdrukken. Het lijdend voorwerp ondergaat de handeling en is nooit een werkwoord.",
        herstap: "Zijn het werkwoorden? Dan is het het WG. Ondergaat het deel de handeling? Dan is het het LV.",
      },
    },

    // 39. lv→bijzin
    'bijzin': {
      herstelvraag: "Heeft dit deel een eigen onderwerp én persoonsvorm?",
      sleutelwoord: "eigen",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een bijzin als lijdend voorwerp aangewezen — dat kán, maar controleer of het echt een bijzin is.",
        redenering: "Een bijzin heeft intern een eigen onderwerp en persoonsvorm. Als de bijzin de LV-functie vervult (wat hij zei), is de rol wél 'bijzin' — maar hier is het eigenlijk iets anders.",
        herstap: "Heeft dit deel intern een eigen PV? Zo ja, is het een bijzin. Zo niet, vraag: wie of wat + gezegde + onderwerp? Dat is het LV.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────────
  // GROEP 6: MV-paren
  // ─────────────────────────────────────────────────────────────
  'mv': {

    // 40. mv→ow
    'ow': {
      herstelvraag: "Wie of wat doet de handeling — niet wie ontvangt?",
      sleutelwoord: "doet",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk de ontvanger als handelende persoon aangewezen.",
        redenering: "Het onderwerp doet of is iets ('wie of wat + PV?'). Het meewerkend voorwerp ontvangt iets ('aan of voor wie?'). Dat zijn twee verschillende zinsdelen.",
        herstap: "Vraag: wie of wat + PV? Dat is het onderwerp. Vraag: aan of voor wie? Dat is het MV.",
      },
    },

    // 41. mv→lv
    'lv': {
      herstelvraag: "Ontvangt dit deel iets, of ondergaat het de handeling?",
      sleutelwoord: "ondergaat",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk de ontvanger als lijdend voorwerp aangewezen.",
        redenering: "Het meewerkend voorwerp is de ontvanger van de handeling ('aan of voor wie?'). Het lijdend voorwerp ondergaat de handeling ('wie of wat + gezegde + onderwerp?').",
        herstap: "Vraag: aan of voor wie? Dat is het MV. Vraag: wie of wat + gezegde + onderwerp? Dat is het LV.",
      },
    },

    // 42. mv→vv
    'vv': {
      herstelvraag: "Hoort het voorzetsel hier vast bij een werkwoord, of is dit een ontvanger?",
      sleutelwoord: "ontvanger",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het meewerkend voorwerp als voorzetselvoorwerp aangewezen.",
        redenering: "Het meewerkend voorwerp is een ontvanger ('aan of voor wie?'). Het voorzetselvoorwerp begint met een vast voorzetsel dat onlosmakelijk bij een werkwoord of adjectief hoort.",
        herstap: "Vraag: aan of voor wie? Dat is het MV. Hoort het voorzetsel onlosmakelijk bij een ander woord? Dan is het een VV.",
      },
    },

    // 43. mv→bwb
    'bwb': {
      herstelvraag: "Ontvangt dit deel iets, of geeft het extra omstandigheidsinfo?",
      sleutelwoord: "ontvangt",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het meewerkend voorwerp als bijwoordelijke bepaling aangewezen.",
        redenering: "Het meewerkend voorwerp antwoordt op 'Aan of voor wie?'. De bijwoordelijke bepaling geeft info over tijd, plaats of manier en kan worden weggelaten.",
        herstap: "Vraag: aan of voor wie? Als dat klopt, is het het MV. Kan het worden weggelaten als extra info? Dan is het een BWB.",
      },
    },

    // 44. mv→pv
    'pv': {
      herstelvraag: "Verandert dit deel bij de tijdproef — is het een werkwoord?",
      sleutelwoord: "tijdproef",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het meewerkend voorwerp als persoonsvorm aangewezen.",
        redenering: "De persoonsvorm is een werkwoord dat bij de tijdproef van vorm verandert. Het meewerkend voorwerp is een ontvanger en nooit een werkwoord.",
        herstap: "Tijdproef: welk woord verandert? Dat is de PV. Een ontvanger is geen werkwoord en nooit de PV.",
      },
    },

    // 45. mv→wg
    'wg': {
      herstelvraag: "Zijn dit werkwoorden, of ontvangt dit deel iets?",
      sleutelwoord: "werkwoorden",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het meewerkend voorwerp als werkwoordelijk gezegde aangewezen.",
        redenering: "Het werkwoordelijk gezegde bestaat uit werkwoorden die een handeling uitdrukken. Het meewerkend voorwerp is een ontvanger en nooit een werkwoord.",
        herstap: "Zijn het werkwoorden? Dan is het het WG. Vraag: aan of voor wie? Dat is het MV.",
      },
    },

    // 46. mv→ng
    'ng': {
      herstelvraag: "Zegt dit deel wat het OW is, of ontvangt het iets?",
      sleutelwoord: "ontvangt",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het meewerkend voorwerp als naamwoordelijk gezegde aangewezen.",
        redenering: "Het naamwoordelijk gezegde beschrijft een eigenschap of toestand van het onderwerp via een koppelwerkwoord. Het meewerkend voorwerp is een ontvanger.",
        herstap: "Is er een koppelwerkwoord plus eigenschap? Dan is het het NG. Vraag: aan of voor wie? Dat is het MV.",
      },
    },

    // 47. mv→bijzin
    'bijzin': {
      herstelvraag: "Heeft dit deel een eigen onderwerp én persoonsvorm?",
      sleutelwoord: "eigen",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een bijzin als meewerkend voorwerp aangewezen — dat kán, maar controleer of het echt een bijzin is.",
        redenering: "Een bijzin heeft intern een eigen onderwerp en persoonsvorm. Als de bijzin de MV-functie vervult, is het een bijzin — maar hier is het eigenlijk iets anders.",
        herstap: "Heeft dit deel intern een eigen PV? Zo ja, is het een bijzin. Zo niet, vraag: aan of voor wie? Dat is het MV.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────────
  // GROEP 7: VV-paren
  // ─────────────────────────────────────────────────────────────
  'vv': {

    // 48. vv→bwb
    'bwb': {
      herstelvraag: "Hoort het voorzetsel onlosmakelijk bij een specifiek werkwoord?",
      sleutelwoord: "onlosmakelijk",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een vast voorzetselgroep als bijwoordelijke bepaling aangewezen.",
        redenering: "Het voorzetselvoorwerp heeft een vast voorzetsel dat onlosmakelijk bij een specifiek werkwoord of adjectief hoort (denken aan, wachten op). De bijwoordelijke bepaling geeft vrije info over tijd of plaats.",
        herstap: "Hoort het voorzetsel vast bij een woord in de zin (je kunt het niet wisselen)? Dan is het een VV, geen BWB.",
      },
    },

    // 49. vv→lv
    'lv': {
      herstelvraag: "Ondergaat dit deel de handeling, of hangt het via een vast voorzetsel?",
      sleutelwoord: "hangt",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het voorzetselvoorwerp als lijdend voorwerp aangewezen.",
        redenering: "Het lijdend voorwerp antwoordt op 'Wie of wat + gezegde + onderwerp?' en heeft geen vast voorzetsel. Het voorzetselvoorwerp begint met een vast voorzetsel dat bij een werkwoord hoort.",
        herstap: "Begint het deel met een vast voorzetsel? Dan is het een VV. Vraag anders: wie of wat + gezegde + onderwerp? Dat is het LV.",
      },
    },

    // 50. vv→mv
    'mv': {
      herstelvraag: "Ontvangt dit deel iets, of hangt het vast aan een voorzetsel?",
      sleutelwoord: "vasthangt",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het voorzetselvoorwerp als meewerkend voorwerp aangewezen.",
        redenering: "Het meewerkend voorwerp is een ontvanger ('aan of voor wie?'). Het voorzetselvoorwerp heeft een vast voorzetsel dat bij een specifiek woord hoort; het is geen ontvanger.",
        herstap: "Hoort het voorzetsel vast bij een woord (bijv. wachten op, denken aan)? Dan is het een VV. Vraag: aan of voor wie? Dat is het MV.",
      },
    },

    // 51. vv→ow
    'ow': {
      herstelvraag: "Wie of wat doet de handeling — begint dit deel met een voorzetsel?",
      sleutelwoord: "voorzetsel",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een voorzetselgroep als onderwerp aangewezen.",
        redenering: "Het onderwerp antwoordt op 'Wie of wat + PV?' en begint nooit met een vast voorzetsel. Het voorzetselvoorwerp begint met een voorzetsel dat onlosmakelijk bij een woord hoort.",
        herstap: "Vraag: wie of wat + PV? Als het antwoord begint met een vast voorzetsel, is het een VV, geen OW.",
      },
    },

    // 52. vv→pv
    'pv': {
      herstelvraag: "Verandert dit deel bij de tijdproef — is het een werkwoord?",
      sleutelwoord: "tijdproef",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een voorzetselgroep als persoonsvorm aangewezen.",
        redenering: "De persoonsvorm is een werkwoord dat bij de tijdproef van vorm verandert. Het voorzetselvoorwerp begint met een voorzetsel en is nooit een werkwoord.",
        herstap: "Tijdproef: welk woord verandert? Dat is de PV. Een deel dat begint met een voorzetsel is geen werkwoord en nooit de PV.",
      },
    },

    // 53. vv→wg
    'wg': {
      herstelvraag: "Zijn dit werkwoorden, of begint dit deel met een vast voorzetsel?",
      sleutelwoord: "werkwoorden",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het voorzetselvoorwerp als werkwoordelijk gezegde aangewezen.",
        redenering: "Het werkwoordelijk gezegde bestaat uit werkwoorden die een handeling uitdrukken. Het voorzetselvoorwerp begint met een vast voorzetsel en bevat geen werkwoorden.",
        herstap: "Zijn het werkwoorden? Dan is het het WG. Begint het deel met een vast voorzetsel? Dan is het een VV.",
      },
    },

    // 54. vv→ng
    'ng': {
      herstelvraag: "Bevat dit deel een koppelwerkwoord plus eigenschap, of een vast voorzetsel?",
      sleutelwoord: "koppelwerkwoord",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het voorzetselvoorwerp als naamwoordelijk gezegde aangewezen.",
        redenering: "Het naamwoordelijk gezegde bevat een koppelwerkwoord (is, wordt, lijkt) plus een eigenschap. Het voorzetselvoorwerp begint met een vast voorzetsel en heeft geen koppelwerkwoord.",
        herstap: "Is er een koppelwerkwoord plus eigenschap? Dan is het het NG. Begint het deel met een vast voorzetsel? Dan is het een VV.",
      },
    },

    // 55. vv→bijzin
    'bijzin': {
      herstelvraag: "Heeft dit deel een eigen onderwerp én persoonsvorm?",
      sleutelwoord: "eigen",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het voorzetselvoorwerp als bijzin aangewezen.",
        redenering: "Een bijzin heeft intern een eigen onderwerp en persoonsvorm. Het voorzetselvoorwerp begint met een vast voorzetsel en heeft geen eigen PV.",
        herstap: "Heeft dit deel intern een eigen PV? Zo ja, is het een bijzin. Begint het met een vast voorzetsel zonder eigen PV? Dan is het een VV.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────────
  // GROEP 8: BWB-paren
  // ─────────────────────────────────────────────────────────────
  'bwb': {

    // 56. bwb→vv
    'vv': {
      herstelvraag: "Hoort het voorzetsel hier onlosmakelijk bij een specifiek werkwoord?",
      sleutelwoord: "onlosmakelijk",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een voorzetselgroep met een vast voorzetsel als bijwoordelijke bepaling aangewezen.",
        redenering: "De bijwoordelijke bepaling heeft een vrij voorzetsel (geeft info over tijd, plaats). Het voorzetselvoorwerp heeft een voorzetsel dat onlosmakelijk bij een specifiek werkwoord of adjectief hoort.",
        herstap: "Kun je het voorzetsel wisselen voor een ander? Dan is het een BWB. Hoort het vast bij een woord? Dan is het een VV.",
      },
    },

    // 57. bwb→lv
    'lv': {
      herstelvraag: "Ondergaat dit deel de handeling, of geeft het extra info?",
      sleutelwoord: "ondergaat",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het lijdend voorwerp als bijwoordelijke bepaling aangewezen.",
        redenering: "Het lijdend voorwerp ondergaat de handeling en antwoordt op 'Wie of wat + gezegde + onderwerp?'. De bijwoordelijke bepaling geeft extra info en kan worden weggelaten.",
        herstap: "Vraag: wie of wat + gezegde + onderwerp? Als dat klopt, is het het LV, niet een BWB.",
      },
    },

    // 58. bwb→ow
    'ow': {
      herstelvraag: "Wie of wat doet de handeling — is dit extra info of de actor?",
      sleutelwoord: "actor",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het onderwerp als bijwoordelijke bepaling aangewezen.",
        redenering: "Het onderwerp doet of is iets en antwoordt op 'Wie of wat + PV?'. De bijwoordelijke bepaling geeft info over omstandigheden en kan worden weggelaten.",
        herstap: "Vraag: wie of wat + PV? Als je dat deel weghaalt, valt de zin apart. Dat is het onderwerp, geen BWB.",
      },
    },

    // 59. bwb→bijzin
    'bijzin': {
      herstelvraag: "Heeft dit deel een eigen onderwerp én persoonsvorm?",
      sleutelwoord: "eigen",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een bijzin als bijwoordelijke bepaling aangewezen — een bijzin kán BWB-functie hebben, maar controleer of het echt een bijzin is.",
        redenering: "Een bijzin heeft intern een eigen onderwerp en persoonsvorm. De bijwoordelijke bepaling heeft dat niet; het geeft alleen extra info over omstandigheid.",
        herstap: "Heeft dit deel intern een eigen PV? Zo ja, is het een bijzin (met eventueel BWB-functie). Zo niet, is het een gewone BWB.",
      },
    },

    // 60. bwb→mv
    'mv': {
      herstelvraag: "Ontvangt dit deel iets, of geeft het extra omstandigheidsinfo?",
      sleutelwoord: "ontvangt",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het meewerkend voorwerp als bijwoordelijke bepaling aangewezen.",
        redenering: "Het meewerkend voorwerp is een ontvanger ('aan of voor wie?'). De bijwoordelijke bepaling geeft info over tijd, plaats of manier.",
        herstap: "Vraag: aan of voor wie? Als dat klopt, is het het MV. Geeft het deel extra omstandigheidsinfo? Dan is het een BWB.",
      },
    },

    // 61. bwb→ng
    'ng': {
      herstelvraag: "Zegt dit deel wat het OW is of wordt, of geeft het extra info?",
      sleutelwoord: "wordt",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk het naamwoordelijk gezegde als bijwoordelijke bepaling aangewezen.",
        redenering: "Het naamwoordelijk gezegde beschrijft een eigenschap of toestand van het onderwerp via een koppelwerkwoord. De bijwoordelijke bepaling geeft vrije omstandigheidsinfo.",
        herstap: "Is er een koppelwerkwoord (is, wordt, lijkt) plus eigenschap? Dan is het het NG. Kan het worden weggelaten als extra info? Dan is het een BWB.",
      },
    },

    // 62. bwb→bijst
    'bijst': {
      herstelvraag: "Hernoemt dit deel iets wat al eerder is genoemd?",
      sleutelwoord: "hernoemt",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk de bijstelling als bijwoordelijke bepaling aangewezen.",
        redenering: "De bijstelling is een extra naam voor iets wat al eerder is benoemd en staat direct naast dat zinsdeel. De bijwoordelijke bepaling geeft info over omstandigheid en staat vrij in de zin.",
        herstap: "Staat het deel direct naast een ander zinsdeel en geeft het hetzelfde ding een andere naam? Dan is het een bijstelling, geen BWB.",
      },
    },

    // 63. bwb→pv
    'pv': {
      herstelvraag: "Verandert dit deel bij de tijdproef — is het een werkwoord?",
      sleutelwoord: "tijdproef",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een bijwoordelijke bepaling als persoonsvorm aangewezen.",
        redenering: "De persoonsvorm is een werkwoord dat bij de tijdproef van vorm verandert. Een bijwoordelijke bepaling is nooit een werkwoord.",
        herstap: "Tijdproef: welk woord verandert? Dat is de PV. Een bijwoord of voorzetselgroep verandert nooit van vorm bij de tijdproef.",
      },
    },

    // 64. bwb→wg
    'wg': {
      herstelvraag: "Zijn dit werkwoorden die een handeling uitdrukken, of extra info?",
      sleutelwoord: "handeling",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk de werkwoorden als bijwoordelijke bepaling aangewezen.",
        redenering: "Het werkwoordelijk gezegde bestaat uit werkwoorden die de handeling vormen. De bijwoordelijke bepaling geeft info over omstandigheid en bevat geen werkwoorden.",
        herstap: "Zijn het werkwoorden? Dan is het het WG. Geeft het deel info over tijd, plaats of manier? Dan is het een BWB.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────────
  // GROEP 9: Bijstelling-paren
  // ─────────────────────────────────────────────────────────────
  'bijst': {

    // 65. bijst→bijv_bep
    'bijv_bep': {
      herstelvraag: "Hernoemt dit deel een heel zinsdeel, of beschrijft het één woord?",
      sleutelwoord: "hernoemt",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een bijvoeglijke bepaling als bijstelling aangewezen.",
        redenering: "De bijstelling is een extra naam voor een heel zinsdeel en staat direct naast dat zinsdeel. De bijvoeglijke bepaling beschrijft één zelfstandig naamwoord binnen een zinsdeel.",
        herstap: "Staat het deel naast een héél zinsdeel en geeft het hetzelfde ding een andere naam? Dan is het een bijstelling. Beschrijft het alleen één woord? Dan is het een bijvoeglijke bepaling.",
      },
    },

    // 66. bijst→ow
    'ow': {
      herstelvraag: "Wie of wat doet de handeling — of is dit een extra naam?",
      sleutelwoord: "extra",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk de bijstelling als onderwerp aangewezen.",
        redenering: "Het onderwerp doet of is iets ('wie of wat + PV?'). De bijstelling is een extra naam voor een zinsdeel dat al eerder is benoemd; het is geen nieuwe actor.",
        herstap: "Vraag: wie of wat + PV? Dat is het onderwerp. Staat er een extra naam direct naast een zinsdeel? Dan is dat de bijstelling.",
      },
    },

    // 67. bijst→lv
    'lv': {
      herstelvraag: "Ondergaat dit deel de handeling, of geeft het een extra naam?",
      sleutelwoord: "ondergaat",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk de bijstelling als lijdend voorwerp aangewezen.",
        redenering: "Het lijdend voorwerp ondergaat de handeling ('wie of wat + gezegde + onderwerp?'). De bijstelling hernoemt een zinsdeel dat al eerder is benoemd.",
        herstap: "Vraag: wie of wat + gezegde + onderwerp? Dat is het LV. Staat er een extra naam direct naast een zinsdeel? Dan is dat de bijstelling.",
      },
    },

    // 68. bijst→bwb
    'bwb': {
      herstelvraag: "Geeft dit deel extra omstandigheidsinfo, of hernoemt het iets?",
      sleutelwoord: "omstandigheidsinfo",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk de bijstelling als bijwoordelijke bepaling aangewezen.",
        redenering: "De bijstelling hernoemt een zinsdeel dat al eerder is benoemd en staat direct ernaast. De bijwoordelijke bepaling geeft vrije info over tijd, plaats of manier.",
        herstap: "Staat het deel direct naast een zinsdeel en hernoemt het hetzelfde ding? Dan is het een bijstelling. Geeft het info over omstandigheid? Dan is het een BWB.",
      },
    },

    // 69. bijst→pv
    'pv': {
      herstelvraag: "Verandert dit deel bij de tijdproef — is het een werkwoord?",
      sleutelwoord: "tijdproef",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een bijstelling als persoonsvorm aangewezen.",
        redenering: "De persoonsvorm is een werkwoord dat bij de tijdproef van vorm verandert. De bijstelling is nooit een werkwoord; het hernoemt een zinsdeel.",
        herstap: "Tijdproef: welk woord verandert? Dat is de PV. Een extra naam voor een zinsdeel is nooit de PV.",
      },
    },

    // 70. bijst→mv
    'mv': {
      herstelvraag: "Ontvangt dit deel iets, of geeft het een extra naam?",
      sleutelwoord: "ontvangt",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk de bijstelling als meewerkend voorwerp aangewezen.",
        redenering: "Het meewerkend voorwerp is een ontvanger ('aan of voor wie?'). De bijstelling hernoemt een zinsdeel dat al eerder is benoemd.",
        herstap: "Vraag: aan of voor wie? Dat is het MV. Staat er een extra naam direct naast een zinsdeel? Dan is dat de bijstelling.",
      },
    },

    // 71. bijst→vv
    'vv': {
      herstelvraag: "Hoort het voorzetsel hier vast bij een werkwoord, of is dit een extra naam?",
      sleutelwoord: "extra",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een bijstelling als voorzetselvoorwerp aangewezen.",
        redenering: "Het voorzetselvoorwerp heeft een vast voorzetsel dat bij een werkwoord hoort. De bijstelling hernoemt een zinsdeel en begint nooit met een vast voorzetsel.",
        herstap: "Begint het deel met een voorzetsel dat vast bij een woord hoort? Dan is het een VV. Hernoemt het een zinsdeel? Dan is het een bijstelling.",
      },
    },

    // 72. bijst→bijzin
    'bijzin': {
      herstelvraag: "Heeft dit deel een eigen onderwerp én persoonsvorm?",
      sleutelwoord: "eigen",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een bijstelling als bijzin aangewezen.",
        redenering: "Een bijzin heeft intern een eigen onderwerp en persoonsvorm. De bijstelling hernoemt een zinsdeel en heeft geen eigen PV.",
        herstap: "Heeft dit deel intern een eigen PV? Zo ja, is het een bijzin. Hernoemt het een zinsdeel zonder eigen PV? Dan is het een bijstelling.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────────
  // GROEP 10: Bijzin-paren
  // ─────────────────────────────────────────────────────────────
  'bijzin': {

    // 73. bijzin→bwb
    'bwb': {
      herstelvraag: "Heeft dit deel een eigen onderwerp én persoonsvorm, of is het extra info?",
      sleutelwoord: "persoonsvorm",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk gedacht dat dit extra info geeft, maar het heeft een eigen persoonsvorm.",
        redenering: "Een bijzin heeft intern een eigen onderwerp en persoonsvorm. Een bijwoordelijke bepaling heeft dat niet; het geeft vrije omstandigheidsinfo.",
        herstap: "Zoek een werkwoord bínnen dit deel. Is er een eigen PV? Dan is het een bijzin. Geen eigen PV? Dan is het een BWB.",
      },
    },

    // 74. bijzin→ow
    'ow': {
      herstelvraag: "Heeft dit deel een eigen PV — of is het het handelende zinsdeel?",
      sleutelwoord: "handelende",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een bijzin als onderwerp aangewezen — een bijzin kán OW-functie vervullen, maar controleer of het hier het geval is.",
        redenering: "Een bijzin heeft intern een eigen PV. Het onderwerp van de hoofdzin antwoordt op 'Wie of wat + PV van de hoofdzin?'. Hier is het correct antwoord een ander zinsdeel.",
        herstap: "Vraag: wie of wat + PV van de hoofdzin? Als dit deel intern een eigen PV heeft, is het een bijzin. Anders is het het onderwerp.",
      },
    },

    // 75. bijzin→lv
    'lv': {
      herstelvraag: "Heeft dit deel een eigen PV, of ondergaat het de handeling?",
      sleutelwoord: "ondergaat",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een bijzin als lijdend voorwerp aangewezen — dat kán, maar controleer of het echt een bijzin is.",
        redenering: "Een bijzin heeft intern een eigen PV. Het lijdend voorwerp heeft dat niet; het antwoordt op 'Wie of wat + gezegde + onderwerp?'.",
        herstap: "Heeft dit deel intern een eigen PV? Zo ja, is het een bijzin. Zo niet, vraag: wie of wat + gezegde + onderwerp?",
      },
    },

    // 76. bijzin→mv
    'mv': {
      herstelvraag: "Heeft dit deel een eigen PV, of ontvangt het de handeling?",
      sleutelwoord: "ontvangt",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een bijzin als meewerkend voorwerp aangewezen.",
        redenering: "Een bijzin heeft intern een eigen PV. Het meewerkend voorwerp heeft dat niet; het antwoordt op 'Aan of voor wie?'.",
        herstap: "Heeft dit deel intern een eigen PV? Zo ja, is het een bijzin. Zo niet, vraag: aan of voor wie?",
      },
    },

    // 77. bijzin→vv
    'vv': {
      herstelvraag: "Begint dit deel met een vast voorzetsel en heeft het geen eigen PV?",
      sleutelwoord: "voorzetsel",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een bijzin als voorzetselvoorwerp aangewezen.",
        redenering: "Een bijzin heeft intern een eigen PV. Het voorzetselvoorwerp begint met een vast voorzetsel en heeft geen eigen PV.",
        herstap: "Heeft dit deel intern een eigen PV? Zo ja, is het een bijzin. Begint het met een vast voorzetsel zonder eigen PV? Dan is het een VV.",
      },
    },

    // 78. bijzin→pv
    'pv': {
      herstelvraag: "Welk enkel woord verandert bij de tijdproef — niet een heel deel?",
      sleutelwoord: "enkel",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een bijzin als persoonsvorm aangewezen.",
        redenering: "De persoonsvorm is één werkwoord dat van vorm verandert bij de tijdproef. Een bijzin is een heel zinsdeel met een eigen PV; de bijzin zelf is nooit de PV.",
        herstap: "Tijdproef: welk woord verandert? Dat is de PV. Een bijzin is nooit één woord en dus nooit de PV.",
      },
    },

    // 79. bijzin→wg
    'wg': {
      herstelvraag: "Zijn dit werkwoorden van de hoofdzin, of heeft dit deel een eigen PV?",
      sleutelwoord: "hoofdzin",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een bijzin als werkwoordelijk gezegde aangewezen.",
        redenering: "Het werkwoordelijk gezegde bestaat uit de werkwoorden van de hoofdzin. Een bijzin heeft intern een eigen PV en is een apart zinsdeel.",
        herstap: "Heeft dit deel intern een eigen PV? Zo ja, is het een bijzin. Zijn het de werkwoorden van de hoofdzin? Dan is het het WG.",
      },
    },

    // 80. bijzin→bijst (NIEUW)
    'bijst': {
      herstelvraag: "Hernoemt dit deel iets eerder genoemds, of heeft het een eigen PV?",
      sleutelwoord: "hernoemt",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een bijzin als bijstelling aangewezen.",
        redenering: "Een bijzin heeft intern een eigen PV en staat als zelfstandig zinsdeel. De bijstelling hernoemt een zinsdeel dat al eerder is benoemd en heeft geen eigen PV.",
        herstap: "Heeft dit deel intern een eigen PV? Zo ja, is het een bijzin. Hernoemt het een zinsdeel? Dan is het een bijstelling.",
      },
    },

    // 81. bijzin→ng (NIEUW)
    'ng': {
      herstelvraag: "Bevat dit deel een koppelwerkwoord plus eigenschap, of een eigen PV?",
      sleutelwoord: "koppelwerkwoord",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk een bijzin als naamwoordelijk gezegde aangewezen.",
        redenering: "Het naamwoordelijk gezegde bevat een koppelwerkwoord plus een eigenschap en beschrijft de toestand van het onderwerp. Een bijzin heeft intern een eigen PV en is een apart zinsdeel.",
        herstap: "Heeft dit deel intern een eigen PV? Zo ja, is het een bijzin. Is er een koppelwerkwoord plus eigenschap? Dan is het het NG.",
      },
    },
  },

  // ─────────────────────────────────────────────────────────────
  // GROEP 11: Voegwoord-paren
  // ─────────────────────────────────────────────────────────────
  'vw_onder': {

    // 82. vw_onder→vw_neven
    'vw_neven': {
      herstelvraag: "Verbindt dit woord twee gelijkwaardige zinnen, of leidt het een bijzin in?",
      sleutelwoord: "gelijkwaardige",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk gedacht dat dit woord twee hoofdzinnen verbindt.",
        redenering: "Een nevenschikkend voegwoord (en, maar, want, of, dus) verbindt twee gelijke hoofdzinnen. Een onderschikkend voegwoord (omdat, dat, als, terwijl) leidt een bijzin in die niet op zichzelf kan staan.",
        herstap: "Kan het deel na het voegwoord zelfstandig als zin staan? Zo nee, is het voegwoord onderschikkend.",
      },
    },

    // 83. vw_onder→bwb
    'bwb': "Dit is een verbindingswoord dat een bijzin inleidt, geen bijwoordelijke bepaling. Vraag: leidt dit woord een bijzin in, of geeft het zelf info over tijd, plaats of manier?",

    // 84. vw_onder→bijzin
    'bijzin': "Je kiest hier één woord (het voegwoord), maar de bijzin is het hele deel dat volgt inclusief dat woord. Welk deel heeft een eigen onderwerp én persoonsvorm?",

    // Blijven strings (categorie-overschrijdend):
    'pv': "Dit is een verbindingswoord, geen werkwoord. Welk woord verandert bij de tijdproef?",
    'ow': "Dit is een verbindingswoord, geen zinsdeel. Vraag: wie of wat + PV?",
    'lv': "Dit is een verbindingswoord, geen zinsdeel. Vraag: wie of wat + gezegde + onderwerp?",
    'mv': "Dit is een verbindingswoord, geen zinsdeel. Vraag: aan of voor wie?",
    'wg': "Een verbindingswoord is geen werkwoord. Zoek de werkwoorden die samen de handeling uitdrukken.",
    'ng': "Een verbindingswoord zegt niets over wat het OW is of wordt. Zoek het koppelwerkwoord plus de eigenschap.",
  },

  'vw_neven': {

    // 85. vw_neven→vw_onder
    'vw_onder': {
      herstelvraag: "Leidt dit woord een bijzin in, of verbindt het twee gelijke hoofdzinnen?",
      sleutelwoord: "bijzin",
      uitleg: {
        diagnose: "Je hebt waarschijnlijk gedacht dat dit woord een bijzin inleidt.",
        redenering: "Een onderschikkend voegwoord leidt een bijzin in die niet zelfstandig kan staan. Een nevenschikkend voegwoord (en, maar, want, of, dus) verbindt twee gelijke hoofdzinnen.",
        herstap: "Kan het deel dat volgt zelfstandig als zin staan? Zo ja, is het voegwoord nevenschikkend.",
      },
    },

    // 86. vw_neven→bwb
    'bwb': "Dit is een verbindingswoord dat twee hoofdzinnen koppelt, geen bijwoordelijke bepaling. Vraag: verbindt dit woord twee zinnen, of geeft het zelf omstandigheidsinfo?",

    // 87. vw_neven→bijzin
    'bijzin': "Je kiest hier één woord (het voegwoord), maar de bijzin is het hele deel dat volgt. Heeft het deel dat volgt een eigen onderwerp én persoonsvorm?",

    // Blijven strings (categorie-overschrijdend):
    'pv': "Dit is een verbindingswoord, geen werkwoord. Welk woord verandert bij de tijdproef?",
    'ow': "Dit is een verbindingswoord, geen zinsdeel. Vraag: wie of wat + PV?",
    'lv': "Dit is een verbindingswoord, geen zinsdeel. Vraag: wie of wat + gezegde + onderwerp?",
    'mv': "Dit is een verbindingswoord, geen zinsdeel. Vraag: aan of voor wie?",
    'wg': "Een verbindingswoord is geen werkwoord. Zoek de werkwoorden die samen de handeling uitdrukken.",
    'ng': "Een verbindingswoord zegt niets over wat het OW is of wordt. Zoek het koppelwerkwoord plus de eigenschap.",
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
