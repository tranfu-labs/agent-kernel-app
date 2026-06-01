import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Artifact, ExchangeTicker, FundingRatePoint, Opportunity, OrderbookDepthEstimate } from "@agentkernel/domain";
import { scanFundingOpportunities, type FundingOpportunityScanDependencies } from "../src/funding-opportunity-scan.ts";

const observedAt = "2026-01-01T00:00:00.000Z";
const fetchedAt = "2026-01-01T00:00:01.000Z";

function funding(symbol: string, fundingRate: number): FundingRatePoint {
  return {
    venue: "binance",
    marketType: "linear_perp",
    symbol,
    venueSymbol: symbol,
    fundingRate,
    markPrice: 100,
    indexPrice: 99,
    observedAt,
    provider: "fake-binance",
    source: "fake premiumIndex",
    status: "ok",
    warnings: [],
  };
}

function ticker(symbol: string): ExchangeTicker {
  return {
    venue: "binance",
    marketType: "linear_perp",
    symbol,
    venueSymbol: symbol,
    bidPrice: 99,
    askPrice: 101,
    markPrice: 100,
    indexPrice: 99,
    observedAt,
    provider: "fake-binance",
    source: "fake ticker",
    status: "ok",
    warnings: [],
  };
}

function depth(symbol: string): OrderbookDepthEstimate {
  return {
    venue: "binance",
    marketType: "linear_perp",
    symbol,
    notionalUsd: 1000,
    bidSlippageBps: 0.5,
    askSlippageBps: 0.8,
    bidFillable: true,
    askFillable: true,
    liquidityStatus: "sufficient",
    observedAt,
    provider: "fake-binance",
    source: "fake depth",
    status: "ok",
    warnings: [],
  };
}

describe("scanFundingOpportunities", () => {
  it("ranks candidates, limits depth calls, and saves the strongest artifact", async () => {
    const depthCalls: string[] = [];
    const saved: Artifact<Opportunity>[] = [];
    const deps: FundingOpportunityScanDependencies = {
      async getFundingRates() {
        return { rates: [funding("BTCUSDT", 0.0001), funding("ETHUSDT", 0.0003), funding("SOLUSDT", -0.0002)], status: "ok", warnings: [], fetchedAt };
      },
      async getExchangeTickers() {
        return { tickers: [ticker("BTCUSDT"), ticker("ETHUSDT"), ticker("SOLUSDT")], status: "ok", warnings: [], fetchedAt };
      },
      async getOrderbookDepth(input) {
        depthCalls.push(input.symbol);
        return depth(input.symbol);
      },
      async saveArtifact(artifact) {
        saved.push(artifact);
        return artifact;
      },
      now: () => new Date(observedAt),
      createId: (() => {
        let id = 0;
        return () => `id-${++id}`;
      })(),
    };

    const output = await scanFundingOpportunities({ venues: ["binance"], symbols: ["BTCUSDT", "ETHUSDT", "SOLUSDT"], targetNotionalUsd: 1000, maxCandidatesForDepth: 2 }, deps);

    assert.equal(output.status, "ok");
    assert.equal(output.candidates.length, 3);
    assert.equal(output.candidates[0].symbol, "ETHUSDT");
    assert.deepEqual(depthCalls, ["ETHUSDT", "SOLUSDT"]);
    assert.equal(saved.length, 1);
    assert.equal(output.savedArtifactId, saved[0].id);
    assert.equal(saved[0].type, "opportunity");
  });

  it("returns structured empty output when funding data is unavailable", async () => {
    const deps: FundingOpportunityScanDependencies = {
      async getFundingRates() {
        return { rates: [], status: "timeout", warnings: ["timeout"], fetchedAt };
      },
      async getExchangeTickers() {
        return { tickers: [], status: "timeout", warnings: ["timeout"], fetchedAt };
      },
      async getOrderbookDepth() {
        throw new Error("depth should not be called");
      },
    };

    const output = await scanFundingOpportunities({ venues: ["binance"], symbols: ["BTCUSDT"], targetNotionalUsd: 1000 }, deps);

    assert.equal(output.status, "timeout");
    assert.deepEqual(output.opportunities, []);
    assert.deepEqual(output.candidates, []);
    assert.deepEqual(output.warnings, ["timeout"]);
  });
});
