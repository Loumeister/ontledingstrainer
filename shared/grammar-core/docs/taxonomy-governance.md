# Taxonomy Governance

## Purpose

This document governs how canonical grammar role labels and misconception codes are defined, introduced, revised, and synchronized across `grammar-core` and product repos.

Two distinct taxonomies are governed here:
1. **Grammar role labels** — canonical identifiers for grammatical roles in Dutch school grammar
2. **Misconception codes** — canonical identifiers for systematically distinct error patterns

---

## Part 1. Grammar role label governance

### 1.1 Scope

This section defines the shared canonical grammar role labels for Dutch school grammar as used across `grammar-core` consumers.

These labels represent grammatical roles as taught in Dutch lower secondary education (onderbouw VO). They are concepts, not product implementations.

This section governs:
- what the canonical identifier for each role is
- what the role means
- how the label tier model applies to each role

This section does **not** govern:
- product-local field names, JSON shapes, or annotation structures
- product-local display strings or localized labels
- product-local progression ordering or level assignments
- product-local shorthand keys in TypeScript types or constants

### 1.2 Canonical grammar role labels

The following table defines the shared canonical labels. The canonical label is the stable shared identifier. Product repos may use their own display labels and short labels locally, but must not contradict the canonical concept.

| Canonical label | Grammatical role | Dutch school term |
|---|---|---|
| `persoonsvorm` | Finite verb form | Persoonsvorm |
| `onderwerp` | Grammatical subject | Onderwerp |
| `lijdend_voorwerp` | Direct object | Lijdend voorwerp |
| `meewerkend_voorwerp` | Indirect object | Meewerkend voorwerp |
| `bijwoordelijke_bepaling` | Adverbial adjunct | Bijwoordelijke bepaling |
| `voorzetselvoorwerp` | Prepositional complement | Voorzetselvoorwerp |
| `bijstelling` | Appositive | Bijstelling |
| `werkwoordelijk_gezegde` | Verbal predicate (full) | Werkwoordelijk gezegde |
| `werkwoordelijk_deel` | Verbal part of a nominal predicate | Werkwoordelijk deel van het gezegde |
| `naamwoordelijk_deel` | Nominal predicate part | Naamwoordelijk deel van het gezegde |
| `bijzin` | Subordinate clause functioning as a clause-level constituent | Bijzin (als zinsdeel) |
| `nevenschikkend_voegwoord` | Coordinating conjunction | Nevenschikkend voegwoord |
| `onderschikkend_voegwoord` | Subordinating conjunction | Onderschikkend voegwoord |
| `bijvoeglijke_bepaling` | Adjectival modifier | Bijvoeglijke bepaling |

**Mapping from common product shorthand to canonical label:**

Product repos often use short keys internally. These are product-local and not shared canon. For reference:

| Common shorthand | Canonical label |
|---|---|
| `pv` | `persoonsvorm` |
| `ow` | `onderwerp` |
| `lv` | `lijdend_voorwerp` |
| `mv` | `meewerkend_voorwerp` |
| `bwb` | `bijwoordelijke_bepaling` |
| `vv` | `voorzetselvoorwerp` |
| `bijst` | `bijstelling` |
| `wg` | `werkwoordelijk_gezegde` |
| `wwd` | `werkwoordelijk_deel` |
| `nwd` | `naamwoordelijk_deel` |
| `bijzin` | `bijzin` |
| `vw_neven` | `nevenschikkend_voegwoord` |
| `vw_onder` | `onderschikkend_voegwoord` |
| `bijv_bep` | `bijvoeglijke_bepaling` |

This mapping table is informational only. Short labels like `pv`, `ow`, etc. are product-local choices, not shared canon.

### 1.3 Label tier model

Four distinct tiers exist. Mixing tiers is the primary source of governance failure.

