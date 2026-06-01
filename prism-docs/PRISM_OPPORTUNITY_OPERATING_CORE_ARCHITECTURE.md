# Prism Opportunity Operating Core Architecture

This document records the architecture consensus for Prism's opportunity operating core.

## 1. Architecture decision

Prism is not only a funding scanner, prediction-market scanner, chat assistant, or trading bot.

Prism is a financial opportunity operating system:

```text
Real-world information
  -> normalized evidence and market context
  -> comparison and signal detection
  -> opportunity scoring and ranking
  -> research artifacts, monitoring, and signals
  -> action proposals
  -> governed execution readiness
```

Prism must always preserve the distinction between:

- **signal**: something changed or is worth attention now;
- **opportunity**: a lifecycle-managed candidate worth deeper evaluation;
- **proposal**: a read-only recommendation of what action may be worth considering;
- **execution**: a separately governed future stage.

This architecture must support at least two flagship verticals:

1. **Multi-exchange arbitrage** — gather prices, funding rates, depth, fees, and related exchange facts across venues such as Binance and Bitget; detect funding/basis opportunities; produce reports and future execution proposals.
2. **Prediction-market mispricing** — gather fast and trustworthy real-world information, compare it with Polymarket market state and implied probabilities, detect mispricing or information lag, and produce research reports and future proposals.

The architecture should be broad enough for both verticals, while the first MVP remains narrow: **Binance / Bitget funding-basis opportunity discovery, read-only, no execution**.

---

## 2. North-star alignment

Prism's north star remains:

```text
Information -> Energy -> Material
```

The opportunity operating core maps to this as follows:

### Information

External facts enter through governed connectors and tools:

- exchange prices, funding rates, order books, contract specs, volume, open interest;
- Polymarket event, market, outcome, price, CLOB, liquidity, and resolution-rule data;
- official sources, news, web pages, video transcripts, social signals, wallet/on-chain data.

All realtime financial facts must come from tools. LLM prose must not invent facts.

### Energy

Prism turns facts into judgment through operations, comparisons, signals, scoring, and agent-assisted synthesis:

- intent routing maps user requests to Prism operations;
- comparison engines detect market discrepancies;
- signal engines turn discrepancies into structured signals;
- opportunity engines score, rank, deduplicate, and lifecycle opportunities;
- Pi Agent explains, synthesizes, and drafts research using evidence-bound context.

### Material

Important outputs become durable product objects:

- EvidenceBundle;
- MarketContext;
- Comparison;
- Signal;
- Opportunity;
- OpportunityScore;
- ResearchArtifact;
- ActionProposal / TradeProposal;
- RiskAssessment;
- WatchPlan, ExecutionTicket, ExecutionReceipt, and Review later.

Chat text is not enough.

---

## 3. Core architecture

The product flow is:

```text
User / Workspace
  -> Intent Router
  -> Operation Layer
  -> Opportunity Operating Core
  -> Pi Agent Runtime, when reasoning or synthesis is needed
  -> Tool / Connector Layer
  -> Storage / Memory / Audit
```

The operating core is:

```text
Evidence
  -> MarketContext
  -> Comparison
  -> Signal
  -> Opportunity
  -> Score
  -> Artifact
  -> Proposal
  -> Risk
```

This is the shared core for both exchange arbitrage and prediction-market mispricing.

---

## 4. Core abstractions

## 4.1 ResearchObject

A ResearchObject is anything Prism can study or act around.

Examples:

- token;
- instrument;
- venue;
- strategy;
- theme;
- event;
- claim;
- outcome;
- market;
- wallet;
- opportunity.

For exchange arbitrage, ResearchObjects include symbols, venues, instruments, and strategies. For prediction markets, they include real-world events, claims, outcomes, Polymarket markets, and information sources.

## 4.2 EvidenceBundle

EvidenceBundle is the source-of-truth package behind analysis and opportunities.

It should preserve:

- source and provider;
- observed time and fetched time;
- freshness;
- trust level;
- status and warnings;
- coverage, gaps, and conflicts.

Exchange evidence includes funding rates, mark/index prices, tickers, depth, fees, and contract specs. Prediction-market evidence includes official statements, news/web evidence, Polymarket market state, CLOB prices, liquidity, and resolution rules.

## 4.3 MarketContext

MarketContext is the normalized state of a market-like object.

It has vertical-specific forms:

```text
ExchangeMarketContext
PredictionMarketContext
```

ExchangeMarketContext includes venue, instrument, funding, ticker, order book, open interest, fees, and contract specs.

