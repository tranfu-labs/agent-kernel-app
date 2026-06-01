# Prism MVP1 Arbitrage-Prep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver Prism MVP1 as a read-only, semi-automated Binance + Bitget arbitrage preparation system whose fully closed-loop strategy is cross-exchange funding-rate arbitrage and whose outputs include both human-readable trade-prep plans and structured execution-prep contracts.

**Architecture:** Keep Pi Agent as the runtime/tool-loop engine. Keep Prism as the deterministic product control plane plus arbitrage-preparation domain logic. Build on the existing control-plane foundation, then complete the missing product loop in order: market-data normalization, candidate discovery hardening, execution-prep contract generation, deterministic risk gating, artifact semantics upgrade, and end-to-end acceptance.

**Tech Stack:** TypeScript, Node.js, npm workspaces, existing Prism packages (`@agentkernel/domain`, `@agentkernel/operations`, `@agentkernel/tools`, `@agentkernel/agent-kernel`, `@agentkernel/agent-api`), Node test runner, tsx, deterministic contracts, artifact-backed workflows, baseline evaluation, and smoke gates.

---

## Source design

Implement from:

```text
docs/superpowers/specs/2026-05-31-prism-mvp1-arbitrage-prep-design.md
```

## Scope

This plan covers the full MVP1 product loop:

```text
funding-rate arbitrage intent
-> Binance/Bitget normalized facts
-> candidate discovery
-> execution-prep proposal
-> deterministic risk gate
-> artifact-backed follow-up
-> acceptance gates
```

It treats the control plane as an already-advanced subsystem, not as the entire MVP1.

## Non-goals

This plan does not implement:

- order placement or cancellation;
- account balances, positions, or private account state;
- wallet/private key handling;
- equal-completeness support for spot/perp arbitrage;
- more exchange connectors as MVP1 requirements;
- generalized autonomous strategy discovery as a ship blocker;
- frontend or dashboard work.

## Delivery strategy

The most efficient delivery path is:

1. Freeze the MVP1 definition.
2. Preserve the current control-plane gains.
3. Add the missing execution-prep product objects.
4. Add deterministic pre-trade risk gating.
5. Upgrade artifacts and acceptance harness around the main strategy.
6. Only then widen scope.

This avoids wasting time on broader routing or more strategies before the main closed loop is complete.

## File structure focus

### Existing files likely to extend
- `packages/domain/src/opportunity.ts`
- `packages/domain/src/artifact.ts`
- `packages/operations/src/funding-basis-arbitrage.ts`
- `packages/operations/src/funding-basis-cards.ts`
- `packages/agent-kernel/src/platform-intent-resolution.ts`
- `packages/agent-kernel/src/platform-followup-resolution.ts`
- `packages/agent-kernel/src/platform-tool-access.ts`
- `packages/agent-kernel/src/register-prism-tools.ts`
- `apps/agent-api/src/smoke-funding-basis-tool.ts`
- `apps/agent-api/src/smoke-platform-control-plane.ts`

### New files likely to add
- `packages/domain/src/execution-prep.ts`
- `packages/operations/src/funding-execution-prep.ts`
- `packages/operations/src/funding-risk-gate.ts`
- `packages/operations/test/funding-execution-prep.test.ts`
- `packages/operations/test/funding-risk-gate.test.ts`
- `packages/agent-kernel/test/platform-execution-prep-routing.test.ts`
- `apps/agent-api/src/smoke-funding-execution-prep.ts`

The exact file names can be adjusted to match local conventions, but the module boundaries should remain stable.

---

### Task 1: Freeze the MVP1 product contract

**Files:**
- Modify: `docs/superpowers/specs/2026-05-31-prism-mvp1-arbitrage-prep-design.md`
- Modify: `docs/superpowers/plans/2026-05-31-prism-mvp1-arbitrage-prep-implementation.md`
- Modify: `docs/superpowers/plans/2026-05-31-prism-mvp1-control-plane-hardening.md`

