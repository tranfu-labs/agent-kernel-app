import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createCoverage,
  createVenueMarketCapabilityDescriptor,
  createVenueMarketSourceDescriptor,
  type FactEnvelope,
} from "../src/source-family.ts";

describe("source-family contracts (venue_market_data)", () => {
  it("creates a venue source descriptor scoped to public read capabilities", () => {
    const descriptor = createVenueMarketSourceDescriptor("binance", ["market.snapshot", "market.funding"]);
    assert.equal(descriptor.sourceId, "exchange:binance");
    assert.equal(descriptor.sourceFamily, "venue_market_data");
    assert.equal(descriptor.transport, "rest");
    assert.equal(descriptor.authRequirement, "public");
    assert.equal(descriptor.trustLevel, "official");
    assert.deepEqual(descriptor.supportedCapabilities, ["market.snapshot", "market.funding"]);
    assert.ok(descriptor.degradationModes.includes("timeout"));
  });

  it("creates a semantic capability descriptor, not an endpoint shape", () => {
    const capability = createVenueMarketCapabilityDescriptor("market.funding", ["binance", "bitget"]);
    assert.equal(capability.capabilityKey, "market.funding");
    assert.equal(capability.sourceFamily, "venue_market_data");
    assert.equal(capability.mode, "batch");
    assert.deepEqual(capability.supportedSources, ["exchange:binance", "exchange:bitget"]);
  });

  it("computes coverage gaps from requested vs returned", () => {
    const coverage = createCoverage(["BTCUSDT", "ETHUSDT", "SOLUSDT"], ["BTCUSDT", "SOLUSDT"]);
    assert.deepEqual(coverage.missing, ["ETHUSDT"]);
  });

  it("fact envelope keeps a shared shape while payload stays family-specific", () => {
    const envelope: FactEnvelope<number[]> = {
      sourceId: "exchange:binance",
      provider: "binance",
      sourceFamily: "venue_market_data",
      capabilityKey: "market.snapshot",
      status: "ok",
      warnings: [],
      observedAt: "2026-01-01T00:00:00.000Z",
      fetchedAt: "2026-01-01T00:00:00.000Z",
      freshnessClass: "realtime",
      authRequirement: "public",
      coverage: createCoverage(["BTCUSDT"], ["BTCUSDT"]),
      payload: [1, 2, 3],
    };
    assert.equal(envelope.sourceFamily, "venue_market_data");
    assert.deepEqual(envelope.payload, [1, 2, 3]);
  });
});
