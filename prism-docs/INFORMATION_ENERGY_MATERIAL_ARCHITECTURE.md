# Prism Information / Energy / Material Architecture

This document records the shared architecture consensus for Prism.

## 1. North Star

Prism's core north star is:

> **Convert real-world information into agentic energy, and materialize it as verified artifacts, opportunities, proposals, governed execution, and reusable strategy assets.**

In Chinese product terms:

> **实现信息、能量、物质三位一体的转换。**

Prism is not a chat product. Chat is only one surface.

Prism is an intelligence-to-action system:

```text
Information -> Energy -> Material
```

The shared product operating core for this north star is defined in [`PRISM_OPPORTUNITY_OPERATING_CORE_ARCHITECTURE.md`](./PRISM_OPPORTUNITY_OPERATING_CORE_ARCHITECTURE.md):

```text
Evidence -> MarketContext -> Comparison -> Signal -> Opportunity -> Score -> Artifact -> Proposal -> Risk
```

That core must support both multi-exchange arbitrage and prediction-market mispricing, while the first MVP remains Binance / Bitget funding-basis opportunity discovery.

---

## 2. The three planes

## 2.1 Information Plane

The Information Plane receives the external world.

It answers:

- What happened?
- What is the data?
- Where did it come from?
- Is it fresh?
- Is it trustworthy?
- Can it be verified again?

Examples:

- exchange prices
- funding rates
- basis / spread
- order books
- balances and positions
- Polymarket markets and CLOB data
- wallet behavior
- web/news/official source evidence
- on-chain/off-chain events

Implementation areas:

```text
packages/tools/
legacy-adapters/prism-old/
packages/domain/evidence
```

Rules:

1. All realtime market, account, order book, funding, position, and execution facts must come from tools.
2. The LLM must not invent realtime financial facts.
3. Tool outputs should include source, provider, timestamp, and freshness.
4. Missing data should degrade explicitly instead of being filled by prose.

---

## 2.2 Energy Plane

The Energy Plane transforms information into judgment, reasoning, planning, scoring, and action proposals.

It answers:

- What does the information mean?
- Is there an opportunity?
- What are the risks?
- What should happen next?
- Which tools should be called?
- Should the system create an artifact, watch, proposal, or execution ticket?

Implementation areas:

```text
packages/agent-kernel/       # Pi SDK adapter
packages/skills/             # product runtime skills
packages/pi-package/         # direct Pi user package
packages/operations/         # product operation semantics (to add)
packages/policies/           # deterministic risk/permission gates
packages/tools/opportunities/
```

Rules:

1. Pi Agent is the runtime engine for reasoning and tool orchestration.
2. Skills are playbooks, not product core.
3. Operation contracts should express product semantics.
4. Policies enforce boundaries; LLM reasoning does not authorize risky actions.
5. The Energy Plane may synthesize, compare, rank, and propose, but it must not fabricate facts or bypass policy.
6. Prism must own the product control plane: intent taxonomy, capability routing, orchestration paths, artifact lifecycle, and tool policy are Prism responsibilities.
7. Continuous monitoring and signal emission are first-class Energy Plane behaviors, not optional add-ons.
8. Method exploration and boundary checking must happen before any workflow crosses from idea-level research into live opportunity discovery.

---

## 2.3 Material Plane

The Material Plane turns reasoning into durable, inspectable, reusable, and auditable product objects.

It answers:

- What was produced?
- Can the user act on it?
- Can it be tracked?
- Can it be reused in later turns?
- Can it be audited?

Examples:

- EvidenceBundle
- ResearchBrief
- MethodArtifact
- MonitorDefinition
- Opportunity
- OpportunityArtifact
- SignalArtifact
- TradeProposal
- RiskCheckResult
- ExecutionTicket
- ExecutionReceipt
- WatchPlan
- AuditEvent
- PostTradeReview
- StrategyTemplate

Implementation areas:

```text
packages/domain/
packages/storage/            # to add
packages/tools/artifacts/
apps/web/                    # workspace-first product UI
```

Rules:

1. Important outputs must become artifacts or domain objects.
2. Chat text is not enough.
3. Opportunities must have lifecycle and freshness.
4. Execution must produce tickets, receipts, and audit events.
5. Artifacts should become future context, not dead output.

---

## 3. Target layered architecture

Long-term Prism should evolve into seven layers:

```text
┌──────────────────────────────────────────────┐
│ 7. Product Workspace Layer                   │
│    Web UI / Opportunity Feed / Execution UI  │
├──────────────────────────────────────────────┤
│ 6. Materialization Layer                     │
│    Artifact / Opportunity / Proposal / Audit │
├──────────────────────────────────────────────┤
│ 5. Governance & Policy Layer                 │
│    Risk / Permission / Confirmation / Limits │
├──────────────────────────────────────────────┤
│ 4. Energy / Agent Layer                      │
│    Pi Agent / Skills / Operations / Planning │
├──────────────────────────────────────────────┤
│ 3. Domain Layer                              │
│    ResearchObject / Evidence / Opportunity   │
├──────────────────────────────────────────────┤
│ 2. Tool & Provider Layer                     │
│    Exchange / Polymarket / Web / Account     │
├──────────────────────────────────────────────┤
│ 1. Storage & Infra Layer                     │
│    DB / Cache / Queue / Audit / Secrets       │
└──────────────────────────────────────────────┘
```

