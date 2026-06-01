import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  VENUE_MARKET_DATA_CAPABILITY_REGISTRY,
  VENUE_MARKET_DATA_SOURCES,
  getVenueMarketDataCapability,
  getVenueMarketDataSource,
} from "../../src/source-families/venue-market-data-registry.ts";
import { VenueMarketDataQueryService } from "../../src/source-families/venue-market-data-query-service.ts";
import type { GetMarketContextInput, GetMarketContextOutput } from "../../src/exchanges/exchange-market-data-service.ts";

const fetchedAt = "2026-05-30T00:00:00.000Z";

describe("venue_market_data registry", () => {
  it("registers Binance and Bitget as semantic capability providers", () => {
    assert.deepEqual(
      VENUE_MARKET_DATA_SOURCES.map((source) => source.sourceId),
      ["exchange:binance", "exchange:bitget"],
    );
    const capabilityKeys = VENUE_MARKET_DATA_CAPABILITY_REGISTRY.map((capability) => capability.capabilityKey);
    assert.deepEqual(capabilityKeys, ["instrument.catalog", "market.snapshot", "market.funding", "market.depth"]);
    for (const capability of VENUE_MARKET_DATA_CAPABILITY_REGISTRY) {
      assert.deepEqual(capability.supportedSources, ["exchange:binance", "exchange:bitget"]);
    }
  });

  it("resolves sources and capabilities, and rejects unknown ones", () => {
    assert.equal(getVenueMarketDataSource("bitget").providerName, "bitget");
    assert.equal(getVenueMarketDataCapability("market.depth").capabilityKey, "market.depth");
    assert.throws(() => getVenueMarketDataSource("unknown" as never), /Unsupported venue_market_data source/);
  });
});

describe("VenueMarketDataQueryService", () => {
  it("wraps the existing exchange MarketContext output in a source-family envelope", async () => {
    const calls: GetMarketContextInput[] = [];
    const fakeService = {
      getMarketContext: async (input: GetMarketContextInput): Promise<GetMarketContextOutput> => {
        calls.push(input);
        return {
          contexts: [
            { venue: "binance", marketType: "linear_perp", symbol: "BTCUSDT", status: "ok", warnings: [], fetchedAt },
          ],
          status: "ok",
          warnings: [],
          fetchedAt,
        };
      },
    };
    const service = new VenueMarketDataQueryService(fakeService);

    const envelope = await service.getMarketContext({
      venue: "binance",
      marketType: "linear_perp",
      symbols: ["BTCUSDT", "ETHUSDT"],
    });

    assert.equal(calls.length, 1, "delegates to the backend exactly once");
    assert.equal(envelope.sourceId, "exchange:binance");
    assert.equal(envelope.sourceFamily, "venue_market_data");
    assert.equal(envelope.capabilityKey, "market.context");
    assert.equal(envelope.status, "ok");
    assert.equal(envelope.fetchedAt, fetchedAt);
    assert.equal(envelope.freshnessClass, "realtime");
    assert.equal(envelope.authRequirement, "public");
    assert.deepEqual(envelope.coverage.missing, ["ETHUSDT"]);
    assert.equal(envelope.payload[0]?.symbol, "BTCUSDT");
  });
});
