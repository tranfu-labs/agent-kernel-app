## 1. Inspect current tool contracts

- [x] 1.1 Read current mock `get_funding_rates` and `get_orderbook_depth` tool input/output contracts.
- [x] 1.2 Read current Pi Agent tool registration and smoke funding flow.
- [x] 1.3 Identify any output fields that must remain stable for existing smoke or skill behavior.

## 2. Add deterministic coverage for service-backed behavior

- [x] 2.1 Add or update tests/fixtures for funding-rate normalization through an injected Binance provider or service seam.
- [x] 2.2 Add or update tests/fixtures for order book depth fillability and slippage calculation.
- [x] 2.3 Add or update tests for unsupported venue or market type behavior.
- [x] 2.4 Add or update tests for provider failure mapping where practical.

## 3. Wire existing mock tools to ExchangeMarketDataService

- [x] 3.1 Update `packages/tools/src/exchanges/get-funding-rates.ts` to call `defaultExchangeMarketDataService.getFundingRates`.
- [x] 3.2 Update `packages/tools/src/exchanges/get-orderbook-depth.ts` to call `defaultExchangeMarketDataService.getOrderbookDepth`.
- [x] 3.3 Ensure both tools return structured statuses, provider/source metadata, timestamps, and warnings without fabricated fallback facts.

## 4. Add new provider-backed market-data tools

- [x] 4.1 Create `packages/tools/src/exchanges/get-exchange-markets.ts` backed by `ExchangeMarketDataService.getExchangeMarkets`.
- [x] 4.2 Create `packages/tools/src/exchanges/get-exchange-tickers.ts` backed by `ExchangeMarketDataService.getExchangeTickers`.
- [x] 4.3 Export new tools from `packages/tools/src/index.ts`.

## 5. Register tools with Pi Agent

- [x] 5.1 Update `packages/agent-kernel/src/register-prism-tools.ts` to register `get_exchange_markets`.
- [x] 5.2 Update `packages/agent-kernel/src/register-prism-tools.ts` to register `get_exchange_tickers`.
- [x] 5.3 Confirm existing `get_funding_rates` and `get_orderbook_depth` registrations still match updated tool schemas.

## 6. Update smoke behavior

- [x] 6.1 Update `apps/agent-api/src/smoke-funding.ts` to accept provider-backed facts or explicit provider-unavailable statuses.
- [x] 6.2 Add `smoke:binance-market-data` only if it fits existing package script structure without unnecessary complexity.

## 7. Verify and document

- [x] 7.1 Run `npm run typecheck`.
- [x] 7.2 Run `npm run build` if typecheck passes.
- [x] 7.3 Run relevant tests or workspace tests.
- [x] 7.4 Run `npm run smoke:pi`.
- [x] 7.5 Run `npm run smoke:funding` or document provider/network blocker with structured status output.
- [x] 7.6 Update docs only if implementation changes the intended contract or command surface beyond this OpenSpec change.
