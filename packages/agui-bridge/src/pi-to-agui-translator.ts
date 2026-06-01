import type { AguiEvent, WriteFn } from "./agui-events.js";
import {
  isToolCall,
  type PiAssistantMessageEvent,
  type PiSessionEvent,
  type PiToolCall,
  type PiToolResultPart,
} from "./pi-types.js";

export interface TranslatorOptions {
  threadId: string;
  runId: string;
  /** Emit REASONING_MESSAGE_CONTENT for thinking deltas. Default false. */
  emitReasoning?: boolean;
  /**
   * ID generator for AG-UI message ids (Pi assistant messages have no stable id).
   * Injectable for deterministic tests. Default: monotonic `${runId}-m{n}`.
   */
  generateMessageId?: (seq: number) => string;
}

interface TextStream {
  messageId: string;
  ended: boolean;
}

interface ToolCallStream {
  toolCallId: string;
  parentMessageId: string;
  startEmitted: boolean;
  endEmitted: boolean;
  /** true once we've streamed at least one TOOL_CALL_ARGS delta. */
  argsStreamed: boolean;
}

/**
 * Stateful, per-run translator from Pi `AgentSessionEvent`s to AG-UI events.
 *
 * Design rules (see docs/archived-funding-basis/COPILOTKIT_INTEGRATION_PLAN.md §2.2):
 *  - Drive text/tool-call streaming from the nested `assistantMessageEvent` ONLY;
 *    `message_start`/`message_end` are lifecycle anchors (driving from both double-emits).
 *  - Every START gets a matching END before RUN_FINISHED / RUN_ERROR.
 *  - `agent_end{willRetry:true}` does NOT finish the run (close dangling streams, keep open).
 *  - Tool-call identity comes from `partial.content[contentIndex]` (a ToolCall with stable
 *    `id`+`name`); the authoritative full ToolCall arrives on `toolcall_end`.
 *  - One AG-UI text message per (assistant message, contentIndex), so a tool call sitting
 *    between two text blocks yields two text messages bracketing the tool call (AG-UI can't
 *    reopen a closed text message).
 */
export class PiToAguiTranslator {
  private readonly write: WriteFn;
  private readonly threadId: string;
  private readonly runId: string;
  private readonly emitReasoning: boolean;
  private readonly genId: (seq: number) => string;

  private runStarted = false;
  private runFinished = false; // terminal guard

  /** Base id for the current assistant message; bumped on each message_start. */
  private messageSeq = 0;
  private currentBaseId: string | null = null;

  /** Open text streams keyed by `${baseId}#${contentIndex}`. */
  private readonly textStreams = new Map<string, TextStream>();
  /** Open reasoning streams keyed the same way. */
  private readonly reasoningStreams = new Map<string, string>(); // key -> messageId
  /** contentIndex (within current message) -> toolCallId, set when a tool call opens. */
  private readonly toolIndex = new Map<number, string>();
  /** Open/!ended tool-call streams keyed by toolCallId. */
  private readonly toolCalls = new Map<string, ToolCallStream>();
  /** toolCallIds whose TOOL_CALL_RESULT was already emitted (dedup). */
  private readonly resultEmitted = new Set<string>();

  constructor(write: WriteFn, opts: TranslatorOptions) {
    this.write = write;
    this.threadId = opts.threadId;
    this.runId = opts.runId;
    this.emitReasoning = opts.emitReasoning ?? false;
    this.genId = opts.generateMessageId ?? ((n) => `${this.runId}-m${n}`);
  }

  // ---------------------------------------------------------------- public

  onPiEvent(ev: PiSessionEvent): void {
    if (this.runFinished) return;
    switch (ev.type) {
      case "agent_start":
        this.startRun();
        break;
      case "agent_end":
        this.handleAgentEnd((ev as { willRetry?: boolean }).willRetry === true);
        break;
      case "message_start":
        // New assistant message → allocate a fresh base id; reset per-message indices.
        this.currentBaseId = this.genId(++this.messageSeq);
        this.toolIndex.clear();
        break;
      case "message_update":
        this.handleAssistant((ev as { assistantMessageEvent: PiAssistantMessageEvent }).assistantMessageEvent);
        break;
      case "message_end":
        // Provider/turn errors are delivered by Pi as an assistant message with
        // stopReason "error" (NOT always as a streamed assistantMessageEvent.error).
        // Surface it as RUN_ERROR so the UI shows the failure instead of a silent finish.
        {
          const msg = (ev as { message?: { role?: string; stopReason?: string; errorMessage?: string } }).message;
          if (msg && msg.role === "assistant" && msg.stopReason === "error") {
            this.fail(msg.errorMessage ?? "Provider returned an error.", "PI_PROVIDER_ERROR");
            break;
          }
        }
        // Safety net: close any text/reasoning streams for the current message.
        this.closeTextStreamsForCurrentMessage();
        break;
      case "tool_execution_end":
        this.handleToolExecutionEnd(ev as {
          toolCallId: string;
          result: unknown;
          isError: boolean;
        });
        break;
      // tool_execution_start/update carry no AG-UI-visible delta we haven't surfaced;
      // partialResult is cumulative and AG-UI has no streaming-tool-result event.
      default:
        break;
    }
  }

