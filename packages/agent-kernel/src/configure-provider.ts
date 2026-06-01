import { AuthStorage, ModelRegistry } from "@earendil-works/pi-coding-agent";

/**
 * Register a custom OpenAI-compatible provider (e.g. an aggregator proxy like cloudaikey)
 * at runtime with one or more models, and expose a resolver — without writing anything to
 * ~/.pi/models.json. The API key lives only in memory (setRuntimeApiKey), never persisted.
 *
 * Shared by the web runtime (apps/web) and the smoke script so provider config has a
 * single source of truth. Multiple models let the UI switch via session.setModel().
 */
export interface OpenAiCompatibleProviderConfig {
  /** Provider id used as the auth/registry key, e.g. "cloudaikey". */
  provider: string;
  apiKey: string;
  /** Model ids the endpoint serves, e.g. ["claude-opus-4-7", "gpt-5.5"]. First = default. */
  modelIds: string[];
  /** OpenAI-compatible base URL, e.g. "https://api.cloudaikey.com/v1". */
  baseUrl: string;
  contextWindow?: number;
  maxTokens?: number;
}

type PiModel = NonNullable<ReturnType<ModelRegistry["find"]>>;

export interface ConfiguredProvider {
  authStorage: AuthStorage;
  modelRegistry: ModelRegistry;
  /** Resolve a registered model by id (undefined if not registered). */
  resolveModel: (modelId: string) => PiModel | undefined;
  /** The first configured model — used as the session's initial/default model. */
  defaultModel: PiModel;
}

export function configureOpenAiCompatibleProvider(cfg: OpenAiCompatibleProviderConfig): ConfiguredProvider {
  if (cfg.modelIds.length === 0) throw new Error("configureOpenAiCompatibleProvider: modelIds is empty");

  const authStorage = AuthStorage.create();
  authStorage.setRuntimeApiKey(cfg.provider, cfg.apiKey);

  const modelRegistry = ModelRegistry.create(authStorage);
  modelRegistry.registerProvider(cfg.provider, {
    baseUrl: cfg.baseUrl,
    api: "openai-completions",
    apiKey: cfg.apiKey,
    authHeader: true,
    // One provider, multiple models (registerProvider replaces the provider's model set).
    models: cfg.modelIds.map((id) => ({
      id,
      name: id,
      reasoning: false,
      input: ["text"] as ("text" | "image")[],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: cfg.contextWindow ?? 128_000,
      maxTokens: cfg.maxTokens ?? 8_192,
    })),
  });

  const resolveModel = (modelId: string): PiModel | undefined => modelRegistry.find(cfg.provider, modelId);

  const defaultModel = resolveModel(cfg.modelIds[0]!);
  if (!defaultModel) {
    throw new Error(`Model ${cfg.provider}/${cfg.modelIds[0]} not found after provider registration.`);
  }

  return { authStorage, modelRegistry, resolveModel, defaultModel };
}
