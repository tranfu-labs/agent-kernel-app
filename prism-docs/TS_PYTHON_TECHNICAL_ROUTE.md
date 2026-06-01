# Prism TS Read Plane + Python Analytics Worker Technical Route

This document records the accepted technical route for Prism market data, analytics, and Pi Agent integration.

For network-resilient development and live exchange validation, also follow [`NETWORK_RESILIENT_MARKET_DATA_WORKFLOW.md`](./NETWORK_RESILIENT_MARKET_DATA_WORKFLOW.md).

The decision is:

```text
TypeScript owns the governed read plane and Prism tool boundary.
Python owns heavy numerical and time-series analytics.
```

Target architecture:

```text
Pi Agent
  -> TS Prism Tool
    -> TS ExchangeMarketDataService
      -> Binance / Bitget / Bybit / OKX REST
    -> TS AnalyticsTool wrapper
      -> Python analytics service / process
        -> pandas / numpy / TA-Lib
    -> OpportunityArtifact / EvidenceBundle
```

---

## 1. Executive decision

Prism should not become an all-TypeScript analytics system, and it should not move the primary realtime exchange read plane into Python.

Use this route:

1. **TypeScript read plane** for provider access, tool schemas, cache, status, evidence metadata, artifacts, and Pi Agent integration.
2. **Python analytics worker** for pandas/numpy/TA-Lib processing, feature engineering, indicators, rolling statistics, and scoring.
3. **Prism contracts between them** so Python consumes normalized market-data inputs and returns normalized analytics outputs.
4. **Prism materialization in TypeScript** so OpportunityArtifacts, EvidenceBundles, policies, and future execution proposals remain governed by Prism.

This is the default architecture for market-data-driven opportunity work.

---

## 2. North Star alignment

Prism's north star is:

```text
Information -> Energy -> Material
```

This technical route maps cleanly to those planes.

### Information

TypeScript provider and market-data tools fetch external facts:

- exchange markets
- funding rates
- tickers
- mark and index prices
- order book depth
- OHLCV series
- open interest
- source, provider, timestamp, status, freshness, warnings

The Information Plane must remain governed, structured, and auditable.

### Energy

The Energy Plane transforms facts into judgment:

- deterministic calculations in TypeScript where small and contract-oriented
- Python analytics worker for vectorized time-series and numerical workloads
- Pi Agent orchestration for selecting tools, comparing results, and explaining findings
- operations such as `scan_funding_opportunities` to avoid inefficient agent loops

### Material

TypeScript materializes durable product objects:

- EvidenceBundle
- OpportunityArtifact
- ResearchBrief
- future TradeProposalArtifact
- future RiskCheckResult and audit records

Python returns analytics results; Prism decides how to persist and govern them.

---

## 3. Why TypeScript remains the read plane

Realtime exchange data fetching is mostly I/O-bound. The bottlenecks are usually:

- exchange rate limits
- request weights
- endpoint selection
- network latency
- batching strategy
- cache TTLs
- in-flight request coalescing
- structured failure handling
- source and freshness metadata

TypeScript is well suited for this layer because Prism's runtime boundary is already TypeScript:

- Pi Agent tool registration
- tool input/output schemas
- domain contract exports
- artifact creation
- policy and confirmation gates
- package integration
- provider orchestration

The read plane must preserve these guarantees:

- all realtime financial facts come from tools
- no raw exchange response leaks to Pi Agent as the primary contract
- provider failures become structured statuses
- unsupported venues and symbols are explicit
- `provider`, `source`, `observedAt`, `fetchedAt`, `freshnessMs`, `status`, and `warnings` survive normalization
- cache and request coalescing are centralized

Therefore `packages/tools/src/exchanges/exchange-market-data-service.ts` is the right place for exchange market-data orchestration and normalization.

It must not become an analytics engine.

---

## 4. Why Python owns heavy analytics

Python is the right layer for data processing that depends on mature numerical and time-series ecosystems:

- pandas
- numpy
- TA-Lib
- pyarrow / parquet if needed later
- polars if needed later
- scipy / statsmodels if needed later

Use Python for:

- OHLCV dataframe construction
- rolling windows
- RSI / MACD / ATR / Bollinger Bands and other indicators
- volatility statistics
- funding-rate history analysis
- z-scores and percentiles
- basis and spread history
- correlation and regime features
- feature matrices
- cross-sectional ranking features
- research/backtest-oriented batch analytics

This avoids rebuilding a weaker dataframe and indicator stack in TypeScript.

---

## 5. Boundary rules

### 5.1 TypeScript owns

```text
packages/tools/src/exchanges/
  providers/
  exchange-market-data-service.ts
  get-exchange-markets.ts
  get-funding-rates.ts
  get-exchange-tickers.ts
  get-orderbook-depth.ts
  get-ohlcv-series.ts

packages/tools/src/analytics/
  python-analytics-client.ts
  calculate-technical-indicators.ts
  calculate-funding-statistics.ts
  rank-analytics-candidates.ts

packages/operations/src/
  scan-funding-opportunities.ts
```

Responsibilities:

- Pi Agent tool contracts
- TypeBox or equivalent schema boundaries
- provider routing
- symbol normalization
- cache and request coalescing
- request weight metadata
- timeout and structured status mapping
- domain contract normalization
- artifact and evidence materialization
- policy integration
- operation-level orchestration

### 5.2 Python owns

```text
python-services/analytics/
  prism_analytics/
    indicators.py
    funding.py
    basis.py
    volatility.py
    scoring.py
    schemas.py
```

Responsibilities:

- dataframe construction
- vectorized numerical computation
- TA-Lib indicator computation
- statistical features
- batch analytics
- analytics-specific validation
- returning normalized analytics results

### 5.3 Shared contract boundary

Python should consume Prism-normalized inputs, not arbitrary raw exchange JSON.

Good boundary:

```text
TS MarketDataBundle
  -> Python AnalyticsRequest
  -> Python AnalyticsResult
  -> TS EvidenceBundle / OpportunityArtifact
```

Avoid this boundary:

```text
Python script
  -> direct Binance calls
  -> ad-hoc dataframe
  -> unstructured text result
```

---

## 6. Should Python fetch data?

Python may fetch data only in limited, governed scenarios.

### Default realtime path: TypeScript fetches

Use TypeScript for:

- Pi Agent tool calls
- realtime opportunity scans
- funding-rate snapshots
- current tickers
- selected order book depth
- agent-visible OHLCV retrieval
- artifact-backed research flows

Reason:

- stable tool contracts
- unified provider metadata
- centralized cache and rate-limit discipline
- consistent source and status semantics
- easier Pi Agent integration
- safer governance path toward future execution

### Governed batch path: Python may fetch

Python may fetch data for offline or research pipelines when the analytics job owns a batch dataset lifecycle, for example:

- historical OHLCV backfill
- local parquet dataset construction
- offline indicator research
- backtest data preparation
- model feature generation

Even then, Python ingestion must preserve Prism semantics:

- public read-only data only unless a separate credential/governance design exists
- no account, position, order, transfer, leverage, margin, or execution endpoints
- normalized symbol semantics
- source/provider/fetchedAt metadata
- dataset versioning or metadata
- explicit failure status
- no direct trading side effects

Python batch ingestion must not become a second uncontrolled production read plane.

---

## 7. Initial implementation plan

### Phase A — Lock the TypeScript read plane

Complete provider-backed Binance public market-data tools:

1. Wire mock `get_funding_rates` to `ExchangeMarketDataService`.
2. Wire mock `get_orderbook_depth` to real depth snapshots and slippage estimates.
3. Add `get_exchange_markets`.
4. Add `get_exchange_tickers`.
5. Add fixture tests for normalization, cache, status mapping, and slippage.
6. Add a live read-only Binance smoke command.

Acceptance:

- Pi Agent can call provider-backed tools.
- Network failures return structured statuses.
- No private exchange endpoints are introduced.
- `npm run typecheck` passes.

### Phase B — Add OHLCV as normalized market data

Add public kline/OHLCV support through the TypeScript read plane:

1. Add domain contract for `OhlcvCandle` / `OhlcvSeries`.
2. Add Binance `GET /fapi/v1/klines` provider method.
3. Add service normalization and TTL discipline.
4. Add `get_ohlcv_series` tool.
5. Add fixtures and tests.

