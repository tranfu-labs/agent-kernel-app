import type { Opportunity } from "@agentkernel/domain";

export interface CalculateFundingEdgeInput {
  symbol: string;
  venues: [string, string];
  fundingRates: [number, number];
  feeEstimateBps?: number;
  slippageEstimateBps?: number;
}

export function calculateFundingEdge(input: CalculateFundingEdgeInput): Pick<Opportunity, "grossEdgeBps" | "feeEstimateBps" | "slippageEstimateBps" | "netEdgeBps" | "confidence" | "riskFlags"> {
  const grossEdgeBps = Math.abs(input.fundingRates[0] - input.fundingRates[1]) * 10_000;
  const feeEstimateBps = input.feeEstimateBps ?? 0;
  const slippageEstimateBps = input.slippageEstimateBps ?? 0;
  const netEdgeBps = grossEdgeBps - feeEstimateBps - slippageEstimateBps;
  return {
    grossEdgeBps,
    feeEstimateBps,
    slippageEstimateBps,
    netEdgeBps,
    confidence: netEdgeBps > 0 ? 0.5 : 0.1,
    riskFlags: [],
  };
}
