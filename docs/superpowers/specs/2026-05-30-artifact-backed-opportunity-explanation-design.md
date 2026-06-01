# Artifact-Backed Opportunity Explanation Design

## Goal

Prism should let users explain saved funding-basis opportunity artifacts by artifact ID, using saved lineage and structured opportunity facts before any live market drilldown.

This slice closes the first MVP1 product loop:

```text
scan_funding_basis_arbitrage
  -> opportunityCards + artifactIds
  -> explain_opportunity_artifact(artifactId)
  -> evidence-backed explanation
```

The output is a research explanation, not a trade recommendation or execution instruction.

## Product Boundary

MVP supports an artifact ID first flow:

```text
User: Explain artifact_opp_ETHUSDT_binance_bitget.
Prism:
  -> reads the artifact by ID
  -> validates it is an opportunity artifact
  -> extracts opportunity, score, warnings, and lineage
  -> returns a structured explanation
```

MVP does not support:

- session index references such as “explain the first opportunity”;
- automatic lookup of the most recent scanner result;
- refreshing live Binance/Bitget data during explanation;
- full research report generation;
- trade proposals, execution advice, orders, leverage, margin, transfer, withdrawal, or account state.

If the user asks “why is this opportunity interesting?” without an artifact ID, Prism should ask for the artifact ID or suggest rerunning the scanner to produce one.

## Architecture

```text
User provides artifactId
  -> Pi Agent calls explain_opportunity_artifact
  -> tool reads artifactStore.get(artifactId)
  -> tool validates artifact type and content shape
  -> explainOpportunityArtifact builds deterministic explanation
  -> tool returns structured OpportunityExplanation
```

## Components

| Component | Layer | Responsibility |
| --- | --- | --- |
| `explainOpportunityArtifact` | `@agentkernel/operations` / Energy | Deterministically build explanation output from a saved opportunity artifact. |
| `explain_opportunity_artifact` | `@agentkernel/agent-kernel` tool | Product tool entry; reads artifact by ID and delegates explanation construction. |
| `ArtifactStore.get(id)` | `@agentkernel/storage` / Material | Retrieve saved artifacts. If storage currently lacks read API, add the smallest read method needed. |
| `OpportunityExplanation` | Domain or operation-local contract | Structured explanation result returned by the tool. |
| Smoke/tests | app + package tests | Prove artifact-first explanation works offline and preserves warnings/lineage. |

## Output Contract

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

## Explanation Rules

The explanation must be artifact-backed.

It should use, in priority order:

1. artifact lineage fields: `opportunityIds`, `marketContextIds`, `evidenceBundleIds`, `comparisonIds`, `signalIds`, `createdBy`;
2. `artifact.contentJson` opportunity fields: title, venues, symbols, legs, edge metrics, confidence, liquidity/freshness status, risk flags, score explanation;
3. artifact markdown summary as supporting display text only.

The explanation must not:

- invent missing funding rates, prices, slippage, score, or freshness;
- call low-level market tools by default;
- convert an explanation into a trade recommendation;
- produce execution steps.

Low-level market tools may be used later only for explicit user-requested drilldown or refresh, outside this MVP slice.

## Behavior

| User intent | MVP behavior |
| --- | --- |
| “Explain artifact_xxx.” | Call `explain_opportunity_artifact({ artifactId })`. |
| “Why is this opportunity interesting?” without artifact ID | Ask for artifact ID or suggest rerunning scanner. |
| “What are the risks?” | Explain from artifact warnings, risk flags, score explanation, freshness, and liquidity. |
| “Generate a report.” | Return structured explanation; defer full report builder. |
| “Can I do this directly?” | Restate read-only boundary and future Proposal/Risk/Confirmation/Audit requirement. |

## Failure Handling

| Case | Expected result |
| --- | --- |
| Artifact ID not found | `status = "not_found"`; suggest rerunning scanner or providing a valid artifact ID. |
| Artifact type is not `opportunity` | `status = "unsupported_artifact_type"`. |
| Artifact lacks usable opportunity content | `status = "invalid_artifact"`. |
| Missing comparison/signal/evidence/marketContext lineage | Return explanation if possible and add explicit missing-lineage warnings. |
| Opportunity lacks score | Return explanation and state score unavailable. |
| Opportunity contains risk flags or warnings | Preserve them visibly in `warnings`. |
| User requests execution | Return read-only boundary; do not call execution/account tools. |

## Safety Rules

MVP explanation is read-only.

It must not introduce:

- private exchange APIs;
- API keys or secrets;
- account balances;
- positions;
- open orders;
- order placement or cancellation;
- leverage or margin mutation;
- transfer or withdrawal;
- automatic trading.

The output should include:

```text
This is a read-only research explanation. It is not financial advice, a trade recommendation, or an execution instruction.
```

## Testing Requirements

| Area | Required evidence |
| --- | --- |
| Pure operation | Fixture opportunity artifact produces deterministic explanation. |
| Missing artifact | Store miss returns structured `not_found`. |
| Unsupported artifact | Non-opportunity artifact returns `unsupported_artifact_type`. |
| Invalid content | Opportunity artifact without usable `contentJson` returns `invalid_artifact`. |
| Partial lineage | Missing comparison/signal/evidence/marketContext IDs are surfaced as warnings. |
| Safety | Explanation includes read-only boundary and no execution fields. |
| Tool contract | `explain_opportunity_artifact` schema includes only `artifactId`. |
| Smoke | Runtime context saves fixture artifact, registered tool reads it, and returns explanation. |

## OpenSpec Requirement

This slice affects artifact lifecycle, Pi Agent tool contracts, operation workflow, and product behavior, so it requires a new OpenSpec change before implementation:

```text
openspec/changes/add-artifact-backed-opportunity-explanation/
  proposal.md
  design.md
  tasks.md
  critic.md
  test-matrix.md
  specs/opportunity-explanation/spec.md
```

## Design Decision

Use:

```text
Approach A: artifactId-first deterministic explanation operation.
```

Rejected for MVP:

- card index/session memory: better user experience, but needs session-state design;
- agent-only explanation: fast, but not deterministic or testable enough;
- live market refresh during explanation: useful later, but risks mixing historical artifact explanation with new facts.

## Success Criteria

This design is successful when:

- a saved opportunity artifact can be explained by artifact ID;
- explanation is deterministic and testable offline;
- warnings, score explanation, and lineage are preserved visibly;
- missing artifacts or incomplete lineage degrade explicitly;
- no live market data is fetched by default;
- no execution, account, credential, leverage, margin, transfer, or withdrawal path is introduced;
- future session-index explanation can be added later by mapping “first opportunity” to artifact ID without changing the explanation operation.
