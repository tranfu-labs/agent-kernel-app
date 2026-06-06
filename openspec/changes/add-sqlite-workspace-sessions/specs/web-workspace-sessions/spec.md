## ADDED Requirements

### Requirement: Durable Workspace Sessions

The web workspace SHALL persist workspace sessions in a versioned SQLite database.

#### Scenario: Session list survives restart

- **GIVEN** a local user creates a workspace session
- **WHEN** the web server process restarts
- **THEN** the workspace session appears in the sidebar after reload
- **AND** the session is loaded from SQLite rather than `WarmSessionStore`

### Requirement: Durable Session Transcript And Run Audit

The implementation SHALL persist the durable session shell, final transcript messages, and one run
audit row per CopilotKit/Pi run.

#### Scenario: Initial migrations are reviewed

- **GIVEN** the SQLite migrations are created
- **WHEN** the schema is inspected
- **THEN** it includes workspace project, workspace session, workspace message, and agent run tables
- **AND** it does not include repository, artifact, password, or secret tables

#### Scenario: Message completes successfully

- **GIVEN** a persisted workspace session is active
- **WHEN** the user sends a message and Pi returns assistant text
- **THEN** SQL contains a user `WorkspaceMessage`
- **AND** SQL contains an assistant `WorkspaceMessage`
- **AND** SQL contains an `AgentRun` with `status = "completed"`
- **AND** the run stores the selected model id when one is forwarded

#### Scenario: Runtime fails after user message

- **GIVEN** a persisted workspace session is active
- **WHEN** Pi, provider, model selection, or session creation fails after run start
- **THEN** SQL keeps the user `WorkspaceMessage`
- **AND** SQL marks the `AgentRun` as `failed`
- **AND** SQL does not create a fake assistant message

#### Scenario: Client disconnects during a run

- **GIVEN** a persisted run has started
- **WHEN** the AG-UI client disconnects before the run reaches a terminal state
- **THEN** SQL marks the `AgentRun` as `cancelled`
- **AND** a late assistant finish does not overwrite the cancelled terminal state

### Requirement: Warm Session Cache Separation

The system SHALL keep `WarmSessionStore` as a process-local runtime cache and SHALL NOT use it as
the durable source of truth for the sidebar session list.

#### Scenario: Warm session expires

- **GIVEN** a durable workspace session exists in SQLite
- **AND** its corresponding warm Pi session has expired or been disposed
- **WHEN** the user opens the workspace session
- **THEN** the sidebar still shows the session
- **AND** the next message creates or loads a warm runtime session for the stored thread id

### Requirement: Local Server-Scoped User Identity

Every persisted workspace project and workspace session SHALL be scoped by a server-side local
user id.

#### Scenario: Client sends user id

- **GIVEN** a client request includes a user id in body, query, or forwarded properties
- **WHEN** the server handles a workspace/session operation
- **THEN** the server ignores the client-supplied user id
- **AND** uses the server-side local user id instead

### Requirement: CopilotKit Thread Binding

The web workspace SHALL bind the active persisted session to CopilotKit using the existing
`CopilotChat threadId` prop.

#### Scenario: Existing chat still sends

- **GIVEN** a persisted workspace session is active
- **WHEN** the user sends a message through CopilotKit chat
- **THEN** `/api/copilotkit` handles the run
- **AND** `KernelAgent` receives the active session's stable thread id
- **AND** the model selector still forwards the selected model

### Requirement: No First-Slice Replay Claim

The first implementation SHALL NOT claim to restore old SQL transcripts into the CopilotKit UI or
Pi warm session memory.

#### Scenario: Existing session is reopened

- **GIVEN** a previous workspace session is selected
- **WHEN** the chat panel mounts
- **THEN** it uses the session's stable thread id
- **AND** it does not claim old messages are replayed into the UI or Pi runtime unless a later
  transcript hydration or recovery-summary feature has been implemented

### Requirement: Versioned Database Schema

SQLite schema changes SHALL be represented as committed migration files.

#### Scenario: Fresh checkout initializes database

- **GIVEN** a fresh checkout and a configured `DATABASE_URL`
- **WHEN** the developer runs the documented migration command
- **THEN** the SQLite schema is created from committed migrations
- **AND** no manual database setup is required beyond the documented command
