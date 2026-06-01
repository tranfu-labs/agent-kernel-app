# Prism MVP1 Control-Plane Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Prism MVP1 control-plane subsystem so the broader MVP1 product can route requests safely and deterministically while structurally enforcing read-only boundaries, artifact-backed follow-up behavior, and bounded orchestration templates.

**Architecture:** Pi Agent remains the runtime/tool-loop engine. Prism owns deterministic control-plane resolution: vertical detection, intent classification, capability/path selection, operational policy enforcement, artifact-aware follow-up resolution, orchestration template selection, and evaluation gates. This document covers only the control-plane slice of MVP1, not the full Binance/Bitget funding-arbitrage execution-prep product scope.

**Tech Stack:** TypeScript, Node.js, npm workspaces, existing Prism domain/operations/agent-kernel packages, Node test runner, tsx, TypeScript project references, OpenSpec-guided contracts, deterministic routing inspired by Rasa evaluation discipline, semantic-router route-table ideas, compiler/router precedence rules, and policy-as-code invariant thinking.

---

## Scope split

This plan intentionally focuses on one coherent subsystem:

1. **Prism MVP1 control plane**
   - future-compatible intent resolution contract
   - Pi Agent vs Prism responsibility boundary
   - operational policy enforcement
   - artifact-aware follow-up resolution
   - bounded orchestration templates
   - regression, baseline, and acceptance gates

Within the updated MVP1 definition, this subsystem is a required foundation but **not** the full product. The full MVP1 target is now defined as a Binance + Bitget semi-automated arbitrage preparation system whose main closed-loop strategy is cross-exchange funding-rate arbitrage and whose output includes both human-readable trade-prep plans and structured execution-prep contracts.

This plan does **not** add:
- real execution
- wallet/private-key/account flows
- generalized LLM-first planner
- classifier-assisted routing in the MVP critical path
- new frontend work
- embedding-first routing
- execution-prep contract generation
- deterministic pre-trade risk gating for manual execution preparation
- full main-strategy acceptance for execution-prep outputs

## Mature reference baselines to use deliberately

These are reference baselines, not copy-paste architecture replacements:

1. **Rasa**
   - Use for: intent taxonomy discipline, labeled eval corpora, confusion analysis, regression gating, acceptance thresholds.
   - Do not use for: replacing Pi Agent or introducing a separate NLU/runtime stack.

2. **semantic-router**
   - Use for: declarative route-object structure, ordered fallback, explicit precedence.
   - Do not use for: embedding-first matching in the MVP critical path.

3. **Structured output classifier patterns**
   - Use for: future classifier-assist contracts with strict schema validation and abstain/fallback support.
   - Do not use for: replacing deterministic routing before baseline and holdout evals exist.

4. **Compiler / HTTP router precedence**
   - Use for: normalize -> detect vertical -> detect intent -> validate policy -> choose path -> emit runtime contract.
   - Do not use for: collapsing product semantics into unstructured regex sprawl.

5. **Policy-as-code invariant thinking**
   - Use for: “must never execute,” “must require clarification,” and “must remain extension-required” invariants.
   - Do not use for: adding a heavyweight policy engine before MVP1 contracts stabilize.

6. **LangGraph**
   - Use for: conceptual comparison only when discussing future stateful workflows.
   - Do not use for: MVP1 orchestration, because it adds framework weight before Prism’s control-plane contract is stable.

## Semantic layers

Use these terms consistently during implementation:

- **vertical** — which research domain owns the request
- **intent** — what the user conceptually wants
- **capability** — what the vertical is allowed to do semantically
- **path** — which user-facing workflow shape applies
- **operation** — which deterministic business action/tool entrypoint Prism selects
- **orchestration template** — how Pi Agent is allowed to proceed
- **policy** — what runtime/tool/artifact restrictions must be enforced

## Control-plane contract requirements

The main resolution result must not stop at “classification.” It must be executable as a runtime contract.

Required fields in the final `PlatformIntentResolution`:

- `contractVersion`
- `request.rawInput`
- `request.normalizedInput`
- `vertical`
- `intent`
- `capability`
- `path`
- `selectedOperation`
- `orchestrationTemplate`
- `readOnly`
- `extensionRequired`
- `clarificationRequired`
- `requiresArtifactContext`
- `requiredArtifactKind`
- `policy.profile`
- `policy.executionAllowed`
- `toolAccess.allowedTools`
- `toolAccess.blockedTools`
- `toolAccess.allowArtifactWrites`
- `toolAccess.mustClarifyBeforeAnyTool`
- `toolAccess.mustReturnBoundaryOnly`
- `fallbackBehavior`
- `boundaryExplanation`
- `determinismLevel`
- `reasoning.verticalSignals`
- `reasoning.intentSignals`
- `reasoning.notes`

## Acceptance bar

The implementation is acceptable only if all of the following are true:

1. Prism matches or exceeds the frozen raw Pi Agent baseline on the locked MVP1 routing acceptance set.
2. Funding-basis requests deterministically resolve to the correct platform path without requiring LLM guessing.
3. Prediction-market sample requests remain research-only and never imply execution or participation.
4. Read-only and no-execution policy invariants are enforced structurally through runtime tool access, not only in prompt prose.
5. Discover/explain/report/propose/risk/follow-up paths each have explicit orchestration templates and smoke coverage.
6. Routing regression, policy invariants, and baseline comparison are mandatory in local verification.
7. Unsupported or ambiguous requests degrade to `clarify_then_route`, `extension_required`, or explicit boundary response, never fabricated certainty.
8. Artifact-dependent follow-up requests degrade correctly when required context is missing.

## Frozen baseline policy

The raw Pi Agent comparison must be frozen before implementation work begins:

- fixed prompt/setup
- fixed model/runtime configuration
- fixed evaluation output schema
- repeated-run policy documented once and reused consistently
- comparison performed on the same acceptance and safety sets used for Prism

Do not change the baseline prompt/config during implementation except by creating a new versioned baseline report.

## Eval corpus requirements

Do not rely on a tiny happy-path fixture list.

Create four corpora:

1. **Development set**
   - 80–120 cases used during rule writing
2. **Acceptance set**
   - 60–100 locked cases for ship gating
3. **Safety set**
   - 20–40 action-adjacent, unsupported, and boundary cases
4. **Holdout set**
   - 20–40 locked cases not used during day-to-day rule tuning

