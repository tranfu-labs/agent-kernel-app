/** Diagnostic: dump RAW Pi session events to see what the real run produces. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { AuthStorage, ModelRegistry } from "@earendil-works/pi-coding-agent";
import { createKernelAgentSession } from "@agentkernel/agent-kernel";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");

// ---- intercept fetch to see Pi's outbound provider calls (no auth header printed) ----
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: any, init: any) => {
  const url = typeof input === "string" ? input : input?.url ?? String(input);
  const method = init?.method ?? "GET";
  if (String(url).includes("cloudaikey")) {
    let bodyPeek = "";
    try {
      const b = init?.body;
      if (typeof b === "string") bodyPeek = b.slice(0, 200);
    } catch {}
    console.log(`  →FETCH ${method} ${url}  body=${bodyPeek}`);
  }
  try {
    const res = await realFetch(input, init);
    if (String(url).includes("cloudaikey")) console.log(`  ←RESP ${res.status} ${res.statusText} (${url})`);
    return res;
  } catch (err) {
    if (String(url).includes("cloudaikey")) console.log(`  ←FETCH ERROR ${err instanceof Error ? err.message : err} (${url})`);
    throw err;
  }
}) as typeof fetch;

function loadEnv(p: string): void {
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
}

async function main(): Promise<void> {
  loadEnv(resolve(repoRoot, ".env.smoke"));
  const apiKey = process.env.CLOUDAIKEY_API_KEY!;
  const modelId = process.env.CLOUDAIKEY_MODEL!;
  const baseUrl = process.env.CLOUDAIKEY_BASE_URL ?? "https://api.cloudaikey.com/v1";

  const authStorage = AuthStorage.create();
  authStorage.setRuntimeApiKey("cloudaikey", apiKey);
  const modelRegistry = ModelRegistry.create(authStorage);
  modelRegistry.registerProvider("cloudaikey", {
    baseUrl,
    api: "openai-completions" as never,
    apiKey,
    authHeader: true,
    models: [{ id: modelId, name: modelId, reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128_000, maxTokens: 8_192 }],
  });
  const model = modelRegistry.find("cloudaikey", modelId)!;

  const { session } = await createKernelAgentSession({ authStorage, modelRegistry, model });

  const seen: string[] = [];
  session.subscribe((e: any) => {
    seen.push(e.type);
    if (e.type === "message_update") {
      const a = e.assistantMessageEvent;
      console.log(`  message_update -> ${a?.type}${a?.delta ? " delta=" + JSON.stringify(a.delta.slice(0, 60)) : ""}${a?.type === "error" ? " ERROR=" + JSON.stringify(a.error)?.slice(0, 300) : ""}`);
    } else if (e.type === "message_end" || e.type === "turn_end") {
      const m = e.message;
      console.log(`  ${e.type} -> role=${m?.role} stopReason=${m?.stopReason} errMsg=${JSON.stringify(m?.errorMessage)?.slice(0, 120)}`);
    } else if (e.type === "tool_execution_start") {
      console.log(`  tool_execution_start -> ${e.toolName} args=${JSON.stringify(e.args)?.slice(0, 120)}`);
    } else if (e.type === "tool_execution_end") {
      console.log(`  tool_execution_end -> ${e.toolName} isError=${e.isError} result=${JSON.stringify(e.result)?.slice(0, 200)}`);
    } else if (e.type === "agent_end") {
      const msgs = e.messages ?? [];
      const last = msgs[msgs.length - 1];
      console.log(`  agent_end willRetry=${e.willRetry} messages=${msgs.length} lastRole=${last?.role} lastStop=${last?.stopReason} lastErr=${JSON.stringify(last?.errorMessage)?.slice(0, 120)}`);
    } else {
      console.log(`  «${e.type}»`);
    }
  });

  try {
    await session.prompt(process.env.SMOKE_PROMPT ?? "用五个字向 AgentKernel 打个招呼");
  } catch (err) {
    console.log("  prompt threw:", err instanceof Error ? err.message : err);
  }

  console.log("\n--- final messages (full internals) ---");
  for (const m of (session as any).messages ?? []) {
    if (m.role === "assistant") {
      console.log(`  [assistant] stopReason=${m.stopReason} errorMessage=${JSON.stringify(m.errorMessage)} contentLen=${(m.content ?? []).length}`);
      console.log(`     content=${JSON.stringify(m.content)?.slice(0, 300)}`);
      console.log(`     usage=${JSON.stringify(m.usage)} diagnostics=${JSON.stringify(m.diagnostics)?.slice(0, 400)}`);
    } else {
      const content = Array.isArray(m.content)
        ? m.content.map((c: any) => `${c.type}:${(c.text ?? c.name ?? "").toString().slice(0, 80)}`).join(" | ")
        : JSON.stringify(m).slice(0, 150);
      console.log(`  [${m.role}] ${content}`);
    }
  }
  console.log("\nevent sequence:", seen.join(" "));
  process.exit(0);
}

main().catch((e) => {
  console.error("crashed:", e);
  process.exit(1);
});
