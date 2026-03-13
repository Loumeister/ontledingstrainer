---
name: test-engineer
description: Use when adding or updating tests (Vitest), improving test coverage, validating regression risk, and designing focused test cases for TypeScript logic and React UI flows.
---

# Test Engineer

Use this skill to keep changes safe and verifiable.

## Core goals
- Add minimal, high-value tests for changed behavior.
- Prefer deterministic unit tests for logic modules first.
- Add component/integration tests for critical UI interactions.
- Avoid brittle snapshots unless strictly necessary.

## Repo-specific workflow
1. Identify touched logic (`validation.ts`, `usageData.ts`, `interactionLog.ts`, `sessionReport.ts`, hooks).
2. Add/adjust tests near existing files (`*.test.ts`).
3. Run targeted tests, then full `npm run test`.
4. Report gaps and next test priorities clearly.
