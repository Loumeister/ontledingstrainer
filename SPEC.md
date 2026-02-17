# Specificatie: Grammatica & Werkwoordspelling Trainer

Dit document beschrijft de specificatie voor de complete app, bestaande uit meerdere modules die samen een integrale benadering van grammatica en werkwoordspelling vormen.

---

## Visie

Een browser-based app die leerlingen in de onderbouw van havo/vwo (12-15 jaar) leert ontleden en werkwoorden correct spellen, volgens de laatste wetenschappelijke inzichten in de Nederlandse grammaticadidactiek. De basisprincipes:

1. **Grammatica als fundament**: Zinsontleding is de voorwaarde voor werkwoordspelling
2. **Modulair, niet lineair**: Modules zijn onafhankelijk toegankelijk, maar bouwen op elkaar voort
3. **Veel kennis van weinig**: Per module één concept tot automatisme
4. **Transfer naar schrijven**: Van geïsoleerde oefening naar toepassing in tekst

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

### Status: Werkend

De huidige Zinsontledingstrainer. Tweestapsproces:
1. **Verdelen**: Zin in zinsdelen knippen
2. **Benoemen**: Zinsdelen labelen via drag-and-drop

### Bestaande features
- 30+ zinnen over 4 moeilijkheidsniveaus
- 13 grammaticale rollen (PV, OW, LV, MV, BWB, VV, WG, NG, Bijzin, etc.)
- Contextuele feedback via FEEDBACK_MATRIX
- Hint-systeem (PV → OW → GZ → rest)
- Session-modus met foutenstatistieken
- Filtering op niveau, type gezegde, specifieke zinsdelen
- Dark mode, groot lettertype, responsive design

### Geplande uitbreidingen
Zie TODO.md Prioriteit 1-3 voor details:
- Gefaseerde modus (alleen PV → PV+OW → alles)
- Interactieve beslisboom
- Kwalitatieve foutenanalyse
- Theorie-tooltips
- Gamification
- Reflectie-functie

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

### Huidige structuur
```
App.tsx (950 regels - alles-in-één)
├── HomeScreen (configuratie)
├── TrainerScreen (oefening)
└── ScoreScreen (resultaten)
```

### Doelstructuur
```
App.tsx (router/shell)
├── modules/
│   ├── zinsontleding/
│   │   ├── ZinsontledingHome.tsx
│   │   ├── ZinsontledingTrainer.tsx
│   │   ├── ZinsontledingScore.tsx
│   │   └── data/sentences.ts
│   ├── werkwoordspelling/
│   │   ├── WerkwoordspellingHome.tsx
│   │   ├── WerkwoordspellingTrainer.tsx
│   │   ├── WerkwoordspellingScore.tsx
│   │   └── data/exercises.ts
│   └── foutentekst/
│       ├── FoutentekstHome.tsx
│       ├── FoutentekstTrainer.tsx
│       └── data/texts.ts
├── components/
│   ├── WordChip.tsx (herbruikbaar)
│   ├── DropZone.tsx (herbruikbaar)
│   ├── HelpModal.tsx (herbruikbaar)
│   ├── DecisionTree.tsx (nieuw - beslisboom)
│   ├── TheoryTooltip.tsx (nieuw - taalbeschouwing)
│   └── ConfettiEffect.tsx (nieuw - gamification)
├── hooks/
│   ├── useSession.ts
│   ├── useValidation.ts
│   ├── useLocalStorage.ts
│   └── useStreak.ts
├── types.ts
└── constants.ts
```

### Technische vereisten
- **Client-side only** (geen backend nodig voor Module 1-3)
- **localStorage** voor voortgang, streaks, badges
- **Geen login** vereist
- **Responsive** voor mobiel/tablet/desktop
- **Geen externe dependencies** waar mogelijk (houd de bundle klein)

---

## Design Principes

### UI/UX voor 12-15 jaar
- Professioneel maar niet saai
- Kleurrijk maar niet kinderachtig
- Grote, duidelijke knoppen (touch-friendly)
- Visuele feedback met subtiele animaties
- Kleurcodering per grammaticaal concept (consistent over modules)

### Didactisch design
- **Scaffolding**: van veel ondersteuning naar weinig
- **Directe feedback**: niet alleen goed/fout, maar waarom
- **Autonomie**: leerling kiest zelf module en niveau
- **Reflectie**: altijd mogelijkheid om fouten terug te bekijken
- **Motivatie**: gamification zonder dat het afleid van het leren

---

## Prioritering

| Fase | Wat | Wanneer |
|------|-----|---------|
| **Fase 0** | Huidige app stabiel houden, kleine verbeteringen | Nu |
| **Fase 1** | Gefaseerde modus + beslisboom + theorie-tooltips | Korte termijn |
| **Fase 2** | Gamification + reflectie-functie | Korte termijn |
| **Fase 3** | App.tsx opsplitsen + module-router | Middellang |
| **Fase 4** | Werkwoordspelling-module | Middellang |
| **Fase 5** | Foutentekst-module | Lang |
| **Fase 6** | Backend + peer-review | Lang |
