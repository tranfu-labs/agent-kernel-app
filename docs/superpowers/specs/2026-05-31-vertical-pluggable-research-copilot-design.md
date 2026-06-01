# Vertical-Pluggable Research Copilot Design

## Goal

Define the next-stage Prism platform architecture so MVP1 can keep shipping quickly without locking the product into a funding-basis-specific control plane. The platform should support a single-user conversational research copilot that can grow from the existing funding-basis workflow toward future verticals such as World Cup + Polymarket, A-share, and spot-perp research.

The design target is the research-and-recommendation layer only:

```text
intent -> search/data -> analysis -> compare -> report/proposal(read-only)
```

It does not include account state, execution, wallet/private key flows, order placement, or automatic action.

## Why this design

Prism already has a working artifact-backed funding-basis path:

```text
scan_funding_basis_arbitrage
  -> opportunityCards + artifactIds
  -> resolve_opportunity_artifact_reference
  -> explain_opportunity_artifact
  -> generate_opportunity_research_report
```

That path proves the core product direction is viable, but it is still shaped like a funding-basis-specific copilot. If Prism keeps adding verticals by writing new intent rules and ad hoc tools per market, it will accumulate routing sprawl, duplicated report/explanation logic, inconsistent artifact semantics, and policy drift.

The right move is to use two contrasting verticals to extract shared platform contracts:

- an already-implemented vertical: Binance/Bitget funding-basis research;
- a future sample vertical: World Cup + Polymarket multi-source research.

Those two verticals are different enough to expose which abstractions are truly platform-level and which belong in vertical plugins.

## North-star alignment

Prism should continue to align to:

```text
Information -> Energy -> Material
```

And to the shared operating core:

```text
Evidence -> MarketContext -> Comparison -> Signal -> Opportunity -> Score -> Artifact -> Proposal -> Risk
```

This implies:

1. Prism is not a single-strategy bot.
2. Prism is not just a generic agent shell.
3. Prism is a research copilot platform with vertical-specific capabilities plugged into shared platform contracts.
4. Artifacts are first-class product objects, not throwaway chat state.

## System positioning

Prism should be positioned as a:

> single-user, conversational, vertical-pluggable, artifact-backed collaborative financial research manager.

Its internal north-star identity is:

> a continuous research operating system for market opportunities.

The stable platform workflow is:

```text
User idea
-> goal framing
-> method exploration
-> capability / boundary check
-> source mapping
-> fact gathering
-> synthesis
-> materialization
-> review / monitor / proposal handoff
```

### Funding-basis example

```text
User asks for Binance/Bitget funding-basis opportunities
-> discover candidates
-> create opportunity artifacts
-> explain an artifact
-> generate a research report
```

### World Cup + Polymarket example

```text
User asks whether a World Cup market on Polymarket is worth researching
-> inspect APIs / data sources / market structure
-> gather schedule, team, news, and market facts
-> compare evidence and current odds
-> create artifacts
-> generate report / proposal(read-only)
```

The shared value is not the market type. The shared value is the platform workflow and the ability to preserve research as reusable artifacts.

## Platform contracts

Prism should stabilize four platform contracts before adding more vertical-specific product logic:

1. intent taxonomy
2. orchestration contract
3. artifact lifecycle
4. tool / safety policy

A fifth contract is the vertical plugin model that declares how each vertical participates in the shared platform.

These contracts must remain subordinate to the product identity rules:

1. Prism is research-first and artifact-first.
2. Prism is workspace-first; chat is a surface, not the product core.
3. Prism must preserve the distinction between signal, opportunity, proposal, and execution.
4. Prism must support both interactive research and continuous monitoring as linked product modes.
5. Funding-basis is the first wedge, not the permanent product identity.

## Intent taxonomy v2

Intent should describe the task type, not the market.

Recommended platform-level intents:

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

### Intent meanings

