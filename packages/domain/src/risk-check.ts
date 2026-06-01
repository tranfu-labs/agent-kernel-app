export type RiskDecision = "pass" | "fail" | "requires_confirmation" | "requires_size_reduction";
export type RiskCheckStatus = "pass" | "fail" | "warning";

export interface RiskCheckItem {
  name: string;
  status: RiskCheckStatus;
  detail: string;
}

export interface RiskCheckResult {
  id: string;
  proposalId: string;
  decision: RiskDecision;
  checks: RiskCheckItem[];
  maxAllowedNotionalUsd?: number;
  requiredConfirmation: boolean;
  blockingReasons: string[];
  warnings: string[];
  policyVersion: string;
  checkedAt: string;
}
