import { homedir } from "node:os";
import { resolve } from "node:path";

import {
  AuthStorage,
  createAgentSession,
  DefaultResourceLoader,
  ModelRegistry,
  SessionManager,
} from "@earendil-works/pi-coding-agent";

import {
  GENERIC_ASSISTANT_VERTICAL,
  createKernelRuntimeContext,
  type KernelRuntimeContext,
  type KernelVertical,
} from "./vertical.js";

type CreateAgentSessionOptions = NonNullable<Parameters<typeof createAgentSession>[0]>;

export interface CreateKernelAgentSessionOptions {
  cwd?: string;
  /**
   * The vertical to load. Defaults to `GENERIC_ASSISTANT_VERTICAL` — a neutral assistant
   * with no domain tools. Inject a vertical (e.g. `FUNDING_BASIS_VERTICAL_PLUGIN`) to give
   * the session a domain identity and tools without editing the kernel core.
   *
   * Typed over `any` context: a vertical declares its own runtime-context shape, and the
   * kernel invokes `createRuntimeContext`/`createTools` as a matched pair, so the kernel
   * core never needs to know the concrete context type.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vertical?: KernelVertical<any>;
  /** Override the runtime context. Default: the vertical's context, else the generic one. */
  runtimeContext?: KernelRuntimeContext;
  /** Override auth storage (e.g. to inject a runtime API key). Default: AuthStorage.create(). */
  authStorage?: AuthStorage;
  /** Override model registry (e.g. to register a custom OpenAI-compatible provider). */
  modelRegistry?: ModelRegistry;
  /** Explicit model to use. Default: Pi resolves from settings / first available. */
  model?: CreateAgentSessionOptions["model"];
  /** Reasoning level. Default: from settings. */
  thinkingLevel?: CreateAgentSessionOptions["thinkingLevel"];
}

function resolveRuntimeContext(options: CreateKernelAgentSessionOptions): KernelRuntimeContext {
  if (options.runtimeContext) return options.runtimeContext;
  const vertical = options.vertical ?? GENERIC_ASSISTANT_VERTICAL;
  return vertical.createRuntimeContext?.() ?? createKernelRuntimeContext();
}

/**
 * Build the exact Pi session options the kernel passes into `createAgentSession(...)`.
 *
 * This is the canonical boundary where the generic Pi runtime becomes a product runtime:
 * - inject the active vertical's identity (system prompt) via `resourceLoader`
 * - disable builtin coding tools (the base never exposes them)
 * - expose only the active vertical's tools (none for the generic default)
 *
 * The kernel core knows nothing about any domain: identity and tools come entirely from the
 * injected `KernelVertical`. Exported for narrow bootstrap tests so we can prove the wiring
 * without spinning up a real Pi session.
 */
export async function buildAgentSessionOptions(
  options: CreateKernelAgentSessionOptions = {},
): Promise<CreateAgentSessionOptions> {
  const cwd = options.cwd ?? process.cwd();
  const authStorage = options.authStorage ?? AuthStorage.create();
  const modelRegistry = options.modelRegistry ?? ModelRegistry.create(authStorage);
  const vertical = options.vertical ?? GENERIC_ASSISTANT_VERTICAL;
  const runtimeContext = resolveRuntimeContext({ ...options, vertical });

  // SDK-supported path for runtime identity injection. We replace the base Pi system prompt
  // with the active vertical's identity while leaving skills/tools/context-file resource
  // loading intact.
  const resourceLoader = new DefaultResourceLoader({
    cwd,
    agentDir: resolve(homedir(), ".pi", "agent"),
    systemPromptOverride: () => vertical.systemPrompt,
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
    // Product runtime must not expose coding tools. Only the active vertical's tools are active.
    noTools: "builtin",
    customTools: vertical.createTools(runtimeContext),
  };
}

export async function createKernelAgentSession(options: CreateKernelAgentSessionOptions = {}) {
  const vertical = options.vertical ?? GENERIC_ASSISTANT_VERTICAL;
  const runtimeContext = resolveRuntimeContext({ ...options, vertical });
  const sessionOptions = await buildAgentSessionOptions({ ...options, vertical, runtimeContext });
  const result = await createAgentSession(sessionOptions);
  return { session: result.session, runtimeContext };
}