| Intent | Purpose | Funding-basis example | World Cup + Polymarket example |
| --- | --- | --- | --- |
| `discover` | Find candidate opportunities or research targets | Scan funding candidates | Find interesting World Cup markets or matches |
| `explore_method` | Explore and compare methods before live discovery | Compare funding-arbitrage methods | Compare ways to research or trade a prediction market |
| `explain` | Explain an existing artifact | Explain why the first artifact is interesting | Explain why a saved market artifact is interesting |
| `report` | Produce a structured research report | Generate opportunity research report | Generate event-market research report |
| `compare` | Compare artifacts or candidates | Compare two funding artifacts | Compare two markets, outcomes, or matches |
| `refresh` | Refresh current facts without mutating prior artifact truth | Refresh funding/depth/freshness | Refresh odds, liquidity, event news, or market changes |
| `monitor` | Run an approved workflow continuously | Monitor funding candidates over time | Monitor selected markets or events over time |
| `emit_signal` | Escalate a meaningful monitoring change | Emit arbitrage signal | Emit market-attention signal |
| `propose` | Build a read-only candidate action proposal | Build a funding research proposal | Build a read-only market idea proposal |
| `evaluate_risk` | Evaluate proposal risk with explicit structure | Funding proposal risk review | Prediction-market proposal risk review |
| `inspect_source` | Inspect API, source, rules, or schema | Check exchange API/source constraints | Check Polymarket APIs, resolution rules, schedule/news sources |
| `extension_required` | State that the requested vertical is not yet supported | Unsupported A-share flow | Unsupported sports/market flow |
| `general` | Handle non-structured conversational input | General Q&A | General Q&A |

### Design rule

Intent and vertical must be separated.

Correct mental model:

```text
intent = compare
vertical = funding_basis
```

or:

```text
intent = compare
vertical = prediction_market
```

This avoids an exploding matrix of funding-specific or prediction-specific intents.

## Capability routing contract

Prism should not route directly from user input to a tool. It should route through platform capability resolution:

```text
User input
-> resolve intent
-> resolve vertical
-> resolve capability
-> choose orchestration path
-> choose tool(s) / operation(s)
```

### Funding-basis example

```text
Explain the first opportunity
-> intent = explain
-> vertical = funding_basis
-> capability = artifact_backed_opportunity_explanation
-> path = resolve_reference -> explain_artifact
```

### World Cup + Polymarket example

```text
Help me research whether the World Cup final market on Polymarket is worth watching
-> intent = discover / inspect_source / propose
-> vertical = prediction_market
-> capability = multi_source_event_market_research
-> path = inspect sources -> gather facts -> compare -> artifact -> proposal(read-only)
```

## Orchestration contract v2

The platform should define a small set of stable orchestration paths.

### Path 0: Explore method

```text
explore_method
-> frame the problem
-> enumerate candidate methods
-> compare methods, boundaries, and required data
-> materialize method artifact or method comparison artifact
-> request or infer method lock before live opportunity discovery
```

### Path A: Discover

```text
discover
-> gather information
-> run domain operation
-> rank/select candidates
-> materialize artifact(s)
-> optionally summarize cards
```

### Path B: Explain

```text
explain
-> resolve artifact reference if needed
-> load artifact
-> generate explanation from artifact
```

### Path C: Report

```text
report
-> resolve artifact reference if needed
-> load artifact
-> generate structured report
```

### Path D: Compare

```text
compare
-> resolve one or more artifacts / entities
-> normalize comparable fields
-> build comparison result
-> materialize comparison artifact or report
```

### Path E: Refresh

```text
refresh
-> load prior artifact
-> fetch current facts from approved live tools
-> build refresh delta
-> preserve original artifact
-> emit refreshed view or refresh artifact
```

### Path F: Monitor

```text
monitor
-> load approved method/workflow and prior artifacts
-> refresh approved fact sources on schedule or trigger
-> compare current state with thresholds and historical artifacts
-> materialize refresh artifacts
-> emit signal or escalate into proposal review when conditions are met
```

### Path G: Emit signal

```text
emit_signal
-> summarize what changed
-> link to source, context, and artifact lineage
-> state why the change matters now
-> recommend next review or escalation step
```

### Path H: Propose

```text
propose
-> load artifact/report/comparison/signal
-> build read-only proposal
-> declare assumptions and missing facts
-> require explicit risk evaluation before any future action
```

### Path I: Evaluate risk

```text
evaluate_risk
-> load proposal
-> run deterministic checks
-> return structured risk result
```

