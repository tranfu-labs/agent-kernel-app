# Tasks

## Slice 1 — Core market context

- [x] Define domain contracts for `MarketContext`, `FundingContext`, `OpenInterestSnapshot`, and related context status metadata.
- [x] Add Binance provider methods for `get24hTickers`, `getFundingHistory`, and `getOpenInterest` with request-weight metadata and structured failure mapping.
- [x] Add cache families and normalization in `ExchangeMarketDataService` for 24h tickers, funding history, and open interest.
- [x] Add `get_market_context` Prism tool for selected symbols and safe include flags.
- [x] Update Pi Agent prompt snippets/guidelines so funding-opportunity intent routes to `scan_funding_opportunities`, explanation intent routes to `get_market_context`, and series/analytics intent routes to `get_market_series` after Slice 2.
- [x] Enhance `scan_funding_opportunities` to use 24h quote volume, funding history persistence, and open interest confirmation.
- [x] Save richer `OpportunityArtifact` evidence for funding scanner outputs.
- [x] Expand the read-only Binance proxy allowlist for 24h ticker, funding history, and open interest endpoints.
- [x] Add fixture/unit tests and update live smoke coverage for Slice 1.

## Slice 2 — Market series and analytics inputs

- [ ] Define `OhlcvBar`, `MarketSeries`, and market-series request/response contracts.
- [ ] Add Binance provider methods for klines, continuous klines, mark price klines, index price klines, and premium index klines.
- [ ] Add `getMarketSeries` service method with TTLs and normalized series output.
- [ ] Add `get_market_series` Prism tool for selected symbols and series types.
- [ ] Add fixture/unit tests and analytics-input smoke coverage for Slice 2.

## Slice 3 — Positioning context

- [ ] Define `OpenInterestPoint`, `PositioningRatioPoint`, and `PositioningContext` contracts.
- [ ] Add Binance provider methods for open interest history, global long/short account ratio, top trader account ratio, top trader position ratio, and taker long/short ratio.
- [ ] Add `positioning` include support to `get_market_context`.
- [ ] Add scanner confidence/risk signals based on open interest trend and positioning crowding.
- [ ] Add fixture/unit tests for positioning normalization and status aggregation.

## Slice 4 — Microstructure context

- [ ] Define `TradePrint`, `AggTradePrint`, and `MicrostructureContext` contracts.
- [ ] Add Binance provider methods for recent trades and aggregate trades.
- [ ] Add selected-symbol microstructure support to `get_market_context` with safeguards against full-universe trade scans.
- [ ] Add fixture/unit tests for trade normalization and safety limits.

## Validation

- [x] Run `openspec validate expand-binance-public-market-data-coverage --strict`.
- [x] Run `npm run typecheck`.
- [x] Run `npm run test --workspaces --if-present`.
- [x] Run relevant read-only smoke commands with production, testnet, or proxy configuration as available.
- [x] Confirm no private/account/execution Binance endpoints were added.
