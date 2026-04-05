# Ontleedlab Master Operating Map

_Last updated: 2026-04-02_

## Purpose

This document is the control map for Ontleedlab.

It exists to keep four kinds of drift visible and bounded:
1. product drift between Ontleedapp and the werkwoordspelling app
2. documentation drift inside and across repos
3. AI-instruction drift between `grammar-core` and local product repos
4. strategy drift toward a vague future grammar platform without the right backbone

This is not a product spec and not a local repo contract.
It is the shared program map for:
- what exists now
- what is being aligned
- what is still in flight
- what depends on what
- what should happen next

---

## North star

Ontleedlab is moving toward one shared grammar foundation with multiple product modes on top of it.

That means the real target is not:

```text
Ontleedapp
+ werkwoordspelling app
+ some shared docs
+ later a third big grammar app
```

The real target is:

```text
shared grammar backbone
├─ Ontleedapp / ontledingstrainer
├─ Werkwoordlab / werkwoordspelling app
└─ later: one integrated grammar platform
```

Core rule:

**Do not merge the apps directly. Let them converge upward through the shared foundation.**

```text
Ontleedapp ─┐
            ├──> shared foundation in grammar-core ───> later integrated grammar platform
WW app   ───┘
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
- shared sentence/content direction

LAYER B. LOCAL PRODUCT REPOS
- ontledingstrainer / Ontleedapp
- Werkwoordlab / werkwoordspelling app

LAYER C. FUTURE PLATFORM
- shared grammar-kernel direction
- shared sentence/content layer
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

Canonical files already present on `main` include:
- `docs/werkwoordspellingsdidactiek-kaders.md`
- `docs/parsing-didactics-kaders.md`
- `docs/grammar-platform-principles.md`
- `docs/content-authoring-rules.md`
- `docs/taxonomy-governance.md`
- `docs/repo-sync-strategy.md`
- `docs/product-repo-contract-template.md`
- `docs/portable-to-core-map.md`
- `docs/agent-catalog.md`
- `/.claude/agents/*`
- `/.codex/skills/*`

Important current nuance:
- the tool-native path restructure is already merged
- `docs/agent-catalog.md` is already on `main`
- a root `CLAUDE.md` is proposed in an open PR, but is not yet part of `main` at the time of this map
- the README path cleanup is also still in an open PR at the time of this map

### `ontledingstrainer` / Ontleedapp
Role: local parsing product repo.

Purpose:
- preserve current parsing logic, labels, feedback structures, and didactic UI choices
- continue product development without flattening local parsing logic into generic platform language
- later plug into shared content and shared diagnostic work where appropriate

Current structural reality from recent work:
- a local `repo-contract.md` sync step is active or recently completed
- documentation drift and repo incongruence were identified as real risks
- local parsing behavior must not change during contract-sync or documentation-alignment steps

### `Werkwoordlab` / werkwoordspelling app
Role: local verb-spelling product repo.

Purpose:
- build an evidence-based workwoordspelling product with equal architectural discipline
- maintain product-specific logic, progression, and feedback structure
- later connect to shared sentence reuse and shared diagnostic work

Current structural reality from recent work:
- the app is an active product stream, not a future side project
- it still needs the same degree of contract clarity and instruction discipline as Ontleedapp
- future convergence should happen through shared content, shared diagnosis, and shared governance, not through direct app fusion

---

## Current board state

### Shared foundation

```text
grammar-core shared governance ............ IN PROGRESS
shared parsing governance ................. IN PROGRESS
shared verb-spelling governance ........... IN PROGRESS
agent catalog ............................. PRESENT ON MAIN
tool-native agent/skill paths ............. PRESENT ON MAIN
root CLAUDE.md ............................ PROPOSED IN OPEN PR
README path cleanup ....................... PROPOSED IN OPEN PR
shared sentence schema .................... NOT YET LOCKED
shared learner diagnosis model ............ NOT YET LOCKED
```

### Ontleedapp

```text
local repo contract sync .................. ACTIVE
documentation drift map ................... NEEDED / PARTLY STARTED
doc realignment ........................... NEEDED
runtime protection ........................ NON-NEGOTIABLE
product development ....................... ONGOING
future shared-content readiness ........... EARLY STAGE
```

### Werkwoordlab / WW app

```text
evidence-based didactic backbone .......... ACTIVE
local structural contract/rules ........... NEEDED
repo-level alignment with grammar-core .... NEEDED
product roadmap ........................... ACTIVE
future integration readiness .............. EARLY STAGE
```

### Future integrated grammar platform

```text
platform direction ........................ ACTIVE AS STRATEGY
separate build stream ..................... SHOULD NOT START YET
shared kernel extraction .................. LATER
shared mode logic ......................... LATER
shared teacher layer ...................... LATER
```

---

## What the recent chats changed

### 1. Bringing the apps together
Core conclusion:
- the best end state is one grammar platform
- the immediate move is not direct fusion
- the immediate move is shared foundation first

### 2. Mapping outdated or incongruent material in `ontledingstrainer`
Core conclusion:
- repo-level documentation drift is already a practical problem
- Ontleedapp needs a visible documentation and contract realignment pass before larger cross-repo expansion

### 3. Revising `repo-contract.md`
Core conclusion:
- Ontleedapp needs a compact, accurate local contract
- future contributors should read shared canon first, then local contract, then the task prompt

### 4. Extending the shared canonical agent layer
Core conclusion:
- parsing didactics needs the same governance quality as workwoordspelling didactics
- `grammar-core` is becoming the governance hub, not just a note repository

### 5. Designing a root `CLAUDE.md`
Core conclusion:
- a top-level AI operating file is strategically useful
- it should route contributors through the correct reading order without duplicating the full docs layer
- at the time of this map, that file is proposed but not yet merged to `main`

---

## Workstreams

### Workstream 1. Shared governance spine
Goal: make `grammar-core` the stable control layer.

Includes:
- shared parsing didactic canon
- shared workwoordspelling didactic canon
- shared content governance
- shared Claude agents and Codex skills
- agent catalog
- shared product-repo contract pattern
- root-level orchestration once `CLAUDE.md` is merged
- explicit rules for what must remain product-local

Done when:
- a new AI contributor can tell what is shared canon, what is local product logic, and what may not be generalized

### Workstream 2. Ontleedapp stabilization and continuity
Goal: keep Ontleedapp coherent while preparing it for later integration.

Includes:
- local contract sync
- explicit outdated/incongruent documentation map
- documentation realignment
- preservation of local parsing taxonomy, feedback logic, and UI constraints
- continued product work inside those boundaries

Done when:
- Ontleedapp remains internally sharp and becomes easier to extend safely

### Workstream 3. Werkwoordlab backbone
Goal: give the workwoordspelling app the same structural seriousness as Ontleedapp.

Includes:
- evidence-based didactic backbone
- local contract or equivalent structural rules
- alignment with `grammar-core`
- product roadmap and repo structure
- preparation for sentence reuse and shared diagnosis later

Done when:
- the WW app can evolve without becoming a later integration liability

### Workstream 4. Bridge-layer design
Goal: prepare convergence without prematurely starting a third full product stream.

Includes:
- shared sentence model
- shared metadata model
- sentence reuse rules across products
- shared learner diagnosis concepts
- bridge tasks between parsing and spelling modes
- first boundary of a later grammar-kernel extraction

Done when:
- both apps can converge later without major rewrites or concept clashes

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
2. merge or finalize the root orchestration layer
3. lock the shared contract pattern
4. finish local contract sync in Ontleedapp
5. make the outdated/incongruent map for Ontleedapp
6. align Ontleedapp docs to repo reality
7. create the equivalent structural map for the WW app
8. only then lock the first bridge artifacts
9. only after that start extracting genuinely shared runtime pieces

---

## Phased roadmap

### Phase 1. Lock the governance layer
Deliverables:
- shared parsing-oriented governance files
- shared content governance skill coverage
- stable agent catalog
- root-level orchestration layer
- stable shared product-repo contract template

Exit criterion:
- AI contributors no longer need to guess where shared canon ends and local logic begins

### Phase 2. Align local product reality
Deliverables:
- final local contract in Ontleedapp
- explicit outdated/incongruent map for Ontleedapp
- updated Ontleedapp docs that match repo reality
- equivalent structural map and local rules for the WW app

Exit criterion:
- the product repos are legible and no longer quietly diverge from the shared layer

### Phase 3. Continue product work safely
Deliverables:
- ongoing Ontleedapp feature work
- ongoing WW app feature work
- architecture-aware prompts and agent usage
- no broad runtime changes disguised as documentation work

Exit criterion:
- both apps continue moving without increasing structural debt

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
3. Do not let Ontleedapp-specific parsing choices dissolve into shared abstractions.
4. Do not let the WW app remain structurally looser than Ontleedapp.
5. Do not hide architecture decisions inside one-off prompts.
6. Do not perform runtime changes during contract-sync and documentation-alignment steps unless the task explicitly changes scope.

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

When root `CLAUDE.md` is merged, it should become the first file in the top-level reading order for work inside `grammar-core`.

---

## Simple visual overview

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
        │     ONTLEEDAPP        │         │   WERKWOORDLAB       │
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

## Immediate next actions

1. finish the shared instruction spine in `grammar-core`
2. merge or finalize the root `CLAUDE.md`
3. finalize Ontleedapp local contract sync
4. produce the explicit outdated/incongruent map for Ontleedapp
5. align Ontleedapp docs with that reality
6. create the equivalent structural map for the WW app
7. only then define the first shared bridge artifacts:
   - shared sentence schema
   - shared sentence metadata
   - sentence reuse rules
   - shared learner diagnosis concepts
   - progression logic between modes

---

## Operating summary

Ontleedlab should be managed as a layered system:
- first govern the shared foundation
- then align the local repos
- then keep both products moving
- only then design their controlled convergence into one grammar platform