---

## 4. Current package mapping

### Information

Current:

```text
packages/tools/
legacy-adapters/prism-old/
```

Expected growth:

```text
packages/tools/
├── exchanges/
├── polymarket/
├── evidence/
├── account/
├── wallet/
└── market-data/
```

### Energy

Current:

```text
packages/agent-kernel/
packages/skills/
packages/pi-package/
packages/policies/
packages/tools/opportunities/
```

Expected growth:

```text
packages/operations/
packages/agent-kernel/src/register-prism-tools.ts
packages/agent-kernel/src/prism-resource-loader.ts
packages/agent-kernel/src/prism-agent-events.ts
```

### Material

Current:

```text
packages/domain/
packages/tools/artifacts/
```

Expected growth:

```text
packages/storage/
packages/domain/watch-plan.ts
packages/domain/audit.ts
packages/domain/research-object.ts
```

---

## 5. Architecture evolution phases

## Phase 0 — Foundation

Status: started.

Already done:

- Pi SDK dependency
- `packages/agent-kernel`
- `apps/agent-api`
- `packages/domain`
- `packages/tools`
- `packages/policies`
- `packages/pi-package`
- `npm run smoke:pi -> PRISM_PI_OK`

Still needed:

- register Prism custom tools
- load Prism product skills
- product-safe resource loader
- no coding tools in product runtime
- basic session bridge

Goal:

> Pi Agent can run inside Prism as a controlled product engine.

---

## Phase 1 — Information to Material minimal loop

Goal:

```text
Tool facts -> OpportunityArtifact
```

Minimum loop:

```text
get_funding_rates
get_orderbook_depth
calculate_funding_edge
save_opportunity_artifact
```

This validates tools, domain objects, freshness/source fields, and artifact materialization.

---

## Phase 2 — Information to Energy to Material agent loop

Goal:

```text
User request -> Pi Agent -> tools -> reasoning -> OpportunityArtifact
```

Example:

```text
User: Find Binance / Bitget ETH funding opportunities.
Agent:
  1. loads funding-rate-arbitrage skill
  2. calls market data tools
  3. calculates edge and risk flags
  4. saves OpportunityArtifact
  5. explains assumptions and next action
```

---

## Phase 3 — Material to Energy to Material continuity

Goal:

Artifacts become future context.

Example:

```text
OpportunityArtifact
  -> refresh data
  -> simulate execution
  -> risk check
  -> TradeProposalArtifact
```

This is where Prism becomes a workbench rather than a one-shot assistant.

---

## Phase 4 — Governed execution

Execution flow:

```text
Opportunity
  -> TradeProposal
  -> Simulation
  -> RiskCheck
  -> User Confirmation / Policy Authorization
  -> ExecutionTicket
  -> ExecutionReceipt
  -> AuditEvent
  -> PostTradeReview
```

Hard rules:

- No direct LLM-to-order execution.
- No hidden trading.
- No execution without deterministic risk check.
- No execution without explicit confirmation or pre-authorized strategy policy.
- No execution without audit trail.

---

## Phase 5 — Governed strategy loops

Longer-term autonomous loops:

```text
WatchPlan
  -> Scheduled scanner
  -> Opportunity detector
  -> Policy engine
  -> Auto-proposal
  -> Conditional execution if authorized
  -> Audit + monitoring
```

Autonomy must remain governed.

---

## 6. Product form evolution

### Stage 1

```text
Agent Console + Opportunity Cards
```

### Stage 2

```text
Opportunity Feed + Evidence Panel
```

### Stage 3

```text
Execution Ticket Workspace
```

### Long-term

```text
Agentic Trading Workbench
```

Principle:

> Workspace-first, object-first, artifact-first, opportunity-first, execution-governed.

---

## 7. Immediate architecture recommendations

Next structural additions:

### 7.1 Add `packages/operations`

Purpose:

- define product operation semantics between skills and tools
- avoid making skills/prompts the product core

Initial operation kinds:

```ts
type OperationKind =
  | "discover_opportunity"
  | "research_object"
  | "create_trade_proposal"
  | "risk_check"
  | "execute_ticket"
  | "create_watch_plan";
```

### 7.2 Add `packages/storage`

Purpose:

- persist material objects
- start with memory stores
- later connect Supabase/Postgres

Initial stores:

```text
ArtifactStore
OpportunityStore
AuditStore
SessionStore
```

### 7.3 Register Prism custom tools

Implement:

```text
packages/agent-kernel/src/register-prism-tools.ts
```

Start with mock tools:

- get_funding_rates
- get_orderbook_depth
- calculate_funding_edge
- save_opportunity_artifact

Then replace mock facts with Prism_old wrappers.

---

## 8. What to avoid

Do not recreate Prism_old's accidental complexity:

- custom full runtime engine
- complex hand-written session orchestrator
- static operation catalog drift
- chat-service mega facade
- prompt-only business logic
- chat-first product assumptions

Do not rush real trading execution.

Do not let skills replace domain contracts, operations, policies, or artifacts.

---

## 9. One-sentence consensus

> **Prism must evolve from chat + tools into an Information Plane + Energy Plane + Material Plane conversion system; Pi Agent is the Energy Plane engine, while Prism's durable advantage is in provider-backed information, domain objects, risk governance, and materialized trading/research artifacts.**
