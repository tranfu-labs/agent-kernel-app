# kernel-vertical-injection Specification Delta

## ADDED Requirements

### Requirement: Kernel runs a generic assistant by default

The AgentKernel SHALL create a Pi Agent session with a generic, domain-free assistant identity and no domain tools when no vertical is supplied.

#### Scenario: Default session is generic

- **WHEN** `createKernelAgentSession` is called with no `vertical` option
- **THEN** the session is bootstrapped with `GENERIC_ASSISTANT_VERTICAL`
- **AND** the injected system prompt contains no financial, funding, venue, or Prism vocabulary
- **AND** the session exposes zero domain tools and no Pi builtin coding tools (`noTools: "builtin"`)

#### Scenario: Generic assistant identity

- **WHEN** the default session responds to a user message
- **THEN** it presents as a general AgentKernel assistant
- **AND** it does not identify as Prism or a financial research manager

### Requirement: Verticals are injected, not hardcoded

The kernel SHALL accept a `KernelVertical` and derive the session's system prompt, tools, and runtime context from it, so that adding a vertical requires no edit to kernel-core files.

#### Scenario: Inject a vertical

- **WHEN** `createKernelAgentSession({ vertical })` is called with a `KernelVertical`
- **THEN** the session's system prompt is `vertical.systemPrompt`
- **AND** the session's tools are `vertical.createTools(runtimeContext)`
- **AND** the runtime context is `vertical.createRuntimeContext?.()` when provided, otherwise the generic context

#### Scenario: Funding-basis preserved via injection

- **WHEN** `createKernelAgentSession({ vertical: FUNDING_BASIS_VERTICAL_PLUGIN })` is called
- **THEN** the session exposes the funding-basis tool set equivalent to the pre-change behavior
- **AND** no kernel-core file outside the funding vertical was modified to achieve this

#### Scenario: New vertical needs no kernel-core source edit

- **WHEN** a developer adds a new vertical by implementing `KernelVertical` (id, systemPrompt, createTools)
- **THEN** they can run it through `createKernelAgentSession({ vertical })`
- **AND** they do not modify any kernel-core source file (`create-agent-session.ts`, `vertical.ts`, `system-prompt.ts`, runtime context, or `domain` enums)

> Note: extracting the *reference* funding vertical out of the kernel is a one-time cost that edits the barrel (`index.ts`) and its importers; that is distinct from the per-vertical guarantee above, which adds a vertical with zero kernel-core source edits.

### Requirement: Domain vertical and artifact identifiers are open

The base `@agentkernel/domain` SHALL allow new vertical and artifact-type identifiers without modifying the `domain` package.

#### Scenario: Open vertical identifier

- **WHEN** a vertical declares an `id` not previously known to the base (e.g. a non-financial domain)
- **THEN** `ResearchVertical` accepts it as a string-extensible value
- **AND** no edit to `research-state.ts` is required to introduce the new vertical id

#### Scenario: Open artifact type

- **WHEN** a vertical materializes an artifact of a new type
- **THEN** `ArtifactType` accepts the new type via its string-extensible form
- **AND** the base artifact family constants remain available for generic tooling

### Requirement: Kernel core carries no domain vocabulary

The base packages (`agent-kernel` excluding the funding plugin, `agui-bridge`, generic `domain`, `storage`) SHALL NOT reference funding, venue, opportunity, or Prism vocabulary.

#### Scenario: No domain coupling in the bridge

- **WHEN** the `agui-bridge` `KernelAgent` is instantiated with no description
- **THEN** its default description is generic
- **AND** it does not name Prism or a financial domain

#### Scenario: Base stays read-only and execution-free

- **WHEN** the genericization change is applied
- **THEN** no new execution, order, wallet, account-state, or private-API surface is introduced
- **AND** the base remains read-only
