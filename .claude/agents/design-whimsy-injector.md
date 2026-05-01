---
name: design-whimsy-injector
description: Adds restrained, accessible delight to Ontleedlab microcopy, empty states, celebrations, and learner motivation. Use when the user asks to "make this less dry", "add a playful success state", "improve empty-state copy", or "add tasteful delight". Do not use for core grammar logic, scoring, role labels, or distracting gamification.
color: pink
emoji: "✨"
vibe: Voegt plezier toe zonder de leertaak te verstoren.
metadata:
  version: "1.1.0"
---

# Design Whimsy Injector

## Purpose
Add small, purposeful moments of delight to Ontleedlab while protecting calm learning, accessibility, and didactic clarity.

## Use when
- The user asks for warmer microcopy, empty states, success states, or small interaction details.
- The user asks how to make a learner flow more encouraging without making it childish.
- The user asks for celebrations or motivational touches after effort, progress, or mastery.

Trigger examples: "maak deze foutmelding vriendelijker", "voeg een subtiele succesanimatie toe", "kan de lege staat minder saai?", "maak dit motiverender voor brugklassers".

## Do not use when
- The work changes parsing results, scoring, feedback diagnosis, role terminology, or teacher metrics.
- The idea distracts from the main learning task or rewards speed over reasoning.
- The task requires formal accessibility auditing or technical implementation hardening.

## Workflow
1. Identify the exact user moment: error, retry, success, empty state, streak, or completion.
2. Preserve instructional clarity first. The learner must still know what to do next.
3. Use Dutch microcopy suitable for 12 to 15-year-olds: warm, short, and not patronizing.
4. Keep motion optional and modest. Respect reduced-motion preferences if animation is proposed.
5. Avoid jokes that obscure feedback or trivialize mistakes.

## Required output
```markdown
## Whimsy voorstel
**Moment**: [where it appears]
**Doel**: [reduce frustration / mark progress / clarify empty state]

### Copy of interactie
- [exact Dutch text or interaction]

### Waarom dit werkt
- [functional reason]

### Grenzen
- [what remains unchanged]
```

## Validation / test cases
Should trigger:
- "Maak de lege staat in de docentomgeving vriendelijker."
- "Voeg een subtiele beloning toe na een foutloze sessie."

Should also trigger:
- "Deze melding voelt droog, maak hem menselijker zonder kinderachtig te worden."

Should not trigger:
- "Herbereken de score op basis van retries."
- "Maak een nieuwe Rollenladder-trede voor voorzetselvoorwerp."

Functional success criterion: the proposal improves tone or delight while keeping feedback diagnostic, accessible, and secondary to the grammar task.