### Path rules

1. Artifact-first by default after discovery.
2. Intent chooses the platform path.
3. Vertical chooses the domain implementation.
4. Report/proposal are read-only surfaces.
5. Refresh is explicit, not implicit.
6. Future action must remain outside the MVP1 research layer.

## Artifact lifecycle v2

Artifacts should be first-class product objects with an explicit lifecycle:

```text
create
-> enrich
-> explain/report
-> compare
-> refresh
-> derive proposal
-> derive risk
-> archive / supersede
```

### Lifecycle stage meanings

| Stage | Purpose |
| --- | --- |
| `create` | Generate an initial artifact from a domain operation or research flow |
| `enrich` | Add lineage, assumptions, provider refs, score, and metadata |
| `explain/report` | Generate explanation or report views from the artifact |
| `compare` | Build comparison outputs from multiple artifacts |
| `refresh` | Derive a new refresh object from updated facts without mutating history |
| `derive proposal` | Build a read-only proposal from artifact/report/comparison inputs |
| `derive risk` | Build a structured risk object from proposal inputs |
| `archive / supersede` | Mark stale or replaced objects without deleting the research trail |

## Artifact family model

The platform should grow beyond opportunity-only artifacts and define an artifact family:

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

### Artifact family meanings

| Artifact type | Purpose | Funding-basis example | World Cup + Polymarket example |
| --- | --- | --- | --- |
| `research_brief` | Define the scope of a research task | Funding scan scope | World Cup market research objective |
| `method_artifact` | Preserve the chosen or compared research/trading method | Funding method comparison | Prediction-market research method comparison |
| `source_snapshot` | Preserve source/API/rule inspection results | Provider availability snapshot | Polymarket API, schedule source, or news-source inspection |
| `market_context_snapshot` | Preserve time-specific market context | Funding/ticker/depth snapshot | Event/outcome/odds/liquidity snapshot |
| `comparison_artifact` | Save comparison results | Compare two funding candidates | Compare two markets or two outcomes |
| `signal_artifact` | Preserve distilled research signal | Funding spread signal | Market-dislocation or event signal |
| `opportunity_artifact` | Save candidate opportunity or research target | Funding opportunity artifact | Candidate event-market artifact |
| `research_report` | Save structured read-only research report | Opportunity report | Event-market research report |
| `monitor_definition` | Preserve an approved continuous-monitor workflow | Funding monitor config | Event-market monitor config |
| `proposal_artifact` | Save a read-only candidate action proposal | Funding read-only proposal | Polymarket read-only proposal |
| `risk_artifact` | Save structured risk analysis | Funding risk result | Prediction-market risk result |
| `refresh_artifact` | Save refresh delta and updated view | Funding refresh delta | Odds/news/market refresh delta |

## Refresh derivation rule

Refreshing facts must not overwrite the historical truth of the original artifact.

Incorrect pattern:

```text
artifact_v1
-> refresh
-> overwrite artifact_v1
```

Correct pattern:

```text
artifact_v1
-> refresh
-> refresh_artifact_v1
-> optionally derive artifact_v2
```

This keeps the original artifact explainable in its original context while still allowing a current view.

## Vertical plugin model

Each vertical should plug into the platform by declaring five categories:

1. capability declaration
2. information model
3. domain operations
4. artifact mapping
5. policy profile

### 1. Capability declaration

Each vertical declares which platform paths it supports.

Example:

```text
funding_basis supports:
discover / explain / report / compare / refresh / propose / evaluate_risk

prediction_market supports:
inspect_source / discover / explain / report / compare / refresh / propose
```

### 2. Information model

Each vertical declares its own fact and context surface.

Funding-basis information model:
- funding rates
- ticker
- depth
- exchange market metadata

Prediction-market information model:
- event schedule
- team/news/injury or event context
- market odds and liquidity
- market rules and resolution logic

### 3. Domain operations

The platform defines the path contracts; each vertical defines its deterministic operations.

Funding-basis examples:
- funding scan
- artifact explanation
- research report
- compare
- refresh
- proposal
- risk

