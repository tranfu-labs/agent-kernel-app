# Prism MVP Funding-Basis Arbitrage Vertical Plan

This document defines the first MVP vertical under the Prism Opportunity Operating Core architecture.

The broad architecture is defined in [`PRISM_OPPORTUNITY_OPERATING_CORE_ARCHITECTURE.md`](./PRISM_OPPORTUNITY_OPERATING_CORE_ARCHITECTURE.md). This document narrows that architecture to the first useful product loop:

```text
Binance / Bitget funding-basis arbitrage discovery
read-only public market data
provider-backed facts
ranked OpportunityArtifacts
no real execution
```

## 1. Goal

Build a deterministic, provider-backed multi-exchange funding/basis opportunity scanner that can:

1. fetch normalized public market data from Binance and Bitget;
2. compare the same linear perpetual instrument across venues;
3. detect funding, basis, price, liquidity, and timing discrepancies;
4. rank opportunities using deterministic scoring;
5. materialize evidence-linked OpportunityArtifacts;
6. let Pi Agent explain the result without inventing facts;
7. prepare the path to future paper TradeProposal and RiskAssessment objects.

The MVP validates Prism's opportunity operating core through one narrow vertical:

```text
Evidence -> MarketContext -> Comparison -> Signal -> Opportunity -> Score -> Artifact
```

Proposal, risk, and execution are part of the long-term architecture but are not required for the first read-only MVP loop.

---

## 2. Non-goals

This MVP must not include:

- private exchange API keys;
- account balances;
- positions;
- open orders;
- order placement;
- order cancellation;
- leverage or margin changes;
- automatic trading;
- WebSocket streaming;
- full Web UI;
- full prediction-market implementation;
- LangGraph, OpenHands, Event Bus, or graph database infrastructure.

The scanner may produce execution-ready context and future proposal inputs, but it must not execute.

---

## 3. Relationship to the Opportunity Operating Core

The shared Prism core is:

```text
Evidence -> MarketContext -> Comparison -> Signal -> Opportunity -> Score -> Artifact -> Proposal -> Risk
```

This MVP implements the first seven steps for multi-exchange arbitrage:

| Core concept | MVP form |
| --- | --- |
| Evidence | Binance and Bitget funding, ticker, depth, market specs, provider status |
| MarketContext | ExchangeMarketContext per venue / symbol |
| Comparison | CrossVenueComparison for a symbol across Binance and Bitget |
| Signal | Funding divergence, basis spread, price dislocation, liquidity imbalance, funding-time mismatch |
| Opportunity | Funding-rate arbitrage or cross-exchange basis candidate with venue pair and candidate legs |
| Score | Deterministic arbitrage score with edge, liquidity, freshness, timing, and risk dimensions |
| Artifact | ArbitrageOpportunityReport / OpportunityArtifact with lineage |

---

## 4. User stories

### Story 1 — Discover opportunities

User asks:

```text
帮我找 Binance / Bitget 上 BTC、ETH、SOL 有没有合约套利机会。
```

Prism should:

1. map the intent to `scan_funding_basis_arbitrage`;
2. fetch Binance and Bitget public market facts;
3. build normalized market contexts;
4. compare venues by symbol;
5. rank candidates;
6. fetch depth for top candidates on both venues;
7. produce opportunities and artifacts;
8. explain results with evidence references and warnings.

### Story 2 — Explain an opportunity

User asks:

```text
解释第一个机会为什么值得看。
```

Prism should:

1. load the saved OpportunityArtifact;
2. show funding, basis, depth, fees, slippage, timing, freshness, and risk flags;
3. distinguish provider facts from assumptions;
4. recommend a next research or proposal step without executing.

### Story 3 — Prepare future proposal context, no execution

User asks:

```text
如果要做这个机会，执行方案大概是什么？
```

Prism may draft a paper proposal shape later, but MVP behavior should remain read-only. It should explain likely long/short direction, assumptions, and required risk checks without placing orders.

---

## 5. Domain contract deltas

The current domain contracts already include market data, Evidence, Opportunity, Artifact, TradeProposal, and RiskCheckResult. This MVP needs additional contracts or extensions.

## 5.1 ExchangeMarketContext

Use or extend the existing `MarketContext` shape for a single venue/symbol:

```text
venue
marketType
symbol
market
funding
ticker
openInterest
depth
status
warnings
fetchedAt
```

Rules:

1. Provider raw payloads must not leak into this object.
2. Each field must preserve provider status and warnings where applicable.
3. Missing fields must be explicit; they must not be filled by LLM prose.

## 5.2 CrossVenueComparison

A first-class comparison object for the same symbol across two venues.

Required fields:

```text
id
symbol
marketType
venues
legs: ExchangeMarketContext[]
fundingDiffBps
basisBps
markPriceDiffBps
bidAskSpreadBps
nextFundingTimeDeltaMs
freshnessStatus
status
warnings
fetchedAt
```

Rules:

