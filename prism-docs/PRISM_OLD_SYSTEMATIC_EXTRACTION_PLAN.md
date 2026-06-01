# Prism_old Systematic Extraction Plan

This document defines how to extract capabilities from `/Users/griffith/Projects/Prism_old` into the new Pi Agent Kernel based Prism safely, efficiently, and completely.

## 1. Current finding summary

### 1.1 New Prism current architecture

New Prism already has the foundation for the Information / Energy / Material architecture:

```text
apps/agent-api                 # Pi Agent API/smoke bridge
apps/web                       # future workspace-first UI
packages/agent-kernel          # Pi SDK adapter + Prism custom tools
packages/domain                # material-plane contracts
packages/tools                 # deterministic information/opportunity tools
packages/operations            # product operation semantics
packages/policies              # risk / permission / confirmation policies
packages/storage               # material persistence abstraction
packages/pi-package            # direct Pi user package
packages/skills                # product runtime skills
legacy-adapters/prism-old      # bridge to selected Prism_old capabilities
```

Current runnable checks:

```bash
npm run typecheck
npm run smoke:pi
npm run smoke:funding
```

Current status:

- `smoke:pi` proves Prism can invoke Pi Agent.
- `smoke:funding` proves Pi Agent can call Prism mock tools and materialize an OpportunityArtifact.

### 1.2 Prism_old relevant architecture

`Prism_old` has valuable assets in:

```text
piea-backend/app/datasources/
piea-backend/app/polymarket/
piea-backend/app/analyzers/
piea-backend/app/models/
piea-backend/app/agent/actions/
piea-backend/app/orchestration/workflow/
piea-backend/tests/
```

High-value old components discovered:

1. `app/datasources/README.md`
   - strong L1/L2/L3 data-source layering rules
   - `AdapterFetchResult[T]` + `FetchStatus` semantics
   - geo-block degradation model
   - adapter boundary checklist

2. `app/datasources/_common/fetch_envelope.py`
   - safe fetch envelope pattern
   - no bare exceptions to agent layer
   - status reasons: `ok`, `partial`, `failed`, `skipped`, `geo_blocked`, `timeout`, etc.

3. `app/datasources/exchanges/native/contracts.py`
   - canonical exchange contracts
   - symbol helpers
   - native ticker/funding/orderbook models

4. `app/datasources/exchanges/native/registry.py`
   - venue dispatch pattern
   - product-lane adapters
   - funding/ticker/orderbook adapter registry

5. `app/datasources/exchanges/native/binance_usds_futures.py`
   - Binance USDⓈ-M futures SDK-backed reader
   - fallback path
   - ticker/funding/orderbook/instrument spec patterns

6. `tests/test_cross_venue_funding_opportunity_scan.py`
   - vertical slice for cross-venue funding opportunity scan
   - old workflow idea worth mining, not directly migrating

Important note:

- Current visible source includes Binance / Bybit / OKX native adapters.
- Bitget source files were visible only as `__pycache__` artifacts during inspection, not as current `.py` source files. For the first real extraction, use Binance/Bybit from Prism_old or implement a new Bitget connector in new Prism. Do not pretend Bitget source exists if the source file is absent.

---

## 2. Extraction north star

Extraction must preserve the Prism I/E/M architecture:

```text
Information -> Energy -> Material
```

Extraction target:

- information from provider-backed tools
- energy from Pi Agent + skills + operations + policies
- material from domain objects and artifact stores

Do not extract old accidental runtime complexity.

---

## 3. Extraction principles

## 3.1 Safe

Safety means:

1. No real trading execution during extraction.
2. No API keys embedded in code.
3. No account/balance/order tools until policy gates exist.
4. No tool should expose raw provider SDK shapes directly to the agent.
5. Every provider fact must carry source/timestamp/freshness/status.
6. Network/provider failures must become structured status, not thrown exceptions to the LLM.
7. Geo-block / unavailable provider must degrade as `skipped`, not fake data.

## 3.2 Efficient

Efficiency means:

1. Wrap first, port later.
2. Extract only the slice needed for the current MVP.
3. Preserve old test knowledge but do not migrate old test harness wholesale.
4. Keep tool interfaces stable while swapping mock -> wrapper -> native implementation.
5. Do not rebuild Prism_old runtime in TypeScript.

## 3.3 Complete

Completeness means each extracted capability includes:

1. domain contract
2. tool contract
3. tool implementation
4. status/error model
5. artifact or operation output
6. smoke/test fixture
7. documentation entry
8. safety classification

