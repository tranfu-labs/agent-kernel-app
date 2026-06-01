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

test("evaluateFundingBasisContexts chooses opposite legs when Bitget funding is higher", () => {
  const result = evaluateFundingBasisContexts({
    symbols: ["ETHUSDT"],
    marketType: "linear_perp",
    venues: ["binance", "bitget"],
    contexts: [context("binance", -0.0002, 3000), context("bitget", 0.0012, 3000)],
    estimatedFeeBps: 4,
    now: fetchedAt,
  });

  assert.equal(result.signals.length, 1);
  assert.equal(result.signals[0]?.shortVenue, "bitget");
  assert.equal(result.signals[0]?.longVenue, "binance");
  assert.equal(result.opportunities[0]?.legs?.[0]?.venue, "binance");
  assert.equal(result.opportunities[0]?.legs?.[1]?.venue, "bitget");
});

test("evaluateFundingBasisContexts does not create opportunities without Bitget funding facts", () => {
  const binance = context("binance", 0.0012, 3000);
  const bitget = context("bitget", -0.0002, 3000);
  delete bitget.funding;

  const result = evaluateFundingBasisContexts({
    symbols: ["ETHUSDT"],
    marketType: "linear_perp",
    venues: ["binance", "bitget"],
    contexts: [binance, bitget],
    estimatedFeeBps: 4,
    now: fetchedAt,
  });

  assert.equal(result.comparisons.length, 1);
  assert.equal(result.signals.length, 0);
  assert.equal(result.opportunities.length, 0);
  assert.match(result.warnings.join(" "), /Missing current funding rate/);
});

test("evaluateFundingBasisContexts does not create opportunities without Binance funding facts", () => {
  const binance = context("binance", 0.0012, 3000);
  const bitget = context("bitget", -0.0002, 3000);
  delete binance.funding;

  const result = evaluateFundingBasisContexts({
    symbols: ["ETHUSDT"],
    marketType: "linear_perp",
    venues: ["binance", "bitget"],
    contexts: [binance, bitget],
    estimatedFeeBps: 4,
    now: fetchedAt,
  });

  assert.equal(result.comparisons.length, 1);
  assert.equal(result.signals.length, 0);
  assert.equal(result.opportunities.length, 0);
  assert.match(result.warnings.join(" "), /Missing current funding rate/);
});

test("evaluateFundingBasisContexts does not fabricate slippage when depth is missing", () => {
  const binance = context("binance", 0.0012, 3000);
  const bitget = context("bitget", -0.0002, 3000);
  delete binance.depth;
  delete bitget.depth;

  const result = evaluateFundingBasisContexts({
    symbols: ["ETHUSDT"],
    marketType: "linear_perp",
    venues: ["binance", "bitget"],
    contexts: [binance, bitget],
    estimatedFeeBps: 4,
    now: fetchedAt,
  });

  assert.equal(result.comparisons[0]?.estimatedSlippageBps, undefined);
  assert.equal(result.opportunities.length, 1);
  assert.equal(result.opportunities[0]?.slippageEstimateBps, undefined);
  assert.equal(result.opportunities[0]?.liquidityStatus, "unknown");
});
