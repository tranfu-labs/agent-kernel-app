import { MemoryArtifactStore } from "@agentkernel/storage";
import { SessionArtifactReferenceStore } from "./session-artifact-references.js";

export interface PrismRuntimeContext {
  artifactStore: MemoryArtifactStore;
  artifactReferences: SessionArtifactReferenceStore;
}

export function createPrismRuntimeContext(): PrismRuntimeContext {
  return {
    artifactStore: new MemoryArtifactStore(),
    artifactReferences: new SessionArtifactReferenceStore(),
  };
}
