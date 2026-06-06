# CopilotKit, Pi Agent, and SQL Session Integration Plan

## Purpose

This document defines the target architecture for durable multi-session chat in
AgentKernel Web. The goal is to combine:

- CopilotKit for chat UI, AG-UI request routing, stream transport, and `threadId`.
- Pi Agent for warm runtime sessions, model/tool execution, and domain vertical behavior.
- SQL for product-owned sessions, messages, run audit, recovery metadata, and future search.

The design must keep the code small by using existing repository functions and library
contracts instead of replacing CopilotKit or Pi Agent internals.

## Implementation Status

As of Phase 1, durable transcript persistence is implemented and verified locally:

- `WorkspaceMessage` stores final user and assistant transcript rows.
- `AgentRun` stores one row per CopilotKit/Pi run with `running`, `completed`, or `failed` status.
- `WorkspaceSession` stores `summary`, `model`, `messageCount`, `lastMessageAt`, and a title derived from the first user message.
- `packages/agui-bridge` exposes the host-owned `AgentPersistence` port and does not import Prisma.
- `apps/web/lib/db/agent-persistence.ts` implements the Prisma adapter.
- `apps/web/lib/agent-runtime.ts` wires the adapter into the in-process CopilotKit agent.
- Browser smoke against `http://localhost:3000` confirmed a real CopilotKit message created:
  - one `workspace_messages` user row,
  - one `workspace_messages` assistant row,
  - one `agent_runs` row with `status="completed"` and `model="gpt-5.5"`.

Not implemented yet:

- `AgentRunEvent` table and tool/event trace persistence.
- SQL transcript hydration into the CopilotKit UI.
- Pi warm-session recovery from `WorkspaceSession.summary`.
- Real authenticated multi-user `resolveUserId`.

## Current State

The current web app has the durable first session chain:

```text
WorkspaceSession.id
  -> URL ?session=...
  -> WorkspaceSession.copilotThreadId
  -> <CopilotChat threadId=...>
  -> CopilotKit RunAgentInput.threadId
  -> KernelAgent WarmSessionStore key = userId::threadId
  -> Pi Agent warm session
```

Implemented files:

- `apps/web/app/page.tsx` selects the active SQL session from `?session=`.
- `apps/web/components/chat-panel.tsx` passes `copilotThreadId` into `CopilotChat.threadId`.
- `apps/web/components/workspace-sidebar.tsx` renders persisted sessions.
- `apps/web/lib/db/workspace-sessions.ts` creates, lists, and touches SQLite sessions.
- `apps/web/prisma/schema.prisma` currently stores projects and sessions.
- `packages/agui-bridge/src/kernel-agent.ts` maps CopilotKit `RunAgentInput.threadId` to Pi warm sessions.
- `packages/agui-bridge/src/session-store.ts` keeps Pi sessions in memory by `userId::threadId`.

This is now a complete Phase 1 persistence foundation, but not yet a recovery or full
event-audit system.

## Current Gaps

Before Phase 1, SQL persistence stored only the session shell:

- project row
- session row
- `copilotThreadId`
- open/update timestamps

Phase 1 now stores:

- user messages
- final assistant messages
- run status
- stream/provider errors
- model used for each run
- message-derived session title

It does not yet store:

- tool calls
- recovery summary after process restart
- AG-UI / Pi event audit trail

The Pi warm session is currently process memory. This is fast and correct for live turns, but
it is not durable. After a server restart, the SQL session list survives, while Pi warm
session context is gone unless we add recovery metadata.

## Ownership Rules

Use a three-layer model:

```text
Product session layer:
  WorkspaceProject
  WorkspaceSession
  WorkspaceMessage
  AgentRun
  AgentRunEvent

CopilotKit / AG-UI layer:
  CopilotChat
  threadId
  runId
  RunAgentInput
  forwardedProps

Pi Agent runtime layer:
  KernelAgent
  WarmSessionStore
  Pi AgentSession
  vertical tools and skills
```

Do not collapse these layers into one object.

Rules:

- `WorkspaceSession.id` is the product/database URL identity.
- `WorkspaceSession.copilotThreadId` is the CopilotKit / AG-UI / Pi warm-session identity.
- `RunAgentInput.runId` is the single-turn run identity.
- SQL is the durable product source of truth.
- `WarmSessionStore` is a performance and continuity cache, not a durable store.
- Pi Agent remains responsible for reasoning and tools.
- CopilotKit remains responsible for chat transport and thread routing.

