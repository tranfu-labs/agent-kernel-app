# Tasks: Genericize Kernel via Vertical Injection

## Phase 1 — Injection seam + generic default (first code slice)

- [x] Add `packages/agent-kernel/src/system-prompt.ts` exporting `GENERIC_SYSTEM_PROMPT` (neutral assistant, no domain words).
- [x] Add `packages/agent-kernel/src/vertical.ts` exporting `KernelRuntimeContext`, `KernelVertical`, `GENERIC_ASSISTANT_VERTICAL`, and `createKernelRuntimeContext()`.
- [x] Modify `packages/agent-kernel/src/create-agent-session.ts`: accept `{ vertical?: KernelVertical }`, default `GENERIC_ASSISTANT_VERTICAL`; inject `vertical.systemPrompt` + `vertical.createTools(ctx)`; resolve runtime context from `vertical.createRuntimeContext?.()` else generic. Keep `noTools: "builtin"`.
- [x] Wrap existing funding symbols in place as `FUNDING_BASIS_VERTICAL_PLUGIN` (a `KernelVertical`) bundling `PRISM_SYSTEM_PROMPT` + `createPrismToolDefinitions` + `createPrismRuntimeContext`. (Renaming deferred to Phase 3.)
- [x] **Stop re-exporting funding symbols from `agent-kernel/src/index.ts`** (C2): export only `vertical`, `system-prompt`, `create-agent-session`, generic `runtime-context`, `configure-provider`, and `FUNDING_BASIS_VERTICAL_PLUGIN`.
- [x] **Rewire the 7 smoke import sites** (`apps/agent-api/src/smoke-{funding-basis-tool,opportunity-explanation,funding-execution-prep,mvp1-user-path,platform-control-plane,opportunity-research-report,funding-basis-copilot}.ts`) onto the funding-plugin surface — now, while 188 tests guard them.
- [x] Open enums: `ResearchVertical` → `string`-extensible in `domain/research-state.ts`; `ArtifactType` → base constants + open string in `domain/artifact.ts`. (M4 named lineage slots: accepted tracked leak for Phase 1; genericized in Phase 2.)
- [x] Fix `packages/agui-bridge/src/kernel-agent.ts` default `description` to a generic string.
- [x] Update `packages/agent-kernel/src/index.ts` exports (vertical, system-prompt).
- [x] `apps/web/lib/agent-runtime.ts`: default to generic session; read `AGENTKERNEL_VERTICAL=funding-basis` to opt into `FUNDING_BASIS_VERTICAL_PLUGIN`.
- [x] Add `smoke:generic` script + `apps/agent-api/src/smoke-generic.ts` calling `createKernelAgentSession()` with **no** vertical (M2). Keep funding identity under `smoke:funding-basis-*`.

### Phase 1 tests (per test-matrix)

- [x] `create-agent-session.test.ts`: T1, T3, T4 (default generic, injection, context wiring).
- [x] `system-prompt.test.ts` (or assertion): T2 generic-identity word-ban.
- [x] Funding plugin test: T5 tool-set parity.
- [x] `research-state` / `artifact` tests: T6, T7 open enums.
- [x] `kernel-agent.test.ts`: T8 generic default description.
- [x] Run R1/R2/R3 (test, typecheck, build) green; S3 generic smoke; X1/X2a/X3 safety greps.

## Phase 2 — Extract `verticals/funding-basis`

### Phase 2a — Extract the funding control plane out of `agent-kernel` (DONE, green)

- [x] **Pre-flight (m1):** regenerate the move inventory from a live `ls/grep`, diff against the design table, resolve discrepancies before moving any file.
- [x] Create `verticals/funding-basis` package; add to root `package.json` workspaces and `tsconfig.json` references.
- [x] Move the funding control-plane + tool-registration files out of `agent-kernel/src`: `funding-basis-plugin`, `funding-basis(.ts → index.ts)`, all `platform-*`, `prism-system-prompt`, `prism-runtime-context`, `register-prism-tools`, `session-artifact-references`, `funding-basis-copilot-guidance`, `path-guidance`.
- [x] `FUNDING_BASIS_VERTICAL_PLUGIN` now lives in the vertical package; the only base import (`./vertical.js`) repointed to `@agentkernel/agent-kernel`.
- [x] Make the vertical package the app-facing migration surface: re-export `@agentkernel/operations` + `@agentkernel/tools`; rewire 7 smokes + 8 tests + web off the kernel barrel onto `@agentkernel/funding-basis`.
- [x] Migrate the funding tests (12 files + fixtures) into the vertical package; keep base `create-agent-session.test.ts` funding-free (stub vertical).
- [x] Drop `agent-kernel` deps/refs on `operations`/`tools`; remove the `./funding-basis` subpath export.
- [x] **X2b:** `packages/agent-kernel/src` raw grep clean of `prism|funding|venue|opportunity` (incl. comments).
- [x] Verify: `npm build` + `typecheck` + `npm test` (196 pass) + `smoke:generic` + `web:build` green.

