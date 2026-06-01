# Design: Genericize Kernel via Vertical Injection

## Problem & current state

The live runtime path is:

```
apps/web/app/page.tsx (CopilotChat)
  -> app/api/copilotkit/route.ts (CopilotRuntime, agent="default")
  -> apps/web/lib/agent-runtime.ts (KernelAgent + WarmSessionStore)
  -> agui-bridge KernelAgent.run -> session.prompt(text)
  -> Pi AgentSession created by createKernelAgentSession()
```

The single domain chokepoint is `packages/agent-kernel/src/create-agent-session.ts`:

- `systemPromptOverride: () => PRISM_SYSTEM_PROMPT` (financial identity)
- `customTools: createPrismToolDefinitions(runtimeContext)` (13 funding tools)
- `runtimeContext = createPrismRuntimeContext()` (artifact store + opportunity reference store)

The `platform-*` control plane (`platform-intent-resolution`, `platform-vertical-resolution`, `platform-tool-access`, `platform-capability-routing`, ...) is **not** on this path — it is only exercised by smoke tests (`smoke-platform-control-plane`, `smoke-mvp1-user-path`). It is funding-coupled dead weight relative to the live agent loop and moves with the vertical.

`agui-bridge` is already generic: `KernelAgent` drives a structural `PiSessionLike` and never imports `domain`/`operations`. Its only coupling is a default string `description: "Prism financial intelligence-to-action agent"` (`kernel-agent.ts:48`). `apps/web` is already generic ("AgentKernel assistant").

## The injection contract

`KernelVertical` references the Pi `ToolDefinition` type, so it lives in `agent-kernel` (the Pi-runtime boundary), not `domain` (which must not import Pi).

```ts
// packages/agent-kernel/src/vertical.ts
import type { ToolDefinition } from "@earendil-works/pi-coding-agent";
import type { VerticalPluginDeclaration } from "@agentkernel/domain";
import type { MemoryArtifactStore } from "@agentkernel/storage";

/** Generic, domain-free runtime context the kernel always provides. */
export interface KernelRuntimeContext {
  artifactStore: MemoryArtifactStore;
}

export interface KernelVertical<Ctx extends KernelRuntimeContext = KernelRuntimeContext> {
  /** Open identifier, e.g. "general", "funding_basis". Replaces the closed enum. */
  id: string;
  /** Product-facing identity + mission injected as the Pi system prompt. */
  systemPrompt: string;
  /** Build the Pi tools this vertical exposes. Generic default returns []. */
  createTools: (ctx: Ctx) => ToolDefinition[];
  /** Build the (optionally extended) runtime context. Default: generic context. */
  createRuntimeContext?: () => Ctx;
  /** Optional declarative routing/policy metadata (the existing domain declaration). */
  declaration?: VerticalPluginDeclaration;
}
```

A vertical that needs extra session state (funding-basis needs opportunity/prep references) extends the context:

```ts
// verticals/funding-basis/src/runtime-context.ts
export interface FundingRuntimeContext extends KernelRuntimeContext {
  artifactReferences: SessionArtifactReferenceStore;
}
```

`createTools` is typed over the vertical's own `Ctx`, so the funding tools keep their `artifactReferences` access while the kernel only knows `KernelRuntimeContext`.

### Generic default

```ts
// packages/agent-kernel/src/system-prompt.ts
export const GENERIC_SYSTEM_PROMPT = `You are a helpful AI assistant running on the AgentKernel runtime.
- Be accurate, concise, and useful.
- You can be extended with domain "verticals" that add tools and a specialized identity; with no vertical loaded you are a general assistant.
- Do not claim capabilities or facts you cannot support. When a tool is available for a fact, use it rather than guessing.`;

// packages/agent-kernel/src/vertical.ts
export const GENERIC_ASSISTANT_VERTICAL: KernelVertical = {
  id: "general",
  systemPrompt: GENERIC_SYSTEM_PROMPT,
  createTools: () => [],
};
```

### Session bootstrap change

`buildAgentSessionOptions` / `createKernelAgentSession` take `{ vertical?: KernelVertical }` defaulting to `GENERIC_ASSISTANT_VERTICAL`:

