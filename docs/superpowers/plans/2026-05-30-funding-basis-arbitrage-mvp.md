# Funding-Basis Arbitrage MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first read-only Binance / Bitget funding-basis arbitrage MVP slice by proving the deterministic core offline before live provider or Pi Agent integration.

**Architecture:** Start with normalized `MarketContext` inputs and a pure Energy-layer evaluator that produces cross-venue comparisons, signals, scored opportunities, and opportunity artifacts. Keep `scanFundingBasisArbitrage` as a thin wrapper over injected context and artifact dependencies; defer Bitget provider, live smoke, and Pi Agent registration until this core-first slice passes.

**Tech Stack:** TypeScript project references, npm workspaces, `@agentkernel/domain`, `@agentkernel/operations`, Node test runner with `tsx`, OpenSpec change `implement-funding-basis-core-first`.

---

## Scope

This plan implements the approved core-first offline slice from `openspec/changes/implement-funding-basis-core-first`.

## Non-goals

- No live Bitget provider in this slice.
- No Binance provider changes in this slice.
- No Pi Agent tool registration in this slice.
- No live network smoke in this slice.
- No Python analytics worker.
- No Web UI.
- No private exchange API keys.
- No account balances, positions, open orders, fills, or private account state.
- No order placement, cancellation, leverage, margin, transfers, withdrawals, or automatic trading.

## Current repo facts this plan assumes

- Repository root: `/Users/griffith/Projects/Prism`.
- `@agentkernel/domain` has `build` and `typecheck` scripts only; it has no package-level `test` script today.
- `@agentkernel/operations` runs tests with `node --import tsx --test test/**/*.test.ts`.
- `@agentkernel/operations` currently depends only on `@agentkernel/domain`; this slice preserves that boundary.
- `MarketContext.funding` is a `FundingContext`; use `context.funding?.current?.fundingRate`.
- `OrderbookDepthEstimate` has `bidSlippageBps` and `askSlippageBps`; it does not have `estimatedSlippageBps`.
- Existing `funding-opportunity-scan.ts` remains as the Binance-only/single-venue operation.

## Alternatives considered

### Option A: Provider-first vertical

Add Bitget provider, service routing, operation, Pi Agent tool, and smoke together.

- Pros: faster path to live data.
- Cons: too broad; network/provider failures obscure core evaluator correctness.

### Option B: Core-first offline slice

Add domain deltas, deterministic evaluator, thin wrapper, artifact lineage, and offline tests first.

- Pros: proves the Energy and Material layers before provider work; smallest useful verifiable slice.
- Cons: does not yet run live Binance / Bitget scans.

### Option C: Domain-only slice

Add only contracts and docs.

- Pros: smallest code change.
- Cons: does not prove the contracts support real evaluation and artifact materialization.

## Recommended design

Use Option B. Implement `evaluateFundingBasisContexts` as the pure core and `scanFundingBasisArbitrage` as the dependency-injected wrapper.

## Critic review

Verdict: REVISE old plan before implementation.

Major accepted findings:

- Old plan was too broad and provider-first.
- Operation purity needed a pure core plus thin wrapper.
- Old snippets conflicted with current `MarketContext.funding.current` shape.
- `@agentkernel/operations` should not import `@agentkernel/tools` for this slice.
- Artifact lineage needs persistent tests.
- No-execution safety needs static verification.

## Rebuttal / decision log

- Accept provider-first critique: live Bitget provider is deferred.
- Accept operation-purity critique: add `evaluateFundingBasisContexts` and keep wrapper thin.
- Accept contract critique: use `FundingContext.current` and existing depth slippage fields.
- Accept dependency critique: define local `ArtifactStoreLike` in operations.
- Accept artifact-lineage critique: add dedicated artifact tests.
- Accept safety critique: include static no-execution scan.

## Final architecture

```text
Fixture or injected MarketContext[]
  -> evaluateFundingBasisContexts()
      -> buildCrossVenueComparison()
      -> deriveFundingBasisSignal()
      -> scoreFundingBasisOpportunity()
      -> createOpportunityArtifact()
  -> scanFundingBasisArbitrage()
      -> injected contextProvider
      -> evaluateFundingBasisContexts()
      -> injected ArtifactStoreLike.save() when saveArtifacts=true
```

## Test matrix

