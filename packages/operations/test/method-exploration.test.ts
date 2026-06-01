import test from "node:test";
import assert from "node:assert/strict";
import { compareResearchMethods } from "../src/index.js";

test("compareResearchMethods materializes a method artifact before live discovery", () => {
  const result = compareResearchMethods({
    goal: "Find Binance/Bitget funding-basis opportunities",
    candidateMethods: [
      "cross_venue_funding_basis_scan",
      "manual_single_symbol_lookup",
    ],
    selectedMethod: "cross_venue_funding_basis_scan",
    requiresPrivateApis: false,
  });

  assert.equal(result.methodState.status, "locked");
  assert.equal(result.methodState.selectedMethod, "cross_venue_funding_basis_scan");
  assert.equal(result.artifact.type, "method_artifact");
  assert.match(result.artifact.summary, /locked/i);
  assert.deepEqual(result.methodState.candidateMethods, [
    "cross_venue_funding_basis_scan",
    "manual_single_symbol_lookup",
  ]);
  assert.equal(result.methodState.requiresPrivateApis, false);
  assert.deepEqual(result.artifact.candidateMethods, [
    "cross_venue_funding_basis_scan",
    "manual_single_symbol_lookup",
  ]);
  assert.equal(result.artifact.selectedMethod, "cross_venue_funding_basis_scan");
  assert.equal(result.artifact.requiresPrivateApis, false);
});

test("compareResearchMethods rejects a selected method that is not a candidate", () => {
  assert.throws(
    () =>
      compareResearchMethods({
        goal: "Find Binance/Bitget funding-basis opportunities",
        candidateMethods: [
          "cross_venue_funding_basis_scan",
          "manual_single_symbol_lookup",
        ],
        selectedMethod: "prediction_market_mispricing_scan",
        requiresPrivateApis: false,
      }),
    {
      name: "TypeError",
      message: /selectedMethod must be one of candidateMethods/i,
    },
  );
});
