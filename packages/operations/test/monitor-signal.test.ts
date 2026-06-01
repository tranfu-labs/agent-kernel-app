import test from "node:test";
import assert from "node:assert/strict";
import { buildSignalArtifactFromMonitor } from "../src/index.js";

test("buildSignalArtifactFromMonitor creates a lightweight signal with lineage", () => {
  const signal = buildSignalArtifactFromMonitor({
    monitorRef: "monitor_eth_basis",
    sourceRefs: ["binance", "bitget"],
    comparisonRefs: ["cmp_eth_basis"],
    kind: "funding_spread_change",
    severity: "medium",
    confidence: 0.8,
    changeSummary: "Funding spread widened to 12 bps",
    whyItMatters: "The widened spread may justify new review.",
    recommendedNextStep: "Review the latest opportunity artifact.",
  });

  assert.equal(signal.monitorRef, "monitor_eth_basis");
  assert.equal(signal.escalatedToProposal, false);
  assert.equal(signal.kind, "funding_spread_change");
});
