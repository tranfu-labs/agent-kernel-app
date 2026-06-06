## Planning And Contract Slice

- [x] Inspect current web/runtime/storage boundaries.
- [x] Decide SQLite over PostgreSQL for the first local persistence layer.
- [x] Decide Prisma as the first migration/client layer.
- [x] Run multi-agent review focused on mature functions, less code, and efficient delivery.
- [x] Revise scope to a thin first slice: persisted sessions + CopilotChat `threadId`.
- [x] Revise scope after implementation review: include final message transcript and agent-run
      audit rows, but still defer event traces, replay, recovery, repositories, artifacts, and auth.

## Implementation Slice 1: Minimal SQLite Session Loop

- [x] Add Prisma dependencies only where needed for `apps/web`.
- [x] Add `apps/web/prisma/schema.prisma` with `WorkspaceProject`, `WorkspaceSession`,
      `WorkspaceMessage`, and `AgentRun`.
- [x] Add SQLite migrations for the durable session/message/run schema.
- [x] Add database scripts using the `apps/web/prisma/schema.prisma` path.
- [x] Add `.env.example` database placeholder and gitignore local SQLite database files.
- [x] Add `apps/web/lib/db/prisma.ts` with a Next dev HMR-safe Prisma singleton.
- [x] Add `apps/web/lib/db/workspace-sessions.ts` with small server-only Prisma functions.
- [x] Add `apps/web/lib/db/agent-persistence-core.ts` and server-only wrapper.
- [x] Seed or ensure one default local workspace project.
- [x] Create a default session when no session exists.

## Implementation Slice 2: Sidebar And Server Actions

- [x] Convert `apps/web/app/page.tsx` into a server-rendered workspace shell.
- [x] Add a client chat panel component that preserves the existing `CopilotChat` labels and model
      menu behavior.
- [x] Add a sidebar component that lists sessions loaded from SQLite.
- [x] Add a server action for creating a new session.
- [x] Use URL/search params or server-loaded default state to select the active session.
- [x] Pass `activeSession.copilotThreadId` to `<CopilotChat threadId={...}>`.
- [x] Use `key={activeSession.id}` on the chat panel or `CopilotChat` to keep session switching simple.

## Implementation Slice 3: CopilotKit/Pi Persistence Bridge

- [x] Add `AgentPersistence` interface to `packages/agui-bridge`.
- [x] Wire `onRunStart`, `onRunFinish`, `onRunError`, and `onRunCancel` in `KernelAgent.run(...)`.
- [x] Delay successful `RUN_FINISHED` until durable finish persistence succeeds when persistence is
      configured.
- [x] Emit `PERSISTENCE_RUN_FINISH_ERROR` instead of silent success if finish persistence fails.
- [x] Mark client-disconnected persisted runs as `cancelled`.
- [x] Persist final assistant text only once and ignore late finish after cancellation/failure.

## Implementation Slice 4: Proof And Hardening

- [x] Prove two different persisted sessions produce two different CopilotKit thread ids.
- [x] Prove `/api/copilotkit` still works with the persistence adapter.
- [x] Prove `WarmSessionStore` remains independent from SQLite.
- [x] Verify refresh preserves the sidebar session list.
- [x] Verify dev-server restart preserves the sidebar session list.
- [x] Verify browser smoke writes user/assistant messages and completed run to SQLite.
- [x] Add bridge tests for happy path, Pi failure, finish persistence failure, and disconnect cancel.
- [x] Add web Prisma persistence tests against an isolated SQLite database.
- [x] Polish responsive layout and ensure no text overlap/hydration console errors.

## Documentation Slice

- [x] Update README deployment/database section.
- [ ] Update company handoff doc to state SQLite session/message/run persistence is implemented.
- [x] Document local database setup, migration commands, reset command, and secret boundaries.
- [x] Document that SQLite stores workspace/session navigation state and durable transcript/audit rows,
      not live Pi runtime internals.

## Explicitly Deferred

- [ ] Do not add repository tables or filesystem scanning in this slice.
- [ ] Do not add artifact tables or SQLite `ArtifactStore` in this slice.
- [ ] Do not add token-by-token event persistence in this slice.
- [ ] Do not add transcript replay or Pi recovery-summary injection in this slice.
- [ ] Do not add package-level `ProjectStore`/`SessionStore` abstractions in this slice.
- [ ] Do not add `packages/domain` workspace/session models in this slice.
- [ ] Do not add auth, email/password, cookies, or multi-user claims in this slice.
- [ ] Do not add external workspace/session API routes unless server actions are proven insufficient.
- [ ] Do not upgrade CopilotKit unless the installed `threadId` path blocks implementation.
