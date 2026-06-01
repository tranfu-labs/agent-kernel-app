import type { Artifact } from "@agentkernel/domain";
import type { ArtifactStore } from "./artifact-store.js";

export class MemoryArtifactStore implements ArtifactStore {
  private readonly artifacts = new Map<string, Artifact | unknown>();

  async save<TContent>(artifact: Artifact<TContent>): Promise<Artifact<TContent>> {
    this.artifacts.set(artifact.id, artifact as Artifact);
    return artifact;
  }

  async saveDerivedArtifact(id: string, artifact: unknown): Promise<void> {
    this.artifacts.set(id, artifact);
  }

  async get(id: string): Promise<Artifact | undefined> {
    return this.artifacts.get(id) as Artifact | undefined;
  }

  async list(): Promise<Artifact[]> {
    return [...this.artifacts.values()] as Artifact[];
  }
}
