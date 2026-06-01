import type {
  AdapterFetchResult,
  ExchangeMarket,
  ExchangeTicker,
  FetchStatus,
  FundingContext,
  FundingRatePoint,
  MarketContext,
  MarketType,
  OpenInterestSnapshot,
  OrderbookDepthEstimate,
  OrderbookLevel,
  OrderbookSnapshot,
  Venue,
} from "@agentkernel/domain";

import { TtlCache } from "../shared/ttl-cache.js";
import {
  BinanceUsdsFuturesProvider,
  type Binance24hTicker,
  type BinanceBookTicker,
  type BinanceDepth,
  type BinanceExchangeInfo,
  type BinanceFundingHistoryPoint,
  type BinanceOpenInterest,
  type BinanceExchangeInfoSymbol,
  type BinancePremiumIndex,
} from "./providers/binance-usds-futures.js";
import {
  BitgetUsdtFuturesProvider,
  type BitgetContract,
  type BitgetDepth,
  type BitgetFundingRate,
  type BitgetTicker,
} from "./providers/bitget-usdt-futures.js";
import { normalizeSymbol, normalizeSymbols } from "./symbols.js";

export interface GetExchangeMarketsInput {
  venue: Venue;
  marketType: MarketType;
  symbols?: string[];
}

export interface GetExchangeMarketsOutput {
  markets: ExchangeMarket[];
  status: FetchStatus;
  provider: string;
  source: string;
  fetchedAt: string;
  warnings: string[];
}

export interface ServiceGetFundingRatesInput {
  venues: Venue[];
  marketType: "linear_perp" | "inverse_perp";
  symbols: string[];
}

export interface ServiceGetFundingRatesOutput {
  rates: FundingRatePoint[];
  status: FetchStatus;
  warnings: string[];
  fetchedAt: string;
}

export interface GetExchangeTickersInput {
  venues: Venue[];
  marketType: MarketType;
  symbols: string[];
  fields?: Array<"book" | "mark" | "24h">;
}

export interface GetExchangeTickersOutput {
  tickers: ExchangeTicker[];
  status: FetchStatus;
  warnings: string[];
  fetchedAt: string;
}

export interface ServiceGetOrderbookDepthInput {
  venue: Venue;
  marketType: MarketType;
  symbol: string;
  notionalUsd: number;
  limit?: number;
}

export interface ServiceGetOrderbookDepthOutput {
  depth: OrderbookDepthEstimate;
  snapshot?: OrderbookSnapshot;
  warnings: string[];
}

export type MarketContextInclude = "market" | "ticker" | "funding" | "fundingHistory" | "openInterest" | "depth";

export interface GetMarketContextInput {
  venue: Venue;
  marketType: MarketType;
  symbols: string[];
  include?: MarketContextInclude[];
  targetNotionalUsd?: number;
  maxSymbolsForDepth?: number;
  fundingHistoryLimit?: number;
}

export interface GetMarketContextOutput {
  contexts: MarketContext[];
  status: FetchStatus;
  warnings: string[];
  fetchedAt: string;
}

export interface ExchangeMarketDataServiceOptions {
  binanceProvider?: BinanceUsdsFuturesProvider;
  bitgetProvider?: BitgetUsdtFuturesProvider;
}

const TTL_MS = {
  exchangeInfo: 60 * 60 * 1000,
  premiumIndex: 5 * 1000,
  bookTicker: 2 * 1000,
  ticker24h: 15 * 1000,
  fundingHistory: 60 * 1000,
  openInterest: 15 * 1000,
  depth: 2 * 1000,
} as const;

export class ExchangeMarketDataService {
  private readonly binanceProvider: BinanceUsdsFuturesProvider;
  private readonly bitgetProvider: BitgetUsdtFuturesProvider;
  private readonly exchangeInfoCache = new TtlCache<AdapterFetchResult<BinanceExchangeInfo>>();
  private readonly premiumIndexCache = new TtlCache<AdapterFetchResult<BinancePremiumIndex[]>>();
  private readonly bookTickerCache = new TtlCache<AdapterFetchResult<BinanceBookTicker[]>>();
  private readonly ticker24hCache = new TtlCache<AdapterFetchResult<Binance24hTicker[]>>();
  private readonly fundingHistoryCache = new TtlCache<AdapterFetchResult<BinanceFundingHistoryPoint[]>>();
  private readonly openInterestCache = new TtlCache<AdapterFetchResult<BinanceOpenInterest>>();
  private readonly depthCache = new TtlCache<AdapterFetchResult<BinanceDepth>>();
  private readonly bitgetContractsCache = new TtlCache<AdapterFetchResult<BitgetContract[]>>();
  private readonly bitgetTickersCache = new TtlCache<AdapterFetchResult<BitgetTicker[]>>();
  private readonly bitgetFundingCache = new TtlCache<AdapterFetchResult<BitgetFundingRate[]>>();
  private readonly bitgetDepthCache = new TtlCache<AdapterFetchResult<BitgetDepth>>();

