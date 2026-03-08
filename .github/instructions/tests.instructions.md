---
applyTo: "**/*.test.ts"
---

## Test Guidelines

When writing or modifying tests in this project:

1. **Framework** — Use Vitest (`import { describe, it, expect } from 'vitest'`).
2. **File naming** — Test files are co-located with source: `validation.test.ts`, `usageData.test.ts`, `interactionLog.test.ts`.
3. **Helper factories** — Use `makeToken()` and `makeSentence()` factory functions (see `validation.test.ts`) to create test data consistently.
4. **Table-driven tests** — Use `it.each` or arrays of test cases for parameterized testing when multiple inputs produce predictable outputs.
5. **No DOM tests** — Current tests cover pure logic (validation, data, logging). No React component rendering tests exist yet.
6. **Assertions** — Use `expect(...).toBe()`, `.toEqual()`, `.toHaveLength()`, `.toBeTruthy()`, `.toContain()` as appropriate.
7. **Run tests** — `npm run test` (runs `vitest run` in single-run mode).
8. **Types** — Import types from `./types` (`Token`, `Sentence`, `PlacementMap`, `RoleKey`).
