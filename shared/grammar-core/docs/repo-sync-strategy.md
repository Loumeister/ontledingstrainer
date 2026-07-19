# Repo Sync Strategy

## Problem
Claude and Codex agents can only reliably work from files that are physically visible in the current repository context.

That means cross-repo governance cannot depend on one repo invisibly reading the docs and agents of another.

## Recommended strategy
Use `grammar-core` as the canonical shared repo and mirror it into each product repo via **git subtree**.

The mirrored subtree should preserve the tool-native shared paths in `grammar-core`, especially:
- `shared/grammar-core/.claude/agents/*`
- `shared/grammar-core/.codex/skills/*`

## Why package-only is insufficient
Package dependencies may share runtime code, but they do not reliably solve:
- agent visibility
- didactic governance visibility
- taxonomy governance visibility
- canonical docs visibility

## Why subtree is preferred now
Subtree gives:
- physically visible shared files in each repo
- reviewable sync diffs
- minimal infrastructure overhead
- no immediate monorepo requirement

## Local wrapper rule
Product repos may keep local Claude/Codex files, but they must be wrappers that:
1. read the shared tool-native files in `shared/grammar-core/` first
2. apply local repo constraints second
3. apply the task prompt last

In practice that means local wrappers should resolve through shared paths such as:
- `shared/grammar-core/.claude/agents/...`
- `shared/grammar-core/.codex/skills/.../SKILL.md`

Local wrappers may adapt behavior to repo reality, but they must not silently replace or contradict shared canon.

## Plugin marketplace channel (Claude skills)
Alongside subtree, `grammar-core` ships a Claude Code plugin marketplace (`grammar-core`, defined in `/.claude-plugin/marketplace.json`) that distributes canonical Claude **skills** — currently the `grammar-core-toolkit` plugin under `plugins/grammar-core-toolkit/`.

This is a complementary distribution channel, not a replacement for subtree:
- **Subtree** stays the mechanism for making shared docs, schemas, agents, and Codex skills physically visible in a product repo under `shared/grammar-core/`.
- **The plugin marketplace** lets product repos install canonical Claude skills directly with `/plugin install`, without wrapper files and with version tracking via `plugin.json`.

Because plugin skills live under `plugins/grammar-core-toolkit/skills/` rather than `/.claude/skills/`, they do not auto-load in `grammar-core` sessions and are not consumed through the subtree's tool-native paths. Install them in product repos with:

```text
/plugin marketplace add Loumeister/grammar-core
/plugin install grammar-core-toolkit@grammar-core
```

Installed skills are namespaced, e.g. `/grammar-core-toolkit:grammar-core-sync`.