  constructor(options: ExchangeMarketDataServiceOptions = {}) {
    this.binanceProvider = options.binanceProvider ?? new BinanceUsdsFuturesProvider({
      baseUrl: process.env.PRISM_BINANCE_USDS_FUTURES_BASE_URL,
    });
    this.bitgetProvider = options.bitgetProvider ?? new BitgetUsdtFuturesProvider({
      baseUrl: process.env.PRISM_BITGET_USDT_FUTURES_BASE_URL,
    });
  }

  async getExchangeMarkets(input: GetExchangeMarketsInput): Promise<GetExchangeMarketsOutput> {
    if (input.marketType !== "linear_perp") {
      return unsupportedMarkets(input.venue, input.marketType);
    }

    if (input.venue === "binance") {
      const result = await this.getBinanceExchangeInfo();
      const symbols = input.symbols ? new Set(normalizeSymbols(input.symbols)) : undefined;
      const markets = (result.payload?.symbols ?? [])
        .filter((symbol) => symbol.status === "TRADING")
        .map(toExchangeMarketOrUndefined)
        .filter((market): market is ExchangeMarket => market !== undefined)
        .filter((market) => !symbols || symbols.has(market.symbol));

      return {
        markets,
        status: result.status,
        provider: result.provider,
        source: result.source,
        fetchedAt: result.fetchedAt,
        warnings: result.warnings,
      };
    }

    if (input.venue === "bitget") {
      const result = await this.getBitgetContracts();
      const symbols = input.symbols ? new Set(normalizeSymbols(input.symbols)) : undefined;
      const warnings = [...result.warnings];
      const markets = (result.payload ?? [])
        .filter((symbol) => symbol.symbolStatus === "normal")
        .flatMap((symbol) => {
          try {
            return [toBitgetExchangeMarket(symbol)];
          } catch (error) {
            if (error instanceof Error && error.message.startsWith("Unsupported symbol format:")) {
              warnings.push(`skipped_invalid_symbol:${symbol.symbol}`);
              return [];
            }
            throw error;
          }
        })
        .filter((market) => !symbols || symbols.has(market.symbol));

      return {
        markets,
        status: result.status,
        provider: result.provider,
        source: result.source,
        fetchedAt: result.fetchedAt,
        warnings,
      };
    }

    return unsupportedMarkets(input.venue, input.marketType);
  }

  async getFundingRates(input: ServiceGetFundingRatesInput): Promise<ServiceGetFundingRatesOutput> {
    const normalizedSymbols = normalizeSymbols(input.symbols);
    const results = await Promise.all(input.venues.map(async (venue) => {
      if (input.marketType !== "linear_perp") {
        return unsupportedFundingRates(venue, input.marketType);
      }
      if (venue === "binance") {
        const result = await this.getBinancePremiumIndex(normalizedSymbols);
        const rates = (result.payload ?? []).map((point) => toFundingRatePoint(point, result));
        const warnings = withFundingDegradationWarnings({
          venue,
          symbols: normalizedSymbols,
          status: result.status,
          warnings: result.warnings,
          returnedSymbols: rates.map((point) => point.symbol),
        });
        return {
          rates,
          status: result.status,
          warnings,
          fetchedAt: result.fetchedAt,
        };
      }
      if (venue === "bitget") {
        const result = await this.getBitgetFundingRates(normalizedSymbols);
        const warnings = [...result.warnings];
        const rates = (result.payload ?? []).flatMap((point) => {
          try {
            return [toBitgetFundingRatePoint(point, result)];
          } catch (error) {
            if (error instanceof Error && error.message.startsWith("Unsupported symbol format:")) {
              warnings.push(`skipped_invalid_symbol:${point.symbol}`);
              return [];
            }
            throw error;
          }
        });
        return {
          rates,
          status: result.status,
          warnings: withFundingDegradationWarnings({
            venue,
            symbols: normalizedSymbols,
            status: result.status,
            warnings,
            returnedSymbols: rates.map((point) => point.symbol),
          }),
          fetchedAt: result.fetchedAt,
        };
      }
      return unsupportedFundingRates(venue, input.marketType);
    }));

    return {
      rates: results.flatMap((result) => result.rates),
      status: aggregateStatus(results.map((result) => result.status)),
      warnings: [...new Set(results.flatMap((result) => result.warnings))],
      fetchedAt: newestFetchedAt(results.map((result) => result.fetchedAt)),
    };
  }

  async getExchangeTickers(input: GetExchangeTickersInput): Promise<GetExchangeTickersOutput> {
    const normalizedSymbols = normalizeSymbols(input.symbols);
    const results = await Promise.all(input.venues.map(async (venue) => {
      if (input.marketType !== "linear_perp") {
        return unsupportedTickers(venue, input.marketType);
      }
      if (venue === "binance") {
        const include24h = input.fields?.includes("24h") ?? false;
        const [bookTickers, premiumIndex, ticker24h] = await Promise.all([
          this.getBinanceBookTickers(normalizedSymbols),
          this.getBinancePremiumIndex(normalizedSymbols),
          include24h ? this.getBinance24hTickers(normalizedSymbols) : Promise.resolve(undefined),
        ]);
        return normalizeBinanceTickers(bookTickers, premiumIndex, ticker24h);
      }
      if (venue === "bitget") {
        const result = await this.getBitgetTickers(normalizedSymbols);
        return normalizeBitgetTickers(result);
      }
      return unsupportedTickers(venue, input.marketType);
    }));

    return {
      tickers: results.flatMap((result) => result.tickers),
      status: aggregateStatus(results.map((result) => result.status)),
      warnings: results.flatMap((result) => result.warnings),
      fetchedAt: newestFetchedAt(results.map((result) => result.fetchedAt)),
    };
  }

