import { CopilotRuntime, createCopilotRuntimeHandler } from "@copilotkit/runtime/v2";

import { agent } from "../../../lib/agent-runtime";

// In-process topology (plan §3): register the Prism agent directly — no network HttpAgent,
// no separate agent-api service. CopilotRuntime stays as the server-side trust boundary.
// Requires a persistent Node process (`next start`), since the agent holds warm Pi sessions.
const runtime = new CopilotRuntime({
  agents: {
    default: agent,
  },
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
  // The v2 react-core client posts to the base path; serve everything from one endpoint
  // via the JSON envelope instead of multi-route (POST /agent/:id/run, GET /info, …).
  mode: "single-route",
  cors: true,
});

export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;
