#!/usr/bin/env bash
# resolve_sentence_conflicts.sh
#
# Bij een merge-conflict in data/sentences-level-*.json: kies één kant volledig.
# Gebruik:
#   bash scripts/resolve_sentence_conflicts.sh ours
#   bash scripts/resolve_sentence_conflicts.sh theirs
#
# Na de keuze worden de bestanden gestaged en gevalideerd.

set -euo pipefail

SIDE="${1:-}"
if [[ "$SIDE" != "ours" && "$SIDE" != "theirs" ]]; then
  echo "Gebruik: $0 ours|theirs" >&2
  exit 1
fi

FILES=(
  src/data/sentences-level-1.json
  src/data/sentences-level-2.json
  src/data/sentences-level-3.json
  src/data/sentences-level-4.json
)

for f in "${FILES[@]}"; do
  if git ls-files -u -- "$f" | grep -q .; then
    echo "Resolving $f → $SIDE"
    git checkout "--$SIDE" -- "$f"
    git add "$f"
  else
    echo "$f: geen conflict, overgeslagen"
  fi
done

echo ""
echo "Validating dataset..."
node scripts/regenerate_sentence_docs_and_validate.cjs
