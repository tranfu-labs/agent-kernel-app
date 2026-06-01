import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { BaseEvent, RunAgentInput } from "@ag-ui/client";

import { KernelAgent, latestUserText } from "../src/kernel-agent.js";
import { WarmSessionStore, type PiSessionLike } from "../src/session-store.js";
import type { PiSessionEvent } from "../src/pi-types.js";

/** A fake Pi session that replays a scripted event sequence when prompt() is called. */
class ScriptedSession implements PiSessionLike {
  isStreaming = false;
  model?: { id?: string } | undefined;
  setModelCalls: unknown[] = [];
  private listener: ((e: unknown) => void) | null = null;
  constructor(private readonly script: PiSessionEvent[]) {}
  subscribe(listener: (event: unknown) => void): () => void {
    this.listener = listener;
    return () => {
      this.listener = null;
    };
  }
  async prompt(): Promise<void> {
    this.isStreaming = true;
    for (const e of this.script) this.listener?.(e);
    this.isStreaming = false;
  }
  async abort(): Promise<void> {
    this.isStreaming = false;
  }
  async setModel(model: unknown): Promise<void> {
    this.setModelCalls.push(model);
    this.model = model as { id?: string };
  }
  dispose(): void {}
}

function makeInput(text: string): RunAgentInput {
  return {
    threadId: "th_1",
    runId: "run_1",
    state: {},
    messages: [{ id: "u1", role: "user", content: text }],
    tools: [],
    context: [],
    forwardedProps: {},
  } as unknown as RunAgentInput;
}

/** Subscribe to the agent's Observable and resolve the full BaseEvent list on complete. */
function collect(agent: KernelAgent, input: RunAgentInput): Promise<BaseEvent[]> {
  return new Promise((resolve, reject) => {
    const out: BaseEvent[] = [];
    agent.run(input).subscribe({
      next: (e) => out.push(e),
      error: reject,
      complete: () => resolve(out),
    });
  });
}

const PLAIN_TEXT_RUN: PiSessionEvent[] = [
  { type: "agent_start" },
  { type: "message_start", message: {} },
  { type: "message_update", message: {}, assistantMessageEvent: { type: "text_start", contentIndex: 0, partial: { role: "assistant", content: [{ type: "text", text: "" }] } } },
  { type: "message_update", message: {}, assistantMessageEvent: { type: "text_delta", contentIndex: 0, delta: "Found ", partial: { role: "assistant", content: [{ type: "text", text: "Found " }] } } },
  { type: "message_update", message: {}, assistantMessageEvent: { type: "text_delta", contentIndex: 0, delta: "2 opportunities", partial: { role: "assistant", content: [{ type: "text", text: "Found 2 opportunities" }] } } },
  { type: "message_update", message: {}, assistantMessageEvent: { type: "text_end", contentIndex: 0, content: "Found 2 opportunities", partial: { role: "assistant", content: [{ type: "text", text: "Found 2 opportunities" }] } } },
  { type: "agent_end", willRetry: false },
];

