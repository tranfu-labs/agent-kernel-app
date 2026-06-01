import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { getExchangeMarkets } from "../../src/exchanges/get-exchange-markets.ts";
import { getExchangeTickers } from "../../src/exchanges/get-exchange-tickers.ts";
import { getFundingRates } from "../../src/exchanges/get-funding-rates.ts";
import { getMarketContext } from "../../src/exchanges/get-market-context.ts";
import { getOrderbookDepth } from "../../src/exchanges/get-orderbook-depth.ts";
import { defaultExchangeMarketDataService } from "../../src/exchanges/exchange-market-data-service.ts";

const fetchedAt = "2026-05-30T00:00:00.000Z";
const originals = {
  getExchangeMarkets: defaultExchangeMarketDataService.getExchangeMarkets,
  getExchangeTickers: defaultExchangeMarketDataService.getExchangeTickers,
  getFundingRates: defaultExchangeMarketDataService.getFundingRates,
  getMarketContext: defaultExchangeMarketDataService.getMarketContext,
  getOrderbookDepth: defaultExchangeMarketDataService.getOrderbookDepth,
};

afterEach(() => {
  defaultExchangeMarketDataService.getExchangeMarkets = originals.getExchangeMarkets;
  defaultExchangeMarketDataService.getExchangeTickers = originals.getExchangeTickers;
  defaultExchangeMarketDataService.getFundingRates = originals.getFundingRates;
  defaultExchangeMarketDataService.getMarketContext = originals.getMarketContext;
  defaultExchangeMarketDataService.getOrderbookDepth = originals.getOrderbookDepth;
});

describe("exchange read-only tool contracts", () => {
  it("getExchangeMarkets returns normalized read-only market output", async () => {
    defaultExchangeMarketDataService.getExchangeMarkets = async (input) => ({
      markets: [{
        venue: input.venue,
        marketType: input.marketType,
        symbol: "BTCUSDT",
        venueSymbol: "BTCUSDT",
        baseAsset: "BTC",
        quoteAsset: "USDT",
        status: "trading",
      }],
      status: "ok",
      provider: "fixture-provider",
      source: "fixture-source",
      fetchedAt,
      warnings: [],
    });

    const output = await getExchangeMarkets({ venue: "binance", symbols: ["BTCUSDT"] });

    assert.equal(output.status, "ok");
    assert.equal(output.provider, "fixture-provider");
    assert.equal(output.source, "fixture-source");
    assert.equal(output.markets[0]?.venue, "binance");
    assert.equal(output.markets[0]?.symbol, "BTCUSDT");
    assert.deepEqual(output.warnings, []);
  });

  it("getExchangeTickers returns normalized read-only ticker output", async () => {
    defaultExchangeMarketDataService.getExchangeTickers = async (input) => ({
      tickers: [{
        venue: input.venues[0]!,
        marketType: input.marketType,
        symbol: "BTCUSDT",
        venueSymbol: "BTCUSDT",
        markPrice: 100_000,
        bidPrice: 99_990,
        askPrice: 100_010,
        observedAt: fetchedAt,
        provider: "fixture-provider",
        source: "fixture-source",
        status: "ok",
        warnings: [],
      }],
      status: "ok",
      warnings: [],
      fetchedAt,
    });

    const output = await getExchangeTickers({ venues: ["binance"], symbols: ["BTCUSDT"], fields: ["book", "mark"] });

    assert.equal(output.status, "ok");
    assert.equal(output.tickers[0]?.venue, "binance");
    assert.equal(output.tickers[0]?.markPrice, 100_000);
    assert.equal(output.tickers[0]?.provider, "fixture-provider");
    assert.deepEqual(output.warnings, []);
  });

  it("getFundingRates returns normalized read-only funding output", async () => {
    defaultExchangeMarketDataService.getFundingRates = async (input) => ({
      rates: [{
        venue: input.venues[0]!,
        marketType: input.marketType,
        symbol: "BTCUSDT",
        venueSymbol: "BTCUSDT",
        fundingRate: 0.0001,
        nextFundingTime: "2026-05-30T08:00:00.000Z",
        observedAt: fetchedAt,
        provider: "fixture-provider",
        source: "fixture-source",
        status: "ok",
        warnings: [],
      }],
      status: "ok",
      warnings: [],
      fetchedAt,
    });

    const output = await getFundingRates({ venues: ["binance"], symbols: ["BTCUSDT"] });

    assert.equal(output.status, "ok");
    assert.equal(output.rates[0]?.venue, "binance");
    assert.equal(output.rates[0]?.fundingRate, 0.0001);
    assert.equal(output.rates[0]?.provider, "fixture-provider");
    assert.deepEqual(output.warnings, []);
  });

  it("getOrderbookDepth returns normalized read-only depth output", async () => {
    defaultExchangeMarketDataService.getOrderbookDepth = async (input) => ({
      depth: {
        venue: input.venue,
        marketType: input.marketType,
        symbol: "BTCUSDT",
        notionalUsd: input.notionalUsd,
        bidSlippageBps: 1,
        askSlippageBps: 1.2,
        bidFillable: true,
        askFillable: true,
        liquidityStatus: "sufficient",
        observedAt: fetchedAt,
        provider: "fixture-provider",
        source: "fixture-source",
        status: "ok",
        warnings: [],
      },
      snapshot: {
        venue: input.venue,
        marketType: input.marketType,
        symbol: "BTCUSDT",
        venueSymbol: "BTCUSDT",
        bids: [{ price: 99_990, quantity: 1, notionalUsd: 99_990 }],
        asks: [{ price: 100_010, quantity: 1, notionalUsd: 100_010 }],
        observedAt: fetchedAt,
        provider: "fixture-provider",
        source: "fixture-source",
        status: "ok",
        warnings: [],
      },
      warnings: [],
    });

    const output = await getOrderbookDepth({ venue: "binance", symbol: "BTCUSDT", notionalUsd: 1000 });

    assert.equal(output.status, "ok");
    assert.equal(output.venue, "binance");
    assert.equal(output.liquidityStatus, "sufficient");
    assert.equal(output.snapshot?.bids.length, 1);
    assert.deepEqual(output.warnings, []);
  });

  it("getMarketContext returns normalized read-only context output", async () => {
    defaultExchangeMarketDataService.getMarketContext = async (input) => ({
      contexts: [{
        venue: input.venue,
        marketType: input.marketType,
        symbol: "BTCUSDT",
        status: "ok",
        warnings: [],
        fetchedAt,
      }],
      status: "ok",
      warnings: [],
      fetchedAt,
    });

    const output = await getMarketContext({ venue: "binance", symbols: ["BTCUSDT"], include: ["ticker", "funding"] });

    assert.equal(output.status, "ok");
    assert.equal(output.contexts[0]?.venue, "binance");
    assert.equal(output.contexts[0]?.symbol, "BTCUSDT");
    assert.deepEqual(output.warnings, []);
  });
});
