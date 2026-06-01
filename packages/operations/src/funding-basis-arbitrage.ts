import type { Artifact, FetchStatus, MarketContext, MarketType, Opportunity, Venue } from "@agentkernel/domain";
import type { FundingBasisCardMode, FundingBasisOpportunityCard } from "./funding-basis-cards.js";
import { buildFundingBasisOpportunityCards } from "./funding-basis-cards.js";
import { createOpportunityArtifact, evaluateFundingBasisContexts } from "./funding-basis-core.js";

export interface ScanFundingBasisArbitrageInput {
  venues: [Venue, Venue];
  symbols: string[];
  marketType: MarketType;
  estimatedFeeBps: number;
  targetNotionalUsd?: number;
  mode?: FundingBasisCardMode;
  saveArtifacts?: boolean;
}

export interface FundingBasisContextProvider {
  getMarketContext(input: { venue: Venue; marketType: MarketType; symbol: string }): Promise<MarketContext>;
}

export interface ArtifactStoreLike {
  save<TContent>(artifact: Artifact<TContent>): Artifact<TContent> | Promise<Artifact<TContent>>;
}

export interface ScanFundingBasisArbitrageDeps {
  input: ScanFundingBasisArbitrageInput;
  contextProvider: FundingBasisContextProvider;
  artifactStore?: ArtifactStoreLike;
  now?: () => string;
}

export interface ScanFundingBasisArbitrageOutput {
  vertical: "funding_basis";
  platformIntent: "discover";
  capability: "funding_basis.discover";
  path: "path_discover";
  marketContexts: MarketContext[];
  comparisons: ReturnType<typeof evaluateFundingBasisContexts>["comparisons"];
  signals: ReturnType<typeof evaluateFundingBasisContexts>["signals"];
  opportunities: Opportunity[];
  opportunityCards: FundingBasisOpportunityCard[];
  artifactIds: string[];
  status: FetchStatus;
  warnings: string[];
  summary: string;
}

export async function scanFundingBasisArbitrage(deps: ScanFundingBasisArbitrageDeps): Promise<ScanFundingBasisArbitrageOutput> {
  const now = deps.now?.() ?? new Date().toISOString();
  const marketContexts: MarketContext[] = [];
  const warnings: string[] = [];
  const symbols = deps.input.symbols;

  if (symbols.length === 0) {
    warnings.push("missing_symbols");
    return {
      vertical: "funding_basis",
      platformIntent: "discover",
      capability: "funding_basis.discover",
      path: "path_discover",
      marketContexts,
      comparisons: [],
      signals: [],
      opportunities: [],
      opportunityCards: [],
      artifactIds: [],
      status: "failed",
      warnings,
      summary: "No funding-basis candidates were produced: missing_symbols",
    };
  }

  for (const symbol of symbols) {
    for (const venue of deps.input.venues) {
      const context = await deps.contextProvider.getMarketContext({ venue, marketType: deps.input.marketType, symbol });
      marketContexts.push(context);
      warnings.push(...context.warnings);
    }
  }

  const evaluation = evaluateFundingBasisContexts({
    symbols,
    marketType: deps.input.marketType,
    venues: deps.input.venues,
    contexts: marketContexts,
    estimatedFeeBps: deps.input.estimatedFeeBps,
    now,
  });

  const skippedReasons = evaluation.comparisons
    .filter((comparison) => comparison.fundingDiffBps === undefined)
    .map((comparison) => `missing_funding_diff:${comparison.symbol}`);

  warnings.push(...evaluation.warnings, ...skippedReasons);

  const artifactIds: string[] = [];
  if (deps.input.saveArtifacts) {
    if (!deps.artifactStore) {
      warnings.push("saveArtifacts was requested but no artifactStore was provided");
    } else {
      for (const opportunity of evaluation.opportunities) {
        const comparisonContexts = evaluation.comparisons
          .filter((comparison) => opportunity.comparisonIds?.includes(comparison.id))
          .flatMap((comparison) => comparison.legs);
        const artifact = createOpportunityArtifact(opportunity, now, {
          targetNotionalUsd: deps.input.targetNotionalUsd,
          estimatedFeeBps: deps.input.estimatedFeeBps,
          mode: deps.input.mode ?? "balanced",
          marketContextIds: comparisonContexts.map((context) => `market_context_${context.venue}_${context.symbol}`),
          providerFactRefs: comparisonContexts.flatMap((context) => [
            context.market ? `market:${context.venue}:${context.symbol}` : undefined,
            context.ticker ? `ticker:${context.ticker.provider}:${context.ticker.source}:${context.venue}:${context.symbol}` : undefined,
            context.funding?.current ? `funding:${context.funding.current.provider}:${context.funding.current.source}:${context.venue}:${context.symbol}` : undefined,
            context.depth ? `depth:${context.depth.provider}:${context.depth.source}:${context.venue}:${context.symbol}` : undefined,
          ].filter((ref): ref is string => ref !== undefined)),
        });
        await deps.artifactStore.save(artifact);
        artifactIds.push(artifact.id);
      }
    }
  }

  const opportunityCards = buildFundingBasisOpportunityCards({
    opportunities: evaluation.opportunities,
    comparisons: evaluation.comparisons,
    artifactIds,
    assumptions: {
      targetNotionalUsd: deps.input.targetNotionalUsd,
      estimatedFeeBps: deps.input.estimatedFeeBps,
      mode: deps.input.mode ?? "balanced",
    },
  });

  const dedupedWarnings = [...new Set(warnings)];
  const status: FetchStatus = evaluation.opportunities.length > 0
    ? evaluation.status
    : evaluation.comparisons.length === 0
      ? "failed"
      : evaluation.status === "ok"
        ? "empty"
        : evaluation.status;
  const summary = evaluation.opportunities.length > 0
    ? `Found ${evaluation.opportunities.length} funding-basis candidate(s).`
    : `No funding-basis candidates were produced${dedupedWarnings.length > 0 ? `: ${dedupedWarnings.join("; ")}` : "."}`;

  return {
    vertical: "funding_basis",
    platformIntent: "discover",
    capability: "funding_basis.discover",
    path: "path_discover",
    marketContexts,
    comparisons: evaluation.comparisons,
    signals: evaluation.signals,
    opportunities: evaluation.opportunities,
    opportunityCards,
    artifactIds,
    status,
    warnings: dedupedWarnings,
    summary,
  };
}
