import { choosePlatformPath, type PlatformPath } from "./platform-paths.js";
import { resolvePlatformIntent, type PlatformIntent } from "./platform-intent.js";

export type PlatformVertical = "funding_basis" | "prediction_market" | "general";
export type PlatformCapability = `${PlatformVertical}.${PlatformIntent}`;

export interface PlatformCapabilityResolution {
  intent: PlatformIntent;
  vertical: PlatformVertical;
  capability: PlatformCapability;
  operation: string;
  path: PlatformPath;
  readOnly: true;
}

export function resolvePlatformCapability(input: {
  input: string;
  vertical: PlatformVertical;
}): PlatformCapabilityResolution {
  const intent = resolvePlatformIntent({
    input: input.input,
    vertical: input.vertical,
  });

  return {
    intent,
    vertical: input.vertical,
    capability: `${input.vertical}.${intent}`,
    operation: `${input.vertical}.${intent}`,
    path: choosePlatformPath(intent),
    readOnly: true,
  };
}
