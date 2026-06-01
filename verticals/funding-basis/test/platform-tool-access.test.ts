import test from "node:test";
import assert from "node:assert/strict";
import { resolvePlatformToolAccess } from "../src/platform-tool-access.js";

test("resolvePlatformToolAccess blocks all tools when clarification is required", () => {
  const result = resolvePlatformToolAccess({
    vertical: "general",
    path: "path_general",
    orchestrationTemplate: "lookup_once",
    extensionRequired: false,
    clarificationRequired: true,
  });

  assert.deepEqual(result.allowedTools, []);
  assert.equal(result.allowArtifactWrites, false);
  assert.equal(result.mustClarifyBeforeAnyTool, true);
  assert.equal(result.mustReturnBoundaryOnly, false);
});

test("resolvePlatformToolAccess returns boundary-only access for prediction-market requests", () => {
  const result = resolvePlatformToolAccess({
    vertical: "prediction_market",
    path: "path_discover",
    orchestrationTemplate: "extension_boundary",
    extensionRequired: true,
    clarificationRequired: false,
  });

  assert.deepEqual(result.allowedTools, []);
  assert.equal(result.mustClarifyBeforeAnyTool, false);
  assert.equal(result.mustReturnBoundaryOnly, true);
  assert.ok(result.blockedTools.includes("place_order"));
  assert.ok(result.blockedTools.includes("execute_trade"));
});

test("resolvePlatformToolAccess allows only read-only funding tools on normal flows", () => {
  const result = resolvePlatformToolAccess({
    vertical: "funding_basis",
    path: "path_report",
    orchestrationTemplate: "report_from_artifacts",
    extensionRequired: false,
    clarificationRequired: false,
  });

  assert.deepEqual(result.allowedTools, [
    "resolve_opportunity_artifact_reference",
    "generate_opportunity_research_report",
  ]);
  assert.equal(result.allowArtifactWrites, false);
  assert.equal(result.mustClarifyBeforeAnyTool, false);
  assert.equal(result.mustReturnBoundaryOnly, false);
  assert.ok(result.blockedTools.includes("place_order"));
  assert.ok(result.blockedTools.includes("execute_trade"));
  assert.ok(result.blockedTools.includes("write_artifact"));
});

test("resolvePlatformToolAccess fails closed for unsupported funding paths", () => {
  const result = resolvePlatformToolAccess({
    vertical: "funding_basis",
    path: "path_compare",
    orchestrationTemplate: "boundary_response_readonly",
    extensionRequired: false,
    clarificationRequired: false,
  });

  assert.deepEqual(result.allowedTools, []);
  assert.equal(result.mustClarifyBeforeAnyTool, false);
  assert.equal(result.mustReturnBoundaryOnly, false);
});