Acceptance:

- Python analytics can receive normalized OHLCV arrays from TS.
- Tool outputs include source, provider, timestamps, status, and warnings.

### Phase C — Create Python analytics worker

Create a small Python analytics service or subprocess interface.

Initial recommended mode: local subprocess or long-lived local service chosen by operational needs.

Start with these analytics capabilities:

1. `calculate_technical_indicators`
2. `calculate_funding_statistics`
3. `calculate_basis_statistics`
4. `score_opportunity_candidates`

Acceptance:

- Python receives explicit JSON requests.
- Python returns explicit JSON results.
- TypeScript validates responses at the tool boundary.
- Python exceptions become structured tool failures.

### Phase D — Add TS AnalyticsTool wrappers

Create TypeScript wrappers that expose Python analytics to Pi Agent safely:

```text
packages/tools/src/analytics/python-analytics-client.ts
packages/tools/src/analytics/calculate-technical-indicators.ts
packages/tools/src/analytics/calculate-funding-statistics.ts
```

The wrapper owns:

- request construction
- timeout
- subprocess/service call
- response validation
- status mapping
- warnings
- agent-facing schema

Acceptance:

- Pi Agent never calls Python directly.
- Python output is normalized before agent exposure.
- Analytics failures do not crash the agent runtime.

### Phase E — Operation-level opportunity scanner

Build `scan_funding_opportunities` as a product operation:

```text
funding + ticker coarse screen
  -> selected OHLCV/context fetch if needed
  -> Python analytics for statistics/features
  -> depth only for top candidates
  -> edge/slippage/risk ranking
  -> OpportunityArtifact / EvidenceBundle
```

Acceptance:

- Avoids inefficient agent for-loops.
- Produces artifact-backed opportunities.
- Separates facts, analytics, ranking, and materialization.

---

## 8. Python integration options

### Option 1 — Subprocess worker

Good for early development.

Pros:

- simple deployment
- no server lifecycle
- easy local smoke testing
- no network boundary

Cons:

- process startup overhead unless made long-lived
- less suitable for high-throughput jobs

Use for P0/P1 unless there is a clear need for a service.

### Option 2 — Local HTTP service

Good when analytics becomes long-lived and heavier.

Pros:

- lower per-call startup overhead
- easy health checks
- easier batching
- language boundary is explicit

Cons:

- service lifecycle management
- port/config management
- more operational surface

Use when analytics calls become frequent or slow.

### Option 3 — Queue/job worker

Good for batch research and historical processing.

Pros:

- robust for long jobs
- natural dataset lifecycle
- retry and scheduling friendly

Cons:

- more infrastructure
- not ideal for interactive Pi Agent calls

Use for offline research, backfills, and strategy datasets.

Recommended progression:

```text
subprocess wrapper -> local service -> queue worker when batch needs justify it
```

---

## 9. Safety rules

This route does not authorize trading execution.

Do not add:

- private API keys
- account balances
- positions
- open orders
- order placement
- cancellation
- transfers
- leverage or margin changes
- automatic execution

Future execution requires separate architecture covering:

- credentials
- permission model
- deterministic risk checks
- explicit confirmation
- dry-run defaults
- audit records
- kill switches

---

## 10. Non-drift checklist

Before adding market-data or analytics code, verify:

1. Is this realtime external fact acquisition? Put it in the TypeScript read plane.
2. Is this vectorized dataframe/statistical/indicator computation? Put it in Python analytics.
3. Is this a Pi Agent-callable product API? Expose it through a TypeScript tool wrapper.
4. Is this a product workflow? Put orchestration in an operation-level tool, not repeated agent loops.
5. Does the output need to persist? Materialize through Prism artifacts in TypeScript.
6. Does this touch account or execution data? Stop and create a separate governance design first.

---

## 11. Current technical route

The agreed route is:

```text
TS read plane + Python analytics worker
```

Use TypeScript for correctness, governance, and Pi Agent compatibility.

Use Python for numerical efficiency, mature financial analytics libraries, and long-term research velocity.

Keep `ExchangeMarketDataService` as the market-data service. Do not turn it into a pandas/TA-Lib substitute.
