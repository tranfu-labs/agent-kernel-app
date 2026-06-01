# Prism MVP1 Finish Sequence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current Prism MVP1 backend-heavy alpha into a credible internal MVP by closing four remaining product-critical tracks: live discover reliability, minimal product API, minimal workspace UI, and explicit end-to-end product checks.

**Architecture:** Keep the existing Prism control plane, deterministic funding-basis operations, artifact-backed prep flow, and no-execution boundary intact. Add the thinnest possible productization layer above them: first stabilize live discover behavior on a constrained symbol set, then expose a minimal session/workspace API, then add a fixed-layout internal workspace UI, and finally make the ship gate prove product behavior rather than only backend semantics.

**Tech Stack:** TypeScript, Node.js, npm workspaces, existing Prism packages (`@agentkernel/agent-kernel`, `@agentkernel/operations`, `@agentkernel/tools`, `@agentkernel/domain`, `@agentkernel/storage`, `@agentkernel/agent-api`), existing smoke/gate scripts, Next.js/React/Tailwind/shadcn/ui for `apps/web`, and the current read-only Binance/Bitget market-data toolchain.

---

## Source context

Use these as the ground truth before editing code:

- `docs/superpowers/specs/2026-05-31-prism-mvp1-arbitrage-prep-design.md`
- `docs/superpowers/plans/2026-05-31-prism-mvp1-arbitrage-prep-implementation.md`
- `README.md`
- `AGENTS.md`
- `apps/agent-api/src/server.ts`
- `apps/agent-api/src/smoke-mvp1-user-path.ts`
- `apps/web/README.md`
- `package.json`

## Current state summary

What is already strong:

- control-plane routing and policy enforcement;
- funding-basis opportunity discovery core;
- artifact-backed explain/report/prep flow;
- deterministic execution-prep and risk outputs;
- no-execution boundary;
- backend test and smoke discipline.

What is still blocking a credible internal MVP:

- live discover often degrades to `partial` / `0` candidates;
- `apps/agent-api` does not expose a real product API;
- `apps/web` is still a placeholder;
- the main gate passes without proving live product behavior.

## Scope

MVP1 finish is the narrow product boundary for a read-only Binance + Bitget funding-basis discover -> inspect -> prep flow, with live discover on a constrained demo symbol set, a minimal product API, a minimal internal workspace UI, and explicit checks that the API and UI can complete the loop end to end.

This finish plan covers only these four tracks:

1. stabilize live discover reliability on a constrained demo symbol set;
2. add the smallest viable product API for session/workspace interactions;
3. add the smallest viable internal workspace UI;
4. add explicit end-to-end checks that prove the UI/API path can drive the MVP1 loop.

## Explicit non-goals

Do not add any of these in this finish phase:

- product-level multi-agent runtime;
- additional exchanges;
- additional strategies;
- prediction-market implementation expansion;
- account/wallet/private-key flows;
- execution systems;
- continuous monitoring engine;
- full persistent database redesign;
- portfolio/watchlist/alert-center product surfaces;
- broad generative UI experiments.

## Dependency and parallelization rules

### Must happen sequentially

1. **Live discover reliability before API design**
   - the API should expose stable run semantics, not paper over an unstable discover loop.
2. **Minimal product API before meaningful UI implementation**
   - the UI must consume a stable product surface rather than binding directly to runtime internals.
3. **UI path before final end-to-end product checks**
   - the final release check must prove the real product path, not just backend smokes.

### Can run in parallel after prerequisites are met

- once the session/workspace API contract is stable, API implementation and UI shell scaffolding can proceed in parallel;
- once live discover semantics are stabilized, acceptance scripts for API and UI can be developed alongside the UI implementation;
- documentation updates can run in parallel with each completed track.

---

### Task 1: Freeze the MVP1 finish boundary

**Files:**
- Modify: `docs/superpowers/plans/2026-05-31-prism-mvp1-finish-sequence.md`
- Modify: `README.md:53-77`
- Modify: `AGENTS.md:177-202`

