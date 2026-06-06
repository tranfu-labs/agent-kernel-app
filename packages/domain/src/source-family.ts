import type { FetchStatus } from "./fetch-status.js";

export type SourceFamily = "web" | "document" | "database" | "api" | "file" | (string & {});
export type SourceTransport = "sdk" | "rest" | "browser" | "file" | "stream";
export type SourceAuthRequirement = "public" | "service_token" | "user_secret" | "session_cookie" | "browser_login";
export type SourceFamilyTrustLevel = "official" | "high" | "medium" | "low";
export type SourceFreshnessClass = "realtime" | "near_realtime" | "delayed" | "historical" | "static";

export interface SourceDescriptor {
  sourceId: string;
  sourceFamily: SourceFamily;
  providerName: string;
  transport: SourceTransport;
  authRequirement: SourceAuthRequirement;
  trustLevel: SourceFamilyTrustLevel;
  freshnessClass: SourceFreshnessClass;
  supportedCapabilities: string[];
  degradationModes: FetchStatus[];
}

export interface SourceCapabilityDescriptor {
  capabilityKey: string;
  sourceFamily: SourceFamily;
  authRequirement: SourceAuthRequirement;
  freshnessClass: SourceFreshnessClass;
  mode: "snapshot" | "batch" | "stream";
  supportedSources: string[];
}

export interface FactCoverage {
  requested: string[];
  returned: string[];
  missing: string[];
}

export interface FactEnvelope<TPayload> {
  sourceId: string;
  provider: string;
  sourceFamily: SourceFamily;
  capabilityKey: string;
  status: FetchStatus;
  warnings: string[];
  observedAt: string | null;
  fetchedAt: string;
  freshnessClass: SourceFreshnessClass;
  authRequirement: SourceAuthRequirement;
  coverage: FactCoverage;
  payload: TPayload;
}

export function createCoverage(requested: string[], returned: string[]): FactCoverage {
  const returnedSet = new Set(returned);
  return {
    requested,
    returned,
    missing: requested.filter((item) => !returnedSet.has(item)),
  };
}

export function createSourceDescriptor(input: {
  sourceId: string;
  sourceFamily: SourceFamily;
  providerName: string;
  transport: SourceTransport;
  authRequirement: SourceAuthRequirement;
  trustLevel: SourceFamilyTrustLevel;
  freshnessClass: SourceFreshnessClass;
  supportedCapabilities: string[];
  degradationModes?: FetchStatus[];
}): SourceDescriptor {
  return {
    ...input,
    degradationModes: input.degradationModes ?? ["partial", "timeout", "rate_limited", "unsupported", "failed"],
  };
}

export function createSourceCapabilityDescriptor(input: {
  capabilityKey: string;
  sourceFamily: SourceFamily;
  authRequirement: SourceAuthRequirement;
  freshnessClass: SourceFreshnessClass;
  mode: "snapshot" | "batch" | "stream";
  supportedSources: string[];
}): SourceCapabilityDescriptor {
  return {
    ...input,
  };
}
