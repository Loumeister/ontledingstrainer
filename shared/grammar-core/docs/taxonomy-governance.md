# Taxonomy Governance

## Purpose
This document governs how misconception types are added, revised, and synchronized across grammar-core and the product repos.

## Canonical rule
Canonical misconception definitions live in `grammar-core`.

Product repos must not silently invent canonical shared misconception codes locally.

## When a new misconception code is justified
A new code is allowed only if all of the following are true:
1. the error is systematically distinct
2. the recovery path is meaningfully different
3. teacher insight improves from the distinction

## When a new code is not justified
Do not split a code when:
- the learner recovery step is the same
- the instructional intervention is the same
- the distinction is cosmetic rather than didactic

## Change process
1. propose the taxonomy change in `grammar-core`
2. justify it with the didactic framework
3. sync into product repos later
