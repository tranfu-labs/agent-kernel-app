# Test Matrix: Genericize Kernel via Vertical Injection

Zero-trust verification. Each row is checked by a real test or command, not self-report.

## Unit / contract tests (Phase 1)

| # | Lens | Scenario | How verified | Expected |
|---|---|---|---|---|
| T1 | Generic default | `buildAgentSessionOptions()` with no vertical | new `create-agent-session.test.ts` assertions | `customTools` is `[]`; systemPromptOverride returns `GENERIC_SYSTEM_PROMPT`; `noTools === "builtin"` |
| T2 | Generic identity | `GENERIC_SYSTEM_PROMPT` content | unit assertion | no `/prism/i`, `/funding/i`, `/venue/i`, `/financial/i` match |
| T3 | Injection | `buildAgentSessionOptions({ vertical })` with a stub vertical | unit | systemPromptOverride === stub.systemPrompt; customTools === stub.createTools(ctx) |
| T4 | Context wiring | vertical with `createRuntimeContext` | unit | the returned runtime context is the vertical's, passed into createTools |
| T5 | Funding parity | `FUNDING_BASIS_VERTICAL_PLUGIN.createTools(ctx)` | unit | tool name set equals the pre-change 13-tool set |
| T6 | Open enum: vertical | assign a novel id to `ResearchVertical` / `createResearchState({vertical:"logistics_x"})` | type-level + runtime test | compiles and runs; no enum edit needed |
| T7 | Open enum: artifact | build `Artifact` with a novel `type` | type-level + runtime | compiles; base family constants still exported |
| T8 | Bridge default | `new KernelAgent({ store })` default description | `kernel-agent.test.ts` | description is generic, no "Prism"/"financial" |

## Regression (existing suites must stay green)

| # | Suite | Expected |
|---|---|---|
| R1 | `npm test` (all workspaces) | 188+ pass, 0 fail (funding tests pass the plugin explicitly) |
| R2 | `npm run typecheck` | clean |
| R3 | `npm run build` | clean |

## Smoke (live-ish / behavioral)

| # | Command | Expected |
|---|---|---|
| S1 | (optional, manual) live default session | responds as a generic assistant; no Prism/financial self-identification. **Demoted to optional** because LLM output is non-deterministic; the deterministic proof is T1/T2. |
| S2 | `npm run smoke:funding-basis-tool` (vertical injected) | funding tool execution succeeds; behavior unchanged vs. baseline |
| S3 | `npm run smoke:generic` (new; `createKernelAgentSession()` no vertical) | session creates with generic default; build-level assertions T1/T2 hold |

## Safety lenses (no-execution, fact integrity)

| # | Lens | How verified | Expected |
|---|---|---|---|
| X1 | No new execution surface | `grep -rn "place_order\|execute_trade\|withdraw\|transfer\|privateKey" base packages` | no new occurrences vs. baseline; execution names remain only in blocked-tool lists |
| X2a | Base domain-free (Phase 1) | grep `prism\|funding\|venue\|opportunity` over the **explicit base-file allowlist**: `agent-kernel/src/{vertical,system-prompt,create-agent-session,configure-provider,index}.ts` (the generic `KernelRuntimeContext` lives inline in `vertical.ts`) | 0 matches outside comments |
| X2b | Base domain-free (Phase 2) | grep over the **whole** `packages/agent-kernel/src` after the move | 0 matches |
| X3 | Read-only preserved | review diff | no provider write calls, no order/account endpoints added |

## Acceptance gate

- All T*, R*, S*, X* pass.
- `openspec validate genericize-kernel-vertical-injection` passes.
- Critic findings resolved via rebuttal; no unresolved critical/major.
