import type { MarketType, Venue } from "./market-data.js";

export type OpportunityType =
  | "funding_rate_arbitrage"
  | "cross_exchange_basis"
  | "polymarket_mispricing"
  | "prediction_market_lag"
  | "wallet_signal"
  | "liquidity_dislocation";

export type LiquidityStatus = "unknown" | "insufficient" | "sufficient" | "strong";
export type FreshnessStatus = "fresh" | "stale" | "mixed";

export type OpportunityStatus =
  | "candidate"
  | "researching"
  | "confirmed"
  | "dismissed"
  | "proposal_created"
  | "expired";

export type OpportunityLifecycleStage =
  | "detected"
  | "verified"
  | "scored"
  | "researched"
  | "proposal_created"
  | "risk_checked"
  | "approved"
  | "rejected"
  | "watched"
  | "executed"
  | "reviewed"
  | "archived"
  | "expired";

export interface OpportunityLeg {
  venue: Venue;
  symbol: string;
  marketType: MarketType;
  side: "long" | "short" | "buy" | "sell";
  role: "entry" | "hedge" | "reference";
  price?: number;
  fundingRate?: number;
}

export interface OpportunityScore {
  totalScore: number;
  confidence: number;
  edgeScore: number;
  liquidityScore: number;
  freshnessScore: number;
  fundingAlignmentScore: number;
  venueReliabilityScore: number;
  riskScore: number;
  evidenceScore: number;
  scoringVersion: "funding-basis-v1" | string;
  scoredAt: string;
  explanation: string[];
}

export interface Opportunity {
  id: string;
  type: OpportunityType;
  title: string;
  objects: string[];
  venues: string[];
  symbols: string[];
  grossEdgeBps?: number;
  feeEstimateBps?: number;
  slippageEstimateBps?: number;
  netEdgeBps?: number;
  confidence: number;
  liquidityStatus: LiquidityStatus;
  freshnessStatus: FreshnessStatus;
  riskFlags: string[];
  evidenceBundleId?: string;
  comparisonIds?: string[];
  signalIds?: string[];
  legs?: OpportunityLeg[];
  score?: OpportunityScore;
  lifecycleStage?: OpportunityLifecycleStage;
  status: OpportunityStatus;
  createdAt: string;
  updatedAt: string;
}
