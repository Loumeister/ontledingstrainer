# Specificatie: Grammatica & Werkwoordspelling Trainer

Dit document beschrijft de specificatie voor de complete app, bestaande uit meerdere modules die samen een integrale benadering van grammatica en werkwoordspelling vormen.

*Laatste update: maart 2025 — uitgebreid met bevindingen uit code-review en nieuwe didactische voorstellen.*

---

## Visie

Een browser-based app die leerlingen in de onderbouw van havo/vwo (12-15 jaar) leert ontleden en werkwoorden correct spellen, volgens de laatste wetenschappelijke inzichten in de Nederlandse grammaticadidactiek. De basisprincipes:

1. **Grammatica als fundament**: Zinsontleding is de voorwaarde voor werkwoordspelling
2. **Modulair, niet lineair**: Modules zijn onafhankelijk toegankelijk, maar bouwen op elkaar voort
3. **Veel kennis van weinig**: Per module één concept tot automatisme
4. **Transfer naar schrijven**: Van geïsoleerde oefening naar toepassing in tekst
5. **Adaptief en scaffolded**: De app past zich aan het niveau van de leerling aan en bouwt ondersteuning geleidelijk af

---

## Doelgroep & Referentieniveaus

| Doelgroep | Referentieniveau | Focus |
|-----------|-----------------|-------|
| Onderbouw havo/vwo | 2F (streefniveau) | Volledige werkwoordspelling + zinsontleding |
| Eindexamen havo | 3F | Foutloze toepassing in zakelijke teksten |
| Eindexamen vwo | 4F | Reflectie op taalsysteem en nuances |

De app richt zich primair op 2F, met uitbreidingsmogelijkheden naar 3F.

---

## Module-overzicht

```
┌─────────────────────────────────────────────────────────┐
│                    GRAMMATICA TRAINER                     │
│                                                          │
│  ┌──────────────────┐    ┌────────────────────────────┐  │
│  │  MODULE 1        │    │  MODULE 2                  │  │
│  │  Zinsontleding   │───▶│  Werkwoordspelling         │  │
│  │  (bestaande app) │    │  (nieuwe module)            │  │
│  └──────────────────┘    └────────────────────────────┘  │
│           │                          │                    │
│           ▼                          ▼                    │
│  ┌──────────────────┐    ┌────────────────────────────┐  │
│  │  MODULE 3        │    │  MODULE 4                  │  │
│  │  Foutentekst     │    │  Peer-review               │  │
│  │  (transfer)      │    │  (samenwerking)            │  │
│  └──────────────────┘    └────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Module 1: Zinsontleding (Bestaand - MVP)

### Status: Werkend ✅

De huidige Ontleedlab. Tweestapsproces:
1. **Zinsdeelproef**: Zin in zinsdelen knippen
2. **Benoemen**: Zinsdelen labelen via drag-and-drop

### Bestaande features
- 100+ zinnen over 4 moeilijkheidsniveaus (26 Basis, 74 Middel, ~30 Hoog, ~15 Samengesteld)
- 13 grammaticale rollen (PV, OW, LV, MV, BWB, VV, WG, NG, Bijzin, etc.)
- Contextuele feedback via FEEDBACK_MATRIX
- Hint-systeem (PV → OW → GZ → rest)
- Session-modus met foutenstatistieken
- Filtering op niveau, type gezegde, specifieke zinsdelen
- Dark mode, groot lettertype, dyslexie-modus, responsive design
- Docentenmodus: eigen zinnen aanmaken, delen via URL, importeren
- Leerlingrapportage via rapportcodes
- Sessiegeschiedenis en voortgangsgrafiek

### Geplande uitbreidingen Module 1

Zie `TODO.md` voor de volledige roadmap. De belangrijkste uitbreidingen:

#### 1a. Rollenladder (Scaffolded Role Introduction)

Een adaptief systeem dat de 13 rollen stapsgewijs introduceert:

```
Trede 1: PV alleen         → "Vind de persoonsvorm"
Trede 2: PV + OW           → "Vind PV en onderwerp"
Trede 3: PV + OW + LV/MV/BWB → "Kern-zinsdelen"
Trede 4: + VV, WG/NG       → "Uitgebreid"
Trede 5: Alle 13 rollen    → "Volledig" (huidige modus)
```

**Technische specificatie:**

```typescript
interface RollenladderConfig {
  trede: 1 | 2 | 3 | 4 | 5;
  activeRoles: RoleKey[];           // Rollen die zichtbaar zijn in toolbar
  masteryThreshold: number;         // Percentage correct voor promotie (default: 80)
  windowSize: number;               // Aantal zinnen voor berekening (default: 10)
  autoPromote: boolean;             // Automatisch promoveren bij beheersing
  autoSuggestDemote: boolean;       // Suggestie bij 3x <60%
}