```ts
const vertical = options.vertical ?? GENERIC_ASSISTANT_VERTICAL;
const runtimeContext = options.runtimeContext
  ?? vertical.createRuntimeContext?.()
  ?? createKernelRuntimeContext();
// ...
resourceLoader = new DefaultResourceLoader({ ..., systemPromptOverride: () => vertical.systemPrompt });
return {
  ...,
  noTools: "builtin",                          // unchanged: base never exposes Pi coding tools
  customTools: vertical.createTools(runtimeContext),
};
```

The kernel keeps `noTools: "builtin"` (decision: generic assistant has no domain tools and no Pi coding tools by default). The return type `runtimeContext` stays generic; callers needing the funding context obtain it from the vertical.

## Base / vertical type-split inventory

**Field-level rule (applied now, not deferred — per rebuttal C1):** a `domain` file stays in base **only if** it imports nothing from `market-data.js` **AND** its body has zero matches for `venue|funding|netEdge|order|fill|markPrice|strategyFamily`. Otherwise it moves to the vertical. The table below is the result of running that rule against the current tree (verified file-by-file).

### Stays in base `@agentkernel/domain` (genericized)

| File | Action | Verified |
|---|---|---|
| `artifact.ts` | `ArtifactType` → base family constants + open `(string & {})` union; **Phase 2**: add generic `links?: Record<string,string[]>`, move named funding slots + funding family constants to vertical (M4) | named slots are an accepted, tracked leak in Phase 1 only |
| `research-state.ts` | `ResearchVertical` → `string` (open); keep `ResearchPhase`, `AutonomyMode`, `PauseReason`, `MethodState` | only `ResearchVertical` is enum-closed |
| `evidence.ts`, `source-map.ts`, `fetch-status.ts` | generic source/evidence primitives — keep | no market-data import |
| `monitor-definition.ts`, `refresh-artifact.ts`, `risk-artifact.ts`, `proposal-artifact.ts` | generic research/governance primitives — keep | `risk-artifact` = pass/warn/fail; `proposal-artifact` = thesis/refs; `monitor-definition` imports only `ResearchVertical` |
| `signal-artifact.ts` | **borderline** — keep but generalize optional `opportunityRef` to a generic ref (Phase 2 audit) | refs-only except `opportunityRef?` |
| `vertical-plugin.ts` | keep `VerticalPluginDeclaration`; concrete `FUNDING_BASIS_VERTICAL` / `PREDICTION_MARKET_VERTICAL` constants move to verticals | data-only declaration |

### Moves to `verticals/funding-basis` (verified financial)

| Source | Reason (verified) |
|---|---|
| `domain/market-data.ts` | `Venue`, `MarketType` closed financial enums |
| `domain/opportunity.ts` | imports `market-data`; `netEdgeBps`, `fundingRate`, `scoringVersion:"funding-basis-v1"` |
| `domain/signal.ts` | imports `Venue`; `cross_venue_*`, `netEdgeBps`, `longVenue/shortVenue` |
| `domain/comparison.ts` | imports `market-data` (cross-venue) |
| `domain/execution.ts` | `orderId`, `filled`, `averagePrice`, `fees` — models the trade, not a generic gate |
| `domain/execution-prep.ts` | `linear_perp`, `venueSymbols`, `fundingRates`, `strategyFamily:"funding_rate_arbitrage"` |
| `domain/trade-proposal.ts` | trade/venue-specific |
| `domain/source-family.ts` | imports `market-data` — **audit**: genericize the `Venue` reference out, else move |
| `agent-kernel/session-artifact-references.ts` | imports `Opportunity` + `CrossVenueComparison` |
| `agent-kernel/register-prism-tools.ts`, `prism-system-prompt.ts` | funding tools + financial prompt |
| `agent-kernel/funding-basis-copilot-guidance.ts` | funding routing guidance (was omitted from the first draft — C2) |
| `agent-kernel/platform-*.ts`, `operations/platform-*.ts` | funding control plane (incl. `PlatformVertical` enum + `platform-vertical-resolution` regex) |
| `packages/operations/*` (funding-*, opportunity-*, risk, proposal, method-exploration) | financial operations |
| `packages/tools/*` (exchanges, opportunities, source-families) | exchange read plane |
| `packages/skills/*` | funding-rate-arbitrage / execution-risk-review playbooks |
| `packages/policies/execution-policy.ts` | audit: generic execution gate may stay; if funding-shaped, move |

