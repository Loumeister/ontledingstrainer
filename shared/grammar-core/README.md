# grammar-core

`grammar-core` is the shared canonical core for grammar-analysis and verb-spelling instruction across multiple product repos.

This repository exists to prevent drift between grammar analysis and verb-spelling instruction across separate product repos.

## Mission

Provide one shared source of truth for:
- didactic governance (parsing and verb-spelling instruction)
- content governance
- grammar role label and misconception taxonomy governance
- shared schemas
- shared sentence/content seeds (not yet a full operational sentence layer)
- canonical Claude agents and Codex skills
- product-repo governance boundaries

## Why this repo exists

Product repos that share a grammar-and-spelling domain cannot reliably govern didactics and taxonomy without a shared canonical layer.

A shared core repo is needed because:
- package-only sharing is not sufficient for agent and governance visibility
- didactic and taxonomy rules must stay canonical
- local product logic must remain local rather than silently becoming shared canon

## What is canonical here

The following are canonical in `grammar-core`:

**Governance and didactics**
- `docs/werkwoordspellingsdidactiek-kaders.md` — shared verb-spelling didactic canon
- `docs/parsing-didactics-kaders.md` — shared parsing didactic canon
- `docs/grammar-platform-principles.md` — shared platform principles, distinguishing current reality from future direction
- `docs/taxonomy-governance.md` — grammar role label and misconception code governance
- `docs/content-authoring-rules.md` — shared content authoring rules
- `docs/repo-sync-strategy.md` — recommended sync model for product repos
- `docs/product-repo-contract-template.md` — template for local product-repo contracts
- `docs/portable-to-core-map.md` — migration decision map for promotions from product repos
- `docs/agent-catalog.md` — catalog of canonical Claude agents and Codex skills

**Program map**
- `docs/ontleedlab-master-operating-map.md` — cross-repo program map (governance architecture and workstreams; Ontleedlab-specific operational content has been moved to that repo's local documentation)

**Tool-native instruction files**
- `/.claude/agents/*` — canonical Claude agents
- `/.codex/skills/*` — canonical Codex skills

**Schemas and content seeds**
- `schemas/*` — shared structural schemas
- `content/shared-sentences/*` — first shared sentence seeds (not yet a full operational sentence bank)
- `content/taxonomy/*` — canonical taxonomy content, including misconception definitions and codes

## What is intentionally not canonical here

The following belong in local product repos and must not be promoted here:
- product-specific field names, JSON shapes, or annotation structures
- product-specific TypeScript types or constants
- product-specific display labels, tooltips, or UI text
- product-specific feedback matrices
- product-specific progression logic or level assignments
- product-specific task structures or evaluator logic
- product-specific renderer or interaction patterns
- product-specific local documentation and task boards

## What is shared versus still aspirational

**Shared and operational now:**
- shared didactic canon for parsing and verb-spelling instruction
- shared taxonomy governance (role labels and misconception codes)
- shared product-repo contract template
- canonical Claude agents and Codex skills
- first shared schemas
- small shared sentence seed set

**Aspirational (not yet operational):**
- a full shared sentence layer that product repos actively consume
- shared learner diagnosis model
- shared teacher-facing infrastructure
- integrated grammar platform with multiple exercise modes

Do not treat aspirational items as current operational reality.

## Recommended sync model

Product repos should include this repo locally, preferably via **git subtree**, for example under:

```text
shared/grammar-core/
```

This is the preferred approach because Claude and Codex agents can only reliably use files that are physically present in the current repo context.

Shared subtree sync should preserve the tool-native paths in this repo, especially:
- `shared/grammar-core/.claude/agents/*`
- `shared/grammar-core/.codex/skills/*`

## Local wrapper rule

Product repos may keep local agent files, but those must be wrappers.

Their reading order must be:
1. `shared/grammar-core/`
2. local repo contracts
3. task prompt

Local wrappers may adapt behavior to repo reality, but must not silently replace or contradict shared canon.

## Adoption rule

Shared didactic and governance principles are not automatically binding for product repos. Adoption is a deliberate, explicit choice documented in each product repo's local contract.

## Agent rule

No proposal may be called evidence-based unless it is explicitly justified by one or more named principles from the didactic framework in `docs/`.
