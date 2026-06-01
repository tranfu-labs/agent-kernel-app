# Change: Complete Binance/Bitget Read-Plane Parity and Tool Contracts

## Why

Prism's funding-basis MVP now has three important pieces:

1. a deterministic funding-basis core in `@agentkernel/operations`;
2. Binance and Bitget public market-data providers in `@agentkernel/tools`;
3. a provider-backed smoke path that composes `ExchangeMarketDataService` with `scanFundingBasisArbitrage`.

The remaining gap is not more raw Binance endpoint coverage. The gap is a stable MVP contract that proves Binance and Bitget can both provide the normalized facts needed by the funding-basis scanner through read-only Prism tools.

This change completes the read-only path:

```text
Binance / Bitget public market data
  -> ExchangeMarketDataService
  -> normalized MarketContext parity
  -> read-only tool contracts
  -> scanFundingBasisArbitrage
  -> OpportunityArtifact / report
  -> Agent/API smoke
```

## What Changes

- Define the common minimum `MarketContext` contract required for cross-venue funding-basis scans.
- Add deterministic parity tests showing Binance and Bitget contexts can both feed `evaluateFundingBasisContexts`.
- Harden read-only tool wrappers for the MVP market-data surface:
  - `get_exchange_markets`
  - `get_exchange_tickers`
  - `get_funding_rates`
  - `get_orderbook_depth`
  - `get_market_context`
  - `scan_funding_basis_arbitrage`
- Add or update smoke coverage for the full Binance + Bitget funding-basis workflow.
- Preserve provider/source/status/warning/fetched/observed timestamp semantics.
- Preserve the `@agentkernel/operations` boundary: operations consume normalized domain facts and do not import `@agentkernel/tools`.
- Preserve no-execution safety.

## Out of Scope

- Binance private APIs, API keys, account data, balances, positions, open orders, order placement, cancellation, leverage, margin, transfers, or withdrawals.
- Automatic trading.
- WebSocket streaming.
- Broad Binance market-series, positioning, or microstructure expansion from `expand-binance-public-market-data-coverage` slices 2-4.
- Polymarket or prediction-market implementation.
- Moving realtime exchange reads into Python.
- Turning `ExchangeMarketDataService` into an analytics or scoring engine.

## Alternatives Considered

### Option A — Continue broad Binance endpoint expansion first

This would add klines, positioning ratios, trade prints, and more Binance-only context before completing the cross-venue MVP contract.

Rejected for this slice because it expands provider coverage without proving the first MVP loop.

### Option B — Register the funding-basis operation as a Pi Agent tool immediately

This would expose the scanner earlier but risks stabilizing an incomplete tool/read-plane contract.

Deferred until Binance/Bitget parity and tool contract tests are in place.

### Option C — Complete read-plane parity and tool contracts first

This focuses on the smallest missing architecture layer: a reliable provider-backed path from Binance/Bitget facts to normalized contexts, operation results, and artifacts.

Selected because it directly serves the first MVP and reduces architecture drift.

## Success Criteria

- Binance and Bitget both produce the common minimum `MarketContext` fields needed by funding-basis comparison.
- Deterministic tests prove valid Binance + Bitget contexts generate comparisons, signals, opportunities, and artifact lineage.
- Deterministic tests prove missing funding facts generate warnings but no opportunities or artifacts.
- Tool wrapper tests or smokes prove read-only market-data tools expose stable inputs/outputs and structured status/warnings.
- Provider-backed live smoke remains safe under network failure: `partial` is acceptable, fabricated facts are not.
- Safety scan finds no new private/account/execution capability.
- `@agentkernel/operations` still has no dependency on `@agentkernel/tools`.
