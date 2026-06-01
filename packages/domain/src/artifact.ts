export const ARTIFACT_FAMILY_TYPES = [
  "research_brief",
  "method_artifact",
  "source_snapshot",
  "market_context_snapshot",
  "comparison_artifact",
  "signal_artifact",
  "opportunity_artifact",
  "research_report",
  "monitor_definition",
  "proposal_artifact",
  "risk_artifact",
  "refresh_artifact",
] as const;

export const RESEARCH_LAYER_FORBIDDEN_FIELDS = [
  "apiKey",
  "secret",
  "account",
  "balance",
  "position",
  "order",
  "margin",
  "withdraw",
  "transfer",
  "walletPrivateKey",
] as const;

export type ArtifactType =
  | "research_brief"
  | "comparison_report"
  | "opportunity"
  | "trade_proposal"
  | "risk_check"
  | "execution_receipt"
  | "watch_plan"
  | "post_trade_review"
  | (typeof ARTIFACT_FAMILY_TYPES)[number];

export type ArtifactCreatedBy = "operation" | "agent" | "user" | "system";

export interface Artifact<TContent = unknown> {
  id: string;
  type: ArtifactType;
  title: string;
  objectIds: string[];
  opportunityIds?: string[];
  evidenceBundleIds?: string[];
  marketContextIds?: string[];
  comparisonIds?: string[];
  signalIds?: string[];
  executionPrepContractId?: string;
  riskEvaluationId?: string;
  prepAssumptionRefs?: string[];
  createdBy?: ArtifactCreatedBy;
  contentMarkdown?: string;
  contentJson: TContent;
  evidenceBundleId?: string;
  createdAt: string;
  updatedAt: string;
}
