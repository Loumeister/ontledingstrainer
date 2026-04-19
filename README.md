# Ontleedlab - Technische Documentatie

Een interactieve browser-app die leerlingen (12-15 jaar, onderbouw havo/vwo) leert om Nederlandse zinnen te ontleden. Gebouwd met **React 18**, **TypeScript**, **Vite** en **Tailwind CSS**. Volledig client-side, geen backend nodig.

## 📊 Projectstatus (april 2026)

| Onderdeel | Status | Details |
|-----------|--------|---------|
| **Kernfunctionaliteit** | ✅ Compleet | Tweestaps-ontleding (verdelen + benoemen), 13 rollen |
| **Zinnen-database** | ✅ 295 zinnen | 5 niveaus (Instap → Samengesteld) |
| **Feedback** | ✅ Contextueel | FEEDBACK_MATRIX met rolspecifieke uitleg; feedbackLookup met override-support |
| **Docentenmodus** | ✅ Werkend | Editor, URL-delen, importeren, opdracht-versioning, merge/rename history |
| **Gamification** | ✅ Basis | Confetti, streaks, badges |
| **Dark mode / Dyslexie** | ✅ Compleet | Class-toggle, groot lettertype |
| **Domeinlaag** | ✅ Fundament | Student, TrainerAssignment, Submission, Attempt, ActivityEvent, AnySubmission façade |
| **Studentdashboard** | ✅ Basis | `#/mijn-voortgang`: scores, rolfouten, sessieoverzicht |
| **Docentdashboard** | ✅ Basis | `#/docent-dashboard`: klas/student overzicht, rolfouten, opdrachten |
| **Rollenladder** | ✅ Geïmplementeerd | 8 treden, promotie/demotie, ladderProgressStore, `#/rollenladder` verborgen route |
| **Tap-to-Place** | ✅ Geïmplementeerd | Tikken op kaartje en zinsdeel; naast drag-and-drop |
| **Quick Start** | ✅ Geïmplementeerd | Prominente startknop; defaults niveau 1, 5 zinnen |
| **Zinnenanalyse** | ✅ Nieuw | `sentenceAnalysis.ts`: token-for-token vergelijking, ErrorType-classificatie |
| **Woordvolgorde** | ✅ Nieuw | `wordOrderLabel.ts`: SVO/SOV/VSO/VOS/OVS/OSV detectie |
| **Testdekking** | ✅ Goed | 511 tests, 23 testbestanden; domeinlaag en logica goed gedekt |
| **Toegankelijkheid** | ⚠️ Basis | Dark mode + dyslexie; toetsenbord/ARIA deels aanwezig |
| **Werkwoordspelling** | 🔗 Gedeelde richting | Geen lokale module; zie `shared/grammar-core/docs/grammar-platform-principles.md` |

Zie `TODO.md` voor de volledige roadmap en `SPEC.md` voor de technische specificatie.

Actuele aantallen per niveau: **N0 25, N1 78, N2 121, N3 45, N4 26** (totaal 295).
ID-reeksen: **N0 5001–5025, N1 1–448, N2 61–459, N3 300–456, N4 400–466** (uniek, geen overlapping).

## 🔗 Shared-core lokale integratie

`shared/grammar-core/` is aanwezig als git subtree (`Loumeister/grammar-core main`, squash-commit `68528b4`, april 2026).

De aanwezige bestanden in die map, met hun gezag voor Ontleedlab:

| Bestand in `shared/grammar-core/` | Gezag voor Ontleedlab | Wat het regelt |
|---|---|---|
| `README.md` | Contextueel | Scope en doel van de gedeelde laag |
| `docs/grammar-platform-principles.md` | Gezaghebbend | Platformgrenzen en architectuurrollen; beschrijft huidige realiteit én toekomstige richting |
| `docs/parsing-didactics-kaders.md` | Gezaghebbend | Gedeelde parsingdidactische principes |
| `docs/taxonomy-governance.md` | Gezaghebbend | Roletikettering, vier-laags model, taxonomiebeheer |
| `docs/content-authoring-rules.md` | Gezaghebbend / lokaal gekwalificeerd | Herbruikbare contentauthoringregels; regels 1 en 6 lokaal gekwalificeerd (zie `AGENTS.md`) |
| `docs/repo-sync-strategy.md` | Contextueel | Syncmodel en updateproces |
| `docs/product-repo-contract-template.md` | Contextueel | Sjabloon voor productcontracten (lokaal: `repo-contract.md`) |
| `docs/werkwoordspellingsdidactiek-kaders.md` | Contextueel (niet bindend) | Aangrenzende spellingdidactiek; adoptie vereist expliciete lokale keuze |

