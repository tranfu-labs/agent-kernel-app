## Context

Prism is being rebuilt around the north star:

```text
Information -> Energy -> Material
```

The current market-data foundation already includes domain contracts, a fetch envelope, TTL cache, symbol normalization, Binance USDⓈ-M Futures provider code, and `ExchangeMarketDataService`. Existing Pi Agent-facing exchange tools still contain mock behavior and do not yet expose the provider-backed read plane.

This change completes the first usable Information Plane slice by wiring stable Prism tools to the exchange market-data service.

Relevant technical-route constraints:

- TypeScript owns the governed realtime read plane and Pi Agent tool boundary.
- Python analytics is out of scope and must consume normalized market data later.
- `ExchangeMarketDataService` remains a provider-backed normalization service, not an analytics engine.
- All realtime financial facts must come from tools, not LLM prose.
- This phase remains public read-only.

## Goals / Non-Goals

**Goals:**

- Replace mock funding and order book depth tool outputs with provider-backed service calls.
- Add `get_exchange_markets` and `get_exchange_tickers` tools.
- Register provider-backed tools with Pi Agent.
- Preserve structured provider/source/status/timestamp/warnings metadata.
- Return explicit unsupported or failure statuses rather than fabricated fallback data.
- Validate normalization and failure behavior with typecheck and targeted tests or fixtures where practical.

**Non-Goals:**

- No Python analytics worker.
- No OHLCV/kline endpoint.
- No funding history endpoint unless needed as a minimal support function.
- No Bitget, Bybit, OKX provider implementation.
- No private API keys.
- No account, position, order, margin, leverage, transfer, or execution endpoints.
- No OpportunityArtifact or scanner implementation in this change.
- No WebSocket streaming or background jobs.

## Decisions

### Decision 1: Wire tools to `ExchangeMarketDataService`, not directly to Binance provider

Tool wrappers SHALL call the service layer rather than provider methods directly.

Rationale:

- The service owns venue routing, market-type routing, symbol normalization, cache, request coalescing, provider result normalization, and status aggregation.
- Keeping tools above the service preserves the future path to Bitget, Bybit, and OKX without changing Pi Agent-facing contracts.

Alternative considered: tool wrappers call `BinanceUsdsFuturesProvider` directly.

Rejected because it would leak provider-specific decisions into product tool boundaries and make future multi-venue support harder.

### Decision 2: Preserve current tool names while changing internals from mock to provider-backed

Existing mock tool names should remain stable where possible:

- `get_funding_rates`
- `get_orderbook_depth`

New tools should follow the same product API pattern:

- `get_exchange_markets`
- `get_exchange_tickers`

Rationale:

- Pi Agent skills and smoke code should evolve toward real facts without changing user-facing intent.
- Stable tool names are product APIs, not raw endpoint names.

### Decision 3: Return structured unsupported/failure results, not mock fallbacks

Unsupported venues, unsupported market types, provider downtime, rate limits, geo blocks, and timeouts SHALL be represented through structured statuses and warnings.

Rationale:

- Financial tooling must not fabricate current market facts.
- Agent explanations can reason over explicit failure states.

### Decision 4: Keep analytics and ranking out of this change

This change only wires provider-backed market-data tools. It does not compute opportunity ranking, technical indicators, Python analytics, or artifacts.

Rationale:

- Later Energy Plane and Material Plane work depends on a stable Information Plane.
- Narrow scope reduces the risk of mixing read-plane and analytics responsibilities.

### Decision 5: Prefer fixture-level tests for normalization and deterministic math

Live Binance network access may be unavailable, rate-limited, or geo-blocked. Tests for normalization and slippage should use fixtures or injected providers where practical.

Rationale:

- Fixture tests prove deterministic behavior without depending on external network state.
- Live smokes can exist but must degrade explicitly.

## Risks / Trade-offs

- Provider network unavailable → tool returns structured failure or provider-unavailable status; smoke should report that state instead of failing with raw exceptions.
- Binance geo/rate limits → fetch envelope maps to `geo_blocked` or `rate_limited`; warnings preserve provider context.
- Existing smoke expectations assume mock data → update smoke to accept provider-backed facts or explicit unavailable status.
- Tool output contracts may differ from current mock shapes → preserve existing useful fields where possible while adding provider/source/status/warnings metadata.
- Live tool calls may be slower than mocks → use cache, request coalescing, and batch endpoints already defined in the service/provider architecture.
- Scope creep toward scanner or analytics → defer to later OpenSpec changes.

## Migration Plan

1. Inspect current mock tool contracts and agent registration.
2. Add missing tool wrappers for exchange markets and tickers.
3. Replace mock implementation internals with service calls.
4. Update agent registration to expose the provider-backed tools.
5. Update or add tests/fixtures for deterministic behavior.
6. Update smoke behavior for provider-backed data.
7. Run typecheck/build/smokes as appropriate.

Rollback strategy:

- If provider-backed wiring breaks agent runtime, revert tool registration or temporarily keep mock-only smoke separate while preserving service-level implementation.
- Do not reintroduce fabricated market facts as fallback for provider failure.

## Open Questions

- Should live Binance smoke be a new script (`smoke:binance-market-data`) or should existing `smoke:funding` be upgraded first?
- Should tests use the existing test framework only, or should a minimal package-specific test harness be added if none exists?
- Should tool outputs include both `fetchedAt` and per-row `observedAt` in all wrappers, or preserve existing output shape with additional metadata fields?