  /** Emit a terminal RUN_ERROR, balancing any open streams first. */
  fail(message: string, code?: string): void {
    if (this.runFinished) return;
    this.startRun(); // ensure RUN_STARTED precedes (idempotent)
    this.closeAllOpenStreams();
    this.runFinished = true;
    this.write({ type: "RUN_ERROR", message, code });
  }

  // ---------------------------------------------------------------- run lifecycle

  private startRun(): void {
    if (this.runStarted) return; // retries re-emit agent_start; only one RUN_STARTED
    this.runStarted = true;
    this.write({ type: "RUN_STARTED", threadId: this.threadId, runId: this.runId });
  }

  private handleAgentEnd(willRetry: boolean): void {
    if (willRetry) {
      // Not the end of the run — close dangling streams so the next attempt is balanced.
      this.closeAllOpenStreams();
      return;
    }
    this.finishRun();
  }

  private finishRun(): void {
    if (this.runFinished) return;
    this.closeAllOpenStreams();
    this.runFinished = true;
    this.write({ type: "RUN_FINISHED", threadId: this.threadId, runId: this.runId });
  }

  // ---------------------------------------------------------------- assistant fan-out

  private handleAssistant(ame: PiAssistantMessageEvent): void {
    // Defensive: if updates arrive without a preceding message_start, allocate a base id.
    if (this.currentBaseId === null) this.currentBaseId = this.genId(++this.messageSeq);

    switch (ame.type) {
      case "text_start":
        this.openText(ame.contentIndex);
        break;
      case "text_delta": {
        const ts = this.openText(ame.contentIndex);
        if (ame.delta) this.write({ type: "TEXT_MESSAGE_CONTENT", messageId: ts.messageId, delta: ame.delta });
        break;
      }
      case "text_end":
        this.closeText(ame.contentIndex);
        break;

      case "thinking_start":
        if (this.emitReasoning) this.openReasoning(ame.contentIndex);
        break;
      case "thinking_delta":
        if (this.emitReasoning && ame.delta) {
          const messageId = this.openReasoning(ame.contentIndex);
          this.write({ type: "REASONING_MESSAGE_CONTENT", messageId, delta: ame.delta });
        }
        break;
      case "thinking_end":
        if (this.emitReasoning) this.reasoningStreams.delete(this.key(ame.contentIndex));
        break;

      case "toolcall_start": {
        const tc = this.toolCallFromPartial(ame.partial.content[ame.contentIndex]);
        if (tc) this.openToolCall(ame.contentIndex, tc.id, tc.name);
        // If id not yet present in partial, we defer until a delta or toolcall_end.
        break;
      }
      case "toolcall_delta": {
        // Resolve toolCallId: prefer the index map; else read from partial.
        let toolCallId = this.toolIndex.get(ame.contentIndex);
        if (!toolCallId) {
          const tc = this.toolCallFromPartial(ame.partial.content[ame.contentIndex]);
          if (tc) toolCallId = this.openToolCall(ame.contentIndex, tc.id, tc.name).toolCallId;
        }
        if (toolCallId && ame.delta) {
          const stream = this.toolCalls.get(toolCallId);
          if (stream) stream.argsStreamed = true;
          this.write({ type: "TOOL_CALL_ARGS", toolCallId, delta: ame.delta });
        }
        break;
      }
      case "toolcall_end": {
        // Authoritative full tool call.
        const stream = this.openToolCall(ame.contentIndex, ame.toolCall.id, ame.toolCall.name);
        // If no args streamed during deltas, emit the complete args once so the
        // frontend card has data (e.g. providers that don't stream tool args).
        if (!stream.argsStreamed) {
          const argsJson = safeJson(ame.toolCall.arguments);
          if (argsJson) this.write({ type: "TOOL_CALL_ARGS", toolCallId: stream.toolCallId, delta: argsJson });
          stream.argsStreamed = true;
        }
        this.closeToolCall(stream.toolCallId);
        break;
      }

      case "done":
        this.closeTextStreamsForCurrentMessage();
        break;
      case "error":
        this.fail("assistant stream error", "PI_STREAM_ERROR");
        break;
    }
  }

  // ---------------------------------------------------------------- text helpers

  private key(contentIndex: number): string {
    return `${this.currentBaseId}#${contentIndex}`;
  }

  private openText(contentIndex: number): TextStream {
    const k = this.key(contentIndex);
    let ts = this.textStreams.get(k);
    if (!ts) {
      const messageId = `${this.currentBaseId}-${contentIndex}`;
      ts = { messageId, ended: false };
      this.textStreams.set(k, ts);
      this.write({ type: "TEXT_MESSAGE_START", messageId, role: "assistant" });
    }
    return ts;
  }

  private closeText(contentIndex: number): void {
    const k = this.key(contentIndex);
    const ts = this.textStreams.get(k);
    if (ts && !ts.ended) {
      ts.ended = true;
      this.write({ type: "TEXT_MESSAGE_END", messageId: ts.messageId });
    }
    this.textStreams.delete(k);
  }