  async getMarketContext(input: GetMarketContextInput): Promise<GetMarketContextOutput> {
    const symbols = normalizeSymbols(input.symbols);
    const include = new Set(input.include ?? ["market", "ticker", "funding"]);
    const warnings: string[] = [];
    const fetchedAt = new Date().toISOString();
    const markets = include.has("market")
      ? await this.getExchangeMarkets({ venue: input.venue, marketType: input.marketType, symbols })
      : undefined;
    const tickers = include.has("ticker")
      ? await this.getExchangeTickers({ venues: [input.venue], marketType: input.marketType, symbols, fields: ["book", "mark", "24h"] })
      : undefined;
    const funding = include.has("funding") || include.has("fundingHistory")
      ? await this.getFundingRates({ venues: [input.venue], marketType: input.marketType as "linear_perp" | "inverse_perp", symbols })
      : undefined;
    const openInterest = include.has("openInterest")
      ? await this.getOpenInterestSnapshots(input.venue, input.marketType, symbols)
      : undefined;
    const fundingHistory = include.has("fundingHistory")
      ? await this.getFundingHistoryBySymbol(input.venue, input.marketType, symbols, input.fundingHistoryLimit ?? 8)
      : undefined;
    const depthLimit = input.maxSymbolsForDepth ?? 3;
    if (include.has("depth") && symbols.length > depthLimit) {
      warnings.push(`depth_skipped_symbol_limit:${symbols.length}:${depthLimit}`);
    }
    const depth = include.has("depth") && input.targetNotionalUsd !== undefined && symbols.length <= depthLimit
      ? await Promise.all(symbols.map(async (symbol) => [symbol, await this.getOrderbookDepth({
        venue: input.venue,
        marketType: input.marketType,
        symbol,
        notionalUsd: input.targetNotionalUsd ?? 0,
        limit: 5,
      })] as const))
      : [];

    warnings.push(
      ...(markets?.warnings ?? []),
      ...(tickers?.warnings ?? []),
      ...(funding?.warnings ?? []),
      ...(openInterest?.warnings ?? []),
      ...(fundingHistory?.warnings ?? []),
      ...depth.flatMap(([, value]) => value.warnings),
    );

    const marketBySymbol = new Map((markets?.markets ?? []).map((market) => [market.symbol, market]));
    const tickerBySymbol = new Map((tickers?.tickers ?? []).map((ticker) => [ticker.symbol, ticker]));
    const currentFundingBySymbol = new Map((funding?.rates ?? []).map((rate) => [rate.symbol, rate]));
    const historyBySymbol = fundingHistory?.historyBySymbol ?? new Map<string, FundingRatePoint[]>();
    const openInterestBySymbol = openInterest?.openInterestBySymbol ?? new Map<string, OpenInterestSnapshot>();
    const depthBySymbol = new Map(depth.map(([symbol, value]) => [symbol, value.depth]));

    const contexts = symbols.map((symbol) => {
      const fundingContext = toFundingContext(currentFundingBySymbol.get(symbol), historyBySymbol.get(symbol) ?? []);
      const depthEstimate = depthBySymbol.get(symbol);
      const symbolWarnings = [
        ...(markets?.warnings.filter((warning) => warning.includes(symbol)) ?? []),
        ...(tickers?.warnings.filter((warning) => warning.includes(symbol)) ?? []),
        ...(funding?.warnings.filter((warning) => warning.includes(symbol)) ?? []),
        ...(openInterest?.warnings.filter((warning) => warning.includes(symbol)) ?? []),
        ...(fundingHistory?.warnings.filter((warning) => warning.includes(symbol)) ?? []),
        ...(depthEstimate?.warnings ?? []),
      ];
      const statuses = [
        markets?.status,
        tickers?.status,
        funding?.status,
        openInterest?.status,
        fundingHistory?.status,
        depthEstimate?.status,
      ].filter((status): status is FetchStatus => status !== undefined);
      return {
        venue: input.venue,
        marketType: input.marketType,
        symbol,
        market: marketBySymbol.get(symbol),
        ticker: tickerBySymbol.get(symbol),
        funding: fundingContext.current || fundingContext.history.length > 0 ? fundingContext : undefined,
        openInterest: openInterestBySymbol.get(symbol),
        depth: depthEstimate,
        status: aggregateStatus(statuses),
        warnings: [...new Set(symbolWarnings)],
        fetchedAt: newestFetchedAt([
          markets?.fetchedAt,
          tickers?.fetchedAt,
          funding?.fetchedAt,
          openInterest?.fetchedAt,
          fundingHistory?.fetchedAt,
          depthEstimate?.observedAt,
        ].filter((value): value is string => value !== undefined), fetchedAt),
      } satisfies MarketContext;
    });

    return {
      contexts,
      status: aggregateStatus(contexts.map((context) => context.status)),
      warnings: [...new Set(warnings)],
      fetchedAt: newestFetchedAt(contexts.map((context) => context.fetchedAt)),
    };
  }

