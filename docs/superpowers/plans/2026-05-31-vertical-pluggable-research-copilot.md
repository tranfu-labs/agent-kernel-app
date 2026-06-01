# Vertical-Pluggable Research Copilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the approved vertical-pluggable research copilot spec into executable Prism slices that preserve MVP1 shipping speed, platformize the funding-basis path, and add the contracts needed for method exploration, monitoring, signals, proposal/risk boundaries, and a prediction-market sample vertical.

**Architecture:** Keep Prism’s product control plane inside TypeScript packages: domain contracts in `@agentkernel/domain`, deterministic orchestration and report logic in `@agentkernel/operations`, runtime tool contracts in `@agentkernel/agent-kernel`, persistence in `@agentkernel/storage`, and provider-backed facts in `@agentkernel/tools`. Implement platform contracts first, then elevate funding-basis into the first canonical vertical plugin, then add compare/refresh/monitor/signal/proposal/risk slices without crossing into execution.

**Tech Stack:** TypeScript, Node test runner, npm workspaces, `typebox`, existing Prism packages (`@agentkernel/domain`, `@agentkernel/tools`, `@agentkernel/operations`, `@agentkernel/storage`, `@agentkernel/agent-kernel`, `@agentkernel/agent-api`), OpenSpec, and existing smoke/typecheck scripts.

---

## Source Design

Implement from:

```text
/Users/griffith/Projects/Prism/docs/superpowers/specs/2026-05-31-vertical-pluggable-research-copilot-design.md
```

## Scope Check

This plan implements the next architecture slices needed to keep MVP1 moving:

```text
platform blueprint contracts
funding-basis platformization
method exploration contract
compare/refresh contract
monitor/signal contract
proposal/risk contract
prediction-market sample vertical spec
verification and anti-drift checks
```

It does not implement:

```text
account state
balances, positions, or orders
wallet/private key flows
real trade or bet placement
automatic execution
full web workspace UI
LangGraph/Temporal runtime adoption
multi-agent runtime negotiation in the end-user path
```

## File Structure

Create:

```text
openspec/changes/define-vertical-pluggable-research-copilot/proposal.md
openspec/changes/define-vertical-pluggable-research-copilot/design.md
openspec/changes/define-vertical-pluggable-research-copilot/critic.md
openspec/changes/define-vertical-pluggable-research-copilot/test-matrix.md
openspec/changes/define-vertical-pluggable-research-copilot/tasks.md
packages/domain/src/research-state.ts
packages/domain/src/monitor-definition.ts
packages/domain/src/source-map.ts
packages/domain/src/proposal-artifact.ts
packages/domain/src/refresh-artifact.ts
packages/domain/src/signal-artifact.ts
packages/domain/src/vertical-plugin.ts
packages/domain/src/risk-artifact.ts
packages/domain/test/research-state.test.ts
packages/domain/test/artifact-family.test.ts
packages/operations/src/platform-intent.ts
packages/operations/src/platform-capability-routing.ts
packages/operations/src/platform-paths.ts
packages/operations/src/method-exploration.ts
packages/operations/src/artifact-refresh.ts
packages/operations/src/opportunity-compare.ts
packages/operations/src/monitor-signal.ts
packages/operations/src/proposal-builder.ts
packages/operations/src/risk-evaluation.ts
packages/operations/test/platform-capability-routing.test.ts
packages/operations/test/method-exploration.test.ts
packages/operations/test/artifact-refresh.test.ts
packages/operations/test/opportunity-compare.test.ts
packages/operations/test/monitor-signal.test.ts
packages/operations/test/proposal-builder.test.ts
packages/operations/test/risk-evaluation.test.ts
packages/agent-kernel/src/platform-intent-guidance.ts
packages/agent-kernel/test/platform-intent-guidance.test.ts
apps/agent-api/src/smoke-platform-research-loop.ts
apps/agent-api/src/smoke-monitor-signal.ts
```

Modify:

```text
packages/domain/src/artifact.ts
packages/domain/src/index.ts
packages/domain/src/risk-check.ts
packages/operations/src/funding-basis-arbitrage.ts
packages/operations/src/funding-basis-cards.ts
packages/operations/src/index.ts
packages/agent-kernel/src/register-prism-tools.ts
packages/agent-kernel/src/funding-basis-copilot-guidance.ts
packages/agent-kernel/src/index.ts
packages/storage/src/index.ts
packages/storage/src/memory-artifact-store.ts
packages/storage/test/memory-artifact-store.test.ts
apps/agent-api/package.json
package.json
README.md
AGENTS.md
```

Responsibilities:

- OpenSpec blueprint files: lock the platform contract names, boundaries, tests, and anti-drift rules before code spreads across packages.
- `@agentkernel/domain`: add durable platform object types for `ResearchState`, `MonitorDefinition`, `SourceMap`, `SignalArtifact`, `RefreshArtifact`, `ProposalArtifact`, `RiskArtifact`, and vertical declarations.
- `@agentkernel/operations`: implement deterministic platform-level routing, path helpers, method exploration, compare/refresh, monitor/signal, proposal, and risk logic without importing provider clients.
- `@agentkernel/agent-kernel`: expose platform-safe tool definitions and lightweight guidance that map user requests onto platform intents and vertical capabilities while preserving read-only limits.
- `@agentkernel/storage`: persist new artifact family objects and state refs without mutating historical artifact truth on refresh.
- `apps/agent-api` smokes: prove the platform path works through the registered runtime with read-only boundaries visible.

---

### Task 1: Write the platform blueprint OpenSpec change

**Files:**
- Create: `openspec/changes/define-vertical-pluggable-research-copilot/proposal.md`
- Create: `openspec/changes/define-vertical-pluggable-research-copilot/design.md`
- Create: `openspec/changes/define-vertical-pluggable-research-copilot/critic.md`
- Create: `openspec/changes/define-vertical-pluggable-research-copilot/test-matrix.md`
- Create: `openspec/changes/define-vertical-pluggable-research-copilot/tasks.md`

- [ ] **Step 1: Write the proposal**

Create `openspec/changes/define-vertical-pluggable-research-copilot/proposal.md`:

```md
## Why

Prism already has an artifact-backed funding-basis path, but the current control plane is still shaped around one vertical. We need platform contracts that let funding-basis remain the first MVP wedge while future research verticals such as prediction markets reuse the same intent, artifact, and policy foundations.

## What changes

- Define a platform intent taxonomy separated from vertical identity.
- Define stable orchestration paths for explore/discover/explain/report/compare/refresh/monitor/signal/propose/risk.
- Define artifact-family and refresh-derivation rules.
- Define vertical plugin declarations and policy boundaries.
- Keep the research layer read-only and explicitly separate signal, proposal, and execution.

## Impact

- Affects `@agentkernel/domain`, `@agentkernel/operations`, `@agentkernel/agent-kernel`, and `@agentkernel/storage`.
- Creates the blueprint for funding-basis platformization and later prediction-market spec slices.
- Does not authorize execution, account, wallet, or private endpoints.
```

- [ ] **Step 2: Write the design**

Create `openspec/changes/define-vertical-pluggable-research-copilot/design.md`:

