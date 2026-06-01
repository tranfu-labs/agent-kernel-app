import { resolvePlatformCapability, type PlatformCapability, type PlatformIntent, type PlatformPath, type PlatformVertical } from "@agentkernel/operations";
import { resolvePlatformFollowup, type RequiredArtifactKind } from "./platform-followup-resolution.js";
import { resolvePlatformOrchestrationTemplate, type PlatformOrchestrationTemplate } from "./platform-orchestration-template.js";
import { getPathGuidance } from "./path-guidance.js";
import { resolvePlatformPolicyGate } from "./platform-policy-gate.js";
import { resolvePlatformToolAccess } from "./platform-tool-access.js";
import { resolvePlatformVertical } from "./platform-vertical-resolution.js";

export interface PlatformResearchRequestResolution {
  contractVersion: "mvp1.v1";
  request: {
    rawInput: string;
    normalizedInput: string;
  };
  intent: PlatformIntent;
  vertical: PlatformVertical;
  capability: PlatformCapability;
  path: PlatformPath;
  readOnly: true;
  determinismLevel: "rule_based";
  selectedOperation: string;
  orchestrationTemplate: PlatformOrchestrationTemplate;
  pathGuidance: string[];
  extensionRequired: boolean;
  clarificationRequired: boolean;
  requiresArtifactContext: boolean;
  requiredArtifactKind?: RequiredArtifactKind;
  followupNotes: string[];
  policy: {
    profile: string[];
    executionAllowed: false;
  };
  toolAccess: {
    allowedTools: string[];
    blockedTools: string[];
    allowArtifactWrites: boolean;
    mustClarifyBeforeAnyTool: boolean;
    mustReturnBoundaryOnly: boolean;
  };
  fallbackBehavior: string;
  boundaryExplanation: string;
}

const artifactPatterns = [/artifact/i, /saved opportunity/i, /candidate/i, /第一个机会/, /first one/i, /that one/i, /that report/i, /best candidate/i, /opportunity/i];
const reportPatterns = [/report/i, /报告/];
const explainPatterns = [/explain/i, /解释/, /why/i];
const comparePatterns = [/compare/i, /对比/];
const refreshPatterns = [/refresh/i, /更新/i, /刷新/];
const monitorPatterns = [/monitor/i, /watch/i, /alert/i, /跟踪/, /监控/];
const signalPatterns = [/signal/i, /变化/, /告警/];
const proposalPatterns = [/proposal/i, /建议方案/, /提案/, /执行前准备/, /准备方案/, /execution prep/i, /manual prep/i];
const riskPatterns = [/risk/i, /风险/];
const marketContextPatterns = [/market context/i, /orderbook/i, /盘口/, /价格/, /depth/i];
const fundingLookupPatterns = [/funding rate/i, /资金费率/];
const discoverPatterns = [/\bdiscover\b/i, /\bfind\b/i, /\bscan\b/i, /找/, /寻找/, /套利机会/, /机会/];
const executionPrepPatterns = [/执行前准备/, /准备方案/, /execution prep/i, /manual prep/i];
const executionPatterns = [/\bexecute\b/i, /\bplace\b/i, /\border\b/i, /下单/, /真实执行/, /直接执行/];

function matchesAny(input: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(input));
}

function resolvePlatformInput(input: string, vertical: PlatformVertical): string {
  if (vertical === "prediction_market" || vertical === "general") {
    return input;
  }
  if (matchesAny(input, riskPatterns)) {
    return "risk funding basis proposal artifact";
  }
  if (matchesAny(input, executionPrepPatterns)) {
    return "proposal funding basis opportunity artifact";
  }
  if (matchesAny(input, executionPatterns)) {
    return "discover funding basis opportunity";
  }
  if (matchesAny(input, comparePatterns)) {
    return "compare funding basis opportunity artifacts";
  }
  if (matchesAny(input, refreshPatterns)) {
    return "refresh funding basis opportunity artifact";
  }
  if (matchesAny(input, monitorPatterns)) {
    return "monitor funding basis opportunity";
  }
  if (matchesAny(input, signalPatterns)) {
    return "signal funding basis opportunity";
  }
  if (matchesAny(input, riskPatterns)) {
    return "risk funding basis proposal artifact";
  }
  if (matchesAny(input, proposalPatterns)) {
    return "proposal funding basis opportunity artifact";
  }
  if (matchesAny(input, reportPatterns)) {
    return "report funding basis opportunity artifact";
  }
  if (matchesAny(input, artifactPatterns) || matchesAny(input, explainPatterns)) {
    return "explain funding basis opportunity";
  }
  if (matchesAny(input, discoverPatterns)) {
    return "discover funding basis opportunity";
  }
  if (matchesAny(input, marketContextPatterns)) {
    return "inspect source funding market context";
  }
  if (matchesAny(input, fundingLookupPatterns)) {
    return "inspect source funding rates";
  }
  return "discover funding basis opportunity";
}

