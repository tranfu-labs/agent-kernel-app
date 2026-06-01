/**
 * Minimal structural mirrors of the Pi SDK event types the translator consumes.
 *
 * We deliberately do NOT import from `@earendil-works/pi-coding-agent` here so the
 * translator stays a pure, dependency-free, unit-testable function. Shapes are copied
 * verbatim from the installed `.d.ts` files (v0.75.5):
 *   - pi-ai/dist/types.d.ts        → AssistantMessageEvent, ToolCall, content blocks
 *   - pi-agent-core/dist/types.d.ts → AgentEvent
 *   - pi-coding-agent/dist/core/agent-session.d.ts → AgentSessionEvent (adds willRetry)
 *
 * KEY FACTS (these corrected an early wrong assumption):
 *   - `toolcall_start` / `toolcall_delta` carry `contentIndex` + `partial`, NOT a
 *     toolCallId. The tool-call identity is read from `partial.content[contentIndex]`
 *     (a `ToolCall` with stable `id` + `name`). The authoritative full `ToolCall` is
 *     present on `toolcall_end`.
 *   - Assistant messages have NO stable `id` field → the translator GENERATES AG-UI
 *     messageIds. `ToolCall.id` IS stable and is used as the AG-UI toolCallId.
 *   - `agent_end` at the session level carries `willRetry: boolean`.
 */

export interface PiTextContent {
  type: "text";
  text: string;
}
export interface PiThinkingContent {
  type: "thinking";
  thinking?: string;
}
export interface PiToolCall {
  type: "toolCall";
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}
export type PiContentBlock = PiTextContent | PiThinkingContent | PiToolCall;

/** Partial in-progress assistant message carried on streaming events. */
export interface PiAssistantMessagePartial {
  role: "assistant";
  content: PiContentBlock[];
}

/** The fine-grained streaming events nested inside `message_update`. */
export type PiAssistantMessageEvent =
  | { type: "start"; partial: PiAssistantMessagePartial }
  | { type: "text_start"; contentIndex: number; partial: PiAssistantMessagePartial }
  | { type: "text_delta"; contentIndex: number; delta: string; partial: PiAssistantMessagePartial }
  | { type: "text_end"; contentIndex: number; content: string; partial: PiAssistantMessagePartial }
  | { type: "thinking_start"; contentIndex: number; partial: PiAssistantMessagePartial }
  | { type: "thinking_delta"; contentIndex: number; delta: string; partial: PiAssistantMessagePartial }
  | { type: "thinking_end"; contentIndex: number; content: string; partial: PiAssistantMessagePartial }
  | { type: "toolcall_start"; contentIndex: number; partial: PiAssistantMessagePartial }
  | { type: "toolcall_delta"; contentIndex: number; delta: string; partial: PiAssistantMessagePartial }
  | { type: "toolcall_end"; contentIndex: number; toolCall: PiToolCall; partial: PiAssistantMessagePartial }
  | { type: "done"; reason: "stop" | "length" | "toolUse"; message: PiAssistantMessagePartial }
  | { type: "error"; reason: "aborted" | "error"; error: unknown };

/** A Pi tool result content part (from AgentToolResult / ToolResultMessage). */
export interface PiToolResultPart {
  type: string; // "text" | "image" | ...
  text?: string;
  [k: string]: unknown;
}

/**
 * The session-level event union we subscribe to. We model the variants the translator
 * reacts to and treat the rest as ignorable (typed loosely as `{ type: string }`).
 */
export type PiSessionEvent =
  | { type: "agent_start" }
  | { type: "agent_end"; willRetry: boolean }
  | { type: "turn_start" }
  | { type: "message_start"; message: unknown }
  | { type: "message_update"; message: unknown; assistantMessageEvent: PiAssistantMessageEvent }
  | { type: "message_end"; message: unknown }
  | { type: "tool_execution_start"; toolCallId: string; toolName: string; args: unknown }
  | { type: "tool_execution_update"; toolCallId: string; toolName: string; args: unknown; partialResult: unknown }
  | { type: "tool_execution_end"; toolCallId: string; toolName: string; result: unknown; isError: boolean }
  | { type: string };

/** Narrowing helper: is this content block a tool call? */
export function isToolCall(block: PiContentBlock | undefined): block is PiToolCall {
  return !!block && block.type === "toolCall";
}
