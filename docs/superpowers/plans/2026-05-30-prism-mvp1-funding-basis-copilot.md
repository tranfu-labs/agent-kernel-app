# Prism MVP1 Funding-Basis Copilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Productize the existing Binance/Bitget funding-basis scanner into MVP1's Cursor-like read-only copilot workflow with intent/tool guidance, hybrid parameter behavior, opportunity cards, artifact lineage, extension-boundary checks, and final verification.

**Architecture:** Keep the deterministic funding-basis operation in `@agentkernel/operations`, keep provider-backed market context in `@agentkernel/tools`, and keep Pi Agent product guidance/tool registration in `@agentkernel/agent-kernel`. Add only lightweight guidance and presentation contracts; do not implement a complete intent router, plugin system, or execution path.

**Tech Stack:** TypeScript, Node test runner, `typebox`, npm workspaces, existing Prism packages (`@agentkernel/domain`, `@agentkernel/tools`, `@agentkernel/operations`, `@agentkernel/agent-kernel`, `@agentkernel/agent-api`).

---

## Source Design

Implement from:

```text
/Users/griffith/Projects/Prism/docs/superpowers/specs/2026-05-30-prism-mvp1-funding-basis-copilot-design.md
```

## Scope Check

This plan implements the MVP1 productization slice only:

```text
intent/tool guidance
hybrid parameter defaults and ask-first classification
opportunity cards
artifact/card smoke output
extension-boundary verification
safety and provider-boundary checks
```

It does not implement:

```text
complete intent router
complete plugin system
complete provider registry
Polymarket connector
A-share connector
spot-perp scanner
execution/account/private APIs
Web UI
```

## File Structure

Create:

```text
packages/agent-kernel/src/funding-basis-copilot-guidance.ts
packages/agent-kernel/test/funding-basis-copilot-guidance.test.ts
packages/agent-kernel/test/register-prism-tools.test.ts
packages/operations/src/funding-basis-cards.ts
packages/operations/test/funding-basis-cards.test.ts
apps/agent-api/src/smoke-funding-basis-copilot.ts
```

Modify:

```text
packages/agent-kernel/package.json
packages/agent-kernel/src/index.ts
packages/agent-kernel/src/register-prism-tools.ts
packages/operations/src/funding-basis-arbitrage.ts
packages/operations/src/index.ts
apps/agent-api/package.json
package.json
```

Responsibilities:

- `funding-basis-copilot-guidance.ts`: lightweight phrase classification, default parameters, and tool-selection guidance for MVP1. This is not a complete router.
- `funding-basis-cards.ts`: pure operation-side card shaping from already-computed opportunities/comparisons/artifact IDs.
- agent-kernel tests: verify intent guidance and tool registry descriptions/guidelines prefer the scanner and keep low-level tools as drilldown.
- operations tests: verify opportunity card behavior without provider/network dependencies.
- app smoke: verify guidance + registered tool path + card/safety behavior in one built runtime smoke.

---

### Task 1: Add lightweight MVP1 intent/tool guidance

**Files:**
- Create: `packages/agent-kernel/src/funding-basis-copilot-guidance.ts`
- Create: `packages/agent-kernel/test/funding-basis-copilot-guidance.test.ts`
- Modify: `packages/agent-kernel/package.json`
- Modify: `packages/agent-kernel/src/index.ts`

- [ ] **Step 1: Write the failing guidance test**

Create `packages/agent-kernel/test/funding-basis-copilot-guidance.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_FUNDING_BASIS_COPILOT_PARAMS,
  resolveFundingBasisCopilotRequest,
} from "../src/funding-basis-copilot-guidance.js";

test("ordinary Binance/Bitget arbitrage requests run with defaults", () => {
  const result = resolveFundingBasisCopilotRequest("帮我看看 Binance/Bitget 有没有资金费率套利机会");

  assert.equal(result.intent, "cross_venue_funding_basis");
  assert.equal(result.behavior, "run_with_defaults");
  assert.equal(result.preferredTool, "scan_funding_basis_arbitrage");
  assert.deepEqual(result.defaultParams.symbols, ["BTCUSDT", "ETHUSDT", "SOLUSDT"]);
  assert.equal(result.defaultParams.targetNotionalUsd, 1000);
  assert.equal(result.defaultParams.estimatedFeeBps, 4);
  assert.equal(result.defaultParams.mode, "balanced");
  assert.equal(result.defaultParams.saveArtifacts, true);
});

test("high-risk or execution-shaped requests ask first and stay read-only", () => {
  const result = resolveFundingBasisCopilotRequest("我准备拿 100000 USDT 直接执行 Binance Bitget 套利");

  assert.equal(result.intent, "cross_venue_funding_basis");
  assert.equal(result.behavior, "ask_readonly_parameters");
  assert.equal(result.preferredTool, "scan_funding_basis_arbitrage");
  assert.match(result.reason, /read-only/);
});

test("lookup requests use low-level tools instead of opportunity creation", () => {
  const result = resolveFundingBasisCopilotRequest("Binance BTC funding rate 是多少");

  assert.equal(result.intent, "funding_rate_lookup");
  assert.equal(result.behavior, "lookup");
  assert.equal(result.preferredTool, "get_funding_rates");
});

test("future vertical requests are extension-required instead of routed to funding scanner", () => {
  const polymarket = resolveFundingBasisCopilotRequest("我想研究 Polymarket 世界杯套利机会");
  const aShare = resolveFundingBasisCopilotRequest("我想接入 A 股自定义数据源研究机会");

  assert.equal(polymarket.intent, "unsupported_or_extension_required");
  assert.equal(polymarket.behavior, "explain_extension_required");
  assert.equal(polymarket.preferredTool, undefined);
  assert.match(polymarket.reason, /PredictionMarketContext/);

  assert.equal(aShare.intent, "unsupported_or_extension_required");
  assert.equal(aShare.behavior, "explain_extension_required");
  assert.equal(aShare.preferredTool, undefined);
  assert.match(aShare.reason, /custom provider/);
});

test("default params are stable product assumptions", () => {
  assert.deepEqual(DEFAULT_FUNDING_BASIS_COPILOT_PARAMS, {
    venues: ["binance", "bitget"],
    symbols: ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
    marketType: "linear_perp",
    targetNotionalUsd: 1000,
    estimatedFeeBps: 4,
    mode: "balanced",
    saveArtifacts: true,
  });
});
```