- [ ] **Step 1: Confirm the design and plan docs use one definition only**

The product definition must consistently say:

```text
Prism MVP1 = read-only, semi-automated Binance + Bitget arbitrage preparation system.
Main closed-loop strategy = cross-exchange funding-rate arbitrage.
```

- [ ] **Step 2: Confirm the control-plane plan is labeled as a subsystem plan**

Expected result:

```text
The control-plane document no longer reads like the whole MVP1.
```

- [ ] **Step 3: Do not start feature expansion until this wording is stable**

Expected result:

```text
No future implementation task is allowed to redefine MVP1 back into a pure research copilot.
```

---

### Task 2: Add execution-prep domain contract

**Files:**
- Create: `packages/domain/src/execution-prep.ts`
- Modify: `packages/domain/src/index.ts`
- Test: package typecheck and downstream tests

- [ ] **Step 1: Define the execution-prep contract shape**

The contract should define a stable product object such as:

```ts
export interface ExecutionPrepContract {
  contractVersion: "mvp1.v1";
  opportunityId: string;
  strategyFamily: "funding_rate_arbitrage";
  generatedAt: string;
  exchanges: [string, string];
  instruments: {
    normalizedAsset: string;
    marketType: "linear_perp";
    venueSymbols: Record<string, string>;
  };
  legs: [
    {
      exchange: string;
      side: "long" | "short";
      instrument: string;
    },
    {
      exchange: string;
      side: "long" | "short";
      instrument: string;
    },
  ];
  rationale: string[];
  marketReferences: {
    fundingRates: Record<string, number | undefined>;
    markPrices?: Record<string, number | undefined>;
    observedAt: string;
  };
  sequenceRecommendation: {
    preferredOpenSequence: string[];
    preSecondLegChecks: string[];
  };
  orderTypeRecommendation: {
    preferredStyle: "market_like" | "limit_like" | "mixed";
    notes: string[];
  };
  abortConditions: string[];
  failedLegHandling: string[];
  riskNotes: string[];
  confidenceFlags: {
    readyForManualExecutionPrep: boolean;
    requiresHumanConfirmation: true;
    missingInputs: string[];
  };
}
```

- [ ] **Step 2: Export the contract**

Expected result:

```ts
export * from "./execution-prep.js";
```

- [ ] **Step 3: Run domain typecheck**

Run:

```bash
npm run typecheck -w @agentkernel/domain
```

Expected: PASS

---

### Task 3: Build deterministic execution-prep generator

**Files:**
- Create: `packages/operations/src/funding-execution-prep.ts`
- Create: `packages/operations/test/funding-execution-prep.test.ts`
- Modify: `packages/operations/src/index.ts`

- [ ] **Step 1: Write the failing execution-prep tests**

The tests should prove that a scored funding opportunity plus comparison context can deterministically produce:
- recommended leg pairing;
- rationale;
- order sequence recommendation;
- order-style recommendation;
- abort conditions;
- failed-leg handling guidance;
- human-readable summary plus JSON contract.

Use fixture opportunities from the current funding-basis operation outputs.

- [ ] **Step 2: Implement minimal deterministic builder**

Implementation should be rule-based, not LLM-dependent.

Recommended helper shape:

```ts
export function buildFundingExecutionPrep(input: {
  opportunity: Opportunity;
  comparison: CrossVenueComparison;
  generatedAt: string;
}): {
  humanPlan: string;
  contract: ExecutionPrepContract;
}
```

- [ ] **Step 3: Make the builder conservative and explicit**

Rules:
- never imply direct execution authority;
- always require human confirmation;
- only use tool-backed facts already present in inputs;
- produce abort/failure guidance even for good candidates.

- [ ] **Step 4: Run operations tests**

Run:

```bash
npm run test -w @agentkernel/operations -- funding-execution-prep
```

Expected: PASS

---

### Task 4: Add deterministic risk and constraint gate