Huidige integratieomvang:
- er is nog geen runtime-integratie met shared core
- runtime, parsinglogica, evaluatie, routes, feedbackflow en UI-flow van Ontleedlab blijven ongewijzigd
- de subtree is uitsluitend beschikbaar voor governance, instructie en documentatie

Voor actuele zinnencontrole en docentplanning:
- `data/sentence-parse-audit.md` (parse- en annotatie-audit)
- `TEACHERS_SENTENCE_OVERVIEW.md` (subskills → numeriek gesorteerde zin-ID's)

## 🛠️ Installatie & Development

1.  **Clone de repository:**
    ```bash
    git clone <jouw-repo-url>
    cd ontleedlab
    ```
2.  **Installeer dependencies:**
    ```bash
    npm install
    ```
3.  **Start lokale server:**
    ```bash
    npm run dev
    ```
    De app draait nu op `http://localhost:5173/` (of vergelijkbaar).

## 🚀 Deployment (GitHub Pages)

De app moet gebuild worden omdat browsers geen TypeScript (`.tsx`) begrijpen.

**Automatisch deployen (aanbevolen):**
De productie-deploy loopt via de GitHub Actions workflow in `.github/workflows/deploy.yml`.
Bij een push naar `main` bouwt die workflow de app en publiceert `dist` naar GitHub Pages.

**Handmatig:**
1.  Run: `npm run build`
2.  Upload de inhoud van de map `dist` naar je webserver.

---

## 👩‍🏫 Docentenmodus

De app bevat een PIN-beveiligde editor waarmee docenten eigen oefen­zinnen kunnen aanmaken en met leerlingen delen.

### Toegang

*   Navigeer naar `<app-url>/editor` of `<app-url>/#/editor` (geen link in de interface voor leerlingen).
*   De standaard pincode is **`1234`**.

### Functies

*   Nieuwe zinnen aanmaken via een visuele stap-voor-stap editor (tekst → opdelen → rollen toekennen).
*   Ingebouwde zinnen inzien en als sjabloon kopiëren.
*   Eigen zinnen exporteren als `.json` (`docent-zinnen.json`).
*   Deellink genereren: zinnen worden versleuteld meegestuurd als `?zinnen=`-parameter. Leerlingen zien een banner op het startscherm en oefenen direct.

### Werkwijze

```
Docent:  Editor → Maak zinnen → Kopieer deellink
Leerling: Opent link → Banner "Zinnen van je docent" → Klik "Oefenen"
```

---

## 📝 Content Management (Nieuwe zinnen toevoegen)

Gedeelde contentauthoringregels (zinsselectie, didactische kwaliteit, annotatiepraktijken): `shared/grammar-core/docs/content-authoring-rules.md` — **gezaghebbend** voor herbruikbare principes; lokaal aangevuld door `.codex/skills/zinsontleding-constraint-sentence-author/SKILL.md`.

De ingebouwde zinnen staan verdeeld over vijf JSON-bestanden in `data/`:

| Bestand | Niveau | Zinnen | ID-reeks |
|---------|--------|--------|---------|
| `data/sentences-level-0.json` | Instap (Beginner) | 25 | 5001–5025 |
| `data/sentences-level-1.json` | Basis | 78 | 1–448 |
| `data/sentences-level-2.json` | Middel | 121 | 61–459 |
| `data/sentences-level-3.json` | Hoog | 45 | 300–456 |
| `data/sentences-level-4.json` | Samengesteld (Expert) | 26 | 400–466 |

> **Tip voor docenten:** Gebruik de [Docentenmodus](#-docentenmodus) om zinnen aan te maken zonder de broncode aan te passen.

### 1. Datastructuur van een zin
Voeg nieuwe zinnen toe aan de `SENTENCES` array:

```typescript
{
  id: 162,                        // Volgend vrij ID (zie tabel hieronder)
  label: "Zin 162: Korte naam",   // Zichtbaar in dropdown
  predicateType: 'WG',            // 'WG' (Werkwoordelijk) of 'NG' (Naamwoordelijk)
  level: 2,                       // 0=Instap, 1=Basis, 2=Middel, 3=Hoog, 4=Samengesteld
  tokens: [                       // De woorden
    { id: "s162t1", text: "Ik", role: "ow" },
    { id: "s162t2", text: "loop", role: "pv" },
    // ...
  ]
}
```

### 1b. Nummering per niveau

Houd de huidige ID-reeks aan en voeg toe na het laatste ID:

| Niveau | Bestand | Huidige reeks | Volgend vrij ID |
|--------|---------|--------------|-----------------|
| 0 (Instap) | `sentences-level-0.json` | 5001–5025 | 5026 |
| 1 (Basis) | `sentences-level-1.json` | 1–448 | 449 |
| 2 (Middel) | `sentences-level-2.json` | 61–459 | 460 |
| 3 (Hoog) | `sentences-level-3.json` | 300–456 | 457 |
| 4 (Samengesteld) | `sentences-level-4.json` | 400–466 | 467 |

> **Opmerking:** ID's zijn uniek over alle niveaus heen. Controleer altijd of een ID nog vrij is vóór je het gebruikt.

### 1c. Merge-conflicts in zinnenbestanden snel oplossen

Bij grote merges kunnen `data/sentences-level-*.json` veel conflictregels geven. Gebruik dan de helper:

```bash
# kies de kant die je volledig wilt overnemen
bash scripts/resolve_sentence_conflicts.sh ours
# of
bash scripts/resolve_sentence_conflicts.sh theirs
```

Daarna de dataset valideren:

```bash
node scripts/regenerate_sentence_docs_and_validate.cjs
```

### 2. Belangrijke Regels

#### A. Aaneengesloten zinsdelen
De app voegt automatisch opeenvolgende woorden met dezelfde `role` samen tot één blokje.
*   *Voorbeeld:* "De (ow) boze (ow) man (ow)" wordt één blok "De boze man".

#### B. De `newChunk` regel (Cruciaal!)
Als twee *verschillende* zinsdelen naast elkaar staan die *toevallig* dezelfde rol hebben (bijv. twee keer BWB), moet je de app vertellen waar de knip zit.
Gebruik `newChunk: true` op het **eerste woord** van het **tweede** zinsdeel.

```typescript
{ text: "Gisteren", role: "bwb" },
{ text: "in de tuin", role: "bwb", newChunk: true }, // Forceer splitsing!
```

#### C. Samengestelde Zinnen (Niveau 4)
We onderscheiden twee typen voegwoorden:

1.  **Onderschikkend (dat, omdat, als...):**
    *   De hele bijzin krijgt `role: 'bijzin'`.
    *   Het voegwoord zit *in* de bijzin en krijgt `subRole: 'vw_onder'`.
    
2.  **Nevenschikkend (en, maar, want...):**
    *   Het voegwoord staat *tussen* de zinnen.
    *   Het krijgt een eigen blokje met `role: 'vw_neven'`.

---

---

## 🗂️ Domeinarchitectuur (maart 2026)

De app heeft een domeinlaag gekregen die naast de bestaande localStorage-services werkt. Alle nieuwe services slaan data lokaal op in een formaat dat klaar is voor centrale sync.

### Nieuwe types (`src/types.ts`)

| Type | Sleutel | Beschrijving |
|------|---------|--------------|
| `Student` | `id: 'std-...'` | Stabiele student-identiteit; gegenereerd bij eerste gebruik |
| `TrainerAssignment` | `id + version + contentHash` | Versiebare zinnenset (parallel aan `ZinsdeellabExercise`) |
| `TrainerSubmission` | `id: 'tsub-...'` | Sessie-inzending gekoppeld aan `studentId` en optioneel `assignmentId` |
| `TrainerAttempt` | `id: 'tatt-...'` | Per-zin poging binnen een submission, met splits en labels |
| `TrainerActivityEvent` | `submissionId + type + timestamp` | Fijnkorrelig event-log parallel aan `interactionLog` |
| `TeacherNote` | `id: 'tnote-...'` | Docentnotitie bij een zin, student of opdracht |

**Versioning-principe** (parallel aan `ZinsdeellabExercise`):
- `TrainerAssignment.id` is stabiel (nooit gewijzigd)
- `version` incrementeert bij inhoudelijke wijziging van de zinnenset
- `contentHash` is een deterministisch btoa-hash van de gesorteerde `sentenceIds`
- `TrainerSubmission` verwijst altijd naar `assignmentId + assignmentVersion`, niet naar de huidige versie
- Historische studentresultaten veranderen nooit als een opdracht later wordt bewerkt

### Nieuwe services (`src/services/`)

| Bestand | localStorage-sleutel | Doel |
|---------|---------------------|------|
| `studentStore.ts` | `zinsontleding_students_v1` | CRUD + migratie vanuit `student_info_v1` |
| `trainerAssignmentStore.ts` | `zinsontleding_assignments_v1` | Versiebare opdrachten + migratie vanuit `custom-sentences` |
| `trainerSubmissionStore.ts` | `zinsontleding_submissions_v1` + `_attempts_v1` | Submissions (max 500) + attempts (max 2000) |
| `trainerActivityLog.ts` | `zinsontleding_trainer_activity_v1` | Append-only event-log (max 2000 events) |
| `teacherNoteStore.ts` | `zinsontleding_teacher_notes_v1` | Docentnotities, logisch gescheiden van student-telemetrie |
| `ladderProgressStore.ts` | `zinsontleding_ladder_v1` | Rollenladder-voortgang (trede, recentScores, enabled) |
| `activityStore.ts` | *(read-only façade)* | Combineert TrainerSubmissions + LabSubmissions als `AnySubmission[]` |
| `mergeHistory.ts` | `zinsontleding_merge_history_v1` | Undo-history voor klas/student rename/merge-acties (max 50) |
| `labExerciseStore.ts` | `zinsdeellab_exercises_v1` | Zinnenlab-oefeningen (custom exercises) |

### Nieuwe logica (`src/logic/`)

**`analyticsHelpers.ts`** — pure functies zonder side-effects:

| Functie | Invoer | Uitvoer |
|---------|--------|---------|
| `computeTrainerStudentProgress` | `TrainerSubmission[], studentId` | `TrainerProgressSummary` |
| `computeTrainerClassProgress` | `TrainerSubmission[], klas` | `TrainerClassSummary` |
| `computeRoleErrorPatterns` | `TrainerSubmission[]` | `RoleErrorSummary[]` |
| `computeAssignmentParticipation` | `assignmentId, version, submissions` | `ParticipationSummary` |
| `buildTrainerSubmissionFromReport` | `SessionReport` | `Omit<TrainerSubmission, 'studentId'>` |

**`rollenladder.ts`** — Rollenladder-logica:
- 8 treden (PV → OW → WG/NG → LV → MV → BWB → VV/bijst/bijv_bep → Bijzinnen)
- `computeLadderPromotion()`: 80%-beheersingscriterium over 10 zinnen; 50%-grens voor demotie-suggestie
- `filterValidationForStage()`: niet-actieve rollen tellen als neutraal
- `getLadderSentenceFilter()`: zinnen boven `maxSentenceLevel` van de trede worden uitgesloten

**`sentenceAnalysis.ts`** — token-for-token vergelijking van verwacht vs. student-antwoord:
- `ErrorType`: `correct | groepering | benoeming | both`
- `TokenComparison`, `SentenceComparisonResult`
- Detecteert eerste divergentie, split- en labelfouten per token

**`wordOrderLabel.ts`** — woordvolgorde-detectie:
- Codeert Nederlandse woordvolgorde als `SVO | SOV | VSO | VOS | OVS | OSV | SV | VS | ?`
- `detectWordOrder(tokens)` voor opgeslagen Token[], `detectWordOrderFromRoles(roles)` voor editor-staat

**`sessionFlow.ts`** — pure sessie-flow helpers:
- `shouldShowSessionNextButton()`, `getSessionAdvanceAction()`

**`feedbackLookup.ts`** — effectieve feedback met override-support:
- Controleert localStorage-overrides vóór de ingebouwde FEEDBACK_MATRIX

### Nieuwe routes

| Route | Scherm | Toegang |
|-------|--------|---------|
| `#/mijn-voortgang` | `StudentDashboardScreen` | Openbaar (voor ingelogde leerling) |
| `#/docent-dashboard` | `TeacherDashboardScreen` | PIN-beveiligd (zelfde PIN als `#/login`) |
| `#/rollenladder` | *(verborgen)* | Schakelt Rollenladder-modus in en landt op HomeScreen; geen zichtbare link |

### Migratiestatus

Alle bestaande localStorage-sleutels blijven **leesbaar en beschrijfbaar** tijdens de migratie.

| Oud (legacy) | Nieuw (domein) | Status |
|---|---|---|
| `student_info_v1` | `zinsontleding_students_v1` | Beide actief; `getOrCreateStudent()` migreert automatisch |
| `custom-sentences` | `zinsontleding_assignments_v1` | Beide actief; `migrateFromCustomSentences()` eenmalig |
| `zinsontleding_interactions_v1` | `zinsontleding_trainer_activity_v1` | Beide worden geschreven; verwijdering later |
| `zinsontleding_reports_v1` / Google Drive | `zinsontleding_submissions_v1` | SessionReport-formaat behouden; compat-adapter beschikbaar |

---

## 🏗️ Toekomstvisie (Architectuur)

Om in de toekomst diepere ontleding *binnen* bijzinnen mogelijk te maken, moet de datastructuur evolueren van een platte lijst tokens naar een boomstructuur:

```typescript
interface Clause {
  id: string;
  type: 'hoofdzin' | 'bijzin';
  tokens: Token[]; // Eigen ontleding binnen deze clause
}

interface ComplexSentence extends Sentence {
  clauses: Clause[];
  conjunctions: Token[];
}
```
