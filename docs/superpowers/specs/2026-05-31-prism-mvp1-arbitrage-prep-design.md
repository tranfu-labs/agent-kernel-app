# Prism MVP1 Arbitrage-Prep Design

## Goal

Define the accurate Prism MVP1 product scope so the project stops treating MVP1 as a generic research copilot and instead converges on one concrete, testable, high-value closed loop.

Prism MVP1 should be:

```text
A read-only but execution-adjacent, semi-automated Binance + Bitget arbitrage preparation system.
```

Its required main case is:

```text
cross-exchange funding-rate arbitrage
```

Its product job is not to place trades. Its product job is to take a user from natural-language intent to a structured, reviewable manual execution-prep plan.

## Recommended MVP1 Positioning

Prism MVP1 should be positioned as:

> a semi-automated arbitrage preparation copilot for Binance + Bitget, with one fully closed-loop strategy: cross-exchange funding-rate arbitrage.

This definition is deliberately narrower than the long-term north star and deliberately stronger than a pure research assistant.

It is **not**:
- a generic market-research chatbot;
- a live execution bot;
- a wallet/account system;
- a broad multi-strategy trading platform.

It **is**:
- strategy-aware;
- artifact-backed;
- read-only;
- deterministic-first;
- able to produce execution-prep outputs that a human can review and act on outside Prism.

## Why this is the right MVP1

This scope is the best balance across architecture, evolution, safety, efficiency, and quality.

### Architecture

A single fully closed-loop strategy forces clear boundaries:

```text
intent -> route -> market data normalization -> opportunity discovery -> execution-prep contract -> deterministic risk gate -> artifact/report/explanation
```

That creates a real product spine instead of a loose set of research features.

### Evolution

The current codebase already has strong control-plane work. The most efficient next step is not widening intent coverage further; it is finishing the main product loop underneath that control plane.

### North-star compatibility

Prism still aligns to:

```text
Information -> Energy -> Material
```

and to:

```text
Evidence -> MarketContext -> Comparison -> Signal -> Opportunity -> Score -> Artifact -> Proposal -> Risk
```

MVP1 simply chooses one strategy family to close first.

### Safety

Execution-prep without execution is the right boundary. It creates high user value while avoiding wallet/private-key/order-placement risk.

### Efficiency

One closed-loop strategy is the smallest scope that can be meaningfully tested, demoed, and improved.

### Quality

A product with one strong spine is better than a product with five half-supported ideas.

## Product Boundary

### In scope

MVP1 must support:

1. Binance + Bitget as the only built-in venues.
2. Cross-exchange funding-rate arbitrage as the only fully closed-loop strategy.
3. Natural-language method selection and opportunity discovery.
4. Read-only market-data gathering and normalization.
5. Candidate opportunity generation and ranking.
6. Execution-prep plan generation.
7. Deterministic risk and constraint evaluation.
8. Human-readable output plus structured JSON contract output.
9. Artifact-backed explain/report/proposal/risk follow-up.

### Out of scope

MVP1 must not support:

- live order placement;
- balances, positions, or private account state;
- API key or private wallet management;
- margin or leverage mutation;
- transfers, withdrawals, or settlement flows;
- autonomous trading;
- equal-completeness support for spot/perp arbitrage;
- equal-completeness support for more exchanges;
- broad multi-vertical live execution.

## Main Closed-Loop Strategy

The only strategy that must reach true MVP1 completeness is:

```text
Binance + Bitget cross-exchange funding-rate arbitrage
```

The system must be able to:

1. Recognize that the user wants funding-rate arbitrage or wants the system to search for arbitrage opportunities.
2. Gather normalized market facts from both venues.
3. Detect and score opportunities.
4. Turn a candidate into a trade-prep proposal.
5. Evaluate whether it is fit for manual execution preparation.
6. Return both readable and machine-readable output.

## Extension Strategy Policy

Prism may discuss or partially support:

