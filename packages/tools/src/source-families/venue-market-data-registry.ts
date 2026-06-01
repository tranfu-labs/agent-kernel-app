import {
  createVenueMarketCapabilityDescriptor,
  createVenueMarketSourceDescriptor,
  type SourceCapabilityDescriptor,
  type SourceDescriptor,
  type Venue,
  type VenueMarketDataCapabilityKey,
} from "@agentkernel/domain";

const VENUE_MARKET_DATA_CAPABILITIES: readonly VenueMarketDataCapabilityKey[] = [
  "instrument.catalog",
  "market.snapshot",
  "market.funding",
  "market.depth",
] as const;

export const VENUE_MARKET_DATA_SOURCES: readonly SourceDescriptor[] = [
  createVenueMarketSourceDescriptor("binance", [...VENUE_MARKET_DATA_CAPABILITIES]),
  createVenueMarketSourceDescriptor("bitget", [...VENUE_MARKET_DATA_CAPABILITIES]),
] as const;

export const VENUE_MARKET_DATA_CAPABILITY_REGISTRY: readonly SourceCapabilityDescriptor[] = [
  createVenueMarketCapabilityDescriptor("instrument.catalog", ["binance", "bitget"]),
  createVenueMarketCapabilityDescriptor("market.snapshot", ["binance", "bitget"]),
  createVenueMarketCapabilityDescriptor("market.funding", ["binance", "bitget"]),
  createVenueMarketCapabilityDescriptor("market.depth", ["binance", "bitget"]),
] as const;

export function getVenueMarketDataSource(venue: Venue): SourceDescriptor {
  const source = VENUE_MARKET_DATA_SOURCES.find((entry) => entry.providerName === venue);
  if (!source) throw new Error(`Unsupported venue_market_data source: ${venue}`);
  return source;
}

export function getVenueMarketDataCapability(capabilityKey: VenueMarketDataCapabilityKey): SourceCapabilityDescriptor {
  const capability = VENUE_MARKET_DATA_CAPABILITY_REGISTRY.find((entry) => entry.capabilityKey === capabilityKey);
  if (!capability) throw new Error(`Unsupported venue_market_data capability: ${capabilityKey}`);
  return capability;
}
