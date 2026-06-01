# Prism Development Workflow: OpenSpec + Superpowers

This document defines how Prism should use OpenSpec and Superpowers to move development forward efficiently and correctly.

The operating model is:

```text
OpenSpec = change specification, product boundary, architecture decision
Superpowers = implementation discipline, TDD, debugging, review, verification
harness-claude pattern = Planner / Critic / Rebuttal / Evaluator / Generator role gates
Prism docs = durable project memory and non-drift guidance
Tests/smokes = executable proof
```

The integrated workflow is defined in [`SPEC_GUIDED_HARNESS_DEVELOPMENT.md`](./SPEC_GUIDED_HARNESS_DEVELOPMENT.md). Use that document as the default operating protocol for non-trivial development, especially when a plan needs alternatives, critic review, rebuttal decisions, and a systematic test matrix.

Use this workflow for architecture-sensitive work, contract-changing work, and multi-step feature development.

---

## 1. Why this workflow exists

Prism is a long-horizon financial intelligence-to-action system, not a small script project.

The project needs to preserve:

- the `Information -> Energy -> Material` north star
- provider-backed facts
- stable Pi Agent tool boundaries
- domain contracts
- source, provider, freshness, status, and warnings
- artifact materialization
- safety boundaries before any execution capability
- the accepted `TS read plane + Python analytics worker` route

Ad-hoc implementation risks drifting into:

- raw provider wrappers exposed as product tools
- Python becoming a second uncontrolled realtime read plane
- analytics logic leaking into market-data services
- Pi Agent loops replacing operation-level tools
- private/execution endpoints appearing before governance exists
- chat answers replacing structured artifacts

OpenSpec, Superpowers, and harness-style role gates address different parts of that risk. OpenSpec prevents product and architecture drift; Superpowers improves how work is explored, planned, implemented, debugged, and verified; the harness-style Planner/Critic/Rebuttal/Evaluator/Generator split prevents one perspective from designing, executing, and approving its own work.

---

## 2. Tool responsibilities

## 2.1 OpenSpec owns what and why

Use OpenSpec to define:

- change intent
- scope and non-goals
- affected capabilities
- domain/tool/provider contract changes
- architecture decisions
- acceptance criteria
- implementation tasks
- spec deltas that should survive the current conversation

OpenSpec is required when a change affects any of:

- domain contracts
- Pi Agent tool contracts
- provider boundaries
- market-data read plane behavior
- analytics architecture
- artifact lifecycle
- execution governance
- risk or confirmation policy
- multi-step product workflows

## 2.2 Superpowers owns how

Use Superpowers-style workflows for:

- brainstorming before implementation
- writing concrete plans
- test-driven development
- systematic debugging
- code review
- verification before completion
- subagent-driven or batch execution when the plan is clear

Superpowers should improve execution quality. It does not replace OpenSpec for product or architecture decisions.

## 2.3 Harness-style gates own role separation

Use the harness-claude pattern as a development workflow, not as a Prism product dependency.

Concrete Prism-specific agent definitions are available in `.claude/agents/`:

```text
prism-planner
prism-critic
prism-rebuttal
prism-evaluator
prism-generator
```

Concrete Prism-specific lenses are available in `.claude/agents/reference/` for OpenSpec compliance, operation purity, financial fact integrity, no-execution safety, artifact lineage, provider boundary, network degradation, Pi Agent tool contracts, test environment, opportunity quality, and risk governance readiness.

Required role gates for design-sensitive and architecture-sensitive work:

- Planner: creates alternatives and a recommended plan.
- Critic: challenges architecture, simplicity, safety, testability, and scope.
- Rebuttal/decision pass: accepts, modifies, rejects, or defers every critic finding with evidence and verification requirements.
- Evaluator: creates the requirement-to-evidence test matrix before implementation and independently verifies after implementation.
- Generator: implements the approved plan with validation loops.

A Level 2+ plan is not complete until it includes alternatives, critic findings, rebuttal decisions, and a test matrix. A Level 3+ architecture-sensitive change must also have an OpenSpec proposal/design/tasks before implementation.

---

## 3. Decision matrix

| Work type | Use OpenSpec? | Use Superpowers methods? | Example |
|---|---:|---:|---|
| Typo or link fix | No | Optional | Fix docs link |
| Small type/export fix | No | Optional | Resolve duplicate export |
| Local service wiring | Maybe | Yes | Wire one mock tool to an existing service |
| New provider endpoint | Yes | Yes | Add Binance OHLCV |
| New Pi Agent tool | Yes | Yes | Add `get_exchange_tickers` |
| New operation workflow | Yes | Yes | Add `scan_funding_opportunities` |
| Python analytics worker | Yes | Yes | Add pandas/numpy/TA-Lib worker |
| Domain contract change | Yes | Yes | Add `OhlcvSeries` |
| Artifact lifecycle change | Yes | Yes | Add evidence bundle persistence |
| Execution/account capability | Yes, separate governance spec | Yes | Add trade proposal or execution tool |

