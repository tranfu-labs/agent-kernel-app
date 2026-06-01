import type { CrossVenueComparison, Opportunity } from "@agentkernel/domain";

export interface FundingRiskGateResult {
  decision: "pass" | "hold" | "reject";
  reasons: string[];
  abortConditions: string[];
  failedLegHandling: string[];
}

export interface EvaluateFundingRiskGateInput {
  opportunity: Opportunity;
  comparison: CrossVenueComparison;
}

function hasCompleteHedgeStructure(opportunity: Opportunity): boolean {
  const longLeg = opportunity.legs?.some((leg) => leg.side === "long");
  const shortLeg = opportunity.legs?.some((leg) => leg.side === "short");
  return Boolean(longLeg && shortLeg);
}

export function evaluateFundingRiskGate(input: EvaluateFundingRiskGateInput): FundingRiskGateResult {
  const reasons: string[] = [];
  const abortConditions = [
    "Abort if quoted spread compresses enough to remove the projected net edge.",
    "Abort if either venue becomes stale or unavailable before the hedge is complete.",
    "Abort if the second leg cannot be established inside the planned slippage tolerance.",
  ];
  const failedLegHandling = [
    "Pause after any partial fill and reassess whether the remaining hedge can still be placed safely.",
    "Reduce or unwind residual directional exposure manually if the hedge leg cannot be completed.",
  ];

  const netEdgeBps = input.opportunity.netEdgeBps ?? input.comparison.estimatedNetEdgeBps;
  if (netEdgeBps === undefined) {
    reasons.push("Net edge is incomplete, so the candidate cannot be treated as execution-prep ready.");
  } else if (netEdgeBps <= 0) {
    reasons.push("Net edge is not positive after fees and slippage assumptions.");
  }

  const fundingDiffBps = Math.abs(input.comparison.fundingDiffBps ?? 0);
  if (fundingDiffBps < 3) {
    reasons.push("Funding advantage or spread is too weak to justify manual execution preparation.");
  }

  if (!hasCompleteHedgeStructure(input.opportunity)) {
    reasons.push("A complete long/short hedge structure is required before manual execution preparation.");
  }

  if (input.comparison.status !== "ok" || input.comparison.freshnessStatus !== "fresh" || input.opportunity.freshnessStatus !== "fresh") {
    reasons.push("Fresh and complete two-venue data is required before manual execution preparation.");
  }

  if (input.comparison.estimatedSlippageBps === undefined || input.opportunity.liquidityStatus === "unknown") {
    reasons.push("Liquidity or slippage uncertainty is too high for deterministic execution preparation.");
  }

  reasons.push(...input.comparison.warnings, ...input.opportunity.riskFlags);

  const decision: FundingRiskGateResult["decision"] =
    reasons.some((reason) => /not positive|too weak|complete long\/short hedge structure/.test(reason))
      ? "reject"
      : reasons.some((reason) => /required|uncertainty|fresh and complete/.test(reason))
        ? "hold"
        : "pass";

  if (decision === "pass") {
    reasons.unshift("Candidate satisfies the current deterministic checks for manual execution preparation.");
  }

  return {
    decision,
    reasons,
    abortConditions,
    failedLegHandling,
  };
}