  async getOrderbookDepth(input: ServiceGetOrderbookDepthInput): Promise<ServiceGetOrderbookDepthOutput> {
    const symbol = normalizeSymbol(input.symbol);
    if (input.marketType !== "linear_perp") {
      const now = new Date().toISOString();
      return {
        depth: {
          venue: input.venue,
          marketType: input.marketType,
          symbol,
          notionalUsd: input.notionalUsd,
          bidFillable: false,
          askFillable: false,
          liquidityStatus: "unknown",
          observedAt: now,
          provider: `${input.venue}-${input.marketType}`,
          source: "unsupported",
          status: "unsupported",
          warnings: [`unsupported_venue_or_market_type:${input.venue}:${input.marketType}`],
        },
        warnings: [`unsupported_venue_or_market_type:${input.venue}:${input.marketType}`],
      };
    }

    if (input.venue === "binance") {
      const result = await this.getBinanceDepth(symbol, input.limit ?? 100);
      const observedAt = result.payload ? observedAtFromBinanceTime(result.payload.T ?? result.payload.E, result.fetchedAt) : result.fetchedAt;
      const snapshot = result.payload
        ? toOrderbookSnapshot(symbol, result.payload, result, observedAt)
        : undefined;
      return {
        depth: snapshot
          ? estimateOrderbookDepth(snapshot, input.notionalUsd)
          : failedOrderbookDepth(input.venue, input.marketType, symbol, input.notionalUsd, result),
        snapshot,
        warnings: result.warnings,
      };
    }

    if (input.venue === "bitget") {
      const result = await this.getBitgetDepth(symbol, input.limit ?? 100);
      const observedAt = result.payload ? timestampToIsoString(result.payload.ts, result.fetchedAt) : result.fetchedAt;
      const snapshot = result.payload
        ? toBitgetOrderbookSnapshot(symbol, result.payload, result, observedAt)
        : undefined;
      return {
        depth: snapshot
          ? estimateOrderbookDepth(snapshot, input.notionalUsd)
          : failedBitgetOrderbookDepth(input.venue, input.marketType, symbol, input.notionalUsd, result),
        snapshot,
        warnings: result.warnings,
      };
    }

    const now = new Date().toISOString();
    return {
      depth: {
        venue: input.venue,
        marketType: input.marketType,
        symbol,
        notionalUsd: input.notionalUsd,
        bidFillable: false,
        askFillable: false,
        liquidityStatus: "unknown",
        observedAt: now,
        provider: `${input.venue}-${input.marketType}`,
        source: "unsupported",
        status: "unsupported",
        warnings: [`unsupported_venue_or_market_type:${input.venue}:${input.marketType}`],
      },
      warnings: [`unsupported_venue_or_market_type:${input.venue}:${input.marketType}`],
    };
  }

  private async getOpenInterestSnapshots(venue: Venue, marketType: MarketType, symbols: string[]) {
    if (venue !== "binance" || marketType !== "linear_perp") {
      return getUnsupportedOpenInterest(venue, marketType, symbols);
    }
    const results = await Promise.all(symbols.map(async (symbol) => this.getBinanceOpenInterest(symbol)));
    return {
      openInterestBySymbol: new Map(results.flatMap((result) => result.payload ? [[
        normalizeSymbol(result.payload.symbol),
        toOpenInterestSnapshot(result.payload, result),
      ] as const] : [])),
      status: aggregateStatus(results.map((result) => result.status)),
      warnings: results.flatMap((result) => result.warnings),
      fetchedAt: newestFetchedAt(results.map((result) => result.fetchedAt)),
    };
  }

  private async getFundingHistoryBySymbol(venue: Venue, marketType: MarketType, symbols: string[], limit: number) {
    if (venue !== "binance" || marketType !== "linear_perp") {
      return getUnsupportedFundingHistory(venue, marketType, symbols);
    }
    const results = await Promise.all(symbols.map(async (symbol) => [symbol, await this.getBinanceFundingHistory(symbol, limit)] as const));
    return {
      historyBySymbol: new Map(results.map(([symbol, result]) => [
        normalizeSymbol(symbol),
        (result.payload ?? []).map((point) => toFundingHistoryPoint(point, result)),
      ])),
      status: aggregateStatus(results.map(([, result]) => result.status)),
      warnings: results.flatMap(([, result]) => result.warnings),
      fetchedAt: newestFetchedAt(results.map(([, result]) => result.fetchedAt)),
    };
  }

  private getBinanceExchangeInfo() {
    return this.exchangeInfoCache.getOrSet(
      "binance:linear_perp:exchangeInfo",
      TTL_MS.exchangeInfo,
      () => this.binanceProvider.getExchangeInfo(),
    );
  }

  private getBinancePremiumIndex(symbols: string[]) {
    const key = `binance:linear_perp:premiumIndex:${symbols.join(",")}`;
    return this.premiumIndexCache.getOrSet(key, TTL_MS.premiumIndex, () => this.binanceProvider.getPremiumIndex(symbols));
  }

  private getBinanceBookTickers(symbols: string[]) {
    const key = `binance:linear_perp:bookTicker:${symbols.join(",")}`;
    return this.bookTickerCache.getOrSet(key, TTL_MS.bookTicker, () => this.binanceProvider.getBookTickers(symbols));
  }

