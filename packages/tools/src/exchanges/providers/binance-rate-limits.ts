export const BINANCE_USDS_FUTURES_REST_BASE_URL = "https://fapi.binance.com";

export const BINANCE_USDS_FUTURES_WEIGHTS = {
  exchangeInfo: 1,
  premiumIndexSingle: 1,
  premiumIndexAll: 10,
  bookTickerSingle: 2,
  bookTickerAll: 5,
  ticker24hSingle: 1,
  ticker24hAll: 40,
  depth5: 2,
  depth10: 2,
  depth20: 2,
  depth50: 2,
  depth100: 5,
  depth500: 10,
  depth1000: 20,
  fundingRate: 1,
  openInterest: 1,
} as const;

export function normalizeBinanceDepthLimit(limit: number): 5 | 10 | 20 | 50 | 100 | 500 | 1000 {
  if (!Number.isFinite(limit) || limit <= 0) return 500;
  if (limit <= 5) return 5;
  if (limit <= 10) return 10;
  if (limit <= 20) return 20;
  if (limit <= 50) return 50;
  if (limit <= 100) return 100;
  if (limit <= 500) return 500;
  return 1000;
}

export function getBinanceDepthRequestWeight(limit: number): number {
  const normalizedLimit = normalizeBinanceDepthLimit(limit);
  if (normalizedLimit <= 50) return BINANCE_USDS_FUTURES_WEIGHTS.depth50;
  if (normalizedLimit <= 100) return BINANCE_USDS_FUTURES_WEIGHTS.depth100;
  if (normalizedLimit <= 500) return BINANCE_USDS_FUTURES_WEIGHTS.depth500;
  return BINANCE_USDS_FUTURES_WEIGHTS.depth1000;
}
