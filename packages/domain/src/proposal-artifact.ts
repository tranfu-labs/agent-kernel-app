export interface ProposalArtifact {
  id: string;
  sourceArtifactRefs: string[];
  title: string;
  thesis: string[];
  assumptions: string[];
  missingFacts: string[];
  readOnlyBoundary: string;
  nextReviewStep: string;
}
