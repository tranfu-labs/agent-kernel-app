# Design: Artifact-Backed Opportunity Explanation

## Architecture

```text
User provides artifactId
  -> Pi Agent calls explain_opportunity_artifact
  -> tool reads ctx.artifactStore.get(artifactId)
  -> tool handles missing artifact
  -> tool validates artifact.type === "opportunity"
  -> explainOpportunityArtifact builds deterministic OpportunityExplanation
  -> tool returns JSON details
```

## Dependency Direction

```text
packages/agent-kernel -> @agentkernel/storage runtime context
packages/agent-kernel -> @agentkernel/operations
packages/operations -> @agentkernel/domain
packages/storage -> @agentkernel/domain
```

Disallowed:

```text
@agentkernel/operations -> @agentkernel/tools
explain_opportunity_artifact -> get_market_context by default
explain_opportunity_artifact schema -> account/order/leverage/margin/transfer/withdrawal/credential fields
```

## Operation Contract

```ts
interface OpportunityExplanation {
  artifactId: string;
  status: "ok" | "not_found" | "unsupported_artifact_type" | "invalid_artifact";
  opportunityId?: string;
  title?: string;
  summary?: string;
  whyInteresting: string[];
  keyMetrics: {
    grossEdgeBps?: number;
    feeEstimateBps?: number;
    slippageEstimateBps?: number;
    netEdgeBps?: number;
    confidence?: number;
    score?: number;
  };
  legs: Array<{
    venue: string;
    symbol: string;
    side: string;
    role: string;
    fundingRate?: number;
  }>;
  scoreExplanation: string[];
  warnings: string[];
  lineage: {
    opportunityIds: string[];
    marketContextIds: string[];
    evidenceBundleIds: string[];
    comparisonIds: string[];
    signalIds: string[];
    createdBy?: string;
  };
  assumptions: string[];
  readOnlyBoundary: string;
  suggestedFollowUps: string[];
}
```

## Validation Rules

- Missing artifact returns `not_found`.
- Non-`opportunity` artifact returns `unsupported_artifact_type`.
- Opportunity artifact without object-shaped usable `contentJson` returns `invalid_artifact`.
- Missing lineage arrays do not fail the explanation; they add explicit warnings.
- Missing score does not fail the explanation; it adds an explicit warning and score-unavailable text.

## Safety

The returned `readOnlyBoundary` must be exactly:

```text
This is a read-only research explanation. It is not financial advice, a trade recommendation, or an execution instruction.
```

The tool must not introduce private exchange APIs, credentials, account balances, positions, open orders, order placement/cancellation, leverage, margin, transfer, withdrawal, or automatic trading.
