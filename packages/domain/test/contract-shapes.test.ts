import test from "node:test";
import assert from "node:assert/strict";
import type {
  RiskCheckResult,
  VerticalPluginDeclaration,
} from "../src/index.js";

type HasUnexpectedVerticalAliases =
  keyof VerticalPluginDeclaration &
  ("vertical_id" | "supported_intents" | "path_mappings" | "artifacts" | "policy_profile");

test("vertical plugin declaration exposes canonical blueprint field names", () => {
  const declaration: VerticalPluginDeclaration = {
    vertical: "funding_basis",
    supportedIntents: ["explore_method", "map_sources"],
    supportedPaths: ["path_explore_method", "path_report"],
    capabilityKeys: ["funding_basis.explore_method", "funding_basis.report"],
    artifactMappings: {
      refresh: "refresh_artifact",
      signal: "signal_artifact",
    },
    policyProfile: ["read_only", "human_review_required"],
  };

  const unexpectedAliasCount: Record<HasUnexpectedVerticalAliases, never> = {};

  assert.equal(declaration.vertical, "funding_basis");
  assert.deepEqual(declaration.supportedIntents, ["explore_method", "map_sources"]);
  assert.deepEqual(declaration.supportedPaths, ["path_explore_method", "path_report"]);
  assert.deepEqual(declaration.capabilityKeys, ["funding_basis.explore_method", "funding_basis.report"]);
  assert.deepEqual(declaration.artifactMappings, {
    refresh: "refresh_artifact",
    signal: "signal_artifact",
  });
  assert.deepEqual(declaration.policyProfile, ["read_only", "human_review_required"]);
  assert.deepEqual(unexpectedAliasCount, {});
});

test("risk check result keeps the approved Task 2 fields without research bridge metadata", () => {
  const result: RiskCheckResult = {
    id: "risk_123",
    proposalId: "proposal_123",
    decision: "requires_confirmation",
    checks: [],
    requiredConfirmation: true,
    blockingReasons: [],
    warnings: [],
    policyVersion: "2026-05-31",
    checkedAt: "2026-05-31T00:00:00Z",
  };

  assert.equal(result.decision, "requires_confirmation");
  assert.equal("researchBridge" in result, false);
});