- [ ] **Step 2: Add the agent-kernel test script**

Modify `packages/agent-kernel/package.json` scripts to include `test`:

```json
{
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "node --import tsx --test test/**/*.test.ts"
  }
}
```

Keep the existing `build` and `typecheck` entries exactly as they are.

- [ ] **Step 3: Run the failing test**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/agent-kernel
```

Expected: FAIL because `funding-basis-copilot-guidance.ts` does not exist.

- [ ] **Step 4: Add the lightweight guidance implementation**

Create `packages/agent-kernel/src/funding-basis-copilot-guidance.ts`:

```ts
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
const explanationPatterns = [/解释/, /why/i, /第一个机会/, /candidate/i];
const polymarketPatterns = [/polymarket/i, /世界杯/, /prediction market/i];
const aSharePatterns = [/A 股/i, /A股/i, /沪深/, /券商/];
const spotPerpPatterns = [/spot.*perp/i, /现货.*永续/, /永续.*现货/];

function matchesAny(input: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(input));
}

export function resolveFundingBasisCopilotRequest(input: string): FundingBasisCopilotResolution {
  if (matchesAny(input, polymarketPatterns)) {
    return {
      intent: "unsupported_or_extension_required",
      behavior: "explain_extension_required",
      defaultParams: DEFAULT_FUNDING_BASIS_COPILOT_PARAMS,
      reason: "MVP1 does not include Polymarket; this needs external evidence sources, PredictionMarketContext, InformationMarketComparison, and a prediction-market operation.",
    };
  }

  if (matchesAny(input, aSharePatterns)) {
    return {
      intent: "unsupported_or_extension_required",
      behavior: "explain_extension_required",
      defaultParams: DEFAULT_FUNDING_BASIS_COPILOT_PARAMS,
      reason: "MVP1 does not include A-share support; this needs a custom provider, EquityMarketContext, and a vertical-specific operation.",
    };
  }

  if (matchesAny(input, spotPerpPatterns)) {
    return {
      intent: "unsupported_or_extension_required",
      behavior: "explain_extension_required",
      defaultParams: DEFAULT_FUNDING_BASIS_COPILOT_PARAMS,
      reason: "MVP1 does not include spot-perp basis scanning; this needs spot market context, perpetual market context, and a spot-perp operation.",
    };
  }

  if (matchesAny(input, fundingBasisPatterns)) {
    return {
      intent: "cross_venue_funding_basis",
      behavior: matchesAny(input, highRiskPatterns) ? "ask_readonly_parameters" : "run_with_defaults",
      preferredTool: "scan_funding_basis_arbitrage",
      defaultParams: DEFAULT_FUNDING_BASIS_COPILOT_PARAMS,
      reason: matchesAny(input, highRiskPatterns)
        ? "MVP1 is read-only; execution-shaped or high-risk requests require research parameters and must not execute."
        : "Ordinary Binance/Bitget funding-basis requests should use the built-in scanner with disclosed defaults.",
    };
  }

  if (matchesAny(input, explanationPatterns)) {
    return {
      intent: "opportunity_explanation",
      behavior: "explain_opportunity",
      preferredTool: "get_market_context",
      defaultParams: DEFAULT_FUNDING_BASIS_COPILOT_PARAMS,
      reason: "Opportunity explanations should use saved artifact/comparison/signal lineage first and low-level tools only for drilldown.",
    };
  }

  if (matchesAny(input, marketContextPatterns)) {
    return {
      intent: "market_context_lookup",
      behavior: "drilldown",
      preferredTool: "get_market_context",
      defaultParams: DEFAULT_FUNDING_BASIS_COPILOT_PARAMS,
      reason: "Market context requests are lookup/drilldown, not opportunity creation.",
    };
  }

  if (matchesAny(input, fundingLookupPatterns)) {
    return {
      intent: "funding_rate_lookup",
      behavior: "lookup",
      preferredTool: "get_funding_rates",
      defaultParams: DEFAULT_FUNDING_BASIS_COPILOT_PARAMS,
      reason: "Funding rate lookup requests should use low-level funding-rate tools.",
    };
  }

  return {
    intent: "general",
    behavior: "general",
    defaultParams: DEFAULT_FUNDING_BASIS_COPILOT_PARAMS,
    reason: "No MVP1 funding-basis intent was detected.",
  };
}
```

- [ ] **Step 5: Export the guidance helper**

Modify `packages/agent-kernel/src/index.ts`:

```ts
export * from "./create-prism-agent-session.js";
export * from "./funding-basis-copilot-guidance.js";
export * from "./prism-runtime-context.js";
export * from "./prism-system-prompt.js";
export * from "./register-prism-tools.js";
```

- [ ] **Step 6: Run the guidance test**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/agent-kernel
```

