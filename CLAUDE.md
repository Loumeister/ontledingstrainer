# CLAUDE.md

## Project Overview

Ontleedlab - An interactive browser-based app that teaches Dutch sentence parsing (zinsontleding) to students aged 12-15 (onderbouw havo/vwo). One-person project developed with LLM/agent assistance.

## Tech Stack

- React 18 + TypeScript (strict mode)
- Vite 7.2 (build tool)
- Tailwind CSS 3.4 (styling)
- Vitest 4.0 (testing)
- canvas-confetti (gamification effects)
- Currently browser-first and largely client-side
- localStorage is the current primary client persistence layer
- Google Apps Script sync already exists for reporting
- New features may introduce sync-ready domain models, but must preserve current client-side behavior during migration
- GitHub Pages for deployment

## Current Source of Truth

At the moment, several localStorage-backed services coexist.
Treat them as current implementation reality, not ideal target architecture.

During migration:
- preserve current behavior
- reduce duplication where possible
- move toward clearer ownership of data by domain

## Commands

- `npm ci` - Install dependencies (use in CI / fresh clone)
- `npm run dev` - Start dev server (port 5173)
- `npm run build` - Production build (`tsc && vite build`)
- `npm run test` - Run all tests (`vitest run`, 511 tests across 23 files)
- `npm run preview` - Preview production build
- `npm run deploy` - Deploy to GitHub Pages

## Architecture

