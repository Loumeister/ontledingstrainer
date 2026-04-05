# Werkwoordlab Adapter

## Purpose
This document describes how Werkwoordlab should consume canonical shared core content.

## Rule
Werkwoordlab should not silently rewrite shared canonical content. It should adapt it explicitly.

## Werkwoordlab consumes
- shared sentence ids and texts
- spelling metadata
- misconception references
- didactic notes where relevant

## Werkwoordlab adds locally
- unit-specific scaffold wording
- UI interaction mode
- learner-facing feedback copy where product-specific
- route and persistence behavior

## Consumption model
Preferred first step:
- read shared sentence objects
- map them explicitly to Werkwoordlab unit items
- preserve canonical ids where possible
