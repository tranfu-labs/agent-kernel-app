import type { PlatformVertical } from "@agentkernel/operations";

const fundingVenuePatterns = [/binance/i, /bitget/i, /bybit/i, /okx/i, /hyperliquid/i];
const fundingDomainPatterns = [/funding rate/i, /funding basis/i, /funding opportunit(?:y|ies)/i, /basis/i, /carry/i, /perp/i, /perpetual/i, /arbitrage/i, /资金费率/, /基差/, /机会/];
const predictionDomainPatterns = [/prediction market/i, /information market/i, /election market/i, /预测市场/];
const predictionContextPatterns = [/polymarket/i, /kalshi/i, /world cup/i, /世界杯/];

function matchesAny(input: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(input));
}

export interface PlatformVerticalResolution {
  vertical: PlatformVertical;
  rewrittenInput: string;
}

export function resolvePlatformVertical(input: string): PlatformVerticalResolution {
  if (matchesAny(input, fundingDomainPatterns) && matchesAny(input, fundingVenuePatterns)) {
    return {
      vertical: "funding_basis",
      rewrittenInput: input,
    };
  }

  if (matchesAny(input, predictionDomainPatterns) || matchesAny(input, predictionContextPatterns)) {
    return {
      vertical: "prediction_market",
      rewrittenInput: "inspect source prediction market research",
    };
  }

  return {
    vertical: "general",
    rewrittenInput: input,
  };
}