- [ ] **Step 1: Write the exact finish-phase definition into docs**

Add wording that defines MVP1 finish as:

```text
read-only Binance + Bitget funding-basis discover -> inspect -> prep
with live discover on a constrained demo symbol set,
a minimal product API,
a minimal internal workspace UI,
and explicit end-to-end checks that prove the loop works through the API and workspace UI.
```

- [ ] **Step 2: Add the explicit finish-phase non-goals**

The docs must explicitly defer:

```text
product-level multi-agent runtime
additional exchanges
additional strategies
continuous monitoring engine
execution systems
```

- [ ] **Step 3: Verify the wording is consistent**

Run:

```bash
grep -n "multi-agent runtime\|continuous monitoring\|additional exchanges\|additional strategies" \
  "/Users/griffith/Projects/Prism/README.md" \
  "/Users/griffith/Projects/Prism/AGENTS.md" \
  "/Users/griffith/Projects/Prism/docs/superpowers/plans/2026-05-31-prism-mvp1-finish-sequence.md"
```

Expected: each deferred area appears only as a deferral or non-goal, not as a finish-phase requirement.

Also run:

```bash
grep -n "execution systems" \
  "/Users/griffith/Projects/Prism/README.md" \
  "/Users/griffith/Projects/Prism/AGENTS.md" \
  "/Users/griffith/Projects/Prism/docs/superpowers/plans/2026-05-31-prism-mvp1-finish-sequence.md"
```

- [ ] **Step 4: Commit**

```bash
git add README.md AGENTS.md docs/superpowers/plans/2026-05-31-prism-mvp1-finish-sequence.md
git commit -m "docs: freeze Prism MVP1 finish boundary"
```

---

### Task 2: Stabilize live discover semantics on a constrained symbol set

**Files:**
- Modify: `packages/tools/src/exchanges/exchange-market-data-service.ts`
- Modify: `packages/tools/src/exchanges/providers/binance-usds-futures.ts`
- Modify: `packages/tools/src/exchanges/providers/bitget-usdt-futures.ts`
- Modify: `packages/operations/src/funding-basis-arbitrage.ts`
- Modify: `apps/agent-api/src/smoke-binance-market-data.ts`
- Modify: `apps/agent-api/src/smoke-mvp1-user-path.ts`
- Test: `packages/operations/test/funding-basis-arbitrage.test.ts`

- [ ] **Step 1: Write failing smoke expectations for degraded vs empty vs failed live discover**

Extend `apps/agent-api/src/smoke-mvp1-user-path.ts` so the expected result distinguishes:

```ts
if (!["ok", "partial", "empty", "failed"].includes(discoverDetails.status ?? "")) {
  throw new Error(`Unexpected discover status: ${discoverDetails.status ?? "unknown"}`);
}

if (discoverDetails.status === "failed") {
  throw new Error("Live discover reached a hard-failure state");
}
```

And require a structured reason field when no opportunities are produced:

```ts
if ((discoverDetails.opportunities?.length ?? 0) === 0) {
  if (!Array.isArray(discoverDetails.warnings) || discoverDetails.warnings.length === 0) {
    throw new Error("Empty discover result must explain why no live opportunities were produced");
  }
}
```

- [ ] **Step 2: Run the smoke to verify the current failure mode is visible**

Run:

```bash
npm run build && npm run smoke:mvp1-user-path -w @agentkernel/agent-api
```

Expected: FAIL or show `partial`/`0` with warnings that reveal the current live gap.

- [ ] **Step 3: Add a constrained demo symbol policy**

In `packages/operations/src/funding-basis-arbitrage.ts`, add a constant or input default path that narrows demo/live MVP1 validation to:

```ts
const MVP1_DEMO_SYMBOLS = ["BTCUSDT", "ETHUSDT"] as const;
```

Do not hard-code this into all product behavior; only use it in smoke/default demo flows that do not explicitly supply symbols.

- [ ] **Step 4: Make provider degradation explicit instead of silent**

