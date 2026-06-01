import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { WarmSessionStore, type PiSessionLike, type SessionFactory } from "../src/session-store.js";

class FakeSession implements PiSessionLike {
  disposed = false;
  isStreaming = false;
  subscribe(): () => void {
    return () => {};
  }
  async prompt(): Promise<void> {}
  async abort(): Promise<void> {}
  dispose(): void {
    this.disposed = true;
  }
}

function countingFactory(): { factory: SessionFactory; calls: () => number; sessions: FakeSession[] } {
  let calls = 0;
  const sessions: FakeSession[] = [];
  const factory: SessionFactory = async () => {
    calls++;
    const s = new FakeSession();
    sessions.push(s);
    return { session: s };
  };
  return { factory, calls: () => calls, sessions };
}

describe("WarmSessionStore", () => {
  it("caches a session per (userId, threadId) and reuses it", async () => {
    const { factory, calls } = countingFactory();
    const store = new WarmSessionStore(factory, { sweepMs: 0 });
    const a = await store.loadOrCreate({ userId: "u1", threadId: "t1" });
    const b = await store.loadOrCreate({ userId: "u1", threadId: "t1" });
    assert.equal(a, b);
    assert.equal(calls(), 1);
    assert.equal(store.size, 1);
  });

  it("creates distinct sessions for different keys", async () => {
    const { factory, calls } = countingFactory();
    const store = new WarmSessionStore(factory, { sweepMs: 0 });
    await store.loadOrCreate({ userId: "u1", threadId: "t1" });
    await store.loadOrCreate({ userId: "u2", threadId: "t1" }); // different user
    await store.loadOrCreate({ userId: "u1", threadId: "t2" }); // different thread
    assert.equal(calls(), 3);
    assert.equal(store.size, 3);
  });

  it("coalesces concurrent loadOrCreate for the same key (factory called once)", async () => {
    const { factory, calls } = countingFactory();
    const store = new WarmSessionStore(factory, { sweepMs: 0 });
    const [a, b] = await Promise.all([
      store.loadOrCreate({ userId: "u1", threadId: "t1" }),
      store.loadOrCreate({ userId: "u1", threadId: "t1" }),
    ]);
    assert.equal(a, b);
    assert.equal(calls(), 1);
  });

  it("remove() disposes the session", async () => {
    const { factory, sessions } = countingFactory();
    const store = new WarmSessionStore(factory, { sweepMs: 0 });
    await store.loadOrCreate({ userId: "u1", threadId: "t1" });
    store.remove({ userId: "u1", threadId: "t1" });
    assert.equal(sessions[0]!.disposed, true);
    assert.equal(store.size, 0);
  });

  it("sweep() evicts idle non-streaming sessions past TTL but keeps streaming ones", async () => {
    const { factory, sessions } = countingFactory();
    let clock = 1_000;
    const store = new WarmSessionStore(factory, { sweepMs: 0, ttlMs: 100, now: () => clock });
    await store.loadOrCreate({ userId: "u1", threadId: "idle" });
    await store.loadOrCreate({ userId: "u1", threadId: "busy" });
    sessions[1]!.isStreaming = true; // streaming session must survive

    clock += 1_000; // advance well past TTL
    store.sweep();

    assert.equal(store.has({ userId: "u1", threadId: "idle" }), false);
    assert.equal(store.has({ userId: "u1", threadId: "busy" }), true);
    assert.equal(sessions[0]!.disposed, true);
    assert.equal(sessions[1]!.disposed, false);
  });
});
