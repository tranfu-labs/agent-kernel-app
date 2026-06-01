import type { PlatformIntent, PlatformPath } from "@agentkernel/operations";

export type RequiredArtifactKind = "opportunity_artifact" | "artifact_collection" | "proposal_artifact";

export interface PlatformFollowupResolutionInput {
  input: string;
  intent: PlatformIntent;
  path: PlatformPath;
}

export interface PlatformFollowupResolution {
  requiresArtifactContext: boolean;
  requiredArtifactKind?: RequiredArtifactKind;
  notes: string[];
}

export function resolvePlatformFollowup(input: PlatformFollowupResolutionInput): PlatformFollowupResolution {
  switch (input.path) {
    case "path_explain":
      return {
        requiresArtifactContext: true,
        requiredArtifactKind: "opportunity_artifact",
        notes: ["explanations must resolve a previously identified opportunity artifact"],
      };
    case "path_report":
      return {
        requiresArtifactContext: true,
        requiredArtifactKind: "artifact_collection",
        notes: ["reports must resolve an artifact collection before generation"],
      };
    case "path_propose":
      return {
        requiresArtifactContext: true,
        requiredArtifactKind: "opportunity_artifact",
        notes: ["proposals must start from a previously identified opportunity artifact"],
      };
    case "path_evaluate_risk":
      return {
        requiresArtifactContext: true,
        requiredArtifactKind: "proposal_artifact",
        notes: ["risk evaluation must inspect a proposal artifact"],
      };
    default:
      return {
        requiresArtifactContext: false,
        notes: ["no artifact context is required for this path"],
      };
  }
}