Prediction-market examples:
- source inspection
- event-market discovery
- evidence synthesis
- odds comparison
- market opportunity selection
- report
- proposal

### 4. Artifact mapping

Each vertical declares which intermediate outputs become which artifact family types.

Funding-basis mapping:
- comparison -> `comparison_artifact`
- opportunity -> `opportunity_artifact`
- report -> `research_report`

Prediction-market mapping:
- API/source inspection -> `source_snapshot`
- event or market state -> `market_context_snapshot`
- candidate market focus -> `opportunity_artifact`
- final read-only recommendation -> `proposal_artifact`

### 5. Policy profile

Each vertical stays under the platform policy but may add stricter local boundaries.

Funding-basis profile:
- no execution/account/private endpoints
- read-only by default

Prediction-market profile:
- no real bet placement
- no wallet/private key path
- no automatic participation
- read-only market research only

## Technical boundary model

Prism should be designed around capability layers, not around permanent commitment to a small set of frameworks.

### Layered ownership model

| Layer | Responsibility | Ownership |
| --- | --- | --- |
| Product control plane | intent, routing, orchestration, artifact lifecycle, tool policy, vertical capability model | Prism-owned |
| Conversation runtime shell | tool registration, tool invocation, single-user chat entry | replaceable runtime implementation |
| Fact/source layer | API fetch, market data, source inspection, search | replaceable connectors and tools |
| Domain analysis layer | deterministic analysis, scoring, comparison, signal synthesis, report/proposal/risk contracts | mostly Prism-owned |
| Worker / heavy-processing layer | batch analysis, extraction, cleanup, offline jobs, long-running prep work | replaceable worker plane |
| Observability / eval layer | tracing, evaluation, quality gates | replaceable support tooling |

### Current recommended implementation split

Recommended current split:

```text
Prism self-owned:
  intent taxonomy
  capability routing
  orchestration contract
  artifact lifecycle
  tool policy
  vertical capability model
  domain operations
  proposal/risk contracts

Current runtime shell:
  Pi Agent, as the current best-fit conversational runtime container

Current worker-plane preference:
  Python + Pydantic for heavy structured processing, analytics workers, or offline jobs

Future optional background orchestration:
  LangGraph, Temporal, queue systems, or other workflow runtimes for non-MVP1 background flows
```

### Technical principles

1. Prism should own the product control plane.
2. The runtime shell must remain replaceable.
3. Worker-plane technology should stay behind stable interfaces.
4. Background orchestration should not define platform semantics.
5. Retrieval/memory systems must not replace artifact lifecycle.
6. Schema strategy should remain coherent inside the TypeScript product plane.

## Tool policy v2

Tools should be categorized by platform role:

```text
source_inspection_tools
live_fact_tools
analysis_tools
artifact_tools
report_tools
proposal_tools
risk_tools
forbidden_tools
```

### Tool class meanings

| Tool class | Purpose | Examples |
| --- | --- | --- |
| `source_inspection_tools` | Inspect APIs, rules, market structure, or source quality | Polymarket API inspection, source validation |
| `live_fact_tools` | Read current facts | funding, ticker, odds, liquidity, schedule snapshots |
| `analysis_tools` | Deterministic compute and comparison | edge calculation, comparison, signal synthesis |
| `artifact_tools` | Save/load/resolve artifacts | artifact save/get/reference resolution |
| `report_tools` | Build explanation/report/compare views | explanation, research report |
| `proposal_tools` | Build read-only proposals | future proposal builders |
| `risk_tools` | Run structured risk checks | future risk evaluators |
| `forbidden_tools` | Execution, private keys, orders, balances, transfer, wallet signing | any action-capable tool family |

### Policy rules

1. Read-only is the default platform mode.
2. Proposal and action must remain separate.
3. Refresh is explicit, not hidden inside report/explain.
4. Secrets, account state, orders, transfers, wallet signing, or execution fields must not leak into research-plane schemas.
5. Any future action path must require proposal, deterministic risk, explicit confirmation, and audit boundaries first.

## Current codebase mapping

This design extends current Prism code rather than replacing it.

### Already present in the local codebase