```
src/
  App.tsx (~143 lines)           → Thin router shell (hash-based routing)
  types.ts → shared legacy application interfaces; new domain-specific types may be split into dedicated files when complexity grows
  constants.ts (~291 lines)      → Roles, FEEDBACK_MATRIX, hints, score tips
  hooks/
    useTrainer.ts (~825 lines)   → Core state management (23 useState, all business logic)
    useSentences.ts              → Async sentence loading with cache
    useZinsbouwlab.ts            → Zinnenlab state (frame selection, card placement, validation)
  screens/
    HomeScreen.tsx (~250 lines)       → Configuration & session start UI
    TrainerScreen.tsx (~432 lines)    → Active two-step parsing exercise
    ScoreScreen.tsx (~372 lines)      → Session results, badges, progress chart
    SentenceEditorScreen.tsx          → PIN-protected teacher editor; assignment versioning (PIN: 1234)
    UsageLogScreen.tsx                → Teacher analytics (dual PIN: 1234/4321)
    ZinsdeellabScreen.tsx             → Zinnenlab student screen (#/zinnenlab)
    StudentDashboardScreen.tsx        → Student progress view (#/mijn-voortgang)
    TeacherDashboardScreen.tsx        → Teacher class/assignment dashboard (#/docent-dashboard, PIN)
  components/ (15+ files)
    WordChip.tsx                 → Draggable role tag component
    DropZone.tsx                 → SentenceChunk drop target with validation
    HelpModal.tsx                → Instructions overlay
    ConfirmationModal.tsx        → Reusable confirmation dialog
    ScoreRing.tsx                → Animated SVG score circle
    SentenceResultCard.tsx       → Individual sentence result display
    ProgressChart.tsx            → SVG line chart of session history
    ZinsdeelHelpModal.tsx        → Role-specific help with definitions
    EditorView.tsx               → Teacher analytics dashboard
    FeedbackPanel.tsx            → Structured feedback display
    FeedbackEditorTab.tsx        → Feedback override editor tab in admin panel
    FrameSlot.tsx                → Zinnenlab bouwbalk slot (one per FrameSlotKey)
    ChunkBank.tsx                → Zinnenlab card bank (shows available ChunkCards)
    LabEditorTab.tsx             → Zinnenlab editor tab in SentenceEditorScreen
    LabActivitySection.tsx       → Zinnenlab activity display
    LabCardEditor.tsx            → Zinnenlab chunk card editor
    LabFrameEditor.tsx           → Zinnenlab frame editor
    LoginScreen.tsx              → Standalone login screen (#/login)
    SentencePicker.tsx           → Sentence selection UI for teacher/editor flows
  data/
    sentences-level-0.json       → Instap (Beginner) sentences (IDs 5001–5025)
    sentences-level-{1-4}.json   → Sentence data files (Basis → Samengesteld)
    sentences-review.json        → Review sentences
    sentenceLoader.ts            → Dynamic import with caching + preload
    customSentenceStore.ts       → localStorage custom sentence management
    constructionFrames.ts        → Built-in Zinnenlab frames (manually curated)
    chunkCards.ts                → Built-in Zinnenlab chunk cards (manually curated)
    labSentencePools.ts          → DEPRECATED — vervangen door corpusGrouper
  logic/                         → Pure business logic (no side effects)
    validation.ts (~313 lines)   → Core validation engine (100% test coverage)
    adaptiveSelection.ts         → Adaptive sentence selection algorithm
    constructionValidation.ts    → Zinnenlab validation (frame, congruence, word order, tense)
    v2WordOrders.ts              → Dutch V2 word order generator (all valid orderings)
    corpusGrouper.ts             → Corpus → Zinnenlab frames+cards (corpus approach)
    pvTenseHeuristic.ts          → Dutch PV tense detection (present/past)
    owNumberHeuristic.ts         → Dutch OW number detection (sg/pl)
    bwbTimeRefHeuristic.ts       → Dutch BWB temporal reference detection
    poolToFrame.ts               → (used by labSentencePools, still available)
    analyticsHelpers.ts          → Pure aggregation: progress/class/role errors/participation
    rollenladder.ts              → Rollenladder: 8 stages, promotion/demotion logic, sentence filter
    sentenceAnalysis.ts          → Token-for-token expected vs student comparison, ErrorType
    sessionFlow.ts               → Pure session-flow helpers (shouldShowNextButton, advanceAction)
    wordOrderLabel.ts            → Dutch word order detection: SVO/SOV/VSO/VOS/OVS/OSV
    feedbackLookup.ts            → Effective feedback with localStorage override support
  services/                      → Persistence & external integrations
    sessionHistory.ts            → Session persistence (localStorage) [legacy]
    sessionReport.ts             → Session report encode/decode [legacy, preserved]
    usageData.ts                 → Sentence usage tracking (localStorage) [legacy]
    interactionLog.ts            → User interaction event logging [legacy, coexists with trainerActivityLog]
    rolemastery.ts               → Role mastery tracking [legacy]
    googleDriveSync.ts           → Google Drive report sync [legacy, preserved]
    nameAliases.ts               → Student/class name aliasing
    authHash.ts                  → PIN authentication
    feedbackOverrides.ts         → Teacher feedback customization
    studentStore.ts              → Stable student identity (zinsontleding_students_v1)
    trainerAssignmentStore.ts    → Versioned assignments: id+version+contentHash (zinsontleding_assignments_v1)
    trainerSubmissionStore.ts    → Submissions + attempts (zinsontleding_submissions_v1, _attempts_v1)
    trainerActivityLog.ts        → Append-only event log (zinsontleding_trainer_activity_v1)
    teacherNoteStore.ts          → Teacher annotations, separate from telemetry
    ladderProgressStore.ts       → Rollenladder progress (zinsontleding_ladder_v1)
    activityStore.ts             → Read-only façade: combines TrainerSubmissions + LabSubmissions as AnySubmission[]
    mergeHistory.ts              → Undo history for klas/student rename/merge (max 50, zinsontleding_merge_history_v1)
    labActivityLog.ts            → Zinnenlab activity event log (localStorage)
    labSubmissionStore.ts        → Zinnenlab submission store (localStorage)
    labExerciseStore.ts          → Custom Zinnenlab exercises (zinsdeellab_exercises_v1)
    labFrameStore.ts             → Custom Zinnenlab frames (localStorage)
    labChunkCardStore.ts         → Custom Zinnenlab chunk cards (localStorage)
```

## Key Concepts

