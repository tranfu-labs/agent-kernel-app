# Design: Broad Binance Public Market-Data Coverage

## Decision Summary

Prism should maximize Binance data coverage at the provider layer while minimizing Pi Agent tool complexity.

```text
Binance public REST / optional SDK
  -> Binance provider adapter
  -> ExchangeMarketDataService normalized contexts
  -> Prism high-level tools and operations
  -> Pi Agent explanation
  -> EvidenceBundle / OpportunityArtifact
```

Provider methods may be numerous. Pi Agent tools must remain few, stable, and product-oriented.

## Architecture Principles

### 1. Broad provider, narrow agent surface

Provider layer MAY expose many Binance-specific public data methods:

```ts
getServerTime()
getExchangeInfo()
getPremiumIndex(symbols?)
getFundingHistory(symbol, limit?)
getFundingInfo()
getBookTickers(symbols?)
get24hTickers(symbols?)
getOrderbook(symbol, limit)
getKlines(symbol, interval, limit?)
getContinuousKlines(pair, contractType, interval, limit?)
getMarkPriceKlines(symbol, interval, limit?)
getIndexPriceKlines(symbol, interval, limit?)
getPremiumIndexKlines(symbol, interval, limit?)
getOpenInterest(symbol)
getOpenInterestHistory(symbol, period, limit?)
getGlobalLongShortAccountRatio(symbol, period, limit?)
getTopLongShortAccountRatio(symbol, period, limit?)
getTopLongShortPositionRatio(symbol, period, limit?)
getTakerLongShortRatio(symbol, period, limit?)
getRecentTrades(symbol, limit?)
getAggTrades(symbol, startTime?, endTime?, limit?)
```

Pi Agent SHOULD NOT see one tool per Binance endpoint. Instead, it should call:

```text
get_exchange_markets
get_market_context
get_market_series
get_orderbook_depth
scan_funding_opportunities
scan_market_anomalies later
```

### 2. TypeScript remains the governed read plane

TypeScript owns realtime provider access, normalized contracts, cache, request coalescing, status mapping, request-weight metadata, tool schemas, and artifact materialization.

Python analytics may later consume normalized series/context bundles, but Python should not become the primary realtime exchange read plane.

### 3. SDK is optional and internal

A Binance SDK MAY be used later behind the provider interface, especially for WebSocket or broad endpoint coverage, but it MUST NOT be exposed directly to Pi Agent.

Native fetch remains acceptable for REST endpoints because Prism already owns timeout, structured failure mapping, base URL/proxy support, and request-weight metadata.

### 4. Public read-only boundary

This change expands public data only. Private account and execution endpoints require a separate architecture with credentials, permission gates, risk checks, user confirmation, audit logging, dry-run defaults, and kill switches.

## Data Coverage Layers

### Layer A: Metadata and venue health

Provider methods:

- `getServerTime()`
- `getExchangeInfo()`

Contracts:

- `ExchangeMarket`
- optional `ExchangeVenueHealth`

Primary consumers:

- `get_exchange_markets`
- universe validation
- scanner symbol filtering

### Layer B: Current price and ticker context

Provider methods:

- `getBookTickers(symbols?)`
- `get24hTickers(symbols?)`
- `getPremiumIndex(symbols?)`

Contracts:

- `ExchangeTicker`
- `MarketSnapshot`

Primary consumers:

- `get_market_context`
- `scan_funding_opportunities`
- low-level `get_exchange_tickers`

### Layer C: Funding context

Provider methods:

- `getPremiumIndex(symbols?)`
- `getFundingHistory(symbol, limit?)`
- `getFundingInfo()`
- `getPremiumIndexKlines(symbol, interval, limit?)`

Contracts:

- `FundingRatePoint`
- `FundingHistorySeries`
- `FundingContext`

Primary consumers:

- `scan_funding_opportunities`
- `get_market_context(include: ["funding", "fundingHistory"] )`
- future analytics/statistics wrappers

### Layer D: Liquidity and order book context

Provider methods:

- `getOrderbook(symbol, limit)`

Contracts:

- `OrderbookSnapshot`
- `OrderbookDepthEstimate`
- `LiquidityContext`

Primary consumers:

- `scan_funding_opportunities` for top candidates only
- `get_orderbook_depth`
- `get_market_context(include: ["depth"] )` for selected symbols only

### Layer E: Market series and analytics inputs

Provider methods:

- `getKlines(symbol, interval, limit?)`
- `getContinuousKlines(pair, contractType, interval, limit?)`
- `getMarkPriceKlines(symbol, interval, limit?)`
- `getIndexPriceKlines(symbol, interval, limit?)`
- `getPremiumIndexKlines(symbol, interval, limit?)`

Contracts:

- `OhlcvBar`
- `MarketSeries`
- `MarketSeriesContext`

Primary consumers:

- `get_market_series`
- Python analytics wrappers
- scanner volatility/trend filters after core context is stable

### Layer F: Open interest and positioning

Provider methods:

- `getOpenInterest(symbol)`
- `getOpenInterestHistory(symbol, period, limit?)`
- `getGlobalLongShortAccountRatio(symbol, period, limit?)`
- `getTopLongShortAccountRatio(symbol, period, limit?)`
- `getTopLongShortPositionRatio(symbol, period, limit?)`
- `getTakerLongShortRatio(symbol, period, limit?)`