describe("KernelAgent.run", () => {
  it("drives a warm session and yields a balanced AG-UI BaseEvent stream", async () => {
    const session = new ScriptedSession(PLAIN_TEXT_RUN);
    const store = new WarmSessionStore(async () => ({ session }), { sweepMs: 0 });
    const agent = new KernelAgent({ store });

    const events = await collect(agent, makeInput("find BTC funding arb"));
    assert.deepEqual(
      events.map((e) => e.type),
      ["RUN_STARTED", "TEXT_MESSAGE_START", "TEXT_MESSAGE_CONTENT", "TEXT_MESSAGE_CONTENT", "TEXT_MESSAGE_END", "RUN_FINISHED"],
    );
  });

  it("reuses the same warm session across two runs on the same thread", async () => {
    let factoryCalls = 0;
    const store = new WarmSessionStore(
      async () => {
        factoryCalls++;
        return { session: new ScriptedSession(PLAIN_TEXT_RUN) };
      },
      { sweepMs: 0 },
    );
    const agent = new KernelAgent({ store });
    await collect(agent, makeInput("first"));
    await collect(agent, makeInput("second"));
    assert.equal(factoryCalls, 1); // warm session reused, not recreated
  });

  it("emits RUN_ERROR(NO_INPUT) when there is no user message", async () => {
    const store = new WarmSessionStore(async () => ({ session: new ScriptedSession([]) }), { sweepMs: 0 });
    const agent = new KernelAgent({ store });
    const input = { ...makeInput("x"), messages: [] } as unknown as RunAgentInput;
    const events = await collect(agent, input);
    const err = events.find((e) => e.type === "RUN_ERROR") as { code?: string } | undefined;
    assert.ok(err, "should emit RUN_ERROR");
    assert.equal((err as { code?: string }).code, "NO_INPUT");
  });

  it("rejects a concurrent run on a streaming session with BUSY", async () => {
    const session = new ScriptedSession(PLAIN_TEXT_RUN);
    session.isStreaming = true; // simulate an in-flight run
    const store = new WarmSessionStore(async () => ({ session }), { sweepMs: 0 });
    const agent = new KernelAgent({ store });
    const events = await collect(agent, makeInput("overlapping"));
    const err = events.find((e) => e.type === "RUN_ERROR") as { code?: string } | undefined;
    assert.equal(err?.code, "BUSY");
  });

  it("switches the warm Pi session model from input.forwardedProps.model when provided", async () => {
    const session = new ScriptedSession(PLAIN_TEXT_RUN);
    session.model = { id: "claude-opus-4-7" };
    const wanted = { id: "gpt-5.5" };
    const store = new WarmSessionStore(async () => ({ session }), { sweepMs: 0 });
    const agent = new KernelAgent({
      store,
      resolveModel: (id) => (id === "gpt-5.5" ? wanted : undefined),
    });
    const input = makeInput("hi");
    (input as unknown as { forwardedProps?: Record<string, unknown> }).forwardedProps = { model: "gpt-5.5" };
    const events = await collect(agent, input);
    assert.equal(events.at(-1)!.type, "RUN_FINISHED");
    assert.equal(session.setModelCalls.length, 1);
    assert.equal(session.model?.id, "gpt-5.5");
  });

  it("clone() preserves store + resolveUserId (CopilotKit clones the agent per request)", async () => {
    const created: string[] = [];
    const store = new WarmSessionStore(
      async (key) => {
        created.push(`${key.userId}::${key.threadId}`);
        return { session: new ScriptedSession(PLAIN_TEXT_RUN) };
      },
      { sweepMs: 0 },
    );
    const agent = new KernelAgent({ store, resolveUserId: () => "alice" });
    const cloned = agent.clone();
    assert.ok(cloned instanceof KernelAgent);
    // Running the CLONE must still work and use the preserved resolveUserId/store.
    const events = await collect(cloned, makeInput("hi"));
    assert.equal(events.at(-1)!.type, "RUN_FINISHED");
    assert.deepEqual(created, ["alice::th_1"]);
  });
});

describe("latestUserText", () => {
  it("returns the last user message content", () => {
    assert.equal(
      latestUserText([
        { role: "user", content: "first" },
        { role: "assistant", content: "..." },
        { role: "user", content: "second" },
      ] as never),
      "second",
    );
  });
  it("returns null when the newest message is a tool result (HITL resume — handled elsewhere)", () => {
    assert.equal(latestUserText([{ role: "user", content: "q" }, { role: "tool", content: "result" }] as never), "q");
    assert.equal(latestUserText([{ role: "tool", content: "result" }] as never), null);
  });
  it("returns null for empty history", () => {
    assert.equal(latestUserText([]), null);
    assert.equal(latestUserText(undefined), null);
  });
});

describe("KernelAgent default identity (T8)", () => {
  it("defaults to a generic, domain-free description", () => {
    const store = new WarmSessionStore(async () => ({ session: new ScriptedSession([]) }));
    const agent = new KernelAgent({ store });
    assert.ok(!/prism/i.test(agent.description), "default description must not name Prism");
    assert.ok(!/financial/i.test(agent.description), "default description must not be financial");
    assert.match(agent.description, /AgentKernel/);
  });
});
