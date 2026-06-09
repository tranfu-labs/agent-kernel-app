# AgentKernel

A reusable foundation for building **agent-native applications**. AgentKernel combines a
Pi Agent runtime adapter, an AG-UI bridge, a CopilotKit web workspace, and local SQL-backed
conversation persistence so teams can build new agent products without starting from scratch.

## What's In Here

| Layer | Packages | Role |
|---|---|---|
| Agent runtime | `packages/agent-kernel` | Pi Agent session wrapper, provider setup, model selection, and vertical injection contract |
| Agent to UI bridge | `packages/agui-bridge` | Pi event stream to AG-UI protocol translation with a persistence port |
| Web workspace | `apps/web` | Next.js + CopilotKit app with project/session sidebar and chat surface |
| Local persistence | `apps/web/prisma`, `apps/web/lib/db` | SQLite + Prisma schema, migrations, session/message/run storage |
| API and smoke checks | `apps/agent-api` | Runtime smoke entrypoints used during development and deployment checks |
| Generic primitives | `packages/domain`, `packages/storage` | Artifact and plugin primitives shared by optional verticals |

## Architecture

```text
Pi Agent runtime
      |
packages/agent-kernel
      |
packages/agui-bridge  ---- persistence port ---- apps/web/lib/db
      |
apps/web CopilotKit workspace
      |
SQLite through Prisma
```

The default web runtime starts a generic AgentKernel assistant with no domain-specific plugin.
Optional verticals can be injected by host applications, but they must not define the default
identity of this repository.

## Quickstart

```bash
npm ci
cp .env.example .env.smoke
npm run db:generate
npm run db:migrate
npm run dev -w @agentkernel/web
```

Open:

```text
http://localhost:3000
```

Fill `.env.smoke` with local AI provider values before testing real model responses. The file
is gitignored and must never be committed.

## Verification

Useful local checks:

```bash
npm run typecheck
npm run test --workspaces --if-present
npm run web:build
npm run smoke:generic
```

SQLite and Prisma commands:

```bash
npm run db:generate
npm run db:migrate
npm run db:deploy
npm run db:studio
```

## Deployment

Company handoff and deployment preparation live in:

- [`docs/deployment/agent-kernel-app-company-handoff.md`](docs/deployment/agent-kernel-app-company-handoff.md)

The deployable product name is:

```text
agent-kernel-app
```

For local secret setup:

```bash
cp .env.example .env.smoke
```

For production, configure the same variables in CI and the server secret manager. Do not commit
real API keys.

## Environment Template

Tracked template:

```text
.env.example
```

Local ignored file:

```text
.env.smoke
```

Required for model-backed local runs:

```bash
CLOUDAIKEY_API_KEY=
CLOUDAIKEY_BASE_URL=https://api.cloudaikey.com/v1
DATABASE_URL=file:../data/agent-kernel-dev.db
```

## Coolify Deployment

This repository includes a Coolify-oriented `compose.yml` and `Dockerfile`.

- Configure the Coolify domain on service `web` with internal port `3000`, for example `https://agent-kernel-app.tranfu.com:3000`.
- The web service uses `expose: "3000"` and does not bind a public host port.
- SQLite data is persisted in the `agentkernel-web-data` volume at `/app/apps/web/data`.
- Container startup runs Prisma migrations before `next start`.

Recommended production environment:

```bash
CLOUDAIKEY_API_KEY=
CLOUDAIKEY_BASE_URL=https://api.cloudaikey.com/v1
DATABASE_URL=file:../data/agent-kernel-prod.db
PORT=3000
HOSTNAME=0.0.0.0
COPILOTKIT_TELEMETRY_DISABLED=1
IMAGE_MINIMAX_BASE_URL=https://api.minimaxi.com
IMAGE_GROK_API_KEY=
IMAGE_GROK_BASE_URL=
```

## Notes For New Products

Use this repository as a starting point for agent applications that need:

- persistent conversation sessions;
- model/provider configuration;
- CopilotKit chat UI;
- AG-UI streaming events;
- local SQLite data storage;
- a deployable Next.js app structure.

Keep product-specific prompts, tools, and documents in explicit vertical or app-specific
folders. The AgentKernel default path should remain general.

## License

MIT (c) 2026 tranfu-labs. See [LICENSE](./LICENSE).
