## Intended Architecture

The first implementation should be deliberately thin:

```text
apps/web server component/server action
  -> Prisma Client
  -> SQLite
  -> WorkspaceProject + WorkspaceSession rows
  -> WorkspaceMessage + AgentRun rows

apps/web client chat panel
  -> existing CopilotChat
  -> threadId={activeSession.copilotThreadId}
  -> existing /api/copilotkit route

/api/copilotkit
  -> existing CopilotRuntime
  -> KernelAgent + host-owned AgentPersistence port
  -> existing WarmSessionStore keyed by userId + input.threadId
```

SQLite owns durable product navigation state. CopilotKit owns the chat UI and AG-UI protocol.
`WarmSessionStore` owns only process-local Pi runtime caching. The first slice should prove this
loop before adding repository, artifact, event-trace, recovery-summary, or auth complexity.

## Multi-Agent Review Decision

The first draft was rejected as over-scoped because it proposed projects, sessions, messages, runs,
repository metadata, artifacts, package-level store contracts, and API routes before proving the
minimum user-visible loop.

The revised decision is:

- keep Prisma persistence local to `apps/web` for the first slice;
- use Prisma Client directly from server-only modules;
- create no generic `ProjectStore`/`SessionStore`/`RepositoryStore` abstraction yet;
- create no `packages/domain` workspace model yet;
- create message and run tables only because the product now needs durable chat/audit proof;
- create no repository, artifact, or event-trace tables yet;
- prove `WorkspaceSession.copilotThreadId -> <CopilotChat threadId>` before adding more tables.

Extraction to `packages/storage` becomes justified only when a second runtime/app needs the same
database functions or when query duplication appears.

## Technology Decision

Use Prisma + SQLite.

Reasons:

- Prisma provides a mature schema, generated client, migration history, and local inspection tools.
- SQLite satisfies the local-first and company-cost requirement.
- The repository is a TypeScript/Next.js monorepo, so a generated TypeScript client reduces custom
  SQL and hand-written mapping code.
- CopilotKit already exposes a `threadId` prop on `CopilotChat`, and AG-UI agents already accept
  `threadId`, so no custom chat implementation is needed for the first slice.

Do not upgrade CopilotKit just for this feature. Use the installed component behavior unless a
specific missing API blocks the implementation.

## Minimal Schema

```text
workspace_projects
- id TEXT PRIMARY KEY
- user_id TEXT NOT NULL
- title TEXT NOT NULL
- created_at DATETIME NOT NULL
- updated_at DATETIME NOT NULL

workspace_sessions
- id TEXT PRIMARY KEY
- user_id TEXT NOT NULL
- project_id TEXT NOT NULL REFERENCES workspace_projects(id)
- title TEXT NOT NULL
- status TEXT NOT NULL
- copilot_thread_id TEXT NOT NULL UNIQUE
- last_opened_at DATETIME
- last_message_at DATETIME
- created_at DATETIME NOT NULL
- updated_at DATETIME NOT NULL

workspace_messages
- id TEXT PRIMARY KEY
- user_id TEXT NOT NULL
- session_id TEXT NOT NULL REFERENCES workspace_sessions(id)
- copilot_thread_id TEXT NOT NULL
- role TEXT NOT NULL
- content TEXT NOT NULL
- status TEXT NOT NULL
- source TEXT NOT NULL
- run_id TEXT
- created_at DATETIME NOT NULL

agent_runs
- id TEXT PRIMARY KEY
- user_id TEXT NOT NULL
- session_id TEXT NOT NULL REFERENCES workspace_sessions(id)
- copilot_thread_id TEXT NOT NULL
- status TEXT NOT NULL
- model TEXT
- user_message_id TEXT
- assistant_message_id TEXT
- error_code TEXT
- error_message TEXT
- started_at DATETIME NOT NULL
- finished_at DATETIME
```

Indexes:

- `workspace_projects(user_id, updated_at)`
- `workspace_sessions(user_id, project_id, updated_at)`
- `workspace_sessions(user_id, last_opened_at)`
- `workspace_sessions(user_id, last_message_at)`
- `workspace_messages(user_id, session_id, created_at)`
- `workspace_messages(copilot_thread_id, created_at)`
- `workspace_messages(run_id)`
- `agent_runs(user_id, session_id, started_at)`
- `agent_runs(copilot_thread_id, started_at)`
- `agent_runs(status, started_at)`

No `users` table is required for the first slice. Use a server-side constant:

```text
LOCAL_USER_ID=local
```

If a profile label is needed, use static code/config, not a credentials table. Auth is a later
OpenSpec.

## File Placement

Prefer this first-slice layout:

