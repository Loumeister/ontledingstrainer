# grammar-core

`grammar-core` is the shared canonical core for:
- Werkwoordlab
- ontledingstrainer

This repository exists to prevent drift between grammar analysis and verb-spelling instruction across separate product repos.

## Mission
Provide one shared source of truth for:
- didactic governance
- content governance
- misconception taxonomy governance
- shared sentence/content models
- canonical Claude agents and Codex skills
- product-repo governance boundaries

## Why this repo exists
Werkwoordlab and ontledingstrainer complement each other, but their repos and agents cannot reliably see each other.

A shared core repo is needed because:
- package-only sharing is not sufficient for agent visibility
- didactic and taxonomy rules must stay canonical
- sentence reuse should start from one content layer, not from duplicated local copies
- local product logic must remain local rather than silently becoming shared canon

## Canonical in this repo
The following are canonical here:
- `docs/werkwoordspellingsdidactiek-kaders.md`
- `docs/parsing-didactics-kaders.md`
- `docs/grammar-platform-principles.md`
- `docs/content-authoring-rules.md`
- `docs/taxonomy-governance.md`
- `docs/repo-sync-strategy.md`
- `docs/product-repo-contract-template.md`
- `docs/portable-to-core-map.md`
- `docs/agent-catalog.md`
- `docs/ontleedlab-master-operating-map.md`
- `/.claude/agents/*`
- `/.codex/skills/*`
- `schemas/*`
- `content/taxonomy/*`
- `content/shared-sentences/*`

## Recommended sync model
Both product repos should include this repo locally, preferably via **git subtree**, for example under:

```text
shared/grammar-core/
```

This is the preferred first approach because Claude and Codex agents can only reliably use files that are physically present in the current repo context.

Shared subtree sync should preserve the tool-native paths in this repo, especially:
- `shared/grammar-core/.claude/agents/*`
- `shared/grammar-core/.codex/skills/*`

## Local wrapper rule
Product repos may keep local agent files, but those must be wrappers.

Their reading order must be:
1. `shared/grammar-core/`
2. local repo contracts
3. task prompt

That means local wrappers should read the shared tool-native files first, then apply local repo constraints, and only then apply the task prompt.

## Phase 1 scope
Phase 1 of `grammar-core` includes:
- canonical didactic docs for verb spelling and parsing
- canonical governance docs for content, taxonomy, sync, and migration decisions
- canonical template for local product-repo contracts
- canonical Claude agents and Codex skills
- first shared schemas
- first small shared taxonomy
- first small shared sentence seed set

Phase 1 explicitly does **not** include:
- a full runtime library
- package publishing
- a monorepo migration
- shared analytics infrastructure
- forced unification of local product data models

## Agent rule
No proposal may be called evidence-based unless it is explicitly justified by one or more named principles from the didactic framework in `docs/`.
