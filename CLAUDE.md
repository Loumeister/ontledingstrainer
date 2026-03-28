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
- `npm run test` - Run all tests (`vitest run`, 93 tests across 4 files)
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
  screens/
    HomeScreen.tsx (~250 lines)  → Configuration & session start UI
    TrainerScreen.tsx (~432 lines) → Active two-step parsing exercise
    ScoreScreen.tsx (~372 lines) → Session results, badges, progress chart
    SentenceEditorScreen.tsx     → PIN-protected teacher editor (PIN: 1234)
    UsageLogScreen.tsx           → Teacher analytics (dual PIN: 1234/4321)
  components/ (10 files, ~1675 lines total)
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
  data/
    sentences-level-{1-4}.json   → Sentence data files
    sentences-review.json        → Review sentences
    sentenceLoader.ts            → Dynamic import with caching + preload
    customSentenceStore.ts       → localStorage custom sentence management
  logic/                         → Pure business logic (no side effects)
    validation.ts (~313 lines)   → Core validation engine (100% test coverage)
    adaptiveSelection.ts         → Adaptive sentence selection algorithm
  services/                      → Persistence & external integrations
    sessionHistory.ts            → Session persistence (localStorage)
    sessionReport.ts             → Session report encode/decode
    usageData.ts                 → Sentence usage tracking (localStorage)
    interactionLog.ts            → User interaction event logging
    rolemastery.ts               → Role mastery tracking
    googleDriveSync.ts           → Google Drive report sync
```

## Key Concepts

- **Two-step parsing**: Step 1 (Zinsdeelproef/Split) → Step 2 (Benoemen/Label)
- **Roles**: 13 grammatical roles (PV, OW, LV, MV, BWB, VV, WG, NG, Bijzin, etc.)
- **Token**: A word in a sentence with a grammatical role
- **Chunk**: A group of consecutive tokens belonging to the same constituent
- **newChunk**: Flag on tokens to force split even when adjacent tokens share the same role
- **PlacementMap**: Record mapping token IDs to role keys (for chunk labels and sub-labels)
- **Rollenladder**: Planned scaffolded introduction of roles (see TODO.md §1)

## Conventions

- All UI text is in Dutch
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

Sentences live in `src/data/sentences-level-{1-4}.json`. Each sentence needs:
- Unique `id` (number) and human-readable `label`
- `predicateType`: `'WG'` or `'NG'`
- `level`: 1 (Basis), 2 (Middel), 3 (Hoog), 4 (Samengesteld)
- `tokens[]`: words with `id` (format: `s{id}w{index}`), `text`, `role`, optional `subRole`/`newChunk`/`alternativeRole`/`bijzinFunctie`/`bijvBepTarget`

See README.md for detailed rules (especially the `newChunk` flag).

## Test Coverage

| Module | Coverage | Notes |
|--------|----------|-------|
| `src/logic/validation.ts` | ✅ 100% | 47 tests, factory helpers available |
| `src/services/usageData.ts` | ✅ Good | 13 tests, mocked localStorage |
| `src/services/interactionLog.ts` | ✅ Good | 17 tests |
| `src/services/sessionReport.ts` | ✅ Good | 16 tests |
| `src/hooks/useTrainer.ts` | ❌ 0% | Complex state logic untested |
| Screens & Components | ❌ 0% | No DOM/component tests yet |

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
