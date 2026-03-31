# Claude agents vs Codex usage in this repo

The files in `.claude/agents/*.md` are **Claude-style subagent definitions** (frontmatter keys like `name`, `description`, `emoji`, `vibe`).

## Are they used the same way in Codex?

Short answer: **No, not directly.**

Codex in this environment is configured around **skills** (each skill has a `SKILL.md` with YAML `name` and `description`), triggered by user intent and instruction matching.

## What was added for Codex

To make equivalent specialist behavior available in Codex, these skills were added:

- `.codex/skills/grammar-coach/SKILL.md`
- `.codex/skills/frontend-developer/SKILL.md`
- `.codex/skills/technical-writer/SKILL.md`
- `.codex/skills/accessibility-auditor/SKILL.md`
- `.codex/skills/whimsy-injector/SKILL.md`

## Practical implication

- Keep `.claude/agents` for Claude tooling.
- Use `.codex/skills/*/SKILL.md` for Codex specialization.
- If you want automatic discovery in future sessions, ensure your Codex runtime loads project skills from this repository path.

## Additional useful specialist skills for this project

Beyond the 5 migrated roles, these specializations are likely high value for this codebase:

- `test-engineer` (strengthen automated safety net)
- `content-curator` (sentence-data quality and level progression)
- `learning-analytics` (turn logs into roadmap decisions)

These have been added under `.codex/skills/*/SKILL.md`.

## Note on source repo lookup

A direct fetch from `https://github.com/Loumeister/agency-agents` was attempted in this environment but GitHub returned HTTP 403, so discovery of additional roles was completed via project-needs analysis instead of remote repository inspection.
