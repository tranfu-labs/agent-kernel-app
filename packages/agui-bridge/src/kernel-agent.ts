import { AbstractAgent, type BaseEvent, type Message, type RunAgentInput } from "@ag-ui/client";
import { Observable } from "rxjs";

import type { AguiEvent } from "./agui-events.js";
import { PiToAguiTranslator } from "./pi-to-agui-translator.js";
import type { PiSessionEvent } from "./pi-types.js";
import type { SessionKey, WarmSessionStore } from "./session-store.js";

/**
 * Resolve the server-validated user identity for a run. MUST come from an authenticated
 * server session, NOT from the client-supplied RunAgentInput, to prevent one user reading
 * another's warm session (see plan §4.3 / decision #2). Default is a single-user constant
 * suitable only for local dev / MVP.
 */
export type UserResolver = (input: RunAgentInput) => string;

export interface KernelAgentOptions {
  store: WarmSessionStore;
  resolveUserId?: UserResolver;
  agentId?: string;
  description?: string;
  /** Forward Pi thinking/reasoning deltas as AG-UI reasoning events. Default false. */
  emitReasoning?: boolean;
  /** Resolve a requested model id from `RunAgentInput.forwardedProps.model`. */
  resolveModel?: (modelId: string) => unknown | undefined;
}

/**
 * In-process AG-UI agent that drives a warm Pi `AgentSession`.
 *
 * Registered directly in the CopilotKit v2 runtime:
 *   new CopilotRuntime({ agents: { agent: new KernelAgent({ store }) } })
 * — no network `HttpAgent`, no separate agent-api service (plan §3). This relies on a
 * persistent Node process so the warm session survives between requests.
 *
 * Per turn, CopilotKit POSTs a `RunAgentInput` (full history). We feed ONLY the latest
 * user turn to the warm session and translate Pi's event stream to AG-UI events.
 */
export class KernelAgent extends AbstractAgent {
  private readonly store: WarmSessionStore;
  private readonly resolveUserId: UserResolver;
  private readonly emitReasoning: boolean;
  private readonly resolveModel?: (modelId: string) => unknown | undefined;

  constructor(opts: KernelAgentOptions) {
    super({
      agentId: opts.agentId ?? "agent",
      description: opts.description ?? "Prism financial intelligence-to-action agent",
    });
    this.store = opts.store;
    this.resolveUserId = opts.resolveUserId ?? (() => "local");
    this.emitReasoning = opts.emitReasoning ?? false;
    this.resolveModel = opts.resolveModel;
  }

  /**
   * CopilotKit's runtime calls `agent.clone()` per request. The base AbstractAgent.clone()
   * does NOT preserve subclass instance fields (store / resolveUserId / emitReasoning),
   * which would make `this.resolveUserId(...)` throw inside `run()`. Override to rebuild a
   * fully-configured KernelAgent. (The runner sets messages/state/threadId after cloning.)
   */
  override clone(): KernelAgent {
    return new KernelAgent({
      store: this.store,
      resolveUserId: this.resolveUserId,
      emitReasoning: this.emitReasoning,
      resolveModel: this.resolveModel,
      agentId: this.agentId,
      description: this.description,
    });
  }

  run(input: RunAgentInput): Observable<BaseEvent> {
    return new Observable<BaseEvent>((subscriber) => {
      let unsubscribe: (() => void) | null = null;
      let managedSession: { session: { abort(): Promise<void>; isStreaming: boolean } } | null = null;
      let settled = false;

      const emit: (e: AguiEvent) => void = (e) => {
        // Wire shapes are verified to match @ag-ui/core; the only gap is the nominal
        // string-enum `type`, so we cast at this single boundary.
        subscriber.next(e as unknown as BaseEvent);
      };
      const translator = new PiToAguiTranslator(emit, {
        threadId: input.threadId,
        runId: input.runId,
        emitReasoning: this.emitReasoning,
      });

      const finish = (): void => {
        if (settled) return;
        settled = true;
        if (unsubscribe) unsubscribe();
        subscriber.complete();
      };

      void (async () => {
        const key: SessionKey = { userId: this.resolveUserId(input), threadId: input.threadId };
        let managed;
        try {
          managed = await this.store.loadOrCreate(key);
        } catch (err) {
          translator.fail(errMsg(err), "SESSION_CREATE_ERROR");
          finish();
          return;
        }
        managedSession = managed;

        // Optional per-run model switch: the frontend can pass `properties={{ model }}` to
        // <CopilotKit>, which arrives here as RunAgentInput.forwardedProps.model. Reuse Pi's
        // built-in session.setModel() instead of splitting warm sessions per model.
        const requestedModelId = (input.forwardedProps as { model?: unknown } | undefined)?.model;
        if (typeof requestedModelId === "string" && requestedModelId.length > 0 && this.resolveModel) {
          const nextModel = this.resolveModel(requestedModelId);
          if (!nextModel) {
            translator.fail(`Requested model is not configured: ${requestedModelId}`, "MODEL_NOT_AVAILABLE");
            finish();
            return;
          }
          const currentModelId = managed.session.model?.id;
          if (currentModelId !== requestedModelId) {
            try {
              if (typeof managed.session.setModel === "function") {
                await managed.session.setModel(nextModel);
              } else {
                translator.fail("This session implementation does not support model switching.", "MODEL_SWITCH_UNSUPPORTED");
                finish();
                return;
              }
            } catch (err) {
              translator.fail(errMsg(err), "MODEL_SWITCH_ERROR");
              finish();
              return;
            }
          }
        }

        // Concurrency guard: one streaming run per warm session. A second overlapping run
        // (double-submit / second tab / SSE reconnect) is rejected rather than interleaved.
        if (managed.session.isStreaming) {
          translator.fail("A run is already streaming for this thread.", "BUSY");
          finish();
          return;
        }

        unsubscribe = managed.session.subscribe((ev) => {
          translator.onPiEvent(ev as PiSessionEvent);
          const e = ev as { type?: string; willRetry?: boolean };
          if (e.type === "agent_end" && e.willRetry !== true) finish();
        });

        const text = latestUserText(input.messages);
        if (text == null) {
          translator.fail("No user message found in RunAgentInput.", "NO_INPUT");
          finish();
          return;
        }

        try {
          await managed.session.prompt(text);
          // Safety net: if agent_end never closed the stream, close it now.
          finish();
        } catch (err) {
          translator.fail(errMsg(err), "PI_PROMPT_ERROR");
          finish();
        }
      })();

      // Teardown on unsubscribe (client disconnect): stop the run to halt token spend,
      // but DO NOT dispose — the warm session must survive for the next request.
      return () => {
        if (unsubscribe) unsubscribe();
        if (managedSession && managedSession.session.isStreaming) {
          void managedSession.session.abort().catch(() => {});
        }
      };
    });
  }
}

/**
 * Extract the latest user-authored text from the AG-UI message history.
 * AG-UI sends the full transcript each run; we feed only the newest user turn to the
 * warm Pi session. Returns null if no user text is present (e.g. a tool-result-only
 * resume POST — handled separately by the HITL path, not here).
 */
export function latestUserText(messages: Message[] | undefined): string | null {
  if (!messages) return null;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i] as { role?: string; content?: unknown };
    if (m.role === "user" && typeof m.content === "string" && m.content.length > 0) {
      return m.content;
    }
  }
  return null;
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
