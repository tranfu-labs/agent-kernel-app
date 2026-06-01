# Proposal: Genericize Kernel via Vertical Injection

## Summary

Make the AgentKernel core domain-agnostic by introducing a runtime `KernelVertical` injection seam. The kernel ships a generic assistant by default (no domain tools), and the funding-basis financial capability becomes an optional, injected example vertical rather than hardcoded product identity.

## Motivation

The repository's north star is a domain-agnostic agent foundation: a Pi Agent runtime + Web UI base on which other colleagues build agents for different industries by contributing a vertical (tools + system prompt + contracts), without editing the kernel.

The current implementation contradicts this. The only live coupling is in `packages/agent-kernel/src/create-agent-session.ts`, which hardcodes `PRISM_SYSTEM_PROMPT` (a financial identity) plus 13 funding tools (`createPrismToolDefinitions`) into every Pi session. Adding any non-financial vertical today requires editing 7 kernel-core files, and `VerticalPluginDeclaration` is declared but never consumed. The base shell (CopilotKit Web UI, `agui-bridge`) is already generic; the kernel session bootstrap is the single chokepoint.

This change defines the injection contract and the base/vertical boundary so the kernel core carries zero domain vocabulary, while funding-basis remains a working reference vertical proving the seam end-to-end.

## Scope

- Define a runtime `KernelVertical` interface in `@agentkernel/agent-kernel` (`id`, `systemPrompt`, `createTools(ctx)`, optional `createRuntimeContext`, optional `declaration`). It references the Pi `ToolDefinition` type, so it lives in `agent-kernel`, not `domain`.
- Define `KernelRuntimeContext` as the generic runtime context (artifact store only); vertical-specific session state (e.g. opportunity references) moves into the vertical's own context extension.
- Define a `GENERIC_ASSISTANT_VERTICAL` default: a neutral helpful-assistant `systemPrompt` with no domain language and `createTools: () => []`.
- Change `createKernelAgentSession` / `buildAgentSessionOptions` to accept `{ vertical?: KernelVertical }`, defaulting to `GENERIC_ASSISTANT_VERTICAL`, and to inject `vertical.systemPrompt` + `vertical.createTools(ctx)` instead of hardcoded Prism symbols.
- Define the base/vertical type-split rule and the concrete inventory (which `domain` types and which packages stay generic vs. move to `verticals/funding-basis`). Open the closed enums `ResearchVertical` and `ArtifactType` to `string`-extensible forms.
- Package `FUNDING_BASIS_VERTICAL_PLUGIN` (initially wrapping the existing funding prompt + tools + context in place) so callers opt into the financial agent explicitly.
- Keep the research layer read-only; keep signal / proposal / execution separation; keep `no-execution` governance.

## Non-Goals

- No implementation of a second real (non-financial) vertical in this change; a `BUILD_A_VERTICAL` developer guide plus the generic default suffice as the genericity proof.
- No changes to the Pi Agent SDK itself.
- No new execution, order placement, wallet, account-state, or private-API capability; the base stays read-only.
- No Web UI visual redesign (only generic copy + optional env-selected vertical).
- No removal of the funding-basis capability or its tests; it is demoted, not deleted.
- The physical package move (`verticals/funding-basis`), the de-Prism renaming, and docs rewrite are sequenced as later implementation slices governed by this blueprint, not all landed in the first code slice.

## Success Criteria

- A fresh kernel session created with no `vertical` argument identifies and behaves as a generic assistant — not Prism, no financial vocabulary, zero domain tools.
- The same `createKernelAgentSession`, given `FUNDING_BASIS_VERTICAL_PLUGIN`, reproduces today's funding-basis tool set and behavior with no kernel-core edits.
- The `KernelVertical` contract is sufficient for a new vertical to be added by injection alone: the design enumerates exactly what a colleague implements and confirms no kernel-core file must change.
- `ResearchVertical` and `ArtifactType` accept new vertical/artifact identifiers without editing `domain`.
- The base/vertical split inventory is explicit and leaves the kernel core (`agent-kernel` minus the funding plugin, `agui-bridge`, generic `domain`, `storage`, `policies`) free of `funding`/`venue`/`opportunity`/`Prism` vocabulary.
- All existing tests remain green; funding behavior is preserved through the injected plugin.
- A safety scan confirms no new execution/account/private-API surface is introduced.

## Impact

- Affects `@agentkernel/agent-kernel` (new injection seam + generic default), `@agentkernel/domain` (open enums, type-split boundary), `@agentkernel/agui-bridge` (generic default description), and `apps/web` (default generic, optional env vertical) at contract level.
- Creates the blueprint for `verticals/funding-basis` extraction and the subsequent de-Prism renaming and docs slices.
- Supersedes the runtime-identity-baseline direction of `define-vertical-pluggable-research-copilot` (which kept identity Prism-financial); that change's platform taxonomy work is retained as vertical-internal routing.
