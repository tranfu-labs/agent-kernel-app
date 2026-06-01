import { PRISM_SYSTEM_PROMPT } from "./prism-system-prompt.js";
import { createPrismRuntimeContext, type PrismRuntimeContext } from "./prism-runtime-context.js";
import { createPrismToolDefinitions } from "./register-prism-tools.js";
import type { KernelVertical } from "@agentkernel/agent-kernel";

/**
 * The funding-basis financial vertical, packaged as an injectable `KernelVertical`.
 *
 * Phase 1: this wraps the existing in-place funding symbols (prompt + tools + runtime
 * context) so callers opt into the financial agent explicitly via
 * `createKernelAgentSession({ vertical: FUNDING_BASIS_VERTICAL_PLUGIN })`, instead of the
 * kernel hardcoding them as the default. Later phases physically relocate these symbols
 * into a `verticals/funding-basis` package and rename them off the `Prism` identifier.
 */
export const FUNDING_BASIS_VERTICAL_PLUGIN: KernelVertical<PrismRuntimeContext> = {
  id: "funding_basis",
  systemPrompt: PRISM_SYSTEM_PROMPT,
  createRuntimeContext: createPrismRuntimeContext,
  createTools: (ctx) => createPrismToolDefinitions(ctx),
};
