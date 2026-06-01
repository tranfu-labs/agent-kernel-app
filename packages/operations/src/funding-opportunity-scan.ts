import type {
  Artifact,
  ExchangeTicker,
  FetchStatus,
  FundingContext,
  FundingRatePoint,
  LiquidityStatus,
  Opportunity,
  OrderbookDepthEstimate,
} from "@agentkernel/domain";
import type { Operation } from "./operation.js";
import type { OperationResult } from "./operation-result.js";

export interface FundingOpportunityScanInput {
  venues: string[];
  symbols: string[];
  targetNotionalUsd: number;
  maxCandidatesForDepth?: number;
  feeEstimateBps?: number;
  saveArtifact?: boolean;
  minQuoteVolume24hUsd?: number;
  fundingHistoryLimit?: number;
}

export type FundingOpportunityScanOperation = Operation<FundingOpportunityScanInput> & {
  kind: "discover_opportunity";
  name: "funding_opportunity_scan";
};

export interface FundingOpportunityCandidate {
  symbol: string;
  venues: string[];
  fundingRate: number;
  markPrice?: number;
  indexPrice?: number;
  bidPrice?: number;
  askPrice?: number;
  grossEdgeBps: number;
  feeEstimateBps: number;
  slippageEstimateBps: number;
  netEdgeBps: number;
  confidence: number;
  liquidityStatus: LiquidityStatus;
  freshnessStatus: "fresh" | "stale" | "mixed";
  riskFlags: string[];
  providerWarnings: string[];
  quoteVolume24h?: number;
  openInterest?: number;
  fundingPersistenceScore?: number;
}

export interface FundingOpportunityScanOutput {
  opportunities: Opportunity[];
  candidates: FundingOpportunityCandidate[];
  savedArtifactId?: string;
  status: FetchStatus;
  warnings: string[];
  summary: string;
}

export type FundingOpportunityScanResult = OperationResult<FundingOpportunityScanOutput>;

export interface FundingRatesResult {
  rates: FundingRatePoint[];
  status: FetchStatus;
  warnings: string[];
  fetchedAt: string;
}

export interface ExchangeTickersResult {
  tickers: ExchangeTicker[];
  status: FetchStatus;
  warnings: string[];
  fetchedAt: string;
}

export interface FundingOpportunityContextResult {
  fundingBySymbol?: Map<string, FundingContext>;
  openInterestBySymbol?: Map<string, number>;
  status: FetchStatus;
  warnings: string[];
  fetchedAt: string;
}

export interface FundingOpportunityScanDependencies {
  getFundingRates(input: { venues: string[]; marketType: "linear_perp"; symbols: string[] }): Promise<FundingRatesResult>;
  getExchangeTickers(input: { venues: string[]; marketType: "linear_perp"; symbols: string[]; fields: Array<"book" | "mark" | "24h"> }): Promise<ExchangeTickersResult>;
  getFundingOpportunityContext?(input: { venue: string; marketType: "linear_perp"; symbols: string[]; fundingHistoryLimit: number }): Promise<FundingOpportunityContextResult>;
  getOrderbookDepth(input: { venue: string; marketType: "linear_perp"; symbol: string; notionalUsd: number; limit: number }): Promise<OrderbookDepthEstimate>;
  saveArtifact?(artifact: Artifact<Opportunity>): Promise<Artifact<Opportunity>>;
  now?(): Date;
  createId?(): string;
}

