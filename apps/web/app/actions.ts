"use server";

import { redirect } from "next/navigation";

import { createWorkspaceSession, ensureDefaultWorkspace, LOCAL_USER_ID } from "../lib/db/workspace-sessions";

export async function createSessionAction() {
  const { project } = await ensureDefaultWorkspace(LOCAL_USER_ID);
  const session = await createWorkspaceSession(LOCAL_USER_ID, {
    projectId: project.id,
    title: "New discussion",
  });
  redirect(`/?session=${encodeURIComponent(session.id)}`);
}
