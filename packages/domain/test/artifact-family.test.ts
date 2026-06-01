import test from "node:test";
import assert from "node:assert/strict";
import {
  ARTIFACT_FAMILY_TYPES,
  RESEARCH_LAYER_FORBIDDEN_FIELDS,
} from "../src/index.js";

test("artifact family includes refresh, signal, proposal, and risk artifacts", () => {
  assert.equal(ARTIFACT_FAMILY_TYPES.includes("refresh_artifact"), true);
  assert.equal(ARTIFACT_FAMILY_TYPES.includes("signal_artifact"), true);
  assert.equal(ARTIFACT_FAMILY_TYPES.includes("proposal_artifact"), true);
  assert.equal(ARTIFACT_FAMILY_TYPES.includes("risk_artifact"), true);
});

test("research-layer forbidden fields include action-capable inputs", () => {
  for (const field of ["apiKey", "secret", "account", "balance", "position", "order", "margin", "withdraw", "transfer", "walletPrivateKey"]) {
    assert.equal(RESEARCH_LAYER_FORBIDDEN_FIELDS.includes(field), true);
  }
});