Expected: PASS for `funding-basis-copilot-guidance.test.ts`.

- [ ] **Step 7: Commit checkpoint**

If working in a git checkout, run:

```bash
git add packages/agent-kernel/package.json packages/agent-kernel/src/index.ts packages/agent-kernel/src/funding-basis-copilot-guidance.ts packages/agent-kernel/test/funding-basis-copilot-guidance.test.ts
git commit -m "feat: add funding basis copilot guidance"
```

If `/Users/griffith/Projects/Prism` is still not a git repository, skip the commit and record the changed files in the implementation handoff.

---

### Task 2: Strengthen Pi Agent tool guidance and registry tests

**Files:**
- Create: `packages/agent-kernel/test/register-prism-tools.test.ts`
- Modify: `packages/agent-kernel/src/register-prism-tools.ts`

- [ ] **Step 1: Write the failing tool registry test**

Create `packages/agent-kernel/test/register-prism-tools.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { createPrismRuntimeContext, createPrismToolDefinitions } from "../src/index.js";

test("scan_funding_basis_arbitrage is preferred for Binance/Bitget cross-venue discovery", () => {
  const tools = createPrismToolDefinitions(createPrismRuntimeContext());
  const scanner = tools.find((tool) => tool.name === "scan_funding_basis_arbitrage");
  const marketContext = tools.find((tool) => tool.name === "get_market_context");

  assert.ok(scanner);
  assert.match(scanner.description, /read-only/i);
  assert.match(scanner.description, /Binance\/Bitget|Binance.*Bitget/i);
  assert.match(scanner.promptSnippet ?? "", /Binance\/Bitget|Binance.*Bitget/i);
  assert.match((scanner.promptGuidelines ?? []).join(" "), /Prefer scan_funding_basis_arbitrage/i);
  assert.match((scanner.promptGuidelines ?? []).join(" "), /default.*BTCUSDT.*ETHUSDT.*SOLUSDT/i);
  assert.match((scanner.promptGuidelines ?? []).join(" "), /read-only/i);
  assert.match((scanner.promptGuidelines ?? []).join(" "), /must not execute/i);

  assert.ok(marketContext);
  assert.match((marketContext.promptGuidelines ?? []).join(" "), /drilldown/i);
  assert.match((marketContext.promptGuidelines ?? []).join(" "), /scan_funding_basis_arbitrage/i);
});

test("scan_funding_basis_arbitrage schema stays read-only", () => {
  const tools = createPrismToolDefinitions(createPrismRuntimeContext());
  const scanner = tools.find((tool) => tool.name === "scan_funding_basis_arbitrage");

  assert.ok(scanner);
  const schemaText = JSON.stringify(scanner.parameters);

  for (const forbidden of ["apiKey", "secret", "account", "balance", "position", "order", "leverage", "margin", "transfer", "withdraw"]) {
    assert.equal(schemaText.includes(forbidden), false, `schema must not include ${forbidden}`);
  }
});
```

- [ ] **Step 2: Run the failing registry test**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/agent-kernel
```

Expected: FAIL because current prompt guidelines do not mention default BTC/ETH/SOL behavior or low-level drilldown strongly enough.

- [ ] **Step 3: Update get_market_context guidance**

Modify the `getMarketContextTool` definition in `packages/agent-kernel/src/register-prism-tools.ts` so its `promptGuidelines` become:

```ts
promptGuidelines: [
  "Use scan_funding_basis_arbitrage first for Binance/Bitget cross-venue funding-basis opportunity discovery.",
  "Use get_market_context for selected-symbol explanation and drilldown after scanner output, not as the primary scanner workflow.",
  "Do not request depth for broad symbol lists; keep depth includes to selected symbols only.",
],
```

- [ ] **Step 4: Update scan_funding_basis_arbitrage guidance**

In the same file, change the scanner `promptGuidelines` to:

```ts
promptGuidelines: [
  "Prefer scan_funding_basis_arbitrage for Binance/Bitget cross-venue funding-basis opportunity discovery.",
  "For ordinary Binance/Bitget arbitrage requests without explicit symbols, use default symbols BTCUSDT, ETHUSDT, and SOLUSDT and disclose those assumptions.",
  "For execution-shaped or high-risk requests, keep the flow read-only and ask for research parameters instead of executing.",
  "Use low-level market-data tools only for lookup, explanation, or drilldown after scanner output.",
  "Do not invent market facts when the scanner reports provider warnings or missing funding data.",
  "This tool is read-only: it may produce candidate opportunities and artifacts, but it must not execute trades.",
],
```

- [ ] **Step 5: Run the registry tests**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/agent-kernel
```

