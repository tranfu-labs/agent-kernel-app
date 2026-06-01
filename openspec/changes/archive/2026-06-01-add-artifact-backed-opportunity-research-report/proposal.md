# Proposal: Artifact-Backed Opportunity Research Report

## Summary

Add a read-only artifact-backed research report builder for saved opportunity artifacts.

## Motivation

MVP1 can scan funding-basis opportunities, save artifacts, and explain saved opportunities. Users also ask for a more report-like research artifact. The report must remain deterministic, artifact-backed, and read-only rather than becoming agent free-form prose or execution advice.

## Scope

- Add deterministic `generateOpportunityResearchReport` operation in `@agentkernel/operations`.
- Generate reports from saved opportunity artifacts through existing artifact-backed explanation output.
- Register `generate_opportunity_research_report` with input schema `{ artifactId }` only.
- Include summary, thesis, evidence, metrics, risks, lineage, assumptions, limitations, read-only boundary, and suggested follow-ups.
- Add deterministic package tests and app smoke.

## Non-Goals

- No live market refresh by default.
- No session-index report generation; session references should resolve to artifact IDs first.
- No trade proposal, financial advice, execution instruction, account state, private exchange API, order, leverage, margin, transfer, or withdrawal path.
- No PDF/HTML rendering.

## Success Criteria

- A saved opportunity artifact can produce a deterministic research report by artifact ID.
- Missing, unsupported, and invalid artifacts return structured statuses.
- Report preserves warnings, metrics, score explanation, lineage, and read-only boundary.
- Tool schema contains only `artifactId`.
- Safety scan finds no new execution/account/private API implementation.
