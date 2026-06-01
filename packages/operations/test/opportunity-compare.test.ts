import test from "node:test";
import assert from "node:assert/strict";
import { compareOpportunityArtifacts } from "../src/index.js";

test("compareOpportunityArtifacts normalizes comparable fields into a comparison artifact", () => {
  const result = compareOpportunityArtifacts([
    { id: "artifact_a", symbol: "ETHUSDT", netEdgeBps: 8 },
    { id: "artifact_b", symbol: "ETHUSDT", netEdgeBps: 5 },
  ]);

  assert.equal(result.type, "comparison_artifact");
  assert.equal(result.rankings[0]?.artifactId, "artifact_a");
  assert.equal(result.rankings[1]?.artifactId, "artifact_b");
});