```md
## Core contracts

### Intent taxonomy

```text
discover
explore_method
explain
report
compare
refresh
monitor
emit_signal
propose
evaluate_risk
inspect_source
extension_required
general
```

### Path contract

```text
User input
-> resolve intent
-> resolve vertical
-> resolve capability
-> choose path
-> choose operation(s)
-> materialize artifacts
```

### Artifact family

```text
research_brief
method_artifact
source_snapshot
market_context_snapshot
comparison_artifact
signal_artifact
opportunity_artifact
research_report
monitor_definition
proposal_artifact
risk_artifact
refresh_artifact
```

### Refresh rule

```text
artifact_v1
-> refresh
-> refresh_artifact_v1
-> optionally derive artifact_v2
```

## Hard rules

1. Read-only is the default research-layer mode.
2. Realtime facts must remain tool-backed.
3. Proposal and execution are separate.
4. Signal and proposal are separate.
5. Funding-basis is a wedge, not Prism’s permanent identity.
6. Continuous monitoring must derive from approved prior research state, not hidden prompt-only memory.
```

- [ ] **Step 3: Write the critic review**

Create `openspec/changes/define-vertical-pluggable-research-copilot/critic.md`:

```md
## Main risks

1. The control plane could drift back into funding-only naming.
2. Refresh could overwrite historical artifact truth.
3. Proposal/risk could accidentally pull execution fields into research schemas.
4. Monitor/signal could become hidden runtime state instead of materialized objects.
5. Prediction-market extensibility could remain aspirational if plugin boundaries are not explicit.

## Required rebuttals

- Every new domain type must map to an explicit artifact family or state object.
- Operations must stay provider-agnostic.
- Tool schemas must remain read-only.
- Tests must prove signal/proposal/execution separation.
```

- [ ] **Step 4: Write the test matrix**

Create `openspec/changes/define-vertical-pluggable-research-copilot/test-matrix.md`:

```md
## Contract tests

- intent taxonomy resolution is vertical-independent
- capability routing selects path before tool
- refresh creates delta artifacts without mutating originals
- proposal schemas exclude account/order/execution fields
- risk evaluation remains deterministic
- monitor emission produces signal artifacts with lineage

## Safety tests

- no execution/account/private fields in research-layer tool schemas
- no `@agentkernel/tools` imports from compare/proposal/risk operations
- no raw provider class references from agent-kernel guidance/routing

## Smokes

- platform research loop smoke
- monitor/signal smoke
- funding-basis regression smoke
- opportunity explanation/report smoke
```

- [ ] **Step 5: Write the task checklist**

Create `openspec/changes/define-vertical-pluggable-research-copilot/tasks.md`:

```md
## OpenSpec / Harness Gate

- [ ] Write proposal.
- [ ] Write design.
- [ ] Write critic review.
- [ ] Write test matrix.

## Implementation

- [ ] Add platform domain contracts.
- [ ] Add platform routing/path operations.
- [ ] Platformize funding-basis as the first vertical declaration.
- [ ] Add compare/refresh operations and tests.
- [ ] Add monitor/signal operations and tests.
- [ ] Add proposal/risk operations and tests.
- [ ] Add platform runtime guidance and tool registration updates.
- [ ] Add platform smokes.

## Verification

- [ ] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/domain`.
- [ ] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations`.
- [ ] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/agent-kernel`.
- [ ] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/storage`.
- [ ] Run `npm --prefix "/Users/griffith/Projects/Prism" run typecheck`.
- [ ] Run `npm --prefix "/Users/griffith/Projects/Prism" run smoke:platform-research-loop`.
- [ ] Run `npm --prefix "/Users/griffith/Projects/Prism" run smoke:monitor-signal`.
- [ ] Run `openspec validate "define-vertical-pluggable-research-copilot"` from `/Users/griffith/Projects/Prism`.
```

- [ ] **Step 6: Validate the new OpenSpec change folder**

Run:

```bash
openspec validate "define-vertical-pluggable-research-copilot"
```

Expected: PASS.

- [ ] **Step 7: Commit checkpoint**

If working in a git checkout, run:

```bash
git add openspec/changes/define-vertical-pluggable-research-copilot
git commit -m "spec: define vertical pluggable research copilot"
```

If `/Users/griffith/Projects/Prism` is still not a git repository, skip the commit and record the new OpenSpec files in the implementation handoff.

---

### Task 2: Add platform domain contracts for state, artifact family, and plugin declarations

**Files:**
- Create: `packages/domain/src/research-state.ts`
- Create: `packages/domain/src/monitor-definition.ts`
- Create: `packages/domain/src/source-map.ts`
- Create: `packages/domain/src/signal-artifact.ts`
- Create: `packages/domain/src/refresh-artifact.ts`
- Create: `packages/domain/src/proposal-artifact.ts`
- Create: `packages/domain/src/risk-artifact.ts`
- Create: `packages/domain/src/vertical-plugin.ts`
- Create: `packages/domain/test/research-state.test.ts`
- Create: `packages/domain/test/artifact-family.test.ts`
- Modify: `packages/domain/src/artifact.ts`
- Modify: `packages/domain/src/index.ts`
- Modify: `packages/domain/src/risk-check.ts`

- [ ] **Step 1: Write the failing domain tests**

Create `packages/domain/test/research-state.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  createResearchState,
  isMethodLocked,
  type ResearchState,
} from "../src/index.js";

test("createResearchState starts in method exploration with structured pause state", () => {
  const state = createResearchState({
    goal: "Research Binance/Bitget funding-basis opportunities",
    scope: "BTC/ETH/SOL read-only scan",
    vertical: "funding_basis",
  });

  assert.equal(state.currentPhase, "method_exploration");
  assert.equal(state.methodState.status, "exploring");
  assert.equal(state.autonomyMode, "pause_required");
  assert.equal(state.pauseState?.reason, "method_lock_required");
  assert.deepEqual(state.artifactSet, []);
});

test("isMethodLocked only returns true for locked method states", () => {
  const exploring: ResearchState = createResearchState({
    goal: "Research prediction market",
    scope: "World Cup final",
    vertical: "prediction_market",
  });

  const locked: ResearchState = {
    ...exploring,
    methodState: {
      ...exploring.methodState,
      status: "locked",
      selectedMethod: "multi_source_event_market_research",
    },
    autonomyMode: "auto_with_notice",
    pauseState: undefined,
  };

  assert.equal(isMethodLocked(exploring), false);
  assert.equal(isMethodLocked(locked), true);
});
```

Create `packages/domain/test/artifact-family.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  ARTIFACT_FAMILY_TYPES,
  RESEARCH_LAYER_FORBIDDEN_FIELDS,
} from "../src/index.js";

test("artifact family includes refresh, signal, proposal, and risk artifacts", () => {
  assert.equal(ARTIFACT_FAMILY_TYPES.includes("refresh_artifact"), true);
  assert.equal(ARTIFACT_FAMILY_TYPES.includes("signal_artifact"), true);
  assert.equal(ARTIFACT_FAMILY_TYPES.includes("proposal_artifact"), true);
  assert.equal(ARTIFACT_FAMILY_TYPES.includes("risk_artifact"), true);
});

test("research-layer forbidden fields include action-capable inputs", () => {
  for (const field of ["apiKey", "secret", "account", "balance", "position", "order", "margin", "withdraw", "transfer", "walletPrivateKey"]) {
    assert.equal(RESEARCH_LAYER_FORBIDDEN_FIELDS.includes(field), true);
  }
});
```

- [ ] **Step 2: Run the failing domain tests**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/domain
```

Expected: FAIL because the new domain modules and exports do not exist.

- [ ] **Step 3: Add `ResearchState` and `SourceMap`**

Create `packages/domain/src/research-state.ts`:

```ts
export type ResearchVertical = "funding_basis" | "prediction_market";
export type ResearchPhase =
  | "goal_framing"
  | "method_exploration"
  | "source_mapping"
  | "fact_gathering"
  | "synthesis"
  | "materialization"
  | "monitoring"
  | "proposal_review";

