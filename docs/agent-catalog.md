# Agent Catalog

This catalog maps each canonical Claude agent and Codex skill to its tool-native path in `grammar-core`.

## Claude agents

| Concept name | Tool | Path | Goal | Read-first docs |
|---|---|---|---|---|
| content-expander | Claude | `/.claude/agents/content-expander.md` | Grow shared sentence and task content with didactic discipline and taxonomy control. | `docs/werkwoordspellingsdidactiek-kaders.md`, `docs/content-authoring-rules.md`, `docs/taxonomy-governance.md` |
| didactic-architect | Claude | `/.claude/agents/didactic-architect.md` | Evaluate didactic structure, progression, and whether distinctions are instructionally justified. | `docs/werkwoordspellingsdidactiek-kaders.md`, `docs/grammar-platform-principles.md`, `docs/content-authoring-rules.md` |
| taxonomy-evaluator-guardian | Claude | `/.claude/agents/taxonomy-evaluator-guardian.md` | Guard taxonomy and evaluator distinctions so new codes stay instructionally meaningful. | `docs/werkwoordspellingsdidactiek-kaders.md`, `docs/taxonomy-governance.md` |
| parsing-didactic-architect | Claude | `/.claude/agents/parsing-didactic-architect.md` | Guard parsing didactics, bridge-task quality, and the boundary between shared canon and product-local parsing logic. | `docs/parsing-didactics-kaders.md`, `docs/grammar-platform-principles.md`, `docs/taxonomy-governance.md`, `docs/content-authoring-rules.md`, `docs/product-repo-contract-template.md` |

## Codex skills

| Concept name | Tool | Path | Goal | Read-first docs |
|---|---|---|---|---|
| evidence-based-werkwoordspellingsdidactiek | Codex | `/.codex/skills/evidence-based-werkwoordspellingsdidactiek/SKILL.md` | Review whether proposals are genuinely evidence-informed and preserve core didactic principles. | `docs/werkwoordspellingsdidactiek-kaders.md`, `docs/grammar-platform-principles.md`, `docs/taxonomy-governance.md` |
| shared-content-integration | Codex | `/.codex/skills/shared-content-integration/SKILL.md` | Keep shared content canonical while allowing explicit, lightweight product-repo adaptation. | `docs/content-authoring-rules.md`, `docs/repo-sync-strategy.md`, `docs/taxonomy-governance.md` |
| parsing-content-governance | Codex | `/.codex/skills/parsing-content-governance/SKILL.md` | Govern parsing-oriented shared content, product-repo alignment, and explicit protection of local parsing constraints. | `docs/parsing-didactics-kaders.md`, `docs/content-authoring-rules.md`, `docs/product-repo-contract-template.md`, `docs/repo-sync-strategy.md` |

## Plugin-distributed Claude skills

Some canonical Claude skills are distributed to product repos through the plugin marketplace (`grammar-core`) rather than the subtree tool-native paths. These live under `plugins/<plugin>/skills/<slug>/SKILL.md` and are installed with `/plugin install`. See `docs/repo-sync-strategy.md` for the channel rules.

| Concept name | Tool | Path | Goal | Installed as |
|---|---|---|---|---|
| grammar-core-sync | Claude (plugin) | `plugins/grammar-core-toolkit/skills/grammar-core-sync/SKILL.md` | Sync `shared/grammar-core/` in product repos with canon and route local canon-improvements upstream first. | `/grammar-core-toolkit:grammar-core-sync` |

## Notes on naming and scope
- Claude entries remain agent-shaped markdown files under `/.claude/agents/`.
- Codex entries are represented as skills under `/.codex/skills/<slug>/SKILL.md`.
- Plugin-distributed Claude skills live under `plugins/<plugin>/skills/` and ship via the plugin marketplace; they do not auto-load in `grammar-core` sessions and are not consumed through the subtree tool-native paths.
- The previous slug `evidence-based-workwoordspellingsdidactiek` contained a clear typo and is normalized here to `evidence-based-werkwoordspellingsdidactiek`.
- Parsing-related entries govern didactic discipline and local-boundary protection, but do not canonize product-specific parsing data models.
- This catalog documents tool-native locations only. Repo-wide didactic and governance canon remains in `docs/`, `schemas/`, and `content/`.
