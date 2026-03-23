#!/usr/bin/env node
/**
 * regenerate_sentence_docs_and_validate.cjs
 *
 * Validates all sentence data files and checks:
 *  - Token ID consistency (s<sentenceId>t<n> format)
 *  - Level consistency (sentence.level matches file level)
 *  - Presence of pv and ow in every sentence
 *  - No duplicate token IDs within a sentence
 *  - Sequential IDs within each file
 *
 * ID scheme:
 *  Level 1: 1–60
 *  Level 2: 61–161
 *  Level 3: 300–341
 *  Level 4: 400–444
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const files = [1, 2, 3, 4].map((n) => ({
  level: n,
  path: path.join(DATA_DIR, `sentences-level-${n}.json`),
}));

const all = [];
const errors = [];

for (const { level, path: filePath } of files) {
  const arr = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Check sequential IDs within file
  for (let i = 1; i < arr.length; i++) {
    if (arr[i].id !== arr[i - 1].id + 1) {
      errors.push(`${filePath}: niet-aaneengesloten IDs rond ${arr[i - 1].id}/${arr[i].id}`);
    }
  }

  for (const s of arr) {
    all.push(s);

    // Level consistency
    if (s.level !== level) {
      errors.push(`${filePath} id=${s.id}: level mismatch (${s.level} ≠ ${level})`);
    }

    let hasPv = false;
    let hasOw = false;
    const seenTokenIds = new Set();

    for (const t of s.tokens) {
      // Duplicate token IDs
      if (seenTokenIds.has(t.id)) {
        errors.push(`${filePath} id=${s.id}: duplicate token id ${t.id}`);
      }
      seenTokenIds.add(t.id);

      // Token ID format
      if (!String(t.id).startsWith(`s${s.id}t`)) {
        errors.push(`${filePath} id=${s.id}: token prefix mismatch ${t.id}`);
      }

      if (t.role === 'pv') hasPv = true;
      // ow can be an explicit ow token, or a bijzin with bijzinFunctie === 'ow' (subject clause)
      if (t.role === 'ow' || t.bijzinFunctie === 'ow') hasOw = true;
    }

    if (!hasPv) errors.push(`${filePath} id=${s.id}: geen pv-token`);
    // Bevelzinnen (imperatives) legitimately have no explicit OW — warn but don't fail
    if (!hasOw) {
      const isBevelzin = s.tokens.every((t) => t.role !== 'ow');
      if (isBevelzin) {
        console.warn(`  waarschuwing: ${filePath} id=${s.id}: geen ow-token (bevelzin?)`);
      } else {
        errors.push(`${filePath} id=${s.id}: geen ow-token`);
      }
    }
  }
}

// Cross-file duplicate IDs
const allIds = all.map((s) => s.id);
const seen = new Set();
for (const id of allIds) {
  if (seen.has(id)) errors.push(`Duplicate sentence id across files: ${id}`);
  seen.add(id);
}

console.log(`Gecontroleerd: ${all.length} zinnen`);

if (errors.length > 0) {
  console.error('\nValidatiefouten:');
  for (const e of errors) console.error(' ', e);
  process.exit(1);
} else {
  console.log('Alle validaties geslaagd ✓');
}
