import type { ResearchVertical } from "./research-state.js";

export interface VerticalPluginDeclaration {
  vertical: ResearchVertical;
  supportedIntents: string[];
  supportedPaths: string[];
  capabilityKeys: string[];
  artifactMappings: Record<string, string>;
  policyProfile: string[];
}

export const FUNDING_BASIS_VERTICAL: VerticalPluginDeclaration = {
  vertical: "funding_basis",
  supportedIntents: [
    "discover",
    "explain",
    "report",
    "compare",
    "refresh",
    "monitor",
    "emit_signal",
    "propose",
    "evaluate_risk",
  ],
  supportedPaths: [
    "path_discover",
    "path_explain",
    "path_report",
    "path_compare",
    "path_refresh",
    "path_monitor",
    "path_emit_signal",
    "path_propose",
    "path_evaluate_risk",
  ],
  capabilityKeys: [
    "funding_basis.discover",
    "funding_basis.explain",
    "funding_basis.report",
    "funding_basis.compare",
    "funding_basis.refresh",
    "funding_basis.monitor",
    "funding_basis.emit_signal",
    "funding_basis.propose",
    "funding_basis.evaluate_risk",
  ],
  artifactMappings: {
    discovery: "opportunity_artifact",
    explanation: "research_report",
    monitoring: "monitor_definition",
    signal: "signal_artifact",
    proposal: "proposal_artifact",
    risk: "risk_artifact",
    refresh: "refresh_artifact",
  },
  policyProfile: [
    "read_only_research",
    "tool_backed_facts_only",
    "proposal_before_execution",
  ],
};

export const PREDICTION_MARKET_VERTICAL: VerticalPluginDeclaration = {
  vertical: "prediction_market",
  supportedIntents: [
    "inspect_source",
    "discover",
    "explain",
    "report",
    "compare",
    "refresh",
    "propose",
  ],
  supportedPaths: [
    "path_inspect_source",
    "path_discover",
    "path_explain",
    "path_report",
    "path_compare",
    "path_refresh",
    "path_propose",
  ],
  capabilityKeys: [
    "prediction_market.inspect_source",
    "prediction_market.discover",
    "prediction_market.explain",
    "prediction_market.report",
    "prediction_market.compare",
    "prediction_market.refresh",
    "prediction_market.propose",
  ],
  artifactMappings: {
    sourceInspection: "source_snapshot",
    marketContext: "market_context_snapshot",
    opportunity: "opportunity_artifact",
    report: "research_report",
    proposal: "proposal_artifact",
  },
  policyProfile: [
    "read_only_market_research_only",
    "no_wallet_private_keys",
    "no_bet_placement",
    "no_automatic_participation",
  ],
};
