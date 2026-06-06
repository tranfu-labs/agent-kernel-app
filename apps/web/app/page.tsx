import { ChatPanel } from "../components/chat-panel";
import { WorkspaceSidebar } from "../components/workspace-sidebar";
import { getWorkspaceData, LOCAL_USER_ID } from "../lib/db/workspace-sessions";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ session?: string | string[] }>;
}) {
  const params = await searchParams;
  const requestedSession = Array.isArray(params?.session) ? params.session[0] : params?.session;
  const data = await getWorkspaceData(LOCAL_USER_ID, requestedSession);

  return (
    <main className="ak-page">
      <WorkspaceSidebar
        projectTitle={data.project.title}
        sessions={data.sessions}
        activeSessionId={data.activeSession.id}
      />
      <ChatPanel sessionId={data.activeSession.id} threadId={data.activeSession.copilotThreadId} />
    </main>
  );
}