In `packages/tools/src/exchanges/exchange-market-data-service.ts`, ensure timeout/missing-funding cases propagate warnings such as:

```ts
warnings.push(`missing_current_funding_rate:${symbol}`);
warnings.push(`provider_timeout:${venue}`);
```

without throwing hard runtime errors for recoverable cases.

- [ ] **Step 5: Keep eligible-comparison semantics deterministic**

In `packages/operations/src/funding-basis-arbitrage.ts`, keep the existing rule that a comparison without defined funding diff does not produce an opportunity, but emit a structured degraded outcome summary such as:

```ts
const skippedReasons = comparisons
  .filter((comparison) => comparison.fundingDiffBps === undefined)
  .map((comparison) => `missing_funding_diff:${comparison.symbol}`);
```

- [ ] **Step 6: Re-run focused tests**

Run:

```bash
npm run test -w @agentkernel/operations -- funding-basis-arbitrage.test.ts
```

Expected: PASS

- [ ] **Step 7: Re-run live smokes**

Run:

```bash
npm run build && npm run smoke:binance-market-data -w @agentkernel/agent-api && npm run smoke:mvp1-user-path -w @agentkernel/agent-api
```

Expected:
- no unstructured crash;
- discover reports `ok`, `partial`, or `empty`, never opaque failure;
- empty/partial results include concrete warnings;
- prep fallback remains bounded and explicit when needed.

- [ ] **Step 8: Commit**

```bash
git add packages/tools/src/exchanges/exchange-market-data-service.ts \
  packages/tools/src/exchanges/providers/binance-usds-futures.ts \
  packages/tools/src/exchanges/providers/bitget-usdt-futures.ts \
  packages/operations/src/funding-basis-arbitrage.ts \
  apps/agent-api/src/smoke-binance-market-data.ts \
  apps/agent-api/src/smoke-mvp1-user-path.ts
git commit -m "fix: stabilize Prism MVP1 live discover semantics"
```

**Acceptance for Task 2:**
- live discover never fails opaquely;
- the system distinguishes `partial`, `empty`, and hard `failed`;
- the demo symbol set has the best available chance of producing candidates;
- no fixture fallback is mistaken for live success.

---

### Task 3: Add a minimal product session state model in `agent-api`

**Files:**
- Create: `apps/agent-api/src/session-state.ts`
- Create: `apps/agent-api/src/session-runner.ts`
- Modify: `apps/agent-api/src/server.ts`
- Test: `apps/agent-api/src/smoke-platform-research-loop.ts`

- [ ] **Step 1: Write a failing session-state smoke**

Add a new focused smoke or extend `smoke-platform-research-loop.ts` to require these behaviors:

```ts
const created = await createSession();
assert.ok(created.sessionId);

const state = await getSessionState(created.sessionId);
assert.equal(state.runState.status, "idle");
assert.deepEqual(state.opportunities, []);
```

- [ ] **Step 2: Implement a minimal in-memory session state model**

Create `apps/agent-api/src/session-state.ts` with types like:

```ts
export interface ProductSessionState {
  sessionId: string;
  runState: {
    status: "idle" | "running" | "ok" | "partial" | "empty" | "failed" | "boundary";
    activeIntent?: string;
    lastCommand?: string;
    updatedAt: string;
    warnings: string[];
  };
  opportunities: Array<{
    id: string;
    title: string;
    symbols: string[];
    venues: string[];
    netEdgeBps?: number;
    status?: string;
  }>;
  selectedOpportunityId?: string;
  prep?: {
    status: "idle" | "ready" | "missing_context" | "failed";
    opportunityId?: string;
    humanPlan?: string;
    riskDecision?: string;
  };
  artifacts: Array<{
    artifactId: string;
    title: string;
    kind: "opportunity" | "prep" | "report";
  }>;
}
```

- [ ] **Step 3: Implement a thin session runner around the existing Prism runtime**

Create `apps/agent-api/src/session-runner.ts` with a function shape like:

