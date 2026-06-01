export interface OpportunityArtifactComparisonInput {
  id: string;
  symbol: string;
  netEdgeBps: number;
}

export interface OpportunityArtifactComparisonResult {
  type: "comparison_artifact";
  rankings: Array<{
    artifactId: string;
    symbol: string;
    netEdgeBps: number;
  }>;
}

export function compareOpportunityArtifacts(
  input: OpportunityArtifactComparisonInput[],
): OpportunityArtifactComparisonResult {
  const rankings = [...input]
    .sort((left, right) => right.netEdgeBps - left.netEdgeBps)
    .map((item) => ({
      artifactId: item.id,
      symbol: item.symbol,
      netEdgeBps: item.netEdgeBps,
    }));

  return {
    type: "comparison_artifact",
    rankings,
  };
}
