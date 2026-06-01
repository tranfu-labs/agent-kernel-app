import {
  createPrismRuntimeContext,
  createPrismToolDefinitions,
  resolvePlatformResearchRequest,
} from "@agentkernel/agent-kernel";

const context = createPrismRuntimeContext();
const tools = createPrismToolDefinitions(context);
const toolNames = new Set(tools.map((tool) => tool.name));

const scenarios = [
  {
    name: "funding report",
    input: "Find Binance/Bitget funding opportunities and report them",
    expected: {
      path: "path_report",
      orchestrationTemplate: "report_from_artifacts",
      mustReturnBoundaryOnly: false,
      allowedTools: ["resolve_opportunity_artifact_reference", "generate_opportunity_research_report"],
    },
  },
  {
    name: "funding inspect",
    input: "Inspect Binance orderbook and funding basis",
    expected: {
      path: "path_inspect_source",
      orchestrationTemplate: "lookup_once",
      mustReturnBoundaryOnly: false,
      allowedTools: ["get_funding_rates", "get_market_context"],
    },
  },
  {
    name: "prediction boundary",
    input: "Research the Polymarket prediction market for World Cup outcomes",
    expected: {
      path: "path_inspect_source",
      orchestrationTemplate: "extension_boundary",
      mustReturnBoundaryOnly: true,
      allowedTools: [],
    },
  },
  {
    name: "generic clarify",
    input: "Help me with this",
    expected: {
      path: "path_general",
      orchestrationTemplate: "clarify_before_route",
      mustReturnBoundaryOnly: false,
      allowedTools: [],
    },
  },
] as const;

const results = scenarios.map((scenario) => {
  const resolution = resolvePlatformResearchRequest(scenario.input);

  if (resolution.path !== scenario.expected.path) {
    throw new Error(`${scenario.name}: expected path ${scenario.expected.path}, got ${resolution.path}`);
  }

  if (resolution.orchestrationTemplate !== scenario.expected.orchestrationTemplate) {
    throw new Error(
      `${scenario.name}: expected template ${scenario.expected.orchestrationTemplate}, got ${resolution.orchestrationTemplate}`,
    );
  }

  if (resolution.toolAccess.mustReturnBoundaryOnly !== scenario.expected.mustReturnBoundaryOnly) {
    throw new Error(
      `${scenario.name}: expected mustReturnBoundaryOnly=${scenario.expected.mustReturnBoundaryOnly}, got ${resolution.toolAccess.mustReturnBoundaryOnly}`,
    );
  }

  for (const allowedTool of scenario.expected.allowedTools) {
    if (!resolution.toolAccess.allowedTools.includes(allowedTool)) {
      throw new Error(`${scenario.name}: missing allowed tool ${allowedTool}`);
    }

    if (!toolNames.has(allowedTool)) {
      throw new Error(`${scenario.name}: tool ${allowedTool} is not registered`);
    }
  }

  return {
    name: scenario.name,
    resolution,
  };
});

console.log(JSON.stringify({
  toolCount: tools.length,
  results,
}, null, 2));
