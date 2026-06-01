import {
  createCoverage,
  type FactEnvelope,
  type MarketContext,
  type Venue,
} from "@agentkernel/domain";

import {
  defaultExchangeMarketDataService,
  type ExchangeMarketDataService,
  type GetMarketContextInput,
  type GetMarketContextOutput,
} from "../exchanges/exchange-market-data-service.js";
import { getVenueMarketDataCapability, getVenueMarketDataSource } from "./venue-market-data-registry.js";

export type VenueMarketContextEnvelope = FactEnvelope<MarketContext[]> & {
  sourceFamily: "venue_market_data";
  capabilityKey: "market.context";
};

/**
 * Minimal proving-family query service. It delegates to the existing
 * ExchangeMarketDataService backend and wraps the normalized MarketContext output in a
 * Funding-basis source-family envelope. Slice 1 keeps behavior additive and non-breaking.
 */
export class VenueMarketDataQueryService {
  constructor(private readonly exchangeService: Pick<ExchangeMarketDataService, "getMarketContext"> = defaultExchangeMarketDataService) {}

  async getMarketContext(input: GetMarketContextInput): Promise<VenueMarketContextEnvelope> {
    const source = getVenueMarketDataSource(input.venue as Venue);
    // Prove the capability registry exists without over-routing every internal field yet.
    getVenueMarketDataCapability("market.snapshot");
    getVenueMarketDataCapability("market.funding");

    const result: GetMarketContextOutput = await this.exchangeService.getMarketContext(input);
    return {
      sourceId: source.sourceId,
      provider: source.providerName,
      sourceFamily: "venue_market_data",
      capabilityKey: "market.context",
      status: result.status,
      warnings: result.warnings,
      observedAt: result.contexts.reduce<string | null>((latest, context) => {
        if (!context.fetchedAt) return latest;
        if (!latest) return context.fetchedAt;
        return context.fetchedAt > latest ? context.fetchedAt : latest;
      }, null),
      fetchedAt: result.fetchedAt,
      freshnessClass: "realtime",
      authRequirement: "public",
      coverage: createCoverage(input.symbols, result.contexts.map((context) => context.symbol)),
      payload: result.contexts,
    };
  }
}

export const defaultVenueMarketDataQueryService = new VenueMarketDataQueryService();
