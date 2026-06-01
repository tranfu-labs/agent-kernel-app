import type { ExchangeTicker, FetchStatus, MarketType, Venue } from "@agentkernel/domain";

import { defaultExchangeMarketDataService } from "./exchange-market-data-service.js";

export interface GetExchangeTickersToolInput {
  venues: string[];
  marketType?: MarketType;
  symbols: string[];
  fields?: Array<"book" | "mark" | "24h">;
}

export interface GetExchangeTickersToolOutput {
  tickers: ExchangeTicker[];
  status: FetchStatus;
  warnings: string[];
  fetchedAt: string;
}

export async function getExchangeTickers(input: GetExchangeTickersToolInput): Promise<GetExchangeTickersToolOutput> {
  return defaultExchangeMarketDataService.getExchangeTickers({
    venues: input.venues.map((venue) => venue as Venue),
    marketType: input.marketType ?? "linear_perp",
    symbols: input.symbols,
    fields: input.fields,
  });
}
