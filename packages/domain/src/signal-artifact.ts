export interface SignalArtifact {
  monitorRef: string;
  sourceRefs: string[];
  comparisonRefs: string[];
  opportunityRef?: string;
  kind: string;
  severity: "low" | "medium" | "high";
  confidence: number;
  changeSummary: string;
  whyItMatters: string;
  recommendedNextStep: string;
  escalatedToProposal: boolean;
  createdAt: string;
}
