import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { PiToAguiTranslator, serializeToolResult } from "../src/pi-to-agui-translator.js";
import type { AguiEvent } from "../src/agui-events.js";
import type { PiSessionEvent, PiToolCall } from "../src/pi-types.js";

/** Build a translator that records every emitted AG-UI event. */
function makeRecorder(opts?: { emitReasoning?: boolean }) {
  const events: AguiEvent[] = [];
  const t = new PiToAguiTranslator((e) => events.push(e), {
    threadId: "th_1",
    runId: "run_1",
    emitReasoning: opts?.emitReasoning,
    generateMessageId: (n) => `m${n}`, // deterministic
  });
  return { t, events };
}

const types = (events: AguiEvent[]) => events.map((e) => e.type);

// Helper: a partial assistant message whose content[index] is a text block.
function textPartial(index: number, text: string) {
  const content: unknown[] = [];
  content[index] = { type: "text", text };
  return { role: "assistant" as const, content: content as never };
}

// Helper: a partial assistant message whose content[index] is a (streaming) tool call.
function toolPartial(index: number, tc: PiToolCall) {
  const content: unknown[] = [];
  content[index] = tc;
  return { role: "assistant" as const, content: content as never };
}

describe("PiToAguiTranslator — plain text turn", () => {
  it("maps a streamed text answer to a balanced AG-UI sequence", () => {
    const { t, events } = makeRecorder();
    const stream: PiSessionEvent[] = [
      { type: "agent_start" },
      { type: "message_start", message: {} },
      { type: "message_update", message: {}, assistantMessageEvent: { type: "text_start", contentIndex: 0, partial: textPartial(0, "") } },
      { type: "message_update", message: {}, assistantMessageEvent: { type: "text_delta", contentIndex: 0, delta: "Hello", partial: textPartial(0, "Hello") } },
      { type: "message_update", message: {}, assistantMessageEvent: { type: "text_delta", contentIndex: 0, delta: " world", partial: textPartial(0, "Hello world") } },
      { type: "message_update", message: {}, assistantMessageEvent: { type: "text_end", contentIndex: 0, content: "Hello world", partial: textPartial(0, "Hello world") } },
      { type: "agent_end", willRetry: false },
    ];
    for (const e of stream) t.onPiEvent(e);

    assert.deepEqual(types(events), [
      "RUN_STARTED",
      "TEXT_MESSAGE_START",
      "TEXT_MESSAGE_CONTENT",
      "TEXT_MESSAGE_CONTENT",
      "TEXT_MESSAGE_END",
      "RUN_FINISHED",
    ]);
    const start = events[1] as Extract<AguiEvent, { type: "TEXT_MESSAGE_START" }>;
    const c1 = events[2] as Extract<AguiEvent, { type: "TEXT_MESSAGE_CONTENT" }>;
    assert.equal(start.messageId, "m1-0");
    assert.equal(c1.messageId, "m1-0");
    assert.equal(c1.delta, "Hello");
  });
});

describe("PiToAguiTranslator — tool call with streamed args", () => {
  it("maps toolcall_start/delta/end + execution result to TOOL_CALL_* + RESULT", () => {
    const { t, events } = makeRecorder();
    const tc: PiToolCall = { type: "toolCall", id: "tc_1", name: "get_opportunity", arguments: { symbol: "BTC" } };
    const stream: PiSessionEvent[] = [
      { type: "agent_start" },
      { type: "message_start", message: {} },
      { type: "message_update", message: {}, assistantMessageEvent: { type: "toolcall_start", contentIndex: 0, partial: toolPartial(0, { ...tc, arguments: {} }) } },
      { type: "message_update", message: {}, assistantMessageEvent: { type: "toolcall_delta", contentIndex: 0, delta: '{"symbol":', partial: toolPartial(0, { ...tc, arguments: {} }) } },
      { type: "message_update", message: {}, assistantMessageEvent: { type: "toolcall_delta", contentIndex: 0, delta: '"BTC"}', partial: toolPartial(0, tc) } },
      { type: "message_update", message: {}, assistantMessageEvent: { type: "toolcall_end", contentIndex: 0, toolCall: tc, partial: toolPartial(0, tc) } },
      { type: "tool_execution_start", toolCallId: "tc_1", toolName: "get_opportunity", args: { symbol: "BTC" } },
      { type: "tool_execution_end", toolCallId: "tc_1", toolName: "get_opportunity", result: { content: [{ type: "text", text: "edge=12bps" }] }, isError: false },
      { type: "agent_end", willRetry: false },
    ];
    for (const e of stream) t.onPiEvent(e);

    assert.deepEqual(types(events), [
      "RUN_STARTED",
      "TOOL_CALL_START",
      "TOOL_CALL_ARGS",
      "TOOL_CALL_ARGS",
      "TOOL_CALL_END",
      "TOOL_CALL_RESULT",
      "RUN_FINISHED",
    ]);
    const callStart = events[1] as Extract<AguiEvent, { type: "TOOL_CALL_START" }>;
    assert.equal(callStart.toolCallId, "tc_1");
    assert.equal(callStart.toolCallName, "get_opportunity");
    assert.equal(callStart.parentMessageId, "m1");
    const result = events[5] as Extract<AguiEvent, { type: "TOOL_CALL_RESULT" }>;
    assert.equal(result.toolCallId, "tc_1");
    assert.equal(result.content, "edge=12bps");
  });
});

