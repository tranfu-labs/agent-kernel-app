# Artifact-Backed Opportunity Explanation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an artifactId-first, deterministic, read-only explanation flow for saved funding-basis opportunity artifacts.

**Architecture:** Keep explanation construction in `@agentkernel/operations` as a pure artifact-backed operation, keep artifact persistence in `@agentkernel/storage`, and expose the product entry point as a narrow `explain_opportunity_artifact({ artifactId })` Pi Agent tool in `@agentkernel/agent-kernel`. The tool reads a saved artifact from `ctx.artifactStore.get`, validates it, delegates deterministic explanation construction, and never fetches live market data or exposes execution/account/private API fields.

**Tech Stack:** TypeScript, Node test runner, `typebox`, npm workspaces, OpenSpec, existing Prism packages (`@agentkernel/domain`, `@agentkernel/storage`, `@agentkernel/operations`, `@agentkernel/agent-kernel`, `@agentkernel/agent-api`).

---

## Source Design

Implement from:

```text
/Users/griffith/Projects/Prism/docs/superpowers/specs/2026-05-30-artifact-backed-opportunity-explanation-design.md
```

## Scope Check

This plan implements only the MVP artifactId-first explanation slice:

```text
artifactId -> artifactStore.get(id) -> validate opportunity artifact -> explainOpportunityArtifact -> structured OpportunityExplanation
```

It does not implement:

```text
session index references such as “explain the first opportunity”
automatic latest scanner-result lookup
live Binance/Bitget refresh during explanation
full report generation
trade proposals
execution advice
private exchange APIs
account, balance, position, order, leverage, margin, transfer, or withdrawal paths
```

## Current State Notes

`ArtifactStore.get(id)` already exists in the storage contract and `MemoryArtifactStore`:

```ts
export interface ArtifactStore {
  save<TContent>(artifact: Artifact<TContent>): Promise<Artifact<TContent>>;
  get(id: string): Promise<Artifact | undefined>;
  list(): Promise<Artifact[]>;
}
```

```ts
async get(id: string): Promise<Artifact | undefined> {
  return this.artifacts.get(id);
}
```

This plan adds regression coverage for that read path and uses it from the new tool.

## File Structure

Create:

```text
openspec/changes/add-artifact-backed-opportunity-explanation/proposal.md
openspec/changes/add-artifact-backed-opportunity-explanation/design.md
openspec/changes/add-artifact-backed-opportunity-explanation/tasks.md
openspec/changes/add-artifact-backed-opportunity-explanation/critic.md
openspec/changes/add-artifact-backed-opportunity-explanation/test-matrix.md
openspec/changes/add-artifact-backed-opportunity-explanation/specs/opportunity-explanation/spec.md
packages/storage/test/memory-artifact-store.test.ts
packages/operations/src/opportunity-explanation.ts
packages/operations/test/opportunity-explanation.test.ts
apps/agent-api/src/smoke-opportunity-explanation.ts
```

Modify:

```text
packages/storage/package.json
packages/operations/src/index.ts
packages/agent-kernel/src/register-prism-tools.ts
packages/agent-kernel/test/register-prism-tools.test.ts
apps/agent-api/package.json
package.json
```

Responsibilities:

- OpenSpec files: capture the requirement delta, design, test matrix, and critic/rebuttal before implementation.
- `memory-artifact-store.test.ts`: lock in saved artifact read behavior used by the tool.
- `opportunity-explanation.ts`: pure deterministic explanation builder and output contract.
- `opportunity-explanation.test.ts`: offline tests for ok, not found, unsupported artifact type, invalid content, partial lineage, and safety boundary.
- `register-prism-tools.ts`: add `explain_opportunity_artifact` with schema containing only `artifactId`.
- `register-prism-tools.test.ts`: verify tool registration, schema, guidance, and no forbidden execution/private fields.
- `smoke-opportunity-explanation.ts`: save a fixture artifact in runtime context, invoke the registered tool, and assert structured explanation output.

---

### Task 1: Create OpenSpec change

**Files:**
- Create: `openspec/changes/add-artifact-backed-opportunity-explanation/proposal.md`
- Create: `openspec/changes/add-artifact-backed-opportunity-explanation/design.md`
- Create: `openspec/changes/add-artifact-backed-opportunity-explanation/tasks.md`
- Create: `openspec/changes/add-artifact-backed-opportunity-explanation/critic.md`
- Create: `openspec/changes/add-artifact-backed-opportunity-explanation/test-matrix.md`
- Create: `openspec/changes/add-artifact-backed-opportunity-explanation/specs/opportunity-explanation/spec.md`

- [ ] **Step 1: Create `proposal.md`**

Create `openspec/changes/add-artifact-backed-opportunity-explanation/proposal.md`:

```markdown
# Proposal: Artifact-Backed Opportunity Explanation

## Summary

Add a read-only `explain_opportunity_artifact` tool that explains saved opportunity artifacts by artifact ID using saved lineage and structured opportunity facts.

## Motivation

The funding-basis scanner now produces opportunity cards and saved artifact IDs. Users need a safe follow-up path to ask why a saved opportunity is interesting, what risks are visible, and what evidence lineage supports the answer without re-fetching live market data or drifting into execution advice.

## Scope

- Add deterministic `explainOpportunityArtifact` operation in `@agentkernel/operations`.
- Use `ArtifactStore.get(id)` from the Pi Agent runtime context.
- Register `explain_opportunity_artifact` with input schema `{ artifactId }` only.
- Preserve artifact lineage, warnings, score explanation, key metrics, legs, and read-only boundary.
- Add deterministic package tests and an app smoke.

## Non-Goals

- No session-index references such as “explain the first opportunity”.
- No automatic latest scanner-result lookup.
- No live market refresh by default.
- No full report builder.
- No trade proposal, financial advice, execution instruction, account state, private exchange API, order, leverage, margin, transfer, or withdrawal path.

## Success Criteria

- Saved opportunity artifacts can be explained by artifact ID.
- Missing, unsupported, and invalid artifacts return structured statuses.
- Explanation is deterministic and testable offline.
- Warnings and partial lineage gaps are visible.
- Tool schema contains only `artifactId`.
- Safety scan finds no new execution/account/private API implementation.
```

