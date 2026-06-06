import test from "node:test";
import assert from "node:assert/strict";

import { AuthStorage, ModelRegistry, type ToolDefinition } from "@earendil-works/pi-coding-agent";

import {
  buildAgentSessionOptions,
  createKernelAgentSession,
} from "../src/create-agent-session.js";
import { GENERIC_SYSTEM_PROMPT } from "../src/system-prompt.js";
import { createKernelRuntimeContext, type KernelVertical } from "../src/vertical.js";

const bannedDomainPatterns = [
  "p" + "r" + "i" + "s" + "m",
  "fun" + "ding",
  "ven" + "ue",
  "fin" + "ancial",
  "tr" + "ade",
  "ar" + "bitrage",
].map((word) => new RegExp(word, "i"));

// A trivial stub tool so injection tests stay domain-free.
const stubTool = { name: "stub_tool" } as unknown as ToolDefinition;

test("T1: default session is the generic assistant — no tools, generic identity", async () => {
  const authStorage = AuthStorage.inMemory();
  const modelRegistry = ModelRegistry.inMemory(authStorage);

  const options = await buildAgentSessionOptions({
    cwd: "/tmp/agentkernel-session-test",
    authStorage,
    modelRegistry,
    thinkingLevel: "off",
  });

  assert.equal(options.noTools, "builtin");
  assert.deepEqual(options.customTools, []);
  assert.equal(options.resourceLoader?.getSystemPrompt(), GENERIC_SYSTEM_PROMPT);
});

test("T2: generic system prompt carries no domain vocabulary", () => {
  for (const banned of bannedDomainPatterns) {
    assert.ok(!banned.test(GENERIC_SYSTEM_PROMPT), `GENERIC_SYSTEM_PROMPT must not match ${banned}`);
  }
});

test("T3: an injected vertical drives the system prompt and tools", async () => {
  const authStorage = AuthStorage.inMemory();
  const modelRegistry = ModelRegistry.inMemory(authStorage);
  const stub: KernelVertical = {
    id: "stub",
    systemPrompt: "STUB IDENTITY PROMPT",
    createTools: () => [stubTool],
  };

  const options = await buildAgentSessionOptions({ authStorage, modelRegistry, vertical: stub });

  assert.equal(options.resourceLoader?.getSystemPrompt(), "STUB IDENTITY PROMPT");
  assert.deepEqual(options.customTools, [stubTool]);
  assert.equal(options.noTools, "builtin");
});

test("T4: a vertical's createRuntimeContext is used to build its tools", async () => {
  const authStorage = AuthStorage.inMemory();
  const modelRegistry = ModelRegistry.inMemory(authStorage);
  let seen: unknown;
  const vertical: KernelVertical = {
    id: "ctx-probe",
    systemPrompt: "p",
    createRuntimeContext: () => {
      const ctx = createKernelRuntimeContext();
      (ctx as { marker?: string }).marker = "from-vertical";
      return ctx;
    },
    createTools: (ctx) => {
      seen = (ctx as { marker?: string }).marker;
      return [];
    },
  };

  await buildAgentSessionOptions({ authStorage, modelRegistry, vertical });
  assert.equal(seen, "from-vertical");
});

test("buildAgentSessionOptions forwards explicit model unchanged", async () => {
  const authStorage = AuthStorage.inMemory();
  const modelRegistry = ModelRegistry.inMemory(authStorage);
  const fakeModel = { provider: "test", id: "model-x" } as never;

  const options = await buildAgentSessionOptions({ authStorage, modelRegistry, model: fakeModel });

  assert.equal(options.model, fakeModel);
  assert.equal(options.noTools, "builtin");
  assert.ok(options.resourceLoader);
});

test("createKernelAgentSession default session uses the generic identity", async () => {
  const { session, runtimeContext } = await createKernelAgentSession({
    cwd: "/tmp/agentkernel-session-live-test",
  });

  assert.ok(session, "session should be created");
  assert.ok(runtimeContext, "runtimeContext should be created");
  assert.equal(typeof session.prompt, "function");
  assert.ok(
    session.state.systemPrompt.startsWith(GENERIC_SYSTEM_PROMPT),
    "live system prompt should begin with the generic identity",
  );
  assert.ok(!new RegExp("p" + "r" + "i" + "s" + "m", "i").test(session.state.systemPrompt));
  assert.ok(!bannedDomainPatterns[1]?.test(session.state.systemPrompt));
  session.dispose();
});