export type AutonomyMode = "auto" | "auto_with_notice" | "pause_required";
export type PauseReason =
  | "goal_change_required"
  | "scope_expansion_requires_confirmation"
  | "source_conflict"
  | "method_lock_required"
  | "proposal_review_required"
  | "boundary_guard";

export interface MethodState {
  status: "exploring" | "compared" | "locked" | "superseded";
  candidateMethods: string[];
  selectedMethod?: string;
  methodArtifacts: string[];
  methodSelectionReason?: string;
  requiredCapabilities: string[];
  requiresPrivateApis: boolean;
}

export interface ResearchPauseState {
  reason: PauseReason;
  detail: string;
}

export interface ResearchState {
  goal: string;
  scope: string;
  vertical: ResearchVertical;
  currentPhase: ResearchPhase;
  intentStack: string[];
  methodState: MethodState;
  sourceMap: string[];
  factSet: string[];
  candidateSet: string[];
  artifactSet: string[];
  openQuestions: string[];
  nextSteps: string[];
  autonomyMode: AutonomyMode;
  pauseState?: ResearchPauseState;
  history: string[];
}

export function createResearchState(input: {
  goal: string;
  scope: string;
  vertical: ResearchVertical;
}): ResearchState {
  return {
    goal: input.goal,
    scope: input.scope,
    vertical: input.vertical,
    currentPhase: "method_exploration",
    intentStack: ["explore_method"],
    methodState: {
      status: "exploring",
      candidateMethods: [],
      methodArtifacts: [],
      requiredCapabilities: [],
      requiresPrivateApis: false,
    },
    sourceMap: [],
    factSet: [],
    candidateSet: [],
    artifactSet: [],
    openQuestions: [],
    nextSteps: [],
    autonomyMode: "pause_required",
    pauseState: {
      reason: "method_lock_required",
      detail: "Method selection must be locked before live discovery or monitoring.",
    },
    history: [],
  };
}

export function isMethodLocked(state: ResearchState): boolean {
  return state.methodState.status === "locked";
}
```

Create `packages/domain/src/source-map.ts`:

```ts
export type SourceRole = "official" | "market" | "rules" | "news" | "context";
export type SourceTrustLevel = "high" | "medium" | "low" | "unknown";
export type SourceStatus = "ok" | "degraded" | "missing";

export interface SourceEntry {
  id: string;
  type: string;
  role: SourceRole;
  trustLevel: SourceTrustLevel;
  freshness: string;
  status: SourceStatus;
  lastCheckedAt?: string;
  notes?: string;
}
```

- [ ] **Step 4: Add monitor, signal, refresh, proposal, risk, and plugin contracts**

Create `packages/domain/src/monitor-definition.ts`:

```ts
export interface MonitorDefinition {
  goalRef: string;
  methodRef: string;
  vertical: string;
  watchedEntities: string[];
  sourcePolicy: string[];
  refreshCadence: string;
  triggerConditions: string[];
  comparisonRules: string[];
  thresholds: string[];
  signalRules: string[];
  escalationRules: string[];
  pauseRules: string[];
  status: "draft" | "active" | "paused" | "archived";
}
```

Create `packages/domain/src/signal-artifact.ts`:

```ts
export interface SignalArtifact {
  monitorRef: string;
  sourceRefs: string[];
  comparisonRefs: string[];
  opportunityRef?: string;
  kind: string;
  severity: "low" | "medium" | "high";
  confidence: number;
  changeSummary: string;
  whyItMatters: string;
  recommendedNextStep: string;
  escalatedToProposal: boolean;
  createdAt: string;
}
```

Create `packages/domain/src/refresh-artifact.ts`:

```ts
export interface RefreshArtifact {
  artifactRef: string;
  refreshedAt: string;
  sourceRefs: string[];
  deltaSummary: string[];
  warnings: string[];
  preservedArtifactRef: string;
}
```

Create `packages/domain/src/proposal-artifact.ts`:

```ts
export interface ProposalArtifact {
  id: string;
  sourceArtifactRefs: string[];
  title: string;
  thesis: string[];
  assumptions: string[];
  missingFacts: string[];
  readOnlyBoundary: string;
  nextReviewStep: string;
}
```

Create `packages/domain/src/risk-artifact.ts`:

```ts
export interface RiskArtifact {
  proposalRef: string;
  checks: Array<{ name: string; status: "pass" | "warn" | "fail"; detail: string }>;
  summary: string;
  actionAllowed: false;
}
```

Create `packages/domain/src/vertical-plugin.ts`:

```ts
export interface VerticalPluginDeclaration {
  vertical: "funding_basis" | "prediction_market";
  supportedIntents: string[];
  supportedPaths: string[];
  capabilityKeys: string[];
  artifactMappings: Record<string, string>;
  policyProfile: string[];
}
```

- [ ] **Step 5: Extend the shared artifact exports and constants**

Modify `packages/domain/src/artifact.ts` to add:

```ts
export const ARTIFACT_FAMILY_TYPES = [
  "research_brief",
  "method_artifact",
  "source_snapshot",
  "market_context_snapshot",
  "comparison_artifact",
  "signal_artifact",
  "opportunity_artifact",
  "research_report",
  "monitor_definition",
  "proposal_artifact",
  "risk_artifact",
  "refresh_artifact",
] as const;

export const RESEARCH_LAYER_FORBIDDEN_FIELDS = [
  "apiKey",
  "secret",
  "account",
  "balance",
  "position",
  "order",
  "margin",
  "withdraw",
  "transfer",
  "walletPrivateKey",
] as const;
```

Modify `packages/domain/src/index.ts` to export:

```ts
export * from "./artifact.js";
export * from "./monitor-definition.js";
export * from "./proposal-artifact.js";
export * from "./refresh-artifact.js";
export * from "./research-state.js";
export * from "./risk-artifact.js";
export * from "./signal-artifact.js";
export * from "./source-map.js";
export * from "./vertical-plugin.js";
```

Keep existing exports.

- [ ] **Step 6: Run the domain tests**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/domain
```

Expected: PASS.

- [ ] **Step 7: Commit checkpoint**

If working in a git checkout, run:

```bash
git add packages/domain/src packages/domain/test
git commit -m "feat: add research platform domain contracts"
```

If not in a git repository, skip the commit and record the changed files.

---

### Task 3: Add platform intent taxonomy and capability routing operations

**Files:**
- Create: `packages/operations/src/platform-intent.ts`
- Create: `packages/operations/src/platform-capability-routing.ts`
- Create: `packages/operations/src/platform-paths.ts`
- Create: `packages/operations/test/platform-capability-routing.test.ts`
- Modify: `packages/operations/src/index.ts`
- Modify: `packages/agent-kernel/src/funding-basis-copilot-guidance.ts`

- [ ] **Step 1: Write the failing routing test**