## Target Data Model

Extend the current Prisma schema with message and run tables.

### WorkspaceSession Changes

Add small product metadata:

```prisma
model WorkspaceSession {
  id              String   @id
  userId          String   @map("user_id")
  projectId       String   @map("project_id")
  title           String
  summary         String?
  status          String   @default("active")
  model           String   @default("gpt-5.5")
  copilotThreadId String   @unique @map("copilot_thread_id")
  messageCount    Int      @default(0) @map("message_count")
  lastOpenedAt    DateTime? @map("last_opened_at")
  lastMessageAt   DateTime? @map("last_message_at")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  project  WorkspaceProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  messages WorkspaceMessage[]
  runs     AgentRun[]

  @@index([userId, projectId, updatedAt])
  @@index([userId, lastOpenedAt])
  @@index([userId, lastMessageAt])
  @@map("workspace_sessions")
}
```

### WorkspaceMessage

Store the final durable transcript.

```prisma
model WorkspaceMessage {
  id              String   @id
  userId          String   @map("user_id")
  sessionId       String   @map("session_id")
  copilotThreadId String   @map("copilot_thread_id")
  role            String
  content         String
  status          String   @default("final")
  source          String   @default("copilotkit")
  runId           String?  @map("run_id")
  createdAt       DateTime @default(now()) @map("created_at")

  session WorkspaceSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([userId, sessionId, createdAt])
  @@index([copilotThreadId, createdAt])
  @@index([runId])
  @@map("workspace_messages")
}
```

Roles:

- `user`
- `assistant`
- `system`
- `tool`

Initial implementation should persist only `user` and final `assistant` messages. Tool and
streaming chunk persistence can come later.

### AgentRun

Store one row per CopilotKit/Pi run.

```prisma
model AgentRun {
  id              String    @id
  userId          String    @map("user_id")
  sessionId       String    @map("session_id")
  copilotThreadId String    @map("copilot_thread_id")
  status          String
  model           String?
  userMessageId   String?   @map("user_message_id")
  assistantMessageId String? @map("assistant_message_id")
  errorCode       String?   @map("error_code")
  errorMessage    String?   @map("error_message")
  startedAt       DateTime  @default(now()) @map("started_at")
  finishedAt      DateTime? @map("finished_at")

  session WorkspaceSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  events  AgentRunEvent[]

  @@index([userId, sessionId, startedAt])
  @@index([copilotThreadId, startedAt])
  @@index([status, startedAt])
  @@map("agent_runs")
}
```

Statuses:

- `running`
- `completed`
- `failed`
- `cancelled`
- `busy`

### AgentRunEvent

Store structured run evidence only after the MVP message store is stable.

```prisma
model AgentRunEvent {
  id        String   @id
  runId     String   @map("run_id")
  type      String
  payload   Json?
  createdAt DateTime @default(now()) @map("created_at")

  run AgentRun @relation(fields: [runId], references: [id], onDelete: Cascade)

  @@index([runId, createdAt])
  @@map("agent_run_events")
}
```

Do not write every tiny token chunk at first. Store final assistant text in
`WorkspaceMessage`; event persistence is for diagnostics, tool calls, errors, and later replay.

## Runtime Write Path

The write path belongs on the server side, not in React DOM listeners.

Current `KernelAgent.run(input)` already sees:

- `input.threadId`
- `input.runId`
- `input.messages`
- `input.forwardedProps.model`
- Pi events from `managed.session.subscribe(...)`
- Pi errors from `session.prompt(...)`

Add an optional persistence port to `packages/agui-bridge`:

```ts
export interface AgentPersistence {
  onRunStart(input: {
    userId: string;
    threadId: string;
    runId: string;
    model?: string;
    latestUserText: string;
  }): Promise<{
    sessionId: string;
    userMessageId: string;
  }>;

  onAssistantTextDelta?(input: {
    runId: string;
    delta: string;
  }): Promise<void>;

  onRunFinish(input: {
    runId: string;
    assistantText: string;
  }): Promise<void>;

  onRunError(input: {
    runId: string;
    code: string;
    message: string;
  }): Promise<void>;
}
```

