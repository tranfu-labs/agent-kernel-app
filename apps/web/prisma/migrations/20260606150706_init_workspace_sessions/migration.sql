-- CreateTable
CREATE TABLE "workspace_projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "workspace_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "copilot_thread_id" TEXT NOT NULL,
    "last_opened_at" DATETIME,
    "last_message_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "workspace_sessions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "workspace_projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "workspace_projects_user_id_updated_at_idx" ON "workspace_projects"("user_id", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_sessions_copilot_thread_id_key" ON "workspace_sessions"("copilot_thread_id");

-- CreateIndex
CREATE INDEX "workspace_sessions_user_id_project_id_updated_at_idx" ON "workspace_sessions"("user_id", "project_id", "updated_at");

-- CreateIndex
CREATE INDEX "workspace_sessions_user_id_last_opened_at_idx" ON "workspace_sessions"("user_id", "last_opened_at");
