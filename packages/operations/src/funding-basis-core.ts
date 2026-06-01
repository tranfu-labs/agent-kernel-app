import type {
  Artifact,
  CrossVenueComparison,
  ExecutionPrepContract,
  FetchStatus,
  MarketContext,
  MarketType,
  Opportunity,
  OpportunityScore,
  Signal,
  Venue,
} from "@agentkernel/domain";
import type { FundingRiskGateResult } from "./funding-risk-gate.js";

export interface BuildCrossVenueComparisonInput {
  symbol: string;
  marketType: MarketType;
  contexts: [MarketContext, MarketContext];
  estimatedFeeBps: number;
  now: string;
}

export interface ScoreFundingBasisOpportunityInput {
  comparison: CrossVenueComparison;
  signal: Signal;
  scoredAt: string;
}

export interface EvaluateFundingBasisContextsInput {
  symbols: string[];
  marketType: MarketType;
  venues: [Venue, Venue];
  contexts: MarketContext[];
  estimatedFeeBps: number;
  now: string;
}

export interface EvaluateFundingBasisContextsOutput {
  comparisons: CrossVenueComparison[];
  signals: Signal[];
  opportunities: Opportunity[];
  status: FetchStatus;
  warnings: string[];
}

export interface FundingBasisArtifactEnvelope {
  assumptions: {
    targetNotionalUsd?: number;
    estimatedFeeBps?: number;
    mode?: "conservative" | "balanced" | "research";
  };
  marketContextIds: string[];
  providerFactRefs: string[];
  warnings: string[];
  calculatedMetrics: {
    grossEdgeBps?: number;
    feeEstimateBps?: number;
    slippageEstimateBps?: number;
    netEdgeBps?: number;
    confidence: number;
    score?: number;
  };
  scoreExplanation: string[];
  executionPrep?: {
    contractId: string;
    readyForManualExecutionPrep: boolean;
  };
  riskEvaluation?: {
    decision: FundingRiskGateResult["decision"];
    reasons: string[];
  };
}

export type FundingBasisOpportunityArtifactContent = Opportunity & {
  artifactEnvelope: FundingBasisArtifactEnvelope;
};

