-- CreateTable
CREATE TABLE "workspace_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "copilot_thread_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'final',
    "source" TEXT NOT NULL DEFAULT 'copilotkit',
    "run_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workspace_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "workspace_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agent_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "copilot_thread_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "model" TEXT,
    "user_message_id" TEXT,
    "assistant_message_id" TEXT,
    "error_code" TEXT,
    "error_message" TEXT,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" DATETIME,
    CONSTRAINT "agent_runs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "workspace_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_workspace_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "model" TEXT NOT NULL DEFAULT 'gpt-5.5',
    "copilot_thread_id" TEXT NOT NULL,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "last_opened_at" DATETIME,
    "last_message_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "workspace_sessions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "workspace_projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_workspace_sessions" ("copilot_thread_id", "created_at", "id", "last_message_at", "last_opened_at", "project_id", "status", "title", "updated_at", "user_id") SELECT "copilot_thread_id", "created_at", "id", "last_message_at", "last_opened_at", "project_id", "status", "title", "updated_at", "user_id" FROM "workspace_sessions";
DROP TABLE "workspace_sessions";
ALTER TABLE "new_workspace_sessions" RENAME TO "workspace_sessions";
CREATE UNIQUE INDEX "workspace_sessions_copilot_thread_id_key" ON "workspace_sessions"("copilot_thread_id");
CREATE INDEX "workspace_sessions_user_id_project_id_updated_at_idx" ON "workspace_sessions"("user_id", "project_id", "updated_at");
CREATE INDEX "workspace_sessions_user_id_last_opened_at_idx" ON "workspace_sessions"("user_id", "last_opened_at");
CREATE INDEX "workspace_sessions_user_id_last_message_at_idx" ON "workspace_sessions"("user_id", "last_message_at");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "workspace_messages_user_id_session_id_created_at_idx" ON "workspace_messages"("user_id", "session_id", "created_at");

-- CreateIndex
CREATE INDEX "workspace_messages_copilot_thread_id_created_at_idx" ON "workspace_messages"("copilot_thread_id", "created_at");

-- CreateIndex
CREATE INDEX "workspace_messages_run_id_idx" ON "workspace_messages"("run_id");

-- CreateIndex
CREATE INDEX "agent_runs_user_id_session_id_started_at_idx" ON "agent_runs"("user_id", "session_id", "started_at");

-- CreateIndex
CREATE INDEX "agent_runs_copilot_thread_id_started_at_idx" ON "agent_runs"("copilot_thread_id", "started_at");

-- CreateIndex
CREATE INDEX "agent_runs_status_started_at_idx" ON "agent_runs"("status", "started_at");