```text
apps/web/prisma/schema.prisma
apps/web/prisma/migrations/...
apps/web/lib/db/prisma.ts
apps/web/lib/db/workspace-sessions.ts
apps/web/lib/db/agent-persistence-core.ts
apps/web/lib/db/agent-persistence.ts
apps/web/app/page.tsx
apps/web/app/actions.ts
apps/web/components/workspace-sidebar.tsx
apps/web/components/chat-panel.tsx
```

`apps/web/lib/db/prisma.ts` should use the standard global singleton pattern for Next.js dev HMR.

`apps/web/lib/db/workspace-sessions.ts` should expose only a few server-only functions:

```text
ensureDefaultWorkspace()
listWorkspaceSessions(userId)
createWorkspaceSession(userId, input)
touchWorkspaceSession(userId, sessionId)
getWorkspaceSession(userId, sessionId)
```

These are not public repository interfaces. They are small local server helpers over Prisma.

`apps/web/lib/db/agent-persistence.ts` is the server-only runtime wrapper. Its testable core lives
in `agent-persistence-core.ts` and is verified against an isolated SQLite database.

`packages/agui-bridge` exposes only the `AgentPersistence` interface and call timing. It must not
import Prisma or any `apps/web` module.

## CopilotKit Binding

Use the mature existing component path:

```tsx
<CopilotChat
  key={activeSession.id}
  threadId={activeSession.copilotThreadId}
  className="ak-chat"
  labels={...}
/>
```

Why:

- `CopilotChat` already supports `threadId`.
- AG-UI `AbstractAgent`/config supports `threadId`.
- `KernelAgent.run()` already uses `input.threadId`.
- `WarmSessionStore` already keys by `userId + threadId`.

The `key={activeSession.id}` is a pragmatic first-slice reset boundary when switching sessions. It
avoids writing custom chat state management. If old transcripts are not loaded yet, the selected
session starts with an empty visible chat but uses the durable thread id for future turns.

## UI Shape

First target:

```text
┌──────────────────────────────────────────────────────────────┐
│ Sidebar                         │ Existing CopilotKit chat    │
│ - AgentKernel                   │                              │
│ - New session                   │ threadId = active session    │
│ - Sessions                      │                              │
│   - Current conversation        │                              │
│   - Previous conversation       │                              │
└──────────────────────────────────────────────────────────────┘
```

Do not show repository sections in the first slice unless they are static display-only text. A
database-backed repository registry is a later change.

## Server Rendering And Actions

Use a server-rendered page or shell to load the default workspace and sessions from SQLite.

Use server actions for first-slice mutations:

- create session;
- open/touch session;
- optionally rename session.

API routes are not needed for same-app sidebar CRUD unless a non-React client or external caller is
introduced. `/api/copilotkit` remains the runtime transport route.

## Session Resume Semantics

SQLite resume means:

- the sidebar can list previous sessions;
- selected session id can survive refresh through URL/search params or server state;
- each persisted session has a stable `copilotThreadId`;
- after process restart, a new warm Pi session can be created for the same thread id on the next
  user message.

SQLite resume does not mean:

- old assistant/user transcript is rendered in the chat in the first slice;
- a disposed Pi `AgentSession` is resurrected with internal hidden state;
- in-flight streams survive process restart.

Full event persistence is intentionally deferred. Phase 1 persists final user/assistant messages
and one terminal run status, but not token chunks or tool-call audit events.

## Migration And Environment

Suggested tracked env template:

```text
DATABASE_URL=file:./data/agent-kernel-dev.db
```

Suggested scripts:

```json
{
  "db:generate": "prisma generate --schema apps/web/prisma/schema.prisma",
  "db:migrate": "prisma migrate dev --schema apps/web/prisma/schema.prisma",
  "db:deploy": "prisma migrate deploy --schema apps/web/prisma/schema.prisma",
  "db:studio": "prisma studio --schema apps/web/prisma/schema.prisma"
}
```

The SQLite database file should be gitignored. Migration files should be committed.

## Deferred Extensions

Defer these until after the minimal durable session loop works:

- message transcript persistence;
- assistant streaming aggregation;
- agent run records;
- repository registry;
- artifact table or SQLite `ArtifactStore`;
- package-level storage/domain abstractions;
- authentication and real multi-user isolation;
- external workspace/session API routes;
- PostgreSQL compatibility.

## Risks

- If `CopilotChat threadId` does not reset cleanly when switching active sessions, use
  `key={activeSession.id}` and a small chat panel component before considering custom headless chat.
- If the first slice needs visible transcript history, add only `chat_messages` next, not run,
  repository, and artifact tables together.
- `suppressHydrationWarning` in the root layout should not hide sidebar mismatches. Selected session
  state should come from URL/search params or server-loaded default state.
