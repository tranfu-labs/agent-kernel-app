import type { Artifact } from "@agentkernel/domain";

export class MemoryArtifactStore {
  private readonly artifacts = new Map<string, Artifact>();

  save<TContent>(artifact: Artifact<TContent>): Artifact<TContent> {
    this.artifacts.set(artifact.id, artifact as Artifact);
    return artifact;
  }

  get(id: string): Artifact | undefined {
    return this.artifacts.get(id);
  }

  list(): Artifact[] {
    return [...this.artifacts.values()];
  }
}
