import type { RefreshArtifact } from "@agentkernel/domain";

export interface RefreshArtifactViewInput {
  artifactRef: string;
  sourceRefs: string[];
  deltaSummary: string[];
  warnings: string[];
}

export function refreshArtifactView(input: RefreshArtifactViewInput): RefreshArtifact {
  return {
    artifactRef: input.artifactRef,
    refreshedAt: new Date().toISOString(),
    sourceRefs: input.sourceRefs,
    deltaSummary: input.deltaSummary,
    warnings: input.warnings,
    preservedArtifactRef: input.artifactRef,
  };
}
