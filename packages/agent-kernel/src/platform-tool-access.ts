import type { PlatformPath, PlatformVertical } from "@agentkernel/operations";

export interface PlatformToolAccessInput {
  vertical: PlatformVertical;
  path: PlatformPath;
  orchestrationTemplate: string;
  extensionRequired: boolean;
  clarificationRequired: boolean;
}

export interface PlatformToolAccessResult {
  allowedTools: string[];
  blockedTools: string[];
  allowArtifactWrites: boolean;
  mustClarifyBeforeAnyTool: boolean;
  mustReturnBoundaryOnly: boolean;
}

const EXECUTION_BLOCKED_TOOLS = ["place_order", "execute_trade", "write_artifact"];

function resolveFundingAllowedTools(path: PlatformPath, orchestrationTemplate: string): string[] {
  if (path === "path_discover" || orchestrationTemplate === "discover_with_artifact") {
    return ["scan_funding_basis_arbitrage"];
  }

  if (path === "path_report" || orchestrationTemplate === "report_from_artifacts") {
    return ["resolve_opportunity_artifact_reference", "generate_opportunity_research_report"];
  }

  if (path === "path_explain" || orchestrationTemplate === "explain_from_artifact") {
    return ["resolve_opportunity_artifact_reference", "explain_opportunity_artifact"];
  }

  if (path === "path_inspect_source" || orchestrationTemplate === "lookup_once") {
    return ["get_funding_rates", "get_market_context"];
  }

  return [];
}

export function resolvePlatformToolAccess(input: PlatformToolAccessInput): PlatformToolAccessResult {
  if (input.extensionRequired) {
    return {
      allowedTools: [],
      blockedTools: EXECUTION_BLOCKED_TOOLS,
      allowArtifactWrites: false,
      mustClarifyBeforeAnyTool: false,
      mustReturnBoundaryOnly: true,
    };
  }

  if (input.clarificationRequired) {
    return {
      allowedTools: [],
      blockedTools: EXECUTION_BLOCKED_TOOLS,
      allowArtifactWrites: false,
      mustClarifyBeforeAnyTool: true,
      mustReturnBoundaryOnly: false,
    };
  }

  if (input.vertical === "funding_basis") {
    return {
      allowedTools: resolveFundingAllowedTools(input.path, input.orchestrationTemplate),
      blockedTools: EXECUTION_BLOCKED_TOOLS,
      allowArtifactWrites: false,
      mustClarifyBeforeAnyTool: false,
      mustReturnBoundaryOnly: false,
    };
  }

  return {
    allowedTools: [],
    blockedTools: EXECUTION_BLOCKED_TOOLS,
    allowArtifactWrites: false,
    mustClarifyBeforeAnyTool: false,
    mustReturnBoundaryOnly: false,
  };
}
