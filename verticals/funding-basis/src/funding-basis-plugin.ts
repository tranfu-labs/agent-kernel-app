import { FUNDING_BASIS_SYSTEM_PROMPT } from "./funding-system-prompt.js";
import { createFundingBasisRuntimeContext, type FundingBasisRuntimeContext } from "./runtime-context.js";
import { createFundingBasisToolDefinitions } from "./funding-basis-tools.js";
import type { KernelVertical } from "@agentkernel/agent-kernel";

/**
 * The funding-basis financial vertical, packaged as an injectable `KernelVertical`.
 *
 * Phase 1: this wraps the existing in-place funding symbols (prompt + tools + runtime
 * context) so callers opt into the financial agent explicitly via
 * `createKernelAgentSession({ vertical: FUNDING_BASIS_VERTICAL_PLUGIN })`, instead of the
 * kernel hardcoding them as the default. Later phases physically relocate these symbols
 * into a standalone `verticals/funding-basis` package.
 */
export const FUNDING_BASIS_VERTICAL_PLUGIN: KernelVertical<FundingBasisRuntimeContext> = {
  id: "funding_basis",
  systemPrompt: FUNDING_BASIS_SYSTEM_PROMPT,
  createRuntimeContext: createFundingBasisRuntimeContext,
  createTools: (ctx) => createFundingBasisToolDefinitions(ctx),
};
