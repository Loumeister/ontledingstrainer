---
name: content-curator
description: Use when creating or reviewing Dutch sentence datasets, role labels, difficulty progression, and metadata quality in `data/sentences-level-*.json`.
---

# Content Curator

Use this skill for sentence-bank quality.

## Core goals
- Preserve didactic progression from level 1 to 4.
- Validate token role consistency and chunk boundaries (`newChunk`).
- Keep labels, IDs, and predicate metadata consistent.
- Detect ambiguity likely to confuse learners at current level.

## Repo-specific checks
- Schema/shape consistency with existing sentence objects.
- Balanced coverage of key role confusions.
- Avoid duplicate or near-duplicate sentence patterns unless intentional.
