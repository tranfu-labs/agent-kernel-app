import test from "node:test";
import assert from "node:assert/strict";
import { resolvePlatformResearchRequest } from "../src/funding-basis.js";

test("execution-prep requests route to proposal path without unlocking execution", () => {
  const input = "给我准备一个 Binance 和 Bitget 的资金费率套利执行前准备方案";
  const result = resolvePlatformResearchRequest(input);

  assert.equal(result.vertical, "funding_basis");
  assert.equal(result.intent, "propose");
  assert.equal(result.path, "path_propose");
  assert.equal(result.requiresArtifactContext, true);
  assert.equal(result.requiredArtifactKind, "opportunity_artifact");
  assert.equal(result.clarificationRequired, false);
  assert.ok(result.toolAccess.blockedTools.includes("place_order"));
  assert.ok(result.toolAccess.blockedTools.includes("execute_trade"));
  assert.equal(result.toolAccess.mustReturnBoundaryOnly, false);
});

test("artifact follow-up prep wording stays on proposal path", () => {
  const input = "把第一个机会整理成可执行前准备方案";
  const result = resolvePlatformResearchRequest(input);

  assert.equal(result.vertical, "funding_basis");
  assert.equal(result.intent, "propose");
  assert.equal(result.path, "path_propose");
  assert.equal(result.requiresArtifactContext, true);
  assert.equal(result.requiredArtifactKind, "opportunity_artifact");
});

test("prep risk wording routes to evaluate_risk and requires proposal artifacts", () => {
  const input = "评估这个套利准备方案的风险";
  const result = resolvePlatformResearchRequest(input);

  assert.equal(result.vertical, "funding_basis");
  assert.equal(result.intent, "evaluate_risk");
  assert.equal(result.path, "path_evaluate_risk");
  assert.equal(result.requiresArtifactContext, true);
  assert.equal(result.requiredArtifactKind, "proposal_artifact");
  assert.ok(result.toolAccess.blockedTools.includes("place_order"));
});

test("real execution requests remain clarification-first and do not route as prep", () => {
  const input = "直接帮我在 Binance 和 Bitget 下单执行这个套利";
  const result = resolvePlatformResearchRequest(input);

  assert.equal(result.vertical, "funding_basis");
  assert.equal(result.clarificationRequired, true);
  assert.equal(result.toolAccess.mustClarifyBeforeAnyTool, true);
  assert.ok(result.toolAccess.blockedTools.includes("place_order"));
  assert.ok(result.toolAccess.blockedTools.includes("execute_trade"));
});
