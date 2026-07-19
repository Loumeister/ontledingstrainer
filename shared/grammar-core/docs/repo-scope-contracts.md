# Repo Scope Contracts

## grammar-core
- Owns shared didactic canon.
- Owns shared taxonomy governance.
- Owns shared schema direction.
- Owns shared sentence and content rules.
- Owns shared AI instruction layers.
- Owns shared portable feedback type contracts (`src/feedback/types.ts`) and shared feedback authoring conventions (`docs/feedback-authoring.md`).
- Does not own local runtime UI, local evaluator behavior, local dashboards, local route logic, or product-specific feedback flows.
- Does not own app-specific feedback content, misconception taxonomies, feedback storage logic, or override patterns.
- Does not become a third product.

## ontledingstrainer
- Owns the local parsing product.
- Owns parsing UI, learner flow, local annotation conventions, local evaluator behavior, local sentence presentation, and parsing-specific teacher tooling.
- Does not own canonical werkwoordspelling runtime or shared didactic governance.

## werkwoordlab
- Owns the local werkwoordspelling product.
- Owns the learner flow from grammar function to rule choice to spelling application.
- Owns local evaluator behavior, misconception mapping, unit progression, and spelling-specific teacher insights.
- Does not own parsing runtime UI or shared didactic governance.

## Boundary rule
Shared didactic principles, shared taxonomy, shared sentence rules, shared AI instructions, and shared portable type contracts belong in grammar-core.
Local learner flow, UI, evaluator behavior, annotations, teacher workflows, feedback content, and misconception mappings belong in the product repo.