| Layer | Test type | Purpose | Command or method | Persistent? | Owner |
|---|---|---|---|---:|---|
| Contract | Typecheck | Verify domain exports compile | `npm run typecheck -w @agentkernel/domain` | No | Generator/Evaluator |
| Pure core | Unit | Verify comparison/signal/scoring/evaluation offline | `npm run test -w @agentkernel/operations -- funding-basis-core` | Yes | Generator |
| Wrapper | Integration | Verify injected context provider and artifact store behavior | `npm run test -w @agentkernel/operations -- funding-basis-arbitrage` | Yes | Generator |
| Material | Unit/integration | Verify artifact IDs and lineage survive | `npm run test -w @agentkernel/operations -- funding-basis-artifacts` | Yes | Generator |
| Regression | Package tests | Verify existing operation tests still pass | `npm run test -w @agentkernel/operations` | Mixed | Evaluator |
| Contract | Typecheck | Verify operation package compiles | `npm run typecheck -w @agentkernel/operations` | No | Evaluator |
| Safety | Static scan | Verify no private/account/execution capability | `grep -RIn "place_order\|cancel_order\|get_positions\|get_account_balances\|apiKey\|secret\|leverage\|margin\|withdraw\|transfer" packages apps prism-docs` | No | Evaluator |

## Test environment

Local deterministic only for this slice: no network, no provider endpoints, no credentials, stable fixture timestamps, in-memory fake dependencies.

---

## File structure

### Domain contracts

- Modify `packages/domain/src/opportunity.ts` — add `OpportunityLeg`, `OpportunityScore`, lifecycle stage, and optional comparison/signal lineage fields.
- Modify `packages/domain/src/artifact.ts` — add optional artifact lineage fields and `createdBy`.
- Create `packages/domain/src/signal.ts` — define deterministic signal contract.
- Create `packages/domain/src/comparison.ts` — define `CrossVenueComparison` over existing `MarketContext`.
- Modify `packages/domain/src/index.ts` — export new contracts.

### Operations core

- Create `packages/operations/src/funding-basis-core.ts` — pure comparison, signal, scoring, evaluation, and artifact helpers.
- Create `packages/operations/src/funding-basis-arbitrage.ts` — thin wrapper with injected context provider and artifact store-like dependency.
- Modify `packages/operations/src/index.ts` — export the new modules.

### Tests

- Create `packages/operations/test/funding-basis-core.test.ts` — pure core tests.
- Create `packages/operations/test/funding-basis-arbitrage.test.ts` — wrapper tests.
- Create `packages/operations/test/funding-basis-artifacts.test.ts` — artifact lineage tests.

---

### Task 1: Add core-first OpenSpec files

**Files:**
- Create: `openspec/changes/implement-funding-basis-core-first/proposal.md`
- Create: `openspec/changes/implement-funding-basis-core-first/design.md`
- Create: `openspec/changes/implement-funding-basis-core-first/tasks.md`
- Create: `openspec/changes/implement-funding-basis-core-first/critic.md`
- Create: `openspec/changes/implement-funding-basis-core-first/test-matrix.md`

- [x] **Step 1: Create OpenSpec proposal, design, tasks, critic, and test matrix**

Expected: OpenSpec clearly states core-first offline scope, accepted critic findings, deferred provider/Pi work, and deterministic validation commands.

---

### Task 2: Add domain contracts

**Files:**
- Modify: `packages/domain/src/opportunity.ts`
- Modify: `packages/domain/src/artifact.ts`
- Create: `packages/domain/src/signal.ts`
- Create: `packages/domain/src/comparison.ts`
- Modify: `packages/domain/src/index.ts`

- [ ] **Step 1: Create `packages/domain/src/signal.ts`**

```ts
import type { Venue } from "./market-data.js";

export type SignalType =
  | "cross_venue_funding_divergence"
  | "cross_venue_basis_spread"
  | "cross_venue_price_dislocation"
  | "funding_time_mismatch"
  | "liquidity_imbalance"
  | "provider_data_gap";

export interface Signal {
  id: string;
  type: SignalType;
  symbol: string;
  venues: [Venue, Venue];
  comparisonId: string;
  evidenceBundleId?: string;
  longVenue?: Venue;
  shortVenue?: Venue;
  grossEdgeBps?: number;
  feeEstimateBps?: number;
  slippageEstimateBps?: number;
  netEdgeBps?: number;
  strength: number;
  observedAt: string;
  summary: string;
  warnings: string[];
}
```

- [ ] **Step 2: Create `packages/domain/src/comparison.ts`**

```ts
import type { FetchStatus } from "./fetch-status.js";
import type { MarketContext, MarketType, Venue } from "./market-data.js";
import type { FreshnessStatus } from "./opportunity.js";

export interface CrossVenueComparison {
  id: string;
  symbol: string;
  marketType: MarketType;
  venues: [Venue, Venue];
  legs: [MarketContext, MarketContext];
  fundingDiffBps?: number;
  basisBps?: number;
  markPriceDiffBps?: number;
  nextFundingTimeDeltaMs?: number;
  estimatedSlippageBps?: number;
  estimatedFeeBps?: number;
  estimatedNetEdgeBps?: number;
  freshnessStatus: FreshnessStatus;
  status: FetchStatus;
  warnings: string[];
  fetchedAt: string;
}
```

- [ ] **Step 3: Extend `packages/domain/src/opportunity.ts`**

