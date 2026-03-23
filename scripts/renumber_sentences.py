#!/usr/bin/env python3
"""
Renumber sentence IDs for levels 1 and 2.

Target scheme (level-prefixed):
  Level 1: 1–60    (was: 1–18 + 143–207, non-sequential with gaps)
  Level 2: 61–161  (was: 19–119)
  Level 3: 300–341 (unchanged)
  Level 4: 400–444 (unchanged)

For each sentence this script updates:
  - id
  - label  ("Zin X: ..." prefix)
  - token ids  (s{old}t{n} → s{new}t{n})
  - bijvBepTarget values (same-sentence cross-refs)
"""

import json
import re
import sys
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "src" / "data"


def rename_token_ids(sentence: dict, old_id: int, new_id: int) -> dict:
    """Replace all references from s{old_id}t{n} → s{new_id}t{n} in a sentence."""
    old_prefix = f"s{old_id}t"
    new_prefix = f"s{new_id}t"

    new_tokens = []
    for token in sentence["tokens"]:
        t = dict(token)
        # Rename token id
        if t["id"].startswith(old_prefix):
            t["id"] = new_prefix + t["id"][len(old_prefix):]
        # Rename bijvBepTarget if present
        if "bijvBepTarget" in t and t["bijvBepTarget"].startswith(old_prefix):
            t["bijvBepTarget"] = new_prefix + t["bijvBepTarget"][len(old_prefix):]
        new_tokens.append(t)
    return {**sentence, "tokens": new_tokens}


def renumber_level(sentences: list, start_id: int) -> tuple[list, dict]:
    """
    Assign new sequential IDs starting from start_id.
    Returns (updated_sentences, id_mapping {old_id: new_id}).
    """
    mapping = {}
    updated = []
    for i, sentence in enumerate(sentences):
        old_id = sentence["id"]
        new_id = start_id + i
        mapping[old_id] = new_id

        s = dict(sentence)
        s["id"] = new_id
        # Update label: "Zin X: ..." → "Zin {new_id}: ..."
        s["label"] = re.sub(r"^Zin \d+:", f"Zin {new_id}:", s["label"])
        # Rename token ids and bijvBepTarget
        s = rename_token_ids(s, old_id, new_id)
        updated.append(s)
    return updated, mapping


def main():
    # Load files
    level1_path = DATA_DIR / "sentences-level-1.json"
    level2_path = DATA_DIR / "sentences-level-2.json"
    review_path = DATA_DIR / "sentences-review.json"

    level1 = json.loads(level1_path.read_text())
    level2 = json.loads(level2_path.read_text())
    review = json.loads(review_path.read_text())

    print(f"Level 1: {len(level1)} sentences, IDs {min(s['id'] for s in level1)}–{max(s['id'] for s in level1)}")
    print(f"Level 2: {len(level2)} sentences, IDs {min(s['id'] for s in level2)}–{max(s['id'] for s in level2)}")

    # Renumber
    new_level1, map1 = renumber_level(level1, start_id=1)
    new_level2, map2 = renumber_level(level2, start_id=61)

    combined_map = {**map1, **map2}

    print(f"\nLevel 1 → IDs {min(s['id'] for s in new_level1)}–{max(s['id'] for s in new_level1)}")
    print(f"Level 2 → IDs {min(s['id'] for s in new_level2)}–{max(s['id'] for s in new_level2)}")

    # Update sentences-review.json numeric id references
    new_review = []
    for entry in review:
        e = dict(entry)
        if isinstance(e.get("id"), int) and e["id"] in combined_map:
            old = e["id"]
            e["id"] = combined_map[old]
            if "label" in e:
                e["label"] = re.sub(r"^Zin \d+:", f"Zin {e['id']}:", e["label"])
            print(f"  review: id {old} → {e['id']}")
        new_review.append(e)

    # Write back
    level1_path.write_text(json.dumps(new_level1, ensure_ascii=False, indent=2) + "\n")
    level2_path.write_text(json.dumps(new_level2, ensure_ascii=False, indent=2) + "\n")
    review_path.write_text(json.dumps(new_review, ensure_ascii=False, indent=2) + "\n")

    print("\nDone. Files updated:")
    print(f"  {level1_path}")
    print(f"  {level2_path}")
    print(f"  {review_path}")

    # Quick sanity check
    all_ids = [s["id"] for s in new_level1 + new_level2]
    dupes = [i for i in set(all_ids) if all_ids.count(i) > 1]
    if dupes:
        print(f"\nERROR: Duplicate IDs found: {dupes}", file=sys.stderr)
        sys.exit(1)
    print("\nSanity check: no duplicate IDs across L1+L2 ✓")


if __name__ == "__main__":
    main()
