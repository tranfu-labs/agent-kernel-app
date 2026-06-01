# Spec-Guided Harness Development

This document defines how development work on Prism should combine OpenSpec, Superpowers, and harness-claude-style role gates so normal project discussion, analysis, planning, implementation, and verification happen with higher quality by default.

The goal is not to install harness-claude as a Prism product dependency. The goal is to use its development workflow pattern:

```text
Planner -> Critic -> Rebuttal -> Evaluator -> Generator -> Evaluator
```

This workflow exists to prevent the assistant from jumping from a request to the first workable plan without first comparing alternatives, challenging the design, and defining systematic tests.

---

## 1. Tool and method responsibilities

```text
OpenSpec
  = change specification, product boundary, architecture decision, durable acceptance criteria

Superpowers
  = brainstorming, writing plans, executing plans, debugging discipline, TDD, review habits

harness-claude pattern
  = role separation, critic/rebuttal gates, evaluator test handoff, zero-trust verification
```

They compose as follows:

```text
Request
  -> classify task
  -> OpenSpec when required
  -> Superpowers brainstorming for alternatives
  -> Planner creates design/plan
  -> Critic challenges design/plan
  -> Rebuttal resolves every critic finding with explicit decisions
  -> Evaluator creates requirement-to-evidence test matrix and validation handoff
  -> Generator implements with validation loops
  -> Evaluator verifies independently
```

OpenSpec is the source of truth for substantial changes. Superpowers provide the working method. The harness pattern prevents one agent perspective from planning, implementing, and approving its own work.

## 1.1 Superpowers skill mapping

Use concrete Superpowers skills when the matching phase is active:

| Phase | Preferred skill | Purpose |
|---|---|---|
| Explore / alternatives | `superpowers:brainstorming` | Understand context, compare approaches, avoid premature implementation |
| Implementation plan | `superpowers:writing-plans` | Produce a task-by-task executable plan after design approval |
| Plan execution | `superpowers:executing-plans` or `superpowers:subagent-driven-development` | Implement the approved plan with checkpoints |
| Debugging failures | `superpowers:debugging` | Diagnose failing tests or unexpected behavior systematically |
| Review / verification | review-oriented Superpowers methods plus evaluator lenses | Verify work independently before declaring completion |

For Level 2+ work, do not go directly to `superpowers:writing-plans` until alternatives, critic findings, rebuttal decisions, and test matrix are present.

---

## 2. Task classification

Every user request should be classified before planning or implementation.

| Level | Task type | Examples | Required workflow |
|---|---|---|---|
| 0 | Trivial | typo, link, one-line non-architecture fix | Direct change + minimal validation |
| 1 | Local change | small bug, local type/export fix, narrow test update | Short plan + targeted validation |
| 2 | Design-sensitive | local module design, non-trivial refactor, reusable helper | Superpowers brainstorming + critic pass + test matrix |
| 3 | Architecture-sensitive | domain contracts, operation workflows, provider/tool boundaries, artifact lifecycle, scoring, risk, agent tools | OpenSpec + Superpowers + harness gates |
| 4 | Long-horizon system | multi-stage platform capability, execution governance, new analytics architecture | OpenSpec first; no implementation until design approval |

Default to Level 3 when the change affects any of:

- domain contracts
- Pi Agent tool contracts
- provider boundaries
- market-data read plane behavior
- analytics architecture
- operation workflows
- artifact lifecycle
- scoring, risk, confirmation, or execution governance
- cross-venue or prediction-market opportunity architecture

---

## 3. Concrete Claude Code agents

Concrete Prism-specific agent definitions live under:

```text
.claude/agents/prism-planner.md
.claude/agents/prism-critic.md
.claude/agents/prism-rebuttal.md
.claude/agents/prism-evaluator.md
.claude/agents/prism-generator.md
```

Concrete Prism-specific evaluator lenses live under:

```text
.claude/agents/reference/lens-openspec-compliance.md
.claude/agents/reference/lens-operation-purity.md
.claude/agents/reference/lens-financial-fact-integrity.md
.claude/agents/reference/lens-no-execution.md
.claude/agents/reference/lens-artifact-lineage.md
.claude/agents/reference/lens-provider-boundary.md
.claude/agents/reference/lens-network-degradation.md
.claude/agents/reference/lens-pi-agent-tool-contract.md
.claude/agents/reference/lens-test-environment.md
.claude/agents/reference/lens-opportunity-quality.md
.claude/agents/reference/lens-risk-governance-readiness.md
```

Use these agents when the corresponding workflow phase is substantial enough to benefit from role separation. For lightweight work, apply the same roles inline.

## 4. Role model

## 4.1 Planner

Planner owns understanding and initial design.

Planner must produce:

- current interpretation
- scope and non-goals
- affected packages and contracts
- 2-3 alternatives when design choices exist
- recommended option and tradeoffs
- initial test strategy
- OpenSpec need assessment

Planner must not:

- present the first workable plan as final
- skip alternatives on design-sensitive or architecture-sensitive work
- write code before approval for Level 3/4 tasks
- define final tests without evaluator review

## 4.2 Critic

Critic owns opposition and design pressure.

Critic must challenge:

- Is there a smaller verifiable slice?
- Is there a pure core + thin wrapper boundary?
- Are fetching, evaluation, persistence, and presentation mixed together?
- Can the core logic be tested offline?
- Does the design overfit one provider, model, or UI?
- Does it violate Information / Energy / Material separation?
- Does it leak provider raw payloads into product tools?
- Does it let Pi Agent own product semantics that Prism should own?
- Does it introduce execution/private capability too early?
- Are tests systematic enough to prove correctness and prevent regression?

Critic output should be structured:

```json
{
  "verdict": "ACCEPT | REVISE | REJECT",
  "findings": [
    {
      "severity": "critical | major | minor",
      "area": "architecture | testability | safety | scope | integration | docs",
      "issue": "What is wrong or risky",
      "why_it_matters": "Why this matters",
      "recommendation": "Concrete correction"
    }
  ]
}
```

## 4.3 Rebuttal / decision pass

Every critic finding must be resolved before implementation.

Decision values:

- `accept` — change the plan
- `modify` — accept the concern but resolve it through a different design or test strategy
- `reject` — keep the plan and explain why with evidence
- `defer` — explicitly move outside current scope and explain the safe boundary

Decision output should be structured:

```json
{
  "verdict": "READY_FOR_PLAN_REVISION | READY_FOR_EVALUATOR | READY_FOR_IMPLEMENTATION | BLOCKED",
  "decisions": [
    {
      "finding_id": "C1",
      "severity": "critical | major | minor",
      "decision": "accept | modify | reject | defer",
      "reason": "Why this decision is correct",
      "plan_change": "Concrete change or none",
      "verification": "Required test, smoke, grep, OpenSpec check, or evidence",
      "blocks_implementation": false
    }
  ],
  "unresolved_findings": []
}
```

A plan is not implementation-ready until all critical and major findings are resolved by Rebuttal and the Evaluator has produced a test matrix or validation handoff.

## 4.4 Generator

Generator owns implementation.

Generator must:

- work from the approved plan and evaluator handoff
- implement one task or slice at a time
- run inline validation scripts during implementation
- add required persistent tests
- stop when validation fails and fix root causes
- avoid scope expansion

Generator must not:

- skip validation scripts
- silently weaken tests
- modify evaluator expectations to make work pass
- add unapproved architecture changes
- introduce private/execution capability outside an approved governance spec

## 4.5 Evaluator

Evaluator owns test design and zero-trust verification.

Evaluator has two required touches for Level 2+ work and three for Level 3/4 work:

```text
Touch 1: during planning
  Review design and define test cases / test matrix.

Touch 2: before implementation
  Hand off inline validation scripts and persistent test deliverables.

Touch 3: after implementation
  Independently verify and output PASS / PARTIAL / FAIL.
```

Evaluator must not trust self-reports. Deterministic checks run before subjective or AI judgment.

Evaluator verdict format:

```json
{
  "verdict": "PASS | PARTIAL | FAIL",
  "requirement_evidence": [
    {
      "requirement": "Requirement being verified",
      "evidence": ["test file, command, or inspected implementation"],
      "status": "pass | fail | partial"
    }
  ],
  "checks_executed": ["typecheck", "unit", "integration", "smoke", "safety", "docs"],
  "findings": [
    {
      "severity": "critical | major | minor",
      "area": "test | contract | integration | safety | docs",
      "issue": "Observed issue",
      "expected": "Expected result",
      "actual": "Actual result",
      "evidence": "Command, file, or output proving the finding"
    }
  ],
  "test_deliverables": {
    "required": [],
    "delivered": [],
    "missing": []
  },
  "summary": "One sentence result"
}
```

Verdict rules:

- any critical finding -> FAIL
- any major finding without critical -> PARTIAL
- missing required persistent tests -> at least PARTIAL
- only minor findings or no findings -> PASS

---

## 4. Required gates by task level

## Level 0: trivial

```text
Direct change
  -> minimal validation
```

No OpenSpec or full harness gates.

## Level 1: local change

```text
Short plan
  -> implement
  -> targeted validation
```

Critic can be inline and brief.

## Level 2: design-sensitive

```text
Superpowers brainstorming
  -> alternatives
  -> critic review
  -> rebuttal decisions
  -> test matrix
  -> implementation
  -> evaluator verification
```