Add these imports and types while preserving existing exported names:

```ts
import type { MarketType, Venue } from "./market-data.js";

export type OpportunityLifecycleStage =
  | "detected"
  | "verified"
  | "scored"
  | "researched"
  | "proposal_created"
  | "risk_checked"
  | "approved"
  | "rejected"
  | "watched"
  | "executed"
  | "reviewed"
  | "archived"
  | "expired";

export interface OpportunityLeg {
  venue: Venue;
  symbol: string;
  marketType: MarketType;
  side: "long" | "short" | "buy" | "sell";
  role: "entry" | "hedge" | "reference";
  price?: number;
  fundingRate?: number;
}

export interface OpportunityScore {
  totalScore: number;
  confidence: number;
  edgeScore: number;
  liquidityScore: number;
  freshnessScore: number;
  fundingAlignmentScore: number;
  venueReliabilityScore: number;
  riskScore: number;
  evidenceScore: number;
  scoringVersion: "funding-basis-v1" | string;
  scoredAt: string;
  explanation: string[];
}
```

Extend `Opportunity` with optional fields:

```ts
comparisonIds?: string[];
signalIds?: string[];
legs?: OpportunityLeg[];
score?: OpportunityScore;
lifecycleStage?: OpportunityLifecycleStage;
```

- [ ] **Step 4: Extend `packages/domain/src/artifact.ts`**

Add:

```ts
export type ArtifactCreatedBy = "operation" | "agent" | "user" | "system";
```

Extend `Artifact` with optional fields:

```ts
opportunityIds?: string[];
evidenceBundleIds?: string[];
marketContextIds?: string[];
comparisonIds?: string[];
signalIds?: string[];
createdBy?: ArtifactCreatedBy;
```

Do not remove the existing `evidenceBundleId?: string` unless all current callers are updated.

- [ ] **Step 5: Export new contracts**

Modify `packages/domain/src/index.ts` to add:

```ts
export * from "./comparison.js";
export * from "./signal.js";
```

- [ ] **Step 6: Validate domain package**

Run:

```bash
npm run typecheck -w @agentkernel/domain
```

Expected: PASS.

---

### Task 3: Add pure funding-basis core tests

**Files:**
- Create: `packages/operations/test/funding-basis-core.test.ts`

- [ ] **Step 1: Write fixture-driven tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import type { FundingContext, MarketContext, OrderbookDepthEstimate, Venue } from "@agentkernel/domain";
import {
  buildCrossVenueComparison,
  deriveFundingBasisSignal,
  evaluateFundingBasisContexts,
  scoreFundingBasisOpportunity,
} from "../src/funding-basis-core.js";

const fetchedAt = "2026-05-30T00:00:00.000Z";

function funding(venue: Venue, rate: number): FundingContext {
  return {
    current: {
      venue,
      marketType: "linear_perp",
      symbol: "ETHUSDT",
      venueSymbol: "ETHUSDT",
      fundingRate: rate,
      nextFundingTime: "2026-05-30T08:00:00.000Z",
      observedAt: fetchedAt,
      provider: `${venue}-fixture`,
      source: "fixture",
      status: "ok",
      warnings: [],
    },
    history: [],
    status: "ok",
    warnings: [],
  };
}

function depth(venue: Venue, bidSlippageBps: number, askSlippageBps: number): OrderbookDepthEstimate {
  return {
    venue,
    marketType: "linear_perp",
    symbol: "ETHUSDT",
    notionalUsd: 10_000,
    bidSlippageBps,
    askSlippageBps,
    bidFillable: true,
    askFillable: true,
    liquidityStatus: "sufficient",
    observedAt: fetchedAt,
    provider: `${venue}-fixture`,
    source: "fixture",
    status: "ok",
    warnings: [],
  };
}

function context(venue: Venue, fundingRate: number, markPrice: number): MarketContext {
  return {
    venue,
    marketType: "linear_perp",
    symbol: "ETHUSDT",
    ticker: {
      venue,
      marketType: "linear_perp",
      symbol: "ETHUSDT",
      venueSymbol: "ETHUSDT",
      lastPrice: markPrice,
      markPrice,
      observedAt: fetchedAt,
      provider: `${venue}-fixture`,
      source: "fixture",
      status: "ok",
      warnings: [],
    },
    funding: funding(venue, fundingRate),
    depth: depth(venue, 1, 1.5),
    status: "ok",
    warnings: [],
    fetchedAt,
  };
}

test("buildCrossVenueComparison uses FundingContext.current and depth slippage", () => {
  const comparison = buildCrossVenueComparison({
    symbol: "ETHUSDT",
    marketType: "linear_perp",
    contexts: [context("binance", 0.0003, 3003), context("bitget", -0.0001, 3000)],
    estimatedFeeBps: 4,
    now: fetchedAt,
  });

  assert.equal(comparison.fundingDiffBps, 4);
  assert.equal(comparison.markPriceDiffBps, 10);
  assert.equal(comparison.estimatedSlippageBps, 1.5);
  assert.equal(comparison.estimatedNetEdgeBps, -1.5);
});