- [ ] **Step 2: Create `design.md`**

Create `openspec/changes/add-artifact-backed-opportunity-explanation/design.md`:

```markdown
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
```

- [ ] **Step 3: Create `tasks.md`**

Create `openspec/changes/add-artifact-backed-opportunity-explanation/tasks.md`:

```markdown
# Tasks

## OpenSpec / Harness Gate

- [x] Classify task as Level 3 architecture-sensitive work.
- [x] Compare alternatives in the approved design spec.
- [x] Select artifactId-first deterministic explanation.
- [x] Write proposal.
- [x] Write design.
- [x] Write critic review.
- [x] Write test matrix.

## Implementation

- [ ] Add storage regression test for `MemoryArtifactStore.get`.
- [ ] Add `OpportunityExplanation` and `explainOpportunityArtifact` in `@agentkernel/operations`.
- [ ] Export the operation from `packages/operations/src/index.ts`.
- [ ] Register `explain_opportunity_artifact` in `createPrismToolDefinitions`.
- [ ] Keep tool schema limited to `artifactId`.
- [ ] Add prompt guidance requiring artifact-backed explanation and read-only boundary.
- [ ] Add app smoke that saves a fixture artifact and explains it through the registered tool.

## Verification

- [ ] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/storage`.
- [ ] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations`.
- [ ] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/agent-kernel`.
- [ ] Run `npm --prefix "/Users/griffith/Projects/Prism" run typecheck`.
- [ ] Run `npm --prefix "/Users/griffith/Projects/Prism" run smoke:opportunity-explanation`.
- [ ] Run no-execution safety scan excluding `dist`, `node_modules`, and `*.tsbuildinfo`.
- [ ] Run `openspec validate "add-artifact-backed-opportunity-explanation"` from `/Users/griffith/Projects/Prism`.

## Pause Conditions

Pause and revise if:

- The explanation path needs live market data by default.
- The tool schema needs anything besides `artifactId`.
- The operation imports `@agentkernel/tools`.
- The tool introduces private credentials or account/order/execution fields.
- Missing lineage causes fabricated facts instead of explicit warnings.
```

- [ ] **Step 4: Create `critic.md`**

Create `openspec/changes/add-artifact-backed-opportunity-explanation/critic.md`:

```markdown
# Critic Review

## Finding 1: Artifact content may be too thin

Current funding-basis opportunity artifacts preserve the opportunity object and key lineage fields, but assumptions and provider fact references are not yet fully explicit in the Material envelope.

### Rebuttal / Decision

Accept. MVP explanation will use the existing `Opportunity` content shape, artifact lineage fields, markdown summary, risk flags, and score explanation. Missing assumptions or lineage are surfaced as warnings instead of being invented. Material envelope hardening remains follow-up work tracked by the prior funding-basis change.

## Finding 2: Agent might refresh live data during explanation

Live refresh could mix historical artifact facts with new market facts and make the explanation nondeterministic.

### Rebuttal / Decision

Accept. `explain_opportunity_artifact` only reads the artifact store and delegates to a pure operation. Drilldown/refresh remains a future explicit user-requested flow outside this MVP slice.

## Finding 3: Explanation might sound like execution advice

Opportunity explanations can drift into trade recommendations if the boundary is not explicit.

### Rebuttal / Decision

Accept. Every explanation includes the exact read-only boundary text and suggested follow-ups that avoid execution steps.

## Finding 4: Artifact ID first is less ergonomic than “first opportunity”

Users may prefer session-index follow-ups.

### Rebuttal / Decision

Accept. Artifact ID first is deterministic and testable for MVP. Session-index references can later map to artifact IDs without changing the explanation operation.
```

- [ ] **Step 5: Create `test-matrix.md`**

Create `openspec/changes/add-artifact-backed-opportunity-explanation/test-matrix.md`:

```markdown
# Test Matrix

## Goal

Prove `explain_opportunity_artifact` explains saved opportunity artifacts offline, preserves lineage/warnings/score facts, and stays read-only.

## Matrix

| Area | Scenario | Expected Result | Test Type |
|---|---|---|---|
| Storage | Saved artifact can be read by ID | `MemoryArtifactStore.get(id)` returns saved artifact | deterministic/unit |
| Pure operation | Valid opportunity artifact | `status = "ok"`, metrics/legs/lineage/warnings preserved | deterministic/unit |
| Missing artifact | Store miss | `status = "not_found"` and follow-up suggests rerun/provide valid ID | deterministic/unit + smoke |
| Unsupported artifact | Non-opportunity artifact | `status = "unsupported_artifact_type"` | deterministic/unit |
| Invalid content | Opportunity artifact content is not object-shaped | `status = "invalid_artifact"` | deterministic/unit |
| Partial lineage | Missing comparison/signal/evidence/market context IDs | Explanation succeeds with explicit missing-lineage warnings | deterministic/unit |
| Missing score | Opportunity has no score | Explanation succeeds and states score unavailable | deterministic/unit |
| Tool contract | Registered schema | `explain_opportunity_artifact` schema includes only `artifactId` | deterministic/unit |
| Smoke | Runtime context saved fixture | Registered tool reads artifact and returns explanation | app smoke |
| Safety | Boundary and static scan | Read-only text present; no execution/private fields introduced | deterministic + static scan |