export async function scanFundingOpportunities(
  input: FundingOpportunityScanInput,
  dependencies: FundingOpportunityScanDependencies,
): Promise<FundingOpportunityScanOutput> {
  const symbols = [...new Set(input.symbols.map((symbol) => symbol.toUpperCase()))];
  const maxCandidatesForDepth = Math.max(0, input.maxCandidatesForDepth ?? 3);
  const feeEstimateBps = input.feeEstimateBps ?? 0;
  const minQuoteVolume24hUsd = input.minQuoteVolume24hUsd ?? 0;
  const fundingHistoryLimit = input.fundingHistoryLimit ?? 8;
  const warnings: string[] = [];

  if (symbols.length === 0) {
    return emptyScan("failed", ["no_symbols_requested"], "No symbols were requested.");
  }

  const funding = await dependencies.getFundingRates({ venues: input.venues, marketType: "linear_perp", symbols });
  const tickers = await dependencies.getExchangeTickers({ venues: input.venues, marketType: "linear_perp", symbols, fields: ["book", "mark", "24h"] });
  const context = dependencies.getFundingOpportunityContext && input.venues.length === 1
    ? await dependencies.getFundingOpportunityContext({ venue: input.venues[0], marketType: "linear_perp", symbols, fundingHistoryLimit })
    : undefined;
  warnings.push(...funding.warnings, ...tickers.warnings, ...(context?.warnings ?? []));

  if (funding.rates.length === 0) {
    return emptyScan(aggregateStatus([funding.status, tickers.status]), warnings, "No provider-backed funding rates were available.");
  }

  const tickerBySymbol = new Map(tickers.tickers.map((ticker) => [ticker.symbol, ticker]));
  const fundingContextBySymbol = context?.fundingBySymbol ?? new Map<string, FundingContext>();
  const openInterestBySymbol = context?.openInterestBySymbol ?? new Map<string, number>();
  const rankedFunding = funding.rates
    .filter((rate) => symbols.includes(rate.symbol))
    .filter((rate) => (tickerBySymbol.get(rate.symbol)?.quoteVolume24h ?? Number.POSITIVE_INFINITY) >= minQuoteVolume24hUsd)
    .sort((left, right) => Math.abs(right.fundingRate) - Math.abs(left.fundingRate));

  const depthSymbols = new Set(rankedFunding.slice(0, maxCandidatesForDepth).map((rate) => rate.symbol));
  const depthBySymbol = new Map<string, OrderbookDepthEstimate>();

  for (const rate of rankedFunding) {
    if (!depthSymbols.has(rate.symbol)) continue;
    const depth = await dependencies.getOrderbookDepth({
      venue: rate.venue,
      marketType: "linear_perp",
      symbol: rate.symbol,
      notionalUsd: input.targetNotionalUsd,
      limit: 5,
    });
    depthBySymbol.set(rate.symbol, depth);
    warnings.push(...depth.warnings);
  }

  const candidates = rankedFunding.map((rate) => {
    const ticker = tickerBySymbol.get(rate.symbol);
    const depth = depthBySymbol.get(rate.symbol);
    return toCandidate(rate, ticker, depth, feeEstimateBps, fundingContextBySymbol.get(rate.symbol), openInterestBySymbol.get(rate.symbol));
  }).sort((left, right) => right.netEdgeBps - left.netEdgeBps);

  const opportunities = candidates.map((candidate) => toOpportunity(candidate, dependencies));
  let savedArtifactId: string | undefined;

  if (opportunities.length > 0 && input.saveArtifact !== false && dependencies.saveArtifact) {
    const artifact = await dependencies.saveArtifact(toOpportunityArtifact(opportunities[0], dependencies));
    savedArtifactId = artifact.id;
  } else if (opportunities.length > 0 && input.saveArtifact !== false) {
    warnings.push("artifact_store_unavailable");
  }

  return {
    opportunities,
    candidates,
    savedArtifactId,
    status: aggregateStatus([funding.status, tickers.status, context?.status, ...[...depthBySymbol.values()].map((depth) => depth.status)].filter((status): status is FetchStatus => status !== undefined)),
    warnings: [...new Set(warnings)],
    summary: opportunities.length > 0
      ? `Scanned ${symbols.length} symbols and ranked ${opportunities.length} funding candidates.`
      : "No funding candidates were produced.",
  };
}

