import type { MarketType, OrderbookDepthEstimate, OrderbookSnapshot, Venue } from "@agentkernel/domain";

import { defaultExchangeMarketDataService } from "./exchange-market-data-service.js";

export interface GetOrderbookDepthInput {
  venue: string;
  symbol: string;
  notionalUsd: number;
  marketType?: MarketType;
  limit?: number;
}

export interface OrderbookDepthOutput extends OrderbookDepthEstimate {
  snapshot?: OrderbookSnapshot;
}

export async function getOrderbookDepth(input: GetOrderbookDepthInput): Promise<OrderbookDepthOutput> {
  const output = await defaultExchangeMarketDataService.getOrderbookDepth({
    venue: input.venue as Venue,
    marketType: input.marketType ?? "linear_perp",
    symbol: input.symbol,
    notionalUsd: input.notionalUsd,
    limit: input.limit,
  });
  return { ...output.depth, snapshot: output.snapshot };
}
