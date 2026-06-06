import "server-only";

import { v7 as uuidv7 } from "uuid";

import { prisma } from "./prisma";

export const LOCAL_USER_ID = "local";
const DEFAULT_PROJECT_ID = "project_agentkernel_local";
const DEFAULT_PROJECT_TITLE = "AgentKernel";

export interface WorkspaceSessionSummary {
  id: string;
  title: string;
  status: string;
  copilotThreadId: string;
  createdAt: Date;
  updatedAt: Date;
  lastOpenedAt: Date | null;
}

export interface WorkspaceData {
  project: {
    id: string;
    title: string;
  };
  sessions: WorkspaceSessionSummary[];
  activeSession: WorkspaceSessionSummary;
}

export async function ensureDefaultWorkspace(userId = LOCAL_USER_ID): Promise<WorkspaceData> {
  const project = await prisma.workspaceProject.upsert({
    where: { id: DEFAULT_PROJECT_ID },
    update: {},
    create: {
      id: DEFAULT_PROJECT_ID,
      userId,
      title: DEFAULT_PROJECT_TITLE,
    },
  });

  let sessions = await listWorkspaceSessions(userId, project.id);
  if (sessions.length === 0) {
    const session = await createWorkspaceSession(userId, {
      projectId: project.id,
      title: "New discussion",
    });
    sessions = [session];
  }

  const activeSession = await touchWorkspaceSession(userId, sessions[0]!.id);

  return {
    project: {
      id: project.id,
      title: project.title,
    },
    sessions: await listWorkspaceSessions(userId, project.id),
    activeSession,
  };
}

export async function getWorkspaceData(
  userId = LOCAL_USER_ID,
  activeSessionId?: string | null,
): Promise<WorkspaceData> {
  const data = await ensureDefaultWorkspace(userId);
  if (!activeSessionId || activeSessionId === data.activeSession.id) return data;

  const activeSession = await findActiveWorkspaceSession(userId, activeSessionId);
  if (!activeSession) return data;

  const touchedSession = await touchWorkspaceSession(userId, activeSession.id);
  return {
    ...data,
    activeSession: touchedSession,
    sessions: await listWorkspaceSessions(userId, data.project.id),
  };
}

export async function listWorkspaceSessions(
  userId = LOCAL_USER_ID,
  projectId = DEFAULT_PROJECT_ID,
): Promise<WorkspaceSessionSummary[]> {
  return prisma.workspaceSession.findMany({
    where: {
      userId,
      projectId,
      status: "active",
    },
    orderBy: [{ lastOpenedAt: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      status: true,
      copilotThreadId: true,
      createdAt: true,
      updatedAt: true,
      lastOpenedAt: true,
    },
  });
}

export async function createWorkspaceSession(
  userId = LOCAL_USER_ID,
  input: { projectId?: string; title?: string } = {},
): Promise<WorkspaceSessionSummary> {
  const now = new Date();
  return prisma.workspaceSession.create({
    data: {
      id: `session_${uuidv7()}`,
      userId,
      projectId: input.projectId ?? DEFAULT_PROJECT_ID,
      title: input.title ?? "New discussion",
      copilotThreadId: `thread_${uuidv7()}`,
      lastOpenedAt: now,
    },
    select: {
      id: true,
      title: true,
      status: true,
      copilotThreadId: true,
      createdAt: true,
      updatedAt: true,
      lastOpenedAt: true,
    },
  });
}

async function findActiveWorkspaceSession(
  userId = LOCAL_USER_ID,
  sessionId: string,
): Promise<WorkspaceSessionSummary | null> {
  return prisma.workspaceSession.findFirst({
    where: {
      id: sessionId,
      userId,
      status: "active",
    },
    select: {
      id: true,
      title: true,
      status: true,
      copilotThreadId: true,
      createdAt: true,
      updatedAt: true,
      lastOpenedAt: true,
    },
  });
}

export async function touchWorkspaceSession(
  userId = LOCAL_USER_ID,
  sessionId: string,
): Promise<WorkspaceSessionSummary> {
  return prisma.workspaceSession.update({
    where: {
      id: sessionId,
      userId,
      status: "active",
    },
    data: {
      lastOpenedAt: new Date(),
    },
    select: {
      id: true,
      title: true,
      status: true,
      copilotThreadId: true,
      createdAt: true,
      updatedAt: true,
      lastOpenedAt: true,
    },
  });
}
