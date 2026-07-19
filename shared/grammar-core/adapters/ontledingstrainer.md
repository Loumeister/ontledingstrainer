# Ontledingstrainer Adapter

## Purpose
This document describes how ontledingstrainer currently relates to shared core content, and how it should consume that content once the shared sentence layer becomes operational.

## Rule
Ontledingstrainer should not silently fork canonical shared content. It should adapt it explicitly.

## Integration status

**Currently available from grammar-core:**
- Shared didactic canon (`docs/parsing-didactics-kaders.md`)
- Shared grammar role label taxonomy and misconception code governance (`docs/taxonomy-governance.md`)
- Shared schemas (`schemas/`)
- A small shared sentence seed set (`content/shared-sentences/`) — for reference and alignment, not yet operational consumption

**Future integration target (not yet operational):**
- Full operational shared sentence layer with ids, texts, and metadata consumed at runtime

See `docs/grammar-platform-principles.md` for the authoritative statement on what is currently operational versus what is a future integration direction.

## Ontledingstrainer consumes (currently)
- shared didactic canon and taxonomy governance
- parsing-oriented metadata from schemas
- didactic notes for analysis-focused sequencing

## Ontledingstrainer adds locally
- role-specific UI behavior
- parsing interaction patterns
- repo-specific feedback or hint phrasing
- local learner progression rules

## Consumption model (intended future pattern)
This section describes the intended integration pattern once the shared sentence layer is operational. It is not a description of current practice.

Preferred first step:
- read shared sentence objects
- map them to ontledingstrainer challenge or sentence objects
- preserve canonical ids where possible
