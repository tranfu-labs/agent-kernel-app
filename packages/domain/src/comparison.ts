import type { FetchStatus } from "./fetch-status.js";
import type { MarketContext, MarketType, Venue } from "./market-data.js";
import type { FreshnessStatus } from "./opportunity.js";

export interface CrossVenueComparison {
  id: string;
  symbol: string;
  marketType: MarketType;
  venues: [Venue, Venue];
  legs: [MarketContext, MarketContext];
  fundingDiffBps?: number;
  basisBps?: number;
  markPriceDiffBps?: number;
  nextFundingTimeDeltaMs?: number;
  estimatedSlippageBps?: number;
  estimatedFeeBps?: number;
  estimatedNetEdgeBps?: number;
  freshnessStatus: FreshnessStatus;
  status: FetchStatus;
  warnings: string[];
  fetchedAt: string;
}
