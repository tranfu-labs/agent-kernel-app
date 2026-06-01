# Binance Market Data Read Plane

This document defines the target architecture for extracting and rebuilding Binance public market-data capabilities into the new Prism Pi Agent Kernel architecture.

The goal is not to copy Binance functions from `Prism_old` verbatim. The goal is to create a safe, efficient, correct, provider-backed Information Plane capability that Pi Agent can call through stable Prism tools.

This read plane follows the accepted technical route in [`TS_PYTHON_TECHNICAL_ROUTE.md`](./TS_PYTHON_TECHNICAL_ROUTE.md): TypeScript owns provider access, normalization, cache, status, and Pi Agent tool boundaries; Python owns heavy analytics behind TypeScript wrappers.

Development and live validation must also follow [`NETWORK_RESILIENT_MARKET_DATA_WORKFLOW.md`](./NETWORK_RESILIENT_MARKET_DATA_WORKFLOW.md): deterministic tests must run locally without production exchange access, while live provider reads may use a remote smoke runner or read-only market-data proxy when local networks cannot reach Binance.

---

## 1. North Star alignment

Prism's north star is:

```text
Information -> Energy -> Material
```

The Binance read plane belongs to the **Information Plane**.

It must provide real-world market facts with source, provider, timestamp, freshness, and structured status. It must not perform agent reasoning, generate trade recommendations, or execute orders.

Target flow:

```text
Binance public market data
  -> Binance provider adapter
  -> Prism exchange market-data service
  -> Prism tools
  -> Pi Agent skill / operation
  -> OpportunityArtifact / EvidenceBundle
```

Responsibilities:

- **Information**: Binance provider and exchange tools fetch and normalize facts.
- **Energy**: Pi Agent, skills, operations, and deterministic calculations compare, rank, and explain.
- **Material**: artifacts preserve opportunities, evidence, warnings, and freshness.

---

## 2. Design goals

### 2.1 Efficient

- Prefer batch endpoints and local filtering where appropriate.
- Cache low-volatility data such as exchange info.
- Coalesce concurrent requests for the same cache key.
- Avoid full-market order book scans.
- Fetch order book depth only for top candidates after coarse screening.
- Track Binance request weight in provider results.

### 2.2 Correct

- All realtime market facts must come from tools, never LLM prose.
- Normalize provider responses into Prism contracts before exposing them to Pi Agent.
- Preserve `provider`, `source`, `observedAt`, `fetchedAt`, `freshnessMs`, `status`, and `warnings`.
- Distinguish current funding snapshots from funding history.
- Represent partial data explicitly instead of silently dropping failed venues or symbols.

### 2.3 Safe

- P0 scope is public read-only market data.
- No API keys are required or accepted for this read plane.
- No account, balance, position, order, margin, leverage, transfer, or execution endpoints.
- Raw provider exceptions must not escape to Pi Agent.
- Rate limits, geo-blocks, provider downtime, unsupported symbols, and timeouts must degrade as structured statuses.

### 2.4 Extensible

- Binance is the first provider, not the long-term abstraction.
- Tool contracts should support later Bitget, Bybit, OKX, and Polymarket market-data providers.
- Provider-specific shapes stay below the exchange market-data service.
- Pi Agent sees Prism tools, not Binance REST or SDK details.

---

## 3. Scope

### 3.1 In scope for P0

Binance USDⓈ-M Futures public market data:

- exchange markets / instrument specs
- current funding / premium index snapshots
- book ticker / best bid ask
- 24h ticker summaries
- order book snapshots for selected symbols
- funding history for context
- open interest snapshot if needed for opportunity ranking

Prism tools:

- `get_exchange_markets`
- `get_funding_rates`
- `get_exchange_tickers`
- `get_orderbook_depth`
- `scan_funding_opportunities` after low-level tools stabilize

### 3.2 Out of scope for P0

- private account data
- balances
- positions
- open orders
- order placement
- cancellation
- leverage or margin changes
- credential vault
- WebSocket streaming
- background jobs

These belong to later phases after deterministic risk checks, explicit confirmation, audit, and kill-switch foundations exist.

---

## 4. Official Binance API references

Primary official docs:

- Binance USDⓈ-M Futures REST market data: `https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api`
- Binance USDⓈ-M Futures WebSocket market streams: `https://developers.binance.com/docs/derivatives/usds-margined-futures/websocket-market-streams`

P0 REST base URL:

```text
https://fapi.binance.com
```

P0 public endpoints:

```text
GET /fapi/v1/exchangeInfo
GET /fapi/v1/premiumIndex
GET /fapi/v1/ticker/24hr
GET /fapi/v1/ticker/bookTicker
GET /fapi/v1/depth
GET /fapi/v1/fundingRate
GET /fapi/v1/klines
GET /fapi/v1/openInterest
```