// Mapping trede → actieve rollen
const TREDE_ROLES: Record<number, RoleKey[]> = {
  1: ['pv'],
  2: ['pv', 'ow'],
  3: ['pv', 'ow', 'lv', 'mv', 'bwb'],
  4: ['pv', 'ow', 'lv', 'mv', 'bwb', 'vv', 'wg', 'nwd'],
  5: ['pv', 'ow', 'lv', 'mv', 'bwb', 'bijv_bep', 'vv', 'wg', 'nwd', 'bijst', 'bijzin', 'vw_neven', 'vw_onder'],
};
```

**Validatie-aanpassing:** Tokens met een rol buiten de actieve trede worden bij de validatie als "rest" beschouwd en niet fout gerekend. De leerling hoeft deze tokens niet te labelen.

#### 1b. Tap-to-Place Interactie

Alternatief voor drag-and-drop, essentieel voor tablets:

```typescript
// Aanvulling op TrainerState
interface TapToPlaceState {
  selectedRole: RoleKey | null;       // Actief geselecteerde rol
  tapMode: boolean;                   // Is tap-modus actief?
}

// Flow:
// 1. Tik op WordChip → selectedRole = 'pv'
// 2. Tik op DropZone → chunkLabels[chunkIndex] = 'pv', selectedRole = null
// 3. Tik op geplaatst label → label verwijderd
```

**UI-indicatoren:**
- Geselecteerd kaartje: `ring-2 ring-blue-500 animate-pulse`
- Beschikbare drop-targets: `ring-1 ring-dashed ring-blue-300` (subtiele uitnodiging)
- Na plaatsing: kort flash-effect (`animate-ping` 300ms)

#### 1c. Contrastieve Oefenparen

Na een fout toont de app twee korte voorbeeldzinnen die het verschil illustreren:

```typescript
interface ContrastPair {
  roleA: RoleKey;
  roleB: RoleKey;
  sentenceA: string;         // Voorbeeldzin met rolA gemarkeerd
  sentenceB: string;         // Voorbeeldzin met rolB gemarkeerd
  explanation: string;       // Uitleg van het verschil
  questionMethod: string;    // Hoe bepaal je het verschil?
}

// Voorbeeld:
const CONTRAST_PAIRS: ContrastPair[] = [
  {
    roleA: 'lv',
    roleB: 'mv',
    sentenceA: 'Jan leest [het boek]. → LV: Wie/wat leest Jan?',
    sentenceB: 'Jan geeft [Maria] een boek. → MV: Aan wie geeft Jan?',
    explanation: 'Het LV is het "slachtoffer" van de handeling. Het MV is de ontvanger.',
    questionMethod: 'LV: wie/wat + GZ + OW? MV: aan/voor wie?',
  },
  // ... meer paren voor PV↔WG, LV↔OW, BWB↔VV, OW↔LV
];
```

#### 1d. Metacognitieve Denkstap-prompt

```typescript
interface MetacognitiveConfig {
  enabled: boolean;
  frequency: 'always' | 'fading' | 'never';  // 'fading' = minder na successen
  fadingThreshold: number;                      // Aantal successen waarna frequentie daalt
  prompts: Record<RoleKey, string>;             // Rolspecifieke herinneringen
}

// Voorbeeldprompts:
const METACOGNITIVE_PROMPTS: Record<RoleKey, string> = {
  pv: '🤔 Heb je de tijdsproef gedaan? Verander de zin van tijd — welk woord verandert?',
  ow: '🤔 Heb je gevraagd: wie of wat + persoonsvorm?',
  lv: '🤔 Heb je gevraagd: wie of wat + gezegde + onderwerp?',
  mv: '🤔 Heb je gevraagd: aan/voor wie + gezegde + onderwerp?',
  bwb: '🤔 Heb je gevraagd: waar, wanneer, hoe of waarom?',
  // ...
};
```

#### 1e. Kwalitatieve Foutenclassificatie

```typescript
type ErrorType = 'analyse' | 'toepassing' | 'inprenting';

interface ErrorClassification {
  chunkIndex: number;
  studentRole: RoleKey;
  correctRole: RoleKey;
  errorType: ErrorType;
  intervention: string;          // Gerichte tip
}

