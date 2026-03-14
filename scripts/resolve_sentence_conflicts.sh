#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <ours|theirs>"
  exit 1
fi

SIDE="$1"
if [[ "$SIDE" != "ours" && "$SIDE" != "theirs" ]]; then
  echo "Invalid side '$SIDE'. Use 'ours' or 'theirs'."
  exit 1
fi

FILES=(
  data/sentences-level-1.json
  data/sentences-level-2.json
  data/sentences-level-3.json
  data/sentences-level-4.json
)

echo "Taking '$SIDE' for sentence files..."
git checkout --"$SIDE" "${FILES[@]}"

node scripts/regenerate_sentence_docs_and_validate.cjs

git add "${FILES[@]}" TEACHERS_SENTENCE_OVERVIEW.md data/sentence-parse-audit.md

echo "Done. Review with: git diff --staged"