1. It compares normalized contexts, not raw exchange responses.
2. It should preserve both venue-level warnings and comparison-level warnings.
3. It should be created before signals and opportunities.

## 5.3 Signal

A structured arbitrage signal derived from comparison.

P0 signal types:

```text
cross_venue_funding_divergence
cross_venue_basis_spread
cross_venue_price_dislocation
funding_time_mismatch
liquidity_imbalance
provider_data_gap
```

Required fields:

```text
id
type
symbol
venues
comparisonId
evidenceBundleId
longVenue?
shortVenue?
grossEdgeBps?
netEdgeBps?
strength
observedAt
summary
warnings
```

## 5.4 OpportunityLeg

Opportunity should express candidate legs before a TradeProposal exists.

Required fields:

```text
venue
symbol
marketType
side: long | short | buy | sell
role: entry | hedge | reference
price?
fundingRate?
```

Rules:

1. Opportunity legs are not orders.
2. They express candidate structure and direction.
3. TradeProposal later converts candidate legs into executable legs only after risk and confirmation gates.

## 5.5 OpportunityScore

P0 score dimensions:

```text
totalScore
confidence
edgeScore
liquidityScore
freshnessScore
fundingAlignmentScore
venueReliabilityScore
riskScore
evidenceScore
scoringVersion
scoredAt
explanation
```

Rules:

1. Scores are deterministic-first.
2. Pi Agent may explain scores but should not be the scoring authority.
3. Score formulas must be versioned and testable.

## 5.6 Artifact lineage

Opportunity artifacts should preserve lineage:

```text
operationId
objectIds
evidenceBundleIds
marketContextIds
comparisonIds
signalIds
opportunityIds
parentArtifactIds
createdBy
```

This is required so future workspace, memory, research, and proposal flows can trace where a report came from.

---

## 6. Provider and tool contracts

## 6.1 Exchange provider model

The tool layer should expose stable Prism tools while provider implementations remain internal:

```text
Prism Tool
  -> ExchangeMarketDataService
    -> Binance USDⓈ-M Futures provider
    -> Bitget USDT Futures provider
```

P0 provider requirements:

- exchange markets / instrument specs;
- funding rates and next funding time;
- mark/index prices where available;
- ticker bid/ask and 24h quote volume;
- selected order book depth;
- structured statuses and warnings.

## 6.2 Public tools

The MVP should use or extend these tool boundaries:

```text
get_exchange_markets
get_funding_rates
get_exchange_tickers
get_orderbook_depth
get_market_context
scan_funding_basis_arbitrage
```

Do not expose provider-specific raw tools to Pi Agent.

## 6.3 Bitget provider scope

Bitget support should be added only for public read-plane data required by the MVP:

```text
USDT perpetual markets
funding / next funding time
mark/index or best available equivalent prices
ticker bid/ask / volume
order book depth
```

If an endpoint is unavailable, region-blocked, rate-limited, or semantically different from Binance, the provider must return structured status and warnings.

---

## 7. Operation contract

## 7.1 Operation name

The MVP operation should be:

```text
scan_funding_basis_arbitrage
```

It may replace or wrap the older `funding_opportunity_scan` path. The older scanner can remain as a compatibility or internal helper, but the product MVP should use the cross-venue operation semantics.

## 7.2 Input

```ts
interface ScanFundingBasisArbitrageInput {
  venues: ["binance", "bitget"];
  symbols: string[];
  marketType: "linear_perp";
  targetNotionalUsd: number;
  maxCandidatesForDepth?: number;
  feeEstimateBpsByVenue?: Partial<Record<string, number>>;
  minQuoteVolume24hUsd?: number;
  fundingHistoryLimit?: number;
  requireSynchronizedFundingWindow?: boolean;
  saveArtifacts?: boolean;
}
```

## 7.3 Output

```ts
interface ScanFundingBasisArbitrageOutput {
  evidenceBundle: EvidenceBundle;
  marketContexts: ExchangeMarketContext[];
  comparisons: CrossVenueComparison[];
  signals: Signal[];
  opportunities: Opportunity[];
  scores: OpportunityScore[];
  artifactIds: string[];
  status: FetchStatus;
  warnings: string[];
  summary: string;
}
```

## 7.4 Operation rules

1. The operation is read-only.
2. It must not call private exchange APIs.
3. It must not place orders.
4. It should coarse-rank before fetching expensive depth.
5. It should fetch depth for both venues for selected candidates.
6. It should score using worst-side liquidity and venue freshness.
7. It should produce artifacts only after comparisons, signals, and scores are available.
8. It should degrade explicitly when one venue is unavailable.

---

## 8. Data flow

