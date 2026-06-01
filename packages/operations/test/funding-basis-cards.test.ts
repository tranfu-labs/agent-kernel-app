import test from "node:test";
import assert from "node:assert/strict";
import type { CrossVenueComparison, Opportunity } from "@agentkernel/domain";
import { buildFundingBasisOpportunityCards } from "../src/funding-basis-cards.js";

const observedAt = "2026-05-30T00:00:00.000Z";

const comparison: CrossVenueComparison = {
  id: "cmp_ETHUSDT_binance_bitget",
  symbol: "ETHUSDT",
  marketType: "linear_perp",
  venues: ["binance", "bitget"],
  legs: [
    {
      venue: "binance",
      marketType: "linear_perp",
      symbol: "ETHUSDT",
      funding: {
        current: {
          venue: "binance",
          marketType: "linear_perp",
          symbol: "ETHUSDT",
          venueSymbol: "ETHUSDT",
          fundingRate: 0.0012,
          observedAt,
          provider: "binance-fixture",
          source: "fixture",
          status: "ok",
          warnings: [],
        },
        history: [],
        status: "ok",
        warnings: [],
      },
      status: "ok",
      warnings: [],
      fetchedAt: observedAt,
    },
    {
      venue: "bitget",
      marketType: "linear_perp",
      symbol: "ETHUSDT",
      funding: {
        current: {
          venue: "bitget",
          marketType: "linear_perp",
          symbol: "ETHUSDT",
          venueSymbol: "ETHUSDT",
          fundingRate: -0.0002,
          observedAt,
          provider: "bitget-fixture",
          source: "fixture",
          status: "ok",
          warnings: [],
        },
        history: [],
        status: "ok",
        warnings: [],
      },
      status: "ok",
      warnings: [],
      fetchedAt: observedAt,
    },
  ],
  fundingDiffBps: 14,
  estimatedFeeBps: 4,
  estimatedSlippageBps: 1.5,
  estimatedNetEdgeBps: 8.5,
  freshnessStatus: "fresh",
  status: "ok",
  warnings: [],
  fetchedAt: observedAt,
};

const opportunity: Opportunity = {
  id: "opp_ETHUSDT_binance_bitget",
  type: "funding_rate_arbitrage",
  title: "ETHUSDT Binance / Bitget funding-basis candidate",
  objects: [],
  venues: ["binance", "bitget"],
  symbols: ["ETHUSDT"],
  grossEdgeBps: 14,
  feeEstimateBps: 4,
  slippageEstimateBps: 1.5,
  netEdgeBps: 8.5,
  confidence: 0.71,
  liquidityStatus: "sufficient",
  freshnessStatus: "fresh",
  riskFlags: [],
  comparisonIds: [comparison.id],
  signalIds: ["sig_ETHUSDT_binance_bitget"],
  legs: [
    { venue: "bitget", symbol: "ETHUSDT", marketType: "linear_perp", side: "long", role: "entry" },
    { venue: "binance", symbol: "ETHUSDT", marketType: "linear_perp", side: "short", role: "hedge" },
  ],
  score: {
    totalScore: 71,
    confidence: 0.71,
    edgeScore: 68,
    liquidityScore: 85,
    freshnessScore: 100,
    fundingAlignmentScore: 100,
    venueReliabilityScore: 80,
    riskScore: 80,
    evidenceScore: 80,
    scoringVersion: "funding-basis-v1",
    scoredAt: observedAt,
    explanation: ["Estimated net edge is 8.5 bps after fees and slippage."],
  },
  lifecycleStage: "scored",
  status: "candidate",
  createdAt: observedAt,
  updatedAt: observedAt,
};

test("buildFundingBasisOpportunityCards creates product card fields with artifact IDs", () => {
  const cards = buildFundingBasisOpportunityCards({
    opportunities: [opportunity],
    comparisons: [comparison],
    artifactIds: ["artifact_opp_ETHUSDT_binance_bitget"],
    assumptions: {
      targetNotionalUsd: 1000,
      estimatedFeeBps: 4,
      mode: "balanced",
    },
  });

  assert.equal(cards.length, 1);
  assert.equal(cards[0]?.symbol, "ETHUSDT");
  assert.equal(cards[0]?.candidateLongVenue, "bitget");
  assert.equal(cards[0]?.candidateShortVenue, "binance");
  assert.equal(cards[0]?.fundingRatesByVenue.binance, 0.0012);
  assert.equal(cards[0]?.fundingRatesByVenue.bitget, -0.0002);
  assert.equal(cards[0]?.fundingDiffBps, 14);
  assert.equal(cards[0]?.estimatedNetEdgeBps, 8.5);
  assert.equal(cards[0]?.artifactId, "artifact_opp_ETHUSDT_binance_bitget");
  assert.equal(cards[0]?.assumptions.mode, "balanced");
  assert.equal(cards[0]?.nextActions.includes("Explain this opportunity with its saved artifact lineage."), true);
});

test("buildFundingBasisOpportunityCards returns an empty list when no formal opportunities exist", () => {
  const cards = buildFundingBasisOpportunityCards({
    opportunities: [],
    comparisons: [comparison],
    artifactIds: [],
    assumptions: {
      targetNotionalUsd: 1000,
      estimatedFeeBps: 4,
      mode: "balanced",
    },
  });

  assert.deepEqual(cards, []);
});
