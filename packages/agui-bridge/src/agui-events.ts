/**
 * AG-UI wire-format events (camelCase), emitted by the Pi→AG-UI translator.
 *
 * These mirror the AG-UI protocol event shapes that CopilotKit / assistant-ui
 * consume. The translator is *sink-agnostic*: a `WriteFn` may push these into an
 * RxJS Observable (in-process `AbstractAgent`) or serialize them as SSE
 * (`data: {json}\n\n`) for a standalone HTTP endpoint.
 *
 * Verified against AG-UI docs (docs.ag-ui.com/concepts/events) and the
 * CopilotKit "17 event types" reference. Only the subset needed for a
 * chat-turn-with-tool-calls is modeled; reasoning/state are included as optional.
 */

export interface JsonPatchOp {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: unknown;
  from?: string;
}

export type AguiEvent =
  // ---- lifecycle ----
  | { type: "RUN_STARTED"; threadId: string; runId: string }
  | { type: "RUN_FINISHED"; threadId: string; runId: string }
  | { type: "RUN_ERROR"; message: string; code?: string }
  // ---- assistant text ----
  | { type: "TEXT_MESSAGE_START"; messageId: string; role: "assistant" }
  | { type: "TEXT_MESSAGE_CONTENT"; messageId: string; delta: string }
  | { type: "TEXT_MESSAGE_END"; messageId: string }
  // ---- reasoning (optional, behind a flag) ----
  | { type: "REASONING_MESSAGE_CONTENT"; messageId: string; delta: string }
  // ---- tool calls (the LLM-emitted call + streamed args) ----
  | { type: "TOOL_CALL_START"; toolCallId: string; toolCallName: string; parentMessageId?: string }
  | { type: "TOOL_CALL_ARGS"; toolCallId: string; delta: string }
  | { type: "TOOL_CALL_END"; toolCallId: string }
  // ---- tool execution result ----
  | { type: "TOOL_CALL_RESULT"; messageId: string; toolCallId: string; content: string; role: "tool" }
  // ---- shared state (optional) ----
  | { type: "STATE_SNAPSHOT"; snapshot: unknown }
  | { type: "STATE_DELTA"; delta: JsonPatchOp[] };

/** Sink the translator writes AG-UI events into. */
export type WriteFn = (event: AguiEvent) => void;

/** Serialize an AG-UI event as an SSE frame: `data: {json}\n\n`. */
export function toSseFrame(event: AguiEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
