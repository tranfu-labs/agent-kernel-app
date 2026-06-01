import type { ExchangeMarket, FetchStatus, MarketType, Venue } from "@agentkernel/domain";

import { defaultExchangeMarketDataService } from "./exchange-market-data-service.js";

export interface GetExchangeMarketsToolInput {
  venue: string;
  marketType?: MarketType;
  symbols?: string[];
}

export interface GetExchangeMarketsToolOutput {
  markets: ExchangeMarket[];
  status: FetchStatus;
  provider: string;
  source: string;
  fetchedAt: string;
  warnings: string[];
}

export async function getExchangeMarkets(input: GetExchangeMarketsToolInput): Promise<GetExchangeMarketsToolOutput> {
  return defaultExchangeMarketDataService.getExchangeMarkets({
    venue: input.venue as Venue,
    marketType: input.marketType ?? "linear_perp",
    symbols: input.symbols,
  });
}