Create `packages/operations/test/platform-capability-routing.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  resolvePlatformIntent,
  resolvePlatformCapability,
  choosePlatformPath,
} from "../src/index.js";

test("compare intent stays platform-level while vertical changes separately", () => {
  const funding = resolvePlatformCapability({
    input: "Compare these two funding artifacts",
    vertical: "funding_basis",
  });
  const prediction = resolvePlatformCapability({
    input: "Compare these two World Cup market artifacts",
    vertical: "prediction_market",
  });

  assert.equal(funding.intent, "compare");
  assert.equal(prediction.intent, "compare");
  assert.equal(funding.vertical, "funding_basis");
  assert.equal(prediction.vertical, "prediction_market");
});

test("monitor path is chosen from intent and not from tool name", () => {
  const intent = resolvePlatformIntent("Keep watching this opportunity and alert me if the edge changes");
  const path = choosePlatformPath(intent);

  assert.equal(intent, "monitor");
  assert.equal(path, "path_monitor");
});

test("proposal intent remains read-only and routes before any action", () => {
  const capability = resolvePlatformCapability({
    input: "Create a proposal from this saved artifact",
    vertical: "funding_basis",
  });

  assert.equal(capability.intent, "propose");
  assert.equal(capability.path, "path_propose");
  assert.equal(capability.readOnly, true);
});
```

- [ ] **Step 2: Run the failing operations test**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations
```

Expected: FAIL because the platform routing modules do not exist.

- [ ] **Step 3: Add intent and path helpers**

Create `packages/operations/src/platform-intent.ts`:

```ts
export type PlatformIntent =
  | "discover"
  | "explore_method"
  | "explain"
  | "report"
  | "compare"
  | "refresh"
  | "monitor"
  | "emit_signal"
  | "propose"
  | "evaluate_risk"
  | "inspect_source"
  | "extension_required"
  | "general";

export function resolvePlatformIntent(input: string): PlatformIntent {
  if (/monitor|watch|alert|跟踪|监控/i.test(input)) return "monitor";
  if (/signal|变化|告警/i.test(input)) return "emit_signal";
  if (/proposal|建议方案|提案/i.test(input)) return "propose";
  if (/risk|风险/i.test(input)) return "evaluate_risk";
  if (/compare|对比/i.test(input)) return "compare";
  if (/refresh|更新|刷新/i.test(input)) return "refresh";
  if (/report|报告/i.test(input)) return "report";
  if (/explain|解释/i.test(input)) return "explain";
  if (/method|方法|路径/i.test(input)) return "explore_method";
  if (/source|api|规则|来源/i.test(input)) return "inspect_source";
  if (/discover|find|scan|机会|研究/i.test(input)) return "discover";
  return "general";
}
```

Create `packages/operations/src/platform-paths.ts`:

```ts
import type { PlatformIntent } from "./platform-intent.js";

export type PlatformPath =
  | "path_explore_method"
  | "path_discover"
  | "path_explain"
  | "path_report"
  | "path_compare"
  | "path_refresh"
  | "path_monitor"
  | "path_emit_signal"
  | "path_propose"
  | "path_evaluate_risk"
  | "path_inspect_source"
  | "path_extension_required"
  | "path_general";

export function choosePlatformPath(intent: PlatformIntent): PlatformPath {
  switch (intent) {
    case "explore_method": return "path_explore_method";
    case "discover": return "path_discover";
    case "explain": return "path_explain";
    case "report": return "path_report";
    case "compare": return "path_compare";
    case "refresh": return "path_refresh";
    case "monitor": return "path_monitor";
    case "emit_signal": return "path_emit_signal";
    case "propose": return "path_propose";
    case "evaluate_risk": return "path_evaluate_risk";
    case "inspect_source": return "path_inspect_source";
    case "extension_required": return "path_extension_required";
    default: return "path_general";
  }
}
```

- [ ] **Step 4: Add capability resolution**

Create `packages/operations/src/platform-capability-routing.ts`:

```ts
import { choosePlatformPath } from "./platform-paths.js";
import { resolvePlatformIntent, type PlatformIntent } from "./platform-intent.js";

export interface PlatformCapabilityResolution {
  intent: PlatformIntent;
  vertical: "funding_basis" | "prediction_market";
  capability: string;
  path: ReturnType<typeof choosePlatformPath>;
  readOnly: true;
}

export function resolvePlatformCapability(input: {
  input: string;
  vertical: "funding_basis" | "prediction_market";
}): PlatformCapabilityResolution {
  const intent = resolvePlatformIntent(input.input);
  return {
    intent,
    vertical: input.vertical,
    capability: `${input.vertical}.${intent}`,
    path: choosePlatformPath(intent),
    readOnly: true,
  };
}
```

- [ ] **Step 5: Export the new routing helpers**

Modify `packages/operations/src/index.ts` to include:

```ts
export * from "./platform-capability-routing.js";
export * from "./platform-intent.js";
export * from "./platform-paths.js";
```

Keep existing exports.

- [ ] **Step 6: Update funding-basis runtime guidance to use platform naming**

Modify `packages/agent-kernel/src/funding-basis-copilot-guidance.ts` so the returned guidance includes these fields:

```ts
platformIntent: "discover"
vertical: "funding_basis"
capability: "funding_basis.discover"
path: "path_discover"
```

and for explanation/report requests:

```ts
platformIntent: "explain" | "report"
vertical: "funding_basis"
```

Do not remove the existing MVP1 helper behavior yet; add the platform fields alongside it so the current funding copilot remains backward-compatible during the transition.

- [ ] **Step 7: Run operations and agent-kernel tests**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/agent-kernel
```

Expected: PASS.

- [ ] **Step 8: Commit checkpoint**

If working in a git checkout, run:

```bash
git add packages/operations/src packages/operations/test packages/agent-kernel/src/funding-basis-copilot-guidance.ts
git commit -m "feat: add platform capability routing"
```

If not in a git repository, skip the commit and record the changed files.

---

### Task 4: Add method exploration as a first-class deterministic slice

**Files:**
- Create: `packages/operations/src/method-exploration.ts`
- Create: `packages/operations/test/method-exploration.test.ts`
- Modify: `packages/operations/src/index.ts`
- Modify: `packages/domain/src/index.ts`

- [ ] **Step 1: Write the failing method exploration test**

Create `packages/operations/test/method-exploration.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { compareResearchMethods } from "../src/index.js";

test("compareResearchMethods materializes a method artifact before live discovery", () => {
  const result = compareResearchMethods({
    goal: "Find Binance/Bitget funding-basis opportunities",
    candidateMethods: [
      "cross_venue_funding_basis_scan",
      "manual_single_symbol_lookup",
    ],
    selectedMethod: "cross_venue_funding_basis_scan",
    requiresPrivateApis: false,
  });

  assert.equal(result.methodState.status, "locked");
  assert.equal(result.methodState.selectedMethod, "cross_venue_funding_basis_scan");
  assert.equal(result.artifact.type, "method_artifact");
  assert.match(result.artifact.summary, /locked/i);
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations
```

Expected: FAIL because `method-exploration.ts` does not exist.

- [ ] **Step 3: Add the method exploration operation**

Create `packages/operations/src/method-exploration.ts`:

```ts
import type { MethodState } from "@agentkernel/domain";

export interface MethodArtifactView {
  type: "method_artifact";
  summary: string;
  candidateMethods: string[];
  selectedMethod: string;
  requiresPrivateApis: boolean;
}

export function compareResearchMethods(input: {
  goal: string;
  candidateMethods: string[];
  selectedMethod: string;
  requiresPrivateApis: boolean;
}): {
  methodState: MethodState;
  artifact: MethodArtifactView;
} {
  return {
    methodState: {
      status: "locked",
      candidateMethods: input.candidateMethods,
      selectedMethod: input.selectedMethod,
      methodArtifacts: [`method_${input.selectedMethod}`],
      methodSelectionReason: `Locked for goal: ${input.goal}`,
      requiredCapabilities: [input.selectedMethod],
      requiresPrivateApis: input.requiresPrivateApis,
    },
    artifact: {
      type: "method_artifact",
      summary: `Method locked for research goal: ${input.goal}`,
      candidateMethods: input.candidateMethods,
      selectedMethod: input.selectedMethod,
      requiresPrivateApis: input.requiresPrivateApis,
    },
  };
}
```