| Tier | What it is | Who owns it | May be shared? |
|---|---|---|---|
| Canonical label | The stable shared concept identifier (e.g., `persoonsvorm`) | `grammar-core` | Yes — this is the shared truth |
| Display label | The string shown to learners (e.g., "Persoonsvorm") | Product repo | No — product-local presentation choice |
| Alias | An acceptable variant name for the same concept (e.g., "gezegde" for `persoonsvorm` in older curricula) | `grammar-core` (if shared) or product | Only if explicitly declared in shared canon |
| Product-local short label | A product key (e.g., `pv`, `RoleKey.PV`) | Product repo | No — never shared |

**Rule**: do not promote a product-local short label to shared canon. Shared canon describes the grammatical concept, not the product key.

### 1.4 What is shared canon versus product-local

**Shared canon in `grammar-core`:**
- canonical label names (as defined in 1.2)
- canonical definitions of grammatical roles
- shared didactic principles about how these roles are taught
- rules for introducing, renaming, and deprecating labels

**Product-local (must stay in product repo):**
- product-specific short keys (`pv`, `RoleKey.PV`, etc.)
- display strings shown to learners
- UI tooltip text
- progression-specific orderings (e.g., which roles appear at which level)
- feedback matrices keyed on local role identifiers
- annotation fields (e.g., `bijzinFunctie`, `alternativeRole`)
- JSON shapes or TypeScript types for sentences and tokens

### 1.5 Rules for introducing, renaming, and deprecating labels

#### Introducing a new canonical label

A new canonical grammar role label may be added to shared canon only if:
1. the grammatical role is a distinct concept in Dutch school grammar
2. the role is not already covered by an existing canonical label or alias
3. the role is applicable across more than one product context

Do not add a canonical label solely because a product repo internally uses a specific key.

#### Renaming a canonical label

Rename a canonical label only if:
1. the current name causes genuine conceptual ambiguity
2. the rename aligns more clearly with the standard Dutch school grammar terminology
3. all product repos are notified and given time to update local mappings

Do not rename to match a product-local preference.

#### Deprecating a canonical label

Deprecate a canonical label by:
1. marking it deprecated in this document
2. documenting the replacement or the reason for removal
3. keeping the deprecated entry visible for at least one sync cycle before deletion

#### Aliases

Aliases may be registered in shared canon only if a role has a genuinely common alternate name in Dutch school grammar usage. Aliases must be declared explicitly. Undeclared aliases are not shared canon.

---

## Part 2. Misconception code governance

### 2.1 Canonical rule

Canonical misconception definitions live in `grammar-core`, in the source-of-truth file `content/taxonomy/misconceptions.nl.json`.

Product repos must not silently invent canonical shared misconception codes locally; changes to shared canon must be proposed in that file in `grammar-core`.

### 2.2 When a new misconception code is justified

A new code is allowed only if all of the following are true:
1. the error is systematically distinct from existing codes
2. the recovery path is meaningfully different from existing codes
3. teacher insight improves from the distinction

### 2.3 When a new code is not justified

Do not split a code when:
- the learner recovery step is the same as an existing code
- the instructional intervention is the same
- the distinction is cosmetic rather than didactic

### 2.4 Misconception codes are distinct from grammar role labels

Misconception codes describe error patterns (e.g., confusing subject with direct object). Grammar role labels describe grammatical concepts. Do not conflate these two taxonomies.

---

## Part 3. Change process

For both grammar role labels and misconception codes:

1. propose the taxonomy change in `grammar-core` with a justification
2. justify it with the didactic framework (`docs/werkwoordspellingsdidactiek-kaders.md` or `docs/parsing-didactics-kaders.md`)
3. make explicit whether the change is canonical or product-local
4. sync into product repos after shared canon is stable

---

## Part 4. What this document does not govern

This document does not govern:
- product-local annotation fields (`bijzinFunctie`, `alternativeRole`, `bijvBepTarget`, etc.)
- product-local JSON sentence shapes
- product-local TypeScript types or constants
- product-local feedback matrices
- product-local progression logic or level assignments

Those elements remain governed by the local product contract in each product repo.
