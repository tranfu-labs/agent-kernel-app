import { createPrismRuntimeContext } from "@agentkernel/funding-basis";
import { createPrismToolDefinitions } from "@agentkernel/funding-basis";

const context = createPrismRuntimeContext();
const tool = createPrismToolDefinitions(context).find((definition) => definition.name === "scan_funding_basis_arbitrage");

if (!tool) {
  throw new Error("scan_funding_basis_arbitrage tool is not registered");
}

const result = await tool.execute(
  "smoke-funding-basis-tool",
  {
    venues: ["binance", "bitget"],
    symbols: (process.env.PRISM_FUNDING_BASIS_SMOKE_SYMBOLS ?? "BTCUSDT,ETHUSDT")
      .split(",")
      .map((symbol) => symbol.trim())
      .filter(Boolean),
    marketType: "linear_perp",
    estimatedFeeBps: Number(process.env.PRISM_FUNDING_BASIS_SMOKE_FEE_BPS ?? "4"),
    targetNotionalUsd: Number(process.env.PRISM_FUNDING_BASIS_SMOKE_NOTIONAL_USD ?? "1000"),
    saveArtifacts: true,
  },
  undefined,
  undefined,
  {} as Parameters<typeof tool.execute>[4],
);

const details = result.details as {
  status?: string;
  summary?: string;
  warnings?: string[];
  opportunities?: unknown[];
  opportunityCards?: unknown[];
  artifactIds?: string[];
};

console.log(JSON.stringify({
  toolName: tool.name,
  status: details.status,
  summary: details.summary,
  opportunityCount: details.opportunities?.length ?? 0,
  opportunityCardCount: details.opportunityCards?.length ?? 0,
  artifactIds: details.artifactIds ?? [],
  warnings: details.warnings ?? [],
}, null, 2));

if ((details.opportunities?.length ?? 0) === 0 && (details.artifactIds?.length ?? 0) > 0) {
  throw new Error("Tool smoke saved artifacts without opportunities");
}

if ((details.opportunities?.length ?? 0) !== (details.opportunityCards?.length ?? 0)) {
  throw new Error("Tool smoke opportunityCards count did not match opportunities count");
}
