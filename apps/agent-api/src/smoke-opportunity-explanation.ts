import type { Artifact, Opportunity } from "@agentkernel/domain";
import { createPrismRuntimeContext, createPrismToolDefinitions } from "@agentkernel/funding-basis";

const createdAt = "2026-05-30T00:00:00.000Z";
const context = createPrismRuntimeContext();
const tools = createPrismToolDefinitions(context);
const explanationTool = tools.find((definition) => definition.name === "explain_opportunity_artifact");

if (!explanationTool) throw new Error("explain_opportunity_artifact tool is not registered");

const opportunity: Opportunity = {
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
};

const artifact: Artifact<Opportunity> = {
  id: "artifact_opp_ETHUSDT_binance_bitget",
  type: "opportunity",
  title: opportunity.title,
  objectIds: [],
  opportunityIds: [opportunity.id],
  evidenceBundleIds: ["evidence_ETHUSDT"],
  marketContextIds: ["market_context_binance_ETHUSDT", "market_context_bitget_ETHUSDT"],
  comparisonIds: ["comparison_ETHUSDT"],
  signalIds: ["signal_ETHUSDT"],
  createdBy: "operation",
  contentMarkdown: "# ETHUSDT funding basis candidate",
  contentJson: opportunity,
  createdAt,
  updatedAt: createdAt,
};

await context.artifactStore.save(artifact);

const okResult = await explanationTool.execute(
  "smoke-ok",
  { artifactId: artifact.id },
  undefined,
  undefined,
  {} as Parameters<typeof explanationTool.execute>[4],
);
const okDetails = okResult.details as { status?: string; artifactId?: string; readOnlyBoundary?: string; warnings?: string[]; keyMetrics?: { netEdgeBps?: number } };

if (okDetails.status !== "ok") throw new Error(`Expected ok explanation, got ${okDetails.status}`);
if (okDetails.artifactId !== artifact.id) throw new Error("Explanation artifactId did not match fixture artifact");
if (okDetails.keyMetrics?.netEdgeBps !== 8) throw new Error("Explanation did not preserve net edge from saved artifact");
if (!okDetails.readOnlyBoundary?.includes("read-only research explanation")) throw new Error("Explanation missing read-only boundary");
if (!okDetails.warnings?.includes("Funding rates can change before settlement.")) throw new Error("Explanation did not preserve opportunity warning");

const missingResult = await explanationTool.execute(
  "smoke-missing",
  { artifactId: "missing_artifact" },
  undefined,
  undefined,
  {} as Parameters<typeof explanationTool.execute>[4],
);
const missingDetails = missingResult.details as { status?: string };

if (missingDetails.status !== "not_found") throw new Error(`Expected not_found explanation, got ${missingDetails.status}`);

console.log(JSON.stringify({ ok: okDetails, missing: missingDetails }, null, 2));
