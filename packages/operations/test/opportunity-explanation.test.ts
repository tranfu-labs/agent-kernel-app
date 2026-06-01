import test from "node:test";
import assert from "node:assert/strict";
import type { Artifact, Opportunity } from "@agentkernel/domain";
import { explainOpportunityArtifact, READ_ONLY_OPPORTUNITY_EXPLANATION_BOUNDARY } from "../src/opportunity-explanation.js";

const createdAt = "2026-05-30T00:00:00.000Z";

function opportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: "opp_ETHUSDT_binance_bitget",
    type: "cross_exchange_basis",
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
      {
        venue: "binance",
        symbol: "ETHUSDT",
        marketType: "linear_perp",
        side: "short",
        role: "entry",
        fundingRate: 0.0012,
      },
      {
        venue: "bitget",
        symbol: "ETHUSDT",
        marketType: "linear_perp",
        side: "long",
        role: "hedge",
        fundingRate: -0.0002,
      },
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
      explanation: ["Positive net edge after estimated fees and slippage.", "Funding rates point in opposite directions across venues."],
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
    contentMarkdown: "# ETHUSDT funding basis candidate\n\nSaved scanner summary.",
    contentJson,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

test("explainOpportunityArtifact builds deterministic explanation from a saved opportunity artifact", () => {
  const result = explainOpportunityArtifact(artifact());

  assert.equal(result.status, "ok");
  assert.equal(result.artifactId, "artifact_opp_ETHUSDT_binance_bitget");
  assert.equal(result.opportunityId, "opp_ETHUSDT_binance_bitget");
  assert.equal(result.title, "ETHUSDT funding basis candidate");
  assert.equal(result.keyMetrics.grossEdgeBps, 14);
  assert.equal(result.keyMetrics.feeEstimateBps, 4);
  assert.equal(result.keyMetrics.slippageEstimateBps, 2);
  assert.equal(result.keyMetrics.netEdgeBps, 8);
  assert.equal(result.keyMetrics.confidence, 0.78);
  assert.equal(result.keyMetrics.score, 74);
  assert.equal(result.legs.length, 2);
  assert.deepEqual(result.scoreExplanation, [
    "Positive net edge after estimated fees and slippage.",
    "Funding rates point in opposite directions across venues.",
  ]);
  assert.deepEqual(result.lineage.comparisonIds, ["comparison_ETHUSDT"]);
  assert.deepEqual(result.lineage.signalIds, ["signal_ETHUSDT"]);
  assert.match(result.whyInteresting.join(" "), /8 bps/);
  assert.equal(result.readOnlyBoundary, READ_ONLY_OPPORTUNITY_EXPLANATION_BOUNDARY);
});

test("explainOpportunityArtifact returns unsupported_artifact_type for non-opportunity artifacts", () => {
  const result = explainOpportunityArtifact({ ...artifact(), type: "research_brief" });

  assert.equal(result.status, "unsupported_artifact_type");
  assert.equal(result.artifactId, "artifact_opp_ETHUSDT_binance_bitget");
  assert.match(result.warnings.join(" "), /unsupported artifact type/i);
});

test("explainOpportunityArtifact returns invalid_artifact for unusable opportunity content", () => {
  const result = explainOpportunityArtifact({ ...artifact(), contentJson: null });

  assert.equal(result.status, "invalid_artifact");
  assert.match(result.warnings.join(" "), /usable opportunity content/i);
});

test("explainOpportunityArtifact surfaces missing lineage and missing score without fabricating facts", () => {
  const result = explainOpportunityArtifact(artifact({
    marketContextIds: [],
    evidenceBundleIds: [],
    comparisonIds: [],
    signalIds: [],
    contentJson: opportunity({ score: undefined, comparisonIds: [], signalIds: [] }),
  }));

  assert.equal(result.status, "ok");
  assert.equal(result.keyMetrics.score, undefined);
  assert.match(result.warnings.join(" "), /Missing marketContext lineage/);
  assert.match(result.warnings.join(" "), /Missing evidenceBundle lineage/);
  assert.match(result.warnings.join(" "), /Missing comparison lineage/);
  assert.match(result.warnings.join(" "), /Missing signal lineage/);
  assert.match(result.scoreExplanation.join(" "), /Score unavailable/);
});
