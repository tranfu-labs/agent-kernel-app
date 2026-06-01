import test from "node:test";
import assert from "node:assert/strict";
import { buildReadOnlyProposal } from "../src/index.js";

test("buildReadOnlyProposal creates a proposal artifact with explicit boundary text", () => {
  const proposal = buildReadOnlyProposal({
    sourceArtifactRefs: ["artifact_opp_ETHUSDT"],
    title: "Review ETH funding-basis candidate",
    thesis: ["Edge remains positive after fees."],
    assumptions: ["Funding remains near current level."],
    missingFacts: ["No live refresh yet."],
  });

  assert.equal(proposal.readOnlyBoundary.includes("read-only"), true);
  assert.equal(proposal.sourceArtifactRefs[0], "artifact_opp_ETHUSDT");
});