- **Two-step parsing**: Step 1 (Zinsdeelproef/Split) → Step 2 (Benoemen/Label)
- **Roles**: 13 grammatical roles (PV, OW, LV, MV, BWB, VV, WG, NG, Bijzin, etc.)
- **Token**: A word in a sentence with a grammatical role
- **Chunk**: A group of consecutive tokens belonging to the same constituent
- **newChunk**: Flag on tokens to force split even when adjacent tokens share the same role
- **PlacementMap**: Record mapping token IDs to role keys (for chunk labels and sub-labels)
- **Rollenladder**: Implemented scaffolded introduction of roles — 8 stages (PV → full set), 80% promotion criterion over 10 sentences. Enabled via `#/rollenladder` hidden route or teacher toggle.
- **TrainerAssignment**: Versionable teacher-authored sentence set (id stable, version increments, contentHash for attribution)
- **TrainerSubmission**: One student session linked to a stable studentId and optional assignmentId+version
- **TrainerAttempt**: One sentence within a submission; stores splits and labels for teacher review
- **Domain ID formats**: `std-`, `tsub-`, `tatt-`, `asgn-`, `tnote-` prefixes + ISO timestamp + 4-digit random

### Zinnenlab (#/zinnenlab)

A separate learning activity where students build sentences by combining chunk cards. Route is hidden (no HomeScreen link) — accessed via direct URL.

**Corpus approach** (current, since 2026-03-29):
- `corpusGrouper.ts` groups existing trainer sentences by their **slot signature** (ordered unique list of FrameSlotKey roles, e.g. `ow-pv-lv-bwb`)
- Groups with ≥ 3 sentences become a ConstructionFrame + ChunkCard[] automatically
- Heuristics auto-detect `number` (sg/pl) on OW cards, `verbTense` (present/past) on PV cards, and `timeRef` (past/present) on BWB cards
- Teachers can override heuristics via `Sentence.owNumber` / `Sentence.pvTense` in SentenceEditorScreen meta phase

**V2 word order**:
- `v2WordOrders(slots)` generates all valid Dutch declarative word orders: PV is always position 2, each other slot takes turn at position 1
- E.g. `['ow','pv','lv','bwb']` → `['ow-pv-lv-bwb', 'lv-pv-ow-bwb', 'bwb-pv-ow-lv']`

