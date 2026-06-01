import { getExchangeMarkets, getExchangeTickers, getFundingRates, getMarketContext, getOrderbookDepth } from "@agentkernel/funding-basis";

const MVP1_DEMO_SYMBOLS = (process.env.PRISM_BINANCE_MARKET_DATA_SYMBOLS ?? "BTCUSDT,ETHUSDT")
  .split(",")
  .map((symbol) => symbol.trim())
  .filter(Boolean);

export async function runBinanceMarketDataSmoke() {
  const calls = {
    markets: await getExchangeMarkets({
      venue: "binance",
      marketType: "linear_perp",
      symbols: MVP1_DEMO_SYMBOLS,
    }),
    funding: await getFundingRates({
      venues: ["binance"],
      marketType: "linear_perp",
      symbols: MVP1_DEMO_SYMBOLS,
    }),
    tickers: await getExchangeTickers({
      venues: ["binance"],
      marketType: "linear_perp",
      symbols: MVP1_DEMO_SYMBOLS,
      fields: ["book", "mark", "24h"],
    }),
    context: await getMarketContext({
      venue: "binance",
      marketType: "linear_perp",
      symbols: MVP1_DEMO_SYMBOLS,
      include: ["ticker", "funding", "fundingHistory", "openInterest"],
      fundingHistoryLimit: 3,
    }),
    depth: await getOrderbookDepth({
      venue: "binance",
      marketType: "linear_perp",
      symbol: "BTCUSDT",
      notionalUsd: 1000,
      limit: 5,
    }),
  };

  return {
    baseUrl: process.env.PRISM_BINANCE_USDS_FUTURES_BASE_URL ?? "https://fapi.binance.com",
    symbols: MVP1_DEMO_SYMBOLS,
    markets: {
      status: calls.markets.status,
      count: calls.markets.markets.length,
      warnings: calls.markets.warnings,
      symbols: calls.markets.markets.map((market) => market.symbol),
    },
    funding: {
      status: calls.funding.status,
      count: calls.funding.rates.length,
      warnings: calls.funding.warnings,
      sample: calls.funding.rates[0],
    },
    tickers: {
      status: calls.tickers.status,
      count: calls.tickers.tickers.length,
      warnings: calls.tickers.warnings,
      sample: calls.tickers.tickers[0],
    },
    context: {
      status: calls.context.status,
      count: calls.context.contexts.length,
      warnings: calls.context.warnings,
      sample: calls.context.contexts[0],
    },
    depth: {
      status: calls.depth.status,
      liquidityStatus: calls.depth.liquidityStatus,
      bidFillable: calls.depth.bidFillable,
      askFillable: calls.depth.askFillable,
      warnings: calls.depth.warnings,
      snapshotLevels: calls.depth.snapshot?.bids.length,
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runBinanceMarketDataSmoke();
  console.log(JSON.stringify(result, null, 2));
}
