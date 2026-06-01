export interface RefreshArtifact {
  artifactRef: string;
  refreshedAt: string;
  sourceRefs: string[];
  deltaSummary: string[];
  warnings: string[];
  preservedArtifactRef: string;
}