Expected: PASS.

- [ ] **Step 6: Commit checkpoint**

If working in a git checkout, run:

```bash
git add packages/agent-kernel/src/register-prism-tools.ts packages/agent-kernel/test/register-prism-tools.test.ts
git commit -m "test: lock funding basis tool guidance"
```

If not in a git repository, skip the commit and record the changed files.

---

### Task 3: Add deterministic opportunity card shaping

**Files:**
- Create: `packages/operations/src/funding-basis-cards.ts`
- Create: `packages/operations/test/funding-basis-cards.test.ts`
- Modify: `packages/operations/src/index.ts`

- [ ] **Step 1: Write the failing opportunity card test**

Create `packages/operations/test/funding-basis-cards.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import type { CrossVenueComparison, Opportunity } from "@agentkernel/domain";
import { buildFundingBasisOpportunityCards } from "../src/funding-basis-cards.js";

const observedAt = "2026-05-30T00:00:00.000Z";

const comparison: CrossVenueComparison = {
  id: "cmp_ETHUSDT_binance_bitget",
  symbol: "ETHUSDT",
  marketType: "linear_perp",
  venues: ["binance", "bitget"],
  legs: [
    {
      venue: "binance",
      marketType: "linear_perp",
      symbol: "ETHUSDT",
      funding: {
        current: {
          venue: "binance",
          marketType: "linear_perp",
          symbol: "ETHUSDT",
          venueSymbol: "ETHUSDT",
          fundingRate: 0.0012,
          observedAt,
          provider: "binance-fixture",
          source: "fixture",
          status: "ok",
          warnings: [],
        },
        history: [],
        status: "ok",
        warnings: [],
      },
      status: "ok",
      warnings: [],
      fetchedAt: observedAt,
    },
    {
      venue: "bitget",
      marketType: "linear_perp",
      symbol: "ETHUSDT",
      funding: {
        current: {
          venue: "bitget",
          marketType: "linear_perp",
          symbol: "ETHUSDT",
          venueSymbol: "ETHUSDT",
          fundingRate: -0.0002,
          observedAt,
          provider: "bitget-fixture",
          source: "fixture",
          status: "ok",
          warnings: [],
        },
        history: [],
        status: "ok",
        warnings: [],
      },
      status: "ok",
      warnings: [],
      fetchedAt: observedAt,
    },
  ],
  fundingDiffBps: 14,
  estimatedFeeBps: 4,
  estimatedSlippageBps: 1.5,
  estimatedNetEdgeBps: 8.5,
  freshnessStatus: "fresh",
  status: "ok",
  warnings: [],
  fetchedAt: observedAt,
};

const opportunity: Opportunity = {
  id: "opp_ETHUSDT_binance_bitget",
  type: "funding_rate_arbitrage",
  title: "ETHUSDT Binance / Bitget funding-basis candidate",
  objects: [],
  venues: ["binance", "bitget"],
  symbols: ["ETHUSDT"],
  grossEdgeBps: 14,
  feeEstimateBps: 4,
  slippageEstimateBps: 1.5,
  netEdgeBps: 8.5,
  confidence: 0.71,
  liquidityStatus: "sufficient",
  freshnessStatus: "fresh",
  riskFlags: [],
  comparisonIds: [comparison.id],
  signalIds: ["sig_ETHUSDT_binance_bitget"],
  legs: [
    { venue: "bitget", symbol: "ETHUSDT", marketType: "linear_perp", side: "long", role: "entry" },
    { venue: "binance", symbol: "ETHUSDT", marketType: "linear_perp", side: "short", role: "hedge" },
  ],
  score: {
    totalScore: 71,
    confidence: 0.71,
    edgeScore: 68,
    liquidityScore: 85,
    freshnessScore: 100,
    fundingAlignmentScore: 100,
    venueReliabilityScore: 80,
    riskScore: 80,
    evidenceScore: 80,
    scoringVersion: "funding-basis-v1",
    scoredAt: observedAt,
    explanation: ["Estimated net edge is 8.5 bps after fees and slippage."],
  },
  lifecycleStage: "scored",
  status: "candidate",
  createdAt: observedAt,
  updatedAt: observedAt,
};

test("buildFundingBasisOpportunityCards creates product card fields with artifact IDs", () => {
  const cards = buildFundingBasisOpportunityCards({
    opportunities: [opportunity],
    comparisons: [comparison],
    artifactIds: ["artifact_opp_ETHUSDT_binance_bitget"],
    assumptions: {
      targetNotionalUsd: 1000,
      estimatedFeeBps: 4,
      mode: "balanced",
    },
  });

  assert.equal(cards.length, 1);
  assert.equal(cards[0]?.symbol, "ETHUSDT");
  assert.equal(cards[0]?.candidateLongVenue, "bitget");
  assert.equal(cards[0]?.candidateShortVenue, "binance");
  assert.equal(cards[0]?.fundingRatesByVenue.binance, 0.0012);
  assert.equal(cards[0]?.fundingRatesByVenue.bitget, -0.0002);
  assert.equal(cards[0]?.fundingDiffBps, 14);
  assert.equal(cards[0]?.estimatedNetEdgeBps, 8.5);
  assert.equal(cards[0]?.artifactId, "artifact_opp_ETHUSDT_binance_bitget");
  assert.equal(cards[0]?.assumptions.mode, "balanced");
  assert.equal(cards[0]?.nextActions.includes("Explain this opportunity with its saved artifact lineage."), true);
});

test("buildFundingBasisOpportunityCards returns an empty list when no formal opportunities exist", () => {
  const cards = buildFundingBasisOpportunityCards({
    opportunities: [],
    comparisons: [comparison],
    artifactIds: [],
    assumptions: {
      targetNotionalUsd: 1000,
      estimatedFeeBps: 4,
      mode: "balanced",
    },
  });

  assert.deepEqual(cards, []);
});
```