```ts
export async function createProductSession(): Promise<{ sessionId: string }> { /* ... */ }
export async function runProductCommand(sessionId: string, command: string): Promise<ProductSessionState> { /* ... */ }
export function getProductSessionState(sessionId: string): ProductSessionState | undefined { /* ... */ }
```

This runner should call the already-existing runtime and map tool results into `ProductSessionState`.

- [ ] **Step 4: Run the focused smoke**

Run:

```bash
npm run build && npm run smoke:platform-research-loop -w @agentkernel/agent-api
```

Expected: PASS with explicit session state transitions.

- [ ] **Step 5: Commit**

```bash
git add apps/agent-api/src/session-state.ts apps/agent-api/src/session-runner.ts apps/agent-api/src/server.ts apps/agent-api/src/smoke-platform-research-loop.ts
git commit -m "feat: add Prism MVP1 product session state"
```

**Acceptance for Task 3:**
- the server can maintain a product-facing session state;
- runtime outputs are mapped into stable UI-facing objects;
- no frontend needs direct access to internal tool contracts.

---

### Task 4: Expose the minimum product API surface

**Files:**
- Modify: `apps/agent-api/src/server.ts`
- Create: `apps/agent-api/src/smoke-product-api.ts`
- Modify: `apps/agent-api/package.json`
- Modify: root `package.json`

- [ ] **Step 1: Write the failing product API smoke**

Create `apps/agent-api/src/smoke-product-api.ts` that expects these endpoints:

```ts
POST /sessions
POST /sessions/:id/commands
GET /sessions/:id/state
GET /sessions/:id/artifacts
POST /sessions/:id/artifacts/:artifactId/restore
```

The smoke should assert:

```ts
assert.equal(createResponse.status, 201);
assert.equal(commandResponse.status, 200);
assert.ok(Array.isArray(state.opportunities));
assert.ok(Array.isArray(artifacts));
```

- [ ] **Step 2: Implement `POST /sessions`**

In `apps/agent-api/src/server.ts`, add route handling that returns:

```json
{ "sessionId": "..." }
```

with status `201`.

- [ ] **Step 3: Implement `POST /sessions/:id/commands`**

This endpoint should:
- accept `{ "command": string }`;
- run the Prism session runner;
- return the updated `ProductSessionState`.

- [ ] **Step 4: Implement `GET /sessions/:id/state` and artifact endpoints**

Return:
- full current session state;
- recent artifacts;
- restored session state after artifact restore.

- [ ] **Step 5: Wire smoke scripts**

Add to `apps/agent-api/package.json`:

```json
"smoke:product-api": "node dist/smoke-product-api.js"
```

And to root `package.json`:

```json
"smoke:product-api": "npm run build && npm run smoke:product-api -w @agentkernel/agent-api"
```

- [ ] **Step 6: Run the smoke**

Run:

```bash
npm run smoke:product-api
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/agent-api/src/server.ts apps/agent-api/src/smoke-product-api.ts apps/agent-api/package.json package.json
git commit -m "feat: expose Prism MVP1 product API"
```

**Acceptance for Task 4:**
- the product has a real API surface for a workspace UI;
- commands, state, and artifacts are accessible over HTTP;
- the API remains read-only and bounded.

---

### Task 5: Scaffold the minimal web app shell

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.mjs`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/globals.css`
- Modify: `apps/web/README.md`
- Modify: root `package.json`

- [ ] **Step 1: Write the failing web smoke expectation**

Add a simple smoke plan note in `apps/web/README.md` that requires the app to render:

```text
Command Bar
Opportunity Feed
Opportunity Detail
Execution Prep Panel
Session Status
```

- [ ] **Step 2: Add the minimal Next.js app files**

Create `apps/web/package.json` with scripts:

```json
{
  "name": "@agentkernel/web",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "typecheck": "tsc --noEmit"
  }
}
```

Create `apps/web/app/page.tsx` with a fixed three-column workspace shell that renders the required panel headings.

- [ ] **Step 3: Add root workspace wiring**

