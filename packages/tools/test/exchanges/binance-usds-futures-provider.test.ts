import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";

import { getBinanceDepthRequestWeight, normalizeBinanceDepthLimit } from "../../src/exchanges/providers/binance-rate-limits.ts";
import { BinanceUsdsFuturesProvider } from "../../src/exchanges/providers/binance-usds-futures.ts";
import { mapHttpResponseToFetchStatus } from "../../src/shared/fetch-envelope.ts";

describe("Binance USDⓈ-M Futures provider", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("normalizes depth limits to official Binance buckets", () => {
    assert.equal(normalizeBinanceDepthLimit(0), 500);
    assert.equal(normalizeBinanceDepthLimit(5), 5);
    assert.equal(normalizeBinanceDepthLimit(6), 10);
    assert.equal(normalizeBinanceDepthLimit(11), 20);
    assert.equal(normalizeBinanceDepthLimit(21), 50);
    assert.equal(normalizeBinanceDepthLimit(51), 100);
    assert.equal(normalizeBinanceDepthLimit(101), 500);
    assert.equal(normalizeBinanceDepthLimit(501), 1000);
  });

  it("uses official depth request weight buckets", () => {
    assert.equal(getBinanceDepthRequestWeight(5), 2);
    assert.equal(getBinanceDepthRequestWeight(50), 2);
    assert.equal(getBinanceDepthRequestWeight(100), 5);
    assert.equal(getBinanceDepthRequestWeight(500), 10);
    assert.equal(getBinanceDepthRequestWeight(1000), 20);
  });

  it("uses official request weights and params for premium index, context endpoints, and depth", async () => {
    const calls: string[] = [];
    mock.method(globalThis, "fetch", async (url: string | URL) => {
      const value = url.toString();
      calls.push(value);
      if (value.includes("premiumIndex") && value.includes("symbol=")) {
        return Response.json({ symbol: "BTCUSDT", markPrice: "1", indexPrice: "1", lastFundingRate: "0", nextFundingTime: 1, time: 1 });
      }
      if (value.includes("premiumIndex")) return Response.json([]);
      if (value.includes("ticker/24hr") && value.includes("symbol=")) {
        return Response.json({ symbol: "BTCUSDT", lastPrice: "1", volume: "2", quoteVolume: "3", priceChangePercent: "4", closeTime: 1 });
      }
      if (value.includes("fundingRate")) return Response.json([{ symbol: "BTCUSDT", fundingRate: "0.001", fundingTime: 1, markPrice: "1" }]);
      if (value.includes("openInterest")) return Response.json({ symbol: "BTCUSDT", openInterest: "100", time: 1 });
      return Response.json({ lastUpdateId: 1, bids: [], asks: [] });
    });

    const provider = new BinanceUsdsFuturesProvider({ baseUrl: "https://example.test/proxy", timeoutMs: 1_000 });

    const singlePremium = await provider.getPremiumIndex(["BTCUSDT"]);
    const allPremium = await provider.getPremiumIndex(["BTCUSDT", "ETHUSDT"]);
    const ticker24h = await provider.get24hTickers(["BTCUSDT"]);
    const fundingHistory = await provider.getFundingHistory("BTCUSDT", 8);
    const openInterest = await provider.getOpenInterest("BTCUSDT");
    const depth = await provider.getOrderbook("BTCUSDT", 5);

    assert.equal(singlePremium.requestWeight, 1);
    assert.equal(allPremium.requestWeight, 10);
    assert.equal(ticker24h.requestWeight, 1);
    assert.equal(fundingHistory.requestWeight, 1);
    assert.equal(openInterest.requestWeight, 1);
    assert.equal(depth.requestWeight, 2);
    assert.equal(new URL(calls[0]).pathname, "/proxy/fapi/v1/premiumIndex");
    assert.equal(new URL(calls[2]).pathname, "/proxy/fapi/v1/ticker/24hr");
    assert.equal(new URL(calls[3]).pathname, "/proxy/fapi/v1/fundingRate");
    assert.equal(new URL(calls[3]).searchParams.get("limit"), "8");
    assert.equal(new URL(calls[4]).pathname, "/proxy/fapi/v1/openInterest");
    assert.equal(new URL(calls[5]).pathname, "/proxy/fapi/v1/depth");
    assert.equal(new URL(calls[5]).searchParams.get("limit"), "5");
  });

  it("maps restricted-location 403 responses to geo_blocked", () => {
    assert.equal(mapHttpResponseToFetchStatus(403, "Service unavailable in a restricted location."), "geo_blocked");
    assert.equal(mapHttpResponseToFetchStatus(403, "Forbidden"), "failed");
    assert.equal(mapHttpResponseToFetchStatus(451, ""), "geo_blocked");
    assert.equal(mapHttpResponseToFetchStatus(429, ""), "rate_limited");
  });
});
