import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  configureOpenAiCompatibleProvider,
  createKernelAgentSession,
  type ConfiguredProvider,
  type CreateKernelAgentSessionOptions,
} from "@agentkernel/agent-kernel";
import { FUNDING_BASIS_VERTICAL_PLUGIN } from "@agentkernel/agent-kernel/funding-basis";
import { KernelAgent, WarmSessionStore, type PiSessionLike } from "@agentkernel/agui-bridge";

/**
 * Server-side AgentKernel runtime for the CopilotKit route.
 *
 * By default this runs the generic assistant vertical (no domain tools). Set
 * `AGENTKERNEL_VERTICAL=funding-basis` to load the funding-basis reference vertical — the
 * kernel core stays domain-agnostic; the vertical is injected here at the edge.
 *
 * The WarmSessionStore MUST be a process-level singleton so Pi sessions survive between
 * requests (plan §2.3). This requires a PERSISTENT Node process (`next start` on a
 * container — Railway/Render/Fly — NOT serverless). On a stateless serverless host the
 * module would be re-instantiated per invocation and warm sessions would be lost.
 *
 * We stash the singleton on globalThis so Next.js dev HMR doesn't create duplicates.
 */
declare global {
  // eslint-disable-next-line no-var
  var __agent: KernelAgent | undefined;
}

/** Optionally resolve a vertical from env. Default (unset) = generic assistant. */
function resolveVertical(): CreateKernelAgentSessionOptions["vertical"] | undefined {
  if (process.env.AGENTKERNEL_VERTICAL === "funding-basis") {
    return FUNDING_BASIS_VERTICAL_PLUGIN;
  }
  return undefined;
}

/**
 * Dev convenience: load the repo-root `.env.smoke` (gitignored) so CLOUDAIKEY_* are
 * available without re-entering the key. PRODUCTION should set real env vars (Railway
 * dashboard etc.) — those take precedence and this file-load is skipped if already set.
 */
function loadEnvSmokeOnce(): void {
  if (process.env.__AGENTKERNEL_ENV_SMOKE_LOADED) return;
  process.env.__AGENTKERNEL_ENV_SMOKE_LOADED = "1";
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const candidate = resolve(dir, ".env.smoke");
    if (existsSync(candidate)) {
      for (const line of readFileSync(candidate, "utf8").split("\n")) {
        const t = line.trim();
        if (!t || t.startsWith("#")) continue;
        const eq = t.indexOf("=");
        if (eq === -1) continue;
        const k = t.slice(0, eq).trim();
        let v = t.slice(eq + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        if (!(k in process.env)) process.env[k] = v;
      }
      return;
    }
    const parent = resolve(dir, "..");
    if (parent === dir) return;
    dir = parent;
  }
}

/**
 * Resolve a configured model from env (CLOUDAIKEY_*). Returns null if not configured,
 * in which case Pi falls back to its default model resolution.
 */
function resolveConfiguredProvider(): ConfiguredProvider | null {
  loadEnvSmokeOnce();
  const apiKey = process.env.CLOUDAIKEY_API_KEY;
  if (!apiKey) return null;
  // Two curated choices only: the best Claude + the best OpenAI-family model currently
  // exposed by this endpoint. The first one is the default if the UI does not select.
  return configureOpenAiCompatibleProvider({
    provider: "cloudaikey",
    apiKey,
    modelIds: ["claude-opus-4-7", "gpt-5.5"],
    baseUrl: process.env.CLOUDAIKEY_BASE_URL ?? "https://api.cloudaikey.com/v1",
  });
}

function buildAgent(): KernelAgent {
  // Configure the provider ONCE at startup and reuse it across warm sessions.
  const configured = resolveConfiguredProvider();
  const vertical = resolveVertical();

  const store = new WarmSessionStore(async () => {
    const { session } = await createKernelAgentSession({
      ...(vertical ? { vertical } : {}),
      ...(configured
        ? {
            authStorage: configured.authStorage,
            modelRegistry: configured.modelRegistry,
            model: configured.defaultModel,
          }
        : {}),
    });
    return { session: session as unknown as PiSessionLike };
  });

  return new KernelAgent({
    store,
    // SECURITY: replace with the authenticated server-session user id before multi-user
    // (plan decision #2). A client must never be able to read another user's warm session.
    resolveUserId: () => "local",
    resolveModel: configured?.resolveModel,
  });
}

export const agent: KernelAgent = globalThis.__agent ?? buildAgent();
if (process.env.NODE_ENV !== "production") globalThis.__agent = agent;
