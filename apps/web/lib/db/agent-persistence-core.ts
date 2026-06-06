import type { AgentPersistence } from "@agentkernel/agui-bridge";
import type { PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";

type PrismaAgentPersistenceClient = PrismaClient;

function messageTitle(text: string): string {
  const title = text.replace(/\s+/g, " ").trim();
  if (!title) return "New discussion";
  return title.length > 48 ? `${title.slice(0, 48)}...` : title;
}

function isDefaultTitle(title: string): boolean {
  return title === "New discussion";
}

export function createPrismaAgentPersistenceCore(client: PrismaAgentPersistenceClient): AgentPersistence {
  return {
    async onRunStart(input) {
      const session = await client.workspaceSession.findFirst({
        where: {
          userId: input.userId,
          copilotThreadId: input.threadId,
          status: "active",
        },
        select: {
          id: true,
          title: true,
          messageCount: true,
        },
      });

      if (!session) {
        throw new Error(`No active workspace session found for thread ${input.threadId}`);
      }

      const now = new Date();
      const userMessageId = `msg_${uuidv7()}`;
      const nextTitle = isDefaultTitle(session.title) ? messageTitle(input.latestUserText) : session.title;

      await client.$transaction([
        client.workspaceMessage.create({
          data: {
            id: userMessageId,
            userId: input.userId,
            sessionId: session.id,
            copilotThreadId: input.threadId,
            role: "user",
            content: input.latestUserText,
            runId: input.runId,
          },
        }),
        client.agentRun.create({
          data: {
            id: input.runId,
            userId: input.userId,
            sessionId: session.id,
            copilotThreadId: input.threadId,
            status: "running",
            model: input.model,
            userMessageId,
          },
        }),
        client.workspaceSession.update({
          where: { id: session.id },
          data: {
            title: nextTitle,
            model: input.model ?? undefined,
            messageCount: { increment: 1 },
            lastMessageAt: now,
            lastOpenedAt: now,
          },
        }),
      ]);

      return {
        sessionId: session.id,
        userMessageId,
      };
    },

    async onRunFinish(input) {
      const run = await client.agentRun.findUnique({
        where: { id: input.runId },
        select: {
          id: true,
          userId: true,
          sessionId: true,
          copilotThreadId: true,
          assistantMessageId: true,
          status: true,
          finishedAt: true,
        },
      });

      if (!run) return;
      if (run.finishedAt || run.status !== "running") return;
      if (run.assistantMessageId) return;

      const now = new Date();
      const assistantText = input.assistantText.trim();
      const assistantMessageId = assistantText ? `msg_${uuidv7()}` : null;

      await client.$transaction([
        ...(assistantMessageId
          ? [
              client.workspaceMessage.create({
                data: {
                  id: assistantMessageId,
                  userId: run.userId,
                  sessionId: run.sessionId,
                  copilotThreadId: run.copilotThreadId,
                  role: "assistant",
                  content: assistantText,
                  runId: run.id,
                },
              }),
            ]
          : []),
        client.agentRun.update({
          where: { id: run.id },
          data: {
            status: "completed",
            assistantMessageId,
            finishedAt: now,
          },
        }),
        client.workspaceSession.update({
          where: { id: run.sessionId },
          data: {
            messageCount: assistantMessageId ? { increment: 1 } : undefined,
            lastMessageAt: now,
            lastOpenedAt: now,
          },
        }),
      ]);
    },

    async onRunError(input) {
      const run = await client.agentRun.findUnique({
        where: { id: input.runId },
        select: {
          id: true,
          sessionId: true,
          status: true,
          finishedAt: true,
        },
      });

      if (!run) return;
      if (run.finishedAt || run.status !== "running") return;
      const now = new Date();

      await client.$transaction([
        client.agentRun.update({
          where: { id: run.id },
          data: {
            status: "failed",
            errorCode: input.code,
            errorMessage: input.message,
            finishedAt: now,
          },
        }),
        client.workspaceSession.update({
          where: { id: run.sessionId },
          data: {
            lastMessageAt: now,
            lastOpenedAt: now,
          },
        }),
      ]);
    },

    async onRunCancel(input) {
      const run = await client.agentRun.findUnique({
        where: { id: input.runId },
        select: {
          id: true,
          sessionId: true,
          status: true,
          finishedAt: true,
        },
      });

      if (!run || run.finishedAt || run.status !== "running") return;
      const now = new Date();

      await client.$transaction([
        client.agentRun.update({
          where: { id: run.id },
          data: {
            status: "cancelled",
            errorCode: input.code,
            errorMessage: input.message,
            finishedAt: now,
          },
        }),
        client.workspaceSession.update({
          where: { id: run.sessionId },
          data: {
            lastMessageAt: now,
            lastOpenedAt: now,
          },
        }),
      ]);
    },
  };
}
