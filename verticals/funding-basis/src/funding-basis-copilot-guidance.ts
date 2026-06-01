import {
  resolvePlatformCapability,
  type PlatformCapability,
  type PlatformIntent,
  type PlatformPath,
  type PlatformVertical,
} from "@agentkernel/operations";

export type FundingBasisCopilotIntent =
  | "cross_venue_funding_basis"
  | "funding_rate_lookup"
  | "market_context_lookup"
  | "opportunity_explanation"
  | "unsupported_or_extension_required"
  | "general";

export type FundingBasisCopilotBehavior =
  | "run_with_defaults"
  | "ask_readonly_parameters"
  | "lookup"
  | "drilldown"
  | "explain_opportunity"
  | "explain_extension_required"
  | "general";

export type FundingBasisCopilotMode = "conservative" | "balanced" | "research";

export interface FundingBasisCopilotDefaults {
  venues: ["binance", "bitget"];
  symbols: string[];
  marketType: "linear_perp";
  targetNotionalUsd: number;
  estimatedFeeBps: number;
  mode: FundingBasisCopilotMode;
  saveArtifacts: boolean;
}

export interface FundingBasisCopilotResolution {
  intent: FundingBasisCopilotIntent;
  behavior: FundingBasisCopilotBehavior;
  preferredTool?: string;
  defaultParams: FundingBasisCopilotDefaults;
  reason: string;
  platformIntent: PlatformIntent;
  vertical: PlatformVertical;
  capability: PlatformCapability;
  path: PlatformPath;
  readOnly: true;
}

export const DEFAULT_FUNDING_BASIS_COPILOT_PARAMS: FundingBasisCopilotDefaults = {
  venues: ["binance", "bitget"],
  symbols: ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
  marketType: "linear_perp",
  targetNotionalUsd: 1000,
  estimatedFeeBps: 4,
  mode: "balanced",
  saveArtifacts: true,
};

const highRiskPatterns = [
  /execute/i,
  /place/i,
  /order/i,
  /真实执行/,
  /直接执行/,
  /下单/,
  /大资金/,
  /100000|100,000|十万/,
];

const fundingBasisPatterns = [
  /binance.*bitget/i,
  /bitget.*binance/i,
  /funding basis/i,
  /funding.*arbitrage/i,
  /资金费率.*套利/,
  /套利机会/,
];

const fundingLookupPatterns = [/funding rate/i, /funding/i, /资金费率/];
const marketContextPatterns = [/market context/i, /orderbook/i, /盘口/, /价格/, /depth/i];
const reportPatterns = [/report/i, /报告/, /saved opportunity/i, /opportunity artifact/i];
const explanationPatterns = [/解释/, /why/i, /第一个机会/, /candidate/i];
const polymarketPatterns = [/polymarket/i, /世界杯/, /prediction market/i];
const aSharePatterns = [/A 股/i, /A股/i, /沪深/, /券商/];
const spotPerpPatterns = [/spot.*perp/i, /现货.*永续/, /永续.*现货/];

function matchesAny(input: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(input));
}

function buildPlatformFields(
  input: string,
  options?: {
    platformInput?: string;
    vertical?: PlatformVertical;
  },
): Pick<FundingBasisCopilotResolution, "platformIntent" | "vertical" | "capability" | "path" | "readOnly"> {
  const vertical = options?.vertical ?? "funding_basis";
  const resolution = resolvePlatformCapability({
    input: options?.platformInput ?? input,
    vertical,
  });

  return {
    platformIntent: resolution.intent,
    vertical: resolution.vertical,
    capability: resolution.capability,
    path: resolution.path,
    readOnly: resolution.readOnly,
  };
}

