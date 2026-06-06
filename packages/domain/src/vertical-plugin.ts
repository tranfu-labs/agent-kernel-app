import type { ResearchVertical } from "./research-state.js";

export interface VerticalPluginDeclaration {
  vertical: ResearchVertical;
  supportedIntents: string[];
  supportedPaths: string[];
  capabilityKeys: string[];
  artifactMappings: Record<string, string>;
  policyProfile: string[];
}