- [ ] **Step 2: Run the failing card test**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations
```

Expected: FAIL because `funding-basis-cards.ts` does not exist.

- [ ] **Step 3: Add the card implementation**

Create `packages/operations/src/funding-basis-cards.ts`:

```ts
import type { CrossVenueComparison, Opportunity, Venue } from "@agentkernel/domain";

export type FundingBasisCardMode = "conservative" | "balanced" | "research";

export interface FundingBasisCardAssumptions {
  targetNotionalUsd?: number;
  estimatedFeeBps: number;
  mode: FundingBasisCardMode;
}

export interface FundingBasisOpportunityCard {
  opportunityId: string;
  symbol: string;
  opportunityType: Opportunity["type"];
  venues: Venue[];
  candidateLongVenue?: Venue;
  candidateShortVenue?: Venue;
  fundingRatesByVenue: Partial<Record<Venue, number>>;
  fundingDiffBps?: number;
  basisBps?: number;
  markPriceDiffBps?: number;
  estimatedFeeBps?: number;
  estimatedSlippageBps?: number;
  estimatedNetEdgeBps?: number;
  targetNotionalUsd?: number;
  score?: number;
  confidence?: number;
  warnings: string[];
  dataFreshness: string;
  artifactId?: string;
  assumptions: FundingBasisCardAssumptions;
  nextActions: string[];
}

export interface BuildFundingBasisOpportunityCardsInput {
  opportunities: Opportunity[];
  comparisons: CrossVenueComparison[];
  artifactIds: string[];
  assumptions: FundingBasisCardAssumptions;
}

function fundingRatesByVenue(comparison: CrossVenueComparison | undefined): Partial<Record<Venue, number>> {
  const rates: Partial<Record<Venue, number>> = {};
  for (const leg of comparison?.legs ?? []) {
    const rate = leg.funding?.current?.fundingRate;
    if (rate !== undefined) rates[leg.venue] = rate;
  }
  return rates;
}

function nextActions(opportunity: Opportunity, artifactId: string | undefined): string[] {
  const actions = [
    artifactId ? "Explain this opportunity with its saved artifact lineage." : "Save an artifact before long-running follow-up analysis.",
    "Rerun with custom symbols, notional, fee assumptions, or strictness mode.",
  ];

  if ((opportunity.netEdgeBps ?? 0) <= 0) actions.push("Treat this as research-only unless net edge improves after fees and slippage.");
  if (opportunity.riskFlags.length > 0) actions.push("Inspect warnings before considering any future proposal or risk workflow.");

  return actions;
}

export function buildFundingBasisOpportunityCards(input: BuildFundingBasisOpportunityCardsInput): FundingBasisOpportunityCard[] {
  return input.opportunities.map((opportunity, index) => {
    const comparison = input.comparisons.find((item) => opportunity.comparisonIds?.includes(item.id));
    const longLeg = opportunity.legs?.find((leg) => leg.side === "long");
    const shortLeg = opportunity.legs?.find((leg) => leg.side === "short");
    const artifactId = input.artifactIds[index];

    return {
      opportunityId: opportunity.id,
      symbol: opportunity.symbols[0] ?? comparison?.symbol ?? "unknown",
      opportunityType: opportunity.type,
      venues: opportunity.venues,
      candidateLongVenue: longLeg?.venue,
      candidateShortVenue: shortLeg?.venue,
      fundingRatesByVenue: fundingRatesByVenue(comparison),
      fundingDiffBps: comparison?.fundingDiffBps,
      basisBps: comparison?.basisBps,
      markPriceDiffBps: comparison?.markPriceDiffBps,
      estimatedFeeBps: opportunity.feeEstimateBps ?? comparison?.estimatedFeeBps,
      estimatedSlippageBps: opportunity.slippageEstimateBps ?? comparison?.estimatedSlippageBps,
      estimatedNetEdgeBps: opportunity.netEdgeBps ?? comparison?.estimatedNetEdgeBps,
      targetNotionalUsd: input.assumptions.targetNotionalUsd,
      score: opportunity.score?.totalScore,
      confidence: opportunity.confidence,
      warnings: opportunity.riskFlags,
      dataFreshness: opportunity.freshnessStatus,
      artifactId,
      assumptions: input.assumptions,
      nextActions: nextActions(opportunity, artifactId),
    };
  });
}
```

- [ ] **Step 4: Export the card helper**

Modify `packages/operations/src/index.ts` to include:

```ts
export * from "./funding-basis-cards.js";
```

Keep existing exports.

- [ ] **Step 5: Run operations tests**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations
```

