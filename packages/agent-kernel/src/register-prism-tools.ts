import { defineTool, type ToolDefinition } from "@earendil-works/pi-coding-agent";
import type { Artifact, MarketContext, MarketType, Opportunity, Venue } from "@agentkernel/domain";
import {
  buildFundingExecutionPrep,
  evaluateFundingRiskGate,
  explainMissingOpportunityArtifact,
  explainOpportunityArtifact,
  generateMissingOpportunityResearchReport,
  generateOpportunityResearchReport,
  scanFundingBasisArbitrage,
  scanFundingOpportunities,
} from "@agentkernel/operations";
import {
  calculateFundingEdge,
  getExchangeMarkets,
  getExchangeTickers,
  getFundingRates,
  getMarketContext,
  getOrderbookDepth,
} from "@agentkernel/tools";
import { Type } from "typebox";

import { PATH_GUIDANCE } from "./path-guidance.js";
import type { PrismRuntimeContext } from "./prism-runtime-context.js";

function jsonToolResult(details: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(details, null, 2) }],
    details,
  };
}

export function createPrismToolDefinitions(ctx: PrismRuntimeContext): ToolDefinition[] {
  const getFundingRatesTool = defineTool({
    name: "get_funding_rates",
    label: "Get Funding Rates",
    description: "Fetch current funding rates for derivative venues and symbols. This is the source of truth for funding facts.",
    promptSnippet: "Use get_funding_rates for realtime funding rate facts across venues.",
    promptGuidelines: ["Do not invent funding rates; call get_funding_rates for funding facts."],
    parameters: Type.Object({
      venues: Type.Array(Type.String({ description: "Venue names such as binance or bitget" })),
      symbols: Type.Array(Type.String({ description: "Symbols such as BTCUSDT or ETHUSDT" })),
      marketType: Type.Optional(Type.Union([Type.Literal("linear_perp"), Type.Literal("inverse_perp")])),
    }),
    async execute(_toolCallId, params) {
      const result = await getFundingRates(params);
      return jsonToolResult(result);
    },
  });

  const getOrderbookDepthTool = defineTool({
    name: "get_orderbook_depth",
    label: "Get Orderbook Depth",
    description: "Estimate order book depth and slippage for a venue, symbol, and target notional.",
    promptSnippet: "Use get_orderbook_depth to estimate liquidity and slippage.",
    promptGuidelines: ["Do not discuss execution capacity without order book depth or slippage estimates."],
    parameters: Type.Object({
      venue: Type.String(),
      symbol: Type.String(),
      notionalUsd: Type.Number({ minimum: 0 }),
      marketType: Type.Optional(Type.Union([Type.Literal("spot"), Type.Literal("linear_perp"), Type.Literal("inverse_perp")])),
      limit: Type.Optional(Type.Number({ minimum: 1 })),
    }),
    async execute(_toolCallId, params) {
      const result = await getOrderbookDepth(params);
      return jsonToolResult(result);
    },
  });

  const getExchangeMarketsTool = defineTool({
    name: "get_exchange_markets",
    label: "Get Exchange Markets",
    description: "Fetch provider-backed exchange market and instrument metadata.",
    promptSnippet: "Use get_exchange_markets to inspect tradable exchange markets and instrument metadata.",
    promptGuidelines: ["Do not invent market availability or instrument constraints; call get_exchange_markets for market metadata."],
    parameters: Type.Object({
      venue: Type.String({ description: "Venue name such as binance" }),
      marketType: Type.Optional(Type.Union([Type.Literal("spot"), Type.Literal("linear_perp"), Type.Literal("inverse_perp")])),
      symbols: Type.Optional(Type.Array(Type.String({ description: "Symbols such as BTCUSDT or ETHUSDT" }))),
    }),
    async execute(_toolCallId, params) {
      const result = await getExchangeMarkets(params);
      return jsonToolResult(result);
    },
  });

  const getExchangeTickersTool = defineTool({
    name: "get_exchange_tickers",
    label: "Get Exchange Tickers",
    description: "Fetch provider-backed ticker facts including bid, ask, mark price, and index price where available.",
    promptSnippet: "Use get_exchange_tickers for realtime bid/ask, mark, and index price facts.",
    promptGuidelines: ["Do not invent exchange ticker prices; call get_exchange_tickers for ticker facts."],
    parameters: Type.Object({
      venues: Type.Array(Type.String({ description: "Venue names such as binance" })),
      symbols: Type.Array(Type.String({ description: "Symbols such as BTCUSDT or ETHUSDT" })),
      marketType: Type.Optional(Type.Union([Type.Literal("spot"), Type.Literal("linear_perp"), Type.Literal("inverse_perp")])),
      fields: Type.Optional(Type.Array(Type.Union([Type.Literal("book"), Type.Literal("mark"), Type.Literal("24h")]))),
    }),
    async execute(_toolCallId, params) {
      const result = await getExchangeTickers(params);
      return jsonToolResult(result);
    },
  });

  const getMarketContextTool = defineTool({
    name: "get_market_context",
    label: "Get Market Context",
    description: "Fetch a normalized multi-source market context bundle for selected symbols, including ticker, funding, funding history, open interest, and selected depth.",
    promptSnippet: "Use get_market_context to explain or inspect selected funding candidates after scanner output.",
    promptGuidelines: [
      "Use scan_funding_basis_arbitrage first for Binance/Bitget cross-venue funding-basis opportunity discovery.",
      "Use get_market_context for selected-symbol explanation and drilldown after scanner output, not as the primary scanner workflow.",
      "Do not request depth for broad symbol lists; keep depth includes to selected symbols only.",
    ],
    parameters: Type.Object({
      venue: Type.String({ description: "Venue name such as binance" }),
      marketType: Type.Optional(Type.Union([Type.Literal("spot"), Type.Literal("linear_perp"), Type.Literal("inverse_perp")])),
      symbols: Type.Array(Type.String({ description: "Selected symbols such as BTCUSDT or ETHUSDT" })),
      include: Type.Optional(Type.Array(Type.Union([
        Type.Literal("market"),
        Type.Literal("ticker"),
        Type.Literal("funding"),
        Type.Literal("fundingHistory"),
        Type.Literal("openInterest"),
        Type.Literal("depth"),
      ]))),
      targetNotionalUsd: Type.Optional(Type.Number({ minimum: 0 })),
      maxSymbolsForDepth: Type.Optional(Type.Number({ minimum: 0 })),
      fundingHistoryLimit: Type.Optional(Type.Number({ minimum: 1 })),
    }),
    async execute(_toolCallId, params) {
      const result = await getMarketContext(params);
      return jsonToolResult(result);
    },
  });

  const calculateFundingEdgeTool = defineTool({
    name: "calculate_funding_edge",
    label: "Calculate Funding Edge",
    description: "Calculate gross and net funding edge after fee and slippage estimates.",
    promptSnippet: "Use calculate_funding_edge to convert funding facts into estimated net edge.",
    parameters: Type.Object({
      symbol: Type.String(),
      venues: Type.Array(Type.String(), { minItems: 2, maxItems: 2 }),
      fundingRates: Type.Array(Type.Number(), { minItems: 2, maxItems: 2 }),
      feeEstimateBps: Type.Optional(Type.Number()),
      slippageEstimateBps: Type.Optional(Type.Number()),
    }),
    async execute(_toolCallId, params) {
      const result = calculateFundingEdge({
        ...params,
        venues: [params.venues[0], params.venues[1]],
        fundingRates: [params.fundingRates[0], params.fundingRates[1]],
      });
      return jsonToolResult({ symbol: params.symbol, venues: params.venues, ...result });
    },
  });

  const scanFundingBasisArbitrageTool = defineTool({
    name: "scan_funding_basis_arbitrage",
    label: "Scan Funding-Basis Arbitrage",
    description: [
      "Run a read-only Binance/Bitget cross-venue funding-basis scan using provider-backed market contexts.",
      "Produces candidate opportunities and optional artifacts; it never executes trades.",
      "Bounded template: discover_with_artifact.",
      ...PATH_GUIDANCE.discover_with_artifact,
    ].join(" "),
    promptSnippet: "Use scan_funding_basis_arbitrage for Binance/Bitget cross-venue funding-basis opportunity discovery.",
    promptGuidelines: [
      "Prefer scan_funding_basis_arbitrage for Binance/Bitget cross-venue funding-basis opportunity discovery.",
      "This tool is the canonical funding_basis.discover implementation for path_discover.",
      "Use this tool for the platform-level discover intent inside the funding_basis vertical.",
      "If the caller does not provide symbols, ask for symbols or use a demo/smoke-specific default path outside the core scanner.",
      "For execution-shaped or high-risk requests, keep the flow read-only and ask for research parameters instead of executing.",
      "Use low-level market-data tools only for lookup, explanation, or drilldown after scanner output.",
      "Proposal flows must remain read-only and artifact-backed.",
      "Risk evaluation must be deterministic and must not authorize execution.",
      "Do not invent market facts when the scanner reports provider warnings or missing funding data.",
      "This tool is read-only: it may produce candidate opportunities and artifacts, but it must not execute trades.",
    ],
    parameters: Type.Object({
      // NOTE: a TypeBox Tuple serializes to JSON Schema `items: [..]` (tuple form),
      // which OpenAI-compatible function-calling validators reject ("items is not of
      // type object/boolean"). Use a fixed-length array whose items is a SINGLE schema
      // (a union of literals) so the schema stays OpenAI-compatible.
      venues: Type.Array(Type.Union([Type.Literal("binance"), Type.Literal("bitget")]), {
        minItems: 2,
        maxItems: 2,
        description: "Exactly two venues: binance and bitget.",
      }),
      symbols: Type.Array(Type.String({ description: "Symbols such as BTCUSDT or ETHUSDT" })),
      marketType: Type.Optional(Type.Literal("linear_perp")),
      estimatedFeeBps: Type.Number({ minimum: 0 }),
      targetNotionalUsd: Type.Optional(Type.Number({ minimum: 0 })),
      saveArtifacts: Type.Optional(Type.Boolean()),
    }),
    async execute(_toolCallId, params) {
      const targetNotionalUsd = params.targetNotionalUsd ?? 1000;
      const marketType = params.marketType ?? "linear_perp";
      const result = await scanFundingBasisArbitrage({
        input: {
          venues: [params.venues[0], params.venues[1]],
          symbols: params.symbols,
          marketType,
          estimatedFeeBps: params.estimatedFeeBps,
          targetNotionalUsd,
          mode: "balanced",
          saveArtifacts: params.saveArtifacts,
        },
        contextProvider: {
          async getMarketContext(input: { venue: Venue; marketType: MarketType; symbol: string }): Promise<MarketContext> {
            const output = await getMarketContext({
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
        },
        artifactStore: {
          save: (artifact) => ctx.artifactStore.save(artifact),
        },
      });
      ctx.artifactReferences.replaceFromOpportunityCards(result.opportunityCards);
      ctx.artifactReferences.replaceFundingPrepRecords(result.opportunities.flatMap((opportunity, index) => {
        const comparison = result.comparisons.find((item) => opportunity.comparisonIds?.includes(item.id));
        if (!comparison) return [];
        return [{
          opportunity,
          comparison,
          artifactId: result.opportunityCards[index]?.artifactId,
        }];
      }));
      return jsonToolResult(result);
    },
  });

  const scanFundingOpportunitiesTool = defineTool({
    name: "scan_funding_opportunities",
    label: "Scan Funding Opportunities",
    description: "Run a deterministic funding opportunity scan using provider-backed market data, selected depth checks, edge estimates, and artifact materialization.",
    promptSnippet: "Use scan_funding_opportunities for funding opportunity discovery instead of manually looping over low-level market-data tools.",
    promptGuidelines: [
      "Prefer scan_funding_opportunities for funding opportunity scans.",
      "Do not invent market facts when the scanner reports provider warnings or unavailable data.",
    ],
    parameters: Type.Object({
      venues: Type.Array(Type.String({ description: "Venues such as binance. P0 supports binance linear perpetuals." })),
      symbols: Type.Array(Type.String({ description: "Symbols such as BTCUSDT or ETHUSDT" })),
      targetNotionalUsd: Type.Number({ minimum: 0 }),
      maxCandidatesForDepth: Type.Optional(Type.Number({ minimum: 0 })),
      feeEstimateBps: Type.Optional(Type.Number({ minimum: 0 })),
      saveArtifact: Type.Optional(Type.Boolean()),
      minQuoteVolume24hUsd: Type.Optional(Type.Number({ minimum: 0 })),
      fundingHistoryLimit: Type.Optional(Type.Number({ minimum: 1 })),
    }),
    async execute(_toolCallId, params) {
      const result = await scanFundingOpportunities(params, {
        getFundingRates,
        getExchangeTickers,
        getFundingOpportunityContext: async (input) => {
          const context = await getMarketContext({
            venue: input.venue,
            marketType: input.marketType,
            symbols: input.symbols,
            include: ["funding", "fundingHistory", "openInterest"],
            fundingHistoryLimit: input.fundingHistoryLimit,
          });
          return {
            fundingBySymbol: new Map(context.contexts.flatMap((item) => item.funding ? [[item.symbol, item.funding] as const] : [])),
            openInterestBySymbol: new Map(context.contexts.flatMap((item) => item.openInterest ? [[item.symbol, item.openInterest.openInterest] as const] : [])),
            status: context.status,
            warnings: context.warnings,
            fetchedAt: context.fetchedAt,
          };
        },
        getOrderbookDepth: async (input) => {
          const { snapshot: _snapshot, ...depth } = await getOrderbookDepth(input);
          return depth;
        },
        saveArtifact: (artifact) => ctx.artifactStore.save(artifact),
      });
      return jsonToolResult(result);
    },
  });

  const resolveOpportunityArtifactReferenceTool = defineTool({
    name: "resolve_opportunity_artifact_reference",
    label: "Resolve Opportunity Artifact Reference",
    description: "Resolve a session reference such as first opportunity, #1, an opportunity ID, or a symbol to a saved opportunity artifact ID. This is read-only and does not inspect live market data.",
    promptSnippet: "Use resolve_opportunity_artifact_reference before explain_opportunity_artifact when the user says first opportunity or another session reference instead of an artifact ID.",
    promptGuidelines: [
      "Use this only to map recent scanner opportunity references to saved artifact IDs.",
      "If resolution fails, ask for an artifact ID or suggest rerunning scan_funding_basis_arbitrage with artifact saving enabled.",
      "After resolving an artifact ID, call explain_opportunity_artifact for the actual explanation.",
      "This tool is read-only and must not refresh live market data or execute trades.",
    ],
    parameters: Type.Object({
      reference: Type.String(),
    }),
    async execute(_toolCallId, params) {
      return jsonToolResult(ctx.artifactReferences.resolve(params.reference));
    },
  });

  const explainOpportunityArtifactTool = defineTool({
    name: "explain_opportunity_artifact",
    label: "Explain Opportunity Artifact",
    description: "Explain a saved opportunity artifact by artifact ID using saved lineage and structured opportunity facts. This is read-only and does not refresh live market data.",
    promptSnippet: "Use explain_opportunity_artifact when the user provides a saved opportunity artifact ID and asks why it is interesting or what risks are visible.",
    promptGuidelines: [
      "Require an artifact ID; if the user refers to a session index like first opportunity, ask for the artifact ID or suggest rerunning the scanner.",
      "Use saved artifact lineage and opportunity facts before any live market drilldown.",
      "Do not refresh live market data by default from this tool.",
      "Preserve warnings, score explanation, and missing-lineage warnings visibly.",
      "This is not financial advice, a trade recommendation, or an execution instruction.",
    ],
    parameters: Type.Object({
      artifactId: Type.String(),
    }),
    async execute(_toolCallId, params) {
      const artifact = await ctx.artifactStore.get(params.artifactId);
      const explanation = artifact
        ? explainOpportunityArtifact(artifact)
        : explainMissingOpportunityArtifact(params.artifactId);
      return jsonToolResult(explanation);
    },
  });

  const generateOpportunityResearchReportTool = defineTool({
    name: "generate_opportunity_research_report",
    label: "Generate Opportunity Research Report",
    description: [
      "Generate a deterministic read-only research report from a saved opportunity artifact by artifact ID.",
      "It does not refresh live market data.",
      "Bounded template: report_from_artifacts.",
      ...PATH_GUIDANCE.report_from_artifacts,
    ].join(" "),
    promptSnippet: "Use generate_opportunity_research_report when the user provides an opportunity artifact ID and asks for a research report.",
    promptGuidelines: [
      "Require an artifact ID; resolve session references to artifact IDs before calling this tool.",
      "Use saved artifact facts and explanation output only.",
      "Do not refresh live market data by default from this tool.",
      "Preserve lineage, assumptions, limitations, and the read-only boundary visibly.",
      "This is not financial advice, a trade recommendation, or an execution instruction.",
    ],
    parameters: Type.Object({
      artifactId: Type.String(),
    }),
    async execute(_toolCallId, params) {
      const artifact = await ctx.artifactStore.get(params.artifactId);
      const report = artifact
        ? generateOpportunityResearchReport(artifact)
        : generateMissingOpportunityResearchReport(params.artifactId);
      return jsonToolResult(report);
    },
  });

  const generateFundingExecutionPrepTool = defineTool({
    name: "generate_funding_execution_prep",
    label: "Generate Funding Execution Prep",
    description: [
      "Generate a deterministic read-only manual execution-prep package from a saved funding-basis opportunity artifact or session reference.",
      "It requires tool-backed facts already captured by the funding-basis scanner and never authorizes direct execution.",
      "Bounded template: proposal_read_only.",
      ...PATH_GUIDANCE.proposal_read_only,
    ].join(" "),
    promptSnippet: "Use generate_funding_execution_prep after scan_funding_basis_arbitrage when the user wants a manual execution-prep plan for a saved candidate.",
    promptGuidelines: [
      "Prep remains read-only and artifact-backed.",
      "Use scan_funding_basis_arbitrage first so the runtime has tool-backed opportunity and comparison facts.",
      "Accept a saved artifact ID or session reference such as first opportunity.",
      "Do not refresh live market data from this tool; use only saved session facts.",
      "Always preserve the manual-only boundary and require human confirmation.",
      "Risk evaluation is deterministic and required; never imply order authorization.",
    ],
    parameters: Type.Object({
      artifactId: Type.String({ description: "Saved opportunity artifact ID or session reference such as first opportunity" }),
    }),
    async execute(_toolCallId, params) {
      const record = ctx.artifactReferences.getFundingPrepRecord(params.artifactId);
      if (!record) {
        return jsonToolResult({
          status: "missing_artifact_context",
          artifactId: params.artifactId,
          message: "No saved funding-basis prep context matched this artifact or session reference. Rerun scan_funding_basis_arbitrage with artifact saving enabled before requesting execution prep.",
          readOnlyBoundary: "Execution prep remains read-only and manual-only; missing context does not unlock execution.",
        });
      }

      const prep = buildFundingExecutionPrep({
        opportunity: record.opportunity,
        comparison: record.comparison,
        generatedAt: new Date().toISOString(),
      });
      const riskEvaluation = evaluateFundingRiskGate({
        opportunity: record.opportunity,
        comparison: record.comparison,
      });

      return jsonToolResult({
        status: "ok",
        artifactId: record.artifactId,
        opportunityId: record.opportunity.id,
        humanPlan: prep.humanPlan,
        executionPrepContract: prep.contract,
        riskEvaluation,
        artifactLineage: {
          comparisonId: record.comparison.id,
          opportunityId: record.opportunity.id,
          artifactId: record.artifactId,
        },
        readOnlyBoundary: "This output is read-only and for manual execution preparation only. It does not authorize order placement or direct execution.",
      });
    },
  });

  const saveOpportunityArtifactTool = defineTool({
    name: "save_opportunity_artifact",
    label: "Save Opportunity Artifact",
    description: "Materialize an opportunity as a durable Prism artifact. Use after a candidate opportunity has been calculated and ranked.",
    promptSnippet: "Use save_opportunity_artifact to materialize worthwhile opportunities.",
    promptGuidelines: ["Important opportunity outputs should be saved as artifacts, not only described in chat."],
    parameters: Type.Object({
      title: Type.String(),
      opportunity: Type.Object({
        id: Type.Optional(Type.String()),
        type: Type.String(),
        symbols: Type.Array(Type.String()),
        venues: Type.Array(Type.String()),
        grossEdgeBps: Type.Optional(Type.Number()),
        feeEstimateBps: Type.Optional(Type.Number()),
        slippageEstimateBps: Type.Optional(Type.Number()),
        netEdgeBps: Type.Optional(Type.Number()),
        confidence: Type.Number({ minimum: 0, maximum: 1 }),
        liquidityStatus: Type.String(),
        freshnessStatus: Type.String(),
        riskFlags: Type.Array(Type.String()),
      }),
      summary: Type.Optional(Type.String()),
    }),
    async execute(_toolCallId, params) {
      const now = new Date().toISOString();
      const opportunity: Opportunity = {
        id: params.opportunity.id ?? crypto.randomUUID(),
        type: params.opportunity.type as Opportunity["type"],
        title: params.title,
        objects: [],
        venues: params.opportunity.venues,
        symbols: params.opportunity.symbols,
        grossEdgeBps: params.opportunity.grossEdgeBps,
        feeEstimateBps: params.opportunity.feeEstimateBps,
        slippageEstimateBps: params.opportunity.slippageEstimateBps,
        netEdgeBps: params.opportunity.netEdgeBps,
        confidence: params.opportunity.confidence,
        liquidityStatus: params.opportunity.liquidityStatus as Opportunity["liquidityStatus"],
        freshnessStatus: params.opportunity.freshnessStatus as Opportunity["freshnessStatus"],
        riskFlags: params.opportunity.riskFlags,
        status: "candidate",
        createdAt: now,
        updatedAt: now,
      };
      const artifact: Artifact<Opportunity> = {
        id: crypto.randomUUID(),
        type: "opportunity",
        title: params.title,
        objectIds: [],
        contentMarkdown: params.summary,
        contentJson: opportunity,
        createdAt: now,
        updatedAt: now,
      };
      const saved = await ctx.artifactStore.save(artifact);
      return jsonToolResult({ artifact: saved, opportunity });
    },
  });

  return [
    getExchangeMarketsTool,
    getFundingRatesTool,
    getExchangeTickersTool,
    getMarketContextTool,
    getOrderbookDepthTool,
    scanFundingBasisArbitrageTool,
    scanFundingOpportunitiesTool,
    calculateFundingEdgeTool,
    resolveOpportunityArtifactReferenceTool,
    explainOpportunityArtifactTool,
    generateOpportunityResearchReportTool,
    generateFundingExecutionPrepTool,
    saveOpportunityArtifactTool,
  ];
}