Contracts:

- `OpenInterestSnapshot`
- `OpenInterestPoint`
- `PositioningRatioPoint`
- `PositioningContext`

Primary consumers:

- `get_market_context`
- scanner confidence/risk flags
- future anomaly scanner

### Layer G: Trade microstructure

Provider methods:

- `getRecentTrades(symbol, limit?)`
- `getAggTrades(symbol, startTime?, endTime?, limit?)`

Contracts:

- `TradePrint`
- `AggTradePrint`
- `MicrostructureContext`

Primary consumers:

- selected symbol drilldown
- future anomaly scanner
- future execution simulation research, not execution itself

## Cache and Request Discipline

Suggested TTLs:

| Data | TTL |
|---|---:|
| exchange info | 1h |
| server time | 5-30s |
| premium index/current funding | 5s |
| book ticker | 2s |
| 24h ticker | 15s |
| order book depth | 1-2s |
| funding history | 60s |
| funding info | 5-30m |
| open interest | 15s |
| open interest history | 1-5m |
| klines 1m | 30-60s |
| klines >= 5m | 1-15m |
| positioning ratios | 1-5m |
| recent/aggregate trades | 1-30s |

Rules:

- Prefer batch endpoints and local filtering where weight-efficient.
- Fetch depth only after coarse screening.
- Fetch klines/history/positioning only for selected symbols or explicit research requests.
- Every provider result must include request weight where known.
- Add request budget enforcement later if scans grow beyond safe local limits.

## Tool Design

### `get_market_context`

Purpose: provide a structured multi-source context bundle for selected symbols.

Input shape:

```json
{
  "venue": "binance",
  "marketType": "linear_perp",
  "symbols": ["BTCUSDT", "ETHUSDT"],
  "include": ["market", "ticker", "funding", "fundingHistory", "openInterest", "positioning", "ohlcv", "depth"],
  "targetNotionalUsd": 1000,
  "interval": "1m",
  "limit": 100
}
```

Behavior:

- Composes normalized provider data into `MarketContext[]`.
- Aggregates statuses and warnings.
- Rejects or skips expensive includes when input would trigger unsafe full-market depth/trade/series scans.

### `get_market_series`

Purpose: fetch normalized OHLCV-like series for selected symbols.

Input shape:

```json
{
  "venue": "binance",
  "marketType": "linear_perp",
  "symbol": "BTCUSDT",
  "series": "last|mark|index|premium|continuous",
  "interval": "1m",
  "limit": 500
}
```

Behavior:

- Returns normalized `MarketSeries` suitable for Python analytics.
- Does not return raw Binance kline arrays as the primary contract.

### `scan_funding_opportunities`

Enhancements:

- Use 24h quote volume for coarse liquidity filtering.
- Use funding history for persistence and spike warnings.
- Use open interest for confidence and low-participation warnings.
- Optionally use volatility context from market series after Slice 2.
- Save richer artifact evidence.

## Intent Routing and Tool Selection

Pi Agent guidance should make opportunity-discovery intent route to operation-level tools first:

| User intent | Preferred tool path |
|---|---|
| "find funding opportunities" / "scan funding" / "资金费率机会" | `scan_funding_opportunities` |
| "why is this candidate ranked high" / "explain this symbol" | `get_market_context` plus saved artifact evidence |
| "show series/history/volatility inputs" | `get_market_series` or analytics wrapper |
| "can this notional fit" / "slippage" | `get_orderbook_depth` for selected symbols only |
| "what markets exist" / "is symbol supported" | `get_exchange_markets` |

Low-level market-data tools remain available for drilldown and debugging, but common opportunity discovery should not rely on Pi Agent manually sequencing many endpoint-level calls.

## Opportunity Artifact Evidence

Scanner artifacts should include:

- current funding evidence
- funding history summary
- ticker and 24h volume evidence
- open interest evidence
- selected depth/slippage evidence
- calculation inputs
- calculation outputs
- provider statuses
- warnings and risk flags
- source/fetched/observed timestamps

## Implementation Slices

### Slice 1: Core context

- Add 24h ticker, funding history, and open interest provider methods.
- Normalize into service outputs and market context.
- Add `get_market_context` initial tool.
- Enhance funding scanner with volume, funding persistence, and open interest.
- Expand proxy allowlist for these endpoints.

### Slice 2: Series

- Add kline, mark price kline, index price kline, premium index kline, and continuous kline provider methods.
- Add `get_market_series` tool.
- Produce normalized series for Python analytics.

### Slice 3: Positioning

- Add open interest history and long/short/taker ratio provider methods.
- Add positioning context into `get_market_context`.
- Add scanner confidence/risk signals.

### Slice 4: Microstructure

- Add recent trades and aggregate trades provider methods.
- Add microstructure context for selected-symbol drilldown and anomaly detection.

## Validation Strategy

Each slice should include:

- Fixture tests for Binance raw response normalization.
- Error/status mapping tests.
- Cache and request coalescing tests where new cache families are added.
- Agent tool schema tests or smoke tests for high-level tools.
- OpenSpec validation.
- Typecheck and workspace tests.
- Live smoke only for read-only public data, with network-unavailable statuses accepted where appropriate.