Rule of thumb:

```text
If the change affects architecture, contracts, data boundaries, product behavior, or future safety, create an OpenSpec change first.
```

---

## 4. Standard lifecycle

```text
Idea / request
  -> Classify task level
  -> Explore alternatives
  -> OpenSpec propose when required
  -> Planner design/plan
  -> Critic review
  -> Rebuttal/decision log
  -> Evaluator test matrix and validation handoff
  -> Implement with Superpowers discipline
  -> Evaluator-style zero-trust verification
  -> Update durable docs if needed
  -> OpenSpec archive
```

## 4.1 Explore

Use explore mode when requirements are not clear.

Good prompts:

```text
Explore how to add Python analytics worker without moving realtime data fetching out of TypeScript.
Explore the right contract for OHLCV series.
Explore whether scan_funding_opportunities should be a tool or operation.
```

Explore mode may read code and docs, but should not implement code.

Expected output:

- options
- tradeoffs
- recommended direction
- risks
- open questions
- whether an OpenSpec change is needed

## 4.2 Propose

Create an OpenSpec change for substantial work:

```bash
openspec new change "add-python-analytics-worker"
```

The change should produce:

```text
openspec/changes/<change-name>/
  proposal.md
  design.md
  tasks.md
  specs/
```

The proposal must include:

- what changes
- why now
- in scope
- out of scope
- affected planes: Information, Energy, Material
- affected packages
- safety boundaries
- acceptance criteria

The design must include:

- module boundaries
- data flow
- contract changes
- failure modes
- testing approach
- migration/compatibility notes when relevant

The tasks file must be implementation-ready:

- small tasks
- exact target files when known
- validation commands
- fixture/test needs
- documentation updates

For Level 3/4 changes, include critic and test matrix content either as sections in `design.md` / `tasks.md` or as separate files:

```text
critic.md
  alternatives considered
  critic findings
  rebuttal decisions
  accepted plan changes
  deferred concerns

test-matrix.md
  deterministic tests
  integration tests
  smoke checks
  safety checks
  persistent test deliverables
  environment assumptions
```

## 4.3 Approve before implementation

Do not implement substantial changes until the proposal/design/tasks are clear enough to follow.

For Prism, approval means:

- the change preserves `Information -> Energy -> Material`
- realtime facts still come from tools
- private/execution endpoints remain out of scope unless explicitly specified by a governance design
- the TS/Python route is respected
- the artifact and evidence path is clear when the output matters
- alternatives were considered for design-sensitive work
- critic findings were resolved through explicit accept/modify/reject/defer decisions
- critical and major findings have no unresolved implementation blockers
- a systematic test matrix exists before implementation
- acceptance criteria are mapped to evidence, not self-report

## 4.4 Implement

Use Superpowers implementation discipline:

1. Work from tasks.
2. Prefer tests or fixtures before implementation for deterministic logic.
3. Keep changes minimal and scoped.
4. Complete one task at a time.
5. Update task checkboxes as each task finishes.
6. Pause if implementation reveals a design issue.
7. Do not silently expand scope.

For Prism market-data work, implementation should preserve this flow:

```text
Provider adapter
  -> ExchangeMarketDataService
  -> Prism tool wrapper
  -> Pi Agent registration
  -> operation-level workflow
  -> artifact materialization
```

Do not collapse those layers for convenience.

## 4.5 Verify

Use verification appropriate to the change:

```bash
npm run typecheck
npm run build
npm run test --workspaces --if-present
npm run smoke:pi
npm run smoke:funding
```

Add targeted tests for:

- symbol normalization
- fetch status mapping
- provider response normalization
- cache TTL behavior
- in-flight request coalescing
- slippage calculation
- funding edge calculation
- Python analytics JSON schemas
- artifact output shape

Live network smokes must degrade explicitly when a provider is unavailable.

## 4.6 Archive

After implementation and verification, archive the OpenSpec change:

```bash
openspec archive "<change-name>"
```

Archive only after:

- tasks are complete
- tests/smokes are run or blockers documented
- docs are updated
- specs represent the finished behavior

---

## 5. Prism-specific OpenSpec checklist

Every substantial OpenSpec change should answer:

