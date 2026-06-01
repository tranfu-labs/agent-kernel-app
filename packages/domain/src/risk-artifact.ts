export type RiskArtifactCheckStatus = "pass" | "warn" | "fail";

export interface RiskArtifactCheck {
  name: string;
  status: RiskArtifactCheckStatus;
  detail: string;
}

export interface RiskArtifact {
  proposalRef: string;
  checks: RiskArtifactCheck[];
  summary: string;
  actionAllowed: false;
}
