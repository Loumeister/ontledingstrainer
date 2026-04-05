# documentation-sync-guardian

## Purpose
Safe local documentation sync wrapper.

## Read first
- `docs/local-scope-contract.md`
- `docs/documentation-sync-contract.md`
- `shared/grammar-core/.codex/skills/documentation-sync-guardian/SKILL.md` when that path is physically present

## Use when
- a commit landed on `main`
- generated documentation needs a local follow-up summary

## Rules
- update generated documentation only
- prefer `docs/auto-sync/*`
- do not rewrite local parsing scope through automation
- do not invent parsing behavior, metrics, or architecture changes
- tie statements to commit message, changed files, or diff context
