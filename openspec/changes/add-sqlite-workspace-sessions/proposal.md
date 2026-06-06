## Why

The current web app is a single CopilotKit chat surface backed by a process-local
`WarmSessionStore`. It can keep a Pi session warm while the Node process lives, but it cannot show
a durable left-side session list after refresh or process restart.

The user-visible goal for the next slice is smaller than a full workspace database: show persisted
discussion sessions, create/switch sessions, and keep the existing CopilotKit chat working. SQLite
is enough for this local-first product requirement and matches the company preference for cheap,
versioned local databases.

## What Changes

- Add a minimal SQLite + Prisma persistence layer inside `apps/web` for:
  - one local workspace project;
  - discussion sessions;
  - a stable `copilotThreadId` per session;
  - final user/assistant transcript rows;
  - one agent-run audit row per CopilotKit/Pi run.
- Render a left sidebar from SQLite using a server-rendered workspace shell.
- Use the existing `CopilotChat` component's `threadId` prop to bind the active persisted session
  to CopilotKit.
- Keep `/api/copilotkit` and `WarmSessionStore` on their existing proven paths.
- Add a narrow host-owned persistence port to `KernelAgent` so the web app can write SQL without
  importing Prisma into `packages/agui-bridge`.
- Use Next server components/server actions or small server-only functions for same-app session
  CRUD instead of creating a broad API surface.

## Impact

- Affects `apps/web` for Prisma setup, server-only session functions, sidebar UI, and active
  session binding.
- Does not expand `packages/storage` in the first slice.
- Does not add `packages/domain` workspace/session types in the first slice.
- Modifies `packages/agui-bridge` only to expose and call a small `AgentPersistence` interface.
- Updates README/deployment docs and `.env.example` when implementation begins.

## Out Of Scope / Non-Goals

- No PostgreSQL in this slice.
- No Supabase or hosted database.
- No auth implementation, password hashing, email login, cookies, or multi-user claim.
- No GitHub OAuth or remote repository crawling.
- No filesystem-wide repository scanning.
- No token-by-token transcript persistence in this slice.
- No full AG-UI/Pi event trace persistence in this slice.
- No repository metadata tables in the first slice.
- No artifact persistence migration in the first slice.
- No attempt to serialize or restore a live Pi `AgentSession` from SQLite.
- No exposure of coding tools, shell tools, write tools, private API credentials, or execution
  capabilities through the product UI.
- No storage of API keys or other secrets in SQLite.

## Acceptance Outcomes

- The app can create a persisted discussion session.
- The sidebar lists persisted sessions from SQLite.
- Selecting a session passes that session's `copilotThreadId` to `CopilotChat threadId`.
- Refreshing the page keeps the session list and selected session.
- Restarting the dev server keeps the session list.
- The existing CopilotKit chat can still send a message on the active session.
- Sending a message writes a user `WorkspaceMessage`, a final assistant `WorkspaceMessage` when
  available, and an `AgentRun` with terminal `completed`, `failed`, or `cancelled` status.
- The client does not receive a successful terminal run event before durable finish persistence has
  succeeded.
- `WarmSessionStore` remains cache-only and is not used as the sidebar source of truth.
- SQLite schema changes are versioned through committed Prisma migrations.
