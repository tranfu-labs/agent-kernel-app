import type { FetchStatus, MarketContext, MarketType, Venue } from "@agentkernel/domain";

import { type GetMarketContextInput, type MarketContextInclude } from "./exchange-market-data-service.js";
import { defaultVenueMarketDataQueryService } from "../source-families/venue-market-data-query-service.js";

export interface GetMarketContextToolInput {
  venue: string;
  marketType?: MarketType;
  symbols: string[];
  include?: MarketContextInclude[];
  targetNotionalUsd?: number;
  maxSymbolsForDepth?: number;
  fundingHistoryLimit?: number;
}

export interface GetMarketContextToolOutput {
  contexts: MarketContext[];
  status: FetchStatus;
  warnings: string[];
  fetchedAt: string;
}

export async function getMarketContext(input: GetMarketContextToolInput): Promise<GetMarketContextToolOutput> {
  const request: GetMarketContextInput = {
    venue: input.venue as Venue,
    marketType: input.marketType ?? "linear_perp",
    symbols: input.symbols,
    include: input.include,
    targetNotionalUsd: input.targetNotionalUsd,
    maxSymbolsForDepth: input.maxSymbolsForDepth,
    fundingHistoryLimit: input.fundingHistoryLimit,
  };

  const envelope = await defaultVenueMarketDataQueryService.getMarketContext(request);
  return {
    contexts: envelope.payload,
    status: envelope.status,
    warnings: envelope.warnings,
    fetchedAt: envelope.fetchedAt,
  };
}
