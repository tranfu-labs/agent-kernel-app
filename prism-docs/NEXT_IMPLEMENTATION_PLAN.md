# Prism Next Implementation Plan

This document captures an earlier implementation-phase plan after the Pi Agent Kernel foundation and Binance read-plane design work.

## Status

Treat this file as historical planning context, not the current source of truth for active control-plane work.

Use these documents first instead:

- [`../docs/superpowers/specs/2026-05-31-vertical-pluggable-research-copilot-design.md`](../docs/superpowers/specs/2026-05-31-vertical-pluggable-research-copilot-design.md)
- [`../docs/superpowers/plans/2026-05-31-vertical-pluggable-research-copilot.md`](../docs/superpowers/plans/2026-05-31-vertical-pluggable-research-copilot.md)
- [`../openspec/changes/define-vertical-pluggable-research-copilot/`](../openspec/changes/define-vertical-pluggable-research-copilot/)
- [`../openspec/changes/add-prediction-market-sample-vertical/`](../openspec/changes/add-prediction-market-sample-vertical/)

Current implementation entrypoint for the older funding-basis MVP phase remains [`MVP_FUNDING_BASIS_ARBITRAGE_PLAN.md`](./MVP_FUNDING_BASIS_ARBITRAGE_PLAN.md).

The purpose of this document is to show how Prism moved from a mock-data agent demo toward a provider-backed, read-only funding opportunity workbench while preserving the long-term architecture:

```text
Information -> Energy -> Material
```

---

## 1. Executive decision

The next implementation priority is:

> Build the provider-backed Binance public market-data read plane, then use it to power a deterministic funding opportunity scan that materializes OpportunityArtifacts.

The accepted technical route is defined in [`TS_PYTHON_TECHNICAL_ROUTE.md`](./TS_PYTHON_TECHNICAL_ROUTE.md): TypeScript owns the governed read plane and Pi Agent tool boundary; Python owns heavy pandas/numpy/TA-Lib analytics behind TypeScript wrappers.

The development workflow is defined in [`DEVELOPMENT_WORKFLOW_OPENSPEC_SUPERPOWERS.md`](./DEVELOPMENT_WORKFLOW_OPENSPEC_SUPERPOWERS.md): use OpenSpec for architecture-sensitive change specification and Superpowers-style methods for implementation discipline, TDD, debugging, review, and verification.

Do not start with Web UI, private exchange credentials, trading execution, account data, or multiple venues at once.

The project currently has:

- Pi Agent session foundation.
- Prism custom tool registration.
- Domain contracts for Opportunity, Evidence, Artifact, TradeProposal, RiskCheckResult.
- Provider-backed Binance market-data tools for markets, funding, tickers, and selected depth.
- Network-resilient live access through `PRISM_BINANCE_USDS_FUTURES_BASE_URL` and the read-only proxy path.
- In-memory artifact persistence.
- Smoke tests for Pi round-trip, funding flow, Binance market data, and the funding scanner.

The next missing foundation is an operation-level scanner that turns provider-backed facts into ranked and materialized opportunity candidates.

---

## 2. North Star alignment

Prism's north star is:

```text
Information -> Energy -> Material
```

The next phase maps to that model as follows:

### Information

Provider-backed Binance public market facts:

- markets / instrument specs
- funding / premium index
- mark and index prices
- best bid / ask
- 24h ticker context
- selected order book depth
- structured source, provider, status, timestamp, freshness, warnings

### Energy

Deterministic and agent-assisted transformation:

- Pi Agent selects Prism tools.
- `funding-rate-arbitrage` skill guides behavior.
- Deterministic operations calculate edge, slippage, confidence, and ranking.
- LLM explains and synthesizes but does not invent facts or authorize execution.

### Material

Durable product objects:

- OpportunityArtifact
- Evidence records or embedded evidence summaries
- warnings and freshness status
- future-ready path to TradeProposalArtifact

---

## 3. Scope for this phase

### 3.1 In scope

1. Contract-first market-data model.
2. Binance USDⓈ-M Futures public REST provider.
3. Exchange market-data service with cache and request coalescing.
4. Replacement of mock funding/orderbook tools.
5. New ticker and market tools.
6. Read-only live smoke for Binance market data.
7. Fixture tests for normalization and failure mapping.
8. Upgrade funding smoke to use real facts or explicit provider-unavailable status.
9. First operation-level scanner design or implementation if low-level tools stabilize.

### 3.2 Out of scope

