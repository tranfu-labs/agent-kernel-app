import type { FetchStatus } from "./fetch-status.js";
import type {
  ExchangeMarket,
  ExchangeTicker,
  FundingRatePoint,
  MarketContext,
  OrderbookDepthEstimate,
  Venue,
} from "./market-data.js";

export type SourceFamily = "venue_market_data";
export type SourceTransport = "sdk" | "rest" | "browser" | "file" | "stream";
export type SourceAuthRequirement = "public" | "service_token" | "user_secret" | "session_cookie" | "browser_login";
export type SourceFamilyTrustLevel = "official" | "high" | "medium" | "low";
export type SourceFreshnessClass = "realtime" | "near_realtime" | "delayed" | "historical" | "static";

export type VenueMarketDataCapabilityKey =
  | "instrument.catalog"
  | "market.snapshot"
  | "market.funding"
  | "market.depth";

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

export type VenueMarketDataPayloadMap = {
  "instrument.catalog": ExchangeMarket[];
  "market.snapshot": ExchangeTicker[];
  "market.funding": FundingRatePoint[];
  "market.depth": OrderbookDepthEstimate;
  "market.context": MarketContext[];
};

export type VenueMarketDataFactEnvelope<K extends keyof VenueMarketDataPayloadMap> = FactEnvelope<VenueMarketDataPayloadMap[K]> & {
  sourceFamily: "venue_market_data";
  capabilityKey: K;
};

export function createCoverage(requested: string[], returned: string[]): FactCoverage {
  const returnedSet = new Set(returned);
  return {
    requested,
    returned,
    missing: requested.filter((item) => !returnedSet.has(item)),
  };
}

export function createVenueMarketSourceDescriptor(venue: Venue, capabilityKeys: VenueMarketDataCapabilityKey[]): SourceDescriptor {
  return {
    sourceId: `exchange:${venue}`,
    sourceFamily: "venue_market_data",
    providerName: venue,
    transport: "rest",
    authRequirement: "public",
    trustLevel: "official",
    freshnessClass: "realtime",
    supportedCapabilities: capabilityKeys,
    degradationModes: ["partial", "timeout", "rate_limited", "geo_blocked", "unsupported", "failed"],
  };
}

export function createVenueMarketCapabilityDescriptor(
  capabilityKey: VenueMarketDataCapabilityKey,
  supportedSources: Venue[],
): SourceCapabilityDescriptor {
  return {
    capabilityKey,
    sourceFamily: "venue_market_data",
    authRequirement: "public",
    freshnessClass: "realtime",
    mode: capabilityKey === "instrument.catalog" ? "snapshot" : "batch",
    supportedSources: supportedSources.map((venue) => `exchange:${venue}`),
  };
}
