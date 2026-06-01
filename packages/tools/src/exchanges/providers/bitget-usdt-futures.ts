import type { AdapterFetchResult } from "@agentkernel/domain";

import {
  BITGET_USDT_FUTURES_PRODUCT_TYPE,
  BITGET_USDT_FUTURES_REST_BASE_URL,
  normalizeBitgetDepthLimit,
} from "./bitget-rate-limits.js";
import { toBitgetUsdtFuturesSymbol } from "../symbols.js";
import {
  providerFetchErrorFromResponse,
  ProviderFetchError,
  withFetchEnvelope,
} from "../../shared/fetch-envelope.js";

export interface BitgetUsdtFuturesProviderOptions {
  baseUrl?: string;
  timeoutMs?: number;
}

interface BitgetEnvelope<TPayload> {
  code: string;
  msg?: string;
  data: TPayload;
}

export interface BitgetContract {
  symbol: string;
  baseCoin?: string;
  quoteCoin?: string;
  symbolStatus?: string;
  pricePlace?: string;
  volumePlace?: string;
  minTradeNum?: string;
}

export interface BitgetTicker {
  symbol: string;
  lastPr?: string;
  markPrice?: string;
  indexPrice?: string;
  bidPr?: string;
  askPr?: string;
  bidSz?: string;
  askSz?: string;
  baseVolume?: string;
  quoteVolume?: string;
  changeUtc24h?: string;
  ts?: string;
}

export interface BitgetFundingRate {
  symbol: string;
  fundingRate: string;
  nextUpdate?: string;
  ts?: string;
}

export interface BitgetDepth {
  bids: Array<[string, string]>;
  asks: Array<[string, string]>;
  ts?: string;
}

export class BitgetUsdtFuturesProvider {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(options: BitgetUsdtFuturesProviderOptions = {}) {
    this.baseUrl = options.baseUrl ?? BITGET_USDT_FUTURES_REST_BASE_URL;
    this.timeoutMs = options.timeoutMs ?? 10_000;
  }

  getContracts(): Promise<AdapterFetchResult<BitgetContract[]>> {
    return this.get<BitgetContract[]>("/api/v2/mix/market/contracts", { productType: BITGET_USDT_FUTURES_PRODUCT_TYPE });
  }

  getTickers(symbols?: string[]): Promise<AdapterFetchResult<BitgetTicker[]>> {
    const normalizedSymbols = symbols?.map(toBitgetUsdtFuturesSymbol);
    return this.get<BitgetTicker[]>("/api/v2/mix/market/tickers", {
      productType: BITGET_USDT_FUTURES_PRODUCT_TYPE,
      ...(normalizedSymbols?.length === 1 ? { symbol: normalizedSymbols[0] } : {}),
    }).then((result) => {
      if (!normalizedSymbols || normalizedSymbols.length <= 1 || !result.payload) return result;
      const wanted = new Set(normalizedSymbols);
      return { ...result, payload: result.payload.filter((ticker) => wanted.has(ticker.symbol)) };
    });
  }

  getCurrentFundingRates(symbols: string[]): Promise<AdapterFetchResult<BitgetFundingRate[]>> {
    const normalizedSymbols = symbols.map(toBitgetUsdtFuturesSymbol);
    return this.get<BitgetFundingRate[]>("/api/v2/mix/market/current-fund-rate", {
      productType: BITGET_USDT_FUTURES_PRODUCT_TYPE,
      ...(normalizedSymbols.length === 1 ? { symbol: normalizedSymbols[0] } : {}),
    }).then((result) => {
      if (!result.payload) return result;
      const wanted = new Set(normalizedSymbols);
      return { ...result, payload: result.payload.filter((point) => wanted.has(point.symbol)) };
    });
  }

  getOrderbook(symbol: string, limit = 50): Promise<AdapterFetchResult<BitgetDepth>> {
    return this.get<BitgetDepth>("/api/v2/mix/market/merge-depth", {
      productType: BITGET_USDT_FUTURES_PRODUCT_TYPE,
      symbol: toBitgetUsdtFuturesSymbol(symbol),
      limit: String(normalizeBitgetDepthLimit(limit)),
    });
  }

  private async get<TPayload>(path: string, params: Record<string, string>): Promise<AdapterFetchResult<TPayload>> {
    return await withFetchEnvelope(
      {
        provider: "bitget-usdt-futures",
        source: `GET ${path}`,
        timeoutMs: this.timeoutMs,
      },
      async (signal) => {
        const envelope = await this.requestJson<BitgetEnvelope<TPayload>>(path, params, signal);
        if (envelope.code !== "00000") {
          throw new ProviderFetchError(`Bitget request failed with code ${envelope.code}: ${envelope.msg ?? "unknown error"}.`);
        }
        return envelope.data;
      },
    );
  }

  private async requestJson<TResponse>(path: string, params: Record<string, string>, signal: AbortSignal): Promise<TResponse> {
    const url = new URL(`${this.baseUrl.replace(/\/$/, "")}${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw await providerFetchErrorFromResponse(response, "Bitget USDT Futures");
    }
    return await response.json() as TResponse;
  }
}
