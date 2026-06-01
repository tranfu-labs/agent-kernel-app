import test from "node:test";
import assert from "node:assert/strict";
import { createPrismRuntimeContext, createPrismToolDefinitions } from "../src/index.js";

test("scan_funding_basis_arbitrage is preferred for Binance/Bitget cross-venue discovery", () => {
  const tools = createPrismToolDefinitions(createPrismRuntimeContext());
  const scanner = tools.find((tool) => tool.name === "scan_funding_basis_arbitrage");
  const marketContext = tools.find((tool) => tool.name === "get_market_context");

  assert.ok(scanner);
  assert.match(scanner.description, /read-only/i);
  assert.match(scanner.description, /Binance\/Bitget|Binance.*Bitget/i);
  assert.match(scanner.promptSnippet ?? "", /Binance\/Bitget|Binance.*Bitget/i);
  assert.match((scanner.promptGuidelines ?? []).join(" "), /Prefer scan_funding_basis_arbitrage/i);
  assert.match((scanner.promptGuidelines ?? []).join(" "), /funding_basis\.discover/i);
  assert.match((scanner.promptGuidelines ?? []).join(" "), /path_discover/i);
  assert.match((scanner.promptGuidelines ?? []).join(" "), /ask for symbols or use a demo\/smoke-specific default path/i);
  assert.match((scanner.promptGuidelines ?? []).join(" "), /Proposal flows must remain read-only and artifact-backed/i);
  assert.match((scanner.promptGuidelines ?? []).join(" "), /Risk evaluation must be deterministic and must not authorize execution/i);
  assert.match((scanner.promptGuidelines ?? []).join(" "), /read-only/i);
  assert.match((scanner.promptGuidelines ?? []).join(" "), /must not execute/i);

  assert.ok(marketContext);
  assert.match((marketContext.promptGuidelines ?? []).join(" "), /drilldown/i);
  assert.match((marketContext.promptGuidelines ?? []).join(" "), /scan_funding_basis_arbitrage/i);
});

test("tool guidance references bounded orchestration templates", () => {
  const context = createPrismRuntimeContext();
  const tools = createPrismToolDefinitions(context);
  const scanner = tools.find((tool) => tool.name === "scan_funding_basis_arbitrage");
  const report = tools.find((tool) => tool.name === "generate_opportunity_research_report");

  assert.ok(scanner);
  assert.match(scanner.description, /discover_with_artifact/);
  assert.match(scanner.description, /artifact-backed/);
  assert.match(scanner.description, /read-only/);

  assert.ok(report);
  assert.match(report.description, /report_from_artifacts/);
  assert.match(report.description, /saved artifacts?/i);
});

test("scan_funding_basis_arbitrage schema stays read-only", () => {
  const tools = createPrismToolDefinitions(createPrismRuntimeContext());
  const scanner = tools.find((tool) => tool.name === "scan_funding_basis_arbitrage");

  assert.ok(scanner);
  const schemaText = JSON.stringify(scanner.parameters);

  for (const forbidden of ["apiKey", "secret", "account", "balance", "position", "order", "leverage", "margin", "transfer", "withdraw"]) {
    assert.equal(schemaText.includes(forbidden), false, `schema must not include ${forbidden}`);
  }
});

test("resolve_opportunity_artifact_reference maps recent session references to artifact IDs", async () => {
  const context = createPrismRuntimeContext();
  context.artifactReferences.replaceFromOpportunityCards([
    {
      opportunityId: "opp_ETHUSDT_binance_bitget",
      artifactId: "artifact_opp_ETHUSDT_binance_bitget",
      symbol: "ETHUSDT",
    },
  ]);
  const tools = createPrismToolDefinitions(context);
  const resolver = tools.find((tool) => tool.name === "resolve_opportunity_artifact_reference");

  assert.ok(resolver);
  const result = await resolver.execute(
    "test-resolve",
    { reference: "第一个机会" },
    undefined,
    undefined,
    {} as Parameters<typeof resolver.execute>[4],
  );
  const details = result.details as { status?: string; artifactId?: string; position?: number };

  assert.equal(details.status, "ok");
  assert.equal(details.artifactId, "artifact_opp_ETHUSDT_binance_bitget");
  assert.equal(details.position, 1);
});

test("resolve_opportunity_artifact_reference schema stays read-only", () => {
  const tools = createPrismToolDefinitions(createPrismRuntimeContext());
  const resolver = tools.find((tool) => tool.name === "resolve_opportunity_artifact_reference");

  assert.ok(resolver);
  assert.match(resolver.description, /session reference/i);
  assert.match((resolver.promptGuidelines ?? []).join(" "), /explain_opportunity_artifact/i);
  const schemaText = JSON.stringify(resolver.parameters);

  assert.match(schemaText, /reference/);
  for (const forbidden of ["apiKey", "secret", "account", "balance", "position", "order", "leverage", "margin", "transfer", "withdraw", "notional"]) {
    assert.equal(schemaText.includes(forbidden), false, `schema must not include ${forbidden}`);
  }
});

