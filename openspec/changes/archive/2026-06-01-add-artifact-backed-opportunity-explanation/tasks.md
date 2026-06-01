# Tasks

## OpenSpec / Harness Gate

- [x] Classify task as Level 3 architecture-sensitive work.
- [x] Compare alternatives in the approved design spec.
- [x] Select artifactId-first deterministic explanation.
- [x] Write proposal.
- [x] Write design.
- [x] Write critic review.
- [x] Write test matrix.

## Implementation

- [x] Add storage regression test for `MemoryArtifactStore.get`.
- [x] Add `OpportunityExplanation` and `explainOpportunityArtifact` in `@agentkernel/operations`.
- [x] Export the operation from `packages/operations/src/index.ts`.
- [x] Register `explain_opportunity_artifact` in `createPrismToolDefinitions`.
- [x] Keep tool schema limited to `artifactId`.
- [x] Add prompt guidance requiring artifact-backed explanation and read-only boundary.
- [x] Add app smoke that saves a fixture artifact and explains it through the registered tool.

## Verification

- [x] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/storage`.
- [x] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations`.
- [x] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/agent-kernel`.
- [x] Run `npm --prefix "/Users/griffith/Projects/Prism" run typecheck`.
- [x] Run `npm --prefix "/Users/griffith/Projects/Prism" run smoke:opportunity-explanation`.
- [x] Run no-execution safety scan excluding `dist`, `node_modules`, and `*.tsbuildinfo`.
- [x] Run `openspec validate "add-artifact-backed-opportunity-explanation"` from `/Users/griffith/Projects/Prism`.

## Pause Conditions

Pause and revise if:

- The explanation path needs live market data by default.
- The tool schema needs anything besides `artifactId`.
- The operation imports `@agentkernel/tools`.
- The tool introduces private credentials or account/order/execution fields.
- Missing lineage causes fabricated facts instead of explicit warnings.