// Classificatieregels:
// - Analysefout: splitfout OF PV/OW niet herkend (fundamenteel concept gemist)
// - Toepassingsfout: correct gesplitst, maar verwisseling (LV↔MV, BWB↔VV)
// - Inprentfout: dezelfde foutcombinatie >3x in sessiehistorie
```

---

## Module 2: Werkwoordspelling (Nieuw)

### Status: Gepland

Bouwt voort op de grammaticakennis uit Module 1. De leerling moet eerst de PV kunnen identificeren (zinsontleding) voordat hij deze correct kan spellen.

### Wetenschappelijke basis

De werkwoordspelling vereist een syntactische analyse die aan de spelling voorafgaat:
1. Is dit woord een persoonsvorm, voltooid deelwoord of infinitief?
2. In welke tijd staat de zin?
3. Wat is het onderwerp (voor congruentie)?

**Kernprobleem (Chamalaun 2023):** Homofoondominantie - het brein selecteert de meest frequente vorm van een klankbeeld. "Wordt" is frequenter dan "word", waardoor de dominante vorm ook bij de 1e persoon wordt gekozen.

### Submodules (modulair aanbieden)

#### 2A: Persoonsvorm Tegenwoordige Tijd
- **Focus**: stam + t-regel
- **Methode**: algoritmisch (stam bepalen → persoon bepalen → regel toepassen) + analogie ("denk aan lopen")
- **Oefenvormen**:
  - Invuloefening: "Ik [loop/loopt] naar school"
  - Keuze-oefening: welke vorm is correct?
  - Markeer de PV en spel correct

#### 2B: Homofoon-training
- **Focus**: wordt/word, vind/vindt, antwoord/antwoordt
- **Methode**: visuele waarschuwingen bij bekende homofonen, extra herhaling van de minder-frequente vorm
- **Oefenvormen**:
  - Zinnen met homofone keuzes
  - Frequentie-inversie: de minder-frequente vorm vaker aanbieden
  - Uitleg bij elke keuze: welke grammaticale functie?

#### 2C: Verleden Tijd
- **Focus**: zwakke werkwoorden met 't kofschip
- **Methode**: stam bepalen → laatste letter stam → 't kofschip toepassen
- **Taalbeschouwing**: uitleg stemhebbend vs. stemloos (de fonologische achtergrond)
- **Oefenvormen**:
  - Stam bepalen (losse oefening)
  - 't kofschip toepassen
  - Volledige verleden tijdsvorm maken

#### 2D: Voltooid Deelwoord
- **Focus**: ge- + stam + d/t
- **Methode**: combinatie van algoritmisch + analogie
- **Aandachtspunt**: onderscheid PV vs. voltooid deelwoord (homofonie!)
- **Oefenvormen**:
  - Herken: is dit een PV of een voltooid deelwoord?
  - Spel het voltooid deelwoord correct
  - Zin-context: welke vorm hoort hier?

#### 2E: Alles Samen
- Integratie van alle submodules
- Gemengde oefeningen
- Transfer-zinnen (langere, complexere contexten)

### Didactische principes voor Module 2

| Principe | Implementatie |
|----------|--------------|
| Expliciete Directe Instructie (EDI) | Worked examples bij elk nieuw concept: "denk-hardop" uitleg |
| Analogie als primaire strategie | "Denk aan lopen" hints altijd beschikbaar |
| Algoritme als controle | Beslisboom beschikbaar als check |
| 100%-beheersingscriterium | Submodule pas voltooid bij 100% (kern) of 90% (complex) |
| Homofoondominantie tegengaan | Minder-frequente vorm vaker aanbieden |
| Adaptieve herhaling | Foutieve items komen terug in de sessie |
| Informationele feedback | Niet alleen goed/fout, maar uitleg waarom |

### Technische specificatie Module 2

```typescript
interface VerbExercise {
  id: string;
  sentence: string;            // De volledige zin
  targetWord: string;          // Het werkwoord dat gespeld moet worden
  targetIndex: number;         // Positie in de zin
  correctForm: string;         // Juiste spelling
  alternatives: string[];      // Foute alternatieven (voor keuze-oefening)
  verbType: 'pv_tt' | 'pv_vt' | 'voltooid_deelwoord' | 'infinitief';
  isHomophone: boolean;        // Heeft dit woord een homofone tegenhanger?
  homophoneContext?: string;   // Uitleg over de homofonie
  analogyHint?: string;        // "Denk aan: hij loopt → hij ..."
  algorithmSteps?: string[];   // Stappen van het algoritme
  explanation: string;         // Uitleg bij het juiste antwoord
  submodule: '2A' | '2B' | '2C' | '2D' | '2E';
}