PredictionMarketContext includes platform, event, market, outcomes, implied probabilities, order book, liquidity, volume, close time, and resolution rules.

Provider raw responses must not leak into MarketContext consumers.

## 4.4 Comparison

Comparison is the key abstraction for opportunity discovery.

Opportunities should usually come from comparisons, not isolated facts.

Examples:

```text
CrossVenueComparison
InformationMarketComparison
CrossSourceComparison
HistoricalBaselineComparison
```

For exchange arbitrage, Prism compares Binance vs Bitget funding, mark prices, basis, depth, fees, and funding windows.

For prediction markets, Prism compares real-world evidence or probability estimates against Polymarket implied probabilities and liquidity.

## 4.5 Signal

Signal is a structured discrepancy, anomaly, or opportunity precursor derived from evidence and comparison.

Exchange signals include:

- cross-venue funding divergence;
- cross-venue basis spread;
- cross-venue price dislocation;
- funding-time mismatch;
- liquidity imbalance.

Prediction-market signals include:

- information-market lag;
- probability mispricing;
- resolution-rule ambiguity;
- liquidity mispricing;
- source conflict.

## 4.6 Opportunity

Opportunity is a lifecycle-managed product object.

Opportunity types include:

- funding_rate_arbitrage;
- cross_exchange_basis;
- prediction_market_mispricing;
- prediction_market_lag;
- wallet_signal;
- liquidity_dislocation.

Opportunity is the shared object for product feeds, research, artifacts, proposals, and future execution readiness.

## 4.7 OpportunityScore

OpportunityScore ranks and explains opportunity quality.

It should be deterministic-first and agent-explained.

Core dimensions:

- edge;
- liquidity;
- freshness;
- evidence quality;
- venue/source reliability;
- execution feasibility;
- risk;
- timing or alignment.

For exchange arbitrage, score must account for worst-side liquidity, funding window alignment, fees, slippage, and provider freshness.

For prediction markets, score must account for evidence trust, information recency, market liquidity, implied probability discrepancy, resolution ambiguity, and source conflicts.

## 4.8 Artifact

Artifacts materialize results.

Artifacts should preserve lineage:

- operation id;
- object ids;
- evidence bundle ids;
- market context ids;
- comparison ids;
- signal ids;
- opportunity ids;
- parent artifact ids;
- creator: operation, agent, user, or system.

## 4.9 ActionProposal / TradeProposal

The long-term abstraction is ActionProposal. TradeProposal is a subtype.

ActionProposal subtypes may include:

- TradeProposal;
- WatchProposal;
- ResearchProposal;
- ExecutionProposal.

MVP may produce reports and optional paper TradeProposal drafts, but it must not execute trades.

## 4.10 RiskAssessment

RiskAssessment is the governed decision-support object.

LLMs may explain risks, but deterministic policy decides whether action is allowed, requires confirmation, must be reduced, or is blocked.

---

## 5. Vertical A: multi-exchange arbitrage

Target product flow:

```text
Exchange connectors
  -> ExchangeMarketContext per venue
  -> CrossVenueComparison
  -> funding / basis / liquidity signals
  -> arbitrage Opportunity
  -> OpportunityScore
  -> ArbitrageOpportunityReport
  -> optional paper TradeProposal
  -> future RiskAssessment and governed execution
```

The MVP vertical is:

```text
Binance + Bitget
BTC / ETH / SOL or configured symbols
linear perpetuals
funding / basis / liquidity discovery
read-only public data
no execution
```

Architecture requirements:

1. Fetch and normalize data from multiple venues.
2. Compare venues using normalized contexts, not raw provider payloads.
3. Represent cross-venue comparisons as first-class objects.
4. Represent arbitrage signals as structured signals.
5. Represent opportunities with venue pair, symbol, direction, candidate legs, evidence, score, and lifecycle stage.
6. Fetch expensive depth data only for top candidates after coarse ranking.
7. Produce artifacts that show both sides of the venue pair, assumptions, score breakdown, risks, and evidence lineage.

MVP operation:

```text
scan_funding_basis_arbitrage
```

Expected flow:

```text
1. Normalize requested symbols and venues.
2. Fetch markets, funding, tickers, and related public data from Binance and Bitget.
3. Build ExchangeMarketContext for each venue/symbol.
4. Build CrossVenueComparison for each comparable symbol.
5. Coarse-rank by funding divergence, basis, volume, and data quality.
6. Fetch order book depth for top candidates on both venues.
7. Recompute net edge with worst-side liquidity, fee, and slippage assumptions.
8. Derive arbitrage signals.
9. Create opportunities with candidate legs.
10. Score and rank opportunities.
11. Materialize OpportunityArtifacts / reports.
12. Let Pi Agent explain results using the produced objects and evidence.
```