  private closeTextStreamsForCurrentMessage(): void {
    for (const [k, ts] of this.textStreams) {
      if (k.startsWith(`${this.currentBaseId}#`) && !ts.ended) {
        ts.ended = true;
        this.write({ type: "TEXT_MESSAGE_END", messageId: ts.messageId });
        this.textStreams.delete(k);
      }
    }
  }

  // ---------------------------------------------------------------- reasoning helpers

  private openReasoning(contentIndex: number): string {
    const k = this.key(contentIndex);
    let messageId = this.reasoningStreams.get(k);
    if (!messageId) {
      messageId = `${this.currentBaseId}-r${contentIndex}`;
      this.reasoningStreams.set(k, messageId);
    }
    return messageId;
  }

  // ---------------------------------------------------------------- tool-call helpers

  private toolCallFromPartial(block: unknown): PiToolCall | null {
    const b = block as PiToolCall | undefined;
    if (isToolCall(b) && typeof b.id === "string" && b.id.length > 0) return b;
    return null;
  }

  private openToolCall(contentIndex: number, toolCallId: string, name: string): ToolCallStream {
    this.toolIndex.set(contentIndex, toolCallId);
    let tc = this.toolCalls.get(toolCallId);
    if (!tc) {
      tc = {
        toolCallId,
        parentMessageId: this.currentBaseId ?? `${this.runId}-m${this.messageSeq}`,
        startEmitted: false,
        endEmitted: false,
        argsStreamed: false,
      };
      this.toolCalls.set(toolCallId, tc);
    }
    if (!tc.startEmitted) {
      tc.startEmitted = true;
      this.write({
        type: "TOOL_CALL_START",
        toolCallId,
        toolCallName: name,
        parentMessageId: tc.parentMessageId,
      });
    }
    return tc;
  }

  private closeToolCall(toolCallId: string): void {
    const tc = this.toolCalls.get(toolCallId);
    if (tc && tc.startEmitted && !tc.endEmitted) {
      tc.endEmitted = true;
      this.write({ type: "TOOL_CALL_END", toolCallId });
    }
    // Retain the entry so a later TOOL_CALL_RESULT can recover parentMessageId.
  }

  private handleToolExecutionEnd(ev: { toolCallId: string; result: unknown; isError: boolean }): void {
    const { toolCallId } = ev;
    if (this.resultEmitted.has(toolCallId)) return;
    this.resultEmitted.add(toolCallId);

    // Ensure the call had START+END (synthesize if the execution result somehow arrived
    // without a streamed call — defensive, keeps the AG-UI envelope balanced).
    let tc = this.toolCalls.get(toolCallId);
    if (!tc) {
      this.write({
        type: "TOOL_CALL_START",
        toolCallId,
        toolCallName: toolCallId,
        parentMessageId: this.currentBaseId ?? `${this.runId}-m${this.messageSeq}`,
      });
      this.write({ type: "TOOL_CALL_END", toolCallId });
      tc = { toolCallId, parentMessageId: "", startEmitted: true, endEmitted: true, argsStreamed: true };
    } else if (!tc.endEmitted) {
      this.closeToolCall(toolCallId);
    }

    this.write({
      type: "TOOL_CALL_RESULT",
      messageId: `result-${toolCallId}`,
      toolCallId,
      role: "tool",
      content: serializeToolResult(ev.result, ev.isError),
    });
    this.toolCalls.delete(toolCallId);
  }

  // ---------------------------------------------------------------- teardown

  private closeAllOpenStreams(): void {
    for (const [k, ts] of this.textStreams) {
      if (!ts.ended) this.write({ type: "TEXT_MESSAGE_END", messageId: ts.messageId });
      this.textStreams.delete(k);
    }
    this.reasoningStreams.clear();
    for (const [id, tc] of this.toolCalls) {
      if (tc.startEmitted && !tc.endEmitted) this.write({ type: "TOOL_CALL_END", toolCallId: id });
      this.toolCalls.delete(id);
    }
    this.toolIndex.clear();
  }
}

// -------------------------------------------------------------------- serialization

/**
 * Serialize a Pi tool result into an AG-UI `content` string.
 * Pi tool results are typically `{ content: (TextContent|ImageContent)[], details, isError }`.
 * We concatenate text parts and JSON-tag non-text parts so nothing is silently lost.
 */
export function serializeToolResult(result: unknown, isError: boolean): string {
  const parts = extractParts(result);
  const pieces: string[] = [];
  for (const p of parts) {
    if (p.type === "text" && typeof p.text === "string") pieces.push(p.text);
    else pieces.push(safeJson(p) ?? `[unserializable ${p.type} part]`);
  }
  let body = pieces.join("");
  if (body.length === 0) body = safeJson(result) ?? "";
  return isError ? `ERROR: ${body}` : body;
}

function extractParts(result: unknown): PiToolResultPart[] {
  if (result && typeof result === "object" && Array.isArray((result as { content?: unknown }).content)) {
    return (result as { content: PiToolResultPart[] }).content;
  }
  return [];
}

function safeJson(value: unknown): string | null {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}
