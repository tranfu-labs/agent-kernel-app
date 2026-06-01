import { resolvePlatformCapability } from "@agentkernel/operations";

export interface PlatformResearchGuidanceResolution {
  intent: ReturnType<typeof resolvePlatformCapability>["intent"];
  vertical: ReturnType<typeof resolvePlatformCapability>["vertical"];
  capability: ReturnType<typeof resolvePlatformCapability>["capability"];
  path: ReturnType<typeof resolvePlatformCapability>["path"];
  readOnly: true;
  extensionRequired: boolean;
}

export { resolvePlatformResearchRequest } from "./platform-intent-resolution.js";

export function resolvePlatformResearchGuidanceRequest(input: string): PlatformResearchGuidanceResolution {
  const vertical = /polymarket|world cup|prediction market|世界杯/i.test(input)
    ? "prediction_market"
    : "funding_basis";

  const capability = resolvePlatformCapability({
    input: vertical === "prediction_market"
      ? "inspect source prediction market research"
      : input,
    vertical,
  });

  return {
    ...capability,
    extensionRequired: vertical === "prediction_market",
    readOnly: true,
  };
}
