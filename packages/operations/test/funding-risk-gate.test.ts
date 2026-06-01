import test from "node:test";
import assert from "node:assert/strict";
import type { CrossVenueComparison, Opportunity } from "@agentkernel/domain";
import { evaluateFundingRiskGate } from "../src/funding-risk-gate.js";

const observedAt = "2026-05-30T00:00:00.000Z";

const baseComparison: CrossVenueComparison = {
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

const baseOpportunity: Opportunity = {
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
  comparisonIds: [baseComparison.id],
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

test("evaluateFundingRiskGate passes an acceptable candidate with explicit handling guidance", () => {
  const result = evaluateFundingRiskGate({
    opportunity: baseOpportunity,
    comparison: baseComparison,
  });

  assert.equal(result.decision, "pass");
  assert.equal(result.reasons.length > 0, true);
  assert.equal(result.abortConditions.length > 0, true);
  assert.equal(result.failedLegHandling.length > 0, true);
});

test("evaluateFundingRiskGate rejects insufficient edge after fees and slippage", () => {
  const result = evaluateFundingRiskGate({
    opportunity: { ...baseOpportunity, netEdgeBps: -0.5 },
    comparison: { ...baseComparison, estimatedNetEdgeBps: -0.5 },
  });

  assert.equal(result.decision, "reject");
  assert.match(result.reasons.join(" "), /net edge/i);
});

test("evaluateFundingRiskGate holds stale or partial data", () => {
  const result = evaluateFundingRiskGate({
    opportunity: { ...baseOpportunity, freshnessStatus: "stale" },
    comparison: { ...baseComparison, freshnessStatus: "stale", status: "partial" },
  });

  assert.equal(result.decision, "hold");
  assert.match(result.reasons.join(" "), /fresh|partial/i);
});

test("evaluateFundingRiskGate rejects missing hedge structure", () => {
  const result = evaluateFundingRiskGate({
    opportunity: { ...baseOpportunity, legs: [{ venue: "bitget", symbol: "ETHUSDT", marketType: "linear_perp", side: "long", role: "entry" }] },
    comparison: baseComparison,
  });

  assert.equal(result.decision, "reject");
  assert.match(result.reasons.join(" "), /hedge/i);
});

test("evaluateFundingRiskGate holds excessive liquidity uncertainty", () => {
  const result = evaluateFundingRiskGate({
    opportunity: { ...baseOpportunity, liquidityStatus: "unknown" },
    comparison: { ...baseComparison, estimatedSlippageBps: undefined, warnings: ["depth unavailable"] },
  });

  assert.equal(result.decision, "hold");
  assert.match(result.reasons.join(" "), /liquidity|slippage/i);
});

test("evaluateFundingRiskGate rejects too-weak funding advantage", () => {
  const result = evaluateFundingRiskGate({
    opportunity: { ...baseOpportunity, grossEdgeBps: 2, netEdgeBps: 0.1 },
    comparison: { ...baseComparison, fundingDiffBps: 2, estimatedNetEdgeBps: 0.1 },
  });

  assert.equal(result.decision, "reject");
  assert.match(result.reasons.join(" "), /funding advantage|spread/i);
});
