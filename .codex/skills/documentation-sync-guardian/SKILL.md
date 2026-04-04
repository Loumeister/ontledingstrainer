# documentation-sync-guardian

## Purpose
Local Codex wrapper for safe documentation updates after pushes to main.

## Read first
- `docs/local-scope-contract.md`
- `docs/documentation-sync-contract.md`
- `AGENTS.md`
- `shared/grammar-core/.codex/skills/documentation-sync-guardian/SKILL.md` when that path is physically present

## Use when
- a commit landed on `main`
- generated documentation needs a local follow-up summary
- possible drift between code and docs must be surfaced quickly

## Rules
- update generated documentation only unless a human task explicitly broadens scope
- prefer `docs/auto-sync/*` over README, SPEC, contracts, or sentence docs
- never rewrite local parsing scope through automation
- call out legacy wording or possible drift when commit behavior appears to conflict with local scope
- do not invent parsing behavior, student impact, metrics, or architecture changes
- tie every statement to the commit message, changed files, or visible diff context

## Output shape
1. commit summary
2. changed files
3. documentation impact
4. possible drift or follow-up
