# Ontledingstrainer Adapter

## Purpose
This document describes how ontledingstrainer should consume canonical shared core content.

## Rule
Ontledingstrainer should not silently fork canonical shared content. It should adapt it explicitly.

## Ontledingstrainer consumes
- shared sentence ids and texts
- parsing-oriented metadata
- didactic notes for analysis-focused sequencing

## Ontledingstrainer adds locally
- role-specific UI behavior
- parsing interaction patterns
- repo-specific feedback or hint phrasing
- local learner progression rules

## Consumption model
Preferred first step:
- read shared sentence objects
- map them to ontledingstrainer challenge or sentence objects
- preserve canonical ids where possible