## Required Commands

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/storage
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/agent-kernel
npm --prefix "/Users/griffith/Projects/Prism" run typecheck
npm --prefix "/Users/griffith/Projects/Prism" run smoke:opportunity-explanation
grep -RIn --exclude='*.tsbuildinfo' --exclude-dir='dist' --exclude-dir='node_modules' "place_order\|cancel_order\|get_positions\|get_account_balances\|apiKey\|secret\|leverage\|margin\|withdraw\|transfer" "/Users/griffith/Projects/Prism/packages" "/Users/griffith/Projects/Prism/apps" "/Users/griffith/Projects/Prism/prism-docs"
```

## Acceptance Rules

- Typecheck passes.
- Storage, operations, and agent-kernel deterministic tests pass.
- Smoke executes through the registered tool path.
- No live market data is fetched by default.
- Safety scan finds no new private/account/execution implementation.
```

- [ ] **Step 6: Create OpenSpec delta**

Create `openspec/changes/add-artifact-backed-opportunity-explanation/specs/opportunity-explanation/spec.md`:

```markdown
# opportunity-explanation Specification Delta

## ADDED Requirements

### Requirement: Opportunity artifacts are explainable by artifact ID

Prism SHALL provide a read-only artifact-backed explanation flow for saved opportunity artifacts using an explicit artifact ID.

#### Scenario: Valid opportunity artifact is explained

- **WHEN** a user provides an artifact ID for a saved opportunity artifact
- **THEN** Prism calls `explain_opportunity_artifact` with that artifact ID
- **AND** reads the saved artifact from the runtime artifact store
- **AND** returns a structured explanation with opportunity metrics, legs, warnings, score explanation, lineage, assumptions, suggested follow-ups, and the read-only boundary

#### Scenario: Missing artifact returns structured miss

- **WHEN** the artifact store has no artifact for the requested ID
- **THEN** the result status is `not_found`
- **AND** Prism suggests rerunning the scanner or providing a valid artifact ID

#### Scenario: Unsupported artifact type is rejected

- **WHEN** the artifact exists but its type is not `opportunity`
- **THEN** the result status is `unsupported_artifact_type`
- **AND** Prism does not attempt to reinterpret the artifact as an opportunity

#### Scenario: Invalid opportunity content is rejected

- **WHEN** the artifact type is `opportunity` but `contentJson` does not contain usable opportunity content
- **THEN** the result status is `invalid_artifact`
- **AND** Prism does not fabricate missing opportunity facts

### Requirement: Opportunity explanation is artifact-backed and deterministic

Prism SHALL build MVP opportunity explanations from saved artifact fields and shall not refresh live market data by default.

#### Scenario: Partial lineage is visible

- **WHEN** an opportunity artifact lacks comparison, signal, evidence, or market-context lineage IDs
- **THEN** Prism still returns an explanation if the opportunity content is usable
- **AND** the warnings explicitly name the missing lineage categories

#### Scenario: Score is unavailable

- **WHEN** a usable opportunity artifact lacks a score
- **THEN** Prism returns an explanation
- **AND** the explanation states that the score is unavailable instead of inventing one

#### Scenario: Explanation stays read-only

- **WHEN** Prism returns an opportunity explanation
- **THEN** the explanation includes `This is a read-only research explanation. It is not financial advice, a trade recommendation, or an execution instruction.`
- **AND** the tool schema includes only `artifactId`
- **AND** Prism does not expose account, order, credential, leverage, margin, transfer, withdrawal, or execution fields
```

- [ ] **Step 7: Validate OpenSpec change**

Run from `/Users/griffith/Projects/Prism`:

```bash
openspec validate "add-artifact-backed-opportunity-explanation"
```

Expected: PASS.

---

### Task 2: Add storage read-path regression coverage

**Files:**
- Create: `packages/storage/test/memory-artifact-store.test.ts`
- Modify: `packages/storage/package.json`

- [ ] **Step 1: Add storage test script**

Modify `packages/storage/package.json` scripts to include `test`:

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

- [ ] **Step 2: Write storage regression test**

Create `packages/storage/test/memory-artifact-store.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import type { Artifact } from "@agentkernel/domain";
import { MemoryArtifactStore } from "../src/memory-artifact-store.js";

test("MemoryArtifactStore reads saved artifacts by ID", async () => {
  const store = new MemoryArtifactStore();
  const artifact: Artifact<{ value: string }> = {
    id: "artifact_opp_ETHUSDT_binance_bitget",
    type: "opportunity",
    title: "ETHUSDT funding basis",
    objectIds: [],
    contentJson: { value: "fixture" },
    createdAt: "2026-05-30T00:00:00.000Z",
    updatedAt: "2026-05-30T00:00:00.000Z",
  };

  await store.save(artifact);

  assert.deepEqual(await store.get(artifact.id), artifact);
  assert.equal(await store.get("missing_artifact"), undefined);
});
```

- [ ] **Step 3: Run storage test**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/storage
```

Expected: PASS.

---

### Task 3: Add deterministic opportunity explanation operation

**Files:**
- Create: `packages/operations/src/opportunity-explanation.ts`
- Create: `packages/operations/test/opportunity-explanation.test.ts`
- Modify: `packages/operations/src/index.ts`

- [ ] **Step 1: Write failing operation tests**

Create `packages/operations/test/opportunity-explanation.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import type { Artifact, Opportunity } from "@agentkernel/domain";
import { explainOpportunityArtifact, READ_ONLY_OPPORTUNITY_EXPLANATION_BOUNDARY } from "../src/opportunity-explanation.js";

const createdAt = "2026-05-30T00:00:00.000Z";

function opportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: "opp_ETHUSDT_binance_bitget",
    type: "cross_exchange_basis",
    title: "ETHUSDT funding basis candidate",
    objects: [],
    venues: ["binance", "bitget"],
    symbols: ["ETHUSDT"],
    grossEdgeBps: 14,
    feeEstimateBps: 4,
    slippageEstimateBps: 2,
    netEdgeBps: 8,
    confidence: 0.78,
    liquidityStatus: "sufficient",
    freshnessStatus: "fresh",
    riskFlags: ["Funding rates can change before settlement."],
    evidenceBundleId: "evidence_ETHUSDT",
    comparisonIds: ["comparison_ETHUSDT"],
    signalIds: ["signal_ETHUSDT"],
    legs: [
      {
        venue: "binance",
        symbol: "ETHUSDT",
        marketType: "linear_perp",
        side: "short",
        role: "entry",
        fundingRate: 0.0012,
      },
      {
        venue: "bitget",
        symbol: "ETHUSDT",
        marketType: "linear_perp",
        side: "long",
        role: "hedge",
        fundingRate: -0.0002,
      },
    ],
    score: {
      totalScore: 74,
      confidence: 0.78,
      edgeScore: 80,
      liquidityScore: 70,
      freshnessScore: 90,
      fundingAlignmentScore: 85,
      venueReliabilityScore: 75,
      riskScore: 62,
      evidenceScore: 68,
      scoringVersion: "funding-basis-v1",
      scoredAt: createdAt,
      explanation: ["Positive net edge after estimated fees and slippage.", "Funding rates point in opposite directions across venues."],
    },
    status: "candidate",
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function artifact(overrides: Partial<Artifact<Opportunity>> = {}): Artifact<Opportunity> {
  const contentJson = overrides.contentJson ?? opportunity();
  return {
    id: "artifact_opp_ETHUSDT_binance_bitget",
    type: "opportunity",
    title: "ETHUSDT funding basis candidate",
    objectIds: [],
    opportunityIds: ["opp_ETHUSDT_binance_bitget"],
    evidenceBundleIds: ["evidence_ETHUSDT"],
    marketContextIds: ["market_context_binance_ETHUSDT", "market_context_bitget_ETHUSDT"],
    comparisonIds: ["comparison_ETHUSDT"],
    signalIds: ["signal_ETHUSDT"],
    createdBy: "operation",
    contentMarkdown: "# ETHUSDT funding basis candidate\n\nSaved scanner summary.",
    contentJson,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

test("explainOpportunityArtifact builds deterministic explanation from a saved opportunity artifact", () => {
  const result = explainOpportunityArtifact(artifact());

  assert.equal(result.status, "ok");
  assert.equal(result.artifactId, "artifact_opp_ETHUSDT_binance_bitget");
  assert.equal(result.opportunityId, "opp_ETHUSDT_binance_bitget");
  assert.equal(result.title, "ETHUSDT funding basis candidate");
  assert.equal(result.keyMetrics.grossEdgeBps, 14);
  assert.equal(result.keyMetrics.feeEstimateBps, 4);
  assert.equal(result.keyMetrics.slippageEstimateBps, 2);
  assert.equal(result.keyMetrics.netEdgeBps, 8);
  assert.equal(result.keyMetrics.confidence, 0.78);
  assert.equal(result.keyMetrics.score, 74);
  assert.equal(result.legs.length, 2);
  assert.deepEqual(result.scoreExplanation, [
    "Positive net edge after estimated fees and slippage.",
    "Funding rates point in opposite directions across venues.",
  ]);
  assert.deepEqual(result.lineage.comparisonIds, ["comparison_ETHUSDT"]);
  assert.deepEqual(result.lineage.signalIds, ["signal_ETHUSDT"]);
  assert.match(result.whyInteresting.join(" "), /8 bps/);
  assert.equal(result.readOnlyBoundary, READ_ONLY_OPPORTUNITY_EXPLANATION_BOUNDARY);
});

test("explainOpportunityArtifact returns unsupported_artifact_type for non-opportunity artifacts", () => {
  const result = explainOpportunityArtifact({ ...artifact(), type: "research_brief" });

  assert.equal(result.status, "unsupported_artifact_type");
  assert.equal(result.artifactId, "artifact_opp_ETHUSDT_binance_bitget");
  assert.match(result.warnings.join(" "), /unsupported artifact type/i);
});

test("explainOpportunityArtifact returns invalid_artifact for unusable opportunity content", () => {
  const result = explainOpportunityArtifact({ ...artifact(), contentJson: null });

  assert.equal(result.status, "invalid_artifact");
  assert.match(result.warnings.join(" "), /usable opportunity content/i);
});

test("explainOpportunityArtifact surfaces missing lineage and missing score without fabricating facts", () => {
  const result = explainOpportunityArtifact(artifact({
    marketContextIds: [],
    evidenceBundleIds: [],
    comparisonIds: [],
    signalIds: [],
    contentJson: opportunity({ score: undefined, comparisonIds: [], signalIds: [] }),
  }));

  assert.equal(result.status, "ok");
  assert.equal(result.keyMetrics.score, undefined);
  assert.match(result.warnings.join(" "), /Missing marketContext lineage/);
  assert.match(result.warnings.join(" "), /Missing evidenceBundle lineage/);
  assert.match(result.warnings.join(" "), /Missing comparison lineage/);
  assert.match(result.warnings.join(" "), /Missing signal lineage/);
  assert.match(result.scoreExplanation.join(" "), /Score unavailable/);
});
```

- [ ] **Step 2: Run operation test to verify failure**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations
```

Expected: FAIL with module-not-found for `opportunity-explanation.js`.

- [ ] **Step 3: Implement `opportunity-explanation.ts`**

Create `packages/operations/src/opportunity-explanation.ts`:

```ts
import type { Artifact, ArtifactCreatedBy, Opportunity } from "@agentkernel/domain";

export const READ_ONLY_OPPORTUNITY_EXPLANATION_BOUNDARY = "This is a read-only research explanation. It is not financial advice, a trade recommendation, or an execution instruction.";

export type OpportunityExplanationStatus = "ok" | "not_found" | "unsupported_artifact_type" | "invalid_artifact";

export interface OpportunityExplanation {
  artifactId: string;
  status: OpportunityExplanationStatus;
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
    createdBy?: ArtifactCreatedBy;
  };
  assumptions: string[];
  readOnlyBoundary: string;
  suggestedFollowUps: string[];
}

export function explainMissingOpportunityArtifact(artifactId: string): OpportunityExplanation {
  return emptyExplanation(artifactId, "not_found", [
    `Artifact ${artifactId} was not found. Rerun the scanner or provide a valid opportunity artifact ID.`,
  ], [
    "Rerun scan_funding_basis_arbitrage with artifact saving enabled.",
    "Provide a valid saved opportunity artifact ID.",
  ]);
}

export function explainOpportunityArtifact(artifact: Artifact): OpportunityExplanation {
  if (artifact.type !== "opportunity") {
    return emptyExplanation(artifact.id, "unsupported_artifact_type", [
      `Artifact ${artifact.id} has unsupported artifact type ${artifact.type}; expected opportunity.`,
    ]);
  }

  if (!isOpportunityLike(artifact.contentJson)) {
    return emptyExplanation(artifact.id, "invalid_artifact", [
      `Artifact ${artifact.id} does not contain usable opportunity contentJson.`,
    ]);
  }

  const opportunity = artifact.contentJson;
  const lineage = {
    opportunityIds: artifact.opportunityIds ?? [opportunity.id],
    marketContextIds: artifact.marketContextIds ?? [],
    evidenceBundleIds: artifact.evidenceBundleIds ?? (opportunity.evidenceBundleId ? [opportunity.evidenceBundleId] : []),
    comparisonIds: artifact.comparisonIds ?? opportunity.comparisonIds ?? [],
    signalIds: artifact.signalIds ?? opportunity.signalIds ?? [],
    createdBy: artifact.createdBy,
  };

  const warnings = [...opportunity.riskFlags, ...missingLineageWarnings(lineage)];

  if (!opportunity.score) warnings.push("Score unavailable in saved opportunity artifact.");

  return {
    artifactId: artifact.id,
    status: "ok",
    opportunityId: opportunity.id,
    title: opportunity.title || artifact.title,
    summary: artifact.contentMarkdown,
    whyInteresting: buildWhyInteresting(opportunity),
    keyMetrics: {
      grossEdgeBps: opportunity.grossEdgeBps,
      feeEstimateBps: opportunity.feeEstimateBps,
      slippageEstimateBps: opportunity.slippageEstimateBps,
      netEdgeBps: opportunity.netEdgeBps,
      confidence: opportunity.confidence,
      score: opportunity.score?.totalScore,
    },
    legs: (opportunity.legs ?? []).map((leg) => ({
      venue: leg.venue,
      symbol: leg.symbol,
      side: leg.side,
      role: leg.role,
      fundingRate: leg.fundingRate,
    })),
    scoreExplanation: opportunity.score?.explanation ?? ["Score unavailable in saved opportunity artifact."],
    warnings,
    lineage,
    assumptions: buildAssumptions(opportunity),
    readOnlyBoundary: READ_ONLY_OPPORTUNITY_EXPLANATION_BOUNDARY,
    suggestedFollowUps: [
      "Ask for a live market refresh if you want current funding, depth, or freshness checked separately.",
      "Compare this saved explanation with another saved opportunity artifact ID.",
      "Ask for a research summary that keeps the same read-only boundary.",
    ],
  };
}

function emptyExplanation(
  artifactId: string,
  status: OpportunityExplanationStatus,
  warnings: string[],
  suggestedFollowUps = ["Provide a saved opportunity artifact ID produced by scan_funding_basis_arbitrage."],
): OpportunityExplanation {
  return {
    artifactId,
    status,
    whyInteresting: [],
    keyMetrics: {},
    legs: [],
    scoreExplanation: [],
    warnings,
    lineage: {
      opportunityIds: [],
      marketContextIds: [],
      evidenceBundleIds: [],
      comparisonIds: [],
      signalIds: [],
    },
    assumptions: [],
    readOnlyBoundary: READ_ONLY_OPPORTUNITY_EXPLANATION_BOUNDARY,
    suggestedFollowUps,
  };
}

function isOpportunityLike(value: unknown): value is Opportunity {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Opportunity>;
  return typeof candidate.id === "string"
    && typeof candidate.title === "string"
    && Array.isArray(candidate.venues)
    && Array.isArray(candidate.symbols)
    && typeof candidate.confidence === "number"
    && Array.isArray(candidate.riskFlags);
}

function buildWhyInteresting(opportunity: Opportunity): string[] {
  const reasons: string[] = [];

  if (opportunity.netEdgeBps !== undefined) reasons.push(`Saved opportunity has estimated net edge of ${opportunity.netEdgeBps} bps after available fee/slippage assumptions.`);
  if (opportunity.grossEdgeBps !== undefined) reasons.push(`Gross edge is ${opportunity.grossEdgeBps} bps before available cost estimates.`);
  if (opportunity.score?.totalScore !== undefined) reasons.push(`Saved score is ${opportunity.score.totalScore} with confidence ${opportunity.score.confidence}.`);
  if (opportunity.venues.length > 0 && opportunity.symbols.length > 0) reasons.push(`It compares ${opportunity.symbols.join(", ")} across ${opportunity.venues.join(" / ")}.`);

  return reasons.length > 0 ? reasons : ["Saved artifact contains a candidate opportunity, but key edge metrics were unavailable."];
}

function buildAssumptions(opportunity: Opportunity): string[] {
  const assumptions: string[] = [];

  if (opportunity.feeEstimateBps !== undefined) assumptions.push(`Fee estimate preserved from artifact: ${opportunity.feeEstimateBps} bps.`);
  if (opportunity.slippageEstimateBps !== undefined) assumptions.push(`Slippage estimate preserved from artifact: ${opportunity.slippageEstimateBps} bps.`);
  assumptions.push(`Liquidity status preserved from artifact: ${opportunity.liquidityStatus}.`);
  assumptions.push(`Freshness status preserved from artifact: ${opportunity.freshnessStatus}.`);

  return assumptions;
}

function missingLineageWarnings(lineage: OpportunityExplanation["lineage"]): string[] {
  const warnings: string[] = [];

  if (lineage.marketContextIds.length === 0) warnings.push("Missing marketContext lineage IDs in saved artifact.");
  if (lineage.evidenceBundleIds.length === 0) warnings.push("Missing evidenceBundle lineage IDs in saved artifact.");
  if (lineage.comparisonIds.length === 0) warnings.push("Missing comparison lineage IDs in saved artifact.");
  if (lineage.signalIds.length === 0) warnings.push("Missing signal lineage IDs in saved artifact.");

  return warnings;
}
```

- [ ] **Step 4: Export operation**

Modify `packages/operations/src/index.ts`:

```ts
export * from "./funding-basis-arbitrage.js";
export * from "./funding-basis-cards.js";
export * from "./funding-basis-core.js";
export * from "./funding-opportunity-scan.js";
export * from "./operation.js";
export * from "./operation-result.js";
export * from "./opportunity-explanation.js";
```

- [ ] **Step 5: Run operation tests**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations
```

Expected: PASS.

---

### Task 4: Register `explain_opportunity_artifact` tool

**Files:**
- Modify: `packages/agent-kernel/src/register-prism-tools.ts`
- Modify: `packages/agent-kernel/test/register-prism-tools.test.ts`

- [ ] **Step 1: Add failing tool registration tests**

Append to `packages/agent-kernel/test/register-prism-tools.test.ts`:

```ts
test("explain_opportunity_artifact is registered as an artifact-backed read-only explanation tool", () => {
  const tools = createPrismToolDefinitions(createPrismRuntimeContext());
  const explanation = tools.find((tool) => tool.name === "explain_opportunity_artifact");

  assert.ok(explanation);
  assert.match(explanation.description, /artifact/i);
  assert.match(explanation.description, /read-only/i);
  assert.match(explanation.promptSnippet ?? "", /artifact/i);
  assert.match((explanation.promptGuidelines ?? []).join(" "), /Do not refresh live market data/i);
  assert.match((explanation.promptGuidelines ?? []).join(" "), /not financial advice/i);
});

test("explain_opportunity_artifact schema contains only artifactId", () => {
  const tools = createPrismToolDefinitions(createPrismRuntimeContext());
  const explanation = tools.find((tool) => tool.name === "explain_opportunity_artifact");

  assert.ok(explanation);
  const schemaText = JSON.stringify(explanation.parameters);

  assert.match(schemaText, /artifactId/);
  for (const forbidden of ["apiKey", "secret", "account", "balance", "position", "order", "leverage", "margin", "transfer", "withdraw", "symbol", "venue", "notional"])
    assert.equal(schemaText.includes(forbidden), false, `schema must not include ${forbidden}`);
});
```

- [ ] **Step 2: Run agent-kernel tests to verify failure**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/agent-kernel
```

Expected: FAIL because `explain_opportunity_artifact` is not registered.

- [ ] **Step 3: Import explanation operation**

Modify the operations import in `packages/agent-kernel/src/register-prism-tools.ts`:

```ts
import {
  explainMissingOpportunityArtifact,
  explainOpportunityArtifact,
  scanFundingBasisArbitrage,
  scanFundingOpportunities,
} from "@agentkernel/operations";
```

- [ ] **Step 4: Add tool definition before `saveOpportunityArtifactTool`**

Add this block in `createPrismToolDefinitions` before `const saveOpportunityArtifactTool = defineTool({`:

```ts
  const explainOpportunityArtifactTool = defineTool({
    name: "explain_opportunity_artifact",
    label: "Explain Opportunity Artifact",
    description: "Explain a saved opportunity artifact by artifact ID using saved lineage and structured opportunity facts. This is read-only and does not refresh live market data.",
    promptSnippet: "Use explain_opportunity_artifact when the user provides a saved opportunity artifact ID and asks why it is interesting or what risks are visible.",
    promptGuidelines: [
      "Require an artifact ID; if the user refers to a session index like first opportunity, ask for the artifact ID or suggest rerunning the scanner.",
      "Use saved artifact lineage and opportunity facts before any live market drilldown.",
      "Do not refresh live market data by default from this tool.",
      "Preserve warnings, score explanation, and missing-lineage warnings visibly.",
      "This is not financial advice, a trade recommendation, or an execution instruction.",
    ],
    parameters: Type.Object({
      artifactId: Type.String(),
    }),
    async execute(_toolCallId, params) {
      const artifact = await ctx.artifactStore.get(params.artifactId);
      const explanation = artifact
        ? explainOpportunityArtifact(artifact)
        : explainMissingOpportunityArtifact(params.artifactId);
      return jsonToolResult(explanation);
    },
  });
```

- [ ] **Step 5: Return the new tool**

Modify the return array in `packages/agent-kernel/src/register-prism-tools.ts` to include `explainOpportunityArtifactTool` before `saveOpportunityArtifactTool`:

```ts
  return [
    getExchangeMarketsTool,
    getFundingRatesTool,
    getExchangeTickersTool,
    getMarketContextTool,
    getOrderbookDepthTool,
    scanFundingBasisArbitrageTool,
    scanFundingOpportunitiesTool,
    calculateFundingEdgeTool,
    explainOpportunityArtifactTool,
    saveOpportunityArtifactTool,
  ];
```

- [ ] **Step 6: Run agent-kernel tests**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/agent-kernel
```

Expected: PASS.

---

### Task 5: Add runtime smoke for registered explanation tool

**Files:**
- Create: `apps/agent-api/src/smoke-opportunity-explanation.ts`
- Modify: `apps/agent-api/package.json`
- Modify: `package.json`

- [ ] **Step 1: Create smoke script**

Create `apps/agent-api/src/smoke-opportunity-explanation.ts`:

```ts
import type { Artifact, Opportunity } from "@agentkernel/domain";
import { createPrismRuntimeContext, createPrismToolDefinitions } from "@agentkernel/agent-kernel";

const createdAt = "2026-05-30T00:00:00.000Z";
const context = createPrismRuntimeContext();
const tools = createPrismToolDefinitions(context);
const explanationTool = tools.find((definition) => definition.name === "explain_opportunity_artifact");

if (!explanationTool) throw new Error("explain_opportunity_artifact tool is not registered");

const opportunity: Opportunity = {
  id: "opp_ETHUSDT_binance_bitget",
  type: "cross_exchange_basis",
  title: "ETHUSDT funding basis candidate",
  objects: [],
  venues: ["binance", "bitget"],
  symbols: ["ETHUSDT"],
  grossEdgeBps: 14,
  feeEstimateBps: 4,
  slippageEstimateBps: 2,
  netEdgeBps: 8,
  confidence: 0.78,
  liquidityStatus: "sufficient",
  freshnessStatus: "fresh",
  riskFlags: ["Funding rates can change before settlement."],
  evidenceBundleId: "evidence_ETHUSDT",
  comparisonIds: ["comparison_ETHUSDT"],
  signalIds: ["signal_ETHUSDT"],
  legs: [
    { venue: "binance", symbol: "ETHUSDT", marketType: "linear_perp", side: "short", role: "entry", fundingRate: 0.0012 },
    { venue: "bitget", symbol: "ETHUSDT", marketType: "linear_perp", side: "long", role: "hedge", fundingRate: -0.0002 },
  ],
  score: {
    totalScore: 74,
    confidence: 0.78,
    edgeScore: 80,
    liquidityScore: 70,
    freshnessScore: 90,
    fundingAlignmentScore: 85,
    venueReliabilityScore: 75,
    riskScore: 62,
    evidenceScore: 68,
    scoringVersion: "funding-basis-v1",
    scoredAt: createdAt,
    explanation: ["Positive net edge after estimated fees and slippage."],
  },
  status: "candidate",
  createdAt,
  updatedAt: createdAt,
};

const artifact: Artifact<Opportunity> = {
  id: "artifact_opp_ETHUSDT_binance_bitget",
  type: "opportunity",
  title: opportunity.title,
  objectIds: [],
  opportunityIds: [opportunity.id],
  evidenceBundleIds: ["evidence_ETHUSDT"],
  marketContextIds: ["market_context_binance_ETHUSDT", "market_context_bitget_ETHUSDT"],
  comparisonIds: ["comparison_ETHUSDT"],
  signalIds: ["signal_ETHUSDT"],
  createdBy: "operation",
  contentMarkdown: "# ETHUSDT funding basis candidate",
  contentJson: opportunity,
  createdAt,
  updatedAt: createdAt,
};

await context.artifactStore.save(artifact);

const okResult = await explanationTool.execute("smoke-ok", { artifactId: artifact.id });
const okDetails = okResult.details as { status?: string; artifactId?: string; readOnlyBoundary?: string; warnings?: string[]; keyMetrics?: { netEdgeBps?: number } };

if (okDetails.status !== "ok") throw new Error(`Expected ok explanation, got ${okDetails.status}`);
if (okDetails.artifactId !== artifact.id) throw new Error("Explanation artifactId did not match fixture artifact");
if (okDetails.keyMetrics?.netEdgeBps !== 8) throw new Error("Explanation did not preserve net edge from saved artifact");
if (!okDetails.readOnlyBoundary?.includes("read-only research explanation")) throw new Error("Explanation missing read-only boundary");
if (!okDetails.warnings?.includes("Funding rates can change before settlement.")) throw new Error("Explanation did not preserve opportunity warning");

const missingResult = await explanationTool.execute("smoke-missing", { artifactId: "missing_artifact" });
const missingDetails = missingResult.details as { status?: string };

if (missingDetails.status !== "not_found") throw new Error(`Expected not_found explanation, got ${missingDetails.status}`);

console.log(JSON.stringify({ ok: okDetails, missing: missingDetails }, null, 2));
```

- [ ] **Step 2: Add app smoke script**

Modify `apps/agent-api/package.json` scripts:

```json
{
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "dev": "tsx src/server.ts",
    "smoke:pi": "node dist/smoke.js",
    "smoke:funding": "node dist/smoke-funding.js",
    "smoke:funding-scan": "node dist/smoke-funding-scan.js",
    "smoke:binance-market-data": "node dist/smoke-binance-market-data.js",
    "smoke:funding-basis-provider": "node dist/smoke-funding-basis-provider.js",
    "smoke:funding-basis-tool": "node dist/smoke-funding-basis-tool.js",
    "smoke:funding-basis-copilot": "node dist/smoke-funding-basis-copilot.js",
    "smoke:opportunity-explanation": "node dist/smoke-opportunity-explanation.js"
  }
}
```

Keep existing scripts unchanged and add only the new script.

- [ ] **Step 3: Add root smoke script**

Modify root `package.json` scripts:

```json
{
  "scripts": {
    "build": "tsc -b tsconfig.json",
    "typecheck": "tsc -b tsconfig.json --pretty false",
    "test": "npm run test --workspaces --if-present",
    "smoke:pi": "npm run build && npm run smoke:pi -w @agentkernel/agent-api",
    "smoke:funding": "npm run build && npm run smoke:funding -w @agentkernel/agent-api",
    "smoke:funding-scan": "npm run build && npm run smoke:funding-scan -w @agentkernel/agent-api",
    "smoke:binance-market-data": "npm run build && npm run smoke:binance-market-data -w @agentkernel/agent-api",
    "smoke:funding-basis-provider": "npm run build && npm run smoke:funding-basis-provider -w @agentkernel/agent-api",
    "smoke:funding-basis-tool": "npm run build && npm run smoke:funding-basis-tool -w @agentkernel/agent-api",
    "smoke:funding-basis-copilot": "npm run build && npm run smoke:funding-basis-copilot -w @agentkernel/agent-api",
    "smoke:opportunity-explanation": "npm run build && npm run smoke:opportunity-explanation -w @agentkernel/agent-api"
  }
}
```

Keep existing scripts unchanged and add only the new script.

- [ ] **Step 4: Run smoke**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run smoke:opportunity-explanation
```

Expected: PASS and JSON output includes `ok.status = "ok"` and `missing.status = "not_found"`.

---

### Task 6: Final verification and safety review

**Files:**
- Modify: `openspec/changes/add-artifact-backed-opportunity-explanation/tasks.md`

- [ ] **Step 1: Run deterministic tests**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/storage
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/agent-kernel
```

Expected: all PASS.

- [ ] **Step 2: Run typecheck**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run typecheck
```

Expected: PASS.

- [ ] **Step 3: Run smoke**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run smoke:opportunity-explanation
```

Expected: PASS.

- [ ] **Step 4: Run OpenSpec validation**

Run from `/Users/griffith/Projects/Prism`:

```bash
openspec validate "add-artifact-backed-opportunity-explanation"
```

Expected: PASS.

- [ ] **Step 5: Run provider-boundary scan**

Run:

```bash
grep -RIn --exclude='*.tsbuildinfo' --exclude-dir='dist' --exclude-dir='node_modules' "@agentkernel/tools" "/Users/griffith/Projects/Prism/packages/operations"
```

Expected: no output. `@agentkernel/operations` must not import provider/tool code.

- [ ] **Step 6: Run no-execution safety scan**

Run:

```bash
grep -RIn --exclude='*.tsbuildinfo' --exclude-dir='dist' --exclude-dir='node_modules' "place_order\|cancel_order\|get_positions\|get_account_balances\|apiKey\|secret\|leverage\|margin\|withdraw\|transfer" "/Users/griffith/Projects/Prism/packages" "/Users/griffith/Projects/Prism/apps" "/Users/griffith/Projects/Prism/prism-docs"
```

Expected: no new implementation of private/account/execution paths. Existing design/test text may mention forbidden terms only as safety assertions.

- [ ] **Step 7: Mark OpenSpec tasks complete**

Update `openspec/changes/add-artifact-backed-opportunity-explanation/tasks.md` so completed implementation and verification items are checked:

```markdown
## Implementation

- [x] Add storage regression test for `MemoryArtifactStore.get`.
- [x] Add `OpportunityExplanation` and `explainOpportunityArtifact` in `@agentkernel/operations`.
- [x] Export the operation from `packages/operations/src/index.ts`.
- [x] Register `explain_opportunity_artifact` in `createPrismToolDefinitions`.
- [x] Keep tool schema limited to `artifactId`.
- [x] Add prompt guidance requiring artifact-backed explanation and read-only boundary.
- [x] Add app smoke that saves a fixture artifact and explains it through the registered tool.

## Verification

- [x] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/storage`.
- [x] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations`.
- [x] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/agent-kernel`.
- [x] Run `npm --prefix "/Users/griffith/Projects/Prism" run typecheck`.
- [x] Run `npm --prefix "/Users/griffith/Projects/Prism" run smoke:opportunity-explanation`.
- [x] Run no-execution safety scan excluding `dist`, `node_modules`, and `*.tsbuildinfo`.
- [x] Run `openspec validate "add-artifact-backed-opportunity-explanation"` from `/Users/griffith/Projects/Prism`.
```

- [ ] **Step 8: Final report**

Report:

```text
Implemented artifact-backed opportunity explanation.

Evidence:
- Storage test passed.
- Operations test passed.
- Agent-kernel test passed.
- Typecheck passed.
- Opportunity explanation smoke passed.
- OpenSpec validation passed.
- Provider-boundary and no-execution scans passed.

Notes:
- Explanation is artifactId-first only.
- No live market refresh is performed by default.
- Full report generation and session-index references remain out of scope.
```

Because `/Users/griffith/Projects/Prism` is currently not a git repository, do not run commit steps unless the repository has been initialized or the user explicitly asks for a commit in a git-enabled workspace.

---

## Self-Review

### Spec coverage

- Artifact ID first flow: Task 4 and Task 5.
- Storage read API: Task 2 and Task 4.
- Deterministic operation: Task 3.
- Not found / unsupported / invalid statuses: Task 3 and Task 5.
- Partial lineage warnings: Task 3.
- Read-only boundary: Task 3, Task 4, Task 5, Task 6.
- Tool schema only `artifactId`: Task 4.
- Smoke and safety scans: Task 5 and Task 6.
- OpenSpec change: Task 1.

### Placeholder scan

No `TBD`, `TODO`, `implement later`, or unspecified test steps remain. Every created/modified file has concrete content or an exact code block.

### Type consistency

The plan uses existing `Artifact`, `ArtifactCreatedBy`, and `Opportunity` domain types; exports `OpportunityExplanation`, `READ_ONLY_OPPORTUNITY_EXPLANATION_BOUNDARY`, `explainMissingOpportunityArtifact`, and `explainOpportunityArtifact`; and imports those names consistently from `@agentkernel/operations` in `register-prism-tools.ts`.