OpenSpec is optional unless the design affects durable contracts or boundaries.

## Level 3: architecture-sensitive

```text
OpenSpec proposal/design/tasks
  -> Superpowers brainstorming
  -> planner design and plan
  -> critic review
  -> rebuttal decisions
  -> evaluator test matrix and handoff
  -> generator implementation
  -> evaluator zero-trust verification
  -> docs/spec archive
```

OpenSpec is required.

## Level 4: long-horizon system

```text
OpenSpec first
  -> design review
  -> decompose into Level 2/3 slices
  -> implement one approved slice at a time
```

Do not write implementation code before decomposition and approval.

---

## 5. Plan template requirements

Level 2+ implementation plans must include these sections:

```markdown
# <Feature> Implementation Plan

## Goal

## Scope

## Non-goals

## Current context

## Alternatives considered

## Recommended design

## Critic review

## Rebuttal / decision log

## Final architecture

## Test matrix

## Test environment

## Implementation tasks

## Verification checklist

## Safety and rollback notes
```

A plan without critic review, rebuttal decisions, and test matrix is incomplete for Level 2+ work.

---

## 6. Test matrix requirements

Every Level 2+ plan must include a test matrix.

```markdown
| Layer | Test type | Purpose | Command or method | Persistent? | Owner |
|---|---|---|---|---:|---|
| Contract | Typecheck | Verify exported contracts compile | npm run typecheck | No | Generator/Evaluator |
| Pure core | Unit | Verify deterministic logic offline | npm run test -w <pkg> | Yes | Generator |
| Integration | Service/operation | Verify module wiring with mocks | npm run test -w <pkg> | Yes | Generator |
| Smoke | Runtime entrypoint | Verify built command or API path | npm run smoke:<name> | No | Evaluator |
| Regression | Existing behavior | Verify old tests/smokes still pass | npm run test / smoke commands | Mixed | Evaluator |
| Safety | Static checks | Verify no dangerous/private capability | grep/static scan | No | Evaluator |
| Docs | Consistency | Verify specs/docs match behavior | grep/read docs | No | Evaluator |
```

## 6.1 Test environment tiers

Plans must state which environments apply.

```text
Local deterministic
  - no network
  - fixtures/mocks only
  - stable timestamps and IDs
  - used for pure logic and normalization

Local integration
  - in-memory stores
  - mocked providers/services
  - used for module wiring and artifact behavior

Live read-only
  - public endpoints only
  - no credentials
  - structured unavailable/rate-limited/geo-blocked statuses accepted

CI
  - typecheck
  - build
  - unit/integration tests
  - static safety checks
```

## 6.2 Deterministic checks before subjective checks

Run checks in cost order:

```text
format/static grep/typecheck
  -> unit tests
  -> integration tests
  -> build
  -> smoke
  -> subjective review if relevant
```

If deterministic checks fail, stop and fix them before higher-cost checks.

---

## 7. Prism-specific evaluator lenses

Use these lenses when developing Prism.

## 7.1 OpenSpec compliance lens

Checks:

- Is there an OpenSpec change when required?
- Do proposal/design/tasks exist and match the planned implementation?
- Are scope and non-goals explicit?
- Are acceptance criteria testable?

## 7.2 Information / Energy / Material lens

Checks:

- Information: external facts come from provider-backed tools/services with source/status/timestamps/warnings.
- Energy: comparison, scoring, risk, and operation logic remain deterministic and testable.
- Material: important outputs become artifacts or durable product objects, not disposable chat text.

## 7.3 Architecture boundary lens

Checks:

- Pi Agent runtime concerns stay in `packages/agent-kernel` or `packages/pi-package`.
- Domain contracts stay in `packages/domain`.
- Tools/providers stay in `packages/tools`.
- Operation workflows stay in `packages/operations`.
- Policies stay in `packages/policies`.
- Legacy code stays behind `legacy-adapters/prism-old`.

## 7.4 Provider boundary lens

Checks:

- Raw exchange payloads do not leak into domain artifacts or Pi Agent tool outputs.
- `ExchangeMarketDataService` normalizes provider responses.
- Unsupported providers return structured statuses rather than fake data.
- Provider failures map to structured statuses and warnings.

## 7.5 Operation purity lens

Checks:

- Pure deterministic core is separated from orchestration when practical.
- Fetching, evaluating, scoring, saving, and presentation are not collapsed into an untestable large function.
- Core logic can run against mocked or fixture `MarketContext` inputs.

## 7.6 Financial fact integrity lens

Checks:

- Prices, funding, depth, and market facts come from tools/services, not LLM prose.
- Outputs preserve `source`, `provider`, `fetchedAt`/`observedAt`, `status`, `freshness`, and `warnings` where relevant.
- Missing data degrades explicitly rather than being invented.