1. Which plane does this affect: Information, Energy, Material?
2. Does it introduce new realtime external facts?
3. Do those facts come from tools?
4. Are `provider`, `source`, `observedAt`, `fetchedAt`, `status`, and `warnings` preserved?
5. Does it change a Pi Agent tool contract?
6. Does it change a domain contract?
7. Does it change provider boundaries?
8. Does it need an artifact or evidence bundle?
9. Does it involve private APIs, account data, order data, or execution?
10. Does it require a separate governance/risk/confirmation design?
11. Does it require Python?
12. If Python is used, is it behind a TypeScript tool wrapper?
13. If Python fetches data, is it a governed batch/research path rather than the default realtime read plane?
14. How does the change fail safely?
15. What tests and smokes prove it works?

---

## 6. Superpowers methods to use in Prism

## 6.1 Brainstorming

Use before major changes when the problem is still open.

Good for:

- Python analytics worker design
- OHLCV model design
- multi-venue provider strategy
- scanner architecture
- artifact lifecycle
- execution governance

Expected behavior:

- explore alternatives
- ask targeted questions only when needed
- recommend a path
- do not implement during brainstorming

## 6.2 Writing plans

Use after OpenSpec design is accepted.

A Prism implementation plan should include:

- ordered tasks
- target files
- expected contract changes
- tests/fixtures
- validation commands
- explicit non-goals
- rollback or pause conditions

## 6.3 Test-driven development

Use TDD for deterministic logic and financial calculations.

Required or strongly preferred for:

- fetch envelope status mapping
- TTL cache behavior
- symbol normalization
- provider normalization
- slippage and liquidity calculations
- funding edge math
- ranking logic
- Python analytics request/response validation

## 6.4 Systematic debugging

Use systematic debugging when a behavior is unexpected.

Debug by layer:

```text
Provider raw response
  -> fetch envelope
  -> service normalization
  -> tool wrapper
  -> agent registration
  -> operation workflow
  -> artifact output
```

Do not patch symptoms without identifying the layer where the invariant breaks.

## 6.5 Code review

Use review before considering a substantial change done.

Review checklist:

- no raw provider shapes leak to Pi Agent as primary output
- no fabricated market facts
- structured statuses for failure
- no private/execution endpoints unless explicitly in scope
- `ExchangeMarketDataService` remains read-plane focused
- Python remains behind TypeScript wrappers
- operation-level workflows avoid inefficient agent loops
- tests or fixtures cover normalization and math
- docs are updated when contracts or architecture change

---

## 7. Recommended current Prism change sequence

Use OpenSpec changes in this order unless priorities change:

## 7.1 `wire-provider-backed-market-data-tools`

Goal:

- replace mock `get_funding_rates`
- replace mock `get_orderbook_depth`
- add `get_exchange_markets`
- add `get_exchange_tickers`
- register provider-backed tools with Pi Agent

Why first:

- it turns Prism from mock data to real public market facts
- it validates the TypeScript read plane
- it keeps scope read-only and safe

## 7.2 `add-ohlcv-series-tool`

Goal:

- add OHLCV domain contract
- add Binance kline provider method
- add service normalization
- add `get_ohlcv_series`

Why second:

- Python analytics needs normalized time-series input

## 7.3 `add-python-analytics-worker`

Goal:

- add Python analytics worker or subprocess
- add TypeScript analytics client
- add indicators/statistics/scoring capability
- validate JSON input/output

Why third:

- analytics should consume normalized Prism market data, not raw exchange data

## 7.4 `add-scan-funding-opportunities`

Goal:

- build operation-level scanner
- coarse-screen funding and ticker data
- use analytics only where needed
- fetch depth only for top candidates
- rank opportunities
- save OpportunityArtifacts

Why fourth:

- avoids inefficient agent loops
- materializes the first product-grade opportunity workflow

---

## 8. Commands

Inspect current OpenSpec state:

```bash
openspec list
openspec list --specs
```

Create a change:

```bash
openspec new change "wire-provider-backed-market-data-tools"
```

Show a change:

```bash
openspec show "wire-provider-backed-market-data-tools"
```

Check status:

```bash
openspec status --change "wire-provider-backed-market-data-tools"
```

Validate:

```bash
openspec validate "wire-provider-backed-market-data-tools"
```

Archive after completion:

```bash
openspec archive "wire-provider-backed-market-data-tools"
```

---

## 9. Project rule

For Prism, use this rule:

```text
Any change that modifies domain contracts, Pi Agent tool contracts, provider boundaries,
analytics architecture, artifact lifecycle, operation workflows, policy, or execution governance
requires an OpenSpec change before implementation.
```

And this implementation rule:

```text
Use Superpowers-style planning, TDD, debugging, review, and verification to implement approved OpenSpec tasks.
```

---

## 10. Final operating principle

```text
OpenSpec keeps the direction correct.
Superpowers keeps the implementation correct.
Prism docs keep decisions durable.
Tests and smokes keep claims honest.
```
