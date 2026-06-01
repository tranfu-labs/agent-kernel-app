export type ExecutionPrepStrategyFamily = "funding_rate_arbitrage";
export type ExecutionPrepMarketType = "linear_perp";
export type ExecutionPrepOrderStyle = "market_like" | "limit_like" | "mixed";
export type ExecutionPrepLegSide = "long" | "short";

export interface ExecutionPrepLeg {
  exchange: string;
  side: ExecutionPrepLegSide;
  instrument: string;
}

export interface ExecutionPrepInstruments {
  normalizedAsset: string;
  marketType: ExecutionPrepMarketType;
  venueSymbols: Record<string, string>;
}

export interface ExecutionPrepMarketReferences {
  fundingRates: Record<string, number | undefined>;
  markPrices?: Record<string, number | undefined>;
  observedAt: string;
}

export interface ExecutionPrepSequenceRecommendation {
  preferredOpenSequence: string[];
  preSecondLegChecks: string[];
}

export interface ExecutionPrepOrderTypeRecommendation {
  preferredStyle: ExecutionPrepOrderStyle;
  notes: string[];
}

export interface ExecutionPrepConfidenceFlags {
  readyForManualExecutionPrep: boolean;
  requiresHumanConfirmation: true;
  missingInputs: string[];
}

export interface ExecutionPrepContract {
  contractVersion: "mvp1.v1";
  opportunityId: string;
  strategyFamily: ExecutionPrepStrategyFamily;
  generatedAt: string;
  exchanges: [string, string];
  instruments: ExecutionPrepInstruments;
  legs: [ExecutionPrepLeg, ExecutionPrepLeg];
  rationale: string[];
  marketReferences: ExecutionPrepMarketReferences;
  sequenceRecommendation: ExecutionPrepSequenceRecommendation;
  orderTypeRecommendation: ExecutionPrepOrderTypeRecommendation;
  abortConditions: string[];
  failedLegHandling: string[];
  riskNotes: string[];
  confidenceFlags: ExecutionPrepConfidenceFlags;
}