Implementation must check official request weight and parameter rules before each endpoint is added. Endpoint weight assumptions should live near provider code, not in prompts or skills.

---

## 5. Layered architecture

```text
packages/domain/src/
  fetch-status.ts
  market-data.ts

packages/tools/src/shared/
  fetch-envelope.ts
  rate-limit.ts
  ttl-cache.ts

packages/tools/src/exchanges/
  types.ts
  symbols.ts
  exchange-market-data-service.ts
  get-exchange-markets.ts
  get-funding-rates.ts
  get-exchange-tickers.ts
  get-orderbook-depth.ts

packages/tools/src/exchanges/providers/
  binance-usds-futures.ts
  binance-rate-limits.ts

packages/operations/src/
  scan-funding-opportunities.ts
```

### 5.1 Provider layer

The provider layer is the only layer that knows Binance URLs, parameters, request weights, response shapes, and provider-specific error codes.

It should expose functions such as:

```ts
getExchangeInfo()
getPremiumIndex(symbols?)
getBookTickers(symbols?)
get24hTickers(symbols?)
getOrderbook(symbol, limit)
getFundingHistory(symbol, limit?)
getOpenInterest(symbol)
```

The provider must return `AdapterFetchResult<T>` and must not throw raw provider errors to callers.

### 5.2 Exchange market-data service

The service layer owns:

- venue routing
- market type routing
- symbol normalization
- TTL cache
- request coalescing
- provider result normalization
- partial result aggregation
- status and warning aggregation

The service is the seam where Binance becomes one provider among many.

### 5.3 Prism tool layer

The tool layer exposes small, stable, agent-callable capabilities.

Tools should return structured data that Pi Agent can explain and materialize. Tools should not expose raw Binance responses as the primary output.

### 5.4 Operation layer

Operation-level tools should compose low-level market-data tools into product workflows.

The first operation-level tool should be:

```text
scan_funding_opportunities
```

This should coarse-screen funding and ticker data, fetch depth only for top candidates, calculate edge and slippage, rank opportunities, and save artifacts.

---

## 6. Core contracts

### 6.1 Fetch status

```ts
type FetchStatus =
  | "ok"
  | "partial"
  | "failed"
  | "skipped"
  | "timeout"
  | "rate_limited"
  | "geo_blocked"
  | "unsupported";

interface AdapterFetchResult<T> {
  status: FetchStatus;
  provider: string;
  source: string;
  payload?: T;
  reason?: string;
  warnings: string[];
  observedAt?: string;
  fetchedAt: string;
  freshnessMs?: number;
  elapsedMs?: number;
  requestWeight?: number;
}
```

### 6.2 Market identity

```ts
type Venue = "binance" | "bitget" | "bybit" | "okx";
type MarketType = "spot" | "linear_perp" | "inverse_perp";

interface ExchangeMarket {
  venue: Venue;
  marketType: MarketType;
  symbol: string;
  venueSymbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: "trading" | "halted" | "settling" | "unknown";
  contractType?: string;
  onboardDate?: string;
  deliveryDate?: string;
  pricePrecision?: number;
  quantityPrecision?: number;
  minNotionalUsd?: number;
  tickSize?: number;
  stepSize?: number;
}
```

### 6.3 Funding snapshot

```ts
interface FundingRatePoint {
  venue: Venue;
  marketType: "linear_perp" | "inverse_perp";
  symbol: string;
  venueSymbol: string;
  fundingRate: number;
  fundingTime?: string;
  nextFundingTime?: string;
  markPrice?: number;
  indexPrice?: number;
  observedAt: string;
  provider: string;
  source: string;
  status: FetchStatus;
  warnings: string[];
}
```

### 6.4 Ticker

```ts
interface ExchangeTicker {
  venue: Venue;
  marketType: MarketType;
  symbol: string;
  venueSymbol: string;
  lastPrice?: number;
  markPrice?: number;
  indexPrice?: number;
  bidPrice?: number;
  askPrice?: number;
  bidQty?: number;
  askQty?: number;
  volume24h?: number;
  quoteVolume24h?: number;
  priceChangePercent24h?: number;
  observedAt: string;
  provider: string;
  source: string;
  status: FetchStatus;
  warnings: string[];
}
```

### 6.5 Order book depth

```ts
interface OrderbookLevel {
  price: number;
  quantity: number;
  notionalUsd?: number;
}

interface OrderbookDepthEstimate {
  venue: Venue;
  marketType: MarketType;
  symbol: string;
  notionalUsd: number;
  bidSlippageBps?: number;
  askSlippageBps?: number;
  bidFillable: boolean;
  askFillable: boolean;
  liquidityStatus: "unknown" | "insufficient" | "sufficient" | "strong";
  observedAt: string;
  provider: string;
  source: string;
  status: FetchStatus;
  warnings: string[];
}
```

