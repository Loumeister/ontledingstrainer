# Feedback authoring conventions

Shared conventions for writing `FeedbackEntry` and `RichFeedbackEntry` values.

These conventions apply to any exercise domain that uses the shared feedback contract defined in `src/feedback/types.ts`. They are grounded in the diagnostic feedback principles established in `docs/parsing-didactics-kaders.md` and `docs/werkwoordspellingsdidactiek-kaders.md`.

---

## 1. Plain string vs. rich entry

Use a **plain string** when:
- The feedback is a single short prompt that gives the learner an immediate next step.
- No structured breakdown adds meaningful value.

Use a **rich entry** when:
- The error involves a reasoning step the learner must understand, not just a surface correction.
- There is a meaningful distinction between diagnosing the mistake, explaining the rule, and specifying the recovery action.
- The learner needs to understand *why* the answer was wrong in order to attempt it correctly.

---

## 2. Field conventions

### `herstelvraag`
- A short inline control question, maximum approximately 15 words.
- Usually phrased as a question that targets the exact decision requiring revisit.
- Should be self-contained enough to orient the learner without requiring the full `uitleg`.

### `sleutelwoord`
- A single word that appears verbatim in `herstelvraag`.
- It anchors the expand interaction — the word the learner taps or clicks to open `uitleg`.
- Pick the word that best names the distinction the learner needs to revisit.

### `uitleg.diagnose`
- 1–2 sentences describing the cognitive mistake rather than just the surface error.
- Follow the pattern: *"Je hebt waarschijnlijk…"*
- Focus on what the learner likely reasoned, not on what they typed.

### `uitleg.redenering`
- 1–2 sentences stating the relevant rule or distinction.
- A brief example is welcome if it sharpens the contrast.
- Do not repeat the content of `diagnose`.

### `uitleg.herprobeer`
- One concrete recovery step in imperative mood, single sentence.
- Specific enough that the learner knows the exact next action.
- Avoid generic instructions like "Probeer het opnieuw" without stating what to check.

---

## 3. What to avoid

- **Vague encouragement without information** — praise or blame that gives the learner no usable reasoning.
- **Passive rule-dumps** — listing rules without connecting them to the learner's specific error.
- **Duplicate wording across fields** — each field should add something the others do not.
- **Oversized entries** — `uitleg` is a compact explanation, not a lesson.
- **`herprobeer` without a specific check** — the recovery step must name what to do, not just that something should be done.
- **Product-specific jargon** — these conventions are shared; avoid identifiers or labels that belong to a specific app.

---

## 4. Shared/local boundary

These conventions govern the **shape and tone** of feedback values.

They do not govern:
- Which misconception codes map to which feedback values (local to each product).
- Where feedback values are stored (local to each product).
- How the UI renders `herstelvraag` and `uitleg` (local to each product).
- Built-in feedback content for specific error types (local to each product).

See `docs/repo-scope-contracts.md` for the full shared/local boundary.