- Binance private API keys.
- account balances.
- positions.
- open orders.
- real order placement.
- order cancellation.
- leverage/margin changes.
- WebSocket streaming.
- background jobs.
- full Web UI.
- multi-user permission model.
- full Bitget/Bybit/OKX integration.

These should not be introduced until the read-only data foundation is correct.

---

## 4. Guiding principles

### 4.1 Contract first

Define Prism contracts before provider implementation.

Provider-specific Binance response shapes must not leak into Pi Agent tools or domain artifacts.

### 4.2 Public read-only only

This phase must not require or accept exchange private credentials.

### 4.3 Structured failure over prose failure

Provider errors must become structured statuses:

```text
ok
partial
failed
skipped
timeout
rate_limited
geo_blocked
unsupported
```

Never allow raw provider exceptions to reach Pi Agent as unstructured text.

### 4.4 Correctness before breadth

Implement Binance well before adding Bitget, Bybit, or OKX.

A single correct provider behind stable contracts is more valuable than several shallow mock or inconsistent providers.

### 4.5 Depth discipline

Order book depth is expensive and should only be fetched for selected candidates.

The scanner must coarse-screen with funding and ticker data before fetching order books.

### 4.6 Agent tools are product APIs

Pi Agent tools are stable product boundaries, not direct wrappers around Binance endpoints.

---

## 5. Target module layout

```text
packages/domain/src/
  fetch-status.ts
  market-data.ts

packages/tools/src/shared/
  fetch-envelope.ts
  ttl-cache.ts

packages/tools/src/exchanges/
  symbols.ts
  exchange-market-data-service.ts
  get-exchange-markets.ts
  get-funding-rates.ts
  get-exchange-tickers.ts
  get-orderbook-depth.ts

packages/tools/src/exchanges/providers/
  binance-usds-futures.ts
  binance-rate-limits.ts

packages/tools/src/opportunities/
  calculate-funding-edge.ts
  calculate-slippage.ts
  rank-opportunities.ts

packages/operations/src/
  scan-funding-opportunities.ts
```

Existing files to update:

```text
packages/domain/src/index.ts
packages/tools/src/index.ts
packages/agent-kernel/src/register-prism-tools.ts
apps/agent-api/src/smoke-funding.ts
package.json
```

Optional later:

```text
apps/agent-api/src/smoke-binance-market-data.ts
packages/tools/test-fixtures/binance/
```

---

## 6. Implementation sequence

## Phase 1 — Domain and shared contracts

Goal: make the shape of correct data explicit before touching Binance.

Create:

```text
packages/domain/src/fetch-status.ts
packages/domain/src/market-data.ts
```

Define:

- `FetchStatus`
- `AdapterFetchResult<T>`
- `Venue`
- `MarketType`
- `ExchangeMarket`
- `FundingRatePoint`
- `ExchangeTicker`
- `OrderbookLevel`
- `OrderbookSnapshot`
- `OrderbookDepthEstimate`

Update:

```text
packages/domain/src/index.ts
```

Acceptance:

- `npm run typecheck` passes.
- Existing smoke code still compiles.
- No provider/network code yet.

---

## Phase 2 — Fetch envelope and cache utilities

Goal: make provider access safe and efficient before adding provider calls.

Create:

```text
packages/tools/src/shared/fetch-envelope.ts
packages/tools/src/shared/ttl-cache.ts
```

`fetch-envelope.ts` should provide:

- timeout support
- elapsed time capture
- structured status mapping
- source/provider metadata
- warnings
- no raw exception leakage

`ttl-cache.ts` should provide:

- simple in-memory TTL cache
- in-flight request coalescing
- explicit stale/miss behavior

Acceptance:

- unit-level behavior can be tested without network.
- utility code is provider-neutral.
- no Binance logic in shared utilities.

---

## Phase 3 — Symbol normalization and Binance provider

Goal: implement the first provider-backed Information Plane capability.

Create:

```text
packages/tools/src/exchanges/symbols.ts
packages/tools/src/exchanges/providers/binance-usds-futures.ts
packages/tools/src/exchanges/providers/binance-rate-limits.ts
```

Use Binance USDⓈ-M Futures public REST endpoints defined in:

```text
prism-docs/BINANCE_MARKET_DATA_READ_PLANE.md
```

Provider functions:

```ts
getExchangeInfo()
getPremiumIndex(symbols?)
getBookTickers(symbols?)
get24hTickers(symbols?)
getOrderbook(symbol, limit)
getFundingHistory(symbol, limit?)
getOpenInterest(symbol)
```