export interface CreateOpportunityArtifactOptions {
  targetNotionalUsd?: number;
  estimatedFeeBps?: number;
  mode?: "conservative" | "balanced" | "research";
  marketContextIds?: string[];
  providerFactRefs?: string[];
  executionPrepContract?: ExecutionPrepContract;
  riskEvaluation?: FundingRiskGateResult;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function bps(numerator: number, denominator: number): number | undefined {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return undefined;
  return (numerator / denominator) * 10_000;
}

function fundingRate(context: MarketContext): number | undefined {
  return context.funding?.current?.fundingRate;
}

function maxDepthSlippage(context: MarketContext): number | undefined {
  const values = [context.depth?.bidSlippageBps, context.depth?.askSlippageBps].filter((value): value is number => value !== undefined);
  return values.length === 0 ? undefined : Math.max(...values);
}

function aggregateFetchStatus(statuses: FetchStatus[]): FetchStatus {
  if (statuses.length === 0) return "failed";
  if (statuses.every((status) => status === "ok")) return "ok";
  if (statuses.some((status) => status === "ok")) return "partial";
  if (statuses.some((status) => status === "partial")) return "partial";
  if (statuses.every((status) => status === "empty")) return "empty";
  if (statuses.every((status) => status === "unsupported")) return "unsupported";
  if (statuses.some((status) => status === "rate_limited")) return "rate_limited";
  if (statuses.some((status) => status === "geo_blocked")) return "geo_blocked";
  if (statuses.some((status) => status === "timeout")) return "timeout";
  return "failed";
}

function combinedStatus(contexts: MarketContext[]): FetchStatus {
  return aggregateFetchStatus(contexts.map((context) => context.status));
}

export function buildCrossVenueComparison(input: BuildCrossVenueComparisonInput): CrossVenueComparison {
  const [a, b] = input.contexts;
  const fundingA = fundingRate(a);
  const fundingB = fundingRate(b);
  const fundingDiffBps = fundingA !== undefined && fundingB !== undefined ? round((fundingA - fundingB) * 10_000) : undefined;
  const markA = a.ticker?.markPrice ?? a.ticker?.lastPrice;
  const markB = b.ticker?.markPrice ?? b.ticker?.lastPrice;
  const markPriceDiffBps = markA !== undefined && markB !== undefined ? round(bps(markA - markB, markB) ?? 0) : undefined;
  const slippages = [maxDepthSlippage(a), maxDepthSlippage(b)].filter((value): value is number => value !== undefined);
  const estimatedSlippageBps = slippages.length === 0 ? undefined : round(Math.max(...slippages));
  const grossEdgeBps = Math.abs(fundingDiffBps ?? 0);
  const estimatedNetEdgeBps = round(grossEdgeBps - input.estimatedFeeBps - (estimatedSlippageBps ?? 0));
  const warnings = [...a.warnings, ...b.warnings, ...(a.funding?.warnings ?? []), ...(b.funding?.warnings ?? [])];

  if (fundingDiffBps === undefined) warnings.push(`Missing current funding rate for ${input.symbol}`);

  return {
    id: `cmp_${input.symbol}_${a.venue}_${b.venue}`,
    symbol: input.symbol,
    marketType: input.marketType,
    venues: [a.venue, b.venue],
    legs: [a, b],
    fundingDiffBps,
    basisBps: markPriceDiffBps,
    markPriceDiffBps,
    estimatedSlippageBps,
    estimatedFeeBps: input.estimatedFeeBps,
    estimatedNetEdgeBps,
    freshnessStatus: warnings.length === 0 ? "fresh" : "mixed",
    status: combinedStatus([a, b]),
    warnings,
    fetchedAt: input.now,
  };
}

export function deriveFundingBasisSignal(comparison: CrossVenueComparison): Signal {
  const fundingDiffBps = comparison.fundingDiffBps ?? 0;
  const [venueA, venueB] = comparison.venues;
  const shortVenue = fundingDiffBps >= 0 ? venueA : venueB;
  const longVenue = fundingDiffBps >= 0 ? venueB : venueA;
  const netEdgeBps = comparison.estimatedNetEdgeBps ?? 0;

  return {
    id: `sig_${comparison.symbol}_${venueA}_${venueB}`,
    type: "cross_venue_funding_divergence",
    symbol: comparison.symbol,
    venues: comparison.venues,
    comparisonId: comparison.id,
    longVenue,
    shortVenue,
    grossEdgeBps: Math.abs(fundingDiffBps),
    feeEstimateBps: comparison.estimatedFeeBps,
    slippageEstimateBps: comparison.estimatedSlippageBps,
    netEdgeBps,
    strength: Math.max(0, Math.min(1, netEdgeBps / 20)),
    observedAt: comparison.fetchedAt,
    summary: `${comparison.symbol} funding differs across ${venueA} and ${venueB}.`,
    warnings: comparison.warnings,
  };
}

export function scoreFundingBasisOpportunity(input: ScoreFundingBasisOpportunityInput): OpportunityScore {
  const netEdgeBps = input.signal.netEdgeBps ?? 0;
  const edgeScore = clamp(netEdgeBps * 8);
  const freshnessScore = input.comparison.freshnessStatus === "fresh" ? 100 : input.comparison.freshnessStatus === "mixed" ? 60 : 20;
  const liquidityScore = input.comparison.estimatedSlippageBps === undefined ? 40 : clamp(100 - input.comparison.estimatedSlippageBps * 10);
  const fundingAlignmentScore = input.comparison.nextFundingTimeDeltaMs === undefined || Math.abs(input.comparison.nextFundingTimeDeltaMs) <= 60_000 ? 100 : 60;
  const venueReliabilityScore = input.comparison.status === "ok" ? 80 : 40;
  const riskScore = input.comparison.warnings.length === 0 ? 80 : 50;
  const evidenceScore = input.comparison.status === "ok" ? 80 : 50;
  const totalScore = round(
    edgeScore * 0.3 +
      liquidityScore * 0.15 +
      freshnessScore * 0.15 +
      fundingAlignmentScore * 0.1 +
      venueReliabilityScore * 0.1 +
      riskScore * 0.1 +
      evidenceScore * 0.1,
  );

  return {
    totalScore,
    confidence: round(totalScore / 100),
    edgeScore: round(edgeScore),
    liquidityScore: round(liquidityScore),
    freshnessScore,
    fundingAlignmentScore,
    venueReliabilityScore,
    riskScore,
    evidenceScore,
    scoringVersion: "funding-basis-v1",
    scoredAt: input.scoredAt,
    explanation: [`Estimated net edge is ${round(netEdgeBps)} bps after fees and slippage.`],
  };
}

function opportunityFromSignal(comparison: CrossVenueComparison, signal: Signal, scoredAt: string): Opportunity {
  const score = scoreFundingBasisOpportunity({ comparison, signal, scoredAt });

  return {
    id: `opp_${comparison.symbol}_${signal.shortVenue}_${signal.longVenue}`,
    type: "funding_rate_arbitrage",
    title: `${comparison.symbol} ${comparison.venues.join(" / ")} funding-basis candidate`,
    objects: [],
    venues: [...comparison.venues],
    symbols: [comparison.symbol],
    grossEdgeBps: signal.grossEdgeBps,
    feeEstimateBps: signal.feeEstimateBps,
    slippageEstimateBps: signal.slippageEstimateBps,
    netEdgeBps: signal.netEdgeBps,
    confidence: score.confidence,
    liquidityStatus: (comparison.estimatedSlippageBps ?? 99) <= 5 ? "sufficient" : "unknown",
    freshnessStatus: comparison.freshnessStatus,
    riskFlags: comparison.warnings,
    comparisonIds: [comparison.id],
    signalIds: [signal.id],
    legs: [
      { venue: signal.longVenue!, symbol: comparison.symbol, marketType: comparison.marketType, side: "long", role: "entry" },
      { venue: signal.shortVenue!, symbol: comparison.symbol, marketType: comparison.marketType, side: "short", role: "hedge" },
    ],
    score,
    lifecycleStage: "scored",
    status: "candidate",
    createdAt: scoredAt,
    updatedAt: scoredAt,
  };
}

export function evaluateFundingBasisContexts(input: EvaluateFundingBasisContextsInput): EvaluateFundingBasisContextsOutput {
  const warnings: string[] = [];
  const comparisons: CrossVenueComparison[] = [];

  for (const symbol of input.symbols) {
    const contexts = input.venues.map((venue) => input.contexts.find((context) => context.venue === venue && context.symbol === symbol));
    if (!contexts[0] || !contexts[1]) {
      warnings.push(`Missing complete venue contexts for ${symbol}`);
      continue;
    }

    comparisons.push(
      buildCrossVenueComparison({
        symbol,
        marketType: input.marketType,
        contexts: [contexts[0], contexts[1]],
        estimatedFeeBps: input.estimatedFeeBps,
        now: input.now,
      }),
    );
  }

  const eligibleComparisons = comparisons.filter((comparison) => comparison.fundingDiffBps !== undefined);
  const signals = eligibleComparisons.map(deriveFundingBasisSignal);
  const opportunities = signals
    .map((signal, index) => opportunityFromSignal(eligibleComparisons[index]!, signal, input.now))
    .sort((a, b) => (b.score?.totalScore ?? 0) - (a.score?.totalScore ?? 0));

  warnings.push(...comparisons.flatMap((comparison) => comparison.warnings));

  return {
    comparisons,
    signals,
    opportunities,
    status: comparisons.length === 0 ? "failed" : comparisons.every((comparison) => comparison.status === "ok") ? "ok" : "partial",
    warnings,
  };
}

export function createOpportunityArtifact(
  opportunity: Opportunity,
  createdAt: string,
  options: CreateOpportunityArtifactOptions = {},
): Artifact<FundingBasisOpportunityArtifactContent> {
  const artifactEnvelope: FundingBasisArtifactEnvelope = {
    assumptions: {
      targetNotionalUsd: options.targetNotionalUsd,
      estimatedFeeBps: options.estimatedFeeBps ?? opportunity.feeEstimateBps,
      mode: options.mode,
    },
    marketContextIds: options.marketContextIds ?? [],
    providerFactRefs: options.providerFactRefs ?? [],
    warnings: [...opportunity.riskFlags],
    calculatedMetrics: {
      grossEdgeBps: opportunity.grossEdgeBps,
      feeEstimateBps: opportunity.feeEstimateBps,
      slippageEstimateBps: opportunity.slippageEstimateBps,
      netEdgeBps: opportunity.netEdgeBps,
      confidence: opportunity.confidence,
      score: opportunity.score?.totalScore,
    },
    scoreExplanation: opportunity.score?.explanation ?? [],
    executionPrep: options.executionPrepContract
      ? {
          contractId: options.executionPrepContract.opportunityId,
          readyForManualExecutionPrep: options.executionPrepContract.confidenceFlags.readyForManualExecutionPrep,
        }
      : undefined,
    riskEvaluation: options.riskEvaluation
      ? {
          decision: options.riskEvaluation.decision,
          reasons: options.riskEvaluation.reasons,
        }
      : undefined,
  };

  return {
    id: `artifact_${opportunity.id}`,
    type: "opportunity",
    title: opportunity.title,
    objectIds: opportunity.objects,
    opportunityIds: [opportunity.id],
    evidenceBundleIds: opportunity.evidenceBundleId ? [opportunity.evidenceBundleId] : [],
    marketContextIds: artifactEnvelope.marketContextIds,
    comparisonIds: opportunity.comparisonIds,
    signalIds: opportunity.signalIds,
    executionPrepContractId: options.executionPrepContract ? `execution_prep_${options.executionPrepContract.opportunityId}` : undefined,
    riskEvaluationId: options.riskEvaluation ? `risk_eval_${opportunity.id}` : undefined,
    prepAssumptionRefs: [
      artifactEnvelope.assumptions.targetNotionalUsd !== undefined ? `targetNotionalUsd:${artifactEnvelope.assumptions.targetNotionalUsd}` : undefined,
      artifactEnvelope.assumptions.estimatedFeeBps !== undefined ? `estimatedFeeBps:${artifactEnvelope.assumptions.estimatedFeeBps}` : undefined,
      artifactEnvelope.assumptions.mode ? `mode:${artifactEnvelope.assumptions.mode}` : undefined,
    ].filter((value): value is string => value !== undefined),
    createdBy: "operation",
    contentMarkdown: [
      `# ${opportunity.title}`,
      "",
      `- Venues: ${opportunity.venues.join(" / ")}`,
      `- Symbols: ${opportunity.symbols.join(", ")}`,
      `- Gross edge: ${opportunity.grossEdgeBps ?? "unknown"} bps`,
      `- Net edge: ${opportunity.netEdgeBps ?? "unknown"} bps`,
      `- Confidence: ${opportunity.confidence}`,
      `- Score: ${opportunity.score?.totalScore ?? "unknown"}`,
      artifactEnvelope.assumptions.targetNotionalUsd !== undefined ? `- Target notional: ${artifactEnvelope.assumptions.targetNotionalUsd} USD` : "- Target notional: unknown",
      artifactEnvelope.assumptions.estimatedFeeBps !== undefined ? `- Estimated fees: ${artifactEnvelope.assumptions.estimatedFeeBps} bps` : "- Estimated fees: unknown",
      artifactEnvelope.assumptions.mode ? `- Mode: ${artifactEnvelope.assumptions.mode}` : "- Mode: unknown",
      opportunity.riskFlags.length > 0 ? `- Warnings: ${opportunity.riskFlags.join("; ")}` : "- Warnings: none",
    ].join("\n"),
    contentJson: {
      ...opportunity,
      artifactEnvelope,
    },
    createdAt,
    updatedAt: createdAt,
  };
}
