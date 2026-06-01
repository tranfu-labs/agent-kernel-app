import test from "node:test";
import assert from "node:assert/strict";
import type { Artifact, Opportunity } from "@agentkernel/domain";
import { generateOpportunityResearchReport } from "../src/opportunity-research-report.js";
import { READ_ONLY_OPPORTUNITY_EXPLANATION_BOUNDARY } from "../src/opportunity-explanation.js";

const createdAt = "2026-05-30T00:00:00.000Z";

function opportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: "opp_ETHUSDT_binance_bitget",
    type: "funding_rate_arbitrage",
    title: "ETHUSDT funding basis candidate",
    objects: [],
    venues: ["binance", "bitget"],
    symbols: ["ETHUSDT"],
    grossEdgeBps: 14,
    feeEstimateBps: 4,
    slippageEstimateBps: 2,
    netEdgeBps: 8,
    confidence: 0.78,
    liquidityStatus: "sufficient",
    freshnessStatus: "fresh",
    riskFlags: ["Funding rates can change before settlement."],
    evidenceBundleId: "evidence_ETHUSDT",
    comparisonIds: ["comparison_ETHUSDT"],
    signalIds: ["signal_ETHUSDT"],
    legs: [
      { venue: "binance", symbol: "ETHUSDT", marketType: "linear_perp", side: "short", role: "entry", fundingRate: 0.0012 },
      { venue: "bitget", symbol: "ETHUSDT", marketType: "linear_perp", side: "long", role: "hedge", fundingRate: -0.0002 },
    ],
    score: {
      totalScore: 74,
      confidence: 0.78,
      edgeScore: 80,
      liquidityScore: 70,
      freshnessScore: 90,
      fundingAlignmentScore: 85,
      venueReliabilityScore: 75,
      riskScore: 62,
      evidenceScore: 68,
      scoringVersion: "funding-basis-v1",
      scoredAt: createdAt,
      explanation: ["Positive net edge after estimated fees and slippage."],
    },
    status: "candidate",
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function artifact(overrides: Partial<Artifact<Opportunity>> = {}): Artifact<Opportunity> {
  const contentJson = overrides.contentJson ?? opportunity();
  return {
    id: "artifact_opp_ETHUSDT_binance_bitget",
    type: "opportunity",
    title: "ETHUSDT funding basis candidate",
    objectIds: [],
    opportunityIds: ["opp_ETHUSDT_binance_bitget"],
    evidenceBundleIds: ["evidence_ETHUSDT"],
    marketContextIds: ["market_context_binance_ETHUSDT", "market_context_bitget_ETHUSDT"],
    comparisonIds: ["comparison_ETHUSDT"],
    signalIds: ["signal_ETHUSDT"],
    createdBy: "operation",
    contentMarkdown: "# ETHUSDT funding basis candidate",
    contentJson,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

test("generateOpportunityResearchReport builds deterministic report from saved opportunity artifact", () => {
  const report = generateOpportunityResearchReport(artifact());

  assert.equal(report.status, "ok");
  assert.equal(report.artifactId, "artifact_opp_ETHUSDT_binance_bitget");
  assert.match(report.executiveSummary, /net edge is 8 bps/i);
  assert.equal(report.keyMetrics.score, 74);
  assert.match(report.evidence.join(" "), /comparison_ETHUSDT/);
  assert.match(report.evidence.join(" "), /short ETHUSDT on binance/);
  assert.deepEqual(report.risks, ["Funding rates can change before settlement."]);
  assert.equal(report.readOnlyBoundary, READ_ONLY_OPPORTUNITY_EXPLANATION_BOUNDARY);
  assert.match(report.markdown, /## Executive Summary/);
  assert.match(report.markdown, /## Boundary/);
});

test("generateOpportunityResearchReport preserves structured failure statuses", () => {
  const unsupported = generateOpportunityResearchReport({ ...artifact(), type: "research_brief" });
  const invalid = generateOpportunityResearchReport({ ...artifact(), contentJson: null });

  assert.equal(unsupported.status, "unsupported_artifact_type");
  assert.match(unsupported.markdown, /unsupported_artifact_type/);
  assert.equal(invalid.status, "invalid_artifact");
  assert.match(invalid.markdown, /invalid_artifact/);
});