interface VerbSession {
  exercises: VerbExercise[];
  currentIndex: number;
  score: number;
  mistakes: VerbExercise[];    // Voor herhaling
  masteryLevel: number;        // 0-100%
}
```

---

## Module 3: Foutentekst (Transfer naar schrijven)

### Status: Concept

Overbrugt de kloof tussen geïsoleerde oefening en vrij schrijven.

### Oefenvorm
1. Leerling krijgt een tekst (3-5 zinnen) met 2-4 grammaticafouten
2. Leerling markeert de fouten (klik op het woord)
3. Leerling corrigeert de fout (typ de juiste vorm)
4. Feedback: was de markering correct? Was de correctie juist?

### Technische specificatie

```typescript
interface TextExercise {
  id: string;
  text: string;                      // Volledige tekst (met fouten)
  errors: TextError[];
}

interface TextError {
  wordIndex: number;
  incorrectForm: string;
  correctForm: string;
  errorType: 'spelling' | 'congruentie' | 'deelwoord' | 'homofoon';
  explanation: string;
}
```

---

## Module 4: Peer-review (Toekomst)

### Status: Idee

Leerlingen controleren elkaars zinsontledingen. Vereist een backend of gedeelde sessie-functionaliteit.

---

## Architectuur

### Huidige structuur (maart 2025)
```
App.tsx (~143 regels - router/shell)
├── hooks/
│   ├── useTrainer.ts (825 regels - alle state & logica)
│   └── useSentences.ts (sentence fetching)
├── screens/
│   ├── HomeScreen.tsx (250 regels - configuratie)
│   ├── TrainerScreen.tsx (432 regels - oefening)
│   ├── ScoreScreen.tsx (372 regels - resultaten)
│   ├── SentenceEditorScreen.tsx (editor)
│   └── UsageLogScreen.tsx (analytics)
├── components/ (9 componenten, ~1675 regels totaal)
│   ├── WordChip.tsx, DropZone.tsx, HelpModal.tsx
│   ├── ConfirmationModal.tsx, ScoreRing.tsx
│   ├── SentenceResultCard.tsx, ProgressChart.tsx
│   ├── ZinsdeelHelpModal.tsx, EditorView.tsx
├── data/
│   ├── sentences-level-{1-4}.json
│   ├── sentences-review.json
│   ├── sentenceLoader.ts
│   └── customSentenceStore.ts
├── validation.ts (313 regels - kernvalidatie)
├── constants.ts (291 regels - rollen, feedback, hints)
├── types.ts (74 regels - alle interfaces)
├── usageData.ts, interactionLog.ts, sessionReport.ts, sessionHistory.ts
└── 4 testbestanden (93 tests, 100% dekking op validatie)
```

### Bevindingen code-review (maart 2025)

| Gebied | Status | Actie nodig |
|--------|--------|-------------|
| **State management** | ⚠️ 23 losse useState, geen useCallback | Groeperen + memoizen (TODO §0f, §16) |
| **Toegankelijkheid** | 🔴 Geen keyboard nav, ontbrekende aria-labels | WCAG 2.1 Level A (TODO §0c, §0d) |
| **Touch-support** | 🔴 Alleen drag-and-drop | Tap-to-place toevoegen (TODO §0b) |
| **Testdekking** | ⚠️ 0% op hooks, screens, components | Uitbreiden naar 60% (TODO §17) |
| **Zinnen Niveau 1** | ⚠️ Slechts 26 zinnen | Uitbreiden naar 50+ (TODO §0e) |
| **Onboarding** | 🔴 Geen begeleiding eerste bezoek | Quick Start + tour (TODO §0a, §12) |
| **Validatie** | ✅ 100% getest, robuust | Edge cases toevoegen |
| **Dark mode** | ✅ Volledig geïmplementeerd | Contrastcontrole |
| **Feedback** | ✅ Contextueel via FEEDBACK_MATRIX | Foutenclassificatie toevoegen |

### Doelstructuur (na uitbreiding)
```
App.tsx (router/shell)
├── modules/
│   ├── zinsontleding/
│   │   ├── ZinsontledingHome.tsx
│   │   ├── ZinsontledingTrainer.tsx
│   │   ├── ZinsontledingScore.tsx
│   │   └── data/sentences-level-{1-4}.json
│   ├── werkwoordspelling/
│   │   ├── WerkwoordspellingHome.tsx
│   │   ├── WerkwoordspellingTrainer.tsx
│   │   ├── WerkwoordspellingScore.tsx
│   │   └── data/exercises.ts
│   └── foutentekst/
│       ├── FoutentekstHome.tsx
│       ├── FoutentekstTrainer.tsx
│       └── data/texts.ts
├── shared/
│   ├── components/
│   │   ├── WordChip.tsx (herbruikbaar)
│   │   ├── DropZone.tsx (herbruikbaar)
│   │   ├── HelpModal.tsx (herbruikbaar)
│   │   ├── DecisionTree.tsx (ontleedhulp)
│   │   ├── MetacognitivePrompt.tsx (denkstap)
│   │   ├── ContrastPairPanel.tsx (contrastieve paren)
│   │   ├── TheoryTooltip.tsx (taalbeschouwing)
│   │   └── OnboardingTour.tsx (rondleiding)
│   ├── hooks/
│   │   ├── useSession.ts
│   │   ├── useLocalStorage.ts
│   │   └── useSpacedRepetition.ts
│   └── utils/
│       ├── validation.ts
│       ├── errorClassification.ts
│       └── spacedRepetition.ts
├── types.ts
└── constants.ts
```

### Technische vereisten
- **Client-side only** (geen backend nodig voor Module 1-3)
- **localStorage** voor voortgang, streaks, badges, Rollenladder-trede
- **Geen login** vereist
- **Responsive** voor mobiel/tablet/desktop (met nadruk op Chromebooks en iPads)
- **WCAG 2.1 Level A** als minimale toegankelijkheidseis
- **Geen externe dependencies** waar mogelijk (houd de bundle klein)
- **Tap-to-place + drag-and-drop**: beide interactiemodi naast elkaar

---

## Design Principes

### UI/UX voor 12-15 jaar
- Professioneel maar niet saai
- Kleurrijk maar niet kinderachtig
- Grote, duidelijke knoppen (touch-friendly, minimaal 44x44px)
- Visuele feedback met subtiele animaties
- Kleurcodering per grammaticaal concept (consistent over modules)
- **Quick Start**: één klik om te beginnen, geavanceerde opties verborgen
- **Progressive disclosure**: complexiteit wordt pas zichtbaar wanneer nodig

### Didactisch design
- **Scaffolding**: van veel ondersteuning (Rollenladder trede 1) naar weinig (trede 5)
- **Directe feedback**: niet alleen goed/fout, maar waarom + vergelijking (contrastparen)
- **Metacognitie**: bewust nadenken over het eigen denkproces (denkstap-prompts)
- **Autonomie**: leerling kiest zelf module en niveau
- **Reflectie**: altijd mogelijkheid om fouten terug te bekijken + oefenplan
- **Motivatie**: gamification zonder dat het afleidt van het leren
- **Adaptief**: spaced repetition voor zwakke rollen, automatische Rollenladder-suggestie
- **Fading**: hulpmiddelen worden geleidelijk minder frequent naarmate beheersing groeit

### Toegankelijkheid
- Toetsenbordnavigatie voor alle kerninteracties
- Schermlezersondersteuning (aria-labels, semantische HTML, live regions)
- Dyslexie-modus met vergroot lettertype en extra spatiëring
- Dark mode voor verminderde oogbelasting
- `prefers-reduced-motion` voor leerlingen met bewegingsgevoeligheid
- Contrastverhouding minimaal 4.5:1 (WCAG AA)

---

## Prioritering

| Fase | Wat | Wanneer | LLM-geschikt? |
|------|-----|---------|---------------|
| **Fase 0** | Quick Start, keyboard, aria-labels, tap-to-place, meer zinnen | Nu | ✅ Zeer geschikt |
| **Fase 1** | Rollenladder + beslisboom + tooltips verbeteren | Korte termijn | ⚠️ Deels (didactisch ontwerp is mensenwerk) |
| **Fase 2** | Metacognitieve prompt + contrastparen + foutenclassificatie | Korte termijn | ✅ Geschikt |
| **Fase 3** | Gamification uitbreiden + reflectie/oefenplan | Korte termijn | ✅ Geschikt |
| **Fase 4** | Performance + state refactor + testdekking | Korte termijn | ✅ Ideaal voor LLM |
| **Fase 5** | Onboarding tour + responsive verbeteringen | Middellang | ✅ Geschikt |
| **Fase 6** | Module-router + werkwoordspelling-module | Middellang | ⚠️ Deels |
| **Fase 7** | Foutentekst-module | Lang | ⚠️ Deels |
| **Fase 8** | Backend + peer-review | Lang | ❌ Complex |
