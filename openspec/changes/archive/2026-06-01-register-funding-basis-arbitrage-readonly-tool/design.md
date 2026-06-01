# Design: Funding-Basis Arbitrage Read-Only Tool

## Task Classification

Level: 3 — architecture-sensitive.

This change affects Pi Agent tool contracts and operation workflow. It requires OpenSpec, alternatives, critic/rebuttal, a test matrix, implementation in a small slice, and evaluator-style verification.

## Architecture

```text
resolveFundingBasisCopilotRequest(user text)
  -> default/ask-first/extension-required guidance
  -> createPrismToolDefinitions(ctx)
  -> scan_funding_basis_arbitrage tool
  -> ExchangeMarketDataService.getMarketContext
  -> scanFundingBasisArbitrage({ contextProvider, artifactStore })
  -> comparisons/signals/opportunities/opportunityCards/artifactIds
  -> JSON tool result
```

Dependency direction remains:

```text
packages/agent-kernel
  -> @agentkernel/tools
  -> @agentkernel/domain

packages/agent-kernel
  -> @agentkernel/operations
  -> @agentkernel/domain
```

Disallowed:

```text
@agentkernel/operations -> @agentkernel/tools
Pi Agent -> raw Binance/Bitget provider methods
Tool input -> private credentials or execution commands
```

## Tool Contract

Name:

```text
scan_funding_basis_arbitrage
```

Input:

```ts
interface ScanFundingBasisArbitrageToolInput {
  venues: ["binance", "bitget"];
  symbols: string[];
  marketType?: "linear_perp";
  estimatedFeeBps: number;
  targetNotionalUsd?: number;
  saveArtifacts?: boolean;
}
```

Output:

```ts
interface ScanFundingBasisArbitrageToolOutput {
  marketContexts: MarketContext[];
  comparisons: CrossVenueComparison[];
  signals: Signal[];
  opportunities: Opportunity[];
  opportunityCards: FundingBasisOpportunityCard[];
  artifactIds: string[];
  status: FetchStatus;
  warnings: string[];
  summary: string;
}

interface FundingBasisOpportunityCard {
  opportunityId: string;
  symbol: string;
  opportunityType: Opportunity["type"];
  venues: Opportunity["venues"];
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
  assumptions: {
    targetNotionalUsd?: number;
    estimatedFeeBps: number;
    mode: "conservative" | "balanced" | "research";
  };
  nextActions: string[];
}
```

## Context Provider

The tool constructs a dependency-injected context provider:

```text
contextProvider.getMarketContext({ venue, marketType, symbol })
  -> ExchangeMarketDataService.getMarketContext({
       venue,
       marketType,
       symbols: [symbol],
       include: ["market", "ticker", "funding", "depth"],
       targetNotionalUsd,
       maxSymbolsForDepth: 1
     })
  -> first context or explicit missing context with status/warnings
```

This matches the provider-backed smoke path while placing it inside the registered tool.

## Artifact Store

When `saveArtifacts=true`, the tool uses `ctx.artifactStore.save` through `scanFundingBasisArbitrage`'s injected `artifactStore`.

When `saveArtifacts=false` or omitted, no artifact is saved and `artifactIds` remains empty.

Current artifacts preserve `opportunityIds`, `comparisonIds`, `signalIds`, `createdBy: operation`, markdown summary, and opportunity JSON. Follow-up work should make the Material envelope more explicit by including assumptions, provider fact references or market-context references, warnings, calculated metrics, and score explanation in artifact content rather than relying on indirect opportunity/comparison fields.

## Copilot Guidance

`packages/agent-kernel/src/funding-basis-copilot-guidance.ts` provides MVP1's lightweight guidance layer. It is not a complete router.

Default ordinary requests use:

```text
venues = Binance / Bitget
symbols = BTCUSDT, ETHUSDT, SOLUSDT
marketType = linear_perp
targetNotionalUsd = 1000
estimatedFeeBps = 4
mode = balanced
saveArtifacts = true
```

High-risk or execution-shaped requests remain read-only and ask for research parameters. Polymarket, A-share, spot-perp, and custom-data-source requests are classified as extension-required and must not be routed to `scan_funding_basis_arbitrage`.

## Prompt Guidance

The new tool should be preferred for user requests like:

```text
Find Binance/Bitget funding-basis opportunities.
Scan BTCUSDT and ETHUSDT across Binance and Bitget.
帮我找 Binance / Bitget 合约资金费率套利机会。
```

Low-level tools remain available for explanation and drilldown after the scan.

## Safety

The tool is read-only:

- no API keys;
- no account identifiers;
- no balances;
- no positions;
- no open orders;
- no order placement;
- no cancellation;
- no leverage or margin mutation;
- no transfer or withdrawal.

The tool may produce opportunity candidates and artifacts, but must not produce execution instructions or trigger execution.

## Rebuttal / Decision Log

### Critic Finding 1: Tool may duplicate older `scan_funding_opportunities`

Decision: accept and keep separate.

The older tool is single-venue/funding-opportunity oriented. The new tool is cross-venue funding-basis arbitrage and should have an explicit contract.

### Critic Finding 2: Agent-kernel may become too coupled to provider details

Decision: accept with boundary.

Agent-kernel composes high-level `ExchangeMarketDataService` and operation APIs only. It must not call raw Binance/Bitget provider methods.

### Critic Finding 3: Tool registration could introduce execution-shaped parameters

Decision: accept.

The input schema excludes account, order, leverage, margin, transfer, withdrawal, and credential fields. Safety scan and manual review must verify this.

### Critic Finding 4: Live smoke may fail due to network issues

Decision: accept.

Live smoke may return `partial`. Acceptance requires structured warnings and no fabricated opportunities/artifacts from missing funding facts.