- [ ] **Step 4: Export and verify**

Modify `packages/operations/src/index.ts` to include:

```ts
export * from "./method-exploration.js";
```

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations
```

Expected: PASS.

- [ ] **Step 5: Commit checkpoint**

If working in a git checkout, run:

```bash
git add packages/operations/src/method-exploration.ts packages/operations/test/method-exploration.test.ts packages/operations/src/index.ts
git commit -m "feat: add method exploration slice"
```

If not in a git repository, skip the commit and record the changed files.

---

### Task 5: Platformize funding-basis as the first vertical declaration

**Files:**
- Modify: `packages/domain/src/vertical-plugin.ts`
- Modify: `packages/operations/src/funding-basis-arbitrage.ts`
- Modify: `packages/operations/src/funding-basis-cards.ts`
- Modify: `packages/operations/test/funding-basis-arbitrage.test.ts`
- Modify: `packages/agent-kernel/src/register-prism-tools.ts`
- Modify: `packages/agent-kernel/test/register-prism-tools.test.ts`

- [ ] **Step 1: Write the failing vertical declaration test**

Append this test to `packages/agent-kernel/test/register-prism-tools.test.ts`:

```ts
test("funding-basis tools declare platform intent and vertical capability guidance", () => {
  const tools = createPrismToolDefinitions(createPrismRuntimeContext());
  const scanner = tools.find((tool) => tool.name === "scan_funding_basis_arbitrage");

  assert.ok(scanner);
  assert.match((scanner.promptGuidelines ?? []).join(" "), /funding_basis\.discover/);
  assert.match((scanner.promptGuidelines ?? []).join(" "), /path_discover/);
  assert.match((scanner.promptGuidelines ?? []).join(" "), /read-only/i);
});
```

- [ ] **Step 2: Add the funding-basis vertical declaration**

Modify `packages/domain/src/vertical-plugin.ts` to add:

```ts
export const FUNDING_BASIS_VERTICAL: VerticalPluginDeclaration = {
  vertical: "funding_basis",
  supportedIntents: [
    "discover",
    "explain",
    "report",
    "compare",
    "refresh",
    "monitor",
    "emit_signal",
    "propose",
    "evaluate_risk",
  ],
  supportedPaths: [
    "path_discover",
    "path_explain",
    "path_report",
    "path_compare",
    "path_refresh",
    "path_monitor",
    "path_emit_signal",
    "path_propose",
    "path_evaluate_risk",
  ],
  capabilityKeys: [
    "funding_basis.discover",
    "funding_basis.explain",
    "funding_basis.report",
    "funding_basis.compare",
    "funding_basis.refresh",
    "funding_basis.monitor",
    "funding_basis.emit_signal",
    "funding_basis.propose",
    "funding_basis.evaluate_risk",
  ],
  artifactMappings: {
    comparison: "comparison_artifact",
    opportunity: "opportunity_artifact",
    report: "research_report",
    signal: "signal_artifact",
    refresh: "refresh_artifact",
    proposal: "proposal_artifact",
    risk: "risk_artifact",
  },
  policyProfile: [
    "read_only_public_data_only",
    "no_execution",
    "no_account_private_endpoints",
  ],
};
```

- [ ] **Step 3: Add platform notes to funding-basis results**

Modify `packages/operations/src/funding-basis-arbitrage.ts` to include these return fields in the output:

```ts
vertical: "funding_basis",
platformIntent: "discover",
capability: "funding_basis.discover",
path: "path_discover",
```

and extend the output type accordingly.

- [ ] **Step 4: Add runtime guidance and tests**

Modify `packages/agent-kernel/src/register-prism-tools.ts` scanner `promptGuidelines` to include:

```ts
"This tool is the canonical funding_basis.discover implementation for path_discover.",
"Use this tool for the platform-level discover intent inside the funding_basis vertical.",
```

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/agent-kernel
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations
```

Expected: PASS.

- [ ] **Step 5: Commit checkpoint**

If working in a git checkout, run:

```bash
git add packages/domain/src/vertical-plugin.ts packages/operations/src/funding-basis-arbitrage.ts packages/agent-kernel/src/register-prism-tools.ts packages/agent-kernel/test/register-prism-tools.test.ts
git commit -m "feat: platformize funding basis vertical declaration"
```

If not in a git repository, skip the commit and record the changed files.

---

### Task 6: Add compare and refresh platform slices

**Files:**
- Create: `packages/operations/src/opportunity-compare.ts`
- Create: `packages/operations/src/artifact-refresh.ts`
- Create: `packages/operations/test/opportunity-compare.test.ts`
- Create: `packages/operations/test/artifact-refresh.test.ts`
- Modify: `packages/operations/src/index.ts`
- Modify: `packages/storage/src/memory-artifact-store.ts`
- Modify: `packages/storage/test/memory-artifact-store.test.ts`

- [ ] **Step 1: Write the failing compare and refresh tests**

Create `packages/operations/test/opportunity-compare.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { compareOpportunityArtifacts } from "../src/index.js";

test("compareOpportunityArtifacts normalizes comparable fields into a comparison artifact", () => {
  const result = compareOpportunityArtifacts([
    { id: "artifact_a", symbol: "ETHUSDT", netEdgeBps: 8 },
    { id: "artifact_b", symbol: "ETHUSDT", netEdgeBps: 5 },
  ]);

  assert.equal(result.type, "comparison_artifact");
  assert.equal(result.rankings[0]?.artifactId, "artifact_a");
});
```

Create `packages/operations/test/artifact-refresh.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { refreshArtifactView } from "../src/index.js";

test("refreshArtifactView preserves original artifact identity and creates a refresh artifact", () => {
  const result = refreshArtifactView({
    artifactRef: "artifact_opp_ETHUSDT",
    sourceRefs: ["binance", "bitget"],
    deltaSummary: ["Funding spread narrowed from 8 bps to 4 bps"],
    warnings: [],
  });

  assert.equal(result.artifactRef, "artifact_opp_ETHUSDT");
  assert.equal(result.preservedArtifactRef, "artifact_opp_ETHUSDT");
  assert.equal(result.deltaSummary.length, 1);
});
```

- [ ] **Step 2: Run the failing tests**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations
```

Expected: FAIL because the compare/refresh modules do not exist.

- [ ] **Step 3: Add compare and refresh operations**

Create `packages/operations/src/opportunity-compare.ts`:

```ts
export function compareOpportunityArtifacts(input: Array<{
  id: string;
  symbol: string;
  netEdgeBps: number;
}>) {
  const rankings = [...input]
    .sort((left, right) => right.netEdgeBps - left.netEdgeBps)
    .map((item) => ({ artifactId: item.id, symbol: item.symbol, netEdgeBps: item.netEdgeBps }));

  return {
    type: "comparison_artifact" as const,
    rankings,
  };
}
```

Create `packages/operations/src/artifact-refresh.ts`:

```ts
import type { RefreshArtifact } from "@agentkernel/domain";