test("deriveFundingBasisSignal chooses long venue with lower funding", () => {
  const comparison = buildCrossVenueComparison({
    symbol: "ETHUSDT",
    marketType: "linear_perp",
    contexts: [context("binance", 0.0003, 3003), context("bitget", -0.0001, 3000)],
    estimatedFeeBps: 4,
    now: fetchedAt,
  });

  const signal = deriveFundingBasisSignal(comparison);

  assert.equal(signal.shortVenue, "binance");
  assert.equal(signal.longVenue, "bitget");
  assert.equal(signal.grossEdgeBps, 4);
});

test("scoreFundingBasisOpportunity returns deterministic score explanation", () => {
  const comparison = buildCrossVenueComparison({
    symbol: "ETHUSDT",
    marketType: "linear_perp",
    contexts: [context("binance", 0.0012, 3000), context("bitget", -0.0002, 3000)],
    estimatedFeeBps: 4,
    now: fetchedAt,
  });
  const signal = deriveFundingBasisSignal(comparison);

  const score = scoreFundingBasisOpportunity({ comparison, signal, scoredAt: fetchedAt });

  assert.equal(score.scoringVersion, "funding-basis-v1");
  assert.equal(score.confidence > 0, true);
  assert.equal(score.explanation.length > 0, true);
});

test("evaluateFundingBasisContexts returns ranked opportunities with lineage", () => {
  const result = evaluateFundingBasisContexts({
    symbols: ["ETHUSDT"],
    marketType: "linear_perp",
    venues: ["binance", "bitget"],
    contexts: [context("binance", 0.0012, 3000), context("bitget", -0.0002, 3000)],
    estimatedFeeBps: 4,
    now: fetchedAt,
  });

  assert.equal(result.comparisons.length, 1);
  assert.equal(result.signals.length, 1);
  assert.equal(result.opportunities.length, 1);
  assert.deepEqual(result.opportunities[0]?.comparisonIds, [result.comparisons[0]?.id]);
  assert.deepEqual(result.opportunities[0]?.signalIds, [result.signals[0]?.id]);
  assert.equal(result.opportunities[0]?.lifecycleStage, "scored");
});
```

- [ ] **Step 2: Run failing core test**

Run:

```bash
npm run test -w @agentkernel/operations -- funding-basis-core
```

Expected: FAIL because `funding-basis-core.ts` does not exist yet.

---

### Task 4: Implement pure funding-basis core

**Files:**
- Create: `packages/operations/src/funding-basis-core.ts`

- [ ] **Step 1: Implement pure core helpers**

```ts
import type {
  CrossVenueComparison,
  FetchStatus,
  MarketContext,
  MarketType,
  Opportunity,
  OpportunityScore,
  Signal,
  Venue,
} from "@agentkernel/domain";

export interface BuildCrossVenueComparisonInput {
  symbol: string;
  marketType: MarketType;
  contexts: [MarketContext, MarketContext];
  estimatedFeeBps: number;
  now: string;
}

export interface ScoreFundingBasisOpportunityInput {
  comparison: CrossVenueComparison;
  signal: Signal;
  scoredAt: string;
}

export interface EvaluateFundingBasisContextsInput {
  symbols: string[];
  marketType: MarketType;
  venues: [Venue, Venue];
  contexts: MarketContext[];
  estimatedFeeBps: number;
  now: string;
}

