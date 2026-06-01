import type { MethodState } from "@agentkernel/domain";

export interface CompareResearchMethodsInput {
  goal: string;
  candidateMethods: string[];
  selectedMethod: string;
  requiresPrivateApis: boolean;
}

export interface MethodArtifactView {
  type: "method_artifact";
  summary: string;
  candidateMethods: string[];
  selectedMethod: string;
  requiresPrivateApis: boolean;
}

export function compareResearchMethods(input: CompareResearchMethodsInput): {
  methodState: MethodState;
  artifact: MethodArtifactView;
} {
  if (!input.candidateMethods.includes(input.selectedMethod)) {
    throw new TypeError("selectedMethod must be one of candidateMethods");
  }

  return {
    methodState: {
      status: "locked",
      candidateMethods: input.candidateMethods,
      selectedMethod: input.selectedMethod,
      methodArtifacts: [`method_${input.selectedMethod}`],
      methodSelectionReason: `Locked for goal: ${input.goal}`,
      requiredCapabilities: [input.selectedMethod],
      requiresPrivateApis: input.requiresPrivateApis,
    },
    artifact: {
      type: "method_artifact",
      summary: `Method locked for research goal: ${input.goal}`,
      candidateMethods: input.candidateMethods,
      selectedMethod: input.selectedMethod,
      requiresPrivateApis: input.requiresPrivateApis,
    },
  };
}
