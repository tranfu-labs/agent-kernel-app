import test from "node:test";
import assert from "node:assert/strict";

import { resolvePlatformResearchRequest } from "../src/index.js";
import { PLATFORM_ROUTING_CASES_DEV, type PlatformRoutingCase } from "./fixtures/platform-routing-cases.dev.js";
import { PLATFORM_ROUTING_CASES_HOLDOUT } from "./fixtures/platform-routing-cases.holdout.js";

function assertRoutingCase(scenario: PlatformRoutingCase) {
  const result = resolvePlatformResearchRequest(scenario.input);

  assert.equal(result.vertical, scenario.expected.vertical, `${scenario.name}: vertical`);
  assert.equal(result.intent, scenario.expected.intent, `${scenario.name}: intent`);
  assert.equal(result.path, scenario.expected.path, `${scenario.name}: path`);
  assert.equal(result.orchestrationTemplate, scenario.expected.orchestrationTemplate, `${scenario.name}: orchestrationTemplate`);
  assert.equal(result.extensionRequired, scenario.expected.extensionRequired, `${scenario.name}: extensionRequired`);
  assert.equal(result.clarificationRequired, scenario.expected.clarificationRequired, `${scenario.name}: clarificationRequired`);
  assert.equal(result.requiresArtifactContext, scenario.expected.requiresArtifactContext, `${scenario.name}: requiresArtifactContext`);
  assert.equal(result.requiredArtifactKind, scenario.expected.requiredArtifactKind, `${scenario.name}: requiredArtifactKind`);
  assert.equal(result.fallbackBehavior, scenario.expected.fallbackBehavior, `${scenario.name}: fallbackBehavior`);
  assert.equal(result.toolAccess.mustReturnBoundaryOnly, scenario.expected.mustReturnBoundaryOnly, `${scenario.name}: mustReturnBoundaryOnly`);
}

for (const scenario of PLATFORM_ROUTING_CASES_DEV) {
  test(`routing regression dev: ${scenario.name}`, () => {
    assertRoutingCase(scenario);
  });
}

for (const scenario of PLATFORM_ROUTING_CASES_HOLDOUT) {
  test(`routing regression holdout: ${scenario.name}`, () => {
    assertRoutingCase(scenario);
  });
}
