import { scanFundingBasisArbitrage } from "@agentkernel/funding-basis";
import type { Artifact, MarketContext, MarketType, Venue } from "@agentkernel/domain";
import { ExchangeMarketDataService } from "@agentkernel/funding-basis";

const symbols = (process.env.PRISM_FUNDING_BASIS_SMOKE_SYMBOLS ?? "BTCUSDT,ETHUSDT")
  .split(",")
  .map((symbol) => symbol.trim())
  .filter(Boolean);
const estimatedFeeBps = Number(process.env.PRISM_FUNDING_BASIS_SMOKE_FEE_BPS ?? "4");
const targetNotionalUsd = Number(process.env.PRISM_FUNDING_BASIS_SMOKE_NOTIONAL_USD ?? "1000");

const service = new ExchangeMarketDataService();
const savedArtifacts: Artifact[] = [];

const contextProvider = {
  async getMarketContext(input: { venue: Venue; marketType: MarketType; symbol: string }): Promise<MarketContext> {
    const output = await service.getMarketContext({
      venue: input.venue,
      marketType: input.marketType,
      symbols: [input.symbol],
      include: ["market", "ticker", "funding", "depth"],
      targetNotionalUsd,
      maxSymbolsForDepth: 1,
    });
    return output.contexts[0] ?? {
      venue: input.venue,
      marketType: input.marketType,
      symbol: input.symbol,
      status: output.status,
      warnings: output.warnings.length > 0 ? output.warnings : [`missing_market_context:${input.venue}:${input.symbol}`],
      fetchedAt: output.fetchedAt,
    };
  },
};

const result = await scanFundingBasisArbitrage({
  input: {
    venues: ["binance", "bitget"],
    symbols,
    marketType: "linear_perp",
    estimatedFeeBps,
    saveArtifacts: true,
  },
  contextProvider,
  artifactStore: {
    save: (artifact) => {
      savedArtifacts.push(artifact);
      return artifact;
    },
  },
});

console.log(JSON.stringify({
  status: result.status,
  summary: result.summary,
  symbols,
  opportunityCount: result.opportunities.length,
  artifactIds: result.artifactIds,
  warnings: result.warnings,
  topOpportunity: result.opportunities[0] ? {
    id: result.opportunities[0].id,
    venues: result.opportunities[0].venues,
    symbols: result.opportunities[0].symbols,
    grossEdgeBps: result.opportunities[0].grossEdgeBps,
    feeEstimateBps: result.opportunities[0].feeEstimateBps,
    slippageEstimateBps: result.opportunities[0].slippageEstimateBps,
    netEdgeBps: result.opportunities[0].netEdgeBps,
    confidence: result.opportunities[0].confidence,
    score: result.opportunities[0].score,
    comparisonIds: result.opportunities[0].comparisonIds,
    signalIds: result.opportunities[0].signalIds,
  } : undefined,
  savedArtifactCount: savedArtifacts.length,
}, null, 2));
