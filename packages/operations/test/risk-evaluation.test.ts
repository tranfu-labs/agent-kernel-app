import test from "node:test";
import assert from "node:assert/strict";
import { evaluateProposalRisk } from "../src/index.js";

test("evaluateProposalRisk stays deterministic and blocks action", () => {
  const risk = evaluateProposalRisk({
    proposalRef: "proposal_eth_basis",
    hasFreshData: false,
    hasHumanReview: false,
  });

  assert.equal(risk.actionAllowed, false);
  assert.equal(risk.checks.some((check) => check.status === "fail"), true);
});
