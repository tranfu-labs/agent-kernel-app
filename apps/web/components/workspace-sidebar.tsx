import Link from "next/link";

import { createSessionAction } from "../app/actions";
import type { WorkspaceSessionSummary } from "../lib/db/workspace-sessions";

export function WorkspaceSidebar({
  projectTitle,
  sessions,
  activeSessionId,
}: {
  projectTitle: string;
  sessions: WorkspaceSessionSummary[];
  activeSessionId: string;
}) {
  return (
    <aside className="ak-sidebar" aria-label="Workspace sessions">
      <div className="ak-sidebar__header">
        <div className="ak-sidebar__brand">
          <span className="ak-sidebar__logo">AK</span>
          <span>{projectTitle}</span>
        </div>
        <form action={createSessionAction}>
          <button className="ak-sidebar__new" type="submit">
            <span aria-hidden="true">+</span>
            <span>New chat</span>
          </button>
        </form>
      </div>

      <nav className="ak-sidebar__sessions" aria-label="Discussion sessions">
        <div className="ak-sidebar__section-title">Recent</div>
        <div className="ak-session-list">
          {sessions.map((session) => {
            const active = session.id === activeSessionId;
            return (
              <Link
                key={session.id}
                href={`/?session=${encodeURIComponent(session.id)}`}
                className={`ak-session ${active ? "ak-session--active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <span className="ak-session__title">{session.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="ak-sidebar__footer">
        <div className="ak-sidebar__account">
          <span className="ak-sidebar__avatar">AK</span>
          <span>
            <span className="ak-sidebar__account-name">griffith kk</span>
            <span className="ak-sidebar__account-plan">Local workspace</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
