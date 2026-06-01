import { createPrismRuntimeContext, createPrismToolDefinitions } from "@agentkernel/funding-basis";

const createdAt = "2026-05-31T00:00:00.000Z";
const context = createPrismRuntimeContext();
context.artifactReferences.replaceFromOpportunityCards([
  {
    opportunityId: "opp_ETHUSDT_binance_bitget",
    artifactId: "artifact_opp_ETHUSDT_binance_bitget",
    symbol: "ETHUSDT",
    title: "ETHUSDT Binance / Bitget funding-basis candidate",
  },
]);
context.artifactReferences.replaceFundingPrepRecords([
  {
    artifactId: "artifact_opp_ETHUSDT_binance_bitget",
    opportunity: {
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
      riskFlags: [],
      comparisonIds: ["cmp_ETHUSDT_binance_bitget"],
      signalIds: ["sig_ETHUSDT_binance_bitget"],
      legs: [
        { venue: "bitget", symbol: "ETHUSDT", marketType: "linear_perp", side: "long", role: "entry" },
        { venue: "binance", symbol: "ETHUSDT", marketType: "linear_perp", side: "short", role: "hedge" },
      ],
      score: {
        totalScore: 72,
        confidence: 0.72,
        edgeScore: 56,
        liquidityScore: 90,
        freshnessScore: 100,
        fundingAlignmentScore: 100,
        venueReliabilityScore: 80,
        riskScore: 80,
        evidenceScore: 80,
        scoringVersion: "funding-basis-v1",
        scoredAt: createdAt,
        explanation: ["Estimated net edge is 7 bps after fees and slippage."],
      },
      lifecycleStage: "scored",
      status: "candidate",
      createdAt,
      updatedAt: createdAt,
    },
    comparison: {
      id: "cmp_ETHUSDT_binance_bitget",
      symbol: "ETHUSDT",
      marketType: "linear_perp",
      venues: ["binance", "bitget"],
      legs: [
        {
          venue: "binance",
          marketType: "linear_perp",
          symbol: "ETHUSDT",
          ticker: { venue: "binance", marketType: "linear_perp", symbol: "ETHUSDT", venueSymbol: "ETHUSDT", markPrice: 3001, observedAt: createdAt, provider: "fixture", source: "fixture", status: "ok", warnings: [] },
          funding: { current: { venue: "binance", marketType: "linear_perp", symbol: "ETHUSDT", venueSymbol: "ETHUSDT", fundingRate: 0.0012, observedAt: createdAt, provider: "fixture", source: "fixture", status: "ok", warnings: [] }, history: [], status: "ok", warnings: [] },
          depth: { venue: "binance", marketType: "linear_perp", symbol: "ETHUSDT", notionalUsd: 1000, bidFillable: true, askFillable: true, liquidityStatus: "sufficient", observedAt: createdAt, provider: "fixture", source: "fixture", status: "ok", warnings: [], bidSlippageBps: 1, askSlippageBps: 1 },
          status: "ok",
          warnings: [],
          fetchedAt: createdAt,
        },
        {
          venue: "bitget",
          marketType: "linear_perp",
          symbol: "ETHUSDT",
          ticker: { venue: "bitget", marketType: "linear_perp", symbol: "ETHUSDT", venueSymbol: "ETHUSDT", markPrice: 2999, observedAt: createdAt, provider: "fixture", source: "fixture", status: "ok", warnings: [] },
          funding: { current: { venue: "bitget", marketType: "linear_perp", symbol: "ETHUSDT", venueSymbol: "ETHUSDT", fundingRate: -0.0002, observedAt: createdAt, provider: "fixture", source: "fixture", status: "ok", warnings: [] }, history: [], status: "ok", warnings: [] },
          depth: { venue: "bitget", marketType: "linear_perp", symbol: "ETHUSDT", notionalUsd: 1000, bidFillable: true, askFillable: true, liquidityStatus: "sufficient", observedAt: createdAt, provider: "fixture", source: "fixture", status: "ok", warnings: [], bidSlippageBps: 1, askSlippageBps: 1 },
          status: "ok",
          warnings: [],
          fetchedAt: createdAt,
        },
      ],
      fundingDiffBps: 14,
      basisBps: 7,
      markPriceDiffBps: 7,
      estimatedSlippageBps: 1,
      estimatedFeeBps: 4,
      estimatedNetEdgeBps: 9,
      freshnessStatus: "fresh",
      status: "ok",
      warnings: [],
      fetchedAt: createdAt,
    },
  },
]);

const tools = createPrismToolDefinitions(context);
const prepTool = tools.find((definition) => definition.name === "generate_funding_execution_prep");

if (!prepTool) {
  throw new Error("generate_funding_execution_prep tool is not registered");
}

const okResult = await prepTool.execute(
  "smoke-prep-ok",
  { artifactId: "第一个机会" },
  undefined,
  undefined,
  {} as Parameters<typeof prepTool.execute>[4],
);

const okDetails = okResult.details as {
  status?: string;
  artifactId?: string;
  humanPlan?: string;
  executionPrepContract?: {
    contractVersion?: string;
    strategyFamily?: string;
    exchanges?: string[];
    confidenceFlags?: {
      requiresHumanConfirmation?: boolean;
    };
  };
  riskEvaluation?: {
    decision?: string;
  };
  readOnlyBoundary?: string;
};

if (okDetails.status !== "ok") {
  throw new Error(`Funding execution-prep smoke expected ok status, received ${okDetails.status ?? "unknown"}`);
}

if (okDetails.artifactId !== "artifact_opp_ETHUSDT_binance_bitget") {
  throw new Error("Funding execution-prep smoke expected resolved artifact ID");
}

if (!okDetails.humanPlan || !/manual review only|read-only/i.test(okDetails.humanPlan)) {
  throw new Error("Funding execution-prep smoke expected manual-only human plan wording");
}

if (okDetails.executionPrepContract?.contractVersion !== "mvp1.v1") {
  throw new Error("Funding execution-prep smoke expected contractVersion mvp1.v1");
}

if (okDetails.executionPrepContract?.strategyFamily !== "funding_rate_arbitrage") {
  throw new Error("Funding execution-prep smoke expected funding_rate_arbitrage strategy family");
}

if (okDetails.executionPrepContract?.confidenceFlags?.requiresHumanConfirmation !== true) {
  throw new Error("Funding execution-prep smoke expected requiresHumanConfirmation to be true");
}

if (okDetails.riskEvaluation?.decision !== "pass") {
  throw new Error("Funding execution-prep smoke expected deterministic pass risk evaluation");
}

if (!/read-only|manual execution preparation only/i.test(okDetails.readOnlyBoundary ?? "")) {
  throw new Error("Funding execution-prep smoke expected read-only boundary text");
}

const missingResult = await prepTool.execute(
  "smoke-prep-missing",
  { artifactId: "missing_artifact" },
  undefined,
  undefined,
  {} as Parameters<typeof prepTool.execute>[4],
);

const missingDetails = missingResult.details as {
  status?: string;
  readOnlyBoundary?: string;
};

if (missingDetails.status !== "missing_artifact_context") {
  throw new Error(`Funding execution-prep smoke expected missing_artifact_context, received ${missingDetails.status ?? "unknown"}`);
}

if (!/read-only/i.test(missingDetails.readOnlyBoundary ?? "")) {
  throw new Error("Funding execution-prep smoke expected read-only boundary on missing context");
}

console.log(JSON.stringify({ ok: okDetails, missing: missingDetails }, null, 2));