A capability is not considered extracted if it is only copied as code.

---

## 4. What to extract first

## 4.1 P0: Funding / basis scanner path

Binance-specific read-plane architecture is defined in [`BINANCE_MARKET_DATA_READ_PLANE.md`](./BINANCE_MARKET_DATA_READ_PLANE.md). Use that document as the contract-first implementation guide for provider-backed, efficient, safe Binance public market data.

Goal:

```text
real or wrapper funding/ticker/orderbook facts
  -> Pi Agent tool orchestration
  -> funding edge calculation
  -> OpportunityArtifact
```

Target tools:

```text
get_exchange_markets
get_funding_rates
get_exchange_tickers
get_orderbook_depth
calculate_funding_edge
calculate_slippage
rank_opportunities
save_opportunity_artifact
```

Old sources:

```text
Prism_old/piea-backend/app/datasources/_common/fetch_envelope.py
Prism_old/piea-backend/app/datasources/exchanges/native/contracts.py
Prism_old/piea-backend/app/datasources/exchanges/native/registry.py
Prism_old/piea-backend/app/datasources/exchanges/native/binance_usds_futures.py
Prism_old/piea-backend/app/datasources/exchanges/native/bybit.py
Prism_old/piea-backend/app/datasources/exchanges/native/bybit_linear.py
Prism_old/piea-backend/tests/datasources/test_native_product_lanes.py
Prism_old/piea-backend/tests/test_cross_venue_funding_opportunity_scan.py
```

New targets:

```text
packages/domain/src/evidence.ts
packages/domain/src/opportunity.ts
packages/tools/src/exchanges/
packages/tools/src/opportunities/
packages/storage/src/
packages/agent-kernel/src/register-prism-tools.ts
legacy-adapters/prism-old/src/
```

Extraction mode:

```text
adapter pattern + selective port
```

Do not import Python directly into TypeScript runtime unless through a stable API/process boundary.

---

## 4.2 P0: Fetch envelope semantics

Old source:

```text
app/datasources/_common/fetch_envelope.py
app/models/research_action_contracts.py::FetchStatus
```

New target:

```text
packages/domain/src/fetch-status.ts
packages/tools/src/shared/fetch-envelope.ts
```

Needed concepts:

```text
FetchStatus
AdapterFetchResult<T>
source
payload
status
elapsedMs
servedAt
reason
```

Why first:

The new Prism tools currently return mock data without a proper fetch envelope. Before wrapping real providers, we need the envelope to avoid unsafe exception/prose failures.

---

## 4.3 P0: Exchange canonical contracts

Old source:

```text
app/datasources/exchanges/native/contracts.py
```

New target:

```text
packages/domain/src/market-data.ts
packages/tools/src/exchanges/symbols.ts
```

Extract concepts:

- supported venues
- product types
- canonical symbol
- venue symbol helpers
- funding snapshot
- ticker detail
- best bid/ask
- orderbook depth snapshot
- instrument spec

Do not copy Pydantic models directly. Translate to TypeScript contracts with minimal fields needed by the MVP.

---

## 4.4 P1: Polymarket readers

Old sources:

```text
app/polymarket/gamma.py
app/polymarket/clob.py
app/polymarket/clob_timeseries.py
app/polymarket/data.py
```

New target:

```text
packages/tools/src/polymarket/
packages/domain/src/polymarket.ts
```

Extraction mode:

```text
wrapper first, native TypeScript later
```

---

## 4.5 P1: Wallet engine

Old sources:

```text
app/polymarket/wallet_engine/
```

New target:

```text
packages/tools/src/wallet/
packages/domain/src/wallet.ts
packages/skills/wallet-smart-money-analysis/
```

Extraction mode:

```text
document + wrap core scoring first
```

---

## 4.6 P1: Analyzers

Old sources:

```text
app/analyzers/
app/analyzers/metrics/
```

New target:

```text
packages/tools/src/analytics/
packages/tools/src/opportunities/
```

Extract only pure calculations:

- liquidity math
- volatility/trend math
- open interest metrics
- series math

Avoid old workflow/presentation coupling.

---

## 5. What not to extract

Do not extract directly:

```text
app/services/chat_service.py
app/orchestration/session_router-style glue
old intent routing rules
old RuntimeActionRegistry as product engine
old OperationCatalog static action lists
old presentation summaries as business logic
old permission placeholders without enforcement
```

Reason:

These are mostly Prism_old's accidental complexity. New Prism uses Pi Agent Kernel and explicit domain/operation/policy layers.

---

## 6. Extraction workflow

Every extraction must follow this workflow.

### Step 1 — Inventory

Create an entry in:

```text
prism-docs/EXTRACTION_LOG.md
```

Use template:

```text
Name:
Category:
Old source path:
New target path:
Why useful:
Migration mode: wrap | port | rewrite | document only
Information/Energy/Material plane:
Runtime risk:
Trading risk:
Tests/fixtures available:
Validation command:
Next step:
```

### Step 2 — Contract first

Before moving implementation, define or update:

```text
packages/domain/src/*
packages/tools/src/* input/output types
```

### Step 3 — Mock-preserving implementation

Keep existing smoke tests passing while replacing internals.

```text
mock -> wrapper -> native implementation
```

The public tool contract should not change if the implementation changes.

### Step 4 — Structured status

All provider wrappers must return structured status:

```text
ok
partial
failed
skipped
```

Do not throw raw provider exceptions to Pi Agent.

### Step 5 — Smoke/test

Each extraction must add or preserve one of:

```text
npm run smoke:funding
package-local unit test
fixture-based test
```

### Step 6 — Documentation update

Update the relevant inventory:

```text
TOOL_INVENTORY.md
SKILL_INVENTORY.md
DOMAIN_CONTRACTS.md
EXTRACTION_LOG.md
```

---

## 7. Safety classification

### Read-only public market data

Examples:

- funding rates
- ticker
- orderbook
- public Polymarket market data

Risk level: low

Allowed now: yes

### Account read data

Examples:

- balances
- positions
- open orders

Risk level: medium

Allowed now: no, until credential vault and permission model exist.

### Proposal generation

Examples:

- TradeProposal
- simulation
- sizing suggestion

Risk level: medium

Allowed after deterministic risk policy foundation.

### Real execution

Examples:

- place order
- cancel order
- close position

Risk level: high

Allowed now: no.

Required before enabling:

- credential vault
- dry-run default
- risk check
- explicit confirmation
- kill switch
- audit event
- max notional policy

---

## 8. Recommended next extraction slice

Do this next:

### Slice A — Fetch envelope + market data contracts

Create:

```text
packages/domain/src/fetch-status.ts
packages/domain/src/market-data.ts
packages/tools/src/shared/fetch-envelope.ts
```

Use old references:

```text
Prism_old/piea-backend/app/datasources/_common/fetch_envelope.py
Prism_old/piea-backend/app/datasources/exchanges/native/contracts.py
```

Validation:

```bash
npm run typecheck
npm run smoke:funding
```

### Slice B — Replace mock funding with adapter-shaped mock

Modify:

```text
packages/tools/src/exchanges/get-funding-rates.ts
```

Return structured envelope/status fields.

### Slice C — Add Prism_old adapter boundary

Create:

```text
legacy-adapters/prism-old/src/market-data.ts
```

At first, this can document/process-call strategy without invoking Python yet.

---

## 9. Long-term extraction map

| Area | Priority | Old source | New target | Mode |
|---|---:|---|---|---|
| Fetch envelope | P0 | `_common/fetch_envelope.py` | `packages/tools/src/shared` | port concept |
| Market data contracts | P0 | `native/contracts.py` | `packages/domain/src/market-data.ts` | translate |
| Binance funding/ticker/orderbook | P0 | `native/binance_usds_futures.py` | `packages/tools/src/exchanges` | wrapper/port |
| Bybit funding/ticker/orderbook | P0/P1 | `native/bybit.py`, `bybit_linear.py` | `packages/tools/src/exchanges` | wrapper/port |
| Bitget connector | P0/P1 | source absent in current tree | new implementation | build |
| Funding scan workflow | P0 | workflow test + market_tasks | `packages/operations` | extract lesson |
| Polymarket market data | P1 | `polymarket/*.py` | `packages/tools/src/polymarket` | wrapper/port |
| Wallet engine | P1 | `polymarket/wallet_engine` | `packages/tools/src/wallet` | wrap/port |
| Analyzers | P1 | `analyzers/*` | `packages/tools/src/analytics` | port pure funcs |
| Old session/router | P3 | `services`, `orchestration` | docs only | lesson |

---

## 10. One-sentence rule

> Extract provider-backed facts, pure calculations, domain contracts, prompts, skills, tests, and architecture lessons from Prism_old; do not extract its old runtime engine or accidental orchestration complexity.
