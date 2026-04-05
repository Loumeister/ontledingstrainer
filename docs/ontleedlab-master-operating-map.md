# Grammar Platform Program Map

_Last updated: 2026-04-05_

> **Note on scope**: This document was originally titled "Ontleedlab Master Operating Map". It has been reframed as a neutral cross-repo program map.
>
> Ontleedlab-specific operational content (local product state, local documentation drift, local task boards) belongs in `ontledingstrainer`'s own local documentation — not in shared canon. This document retains the governance architecture, workstream structure, and dependency chain that are genuinely cross-repo.

---

## Purpose

This document is the program map for the shared grammar platform.

It keeps four kinds of drift visible and bounded:
1. product drift between product repos and the shared foundation
2. documentation drift inside and across repos
3. AI-instruction drift between `grammar-core` and local product repos
4. strategy drift toward a vague future grammar platform without the right backbone

This is not a product spec and not a local repo contract.
It is the shared program map for:
- what the governance architecture is
- what is being aligned
- what is still in flight
- what depends on what
- what should happen next

---

## North star

The grammar platform is moving toward one shared grammar foundation with multiple product modes on top of it.

The real target is not:

```text
product repo A
+ product repo B
+ some shared docs
+ later a third big grammar app
```

The real target is:

```text
shared grammar backbone (grammar-core)
├─ ontledingstrainer / parsing product
├─ Werkwoordlab / verb-spelling product
└─ later: one integrated grammar platform
```

Core rule:

**Do not merge the product repos directly. Let them converge upward through the shared foundation.**

```text
parsing product ───┐
                   ├──> shared foundation in grammar-core ───> later integrated grammar platform
WW product     ────┘
```

---

## Layer model

```text
LAYER A. SHARED FOUNDATION
- grammar-core
- shared didactic canon
- shared content governance
- shared Claude/Codex instruction layer
- shared contract pattern
- shared sentence/content direction (seed set now; full layer later)

LAYER B. LOCAL PRODUCT REPOS
- ontledingstrainer / parsing product
- Werkwoordlab / verb-spelling product

LAYER C. FUTURE PLATFORM
- shared grammar-kernel direction
- shared sentence/content layer (operational)
- shared learner diagnosis layer
- multiple exercise modes on one foundation
- selected shared teacher logic where justified
```

One-sentence rule:

**First govern the foundation, then align the product repos, then design convergence.**

---

## Repo roles

### `grammar-core`
Role: shared canonical control layer.

Purpose:
- define shared didactic and governance canon
- define what belongs in shared vs local layers
- provide canonical docs, shared schemas, and shared content direction
- provide the shared instruction layer for Claude and Codex
- protect product repos from silent conceptual drift

### `ontledingstrainer`
Role: local parsing product repo.

Purpose:
- preserve current parsing logic, labels, feedback structures, and didactic UI choices
- continue product development without flattening local parsing logic into generic platform language
- later plug into shared content and shared diagnostic work where appropriate

Local product state, documentation drift maps, and task boards for `ontledingstrainer` belong in that repo's own local documentation — not in this file.

### `Werkwoordlab`
Role: local verb-spelling product repo.

Purpose:
- build an evidence-based verb-spelling product with equal architectural discipline
- maintain product-specific logic, progression, and feedback structure
- later connect to shared sentence reuse and shared diagnostic work

Local product state for `Werkwoordlab` belongs in that repo's own local documentation.

---

## Workstreams

### Workstream 1. Shared governance spine
Goal: make `grammar-core` the stable control layer.

Includes:
- shared parsing didactic canon
- shared verb-spelling didactic canon
- shared content governance
- shared Claude agents and Codex skills
- agent catalog
- shared product-repo contract pattern
- explicit rules for what must remain product-local

Done when:
- a new AI contributor can tell what is shared canon, what is local product logic, and what may not be generalized

### Workstream 2. Local product repo alignment
Goal: keep product repos coherent while preparing them for later integration.

Includes:
- local contract sync in each product repo
- explicit documentation of outdated or incongruent material
- preservation of local parsing taxonomy, feedback logic, and UI constraints in `ontledingstrainer`
- preservation of local verb-spelling logic in `Werkwoordlab`
- continued product work inside those boundaries

