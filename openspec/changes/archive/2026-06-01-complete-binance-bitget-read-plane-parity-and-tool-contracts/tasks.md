# Tasks

## Planner / OpenSpec Gate

- [x] Classify task level as Level 3 architecture-sensitive work.
- [x] Define scope and non-goals.
- [x] Compare alternatives and select read-plane parity/tool-contract completion.
- [x] Write proposal.
- [x] Write design.
- [x] Write critic review.
- [x] Resolve critic findings in rebuttal decisions.
- [x] Write test matrix.

## Slice 1 — Deterministic MarketContext parity

- [x] Add Binance fixture `MarketContext` covering market, ticker, funding.current, and depth.
- [x] Add Bitget fixture `MarketContext` covering market, ticker, funding.current, and depth.
- [x] Add test proving valid Binance + Bitget contexts generate one comparison, one signal, one opportunity, and complete lineage.
- [x] Add test proving missing Binance funding produces comparison warning but no signal/opportunity/artifact.
- [x] Add test proving missing Bitget funding produces comparison warning but no signal/opportunity/artifact.
- [x] Add test proving missing depth does not fabricate slippage and degrades liquidity/scoring explicitly.

## Slice 2 — ExchangeMarketDataService parity hardening

- [x] Add or extend service tests for Binance `getMarketContext(include: ["market", "ticker", "funding", "depth"])`.
- [x] Add or extend service tests for Bitget `getMarketContext(include: ["market", "ticker", "funding", "depth"])`.
- [x] Add test for `maxSymbolsForDepth` skip warning.
- [x] Add test for unsupported venue/market type returning structured status and warnings.
- [x] Add test that provider failure preserves status/warnings and does not fabricate facts.

## Slice 3 — Read-only tool contract tests

- [x] Add tests or smoke coverage for `get_exchange_markets` read-only output shape.
- [x] Add tests or smoke coverage for `get_exchange_tickers` read-only output shape.
- [x] Add tests or smoke coverage for `get_funding_rates` read-only output shape.
- [x] Add tests or smoke coverage for `get_orderbook_depth` read-only output shape.
- [x] Add tests or smoke coverage for `get_market_context` read-only output shape.
- [x] Add tests or smoke coverage for `scan_funding_basis_arbitrage` output shape.
- [x] Confirm tool inputs do not accept credentials, account identifiers, order parameters, leverage, margin, transfer, or withdrawal parameters.

## Slice 4 — Minimal implementation fixes

- [x] Fix only parity/tool-contract issues exposed by tests.
- [x] Keep `@agentkernel/operations` independent from `@agentkernel/tools`.
- [x] Keep `ExchangeMarketDataService` limited to provider normalization and context composition.
- [x] Do not add broad Binance series, positioning, or microstructure endpoints in this change.

## Slice 5 — Verification

- [x] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations`.
- [x] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/tools`.
- [x] Run `npm --prefix "/Users/griffith/Projects/Prism" run typecheck`.
- [x] Run `npm --prefix "/Users/griffith/Projects/Prism" run smoke:funding-basis-provider`.
- [x] Run no-execution safety scan excluding `dist`, `node_modules`, and `*.tsbuildinfo`.
- [x] Run evaluator lens review: OpenSpec compliance, operation purity, financial fact integrity, no-execution safety, artifact lineage, provider boundary, network degradation.

## Pause Conditions

Pause and revise if:

- The change requires private exchange credentials.
- `@agentkernel/operations` needs to import `@agentkernel/tools`.
- `ExchangeMarketDataService` starts owning scoring, opportunity generation, or strategy logic.
- Missing funding facts can still produce opportunities or artifacts.
- Tests require live network access to pass.
- The scope expands into market series, positioning, microstructure, or execution.