export interface EvaluateFundingBasisContextsOutput {
  comparisons: CrossVenueComparison[];
  signals: Signal[];
  opportunities: Opportunity[];
  status: FetchStatus;
  warnings: string[];
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function bps(numerator: number, denominator: number): number | undefined {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return undefined;
  return (numerator / denominator) * 10_000;
}

function fundingRate(context: MarketContext): number | undefined {
  return context.funding?.current?.fundingRate;
}

function maxDepthSlippage(context: MarketContext): number | undefined {
  const values = [context.depth?.bidSlippageBps, context.depth?.askSlippageBps].filter((value): value is number => value !== undefined);
  return values.length === 0 ? undefined : Math.max(...values);
}

function combinedStatus(contexts: MarketContext[]): FetchStatus {
  if (contexts.every((context) => context.status === "ok")) return "ok";
  if (contexts.some((context) => context.status === "ok" || context.status === "partial")) return "partial";
  return "failed";
}

export function buildCrossVenueComparison(input: BuildCrossVenueComparisonInput): CrossVenueComparison {
  const [a, b] = input.contexts;
  const fundingA = fundingRate(a);
  const fundingB = fundingRate(b);
  const fundingDiffBps = fundingA !== undefined && fundingB !== undefined ? round((fundingA - fundingB) * 10_000) : undefined;
  const markA = a.ticker?.markPrice ?? a.ticker?.lastPrice;
  const markB = b.ticker?.markPrice ?? b.ticker?.lastPrice;
  const markPriceDiffBps = markA !== undefined && markB !== undefined ? round(bps(markA - markB, markB) ?? 0) : undefined;
  const slippages = [maxDepthSlippage(a), maxDepthSlippage(b)].filter((value): value is number => value !== undefined);
  const estimatedSlippageBps = slippages.length === 0 ? undefined : round(Math.max(...slippages));
  const grossEdgeBps = Math.abs(fundingDiffBps ?? 0);
  const estimatedNetEdgeBps = round(grossEdgeBps - input.estimatedFeeBps - (estimatedSlippageBps ?? 0));
  const warnings = [...a.warnings, ...b.warnings, ...(a.funding?.warnings ?? []), ...(b.funding?.warnings ?? [])];

  if (fundingDiffBps === undefined) warnings.push(`Missing current funding rate for ${input.symbol}`);

  return {
    id: `cmp_${input.symbol}_${a.venue}_${b.venue}`,
    symbol: input.symbol,
    marketType: input.marketType,
    venues: [a.venue, b.venue],
    legs: [a, b],
    fundingDiffBps,
    basisBps: markPriceDiffBps,
    markPriceDiffBps,
    estimatedSlippageBps,
    estimatedFeeBps: input.estimatedFeeBps,
    estimatedNetEdgeBps,
    freshnessStatus: warnings.length === 0 ? "fresh" : "mixed",
    status: combinedStatus([a, b]),
    warnings,
    fetchedAt: input.now,
  };
}

export function deriveFundingBasisSignal(comparison: CrossVenueComparison): Signal {
  const fundingDiffBps = comparison.fundingDiffBps ?? 0;
  const [venueA, venueB] = comparison.venues;
  const shortVenue = fundingDiffBps >= 0 ? venueA : venueB;
  const longVenue = fundingDiffBps >= 0 ? venueB : venueA;
  const netEdgeBps = comparison.estimatedNetEdgeBps ?? 0;

  return {
    id: `sig_${comparison.symbol}_${venueA}_${venueB}`,
    type: "cross_venue_funding_divergence",
    symbol: comparison.symbol,
    venues: comparison.venues,
    comparisonId: comparison.id,
    longVenue,
    shortVenue,
    grossEdgeBps: Math.abs(fundingDiffBps),
    feeEstimateBps: comparison.estimatedFeeBps,
    slippageEstimateBps: comparison.estimatedSlippageBps,
    netEdgeBps,
    strength: Math.max(0, Math.min(1, netEdgeBps / 20)),
    observedAt: comparison.fetchedAt,
    summary: `${comparison.symbol} funding differs across ${venueA} and ${venueB}.`,
    warnings: comparison.warnings,
  };
}

export function scoreFundingBasisOpportunity(input: ScoreFundingBasisOpportunityInput): OpportunityScore {
  const netEdgeBps = input.signal.netEdgeBps ?? 0;
  const edgeScore = clamp(netEdgeBps * 8);
  const freshnessScore = input.comparison.freshnessStatus === "fresh" ? 100 : input.comparison.freshnessStatus === "mixed" ? 60 : 20;
  const liquidityScore = input.comparison.estimatedSlippageBps === undefined ? 40 : clamp(100 - input.comparison.estimatedSlippageBps * 10);
  const fundingAlignmentScore = input.comparison.nextFundingTimeDeltaMs === undefined || Math.abs(input.comparison.nextFundingTimeDeltaMs) <= 60_000 ? 100 : 60;
  const venueReliabilityScore = input.comparison.status === "ok" ? 80 : 40;
  const riskScore = input.comparison.warnings.length === 0 ? 80 : 50;
  const evidenceScore = input.comparison.status === "ok" ? 80 : 50;
  const totalScore = round(
    edgeScore * 0.3 +
      liquidityScore * 0.15 +
      freshnessScore * 0.15 +
      fundingAlignmentScore * 0.1 +
      venueReliabilityScore * 0.1 +
      riskScore * 0.1 +
      evidenceScore * 0.1,
  );

  return {
    totalScore,
    confidence: round(totalScore / 100),
    edgeScore: round(edgeScore),
    liquidityScore: round(liquidityScore),
    freshnessScore,
    fundingAlignmentScore,
    venueReliabilityScore,
    riskScore,
    evidenceScore,
    scoringVersion: "funding-basis-v1",
    scoredAt: input.scoredAt,
    explanation: [`Estimated net edge is ${round(netEdgeBps)} bps after fees and slippage.`],
  };
}

function opportunityFromSignal(comparison: CrossVenueComparison, signal: Signal, scoredAt: string): Opportunity {
  const score = scoreFundingBasisOpportunity({ comparison, signal, scoredAt });

  return {
    id: `opp_${comparison.symbol}_${signal.shortVenue}_${signal.longVenue}`,
    type: "funding_rate_arbitrage",
    title: `${comparison.symbol} ${comparison.venues.join(" / ")} funding-basis candidate`,
    objects: [],
    venues: [...comparison.venues],
    symbols: [comparison.symbol],
    grossEdgeBps: signal.grossEdgeBps,
    feeEstimateBps: signal.feeEstimateBps,
    slippageEstimateBps: signal.slippageEstimateBps,
    netEdgeBps: signal.netEdgeBps,
    confidence: score.confidence,
    liquidityStatus: (comparison.estimatedSlippageBps ?? 99) <= 5 ? "sufficient" : "unknown",
    freshnessStatus: comparison.freshnessStatus,
    riskFlags: comparison.warnings,
    comparisonIds: [comparison.id],
    signalIds: [signal.id],
    legs: [
      { venue: signal.longVenue!, symbol: comparison.symbol, marketType: comparison.marketType, side: "long", role: "entry" },
      { venue: signal.shortVenue!, symbol: comparison.symbol, marketType: comparison.marketType, side: "short", role: "hedge" },
    ],
    score,
    lifecycleStage: "scored",
    status: "candidate",
    createdAt: scoredAt,
    updatedAt: scoredAt,
  };
}

export function evaluateFundingBasisContexts(input: EvaluateFundingBasisContextsInput): EvaluateFundingBasisContextsOutput {
  const warnings: string[] = [];
  const comparisons: CrossVenueComparison[] = [];

  for (const symbol of input.symbols) {
    const contexts = input.venues.map((venue) => input.contexts.find((context) => context.venue === venue && context.symbol === symbol));
    if (!contexts[0] || !contexts[1]) {
      warnings.push(`Missing complete venue contexts for ${symbol}`);
      continue;
    }

    comparisons.push(
      buildCrossVenueComparison({
        symbol,
        marketType: input.marketType,
        contexts: [contexts[0], contexts[1]],
        estimatedFeeBps: input.estimatedFeeBps,
        now: input.now,
      }),
    );
  }

  const signals = comparisons.map(deriveFundingBasisSignal);
  const opportunities = signals
    .map((signal, index) => opportunityFromSignal(comparisons[index]!, signal, input.now))
    .sort((a, b) => (b.score?.totalScore ?? 0) - (a.score?.totalScore ?? 0));

  warnings.push(...comparisons.flatMap((comparison) => comparison.warnings));

  return {
    comparisons,
    signals,
    opportunities,
    status: comparisons.length === 0 ? "failed" : comparisons.every((comparison) => comparison.status === "ok") ? "ok" : "partial",
    warnings,
  };
}
```

- [ ] **Step 2: Run core tests**

Run:

```bash
npm run test -w @agentkernel/operations -- funding-basis-core
```

Expected: PASS.

---

### Task 5: Add artifact lineage tests and helper

**Files:**
- Create: `packages/operations/test/funding-basis-artifacts.test.ts`
- Modify: `packages/operations/src/funding-basis-core.ts`

- [ ] **Step 1: Write artifact lineage test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import type { Opportunity } from "@agentkernel/domain";
import { createOpportunityArtifact } from "../src/funding-basis-core.js";

const createdAt = "2026-05-30T00:00:00.000Z";

const opportunity: Opportunity = {
  id: "opp_ETHUSDT_binance_bitget",
  type: "funding_rate_arbitrage",
  title: "ETHUSDT Binance / Bitget funding-basis candidate",
  objects: [],
  venues: ["binance", "bitget"],
  symbols: ["ETHUSDT"],
  grossEdgeBps: 12,
  feeEstimateBps: 4,
  slippageEstimateBps: 1,
  netEdgeBps: 7,
  confidence: 0.72,
  liquidityStatus: "sufficient",
  freshnessStatus: "fresh",
  riskFlags: ["fixture-warning"],
  comparisonIds: ["cmp_ETHUSDT_binance_bitget"],
  signalIds: ["sig_ETHUSDT_binance_bitget"],
  lifecycleStage: "scored",
  status: "candidate",
  createdAt,
  updatedAt: createdAt,
};

test("createOpportunityArtifact preserves lineage and calculation inputs", () => {
  const artifact = createOpportunityArtifact(opportunity, createdAt);

  assert.equal(artifact.id, "artifact_opp_ETHUSDT_binance_bitget");
  assert.equal(artifact.type, "opportunity");
  assert.equal(artifact.createdBy, "operation");
  assert.deepEqual(artifact.opportunityIds, [opportunity.id]);
  assert.deepEqual(artifact.comparisonIds, opportunity.comparisonIds);
  assert.deepEqual(artifact.signalIds, opportunity.signalIds);
  assert.equal((artifact.contentJson as Opportunity).netEdgeBps, 7);
  assert.deepEqual((artifact.contentJson as Opportunity).riskFlags, ["fixture-warning"]);
});
```

- [ ] **Step 2: Add `createOpportunityArtifact` to `funding-basis-core.ts`**

```ts
import type { Artifact } from "@agentkernel/domain";

export function createOpportunityArtifact(opportunity: Opportunity, createdAt: string): Artifact<Opportunity> {
  return {
    id: `artifact_${opportunity.id}`,
    type: "opportunity",
    title: opportunity.title,
    objectIds: opportunity.objects,
    opportunityIds: [opportunity.id],
    evidenceBundleIds: opportunity.evidenceBundleId ? [opportunity.evidenceBundleId] : [],
    comparisonIds: opportunity.comparisonIds,
    signalIds: opportunity.signalIds,
    createdBy: "operation",
    contentMarkdown: [
      `# ${opportunity.title}`,
      "",
      `- Venues: ${opportunity.venues.join(" / ")}`,
      `- Symbols: ${opportunity.symbols.join(", ")}`,
      `- Gross edge: ${opportunity.grossEdgeBps ?? "unknown"} bps`,
      `- Net edge: ${opportunity.netEdgeBps ?? "unknown"} bps`,
      `- Confidence: ${opportunity.confidence}`,
      opportunity.riskFlags.length > 0 ? `- Warnings: ${opportunity.riskFlags.join("; ")}` : "- Warnings: none",
    ].join("\n"),
    contentJson: opportunity,
    createdAt,
    updatedAt: createdAt,
  };
}
```

Merge the import with the existing import list instead of duplicating imports.

- [ ] **Step 3: Run artifact test**

Run:

```bash
npm run test -w @agentkernel/operations -- funding-basis-artifacts
```

Expected: PASS.

---

### Task 6: Add thin operation wrapper tests

**Files:**
- Create: `packages/operations/test/funding-basis-arbitrage.test.ts`

- [ ] **Step 1: Write wrapper integration test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import type { Artifact, FundingContext, MarketContext, Venue } from "@agentkernel/domain";
import { scanFundingBasisArbitrage } from "../src/funding-basis-arbitrage.js";

const fetchedAt = "2026-05-30T00:00:00.000Z";

function funding(venue: Venue, rate: number): FundingContext {
  return {
    current: {
      venue,
      marketType: "linear_perp",
      symbol: "ETHUSDT",
      venueSymbol: "ETHUSDT",
      fundingRate: rate,
      observedAt: fetchedAt,
      provider: `${venue}-fixture`,
      source: "fixture",
      status: "ok",
      warnings: [],
    },
    history: [],
    status: "ok",
    warnings: [],
  };
}

function context(venue: Venue, fundingRate: number): MarketContext {
  return {
    venue,
    marketType: "linear_perp",
    symbol: "ETHUSDT",
    funding: funding(venue, fundingRate),
    status: "ok",
    warnings: [],
    fetchedAt,
  };
}

test("scanFundingBasisArbitrage uses injected dependencies and returns artifact IDs", async () => {
  const saved: Artifact[] = [];
  const requested: string[] = [];

  const result = await scanFundingBasisArbitrage({
    input: {
      venues: ["binance", "bitget"],
      symbols: ["ETHUSDT"],
      marketType: "linear_perp",
      estimatedFeeBps: 4,
      saveArtifacts: true,
    },
    contextProvider: {
      getMarketContext: async ({ venue, symbol }) => {
        requested.push(`${venue}:${symbol}`);
        return venue === "binance" ? context("binance", 0.0012) : context("bitget", -0.0002);
      },
    },
    artifactStore: {
      save: (artifact) => {
        saved.push(artifact);
        return artifact;
      },
    },
    now: () => fetchedAt,
  });

  assert.deepEqual(requested, ["binance:ETHUSDT", "bitget:ETHUSDT"]);
  assert.equal(result.status, "ok");
  assert.equal(result.opportunities.length, 1);
  assert.equal(result.artifactIds.length, 1);
  assert.equal(saved[0]?.id, result.artifactIds[0]);
});
```