---

## 7. Tool contracts

### 7.1 `get_exchange_markets`

Purpose: list tradable markets and instrument specs.

Input:

```json
{
  "venue": "binance",
  "marketType": "linear_perp",
  "symbols": ["BTCUSDT", "ETHUSDT"]
}
```

Output includes:

- normalized markets
- provider/source/status
- fetched timestamp
- warnings

### 7.2 `get_funding_rates`

Purpose: fetch current funding facts.

Input:

```json
{
  "venues": ["binance"],
  "marketType": "linear_perp",
  "symbols": ["BTCUSDT", "ETHUSDT"]
}
```

For Binance current funding, prefer `GET /fapi/v1/premiumIndex`. Use `GET /fapi/v1/fundingRate` for historical context.

### 7.3 `get_exchange_tickers`

Purpose: fetch bid/ask, last, mark, index, volume, or 24h context.

Input:

```json
{
  "venues": ["binance"],
  "marketType": "linear_perp",
  "symbols": ["BTCUSDT", "ETHUSDT"],
  "fields": ["book", "mark", "24h"]
}
```

The tool may compose book ticker, premium index, and 24h ticker provider calls behind a single Prism contract.

### 7.4 `get_orderbook_depth`

Purpose: estimate capacity and slippage for a target notional.

Input:

```json
{
  "venue": "binance",
  "marketType": "linear_perp",
  "symbol": "BTCUSDT",
  "notionalUsd": 1000,
  "limit": 100
}
```

Default `limit` should be conservative. This tool should be called only for selected candidates, not full-market scans.

### 7.5 `scan_funding_opportunities`

Purpose: efficient product-level funding opportunity scan.

Input:

```json
{
  "venues": ["binance", "bitget"],
  "marketType": "linear_perp",
  "symbols": ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
  "targetNotionalUsd": 1000,
  "maxCandidatesForDepth": 5
}
```

Internal flow:

```text
funding + ticker coarse screen
  -> rank rough candidates
  -> orderbook depth only for top N
  -> calculate slippage and net edge
  -> rank opportunities
  -> save OpportunityArtifact
```

This operation-level tool is preferred for common user workflows because it prevents inefficient repeated low-level agent calls.

---

## 8. Efficiency rules

### 8.1 Cache TTLs

Initial in-memory TTL targets:

| Data | TTL |
|---|---:|
| exchange info | 1 hour |
| premium index / current funding | 5 seconds |
| book ticker | 2 seconds |
| 24h ticker | 15 seconds |
| order book depth | 2 seconds |
| funding history | 60 seconds |
| open interest | 15 seconds |

These are defaults, not product guarantees. Tool outputs must still report fetched and observed timestamps.

### 8.2 Request coalescing

Concurrent requests for the same provider/cache key should share one in-flight promise.

Example:

```text
binance:linear_perp:depth:BTCUSDT:100
```

### 8.3 Depth discipline

Do not fetch order books for every market during a full scan.

Correct flow:

```text
funding + ticker rough screen
  -> top candidates
  -> depth for top candidates only
```

Incorrect flow:

```text
for every symbol:
  fetch depth
```

### 8.4 Request weight accounting

Provider code should annotate known Binance request weights in `AdapterFetchResult.requestWeight`. The service may later use this to enforce local request budgets.

---

## 9. Safety and failure handling

### 9.1 Error mapping

Provider errors should map to structured statuses:

| Condition | Status |
|---|---|
| HTTP 429 | `rate_limited` |
| HTTP 418 | `rate_limited` with ban reason |
| HTTP 451 or jurisdiction block | `geo_blocked` |
| timeout / abort | `timeout` |
| unsupported venue/product/symbol | `unsupported` |
| provider 5xx | `failed` |
| mixed per-symbol success | `partial` |

### 9.2 No fabricated fallback

If Binance is unavailable, Prism may return stale cached data only if clearly marked as stale. It must not fabricate current market facts.

### 9.3 Execution boundary

This read plane must not include private or execution endpoints. Any future account or execution capability requires separate architecture docs covering credentials, permission gates, deterministic risk checks, confirmation, audit, dry-run defaults, and kill switches.

---

## 10. Prism_old extraction guidance

Use `Prism_old` as a capability mine, not as the new runtime.

Relevant old sources:

```text
/Users/griffith/Projects/Prism_old/piea-backend/app/datasources/_common/fetch_envelope.py
/Users/griffith/Projects/Prism_old/piea-backend/app/datasources/exchanges/native/contracts.py
/Users/griffith/Projects/Prism_old/piea-backend/app/datasources/exchanges/native/registry.py
/Users/griffith/Projects/Prism_old/piea-backend/app/datasources/exchanges/native/binance_usds_futures.py
/Users/griffith/Projects/Prism_old/piea-backend/app/datasources/exchanges/binance_derivatives.py
/Users/griffith/Projects/Prism_old/piea-backend/app/agent/actions/market_data.py
/Users/griffith/Projects/Prism_old/piea-backend/tests/datasources/
/Users/griffith/Projects/Prism_old/piea-backend/tests/test_cross_venue_funding_opportunity_scan.py
```

