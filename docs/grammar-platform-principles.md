# Grammar Platform Principles

## Purpose

This document defines the shared principles for the grammar-and-verb-spelling platform being built across product repos that consume `grammar-core`.

To prevent governance failures, this document clearly separates three states:
- **Current shared reality** — what is actually present and operational in `grammar-core` now
- **Intended architecture** — the design target that governs decisions now even if not yet fully built
- **Future integration direction** — what comes after the current governance and product layers are stable

---

## Current shared reality

The following are present and operational in `grammar-core` today:

- Shared didactic canon for verb-spelling instruction (`docs/werkwoordspellingsdidactiek-kaders.md`)
- Shared didactic canon for parsing instruction (`docs/parsing-didactics-kaders.md`)
- Shared grammar role label taxonomy and misconception code governance (`docs/taxonomy-governance.md`)
- Shared content authoring rules (`docs/content-authoring-rules.md`)
- Shared product-repo contract template (`docs/product-repo-contract-template.md`)
- Shared repo sync strategy (`docs/repo-sync-strategy.md`)
- Canonical Claude agents under `/.claude/agents/`
- Canonical Codex skills under `/.codex/skills/`
- First shared schemas under `schemas/`
- A small shared sentence seed set under `content/shared-sentences/` (not yet a full operational sentence bank)

What is **not** yet operational:
- A shared runtime sentence layer that product repos actively consume
- A shared learner diagnosis model
- A shared teacher-facing infrastructure
- Package publishing or shared runtime libraries

---

## Intended architecture

These principles govern current design decisions even where implementation is still in progress.

### Instructional order principle

Grammatical analysis and verb spelling are one learning chain, not disconnected skills.

The intended instructional order is:
1. grammatical analysis
2. function recognition
3. rule selection
4. spelling application
5. revision and writing transfer

Shared content, agents, and governance should respect this chain.

### Shared diagnosis principle

Many verb-spelling failures are caused by prerequisite grammar failures.

The intended platform must distinguish between:
- analysis failure
- function confusion
- rule application failure
- irregular form failure
- transfer failure

Shared taxonomy and misconception codes should be designed to support this distinction. The specific detection logic and product feedback flows remain product-local.

### Product-specific renderer principle

The shared core defines content, rules, and governance. Product repos define mode-specific UI and interaction patterns.

This boundary must be maintained explicitly. Shared canon must not encode renderer assumptions.

### Shared sentence principle

One sentence should be reusable across multiple instructional modes (parsing, function recognition, verb spelling, contrast practice, revision, short writing transfer).

This is the intended design target for the shared content layer. It is not yet fully operational — see "Future integration direction" below.

---

## Future integration direction

The following are intended future states. They are not present now and must not be described as if operational.

### Shared sentence layer

The platform should grow by building a shared sentence layer with rich metadata, not by maintaining separate sentence banks in each product.

**Current status**: a small seed set exists under `content/shared-sentences/`. A full operational shared sentence layer — with metadata, reuse contracts, and product adapter mappings — does not yet exist. Do not claim or assume that a working sentence bank is currently operational.

### Shared learner diagnosis layer

A shared cross-product diagnosis model — connecting parsing bottlenecks with spelling bottlenecks — is a future integration goal. It does not exist in any operational form now.

### Shared teacher insight layer

Teacher insight becomes more useful when grammar analysis bottlenecks and spelling bottlenecks can be read together. Building shared teacher-facing infrastructure is a future goal contingent on the shared diagnosis layer.

### Integrated grammar platform

The long-term target is one shared grammar foundation with multiple product modes on top of it. This is an architectural direction, not a current build stream. Product repos should continue developing locally until the shared foundation is stable enough to support controlled convergence.

---

## Relationship to product repos

Product repos that consume `grammar-core` via subtree:
- adopt shared didactic and governance principles explicitly (not automatically)
- define their own local product contracts to document what is local and what is adopted from shared canon
- must not promote product-local structures (field names, JSON shapes, progression logic) back into shared canon

See `docs/product-repo-contract-template.md` for the contract structure.
See `docs/repo-sync-strategy.md` for the recommended sync model.
