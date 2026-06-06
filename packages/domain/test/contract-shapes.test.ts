import test from "node:test";
import assert from "node:assert/strict";
import type {
  VerticalPluginDeclaration,
} from "../src/index.js";

type HasUnexpectedVerticalAliases =
  keyof VerticalPluginDeclaration &
  ("vertical_id" | "supported_intents" | "path_mappings" | "artifacts" | "policy_profile");

test("vertical plugin declaration exposes canonical blueprint field names", () => {
  const declaration: VerticalPluginDeclaration = {
    vertical: "knowledge_base",
    supportedIntents: ["explore_method", "map_sources"],
    supportedPaths: ["path_explore_method", "path_report"],
    capabilityKeys: ["knowledge_base.explore_method", "knowledge_base.report"],
    artifactMappings: {
      source: "source_snapshot",
      report: "research_report",
    },
    policyProfile: ["read_only", "human_review_required"],
  };

  const unexpectedAliasCount: Record<HasUnexpectedVerticalAliases, never> = {};

  assert.equal(declaration.vertical, "knowledge_base");
  assert.deepEqual(declaration.supportedIntents, ["explore_method", "map_sources"]);
  assert.deepEqual(declaration.supportedPaths, ["path_explore_method", "path_report"]);
  assert.deepEqual(declaration.capabilityKeys, ["knowledge_base.explore_method", "knowledge_base.report"]);
  assert.deepEqual(declaration.artifactMappings, {
    source: "source_snapshot",
    report: "research_report",
  });
  assert.deepEqual(declaration.policyProfile, ["read_only", "human_review_required"]);
  assert.deepEqual(unexpectedAliasCount, {});
});