export function refreshArtifactView(input: {
  artifactRef: string;
  sourceRefs: string[];
  deltaSummary: string[];
  warnings: string[];
}): RefreshArtifact {
  return {
    artifactRef: input.artifactRef,
    refreshedAt: new Date().toISOString(),
    sourceRefs: input.sourceRefs,
    deltaSummary: input.deltaSummary,
    warnings: input.warnings,
    preservedArtifactRef: input.artifactRef,
  };
}
```

- [ ] **Step 4: Export and persist refresh results**

Modify `packages/operations/src/index.ts` to include:

```ts
export * from "./artifact-refresh.js";
export * from "./opportunity-compare.js";
```

Modify `packages/storage/src/memory-artifact-store.ts` to add a helper that stores refresh artifacts without deleting or rewriting the original artifact:

```ts
async saveDerivedArtifact(id: string, artifact: unknown): Promise<void> {
  this.items.set(id, artifact);
}
```

Add a matching assertion in `packages/storage/test/memory-artifact-store.test.ts` that both the original artifact and the refresh artifact remain retrievable.

- [ ] **Step 5: Run operations and storage tests**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/storage
```

Expected: PASS.

- [ ] **Step 6: Commit checkpoint**

If working in a git checkout, run:

```bash
git add packages/operations/src packages/operations/test packages/storage/src/memory-artifact-store.ts packages/storage/test/memory-artifact-store.test.ts
git commit -m "feat: add compare and refresh platform slices"
```

If not in a git repository, skip the commit and record the changed files.

---

### Task 7: Add monitor-definition and signal-emission platform slices

**Files:**
- Create: `packages/operations/src/monitor-signal.ts`
- Create: `packages/operations/test/monitor-signal.test.ts`
- Create: `apps/agent-api/src/smoke-monitor-signal.ts`
- Modify: `packages/operations/src/index.ts`
- Modify: `apps/agent-api/package.json`
- Modify: `package.json`

- [ ] **Step 1: Write the failing monitor/signal test**

Create `packages/operations/test/monitor-signal.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildSignalArtifactFromMonitor } from "../src/index.js";

test("buildSignalArtifactFromMonitor creates a lightweight signal with lineage", () => {
  const signal = buildSignalArtifactFromMonitor({
    monitorRef: "monitor_eth_basis",
    sourceRefs: ["binance", "bitget"],
    comparisonRefs: ["cmp_eth_basis"],
    kind: "funding_spread_change",
    severity: "medium",
    confidence: 0.8,
    changeSummary: "Funding spread widened to 12 bps",
    whyItMatters: "The widened spread may justify new review.",
    recommendedNextStep: "Review the latest opportunity artifact.",
  });

  assert.equal(signal.monitorRef, "monitor_eth_basis");
  assert.equal(signal.escalatedToProposal, false);
  assert.equal(signal.kind, "funding_spread_change");
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations
```

Expected: FAIL because `monitor-signal.ts` does not exist.

- [ ] **Step 3: Add the monitor/signal operation**

Create `packages/operations/src/monitor-signal.ts`:

```ts
import type { SignalArtifact } from "@agentkernel/domain";

export function buildSignalArtifactFromMonitor(input: {
  monitorRef: string;
  sourceRefs: string[];
  comparisonRefs: string[];
  opportunityRef?: string;
  kind: string;
  severity: "low" | "medium" | "high";
  confidence: number;
  changeSummary: string;
  whyItMatters: string;
  recommendedNextStep: string;
}): SignalArtifact {
  return {
    monitorRef: input.monitorRef,
    sourceRefs: input.sourceRefs,
    comparisonRefs: input.comparisonRefs,
    opportunityRef: input.opportunityRef,
    kind: input.kind,
    severity: input.severity,
    confidence: input.confidence,
    changeSummary: input.changeSummary,
    whyItMatters: input.whyItMatters,
    recommendedNextStep: input.recommendedNextStep,
    escalatedToProposal: false,
    createdAt: new Date().toISOString(),
  };
}
```

- [ ] **Step 4: Add monitor smoke**

Create `apps/agent-api/src/smoke-monitor-signal.ts`:

```ts
import { buildSignalArtifactFromMonitor } from "@agentkernel/operations";

const signal = buildSignalArtifactFromMonitor({
  monitorRef: "monitor_eth_basis",
  sourceRefs: ["binance", "bitget"],
  comparisonRefs: ["cmp_eth_basis"],
  kind: "funding_spread_change",
  severity: "medium",
  confidence: 0.8,
  changeSummary: "Funding spread widened to 12 bps",
  whyItMatters: "This may justify renewed review.",
  recommendedNextStep: "Open the latest report before escalation.",
});

if (signal.escalatedToProposal !== false) {
  throw new Error("Signal smoke crossed the proposal boundary");
}

console.log(JSON.stringify(signal, null, 2));
```

Modify `apps/agent-api/package.json` scripts:

```json
"smoke:monitor-signal": "node dist/smoke-monitor-signal.js"
```

Modify root `package.json` scripts:

```json
"smoke:monitor-signal": "npm run build && npm run smoke:monitor-signal -w @agentkernel/agent-api"
```

- [ ] **Step 5: Run tests and smoke**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations
npm --prefix "/Users/griffith/Projects/Prism" run smoke:monitor-signal
```

Expected: PASS.

- [ ] **Step 6: Commit checkpoint**

If working in a git checkout, run:

```bash
git add packages/operations/src/monitor-signal.ts packages/operations/test/monitor-signal.test.ts apps/agent-api/src/smoke-monitor-signal.ts apps/agent-api/package.json package.json
git commit -m "feat: add monitor and signal slices"
```

If not in a git repository, skip the commit and record the changed files.

---

### Task 8: Add proposal and deterministic risk platform slices

**Files:**
- Create: `packages/operations/src/proposal-builder.ts`
- Create: `packages/operations/src/risk-evaluation.ts`
- Create: `packages/operations/test/proposal-builder.test.ts`
- Create: `packages/operations/test/risk-evaluation.test.ts`
- Modify: `packages/operations/src/index.ts`
- Modify: `packages/agent-kernel/src/register-prism-tools.ts`

- [ ] **Step 1: Write the failing proposal and risk tests**

Create `packages/operations/test/proposal-builder.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildReadOnlyProposal } from "../src/index.js";

test("buildReadOnlyProposal creates a proposal artifact with explicit boundary text", () => {
  const proposal = buildReadOnlyProposal({
    sourceArtifactRefs: ["artifact_opp_ETHUSDT"],
    title: "Review ETH funding-basis candidate",
    thesis: ["Edge remains positive after fees."],
    assumptions: ["Funding remains near current level."],
    missingFacts: ["No live refresh yet."],
  });

  assert.equal(proposal.readOnlyBoundary.includes("read-only"), true);
  assert.equal(proposal.sourceArtifactRefs[0], "artifact_opp_ETHUSDT");
});
```

Create `packages/operations/test/risk-evaluation.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { evaluateProposalRisk } from "../src/index.js";

test("evaluateProposalRisk stays deterministic and blocks action", () => {
  const risk = evaluateProposalRisk({
    proposalRef: "proposal_eth_basis",
    hasFreshData: false,
    hasHumanReview: false,
  });

  assert.equal(risk.actionAllowed, false);
  assert.equal(risk.checks.some((check) => check.status === "fail"), true);
});
```

- [ ] **Step 2: Run the failing tests**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations
```

Expected: FAIL because `proposal-builder.ts` and `risk-evaluation.ts` do not exist.

- [ ] **Step 3: Add proposal and risk operations**

Create `packages/operations/src/proposal-builder.ts`:

