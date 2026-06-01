# Design: Binance/Bitget Read-Plane Parity and Tool Contracts

## Task Classification

Level: 3 — architecture-sensitive.

This change affects market-data read-plane behavior, provider boundaries, Pi Agent tool contracts, operation workflows, artifact lineage, and no-execution safety. It therefore requires OpenSpec, Superpowers-style alternatives/planning, critic review, rebuttal decisions, a systematic test matrix, implementation in small slices, and evaluator-style verification.

## Architecture

```text
Provider adapters
  -> ExchangeMarketDataService
  -> normalized MarketContext[]
  -> read-only Prism tool wrappers
  -> scanFundingBasisArbitrage()
  -> Comparison / Signal / Opportunity / Score
  -> OpportunityArtifact / report
```

Responsibilities stay separated:

- Provider adapters fetch public exchange facts and return structured provider results.
- `ExchangeMarketDataService` normalizes provider data into Prism domain facts and aggregates status/warnings.
- Tool wrappers expose high-level read-only Prism contracts, not raw exchange endpoint shapes.
- `@agentkernel/operations` consumes normalized `MarketContext[]` and owns comparison/scoring/artifact logic.
- Pi Agent explains returned facts and artifacts but does not fabricate market facts.

## Common Minimum MarketContext

Funding-basis MVP requires both Binance and Bitget to provide the same minimum context for a venue/symbol:

```text
market:
  venue
  marketType
  symbol
  venueSymbol
  status

ticker:
  markPrice or lastPrice
  bidPrice / askPrice when available
  observedAt
  provider
  source
  status
  warnings

funding.current:
  fundingRate
  nextFundingTime when available
  observedAt
  provider
  source
  status
  warnings

depth:
  notionalUsd
  bidSlippageBps
  askSlippageBps
  bidFillable
  askFillable
  liquidityStatus
  observedAt
  provider
  source
  status
  warnings

context:
  status
  warnings
  fetchedAt
```

Binance may provide richer context such as funding history and open interest. Bitget does not need to match those richer fields for this MVP. The parity requirement is the common minimum, not identical provider feature breadth.

## Read-Only Tool Surface

The MVP tool surface should stay small and product-oriented:

```text
get_exchange_markets
get_exchange_tickers
get_funding_rates
get_orderbook_depth
get_market_context
scan_funding_basis_arbitrage
```

Tool behavior requirements:

- Inputs accept Prism concepts: venue, market type, symbol, include flags, notional.
- Outputs return Prism domain contracts with status and warnings.
- Unsupported venues or market types return structured unsupported status.
- Provider failures return failed/partial/rate_limited/geo_blocked statuses where applicable.
- No tool accepts API keys or private credentials.
- No tool exposes account, balance, position, order, leverage, margin, transfer, withdrawal, or execution capability.

## Funding-Basis Workflow

The full workflow should be:

```text
scan_funding_basis_arbitrage input
  -> for each venue/symbol, call contextProvider.getMarketContext
  -> contextProvider uses ExchangeMarketDataService.getMarketContext
  -> scanFundingBasisArbitrage calls evaluateFundingBasisContexts
  -> evaluateFundingBasisContexts builds comparisons
  -> comparisons with current funding facts derive signals
  -> opportunities are scored and sorted
  -> artifacts are saved only when opportunities exist and saveArtifacts=true
```

Missing current funding is a hard eligibility failure for opportunities:

```text
comparison may exist
signal must not exist
opportunity must not exist
artifact must not exist
warning must exist
```

Missing depth is not a hard eligibility failure, but liquidity/scoring must degrade through status, warnings, or lower confidence rather than fabricated slippage.

## Provider Boundary

`@agentkernel/operations` must not import `@agentkernel/tools`.

Allowed dependency direction:

```text
apps/agent-api or tool wrappers
  -> @agentkernel/tools
  -> @agentkernel/domain

apps/agent-api or operation smoke
  -> @agentkernel/operations
  -> @agentkernel/domain
```

Disallowed:

```text
@agentkernel/operations -> @agentkernel/tools
@agentkernel/domain -> provider-specific payloads
Pi Agent -> raw Binance/Bitget endpoint methods
```

## Rebuttal / Decision Log

### Critic Finding 1: Scope may drift into broad Binance expansion

Decision: accept.

This slice explicitly excludes market series, positioning ratios, and microstructure. Those remain in `expand-binance-public-market-data-coverage` for later.

### Critic Finding 2: Agent integration before tool contract parity could freeze weak contracts

Decision: accept.

This slice completes tool/read-plane contract tests before registering broader Pi Agent behavior.

### Critic Finding 3: ExchangeMarketDataService may become an analytics engine

Decision: accept.

Service responsibilities stay limited to fetching, normalization, cache, status aggregation, and safe composition. Comparison, scoring, and opportunity generation remain in `@agentkernel/operations`.

### Critic Finding 4: Provider failures could still fabricate opportunities

Decision: accept.

Tests must prove missing `funding.current` on either venue produces no signal, opportunity, or artifact.

### Critic Finding 5: Live provider smoke may fail because of local network restrictions

Decision: accept with constraint.

Live smoke may return `partial`, `failed`, `timeout`, or `geo_blocked`. The acceptance criterion is structured degradation and no fabricated facts, not guaranteed live opportunity creation.

## Implementation Slices

### Slice 1: OpenSpec and test matrix

Create this OpenSpec change with proposal, design, tasks, critic, and test matrix.

### Slice 2: Deterministic parity tests

Add tests proving Binance and Bitget normalized contexts both satisfy funding-basis MVP inputs.

### Slice 3: Tool contract hardening tests

Add or update tests/smokes for read-only market-data wrappers and funding-basis scanner output shape.

### Slice 4: Minimal implementation fixes

Only fix issues discovered by tests. Do not add broad provider endpoints.

### Slice 5: Verification and evaluator pass

Run package tests, typecheck, provider-backed smoke, safety scan, and architecture lens verification.