Extract:

- fetch envelope semantics
- canonical exchange contracts
- symbol helpers
- Binance response parsing lessons
- provider degradation behavior
- fixture/test knowledge

Do not extract:

- old chat service
- old session orchestration
- old intent router
- old action registry as runtime
- old presentation summaries as business logic
- execution placeholders without policy enforcement

For Binance public market data, prefer a native TypeScript REST provider over a long-term Python wrapper. Use wrappers for more complex legacy Python assets later.

---

## 11. Testing and validation

### 11.1 Unit tests

Test:

- symbol normalization
- status/error mapping
- Binance response normalization
- TTL cache behavior
- request coalescing
- funding edge calculation
- slippage calculation
- ranking behavior

### 11.2 Fixture tests

Add fixtures such as:

```text
packages/tools/test-fixtures/binance/exchange-info.json
packages/tools/test-fixtures/binance/premium-index-btc-eth.json
packages/tools/test-fixtures/binance/book-ticker.json
packages/tools/test-fixtures/binance/depth-btcusdt-100.json
```

Fixture tests should not require network access.

### 11.3 Live smoke

Add a live smoke command only for read-only public data:

```text
npm run smoke:binance-market-data
```

When local production Binance access is unavailable, run the same smoke through the read-only proxy:

```bash
PRISM_BINANCE_USDS_FUTURES_BASE_URL=http://127.0.0.1:8000/prism-binance-futures npm run smoke:binance-market-data
```

Validation requirements:

- provider is not `mock`
- status is structured
- timestamp fields are present
- source and provider are present
- rate limit or geo-block failures are explicit
- no raw provider exception is shown to Pi Agent

### 11.4 Agent smoke

Upgrade `npm run smoke:funding` so the agent can materialize an opportunity from provider-backed facts, or explicitly report provider unavailability without inventing data.

---

## 12. Implementation phases

### Phase 1 — Contracts and provider foundation

Create:

```text
packages/domain/src/fetch-status.ts
packages/domain/src/market-data.ts
packages/tools/src/shared/fetch-envelope.ts
packages/tools/src/shared/ttl-cache.ts
packages/tools/src/exchanges/symbols.ts
packages/tools/src/exchanges/providers/binance-usds-futures.ts
```

### Phase 2 — Replace mock tools

Implement or update:

```text
packages/tools/src/exchanges/get-exchange-markets.ts
packages/tools/src/exchanges/get-funding-rates.ts
packages/tools/src/exchanges/get-exchange-tickers.ts
packages/tools/src/exchanges/get-orderbook-depth.ts
packages/tools/src/index.ts
packages/agent-kernel/src/register-prism-tools.ts
```

### Phase 3 — Operation-level scanner

Create:

```text
packages/operations/src/scan-funding-opportunities.ts
packages/tools/src/opportunities/calculate-slippage.ts
packages/tools/src/opportunities/rank-opportunities.ts
```

Register `scan_funding_opportunities` as the preferred common workflow tool.

### Phase 4 — Evidence and artifacts

Persist provider facts, warnings, and calculation records as evidence linked to `OpportunityArtifact`.

### Phase 5 — Multi-venue expansion

Add Bitget, Bybit, and OKX behind the same exchange market-data service. Do not change Pi Agent tool contracts unless the product semantics truly change.

### Phase 6 — Streaming and jobs

Only after REST correctness is stable, add WebSocket streams, background scans, alerts, and opportunity feeds.

---

## 13. Acceptance criteria

The Binance read plane is not complete until:

1. Public Binance data is fetched through provider-backed tools, not mocks.
2. Every tool output includes source, provider, status, timestamp, freshness, and warnings.
3. Provider failures are structured and non-fabricated.
4. Full-market scans do not fetch order books for every symbol.
5. `npm run typecheck` passes.
6. Fixture tests cover normalization and failure mapping.
7. A read-only live smoke can prove the provider path when network access is available.
8. `smoke:funding` can use real facts or explicitly report unavailability.
9. No private/account/execution endpoints are introduced.
10. Documentation and extraction log are updated.

---

## 14. Final recommendation

Build Binance as the first native TypeScript public market-data provider for Prism.

Do not carry over `Prism_old` runtime glue. Translate its datasource lessons into Prism contracts, fetch envelopes, provider degradation behavior, and tests.

This keeps the architecture aligned with Prism's north star:

```text
provider-backed Information
  -> Pi Agent Energy
  -> artifact-backed Material
```
