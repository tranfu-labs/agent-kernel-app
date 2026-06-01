import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AdapterFetchResult } from "@agentkernel/domain";
import { ExchangeMarketDataService } from "../../src/exchanges/exchange-market-data-service.ts";
import type {
  Binance24hTicker,
  BinanceBookTicker,
  BinanceDepth,
  BinanceExchangeInfo,
  BinanceFundingHistoryPoint,
  BinanceOpenInterest,
  BinancePremiumIndex,
  BinanceUsdsFuturesProvider,
} from "../../src/exchanges/providers/binance-usds-futures.ts";
import type {
  BitgetContract,
  BitgetFundingRate,
  BitgetTicker,
  BitgetUsdtFuturesProvider,
} from "../../src/exchanges/providers/bitget-usdt-futures.ts";

const fetchedAt = "2026-01-01T00:00:00.000Z";
const observedTime = Date.parse("2026-01-01T00:00:01.000Z");

class FakeBinanceProvider implements Pick<BinanceUsdsFuturesProvider, "getExchangeInfo" | "getPremiumIndex" | "getBookTickers" | "get24hTickers" | "getFundingHistory" | "getOpenInterest" | "getOrderbook"> {
  getExchangeInfo(): Promise<AdapterFetchResult<BinanceExchangeInfo>> {
    return Promise.resolve({
      status: "ok",
      provider: "fake-binance",
      source: "fake exchangeInfo",
      payload: {
        symbols: [
          {
            symbol: "BTCUSDT",
            contractType: "PERPETUAL",
            status: "TRADING",
            baseAsset: "BTC",
            quoteAsset: "USDT",
            pricePrecision: 2,
            quantityPrecision: 3,
            filters: [
              { filterType: "MIN_NOTIONAL", notional: "100" },
              { filterType: "PRICE_FILTER", tickSize: "0.10" },
              { filterType: "LOT_SIZE", stepSize: "0.001" },
            ],
          },
          {
            symbol: "ETHUSDT",
            contractType: "PERPETUAL",
            status: "BREAK",
            baseAsset: "ETH",
            quoteAsset: "USDT",
          },
          {
            symbol: "测试测试USDT",
            contractType: "PERPETUAL",
            status: "TRADING",
            baseAsset: "测试测试",
            quoteAsset: "USDT",
          },
        ],
      },
      warnings: [],
      fetchedAt,
    });
  }

  getPremiumIndex(): Promise<AdapterFetchResult<BinancePremiumIndex[]>> {
    return Promise.resolve({
      status: "ok",
      provider: "fake-binance",
      source: "fake premiumIndex",
      payload: [
        {
          symbol: "BTCUSDT",
          markPrice: "100.5",
          indexPrice: "100.1",
          lastFundingRate: "0.00025",
          nextFundingTime: observedTime + 3_600_000,
          time: observedTime,
        },
      ],
      warnings: [],
      fetchedAt,
    });
  }

  getBookTickers(): Promise<AdapterFetchResult<BinanceBookTicker[]>> {
    return Promise.resolve({
      status: "ok",
      provider: "fake-binance",
      source: "fake bookTicker",
      payload: [
        {
          symbol: "BTCUSDT",
          bidPrice: "100",
          bidQty: "2",
          askPrice: "101",
          askQty: "3",
          time: observedTime,
        },
      ],
      warnings: [],
      fetchedAt,
    });
  }

  get24hTickers(): Promise<AdapterFetchResult<Binance24hTicker[]>> {
    return Promise.resolve({
      status: "ok",
      provider: "fake-binance",
      source: "fake 24h",
      payload: [
        {
          symbol: "BTCUSDT",
          lastPrice: "100.25",
          volume: "10",
          quoteVolume: "1000",
          priceChangePercent: "0.5",
          closeTime: observedTime,
        },
      ],
      warnings: [],
      fetchedAt,
    });
  }

  getFundingHistory(): Promise<AdapterFetchResult<BinanceFundingHistoryPoint[]>> {
    return Promise.resolve({
      status: "ok",
      provider: "fake-binance",
      source: "fake funding history",
      payload: [
        {
          symbol: "BTCUSDT",
          fundingRate: "0.0002",
          fundingTime: observedTime - 8 * 60 * 60 * 1000,
          markPrice: "100.1",
        },
      ],
      warnings: [],
      fetchedAt,
    });
  }