Rules:

- Use public REST only.
- Do not require API keys.
- Do not add private endpoints.
- Capture request weight where known.
- Map 429/418/451/timeouts/5xx to structured statuses.
- Keep Binance raw shapes below provider boundary.

Acceptance:

- Provider can fetch BTCUSDT current funding and book/depth when network is available.
- Failure modes return structured status.
- `npm run typecheck` passes.

---

## Phase 4 — Exchange market-data service

Goal: isolate tools from provider details and prepare for future venues.

Create:

```text
packages/tools/src/exchanges/exchange-market-data-service.ts
```

Responsibilities:

- route by venue and market type
- call Binance provider
- normalize Binance output to Prism contracts
- apply TTL cache
- coalesce in-flight requests
- aggregate partial results
- normalize unsupported venues/symbols
- emit warnings and statuses

Initial TTLs:

| Data | TTL |
|---|---:|
| exchange info | 1 hour |
| premium index | 5 seconds |
| book ticker | 2 seconds |
| 24h ticker | 15 seconds |
| order book depth | 2 seconds |
| funding history | 60 seconds |
| open interest | 15 seconds |

Acceptance:

- Service can satisfy multi-symbol Binance funding/ticker requests.
- Unsupported venue returns `unsupported`, not mock data.
- Cache behavior is deterministic and testable.

---

## Phase 5 — Replace and expand Prism tools

Goal: make Pi Agent-visible tools provider-backed while preserving stable contracts.

Update or create:

```text
packages/tools/src/exchanges/get-exchange-markets.ts
packages/tools/src/exchanges/get-funding-rates.ts
packages/tools/src/exchanges/get-exchange-tickers.ts
packages/tools/src/exchanges/get-orderbook-depth.ts
packages/tools/src/index.ts
```

Replace existing mock behavior:

- `get_funding_rates` should use the exchange market-data service.
- `get_orderbook_depth` should calculate slippage/capacity from real order book snapshots.
- Unsupported non-Binance venues should return explicit `unsupported` or `skipped`, not fake values.

Update:

```text
packages/agent-kernel/src/register-prism-tools.ts
```

Register:

- `get_exchange_markets`
- `get_funding_rates`
- `get_exchange_tickers`
- `get_orderbook_depth`

Acceptance:

- Pi Agent can call provider-backed tools.
- Tool outputs include source, provider, status, timestamp, freshness, and warnings.
- No raw Binance response is the primary agent-facing output.
- No private/execution tool is introduced.

---

## Phase 6 — Tests and smoke commands

Goal: prove correctness without relying solely on live network.

Add fixtures:

```text
packages/tools/test-fixtures/binance/exchange-info.json
packages/tools/test-fixtures/binance/premium-index-btc-eth.json
packages/tools/test-fixtures/binance/book-ticker.json
packages/tools/test-fixtures/binance/depth-btcusdt-100.json
```

Add tests for:

- Binance response normalization
- error/status mapping
- symbol normalization
- cache TTL behavior
- request coalescing
- slippage calculation
- funding edge calculation

Add live read-only smoke:

```text
npm run smoke:binance-market-data
```

Upgrade:

```text
npm run smoke:funding
```

Acceptance:

- Fixture tests do not require network.
- Live smoke succeeds when Binance is reachable or fails with explicit provider-unavailable status.
- Funding smoke no longer depends on mock facts.

---

## Phase 7 — Python analytics worker

Goal: add pandas/numpy/TA-Lib analytics without moving the governed realtime read plane out of TypeScript.

Create:

```text
python-services/analytics/prism_analytics/
  indicators.py
  funding.py
  basis.py
  volatility.py
  scoring.py
  schemas.py

packages/tools/src/analytics/
  python-analytics-client.ts
  calculate-technical-indicators.ts
  calculate-funding-statistics.ts
```

Rules:

- Python consumes Prism-normalized market-data inputs.
- Python returns normalized analytics results, not unstructured prose.
- TypeScript validates Python responses before exposing them to Pi Agent.
- Python exceptions map to structured tool statuses and warnings.
- Python must not become a second uncontrolled realtime exchange read plane.

Acceptance:

- A TypeScript wrapper can call Python analytics with explicit JSON input/output.
- Analytics failures do not crash the agent runtime.
- `ExchangeMarketDataService` remains focused on provider-backed market-data normalization.

---

## Phase 8 — Operation-level scanner

