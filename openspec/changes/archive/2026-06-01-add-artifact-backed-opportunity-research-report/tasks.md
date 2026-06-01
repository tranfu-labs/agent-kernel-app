# Tasks

## OpenSpec / Harness Gate

- [x] Classify task as Level 3 architecture-sensitive work.
- [x] Write proposal.
- [x] Write design.
- [x] Write critic review.
- [x] Write test matrix.

## Implementation

- [x] Add `OpportunityResearchReport` and `generateOpportunityResearchReport` in `@agentkernel/operations`.
- [x] Export the report operation.
- [x] Register `generate_opportunity_research_report` in `createPrismToolDefinitions`.
- [x] Keep tool schema limited to `artifactId`.
- [x] Add prompt guidance requiring artifact-backed, read-only report generation.
- [x] Add app smoke that saves a fixture artifact and generates a report through the registered tool.

## Verification

- [x] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations`.
- [x] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/agent-kernel`.
- [x] Run `npm --prefix "/Users/griffith/Projects/Prism" run typecheck`.
- [x] Run `npm --prefix "/Users/griffith/Projects/Prism" run smoke:opportunity-research-report`.
- [x] Run no-execution safety scan excluding `dist`, `node_modules`, and `*.tsbuildinfo`.
- [x] Run `openspec validate "add-artifact-backed-opportunity-research-report"` from `/Users/griffith/Projects/Prism`.

## Pause Conditions

Pause and revise if:

- The report path needs live market data by default.
- The tool schema needs anything besides `artifactId`.
- The operation imports `@agentkernel/tools`.
- The tool introduces private credentials or account/order/execution fields.
