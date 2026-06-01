## Why

Prism already has an artifact-backed funding-basis path, but the current control plane is still shaped around one vertical. We need platform contracts that let funding-basis remain the first MVP wedge while future research verticals such as prediction markets reuse the same intent, artifact, and policy foundations.

## What changes

- Define a platform intent taxonomy separated from vertical identity.
- Define stable orchestration paths for explore_method/discover/explain/report/compare/refresh/monitor/emit_signal/propose/evaluate_risk.
- Define artifact-family and refresh-derivation rules, including `opportunity_artifact` as a first-class platform artifact.
- Define vertical plugin declarations and policy boundaries.
- Keep the research layer read-only and explicitly separate emit_signal, proposal, and execution.

## Impact

- Affects `@agentkernel/domain`, `@agentkernel/operations`, `@agentkernel/agent-kernel`, and `@agentkernel/storage` at the blueprint/specification level for this slice.
- Creates the blueprint for funding-basis platformization and later prediction-market spec slices.

## Out of scope / non-goals

- Private or authenticated provider APIs, including any endpoint that requires account-scoped credentials beyond approved public research access.
- Account, wallet, portfolio, balance, position, or other user-state modeling.
- Order creation, trade execution, execution monitoring, or broker/exchange write actions.
- Broad UI/renderers/workspace work beyond the dedicated runtime identity baseline slice below.

## Immediate runtime identity baseline slice

A narrow implementation slice is approved inside this broader change set to prevent product/runtime drift in the current web chat:

- Canonical boundary: `packages/agent-kernel/src/create-prism-agent-session.ts`
- Mechanism: inject the existing `PRISM_SYSTEM_PROMPT` at Pi session bootstrap using the SDK-supported resource-loader path
- Goal: ensure fresh Pi sessions identify and behave as Prism rather than a generic coding assistant
- Non-goals for this slice:
  - no tool/result renderer work
  - no `/threads` support
  - no attachment/multimodal work
  - no UI/workspace redesign
  - no execution/risk workflow expansion

This slice is foundational only. It is not the end state of the product; renderer-backed financial outputs and workspace-transition primitives remain follow-up work.

## Acceptance outcomes

- `proposal.md`, `design.md`, `test-matrix.md`, and `tasks.md` explicitly describe a vertical-pluggable research blueprint that preserves the approved Prism taxonomy and platform language.
- The blueprint explicitly states that Prism research remains inside a safety boundary that excludes private APIs, account or wallet state, and orders or execution.
- The blueprint explicitly identifies affected Prism planes and separates blueprint authoring/validation in this slice from later implementation slices.
- `openspec validate "define-vertical-pluggable-research-copilot"` passes from the Prism repository root.
