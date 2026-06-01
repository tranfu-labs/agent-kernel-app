# Bitget Public Read Plane Design

## Current context

`ExchangeMarketDataService` currently supports Binance `linear_perp` and returns `unsupported` for Bitget. The funding-basis evaluator can already consume normalized `MarketContext` inputs offline. This slice adds Bitget public facts so future slices can feed real second-venue contexts into the existing evaluator.

## Alternatives considered

### Option A: Add raw Bitget tools directly

Expose raw Bitget REST endpoints as tools.

- Pros: fast implementation.
- Cons: leaks provider shapes and bypasses Prism domain normalization.

### Option B: Add Bitget provider behind `ExchangeMarketDataService`

Follow the existing Binance adapter pattern and normalize into Prism domain contracts.

- Pros: preserves provider boundary; makes Bitget facts usable by existing tools and `getMarketContext`; supports core evaluator later.
- Cons: requires more service normalization code.

### Option C: Skip provider and use fixtures only

Continue developing the operation with offline fixture contexts.

- Pros: stable tests.
- Cons: does not advance provider-backed MVP.

## Recommended design

Use Option B. Add a Bitget provider class that returns `AdapterFetchResult<T>` via `withFetchEnvelope`, then normalize provider payloads in `ExchangeMarketDataService`.

## Provider methods

`BitgetUsdtFuturesProvider` will include:

- `getContracts()`
- `getTickers(symbols?: string[])`
- `getCurrentFundingRates(symbols: string[])`
- `getOrderbook(symbol: string, limit?: number)`

The provider should use only public endpoints under Bitget mix market APIs.

## Service normalization

The service will add Bitget branches while preserving Binance behavior:

```text
getExchangeMarkets(bitget, linear_perp)
getFundingRates([bitget], linear_perp)
getExchangeTickers([bitget], linear_perp)
getOrderbookDepth(bitget, linear_perp)
getMarketContext(bitget, linear_perp) through existing composition
```

Unsupported venues/market types still return structured `unsupported` output.

## Failure modes

- HTTP/rate-limit/geo/network failures map through `withFetchEnvelope`.
- Bitget non-success code throws a provider fetch error and maps to `failed`.
- Missing payload data returns empty normalized facts with provider warnings.
- Missing order book levels returns `unknown` liquidity without fabricated slippage.

## Safety

No API keys, secrets, account endpoints, order endpoints, leverage, margin, transfer, withdrawal, or execution calls are introduced.