  private getBinance24hTickers(symbols: string[]) {
    const key = `binance:linear_perp:ticker24h:${symbols.join(",")}`;
    return this.ticker24hCache.getOrSet(key, TTL_MS.ticker24h, () => this.binanceProvider.get24hTickers(symbols));
  }

  private getBinanceFundingHistory(symbol: string, limit: number) {
    const normalizedSymbol = normalizeSymbol(symbol);
    const key = `binance:linear_perp:fundingHistory:${normalizedSymbol}:${limit}`;
    return this.fundingHistoryCache.getOrSet(key, TTL_MS.fundingHistory, () => this.binanceProvider.getFundingHistory(normalizedSymbol, limit));
  }

  private getBinanceOpenInterest(symbol: string) {
    const normalizedSymbol = normalizeSymbol(symbol);
    const key = `binance:linear_perp:openInterest:${normalizedSymbol}`;
    return this.openInterestCache.getOrSet(key, TTL_MS.openInterest, () => this.binanceProvider.getOpenInterest(normalizedSymbol));
  }

  private getBinanceDepth(symbol: string, limit: number) {
    const key = `binance:linear_perp:depth:${symbol}:${limit}`;
    return this.depthCache.getOrSet(key, TTL_MS.depth, () => this.binanceProvider.getOrderbook(symbol, limit));
  }

  private getBitgetContracts() {
    return this.bitgetContractsCache.getOrSet(
      "bitget:linear_perp:contracts",
      TTL_MS.exchangeInfo,
      () => this.bitgetProvider.getContracts(),
    );
  }

  private getBitgetTickers(symbols: string[]) {
    const key = `bitget:linear_perp:tickers:${symbols.join(",")}`;
    return this.bitgetTickersCache.getOrSet(key, TTL_MS.ticker24h, () => this.bitgetProvider.getTickers(symbols));
  }

  private getBitgetFundingRates(symbols: string[]) {
    const key = `bitget:linear_perp:funding:${symbols.join(",")}`;
    return this.bitgetFundingCache.getOrSet(key, TTL_MS.premiumIndex, () => this.bitgetProvider.getCurrentFundingRates(symbols));
  }

  private getBitgetDepth(symbol: string, limit: number) {
    const key = `bitget:linear_perp:depth:${symbol}:${limit}`;
    return this.bitgetDepthCache.getOrSet(key, TTL_MS.depth, () => this.bitgetProvider.getOrderbook(symbol, limit));
  }
}

export const defaultExchangeMarketDataService = new ExchangeMarketDataService();

function toExchangeMarketOrUndefined(symbol: BinanceExchangeInfoSymbol): ExchangeMarket | undefined {
  try {
    return toExchangeMarket(symbol);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unsupported symbol format:")) return undefined;
    throw error;
  }
}

function toExchangeMarket(symbol: BinanceExchangeInfoSymbol): ExchangeMarket {
  return {
    venue: "binance",
    marketType: "linear_perp",
    symbol: normalizeSymbol(symbol.symbol),
    venueSymbol: symbol.symbol,
    baseAsset: symbol.baseAsset,
    quoteAsset: symbol.quoteAsset,
    status: symbol.status === "TRADING" ? "trading" : "unknown",
    contractType: symbol.contractType,
    onboardDate: timestampToIso(symbol.onboardDate),
    deliveryDate: timestampToIso(symbol.deliveryDate),
    pricePrecision: symbol.pricePrecision,
    quantityPrecision: symbol.quantityPrecision,
    minNotionalUsd: numberFilter(symbol, "MIN_NOTIONAL", "notional"),
    tickSize: numberFilter(symbol, "PRICE_FILTER", "tickSize"),
    stepSize: numberFilter(symbol, "LOT_SIZE", "stepSize"),
  };
}

function toBitgetExchangeMarket(symbol: BitgetContract): ExchangeMarket {
  return {
    venue: "bitget",
    marketType: "linear_perp",
    symbol: normalizeSymbol(symbol.symbol),
    venueSymbol: symbol.symbol,
    baseAsset: symbol.baseCoin ?? normalizeSymbol(symbol.symbol).replace(/USDT$/, ""),
    quoteAsset: symbol.quoteCoin ?? "USDT",
    status: symbol.symbolStatus === "normal" ? "trading" : "unknown",
    pricePrecision: integerOrUndefined(symbol.pricePlace),
    quantityPrecision: integerOrUndefined(symbol.volumePlace),
    stepSize: numberOrUndefined(symbol.minTradeNum),
  };
}

function toFundingRatePoint(
  point: BinancePremiumIndex,
  result: AdapterFetchResult<BinancePremiumIndex[]>,
): FundingRatePoint {
  return {
    venue: "binance",
    marketType: "linear_perp",
    symbol: normalizeSymbol(point.symbol),
    venueSymbol: point.symbol,
    fundingRate: Number(point.lastFundingRate),
    nextFundingTime: timestampToIso(point.nextFundingTime),
    markPrice: Number(point.markPrice),
    indexPrice: Number(point.indexPrice),
    observedAt: observedAtFromBinanceTime(point.time, result.fetchedAt),
    provider: result.provider,
    source: result.source,
    status: result.status,
    warnings: result.warnings,
  };
}