- [ ] **Step 2: Run failing wrapper test**

Run:

```bash
npm run test -w @agentkernel/operations -- funding-basis-arbitrage
```

Expected: FAIL because `funding-basis-arbitrage.ts` does not exist yet.

---

### Task 7: Implement thin operation wrapper and exports

**Files:**
- Create: `packages/operations/src/funding-basis-arbitrage.ts`
- Modify: `packages/operations/src/index.ts`

- [ ] **Step 1: Implement `funding-basis-arbitrage.ts`**

```ts
import type { Artifact, FetchStatus, MarketContext, MarketType, Opportunity, Venue } from "@agentkernel/domain";
import { createOpportunityArtifact, evaluateFundingBasisContexts } from "./funding-basis-core.js";

export interface ScanFundingBasisArbitrageInput {
  venues: [Venue, Venue];
  symbols: string[];
  marketType: MarketType;
  estimatedFeeBps: number;
  saveArtifacts?: boolean;
}

export interface FundingBasisContextProvider {
  getMarketContext(input: { venue: Venue; marketType: MarketType; symbol: string }): Promise<MarketContext>;
}

export interface ArtifactStoreLike {
  save<TContent>(artifact: Artifact<TContent>): Artifact<TContent>;
}

export interface ScanFundingBasisArbitrageDeps {
  input: ScanFundingBasisArbitrageInput;
  contextProvider: FundingBasisContextProvider;
  artifactStore?: ArtifactStoreLike;
  now?: () => string;
}

export interface ScanFundingBasisArbitrageOutput {
  marketContexts: MarketContext[];
  comparisons: ReturnType<typeof evaluateFundingBasisContexts>["comparisons"];
  signals: ReturnType<typeof evaluateFundingBasisContexts>["signals"];
  opportunities: Opportunity[];
  artifactIds: string[];
  status: FetchStatus;
  warnings: string[];
  summary: string;
}

export async function scanFundingBasisArbitrage(deps: ScanFundingBasisArbitrageDeps): Promise<ScanFundingBasisArbitrageOutput> {
  const now = deps.now?.() ?? new Date().toISOString();
  const marketContexts: MarketContext[] = [];
  const warnings: string[] = [];

  for (const symbol of deps.input.symbols) {
    for (const venue of deps.input.venues) {
      const context = await deps.contextProvider.getMarketContext({ venue, marketType: deps.input.marketType, symbol });
      marketContexts.push(context);
      warnings.push(...context.warnings);
    }
  }

  const evaluation = evaluateFundingBasisContexts({
    symbols: deps.input.symbols,
    marketType: deps.input.marketType,
    venues: deps.input.venues,
    contexts: marketContexts,
    estimatedFeeBps: deps.input.estimatedFeeBps,
    now,
  });

  warnings.push(...evaluation.warnings);

  const artifactIds: string[] = [];
  if (deps.input.saveArtifacts) {
    if (!deps.artifactStore) {
      warnings.push("saveArtifacts was requested but no artifactStore was provided");
    } else {
      for (const opportunity of evaluation.opportunities) {
        const artifact = createOpportunityArtifact(opportunity, now);
        deps.artifactStore.save(artifact);
        artifactIds.push(artifact.id);
      }
    }
  }

  return {
    marketContexts,
    comparisons: evaluation.comparisons,
    signals: evaluation.signals,
    opportunities: evaluation.opportunities,
    artifactIds,
    status: evaluation.status,
    warnings,
    summary: `Found ${evaluation.opportunities.length} funding-basis candidate(s).`,
  };
}
```

