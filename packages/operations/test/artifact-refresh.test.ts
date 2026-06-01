import test from "node:test";
import assert from "node:assert/strict";
import { refreshArtifactView } from "../src/index.js";

test("refreshArtifactView preserves original artifact identity and creates a refresh artifact", () => {
  const result = refreshArtifactView({
    artifactRef: "artifact_opp_ETHUSDT",
    sourceRefs: ["binance", "bitget"],
    deltaSummary: ["Funding spread narrowed from 8 bps to 4 bps"],
    warnings: [],
  });

  assert.equal(result.artifactRef, "artifact_opp_ETHUSDT");
  assert.equal(result.preservedArtifactRef, "artifact_opp_ETHUSDT");
  assert.equal(result.deltaSummary.length, 1);
});
