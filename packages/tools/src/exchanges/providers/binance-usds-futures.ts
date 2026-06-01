import { type AdapterFetchResult } from "@agentkernel/domain";

import {
  BINANCE_USDS_FUTURES_REST_BASE_URL,
  BINANCE_USDS_FUTURES_WEIGHTS,
  getBinanceDepthRequestWeight,
  normalizeBinanceDepthLimit,
} from "./binance-rate-limits.js";
import { toBinanceUsdsFuturesSymbol } from "../symbols.js";
import {
  providerFetchErrorFromResponse,
  withFetchEnvelope,
} from "../../shared/fetch-envelope.js";

export interface BinanceUsdsFuturesProviderOptions {
  baseUrl?: string;
  timeoutMs?: number;
}

export interface BinanceExchangeInfoSymbol {
  symbol: string;
  pair?: string;
  contractType?: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
  onboardDate?: number;
  deliveryDate?: number;
  pricePrecision?: number;
  quantityPrecision?: number;
  filters?: Array<Record<string, unknown>>;
}

export interface BinanceExchangeInfo {
  serverTime?: number;
  symbols: BinanceExchangeInfoSymbol[];
}

export interface BinancePremiumIndex {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  estimatedSettlePrice?: string;
  lastFundingRate: string;
  interestRate?: string;
  nextFundingTime: number;
  time: number;
}

export interface BinanceBookTicker {
  symbol: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  time?: number;
}

export interface Binance24hTicker {
  symbol: string;
  lastPrice: string;
  volume: string;
  quoteVolume: string;
  priceChangePercent: string;
  closeTime: number;
}

export interface BinanceFundingHistoryPoint {
  symbol: string;
  fundingRate: string;
  fundingTime: number;
  markPrice?: string;
}

export interface BinanceOpenInterest {
  symbol: string;
  openInterest: string;
  time: number;
}

export interface BinanceDepth {
  lastUpdateId: number;
  E?: number;
  T?: number;
  bids: Array<[string, string]>;
  asks: Array<[string, string]>;
}

export class BinanceUsdsFuturesProvider {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(options: BinanceUsdsFuturesProviderOptions = {}) {
    this.baseUrl = options.baseUrl ?? BINANCE_USDS_FUTURES_REST_BASE_URL;
    this.timeoutMs = options.timeoutMs ?? 10_000;
  }

  getExchangeInfo(): Promise<AdapterFetchResult<BinanceExchangeInfo>> {
    return withFetchEnvelope(
      {
        provider: "binance-usds-futures",
        source: "GET /fapi/v1/exchangeInfo",
        requestWeight: BINANCE_USDS_FUTURES_WEIGHTS.exchangeInfo,
        timeoutMs: this.timeoutMs,
      },
      (signal) => this.requestJson("/fapi/v1/exchangeInfo", undefined, signal),
    );
  }

  getPremiumIndex(symbols?: string[]): Promise<AdapterFetchResult<BinancePremiumIndex[]>> {
    const normalizedSymbols = symbols?.map(toBinanceUsdsFuturesSymbol);
    if (normalizedSymbols?.length === 1) {
      return withFetchEnvelope(
        {
          provider: "binance-usds-futures",
          source: "GET /fapi/v1/premiumIndex",
          requestWeight: BINANCE_USDS_FUTURES_WEIGHTS.premiumIndexSingle,
          timeoutMs: this.timeoutMs,
        },
        async (signal) => [await this.requestJson<BinancePremiumIndex>(
          "/fapi/v1/premiumIndex",
          { symbol: normalizedSymbols[0] },
          signal,
        )],
      );
    }

    return withFetchEnvelope(
      {
        provider: "binance-usds-futures",
        source: "GET /fapi/v1/premiumIndex",
        requestWeight: BINANCE_USDS_FUTURES_WEIGHTS.premiumIndexAll,
        timeoutMs: this.timeoutMs,
      },
      async (signal) => {
        const response = await this.requestJson<BinancePremiumIndex[]>("/fapi/v1/premiumIndex", undefined, signal);
        if (!normalizedSymbols) return response;
        const wanted = new Set(normalizedSymbols);
        return response.filter((point) => wanted.has(point.symbol));
      },
    );
  }

