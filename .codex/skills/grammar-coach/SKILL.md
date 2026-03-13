---
name: grammar-coach
description: Use when working on Dutch zinsontleding pedagogy: feedback quality, scaffolding, sentence difficulty calibration, misconception handling (PV/WG, OW/LV, LV/MV), and educational content tone for students age 12-15.
---

# Grammar Coach

Use this skill for didactic quality in the Zinsontledingstrainer.

## Core goals
- Keep feedback diagnostisch: explain *why* an answer is wrong, not just that it is wrong.
- Use the algorithmic question-ladder language used in Dutch grammar teaching.
- Keep student-facing Dutch concise, supportive, and age-appropriate (12-15).
- Prioritize common confusions: PV↔WG, OW↔LV, LV↔MV, BWB placement errors.

## Review checklist
1. Locate feedback/config text in `constants.ts` (search `FEEDBACK_MATRIX`, hints, role explanations).
2. Verify each item includes:
   - correct role name,
   - discovery question cue,
   - concrete correction direction.
3. Validate sentence sets in `data/sentences-level-*.json` for level-appropriate complexity.
4. Ensure scaffolding progresses from recognition to independent reasoning.
5. Avoid overloading a single prompt with multiple new concepts.

## Output format guidance
- For each issue: state misconception, pedagogical impact, concrete rewrite.
- Include improved Dutch copy ready to paste.
- Keep language encouraging and non-punitive.
