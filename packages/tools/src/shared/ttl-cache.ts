export interface TtlCacheEntry<TValue> {
  value: TValue;
  expiresAt: number;
}

export class TtlCache<TValue> {
  private readonly values = new Map<string, TtlCacheEntry<TValue>>();
  private readonly inFlight = new Map<string, Promise<TValue>>();

  get(key: string, now = Date.now()): TValue | undefined {
    const entry = this.values.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= now) {
      this.values.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: TValue, ttlMs: number, now = Date.now()): TValue {
    this.values.set(key, { value, expiresAt: now + ttlMs });
    return value;
  }

  async getOrSet(key: string, ttlMs: number, load: () => Promise<TValue>): Promise<TValue> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const existing = this.inFlight.get(key);
    if (existing) return existing;

    const promise = load()
      .then((value) => this.set(key, value, ttlMs))
      .finally(() => this.inFlight.delete(key));

    this.inFlight.set(key, promise);
    return promise;
  }

  delete(key: string): boolean {
    this.inFlight.delete(key);
    return this.values.delete(key);
  }

  clear(): void {
    this.values.clear();
    this.inFlight.clear();
  }
}
