# Rebuttal & Decision Log: Genericize Kernel via Vertical Injection

Critic verdict: **REVISE** (2 critical, 4 major). All findings independently zero-trust verified against the tree before deciding. Verification commands and results are recorded per finding.

## C1 — base/vertical split inventory is factually wrong → **ACCEPT**

**Verified:** `signal.ts:1,4-7,15,18-23` imports `Venue`, declares `cross_venue_*` signal types, `netEdgeBps`, `longVenue/shortVenue`. `execution-prep.ts:2,15,19,43` has `linear_perp`, `venueSymbols`, `fundingRates`, `strategyFamily`. `execution.ts:15-23` models `orderId/filled/averagePrice/fees`. `comparison.ts`, `opportunity.ts`, `source-family.ts` also import `market-data`. The design's "keep" classification for these is wrong.

**Decision:** Replace the static keep/move table with a **field-level rule applied now**: a `domain` file stays in base **only if** it imports nothing from `market-data.js` AND its body has zero matches for `venue|funding|netEdge|order|fill|markPrice|strategyFamily`. Apply it:
- **MOVE to vertical:** `market-data.ts`, `opportunity.ts`, `signal.ts`, `comparison.ts`, `execution.ts`, `execution-prep.ts`, `trade-proposal.ts`. Audit `source-family.ts` (imports `market-data`): genericize the `Venue` reference out, or move.
- **KEEP (generic, verified):** `artifact.ts` (with M4 fix), `evidence.ts`, `source-map.ts`, `fetch-status.ts`, `research-state.ts`, `monitor-definition.ts` (only imports `ResearchVertical`), `refresh-artifact.ts`, `risk-artifact.ts` (`pass/warn/fail`), `proposal-artifact.ts` (`thesis/refs`).
- **BORDERLINE:** `signal-artifact.ts` (has optional `opportunityRef`) — keep but generalize `opportunityRef` to a generic ref, or move with `signal`. Resolved in Phase 2 audit.

Design table updated to reflect this. `blocks_implementation` resolved.

## C2 — "no kernel-core edits" guarantee broken by barrel + consumers → **ACCEPT**

**Verified:** `agent-kernel/src/index.ts:3-15` re-exports `funding-basis-copilot-guidance`, all `platform-*`, `register-prism-tools`, `session-artifact-references`. **7** smoke files import `@agentkernel/agent-kernel`. `funding-basis-copilot-guidance.ts` was absent from the design inventory (grep count 0).

**Decision (adopt critic counterproposal):**
1. The spec wording is corrected to distinguish two guarantees: **(a)** adding a *new* vertical requires no kernel-core source edit (the real north-star claim); **(b)** *moving the reference vertical out* necessarily edits the barrel + its importers — that is a one-time extraction cost, not a per-vertical cost.
2. **Phase 1 stops re-exporting funding symbols from `index.ts`** (export only `vertical`, `system-prompt`, `create-agent-session`, generic `runtime-context`, `configure-provider`, and `FUNDING_BASIS_VERTICAL_PLUGIN`). This surfaces the 7 broken smoke import sites in Phase 1 **while the 188 tests still guard them**, instead of in Phase 2.
3. Inventory amended: `funding-basis-copilot-guidance.ts` + **all** `platform-*` files explicitly listed to move. New task: rewire the 7 smoke import sites to the funding-plugin surface.

## M1 — X2 grep mis-scoped / not falsifiable → **ACCEPT**

**Verified:** after Phase 1 wrap-in-place, 8+ funding-coupled files still live in `agent-kernel/src`; X2 "≈0 excluding plugin file(s)" cannot pass deterministically.

**Decision:** Split into **X2a (Phase 1):** grep an **explicit base-file allowlist** — `vertical.ts, system-prompt.ts, create-agent-session.ts, runtime-context.ts, configure-provider.ts, index.ts` — must be 0 funding/Prism matches. **X2b (Phase 2):** whole `agent-kernel/src` grep must be 0 after the move. Test-matrix updated.

## M2 — S1 smoke asserts opposite of current behavior, no task to fix → **ACCEPT**

**Verified:** `package.json:15` `smoke:pi` boots the funding session; no task rewires it.

**Decision:** (a) Primary gate becomes a **deterministic build-level assertion** (T1/T2: `buildAgentSessionOptions()` with no vertical → `systemPromptOverride === GENERIC_SYSTEM_PROMPT`, `customTools === []`), since LLM output is non-deterministic. (b) Add explicit Phase 1 task: new `smoke-generic` script calling `createKernelAgentSession()` with **no** vertical; funding identity smoke stays under `smoke:funding-basis-*` which already injects the plugin. S1 demoted to optional manual live check.

## M3 — open-enum requirement incomplete (PlatformVertical, regex resolver) → **ACCEPT (scope clarification)**

**Verified:** `operations/platform-capability-routing.ts:4` declares a third closed enum `PlatformVertical`; `platform-vertical-resolution.ts:3-6` hardcodes funding/prediction regex.

**Decision:** Add one design/spec sentence: **`PlatformVertical` and the `platform-vertical-resolution` regex are vertical-internal routing and move wholesale into `funding-basis`; the base exposes no vertical enumeration, and the only live extension point is `KernelVertical.id` (already an open string).** The open-enum requirement is thus honestly scoped to base `domain` (`ResearchVertical`, `ArtifactType`).

## M4 — base Artifact retains funding-shaped lineage fields → **ACCEPT (staged)**

**Verified:** `artifact.ts:1-14,47-54` — `ARTIFACT_FAMILY_TYPES` includes `opportunity_artifact/market_context_snapshot/comparison_artifact`; named slots `opportunityIds/marketContextIds/comparisonIds/signalIds/executionPrepContractId/riskEvaluationId/prepAssumptionRefs`.

**Decision (adopt counterproposal, staged to keep Phase 1 green):**
- **Phase 1:** open `ArtifactType` to string (unblocks new types) — minimal, non-breaking. M4 named slots documented as an **accepted, tracked leak** for Phase 1 only.
- **Phase 2:** introduce a generic `links?: Record<string, string[]>` lineage map on base `Artifact`; move the named financial slots + the funding family constants (`opportunity_artifact/market_context_snapshot/comparison_artifact`) into a funding `Artifact` extension; base `ARTIFACT_FAMILY_TYPES` keeps the cross-industry families (`research_brief/source_snapshot/research_report/monitor_definition/proposal_artifact/risk_artifact/refresh_artifact`), each re-checked against the move rule. Added as explicit Phase 2 tasks.

## m1 (minor) — design authored vs stale tree → **ACCEPT**

Add a Phase 2 pre-flight task: regenerate the move inventory from a live `ls/grep`, diff against the design table, resolve discrepancies before moving any file.

## m2 (minor) — move vs delete the dead platform-* router → **DEFER (note)**

The `platform-*` deterministic router is not on the live loop. Rather than block, add a Phase 2 sub-decision task: evaluate **quarantining under `verticals/funding-basis/experimental/`** (with its own smoke) or deleting it, so the live `KernelVertical` seam is the sole supported extension path and reviewers aren't misled. Not blocking Phase 1.

## Outcome

All blocking findings (C1, C2) resolved by revising the inventory + Phase-1 barrel decoupling. M1–M4 resolved by test-matrix/spec/staging edits. No unresolved critical or major remains. Proceed to revise the OpenSpec artifacts, then implement Phase 1.