## 7.7 Artifact lineage lens

Checks:

- Opportunity artifacts include evidence/comparison/signal lineage where applicable.
- Future turns can inspect or explain the result through artifact IDs.
- Artifact content contains calculation inputs and warnings when needed.

## 7.8 Safety / no-execution lens

Checks:

- No private exchange credentials unless explicitly in an approved governance spec.
- No account balances, positions, open orders, or private account endpoints for read-only MVP work.
- No `place_order`, `cancel_order`, leverage, margin, or execution path before proposal/risk/confirmation/audit foundations.

## 7.9 Network degradation lens

Checks:

- Timeouts, rate limits, provider unavailable, and geo-blocking produce structured statuses.
- Live smokes accept explicit unavailable statuses but never accept fabricated facts.
- Deterministic tests do not depend on live network.

## 7.10 Pi Agent tool contract lens

Checks:

- Tool schemas expose product-safe fields only.
- Product runtime users do not receive coding tools such as `read`, `write`, `edit`, or `bash`.
- Tool descriptions and prompt guidelines prevent LLM-invented market facts.
- Tool outputs include status, warnings, summary, and lineage where relevant.

## 7.11 Test environment lens

Checks:

- Deterministic tests cover pure logic without network.
- Integration tests use fake providers/services where possible.
- Smoke tests cover runtime/tool registration paths.
- Safety checks cover read-only/private/execution boundaries.

## 7.12 Opportunity quality lens

Checks:

- Opportunities are financially explainable.
- Legs, edge, fees, slippage, freshness, liquidity, and warnings are separated.
- Missing facts reduce confidence or block opportunity creation.
- Output can become an artifact or future proposal without already executing.

## 7.13 Risk governance readiness lens

Checks:

- Read-only work remains read-only.
- Future Proposal -> Risk -> Execution flow is not silently implemented.
- Any execution capability requires a separate governance OpenSpec with risk checks, explicit confirmation, audit, and kill switch.

## 7.14 Regression lens

Checks:

- Existing package tests still pass.
- Existing smoke commands still pass or fail with documented provider-unavailable statuses.
- Existing public contracts are not silently broken.

---

## 8. OpenSpec file additions for Level 3/4 changes

For substantial changes, add these files to the OpenSpec change when useful:

```text
openspec/changes/<change>/
  proposal.md
  design.md
  tasks.md
  critic.md
  test-matrix.md
  specs/
```

`critic.md` should contain:

- alternatives considered
- critic findings
- rebuttal decisions
- accepted plan changes
- deferred concerns

`test-matrix.md` should contain:

- test layers
- commands
- persistent test deliverables
- smoke requirements
- safety checks
- environment assumptions

If the change is smaller, critic and test matrix sections may be included inside `design.md` or `tasks.md` instead of separate files.

---

## 9. Default prompts for future work

When the user asks to analyze or plan architecture-sensitive work, the assistant should internally apply:

```text
Classify the task level.
If Level 3/4, use OpenSpec first.
Use Superpowers brainstorming before implementation planning.
Produce alternatives.
Run a critic pass.
Resolve critic findings through rebuttal decisions.
Define a systematic test matrix.
Only then write or execute implementation steps.
```

When the user asks to implement an approved plan:

```text
Read the approved OpenSpec/plan/test matrix.
Execute one task at a time.
Run inline validation after each meaningful change.
Do not weaken tests.
Do not expand scope silently.
End with evaluator-style verification.
```

When the user asks whether work is complete:

```text
Do not rely on self-report.
Run or inspect deterministic checks first.
Verify required persistent tests exist.
Check docs/spec consistency where relevant.
Return PASS/PARTIAL/FAIL with evidence.
```

---

## 10. Practical default for Prism MVP work

For the funding-basis arbitrage MVP, prefer this development shape:

```text
OpenSpec/design update if contracts or operation workflow change
  -> alternatives: provider-first vs core-first vs full vertical
  -> critic review: especially operation purity and testability
  -> final design: pure deterministic evaluator + thin scanner wrapper when practical
  -> test matrix: contract, pure core, operation integration, provider normalization, smoke, safety
  -> implementation
  -> zero-trust verification
```

This prevents the assistant from requiring user prompting before suggesting better structures such as:

```text
evaluateFundingBasisContexts()
  = pure Energy-layer core

scanFundingBasisArbitrage()
  = thin Information/Material orchestration wrapper
```

---

## 11. Completion standard

A Level 2+ task is complete only when:

- approved scope is implemented
- critic findings are resolved or explicitly deferred
- required tests are present
- deterministic checks pass or blockers are documented
- smoke checks are run when applicable
- safety checks are run when capability risk exists
- docs/specs are updated if public behavior changed
- final report includes evidence, not only self-report
