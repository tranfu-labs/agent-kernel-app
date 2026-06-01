import test from "node:test";
import assert from "node:assert/strict";
import type { CrossVenueComparison, Opportunity } from "@agentkernel/domain";
import { buildFundingExecutionPrep } from "../src/funding-execution-prep.js";

const observedAt = "2026-05-30T00:00:00.000Z";
const generatedAt = "2026-05-30T00:05:00.000Z";

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
      ticker: {
        venue: "binance",
        marketType: "linear_perp",
        symbol: "ETHUSDT",
        venueSymbol: "ETHUSDT",
        lastPrice: 3002,
        markPrice: 3000,
        observedAt,
        provider: "binance-fixture",
        source: "fixture",
        status: "ok",
        warnings: [],
      },
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
      ticker: {
        venue: "bitget",
        marketType: "linear_perp",
        symbol: "ETHUSDT",
        venueSymbol: "ETHUSDT",
        lastPrice: 2999,
        markPrice: 2998,
        observedAt,
        provider: "bitget-fixture",
        source: "fixture",
        status: "ok",
        warnings: [],
      },
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

test("buildFundingExecutionPrep returns deterministic human plan and JSON contract", () => {
  const result = buildFundingExecutionPrep({
    opportunity,
    comparison,
    generatedAt,
  });

  assert.match(result.humanPlan, /ETHUSDT/);
  assert.match(result.humanPlan, /Bitget/i);
  assert.match(result.humanPlan, /Binance/i);
  assert.match(result.humanPlan, /manual/i);

  assert.equal(result.contract.contractVersion, "mvp1.v1");
  assert.equal(result.contract.opportunityId, opportunity.id);
  assert.equal(result.contract.strategyFamily, "funding_rate_arbitrage");
  assert.deepEqual(result.contract.exchanges, ["bitget", "binance"]);
  assert.equal(result.contract.instruments.normalizedAsset, "ETHUSDT");
  assert.equal(result.contract.instruments.marketType, "linear_perp");
  assert.equal(result.contract.legs[0].exchange, "bitget");
  assert.equal(result.contract.legs[0].side, "long");
  assert.equal(result.contract.legs[1].exchange, "binance");
  assert.equal(result.contract.legs[1].side, "short");
  assert.equal(result.contract.marketReferences.fundingRates.bitget, -0.0002);
  assert.equal(result.contract.marketReferences.fundingRates.binance, 0.0012);
  assert.equal(result.contract.marketReferences.markPrices?.bitget, 2998);
  assert.equal(result.contract.marketReferences.markPrices?.binance, 3000);
  assert.equal(result.contract.confidenceFlags.readyForManualExecutionPrep, true);
  assert.equal(result.contract.confidenceFlags.requiresHumanConfirmation, true);
  assert.deepEqual(result.contract.confidenceFlags.missingInputs, []);
  assert.equal(result.contract.abortConditions.length > 0, true);
  assert.equal(result.contract.failedLegHandling.length > 0, true);
  assert.equal(result.contract.orderTypeRecommendation.notes.length > 0, true);
});

test("buildFundingExecutionPrep stays conservative when evidence is incomplete", () => {
  const partialComparison: CrossVenueComparison = {
    ...comparison,
    estimatedNetEdgeBps: undefined,
    warnings: ["depth missing on one venue"],
  };

  const result = buildFundingExecutionPrep({
    opportunity: {
      ...opportunity,
      netEdgeBps: undefined,
      riskFlags: ["depth missing on one venue"],
    },
    comparison: partialComparison,
    generatedAt,
  });

  assert.equal(result.contract.confidenceFlags.readyForManualExecutionPrep, false);
  assert.equal(result.contract.confidenceFlags.requiresHumanConfirmation, true);
  assert.equal(result.contract.confidenceFlags.missingInputs.includes("net_edge_bps"), true);
  assert.equal(result.contract.riskNotes.includes("depth missing on one venue"), true);
});
