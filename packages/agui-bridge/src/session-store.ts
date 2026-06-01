/**
 * Warm session store: the single "load-or-create" choke point for Pi sessions.
 *
 * Rationale (see prism-docs/COPILOTKIT_INTEGRATION_PLAN.md §2.3, resolved by SDK facts):
 * Pi `AgentSession` has no `setMessages`/`initialMessages` and its history is a
 * JSONL-on-disk model, so per-request stateless replay is not feasible. The correct
 * model — and the grain of the Pi SDK — is a long-lived "warm" session kept in memory,
 * keyed by `(userId, threadId)`, fed only the latest user turn each run. This REQUIRES a
 * persistent (always-on) Node process; it does not work on stateless serverless.
 *
 * The store takes an injected `SessionFactory` rather than importing `@agentkernel/agent-kernel`
 * directly, so the bridge stays decoupled and unit-testable with a fake session.
 */

/** The subset of a Pi `AgentSession` the bridge depends on (structural typing). */
export interface PiSessionLike {
  subscribe(listener: (event: unknown) => void): () => void;
  prompt(text: string, options?: { streamingBehavior?: "steer" | "followUp" }): Promise<void>;
  abort(): Promise<void>;
  dispose(): void;
  readonly isStreaming: boolean;
  /** Switch the model mid-session (Pi: takes effect next turn). Optional for fakes/tests. */
  setModel?(model: unknown): Promise<void>;
  /** Current model (used to skip redundant setModel calls). */
  readonly model?: { id?: string } | undefined;
}

export interface SessionKey {
  /** Server-validated user identity. NEVER trust a client-supplied value here. */
  userId: string;
  /** AG-UI threadId (stable across a conversation). */
  threadId: string;
}

/** Creates a fresh Pi session. Injected so the bridge doesn't hard-depend on agent-kernel. */
export type SessionFactory = (key: SessionKey) => Promise<{ session: PiSessionLike }>;

export interface ManagedSession {
  readonly key: SessionKey;
  readonly session: PiSessionLike;
  lastUsedMs: number;
}

export interface WarmSessionStoreOptions {
  /** Idle expiry for a warm session. Default: 30 min. */
  ttlMs?: number;
  /** Sweep interval. Default: 60 s. */
  sweepMs?: number;
  /** Injectable clock for deterministic tests. Default: Date.now. */
  now?: () => number;
}

function keyString(key: SessionKey): string {
  return `${key.userId}::${key.threadId}`;
}

export class WarmSessionStore {
  private readonly map = new Map<string, ManagedSession>();
  private readonly factory: SessionFactory;
  private readonly ttlMs: number;
  private readonly now: () => number;
  private readonly sweeper?: ReturnType<typeof setInterval>;
  /** Guards against two concurrent loadOrCreate races creating two sessions. */
  private readonly inflight = new Map<string, Promise<ManagedSession>>();

  constructor(factory: SessionFactory, opts: WarmSessionStoreOptions = {}) {
    this.factory = factory;
    this.ttlMs = opts.ttlMs ?? 30 * 60_000;
    this.now = opts.now ?? Date.now;
    const sweepMs = opts.sweepMs ?? 60_000;
    if (sweepMs > 0 && typeof setInterval === "function") {
      this.sweeper = setInterval(() => this.sweep(), sweepMs);
      this.sweeper.unref?.();
    }
  }

  async loadOrCreate(key: SessionKey): Promise<ManagedSession> {
    const k = keyString(key);
    const existing = this.map.get(k);
    if (existing) {
      existing.lastUsedMs = this.now();
      return existing;
    }
    // Coalesce concurrent creates for the same key.
    const pending = this.inflight.get(k);
    if (pending) return pending;

    const promise = (async () => {
      const { session } = await this.factory(key);
      const managed: ManagedSession = { key, session, lastUsedMs: this.now() };
      this.map.set(k, managed);
      return managed;
    })().finally(() => this.inflight.delete(k));

    this.inflight.set(k, promise);
    return promise;
  }

  has(key: SessionKey): boolean {
    return this.map.has(keyString(key));
  }

  remove(key: SessionKey): void {
    const k = keyString(key);
    const managed = this.map.get(k);
    if (!managed) return;
    this.map.delete(k);
    try {
      managed.session.dispose();
    } catch {
      /* dispose is best-effort / idempotent */
    }
  }

  /** Evict idle, non-streaming sessions past their TTL. */
  sweep(): void {
    const cutoff = this.now() - this.ttlMs;
    for (const [k, m] of this.map) {
      if (m.lastUsedMs < cutoff && !m.session.isStreaming) {
        this.map.delete(k);
        try {
          m.session.dispose();
        } catch {
          /* ignore */
        }
      }
    }
  }

  /** Stop the background sweeper (call on graceful shutdown / in tests). */
  stop(): void {
    if (this.sweeper) clearInterval(this.sweeper);
  }

  get size(): number {
    return this.map.size;
  }
}
