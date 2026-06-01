import type { SignalArtifact } from "@agentkernel/domain";

export interface BuildSignalArtifactFromMonitorInput {
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
}

export function buildSignalArtifactFromMonitor(
  input: BuildSignalArtifactFromMonitorInput,
): SignalArtifact {
  return {
    monitorRef: input.monitorRef,
    sourceRefs: input.sourceRefs,
    comparisonRefs: input.comparisonRefs,
    opportunityRef: input.opportunityRef,
    kind: input.kind,
    severity: input.severity,
    confidence: input.confidence,
    changeSummary: input.changeSummary,
    whyItMatters: input.whyItMatters,
    recommendedNextStep: input.recommendedNextStep,
    escalatedToProposal: false,
    createdAt: new Date().toISOString(),
  };
}
