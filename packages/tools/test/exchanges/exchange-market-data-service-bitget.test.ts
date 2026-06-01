import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AdapterFetchResult } from "@agentkernel/domain";
import { ExchangeMarketDataService } from "../../src/exchanges/exchange-market-data-service.ts";
import type {
  BitgetContract,
  BitgetDepth,
  BitgetFundingRate,
  BitgetTicker,
  BitgetUsdtFuturesProvider,
} from "../../src/exchanges/providers/bitget-usdt-futures.ts";

const fetchedAt = "2026-01-01T00:00:00.000Z";
const observedTime = Date.parse("2026-01-01T00:00:01.000Z");

class FakeBitgetProvider implements Pick<BitgetUsdtFuturesProvider, "getContracts" | "getTickers" | "getCurrentFundingRates" | "getOrderbook"> {
  getContracts(): Promise<AdapterFetchResult<BitgetContract[]>> {
    return Promise.resolve({
      status: "ok",
      provider: "fake-bitget",
      source: "fake contracts",
      payload: [
        { symbol: "BTCUSDT", baseCoin: "BTC", quoteCoin: "USDT", symbolStatus: "normal", pricePlace: "2", volumePlace: "3", minTradeNum: "0.001" },
        { symbol: "ETHUSDT", baseCoin: "ETH", quoteCoin: "USDT", symbolStatus: "off" },
      ],
      warnings: [],
      fetchedAt,
    });
  }

  getTickers(): Promise<AdapterFetchResult<BitgetTicker[]>> {
    return Promise.resolve({
      status: "ok",
      provider: "fake-bitget",
      source: "fake tickers",
      payload: [
        {
          symbol: "BTCUSDT",
          lastPr: "100.2",
          markPrice: "100.5",
          indexPrice: "100.1",
          bidPr: "100",
          askPr: "101",
          bidSz: "2",
          askSz: "3",
          baseVolume: "10",
          quoteVolume: "1000",
          changeUtc24h: "0.01",
          ts: String(observedTime),
        },
      ],
      warnings: [],
      fetchedAt,
    });
  }

  getCurrentFundingRates(): Promise<AdapterFetchResult<BitgetFundingRate[]>> {
    return Promise.resolve({
      status: "ok",
      provider: "fake-bitget",
      source: "fake funding",
      payload: [
        { symbol: "BTCUSDT", fundingRate: "0.0003", nextUpdate: String(observedTime + 3_600_000), ts: String(observedTime) },
      ],
      warnings: [],
      fetchedAt,
    });
  }

  getOrderbook(): Promise<AdapterFetchResult<BitgetDepth>> {
    return Promise.resolve({
      status: "ok",
      provider: "fake-bitget",
      source: "fake depth",
      payload: {
        bids: [["100", "5"], ["99", "10"]],
        asks: [["101", "4"], ["102", "10"]],
        ts: String(observedTime),
      },
      warnings: [],
      fetchedAt,
    });
  }
}

describe("ExchangeMarketDataService Bitget support", () => {
  it("normalizes Bitget funding rates", async () => {
    const service = new ExchangeMarketDataService({ bitgetProvider: new FakeBitgetProvider() as BitgetUsdtFuturesProvider });

    const output = await service.getFundingRates({
      venues: ["bitget"],
      marketType: "linear_perp",
      symbols: ["btcusdt"],
    });

    assert.equal(output.status, "ok");
    assert.equal(output.rates.length, 1);
    assert.equal(output.rates[0].venue, "bitget");
    assert.equal(output.rates[0].symbol, "BTCUSDT");
    assert.equal(output.rates[0].fundingRate, 0.0003);
    assert.equal(output.rates[0].provider, "fake-bitget");
    assert.equal(output.rates[0].observedAt, new Date(observedTime).toISOString());
  });

  it("normalizes Bitget markets and filters inactive symbols", async () => {
    const service = new ExchangeMarketDataService({ bitgetProvider: new FakeBitgetProvider() as BitgetUsdtFuturesProvider });

    const output = await service.getExchangeMarkets({
      venue: "bitget",
      marketType: "linear_perp",
      symbols: ["BTC/USDT"],
    });

    assert.equal(output.status, "ok");
    assert.equal(output.markets.length, 1);
    assert.equal(output.markets[0].symbol, "BTCUSDT");
    assert.equal(output.markets[0].baseAsset, "BTC");
    assert.equal(output.markets[0].quoteAsset, "USDT");
  });

  it("normalizes Bitget tickers", async () => {
    const service = new ExchangeMarketDataService({ bitgetProvider: new FakeBitgetProvider() as BitgetUsdtFuturesProvider });

    const output = await service.getExchangeTickers({
      venues: ["bitget"],
      marketType: "linear_perp",
      symbols: ["BTCUSDT"],
    });

    assert.equal(output.status, "ok");
    assert.equal(output.tickers.length, 1);
    assert.equal(output.tickers[0].bidPrice, 100);
    assert.equal(output.tickers[0].askPrice, 101);
    assert.equal(output.tickers[0].markPrice, 100.5);
    assert.equal(output.tickers[0].quoteVolume24h, 1000);
  });

  it("composes Bitget market context with common funding-basis fields", async () => {
    const service = new ExchangeMarketDataService({ bitgetProvider: new FakeBitgetProvider() as BitgetUsdtFuturesProvider });

    const output = await service.getMarketContext({
      venue: "bitget",
      marketType: "linear_perp",
      symbols: ["BTCUSDT"],
      include: ["market", "ticker", "funding", "depth"],
      targetNotionalUsd: 600,
      maxSymbolsForDepth: 1,
    });

    assert.equal(output.status, "ok");
    assert.equal(output.contexts.length, 1);
    assert.equal(output.contexts[0]?.market?.symbol, "BTCUSDT");
    assert.equal(output.contexts[0]?.ticker?.markPrice, 100.5);
    assert.equal(output.contexts[0]?.funding?.current?.fundingRate, 0.0003);
    assert.equal(output.contexts[0]?.depth?.liquidityStatus, "sufficient");
  });

  it("normalizes Bitget order book depth", async () => {
    const service = new ExchangeMarketDataService({ bitgetProvider: new FakeBitgetProvider() as BitgetUsdtFuturesProvider });

    const output = await service.getOrderbookDepth({
      venue: "bitget",
      marketType: "linear_perp",
      symbol: "BTCUSDT",
      notionalUsd: 600,
      limit: 100,
    });

    assert.equal(output.depth.status, "ok");
    assert.equal(output.depth.bidFillable, true);
    assert.equal(output.depth.askFillable, true);
    assert.equal(output.snapshot?.venue, "bitget");
  });
});
