---
applyTo: "components/**/*.tsx,screens/**/*.tsx,App.tsx"
---

## React Component Guidelines

When writing or modifying React components in this project:

1. **Functional components only** — No class components. Use arrow functions with explicit return types.
2. **Tailwind CSS** — All styling uses Tailwind utility classes. Always include `dark:` variants (e.g., `dark:bg-gray-800`, `dark:text-white`).
3. **Dark mode** — Controlled via a `class` toggle on the root element. Never use `@media (prefers-color-scheme)`.
4. **Native drag-and-drop** — Use `onDragStart`, `onDragOver`, `onDrop` with `dataTransfer.setData/getData`. No external DnD libraries.
5. **Props from useTrainer** — Screen components receive a `TrainerState` object from `hooks/useTrainer.ts`. Do not create separate state stores.
6. **Dutch UI text** — All labels, buttons, headings, and feedback strings must be in Dutch.
7. **Naming** — Components use PascalCase filenames. Props interfaces are named `{Component}Props`.
8. **Accessibility** — Include `aria-label`, `role`, and keyboard handlers where appropriate.
9. **No inline styles** — Use Tailwind classes exclusively.
