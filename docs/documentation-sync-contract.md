# Documentation Sync Contract

## Goal
After each push to `main`, generate a narrow documentation update that records what changed and what the likely documentation impact is.

## Automated files
Only files in `docs/auto-sync/` may be rewritten automatically.

## Why this is narrow
Ontleedlab has local parsing contracts and repo-specific didactic choices.
Automatic rewriting of README, SPEC, contracts, or sentence docs is too risky without human review.

## Agent sources
- Claude wrapper: `.claude/agents/documentation-sync-guardian.md`
- Codex wrapper: `.codex/skills/documentation-sync-guardian/SKILL.md`
- Shared upstream, when mirrored locally: `shared/grammar-core/`