function toCandidate(
  rate: FundingRatePoint,
  ticker: ExchangeTicker | undefined,
  depth: OrderbookDepthEstimate | undefined,
  feeEstimateBps: number,
  fundingContext: FundingContext | undefined,
  openInterest: number | undefined,
): FundingOpportunityCandidate {
  const grossEdgeBps = Math.abs(rate.fundingRate) * 10_000;
  const slippageEstimateBps = Math.max(depth?.bidSlippageBps ?? 0, depth?.askSlippageBps ?? 0);
  const netEdgeBps = grossEdgeBps - feeEstimateBps - slippageEstimateBps;
  const riskFlags = ["single_venue_funding_carry_assumption"];

  if (!ticker) riskFlags.push("ticker_unavailable");
  if (!depth) riskFlags.push("depth_not_evaluated");
  if (depth?.liquidityStatus === "unknown") riskFlags.push("liquidity_unknown");
  if (depth?.liquidityStatus === "insufficient") riskFlags.push("liquidity_insufficient");
  if (ticker?.quoteVolume24h === undefined) riskFlags.push("quote_volume_24h_unavailable");
  if (fundingContext?.persistenceScore !== undefined && fundingContext.persistenceScore < 0.5) riskFlags.push("funding_direction_not_persistent");
  if (openInterest === undefined) riskFlags.push("open_interest_unavailable");
  if (netEdgeBps <= 0) riskFlags.push("non_positive_net_edge");

  const providerWarnings = [...rate.warnings, ...(ticker?.warnings ?? []), ...(fundingContext?.warnings ?? []), ...(depth?.warnings ?? [])];

  return {
    symbol: rate.symbol,
    venues: [rate.venue],
    fundingRate: rate.fundingRate,
    markPrice: rate.markPrice ?? ticker?.markPrice,
    indexPrice: rate.indexPrice ?? ticker?.indexPrice,
    bidPrice: ticker?.bidPrice,
    askPrice: ticker?.askPrice,
    grossEdgeBps,
    feeEstimateBps,
    slippageEstimateBps,
    netEdgeBps,
    confidence: confidenceFor(netEdgeBps, depth?.liquidityStatus),
    liquidityStatus: depth?.liquidityStatus ?? "unknown",
    freshnessStatus: providerWarnings.length > 0 ? "mixed" : "fresh",
    riskFlags: [...riskFlags, ...providerWarnings.map((warning) => `provider_warning:${warning}`)],
    providerWarnings,
    quoteVolume24h: ticker?.quoteVolume24h,
    openInterest,
    fundingPersistenceScore: fundingContext?.persistenceScore,
  };
}

function toOpportunity(candidate: FundingOpportunityCandidate, dependencies: Pick<FundingOpportunityScanDependencies, "now" | "createId">): Opportunity {
  const now = (dependencies.now?.() ?? new Date()).toISOString();
  return {
    id: dependencies.createId?.() ?? crypto.randomUUID(),
    type: "funding_rate_arbitrage",
    title: `${candidate.symbol} funding candidate`,
    objects: [],
    venues: candidate.venues,
    symbols: [candidate.symbol],
    grossEdgeBps: candidate.grossEdgeBps,
    feeEstimateBps: candidate.feeEstimateBps,
    slippageEstimateBps: candidate.slippageEstimateBps,
    netEdgeBps: candidate.netEdgeBps,
    confidence: candidate.confidence,
    liquidityStatus: candidate.liquidityStatus,
    freshnessStatus: candidate.freshnessStatus,
    riskFlags: candidate.riskFlags,
    status: "candidate",
    createdAt: now,
    updatedAt: now,
  };
}

function toOpportunityArtifact(opportunity: Opportunity, dependencies: Pick<FundingOpportunityScanDependencies, "now" | "createId">): Artifact<Opportunity> {
  const now = (dependencies.now?.() ?? new Date()).toISOString();
  return {
    id: dependencies.createId?.() ?? crypto.randomUUID(),
    type: "opportunity",
    title: opportunity.title,
    objectIds: opportunity.objects,
    contentMarkdown: `Funding candidate for ${opportunity.symbols.join(", ")} with net edge ${opportunity.netEdgeBps?.toFixed(2) ?? "unknown"} bps. Evidence includes current funding, ticker, selected depth, and any available context fields used by the scanner.`,
    contentJson: opportunity,
    createdAt: now,
    updatedAt: now,
  };
}

function confidenceFor(netEdgeBps: number, liquidityStatus: LiquidityStatus | undefined): number {
  if (netEdgeBps <= 0) return 0.1;
  if (liquidityStatus === "strong") return 0.7;
  if (liquidityStatus === "sufficient") return 0.6;
  return 0.4;
}

function emptyScan(status: FetchStatus, warnings: string[], summary: string): FundingOpportunityScanOutput {
  return {
    opportunities: [],
    candidates: [],
    status,
    warnings: [...new Set(warnings)],
    summary,
  };
}

function aggregateStatus(statuses: FetchStatus[]): FetchStatus {
  if (statuses.length === 0) return "failed";
  const unique = new Set(statuses);
  if (unique.size === 1) return statuses[0];
  if (statuses.some((status) => status === "ok")) return "partial";
  if (statuses.includes("rate_limited")) return "rate_limited";
  if (statuses.includes("geo_blocked")) return "geo_blocked";
  if (statuses.includes("timeout")) return "timeout";
  if (statuses.includes("unsupported")) return "unsupported";
  return "failed";
}