Goal: prevent inefficient agent call loops and create a product-grade workflow.

Create or expand:

```text
packages/operations/src/scan-funding-opportunities.ts
packages/tools/src/opportunities/calculate-slippage.ts
packages/tools/src/opportunities/rank-opportunities.ts
```

Preferred operation flow:

```text
funding + ticker coarse screen
  -> rough ranking
  -> fetch orderbook depth for top N only
  -> calculate slippage
  -> calculate net funding edge
  -> rank opportunities
  -> save OpportunityArtifact
```

Expose as Pi tool after low-level tool stability:

```text
scan_funding_opportunities
```

Acceptance:

- The scanner does not fetch depth for every symbol.
- Output includes opportunities, warnings, data status, and artifact IDs.
- It can degrade when one data family is unavailable.
- It never suggests direct execution.

---

## Phase 9 — Materialization improvements

Goal: make outputs inspectable and reusable.

Improve artifacts so OpportunityArtifact includes:

- market data sources
- funding evidence
- ticker evidence
- orderbook/slippage evidence
- calculation inputs
- calculation outputs
- warnings
- freshness status
- provider statuses

Consider adding or expanding:

```text
EvidenceBundle
ArtifactStore
get_artifact tool
```

Acceptance:

- Opportunity outputs are not only chat text.
- Future turns can refer to saved artifact IDs.
- Stale data is identifiable.

---

## 7. Validation checklist

Before this phase is considered complete:

1. `npm run typecheck` passes.
2. Existing `npm run smoke:pi` still passes.
3. `npm run smoke:funding` uses provider-backed facts or explicit unavailable statuses.
4. New `npm run smoke:binance-market-data` exists.
5. Mock provider labels are removed from Binance paths.
6. Tool outputs include provider/source/status/timestamps/warnings.
7. Unsupported venues do not silently return fake data.
8. Order book depth is only fetched for selected candidates in scan flows.
9. No private/account/execution endpoint exists.
10. Documentation remains consistent with `BINANCE_MARKET_DATA_READ_PLANE.md`.

---

## 8. Risk analysis

### 8.1 Provider availability risk

Binance may be unreachable, rate limited, geo-blocked, or temporarily unavailable.

Mitigation:

- structured status
- cache with explicit freshness
- no fabricated fallback
- smoke tests accept explicit unavailable status

### 8.2 Agent inefficiency risk

Pi Agent may call too many low-level tools or repeatedly fetch the same data.

Mitigation:

- TTL cache
- request coalescing
- operation-level scanner
- skill guidance that requires coarse screening before depth

### 8.3 Contract drift risk

Provider fields may leak upward and make future Bitget/Bybit integration harder.

Mitigation:

- provider-specific code stays in `providers/`
- service normalizes to Prism contracts
- tests assert normalized shapes

### 8.4 Trading safety risk

Market-data work can accidentally expand into account or execution work.

Mitigation:

- P0 public read-only only
- no credentials
- no account APIs
- no execution APIs
- explicit docs and review checklist

### 8.5 Overbuilding risk

Building WebSocket, UI, background jobs, and multi-venue too early will slow the core loop.

Mitigation:

- Binance REST first
- low-level tools first
- operation scanner second
- other venues and streaming later

---

## 9. Non-goals until this phase is complete

Do not prioritize:

- full web app
- real order placement
- account balances or positions
- strategy automation
- WebSocket streams
- background alert jobs
- multi-user collaboration
- Polymarket execution
- Bitget/Bybit/OKX before Binance contract stability

---

## 10. Recommended first PR / first task slice

The first implementation slice should be small and safe:

```text
Add fetch/status and market-data contracts.
```

Files:

```text
packages/domain/src/fetch-status.ts
packages/domain/src/market-data.ts
packages/domain/src/index.ts
```

Validation:

```text
npm run typecheck
```

This gives the project a stable vocabulary before provider code, caching, tools, and smoke tests are added.

The second slice should add shared fetch/cache utilities.

The third slice should add the native TypeScript Binance public REST provider.

---

## 11. Decision summary

Prism's next step is not more chat behavior. It is not UI. It is not execution.

The next step is a trustworthy Information Plane:

```text
real Binance public market facts
  -> normalized Prism contracts
  -> efficient Prism tools
  -> Pi Agent orchestration
  -> OpportunityArtifact
```

Once this is stable, Prism can safely expand into multi-venue scanning, stronger artifact persistence, trade proposal generation, and eventually governed execution.
