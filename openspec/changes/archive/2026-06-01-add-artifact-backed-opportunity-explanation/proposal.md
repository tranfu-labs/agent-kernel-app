# Proposal: Artifact-Backed Opportunity Explanation

## Summary

Add a read-only `explain_opportunity_artifact` tool that explains saved opportunity artifacts by artifact ID using saved lineage and structured opportunity facts.

## Motivation

The funding-basis scanner now produces opportunity cards and saved artifact IDs. Users need a safe follow-up path to ask why a saved opportunity is interesting, what risks are visible, and what evidence lineage supports the answer without re-fetching live market data or drifting into execution advice.

## Scope

- Add deterministic `explainOpportunityArtifact` operation in `@agentkernel/operations`.
- Use `ArtifactStore.get(id)` from the Pi Agent runtime context.
- Register `explain_opportunity_artifact` with input schema `{ artifactId }` only.
- Preserve artifact lineage, warnings, score explanation, key metrics, legs, and read-only boundary.
- Add deterministic package tests and an app smoke.

## Non-Goals

- No session-index references such as “explain the first opportunity”.
- No automatic latest scanner-result lookup.
- No live market refresh by default.
- No full report builder.
- No trade proposal, financial advice, execution instruction, account state, private exchange API, order, leverage, margin, transfer, or withdrawal path.

## Success Criteria

- Saved opportunity artifacts can be explained by artifact ID.
- Missing, unsupported, and invalid artifacts return structured statuses.
- Explanation is deterministic and testable offline.
- Warnings and partial lineage gaps are visible.
- Tool schema contains only `artifactId`.
- Safety scan finds no new execution/account/private API implementation.