`packages/agui-bridge` should own only the interface and call timing. It must not import
Prisma or `apps/web`.

`apps/web` should implement:

```text
apps/web/lib/db/agent-persistence.ts
```

This implementation maps `threadId` back to `WorkspaceSession.copilotThreadId`.

## Run Lifecycle

### Start

When CopilotKit sends a user message:

1. `KernelAgent.run(input)` extracts latest user text.
2. Resolve server user id.
3. Find session by `(userId, copilotThreadId = input.threadId)`.
4. Insert `WorkspaceMessage(role="user")`.
5. Insert `AgentRun(status="running")`.
6. Update `WorkspaceSession.lastMessageAt`, `messageCount`, and title if needed.
7. Continue to `WarmSessionStore.loadOrCreate({ userId, threadId })`.

### Streaming

During Pi event subscription:

1. Continue translating Pi events to AG-UI immediately.
2. Accumulate assistant final text in memory for the current run.
3. Optionally persist coarse events only:
   - run started
   - tool call start/end
   - error
   - run finished

Do not block token streaming on database writes. Use best-effort event writes or batch final
state writes. The MVP should prioritize correct final transcript and run status.

### Finish

When Pi emits `agent_end`, the translator emits AG-UI `RUN_FINISHED` to the stream.
`KernelAgent` completes the Observable only after `session.prompt(...)` returns and the
final persistence write has been attempted. This avoids ending the caller before
`onRunFinish(...)` is durable.

After `session.prompt(...)` returns:

1. Insert `WorkspaceMessage(role="assistant")` with final text.
2. Update `AgentRun(status="completed", finishedAt, assistantMessageId)`.
3. Update `WorkspaceSession.lastMessageAt`, `messageCount`.
4. If session title is still `"New discussion"`, generate a deterministic title from the
   first user message, for example first 32 visible characters.

### Error

On model/provider/Pi errors:

1. Update `AgentRun(status="failed", errorCode, errorMessage, finishedAt)`.
2. Keep the user message.
3. Do not create a fake assistant message unless the UI actually received one.
4. Update `WorkspaceSession.lastMessageAt`.

## Read Path

### Sidebar

`listWorkspaceSessions(...)` should eventually return:

- `id`
- `title`
- `summary`
- `messageCount`
- `lastMessageAt`
- `lastOpenedAt`
- `copilotThreadId`

Ordering:

```text
lastMessageAt desc nulls last
lastOpenedAt desc
updatedAt desc
```

### Chat

Phase 1 should keep using CopilotKit's `CopilotChat threadId` behavior and avoid replacing
its message UI. SQL transcript is used for persistence and future recovery, not immediate UI
replay.

Phase 2 can add explicit SQL history hydration if CopilotKit exposes a stable message-store
API suitable for v2.

## Pi Agent Recovery Strategy

Do not try to replay the full SQL transcript into Pi Agent as normal user messages. That can
repeat tool calls and corrupt runtime state.

Use summary-based recovery:

1. SQL stores all messages.
2. `WorkspaceSession.summary` stores a compact conversation memory.
3. When `WarmSessionStore` creates a new Pi session for an existing `threadId`, load the
   SQL session summary.
4. Inject the summary as runtime context before the first new user prompt.

Implementation options:

- Preferred: use a Pi SDK-supported context/bootstrap API if available.
- Acceptable MVP fallback: prepend an internal recovery context to the first prompt only.

Example recovery context:

```text
Previous conversation summary for this thread:
...

Continue from this context. Do not repeat prior tool calls unless the user asks.
```

This is a recovery aid, not the canonical transcript. SQL remains canonical.

## CopilotKit Model Selection

The UI currently offers only:

```text
gpt-5.5
```

Keep this simple:

- `DEFAULT_MODEL = "gpt-5.5"`.
- `CopilotKit properties={{ model }}` forwards the model.
- `KernelAgent` reads `input.forwardedProps.model`.
- `agent-runtime.ts` resolves the model via `configured.resolveModel`.
- If the model is not configured, return `MODEL_NOT_AVAILABLE` and persist the failed run.

Do not split warm sessions by model. Current `KernelAgent` behavior is correct: use
`session.setModel(nextModel)` on the existing warm Pi session.

## Security and Multi-User Boundary

Current dev identity is:

```ts
resolveUserId: () => "local"
```

