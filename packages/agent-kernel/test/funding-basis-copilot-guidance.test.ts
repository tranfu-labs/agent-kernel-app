import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_FUNDING_BASIS_COPILOT_PARAMS,
  resolveFundingBasisCopilotRequest,
} from "../src/funding-basis-copilot-guidance.js";

test("ordinary Binance/Bitget arbitrage requests run with defaults", () => {
  const result = resolveFundingBasisCopilotRequest("帮我看看 Binance/Bitget 有没有资金费率套利机会");

  assert.equal(result.intent, "cross_venue_funding_basis");
  assert.equal(result.behavior, "run_with_defaults");
  assert.equal(result.preferredTool, "scan_funding_basis_arbitrage");
  assert.equal(result.platformIntent, "discover");
  assert.equal(result.vertical, "funding_basis");
  assert.equal(result.capability, "funding_basis.discover");
  assert.equal(result.path, "path_discover");
  assert.equal(result.readOnly, true);
  assert.deepEqual(result.defaultParams.symbols, ["BTCUSDT", "ETHUSDT", "SOLUSDT"]);
  assert.equal(result.defaultParams.targetNotionalUsd, 1000);
  assert.equal(result.defaultParams.estimatedFeeBps, 4);
  assert.equal(result.defaultParams.mode, "balanced");
  assert.equal(result.defaultParams.saveArtifacts, true);
});

test("high-risk or execution-shaped requests ask first and stay read-only", () => {
  const result = resolveFundingBasisCopilotRequest("我准备拿 100000 USDT 直接执行 Binance Bitget 套利");

  assert.equal(result.intent, "cross_venue_funding_basis");
  assert.equal(result.behavior, "ask_readonly_parameters");
  assert.equal(result.preferredTool, "scan_funding_basis_arbitrage");
  assert.match(result.reason, /read-only/);
});

test("lookup requests use low-level tools instead of opportunity creation", () => {
  const result = resolveFundingBasisCopilotRequest("Binance BTC funding rate 是多少");

  assert.equal(result.intent, "funding_rate_lookup");
  assert.equal(result.behavior, "lookup");
  assert.equal(result.preferredTool, "get_funding_rates");
});

test("opportunity explanation requests with artifact IDs prefer artifact-backed explanation", () => {
  const result = resolveFundingBasisCopilotRequest("解释 artifact_opp_ETHUSDT_binance_bitget 为什么值得看");

  assert.equal(result.intent, "opportunity_explanation");
  assert.equal(result.behavior, "explain_opportunity");
  assert.equal(result.preferredTool, "explain_opportunity_artifact");
  assert.equal(result.platformIntent, "explain");
  assert.equal(result.vertical, "funding_basis");
  assert.equal(result.capability, "funding_basis.explain");
  assert.equal(result.path, "path_explain");
  assert.equal(result.readOnly, true);
  assert.match(result.reason, /artifact/);
});

test("session-index opportunity explanation requests resolve references first", () => {
  const result = resolveFundingBasisCopilotRequest("解释第一个机会为什么值得看");

  assert.equal(result.intent, "opportunity_explanation");
  assert.equal(result.behavior, "explain_opportunity");
  assert.equal(result.preferredTool, "resolve_opportunity_artifact_reference");
  assert.equal(result.platformIntent, "explain");
  assert.equal(result.vertical, "funding_basis");
  assert.equal(result.capability, "funding_basis.explain");
  assert.equal(result.path, "path_explain");
  assert.equal(result.readOnly, true);
  assert.match(result.reason, /session reference/);
});

test("future vertical requests are extension-required instead of routed to funding scanner", () => {
  const polymarket = resolveFundingBasisCopilotRequest("我想研究 Polymarket 世界杯套利机会");
  const aShare = resolveFundingBasisCopilotRequest("我想接入 A 股自定义数据源研究机会");
  const spotPerp = resolveFundingBasisCopilotRequest("帮我看现货永续 basis 机会");

  assert.equal(polymarket.intent, "unsupported_or_extension_required");
  assert.equal(polymarket.behavior, "explain_extension_required");
  assert.equal(polymarket.preferredTool, undefined);
  assert.equal(polymarket.platformIntent, "extension_required");
  assert.equal(polymarket.path, "path_extension_required");
  assert.match(polymarket.reason, /PredictionMarketContext/);

  assert.equal(aShare.intent, "unsupported_or_extension_required");
  assert.equal(aShare.behavior, "explain_extension_required");
  assert.equal(aShare.preferredTool, undefined);
  assert.equal(aShare.platformIntent, "extension_required");
  assert.equal(aShare.path, "path_extension_required");
  assert.match(aShare.reason, /custom provider/);

  assert.equal(spotPerp.intent, "unsupported_or_extension_required");
  assert.equal(spotPerp.behavior, "explain_extension_required");
  assert.equal(spotPerp.preferredTool, undefined);
  assert.equal(spotPerp.platformIntent, "extension_required");
  assert.equal(spotPerp.path, "path_extension_required");
  assert.match(spotPerp.reason, /spot-perp/);
});

test("report-style artifact requests use report routing without breaking explanations", () => {
  const report = resolveFundingBasisCopilotRequest("请基于 artifact_opp_ETHUSDT_binance_bitget 出一份研究报告");
  const savedOpportunityReport = resolveFundingBasisCopilotRequest("给这个 saved opportunity 写个 report");
  const explanation = resolveFundingBasisCopilotRequest("解释 artifact_opp_ETHUSDT_binance_bitget 为什么值得看");

  assert.equal(report.intent, "opportunity_explanation");
  assert.equal(report.behavior, "explain_opportunity");
  assert.equal(report.preferredTool, "generate_opportunity_research_report");
  assert.equal(report.platformIntent, "report");
  assert.equal(report.path, "path_report");
  assert.match(report.reason, /report/i);

  assert.equal(savedOpportunityReport.intent, "opportunity_explanation");
  assert.equal(savedOpportunityReport.behavior, "explain_opportunity");
  assert.equal(savedOpportunityReport.preferredTool, "resolve_opportunity_artifact_reference");
  assert.equal(savedOpportunityReport.platformIntent, "report");
  assert.equal(savedOpportunityReport.path, "path_report");
  assert.match(savedOpportunityReport.reason, /report/i);

  assert.equal(explanation.preferredTool, "explain_opportunity_artifact");
  assert.equal(explanation.platformIntent, "explain");
  assert.equal(explanation.path, "path_explain");
});

test("default params are stable product assumptions", () => {
  assert.deepEqual(DEFAULT_FUNDING_BASIS_COPILOT_PARAMS, {
    venues: ["binance", "bitget"],
    symbols: ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
    marketType: "linear_perp",
    targetNotionalUsd: 1000,
    estimatedFeeBps: 4,
    mode: "balanced",
    saveArtifacts: true,
  });
});
