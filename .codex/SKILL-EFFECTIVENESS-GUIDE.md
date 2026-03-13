# Skill effectiveness and practical limits in Codex

## Is there a hard maximum number of skills?

No hard-coded maximum is documented in this environment.

Practically, skill quality drops when too many broad skills are simultaneously relevant because:
- skill metadata is always in context,
- triggered skill bodies consume additional context,
- overlapping instructions increase routing ambiguity.

## Practical limit for this project

For this repository, use these guardrails:

- **Installed skills**: up to ~20 is typically fine if each skill stays focused.
- **Skills triggered in one turn**: keep to **1-3** (occasionally 4) for best consistency.
- **Skill body size**: prefer concise `SKILL.md` files (<500 lines, ideally far less).

## Signs you have too many active skills

- Conflicting output formats in one response.
- Tool usage that doesn't match the task.
- Repeated generic advice instead of repo-specific action.

## Mitigations

1. Split broad skills into narrow domain skills.
2. Use clear trigger descriptions with explicit "Use when..." language.
3. Keep heavy detail in optional references, not in `SKILL.md` body.
4. Activate the minimum number of skills needed per request.
