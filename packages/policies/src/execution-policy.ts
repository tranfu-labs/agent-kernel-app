import type { RiskCheckResult, TradeProposal } from "@agentkernel/domain";

export interface ExecutionPolicy {
  version: string;
  maxTotalNotionalUsd: number;
  realExecutionEnabled: boolean;
  allowedVenues: string[];
}

export function evaluateBasicExecutionPolicy(
  proposal: TradeProposal,
  policy: ExecutionPolicy,
): RiskCheckResult {
  const checks = [
    {
      name: "real_execution_enabled",
      status: policy.realExecutionEnabled ? "pass" as const : "warning" as const,
      detail: policy.realExecutionEnabled ? "Real execution enabled." : "Real execution disabled; dry-run only.",
    },
    {
      name: "max_total_notional",
      status: proposal.maxTotalNotionalUsd <= policy.maxTotalNotionalUsd ? "pass" as const : "fail" as const,
      detail: `Proposal max notional ${proposal.maxTotalNotionalUsd}; policy max ${policy.maxTotalNotionalUsd}.`,
    },
  ];

  const venueFailures = proposal.legs
    .filter((leg) => !policy.allowedVenues.includes(leg.venue))
    .map((leg) => `Venue not allowed: ${leg.venue}`);

  const blockingReasons = [
    ...checks.filter((check) => check.status === "fail").map((check) => check.detail),
    ...venueFailures,
  ];

  return {
    id: crypto.randomUUID(),
    proposalId: proposal.id,
    decision: blockingReasons.length > 0 ? "fail" : "requires_confirmation",
    checks: [
      ...checks,
      ...venueFailures.map((detail) => ({ name: "venue_allowed", status: "fail" as const, detail })),
    ],
    requiredConfirmation: true,
    blockingReasons,
    warnings: policy.realExecutionEnabled ? [] : ["dry_run_only"],
    policyVersion: policy.version,
    checkedAt: new Date().toISOString(),
  };
}