**Files:**
- Create: `packages/operations/src/funding-risk-gate.ts`
- Create: `packages/operations/test/funding-risk-gate.test.ts`
- Modify: `packages/operations/src/index.ts`

- [ ] **Step 1: Write the failing risk-gate tests**

The tests should cover:
- insufficient edge after fees/slippage;
- stale or partial data;
- missing hedge leg;
- excessive liquidity uncertainty;
- funding advantage too weak;
- acceptable candidate with explicit warnings.

- [ ] **Step 2: Implement deterministic gate**

Recommended result shape:

```ts
export interface FundingRiskGateResult {
  decision: "pass" | "hold" | "reject";
  reasons: string[];
  abortConditions: string[];
  failedLegHandling: string[];
}
```

- [ ] **Step 3: Wire risk gate to execution-prep builder inputs**

Rule:

```text
Execution-prep output is incomplete without deterministic risk output.
```

- [ ] **Step 4: Run focused operations tests**

Run:

```bash
npm run test -w @agentkernel/operations -- funding-risk-gate
```

Expected: PASS

---

### Task 5: Upgrade artifacts from research objects to prep objects

**Files:**
- Modify: `packages/domain/src/artifact.ts`
- Modify: `packages/operations/src/funding-basis-arbitrage.ts`
- Modify: `packages/operations/src/funding-basis-cards.ts`
- Test: existing artifact tests plus new prep-related coverage

- [ ] **Step 1: Extend artifact semantics to carry prep lineage**

Artifacts should be able to reference:
- originating opportunity id;
- execution-prep contract id or embedded content;
- risk evaluation outcome;
- assumptions used to generate the prep.

- [ ] **Step 2: Keep backward compatibility only where truly needed**

Do not create unnecessary shims. Prefer extending existing artifact objects directly.

- [ ] **Step 3: Add tests proving follow-up resolution can target prep-capable artifacts**

Expected result:

```text
Explain/report/propose/risk flows still work, but now refer to execution-prep-capable artifacts rather than research-only outputs.
```

---

### Task 6: Extend the control plane for execution-prep pathing

**Files:**
- Modify: `packages/agent-kernel/src/platform-intent-resolution.ts`
- Modify: `packages/agent-kernel/src/platform-followup-resolution.ts`
- Modify: `packages/agent-kernel/src/platform-tool-access.ts`
- Create or modify: `packages/agent-kernel/test/platform-execution-prep-routing.test.ts`

- [ ] **Step 1: Add routing cases for execution-prep requests**

Examples:
- "给我准备一个 Binance 和 Bitget 的资金费率套利执行方案"
- "把第一个机会整理成可执行前准备方案"
- "评估这个套利准备方案的风险"

- [ ] **Step 2: Ensure route outputs distinguish research-only discover from prep generation**

Expected result:

```text
The control plane can route into proposal/prep/risk paths without confusing them with generic explanation or report behavior.
```

- [ ] **Step 3: Preserve read-only invariant**

Expected result:

```text
Even execution-prep pathing does not unlock execution tools.
```

---

### Task 7: Expose prep outputs through runtime tool surfaces

**Files:**
- Modify: `packages/agent-kernel/src/register-prism-tools.ts`
- Modify: `apps/agent-api` smoke entrypoints
- Possibly add: `apps/agent-api/src/smoke-funding-execution-prep.ts`

- [ ] **Step 1: Decide whether prep generation is a dedicated operation or an artifact-based follow-up wrapper**

Recommended direction:

```text
Artifact-based follow-up wrapper over deterministic prep builder.
```

This keeps the discover phase and the prep phase connected by artifacts.

- [ ] **Step 2: Register or expose the prep path with bounded guidance**

Guidance should say:
- prep remains read-only;
- prep requires tool-backed facts or existing artifacts;
- prep is for manual execution preparation only;
- risk evaluation remains deterministic and required.

- [ ] **Step 3: Add smoke coverage**

The smoke should prove:
- a candidate can be turned into prep output;
- output includes both readable and structured forms;
- no execution tools are exposed.

---