function toFundingHistoryPoint(
  point: BinanceFundingHistoryPoint,
  result: AdapterFetchResult<BinanceFundingHistoryPoint[]>,
): FundingRatePoint {
  return {
    venue: "binance",
    marketType: "linear_perp",
    symbol: normalizeSymbol(point.symbol),
    venueSymbol: point.symbol,
    fundingRate: Number(point.fundingRate),
    fundingTime: timestampToIso(point.fundingTime),
    markPrice: numberOrUndefined(point.markPrice),
    observedAt: observedAtFromBinanceTime(point.fundingTime, result.fetchedAt),
    provider: result.provider,
    source: result.source,
    status: result.status,
    warnings: result.warnings,
  };
}

function toBitgetFundingRatePoint(
  point: BitgetFundingRate,
  result: AdapterFetchResult<BitgetFundingRate[]>,
): FundingRatePoint {
  return {
    venue: "bitget",
    marketType: "linear_perp",
    symbol: normalizeSymbol(point.symbol),
    venueSymbol: point.symbol,
    fundingRate: Number(point.fundingRate),
    nextFundingTime: timestampToIsoString(point.nextUpdate, undefined),
    observedAt: timestampToIsoString(point.ts, result.fetchedAt),
    provider: result.provider,
    source: result.source,
    status: result.status,
    warnings: result.warnings,
  };
}

function toOpenInterestSnapshot(
  point: BinanceOpenInterest,
  result: AdapterFetchResult<BinanceOpenInterest>,
): OpenInterestSnapshot {
  const openInterest = Number(point.openInterest);
  return {
    venue: "binance",
    marketType: "linear_perp",
    symbol: normalizeSymbol(point.symbol),
    venueSymbol: point.symbol,
    openInterest,
    observedAt: observedAtFromBinanceTime(point.time, result.fetchedAt),
    provider: result.provider,
    source: result.source,
    status: result.status,
    warnings: result.warnings,
  };
}

function toFundingContext(current: FundingRatePoint | undefined, history: FundingRatePoint[]): FundingContext {
  const rates = history.map((point) => point.fundingRate).filter(Number.isFinite);
  const averageFundingRate = rates.length > 0 ? rates.reduce((sum, value) => sum + value, 0) / rates.length : undefined;
  const maxAbsFundingRate = rates.length > 0 ? Math.max(...rates.map(Math.abs)) : undefined;
  const persistenceScore = current && rates.length > 0
    ? rates.filter((rate) => Math.sign(rate) === Math.sign(current.fundingRate)).length / rates.length
    : undefined;
  return {
    current,
    history,
    persistenceScore,
    averageFundingRate,
    maxAbsFundingRate,
    status: aggregateStatus([current?.status, ...history.map((point) => point.status)].filter((status): status is FetchStatus => status !== undefined)),
    warnings: [...new Set([...(current?.warnings ?? []), ...history.flatMap((point) => point.warnings)])],
  };
}

function normalizeBinanceTickers(
  bookTickers: AdapterFetchResult<BinanceBookTicker[]>,
  premiumIndex: AdapterFetchResult<BinancePremiumIndex[]>,
  ticker24h?: AdapterFetchResult<Binance24hTicker[]>,
): GetExchangeTickersOutput {
  const premiumBySymbol = new Map((premiumIndex.payload ?? []).map((point) => [point.symbol, point]));
  const ticker24hBySymbol = new Map((ticker24h?.payload ?? []).map((point) => [point.symbol, point]));
  const statuses = [bookTickers.status, premiumIndex.status, ticker24h?.status].filter((status): status is FetchStatus => status !== undefined);
  const warnings = [...bookTickers.warnings, ...premiumIndex.warnings, ...(ticker24h?.warnings ?? [])];
  return {
    tickers: (bookTickers.payload ?? []).map((ticker) => {
      const premium = premiumBySymbol.get(ticker.symbol);
      const day = ticker24hBySymbol.get(ticker.symbol);
      return {
        venue: "binance",
        marketType: "linear_perp",
        symbol: normalizeSymbol(ticker.symbol),
        venueSymbol: ticker.symbol,
        lastPrice: numberOrUndefined(day?.lastPrice),
        markPrice: premium ? Number(premium.markPrice) : undefined,
        indexPrice: premium ? Number(premium.indexPrice) : undefined,
        bidPrice: Number(ticker.bidPrice),
        askPrice: Number(ticker.askPrice),
        bidQty: Number(ticker.bidQty),
        askQty: Number(ticker.askQty),
        volume24h: numberOrUndefined(day?.volume),
        quoteVolume24h: numberOrUndefined(day?.quoteVolume),
        priceChangePercent24h: numberOrUndefined(day?.priceChangePercent),
        observedAt: observedAtFromBinanceTime(ticker.time ?? premium?.time ?? day?.closeTime, bookTickers.fetchedAt),
        provider: bookTickers.provider,
        source: [bookTickers.source, premiumIndex.source, ticker24h?.source].filter(Boolean).join("; "),
        status: aggregateStatus(statuses),
        warnings,
      } satisfies ExchangeTicker;
    }),
    status: aggregateStatus(statuses),
    warnings,
    fetchedAt: newestFetchedAt([bookTickers.fetchedAt, premiumIndex.fetchedAt, ticker24h?.fetchedAt].filter((value): value is string => value !== undefined)),
  };
}

