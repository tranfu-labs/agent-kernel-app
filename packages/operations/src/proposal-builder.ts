import type { ProposalArtifact } from "@agentkernel/domain";

export interface BuildReadOnlyProposalInput {
  sourceArtifactRefs: string[];
  title: string;
  thesis: string[];
  assumptions: string[];
  missingFacts: string[];
}

export function buildReadOnlyProposal(input: BuildReadOnlyProposalInput): ProposalArtifact {
  return {
    id: `proposal_${input.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    sourceArtifactRefs: input.sourceArtifactRefs,
    title: input.title,
    thesis: input.thesis,
    assumptions: input.assumptions,
    missingFacts: input.missingFacts,
    readOnlyBoundary: "This proposal is read-only and is not an execution instruction.",
    nextReviewStep: "Run deterministic risk evaluation and human review before any future action.",
  };
}