Each case must include:
- `name`
- `input`
- `expected.vertical`
- `expected.intent`
- `expected.path`
- `expected.orchestrationTemplate`
- `expected.extensionRequired`
- `expected.clarificationRequired`
- `expected.requiresArtifactContext`
- `expected.requiredArtifactKind`
- `expected.fallbackBehavior`
- `expected.mustReturnBoundaryOnly`
- `tags` (vertical, ambiguity, safety, language, follow-up, negative, mixed-intent)
- `rationale`

## Metrics and no-ship philosophy

Do not judge routing quality by one tiny accuracy number.

Required metrics:
- vertical accuracy
- macro intent F1
- path accuracy
- orchestration-template accuracy
- clarify recall
- extension-required recall
- false-confidence rate
- safety-set misroute count

Ship only if the locked acceptance report shows:
- vertical accuracy >= 98%
- macro intent F1 >= raw Pi Agent baseline
- clarify recall >= raw Pi Agent baseline
- extension-required recall >= raw Pi Agent baseline
- false-confidence rate <= raw Pi Agent baseline
- safety-set misroute count = 0

## Failure policy

If acceptance fails:

1. **Do not ship.**
2. Categorize the failure into one of:
   - routing quality failure
   - baseline non-inferiority failure
   - policy safety failure
   - orchestration contract drift
   - follow-up/artifact resolution failure
   - regression coverage gap
   - smoke/runtime integration failure
3. Apply the corresponding remediation:
   - routing quality failure → add failing case first, repair deterministic rules, rerun the affected subset
   - baseline non-inferiority failure → stop expansion, inspect confusion deltas, improve rules or templates before rerunning the locked set
   - policy safety failure → block merge until invariants and tool-access restrictions pass
   - orchestration contract drift → tighten orchestration template mapping and runtime guidance
   - follow-up/artifact resolution failure → add artifact-context cases and repair follow-up binding rules
   - regression coverage gap → expand dev/acceptance/safety corpora before re-evaluating
   - smoke/runtime integration failure → fix integration before any further feature work
4. After every focused fix:
   - rerun the exact failed command first
   - rerun the affected eval subset
   - rerun the relevant safety subset
   - rerun the full gate only after focused checks pass
5. If deterministic routing still underperforms after two focused repair passes, freeze expansion work and introduce a **shadow-mode only** structured classifier-assist spike. Do not let classifier output influence live routing until it beats deterministic routing on targeted slices without violating invariants.

---

## Target file structure

### Create
- `packages/agent-kernel/src/platform-intent-resolution.ts` — main platform entrypoint that emits the executable control-plane contract.
- `packages/agent-kernel/src/platform-vertical-resolution.ts` — deterministic vertical resolver split by signal families.
- `packages/agent-kernel/src/platform-policy-gate.ts` — semantic policy gate.
- `packages/agent-kernel/src/platform-tool-access.ts` — compile policy + path + template into runtime tool restrictions.
- `packages/agent-kernel/src/platform-followup-resolution.ts` — artifact-aware follow-up resolver.
- `packages/agent-kernel/src/platform-orchestration-template.ts` — bounded orchestration-template selector.
- `packages/agent-kernel/src/path-guidance.ts` — path/template-scoped runtime guidance strings.
- `packages/agent-kernel/test/platform-intent-resolution.test.ts` — unit tests for contract fields.
- `packages/agent-kernel/test/platform-policy-gate.test.ts` — unit tests for policy invariants.
- `packages/agent-kernel/test/platform-tool-access.test.ts` — unit tests for enforced runtime restrictions.
- `packages/agent-kernel/test/platform-followup-resolution.test.ts` — unit tests for artifact-aware follow-up handling.
- `packages/agent-kernel/test/platform-routing-regression.test.ts` — development regression corpus tests.
- `packages/agent-kernel/test/platform-routing-acceptance.test.ts` — locked acceptance and safety set tests.
- `packages/agent-kernel/test/platform-baseline-comparison.test.ts` — non-inferiority comparison against frozen raw Pi Agent baseline output.
- `packages/agent-kernel/test/fixtures/platform-routing-cases.dev.ts` — development corpus.
- `packages/agent-kernel/test/fixtures/platform-routing-cases.acceptance.ts` — locked acceptance corpus.
- `packages/agent-kernel/test/fixtures/platform-routing-cases.safety.ts` — action-adjacent and boundary corpus.
- `packages/agent-kernel/test/fixtures/platform-routing-cases.holdout.ts` — locked holdout corpus.
- `packages/agent-kernel/test/fixtures/raw-pi-agent-baseline.v1.json` — frozen baseline routing results.
- `apps/agent-api/src/smoke-platform-control-plane.ts` — smoke command validating end-to-end routing outputs.

### Modify
- `packages/operations/src/platform-intent.ts` — make intent resolution vertical-aware while keeping deterministic-first behavior.
- `packages/operations/src/platform-capability-routing.ts` — accept pre-resolved intent and emit operation-level selection.
- `packages/agent-kernel/src/platform-intent-guidance.ts` — reduce to compatibility wrapper or re-export.
- `packages/agent-kernel/src/index.ts` — export new control-plane entrypoints.
- `packages/agent-kernel/src/register-prism-tools.ts` — attach template-scoped guidance and respect tool-access restrictions.
- `apps/agent-api/package.json` — add smoke command.
- `package.json` — add workspace smoke script and acceptance commands.

### Existing docs to consult during implementation
- `README.md`
- `prism-docs/README.md`
- `prism-docs/MVP_AGENT_KERNEL_PLAN.md`
- `docs/superpowers/specs/2026-05-31-vertical-pluggable-research-copilot-design.md`
- `docs/superpowers/plans/2026-05-31-vertical-pluggable-research-copilot.md`
- `openspec/changes/define-vertical-pluggable-research-copilot/`
- `openspec/changes/add-prediction-market-sample-vertical/`

### Task 1: Formalize the executable control-plane contract

**Files:**
- Create: `packages/agent-kernel/src/platform-intent-resolution.ts`
- Modify: `packages/agent-kernel/src/index.ts`
- Test: `packages/agent-kernel/test/platform-intent-resolution.test.ts`

- [ ] **Step 1: Write the failing contract test**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { resolvePlatformResearchRequest } from "../src/platform-intent-resolution.js";

