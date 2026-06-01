import type { PlatformOrchestrationTemplate } from "./platform-orchestration-template.js";

export const PATH_GUIDANCE: Record<PlatformOrchestrationTemplate, string[]> = {
  discover_with_artifact: [
    "Use tool-backed market facts before ranking candidates.",
    "Save OpportunityArtifact outputs before returning recommendations.",
    "This is an artifact-backed, read-only discover_with_artifact workflow.",
  ],
  explain_from_artifact: [
    "Load the referenced artifact before explaining the opportunity.",
    "Refresh stale facts before explaining risk or invalidation conditions.",
    "Do not provide execution instructions.",
  ],
  report_from_artifacts: [
    "Gather evidence from saved artifacts and summarize it into a report.",
    "Keep the report traceable to tool-backed facts.",
  ],
  proposal_read_only: [
    "Proposals remain read-only and require later deterministic risk checks.",
    "Do not imply order placement or automatic action.",
  ],
  risk_check_deterministic: [
    "Risk evaluation is deterministic and never authorizes execution.",
  ],
  clarify_before_route: [
    "Ask for clarification before any specialized tool call.",
  ],
  extension_boundary: [
    "Return the boundary response and do not enter tool execution.",
  ],
  lookup_once: [
    "Use a single read-only lookup path and avoid multi-step execution.",
  ],
};

export function getPathGuidance(template: PlatformOrchestrationTemplate): string[] {
  return PATH_GUIDANCE[template];
}
