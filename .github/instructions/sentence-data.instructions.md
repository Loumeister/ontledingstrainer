---
applyTo: "data/sentences-level-*.json,data/**/*.json"
---

## Sentence Data Guidelines

When adding or editing sentences in the JSON data files:

1. **Structure** — Each sentence object must have: `id` (unique number), `label` (human-readable string), `predicateType` (`"WG"` or `"NG"`), `level` (1-4), `tokens` array.
2. **Token fields** — Each token requires `id` (string), `text` (string), `role` (RoleKey). Optional: `subRole`, `newChunk`, `alternativeRole`, `bijzinFunctie`, `bijvBepTarget`.
3. **Levels** — 1 = Basis, 2 = Middel, 3 = Hoog, 4 = Samengesteld. Place sentences in the correct `sentences-level-{N}.json` file.
4. **newChunk flag** — Set `"newChunk": true` on a token to force a constituent split even when adjacent tokens share the same role. This is critical for correct chunk boundaries.
5. **Role keys** — Valid values: `pv`, `ow`, `lv`, `mv`, `bwb`, `bijv_bep`, `vv`, `wg`, `nwd`, `bijst`, `bijzin`, `vw_neven`, `vw_onder`.
6. **Token IDs** — Use format `s{sentenceId}w{wordIndex}` (e.g., `"s42w1"`, `"s42w2"`).
7. **Validation** — After adding sentences, run `npm run build` to verify no type errors and `npm run test` to run validation tests.
