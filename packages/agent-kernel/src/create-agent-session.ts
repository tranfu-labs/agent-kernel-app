import { homedir } from "node:os";
import { resolve } from "node:path";

import {
  AuthStorage,
  createAgentSession,
  DefaultResourceLoader,
  ModelRegistry,
  SessionManager,
} from "@earendil-works/pi-coding-agent";

import { PRISM_SYSTEM_PROMPT } from "./prism-system-prompt.js";
import { createPrismRuntimeContext, type PrismRuntimeContext } from "./prism-runtime-context.js";
import { createPrismToolDefinitions } from "./register-prism-tools.js";

type CreateAgentSessionOptions = NonNullable<Parameters<typeof createAgentSession>[0]>;

export interface CreateKernelAgentSessionOptions {
  cwd?: string;
  runtimeContext?: PrismRuntimeContext;
  /** Override auth storage (e.g. to inject a runtime API key). Default: AuthStorage.create(). */
  authStorage?: AuthStorage;
  /** Override model registry (e.g. to register a custom OpenAI-compatible provider). */
  modelRegistry?: ModelRegistry;
  /** Explicit model to use. Default: Pi resolves from settings / first available. */
  model?: CreateAgentSessionOptions["model"];
  /** Reasoning level. Default: from settings. */
  thinkingLevel?: CreateAgentSessionOptions["thinkingLevel"];
}

/**
 * Build the exact Pi session options Prism passes into `createAgentSession(...)`.
 *
 * This is the canonical boundary where generic Pi runtime becomes Prism product runtime:
 * - inject Prism runtime identity/policy via `resourceLoader`
 * - disable builtin coding tools for product runtime
 * - expose Prism domain tools only
 *
 * Exported for narrow bootstrap tests so we can prove the wiring without spinning up a
 * real Pi session.
 */
export async function buildAgentSessionOptions(
  options: CreateKernelAgentSessionOptions = {},
): Promise<CreateAgentSessionOptions> {
  const cwd = options.cwd ?? process.cwd();
  const authStorage = options.authStorage ?? AuthStorage.create();
  const modelRegistry = options.modelRegistry ?? ModelRegistry.create(authStorage);
  const runtimeContext = options.runtimeContext ?? createPrismRuntimeContext();

  // SDK-supported path for runtime identity injection. We replace the base Pi system
  // prompt with the Prism product-runtime contract while leaving skills/tools/context-file
  // resource loading intact.
  const resourceLoader = new DefaultResourceLoader({
    cwd,
    agentDir: resolve(homedir(), ".pi", "agent"),
    systemPromptOverride: () => PRISM_SYSTEM_PROMPT,
  });
  await resourceLoader.reload();

  return {
    cwd,
    sessionManager: SessionManager.inMemory(),
    authStorage,
    modelRegistry,
    resourceLoader,
    ...(options.model ? { model: options.model } : {}),
    ...(options.thinkingLevel ? { thinkingLevel: options.thinkingLevel } : {}),
    // Product runtime must not expose coding tools by default.
    // Only Prism domain tools are active.
    noTools: "builtin",
    customTools: createPrismToolDefinitions(runtimeContext),
  };
}

export async function createKernelAgentSession(options: CreateKernelAgentSessionOptions = {}) {
  const runtimeContext = options.runtimeContext ?? createPrismRuntimeContext();
  const sessionOptions = await buildAgentSessionOptions({ ...options, runtimeContext });
  const result = await createAgentSession(sessionOptions);
  return { session: result.session, runtimeContext };
}