  getOpenInterest(): Promise<AdapterFetchResult<BinanceOpenInterest>> {
    return Promise.resolve({
      status: "ok",
      provider: "fake-binance",
      source: "fake open interest",
      payload: {
        symbol: "BTCUSDT",
        openInterest: "1234.5",
        time: observedTime,
      },
      warnings: [],
      fetchedAt,
    });
  }

  getOrderbook(): Promise<AdapterFetchResult<BinanceDepth>> {
    return Promise.resolve({
      status: "ok",
      provider: "fake-binance",
      source: "fake depth",
      payload: {
        lastUpdateId: 1,
        T: observedTime,
        bids: [["100", "5"], ["99", "10"]],
        asks: [["101", "4"], ["102", "10"]],
      },
      warnings: [],
      fetchedAt,
    });
  }
}

class FailingBinanceProvider extends FakeBinanceProvider {
  override getPremiumIndex(): Promise<AdapterFetchResult<BinancePremiumIndex[]>> {
    return Promise.resolve({
      status: "rate_limited",
      provider: "fake-binance",
      source: "fake premiumIndex",
      reason: "rate limited",
      warnings: ["rate_limited"],
      fetchedAt,
    });
  }
}

class TimeoutBinanceProvider extends FakeBinanceProvider {
  override getPremiumIndex(): Promise<AdapterFetchResult<BinancePremiumIndex[]>> {
    return Promise.resolve({
      status: "timeout",
      provider: "fake-binance",
      source: "fake premiumIndex",
      reason: "timed out",
      warnings: ["timeout"],
      fetchedAt,
    });
  }
}

class MissingFundingBinanceProvider extends FakeBinanceProvider {
  override getPremiumIndex(): Promise<AdapterFetchResult<BinancePremiumIndex[]>> {
    return Promise.resolve({
      status: "ok",
      provider: "fake-binance",
      source: "fake premiumIndex",
      payload: [],
      warnings: [],
      fetchedAt,
    });
  }
}

