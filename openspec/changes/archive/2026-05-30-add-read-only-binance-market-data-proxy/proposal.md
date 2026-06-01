# Change: Add read-only Binance market-data proxy

## Summary

Add a minimal read-only Binance USDⓈ-M Futures market-data proxy and live smoke path so Prism development is not blocked by local DNS, routing, TLS/SNI, or provider reachability issues.

## Motivation

Local networks may fail to reach `https://fapi.binance.com` even when Prism provider code is correct. A verified remote server can reach Binance production endpoints. Prism needs a stable way to continue local development and validate live provider behavior without making every developer machine depend on direct Binance production access.

## Scope

In scope:

- Add an `apps/agent-api` HTTP server route for a thin read-only Binance proxy.
- Allow only approved public Binance USDⓈ-M Futures market-data paths.
- Preserve upstream status, headers needed for content-type, and response body.
- Add a live smoke command that can test production, testnet, or proxy base URLs.
- Document and validate the workflow through existing network-resilient docs.

Out of scope:

- Private exchange APIs.
- API keys, balances, positions, orders, transfers, leverage, margin, or execution endpoints.
- Full Prism deployment to the existing NewAPI production server.
- Caching, auth, rate limiting, or observability beyond a minimal safe proxy.
- Multi-provider proxy support.

## Safety boundary

The proxy must reject any unapproved path. It must not become a generic open proxy.

Approved paths are limited to:

```text
/fapi/v1/time
/fapi/v1/exchangeInfo
/fapi/v1/premiumIndex
/fapi/v1/ticker/bookTicker
/fapi/v1/depth
```

## Expected outcome

Developers can run Prism locally with:

```bash
PRISM_BINANCE_USDS_FUTURES_BASE_URL=http://127.0.0.1:8000/prism-binance-futures
```

or with a deployed equivalent proxy URL, and the existing TypeScript read plane can fetch real Binance production facts through the same provider interface.
