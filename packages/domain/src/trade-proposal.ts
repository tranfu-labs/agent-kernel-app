export type TradeProposalStatus =
  | "draft"
  | "risk_checked"
  | "pending_confirmation"
  | "approved"
  | "executing"
  | "executed"
  | "rejected"
  | "cancelled"
  | "failed";

export interface TradeLeg {
  venue: string;
  symbol: string;
  marketType: "spot" | "linear_perp" | "inverse_perp" | "polymarket";
  side: "buy" | "sell" | "long" | "short";
  orderType: "market" | "limit" | "post_only";
  notionalUsd: number;
  quantity?: number;
  limitPrice?: number;
  reduceOnly?: boolean;
}

export interface TradeProposal {
  id: string;
  opportunityId?: string;
  strategy: string;
  legs: TradeLeg[];
  expectedGrossEdgeBps?: number;
  expectedNetEdgeBps?: number;
  maxSlippageBps: number;
  maxTotalNotionalUsd: number;
  assumptions: string[];
  riskCheckId?: string;
  status: TradeProposalStatus;
  createdBy: "agent" | "user" | "system";
  createdAt: string;
  updatedAt: string;
}
