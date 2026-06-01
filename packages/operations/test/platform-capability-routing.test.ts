import test from "node:test";
import assert from "node:assert/strict";
import {
  resolvePlatformIntent,
  resolvePlatformCapability,
  choosePlatformPath,
} from "../src/index.js";

test("compare intent stays platform-level while vertical changes separately", () => {
  const funding = resolvePlatformCapability({
    input: "Compare these two funding artifacts",
    vertical: "funding_basis",
  });
  const prediction = resolvePlatformCapability({
    input: "Compare these two World Cup market artifacts",
    vertical: "prediction_market",
  });

  assert.equal(funding.intent, "compare");
  assert.equal(prediction.intent, "compare");
  assert.equal(funding.vertical, "funding_basis");
  assert.equal(prediction.vertical, "prediction_market");
});

test("monitor path is chosen from intent and not from tool name", () => {
  const intent = resolvePlatformIntent({
    input: "Keep watching this opportunity and alert me if the edge changes",
    vertical: "funding_basis",
  });
  const path = choosePlatformPath(intent);

  assert.equal(intent, "monitor");
  assert.equal(path, "path_monitor");
});

test("proposal intent remains read-only and routes before any action", () => {
  const capability = resolvePlatformCapability({
    input: "Create a proposal from this saved artifact",
    vertical: "funding_basis",
  });

  assert.equal(capability.intent, "propose");
  assert.equal(capability.path, "path_propose");
  assert.equal(capability.readOnly, true);
});

test("risk intent wins over proposal mentions in follow-up wording", () => {
  const capability = resolvePlatformCapability({
    input: "Evaluate the risk of this funding proposal",
    vertical: "funding_basis",
  });

  assert.equal(capability.intent, "evaluate_risk");
  assert.equal(capability.path, "path_evaluate_risk");
  assert.equal(capability.readOnly, true);
});

test("extension-required phrasing resolves to extension_required and path_extension_required", () => {
  const capability = resolvePlatformCapability({
    input: "This needs an extension before it is supported",
    vertical: "funding_basis",
  });

  assert.equal(capability.intent, "extension_required");
  assert.equal(capability.path, "path_extension_required");
  assert.equal(capability.readOnly, true);
});
