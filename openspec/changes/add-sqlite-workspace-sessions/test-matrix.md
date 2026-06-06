## Deterministic Verification

### Prisma And SQLite

- Check: Prisma schema validates and client generation succeeds.
- Command: `npm run db:generate`
- Expected: Prisma Client generation succeeds for `apps/web/prisma/schema.prisma`.

- Check: Initial SQLite migration applies on an empty local database.
- Command: `npm run db:migrate`
- Expected: SQLite database file is created locally and migration table exists.

- Check: Deployment migration command is valid.
- Command: `npm run db:deploy`
- Expected: migrations apply without dev-only prompts.

### Minimal Session Helpers

- Check: default workspace creation is idempotent.
- Suggested command: `npm run test -w @agentkernel/web`
- Expected: repeated setup produces one default project for `LOCAL_USER_ID`.

- Check: session creation returns a stable `copilotThreadId`.
- Suggested command: `npm run test -w @agentkernel/web`
- Expected: created session has a unique thread id and can be read again.

- Check: session list is scoped by local server user id.
- Suggested command: `npm run test -w @agentkernel/web`
- Expected: helper functions always filter by the server-side user id parameter.

### Durable Transcript And Run Audit

- Check: Prisma persistence adapter writes completed user/assistant transcript rows.
- Command: `DATABASE_URL='file:../data/agent-kernel-dev.db' npm --workspace @agentkernel/web test`
- Expected: isolated SQLite tests pass for `WorkspaceMessage` and `AgentRun`.

- Check: provider/runtime failures do not create fake assistant transcript rows.
- Command: `DATABASE_URL='file:../data/agent-kernel-dev.db' npm --workspace @agentkernel/web test`
- Expected: failed run stores one user row, no assistant row, and terminal `failed` status.

- Check: client disconnects mark in-flight persisted runs as cancelled.
- Command: `npm --workspace @agentkernel/agui-bridge test`
- Expected: bridge cancellation test invokes `onRunCancel` with `CLIENT_DISCONNECTED`.

- Check: finish persistence failure is visible to the client.
- Command: `npm --workspace @agentkernel/agui-bridge test`
- Expected: bridge emits terminal `RUN_ERROR(PERSISTENCE_RUN_FINISH_ERROR)` instead of silent
  `RUN_FINISHED`.

### Existing Runtime Boundary

- Check: `WarmSessionStore` remains cache-only.
- Command: `npm --workspace @agentkernel/agui-bridge test -- session-store.test.ts`
- Expected: existing warm session behavior passes without importing Prisma or SQLite.

- Check: `KernelAgent` still runs with `input.threadId`.
- Command: `npm --workspace @agentkernel/agui-bridge test -- kernel-agent.test.ts`
- Expected: existing AG-UI bridge tests pass.

- Check: `KernelAgent` does not import Prisma or web DB modules.
- Command: `rg -n "Prisma|apps/web|agent-persistence" packages/agui-bridge/src`
- Expected: no matches other than interface names/comments that do not import web code.

### Repository-Wide Checks

- Check: TypeScript project references compile.
- Command: `npm run typecheck`
- Expected: exits 0.

- Check: Next.js web build compiles.
- Command: `npm run web:build`
- Expected: exits 0.

## Browser Verification

### Durable Session Sidebar

- Check: `http://localhost:3000/` renders a left sidebar plus existing chat.
- Expected: session list and new-session control are visible.

- Check: creating a new session adds it to the sidebar.
- Expected: active session changes and chat input remains usable.

- Check: switching sessions changes the `CopilotChat threadId`.
- Expected: two sessions have distinct durable thread ids; no runtime crash.

- Check: refreshing the browser preserves the session list.
- Expected: sessions are loaded from SQLite, not in-memory React state.

- Check: stopping and restarting the dev server preserves the session list.
- Expected: sessions remain visible; a new warm Pi session may be created on the next message.

- Check: existing CopilotKit chat still sends a message.
- Expected: `/api/copilotkit` handles the run, the model selector still forwards the selected model,
  and SQLite contains user/assistant messages plus a completed `AgentRun`.

- Check: no hydration console error after adding the sidebar.
- Expected: no React hydration mismatch from sidebar-selected session state.

## Manual Risk Review

- Confirm `.env.smoke`, local SQLite database files, and secrets are not staged.
- Confirm migration files are staged when implementation is complete.
- Confirm no SQLite schema field stores API keys, passwords, or raw secret values.
- Confirm no route exposes local filesystem scans.
- Confirm no product UI copy claims multi-user support before authentication exists.

## Deferred Verification

These checks belong to later specs, not the first session-sidebar slice:

- assistant streaming aggregation;
- token-by-token event persistence;
- transcript replay into CopilotKit UI;
- Pi recovery-summary injection after process restart;
- repository registry privacy;
- artifact persistence and lineage;
- auth/cookie/two-user isolation.
