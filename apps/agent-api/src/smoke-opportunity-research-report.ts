import type { Artifact, Opportunity } from "@agentkernel/domain";
import { createPrismRuntimeContext, createPrismToolDefinitions } from "@agentkernel/agent-kernel/funding-basis";

const createdAt = "2026-05-30T00:00:00.000Z";
const context = createPrismRuntimeContext();
const tools = createPrismToolDefinitions(context);
const reportTool = tools.find((definition) => definition.name === "generate_opportunity_research_report");

if (!reportTool) throw new Error("generate_opportunity_research_report tool is not registered");

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

const okResult = await reportTool.execute(
  "smoke-ok",
  { artifactId: artifact.id },
  undefined,
  undefined,
  {} as Parameters<typeof reportTool.execute>[4],
);
const okDetails = okResult.details as {
  status?: string;
  artifactId?: string;
  executiveSummary?: string;
  keyMetrics?: { netEdgeBps?: number; score?: number };
  evidence?: string[];
  readOnlyBoundary?: string;
  markdown?: string;
};

if (okDetails.status !== "ok") throw new Error(`Expected ok report, got ${okDetails.status}`);
if (okDetails.artifactId !== artifact.id) throw new Error("Report artifactId did not match fixture artifact");
if (!okDetails.executiveSummary?.includes("net edge is 8 bps")) throw new Error("Report did not preserve net edge in executive summary");
if (okDetails.keyMetrics?.score !== 74) throw new Error("Report did not preserve saved score");
if (!okDetails.evidence?.join(" ").includes("comparison_ETHUSDT")) throw new Error("Report did not preserve comparison lineage");
if (!okDetails.readOnlyBoundary?.includes("read-only research explanation")) throw new Error("Report missing read-only boundary");
if (!okDetails.markdown?.includes("## Executive Summary")) throw new Error("Report markdown missing executive summary section");
if (!okDetails.markdown?.includes("## Boundary")) throw new Error("Report markdown missing boundary section");

const missingResult = await reportTool.execute(
  "smoke-missing",
  { artifactId: "missing_artifact" },
  undefined,
  undefined,
  {} as Parameters<typeof reportTool.execute>[4],
);
const missingDetails = missingResult.details as { status?: string; markdown?: string };

if (missingDetails.status !== "not_found") throw new Error(`Expected not_found report, got ${missingDetails.status}`);
if (!missingDetails.markdown?.includes("not_found")) throw new Error("Missing-artifact report markdown should include not_found status");

console.log(JSON.stringify({ ok: okDetails, missing: missingDetails }, null, 2));
