import test from "node:test";
import assert from "node:assert/strict";
import { resolvePlatformResearchRequest } from "../src/funding-basis.js";

test("resolvePlatformResearchRequest returns an executable read-only report contract for funding research", () => {
  const input = "Find Binance/Bitget funding opportunities and report them";
  const result = resolvePlatformResearchRequest(input);

  assert.equal(result.contractVersion, "mvp1.v1");
  assert.equal(result.request.rawInput, input);
  assert.equal(result.request.normalizedInput, input);
  assert.equal(result.vertical, "funding_basis");
  assert.equal(result.intent, "report");
  assert.equal(result.path, "path_report");
  assert.equal(result.readOnly, true);
  assert.equal(result.determinismLevel, "rule_based");
  assert.equal(result.selectedOperation, "generate_opportunity_research_report");
  assert.equal(result.orchestrationTemplate, "report_from_artifacts");
  assert.deepEqual(result.pathGuidance, [
    "Gather evidence from saved artifacts and summarize it into a report.",
    "Keep the report traceable to tool-backed facts.",
  ]);
  assert.equal(result.extensionRequired, false);
  assert.equal(result.clarificationRequired, false);
  assert.equal(result.requiresArtifactContext, true);
  assert.equal(result.requiredArtifactKind, "artifact_collection");
  assert.deepEqual(result.policy.profile, ["read_only_research", "tool_backed_facts_only", "proposal_before_execution"]);
  assert.equal(result.policy.executionAllowed, false);
  assert.deepEqual(result.toolAccess.allowedTools, ["resolve_opportunity_artifact_reference", "generate_opportunity_research_report"]);
  assert.ok(result.toolAccess.blockedTools.includes("place_order"));
  assert.ok(result.toolAccess.blockedTools.includes("execute_trade"));
  assert.ok(result.toolAccess.blockedTools.includes("write_artifact"));
  assert.equal(result.toolAccess.allowArtifactWrites, false);
  assert.equal(result.toolAccess.mustClarifyBeforeAnyTool, false);
  assert.equal(result.toolAccess.mustReturnBoundaryOnly, false);
  assert.equal(result.fallbackBehavior, "return_readonly_contract");
  assert.ok(result.boundaryExplanation.length > 0);
});

test("resolvePlatformResearchRequest returns an executable explain contract that requires artifact context", () => {
  const input = "Why is the first opportunity good?";
  const result = resolvePlatformResearchRequest(input);

  assert.equal(result.vertical, "funding_basis");
  assert.equal(result.intent, "explain");
  assert.equal(result.path, "path_explain");
  assert.equal(result.selectedOperation, "resolve_opportunity_artifact_reference");
  assert.equal(result.orchestrationTemplate, "explain_from_artifact");
  assert.deepEqual(result.pathGuidance, [
    "Load the referenced artifact before explaining the opportunity.",
    "Refresh stale facts before explaining risk or invalidation conditions.",
    "Do not provide execution instructions.",
  ]);
  assert.equal(result.requiresArtifactContext, true);
  assert.equal(result.requiredArtifactKind, "opportunity_artifact");
  assert.deepEqual(result.toolAccess.allowedTools, ["resolve_opportunity_artifact_reference", "explain_opportunity_artifact"]);
  assert.equal(result.toolAccess.mustClarifyBeforeAnyTool, false);
  assert.equal(result.toolAccess.mustReturnBoundaryOnly, false);
});

test("resolvePlatformResearchRequest routes prediction-market research to a read-only extension boundary", () => {
  const input = "Research the Polymarket prediction market for World Cup outcomes";
  const result = resolvePlatformResearchRequest(input);

  assert.equal(result.vertical, "prediction_market");
  assert.equal(result.extensionRequired, true);
  assert.equal(result.readOnly, true);
  assert.deepEqual(result.policy.profile, [
    "read_only_market_research_only",
    "no_wallet_private_keys",
    "no_bet_placement",
    "no_automatic_participation",
  ]);
  assert.deepEqual(result.toolAccess.allowedTools, []);
  assert.equal(result.toolAccess.mustReturnBoundaryOnly, true);
  assert.ok(result.toolAccess.blockedTools.includes("place_order"));
});

test("resolvePlatformResearchRequest keeps read-only inspect flows out of execution clarification traps", () => {
  const input = "Inspect Binance orderbook and funding basis";
  const result = resolvePlatformResearchRequest(input);

  assert.equal(result.vertical, "funding_basis");
  assert.equal(result.intent, "inspect_source");
  assert.equal(result.orchestrationTemplate, "lookup_once");
  assert.deepEqual(result.pathGuidance, ["Use a single read-only lookup path and avoid multi-step execution."]);
  assert.equal(result.clarificationRequired, false);
  assert.deepEqual(result.toolAccess.allowedTools, ["get_funding_rates", "get_market_context"]);
});

test("resolvePlatformResearchRequest preserves compare intent for funding requests", () => {
  const input = "Compare Binance and Bitget funding opportunities";
  const result = resolvePlatformResearchRequest(input);

  assert.equal(result.vertical, "funding_basis");
  assert.equal(result.intent, "compare");
  assert.equal(result.path, "path_compare");
});

test("resolvePlatformResearchRequest requires an opportunity artifact for proposal follow-ups", () => {
  const input = "Create a proposal for the best Binance funding opportunity";
  const result = resolvePlatformResearchRequest(input);

  assert.equal(result.vertical, "funding_basis");
  assert.equal(result.intent, "propose");
  assert.equal(result.path, "path_propose");
  assert.equal(result.requiresArtifactContext, true);
  assert.equal(result.requiredArtifactKind, "opportunity_artifact");
  assert.deepEqual(result.followupNotes, ["proposals must start from a previously identified opportunity artifact"]);
});

test("resolvePlatformResearchRequest requires a proposal artifact for risk follow-ups", () => {
  const input = "Evaluate the risk of this funding proposal";
  const result = resolvePlatformResearchRequest(input);

  assert.equal(result.vertical, "funding_basis");
  assert.equal(result.intent, "evaluate_risk");
  assert.equal(result.path, "path_evaluate_risk");
  assert.equal(result.requiresArtifactContext, true);
  assert.equal(result.requiredArtifactKind, "proposal_artifact");
  assert.deepEqual(result.followupNotes, ["risk evaluation must inspect a proposal artifact"]);
});

test("resolvePlatformResearchRequest keeps generic requests in general with clarification-first fallback", () => {
  const input = "Help me with this";
  const result = resolvePlatformResearchRequest(input);

  assert.equal(result.vertical, "general");
  assert.equal(result.intent, "general");
  assert.equal(result.clarificationRequired, true);
  assert.deepEqual(result.policy.profile, ["read_only_research", "clarify_before_specialized_work"]);
  assert.deepEqual(result.toolAccess.allowedTools, []);
  assert.equal(result.toolAccess.mustClarifyBeforeAnyTool, true);
  assert.equal(result.fallbackBehavior, "clarify_then_route");
});