  getBookTickers(symbols?: string[]): Promise<AdapterFetchResult<BinanceBookTicker[]>> {
    const normalizedSymbols = symbols?.map(toBinanceUsdsFuturesSymbol);
    if (normalizedSymbols?.length === 1) {
      return withFetchEnvelope(
        {
          provider: "binance-usds-futures",
          source: "GET /fapi/v1/ticker/bookTicker",
          requestWeight: BINANCE_USDS_FUTURES_WEIGHTS.bookTickerSingle,
          timeoutMs: this.timeoutMs,
        },
        async (signal) => [await this.requestJson<BinanceBookTicker>(
          "/fapi/v1/ticker/bookTicker",
          { symbol: normalizedSymbols[0] },
          signal,
        )],
      );
    }

    return withFetchEnvelope(
      {
        provider: "binance-usds-futures",
        source: "GET /fapi/v1/ticker/bookTicker",
        requestWeight: BINANCE_USDS_FUTURES_WEIGHTS.bookTickerAll,
        timeoutMs: this.timeoutMs,
      },
      async (signal) => {
        const response = await this.requestJson<BinanceBookTicker[]>("/fapi/v1/ticker/bookTicker", undefined, signal);
        if (!normalizedSymbols) return response;
        const wanted = new Set(normalizedSymbols);
        return response.filter((ticker) => wanted.has(ticker.symbol));
      },
    );
  }

  get24hTickers(symbols?: string[]): Promise<AdapterFetchResult<Binance24hTicker[]>> {
    const normalizedSymbols = symbols?.map(toBinanceUsdsFuturesSymbol);
    if (normalizedSymbols?.length === 1) {
      return withFetchEnvelope(
        {
          provider: "binance-usds-futures",
          source: "GET /fapi/v1/ticker/24hr",
          requestWeight: BINANCE_USDS_FUTURES_WEIGHTS.ticker24hSingle,
          timeoutMs: this.timeoutMs,
        },
        async (signal) => [await this.requestJson<Binance24hTicker>(
          "/fapi/v1/ticker/24hr",
          { symbol: normalizedSymbols[0] },
          signal,
        )],
      );
    }

    return withFetchEnvelope(
      {
        provider: "binance-usds-futures",
        source: "GET /fapi/v1/ticker/24hr",
        requestWeight: BINANCE_USDS_FUTURES_WEIGHTS.ticker24hAll,
        timeoutMs: this.timeoutMs,
      },
      async (signal) => {
        const response = await this.requestJson<Binance24hTicker[]>("/fapi/v1/ticker/24hr", undefined, signal);
        if (!normalizedSymbols) return response;
        const wanted = new Set(normalizedSymbols);
        return response.filter((ticker) => wanted.has(ticker.symbol));
      },
    );
  }

  getFundingHistory(symbol: string, limit = 8): Promise<AdapterFetchResult<BinanceFundingHistoryPoint[]>> {
    const normalizedSymbol = toBinanceUsdsFuturesSymbol(symbol);
    return withFetchEnvelope(
      {
        provider: "binance-usds-futures",
        source: "GET /fapi/v1/fundingRate",
        requestWeight: BINANCE_USDS_FUTURES_WEIGHTS.fundingRate,
        timeoutMs: this.timeoutMs,
      },
      (signal) => this.requestJson(
        "/fapi/v1/fundingRate",
        { symbol: normalizedSymbol, limit: String(Math.max(1, Math.min(1000, Math.trunc(limit)))) },
        signal,
      ),
    );
  }

  getOpenInterest(symbol: string): Promise<AdapterFetchResult<BinanceOpenInterest>> {
    const normalizedSymbol = toBinanceUsdsFuturesSymbol(symbol);
    return withFetchEnvelope(
      {
        provider: "binance-usds-futures",
        source: "GET /fapi/v1/openInterest",
        requestWeight: BINANCE_USDS_FUTURES_WEIGHTS.openInterest,
        timeoutMs: this.timeoutMs,
      },
      (signal) => this.requestJson("/fapi/v1/openInterest", { symbol: normalizedSymbol }, signal),
    );
  }

  getOrderbook(symbol: string, limit = 500): Promise<AdapterFetchResult<BinanceDepth>> {
    const normalizedSymbol = toBinanceUsdsFuturesSymbol(symbol);
    const normalizedLimit = normalizeBinanceDepthLimit(limit);
    return withFetchEnvelope(
      {
        provider: "binance-usds-futures",
        source: "GET /fapi/v1/depth",
        requestWeight: getBinanceDepthRequestWeight(normalizedLimit),
        timeoutMs: this.timeoutMs,
      },
      (signal) => this.requestJson(
        "/fapi/v1/depth",
        { symbol: normalizedSymbol, limit: String(normalizedLimit) },
        signal,
      ),
    );
  }

  private async requestJson<TResponse>(
    path: string,
    params: Record<string, string> | undefined,
    signal: AbortSignal,
  ): Promise<TResponse> {
    const url = new URL(`${this.baseUrl.replace(/\/$/, "")}${path}`);
    for (const [key, value] of Object.entries(params ?? {})) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw await providerFetchErrorFromResponse(response, "Binance USDⓈ-M Futures");
    }
    return await response.json() as TResponse;
  }
}

