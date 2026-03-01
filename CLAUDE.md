# CLAUDE.md — Zinsontledingstrainer

Educational Dutch sentence-parsing trainer. Fully client-side React + TypeScript, deployed as a static site to GitHub Pages. No backend, no database.

---

## Commands

```bash
npm run dev          # Dev server → http://localhost:5173
npm run build        # tsc + vite build (must pass before committing)
npm run preview      # Preview production build locally
npm run deploy       # Build + push to GitHub Pages
npm run clean-install  # Nuke node_modules and reinstall
```

**Always run `npm run build` before committing.** TypeScript strict mode is on; the build is the only type-checker.

---

## Architecture

```
App.tsx              ← monolithic component; all state lives here
types.ts             ← all TypeScript types and interfaces
constants.ts         ← all domain data: ROLES, SENTENCES (210 items), FEEDBACK_MATRIX, HINTS
components/
  WordChip.tsx       ← draggable role chip (HTML5 drag-and-drop, no library)
  DropZone.tsx       ← sentence chunk container and drop target
  HelpModal.tsx      ← in-app help overlay
```

**State management**: plain `useState` hooks in `App.tsx`. No Redux, no Context. State resets on reload; nothing is persisted to `localStorage`.

**Styling**: Tailwind CSS v3 with `darkMode: 'class'`. Dark mode toggled via `document.documentElement.classList`. All colors have `dark:` variants. No CSS Modules or styled-components.

**Drag-and-drop**: native HTML5. Role transferred via `e.dataTransfer.setData("text/role", roleKey)`. Chunk drops and word-level (sub-role) drops are handled separately.

---

## Data Model

### Sentence structure

```typescript
interface Token {
  id: string;         // Format: "s{sentenceId}t{tokenIndex}" — e.g. "s1t3"
  text: string;
  role: RoleKey;
  subRole?: RoleKey;  // Word-level only; only bijv_bep and vw_onder qualify
  newChunk?: boolean; // CRITICAL — see below
}

interface Sentence {
  id: number;
  label: string;       // "Zin 42: ..."
  tokens: Token[];
  predicateType: 'WG' | 'NG';
  level: 1 | 2 | 3 | 4;
}
```

### RoleKey values

| Key | Label | Chunk or Word |
|---|---|---|
| `pv` | Persoonsvorm | chunk |
| `ow` | Onderwerp | chunk |
| `lv` | Lijdend Voorwerp | chunk |
| `mv` | Meewerkend Voorwerp | chunk |
| `bwb` | Bijwoordelijke Bepaling | chunk |
| `vv` | Voorzetselvoorwerp | chunk |
| `wg` | Werkwoordelijk Gezegde | chunk |
| `nwd` | Naamwoordelijk Deel v/h Gezegde | chunk |
| `bijst` | Bijstelling | chunk |
| `bijzin` | Bijzin | chunk (level 4 only) |
| `vw_neven` | Nevenschikkend Voegwoord | chunk |
| `bijv_bep` | Bijvoeglijke Bepaling | **word-level (subRole) only** |
| `vw_onder` | Onderschikkend Voegwoord | **word-level (subRole) only** |

All sentence data lives in `constants.ts`. There are no JSON data files.

---

## Critical Rules for Editing Sentence Data

### 1. `newChunk: true` is mandatory for same-role splits

Adjacent tokens with the same `role` are automatically merged into one chunk. When two consecutive tokens share a role but belong to **different** zinsdelen, the second one **must** have `newChunk: true`.

```typescript
// Two separate bwb constituents — WRONG without newChunk
{ id: "s1t5", text: "'s ochtends", role: "bwb" },
{ id: "s1t6", text: "rustig",      role: "bwb", newChunk: true },  // ← required
```

Omitting `newChunk: true` silently produces incorrect answer keys. This is the most common data entry error.

### 2. `bijv_bep` and `vw_onder` are sub-roles only

Never use them as a token's main `role`. They only appear as `subRole`.

```typescript
{ id: "s1t2", text: "nieuwe", role: "ow", subRole: "bijv_bep" }  // ✓
{ id: "s1t2", text: "nieuwe", role: "bijv_bep" }                  // ✗ wrong
```

### 3. `nwd` only appears in `predicateType: 'NG'` sentences

### 4. `bijzin`, `vw_neven` only appear in `level: 4` sentences

### 5. Token IDs must be unique across the entire file

Format: `s{id}t{1-based index}`. Do not reuse IDs.

---

## TypeScript Constraints

- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
- No implicit `any`
- `allowImportingTsExtensions: true`, `noEmit: true` — TypeScript only type-checks; Vite handles bundling
- `resolveJsonModule: true` — JSON imports are allowed but typed as `any`; cast explicitly if used

---

## Deployment

- Hosted on GitHub Pages at `/ontledingstrainer/`
- Vite `base` is set to `/ontledingstrainer/` in `vite.config.ts`
- `npm run deploy` runs `predeploy` (build) then `gh-pages -d dist`
- Never change the `base` path without updating GitHub Pages settings

---

## What Not to Do

- **Do not add a backend or database.** The app is intentionally static.
- **Do not introduce a state management library.** Local `useState` is sufficient.
- **Do not store sentence data in external JSON files.** Keep it in `constants.ts` for type safety.
- **Do not break the `npm run build`** — commit only when the build passes.
- **Do not split `App.tsx` prematurely.** It is large by design; refactor only when a clear boundary warrants a new component.
- **Do not add localStorage persistence** unless the feature explicitly requires it.

---

## Roadmap Reference

See `TODO.md` for planned features (gamification, dyslexie-modus, dark mode, compound sentence support).
