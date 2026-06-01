import type { CrossVenueComparison, Opportunity, Venue } from "@agentkernel/domain";

export type FundingBasisCardMode = "conservative" | "balanced" | "research";

export interface FundingBasisCardAssumptions {
  targetNotionalUsd?: number;
  estimatedFeeBps: number;
  mode: FundingBasisCardMode;
}

export interface FundingBasisOpportunityCard {
  opportunityId: string;
  symbol: string;
  opportunityType: Opportunity["type"];
  venues: Opportunity["venues"];
  candidateLongVenue?: Venue;
  candidateShortVenue?: Venue;
  fundingRatesByVenue: Partial<Record<Venue, number>>;
  fundingDiffBps?: number;
  basisBps?: number;
  markPriceDiffBps?: number;
  estimatedFeeBps?: number;
  estimatedSlippageBps?: number;
  estimatedNetEdgeBps?: number;
  targetNotionalUsd?: number;
  score?: number;
  confidence?: number;
  warnings: string[];
  dataFreshness: string;
  artifactId?: string;
  assumptions: FundingBasisCardAssumptions;
  nextActions: string[];
}

export interface BuildFundingBasisOpportunityCardsInput {
  opportunities: Opportunity[];
  comparisons: CrossVenueComparison[];
  artifactIds: string[];
  assumptions: FundingBasisCardAssumptions;
}

function fundingRatesByVenue(comparison: CrossVenueComparison | undefined): Partial<Record<Venue, number>> {
  const rates: Partial<Record<Venue, number>> = {};
  for (const leg of comparison?.legs ?? []) {
    const rate = leg.funding?.current?.fundingRate;
    if (rate !== undefined) rates[leg.venue] = rate;
  }
  return rates;
}

function nextActions(opportunity: Opportunity, artifactId: string | undefined): string[] {
  const actions = [
    artifactId ? "Explain this opportunity with its saved artifact lineage." : "Save an artifact before long-running follow-up analysis.",
    "Rerun with custom symbols, notional, fee assumptions, or strictness mode.",
  ];

  if ((opportunity.netEdgeBps ?? 0) <= 0) actions.push("Treat this as research-only unless net edge improves after fees and slippage.");
  if (opportunity.riskFlags.length > 0) actions.push("Inspect warnings before considering any future proposal or risk workflow.");

  return actions;
}

export function buildFundingBasisOpportunityCards(input: BuildFundingBasisOpportunityCardsInput): FundingBasisOpportunityCard[] {
  return input.opportunities.map((opportunity, index) => {
    const comparison = input.comparisons.find((item) => opportunity.comparisonIds?.includes(item.id));
    const longLeg = opportunity.legs?.find((leg) => leg.side === "long");
    const shortLeg = opportunity.legs?.find((leg) => leg.side === "short");
    const artifactId = input.artifactIds[index];

    return {
      opportunityId: opportunity.id,
      symbol: opportunity.symbols[0] ?? comparison?.symbol ?? "unknown",
      opportunityType: opportunity.type,
      venues: opportunity.venues,
      candidateLongVenue: longLeg?.venue,
      candidateShortVenue: shortLeg?.venue,
      fundingRatesByVenue: fundingRatesByVenue(comparison),
      fundingDiffBps: comparison?.fundingDiffBps,
      basisBps: comparison?.basisBps,
      markPriceDiffBps: comparison?.markPriceDiffBps,
      estimatedFeeBps: opportunity.feeEstimateBps ?? comparison?.estimatedFeeBps,
      estimatedSlippageBps: opportunity.slippageEstimateBps ?? comparison?.estimatedSlippageBps,
      estimatedNetEdgeBps: opportunity.netEdgeBps ?? comparison?.estimatedNetEdgeBps,
      targetNotionalUsd: input.assumptions.targetNotionalUsd,
      score: opportunity.score?.totalScore,
      confidence: opportunity.confidence,
      warnings: opportunity.riskFlags,
      dataFreshness: opportunity.freshnessStatus,
      artifactId,
      assumptions: input.assumptions,
      nextActions: nextActions(opportunity, artifactId),
    };
  });
}
