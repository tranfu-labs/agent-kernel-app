import type { PlatformIntent, PlatformPath } from "@agentkernel/operations";

export type PlatformOrchestrationTemplate =
  | "lookup_once"
  | "discover_with_artifact"
  | "explain_from_artifact"
  | "report_from_artifacts"
  | "proposal_read_only"
  | "risk_check_deterministic"
  | "clarify_before_route"
  | "extension_boundary";

export interface PlatformOrchestrationTemplateInput {
  intent: PlatformIntent;
  path: PlatformPath;
  extensionRequired: boolean;
  clarificationRequired: boolean;
  requiresArtifactContext: boolean;
}

export function resolvePlatformOrchestrationTemplate(
  input: PlatformOrchestrationTemplateInput,
): PlatformOrchestrationTemplate {
  if (input.extensionRequired) {
    return "extension_boundary";
  }

  if (input.clarificationRequired) {
    return "clarify_before_route";
  }

  switch (input.path) {
    case "path_discover":
      return "discover_with_artifact";
    case "path_explain":
      return "explain_from_artifact";
    case "path_report":
      return "report_from_artifacts";
    case "path_propose":
      return "proposal_read_only";
    case "path_evaluate_risk":
      return "risk_check_deterministic";
    default:
      return "lookup_once";
  }
}