Expected: PASS.

- [ ] **Step 6: Commit checkpoint**

If working in a git checkout, run:

```bash
git add packages/operations/src/index.ts packages/operations/src/funding-basis-cards.ts packages/operations/test/funding-basis-cards.test.ts
git commit -m "feat: add funding basis opportunity cards"
```

If not in a git repository, skip the commit and record the changed files.

---

### Task 4: Include opportunity cards in scanner output

**Files:**
- Modify: `packages/operations/src/funding-basis-arbitrage.ts`
- Modify: `packages/operations/test/funding-basis-arbitrage.test.ts`

- [ ] **Step 1: Write the failing scanner-output test**

Append this test to `packages/operations/test/funding-basis-arbitrage.test.ts`:

```ts
test("scanFundingBasisArbitrage returns opportunity cards with disclosed assumptions", async () => {
  const result = await scanFundingBasisArbitrage({
    input: {
      venues: ["binance", "bitget"],
      symbols: ["ETHUSDT"],
      marketType: "linear_perp",
      estimatedFeeBps: 4,
      targetNotionalUsd: 1000,
      mode: "balanced",
      saveArtifacts: false,
    },
    contextProvider: {
      getMarketContext: async ({ venue }) => venue === "binance" ? context("binance", 0.0012) : context("bitget", -0.0002),
    },
    now: () => fetchedAt,
  });

  assert.equal(result.opportunities.length, 1);
  assert.equal(result.opportunityCards.length, 1);
  assert.equal(result.opportunityCards[0]?.symbol, "ETHUSDT");
  assert.equal(result.opportunityCards[0]?.assumptions.targetNotionalUsd, 1000);
  assert.equal(result.opportunityCards[0]?.assumptions.estimatedFeeBps, 4);
  assert.equal(result.opportunityCards[0]?.assumptions.mode, "balanced");
  assert.equal(result.opportunityCards[0]?.artifactId, undefined);
});
```

- [ ] **Step 2: Run the failing scanner-output test**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations
```

Expected: FAIL because `targetNotionalUsd`, `mode`, and `opportunityCards` are not yet part of `ScanFundingBasisArbitrageInput` / output.

- [ ] **Step 3: Update scanner input and output types**

Modify `packages/operations/src/funding-basis-arbitrage.ts` imports:

```ts
import type { FundingBasisCardMode, FundingBasisOpportunityCard } from "./funding-basis-cards.js";
import { buildFundingBasisOpportunityCards } from "./funding-basis-cards.js";
```

Update `ScanFundingBasisArbitrageInput`:

```ts
export interface ScanFundingBasisArbitrageInput {
  venues: [Venue, Venue];
  symbols: string[];
  marketType: MarketType;
  estimatedFeeBps: number;
  targetNotionalUsd?: number;
  mode?: FundingBasisCardMode;
  saveArtifacts?: boolean;
}
```

Update `ScanFundingBasisArbitrageOutput`:

```ts
export interface ScanFundingBasisArbitrageOutput {
  marketContexts: MarketContext[];
  comparisons: ReturnType<typeof evaluateFundingBasisContexts>["comparisons"];
  signals: ReturnType<typeof evaluateFundingBasisContexts>["signals"];
  opportunities: Opportunity[];
  opportunityCards: FundingBasisOpportunityCard[];
  artifactIds: string[];
  status: FetchStatus;
  warnings: string[];
  summary: string;
}
```

- [ ] **Step 4: Build opportunity cards before returning**

In `scanFundingBasisArbitrage`, after artifact saving and before `return`, add:

```ts
const opportunityCards = buildFundingBasisOpportunityCards({
  opportunities: evaluation.opportunities,
  comparisons: evaluation.comparisons,
  artifactIds,
  assumptions: {
    targetNotionalUsd: deps.input.targetNotionalUsd,
    estimatedFeeBps: deps.input.estimatedFeeBps,
    mode: deps.input.mode ?? "balanced",
  },
});
```

Then include `opportunityCards` in the returned object:

```ts
opportunityCards,
```

- [ ] **Step 5: Run operations tests**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations
```

Expected: PASS.

- [ ] **Step 6: Commit checkpoint**

If working in a git checkout, run:

```bash
git add packages/operations/src/funding-basis-arbitrage.ts packages/operations/test/funding-basis-arbitrage.test.ts
git commit -m "feat: return funding basis opportunity cards"
```

If not in a git repository, skip the commit and record the changed files.

---

### Task 5: Pass copilot defaults through the registered tool and smoke output

**Files:**
- Modify: `packages/agent-kernel/src/register-prism-tools.ts`
- Modify: `apps/agent-api/src/smoke-funding-basis-tool.ts`

