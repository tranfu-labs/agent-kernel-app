import type { RiskArtifact } from "@agentkernel/domain";

export interface EvaluateProposalRiskInput {
  proposalRef: string;
  hasFreshData: boolean;
  hasHumanReview: boolean;
}

export function evaluateProposalRisk(input: EvaluateProposalRiskInput): RiskArtifact {
  const checks = [
    {
      name: "fresh_data",
      status: input.hasFreshData ? "pass" : "fail",
      detail: input.hasFreshData ? "Fresh data available." : "Proposal has not been refreshed with current facts.",
    },
    {
      name: "human_review",
      status: input.hasHumanReview ? "pass" : "fail",
      detail: input.hasHumanReview ? "Human review recorded." : "Human review is required before action-adjacent escalation.",
    },
  ] as const;

  return {
    proposalRef: input.proposalRef,
    checks: checks.map((check) => ({ ...check })),
    summary: checks.every((check) => check.status === "pass")
      ? "Proposal passed deterministic research-layer checks."
      : "Proposal failed deterministic research-layer checks.",
    actionAllowed: false,
  };
}