function resolveSelectedOperation(input: string, vertical: PlatformVertical, intent: PlatformIntent): string {
  if (vertical === "prediction_market") {
    return "extension_required";
  }
  if (matchesAny(input, reportPatterns)) {
    return "generate_opportunity_research_report";
  }
  if (matchesAny(input, artifactPatterns) || matchesAny(input, explainPatterns)) {
    return "resolve_opportunity_artifact_reference";
  }
  if (matchesAny(input, marketContextPatterns)) {
    return "get_market_context";
  }
  if (matchesAny(input, fundingLookupPatterns)) {
    return "get_funding_rates";
  }
  if (intent === "discover") {
    return "scan_funding_basis_arbitrage";
  }
  return "boundary_only";
}

export function resolvePlatformResearchRequest(input: string): PlatformResearchRequestResolution {
  const normalizedInput = input.trim();
  const verticalResolution = resolvePlatformVertical(normalizedInput);
  const inferredFundingContext = matchesAny(normalizedInput, reportPatterns)
    || matchesAny(normalizedInput, explainPatterns)
    || matchesAny(normalizedInput, comparePatterns)
    || matchesAny(normalizedInput, refreshPatterns)
    || matchesAny(normalizedInput, monitorPatterns)
    || matchesAny(normalizedInput, signalPatterns)
    || matchesAny(normalizedInput, proposalPatterns)
    || matchesAny(normalizedInput, riskPatterns)
    || matchesAny(normalizedInput, marketContextPatterns)
    || matchesAny(normalizedInput, fundingLookupPatterns)
    || matchesAny(normalizedInput, artifactPatterns)
    || matchesAny(normalizedInput, executionPrepPatterns)
    || matchesAny(normalizedInput, executionPatterns);
  const vertical = verticalResolution.vertical === "general" && inferredFundingContext
    ? "funding_basis"
    : verticalResolution.vertical;
  const platformInput = resolvePlatformInput(vertical === verticalResolution.vertical ? verticalResolution.rewrittenInput : normalizedInput, vertical);
  const capability = resolvePlatformCapability({
    input: platformInput,
    vertical,
  });
  const clarificationRequired = capability.vertical === "general" || (!capability.vertical.startsWith("prediction") && matchesAny(normalizedInput, executionPatterns));
  const followup = resolvePlatformFollowup({
    input: normalizedInput,
    intent: capability.intent,
    path: capability.path,
  });
  const policy = resolvePlatformPolicyGate({
    vertical: capability.vertical,
    capability: capability.capability,
    path: capability.path,
    requiresArtifactContext: followup.requiresArtifactContext,
  });
  const orchestrationTemplate = resolvePlatformOrchestrationTemplate({
    intent: capability.intent,
    path: capability.path,
    extensionRequired: policy.extensionRequired,
    clarificationRequired,
    requiresArtifactContext: followup.requiresArtifactContext,
  });
  const toolAccess = resolvePlatformToolAccess({
    vertical: capability.vertical,
    path: capability.path,
    orchestrationTemplate,
    extensionRequired: policy.extensionRequired,
    clarificationRequired,
  });

  return {
    contractVersion: "mvp1.v1",
    request: {
      rawInput: input,
      normalizedInput,
    },
    intent: capability.intent,
    vertical: capability.vertical,
    capability: capability.capability,
    path: capability.path,
    readOnly: true,
    determinismLevel: "rule_based",
    selectedOperation: resolveSelectedOperation(normalizedInput, capability.vertical, capability.intent),
    orchestrationTemplate,
    pathGuidance: getPathGuidance(orchestrationTemplate),
    extensionRequired: policy.extensionRequired,
    clarificationRequired,
    requiresArtifactContext: followup.requiresArtifactContext,
    requiredArtifactKind: followup.requiredArtifactKind,
    followupNotes: followup.notes,
    policy: {
      profile: policy.profile,
      executionAllowed: policy.executionAllowed,
    },
    toolAccess,
    fallbackBehavior: policy.extensionRequired
      ? "return_boundary_only"
      : capability.vertical === "general"
        ? "clarify_then_route"
        : clarificationRequired
          ? "ask_readonly_parameters"
          : "return_readonly_contract",
    boundaryExplanation: policy.boundaryExplanation,
  };
}