**Vertical enumeration scope (M3):** `PlatformVertical` (`operations/platform-capability-routing.ts`) and the `platform-vertical-resolution` regex are **vertical-internal routing** and move wholesale into `funding-basis`. The base exposes no vertical enumeration; the only live extension point is `KernelVertical.id` (an open string). The `platform-*` router is not on the live loop — Phase 2 decides whether to quarantine it under `verticals/funding-basis/experimental/` or delete it (m2).

### Two distinct guarantees (C2)

- **(a) Per-vertical guarantee (the north-star claim):** adding a *new* vertical requires **no edit to any kernel-core source file** — implement `KernelVertical` and pass it to `createKernelAgentSession`.
- **(b) One-time extraction cost:** *moving the reference vertical out* of the kernel necessarily edits the barrel (`index.ts`) and its importers. This is paid once, in Phase 2, not per vertical. To surface it safely, **Phase 1 already stops re-exporting funding symbols from `index.ts`**, breaking the 7 smoke import sites while the 188 tests still guard them.

## Topology after the change

```
BASE (domain-free):
  agent-kernel  : vertical.ts (KernelVertical, GENERIC_ASSISTANT_VERTICAL),
                  system-prompt.ts (GENERIC_SYSTEM_PROMPT),
                  create-agent-session.ts (injection), runtime-context.ts (generic),
                  configure-provider.ts
  agui-bridge   : unchanged except generic default description
  domain        : generic research/governance primitives, open enums
  storage       : MemoryArtifactStore (generic)
  apps/web      : default generic; AGENTKERNEL_VERTICAL=funding-basis opts in

VERTICAL (example):
  verticals/funding-basis : funding domain types + operations + tools + skills +
                            platform control plane + funding tools/prompt/context;
                            exports FUNDING_BASIS_VERTICAL_PLUGIN: KernelVertical
```

## Phasing (matches approved plan)

- **Phase 1 (first code slice):** add `vertical.ts` + `system-prompt.ts`; make bootstrap injectable with generic default; wrap existing funding symbols *in place* as `FUNDING_BASIS_VERTICAL_PLUGIN` and have tests/smoke pass it explicitly. **Stop re-exporting funding symbols from `agent-kernel/src/index.ts`** (export only the generic seam + the funding plugin) and rewire the 7 smoke import sites onto the plugin surface — done now while 188 tests guard them (C2). Open `ResearchVertical`/`ArtifactType` (string). Add a generic `smoke-generic` script. Fix the `agui-bridge` default string. No physical package move yet → keeps all tests green with minimal churn.
- **Phase 2:** create `verticals/funding-basis` package; physically move the financial files per the inventory; migrate tests; root `npm test` still aggregates green.
- **Phase 3:** de-Prism renaming (symbols/files/env/agents/keywords).
- **Phase 4:** docs + `BUILD_A_VERTICAL.md`.

## Alternatives considered

1. **Keep funding hardcoded, only rename Prism→Kernel.** Rejected: cosmetic; the closed enums and hardcoded injection still force kernel edits per vertical — north star unmet.
2. **Put `KernelVertical` in `domain`.** Rejected: it must reference Pi's `ToolDefinition`; `domain` must not import the Pi runtime (architecture boundary). The declarative `VerticalPluginDeclaration` stays in `domain`; the runtime plugin lives in `agent-kernel`.
3. **Make the generic default expose Pi builtin coding tools.** Rejected per product decision: the base is a neutral assistant with no tools; coding-tool exposure is a deliberate vertical choice, not a default.
4. **Delete the funding vertical / platform control plane.** Rejected: it is the only end-to-end proof the seam carries a real domain, and it has 188 passing tests worth preserving.
5. **Drive the live loop through the `platform-*` deterministic router.** Out of scope: today the LLM loop ignores it; wiring it in is a separate vertical-internal decision, not part of genericizing the kernel.

## Risks

- **Borderline domain types** (`signal`, `monitor-definition`, `comparison`, `policies`) may carry hidden venue fields. Mitigation: file-by-file audit in Phase 2 against the split rule; default to "move if it names a venue/market".
- **Context typing**: funding tools need `artifactReferences`. Mitigation: `createTools<Ctx>` generic + vertical-extended context; kernel only sees `KernelRuntimeContext`.
- **Web warm-session singleton** builds one vertical at startup; switching verticals per request is out of scope (single configured vertical per deployment via env).
