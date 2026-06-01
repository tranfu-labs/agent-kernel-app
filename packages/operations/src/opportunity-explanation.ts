import type { Artifact, ArtifactCreatedBy, Opportunity } from "@agentkernel/domain";

export const READ_ONLY_OPPORTUNITY_EXPLANATION_BOUNDARY = "This is a read-only research explanation. It is not financial advice, a trade recommendation, or an execution instruction.";

export type OpportunityExplanationStatus = "ok" | "not_found" | "unsupported_artifact_type" | "invalid_artifact";

export interface OpportunityExplanation {
  artifactId: string;
  status: OpportunityExplanationStatus;
  opportunityId?: string;
  title?: string;
  summary?: string;
  whyInteresting: string[];
  keyMetrics: {
    grossEdgeBps?: number;
    feeEstimateBps?: number;
    slippageEstimateBps?: number;
    netEdgeBps?: number;
    confidence?: number;
    score?: number;
  };
  legs: Array<{
    venue: string;
    symbol: string;
    side: string;
    role: string;
    fundingRate?: number;
  }>;
  scoreExplanation: string[];
  warnings: string[];
  lineage: {
    opportunityIds: string[];
    marketContextIds: string[];
    evidenceBundleIds: string[];
    comparisonIds: string[];
    signalIds: string[];
    createdBy?: ArtifactCreatedBy;
  };
  assumptions: string[];
  readOnlyBoundary: string;
  suggestedFollowUps: string[];
}

export function explainMissingOpportunityArtifact(artifactId: string): OpportunityExplanation {
  return emptyExplanation(artifactId, "not_found", [
    `Artifact ${artifactId} was not found. Rerun the scanner or provide a valid opportunity artifact ID.`,
  ], [
    "Rerun scan_funding_basis_arbitrage with artifact saving enabled.",
    "Provide a valid saved opportunity artifact ID.",
  ]);
}

export function explainOpportunityArtifact(artifact: Artifact): OpportunityExplanation {
  if (artifact.type !== "opportunity") {
    return emptyExplanation(artifact.id, "unsupported_artifact_type", [
      `Artifact ${artifact.id} has unsupported artifact type ${artifact.type}; expected opportunity.`,
    ]);
  }

  if (!isOpportunityLike(artifact.contentJson)) {
    return emptyExplanation(artifact.id, "invalid_artifact", [
      `Artifact ${artifact.id} does not contain usable opportunity contentJson.`,
    ]);
  }

  const opportunity = artifact.contentJson;
  const lineage = {
    opportunityIds: artifact.opportunityIds ?? [opportunity.id],
    marketContextIds: artifact.marketContextIds ?? [],
    evidenceBundleIds: artifact.evidenceBundleIds ?? (opportunity.evidenceBundleId ? [opportunity.evidenceBundleId] : []),
    comparisonIds: artifact.comparisonIds ?? opportunity.comparisonIds ?? [],
    signalIds: artifact.signalIds ?? opportunity.signalIds ?? [],
    createdBy: artifact.createdBy,
  };

  const warnings = [...opportunity.riskFlags, ...missingLineageWarnings(lineage)];

  if (!opportunity.score) warnings.push("Score unavailable in saved opportunity artifact.");

  return {
    artifactId: artifact.id,
    status: "ok",
    opportunityId: opportunity.id,
    title: opportunity.title || artifact.title,
    summary: artifact.contentMarkdown,
    whyInteresting: buildWhyInteresting(opportunity),
    keyMetrics: {
      grossEdgeBps: opportunity.grossEdgeBps,
      feeEstimateBps: opportunity.feeEstimateBps,
      slippageEstimateBps: opportunity.slippageEstimateBps,
      netEdgeBps: opportunity.netEdgeBps,
      confidence: opportunity.confidence,
      score: opportunity.score?.totalScore,
    },
    legs: (opportunity.legs ?? []).map((leg) => ({
      venue: leg.venue,
      symbol: leg.symbol,
      side: leg.side,
      role: leg.role,
      fundingRate: leg.fundingRate,
    })),
    scoreExplanation: opportunity.score?.explanation ?? ["Score unavailable in saved opportunity artifact."],
    warnings,
    lineage,
    assumptions: buildAssumptions(opportunity),
    readOnlyBoundary: READ_ONLY_OPPORTUNITY_EXPLANATION_BOUNDARY,
    suggestedFollowUps: [
      "Ask for a live market refresh if you want current funding, depth, or freshness checked separately.",
      "Compare this saved explanation with another saved opportunity artifact ID.",
      "Ask for a research summary that keeps the same read-only boundary.",
    ],
  };
}

