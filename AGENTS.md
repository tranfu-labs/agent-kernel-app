# Prism Agent Instructions

This repository is the new Prism replatform project.

## Core decision

Prism is being rebuilt as:

> **Pi Agent Kernel as runtime engine, Prism as financial intelligence-to-action product system.**

Do not continue patching `Prism_old` as the new product runtime. Use it as a legacy capability mine.

## Repository roles

```text
/Users/griffith/Projects/Prism      # New Prism product system
/Users/griffith/Projects/Prism_old  # Legacy capability mine / reference implementation
```

## Required docs to read before non-trivial work

Read these first for architecture-sensitive changes:

- `prism-docs/PRISM_CORE_STRATEGY_AND_ARCHITECTURE.md`
- `prism-docs/INFORMATION_ENERGY_MATERIAL_ARCHITECTURE.md`
- `prism-docs/PRISM_OPPORTUNITY_OPERATING_CORE_ARCHITECTURE.md`
- `prism-docs/MIGRATION_FROM_PRISM_OLD.md`
- `prism-docs/MVP_AGENT_KERNEL_PLAN.md`
- `prism-docs/MVP_FUNDING_BASIS_ARBITRAGE_PLAN.md`
- `prism-docs/SKILL_INVENTORY.md`
- `prism-docs/TOOL_INVENTORY.md`
- `prism-docs/DOMAIN_CONTRACTS.md`
- `prism-docs/TS_PYTHON_TECHNICAL_ROUTE.md`
- `prism-docs/NETWORK_RESILIENT_MARKET_DATA_WORKFLOW.md`
- `prism-docs/DEVELOPMENT_WORKFLOW_OPENSPEC_SUPERPOWERS.md`
- `prism-docs/SPEC_GUIDED_HARNESS_DEVELOPMENT.md`

## Product philosophy

Prism follows the information / energy / material architecture. See `prism-docs/INFORMATION_ENERGY_MATERIAL_ARCHITECTURE.md`.

Prism follows the information / energy / material philosophy:

- **Information**: provider-backed external facts, market data, evidence, wallet behavior, news, source records.
- **Energy**: reasoning, comparison, opportunity detection, planning, risk interpretation, agent/tool orchestration.
- **Material**: artifacts, opportunity cards, trade proposals, risk checks, execution tickets, receipts, watch plans, audit events.

The product goal is not chat. The product goal is:

> Convert real-world market signals into verified research, opportunity discovery, governed action proposals, and eventually controlled execution.

Prism's opportunity operating core is the shared architecture for multi-exchange arbitrage and prediction-market mispricing. The core chain is:

```text
Evidence -> MarketContext -> Comparison -> Signal -> Opportunity -> Score -> Artifact -> Proposal -> Risk
```

### Product identity that must not drift

Prism is:

> **a collaborative financial research manager that turns market ideas into persistent research, monitoring, signals, proposals, and later governed action hooks.**

Prism should also be understood internally as:

> **a continuous research operating system for market opportunities.**

This means Prism is not only a scanner, not only a chat assistant, and not only an execution bot. It must support both:

1. **interactive research mode** — users and Prism discuss goals, methods, sources, evidence, and conclusions;
2. **continuous monitoring mode** — once a workflow is agreed, Prism can keep refreshing facts, tracking artifacts, and emitting signals.

### Hard non-drift rules

1. Prism is **research-first and artifact-first**. Important outputs must become structured artifacts, not disposable chat text.
2. Prism is **workspace-first**. Chat is a surface, not the product core.
3. Prism must support the lifecycle:
   `goal framing -> method exploration -> capability/boundary check -> source mapping -> fact gathering -> synthesis -> materialization -> review/monitor/proposal handoff`.
4. Prism must distinguish **knowledge exploration** from **live market facts**. Concepts may come from reasoning or source inspection; realtime financial facts must come from tools.
5. Prism must distinguish **signal** from **proposal**. A signal says something is worth attention; a proposal says what action might be worth considering.
6. Prism must distinguish **proposal** from **execution**. No future execution path may bypass proposal, deterministic risk, explicit confirmation, and audit.
7. Prism must support **continuous monitoring** and **signal emission** as first-class product behavior, not as side features.
8. Prism must preserve **human review checkpoints** at method lock, proposal review, major scope change, source conflict, and any action-adjacent boundary.
9. Prism must keep **product control-plane ownership** inside Prism: intent taxonomy, capability routing, orchestration paths, artifact lifecycle, and tool policy are Prism responsibilities, not prompt-only behavior delegated to the runtime.
10. Funding-basis MVP is a wedge, not the whole product. New work must not hard-code Prism into a funding-only identity.

