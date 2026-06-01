import type { FetchStatus, FundingRatePoint, MarketType, Venue } from "@agentkernel/domain";

import { defaultExchangeMarketDataService } from "./exchange-market-data-service.js";

export interface GetFundingRatesInput {
  venues: string[];
  symbols: string[];
  marketType?: "linear_perp" | "inverse_perp";
}

export interface GetFundingRatesOutput {
  rates: FundingRatePoint[];
  status: FetchStatus;
  warnings: string[];
  fetchedAt: string;
}

export async function getFundingRates(input: GetFundingRatesInput): Promise<GetFundingRatesOutput> {
  return defaultExchangeMarketDataService.getFundingRates({
    venues: input.venues.map((venue) => venue as Venue),
    marketType: (input.marketType ?? "linear_perp") as Extract<MarketType, "linear_perp" | "inverse_perp">,
    symbols: input.symbols,
  });
}
