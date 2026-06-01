export const BITGET_USDT_FUTURES_REST_BASE_URL = "https://api.bitget.com";
export const BITGET_USDT_FUTURES_PRODUCT_TYPE = "USDT-FUTURES";

export const BITGET_DEPTH_LIMITS = [5, 15, 50, 100] as const;
export type BitgetDepthLimit = (typeof BITGET_DEPTH_LIMITS)[number];

export function normalizeBitgetDepthLimit(limit?: number): BitgetDepthLimit {
  if (!limit || limit <= 0) return 50;
  for (const candidate of BITGET_DEPTH_LIMITS) {
    if (limit <= candidate) return candidate;
  }
  return 100;
}