```ts
import type { ProposalArtifact } from "@agentkernel/domain";

export function buildReadOnlyProposal(input: {
  sourceArtifactRefs: string[];
  title: string;
  thesis: string[];
  assumptions: string[];
  missingFacts: string[];
}): ProposalArtifact {
  return {
    id: `proposal_${input.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    sourceArtifactRefs: input.sourceArtifactRefs,
    title: input.title,
    thesis: input.thesis,
    assumptions: input.assumptions,
    missingFacts: input.missingFacts,
    readOnlyBoundary: "This proposal is read-only and is not an execution instruction.",
    nextReviewStep: "Run deterministic risk evaluation and human review before any future action.",
  };
}
```

Create `packages/operations/src/risk-evaluation.ts`:

```ts
import type { RiskArtifact } from "@agentkernel/domain";

export function evaluateProposalRisk(input: {
  proposalRef: string;
  hasFreshData: boolean;
  hasHumanReview: boolean;
}): RiskArtifact {
  const checks = [
    {
      name: "fresh_data",
      status: input.hasFreshData ? "pass" : "fail",
      detail: input.hasFreshData ? "Fresh data available." : "Proposal has not been refreshed with current facts.",
    },
    {
      name: "human_review",
      status: input.hasHumanReview ? "pass" : "fail",
      detail: input.hasHumanReview ? "Human review recorded." : "Human review is required before action-adjacent escalation.",
    },
  ] as const;

  return {
    proposalRef: input.proposalRef,
    checks: checks.map((check) => ({ ...check })),
    summary: checks.every((check) => check.status === "pass")
      ? "Proposal passed deterministic research-layer checks."
      : "Proposal failed deterministic research-layer checks.",
    actionAllowed: false,
  };
}
```

- [ ] **Step 4: Add runtime tool guidance for future proposal/risk paths**

Modify `packages/agent-kernel/src/register-prism-tools.ts` to reserve two future-facing tool descriptions in guidance only:

```ts
"Proposal flows must remain read-only and artifact-backed.",
"Risk evaluation must be deterministic and must not authorize execution.",
```

Do not add any action-capable tool schemas.

- [ ] **Step 5: Run tests**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/agent-kernel
```

Expected: PASS.

- [ ] **Step 6: Commit checkpoint**

If working in a git checkout, run:

```bash
git add packages/operations/src/proposal-builder.ts packages/operations/src/risk-evaluation.ts packages/operations/test/proposal-builder.test.ts packages/operations/test/risk-evaluation.test.ts packages/agent-kernel/src/register-prism-tools.ts
git commit -m "feat: add proposal and risk platform slices"
```

If not in a git repository, skip the commit and record the changed files.

---

### Task 9: Add platform runtime guidance and end-to-end research loop smoke

**Files:**
- Create: `packages/agent-kernel/src/platform-intent-guidance.ts`
- Create: `packages/agent-kernel/test/platform-intent-guidance.test.ts`
- Create: `apps/agent-api/src/smoke-platform-research-loop.ts`
- Modify: `packages/agent-kernel/src/index.ts`
- Modify: `apps/agent-api/package.json`
- Modify: `package.json`

- [ ] **Step 1: Write the failing guidance test**

Create `packages/agent-kernel/test/platform-intent-guidance.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { resolvePlatformResearchRequest } from "../src/index.js";

test("World Cup + Polymarket requests route to prediction-market inspect/discover guidance without pretending support is implemented", () => {
  const result = resolvePlatformResearchRequest("Help me research whether the World Cup final market on Polymarket is worth watching");

  assert.equal(result.vertical, "prediction_market");
  assert.equal(result.intent === "inspect_source" || result.intent === "discover", true);
  assert.equal(result.readOnly, true);
  assert.equal(result.extensionRequired, true);
});

test("funding-basis requests route to the canonical funding vertical path", () => {
  const result = resolvePlatformResearchRequest("Find Binance/Bitget funding opportunities and report them");

  assert.equal(result.vertical, "funding_basis");
  assert.equal(result.readOnly, true);
  assert.match(result.capability, /funding_basis\./);
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/agent-kernel
```

Expected: FAIL because `platform-intent-guidance.ts` does not exist.

- [ ] **Step 3: Add the runtime guidance helper**

Create `packages/agent-kernel/src/platform-intent-guidance.ts`:

```ts
import { resolvePlatformIntent, resolvePlatformCapability } from "@agentkernel/operations";

export function resolvePlatformResearchRequest(input: string) {
  const vertical = /polymarket|world cup|prediction market|世界杯/i.test(input)
    ? "prediction_market"
    : "funding_basis";

  const capability = resolvePlatformCapability({ input, vertical });

  return {
    ...capability,
    extensionRequired: vertical === "prediction_market",
    readOnly: true as const,
  };
}
```

Modify `packages/agent-kernel/src/index.ts` to include:

```ts
export * from "./platform-intent-guidance.js";
```

- [ ] **Step 4: Add the end-to-end platform smoke**

Create `apps/agent-api/src/smoke-platform-research-loop.ts`:

```ts
import {
  createPrismRuntimeContext,
  createPrismToolDefinitions,
  resolvePlatformResearchRequest,
} from "@agentkernel/agent-kernel";

const context = createPrismRuntimeContext();
const tools = createPrismToolDefinitions(context);
const funding = resolvePlatformResearchRequest("Find Binance/Bitget funding opportunities and report them");
const prediction = resolvePlatformResearchRequest("Help me research whether the World Cup final market on Polymarket is worth watching");

if (funding.vertical !== "funding_basis") {
  throw new Error("Funding request did not stay in the funding vertical");
}

if (prediction.vertical !== "prediction_market" || prediction.extensionRequired !== true) {
  throw new Error("Prediction-market request did not stay extension-required");
}

console.log(JSON.stringify({
  toolCount: tools.length,
  funding,
  prediction,
}, null, 2));
```

Modify `apps/agent-api/package.json` scripts:

```json
"smoke:platform-research-loop": "node dist/smoke-platform-research-loop.js"
```

Modify root `package.json` scripts:

```json
"smoke:platform-research-loop": "npm run build && npm run smoke:platform-research-loop -w @agentkernel/agent-api"
```

- [ ] **Step 5: Run tests and smoke**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/agent-kernel
npm --prefix "/Users/griffith/Projects/Prism" run smoke:platform-research-loop
```

Expected: PASS.

- [ ] **Step 6: Commit checkpoint**

If working in a git checkout, run:

```bash
git add packages/agent-kernel/src/platform-intent-guidance.ts packages/agent-kernel/test/platform-intent-guidance.test.ts packages/agent-kernel/src/index.ts apps/agent-api/src/smoke-platform-research-loop.ts apps/agent-api/package.json package.json
git commit -m "test: add platform research loop smoke"
```

If not in a git repository, skip the commit and record the changed files.

---

### Task 10: Write the prediction-market sample vertical spec and declaration stub

**Files:**
- Create: `openspec/changes/add-prediction-market-sample-vertical/proposal.md`
- Create: `openspec/changes/add-prediction-market-sample-vertical/design.md`
- Create: `openspec/changes/add-prediction-market-sample-vertical/tasks.md`
- Modify: `packages/domain/src/vertical-plugin.ts`
- Modify: `README.md`

- [ ] **Step 1: Write the sample vertical OpenSpec proposal**

Create `openspec/changes/add-prediction-market-sample-vertical/proposal.md`:

```md
## Why

Prism’s platform contracts need a second concrete vertical to prove they are not funding-specific. World Cup + Polymarket is the sample research-only vertical that exercises source inspection, multi-source evidence gathering, market comparison, report generation, and read-only proposal boundaries.

## What changes