- [ ] **Step 2: Export new modules**

Modify `packages/operations/src/index.ts` to add:

```ts
export * from "./funding-basis-arbitrage.js";
export * from "./funding-basis-core.js";
```

Keep existing exports.

- [ ] **Step 3: Run wrapper test**

Run:

```bash
npm run test -w @agentkernel/operations -- funding-basis-arbitrage
```

Expected: PASS.

---

### Task 8: Run deterministic validation and safety scan

**Files:**
- All files touched above.

- [ ] **Step 1: Run domain typecheck**

```bash
npm run typecheck -w @agentkernel/domain
```

Expected: PASS.

- [ ] **Step 2: Run operations tests**

```bash
npm run test -w @agentkernel/operations
```

Expected: PASS, including existing `funding-opportunity-scan.test.ts`.

- [ ] **Step 3: Run operations typecheck**

```bash
npm run typecheck -w @agentkernel/operations
```

Expected: PASS.

- [ ] **Step 4: Run no-execution safety scan**

```bash
grep -RIn "place_order\|cancel_order\|get_positions\|get_account_balances\|apiKey\|secret\|leverage\|margin\|withdraw\|transfer" packages apps prism-docs
```

Expected: No new implementation path introduces private credentials, account state, or execution. Documentation non-goals may appear and should be reviewed as legitimate.

## Verification checklist

- [ ] OpenSpec exists for the architecture-sensitive change.
- [ ] Old provider-first plan has been rewritten to core-first.
- [ ] Domain contracts compile.
- [ ] Pure core tests pass offline.
- [ ] Wrapper tests pass offline.
- [ ] Artifact lineage tests pass offline.
- [ ] Existing operations tests still pass.
- [ ] Operations typecheck passes.
- [ ] Safety scan reviewed.

## Safety and rollback notes

This slice is additive. If validation fails, remove the new domain exports and new operations modules/tests; existing `funding-opportunity-scan.ts` should remain untouched except for `index.ts` export additions.
