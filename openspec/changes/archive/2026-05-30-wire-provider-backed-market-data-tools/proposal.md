## Why

Prism currently has mock exchange tools while the new Binance public market-data provider and `ExchangeMarketDataService` foundation are partially in place. Wiring provider-backed tools is the next required step to turn Prism from a mock-data agent demo into a governed Information Plane that Pi Agent can call for real, source-preserving market facts.

This change is needed before OHLCV, Python analytics, or operation-level scanners because those later layers require stable normalized market-data inputs.

## What Changes

- Replace mock `get_funding_rates` behavior with `ExchangeMarketDataService.getFundingRates`.
- Replace mock `get_orderbook_depth` behavior with `ExchangeMarketDataService.getOrderbookDepth`.
- Add provider-backed `get_exchange_markets` tool for exchange market/instrument metadata.
- Add provider-backed `get_exchange_tickers` tool for bid/ask and mark/index ticker facts.
- Register the provider-backed market-data tools with Pi Agent.
- Preserve structured output fields including provider, source, status, fetched timestamp, observed timestamp where available, and warnings.
- Add tests or fixtures for normalization, unsupported venue behavior, and order book depth/slippage calculation where practical.
- Update smoke behavior so funding-market-data flow uses real provider-backed facts or explicit provider-unavailable statuses.
- Keep scope public read-only: no API keys, account data, positions, orders, margin, leverage, transfers, or execution endpoints.
- Keep scope TypeScript read-plane only: no Python analytics worker and no OHLCV/TA-Lib integration in this change.

## Capabilities

### New Capabilities

- `provider-backed-market-data-tools`: Pi Agent-callable Prism tools expose provider-backed public exchange market data through stable Prism contracts instead of mocks.

### Modified Capabilities

- None. No existing OpenSpec specs are present yet; this is the first market-data tool capability spec.

## Impact

Affected areas:

- `packages/tools/src/exchanges/get-funding-rates.ts`
- `packages/tools/src/exchanges/get-orderbook-depth.ts`
- `packages/tools/src/exchanges/get-exchange-markets.ts`
- `packages/tools/src/exchanges/get-exchange-tickers.ts`
- `packages/tools/src/exchanges/exchange-market-data-service.ts` only if small service adjustments are required by tool wiring
- `packages/tools/src/index.ts`
- `packages/agent-kernel/src/register-prism-tools.ts`
- `apps/agent-api/src/smoke-funding.ts` or a new live read-only smoke if needed
- test fixtures and tests under the existing package test structure

Architecture impact:

- Strengthens the Information Plane by making realtime market facts tool-backed and source-preserving.
- Keeps Energy Plane analytics and scanner workflows out of scope until the read plane is stable.
- Keeps Material Plane changes minimal; OpportunityArtifact changes are not part of this change.

Safety impact:

- This change must remain public read-only.
- Provider failures must degrade to structured statuses and warnings, not fabricated market facts or raw exceptions.
- Unsupported venues or market types must return explicit `unsupported` or `skipped` results.