- spot/perp basis ideas;
- alternative arbitrage methods;
- future venues;
- future market categories.

But in MVP1 these are extension paths, not equal peers to the main strategy.

Recommended rule:

```text
One strategy must be complete.
Other strategies may be inspectable, discussable, or partially modeled, but not required to be execution-prep complete.
```

## Pi Agent vs Prism Responsibility Split

The responsibility split should be explicit and stable.

### Pi Agent owns

- runtime loop;
- tool-calling infrastructure;
- session execution;
- schema invocation;
- general agent mechanics.

### Prism owns

- intent recognition for the arbitrage product;
- strategy-family routing;
- policy gates;
- orchestration templates;
- market-data normalization contracts;
- opportunity semantics;
- execution-prep contract generation;
- deterministic risk gating;
- artifact lifecycle;
- acceptance and regression standards.

### Rule

Pi Agent is the general runtime.
Prism is the arbitrage-preparation product logic.

If execution-prep logic remains outside Prism, MVP1 stays a thin routing layer rather than a differentiated product.

## Mandatory MVP1 Modules

### Module 1: Intent / Control Plane

Purpose:

```text
recognize user goal -> choose vertical/strategy/path -> enforce policy -> select orchestration template
```

Required behaviors:
- distinguish funding arbitrage from generic discussion;
- distinguish main strategy from extension strategy requests;
- preserve read-only boundary;
- route follow-up turns through artifact-aware paths;
- support future-compatible contracts.

Current status:
- largely implemented;
- already strong relative to the new MVP1 target;
- should now be treated as a prerequisite subsystem, not the whole MVP1.

### Module 2: Binance/Bitget Market Data Normalization

Purpose:

```text
convert venue-specific funding, mark-price, index-price, and depth data into stable internal models
```

Required behaviors:
- symbol normalization;
- venue field normalization;
- freshness tracking;
- funding and price context alignment;
- stable input contract for opportunity discovery.

This is a hard requirement. Without it, downstream scoring and prep logic are untrustworthy.

### Module 3: Opportunity Discovery and Ranking

Purpose:

```text
turn normalized market data into candidate arbitrage opportunities
```

Required behaviors:
- detect funding-rate spread opportunities;
- identify candidate long/short venue pairing;
- apply minimum edge and liquidity filtering;
- rank candidates;
- persist opportunity artifacts.

This module must produce candidates intended for later execution preparation, not just descriptive analytics.

### Module 4: Execution-Prep Contract Builder

Purpose:

```text
turn a candidate opportunity into a structured manual execution-prep plan
```

This is the most important missing module.

Required output forms:

1. Human-readable trade-prep plan.
2. Structured JSON execution-prep contract.

The contract should minimally include:
- opportunity id;
- strategy family;
- exchanges;
- normalized instruments;
- recommended legs;
- why this direction is proposed;
- funding/price references;
- recommended order sequence;
- order-type guidance;
- abort conditions;
- failed-leg handling guidance;
- risk notes;
- completeness/confidence flags.

### Module 5: Deterministic Risk / Constraint Evaluator

Purpose:

```text
decide whether a candidate is acceptable for manual execution preparation
```

Required behaviors:
- reject stale or insufficient evidence;
- reject incomplete hedge structure;
- reject edge too small for friction;
- surface failed-leg danger;
- surface liquidity and timing warnings;
- produce deterministic pass/hold/reject style outcomes.

This module is mandatory because MVP1 must not only find ideas; it must know when not to advance them.

### Module 6: Artifact / Follow-up Layer

Purpose:

```text
persist and reuse opportunity, proposal, and risk state across turns
```

Required behaviors:
- save opportunity artifacts;
- explain existing opportunities;
- generate reports from artifacts;
- generate execution-prep proposals from artifacts;
- run risk follow-up from proposal artifacts.

This layer already exists in early form, but its artifact semantics now need to reflect execution preparation, not only research memory.

### Module 7: Quality Gates and Acceptance Harness

