import { MemoryArtifactStore } from "@agentkernel/storage";
import { SessionArtifactReferenceStore } from "./session-artifact-references.js";

export interface FundingBasisRuntimeContext {
  artifactStore: MemoryArtifactStore;
  artifactReferences: SessionArtifactReferenceStore;
}

export function createFundingBasisRuntimeContext(): FundingBasisRuntimeContext {
  return {
    artifactStore: new MemoryArtifactStore(),
    artifactReferences: new SessionArtifactReferenceStore(),
  };
}