```text
1. Normalize requested venues and symbols.
2. Fetch market specs from Binance and Bitget.
3. Resolve comparable instruments.
4. Fetch funding rates and tickers for both venues.
5. Build ExchangeMarketContext for each venue/symbol.
6. Build CrossVenueComparison for each comparable symbol.
7. Coarse-rank by funding difference, basis, volume, freshness, and warnings.
8. Fetch order book depth for top candidates on both venues.
9. Rebuild or enrich comparisons with depth-derived liquidity and slippage.
10. Derive arbitrage signals.
11. Create opportunities with candidate legs.
12. Score opportunities.
13. Save OpportunityArtifacts / ArbitrageOpportunityReports.
14. Let Pi Agent explain the ranked result using generated objects.
```

---

## 9. Artifact and report shape

Each saved opportunity artifact should include:

```text
symbol
venuePair
candidate long/short direction
funding rates by venue
next funding times by venue
mark/index prices by venue
basis / spread metrics
bid/ask and depth summary by venue
fee and slippage assumptions
net edge estimate
score breakdown
risk flags
provider status and warnings
evidence summary
comparison ids
signal ids
created operation id
```

The report should clearly separate:

```text
provider facts
calculated metrics
assumptions
agent explanation
missing data / warnings
```

---

## 10. Risk and non-execution boundary

MVP risk behavior:

1. No private credentials.
2. No account state.
3. No real orders.
4. No leverage or margin mutation.
5. No recommendation that implies execution is authorized.
6. Any future proposal must remain `draft`, `paper`, or `pending_risk_check` until policy and confirmation foundations exist.

Risk flags should include:

```text
venue_unavailable
funding_time_mismatch
depth_not_evaluated
liquidity_insufficient
quote_volume_unavailable
provider_warning
non_positive_net_edge
one_sided_data_gap
fee_assumption_only
```

---

## 11. Test and smoke plan

## 11.1 Unit tests

Contract and deterministic tests should cover:

- symbol normalization;
- cross-venue comparison math;
- funding difference and basis calculations;
- funding time alignment;
- worst-side liquidity scoring;
- warning aggregation;
- opportunity leg direction;
- artifact lineage generation;
- no execution tools are called.

## 11.2 Fixture tests

Use local fixtures for Binance and Bitget responses so tests do not depend on live exchange availability.

## 11.3 Live smoke tests

Live smoke should be read-only and network-resilient:

```text
smoke:funding-basis-arbitrage
```

It should pass with either:

- provider-backed opportunities and artifacts; or
- explicit structured provider-unavailable statuses.

It must not fail merely because a local network cannot reach an exchange endpoint, as long as degradation is structured.

---

## 12. Implementation sequence

## Phase 1 — Domain and operation contracts

Add or extend contracts for:

```text
ExchangeMarketContext
CrossVenueComparison
Signal
OpportunityLeg
OpportunityScore
Artifact lineage
ScanFundingBasisArbitrageInput / Output
```

Acceptance:

- typecheck passes;
- existing Binance scanner tests still pass;
- no provider behavior changes yet.

## Phase 2 — Bitget public provider

Add Bitget public read-plane support for:

```text
markets
funding
tickers
order book depth
```

Acceptance:

- fixture tests cover normalization and structured failures;
- live smoke can report ok, partial, or provider-unavailable status.

## Phase 3 — Cross-venue comparison and scoring

Implement:

```text
CrossVenueComparison builder
arbitrage signal derivation
OpportunityScore funding-basis v1
coarse ranking
selected depth refinement
```

Acceptance:

- deterministic unit tests cover edge, basis, timing, liquidity, warnings, and scores.

## Phase 4 — Operation and artifact materialization

Implement:

```text
scan_funding_basis_arbitrage
ArbitrageOpportunityReport / OpportunityArtifact
artifact lineage
```

Acceptance:

- smoke operation returns evidence, contexts, comparisons, signals, opportunities, scores, artifact ids, warnings, and summary.

## Phase 5 — Pi Agent integration

Update:

```text
Prism tool registration
funding-rate-arbitrage skill behavior
agent-api smoke script
```

Acceptance:

- user-facing flow can ask for Binance/Bitget opportunities;
- Pi Agent explains generated objects;
- all realtime facts come from tools;
- no execution path is exposed.

---

## 13. Documentation updates

This spec should become the current implementation entrypoint for the first MVP vertical.

Related docs:

- [`PRISM_OPPORTUNITY_OPERATING_CORE_ARCHITECTURE.md`](./PRISM_OPPORTUNITY_OPERATING_CORE_ARCHITECTURE.md) defines the broad opportunity operating core.
- [`MVP_AGENT_KERNEL_PLAN.md`](./MVP_AGENT_KERNEL_PLAN.md) defines the Pi Agent Kernel MVP framing.
- [`NEXT_IMPLEMENTATION_PLAN.md`](./NEXT_IMPLEMENTATION_PLAN.md) records the previous Binance-first read-plane plan and should defer to this document for the cross-venue MVP path.
- [`DOMAIN_CONTRACTS.md`](./DOMAIN_CONTRACTS.md) and [`TOOL_INVENTORY.md`](./TOOL_INVENTORY.md) should be updated as contracts are implemented.