---

## 6. Vertical B: prediction-market mispricing

Target product flow:

```text
World information connectors
  + Prediction-market connectors
  -> EvidenceBundle
  -> PredictionMarketContext
  -> InformationMarketComparison
  -> mispricing / lag signals
  -> prediction-market Opportunity
  -> OpportunityScore
  -> PredictionMarketOpportunityReport
  -> WatchProposal or TradeProposal later
```

Architecture requirements:

1. Fetch fast, trustworthy real-world information from provider-backed tools.
2. Fetch Polymarket event, market, outcome, CLOB, price, liquidity, and resolution-rule state.
3. Normalize market state into PredictionMarketContext.
4. Compare real-world evidence and/or probability estimates to market-implied probabilities.
5. Represent information-market lag and mispricing as signals.
6. Materialize reports with evidence, source quality, market state, assumptions, and uncertainty.

This is not the first MVP, but the core architecture must support it without a redesign.

---

## 7. Pi Agent boundary

Pi Agent is the runtime kernel and reasoning engine, not the owner of Prism's product semantics.

Pi Agent may:

- interpret user intent;
- select tools through Prism operations;
- synthesize evidence-bound explanations;
- draft research artifacts;
- compare alternatives;
- propose next steps.

Pi Agent must not:

- invent realtime financial facts;
- bypass provider-backed tools;
- own scoring formulas as prompt-only behavior;
- override deterministic policy;
- execute trades directly;
- be the only source of truth for artifacts or opportunities.

Prism owns domain contracts, operation contracts, opportunity lifecycle, scoring, policy, artifact persistence, and audit.

---

## 8. Non-drift rules

These rules must remain hard constraints for future work:

1. Prism is not a chat-first product. Workspace, objects, artifacts, monitors, and signals are product primitives.
2. Prism is not a funding-only product. Funding-basis is the first wedge, not the permanent product identity.
3. Prism is not an execution bot at the current stage. Research, monitoring, signals, and proposals come before execution.
4. New verticals must reuse the shared core `Evidence -> MarketContext -> Comparison -> Signal -> Opportunity -> Score -> Artifact -> Proposal -> Risk` rather than invent ad hoc flows.
5. Continuous monitoring must derive from prior research artifacts and approved workflows, not from opaque prompt-only loops.
6. Signals must be lightweight escalations; proposals must be richer human-review objects; execution must remain a separate governed stage.
7. Realtime market facts must always remain provider-backed and tool-sourced.
8. Pi Agent may reason and synthesize, but it must not own Prism product semantics.

## 9. Technology timing

## 8.1 Blueprint commitments now

The following concepts must be established in the architecture now:

- ResearchObject;
- EvidenceBundle;
- MarketContext abstraction;
- Comparison abstraction;
- Signal abstraction;
- Opportunity abstraction;
- OpportunityScore;
- Artifact lineage;
- ActionProposal / TradeProposal boundary;
- Operation contract style;
- Pi Agent boundary.

## 8.2 MVP implementation now

The first MVP should implement:

- Binance connector;
- Bitget connector;
- ExchangeMarketContext;
- CrossVenueComparison;
- funding / basis / liquidity signals;
- arbitrage Opportunity;
- arbitrage scoring;
- OpportunityArtifact / ArbitrageOpportunityReport;
- `scan_funding_basis_arbitrage` operation.

## 8.3 Next vertical

After the exchange-arbitrage MVP, implement:

- Polymarket Gamma/CLOB connector;
- PredictionMarketContext;
- Claim / Outcome / ResolutionRule contracts;
- InformationMarketComparison;
- prediction-market mispricing signals;
- PredictionMarketOpportunityReport.

## 8.4 Later

Do not pull these into the MVP unless a concrete operation requires them:

- LangGraph;
- OpenHands;
- Event Bus;
- graph database;
- private exchange credentials;
- real order placement;
- full Web UI;
- multi-agent team diagrams.

These may become valuable later, but they should not precede the opportunity operating core.

---

## 9. Implementation stance

The architecture should be broad. The MVP should be narrow.

Broad architecture:

```text
Evidence -> MarketContext -> Comparison -> Signal -> Opportunity -> Score -> Artifact -> Proposal -> Risk
```

Narrow MVP:

```text
Binance / Bitget funding-basis arbitrage
read-only
provider-backed facts
structured comparison
ranked opportunity artifacts
no real execution
```

This keeps Prism aligned with the long-term financial opportunity operating system while preserving a concrete path to the first useful product loop.