### Phase 2b — Genericize `domain` and relocate financial operations/tools (DEFERRED — needs design)

> **Decision (recorded):** A first attempt to move the financial `domain` types (`market-data`, `opportunity`, `signal`, `comparison`, `execution`, `execution-prep`, `trade-proposal`, `source-family`) into the vertical while leaving compatibility shims in `@agentkernel/domain` created a **`domain ↔ funding-basis` circular dependency** (operations/tools still import these types from `@agentkernel/domain`, and the vertical depends on operations/tools). Reverted to keep the tree green. The clean fix is a dedicated low-level `@agentkernel/funding-domain` package that `operations`/`tools`/the vertical all depend on — to be designed before moving. Tracked here, not silently complete.

- [ ] Introduce `@agentkernel/funding-domain` (no dep on operations/tools); move the financial `domain` types there; repoint `operations`/`tools`/vertical imports.
- [ ] Audit `source-family.ts` / `signal-artifact.ts`: genericize the venue/opportunity reference out to keep in base, else move.
- [ ] **Artifact genericization (M4):** add generic `links?: Record<string,string[]>` to base `Artifact`; move named funding slots + funding family constants into a funding `Artifact` extension; base `ARTIFACT_FAMILY_TYPES` keeps cross-industry families only.
- [ ] **PlatformVertical (M3):** move `PlatformVertical` + `platform-vertical-resolution` regex wholesale into the vertical; confirm base `domain` exposes no vertical enumeration (`ResearchVertical` stays open string).
- [ ] **m2 decision:** quarantine `platform-*` under `verticals/funding-basis/experimental/` (own smoke) or delete if unreferenced by the live loop; record the decision.
- [ ] Relocate `operations`/`tools`/`policies`/`skills` directories under `verticals/funding-basis` (or rename to funding-scoped packages); update workspaces/refs.
- [ ] Export `FUNDING_BASIS_VERTICAL` declaration from the vertical (remove from base `domain/vertical-plugin.ts`).
- [ ] Re-run a whole-base grep: `packages/domain/src` + `packages/agent-kernel/src` clean of funding/venue/opportunity.

## Phase 3 — De-Prism naming

- [ ] Rename symbols/files: `createPrismToolDefinitions`→`createFundingBasisToolDefinitions`; `PrismRuntimeContext`→`FundingRuntimeContext`; `register-prism-tools.ts`→`funding-basis-tools.ts`; `prism-system-prompt.ts`→vertical `funding-system-prompt.ts`; `prism-runtime-context.ts`→`runtime-context.ts`; `createPrismRuntimeContext`→`createFundingRuntimeContext`.
- [ ] Replace `__PRISM_ENV_SMOKE_LOADED` → `__AGENTKERNEL_ENV_SMOKE_LOADED`; remove "Prism" comments in `agent-runtime.ts`, `route.ts`.
- [ ] Rename `.claude/agents/prism-*.md`→`kernel-*.md` and `.claude/commands/prism-decide.md`; de-financialize lens copy; rename `.pi/skills/prism-replatform`; update `pi-package` keywords.
- [ ] Rename `pi-package` permission gate / any `prism*` identifiers.
- [ ] Verify `grep -rin prism packages apps verticals --include='*.ts' --include='*.tsx'` ≈ 0.

## Phase 4 — Docs & developer guide

- [ ] Rewrite `AGENTS.md` as generic AgentKernel instructions (architecture boundaries + retained OpenSpec/multi-agent/TDD discipline; financial non-drift rules removed/moved).
- [ ] Move `prism-docs/` → `verticals/funding-basis/docs/`.
- [ ] Update `README` package map + "Adding a vertical" to the real injection API.
- [ ] Add `docs/BUILD_A_VERTICAL.md`: implement `KernelVertical`, write tools, register, run — using funding-basis as the worked example.

## Gate

- [ ] `openspec validate genericize-kernel-vertical-injection` passes.
- [ ] Critic → rebuttal decisions logged; evaluator zero-trust pass on completed slices.
