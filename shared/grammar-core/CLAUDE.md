# CLAUDE.md

## Repo purpose

`grammar-core` is the shared canonical core for grammar-analysis and verb-spelling instruction across multiple product repos.

This repo is not a product repo.
Do not treat it as the place where product-local runtime behavior, UI flows, local labels, or local data models are defined unless those have been explicitly generalized into shared canon.

Use this repo as the source of truth for:
- didactic governance
- content governance
- taxonomy governance
- shared schemas
- shared sentence/content layers
- canonical Claude agents
- canonical Codex skills
- product-repo governance boundaries

## Canonical locations

Treat the following as canonical locations in this repo:
- `docs/*` for shared didactic and governance canon
- `schemas/*` for shared structural canon
- `content/*` for shared taxonomy and shared sentence/content layers
- `/.claude/agents/*` for canonical Claude-native agent instructions
- `/.codex/skills/*` for canonical Codex-native skill instructions

Read also:
- `docs/agent-catalog.md`
- `docs/repo-sync-strategy.md`
- `docs/product-repo-contract-template.md`

## Core boundary rule

Do not treat product-local terminology, task models, annotation fields, evaluator logic, JSON shapes, chunk conventions, progression logic, renderer assumptions, or feedback flows as shared truth unless they have been explicitly promoted into shared canon.

If something still depends on local product reality, keep it local or abstract it first.

## Reading order

When working inside `grammar-core`:
1. read the relevant canonical docs in `docs/`
2. read the relevant Claude agent file(s) in `/.claude/agents/`
3. only then apply the task prompt

When working in a product repo that mirrors this repo via `shared/grammar-core/`:
1. read `shared/grammar-core/` first
2. read the local product contract second
3. read the task prompt last

Do not skip the local product contract when the task touches product-specific content, labels, evaluation logic, adapters, or data structures.

## Scope rules

Promote into `grammar-core` only what is genuinely portable across products, such as:
- shared didactic principles
- shared governance principles
- shared taxonomy rules
- shared content-authoring rules
- shared schemas
- shared sentence/content layers
- canonical tool instructions that apply across products

Do not promote into shared canon:
- product-specific labels or codes
- product-specific annotation fields
- product-specific JSON shapes
- product-specific task or evaluation structures
- product-specific chunk conventions
- product-specific UI or renderer logic
- product-specific feedback datastructures
- product-specific progression systems

## Change decision rules

For every proposed change, determine explicitly:
1. is this shared canon, local product logic, or a temporary bridge?
2. does this change belong in `docs/`, `schemas/`, `content/`, or a tool-native instruction file?
3. does the proposal rely on product-local assumptions that are not portable?
4. would this silently change runtime behavior in a product repo?
5. does this require a local product contract rather than a shared canon change?

If the answer is still product-local, do not canonize it here.

## Didactic rule

Do not call a proposal evidence-based unless it is explicitly linked to named principles from the canonical didactic framework in `docs/`.

Do not reduce parsing or spelling guidance to surface correctness only.
Shared didactic guidance should preserve:
- diagnostic reasoning
- function-first thinking where applicable
- meaningful contrasts
- manageable cognitive load
- clear instructional purpose

## Tool-native rule

Do not duplicate the full content of canonical docs inside agent files.

Claude agent files under `/.claude/agents/` should stay concise, operational, and refer back to the canonical docs.
Codex skills under `/.codex/skills/` follow the same rule.

## Product-repo protection rule

When a task touches product-specific content or structure, inspect the relevant local product contract before proposing changes to:
- labels
- evaluation logic
- adapters
- task structures
- local terminology
- local content models

Use repo inspection proportionally.
Do not require full-repo inspection for trivial wording or catalog updates.

## Output expectations

When completing substantial work in this repo, report:
- files read
- files changed
- whether the change affects shared canon, tool instructions, or both
- why the change is portable across products
- any remaining ambiguity that may still depend on product-local reality
- any wording that may still be too product-colored

## Preferred behavior

Prefer:
- narrow, reviewable changes
- explicit governance decisions
- clear separation between canon and local adaptation
- minimal duplication
- stable naming unless a typo or coherence problem clearly justifies renaming

Avoid:
- fake abstraction
- hidden product assumptions
- broad doc rewrites without need
- agent files that become theory essays
- promoting one product's structure as platform truth
