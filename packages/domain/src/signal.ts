import type { Venue } from "./market-data.js";

export type SignalType =
  | "cross_venue_funding_divergence"
  | "cross_venue_basis_spread"
  | "cross_venue_price_dislocation"
  | "funding_time_mismatch"
  | "liquidity_imbalance"
  | "provider_data_gap";

export interface Signal {
  id: string;
  type: SignalType;
  symbol: string;
  venues: [Venue, Venue];
  comparisonId: string;
  evidenceBundleId?: string;
  longVenue?: Venue;
  shortVenue?: Venue;
  grossEdgeBps?: number;
  feeEstimateBps?: number;
  slippageEstimateBps?: number;
  netEdgeBps?: number;
  strength: number;
  observedAt: string;
  summary: string;
  warnings: string[];
}