function normalizeBitgetTickers(result: AdapterFetchResult<BitgetTicker[]>): GetExchangeTickersOutput {
  const warnings = [...result.warnings];
  const tickers = (result.payload ?? []).flatMap((ticker) => {
    try {
      return [{
        venue: "bitget",
        marketType: "linear_perp",
        symbol: normalizeSymbol(ticker.symbol),
        venueSymbol: ticker.symbol,
        lastPrice: numberOrUndefined(ticker.lastPr),
        markPrice: numberOrUndefined(ticker.markPrice),
        indexPrice: numberOrUndefined(ticker.indexPrice),
        bidPrice: numberOrUndefined(ticker.bidPr),
        askPrice: numberOrUndefined(ticker.askPr),
        bidQty: numberOrUndefined(ticker.bidSz),
        askQty: numberOrUndefined(ticker.askSz),
        volume24h: numberOrUndefined(ticker.baseVolume),
        quoteVolume24h: numberOrUndefined(ticker.quoteVolume),
        priceChangePercent24h: numberOrUndefined(ticker.changeUtc24h),
        observedAt: timestampToIsoString(ticker.ts, result.fetchedAt),
        provider: result.provider,
        source: result.source,
        status: result.status,
        warnings: result.warnings,
      } satisfies ExchangeTicker];
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Unsupported symbol format:")) {
        warnings.push(`skipped_invalid_symbol:${ticker.symbol}`);
        return [];
      }
      throw error;
    }
  });

  return {
    tickers,
    status: result.status,
    warnings,
    fetchedAt: result.fetchedAt,
  };
}

async function getUnsupportedOpenInterest(venue: Venue, marketType: MarketType, symbols: string[]) {
  return {
    openInterestBySymbol: new Map<string, OpenInterestSnapshot>(),
    status: "unsupported" as FetchStatus,
    warnings: symbols.map((symbol) => `unsupported_open_interest:${venue}:${marketType}:${symbol}`),
    fetchedAt: new Date().toISOString(),
  };
}

async function getUnsupportedFundingHistory(venue: Venue, marketType: MarketType, symbols: string[]) {
  return {
    historyBySymbol: new Map<string, FundingRatePoint[]>(),
    status: "unsupported" as FetchStatus,
    warnings: symbols.map((symbol) => `unsupported_funding_history:${venue}:${marketType}:${symbol}`),
    fetchedAt: new Date().toISOString(),
  };
}

function toOrderbookSnapshot(
  symbol: string,
  depth: BinanceDepth,
  result: AdapterFetchResult<BinanceDepth>,
  observedAt: string,
): OrderbookSnapshot {
  return {
    venue: "binance",
    marketType: "linear_perp",
    symbol,
    venueSymbol: symbol,
    lastUpdateId: depth.lastUpdateId,
    bids: depth.bids.map(toOrderbookLevel),
    asks: depth.asks.map(toOrderbookLevel),
    observedAt,
    provider: result.provider,
    source: result.source,
    status: result.status,
    warnings: result.warnings,
  };
}

function toBitgetOrderbookSnapshot(
  symbol: string,
  depth: BitgetDepth,
  result: AdapterFetchResult<BitgetDepth>,
  observedAt: string,
): OrderbookSnapshot {
  return {
    venue: "bitget",
    marketType: "linear_perp",
    symbol,
    venueSymbol: symbol,
    bids: depth.bids.map(toOrderbookLevel),
    asks: depth.asks.map(toOrderbookLevel),
    observedAt,
    provider: result.provider,
    source: result.source,
    status: result.status,
    warnings: result.warnings,
  };
}

function estimateOrderbookDepth(snapshot: OrderbookSnapshot, notionalUsd: number): OrderbookDepthEstimate {
  const bid = estimateSide(snapshot.bids, notionalUsd);
  const ask = estimateSide(snapshot.asks, notionalUsd);
  return {
    venue: snapshot.venue,
    marketType: snapshot.marketType,
    symbol: snapshot.symbol,
    notionalUsd,
    bidSlippageBps: bid.slippageBps,
    askSlippageBps: ask.slippageBps,
    bidFillable: bid.fillable,
    askFillable: ask.fillable,
    liquidityStatus: bid.fillable && ask.fillable ? "sufficient" : "insufficient",
    observedAt: snapshot.observedAt,
    provider: snapshot.provider,
    source: snapshot.source,
    status: snapshot.status,
    warnings: snapshot.warnings,
  };
}

function estimateSide(levels: OrderbookLevel[], targetNotionalUsd: number) {
  if (levels.length === 0 || targetNotionalUsd <= 0) {
    return { fillable: false, slippageBps: undefined };
  }

  let remaining = targetNotionalUsd;
  let filledNotional = 0;
  let filledQuantity = 0;
  const topPrice = levels[0].price;

  for (const level of levels) {
    const levelNotional = level.price * level.quantity;
    const takeNotional = Math.min(remaining, levelNotional);
    filledNotional += takeNotional;
    filledQuantity += takeNotional / level.price;
    remaining -= takeNotional;
    if (remaining <= 0) break;
  }

  if (filledNotional <= 0 || filledQuantity <= 0 || remaining > 0) {
    return { fillable: false, slippageBps: undefined };
  }

  const averagePrice = filledNotional / filledQuantity;
  return {
    fillable: true,
    slippageBps: Math.abs(averagePrice - topPrice) / topPrice * 10_000,
  };
}

