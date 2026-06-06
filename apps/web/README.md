# AgentKernel Web

AgentKernel Web is the default Next.js + CopilotKit workspace for the generic AgentKernel
runtime.

## Current Shape

The app currently provides:

- a workspace sidebar for projects and sessions;
- a CopilotKit-powered conversation surface;
- a compact composer with model selection;
- SQLite-backed session, message, and run persistence;
- a server-side AgentKernel runtime bridge.

## Local Development

```bash
npm run dev -w @agentkernel/web
```

Default URL:

```text
http://localhost:3000
```

Use the repository-root `.env.smoke` file for local provider keys. Do not commit real secrets.
