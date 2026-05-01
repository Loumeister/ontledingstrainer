---
name: documentation-sync-guardian
description: Maintains safe Ontleedlab generated documentation sync summaries after commits. Use when the user asks to "sync docs after main", "update auto-sync docs", or "summarize a landed commit". Do not use for hand-authored app docs, runtime code, parsing scope changes, or speculative architecture rewrites.
metadata:
  version: "1.1.0"
---

# Documentation Sync Guardian

## Purpose
Keep generated or auto-sync documentation aligned with actual commits without changing Ontleedlab product behavior or rewriting local scope.

## Use when
- A commit landed on `main` and generated documentation needs a local follow-up summary.
- The user asks to update `docs/auto-sync` or equivalent generated sync notes.
- The user asks for a commit-grounded documentation summary.

Trigger examples: "sync docs after main", "update de auto-sync summary", "vat deze merge samen in generated docs".

## Do not use when
- The user asks for normal feature documentation, README work, or product strategy docs.
- The task would rewrite parsing scope, role conventions, metrics, architecture, or UI behavior.
- There is no commit, diff, or changed-file context to ground the summary.

## Workflow
1. Read `AGENTS.md`, `docs/local-scope-contract.md`, and `docs/documentation-sync-contract.md` if present.
2. Consult `shared/grammar-core/.claude/agents/documentation-sync-guardian.md` only when physically present.
3. Use only commit message, changed files, and diff context as evidence.
4. Update generated documentation only, preferably under `docs/auto-sync`.
5. Do not infer parsing behavior, metrics, or architecture changes that are not in the diff.

## Required output
- Changed generated-doc path(s).
- Commit or diff evidence used.
- One-line scope confirmation: no runtime, content, tests, workflows, or product behavior changed.

## Validation / test cases
Should trigger:
- "A commit landed on main; update the generated sync note."
- "Maak een auto-sync summary op basis van deze merged PR."

Should also trigger:
- "Werk de lokale generated docs bij na de laatste merge."

Should not trigger:
- "Schrijf een nieuwe handleiding voor de docentomgeving."
- "Pas de Rollenladder-logica aan in de app."

Functional success criterion: the result updates only generated documentation and every claim is traceable to commit, changed-file, or diff context.