describe("PiToAguiTranslator — tool call WITHOUT streamed args", () => {
  it("emits full args once at toolcall_end when no deltas were seen", () => {
    const { t, events } = makeRecorder();
    const tc: PiToolCall = { type: "toolCall", id: "tc_9", name: "scan", arguments: { venues: ["binance", "bitget"] } };
    const stream: PiSessionEvent[] = [
      { type: "agent_start" },
      { type: "message_start", message: {} },
      { type: "message_update", message: {}, assistantMessageEvent: { type: "toolcall_start", contentIndex: 0, partial: toolPartial(0, tc) } },
      { type: "message_update", message: {}, assistantMessageEvent: { type: "toolcall_end", contentIndex: 0, toolCall: tc, partial: toolPartial(0, tc) } },
      { type: "agent_end", willRetry: false },
    ];
    for (const e of stream) t.onPiEvent(e);

    assert.deepEqual(types(events), ["RUN_STARTED", "TOOL_CALL_START", "TOOL_CALL_ARGS", "TOOL_CALL_END", "RUN_FINISHED"]);
    const args = events[2] as Extract<AguiEvent, { type: "TOOL_CALL_ARGS" }>;
    assert.equal(args.delta, JSON.stringify(tc.arguments));
  });
});

describe("PiToAguiTranslator — retry semantics", () => {
  it("does NOT emit RUN_FINISHED on agent_end{willRetry:true} and balances open streams", () => {
    const { t, events } = makeRecorder();
    const stream: PiSessionEvent[] = [
      { type: "agent_start" },
      { type: "message_start", message: {} },
      { type: "message_update", message: {}, assistantMessageEvent: { type: "text_start", contentIndex: 0, partial: textPartial(0, "") } },
      { type: "message_update", message: {}, assistantMessageEvent: { type: "text_delta", contentIndex: 0, delta: "partial...", partial: textPartial(0, "partial...") } },
      { type: "agent_end", willRetry: true }, // mid-retry: no RUN_FINISHED, close the dangling text
    ];
    for (const e of stream) t.onPiEvent(e);

    assert.deepEqual(types(events), ["RUN_STARTED", "TEXT_MESSAGE_START", "TEXT_MESSAGE_CONTENT", "TEXT_MESSAGE_END"]);
    assert.ok(!types(events).includes("RUN_FINISHED"));

    // second attempt then completes
    t.onPiEvent({ type: "message_start", message: {} });
    t.onPiEvent({ type: "message_update", message: {}, assistantMessageEvent: { type: "text_delta", contentIndex: 0, delta: "final", partial: textPartial(0, "final") } });
    t.onPiEvent({ type: "agent_end", willRetry: false });
    assert.equal(events.at(-1)!.type, "RUN_FINISHED");
  });
});

