Review the AgentKernel foundation.

Check:

1. Pi runtime concerns stay inside `packages/agent-kernel`.
2. AG-UI translation stays inside `packages/agui-bridge` without app/database imports.
3. SQLite and Prisma persistence stay inside `apps/web`.
4. The default assistant prompt and web runtime remain domain-agnostic.
5. Product-specific tools or skills are injected explicitly and are not loaded by default.
6. Secrets are represented by templates only and are not printed or committed.
7. Docs remain aligned with code and deployment commands.

Return concrete issues and recommended next small commits.