Purpose:

```text
prove the main strategy works end-to-end and does not regress below baseline quality
```

Required gate families:
- control-plane gate;
- data normalization gate;
- strategy/output gate;
- execution-prep gate;
- safety gate.

## Execution-Prep Contract Recommendation

The execution-prep contract should be treated as the key MVP1 product object.

Recommended shape:

```text
ExecutionPrepContract
  opportunity_id
  strategy_family
  exchanges
  instruments
  legs
  rationale
  market_references
  sequence_recommendation
  order_type_recommendation
  abort_conditions
  failed_leg_handling
  risk_notes
  confidence_flags
```

### Example field groups

#### Identity
- `contract_version`
- `opportunity_id`
- `strategy_family`
- `generated_at`

#### Venue/instrument mapping
- `binance_symbol`
- `bitget_symbol`
- `normalized_asset`
- `market_type`

#### Leg plan
- `leg_a.exchange`
- `leg_a.side`
- `leg_a.instrument`
- `leg_b.exchange`
- `leg_b.side`
- `leg_b.instrument`

#### Evidence snapshot
- `funding_rates`
- `mark_prices`
- `spread_snapshot`
- `freshness`

#### Execution recommendation
- `preferred_open_sequence`
- `recommended_order_style`
- `pre_second_leg_checks`

#### Abort conditions
- `max_slippage_bps`
- `max_spread_compression_bps`
- `max_quote_staleness_ms`
- `missing_hedge_leg_policy`

#### Failure handling
- `leg_b_not_filled_action`
- `hedge_failure_guidance`
- `manual_intervention_required`

#### Risk/completeness
- `risk_notes`
- `ready_for_manual_execution_prep`
- `requires_human_confirmation`
- `missing_inputs`

## Orchestration Model

Prism should keep bounded orchestration, not drift into an open-ended planner.

Recommended workflow classes:

### Main strategy workflows
- discover funding opportunity;
- explain opportunity artifact;
- report from artifacts;
- build execution-prep proposal;
- evaluate proposal risk.

### Extension workflows
- discuss spot/perp methods;
- inspect unsupported strategies;
- inspect future venue support;
- research broader arbitrage methods.

### Boundary workflows
- real execution requests;
- wallet/private-key/account requests;
- unsupported market participation flows.

## Acceptance Definition

MVP1 is complete only when the main strategy satisfies all of the following.

### Product acceptance

The system can take a funding-rate arbitrage request and return:
- ranked candidates;
- an execution-prep recommendation for the best candidate;
- explicit deterministic risk notes;
- a structured JSON contract;
- no execution action.

### Safety acceptance

The system never:
- places orders;
- implies direct execution authority;
- accesses private account state;
- softens read-only boundaries for convenience.

### Quality acceptance

The system passes:
- control-plane regression/baseline gates;
- deterministic opportunity and proposal tests;
- execution-prep schema tests;
- safety/no-execution tests;
- end-to-end smoke for the main strategy.

## Current Gap vs Target

### Already strong

- control-plane routing;
- deterministic intent/path policy;
- artifact-backed explain/report/propose/risk semantics;
- baseline non-inferiority gating;
- smoke and acceptance discipline around routing.

### Partially present

- funding-basis discovery substrate;
- opportunity scanning;
- artifact persistence;
- some proposal/risk scaffolding.

### Still missing for real MVP1 completion

1. a first-class execution-prep contract builder;
2. deterministic pre-trade risk and abort-condition gate;
3. end-to-end main-strategy acceptance proving the output is useful for manual execution prep.

## Success Criteria

This design is successful when Prism MVP1 is no longer described vaguely as a research copilot and is instead understood as:

```text
A read-only, semi-automated Binance + Bitget arbitrage preparation system with one fully closed-loop strategy: cross-exchange funding-rate arbitrage.
```

And when the team can clearly separate:
- what is already done;
- what is foundation only;
- what still blocks MVP1 completion.