Done when:
- each product repo is legible, internally consistent, and no longer quietly diverges from the shared layer

### Workstream 3. Bridge-layer design
Goal: prepare convergence without prematurely starting a third full product stream.

Includes:
- shared sentence schema
- shared sentence metadata model
- sentence reuse rules across products
- shared learner diagnosis concepts
- bridge tasks between parsing and spelling modes
- first boundary of a later grammar-kernel extraction

Done when:
- both product repos can converge later without major rewrites or concept clashes

---

## Dependency chain

```text
shared governance spine
    ↓
local repo contracts
    ↓
documentation alignment
    ↓
safe product development
    ↓
bridge-layer design
    ↓
later platform convergence
```

What that means in practice:
1. stabilize `grammar-core` governance files
2. lock the shared contract pattern
3. finish local contract sync in each product repo
4. align product repo docs to local repo reality
5. only then lock the first bridge artifacts
6. only after that start extracting genuinely shared runtime pieces

---

## Phased roadmap

### Phase 1. Lock the governance layer
Deliverables:
- shared parsing-oriented governance files
- shared content governance skill coverage
- stable agent catalog
- stable shared product-repo contract template

Exit criterion:
- AI contributors no longer need to guess where shared canon ends and local logic begins

### Phase 2. Align local product reality
Deliverables:
- final local contract in each product repo
- updated product repo docs that match local repo reality

Exit criterion:
- the product repos are legible and no longer quietly diverge from the shared layer

### Phase 3. Continue product work safely
Deliverables:
- ongoing product feature work in each repo
- architecture-aware prompts and agent usage
- no broad runtime changes disguised as documentation work

Exit criterion:
- both product repos continue moving without increasing structural debt

### Phase 4. Design the bridge artifacts
Deliverables:
- shared sentence schema
- shared sentence metadata model
- sentence reuse rules
- shared learner diagnosis concepts
- bridge tasks between modes
- first boundary for future grammar-kernel extraction

Exit criterion:
- you know exactly what can be shared and what must stay local

### Phase 5. Controlled platform convergence
Deliverables:
- extracted shared engine pieces where justified
- unified content pipelines where justified
- selected shared teacher-facing infrastructure where justified
- multiple exercise modes on one governed foundation

Exit criterion:
- the integrated grammar platform emerges from stable layers instead of from a rewrite gamble

---

## Non-negotiables

1. Do not start the integrated grammar platform as a third full build stream yet.
2. Do not let `grammar-core` become vague or purely aspirational.
3. Do not let product-specific parsing or spelling choices dissolve into shared abstractions.
4. Do not hide architecture decisions inside one-off prompts.
5. Do not perform runtime changes during contract-sync and documentation-alignment steps unless the task explicitly changes scope.

---

## Recommended reading order

### In `grammar-core`
1. relevant canonical docs in `docs/`
2. relevant shared agent or skill files in `/.claude/agents/` and `/.codex/skills/`
3. this map for program-level orientation
4. only then the task prompt

### In a product repo that mirrors `grammar-core`
1. `shared/grammar-core/`
2. local product contract
3. task prompt

---

## Visual overview

```text
                    ┌────────────────────────────────────┐
                    │            GRAMMAR-CORE            │
                    │ shared canon, docs, agents,        │
                    │ skills, contract pattern,          │
                    │ sentence/content direction         │
                    └────────────────┬───────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
        ┌───────────▼───────────┐         ┌──────────▼───────────┐
        │   ONTLEDINGSTRAINER   │         │   WERKWOORDLAB       │
        │ local parsing logic   │         │ local spelling logic │
        │ local contract        │         │ local contract/rules │
        │ local docs            │         │ local docs           │
        │ product development   │         │ product development  │
        └───────────┬───────────┘         └──────────┬───────────┘
                    │                                 │
                    └────────────────┬────────────────┘
                                     │
                       ┌─────────────▼─────────────┐
                       │   FUTURE INTEGRATED APP   │
                       │ one grammar platform      │
                       │ multiple exercise modes   │
                       │ shared content/diagnosis  │
                       └───────────────────────────┘
```

---

## Operating summary

The grammar platform should be managed as a layered system:
- first govern the shared foundation
- then align the local repos
- then keep both products moving
- only then design their controlled convergence into one grammar platform