function failedOrderbookDepth(
  venue: Venue,
  marketType: MarketType,
  symbol: string,
  notionalUsd: number,
  result: AdapterFetchResult<BinanceDepth>,
): OrderbookDepthEstimate {
  return {
    venue,
    marketType,
    symbol,
    notionalUsd,
    bidFillable: false,
    askFillable: false,
    liquidityStatus: "unknown",
    observedAt: result.fetchedAt,
    provider: result.provider,
    source: result.source,
    status: result.status,
    warnings: result.warnings,
  };
}

function failedBitgetOrderbookDepth(
  venue: Venue,
  marketType: MarketType,
  symbol: string,
  notionalUsd: number,
  result: AdapterFetchResult<BitgetDepth>,
): OrderbookDepthEstimate {
  return {
    venue,
    marketType,
    symbol,
    notionalUsd,
    bidFillable: false,
    askFillable: false,
    liquidityStatus: "unknown",
    observedAt: result.fetchedAt,
    provider: result.provider,
    source: result.source,
    status: result.status,
    warnings: result.warnings,
  };
}

function toOrderbookLevel(level: [string, string]): OrderbookLevel {
  const price = Number(level[0]);
  const quantity = Number(level[1]);
  return { price, quantity, notionalUsd: price * quantity };
}

function unsupportedMarkets(venue: Venue, marketType: MarketType): GetExchangeMarketsOutput {
  const now = new Date().toISOString();
  return {
    markets: [],
    status: "unsupported",
    provider: `${venue}-${marketType}`,
    source: "unsupported",
    fetchedAt: now,
    warnings: [`unsupported_venue_or_market_type:${venue}:${marketType}`],
  };
}

function unsupportedFundingRates(
  venue: Venue,
  marketType: "linear_perp" | "inverse_perp",
): ServiceGetFundingRatesOutput {
  return {
    rates: [],
    status: "unsupported",
    warnings: [`unsupported_venue_or_market_type:${venue}:${marketType}`],
    fetchedAt: new Date().toISOString(),
  };
}

function unsupportedTickers(venue: Venue, marketType: MarketType): GetExchangeTickersOutput {
  return {
    tickers: [],
    status: "unsupported",
    warnings: [`unsupported_venue_or_market_type:${venue}:${marketType}`],
    fetchedAt: new Date().toISOString(),
  };
}

function aggregateStatus(statuses: FetchStatus[]): FetchStatus {
  if (statuses.length === 0) return "failed";
  if (statuses.every((status) => status === "ok")) return "ok";
  if (statuses.some((status) => status === "ok")) return "partial";
  if (statuses.some((status) => status === "partial")) return "partial";
  if (statuses.every((status) => status === "empty")) return "empty";
  if (statuses.every((status) => status === "unsupported")) return "unsupported";
  if (statuses.some((status) => status === "rate_limited")) return "rate_limited";
  if (statuses.some((status) => status === "geo_blocked")) return "geo_blocked";
  if (statuses.some((status) => status === "timeout")) return "timeout";
  return "failed";
}

function newestFetchedAt(values: string[], fallback?: string): string {
  if (values.length === 0) return fallback ?? new Date().toISOString();
  return values.reduce((newest, value) => Date.parse(value) > Date.parse(newest) ? value : newest);
}

function withFundingDegradationWarnings(input: {
  venue: Venue;
  symbols: string[];
  status: FetchStatus;
  warnings: string[];
  returnedSymbols: string[];
}): string[] {
  const warnings = [...input.warnings];

  if (input.status === "timeout") {
    warnings.push(`provider_timeout:${input.venue}`);
  }

  const returned = new Set(input.returnedSymbols.map((symbol) => normalizeSymbol(symbol)));
  for (const symbol of input.symbols) {
    if (!returned.has(symbol)) {
      warnings.push(`missing_current_funding_rate:${symbol}`);
    }
  }

  return [...new Set(warnings)];
}

function observedAtFromBinanceTime(time: number | undefined, fallback: string): string {
  return time ? new Date(time).toISOString() : fallback;
}

function timestampToIso(timestamp: number | undefined): string | undefined {
  return timestamp ? new Date(timestamp).toISOString() : undefined;
}

function timestampToIsoString(timestamp: string | number | undefined, fallback: string | undefined): string {
  if (timestamp === undefined) return fallback ?? new Date().toISOString();
  const parsed = Number(timestamp);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : fallback ?? new Date().toISOString();
}

function numberOrUndefined(value: string | number | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function integerOrUndefined(value: string | number | undefined): number | undefined {
  const parsed = numberOrUndefined(value);
  return parsed === undefined ? undefined : Math.trunc(parsed);
}

function numberFilter(symbol: BinanceExchangeInfoSymbol, filterType: string, key: string): number | undefined {
  const filter = symbol.filters?.find((candidate) => candidate.filterType === filterType);
  const value = filter?.[key];
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