- [ ] **Step 1: Write the failing expected behavior in the smoke**

Modify `apps/agent-api/src/smoke-funding-basis-tool.ts` result details type to include cards:

```ts
const details = result.details as {
  status?: string;
  summary?: string;
  warnings?: string[];
  opportunities?: unknown[];
  opportunityCards?: unknown[];
  artifactIds?: string[];
};
```

Update the logged JSON:

```ts
console.log(JSON.stringify({
  toolName: tool.name,
  status: details.status,
  summary: details.summary,
  opportunityCount: details.opportunities?.length ?? 0,
  opportunityCardCount: details.opportunityCards?.length ?? 0,
  artifactIds: details.artifactIds ?? [],
  warnings: details.warnings ?? [],
}, null, 2));
```

Add this assertion after the existing artifact assertion:

```ts
if ((details.opportunities?.length ?? 0) !== (details.opportunityCards?.length ?? 0)) {
  throw new Error("Tool smoke opportunityCards count did not match opportunities count");
}
```

- [ ] **Step 2: Run the failing smoke path through build**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run typecheck
```

Expected: FAIL because the tool does not pass `targetNotionalUsd` / `mode` into the operation input yet, or because operation output types are stale until Task 4 is built. If Task 4 already updated the types correctly, this may PASS; continue to Step 3 either way.

- [ ] **Step 3: Pass targetNotionalUsd and default mode into operation input**

In `packages/agent-kernel/src/register-prism-tools.ts`, update the `scanFundingBasisArbitrage` call input:

```ts
input: {
  venues: [params.venues[0], params.venues[1]],
  symbols: params.symbols,
  marketType,
  estimatedFeeBps: params.estimatedFeeBps,
  targetNotionalUsd,
  mode: "balanced",
  saveArtifacts: params.saveArtifacts,
},
```

Do not add `mode` to the tool schema yet. MVP1 reserves modes, but the first tool path should keep product controls minimal until conservative/research behavior is fully implemented.

- [ ] **Step 4: Run typecheck and tool smoke**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run typecheck
npm --prefix "/Users/griffith/Projects/Prism" run smoke:funding-basis-tool
```

Expected:

- typecheck PASS;
- smoke PASS with JSON containing `opportunityCardCount`;
- live status may be `partial` if provider data is unavailable;
- if opportunity count is zero, artifact IDs must also be empty.

- [ ] **Step 5: Commit checkpoint**

If working in a git checkout, run:

```bash
git add packages/agent-kernel/src/register-prism-tools.ts apps/agent-api/src/smoke-funding-basis-tool.ts
git commit -m "feat: expose funding basis copilot cards in tool smoke"
```

If not in a git repository, skip the commit and record the changed files.

---

### Task 6: Add MVP1 copilot smoke for intent guidance and extension boundary

**Files:**
- Create: `apps/agent-api/src/smoke-funding-basis-copilot.ts`
- Modify: `apps/agent-api/package.json`
- Modify: `package.json`

- [ ] **Step 1: Write the smoke script**

Create `apps/agent-api/src/smoke-funding-basis-copilot.ts`:

```ts
import {
  createPrismRuntimeContext,
  createPrismToolDefinitions,
  resolveFundingBasisCopilotRequest,
} from "@agentkernel/agent-kernel";

const context = createPrismRuntimeContext();
const tools = createPrismToolDefinitions(context);
const scanner = tools.find((definition) => definition.name === "scan_funding_basis_arbitrage");
const marketContext = tools.find((definition) => definition.name === "get_market_context");

if (!scanner) throw new Error("scan_funding_basis_arbitrage tool is not registered");
if (!marketContext) throw new Error("get_market_context tool is not registered");

const ordinary = resolveFundingBasisCopilotRequest("帮我看看 Binance/Bitget 有没有资金费率套利机会");
const highRisk = resolveFundingBasisCopilotRequest("我准备拿 100000 USDT 直接执行 Binance Bitget 套利");
const polymarket = resolveFundingBasisCopilotRequest("我想研究 Polymarket 世界杯套利机会");

if (ordinary.intent !== "cross_venue_funding_basis" || ordinary.preferredTool !== "scan_funding_basis_arbitrage") {
  throw new Error("Ordinary Binance/Bitget request did not prefer scan_funding_basis_arbitrage");
}

if (highRisk.behavior !== "ask_readonly_parameters") {
  throw new Error("High-risk request did not trigger read-only ask-first behavior");
}

if (polymarket.intent !== "unsupported_or_extension_required" || polymarket.preferredTool !== undefined) {
  throw new Error("Polymarket request should be extension-required in MVP1");
}

const scannerGuidance = (scanner.promptGuidelines ?? []).join(" ");
const marketContextGuidance = (marketContext.promptGuidelines ?? []).join(" ");

if (!/Prefer scan_funding_basis_arbitrage/.test(scannerGuidance)) {
  throw new Error("Scanner guidance does not prefer scan_funding_basis_arbitrage");
}

if (!/drilldown/.test(marketContextGuidance)) {
  throw new Error("Market context guidance does not describe drilldown behavior");
}

console.log(JSON.stringify({
  ordinary,
  highRisk,
  polymarket,
  scannerTool: scanner.name,
  marketContextTool: marketContext.name,
}, null, 2));
```

