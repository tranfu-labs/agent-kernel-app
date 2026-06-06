# AgentKernel Agent Instructions

This repository is a generic agent development foundation. Keep the default product identity
domain-agnostic and avoid coupling the shared app to any single vertical demo.

## Product Identity

AgentKernel provides:

- a Pi Agent runtime adapter for model, tool, skill, and session mechanics;
- an AG-UI bridge for translating runtime events into UI events;
- a Next.js + CopilotKit web workspace;
- local SQL persistence for workspace projects, sessions, messages, and agent runs;
- deployment-ready app documentation for `agent-kernel-app`.

The default assistant must stay useful for general agent-product development. Do not add
domain-specific wording to the default system prompt, README, app copy, or company handoff docs
unless the user explicitly asks for a vertical-specific product.

## Package Boundaries

```text
apps/web                 # Next.js + CopilotKit workspace and local SQLite persistence
apps/agent-api           # CLI/smoke entrypoints for runtime verification
packages/agent-kernel    # Pi Agent runtime adapter and vertical injection contract
packages/agui-bridge     # Pi event stream to AG-UI translation, no app/database imports
packages/domain          # Generic artifact, source, research, and vertical declaration primitives
packages/storage         # Generic artifact storage helpers
```

Keep host-owned concerns in the host app. For example, Prisma and SQLite belong in
`apps/web`; `packages/agui-bridge` should expose ports/interfaces and remain database-agnostic.

## Runtime Rules

1. The default web runtime should create a generic AgentKernel assistant with no domain plugin.
2. Optional verticals must be injected at the edge, never imported into the kernel core as default behavior.
3. Product users must not receive coding, shell, file-write, or credential-exfiltration tools by default.
4. Real secrets belong only in ignored local env files, CI secrets, or server secret managers.
5. `.env.example` is a template only. Never commit real API keys.
6. Warm Pi sessions require a persistent Node process. Do not claim stateless serverless preserves them.
7. SQLite schema changes must be versioned through committed Prisma migrations.

## Development Workflow

For non-trivial work, inspect the relevant code and docs before editing, then make focused,
reversible changes. Run the nearest cheap verification first, then broader checks before
claiming completion.

Useful commands from the repository root:

```bash
npm run typecheck
npm run test --workspaces --if-present
npm run web:build
npm run smoke:generic
```

For local web viewing, keep the app available at:

```bash
npm run dev -w @agentkernel/web
```

The normal local URL is:

```text
http://localhost:3000
```

## Documentation Rules

Default docs should describe AgentKernel as a reusable agent app/kernel foundation. Keep
vertical-specific history and vocabulary out of user-facing docs, runtime comments, and agent
prompts.

If optional verticals are added later, document them only as isolated extensions outside the
default product path. They must not appear in README quickstart, default env comments, web
runtime comments, or deployment handoff requirements unless the user explicitly asks.