- provider-backed facts in `@agentkernel/tools`
- deterministic operations in `@agentkernel/operations`
- artifact save/get in `@agentkernel/storage`
- runtime tool contracts in `@agentkernel/agent-kernel`
- funding-basis discovery via `scan_funding_basis_arbitrage`
- session reference resolution via `resolve_opportunity_artifact_reference`
- artifact explanation via `explain_opportunity_artifact`
- artifact-backed report generation via `generate_opportunity_research_report`
- enriched opportunity artifact envelope carrying assumptions, lineage, warnings, and calculated metrics

### What still needs platform-level elevation

- platform-wide intent taxonomy instead of funding-shaped routing only
- capability routing contract
- compare path contract
- refresh path contract
- proposal artifact and proposal path
- risk artifact and risk path
- artifact family naming and lifecycle semantics
- source snapshot and research brief artifacts
- vertical plugin declaration model

## OpenSpec delivery model

The design should be delivered through one platform blueprint change plus sequential capability slices.

### Platform blueprint

Recommended new platform-level OpenSpec change:

```text
openspec/changes/define-vertical-pluggable-research-copilot/
```

Its responsibility is to define:
- platform intent taxonomy
- orchestration contract
- artifact lifecycle and artifact family
- tool/safety policy
- vertical plugin model
- runtime shell vs worker plane boundary

### Sequential slices

Recommended follow-up slice order:

1. funding-basis platformization
2. prediction-market sample vertical spec
3. compare + refresh platform slices
4. proposal + risk platform slices
5. optional worker/background orchestration slices later

This keeps MVP1 moving while preventing architecture drift.

## Multi-agent development model

Multi-agent architecture is recommended for development workflow, not for the end-user runtime control plane.

### Recommended development roles

| Role | Responsibility | Expected output |
| --- | --- | --- |
| Architect agent | North-star alignment, platform blueprint, slice boundaries | main spec and architecture review |
| Runtime agent | intent routing, tool contract, policy enforcement | agent-kernel design and tests |
| Operations agent | deterministic operation contracts | operations design and tests |
| Artifact agent | lifecycle, lineage, artifact family, refresh/proposal/risk derivation | storage/material design |
| Vertical agent | funding-basis or prediction-market plugin specifics | vertical-specific specs |
| Critic/Test agent | critic review, test matrix, safety scan coverage | critic and verification assets |

### Development rule

Multi-agent collaboration should accelerate spec writing, review, and testing. It should not introduce a multi-agent runtime negotiation loop into the MVP1 user path.

## Delivery milestones

Recommended milestone order:

### Milestone 1: Platform blueprint
- finalize the platform contracts
- lock terminology and boundaries

### Milestone 2: Funding-basis platformization
- reframe current funding flow as the first canonical platform implementation
- add compare/refresh/proposal-read-only contracts for the funding vertical

### Milestone 3: Prediction-market sample vertical
- write a World Cup + Polymarket sample spec at the research-and-recommendation layer
- do not include execution

### Milestone 4: Proposal + risk contracts
- define proposal artifact and risk artifact
- define deterministic risk preconditions for any future action path

### Milestone 5: Optional worker/background expansion
- only after the control plane is stable, evaluate stronger worker/background systems

## Research state, monitor model, and signal model

The platform must support a strong-autonomy research loop that does not collapse back into stateless chat. To do that, Prism needs three linked product objects:

1. `ResearchState`
2. `MonitorDefinition`
3. `SignalArtifact`

### ResearchState

`ResearchState` is the task-level working memory for an active research flow. It exists to preserve:

- the current goal;
- current scope;
- vertical;
- current phase;
- active intent stack;
- current method exploration / method lock state;
- source map;
- fact set;
- candidate set;
- artifact refs;
- open questions;
- next steps;
- autonomy mode and pause reason;
- key history.

Recommended minimum structure:

```text
ResearchState
- goal
- scope
- vertical
- currentPhase
- intentStack
- methodState
- sourceMap
- factSet
- candidateSet
- artifactSet
- openQuestions
- nextSteps
- autonomyMode
- pauseState
- history
```

### MethodState

Because Prism must support method exploration before live opportunity discovery, `ResearchState` should include a `MethodState`:

```text
MethodState
- status: exploring | compared | locked | superseded
- candidateMethods
- selectedMethod
- methodArtifacts
- methodSelectionReason
- requiredCapabilities
- requiresPrivateApis
```

This ensures Prism can support flows such as: user wants exchange funding-rate arbitrage -> Prism compares methods -> method is locked -> only then does live opportunity discovery or continuous monitoring proceed.

### SourceMap

`SourceMap` should be first-class because Prism is a multi-source research system rather than a single-feed scanner. Each source entry should at least preserve:

```text
SourceEntry
- id
- type
- role
- trustLevel
- freshness
- status
- lastCheckedAt
- notes
```

Typical roles include official source, market source, rules/resolution source, and news/context source.

### CandidateSet and ArtifactSet

`CandidateSet` records the active research candidates Prism is narrowing down. `ArtifactSet` records the artifacts already materialized for the current research loop. `ResearchState` should hold refs and summaries, not duplicate heavy artifact payloads.

### Autonomy and pause semantics

`ResearchState` should make continuation rules explicit:

```text
auto
auto_with_notice
pause_required
```

Pause reasons should also be structured, for example:

```text
goal_change_required
scope_expansion_requires_confirmation
source_conflict
method_lock_required
proposal_review_required
boundary_guard
```

### State-driven behavior

`ResearchState` is not passive storage. It must drive path and tool selection. Example:

- `currentPhase = method_exploration` -> prefer source inspection and method comparison paths;
- `currentPhase = fact_gathering` -> prefer live fact tools;
- `methodState.status = locked` -> allow discover/monitor progression;
- `pauseState = proposal_review_required` -> block further escalation.

### MonitorDefinition

When a workflow is locked and should keep running, Prism must derive a `MonitorDefinition` from prior research rather than relying on hidden runtime state.

Recommended minimum structure:

```text
MonitorDefinition
- goalRef
- methodRef
- vertical
- watchedEntities
- sourcePolicy
- refreshCadence
- triggerConditions
- comparisonRules
- thresholds
- signalRules
- escalationRules
- pauseRules
- status
```

`MonitorDefinition` is the bridge from interactive research to continuous monitoring. It preserves what is being watched, how often it should refresh, how comparisons work, when signals should be emitted, and when escalation into proposal review is required.

### SignalArtifact

Signals must be distinct from both reports and proposals. They are lightweight escalations that summarize what changed and why it matters now.

Recommended minimum structure:

```text
SignalArtifact
- monitorRef
- sourceRefs
- comparisonRefs
- opportunityRef?
- kind
- severity
- confidence
- changeSummary
- whyItMatters
- recommendedNextStep
- escalatedToProposal
- createdAt
```

Signal rules:

1. a signal is not a full report;
2. a signal is not a proposal;
3. a signal must preserve lineage to source/context/comparison artifacts;
4. a signal may escalate into proposal review.

### The linked loop

These three objects create the product loop for continuous research:

```text
ResearchState
-> method lock / artifacts
-> MonitorDefinition
-> periodic refresh / comparison
-> SignalArtifact
-> optional proposal escalation
```

This is how Prism supports both:

- interactive collaborative research;
- workflow lock-in followed by continuous monitoring and signal emission.

## Success criteria

This design is successful when:

1. Prism can describe platform-level research workflows without embedding funding-specific assumptions in the control plane.
2. Funding-basis remains a working MVP1 vertical while being elevated into a reusable platform implementation.
3. A future World Cup + Polymarket vertical can be specified without rewriting intent, artifact, or policy foundations.
4. Artifacts become the durable source of truth for explain/report/compare/proposal flows.
5. Refresh does not overwrite historical research truth.
6. Tool policy remains explicitly read-only at the research layer.
7. Proposal/risk become the next clear bridge from research copilot toward future action systems.
8. The architecture remains open to additional runtime shells, worker planes, and support libraries without giving away product control-plane ownership.

## Scope limits

This design intentionally does not specify:

- account models
- balances, positions, or orders
- wallet/private key flows
- bet placement or trade execution
- automatic action
- final framework lock-in beyond the current recommended split
- full implementation details for compare, refresh, proposal, or risk logic

Those belong to future slices after the platform contracts are locked.
