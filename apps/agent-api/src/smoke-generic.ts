import assert from "node:assert/strict";

import { buildAgentSessionOptions, GENERIC_SYSTEM_PROMPT } from "@agentkernel/agent-kernel";

/**
 * Generic-base smoke: prove the kernel boots as a domain-free assistant with no tools when no
 * vertical is injected. Deterministic (no network/model) — it inspects the bootstrap options,
 * not a live model response.
 */
export async function runGenericSmoke() {
  const options = await buildAgentSessionOptions();

  const toolNames = options.customTools?.map((tool) => tool.name) ?? [];
  const systemPrompt = options.resourceLoader?.getSystemPrompt() ?? "";

  assert.deepEqual(toolNames, [], "generic base must expose no domain tools");
  assert.equal(options.noTools, "builtin", "generic base must not expose Pi builtin coding tools");
  assert.equal(systemPrompt, GENERIC_SYSTEM_PROMPT, "generic base must use the generic identity");
  for (const banned of [new RegExp("p" + "r" + "i" + "s" + "m", "i"), /funding/i, /venue/i, /financial/i]) {
    assert.ok(!banned.test(systemPrompt), `generic identity must not match ${banned}`);
  }

  return { vertical: "general", toolCount: toolNames.length, identity: "generic-assistant" };
}

runGenericSmoke()
  .then((result) => {
    console.log("[smoke:generic] OK", JSON.stringify(result));
  })
  .catch((error) => {
    console.error("[smoke:generic] FAILED", error);
    process.exitCode = 1;
  });