export function resolveFundingBasisCopilotRequest(input: string): FundingBasisCopilotResolution {
  if (matchesAny(input, polymarketPatterns)) {
    return {
      intent: "unsupported_or_extension_required",
      behavior: "explain_extension_required",
      defaultParams: DEFAULT_FUNDING_BASIS_COPILOT_PARAMS,
      reason: "MVP1 does not include Polymarket; this needs external evidence sources, PredictionMarketContext, InformationMarketComparison, and a prediction-market operation.",
      ...buildPlatformFields(input, {
        platformInput: "extension required prediction market research",
        vertical: "prediction_market",
      }),
    };
  }

  if (matchesAny(input, aSharePatterns)) {
    return {
      intent: "unsupported_or_extension_required",
      behavior: "explain_extension_required",
      defaultParams: DEFAULT_FUNDING_BASIS_COPILOT_PARAMS,
      reason: "MVP1 does not include A-share support; this needs a custom provider, EquityMarketContext, and a vertical-specific operation.",
      ...buildPlatformFields(input, {
        platformInput: "extension required unsupported vertical research",
        vertical: "funding_basis",
      }),
    };
  }

  if (matchesAny(input, spotPerpPatterns)) {
    return {
      intent: "unsupported_or_extension_required",
      behavior: "explain_extension_required",
      defaultParams: DEFAULT_FUNDING_BASIS_COPILOT_PARAMS,
      reason: "MVP1 does not include spot-perp basis scanning; this needs spot market context, perpetual market context, and a spot-perp operation.",
      ...buildPlatformFields(input, {
        platformInput: "extension required spot perp basis research",
        vertical: "funding_basis",
      }),
    };
  }

  if (matchesAny(input, reportPatterns)) {
    return {
      intent: "opportunity_explanation",
      behavior: "explain_opportunity",
      preferredTool: /artifact[_-]/i.test(input)
        ? "generate_opportunity_research_report"
        : "resolve_opportunity_artifact_reference",
      defaultParams: DEFAULT_FUNDING_BASIS_COPILOT_PARAMS,
      reason: /artifact[_-]/i.test(input)
        ? "Artifact-backed report requests should use the saved opportunity report generator first."
        : "Report requests without an explicit artifact ID should resolve the session reference to a saved artifact ID first.",
      ...buildPlatformFields(input, {
        platformInput: "report funding basis opportunity artifact",
      }),
    };
  }

  if (matchesAny(input, explanationPatterns)) {
    return {
      intent: "opportunity_explanation",
      behavior: "explain_opportunity",
      preferredTool: /artifact[_-]/i.test(input) ? "explain_opportunity_artifact" : "resolve_opportunity_artifact_reference",
      defaultParams: DEFAULT_FUNDING_BASIS_COPILOT_PARAMS,
      reason: /artifact[_-]/i.test(input)
        ? "Opportunity explanations should use saved artifact/comparison/signal lineage first."
        : "Opportunity explanations without an explicit artifact ID should resolve the session reference to a saved artifact ID first.",
      ...buildPlatformFields(input, {
        platformInput: "explain funding basis opportunity",
      }),
    };
  }

  if (matchesAny(input, fundingBasisPatterns)) {
    const highRisk = matchesAny(input, highRiskPatterns);

    return {
      intent: "cross_venue_funding_basis",
      behavior: highRisk ? "ask_readonly_parameters" : "run_with_defaults",
      preferredTool: "scan_funding_basis_arbitrage",
      defaultParams: DEFAULT_FUNDING_BASIS_COPILOT_PARAMS,
      reason: highRisk
        ? "MVP1 is read-only; execution-shaped or high-risk requests require research parameters and must not execute."
        : "Ordinary Binance/Bitget funding-basis requests should use the built-in scanner with disclosed defaults.",
      ...buildPlatformFields(input, {
        platformInput: "discover funding basis opportunity",
      }),
    };
  }

  if (matchesAny(input, marketContextPatterns)) {
    return {
      intent: "market_context_lookup",
      behavior: "drilldown",
      preferredTool: "get_market_context",
      defaultParams: DEFAULT_FUNDING_BASIS_COPILOT_PARAMS,
      reason: "Market context requests are lookup/drilldown, not opportunity creation.",
      ...buildPlatformFields(input, {
        platformInput: "inspect source funding market context",
      }),
    };
  }

  if (matchesAny(input, fundingLookupPatterns)) {
    return {
      intent: "funding_rate_lookup",
      behavior: "lookup",
      preferredTool: "get_funding_rates",
      defaultParams: DEFAULT_FUNDING_BASIS_COPILOT_PARAMS,
      reason: "Funding rate lookup requests should use low-level funding-rate tools.",
      ...buildPlatformFields(input, {
        platformInput: "inspect source funding rates",
      }),
    };
  }

  return {
    intent: "general",
    behavior: "general",
    defaultParams: DEFAULT_FUNDING_BASIS_COPILOT_PARAMS,
    reason: "No MVP1 funding-basis intent was detected.",
    ...buildPlatformFields(input),
  };
}
