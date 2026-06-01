import type {
  CrossVenueComparison,
  ExecutionPrepContract,
  Opportunity,
  OpportunityLeg,
} from "@agentkernel/domain";
import { evaluateFundingRiskGate } from "./funding-risk-gate.js";

export interface BuildFundingExecutionPrepInput {
  opportunity: Opportunity;
  comparison: CrossVenueComparison;
  generatedAt: string;
}

export interface FundingExecutionPrepOutput {
  humanPlan: string;
  contract: ExecutionPrepContract;
}

function getMarkPrice(comparison: CrossVenueComparison, venue: string): number | undefined {
  const leg = comparison.legs.find((item) => item.venue === venue);
  return leg?.ticker?.markPrice ?? leg?.ticker?.lastPrice;
}

function getFundingRate(comparison: CrossVenueComparison, venue: string): number | undefined {
  return comparison.legs.find((item) => item.venue === venue)?.funding?.current?.fundingRate;
}

function getPrimaryLegs(opportunity: Opportunity): [OpportunityLeg, OpportunityLeg] {
  const longLeg = opportunity.legs?.find((leg) => leg.side === "long");
  const shortLeg = opportunity.legs?.find((leg) => leg.side === "short");

  if (!longLeg || !shortLeg) {
    throw new Error(`Opportunity ${opportunity.id} is missing a long/short hedge structure`);
  }

  return [longLeg, shortLeg];
}

function buildMissingInputs(opportunity: Opportunity, comparison: CrossVenueComparison): string[] {
  const missingInputs: string[] = [];

  if (opportunity.netEdgeBps === undefined && comparison.estimatedNetEdgeBps === undefined) {
    missingInputs.push("net_edge_bps");
  }

  if (comparison.estimatedSlippageBps === undefined) {
    missingInputs.push("estimated_slippage_bps");
  }

  if (getMarkPrice(comparison, comparison.venues[0]) === undefined || getMarkPrice(comparison, comparison.venues[1]) === undefined) {
    missingInputs.push("mark_prices");
  }

  return missingInputs;
}

export function buildFundingExecutionPrep(input: BuildFundingExecutionPrepInput): FundingExecutionPrepOutput {
  const [longLeg, shortLeg] = getPrimaryLegs(input.opportunity);
  const missingInputs = buildMissingInputs(input.opportunity, input.comparison);
  const riskGate = evaluateFundingRiskGate({
    opportunity: input.opportunity,
    comparison: input.comparison,
  });
  const readyForManualExecutionPrep =
    missingInputs.length === 0 && input.comparison.status === "ok" && riskGate.decision === "pass";
  const normalizedAsset = input.opportunity.symbols[0] ?? input.comparison.symbol;

  const contract: ExecutionPrepContract = {
    contractVersion: "mvp1.v1",
    opportunityId: input.opportunity.id,
    strategyFamily: "funding_rate_arbitrage",
    generatedAt: input.generatedAt,
    exchanges: [longLeg.venue, shortLeg.venue],
    instruments: {
      normalizedAsset,
      marketType: "linear_perp",
      venueSymbols: {
        [longLeg.venue]: longLeg.symbol,
        [shortLeg.venue]: shortLeg.symbol,
      },
    },
    legs: [
      {
        exchange: longLeg.venue,
        side: "long",
        instrument: longLeg.symbol,
      },
      {
        exchange: shortLeg.venue,
        side: "short",
        instrument: shortLeg.symbol,
      },
    ],
    rationale: [
      `${longLeg.venue} carries the lower funding leg while ${shortLeg.venue} carries the higher funding leg.`,
      `Estimated net edge is ${input.opportunity.netEdgeBps ?? input.comparison.estimatedNetEdgeBps ?? "unknown"} bps after fee and slippage assumptions.`,
      ...((input.opportunity.score?.explanation ?? []).length > 0
        ? input.opportunity.score?.explanation ?? []
        : ["This prep contract is based only on tool-backed market facts already present in the candidate."]),
    ],
    marketReferences: {
      fundingRates: {
        [longLeg.venue]: getFundingRate(input.comparison, longLeg.venue),
        [shortLeg.venue]: getFundingRate(input.comparison, shortLeg.venue),
      },
      markPrices: {
        [longLeg.venue]: getMarkPrice(input.comparison, longLeg.venue),
        [shortLeg.venue]: getMarkPrice(input.comparison, shortLeg.venue),
      },
      observedAt: input.comparison.fetchedAt,
    },
    sequenceRecommendation: {
      preferredOpenSequence: [
        `Open the ${longLeg.venue} ${longLeg.symbol} hedge leg first only if quoted liquidity is still acceptable.`,
        `Verify the ${shortLeg.venue} ${shortLeg.symbol} quote is still inside tolerance before opening the second leg.`,
      ],
      preSecondLegChecks: [
        "Confirm both venues still show fresh quotes.",
        "Confirm spread and net edge have not compressed beyond tolerance.",
        "Confirm the second leg remains hedgeable at the intended size.",
      ],
    },
    orderTypeRecommendation: {
      preferredStyle: "limit_like",
      notes: [
        "Use limit-like or tightly tolerance-bounded manual execution rather than blind market crossing where possible.",
        "Do not treat this recommendation as order authorization; a human must confirm final venue conditions.",
      ],
    },
    abortConditions: riskGate.abortConditions,
    failedLegHandling: riskGate.failedLegHandling,
    riskNotes: riskGate.reasons,
    confidenceFlags: {
      readyForManualExecutionPrep,
      requiresHumanConfirmation: true,
      missingInputs,
    },
  };

  const humanPlan = [
    `Manual execution-prep plan for ${normalizedAsset}.`,
    `Proposed structure: long ${longLeg.symbol} on ${longLeg.venue}, short ${shortLeg.symbol} on ${shortLeg.venue}.`,
    `Funding snapshot: ${longLeg.venue}=${contract.marketReferences.fundingRates[longLeg.venue] ?? "unknown"}, ${shortLeg.venue}=${contract.marketReferences.fundingRates[shortLeg.venue] ?? "unknown"}.`,
    `Net edge estimate: ${input.opportunity.netEdgeBps ?? input.comparison.estimatedNetEdgeBps ?? "unknown"} bps.`,
    `This plan is read-only and for manual review only; it does not authorize direct execution.`,
  ].join(" ");

  return {
    humanPlan,
    contract,
  };
}
