import test from "node:test";
import assert from "node:assert/strict";
import { resolvePlatformPolicyGate } from "../src/platform-policy-gate.js";

test("resolvePlatformPolicyGate returns funding-basis read-only policy profile", () => {
  const result = resolvePlatformPolicyGate({
    vertical: "funding_basis",
    capability: "report",
    path: "path_report",
    requiresArtifactContext: true,
  });

  assert.equal(result.extensionRequired, false);
  assert.equal(result.executionAllowed, false);
  assert.deepEqual(result.profile, [
    "read_only_research",
    "tool_backed_facts_only",
    "proposal_before_execution",
  ]);
  assert.ok(result.boundaryExplanation.length > 0);
});

test("resolvePlatformPolicyGate returns general clarification-first policy profile", () => {
  const result = resolvePlatformPolicyGate({
    vertical: "general",
    capability: "general",
    path: "path_general",
    requiresArtifactContext: false,
  });

  assert.equal(result.extensionRequired, false);
  assert.equal(result.executionAllowed, false);
  assert.deepEqual(result.profile, [
    "read_only_research",
    "clarify_before_specialized_work",
  ]);
  assert.ok(result.boundaryExplanation.length > 0);
});

test("resolvePlatformPolicyGate returns prediction-market boundary policy profile", () => {
  const result = resolvePlatformPolicyGate({
    vertical: "prediction_market",
    capability: "discover",
    path: "path_discover",
    requiresArtifactContext: false,
  });

  assert.equal(result.extensionRequired, true);
  assert.equal(result.executionAllowed, false);
  assert.deepEqual(result.profile, [
    "read_only_market_research_only",
    "no_wallet_private_keys",
    "no_bet_placement",
    "no_automatic_participation",
  ]);
  assert.ok(result.boundaryExplanation.length > 0);
});
