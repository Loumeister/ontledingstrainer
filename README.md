# Ontleedlab - Technische Documentatie

Een interactieve browser-app die leerlingen (12-15 jaar, onderbouw havo/vwo) leert om Nederlandse zinnen te ontleden. Gebouwd met **React 18**, **TypeScript**, **Vite** en **Tailwind CSS**. Volledig client-side, geen backend nodig.

## 📊 Projectstatus (maart 2026)

| Onderdeel | Status | Details |
|-----------|--------|---------|
| **Kernfunctionaliteit** | ✅ Compleet | Tweestaps-ontleding (verdelen + benoemen), 13 rollen |
| **Zinnen-database** | ✅ 248 zinnen | 4 niveaus (Basis → Samengesteld) |
| **Feedback** | ✅ Contextueel | FEEDBACK_MATRIX met rolspecifieke uitleg |
| **Docentenmodus** | ✅ Werkend | Editor, URL-delen, importeren, opdracht-versioning |
| **Gamification** | ✅ Basis | Confetti, streaks, badges |
| **Dark mode / Dyslexie** | ✅ Compleet | Class-toggle, groot lettertype |
| **Domeinlaag** | ✅ Fundament | Student, TrainerAssignment, Submission, Attempt, ActivityEvent |
| **Studentdashboard** | ✅ Basis | `#/mijn-voortgang`: scores, rolfouten, sessieoverzicht |
| **Docentdashboard** | ✅ Basis | `#/docent-dashboard`: klas/student overzicht, rolfouten, opdrachten |
| **Testdekking** | ⚠️ Deels | 239 tests; domeinlaag goed gedekt; 0% op hooks/screens |
| **Toegankelijkheid** | ⚠️ Basis | Dark mode + dyslexie; toetsenbord/ARIA ontbreekt |
| **Touch-ondersteuning** | ⚠️ Beperkt | Drag-and-drop only; tap-to-place gepland |
| **Rollenladder** | 📋 Gepland | Adaptieve rol-introductie (zie TODO.md §1) |
| **Werkwoordspelling** | 📋 Gepland | Module 2 (zie SPEC.md) |

Zie `TODO.md` voor de volledige roadmap en `SPEC.md` voor de technische specificatie.

Actuele aantallen per niveau: **N1 60, N2 101, N3 42, N4 45** (totaal 248).
ID-reeksen: **N1 1–60, N2 61–161, N3 300–341, N4 400–444**.

## 🔗 Shared-core lokale integratie (voorbereiding)

Beoogde lokale locatie voor gedeelde canon:
- `shared/grammar-core/` = beoogde lokale map voor gedeelde didactische/governance-canon

Belangrijk voor de huidige status:
- de map `shared/grammar-core/` is in deze repo op dit moment nog **niet fysiek aanwezig**
- deze stap is alleen documentaire voorbereiding; er is nog geen runtime-integratie met shared core
- runtime, parsinglogica, evaluatie, routes, feedbackflow en UI-flow van Ontleedlab blijven ongewijzigd

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

De ingebouwde zinnen staan verdeeld over vier JSON-bestanden in `data/`:

| Bestand | Niveau |
|---------|--------|
| `data/sentences-level-1.json` | Basis |
| `data/sentences-level-2.json` | Middel |
| `data/sentences-level-3.json` | Hoog |
| `data/sentences-level-4.json` | Samengesteld (Expert) |

> **Tip voor docenten:** Gebruik de [Docentenmodus](#-docentenmodus) om zinnen aan te maken zonder de broncode aan te passen.

### 1. Datastructuur van een zin
Voeg nieuwe zinnen toe aan de `SENTENCES` array:

```typescript
{
  id: 162,                        // Volgende vrije nummer (N3: 342, N4: 445)
  label: "Zin 162: Korte naam",   // Zichtbaar in dropdown
  predicateType: 'WG',            // 'WG' (Werkwoordelijk) of 'NG' (Naamwoordelijk)
  level: 2,                       // 1=Basis, 2=Middel, 3=Hoog, 4=Samengesteld
  tokens: [                       // De woorden
    { id: "s162t1", text: "Ik", role: "ow" },
    { id: "s162t2", text: "loop", role: "pv" },
    // ...
  ]
}
```

### 1b. Nummering per niveau

Houd de huidige ID-reeks aan en voeg toe na het laatste ID:

| Niveau | Huidige reeks | Volgend vrij ID |
|--------|--------------|-----------------|
| 1 (Basis) | 1–60 | 61 |
| 2 (Middel) | 61–161 | 162 |
| 3 (Hoog) | 300–341 | 342 |
| 4 (Samengesteld) | 400–444 | 445 |

Label en token-id's (`s<zinId>t<n>`) moeten overeenkomen met het gekozen ID.

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

### Nieuwe logica (`src/logic/`)

**`analyticsHelpers.ts`** — pure functies zonder side-effects:

| Functie | Invoer | Uitvoer |
|---------|--------|---------|
| `computeTrainerStudentProgress` | `TrainerSubmission[], studentId` | `TrainerProgressSummary` |
| `computeTrainerClassProgress` | `TrainerSubmission[], klas` | `TrainerClassSummary` |
| `computeRoleErrorPatterns` | `TrainerSubmission[]` | `RoleErrorSummary[]` |
| `computeAssignmentParticipation` | `assignmentId, version, submissions` | `ParticipationSummary` |
| `buildTrainerSubmissionFromReport` | `SessionReport` | `Omit<TrainerSubmission, 'studentId'>` |

### Nieuwe routes

| Route | Scherm | Toegang |
|-------|--------|---------|
| `#/mijn-voortgang` | `StudentDashboardScreen` | Openbaar (voor ingelogde leerling) |
| `#/docent-dashboard` | `TeacherDashboardScreen` | PIN-beveiligd (zelfde PIN als `#/login`) |

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
