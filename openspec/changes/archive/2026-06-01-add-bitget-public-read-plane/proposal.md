# Add Bitget Public Read Plane

## What changes

Add a public read-only Bitget USDT futures provider and route Bitget `linear_perp` facts through `ExchangeMarketDataService`.

The provider will expose public market-data methods for contracts, tickers, funding, and order book depth. The service will normalize those payloads into existing Prism domain contracts:

- `ExchangeMarket`
- `FundingRatePoint`
- `ExchangeTicker`
- `OrderbookSnapshot`
- `OrderbookDepthEstimate`
- `MarketContext`

## Why now

The funding-basis core-first slice is implemented and validated offline. The next useful slice is to connect a second venue's public market facts so the core can later consume real Binance / Bitget context pairs.

## In scope

- Bitget public USDT futures provider.
- Bitget symbol helper.
- Bitget order book limit normalization.
- Mocked provider tests.
- `ExchangeMarketDataService` routing for Bitget `linear_perp`:
  - exchange markets
  - funding rates
  - exchange tickers
  - order book depth
  - market context via existing composition
- Structured status/warning propagation.
- No-execution static safety scan.

## Out of scope

- Pi Agent tool registration.
- Funding-basis live operation smoke.
- Python analytics.
- Web UI.
- Private Bitget credentials or account endpoints.
- Balances, positions, orders, fills, transfers, withdrawals, leverage, margin, or real trading execution.

## Affected planes

- **Information:** adds provider-backed public Bitget market facts with source/provider/status/timestamps/warnings.
- **Energy:** no new scoring or analytics in this slice.
- **Material:** no new artifact behavior in this slice.

## Affected packages

- `packages/tools`

## Safety boundaries

This is public read-only market data only. It must not require API keys or introduce account/execution endpoints. Provider failures must return structured statuses and warnings instead of fabricated facts.

## Acceptance criteria

- Bitget provider tests pass with mocked `fetch`.
- `ExchangeMarketDataService` Bitget normalization tests pass.
- Existing tools tests still pass.
- `npm run typecheck -w @agentkernel/tools` passes after required dependent package builds.
- Safety scan shows no new private/account/execution implementation path.
