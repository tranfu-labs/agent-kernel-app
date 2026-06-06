import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import { PrismaClient } from "@prisma/client";

import { createPrismaAgentPersistenceCore } from "../lib/db/agent-persistence-core";

let prisma: PrismaClient;
let tempDir: string;

async function seedSession(input: { sessionId?: string; threadId?: string; title?: string } = {}) {
  await prisma.workspaceProject.create({
    data: {
      id: "project_test",
      userId: "local",
      title: "AgentKernel",
    },
  });
  return prisma.workspaceSession.create({
    data: {
      id: input.sessionId ?? "session_test",
      userId: "local",
      projectId: "project_test",
      title: input.title ?? "New discussion",
      copilotThreadId: input.threadId ?? "thread_test",
    },
  });
}

describe("createPrismaAgentPersistence", () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "agentkernel-web-test-"));
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${join(tempDir, "agent-kernel-test.db")}`,
        },
      },
    });
    await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON");
    await prisma.$executeRawUnsafe(`
      CREATE TABLE workspace_projects (
        id TEXT NOT NULL PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE workspace_sessions (
        id TEXT NOT NULL PRIMARY KEY,
        user_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        model TEXT NOT NULL DEFAULT 'gpt-5.5',
        copilot_thread_id TEXT NOT NULL UNIQUE,
        message_count INTEGER NOT NULL DEFAULT 0,
        last_opened_at DATETIME,
        last_message_at DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT workspace_sessions_project_id_fkey FOREIGN KEY (project_id) REFERENCES workspace_projects (id) ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE workspace_messages (
        id TEXT NOT NULL PRIMARY KEY,
        user_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        copilot_thread_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'final',
        source TEXT NOT NULL DEFAULT 'copilotkit',
        run_id TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT workspace_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES workspace_sessions (id) ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE agent_runs (
        id TEXT NOT NULL PRIMARY KEY,
        user_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        copilot_thread_id TEXT NOT NULL,
        status TEXT NOT NULL,
        model TEXT,
        user_message_id TEXT,
        assistant_message_id TEXT,
        error_code TEXT,
        error_message TEXT,
        started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        finished_at DATETIME,
        CONSTRAINT agent_runs_session_id_fkey FOREIGN KEY (session_id) REFERENCES workspace_sessions (id) ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
  });

  afterEach(async () => {
    await prisma.$disconnect();
    await rm(tempDir, { recursive: true, force: true });
  });

  it("writes a completed user/assistant transcript and session counters", async () => {
    await seedSession();
    const persistence = createPrismaAgentPersistenceCore(prisma);

    const started = await persistence.onRunStart({
      userId: "local",
      threadId: "thread_test",
      runId: "run_complete",
      model: "gpt-5.5",
      latestUserText: "Explain durable sessions",
    });
    await persistence.onRunFinish({ runId: "run_complete", assistantText: "SQLite transcript saved." });

    const session = await prisma.workspaceSession.findUniqueOrThrow({ where: { id: started.sessionId } });
    const messages = await prisma.workspaceMessage.findMany({
      where: { runId: "run_complete" },
      orderBy: { createdAt: "asc" },
    });
    const run = await prisma.agentRun.findUniqueOrThrow({ where: { id: "run_complete" } });

    assert.equal(session.title, "Explain durable sessions");
    assert.equal(session.model, "gpt-5.5");
    assert.equal(session.messageCount, 2);
    assert.equal(messages.length, 2);
    assert.equal(messages[0]!.role, "user");
    assert.equal(messages[0]!.content, "Explain durable sessions");
    assert.equal(messages[1]!.role, "assistant");
    assert.equal(messages[1]!.content, "SQLite transcript saved.");
    assert.equal(run.status, "completed");
    assert.equal(run.userMessageId, messages[0]!.id);
    assert.equal(run.assistantMessageId, messages[1]!.id);
    assert.ok(run.finishedAt);
  });

  it("marks failed runs without creating a fake assistant message", async () => {
    await seedSession();
    const persistence = createPrismaAgentPersistenceCore(prisma);

    await persistence.onRunStart({
      userId: "local",
      threadId: "thread_test",
      runId: "run_failed",
      latestUserText: "will fail",
    });
    await persistence.onRunError({ runId: "run_failed", code: "PI_PROMPT_ERROR", message: "provider down" });

    const messages = await prisma.workspaceMessage.findMany({ where: { runId: "run_failed" } });
    const run = await prisma.agentRun.findUniqueOrThrow({ where: { id: "run_failed" } });
    const session = await prisma.workspaceSession.findUniqueOrThrow({ where: { id: "session_test" } });

    assert.deepEqual(
      messages.map((m) => m.role),
      ["user"],
    );
    assert.equal(run.status, "failed");
    assert.equal(run.errorCode, "PI_PROMPT_ERROR");
    assert.equal(run.errorMessage, "provider down");
    assert.equal(session.messageCount, 1);
  });

  it("marks cancelled runs and ignores a late finish", async () => {
    await seedSession();
    const persistence = createPrismaAgentPersistenceCore(prisma);

    await persistence.onRunStart({
      userId: "local",
      threadId: "thread_test",
      runId: "run_cancelled",
      latestUserText: "cancel me",
    });
    await persistence.onRunCancel?.({
      runId: "run_cancelled",
      code: "CLIENT_DISCONNECTED",
      message: "Client disconnected before the run completed.",
    });
    await persistence.onRunFinish({ runId: "run_cancelled", assistantText: "late answer" });

    const messages = await prisma.workspaceMessage.findMany({ where: { runId: "run_cancelled" } });
    const run = await prisma.agentRun.findUniqueOrThrow({ where: { id: "run_cancelled" } });
    const session = await prisma.workspaceSession.findUniqueOrThrow({ where: { id: "session_test" } });

    assert.deepEqual(
      messages.map((m) => m.role),
      ["user"],
    );
    assert.equal(run.status, "cancelled");
    assert.equal(run.assistantMessageId, null);
    assert.equal(run.errorCode, "CLIENT_DISCONNECTED");
    assert.equal(session.messageCount, 1);
  });

  it("rejects a run start when the Copilot thread has no active workspace session", async () => {
    const persistence = createPrismaAgentPersistenceCore(prisma);

    await assert.rejects(
      () =>
        persistence.onRunStart({
          userId: "local",
          threadId: "missing_thread",
          runId: "run_missing",
          latestUserText: "hello",
        }),
      /No active workspace session found/,
    );
  });
});