This is acceptable only for local MVP.

Before multi-user deployment:

- Resolve user id from authenticated server session.
- Filter every SQL query by `userId`.
- Never trust client-supplied user id.
- Keep `copilotThreadId` unguessable.
- Do not expose raw `AgentRunEvent.payload` if it may contain tool secrets.

## Implementation Tasks

### Phase 1: Durable Session Transcript

1. Add Prisma models: **done**
   - `WorkspaceMessage`
   - `AgentRun`
   - optional `AgentRunEvent`
   - add `summary`, `model`, `messageCount` to `WorkspaceSession`

2. Add database helpers: **done through `createPrismaAgentPersistence()`**
   - `findWorkspaceSessionByThread(userId, threadId)`
   - `createUserMessage(...)`
   - `createAgentRun(...)`
   - `completeAgentRun(...)`
   - `failAgentRun(...)`
   - `createAssistantMessage(...)`
   - `updateSessionAfterMessage(...)`

3. Add agui-bridge persistence interface: **done**
   - `AgentPersistence`
   - optional `persistence?: AgentPersistence` on `KernelAgentOptions`

4. Wire persistence inside `KernelAgent.run(...)`: **done**

5. Implement Prisma adapter in `apps/web/lib/db/agent-persistence.ts`: **done**

6. Inject adapter in `apps/web/lib/agent-runtime.ts`: **done**

7. Add tests:
   - unit test fake persistence calls from `KernelAgent`: **done**
   - integration test Prisma persistence helpers: **deferred**
   - browser smoke for new session, send message, SQL message rows: **done locally**

### Phase 2: Session Titles and Sidebar Quality

1. Auto-title empty sessions from first user message.
2. Sort sessions by `lastMessageAt`.
3. Hide empty abandoned sessions if desired.
4. Add delete/archive behavior only after persistence is stable.

### Phase 3: Recovery Summary

1. Add summary update function.
2. Generate deterministic first summary from recent messages.
3. Add model-generated summary only after provider reliability is confirmed.
4. On warm session creation, load summary and inject recovery context.

### Phase 4: Event Audit and Tool Trace

1. Persist tool-call events.
2. Persist run errors.
3. Add a run inspector/debug endpoint for local development.
4. Add UI trace only if product needs it.

## Verification Matrix

Run deterministic checks first:

```bash
DATABASE_URL='file:../data/agent-kernel-dev.db' npm run db:generate
DATABASE_URL='file:../data/agent-kernel-dev.db' npm run db:migrate
DATABASE_URL='file:../data/agent-kernel-dev.db' npm run typecheck
DATABASE_URL='file:../data/agent-kernel-dev.db' npm run web:build
```

Runtime checks:

1. Open `http://localhost:3000`.
2. Create a new session.
3. Send `hi`.
4. Confirm:
   - `WorkspaceMessage(role=user)` exists.
   - `AgentRun(status=running)` is created.
   - after response, `WorkspaceMessage(role=assistant)` exists.
   - `AgentRun(status=completed)` is updated.
   - `WorkspaceSession.lastMessageAt` is updated.
5. Create another session.
6. Send a different message.
7. Confirm SQL rows do not mix between sessions.
8. Restart the dev server.
9. Confirm sidebar sessions remain.
10. Confirm warm Pi context loss is expected until Phase 3.

Error checks:

1. Start without configured provider key.
2. Send a message.
3. Confirm run failure is stored with error code and message.
4. Confirm UI does not crash.

Concurrency checks:

1. Double-submit or send from two tabs on the same session.
2. Confirm `BUSY` is returned.
3. Confirm failed/busy run is stored without corrupting messages.

## Non-Goals for the First Implementation

- Do not replace CopilotKit chat internals.
- Do not replay every SQL message into Pi Agent as user prompts.
- Do not build a custom chat UI before persistence works.
- Do not add multi-user auth in the same slice.
- Do not add delete/archive until message/run integrity is verified.
- Do not persist secrets or raw provider credentials.

## Recommended First Slice

Implement only:

```text
WorkspaceMessage
AgentRun
AgentPersistence interface
Prisma persistence adapter
KernelAgent persistence calls
session title from first user message
tests and browser smoke
```

This gives the product durable sessions and auditability while keeping CopilotKit and Pi
Agent on their current proven paths.
