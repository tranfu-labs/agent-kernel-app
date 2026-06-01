import type { ToolDefinition } from "@earendil-works/pi-coding-agent";
import type { VerticalPluginDeclaration } from "@agentkernel/domain";
import { MemoryArtifactStore } from "@agentkernel/storage";

import { GENERIC_SYSTEM_PROMPT } from "./system-prompt.js";

/**
 * Generic, domain-free runtime context the kernel always provides. A vertical that needs
 * extra session state extends this interface in its own package.
 */
export interface KernelRuntimeContext {
  artifactStore: MemoryArtifactStore;
}

export function createKernelRuntimeContext(): KernelRuntimeContext {
  return { artifactStore: new MemoryArtifactStore() };
}

/**
 * A vertical plugin: the unit a domain contributes to the kernel. The kernel injects the
 * vertical's identity (`systemPrompt`), tools (`createTools`), and optional extended runtime
 * context — without the kernel core importing any domain package.
 *
 * `createTools` references the Pi `ToolDefinition` type, which is why this contract lives in
 * `agent-kernel` (the Pi-runtime boundary) and not in `domain` (which must not import Pi).
 */
export interface KernelVertical<Ctx extends KernelRuntimeContext = KernelRuntimeContext> {
  /** Open identifier, e.g. "general", "funding_basis". Not a closed enum. */
  id: string;
  /** Product-facing identity + mission, injected as the Pi system prompt. */
  systemPrompt: string;
  /** Build the Pi tools this vertical exposes. The generic default returns none. */
  createTools: (ctx: Ctx) => ToolDefinition[];
  /** Build the (optionally extended) runtime context. Defaults to the generic context. */
  createRuntimeContext?: () => Ctx;
  /** Optional declarative routing/policy metadata (the existing domain declaration). */
  declaration?: VerticalPluginDeclaration;
}

/**
 * The default vertical: a neutral general-purpose assistant with no domain tools. This is
 * what the kernel runs when `createKernelAgentSession` is called with no vertical.
 */
export const GENERIC_ASSISTANT_VERTICAL: KernelVertical = {
  id: "general",
  systemPrompt: GENERIC_SYSTEM_PROMPT,
  createTools: () => [],
};