**Validation** (`constructionValidation.ts`):
- A: Missing slots check
- B: Family compatibility check (cards must belong to the active frame's family)
- C: Congruence: OW.number ↔ PV.number
- D: Predicate type: WG vs NG
- E: Valency constraints (card.requires, card.forbids)
- F: Word order: must match one of frame.wordOrders
- G: Tense: BWB.timeRef='past' + PV.verbTense='present' → error (e.g. "gisteren leest")

**Data flow**:
```
availableSentences (useTrainer)
  → ZinsdeellabScreen (prop: sentences)
    → useZinsbouwlab(sentences)
      → corpusToLabData(sentences) → { frames, cards }
      → merged with CONSTRUCTION_FRAMES + CHUNK_CARDS + custom frames/cards
```

**Storage ID space**: 20000+ reserved for lab-built sentences (1-499: built-in, 10000+: custom)

## Conventions

- All UI text is in Dutch — never use English in user-facing labels, buttons, or tooltips
- Use 'één' (with accents) when it means 'one' as a numeral (e.g. "in één keer goed", not "in een keer goed")
- Tailwind classes include dark mode variants (`dark:bg-...`, `dark:text-...`)
- Component files use PascalCase (e.g., `DropZone.tsx`)
- Hook files use camelCase with `use` prefix (e.g., `useTrainer.ts`)
- Screen files use PascalCase (e.g., `HomeScreen.tsx`)
- Drag-and-drop uses native HTML5 API (`dataTransfer.setData/getData`)
- No external state management library - React hooks only
- `hasBeenScored` flag guards against double-scoring (not `!validationResult`)

## State Management

Most current exercise state lives in `src/hooks/useTrainer.ts`. The hook returns a `TrainerState` object that is passed to screen components.

State categories:
1. **Config state**: difficulty level, predicate mode, focus filters, complexity filters
2. **Session state**: queue, index, stats, mistake tracking
3. **Trainer state**: current sentence, step, splits, labels, validation
4. **UI state**: dark mode, large font, dyslexia mode, help modal, confirmation dialogs

New domain, analytics, assignment, and sync logic should preferably be extracted into focused services and hooks rather than further expanding `useTrainer.ts`.

**Known issues (see TODO.md §0f, §16):**
- 23 separate useState calls without useCallback → handler recreation on every render
- No memoization on `getFilteredSentences()` or event handlers
- Potential for lag on slower devices (school Chromebooks)

## Adding Sentences

Sentences live in `src/data/sentences-level-{0-4}.json`. Each sentence needs:
- Unique `id` (number) and human-readable `label`
- `predicateType`: `'WG'` or `'NG'`
- `level`: 0 (Instap), 1 (Basis), 2 (Middel), 3 (Hoog), 4 (Samengesteld)
- `tokens[]`: words with `id` (format: `s{id}w{index}`), `text`, `role`, optional `subRole`/`newChunk`/`alternativeRole`/`bijzinFunctie`/`bijvBepTarget`

Current ID ranges (all IDs unique across all files):
- Level 0 (Instap): 5001–5025, next free: 5026
- Level 1 (Basis): 1–448, next free: 449
- Level 2 (Middel): 61–459, next free: 460
- Level 3 (Hoog): 300–456, next free: 457
- Level 4 (Samengesteld): 400–466, next free: 467

Optional Zinnenlab annotations (override heuristics if needed):
- `owNumber?: 'sg' | 'pl'` — OW number for congruence check
- `pvTense?: 'present' | 'past'` — PV tense for tense consistency check

See README.md for detailed rules (especially the `newChunk` flag).

## Test Coverage

511 tests across 23 test files (`npm run test`).

| Module | Coverage | Notes |
|--------|----------|-------|
| `src/logic/validation.ts` | ✅ 100% | 56 tests, factory helpers available |
| `src/logic/analyticsHelpers.ts` | ✅ Good | 22 tests, all pure functions |
| `src/logic/rollenladder.ts` | ✅ Good | 38 tests: stages, promotion, filterValidation |
| `src/logic/sentenceAnalysis.ts` | ✅ Good | 30 tests: token comparison, ErrorType |
| `src/logic/wordOrderLabel.ts` | ✅ Good | 30 tests: SVO/SOV/VSO detection |
| `src/logic/constructionValidation.ts` | ✅ Good | 17 tests: Zinnenlab validation rules |
| `src/logic/adaptiveSelection.ts` | ✅ Good | 15 tests |
| `src/logic/v2WordOrders.ts` | ✅ Good | 7 tests |
| `src/logic/sessionFlow.ts` | ✅ Good | 5 tests |
| `src/services/sessionReport.ts` | ✅ Good | 39 tests |
| `src/services/interactionLog.ts` | ✅ Good | 23 tests |
| `src/services/mergeHistory.ts` | ✅ Good | 19 tests |
| `src/services/trainerAssignmentStore.ts` | ✅ Good | 23 tests |
| `src/services/trainerSubmissionStore.ts` | ✅ Good | 17 tests |
| `src/services/studentStore.ts` | ✅ Good | 18 tests |
| `src/services/usageData.ts` | ✅ Good | 13 tests, mocked localStorage |
| `src/services/nameAliases.ts` | ✅ Good | 17 tests |
| `src/services/googleDriveSync.ts` | ✅ Partial | 4 tests |
| `src/hooks/useTrainer.ts` | ✅ Partial | 31 tests: filteredSentences, loadStudentInfo, setStudentInfo transforms |
| `src/hooks/useZinsbouwlab.ts` | ✅ Partial | 21 tests |
| `src/screens/ScoreScreen.tsx` | ✅ Partial | 30 tests: SCORE_THRESHOLDS, effectiveThresholds, scorePercentage, recommendation, badges |
| `src/screens/StudentDashboardScreen.tsx` | ✅ Partial | 15 tests: LEVEL_LABELS, sessionPct, completedSubs sorting |
| `src/screens/TeacherDashboardScreen.tsx` | ✅ Partial | 21 tests: scoreColor, extractKlassen, filterByKlas, studentSubs sorting |
| Other Screens & Components | ❌ 0% | No DOM/component tests yet |

## Planning Documents

- `TODO.md` - Prioritized roadmap (Prioriteit 0-6) with implementation details and sprint planning
- `SPEC.md` - Full specification for all 4 modules with TypeScript interfaces
- `HANDLEIDING.md` - User guide in Dutch (students + teachers)
- `README.md` - Technical documentation with project status dashboard

- ## Project Priorities

This project must remain:
1. didactically clear for students aged 12-15
2. fast and stable on school devices
3. easy to review in small increments
4. backwards compatible where reasonably possible
5. understandable for a one-person project

## Architectural Decision Rules

When making changes, prefer the following order of solutions:
1. extend an existing pure logic module if the change is domain logic without UI concerns
2. add a small focused service if the change concerns persistence, analytics, syncing, or data transformation
3. add a new hook only when stateful UI orchestration is needed
4. avoid making `useTrainer.ts` even more central unless the change is clearly trainer-specific and small

Do not introduce a global state library unless explicitly requested.

## Logging and Analytics Rules

The app currently has multiple data layers (`usageData`, `interactionLog`, `sessionHistory`, `sessionReport`, Google Drive sync). Treat these as legacy-compatible layers during migration.

For all future logging work, maintain a clear distinction between:
- raw activity events
- attempt-level summaries
- submission/session-level summaries
- dashboard aggregates
- teacher annotations

Do not mix teacher annotations with student telemetry in the same data model unless preserving a temporary compatibility layer.

## Assignment and Editing Rules

Assignments must become versionable.

Rules:
- an editable assignment is the logical parent object
- a published assignment version is immutable
- student results must always refer to a specific assignment version
- historical student results must never change when an assignment is later edited
- if content changes materially, create a new version instead of overwriting history

If the existing codebase only supports local custom sentences, preserve current behavior while introducing a migration path toward versioned assignments.

## Storage Rules

Current localStorage-based persistence may remain as:
- cache
- fallback
- temporary compatibility layer

Do not treat localStorage as the long-term single source of truth for:
- assignments
- submissions
- student analytics
- teacher analytics

When adding new storage flows, design them so they can later be synced to a central store without changing the domain model.

## Data Modeling Rules

Prefer explicit domain types over anonymous object shapes.

Introduce stable IDs for any new central entities, such as:
- studentId
- assignmentId
- assignmentVersionId
- submissionId
- attemptId
- eventId

Do not key long-term analytics only by display name.

## Migration Rules

When replacing or extending existing functionality:
- do not remove legacy structures immediately if existing screens still depend on them
- add compatibility adapters where useful
- document temporary duplication explicitly
- prefer incremental migration over a big rewrite
- keep existing student and teacher flows working unless the task explicitly allows breakage

## Refactor Limits

Avoid broad refactors unless they are directly necessary for the requested task.

In particular:
- do not rewrite `useTrainer.ts` wholesale unless explicitly requested
- do not move many unrelated files just to make the tree look cleaner
- do not rename stable concepts without strong reason
- do not replace current persistence flows without a migration path

## Testing Priorities

For new work, prioritize tests for:
1. pure domain logic
2. storage/services
3. transformation and aggregation functions
4. compatibility adapters

Every new `src/logic/*.ts` module must ship with a corresponding `.test.ts` file covering key scenarios.

Only add component tests when they provide clear value for changed behavior.

## Definition of Done

A task is only complete if:
- the design fits existing project conventions
- the implementation is modular and reviewable
- legacy behavior still works, or breakage is clearly documented
- new types and services are documented
- tests are added where the logic is non-trivial
- the final report includes:
  - files added
  - files changed
  - architectural decisions
  - temporary compromises
  - next recommended step

## Output Expectations for Claude Code

Before large changes:
- first inspect the current codebase
- summarize findings briefly
- state the proposed implementation plan
- then implement in small steps

After implementation:
- provide a concise change report
- explicitly separate:
  - confirmed from existing code
  - newly introduced design
  - temporary migration layer
  - open follow-up work
 
  - ## Preferred Expansion Direction

When the codebase grows, prefer this direction unless the current structure strongly suggests a better fit:

- keep current exercise flows working during migration
- treat `types.ts` as legacy/shared types, not the only future type location
- prefer focused services for persistence, analytics, syncing, and domain transformations
- prefer dedicated domain modules for assignments, submissions, activity, and teacher annotations
- avoid adding major new concerns directly into `useTrainer.ts`
