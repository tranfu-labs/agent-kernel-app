export const ARTIFACT_FAMILY_TYPES = [
  "research_brief",
  "method_artifact",
  "source_snapshot",
  "comparison_artifact",
  "run_summary",
  "research_report",
  "monitor_definition",
  "workflow_artifact",
] as const;

export const RESEARCH_LAYER_FORBIDDEN_FIELDS = [
  "apiKey",
  "secret",
  "account",
  "password",
  "privateKey",
  "accessToken",
  "refreshToken",
  "sessionCookie",
] as const;

export type ArtifactType =
  | "research_brief"
  | "comparison_report"
  | "workflow_summary"
  | "agent_run"
  | (typeof ARTIFACT_FAMILY_TYPES)[number]
  // Open the type so a vertical can introduce a new artifact type without editing `domain`.
  // Known literals above are retained for editor autocomplete and generic tooling.
  // eslint-disable-next-line @typescript-eslint/ban-types
  | (string & {});

export type ArtifactCreatedBy = "operation" | "agent" | "user" | "system";

export interface Artifact<TContent = unknown> {
  id: string;
  type: ArtifactType;
  title: string;
  objectIds: string[];
  sourceIds?: string[];
  comparisonIds?: string[];
  runIds?: string[];
  sessionIds?: string[];
  createdBy?: ArtifactCreatedBy;
  contentMarkdown?: string;
  contentJson: TContent;
  createdAt: string;
  updatedAt: string;
}
