import type { Artifact } from "@agentkernel/domain";

export interface ArtifactStore {
  save<TContent>(artifact: Artifact<TContent>): Promise<Artifact<TContent>>;
  get(id: string): Promise<Artifact | undefined>;
  list(): Promise<Artifact[]>;
}
