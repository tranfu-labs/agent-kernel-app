export interface PlatformRoutingCase {
  name: string;
  input: string;
  expected: {
    vertical: string;
    intent: string;
    path: string;
    orchestrationTemplate: string;
    extensionRequired: boolean;
    clarificationRequired: boolean;
    requiresArtifactContext: boolean;
    requiredArtifactKind?: string;
    fallbackBehavior: string;
    mustReturnBoundaryOnly: boolean;
  };
  tags: string[];
  rationale: string;
}

export const PLATFORM_ROUTING_CASES_DEV: PlatformRoutingCase[] = [
  {
    name: "funding discover english",
    input: "Find BTC and ETH funding opportunities on Binance and Bitget",
    expected: {
      vertical: "funding_basis",
      intent: "discover",
      path: "path_discover",
      orchestrationTemplate: "discover_with_artifact",
      extensionRequired: false,
      clarificationRequired: false,
      requiresArtifactContext: false,
      requiredArtifactKind: undefined,
      fallbackBehavior: "return_readonly_contract",
      mustReturnBoundaryOnly: false,
    },
    tags: ["funding", "english", "discover"],
    rationale: "Canonical funding discovery prompt.",
  },
  {
    name: "funding explain follow-up",
    input: "Explain the first one",
    expected: {
      vertical: "funding_basis",
      intent: "explain",
      path: "path_explain",
      orchestrationTemplate: "explain_from_artifact",
      extensionRequired: false,
      clarificationRequired: false,
      requiresArtifactContext: true,
      requiredArtifactKind: "opportunity_artifact",
      fallbackBehavior: "return_readonly_contract",
      mustReturnBoundaryOnly: false,
    },
    tags: ["followup", "artifact", "english"],
    rationale: "Explain follow-ups should require opportunity artifact context.",
  },
  {
    name: "funding report follow-up",
    input: "Find Binance/Bitget funding opportunities and report them",
    expected: {
      vertical: "funding_basis",
      intent: "report",
      path: "path_report",
      orchestrationTemplate: "report_from_artifacts",
      extensionRequired: false,
      clarificationRequired: false,
      requiresArtifactContext: true,
      requiredArtifactKind: "artifact_collection",
      fallbackBehavior: "return_readonly_contract",
      mustReturnBoundaryOnly: false,
    },
    tags: ["funding", "report", "artifact"],
    rationale: "Report generation should stay artifact-backed and read-only.",
  },
  {
    name: "funding inspect source drilldown",
    input: "Inspect Binance orderbook and funding basis",
    expected: {
      vertical: "funding_basis",
      intent: "inspect_source",
      path: "path_inspect_source",
      orchestrationTemplate: "lookup_once",
      extensionRequired: false,
      clarificationRequired: false,
      requiresArtifactContext: false,
      requiredArtifactKind: undefined,
      fallbackBehavior: "return_readonly_contract",
      mustReturnBoundaryOnly: false,
    },
    tags: ["funding", "inspect_source", "drilldown"],
    rationale: "Orderbook inspection should stay lookup-only and avoid execution traps.",
  },
  {
    name: "prediction-market sample research",
    input: "Help me research the World Cup final market on Polymarket",
    expected: {
      vertical: "prediction_market",
      intent: "inspect_source",
      path: "path_inspect_source",
      orchestrationTemplate: "extension_boundary",
      extensionRequired: true,
      clarificationRequired: false,
      requiresArtifactContext: false,
      requiredArtifactKind: undefined,
      fallbackBehavior: "return_boundary_only",
      mustReturnBoundaryOnly: true,
    },
    tags: ["prediction_market", "boundary", "english"],
    rationale: "Prediction-market sample stays extension-required and boundary-only.",
  },
  {
    name: "generic clarification request",
    input: "Help me with this",
    expected: {
      vertical: "general",
      intent: "general",
      path: "path_general",
      orchestrationTemplate: "clarify_before_route",
      extensionRequired: false,
      clarificationRequired: true,
      requiresArtifactContext: false,
      requiredArtifactKind: undefined,
      fallbackBehavior: "clarify_then_route",
      mustReturnBoundaryOnly: false,
    },
    tags: ["general", "clarify", "boundary"],
    rationale: "Generic requests must clarify before any specialized routing.",
  },
];
