import test from "node:test";
import assert from "node:assert/strict";

import baseline from "./fixtures/raw-pi-agent-baseline.v1.json" with { type: "json" };
import { PLATFORM_ROUTING_CASES_ACCEPTANCE } from "./fixtures/platform-routing-cases.acceptance.js";
import { resolvePlatformResearchRequest } from "../src/funding-basis.js";

interface BaselineResult {
  name: string;
  vertical: string;
  intent: string;
  path: string;
  clarificationRequired: boolean;
  extensionRequired: boolean;
}

test("Prism routing matches or exceeds the frozen raw Pi Agent baseline on locked acceptance cases", () => {
  const baselineMap = new Map((baseline as BaselineResult[]).map((item) => [item.name, item]));

  for (const scenario of PLATFORM_ROUTING_CASES_ACCEPTANCE) {
    const result = resolvePlatformResearchRequest(scenario.input);
    const baselineResult = baselineMap.get(scenario.name);

    assert.ok(baselineResult, `Missing baseline result for ${scenario.name}`);
    assert.equal(result.vertical, scenario.expected.vertical, `${scenario.name}: vertical vs expectation`);
    assert.equal(result.intent, scenario.expected.intent, `${scenario.name}: intent vs expectation`);
    assert.equal(result.path, scenario.expected.path, `${scenario.name}: path vs expectation`);
    assert.equal(result.extensionRequired, scenario.expected.extensionRequired, `${scenario.name}: extensionRequired vs expectation`);
    assert.equal(result.clarificationRequired, scenario.expected.clarificationRequired, `${scenario.name}: clarificationRequired vs expectation`);
    assert.equal(result.vertical, baselineResult.vertical, `${scenario.name}: vertical vs baseline`);
    assert.equal(result.intent, baselineResult.intent, `${scenario.name}: intent vs baseline`);
    assert.equal(result.path, baselineResult.path, `${scenario.name}: path vs baseline`);

    if (baselineResult.extensionRequired) {
      assert.equal(result.extensionRequired, true, `${scenario.name}: extension boundary must not regress below baseline`);
    }

    if (baselineResult.clarificationRequired) {
      assert.equal(result.clarificationRequired, true, `${scenario.name}: clarification recall must not regress below baseline`);
    }
  }
});