## Architecture boundaries

### Pi Agent owns

- Agent runtime loop
- Model/tool interaction
- Skills and prompt loading
- Extensions / hooks
- Provider/model abstraction
- Session mechanics
- SDK/RPC substrate

### Prism owns

- Financial domain contracts
- Market/evidence/opportunity object models
- Data tools and exchange connectors
- Risk policies and confirmation gates
- Artifact persistence
- Audit trail
- Product workspace UI
- Execution governance
- Runtime product identity contract at session bootstrap (`createPrismAgentSession` + `prism-system-prompt.ts`)

### Prism_old provides reference assets

Use `/Users/griffith/Projects/Prism_old` as the source of reusable knowledge:

- data source implementations
- Polymarket Gamma / CLOB / Data clients
- CEX / exchange read plane
- wallet engine
- analyzers
- previous prompts
- runtime/action contracts worth mining
- tests and fixtures
- architecture documents and lessons

Do **not** blindly migrate old runtime glue:

- old `SessionOrchestrator`
- old static `OperationCatalog` drift patterns
- old complex `chat_service` orchestration
- old presentation glue
- legacy routing rules unless clearly useful

## Current package map

```text
apps/agent-api                 # API/streaming bridge for product runtime
apps/web                       # Future workspace-first product UI
packages/agent-kernel          # Pi SDK adapter for Prism runtime
packages/pi-package            # Package for users who use Pi directly
packages/domain                # Domain contracts: Opportunity, Artifact, TradeProposal, RiskCheck, etc.
packages/tools                 # Deterministic tools and Pi tool wrappers
packages/skills                # Product runtime skills
packages/policies              # Risk, permission, confirmation, audit policies
legacy-adapters/prism-old      # Wrappers around selected Prism_old capabilities
prism-docs                     # Current architecture and migration docs
```

## Development workflow rules

Use `prism-docs/SPEC_GUIDED_HARNESS_DEVELOPMENT.md` for non-trivial development work. It combines OpenSpec, Superpowers, and the harness-claude Planner/Critic/Rebuttal/Evaluator/Generator role-gate pattern.

For architecture-sensitive or design-sensitive work, do not jump directly from request to implementation plan. First classify the task level, use OpenSpec when required, explore alternatives with Superpowers-style brainstorming, run a critic pass, resolve critic findings through rebuttal decisions, define a systematic test matrix, then implement and verify.

When the question is mainly technical architecture, tooling choice, or implementation strategy, default to synthesizing a recommendation yourself from Prism's north star, current milestone, local code state, and targeted multi-agent research in the development workflow. Do not push those decisions back to the user unless the fork is genuinely product-defining, preference-driven, or hard to reverse. Do not treat this workflow guidance as evidence that the Prism product should use a multi-agent runtime now; product-level multi-agent architecture is a separate decision.

Architecture-sensitive work includes domain contracts, operation workflows, Pi Agent tool contracts, provider boundaries, market-data read plane behavior, analytics architecture, artifact lifecycle, scoring, risk, confirmation, execution governance, cross-venue architecture, and prediction-market architecture.

A Level 2+ plan is incomplete unless it includes alternatives, critic review, rebuttal/decision log, test matrix, test environment, implementation tasks, and verification checklist. A completed implementation must be verified with evaluator-style zero-trust checks rather than self-report.

Concrete Prism development agents are available in `.claude/agents/`: `prism-planner`, `prism-critic`, `prism-rebuttal`, `prism-evaluator`, `prism-generator`, and `prism-researcher`. Prism evaluator lenses live in `.claude/agents/reference/` and should be used for OpenSpec compliance, operation purity, financial fact integrity, no-execution safety, artifact lineage, provider boundary, network degradation, Pi Agent tool contract, test environment, opportunity quality, and risk governance readiness checks.

### Multi-agent by default for Level 2+

Use the multi-agent gates by default. The norm — not the exception — is:

- **Level 0–1** (typo, one-line fix, narrow non-architecture change): handle inline, no gates.
- **Level 2+** (module design, non-trivial refactor, technology selection, architecture, contract/tool/provider work): **do not go from request to the first workable plan.** Route through the appropriate agents.
  - **Build / implement work** → `prism-planner` → `prism-critic` → `prism-rebuttal` → `prism-evaluator` → `prism-generator` → `prism-evaluator`.
  - **Research / advisory work** (technology selection, library/framework/module evaluation, "I don't know what the options are", external technical landscape) → `prism-researcher`, or run the `/prism-decide` command. The researcher must **research and decide**, not return a neutral menu for an under-informed human to pick from.

Only genuinely simple problems skip the multi-agent path. When in doubt about the level, treat it as Level 2+.

### Decision authority boundary

> **The agent decides** (research, then commit): technology selection, library/framework/module choice, reversible architecture and code structure, test strategy, implementation path. Do not push these back to the user.
>
> **Escalate to the user** only: ① product-defining forks (anything that changes Prism's identity, north star, or milestone boundary); ② preference-driven choices (no objective best answer, depends on the user's taste); ③ irreversible or outward-facing side effects (delete data, spend money, execute trades, publish, change sharing/permissions, product-defining contract changes).

This boundary **precisely restates, and does not replace,** non-drift rule #8 (human review checkpoints). The checkpoints rule #8 names — method lock, proposal review, major scope change, source conflict, action-adjacent boundary — are exactly the "escalate to the user" set above. Everything else is the agent's call. The user has explicitly stated they do not want to be the decision-maker on technical matters they are not equipped to judge.

## Coding rules

1. Keep Pi runtime concerns inside `packages/agent-kernel` or `packages/pi-package`.
2. Keep financial domain objects inside `packages/domain`.
3. Keep deterministic risk and permission logic inside `packages/policies`.
4. Keep data/action implementations inside `packages/tools`.
5. Keep old capability wrappers inside `legacy-adapters/prism-old`.
6. Product runtime must not expose coding tools (`read`, `write`, `edit`, `bash`) to end users.
7. Do not implement real trading execution before proposal, deterministic risk check, explicit confirmation, and audit foundations exist.
8. Prefer structured artifacts over disposable chat text.
9. Real-time financial facts must come from tools, never from LLM prose.
10. Skills are playbooks; operation/domain/policy contracts are the product core.
11. Keep realtime exchange data acquisition in the TypeScript read plane; use Python for heavy analytics behind TypeScript tool wrappers.
12. Do not turn `ExchangeMarketDataService` into an analytics engine; it owns provider-backed market-data normalization.
13. Use OpenSpec before implementing changes that modify domain contracts, Pi Agent tool contracts, provider boundaries, analytics architecture, artifact lifecycle, operation workflows, policy, or execution governance.
14. Use Superpowers-style planning, TDD, systematic debugging, code review, and verification when implementing approved OpenSpec tasks.
15. Do not let local exchange-network failures block development: keep deterministic tests local, return structured provider statuses, and use remote live smoke or a read-only market-data proxy when production endpoints are unreachable locally.

## First MVP

The first MVP is:

> Binance / Bitget funding-basis opportunity scanner.

MVP1 finish is the narrow internal product boundary for read-only Binance + Bitget funding-basis discover -> inspect -> prep, with live discover on a constrained demo symbol set, a minimal product API, a minimal internal workspace UI, and explicit end-to-end checks that the API and UI can complete the loop.

Initial loop:

```text
User asks for opportunities
  -> Pi Agent loads funding-rate-arbitrage skill
  -> calls Prism exchange market-data tools
  -> calculates funding/basis/fee/slippage/net edge
  -> ranks opportunities
  -> saves OpportunityArtifact
  -> returns opportunity cards
  -> user inspects and prepares a manual next step
```

Non-goals for MVP1 finish:

- product-level multi-agent runtime
- additional exchanges
- additional strategies
- continuous monitoring engine
- execution systems, including real order placement, automatic trading, and high-frequency execution
- no complete Web UI beyond the minimal internal workspace UI
- no full Prism_old migration

## Before extracting from Prism_old

When mining Prism_old:

1. Identify the exact old files used.
2. Classify the asset as one of:
   - tool/function
   - skill/playbook
   - prompt
   - domain contract
   - test/fixture
   - architecture lesson
3. Prefer wrapping first, rewriting later.
4. Preserve provider-backed fact semantics.
5. Avoid importing old runtime orchestration accidentally.
6. Document what was extracted and why.

## Useful commands

From repo root:

```bash
npm run typecheck
npm run build
npm run smoke:pi
```

`npm run smoke:pi` verifies that Prism can create a Pi Agent session and receive a model response.
