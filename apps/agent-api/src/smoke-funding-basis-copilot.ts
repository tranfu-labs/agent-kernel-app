import {
  createPrismRuntimeContext,
  createPrismToolDefinitions,
  resolveFundingBasisCopilotRequest,
} from "@agentkernel/funding-basis";

const context = createPrismRuntimeContext();
const tools = createPrismToolDefinitions(context);
const scanner = tools.find((definition) => definition.name === "scan_funding_basis_arbitrage");
const marketContext = tools.find((definition) => definition.name === "get_market_context");
const explanation = tools.find((definition) => definition.name === "explain_opportunity_artifact");
const resolver = tools.find((definition) => definition.name === "resolve_opportunity_artifact_reference");

if (!scanner) throw new Error("scan_funding_basis_arbitrage tool is not registered");
if (!marketContext) throw new Error("get_market_context tool is not registered");
if (!explanation) throw new Error("explain_opportunity_artifact tool is not registered");
if (!resolver) throw new Error("resolve_opportunity_artifact_reference tool is not registered");

const ordinary = resolveFundingBasisCopilotRequest("帮我看看 Binance/Bitget 有没有资金费率套利机会");
const highRisk = resolveFundingBasisCopilotRequest("我准备拿 100000 USDT 直接执行 Binance Bitget 套利");
const polymarket = resolveFundingBasisCopilotRequest("我想研究 Polymarket 世界杯套利机会");
const artifactExplanation = resolveFundingBasisCopilotRequest("解释 artifact_opp_ETHUSDT_binance_bitget 为什么值得看");
const sessionExplanation = resolveFundingBasisCopilotRequest("解释第一个机会为什么值得看");

if (ordinary.intent !== "cross_venue_funding_basis" || ordinary.preferredTool !== "scan_funding_basis_arbitrage") {
  throw new Error("Ordinary Binance/Bitget request did not prefer scan_funding_basis_arbitrage");
}

if (highRisk.behavior !== "ask_readonly_parameters") {
  throw new Error("High-risk request did not trigger read-only ask-first behavior");
}

if (polymarket.intent !== "unsupported_or_extension_required" || polymarket.preferredTool !== undefined) {
  throw new Error("Polymarket request should be extension-required in MVP1");
}

if (artifactExplanation.intent !== "opportunity_explanation" || artifactExplanation.preferredTool !== "explain_opportunity_artifact") {
  throw new Error("Artifact explanation request did not prefer explain_opportunity_artifact");
}

if (sessionExplanation.intent !== "opportunity_explanation" || sessionExplanation.preferredTool !== "resolve_opportunity_artifact_reference") {
  throw new Error("Session explanation request did not prefer resolve_opportunity_artifact_reference");
}

const scannerGuidance = (scanner.promptGuidelines ?? []).join(" ");
const marketContextGuidance = (marketContext.promptGuidelines ?? []).join(" ");

if (!/Prefer scan_funding_basis_arbitrage/.test(scannerGuidance)) {
  throw new Error("Scanner guidance does not prefer scan_funding_basis_arbitrage");
}

if (!/drilldown/.test(marketContextGuidance)) {
  throw new Error("Market context guidance does not describe drilldown behavior");
}

console.log(JSON.stringify({
  ordinary,
  highRisk,
  polymarket,
  artifactExplanation,
  sessionExplanation,
  scannerTool: scanner.name,
  marketContextTool: marketContext.name,
  resolverTool: resolver.name,
  explanationTool: explanation.name,
}, null, 2));