describe("PiToAguiTranslator — invariants & guards", () => {
  it("emits RUN_STARTED only once across duplicate agent_start (retries)", () => {
    const { t, events } = makeRecorder();
    t.onPiEvent({ type: "agent_start" });
    t.onPiEvent({ type: "agent_start" });
    t.onPiEvent({ type: "agent_end", willRetry: false });
    assert.equal(events.filter((e) => e.type === "RUN_STARTED").length, 1);
  });

  it("fail() balances open streams then emits a terminal RUN_ERROR", () => {
    const { t, events } = makeRecorder();
    t.onPiEvent({ type: "agent_start" });
    t.onPiEvent({ type: "message_start", message: {} });
    t.onPiEvent({ type: "message_update", message: {}, assistantMessageEvent: { type: "text_start", contentIndex: 0, partial: textPartial(0, "") } });
    t.fail("model exploded", "PI_PROMPT_ERROR");

    assert.deepEqual(types(events), ["RUN_STARTED", "TEXT_MESSAGE_START", "TEXT_MESSAGE_END", "RUN_ERROR"]);
    // terminal: nothing emitted after RUN_ERROR
    t.onPiEvent({ type: "message_update", message: {}, assistantMessageEvent: { type: "text_delta", contentIndex: 0, delta: "late", partial: textPartial(0, "late") } });
    assert.equal(events.at(-1)!.type, "RUN_ERROR");
  });

  it("a tool call between two text blocks yields two text messages bracketing the call", () => {
    const { t, events } = makeRecorder();
    const tc: PiToolCall = { type: "toolCall", id: "tc_x", name: "f", arguments: {} };
    const seq: PiSessionEvent[] = [
      { type: "agent_start" },
      { type: "message_start", message: {} },
      { type: "message_update", message: {}, assistantMessageEvent: { type: "text_start", contentIndex: 0, partial: textPartial(0, "") } },
      { type: "message_update", message: {}, assistantMessageEvent: { type: "text_delta", contentIndex: 0, delta: "Let me check", partial: textPartial(0, "Let me check") } },
      { type: "message_update", message: {}, assistantMessageEvent: { type: "text_end", contentIndex: 0, content: "Let me check", partial: textPartial(0, "Let me check") } },
      { type: "message_update", message: {}, assistantMessageEvent: { type: "toolcall_start", contentIndex: 1, partial: toolPartial(1, tc) } },
      { type: "message_update", message: {}, assistantMessageEvent: { type: "toolcall_end", contentIndex: 1, toolCall: tc, partial: toolPartial(1, tc) } },
      { type: "message_update", message: {}, assistantMessageEvent: { type: "text_start", contentIndex: 2, partial: textPartial(2, "") } },
      { type: "message_update", message: {}, assistantMessageEvent: { type: "text_delta", contentIndex: 2, delta: "Done", partial: textPartial(2, "Done") } },
      { type: "message_update", message: {}, assistantMessageEvent: { type: "text_end", contentIndex: 2, content: "Done", partial: textPartial(2, "Done") } },
      { type: "agent_end", willRetry: false },
    ];
    for (const e of seq) t.onPiEvent(e);

    // The tool call has no streamed args, so toolcall_end emits the full args ({}) once.
    assert.deepEqual(types(events), [
      "RUN_STARTED",
      "TEXT_MESSAGE_START",
      "TEXT_MESSAGE_CONTENT",
      "TEXT_MESSAGE_END",
      "TOOL_CALL_START",
      "TOOL_CALL_ARGS",
      "TOOL_CALL_END",
      "TEXT_MESSAGE_START",
      "TEXT_MESSAGE_CONTENT",
      "TEXT_MESSAGE_END",
      "RUN_FINISHED",
    ]);
    const firstText = events[1] as Extract<AguiEvent, { type: "TEXT_MESSAGE_START" }>;
    const secondText = events[7] as Extract<AguiEvent, { type: "TEXT_MESSAGE_START" }>;
    assert.equal(firstText.messageId, "m1-0");
    assert.equal(secondText.messageId, "m1-2");
  });

  it("emits RUN_ERROR when an assistant message ends with stopReason 'error'", () => {
    const { t, events } = makeRecorder();
    t.onPiEvent({ type: "agent_start" });
    t.onPiEvent({ type: "message_start", message: {} });
    // Provider 400 etc.: Pi delivers it as an assistant message with stopReason "error"
    // and no streamed text — the translator must surface RUN_ERROR, not RUN_FINISHED.
    t.onPiEvent({
      type: "message_end",
      message: { role: "assistant", stopReason: "error", errorMessage: "400 invalid_function_parameters" },
    } as unknown as PiSessionEvent);
    t.onPiEvent({ type: "agent_end", willRetry: false });

    const last = events.at(-1)!;
    assert.equal(last.type, "RUN_ERROR");
    assert.equal((last as { code?: string }).code, "PI_PROVIDER_ERROR");
    assert.ok(!types(events).includes("RUN_FINISHED"));
  });
});

describe("serializeToolResult", () => {
  it("concatenates text parts", () => {
    assert.equal(serializeToolResult({ content: [{ type: "text", text: "a" }, { type: "text", text: "b" }] }, false), "ab");
  });
  it("prefixes ERROR when isError", () => {
    assert.equal(serializeToolResult({ content: [{ type: "text", text: "boom" }] }, true), "ERROR: boom");
  });
  it("falls back to JSON for non-text or shapeless results", () => {
    assert.equal(serializeToolResult({ foo: 1 }, false), JSON.stringify({ foo: 1 }));
  });
});
