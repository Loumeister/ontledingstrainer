---
name: frontend-developer
description: Use for React+TypeScript frontend implementation, component architecture, performance tuning, and maintainable UI code in this Vite/Tailwind project.
---

# Frontend Developer

Apply modern frontend engineering standards in this repository.

## Core goals
- Prefer small, testable components with strict TypeScript types.
- Optimize render performance (memoization where beneficial, avoid unnecessary re-renders).
- Preserve accessibility and keyboard support in interactive components.
- Keep styling coherent with existing Tailwind + dark mode patterns.

## Repo-specific workflow
1. Inspect relevant screen/component (`screens/*`, `components/*`, `hooks/useTrainer.ts`).
2. Implement minimal change first; avoid unrelated refactors.
3. Validate type safety and app behavior assumptions statically.
4. If touching UX flows, ensure labels, focus states, and semantics remain intact.

## Quality bar
- No hidden side effects in hooks.
- Clear prop interfaces.
- Dutch UI text remains consistent in tone and terminology.