- Define a sample prediction-market research vertical.
- Keep it at the inspect/discover/report/propose layer only.
- Do not implement bet placement, wallet flows, or automatic action.
```

- [ ] **Step 2: Write the sample design and tasks**

Create `openspec/changes/add-prediction-market-sample-vertical/design.md`:

```md
## Vertical shape

```text
inspect_source
-> discover
-> compare
-> report
-> propose(read-only)
```

## Required information surfaces

- event schedule
- team/news/context evidence
- market odds and liquidity
- resolution rules

## Hard limits

- no wallet/private key path
- no bet placement
- no automatic participation
```

Create `openspec/changes/add-prediction-market-sample-vertical/tasks.md`:

```md
- [ ] Define prediction-market vertical declaration.
- [ ] Define source snapshot and market context artifact mappings.
- [ ] Define future connector boundaries without implementing execution.
```

- [ ] **Step 3: Add the declaration stub and docs note**

Modify `packages/domain/src/vertical-plugin.ts` to add:

```ts
export const PREDICTION_MARKET_VERTICAL: VerticalPluginDeclaration = {
  vertical: "prediction_market",
  supportedIntents: [
    "inspect_source",
    "discover",
    "explain",
    "report",
    "compare",
    "refresh",
    "propose",
  ],
  supportedPaths: [
    "path_inspect_source",
    "path_discover",
    "path_explain",
    "path_report",
    "path_compare",
    "path_refresh",
    "path_propose",
  ],
  capabilityKeys: [
    "prediction_market.inspect_source",
    "prediction_market.discover",
    "prediction_market.explain",
    "prediction_market.report",
    "prediction_market.compare",
    "prediction_market.refresh",
    "prediction_market.propose",
  ],
  artifactMappings: {
    sourceInspection: "source_snapshot",
    marketContext: "market_context_snapshot",
    opportunity: "opportunity_artifact",
    report: "research_report",
    proposal: "proposal_artifact",
  },
  policyProfile: [
    "read_only_market_research_only",
    "no_wallet_private_keys",
    "no_bet_placement",
    "no_automatic_participation",
  ],
};
```

Modify `README.md` to append this line under the MVP/north-star section:

```md
The first follow-on sample vertical after funding-basis is World Cup + Polymarket research at the read-only research-and-recommendation layer.
```

- [ ] **Step 4: Validate the spec stub**

Run:

```bash
openspec validate "add-prediction-market-sample-vertical"
```

Expected: PASS.

- [ ] **Step 5: Commit checkpoint**

If working in a git checkout, run:

```bash
git add openspec/changes/add-prediction-market-sample-vertical packages/domain/src/vertical-plugin.ts README.md
git commit -m "spec: add prediction market sample vertical"
```

If not in a git repository, skip the commit and record the changed files.

---

### Task 11: Final evaluator verification and anti-drift checks

**Files:**
- No new production files expected.

- [ ] **Step 1: Run package tests**

Run:

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/domain
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/agent-kernel
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/storage
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
npm --prefix "/Users/griffith/Projects/Prism" run smoke:opportunity-explanation
npm --prefix "/Users/griffith/Projects/Prism" run smoke:opportunity-research-report
npm --prefix "/Users/griffith/Projects/Prism" run smoke:platform-research-loop
npm --prefix "/Users/griffith/Projects/Prism" run smoke:monitor-signal
```

Expected:

- all PASS;
- prediction-market smoke remains extension-required rather than pretending full support;
- monitor smoke emits a signal but not a proposal or action;
- report/explanation smokes remain artifact-backed and read-only.

- [ ] **Step 4: Run no-execution safety scan**

Run:

```bash
grep -RIn --exclude='*.tsbuildinfo' --exclude-dir='dist' --exclude-dir='node_modules' "place_order\|cancel_order\|create_order\|get_positions\|get_account_balances\|apiKey\|secret\|leverage\|margin\|withdraw\|transfer\|walletPrivateKey" "/Users/griffith/Projects/Prism/packages" "/Users/griffith/Projects/Prism/apps" "/Users/griffith/Projects/Prism/prism-docs" "/Users/griffith/Projects/Prism/docs/superpowers"
```

Expected: no runtime implementation hits for account/private/execution capability. Documentation hits that explicitly prohibit these behaviors are acceptable.

- [ ] **Step 5: Run provider-boundary scans**

Run:

```bash
grep -RIn --include='*.ts' "@agentkernel/tools" "/Users/griffith/Projects/Prism/packages/operations/src" "/Users/griffith/Projects/Prism/packages/operations/test" || true
grep -RIn --include='*.ts' "binance-usds-futures\|bitget-usdt-futures\|polymarket\|gamma\|clob" "/Users/griffith/Projects/Prism/packages/agent-kernel/src" "/Users/griffith/Projects/Prism/packages/agent-kernel/test" || true
```

Expected:

- operations remain provider-agnostic;
- agent-kernel guidance does not import raw provider clients;
- prediction-market references, if present in guidance, remain descriptive and extension-required rather than executable integration code.

- [ ] **Step 6: Run anti-drift docs check**

Read and confirm these files still align with the implementation:

```text
/Users/griffith/Projects/Prism/AGENTS.md
/Users/griffith/Projects/Prism/README.md
/Users/griffith/Projects/Prism/prism-docs/INFORMATION_ENERGY_MATERIAL_ARCHITECTURE.md
/Users/griffith/Projects/Prism/prism-docs/PRISM_OPPORTUNITY_OPERATING_CORE_ARCHITECTURE.md
```

Expected:

- no drift back to chat-first framing;
- no drift back to funding-only identity;
- no signal/proposal/execution collapse;
- no hidden refresh mutation of original artifacts.

- [ ] **Step 7: Produce final implementation handoff**

Report:

```json
{
  "implemented_tasks": [
    "platform blueprint OpenSpec change",
    "research state and artifact family contracts",
    "platform capability routing",
    "method exploration slice",
    "funding-basis platformization",
    "compare and refresh slices",
    "monitor and signal slices",
    "proposal and risk slices",
    "platform runtime guidance",
    "prediction-market sample vertical spec"
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
    "monitor_signal_boundary": "pass | fail",
    "refresh_history_preservation": "pass | fail"
  },
  "blockers": []
}
```

Fill `files_changed`, `tests_added_or_updated`, and `validations_run` with the actual evidence from implementation.

---

## Self-Review

Spec coverage:

- Platform blueprint contract: Task 1.
- Funding-basis platformization: Task 5.
- Method exploration: Task 4.
- Compare + refresh: Task 6.
- Monitor + signal: Task 7.
- Proposal + risk interfaces: Task 8.
- Prediction-market sample vertical cadence: Task 10.
- Runtime guidance and tool contract alignment: Task 3, Task 5, Task 8, Task 9.
- OpenSpec, tests, and verification: Task 1 and Task 11.
- Anti-drift rules: Task 1 and Task 11.

Placeholder scan:

- No `TBD` or `TODO` placeholders are intentionally left in this plan.
- Prediction-market remains a sample vertical spec/declaration stub in this plan, not a disguised implementation promise.
- Proposal/risk remain read-only and deterministic; no execution shortcut is left ambiguous.

Type consistency:

- The plan consistently uses `discover`, `explore_method`, `compare`, `refresh`, `monitor`, `emit_signal`, `propose`, and `evaluate_risk` as platform intents.
- Funding-basis and prediction-market remain vertical identifiers, not intent names.
- `ResearchState`, `MonitorDefinition`, `SignalArtifact`, `RefreshArtifact`, `ProposalArtifact`, and `RiskArtifact` are aligned with the approved spec terminology.
- Refresh always derives new objects and preserves original artifacts.