test("explain_opportunity_artifact is registered as an artifact-backed read-only explanation tool", () => {
  const tools = createPrismToolDefinitions(createPrismRuntimeContext());
  const explanation = tools.find((tool) => tool.name === "explain_opportunity_artifact");

  assert.ok(explanation);
  assert.match(explanation.description, /artifact/i);
  assert.match(explanation.description, /read-only/i);
  assert.match(explanation.promptSnippet ?? "", /artifact/i);
  assert.match((explanation.promptGuidelines ?? []).join(" "), /Do not refresh live market data/i);
  assert.match((explanation.promptGuidelines ?? []).join(" "), /not financial advice/i);
});

test("explain_opportunity_artifact schema contains only artifactId", () => {
  const tools = createPrismToolDefinitions(createPrismRuntimeContext());
  const explanation = tools.find((tool) => tool.name === "explain_opportunity_artifact");

  assert.ok(explanation);
  const schemaText = JSON.stringify(explanation.parameters);

  assert.match(schemaText, /artifactId/);
  for (const forbidden of ["apiKey", "secret", "account", "balance", "position", "order", "leverage", "margin", "transfer", "withdraw", "symbol", "venue", "notional"]) {
    assert.equal(schemaText.includes(forbidden), false, `schema must not include ${forbidden}`);
  }
});

test("generate_opportunity_research_report is registered as an artifact-backed read-only report tool", () => {
  const tools = createPrismToolDefinitions(createPrismRuntimeContext());
  const report = tools.find((tool) => tool.name === "generate_opportunity_research_report");

  assert.ok(report);
  assert.match(report.description, /artifact/i);
  assert.match(report.description, /read-only/i);
  assert.match(report.description, /does not refresh live market data/i);
  assert.match(report.promptSnippet ?? "", /research report/i);
  assert.match((report.promptGuidelines ?? []).join(" "), /saved artifact facts/i);
  assert.match((report.promptGuidelines ?? []).join(" "), /not financial advice/i);
});

test("generate_opportunity_research_report schema contains only artifactId", () => {
  const tools = createPrismToolDefinitions(createPrismRuntimeContext());
  const report = tools.find((tool) => tool.name === "generate_opportunity_research_report");

  assert.ok(report);
  const schemaText = JSON.stringify(report.parameters);

  assert.match(schemaText, /artifactId/);
  for (const forbidden of ["apiKey", "secret", "account", "balance", "position", "order", "leverage", "margin", "transfer", "withdraw", "symbol", "venue", "notional"]) {
    assert.equal(schemaText.includes(forbidden), false, `schema must not include ${forbidden}`);
  }
});

test("generate_funding_execution_prep is registered as an artifact-backed read-only prep tool", () => {
  const tools = createPrismToolDefinitions(createPrismRuntimeContext());
  const prep = tools.find((tool) => tool.name === "generate_funding_execution_prep");

  assert.ok(prep);
  assert.match(prep.description, /artifact/i);
  assert.match(prep.description, /read-only/i);
  assert.match(prep.description, /manual execution-prep/i);
  assert.match(prep.description, /proposal_read_only/);
  assert.match((prep.promptGuidelines ?? []).join(" "), /Prep remains read-only and artifact-backed/i);
  assert.match((prep.promptGuidelines ?? []).join(" "), /never imply order authorization/i);
});

test("generate_funding_execution_prep schema stays read-only and artifact-scoped", () => {
  const tools = createPrismToolDefinitions(createPrismRuntimeContext());
  const prep = tools.find((tool) => tool.name === "generate_funding_execution_prep");

  assert.ok(prep);
  const schemaText = JSON.stringify(prep.parameters);

  assert.match(schemaText, /artifactId/);
  for (const forbidden of ["apiKey", "secret", "account", "balance", "position", "order", "leverage", "margin", "transfer", "withdraw", "symbol", "venue", "notional", "side"]) {
    assert.equal(schemaText.includes(forbidden), false, `schema must not include ${forbidden}`);
  }
});

