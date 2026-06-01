import {
  createFundingBasisRuntimeContext,
  createFundingBasisToolDefinitions,
  resolvePlatformResearchRequest,
} from "@agentkernel/funding-basis";
import type { FetchStatus } from "@agentkernel/domain";

const context = createFundingBasisRuntimeContext();
const tools = createFundingBasisToolDefinitions(context);
const toolByName = new Map(tools.map((tool) => [tool.name, tool] as const));

const discoverRequest = resolvePlatformResearchRequest("Find Binance/Bitget funding opportunities");
if (discoverRequest.path !== "path_discover") {
  throw new Error(`Expected discover path, received ${discoverRequest.path}`);
}
if (discoverRequest.selectedOperation !== "scan_funding_basis_arbitrage") {
  throw new Error(`Expected scan_funding_basis_arbitrage, received ${discoverRequest.selectedOperation}`);
}

const discoverTool = toolByName.get("scan_funding_basis_arbitrage");
if (!discoverTool) throw new Error("scan_funding_basis_arbitrage tool is not registered");

const discoverResult = await discoverTool.execute(
  "smoke-mvp1-user-path-discover",
  {
    venues: ["binance", "bitget"],
    symbols: (process.env.FUNDING_BASIS_MVP1_USER_PATH_SYMBOLS ?? "BTCUSDT,ETHUSDT")
      .split(",")
      .map((symbol) => symbol.trim())
      .filter(Boolean),
    marketType: "linear_perp",
    estimatedFeeBps: Number(process.env.FUNDING_BASIS_SMOKE_FEE_BPS ?? "4"),
    targetNotionalUsd: Number(process.env.FUNDING_BASIS_SMOKE_NOTIONAL_USD ?? "1000"),
    saveArtifacts: true,
  },
  undefined,
  undefined,
  {} as Parameters<typeof discoverTool.execute>[4],
);

const discoverDetails = discoverResult.details as {
  status?: FetchStatus;
  opportunities?: Array<{ id: string; symbols?: string[]; venues?: string[]; netEdgeBps?: number }>;
  artifactIds?: string[];
  warnings?: string[];
};

if (!discoverDetails.status) {
  throw new Error(`Unexpected discover status: ${discoverDetails.status ?? "unknown"}`);
}

if (["failed", "timeout", "rate_limited", "geo_blocked"].includes(discoverDetails.status)) {
  throw new Error(`Live discover reached a degraded terminal state: ${discoverDetails.status}`);
}

if ((discoverDetails.opportunities?.length ?? 0) === 0) {
  if (!Array.isArray(discoverDetails.warnings) || discoverDetails.warnings.length === 0) {
    throw new Error("Empty discover result must explain why no live opportunities were produced");
  }
}

const prepRequest = resolvePlatformResearchRequest("把第一个机会整理成可执行前准备方案");
if (prepRequest.path !== "path_propose") {
  throw new Error(`Expected proposal path, received ${prepRequest.path}`);
}
if (prepRequest.requiredArtifactKind !== "opportunity_artifact") {
  throw new Error(`Expected opportunity_artifact context, received ${prepRequest.requiredArtifactKind}`);
}

const prepTool = toolByName.get("generate_funding_execution_prep");
if (!prepTool) throw new Error("generate_funding_execution_prep tool is not registered");

const firstArtifactId = discoverDetails.artifactIds?.[0];

let prepDetails:
  | {
      status?: string;
      humanPlan?: string;
      executionPrepContract?: {
        contractVersion?: string;
        strategyFamily?: string;
        confidenceFlags?: { requiresHumanConfirmation?: boolean };
      };
      riskEvaluation?: { decision?: string };
      readOnlyBoundary?: string;
    }
  | undefined;

if (firstArtifactId) {
  const prepResult = await prepTool.execute(
    "smoke-mvp1-user-path-prep",
    { artifactId: firstArtifactId },
    undefined,
    undefined,
    {} as Parameters<typeof prepTool.execute>[4],
  );

  prepDetails = prepResult.details as {
    status?: string;
    humanPlan?: string;
    executionPrepContract?: {
      contractVersion?: string;
      strategyFamily?: string;
      confidenceFlags?: { requiresHumanConfirmation?: boolean };
    };
    riskEvaluation?: { decision?: string };
    readOnlyBoundary?: string;
  };

  if (prepDetails.status !== "ok") {
    throw new Error(`Expected ok prep result, received ${prepDetails.status ?? "unknown"}`);
  }
  if (!prepDetails.humanPlan || !/manual review only|read-only/i.test(prepDetails.humanPlan)) {
    throw new Error("Prep human plan did not preserve manual-only boundary wording");
  }
  if (prepDetails.executionPrepContract?.contractVersion !== "mvp1.v1") {
    throw new Error("Prep contractVersion mismatch");
  }
  if (prepDetails.executionPrepContract?.strategyFamily !== "funding_rate_arbitrage") {
    throw new Error("Prep strategyFamily mismatch");
  }
  if (prepDetails.executionPrepContract?.confidenceFlags?.requiresHumanConfirmation !== true) {
    throw new Error("Prep output must require human confirmation");
  }
  if (!prepDetails.riskEvaluation?.decision) {
    throw new Error("Prep output missing deterministic risk evaluation");
  }
  if (!/read-only|manual execution preparation only/i.test(prepDetails.readOnlyBoundary ?? "")) {
    throw new Error("Prep output missing read-only boundary text");
  }
}

const executionRequest = resolvePlatformResearchRequest("直接帮我在 Binance 和 Bitget 下单执行这个套利");
if (!executionRequest.clarificationRequired) {
  throw new Error("Execution-shaped request should remain clarification-first");
}
if (!executionRequest.toolAccess.mustClarifyBeforeAnyTool) {
  throw new Error("Execution-shaped request should require clarification before any tool use");
}
if (!executionRequest.toolAccess.blockedTools.includes("place_order")) {
  throw new Error("Execution-shaped request must block place_order");
}
if (!executionRequest.toolAccess.blockedTools.includes("execute_trade")) {
  throw new Error("Execution-shaped request must block execute_trade");
}

console.log(JSON.stringify({
  discoverRequest: {
    path: discoverRequest.path,
    selectedOperation: discoverRequest.selectedOperation,
    allowedTools: discoverRequest.toolAccess.allowedTools,
  },
  discoverResult: {
    status: discoverDetails.status,
    opportunityCount: discoverDetails.opportunities?.length ?? 0,
    firstOpportunity: discoverDetails.opportunities?.[0] ?? null,
    artifactIds: discoverDetails.artifactIds ?? [],
    warnings: discoverDetails.warnings ?? [],
    prepValidationSkipped: !firstArtifactId,
  },
  prepRequest: {
    path: prepRequest.path,
    requiredArtifactKind: prepRequest.requiredArtifactKind,
    selectedOperation: prepRequest.selectedOperation,
  },
  prepResult: {
    status: prepDetails?.status,
    humanPlan: prepDetails?.humanPlan,
    strategyFamily: prepDetails?.executionPrepContract?.strategyFamily,
    riskDecision: prepDetails?.riskEvaluation?.decision,
  },
  executionRequest: {
    path: executionRequest.path,
    clarificationRequired: executionRequest.clarificationRequired,
    blockedTools: executionRequest.toolAccess.blockedTools,
  },
}, null, 2));
