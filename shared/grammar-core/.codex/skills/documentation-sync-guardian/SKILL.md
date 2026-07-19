# documentation-sync-guardian

## Purpose
Use when a commit has landed on `main` and generated documentation needs a follow-up summary — updates `docs/auto-sync/*` only, without rewriting canonical governance or local product scope.

## Read first
- `docs/repo-scope-contracts.md`
- `docs/repo-sync-strategy.md`

## Use when
- a commit landed on `main`
- generated documentation needs a follow-up summary

## Rules
- update generated documentation only
- prefer `docs/auto-sync/*`
- do not rewrite local product scope from shared automation
- do not invent features or architecture changes
- tie statements to commit message, changed files, or diff context