test("generate_funding_execution_prep returns deterministic prep from saved session context", async () => {
  const context = createPrismRuntimeContext();
  context.artifactReferences.replaceFromOpportunityCards([
    {
      opportunityId: "opp_ETHUSDT_binance_bitget",
      artifactId: "artifact_opp_ETHUSDT_binance_bitget",
      symbol: "ETHUSDT",
    },
  ]);
  context.artifactReferences.replaceFundingPrepRecords([
    {
      artifactId: "artifact_opp_ETHUSDT_binance_bitget",
      opportunity: {
        id: "opp_ETHUSDT_binance_bitget",
        type: "funding_rate_arbitrage",
        title: "ETHUSDT Binance / Bitget funding-basis candidate",
        objects: [],
        venues: ["binance", "bitget"],
        symbols: ["ETHUSDT"],
        grossEdgeBps: 12,
        feeEstimateBps: 4,
        slippageEstimateBps: 1,
        netEdgeBps: 7,
        confidence: 0.72,
        liquidityStatus: "sufficient",
        freshnessStatus: "fresh",
        riskFlags: [],
        comparisonIds: ["cmp_ETHUSDT_binance_bitget"],
        signalIds: ["sig_ETHUSDT_binance_bitget"],
        legs: [
          { venue: "bitget", symbol: "ETHUSDT", marketType: "linear_perp", side: "long", role: "entry" },
          { venue: "binance", symbol: "ETHUSDT", marketType: "linear_perp", side: "short", role: "hedge" },
        ],
        score: {
          totalScore: 72,
          confidence: 0.72,
          edgeScore: 56,
          liquidityScore: 90,
          freshnessScore: 100,
          fundingAlignmentScore: 100,
          venueReliabilityScore: 80,
          riskScore: 80,
          evidenceScore: 80,
          scoringVersion: "funding-basis-v1",
          scoredAt: "2026-05-31T00:00:00.000Z",
          explanation: ["Estimated net edge is 7 bps after fees and slippage."],
        },
        lifecycleStage: "scored",
        status: "candidate",
        createdAt: "2026-05-31T00:00:00.000Z",
        updatedAt: "2026-05-31T00:00:00.000Z",
      },
      comparison: {
        id: "cmp_ETHUSDT_binance_bitget",
        symbol: "ETHUSDT",
        marketType: "linear_perp",
        venues: ["binance", "bitget"],
        legs: [
          {
            venue: "binance",
            marketType: "linear_perp",
            symbol: "ETHUSDT",
            ticker: { venue: "binance", marketType: "linear_perp", symbol: "ETHUSDT", venueSymbol: "ETHUSDT", markPrice: 3001, observedAt: "2026-05-31T00:00:00.000Z", provider: "fixture", source: "fixture", status: "ok", warnings: [] },
            funding: { current: { venue: "binance", marketType: "linear_perp", symbol: "ETHUSDT", venueSymbol: "ETHUSDT", fundingRate: 0.0012, observedAt: "2026-05-31T00:00:00.000Z", provider: "fixture", source: "fixture", status: "ok", warnings: [] }, history: [], status: "ok", warnings: [] },
            depth: { venue: "binance", marketType: "linear_perp", symbol: "ETHUSDT", notionalUsd: 1000, bidFillable: true, askFillable: true, liquidityStatus: "sufficient", observedAt: "2026-05-31T00:00:00.000Z", provider: "fixture", source: "fixture", status: "ok", warnings: [], bidSlippageBps: 1, askSlippageBps: 1 },
            status: "ok",
            warnings: [],
            fetchedAt: "2026-05-31T00:00:00.000Z",
          },
          {
            venue: "bitget",
            marketType: "linear_perp",
            symbol: "ETHUSDT",
            ticker: { venue: "bitget", marketType: "linear_perp", symbol: "ETHUSDT", venueSymbol: "ETHUSDT", markPrice: 2999, observedAt: "2026-05-31T00:00:00.000Z", provider: "fixture", source: "fixture", status: "ok", warnings: [] },
            funding: { current: { venue: "bitget", marketType: "linear_perp", symbol: "ETHUSDT", venueSymbol: "ETHUSDT", fundingRate: -0.0002, observedAt: "2026-05-31T00:00:00.000Z", provider: "fixture", source: "fixture", status: "ok", warnings: [] }, history: [], status: "ok", warnings: [] },
            depth: { venue: "bitget", marketType: "linear_perp", symbol: "ETHUSDT", notionalUsd: 1000, bidFillable: true, askFillable: true, liquidityStatus: "sufficient", observedAt: "2026-05-31T00:00:00.000Z", provider: "fixture", source: "fixture", status: "ok", warnings: [], bidSlippageBps: 1, askSlippageBps: 1 },
            status: "ok",
            warnings: [],
            fetchedAt: "2026-05-31T00:00:00.000Z",
          },
        ],
        fundingDiffBps: 14,
        basisBps: 7,
        markPriceDiffBps: 7,
        estimatedSlippageBps: 1,
        estimatedFeeBps: 4,
        estimatedNetEdgeBps: 9,
        freshnessStatus: "fresh",
        status: "ok",
        warnings: [],
        fetchedAt: "2026-05-31T00:00:00.000Z",
      },
    },
  ]);

  const tools = createPrismToolDefinitions(context);
  const prep = tools.find((tool) => tool.name === "generate_funding_execution_prep");

  assert.ok(prep);
  const result = await prep.execute(
    "test-prep",
    { artifactId: "第一个机会" },
    undefined,
    undefined,
    {} as Parameters<typeof prep.execute>[4],
  );
  const details = result.details as {
    status?: string;
    humanPlan?: string;
    executionPrepContract?: { contractVersion?: string; confidenceFlags?: { requiresHumanConfirmation?: boolean } };
    riskEvaluation?: { decision?: string };
    readOnlyBoundary?: string;
  };

  assert.equal(details.status, "ok");
  assert.match(details.humanPlan ?? "", /manual execution-prep plan/i);
  assert.equal(details.executionPrepContract?.contractVersion, "mvp1.v1");
  assert.equal(details.executionPrepContract?.confidenceFlags?.requiresHumanConfirmation, true);
  assert.equal(details.riskEvaluation?.decision, "pass");
  assert.match(details.readOnlyBoundary ?? "", /read-only/i);
});
