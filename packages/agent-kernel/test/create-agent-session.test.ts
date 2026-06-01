import test from "node:test";
import assert from "node:assert/strict";

import { AuthStorage, ModelRegistry } from "@earendil-works/pi-coding-agent";

import {
  buildAgentSessionOptions,
  createKernelAgentSession,
} from "../src/create-agent-session.js";
import { PRISM_SYSTEM_PROMPT } from "../src/prism-system-prompt.js";
import { createPrismRuntimeContext, createPrismToolDefinitions } from "../src/index.js";

test("buildAgentSessionOptions injects Prism resourceLoader and preserves runtime wiring", async () => {
  const authStorage = AuthStorage.inMemory();
  const modelRegistry = ModelRegistry.inMemory(authStorage);
  const runtimeContext = createPrismRuntimeContext();

  const options = await buildAgentSessionOptions({
    cwd: "/tmp/prism-session-test",
    authStorage,
    modelRegistry,
    runtimeContext,
    thinkingLevel: "off",
  });

  assert.equal(options.cwd, "/tmp/prism-session-test");
  assert.equal(options.authStorage, authStorage);
  assert.equal(options.modelRegistry, modelRegistry);
  assert.equal(options.thinkingLevel, "off");
  assert.equal(options.noTools, "builtin");
  assert.deepEqual(
    options.customTools?.map((tool) => tool.name),
    createPrismToolDefinitions(runtimeContext).map((tool) => tool.name),
  );
  assert.ok(options.resourceLoader, "resourceLoader should be present");
  assert.equal(options.resourceLoader?.getSystemPrompt(), PRISM_SYSTEM_PROMPT);
});

test("buildAgentSessionOptions forwards explicit model unchanged", async () => {
  const authStorage = AuthStorage.inMemory();
  const modelRegistry = ModelRegistry.inMemory(authStorage);
  const fakeModel = { provider: "test", id: "model-x" } as never;

  const options = await buildAgentSessionOptions({
    authStorage,
    modelRegistry,
    model: fakeModel,
  });

  assert.equal(options.model, fakeModel);
  assert.equal(options.noTools, "builtin");
  assert.ok(options.resourceLoader);
});

test("createKernelAgentSession returns a session and runtimeContext using the canonical bootstrap path", async () => {
  const { session, runtimeContext } = await createKernelAgentSession({
    cwd: "/tmp/prism-session-live-test",
  });

  assert.ok(session, "session should be created");
  assert.ok(runtimeContext, "runtimeContext should be created");
  assert.equal(typeof session.prompt, "function");
  assert.equal(typeof session.subscribe, "function");
  assert.equal(typeof session.abort, "function");
  assert.equal(typeof session.dispose, "function");
  // The live session exposes the composed system prompt through its public state.
  const prompt = session.state.systemPrompt;
  assert.equal(typeof prompt, "string");
  assert.match(prompt, /You are Prism, a collaborative financial research manager and intelligence-to-action agent\./);
  assert.match(prompt, /Never invent financial facts\./);
  session.dispose();
});
