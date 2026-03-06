This is a React 18 + TypeScript educational web app (Zinsontledingstrainer) that teaches Dutch sentence parsing to students aged 12-15. It is fully client-side with no backend, deployed to GitHub Pages. All UI text is in Dutch.

## Code Standards

### Required Before Each Commit
- Run `npm run build` to verify TypeScript compiles and Vite builds successfully
- Run `npm run test` to ensure all unit tests pass
- TypeScript strict mode is enabled — no `any` types, no unused variables/parameters

### Development Flow
- Install: `npm ci`
- Dev server: `npm run dev` (port 5173)
- Build: `npm run build` (runs `tsc && vite build`)
- Test: `npm run test` (runs `vitest run`)
- Deploy: `npm run deploy` (GitHub Pages)

## Repository Structure
- `App.tsx` — Thin shell: hash-based routing between screens
- `hooks/` — Custom React hooks (`useTrainer.ts` is the core state manager)
- `screens/` — Full-page screen components (Home, Trainer, Score, Editor, UsageLog)
- `components/` — Reusable UI components (DropZone, WordChip, HelpModal, etc.)
- `data/` — Sentence JSON files (`sentences-level-{1-4}.json`) and loaders
- `constants.ts` — Role definitions, feedback matrix, score tips
- `types.ts` — All TypeScript interfaces and type aliases
- `validation.ts` — Core parsing validation logic
- `interactionLog.ts` — Analytics event tracking
- `usageData.ts` — localStorage persistence for usage statistics
- `public/` — Static assets

## Key Concepts
- **Two-step parsing**: Step 1 (Verdelen) splits sentence into chunks → Step 2 (Benoemen) labels each chunk with a grammatical role
- **13 grammatical roles**: PV, OW, LV, MV, BWB, Bijvoeglijke bepaling, VV, WG, Naamwoordelijk gezegde, Bijstelling, Bijzin, VW-neven, VW-onder
- **Token**: A word with a grammatical role; key fields: `role`, `subRole`, `newChunk`, `alternativeRole`, `bijzinFunctie`
- **Chunk**: Consecutive tokens belonging to the same constituent
- **PlacementMap**: `Record<string, RoleKey>` mapping token IDs to role keys

## Key Guidelines
1. Follow React best practices — functional components, hooks only, no class components
2. Use Tailwind CSS for all styling — always include `dark:` variants for dark mode support
3. Use native HTML5 drag-and-drop API (`dataTransfer.setData/getData`) — no external DnD library
4. All state lives in `hooks/useTrainer.ts` — no external state management libraries
5. Write unit tests with Vitest for new logic in `validation.ts`, `usageData.ts`, `interactionLog.ts`
6. All user-facing text must be in Dutch
7. Component files use PascalCase, hook files use camelCase with `use` prefix
8. Sentence data lives in `data/sentences-level-{1-4}.json` — see `README.md` for the `newChunk` flag rules
9. Keep the app accessible: support keyboard navigation and screen readers where possible
10. Consult `SPEC.md` for the full multi-module specification and `TODO.md` for the prioritized roadmap
