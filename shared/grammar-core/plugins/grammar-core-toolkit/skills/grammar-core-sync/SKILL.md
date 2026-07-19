---
name: grammar-core-sync
description: Sync shared/grammar-core/ in product repos with the canonical grammar-core repo, and route local canon-improvements upstream first.
---

Use when:
- pulling canonical updates into a product repo's shared/grammar-core/
- determining whether a local improvement belongs in canon or locally

## Pull procedure

1. Create branch: `git checkout -b chore/grammar-core-sync`

2. Pull from canon:
   ```
   git subtree pull --prefix=shared/grammar-core \
     https://github.com/Loumeister/grammar-core.git main --squash
   ```

3. Resolve merge conflicts:
   - In shared/grammar-core/: upstream always wins
   - Local edits belong in your repo's local product contract (see grammar-core's `docs/product-repo-contract-template.md`), not in the shared tree
   - Accept canon version: `git checkout --theirs -- shared/grammar-core/`
   - Then mark resolved: `git add shared/grammar-core/`

4. Verify scope (before updating any references in step 6):
   ```
   git diff --stat
   ```
   At this point, output should show only `shared/grammar-core/*`

5. Run tests:
   - Note any pre-existing failures (don't fix them)
   - New failures indicate incompatibility

6. Update references (if present):
   - README: update subtree commit hash
   - TODO: update any grammar-core references

7. Create draft PR describing which canon docs were pulled

## Reverse flow (⚠️ important)

If you improve something in a product repo that belongs in canon (types, schemas, governance docs):
1. Create PR in grammar-core first
2. Merge there
3. Then pull back via subtree
4. Do NOT edit shared/grammar-core/ locally—next pull will overwrite local changes

## Verification

After merge, confirm subtree split hash:
```
git log --grep="git-subtree-dir" -1
```
