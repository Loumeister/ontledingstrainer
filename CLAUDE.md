# CLAUDE.md

## Project Overview

Zinsontledingstrainer - An interactive browser-based app that teaches Dutch sentence parsing (zinsontleding) to students aged 12-15 (onderbouw havo/vwo). One-person project developed with LLM/agent assistance.

## Tech Stack

- React 18 + TypeScript (strict mode)
- Vite 7.2 (build tool)
- Tailwind CSS 3.4 (styling)
- Vitest 4.0 (testing)
- canvas-confetti (gamification effects)
- No backend - fully client-side
- localStorage for persistence
- GitHub Pages for deployment

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
  types.ts (~74 lines)           → All TypeScript interfaces
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

- **Two-step parsing**: Step 1 (Verdelen/Split) → Step 2 (Benoemen/Label)
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

All application state lives in `src/hooks/useTrainer.ts`. The hook returns a `TrainerState` object that is passed to screen components. State categories:

1. **Config state**: difficulty level, predicate mode, focus filters, complexity filters
2. **Session state**: queue, index, stats, mistake tracking
3. **Trainer state**: current sentence, step, splits, labels, validation
4. **UI state**: dark mode, large font, dyslexia mode, help modal, confirmation dialogs

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