function emptyExplanation(
  artifactId: string,
  status: OpportunityExplanationStatus,
  warnings: string[],
  suggestedFollowUps = ["Provide a saved opportunity artifact ID produced by scan_funding_basis_arbitrage."],
): OpportunityExplanation {
  return {
    artifactId,
    status,
    whyInteresting: [],
    keyMetrics: {},
    legs: [],
    scoreExplanation: [],
    warnings,
    lineage: {
      opportunityIds: [],
      marketContextIds: [],
      evidenceBundleIds: [],
      comparisonIds: [],
      signalIds: [],
    },
    assumptions: [],
    readOnlyBoundary: READ_ONLY_OPPORTUNITY_EXPLANATION_BOUNDARY,
    suggestedFollowUps,
  };
}

function isOpportunityLike(value: unknown): value is Opportunity {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Opportunity>;
  return typeof candidate.id === "string"
    && typeof candidate.title === "string"
    && Array.isArray(candidate.venues)
    && Array.isArray(candidate.symbols)
    && typeof candidate.confidence === "number"
    && Array.isArray(candidate.riskFlags);
}

function buildWhyInteresting(opportunity: Opportunity): string[] {
  const reasons: string[] = [];

  if (opportunity.netEdgeBps !== undefined) reasons.push(`Saved opportunity has estimated net edge of ${opportunity.netEdgeBps} bps after available fee/slippage assumptions.`);
  if (opportunity.grossEdgeBps !== undefined) reasons.push(`Gross edge is ${opportunity.grossEdgeBps} bps before available cost estimates.`);
  if (opportunity.score?.totalScore !== undefined) reasons.push(`Saved score is ${opportunity.score.totalScore} with confidence ${opportunity.score.confidence}.`);
  if (opportunity.venues.length > 0 && opportunity.symbols.length > 0) reasons.push(`It compares ${opportunity.symbols.join(", ")} across ${opportunity.venues.join(" / ")}.`);

  return reasons.length > 0 ? reasons : ["Saved artifact contains a candidate opportunity, but key edge metrics were unavailable."];
}

function buildAssumptions(opportunity: Opportunity): string[] {
  const assumptions: string[] = [];

  if (opportunity.feeEstimateBps !== undefined) assumptions.push(`Fee estimate preserved from artifact: ${opportunity.feeEstimateBps} bps.`);
  if (opportunity.slippageEstimateBps !== undefined) assumptions.push(`Slippage estimate preserved from artifact: ${opportunity.slippageEstimateBps} bps.`);
  assumptions.push(`Liquidity status preserved from artifact: ${opportunity.liquidityStatus}.`);
  assumptions.push(`Freshness status preserved from artifact: ${opportunity.freshnessStatus}.`);

  return assumptions;
}

function missingLineageWarnings(lineage: OpportunityExplanation["lineage"]): string[] {
  const warnings: string[] = [];

  if (lineage.marketContextIds.length === 0) warnings.push("Missing marketContext lineage IDs in saved artifact.");
  if (lineage.evidenceBundleIds.length === 0) warnings.push("Missing evidenceBundle lineage IDs in saved artifact.");
  if (lineage.comparisonIds.length === 0) warnings.push("Missing comparison lineage IDs in saved artifact.");
  if (lineage.signalIds.length === 0) warnings.push("Missing signal lineage IDs in saved artifact.");

  return warnings;
}
