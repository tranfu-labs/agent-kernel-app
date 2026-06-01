# Change: Register Funding-Basis Arbitrage Read-Only Tool

## Why

Prism now has the funding-basis MVP core pieces:

- Binance and Bitget public read-plane parity;
- normalized `MarketContext` composition through `ExchangeMarketDataService`;
- deterministic `scanFundingBasisArbitrage` operation in `@agentkernel/operations`;
- provider-backed smoke coverage for the operation path.

The missing product-runtime step is a stable Pi Agent/API tool entry for cross-venue funding-basis scans. Existing agent tools include low-level market data tools and the older single-venue `scan_funding_opportunities`, but not the new Binance/Bitget cross-venue operation.

This change registers a read-only `scan_funding_basis_arbitrage` tool and the lightweight MVP1 copilot guidance around it:

```text
User Binance/Bitget funding-basis intent
  -> default/ask-first guidance
  -> Pi Agent tool call
  -> ExchangeMarketDataService.getMarketContext
  -> scanFundingBasisArbitrage
  -> comparisons/signals/opportunities/opportunityCards/artifactIds
```

## What Changes

- Register `scan_funding_basis_arbitrage` in `packages/agent-kernel/src/register-prism-tools.ts`.
- Add lightweight MVP1 copilot guidance for ordinary Binance/Bitget requests, high-risk ask-first behavior, low-level lookup/drilldown, and extension-required intents.
- Wire the tool through `ExchangeMarketDataService` and `scanFundingBasisArbitrage` without making `@agentkernel/operations` depend on `@agentkernel/tools`.
- Return operation-shaped opportunity cards alongside comparisons, signals, opportunities, and artifact IDs.
- Add app/API smoke scripts for the tool path and copilot guidance path.
- Add package/root smoke scripts.
- Add focused tests or smoke coverage proving the tool is read-only, preserves structured status/warnings, and does not route future verticals to the funding-basis scanner.

## Out of Scope

- Private exchange APIs, API keys, account data, balances, positions, open orders, order placement, cancellation, leverage, margin, transfer, or withdrawal.
- Automatic trading.
- Trade proposals, risk checks, confirmations, audit execution receipts, or kill switches.
- New Binance/Bitget provider endpoints.
- Broad Binance series, positioning, or microstructure expansion.
- Polymarket.
- Replacing low-level market-data tools.

## Alternatives Considered

### Option A — Keep using low-level tools manually

Rejected. It forces Pi Agent to orchestrate data fetching, comparison, scoring, and artifact decisions manually, increasing risk of inconsistent behavior.

### Option B — Extend the older `scan_funding_opportunities` tool

Rejected for this slice. That tool is single-venue/funding-opportunity oriented and has a different contract. Mixing cross-venue basis behavior into it would blur boundaries.

### Option C — Add a separate `scan_funding_basis_arbitrage` tool

Selected. It exposes the already-tested cross-venue operation directly while keeping low-level tools available for drilldown.

## Success Criteria

- `scan_funding_basis_arbitrage` is available in the Prism tool registry.
- The tool accepts only read-only scan inputs: venues, symbols, market type, fee estimate, target notional, and artifact-save flag.
- The tool returns structured status, summary, warnings, market contexts, comparisons, signals, opportunities, opportunity cards, and artifact IDs.
- Opportunity cards disclose assumptions, score/confidence, warnings, freshness, artifact ID when present, and next actions.
- Missing current funding facts produce no opportunities, opportunity cards, or artifacts.
- Provider failures degrade to structured partial/failed status.
- Ordinary Binance/Bitget funding-basis requests prefer `scan_funding_basis_arbitrage`; high-risk/execution-shaped requests remain read-only and ask for research parameters.
- Polymarket, A-share, spot-perp, and custom data-source requests are treated as extension-required, not routed to the funding-basis scanner.
- No private/account/execution inputs or outputs are added.
- Existing tests, typecheck, provider-backed smoke, tool smoke, copilot smoke, and safety scan pass.
