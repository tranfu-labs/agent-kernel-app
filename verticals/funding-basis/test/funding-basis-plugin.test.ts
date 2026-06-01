import test from "node:test";
import assert from "node:assert/strict";

import { AuthStorage, ModelRegistry } from "@earendil-works/pi-coding-agent";
import { buildAgentSessionOptions, createKernelAgentSession } from "@agentkernel/agent-kernel";

import { FUNDING_BASIS_VERTICAL_PLUGIN } from "../src/index.js";
import { PRISM_SYSTEM_PROMPT } from "../src/prism-system-prompt.js";
import { createPrismRuntimeContext } from "../src/prism-runtime-context.js";
import { createPrismToolDefinitions } from "../src/register-prism-tools.js";

test("T5: FUNDING_BASIS_VERTICAL_PLUGIN reproduces the funding tool set and identity", async () => {
  const authStorage = AuthStorage.inMemory();
  const modelRegistry = ModelRegistry.inMemory(authStorage);

  const options = await buildAgentSessionOptions({
    authStorage,
    modelRegistry,
    vertical: FUNDING_BASIS_VERTICAL_PLUGIN,
  });

  assert.equal(options.resourceLoader?.getSystemPrompt(), PRISM_SYSTEM_PROMPT);
  assert.deepEqual(
    options.customTools?.map((tool) => tool.name).sort(),
    createPrismToolDefinitions(createPrismRuntimeContext()).map((tool) => tool.name).sort(),
  );
});

test("the funding vertical injects the funding identity into a live session", async () => {
  assert.equal(FUNDING_BASIS_VERTICAL_PLUGIN.id, "funding_basis");
  const { session } = await createKernelAgentSession({
    cwd: "/tmp/agentkernel-funding-live-test",
    vertical: FUNDING_BASIS_VERTICAL_PLUGIN,
  });
  assert.match(session.state.systemPrompt, /You are Prism, a collaborative financial research manager/);
  session.dispose();
});
