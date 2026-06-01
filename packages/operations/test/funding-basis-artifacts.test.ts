import test from "node:test";
import assert from "node:assert/strict";
import type { ExecutionPrepContract, Opportunity } from "@agentkernel/domain";
import { createOpportunityArtifact, type FundingBasisOpportunityArtifactContent } from "../src/funding-basis-core.js";

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

const executionPrepContract: ExecutionPrepContract = {
  contractVersion: "mvp1.v1",
  opportunityId: opportunity.id,
  strategyFamily: "funding_rate_arbitrage",
  generatedAt: createdAt,
  exchanges: ["bitget", "binance"],
  instruments: {
    normalizedAsset: "ETHUSDT",
    marketType: "linear_perp",
    venueSymbols: {
      bitget: "ETHUSDT",
      binance: "ETHUSDT",
    },
  },
  legs: [
    { exchange: "bitget", side: "long", instrument: "ETHUSDT" },
    { exchange: "binance", side: "short", instrument: "ETHUSDT" },
  ],
  rationale: ["Funding spread favors long Bitget and short Binance."],
  marketReferences: {
    fundingRates: {
      bitget: -0.0002,
      binance: 0.0012,
    },
    observedAt: createdAt,
  },
  sequenceRecommendation: {
    preferredOpenSequence: ["Open hedgeable leg first."],
    preSecondLegChecks: ["Verify spread is still within tolerance."],
  },
  orderTypeRecommendation: {
    preferredStyle: "limit_like",
    notes: ["Stay read-only and use manual confirmation."],
  },
  abortConditions: ["Abort on stale quote."],
  failedLegHandling: ["Unwind residual exposure manually if the second leg fails."],
  riskNotes: ["Liquidity should be rechecked immediately before manual action."],
  confidenceFlags: {
    readyForManualExecutionPrep: true,
    requiresHumanConfirmation: true,
    missingInputs: [],
  },
};

test("createOpportunityArtifact preserves lineage and calculation inputs", () => {
  const artifact = createOpportunityArtifact(opportunity, createdAt, {
    targetNotionalUsd: 1000,
    estimatedFeeBps: 4,
    mode: "balanced",
    marketContextIds: ["market_context_binance_ETHUSDT", "market_context_bitget_ETHUSDT"],
    providerFactRefs: ["funding:binance-fixture:fixture:binance:ETHUSDT"],
    executionPrepContract,
    riskEvaluation: {
      decision: "pass",
      reasons: ["Candidate satisfies deterministic prep checks."],
      abortConditions: ["Abort on stale quote."],
      failedLegHandling: ["Unwind residual exposure manually if hedge leg fails."],
    },
  });

  assert.equal(artifact.id, "artifact_opp_ETHUSDT_binance_bitget");
  assert.equal(artifact.type, "opportunity");
  assert.equal(artifact.createdBy, "operation");
  assert.deepEqual(artifact.opportunityIds, [opportunity.id]);
  assert.deepEqual(artifact.comparisonIds, opportunity.comparisonIds);
  assert.deepEqual(artifact.signalIds, opportunity.signalIds);
  assert.deepEqual(artifact.marketContextIds, ["market_context_binance_ETHUSDT", "market_context_bitget_ETHUSDT"]);
  const content = artifact.contentJson as FundingBasisOpportunityArtifactContent;
  assert.equal(content.netEdgeBps, 7);
  assert.deepEqual(content.riskFlags, ["fixture-warning"]);
  assert.deepEqual(content.artifactEnvelope.assumptions, {
    targetNotionalUsd: 1000,
    estimatedFeeBps: 4,
    mode: "balanced",
  });
  assert.deepEqual(content.artifactEnvelope.marketContextIds, ["market_context_binance_ETHUSDT", "market_context_bitget_ETHUSDT"]);
  assert.deepEqual(content.artifactEnvelope.providerFactRefs, ["funding:binance-fixture:fixture:binance:ETHUSDT"]);
  assert.deepEqual(content.artifactEnvelope.warnings, ["fixture-warning"]);
  assert.equal(content.artifactEnvelope.calculatedMetrics.netEdgeBps, 7);
  assert.equal(content.artifactEnvelope.calculatedMetrics.feeEstimateBps, 4);
  assert.equal(artifact.executionPrepContractId, "execution_prep_opp_ETHUSDT_binance_bitget");
  assert.equal(artifact.riskEvaluationId, "risk_eval_opp_ETHUSDT_binance_bitget");
  assert.deepEqual(artifact.prepAssumptionRefs, ["targetNotionalUsd:1000", "estimatedFeeBps:4", "mode:balanced"]);
  assert.equal(content.artifactEnvelope.executionPrep?.contractId, "opp_ETHUSDT_binance_bitget");
  assert.equal(content.artifactEnvelope.executionPrep?.readyForManualExecutionPrep, true);
  assert.equal(content.artifactEnvelope.riskEvaluation?.decision, "pass");
  assert.deepEqual(content.artifactEnvelope.riskEvaluation?.reasons, ["Candidate satisfies deterministic prep checks."]);
});
