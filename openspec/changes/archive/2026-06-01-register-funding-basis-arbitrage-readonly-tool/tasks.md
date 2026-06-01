# Tasks

## OpenSpec / Harness Gate

- [x] Classify task as Level 3 architecture-sensitive work.
- [x] Compare alternatives.
- [x] Write proposal.
- [x] Write design.
- [x] Write critic review.
- [x] Resolve critic findings.
- [x] Write test matrix.

## Implementation

- [x] Import `scanFundingBasisArbitrage` in `packages/agent-kernel/src/register-prism-tools.ts`.
- [x] Import or instantiate `ExchangeMarketDataService` through stable service APIs, not raw providers.
- [x] Register `scan_funding_basis_arbitrage` tool with read-only schema.
- [x] Implement lightweight MVP1 copilot guidance for ordinary defaults, high-risk ask-first behavior, lookup/drilldown, and extension-required intents.
- [x] Implement dependency-injected context provider using `ExchangeMarketDataService.getMarketContext`.
- [x] Wire optional artifact saving to `ctx.artifactStore.save`.
- [x] Add prompt guidance making this tool preferred for Binance/Bitget cross-venue funding-basis discovery.
- [x] Add opportunity card shaping and return `opportunityCards` from `scanFundingBasisArbitrage`.
- [x] Keep older `scan_funding_opportunities` intact for its existing single-venue flow.

## Smoke / Tests

- [x] Add app/API smoke script for `scan_funding_basis_arbitrage` tool path.
- [x] Add app/API smoke script for MVP1 copilot guidance and extension boundary.
- [x] Add package/root smoke script.
- [x] Add deterministic test or smoke assertion that missing funding returns no opportunities/artifacts.
- [x] Add deterministic tests for copilot defaults, ask-first behavior, extension-required behavior, tool guidance, and opportunity cards.
- [x] Confirm tool schema has no private/account/execution fields.

## Verification

- [x] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations`.
- [x] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/tools`.
- [x] Run `npm --prefix "/Users/griffith/Projects/Prism" run typecheck`.
- [x] Run existing provider-backed smoke.
- [x] Run new funding-basis tool smoke.
- [x] Run no-execution safety scan excluding `dist`, `node_modules`, and `*.tsbuildinfo`.
- [x] Run evaluator lens review: OpenSpec compliance, operation purity, financial fact integrity, no-execution safety, artifact lineage, provider boundary, network degradation.

## Follow-up Material-Layer Hardening

- [x] Enhance `createOpportunityArtifact` content to explicitly include assumptions, provider fact or market-context references, warnings, calculated metrics, and score explanation instead of relying on indirect opportunity/comparison fields.

## Pause Conditions

Pause and revise if:

- The tool needs private credentials.
- The tool schema includes account/order/leverage/margin/transfer/withdrawal fields.
- `@agentkernel/operations` imports `@agentkernel/tools`.
- Agent-kernel imports raw provider classes.
- Missing funding facts can create opportunities or artifacts.
- The scope expands into execution, proposal/risk governance, new provider endpoints, or Polymarket.
