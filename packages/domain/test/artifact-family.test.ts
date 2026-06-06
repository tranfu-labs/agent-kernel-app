import test from "node:test";
import assert from "node:assert/strict";
import {
  ARTIFACT_FAMILY_TYPES,
  RESEARCH_LAYER_FORBIDDEN_FIELDS,
} from "../src/index.js";

test("artifact family includes generic agent app artifacts", () => {
  assert.equal(ARTIFACT_FAMILY_TYPES.includes("research_brief"), true);
  assert.equal(ARTIFACT_FAMILY_TYPES.includes("source_snapshot"), true);
  assert.equal(ARTIFACT_FAMILY_TYPES.includes("run_summary"), true);
  assert.equal(ARTIFACT_FAMILY_TYPES.includes("workflow_artifact"), true);
});

test("research-layer forbidden fields include credential-bearing inputs", () => {
  for (const field of ["apiKey", "secret", "password", "privateKey", "accessToken", "refreshToken", "sessionCookie"]) {
    assert.equal(RESEARCH_LAYER_FORBIDDEN_FIELDS.includes(field), true);
  }
});