Ensure `apps/web/package.json` is included automatically by the existing `apps/*` workspace pattern and add root scripts if needed:

```json
"web:build": "npm run build -w @agentkernel/web"
```

- [ ] **Step 4: Run the web build**

Run:

```bash
npm run build -w @agentkernel/web
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web package.json
git commit -m "feat: scaffold Prism MVP1 workspace shell"
```

**Acceptance for Task 5:**
- `apps/web` is a real app, not a placeholder;
- the shell reflects the agreed workspace-first structure;
- the shell can be built independently.

---

### Task 6: Wire the workspace to the product API

**Files:**
- Create: `apps/web/lib/api.ts`
- Create: `apps/web/lib/types.ts`
- Create: `apps/web/components/command-bar.tsx`
- Create: `apps/web/components/session-status.tsx`
- Create: `apps/web/components/opportunity-feed.tsx`
- Create: `apps/web/components/opportunity-detail.tsx`
- Create: `apps/web/components/execution-prep-panel.tsx`
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: Write the failing UI state-loading test or smoke notes**

At minimum, document and verify this behavior manually in the task branch:

```text
Create session -> page shows idle state -> submit discover command -> page shows running then result -> selecting a card updates detail/prep panels.
```

If the project already has a frontend test harness, use it. If not, keep this task intentionally small and use typecheck plus manual dev verification.

- [ ] **Step 2: Add typed API client wrappers**

Create `apps/web/lib/types.ts` mirroring the `ProductSessionState` shape from `agent-api`.

Create `apps/web/lib/api.ts` with:

```ts
export async function createSession(): Promise<{ sessionId: string }> { /* fetch */ }
export async function runCommand(sessionId: string, command: string): Promise<ProductSessionState> { /* fetch */ }
export async function getSessionState(sessionId: string): Promise<ProductSessionState> { /* fetch */ }
export async function getArtifacts(sessionId: string): Promise<ProductSessionState["artifacts"]> { /* fetch */ }
export async function restoreArtifact(sessionId: string, artifactId: string): Promise<ProductSessionState> { /* fetch */ }
```

- [ ] **Step 3: Implement the fixed workspace panels**

The initial page must render these components only:

```text
CommandBar
SessionStatus
OpportunityFeed
OpportunityDetail
ExecutionPrepPanel
```

Do not add transcript UI, watchlists, alerts, or multi-page navigation.

- [ ] **Step 4: Implement the golden path interaction**

The page must:
- create a session on first load;
- submit commands from the command bar;
- render opportunities from API state;
- keep selected opportunity in local UI state;
- render prep status/result in the right rail.

- [ ] **Step 5: Run typecheck and manual UI verification**

Run:

```bash
npm run typecheck -w @agentkernel/web
```

Expected: PASS

Then run the dev servers and manually verify the golden path:

```bash
npm run dev -w @agentkernel/agent-api
npm run dev -w @agentkernel/web
```

