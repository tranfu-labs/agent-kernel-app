# Prism Docs

Current architecture, workflow, and implementation docs for the Pi Agent Kernel replatform.

## Start here

If you need the shortest path to the current system state, read these in order:

1. [Root README](../README.md)
2. [Core Strategy and Architecture](./PRISM_CORE_STRATEGY_AND_ARCHITECTURE.md)
3. [Information / Energy / Material Architecture](./INFORMATION_ENERGY_MATERIAL_ARCHITECTURE.md)
4. [Opportunity Operating Core Architecture](./PRISM_OPPORTUNITY_OPERATING_CORE_ARCHITECTURE.md)
5. [Vertical-Pluggable Research Copilot Design](../docs/superpowers/specs/2026-05-31-vertical-pluggable-research-copilot-design.md)
6. [Vertical-Pluggable Research Copilot Implementation Plan](../docs/superpowers/plans/2026-05-31-vertical-pluggable-research-copilot.md)

## Current implementation status

The currently implemented control-plane slices are:

- platform blueprint OpenSpec change;
- research state and artifact family contracts;
- platform capability routing;
- method exploration;
- funding-basis vertical declaration and discover metadata;
- compare and refresh slices;
- monitor and signal slices;
- proposal and deterministic risk slices;
- platform runtime guidance;
- prediction-market sample vertical spec and declaration stub.

The current product shape is still intentionally narrow:

- funding-basis is the first working vertical;
- prediction-market is a sample read-only vertical stub;
- research, monitoring, signals, reports, and proposals are in scope;
- execution, wallet/private-key flows, and automatic action remain out of scope.

## Active design and spec sources

- [Vertical-Pluggable Research Copilot Design](../docs/superpowers/specs/2026-05-31-vertical-pluggable-research-copilot-design.md)
- [Vertical-Pluggable Research Copilot Implementation Plan](../docs/superpowers/plans/2026-05-31-vertical-pluggable-research-copilot.md)
- [OpenSpec: define-vertical-pluggable-research-copilot](../openspec/changes/define-vertical-pluggable-research-copilot/)
- [OpenSpec: add-prediction-market-sample-vertical](../openspec/changes/add-prediction-market-sample-vertical/)

## Architecture docs

- [Core Strategy and Architecture](./PRISM_CORE_STRATEGY_AND_ARCHITECTURE.md)
- [Information / Energy / Material Architecture](./INFORMATION_ENERGY_MATERIAL_ARCHITECTURE.md)
- [Opportunity Operating Core Architecture](./PRISM_OPPORTUNITY_OPERATING_CORE_ARCHITECTURE.md)
- [Domain Contracts](./DOMAIN_CONTRACTS.md)
- [TS Read Plane + Python Analytics Technical Route](./TS_PYTHON_TECHNICAL_ROUTE.md)
- [Network-Resilient Market Data Workflow](./NETWORK_RESILIENT_MARKET_DATA_WORKFLOW.md)
- [Binance Market Data Read Plane](./BINANCE_MARKET_DATA_READ_PLANE.md)

## Workflow and delivery docs

- [OpenSpec + Superpowers Development Workflow](./DEVELOPMENT_WORKFLOW_OPENSPEC_SUPERPOWERS.md)
- [Migration from Prism_old](./MIGRATION_FROM_PRISM_OLD.md)
- [Prism_old Mining Guide](./PRISM_OLD_MINING_GUIDE.md)
- [Next Implementation Plan](./NEXT_IMPLEMENTATION_PLAN.md)

## Product and inventory docs

- [MVP Agent Kernel Plan](./MVP_AGENT_KERNEL_PLAN.md)
- [MVP Funding-Basis Arbitrage Vertical Plan](./MVP_FUNDING_BASIS_ARBITRAGE_PLAN.md)
- [Skill Inventory](./SKILL_INVENTORY.md)
- [Tool Inventory](./TOOL_INVENTORY.md)

## Current decision

Prism is being rebuilt as:

```text
Pi Agent Kernel as runtime substrate
Prism as financial intelligence-to-action product system
Prism_old as legacy capability mine
```