test("resolvePlatformResearchRequest returns the executable MVP1 control-plane contract", () => {
  const result = resolvePlatformResearchRequest("Find Binance and Bitget funding opportunities for BTC and explain the best one");

  assert.equal(result.contractVersion, "mvp1.v1");
  assert.equal(typeof result.request.rawInput, "string");
  assert.equal(typeof result.request.normalizedInput, "string");
  assert.equal(result.vertical, "funding_basis");
  assert.equal(result.readOnly, true);
  assert.equal(result.determinismLevel, "rule_based");
  assert.equal(typeof result.selectedOperation, "string");
  assert.equal(typeof result.orchestrationTemplate, "string");
  assert.equal(typeof result.extensionRequired, "boolean");
  assert.equal(typeof result.clarificationRequired, "boolean");
  assert.equal(typeof result.requiresArtifactContext, "boolean");
  assert.ok(Array.isArray(result.policy.profile));
  assert.equal(result.policy.executionAllowed, false);
  assert.ok(Array.isArray(result.toolAccess.allowedTools));
  assert.ok(Array.isArray(result.toolAccess.blockedTools));
  assert.equal(typeof result.toolAccess.allowArtifactWrites, "boolean");
  assert.equal(typeof result.toolAccess.mustClarifyBeforeAnyTool, "boolean");
  assert.equal(typeof result.toolAccess.mustReturnBoundaryOnly, "boolean");
  assert.equal(typeof result.fallbackBehavior, "string");
  assert.equal(typeof result.boundaryExplanation, "string");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -w @agentkernel/agent-kernel -- platform-intent-resolution.test.ts`
Expected: FAIL with module or export not found for `platform-intent-resolution`.

- [ ] **Step 3: Write the minimal contract implementation**

```ts
import { resolvePlatformCapability } from "@agentkernel/operations";

import { resolvePlatformFollowup } from "./platform-followup-resolution.js";
import { resolvePlatformOrchestrationTemplate } from "./platform-orchestration-template.js";
import { resolvePlatformPolicy } from "./platform-policy-gate.js";
import { resolvePlatformToolAccess } from "./platform-tool-access.js";
import { resolvePlatformVertical } from "./platform-vertical-resolution.js";

export interface PlatformIntentResolution {
  contractVersion: "mvp1.v1";
  request: {
    rawInput: string;
    normalizedInput: string;
  };
  vertical: ReturnType<typeof resolvePlatformVertical>["vertical"];
  intent: ReturnType<typeof resolvePlatformCapability>["intent"];
  capability: ReturnType<typeof resolvePlatformCapability>["capability"];
  path: ReturnType<typeof resolvePlatformCapability>["path"];
  selectedOperation: string;
  orchestrationTemplate: string;
  readOnly: true;
  extensionRequired: boolean;
  clarificationRequired: boolean;
  requiresArtifactContext: boolean;
  requiredArtifactKind?: string;
  policy: {
    profile: string[];
    executionAllowed: false;
  };
  toolAccess: {
    allowedTools: string[];
    blockedTools: string[];
    allowArtifactWrites: boolean;
    mustClarifyBeforeAnyTool: boolean;
    mustReturnBoundaryOnly: boolean;
  };
  fallbackBehavior: "continue" | "clarify_then_route" | "extension_required" | "boundary_only";
  boundaryExplanation: string;
  determinismLevel: "rule_based";
  reasoning: {
    verticalSignals: string[];
    intentSignals: string[];
    notes: string[];
  };
}

function normalizeInput(input: string): string {
  return input.trim().replace(/\s+/g, " ").toLowerCase();
}

export function resolvePlatformResearchRequest(input: string): PlatformIntentResolution {
  const normalizedInput = normalizeInput(input);
  const verticalResolution = resolvePlatformVertical(input);
  const capability = resolvePlatformCapability({
    input: verticalResolution.rewrittenInput ?? input,
    vertical: verticalResolution.vertical,
  });
  const followup = resolvePlatformFollowup({
    input,
    intent: capability.intent,
    path: capability.path,
  });
  const clarificationRequired = capability.intent === "general";
  const policy = resolvePlatformPolicy({
    vertical: verticalResolution.vertical,
    capability: capability.capability,
    path: capability.path,
    requiresArtifactContext: followup.requiresArtifactContext,
  });
  const orchestrationTemplate = resolvePlatformOrchestrationTemplate({
    intent: capability.intent,
    path: capability.path,
    extensionRequired: policy.extensionRequired,
    clarificationRequired,
    requiresArtifactContext: followup.requiresArtifactContext,
  });
  const toolAccess = resolvePlatformToolAccess({
    vertical: verticalResolution.vertical,
    path: capability.path,
    orchestrationTemplate,
    extensionRequired: policy.extensionRequired,
    clarificationRequired,
  });

  return {
    contractVersion: "mvp1.v1",
    request: {
      rawInput: input,
      normalizedInput,
    },
    vertical: verticalResolution.vertical,
    intent: capability.intent,
    capability: capability.capability,
    path: capability.path,
    selectedOperation: capability.operation,
    orchestrationTemplate,
    readOnly: true,
    extensionRequired: policy.extensionRequired,
    clarificationRequired,
    requiresArtifactContext: followup.requiresArtifactContext,
    requiredArtifactKind: followup.requiredArtifactKind,
    policy: {
      profile: policy.profile,
      executionAllowed: false,
    },
    toolAccess,
    fallbackBehavior: toolAccess.mustReturnBoundaryOnly
      ? "boundary_only"
      : policy.extensionRequired
        ? "extension_required"
        : clarificationRequired
          ? "clarify_then_route"
          : "continue",
    boundaryExplanation: policy.boundaryExplanation,
    determinismLevel: "rule_based",
    reasoning: {
      verticalSignals: verticalResolution.signals,
      intentSignals: capability.reasoning ?? [],
      notes: [...verticalResolution.notes, ...followup.notes],
    },
  };
}
```

- [ ] **Step 4: Export the new entrypoint**

```ts
export * from "./platform-intent-resolution.js";
```

- [ ] **Step 5: Run the contract test to verify it passes**

Run: `npm run test -w @agentkernel/agent-kernel -- platform-intent-resolution.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/agent-kernel/src/platform-intent-resolution.ts packages/agent-kernel/src/index.ts packages/agent-kernel/test/platform-intent-resolution.test.ts
git commit -m "feat: add executable platform intent resolution contract"
```

### Task 2: Add deterministic vertical resolution and operation-aware routing

**Files:**
- Create: `packages/agent-kernel/src/platform-vertical-resolution.ts`
- Modify: `packages/operations/src/platform-intent.ts`
- Modify: `packages/operations/src/platform-capability-routing.ts`
- Test: `packages/agent-kernel/test/platform-intent-resolution.test.ts`

- [ ] **Step 1: Extend the failing tests with vertical and operation-aware cases**

```ts
test("prediction-market sample requests route to a research-only vertical without pretending execution support", () => {
  const result = resolvePlatformResearchRequest("Help me research the World Cup final on Polymarket and explain whether it is worth watching");

  assert.equal(result.vertical, "prediction_market");
  assert.equal(result.extensionRequired, true);
  assert.equal(result.readOnly, true);
  assert.equal(result.toolAccess.mustReturnBoundaryOnly, true);
});

test("generic input remains general and requests clarification before any tool call", () => {
  const result = resolvePlatformResearchRequest("Help me make money fast");

  assert.equal(result.vertical, "general");
  assert.equal(result.clarificationRequired, true);
  assert.equal(result.toolAccess.mustClarifyBeforeAnyTool, true);
  assert.equal(result.fallbackBehavior, "clarify_then_route");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -w @agentkernel/agent-kernel -- platform-intent-resolution.test.ts`
Expected: FAIL because vertical routing and operational fallback behavior do not exist yet.

- [ ] **Step 3: Implement signal-family-based vertical resolution**

```ts
export interface PlatformVerticalResolution {
  vertical: "funding_basis" | "prediction_market" | "general";
  rewrittenInput?: string;
  signals: string[];
  notes: string[];
}

const FUNDING_DOMAIN_SIGNALS = [/funding/i, /basis/i, /arbitrage/i, /永续/i, /资金费率/i, /套利/i];
const FUNDING_VENUE_SIGNALS = [/binance/i, /bitget/i, /perp/i];
const PREDICTION_DOMAIN_SIGNALS = [/polymarket/i, /prediction market/i, /world cup/i, /世界杯/i];
const PREDICTION_CONTEXT_SIGNALS = [/odds/i, /赛程/i, /球队/i];

export function resolvePlatformVertical(input: string): PlatformVerticalResolution {
  const fundingSignals = [...FUNDING_DOMAIN_SIGNALS, ...FUNDING_VENUE_SIGNALS]
    .filter((pattern) => pattern.test(input))
    .map((pattern) => pattern.source);

  if (fundingSignals.length > 0) {
    return {
      vertical: "funding_basis",
      signals: fundingSignals,
      notes: ["Matched funding-basis domain and venue signals."],
    };
  }

  const predictionSignals = [...PREDICTION_DOMAIN_SIGNALS, ...PREDICTION_CONTEXT_SIGNALS]
    .filter((pattern) => pattern.test(input))
    .map((pattern) => pattern.source);

  if (predictionSignals.length > 0) {
    return {
      vertical: "prediction_market",
      rewrittenInput: "inspect source prediction market research",
      signals: predictionSignals,
      notes: ["Prediction-market sample vertical stays research-only in MVP1."],
    };
  }

  return {
    vertical: "general",
    signals: [],
    notes: ["No vertical-specific signals matched."],
  };
}
```

- [ ] **Step 4: Make platform intent resolution vertical-aware and operation-aware**

```ts
export interface ResolvePlatformIntentInput {
  input: string;
  vertical: "funding_basis" | "prediction_market" | "general";
}

export function resolvePlatformIntent({ input, vertical }: ResolvePlatformIntentInput): PlatformIntent {
  if (/extension required|needs? (an )?extension|unsupported|暂不支持|扩展/i.test(input)) {
    return "extension_required";
  }
  if (vertical === "prediction_market" && /watch|worth watching|关注/i.test(input)) {
    return "inspect_source";
  }
  if (/monitor|alert|跟踪|监控/i.test(input)) return "monitor";
  if (/signal|变化|告警/i.test(input)) return "emit_signal";
  if (/proposal|建议方案|提案/i.test(input)) return "propose";
  if (/risk|风险/i.test(input)) return "evaluate_risk";
  if (/compare|对比/i.test(input)) return "compare";
  if (/refresh|更新|刷新/i.test(input)) return "refresh";
  if (/report|报告/i.test(input)) return "report";
  if (/explain|解释|why|candidate/i.test(input)) return "explain";
  if (/method|方法|路径/i.test(input)) return "explore_method";
  if (/source|api|规则|来源/i.test(input)) return "inspect_source";
  if (/discover|find|scan|机会|研究/i.test(input)) return "discover";
  return "general";
}
```

```ts
return {
  vertical,
  intent,
  capability,
  path,
  operation: `${vertical}.${intent}`,
  reasoning: [intent],
};
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test -w @agentkernel/agent-kernel -- platform-intent-resolution.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/agent-kernel/src/platform-vertical-resolution.ts packages/operations/src/platform-intent.ts packages/operations/src/platform-capability-routing.ts packages/agent-kernel/test/platform-intent-resolution.test.ts
git commit -m "feat: add deterministic operation-aware routing"
```

### Task 3: Enforce policy structurally through runtime tool access

**Files:**
- Create: `packages/agent-kernel/src/platform-policy-gate.ts`
- Create: `packages/agent-kernel/src/platform-tool-access.ts`
- Test: `packages/agent-kernel/test/platform-policy-gate.test.ts`
- Test: `packages/agent-kernel/test/platform-tool-access.test.ts`

- [ ] **Step 1: Write the failing policy and tool-access tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { resolvePlatformPolicy } from "../src/platform-policy-gate.js";
import { resolvePlatformToolAccess } from "../src/platform-tool-access.js";

test("funding-basis policy remains read-only and proposal-before-execution", () => {
  const result = resolvePlatformPolicy({
    vertical: "funding_basis",
    capability: "funding_basis.discover",
    path: "path_discover",
    requiresArtifactContext: false,
  });

  assert.equal(result.extensionRequired, false);
  assert.equal(result.executionAllowed, false);
  assert.ok(result.profile.includes("read_only_research"));
  assert.ok(result.profile.includes("proposal_before_execution"));
});

test("general clarification requests block all tool use until clarified", () => {
  const result = resolvePlatformToolAccess({
    vertical: "general",
    path: "path_general",
    orchestrationTemplate: "clarify_before_route",
    extensionRequired: false,
    clarificationRequired: true,
  });

  assert.equal(result.mustClarifyBeforeAnyTool, true);
  assert.equal(result.allowedTools.length, 0);
});

test("prediction-market sample requests return boundary-only access", () => {
  const result = resolvePlatformToolAccess({
    vertical: "prediction_market",
    path: "path_inspect_source",
    orchestrationTemplate: "extension_boundary",
    extensionRequired: true,
    clarificationRequired: false,
  });

  assert.equal(result.mustReturnBoundaryOnly, true);
  assert.ok(result.blockedTools.includes("place_order"));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -w @agentkernel/agent-kernel -- platform-policy-gate.test.ts platform-tool-access.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement semantic policy gate**

```ts
export interface ResolvePlatformPolicyInput {
  vertical: "funding_basis" | "prediction_market" | "general";
  capability: string;
  path: string;
  requiresArtifactContext: boolean;
}

export interface PlatformPolicyResolution {
  profile: string[];
  extensionRequired: boolean;
  executionAllowed: false;
  boundaryExplanation: string;
}

export function resolvePlatformPolicy(input: ResolvePlatformPolicyInput): PlatformPolicyResolution {
  if (input.vertical === "funding_basis") {
    return {
      profile: ["read_only_research", "tool_backed_facts_only", "proposal_before_execution"],
      extensionRequired: false,
      executionAllowed: false,
      boundaryExplanation: "Funding-basis MVP1 remains read-only and proposal-before-execution.",
    };
  }

  if (input.vertical === "prediction_market") {
    return {
      profile: ["read_only_market_research_only", "no_wallet_private_keys", "no_bet_placement", "no_automatic_participation"],
      extensionRequired: true,
      executionAllowed: false,
      boundaryExplanation: "Prediction-market sample vertical is extension-required and does not expose participation flows.",
    };
  }

  return {
    profile: ["read_only_research", "clarify_before_specialized_work"],
    extensionRequired: false,
    executionAllowed: false,
    boundaryExplanation: "General requests must be clarified before specialized routing.",
  };
}
```

- [ ] **Step 4: Implement operational tool access**

```ts
export interface ResolvePlatformToolAccessInput {
  vertical: "funding_basis" | "prediction_market" | "general";
  path: string;
  orchestrationTemplate: string;
  extensionRequired: boolean;
  clarificationRequired: boolean;
}

export function resolvePlatformToolAccess(input: ResolvePlatformToolAccessInput) {
  if (input.extensionRequired) {
    return {
      allowedTools: [],
      blockedTools: ["place_order", "cancel_order", "get_positions", "get_account_balances"],
      allowArtifactWrites: false,
      mustClarifyBeforeAnyTool: false,
      mustReturnBoundaryOnly: true,
    };
  }

  if (input.clarificationRequired) {
    return {
      allowedTools: [],
      blockedTools: ["scan_funding_basis_arbitrage", "place_order", "cancel_order"],
      allowArtifactWrites: false,
      mustClarifyBeforeAnyTool: true,
      mustReturnBoundaryOnly: false,
    };
  }

  return {
    allowedTools: [
      "scan_funding_basis_arbitrage",
      "explain_opportunity_artifact",
      "write_opportunity_research_report",
      "get_artifact",
      "save_opportunity_artifact",
    ],
    blockedTools: ["place_order", "cancel_order", "get_positions", "get_account_balances"],
    allowArtifactWrites: true,
    mustClarifyBeforeAnyTool: false,
    mustReturnBoundaryOnly: false,
  };
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test -w @agentkernel/agent-kernel -- platform-policy-gate.test.ts platform-tool-access.test.ts platform-intent-resolution.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/agent-kernel/src/platform-policy-gate.ts packages/agent-kernel/src/platform-tool-access.ts packages/agent-kernel/test/platform-policy-gate.test.ts packages/agent-kernel/test/platform-tool-access.test.ts packages/agent-kernel/test/platform-intent-resolution.test.ts
git commit -m "feat: enforce runtime policy through tool access"
```

### Task 4: Add artifact-aware follow-up resolution

**Files:**
- Create: `packages/agent-kernel/src/platform-followup-resolution.ts`
- Test: `packages/agent-kernel/test/platform-followup-resolution.test.ts`
- Test: `packages/agent-kernel/test/platform-intent-resolution.test.ts`

- [ ] **Step 1: Write the failing follow-up tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { resolvePlatformFollowup } from "../src/platform-followup-resolution.js";

test("explain requests require opportunity artifact context", () => {
  const result = resolvePlatformFollowup({
    input: "Explain the first one",
    intent: "explain",
    path: "path_explain",
  });

  assert.equal(result.requiresArtifactContext, true);
  assert.equal(result.requiredArtifactKind, "opportunity_artifact");
});

test("report requests require artifact context", () => {
  const result = resolvePlatformFollowup({
    input: "Write a report about that",
    intent: "report",
    path: "path_report",
  });

  assert.equal(result.requiresArtifactContext, true);
  assert.equal(result.requiredArtifactKind, "artifact_collection");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -w @agentkernel/agent-kernel -- platform-followup-resolution.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement follow-up/artifact resolution**

```ts
export interface ResolvePlatformFollowupInput {
  input: string;
  intent: string;
  path: string;
}

export function resolvePlatformFollowup(input: ResolvePlatformFollowupInput) {
  if (input.path === "path_explain") {
    return {
      requiresArtifactContext: true,
      requiredArtifactKind: "opportunity_artifact",
      notes: ["Explain path must bind to an existing opportunity artifact."],
    };
  }

  if (input.path === "path_report") {
    return {
      requiresArtifactContext: true,
      requiredArtifactKind: "artifact_collection",
      notes: ["Report path must gather artifacts before synthesis."],
    };
  }

  if (input.path === "path_propose") {
    return {
      requiresArtifactContext: true,
      requiredArtifactKind: "opportunity_artifact",
      notes: ["Proposal path starts from an artifact-backed research object."],
    };
  }

  if (input.path === "path_evaluate_risk") {
    return {
      requiresArtifactContext: true,
      requiredArtifactKind: "proposal_artifact",
      notes: ["Risk evaluation requires a proposal artifact."],
    };
  }

  return {
    requiresArtifactContext: false,
    requiredArtifactKind: undefined,
    notes: ["No artifact context required for this path."],
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -w @agentkernel/agent-kernel -- platform-followup-resolution.test.ts platform-intent-resolution.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/agent-kernel/src/platform-followup-resolution.ts packages/agent-kernel/test/platform-followup-resolution.test.ts packages/agent-kernel/test/platform-intent-resolution.test.ts
git commit -m "feat: add artifact-aware follow-up resolution"
```

### Task 5: Replace coarse modes with bounded orchestration templates

**Files:**
- Create: `packages/agent-kernel/src/platform-orchestration-template.ts`
- Create: `packages/agent-kernel/src/path-guidance.ts`
- Modify: `packages/agent-kernel/src/register-prism-tools.ts`
- Modify: `packages/agent-kernel/src/platform-intent-guidance.ts`
- Test: `packages/agent-kernel/test/register-prism-tools.test.ts`

- [ ] **Step 1: Write the failing runtime-guidance test**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { createPrismRuntimeContext, createPrismToolDefinitions } from "../src/index.js";

test("tool guidance references bounded orchestration templates", () => {
  const context = createPrismRuntimeContext();
  const tools = createPrismToolDefinitions(context);
  const scanner = tools.find((tool) => tool.name === "scan_funding_basis_arbitrage");

  assert.ok(scanner);
  assert.match(scanner!.description, /discover_with_artifact/);
  assert.match(scanner!.description, /artifact-backed/);
  assert.match(scanner!.description, /read-only/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -w @agentkernel/agent-kernel -- register-prism-tools.test.ts`
Expected: FAIL because template-scoped guidance strings are not present.

- [ ] **Step 3: Implement orchestration-template selection**

```ts
export function resolvePlatformOrchestrationTemplate(input: {
  intent: string;
  path: string;
  extensionRequired: boolean;
  clarificationRequired: boolean;
  requiresArtifactContext: boolean;
}):
  | "lookup_once"
  | "discover_with_artifact"
  | "explain_from_artifact"
  | "report_from_artifacts"
  | "proposal_read_only"
  | "risk_check_deterministic"
  | "clarify_before_route"
  | "extension_boundary" {
  if (input.extensionRequired) return "extension_boundary";
  if (input.clarificationRequired) return "clarify_before_route";
  if (input.path === "path_discover") return "discover_with_artifact";
  if (input.path === "path_explain") return "explain_from_artifact";
  if (input.path === "path_report") return "report_from_artifacts";
  if (input.path === "path_propose") return "proposal_read_only";
  if (input.path === "path_evaluate_risk") return "risk_check_deterministic";
  return "lookup_once";
}
```

- [ ] **Step 4: Create explicit template/path guidance definitions**

```ts
export const PATH_GUIDANCE = {
  discover_with_artifact: [
    "Use tool-backed market facts before ranking candidates.",
    "Save OpportunityArtifact outputs before returning recommendations.",
    "This is an artifact-backed, read-only discover_with_artifact workflow.",
  ],
  explain_from_artifact: [
    "Load the referenced artifact before explaining the opportunity.",
    "Refresh stale facts before explaining risk or invalidation conditions.",
    "Do not provide execution instructions.",
  ],
  report_from_artifacts: [
    "Gather evidence from saved artifacts and summarize it into a report.",
    "Keep the report traceable to tool-backed facts.",
  ],
  proposal_read_only: [
    "Proposals remain read-only and require later deterministic risk checks.",
    "Do not imply order placement or automatic action.",
  ],
  risk_check_deterministic: [
    "Risk evaluation is deterministic and never authorizes execution.",
  ],
  clarify_before_route: [
    "Ask for clarification before any specialized tool call.",
  ],
  extension_boundary: [
    "Return the boundary response and do not enter tool execution.",
  ],
} as const;
```

- [ ] **Step 5: Attach template guidance inside tool registration and keep legacy wrapper as compatibility-only**

```ts
const scannerDescription = [
  "Scan Binance/Bitget funding-basis opportunities.",
  "This tool is the canonical funding_basis.discover implementation for path_discover.",
  ...PATH_GUIDANCE.discover_with_artifact,
].join(" ");
```

```ts
export { resolvePlatformResearchRequest } from "./platform-intent-resolution.js";
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm run test -w @agentkernel/agent-kernel -- register-prism-tools.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/agent-kernel/src/platform-orchestration-template.ts packages/agent-kernel/src/path-guidance.ts packages/agent-kernel/src/register-prism-tools.ts packages/agent-kernel/src/platform-intent-guidance.ts packages/agent-kernel/test/register-prism-tools.test.ts
git commit -m "feat: add bounded orchestration templates"
```

### Task 6: Build versioned routing corpora and deterministic regression harness

**Files:**
- Create: `packages/agent-kernel/test/fixtures/platform-routing-cases.dev.ts`
- Create: `packages/agent-kernel/test/fixtures/platform-routing-cases.acceptance.ts`
- Create: `packages/agent-kernel/test/fixtures/platform-routing-cases.safety.ts`
- Create: `packages/agent-kernel/test/fixtures/platform-routing-cases.holdout.ts`
- Create: `packages/agent-kernel/test/platform-routing-regression.test.ts`
- Create: `packages/agent-kernel/test/platform-routing-acceptance.test.ts`

- [ ] **Step 1: Write the development corpus with representative coverage**

```ts
export const PLATFORM_ROUTING_CASES_DEV = [
  {
    name: "funding discover english",
    input: "Find BTC and ETH funding opportunities on Binance and Bitget",
    expected: {
      vertical: "funding_basis",
      intent: "discover",
      path: "path_discover",
      orchestrationTemplate: "discover_with_artifact",
      extensionRequired: false,
      clarificationRequired: false,
      requiresArtifactContext: false,
      requiredArtifactKind: undefined,
      fallbackBehavior: "continue",
      mustReturnBoundaryOnly: false,
    },
    tags: ["funding", "english", "discover"],
    rationale: "Canonical funding discovery prompt.",
  },
  {
    name: "funding explain follow-up",
    input: "Explain the first one",
    expected: {
      vertical: "general",
      intent: "explain",
      path: "path_explain",
      orchestrationTemplate: "explain_from_artifact",
      extensionRequired: false,
      clarificationRequired: false,
      requiresArtifactContext: true,
      requiredArtifactKind: "opportunity_artifact",
      fallbackBehavior: "continue",
      mustReturnBoundaryOnly: false,
    },
    tags: ["followup", "artifact", "english"],
    rationale: "Follow-up explain should require artifact context.",
  },
  {
    name: "prediction-market sample research",
    input: "Help me research the World Cup final market on Polymarket",
    expected: {
      vertical: "prediction_market",
      intent: "inspect_source",
      path: "path_inspect_source",
      orchestrationTemplate: "extension_boundary",
      extensionRequired: true,
      clarificationRequired: false,
      requiresArtifactContext: false,
      requiredArtifactKind: undefined,
      fallbackBehavior: "boundary_only",
      mustReturnBoundaryOnly: true,
    },
    tags: ["prediction_market", "boundary", "english"],
    rationale: "Prediction-market sample stays extension-required.",
  },
] as const;
```

- [ ] **Step 2: Write the regression tests over development and locked corpora**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { resolvePlatformResearchRequest } from "../src/platform-intent-resolution.js";
import { PLATFORM_ROUTING_CASES_DEV } from "./fixtures/platform-routing-cases.dev.js";

for (const scenario of PLATFORM_ROUTING_CASES_DEV) {
  test(`routing regression: ${scenario.name}`, () => {
    const result = resolvePlatformResearchRequest(scenario.input);

    assert.equal(result.vertical, scenario.expected.vertical);
    assert.equal(result.intent, scenario.expected.intent);
    assert.equal(result.path, scenario.expected.path);
    assert.equal(result.orchestrationTemplate, scenario.expected.orchestrationTemplate);
    assert.equal(result.extensionRequired, scenario.expected.extensionRequired);
    assert.equal(result.clarificationRequired, scenario.expected.clarificationRequired);
    assert.equal(result.requiresArtifactContext, scenario.expected.requiresArtifactContext);
    assert.equal(result.requiredArtifactKind, scenario.expected.requiredArtifactKind);
    assert.equal(result.fallbackBehavior, scenario.expected.fallbackBehavior);
    assert.equal(result.toolAccess.mustReturnBoundaryOnly, scenario.expected.mustReturnBoundaryOnly);
  });
}
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run test -w @agentkernel/agent-kernel -- platform-routing-regression.test.ts platform-routing-acceptance.test.ts`
Expected: FAIL until the deterministic routing stack matches the corpora.

- [ ] **Step 4: Repair routing only inside deterministic resolvers and template selectors**

```ts
// Keep all routing repairs inside deterministic control-plane modules.
// Do not patch expected outputs in smoke scripts.
```

- [ ] **Step 5: Run the regression suite to verify it passes**

Run: `npm run test -w @agentkernel/agent-kernel -- platform-routing-regression.test.ts platform-routing-acceptance.test.ts platform-intent-resolution.test.ts platform-policy-gate.test.ts platform-tool-access.test.ts platform-followup-resolution.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/agent-kernel/test/fixtures/platform-routing-cases.dev.ts packages/agent-kernel/test/fixtures/platform-routing-cases.acceptance.ts packages/agent-kernel/test/fixtures/platform-routing-cases.safety.ts packages/agent-kernel/test/fixtures/platform-routing-cases.holdout.ts packages/agent-kernel/test/platform-routing-regression.test.ts packages/agent-kernel/test/platform-routing-acceptance.test.ts packages/agent-kernel/src/platform-intent-resolution.ts packages/agent-kernel/src/platform-vertical-resolution.ts packages/agent-kernel/src/platform-followup-resolution.ts packages/agent-kernel/src/platform-orchestration-template.ts packages/agent-kernel/src/platform-policy-gate.ts packages/agent-kernel/src/platform-tool-access.ts packages/operations/src/platform-intent.ts packages/operations/src/platform-capability-routing.ts
git commit -m "test: add versioned routing corpora and regression gates"
```

### Task 7: Add frozen raw Pi Agent baseline comparison

**Files:**
- Create: `packages/agent-kernel/test/fixtures/raw-pi-agent-baseline.v1.json`
- Create: `packages/agent-kernel/test/platform-baseline-comparison.test.ts`

- [ ] **Step 1: Create the frozen baseline result schema and fixture**

```json
[
  {
    "name": "funding discover english",
    "vertical": "funding_basis",
    "intent": "discover",
    "path": "path_discover",
    "clarificationRequired": false,
    "extensionRequired": false
  },
  {
    "name": "prediction-market sample research",
    "vertical": "prediction_market",
    "intent": "inspect_source",
    "path": "path_inspect_source",
    "clarificationRequired": false,
    "extensionRequired": true
  }
]
```

- [ ] **Step 2: Write the failing non-inferiority test**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import baseline from "./fixtures/raw-pi-agent-baseline.v1.json" with { type: "json" };
import { PLATFORM_ROUTING_CASES_ACCEPTANCE } from "./fixtures/platform-routing-cases.acceptance.js";
import { resolvePlatformResearchRequest } from "../src/platform-intent-resolution.js";

test("Prism routing matches or exceeds the frozen raw Pi Agent baseline on locked acceptance cases", () => {
  const baselineMap = new Map(baseline.map((item) => [item.name, item]));

  for (const scenario of PLATFORM_ROUTING_CASES_ACCEPTANCE) {
    const result = resolvePlatformResearchRequest(scenario.input);
    const baselineResult = baselineMap.get(scenario.name);

    assert.ok(baselineResult, `Missing baseline result for ${scenario.name}`);
    assert.equal(result.vertical, scenario.expected.vertical);
    assert.equal(result.extensionRequired, scenario.expected.extensionRequired);
    assert.equal(result.clarificationRequired, scenario.expected.clarificationRequired);
    assert.equal(result.vertical, baselineResult.vertical);
  }
});
```

- [ ] **Step 3: Run the baseline-comparison test to verify it fails before the baseline is complete**

Run: `npm run test -w @agentkernel/agent-kernel -- platform-baseline-comparison.test.ts`
Expected: FAIL until the frozen baseline and acceptance corpus are aligned.

- [ ] **Step 4: Complete the baseline fixture and rerun the comparison**

```text
Populate the full acceptance-set baseline results before trusting this test.
Do not weaken the acceptance set to match Prism.
```

- [ ] **Step 5: Run the baseline-comparison test to verify it passes**

Run: `npm run test -w @agentkernel/agent-kernel -- platform-baseline-comparison.test.ts platform-routing-acceptance.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/agent-kernel/test/fixtures/raw-pi-agent-baseline.v1.json packages/agent-kernel/test/platform-baseline-comparison.test.ts packages/agent-kernel/test/fixtures/platform-routing-cases.acceptance.ts
git commit -m "test: add frozen raw Pi Agent baseline comparison"
```

### Task 8: Add smoke validation and full local acceptance gate

**Files:**
- Create: `apps/agent-api/src/smoke-platform-control-plane.ts`
- Modify: `apps/agent-api/package.json`
- Modify: `package.json`

- [ ] **Step 1: Write the smoke script with path, template, and boundary checks**

```ts
import {
  createPrismRuntimeContext,
  createPrismToolDefinitions,
  resolvePlatformResearchRequest,
} from "@agentkernel/agent-kernel";

const context = createPrismRuntimeContext();
const tools = createPrismToolDefinitions(context);
const scenarios = [
  resolvePlatformResearchRequest("Find Binance/Bitget funding opportunities and report them"),
  resolvePlatformResearchRequest("Explain the best funding candidate"),
  resolvePlatformResearchRequest("Help me research the World Cup final on Polymarket"),
  resolvePlatformResearchRequest("Help me make money fast"),
];

if (tools.length === 0) {
  throw new Error("Expected registered Prism tools");
}

if (scenarios[0].vertical !== "funding_basis" || scenarios[0].path !== "path_discover" || scenarios[0].orchestrationTemplate !== "discover_with_artifact") {
  throw new Error("Funding discover scenario failed");
}

if (scenarios[1].path !== "path_explain" || scenarios[1].requiresArtifactContext !== true) {
  throw new Error("Explain scenario did not require artifact context");
}

if (scenarios[2].vertical !== "prediction_market" || scenarios[2].toolAccess.mustReturnBoundaryOnly !== true) {
  throw new Error("Prediction-market scenario did not remain boundary-only");
}

if (scenarios[3].toolAccess.mustClarifyBeforeAnyTool !== true) {
  throw new Error("General scenario did not request clarification before tool use");
}

console.log(JSON.stringify({
  toolCount: tools.length,
  scenarios,
}, null, 2));
```

- [ ] **Step 2: Register the smoke and acceptance commands**

```json
{
  "scripts": {
    "smoke:platform-control-plane": "node dist/smoke-platform-control-plane.js"
  }
}
```

```json
{
  "scripts": {
    "smoke:platform-control-plane": "npm run build && npm run smoke:platform-control-plane -w @agentkernel/agent-api",
    "test:platform-acceptance": "npm run test -w @agentkernel/agent-kernel -- platform-routing-acceptance.test.ts platform-baseline-comparison.test.ts"
  }
}
```

- [ ] **Step 3: Run the smoke to verify it passes**

Run: `npm run smoke:platform-control-plane`
Expected: PASS and JSON output showing discover, explain, boundary-only, and clarify-first scenarios.

- [ ] **Step 4: Run the full local acceptance gate**

Run: `npm run test -w @agentkernel/agent-kernel && npm run test:platform-acceptance && npm run typecheck && npm run smoke:funding-basis-copilot && npm run smoke:opportunity-explanation && npm run smoke:opportunity-research-report && npm run smoke:platform-research-loop && npm run smoke:platform-control-plane`
Expected: PASS for every command.

- [ ] **Step 5: Record acceptance outcome and enforce failure policy**

```text
If any command fails:
1. Stop feature expansion immediately.
2. Classify the failure as routing quality, baseline non-inferiority, policy safety, orchestration drift, follow-up resolution, regression gap, or smoke integration.
3. Add or repair tests before changing implementation.
4. Rerun the exact failed command first.
5. Rerun the affected subset and safety subset.
6. Only rerun the full gate after focused fixes pass.
```

- [ ] **Step 6: Commit**

```bash
git add apps/agent-api/src/smoke-platform-control-plane.ts apps/agent-api/package.json package.json
git commit -m "test: add platform control-plane smoke and acceptance gate"
```

### Task 9: Add explicit release checklist and no-ship thresholds

**Files:**
- Modify: `docs/superpowers/plans/2026-05-31-prism-mvp1-control-plane-hardening.md`

- [ ] **Step 1: Add the final release checklist section to this plan**

```md
## Final release checklist

- [ ] Development, acceptance, safety, and holdout routing corpora all exist.
- [ ] Frozen raw Pi Agent baseline fixture exists and is versioned.
- [ ] Routing regression cases all pass.
- [ ] Baseline non-inferiority test passes.
- [ ] Policy invariants all pass.
- [ ] Tool-access enforcement tests all pass.
- [ ] Follow-up/artifact-resolution tests all pass.
- [ ] Funding-basis discover/explain/report smokes pass.
- [ ] Prediction-market sample remains extension-required and boundary-only.
- [ ] No execution-like tools were exposed.
- [ ] Unsupported or vague requests degrade structurally, not rhetorically.
```

- [ ] **Step 2: Add the no-ship thresholds explicitly**

```md
## No-ship thresholds

Do not ship if any of the following are true:

- vertical accuracy is below 98% on the locked acceptance set;
- macro intent F1 is below the frozen raw Pi Agent baseline;
- clarify recall is below the frozen raw Pi Agent baseline;
- extension-required recall is below the frozen raw Pi Agent baseline;
- false-confidence rate is above the frozen raw Pi Agent baseline;
- any policy test allows execution or removes read-only constraints;
- prediction-market sample requests are routed as if live participation exists;
- safety-set misroute count is greater than 0;
- smoke commands pass only because tests were weakened rather than routing improved.
```

- [ ] **Step 3: Save the updated plan and verify it contains the release checklist**

Run: `grep -n "Final release checklist\|No-ship thresholds" docs/superpowers/plans/2026-05-31-prism-mvp1-control-plane-hardening.md`
Expected: prints both section names with line numbers.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/2026-05-31-prism-mvp1-control-plane-hardening.md
git commit -m "docs: strengthen MVP1 release and no-ship criteria"
```

## Quality enforcement model

1. **Design quality**
   - Prism owns contracts, Pi Agent owns tool execution.
   - No prompt-only policy enforcement for safety-critical boundaries.
   - Control-plane output must be executable as runtime contract.

2. **Implementation quality**
   - TDD per task.
   - Small commits.
   - No speculative classifier integration in the critical path.
   - Add failing eval cases before changing routing rules.

3. **Verification quality**
   - unit tests for routing, policy, tool access, and follow-up resolution
   - versioned dev/acceptance/safety/holdout corpora
   - frozen raw Pi Agent baseline comparison
   - smoke commands for product paths
   - full typecheck before acceptance

4. **Acceptance quality**
   - measured pass/fail thresholds
   - baseline non-inferiority gates
   - safety-set zero-misroute requirement
   - focused remediation before full retest

## Why this upgraded plan is high-efficiency and high-quality

- It does not duplicate Pi Agent’s runtime strengths.
- It adds only the Prism-specific control-plane logic that Pi Agent cannot know by itself.
- It turns “better than raw prompting” into a measurable baseline-comparison problem rather than a vibes problem.
- It upgrades policy from descriptive labels into operational runtime restrictions.
- It prevents follow-up turns from drifting by making artifact-aware resolution first-class.
- It replaces vague orchestration with bounded templates that Pi Agent can execute consistently.
- It blocks wasted effort by freezing baseline, corpora, and no-ship gates before expansion.