Expected manual checks:
- entering a discover command updates session state;
- left rail fills with opportunity cards or explicit empty/partial warnings;
- selecting a card updates detail and prep panels;
- prep remains read-only and clearly bounded.

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "feat: connect Prism MVP1 workspace to product API"
```

**Acceptance for Task 6:**
- the product has a real internal workspace UI;
- the UI is workspace-first, not transcript-first;
- the golden path can be exercised end to end through the product API.

---

### Task 7: Add end-to-end product checks and a release-check command

**Files:**
- Create: `apps/agent-api/src/smoke-product-golden-path.ts`
- Modify: `apps/agent-api/package.json`
- Modify: `package.json`
- Modify: `docs/superpowers/plans/2026-05-31-prism-mvp1-finish-sequence.md`

- [ ] **Step 1: Write the failing product golden-path smoke**

Create `apps/agent-api/src/smoke-product-golden-path.ts` that simulates:

```text
create session
-> submit discover command
-> verify session state updated
-> inspect opportunities/artifacts
-> submit prep command for first opportunity
-> verify prep result
-> submit execution-shaped request
-> verify boundary response
```

The smoke should assert:

```ts
assert.ok(stateAfterDiscover.runState.status === "ok" || stateAfterDiscover.runState.status === "partial" || stateAfterDiscover.runState.status === "empty");
assert.ok(Array.isArray(stateAfterDiscover.artifacts));
assert.match(stateAfterPrep.prep?.humanPlan ?? "", /manual|read-only/i);
assert.equal(boundaryState.runState.status, "boundary");
```

- [ ] **Step 2: Add new smoke scripts**

In `apps/agent-api/package.json`:

```json
"smoke:product-golden-path": "node dist/smoke-product-golden-path.js"
```

In root `package.json`:

```json
"smoke:product-golden-path": "npm run build && npm run smoke:product-golden-path -w @agentkernel/agent-api"
```

- [ ] **Step 3: Add a new release-check command**

Add to root `package.json`:

```json
"gate:mvp1-product": "npm run gate:mvp1-arbitrage-prep && npm run smoke:product-api && npm run smoke:product-golden-path && npm run build -w @agentkernel/web && npm run typecheck -w @agentkernel/web"
```

- [ ] **Step 4: Run the new release-check command**

Run:

```bash
npm run gate:mvp1-product
```

Expected: PASS

- [ ] **Step 5: Add the no-ship criteria to this plan**

Document that MVP1 is not shippable if any are true:

```text
live discover fails opaquely
product API cannot drive session/workspace state
workspace shell cannot render the golden path
prep output loses read-only/manual-only wording
execution-shaped requests are not intercepted as boundary states
```

- [ ] **Step 6: Commit**

```bash
git add apps/agent-api/src/smoke-product-golden-path.ts apps/agent-api/package.json package.json docs/superpowers/plans/2026-05-31-prism-mvp1-finish-sequence.md
git commit -m "test: add Prism MVP1 product ship gate"
```

**Acceptance for Task 7:**
- a single command proves backend semantics plus product path;
- the gate reflects real internal MVP usability, not only backend correctness;
- no-execution safety remains part of the release check.

---

## Efficient execution order

Implement in this order only:

1. Task 1 — freeze finish boundary.
2. Task 2 — stabilize live discover semantics.
3. Task 3 — add product session state.
4. Task 4 — expose minimum product API.
5. Task 5 — scaffold workspace shell.
6. Task 6 — wire workspace to API.
7. Task 7 — add product-grade acceptance.

## What can be parallelized

Only after Task 4 completes:

- Task 5 and early Task 7 scaffolding may run in parallel.
- After Task 5 completes, Task 6 can begin.

## What must not be parallelized

Do not parallelize:
- Task 2 with UI work;
- Task 4 with direct frontend consumption of internal runtime structures;
- Task 7 before the API and UI path exist.

## Definition of done

MVP1 finish remains intentionally narrow: read-only Binance + Bitget funding-basis discover -> inspect -> prep, proven on a constrained demo symbol set through a minimal product API, a minimal internal workspace UI, and explicit end-to-end checks that the API and UI can complete the loop. It does not include product-level multi-agent runtime, additional exchanges, additional strategies, continuous monitoring engine work, or execution systems.

MVP1 finish is complete only when all are true:

1. `npm run gate:mvp1-arbitrage-prep` passes.
2. `npm run smoke:mvp1-user-path -w @agentkernel/agent-api` no longer fails opaquely and reports degraded/empty/live states clearly.
3. `npm run smoke:product-api` passes.
4. `npm run gate:mvp1-product` passes.
5. `apps/web` renders the agreed workspace-first internal UI.
6. The product can exercise the loop:

```text
discover -> select -> inspect -> prep
```

without exposing execution authority.

## Why this is the most efficient path

- It protects the existing strong backend/control-plane work.
- It avoids building UI on top of an unstable discover path.
- It avoids binding the UI directly to runtime internals.
- It adds only the minimum product surface needed for a credible internal MVP.
- It defers all tempting but non-essential expansions until after a real end-to-end product release check exists.
