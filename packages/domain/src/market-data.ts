import type { FetchStatus } from "./fetch-status.js";

export type Venue = "binance" | "bitget" | "bybit" | "okx";
export type MarketType = "spot" | "linear_perp" | "inverse_perp";
export type MarketStatus = "trading" | "halted" | "settling" | "unknown";

export interface ExchangeMarket {
  venue: Venue;
  marketType: MarketType;
  symbol: string;
  venueSymbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: MarketStatus;
  contractType?: string;
  onboardDate?: string;
  deliveryDate?: string;
  pricePrecision?: number;
  quantityPrecision?: number;
  minNotionalUsd?: number;
  tickSize?: number;
  stepSize?: number;
}

export interface FundingRatePoint {
  venue: Venue;
  marketType: "linear_perp" | "inverse_perp";
  symbol: string;
  venueSymbol: string;
  fundingRate: number;
  fundingTime?: string;
  nextFundingTime?: string;
  markPrice?: number;
  indexPrice?: number;
  observedAt: string;
  provider: string;
  source: string;
  status: FetchStatus;
  warnings: string[];
}

export interface ExchangeTicker {
  venue: Venue;
  marketType: MarketType;
  symbol: string;
  venueSymbol: string;
  lastPrice?: number;
  markPrice?: number;
  indexPrice?: number;
  bidPrice?: number;
  askPrice?: number;
  bidQty?: number;
  askQty?: number;
  volume24h?: number;
  quoteVolume24h?: number;
  priceChangePercent24h?: number;
  observedAt: string;
  provider: string;
  source: string;
  status: FetchStatus;
  warnings: string[];
}

export interface OrderbookLevel {
  price: number;
  quantity: number;
  notionalUsd?: number;
}

export interface OrderbookSnapshot {
  venue: Venue;
  marketType: MarketType;
  symbol: string;
  venueSymbol: string;
  lastUpdateId?: number;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  observedAt: string;
  provider: string;
  source: string;
  status: FetchStatus;
  warnings: string[];
}

export type LiquidityDepthStatus = "unknown" | "insufficient" | "sufficient" | "strong";

export interface OrderbookDepthEstimate {
  venue: Venue;
  marketType: MarketType;
  symbol: string;
  notionalUsd: number;
  bidSlippageBps?: number;
  askSlippageBps?: number;
  bidFillable: boolean;
  askFillable: boolean;
  liquidityStatus: LiquidityDepthStatus;
  observedAt: string;
  provider: string;
  source: string;
  status: FetchStatus;
  warnings: string[];
}

export interface OpenInterestSnapshot {
  venue: Venue;
  marketType: "linear_perp" | "inverse_perp";
  symbol: string;
  venueSymbol: string;
  openInterest: number;
  openInterestUsd?: number;
  observedAt: string;
  provider: string;
  source: string;
  status: FetchStatus;
  warnings: string[];
}

export interface FundingContext {
  current?: FundingRatePoint;
  history: FundingRatePoint[];
  persistenceScore?: number;
  averageFundingRate?: number;
  maxAbsFundingRate?: number;
  status: FetchStatus;
  warnings: string[];
}

export interface MarketContext {
  venue: Venue;
  marketType: MarketType;
  symbol: string;
  market?: ExchangeMarket;
  ticker?: ExchangeTicker;
  funding?: FundingContext;
  openInterest?: OpenInterestSnapshot;
  depth?: OrderbookDepthEstimate;
  status: FetchStatus;
  warnings: string[];
  fetchedAt: string;
}
