import { buildSignalArtifactFromMonitor } from "@agentkernel/operations";

const signal = buildSignalArtifactFromMonitor({
  monitorRef: "monitor_eth_basis",
  sourceRefs: ["binance", "bitget"],
  comparisonRefs: ["cmp_eth_basis"],
  kind: "funding_spread_change",
  severity: "medium",
  confidence: 0.8,
  changeSummary: "Funding spread widened to 12 bps",
  whyItMatters: "This may justify renewed review.",
  recommendedNextStep: "Open the latest report before escalation.",
});

if (signal.escalatedToProposal !== false) {
  throw new Error("Signal smoke crossed the proposal boundary");
}

console.log(JSON.stringify(signal, null, 2));
