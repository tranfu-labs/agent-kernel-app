# Change: Expand Binance Public Market-Data Coverage

## Why

Prism's first Binance read plane now supports a minimal funding scanner, but future opportunity discovery will require broader market context: 24h volume, funding history, open interest, OHLCV series, positioning ratios, and selected microstructure data.

The goal is to maximize Binance USDⓈ-M Futures public data coverage without turning Pi Agent into a raw Binance endpoint caller. Broad endpoint coverage belongs in the provider layer; Pi Agent should continue to use stable, high-level Prism tools and operation-level scanners.

## What Changes

- Expand the Binance USDⓈ-M Futures public market-data provider beyond the current core endpoints.
- Add normalized Prism contracts for market context, funding context, market series, open interest, positioning, and microstructure data.
- Add service-level context APIs that compose provider calls with cache, request coalescing, status aggregation, and request-weight awareness.
- Add high-level Pi Agent tools for market context and market series rather than exposing every Binance endpoint directly.
- Enhance `scan_funding_opportunities` with 24h volume, funding persistence, open interest confirmation, optional volatility context, and richer artifact evidence.
- Expand the read-only Binance proxy allowlist for the new public market-data endpoints.
- Preserve the public read-only boundary: no account, order, position, leverage, margin, transfer, or execution endpoints.

## Out of Scope

- Binance private API keys.
- Account balances, positions, open orders, order placement, cancellation, leverage, margin, wallet, or transfer endpoints.
- WebSocket streaming as part of this REST expansion.
- Full multi-venue parity in the same change.
- Python analytics implementation beyond defining normalized inputs that can feed it later.

## Superpowers Implementation Discipline

This change should be implemented in small, independently validated slices:

1. Core market context: 24h ticker, funding history, open interest, first `get_market_context` path.
2. Market series: klines, mark/index/premium klines, `get_market_series`.
3. Positioning context: open interest history and long/short/taker ratios.
4. Microstructure context: recent trades and aggregate trades.
5. Scanner/evidence hardening: richer opportunity artifacts and deterministic scoring inputs.

Each slice should include fixture tests, provider normalization tests, status/failure mapping tests, and smoke coverage where practical.

## Success Criteria

- Provider layer covers a broad set of Binance public market-data endpoints.
- Pi Agent still sees a small high-level tool surface.
- Full-market scans do not fetch depth, klines, or trade data for every symbol.
- Scanner outputs explainable candidates backed by evidence and provider statuses.
- Network-resilient proxy/testnet workflows still work.
- `openspec validate --all --strict`, typecheck, tests, and relevant smokes pass.
