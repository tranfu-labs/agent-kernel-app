import type { PlatformCapability, PlatformPath, PlatformVertical } from "@agentkernel/operations";

export interface PlatformPolicyGateInput {
  vertical: PlatformVertical;
  capability: PlatformCapability | "general" | "discover";
  path: PlatformPath;
  requiresArtifactContext: boolean;
}

export interface PlatformPolicyGateResult {
  profile: string[];
  extensionRequired: boolean;
  executionAllowed: false;
  boundaryExplanation: string;
}

export function resolvePlatformPolicyGate(input: PlatformPolicyGateInput): PlatformPolicyGateResult {
  if (input.vertical === "prediction_market") {
    return {
      profile: [
        "read_only_market_research_only",
        "no_wallet_private_keys",
        "no_bet_placement",
        "no_automatic_participation",
      ],
      extensionRequired: true,
      executionAllowed: false,
      boundaryExplanation:
        "Prism MVP1 keeps prediction-market requests at a strict read-only boundary and does not allow wallet access, participation, or bet placement.",
    };
  }

  if (input.vertical === "funding_basis") {
    return {
      profile: ["read_only_research", "tool_backed_facts_only", "proposal_before_execution"],
      extensionRequired: false,
      executionAllowed: false,
      boundaryExplanation:
        "Prism MVP1 only authorizes deterministic read-only funding-basis research backed by approved tools and requires proposals before any execution outside the contract.",
    };
  }

  return {
    profile: ["read_only_research", "clarify_before_specialized_work"],
    extensionRequired: false,
    executionAllowed: false,
    boundaryExplanation:
      "Prism MVP1 requires clarification before routing general requests into any specialized research workflow.",
  };
}