- [ ] **Step 2: Add app and root smoke scripts**

Modify `apps/agent-api/package.json` scripts:

```json
"smoke:funding-basis-copilot": "node dist/smoke-funding-basis-copilot.js"
```

Modify root `package.json` scripts:

```json
"smoke:funding-basis-copilot": "npm run build && npm run smoke:funding-basis-copilot -w @agentkernel/agent-api"
```

Keep existing scripts.

- [ ] **Step 3: Run the new smoke**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run smoke:funding-basis-copilot
```

Expected: PASS and print JSON showing ordinary/highRisk/polymarket resolutions.

- [ ] **Step 4: Commit checkpoint**

If working in a git checkout, run:

```bash
git add apps/agent-api/src/smoke-funding-basis-copilot.ts apps/agent-api/package.json package.json
git commit -m "test: add funding basis copilot smoke"
```

If not in a git repository, skip the commit and record the changed files.

---

### Task 7: Final evaluator verification

**Files:**
- No production files expected.

- [ ] **Step 1: Run package tests**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/agent-kernel
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/tools
```

Expected: all PASS.

- [ ] **Step 2: Run full typecheck**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run typecheck
```

Expected: PASS.

- [ ] **Step 3: Run relevant smokes**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run smoke:funding-basis-copilot
npm --prefix "/Users/griffith/Projects/Prism" run smoke:funding-basis-provider
npm --prefix "/Users/griffith/Projects/Prism" run smoke:funding-basis-tool
```

Expected:

- copilot smoke PASS;
- provider/tool smoke PASS;
- provider/tool live status may be `partial` when exchange data is unavailable;
- partial is acceptable only with explicit warnings and no fabricated opportunities/artifacts.

- [ ] **Step 4: Run no-execution safety scan**

Run:

```bash
grep -RIn --exclude='*.tsbuildinfo' --exclude-dir='dist' --exclude-dir='node_modules' "place_order\|cancel_order\|create_order\|get_positions\|get_account_balances\|apiKey\|secret\|leverage\|margin\|withdraw\|transfer" "/Users/griffith/Projects/Prism/packages" "/Users/griffith/Projects/Prism/apps" "/Users/griffith/Projects/Prism/prism-docs" "/Users/griffith/Projects/Prism/docs/superpowers"
```

Expected: no runtime implementation hits for private/account/execution capability. Documentation hits that explicitly prohibit these behaviors are acceptable.

- [ ] **Step 5: Run provider-boundary scans**

Run:

```bash
grep -RIn --include='*.ts' "@agentkernel/tools" "/Users/griffith/Projects/Prism/packages/operations/src" "/Users/griffith/Projects/Prism/packages/operations/test" || true
grep -RIn --include='*.ts' "binance-usds-futures\|bitget-usdt-futures" "/Users/griffith/Projects/Prism/packages/agent-kernel/src" "/Users/griffith/Projects/Prism/packages/agent-kernel/test" || true
```

Expected:

- first command produces no output;
- second command produces no output;
- `@agentkernel/operations` remains provider-agnostic;
- agent-kernel does not import raw provider classes.

- [ ] **Step 6: Produce final implementation handoff**

Report:

```json
{
  "implemented_tasks": [
    "funding-basis copilot guidance",
    "tool guidance registry tests",
    "opportunity cards",
    "scanner output cards",
    "copilot smoke"
  ],
  "files_changed": [],
  "tests_added_or_updated": [],
  "validations_run": [],
  "architecture_checks": {
    "operation_purity": "pass | fail",
    "provider_boundary": "pass | fail",
    "financial_fact_integrity": "pass | fail",
    "no_execution": "pass | fail",
    "artifact_lineage": "pass | fail",
    "pi_agent_tool_contract": "pass | fail",
    "network_degradation": "pass | fail"
  },
  "blockers": []
}
```

Fill `files_changed`, `tests_added_or_updated`, and `validations_run` with the actual evidence from implementation.

---

## Self-Review

Spec coverage:

- Hybrid default/ask/override behavior: Task 1, Task 6.
- Intent/tool guidance: Task 1, Task 2, Task 6.
- Opportunity cards: Task 3, Task 4, Task 5.
- Artifact output: Task 3, Task 4, Task 5, Task 7.
- Extension boundary: Task 1, Task 6, Task 7.
- Safety/no-execution: Task 2, Task 5, Task 7.
- Provider boundary: Task 5, Task 7.
- Tests/smokes: Tasks 1-7.

Placeholder scan:

- No TBD/TODO placeholders are intentionally left in this plan.
- Mode behavior is intentionally reserved in the product controls; the implementation passes `balanced` only until conservative/research behavior is separately implemented and tested.

Type consistency:

- `FundingBasisCopilotMode` and `FundingBasisCardMode` both use `"conservative" | "balanced" | "research"`.
- `targetNotionalUsd`, `estimatedFeeBps`, `mode`, and `saveArtifacts` match the approved design terms.
- `opportunityCards` is added to `ScanFundingBasisArbitrageOutput` and used by smoke code.
