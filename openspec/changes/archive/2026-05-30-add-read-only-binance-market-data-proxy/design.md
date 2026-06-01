# Design: Read-only Binance market-data proxy

## Architecture

```text
Prism local tools
  -> ExchangeMarketDataService
  -> BinanceUsdsFuturesProvider
  -> PRISM_BINANCE_USDS_FUTURES_BASE_URL
  -> agent-api read-only proxy
  -> Binance USDⓈ-M Futures REST
```

The proxy is an infrastructure transport seam only. It does not own market-data semantics, normalization, ranking, artifacts, or analytics.

## Placement

Implement the first version in `apps/agent-api` because:

- it is already the product runtime API surface;
- it can be deployed independently of the local developer machine;
- it avoids creating a new server package before the route proves useful;
- existing Prism tools can use it through `PRISM_BINANCE_USDS_FUTURES_BASE_URL` without changing provider contracts.

## HTTP route

Expose:

```text
GET /health
GET /prism-binance-futures/fapi/v1/:allowedPath
```

The route maps to:

```text
https://fapi.binance.com/fapi/v1/:allowedPath
```

Allowed path suffixes:

```text
time
exchangeInfo
premiumIndex
ticker/bookTicker
depth
```

Query parameters are forwarded as-is for allowed paths.

## Security rules

- Only `GET` is supported.
- Only the exact allowlist is supported.
- No request body is forwarded.
- No client-provided upstream host is accepted.
- No private/account/execution endpoints are allowed.
- The proxy must return `404` for unknown paths and `405` for non-GET requests.

## Configuration

Environment variables:

```text
PORT=8000
PRISM_BINANCE_PROXY_UPSTREAM=https://fapi.binance.com
PRISM_BINANCE_PROXY_TIMEOUT_MS=15000
```

The upstream override is for testnet or controlled testing only.

## Smoke command

Add a smoke command that calls Prism tools against the configured base URL and reports:

- markets status/count
- funding status/count/sample
- ticker status/count/sample
- depth status/liquidity/snapshot levels
- structured warnings

The smoke should not require secrets.

## Testing strategy

Deterministic tests are preferred for provider behavior. For this change, validation is:

1. TypeScript typecheck.
2. Existing tools tests.
3. Smoke against `https://testnet.binancefuture.com` if local network permits.
4. Smoke against the local proxy when the server is running.

Production Binance smoke may be run only in a network environment that can reach Binance.