### Task 8: Add main-strategy end-to-end acceptance gate

**Files:**
- Create or modify tests and smokes across `packages/operations`, `packages/agent-kernel`, and `apps/agent-api`
- Modify: root `package.json`

- [ ] **Step 1: Define the main-strategy gate command**

Recommended gate shape:

```bash
npm run build && npm run typecheck && npm --workspace @agentkernel/operations test -- funding-basis-arbitrage.test.ts funding-execution-prep.test.ts funding-risk-gate.test.ts && npm --workspace @agentkernel/agent-kernel test -- platform-intent-resolution.test.ts platform-followup-resolution.test.ts platform-tool-access.test.ts platform-routing-regression.test.ts platform-routing-acceptance.test.ts platform-baseline-comparison.test.ts platform-execution-prep-routing.test.ts && npm run smoke:platform-control-plane && npm run smoke:funding-execution-prep
```

- [ ] **Step 2: Add end-to-end expected scenarios**

At minimum:
- discover candidate;
- generate prep plan for best candidate;
- evaluate risk on that prep;
- reject unsupported execution request;
- keep prediction-market boundary-only.

- [ ] **Step 3: Fail closed**

If any prep-critical output is missing, the gate must fail.

---

### Task 9: Establish no-ship and repair policy for full MVP1

**Files:**
- Modify: `docs/superpowers/plans/2026-05-31-prism-mvp1-arbitrage-prep-implementation.md`
- Modify: root package scripts if needed

- [x] **Step 1: No-ship rules**

Do not ship MVP1 if any are true:
- control-plane baseline non-inferiority fails;
- execution-prep contract fields are incomplete;
- deterministic risk result is missing;
- no-execution boundary is weakened;
- main-strategy smoke does not pass end-to-end;
- the system can discover opportunities but cannot produce actionable prep output.

Operationalized ship bar:

```bash
npm run gate:mvp1-arbitrage-prep
```

This gate must stay fail-closed for the required MVP1 product loop:
- discover candidate;
- generate prep plan for a saved candidate;
- emit structured execution-prep contract;
- preserve deterministic risk output;
- reject any execution-authorizing drift.

- [x] **Step 2: Repair policy**

If acceptance fails:
1. stop expansion work;
2. classify the failure;
3. add failing test first;
4. fix the narrowest deterministic layer possible;
5. rerun focused subset;
6. rerun full gate only after focused pass.

Recommended repair sequence:

```text
operations failure -> rerun focused @agentkernel/operations tests first
routing/runtime failure -> rerun focused @agentkernel/agent-kernel tests first
smoke failure -> rerun the exact smoke entrypoint first
full gate -> rerun only after the narrow failing layer passes
```

---

## Efficient implementation order

The recommended implementation order is intentionally narrow:

1. Freeze MVP1 wording.
2. Add execution-prep contract in domain.
3. Add deterministic prep builder.
4. Add deterministic risk gate.
5. Upgrade artifact semantics.
6. Extend control-plane routing for prep flows.
7. Expose prep path through runtime/tool surfaces.
8. Add end-to-end main-strategy gate.

This is the highest-efficiency order because it turns the largest current gap into the next code change instead of widening the system further sideways.

## Acceptance standard

MVP1 should be considered complete only when the answer to all of these is yes:

1. Can Prism discover Binance/Bitget funding-rate arbitrage candidates?
2. Can Prism convert one candidate into a human-readable trade-prep plan?
3. Can Prism emit a structured execution-prep contract for that same candidate?
4. Can Prism deterministically evaluate whether the prep is acceptable?
5. Can it do all of this without exposing execution authority?
6. Do the route, policy, artifact, prep, risk, and smoke gates all pass together?

## Why this plan is efficient

- It reuses the strong control-plane foundation already built.
- It focuses the next work on the highest-value missing product object.
- It avoids broadening to more strategies before the main one closes.
- It keeps deterministic-first quality discipline.
- It creates a clear ship bar instead of a vague “research copilot is good enough” standard.
