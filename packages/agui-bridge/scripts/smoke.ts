/**
 * Live smoke test: REAL Pi session (via a custom OpenAI-compatible provider) → KernelAgent
 * → AG-UI event stream. Verifies the whole bridge against a real LLM, no browser needed.
 *
 * Secrets: read ONLY from a gitignored `.env.smoke` at the repo root. Nothing is printed.
 *
 * Run:  node --import tsx packages/agui-bridge/scripts/smoke.ts
 *
 * Required keys in .env.smoke:
 *   CLOUDAIKEY_API_KEY=...        your key (never committed, never printed)
 *   CLOUDAIKEY_MODEL=...          the model id the endpoint serves (e.g. gpt-4o-mini)
 * Optional:
 *   CLOUDAIKEY_BASE_URL=https://api.cloudaikey.com/v1   (default)
 *   CLOUDAIKEY_API=openai-completions                   (default)
 *   SMOKE_PROMPT="Say hello in exactly five words."      (default)
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { SessionManager, createAgentSession } from "@earendil-works/pi-coding-agent";
import { configureOpenAiCompatibleProvider, createKernelAgentSession } from "@agentkernel/agent-kernel";
import { KernelAgent, WarmSessionStore, type PiSessionLike } from "@agentkernel/agui-bridge";
import type { RunAgentInput } from "@ag-ui/client";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");

function loadEnvFile(path: string): void {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    console.error(`\n✗ Missing ${path}\n  Create it (it is gitignored) with at least:\n    CLOUDAIKEY_API_KEY=...\n    CLOUDAIKEY_MODEL=...\n`);
    process.exit(1);
  }
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
}

function makeInput(text: string): RunAgentInput {
  return {
    threadId: "smoke-thread",
    runId: "smoke-run-1",
    state: {},
    messages: [{ id: "u1", role: "user", content: text }],
    tools: [],
    context: [],
    forwardedProps: {},
  } as unknown as RunAgentInput;
}

async function main(): Promise<void> {
  loadEnvFile(resolve(repoRoot, ".env.smoke"));

  const apiKey = process.env.CLOUDAIKEY_API_KEY;
  const modelId = process.env.CLOUDAIKEY_MODEL;
  const baseUrl = process.env.CLOUDAIKEY_BASE_URL ?? "https://api.cloudaikey.com/v1";
  const prompt = process.env.SMOKE_PROMPT ?? "Say hello to AgentKernel in exactly five words.";

  if (!apiKey || !modelId) {
    console.error("✗ .env.smoke must set CLOUDAIKEY_API_KEY and CLOUDAIKEY_MODEL");
    process.exit(1);
  }
  console.log(`• provider=cloudaikey  baseUrl=${baseUrl}  model=${modelId}  (key hidden, len=${apiKey.length})`);

  // Register the custom OpenAI-compatible provider at runtime via the shared helper
  // (same code path the web runtime uses). The key lives only in memory — never written
  // to models.json, never printed.
  const { authStorage, modelRegistry, defaultModel: model } = configureOpenAiCompatibleProvider({
    provider: "cloudaikey",
    apiKey,
    modelIds: [modelId],
    baseUrl,
  });

  // Real AgentKernel factory with the cloudaikey model injected.
  // SMOKE_MINIMAL=1 uses a bare Pi session with no tools to verify the streaming bridge
  // in isolation.
  const minimal = process.env.SMOKE_MINIMAL === "1";
  const store = new WarmSessionStore(
    async () => {
      if (minimal) {
        const { session } = await createAgentSession({
          authStorage,
          modelRegistry,
          model,
          sessionManager: SessionManager.inMemory(),
          noTools: "all",
        });
        return { session: session as unknown as PiSessionLike };
      }
      const { session } = await createKernelAgentSession({ authStorage, modelRegistry, model });
      return { session: session as unknown as PiSessionLike };
    },
    { sweepMs: 0 },
  );
  const agent = new KernelAgent({ store });
  console.log(`• mode: ${minimal ? "MINIMAL (no tools)" : "GENERIC AGENTKERNEL"}`);

  console.log(`• prompt: ${JSON.stringify(prompt)}\n• streaming AG-UI events:\n`);

  let textOut = "";
  const counts: Record<string, number> = {};
  await new Promise<void>((resolveDone, reject) => {
    const timeout = setTimeout(() => reject(new Error("timed out after 90s")), 90_000);
    agent.run(makeInput(prompt)).subscribe({
      next: (e: { type: string; delta?: string; message?: string; code?: string }) => {
        counts[e.type] = (counts[e.type] ?? 0) + 1;
        if (e.type === "TEXT_MESSAGE_CONTENT" && e.delta) {
          textOut += e.delta;
          process.stdout.write(e.delta);
        } else if (e.type === "RUN_ERROR") {
          console.log(`  [RUN_ERROR ${e.code ?? ""}] ${e.message ?? ""}`);
        } else {
          console.log(`  «${e.type}»`);
        }
      },
      error: (err) => {
        clearTimeout(timeout);
        reject(err);
      },
      complete: () => {
        clearTimeout(timeout);
        resolveDone();
      },
    });
  });

  console.log(`\n\n• event counts: ${JSON.stringify(counts)}`);
  const ok = counts.RUN_STARTED > 0 && counts.RUN_FINISHED > 0 && textOut.length > 0 && !counts.RUN_ERROR;
  console.log(ok ? "\n✓ SMOKE PASSED — real tokens streamed through Pi → AG-UI bridge." : "\n✗ SMOKE FAILED — see events above.");
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error("\n✗ smoke crashed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