class FakeBitgetProvider implements Pick<BitgetUsdtFuturesProvider, "getContracts" | "getTickers" | "getCurrentFundingRates" | "getOrderbook"> {
  getContracts(): Promise<AdapterFetchResult<BitgetContract[]>> {
    return Promise.resolve({
      status: "ok",
      provider: "fake-bitget",
      source: "fake contracts",
      payload: [
        { symbol: "BTCUSDT", baseCoin: "BTC", quoteCoin: "USDT", symbolStatus: "normal", pricePlace: "2", volumePlace: "3", minTradeNum: "0.001" },
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

  getOrderbook(): Promise<AdapterFetchResult<any>> {
    throw new Error("not used in this test");
  }
}

describe("ExchangeMarketDataService", () => {
  it("normalizes funding rates from the provider", async () => {
    const service = new ExchangeMarketDataService({ binanceProvider: new FakeBinanceProvider() as BinanceUsdsFuturesProvider });

    const output = await service.getFundingRates({
      venues: ["binance"],
      marketType: "linear_perp",
      symbols: ["btcusdt"],
    });

    assert.equal(output.status, "ok");
    assert.equal(output.rates.length, 1);
    assert.equal(output.rates[0].venue, "binance");
    assert.equal(output.rates[0].marketType, "linear_perp");
    assert.equal(output.rates[0].symbol, "BTCUSDT");
    assert.equal(output.rates[0].fundingRate, 0.00025);
    assert.equal(output.rates[0].provider, "fake-binance");
    assert.equal(output.rates[0].source, "fake premiumIndex");
    assert.equal(output.rates[0].observedAt, new Date(observedTime).toISOString());
  });

  it("normalizes exchange markets and filters inactive symbols", async () => {
    const service = new ExchangeMarketDataService({ binanceProvider: new FakeBinanceProvider() as BinanceUsdsFuturesProvider });

    const output = await service.getExchangeMarkets({
      venue: "binance",
      marketType: "linear_perp",
      symbols: ["BTC/USDT"],
    });

    assert.equal(output.status, "ok");
    assert.equal(output.markets.length, 1);
    assert.equal(output.markets[0].symbol, "BTCUSDT");
    assert.equal(output.markets[0].minNotionalUsd, 100);
    assert.equal(output.markets[0].tickSize, 0.1);
    assert.equal(output.markets[0].stepSize, 0.001);
  });

  it("normalizes tickers from book ticker and premium index payloads", async () => {
    const service = new ExchangeMarketDataService({ binanceProvider: new FakeBinanceProvider() as BinanceUsdsFuturesProvider });

    const output = await service.getExchangeTickers({
      venues: ["binance"],
      marketType: "linear_perp",
      symbols: ["BTCUSDT"],
    });

    assert.equal(output.status, "ok");
    assert.equal(output.tickers.length, 1);
    assert.equal(output.tickers[0].bidPrice, 100);
    assert.equal(output.tickers[0].askPrice, 101);
    assert.equal(output.tickers[0].markPrice, 100.5);
    assert.equal(output.tickers[0].indexPrice, 100.1);
  });

  it("estimates order book depth and slippage from provider levels", async () => {
    const service = new ExchangeMarketDataService({ binanceProvider: new FakeBinanceProvider() as BinanceUsdsFuturesProvider });

    const output = await service.getOrderbookDepth({
      venue: "binance",
      marketType: "linear_perp",
      symbol: "BTCUSDT",
      notionalUsd: 600,
      limit: 100,
    });

    assert.equal(output.depth.status, "ok");
    assert.equal(output.depth.bidFillable, true);
    assert.equal(output.depth.askFillable, true);
    assert.equal(output.depth.liquidityStatus, "sufficient");
    assert.ok(output.depth.bidSlippageBps !== undefined);
    assert.ok(output.depth.askSlippageBps !== undefined);
    assert.equal(output.snapshot?.bids[0].notionalUsd, 500);
  });

  it("composes Binance market context with common funding-basis fields", async () => {
    const service = new ExchangeMarketDataService({ binanceProvider: new FakeBinanceProvider() as BinanceUsdsFuturesProvider });

    const output = await service.getMarketContext({
      venue: "binance",
      marketType: "linear_perp",
      symbols: ["BTCUSDT"],
      include: ["market", "ticker", "funding", "fundingHistory", "openInterest", "depth"],
      targetNotionalUsd: 600,
      maxSymbolsForDepth: 1,
    });

    assert.equal(output.status, "ok");
    assert.equal(output.contexts.length, 1);
    assert.equal(output.contexts[0]?.market?.symbol, "BTCUSDT");
    assert.equal(output.contexts[0]?.ticker?.markPrice, 100.5);
    assert.equal(output.contexts[0]?.funding?.current?.fundingRate, 0.00025);
    assert.equal(output.contexts[0]?.funding?.history.length, 1);
    assert.equal(output.contexts[0]?.openInterest?.openInterest, 1234.5);
    assert.equal(output.contexts[0]?.depth?.liquidityStatus, "sufficient");
  });

  it("skips depth when Binance market context exceeds depth symbol limit", async () => {
    const service = new ExchangeMarketDataService({ binanceProvider: new FakeBinanceProvider() as BinanceUsdsFuturesProvider });

    const output = await service.getMarketContext({
      venue: "binance",
      marketType: "linear_perp",
      symbols: ["BTCUSDT", "ETHUSDT"],
      include: ["ticker", "funding", "depth"],
      targetNotionalUsd: 600,
      maxSymbolsForDepth: 1,
    });

    assert.match(output.warnings.join(" "), /depth_skipped_symbol_limit:2:1/);
    assert.equal(output.contexts[0]?.depth, undefined);
    assert.equal(output.contexts[1]?.depth, undefined);
  });

  it("returns explicit unsupported status for unsupported venues", async () => {
    const service = new ExchangeMarketDataService({ binanceProvider: new FakeBinanceProvider() as BinanceUsdsFuturesProvider });

    const output = await service.getFundingRates({
      venues: ["okx"],
      marketType: "linear_perp",
      symbols: ["BTCUSDT"],
    });

    assert.equal(output.status, "unsupported");
    assert.deepEqual(output.rates, []);
    assert.match(output.warnings[0], /^unsupported_venue_or_market_type/);
  });

  it("preserves provider failure status instead of fabricating facts", async () => {
    const service = new ExchangeMarketDataService({ binanceProvider: new FailingBinanceProvider() as BinanceUsdsFuturesProvider });

    const output = await service.getFundingRates({
      venues: ["binance"],
      marketType: "linear_perp",
      symbols: ["BTCUSDT"],
    });

    assert.equal(output.status, "rate_limited");
    assert.deepEqual(output.rates, []);
    assert.deepEqual(output.warnings, ["rate_limited", "missing_current_funding_rate:BTCUSDT"]);
  });

  it("adds structured timeout warnings for provider degradation", async () => {
    const service = new ExchangeMarketDataService({ binanceProvider: new TimeoutBinanceProvider() as BinanceUsdsFuturesProvider });

    const output = await service.getFundingRates({
      venues: ["binance"],
      marketType: "linear_perp",
      symbols: ["BTCUSDT"],
    });

    assert.equal(output.status, "timeout");
    assert.deepEqual(output.rates, []);
    assert.ok(output.warnings.includes("timeout"));
    assert.ok(output.warnings.includes("provider_timeout:binance"));
  });

  it("adds structured missing funding warnings when requested symbols have no current funding rate", async () => {
    const service = new ExchangeMarketDataService({ binanceProvider: new MissingFundingBinanceProvider() as BinanceUsdsFuturesProvider });

    const output = await service.getMarketContext({
      venue: "binance",
      marketType: "linear_perp",
      symbols: ["BTCUSDT"],
      include: ["funding"],
    });

    assert.equal(output.status, "ok");
    assert.equal(output.contexts.length, 1);
    assert.equal(output.contexts[0]?.funding, undefined);
    assert.ok(output.warnings.includes("missing_current_funding_rate:BTCUSDT"));
    assert.ok(output.contexts[0]?.warnings.includes("missing_current_funding_rate:BTCUSDT"));
  });

  it("uses per-symbol warnings instead of copying global warnings onto every context", async () => {
    const service = new ExchangeMarketDataService({ binanceProvider: new MissingFundingBinanceProvider() as BinanceUsdsFuturesProvider });

    const output = await service.getMarketContext({
      venue: "binance",
      marketType: "linear_perp",
      symbols: ["BTCUSDT", "ETHUSDT"],
      include: ["funding"],
    });

    assert.equal(output.status, "ok");
    assert.deepEqual(output.contexts[0]?.warnings, ["missing_current_funding_rate:BTCUSDT"]);
    assert.deepEqual(output.contexts[1]?.warnings, ["missing_current_funding_rate:ETHUSDT"]);
  });

  it("does not request unsupported open interest by default for Bitget market context", async () => {
    const service = new ExchangeMarketDataService({ bitgetProvider: new FakeBitgetProvider() as BitgetUsdtFuturesProvider });

    const output = await service.getMarketContext({
      venue: "bitget",
      marketType: "linear_perp",
      symbols: ["BTCUSDT"],
    });

    assert.equal(output.status, "ok");
    assert.equal(output.contexts.length, 1);
    assert.equal(output.contexts[0]?.openInterest, undefined);
    assert.ok(!output.warnings.some((warning) => warning.startsWith("unsupported_open_interest:bitget")));
  });

  it("uses included funding history and open interest timestamps in market context fetchedAt", async () => {
    const service = new ExchangeMarketDataService({ binanceProvider: new FakeBinanceProvider() as BinanceUsdsFuturesProvider });

    const output = await service.getMarketContext({
      venue: "binance",
      marketType: "linear_perp",
      symbols: ["BTCUSDT"],
      include: ["funding", "fundingHistory", "openInterest"],
    });

    assert.equal(output.status, "ok");
    assert.equal(output.contexts.length, 1);
    assert.equal(output.contexts[0]?.fetchedAt, fetchedAt);
  });
});
