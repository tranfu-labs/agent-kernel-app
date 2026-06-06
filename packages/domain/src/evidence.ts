export type EvidenceSourceType =
  | "web"
  | "official"
  | "document"
  | "database"
  | "api"
  | "user"
  | "calculation"
  | (string & {});

export type EvidenceTrustLevel = "low" | "medium" | "high" | "official";

export interface EvidenceRecord<TContent = unknown> {
  id: string;
  sourceType: EvidenceSourceType;
  sourceName: string;
  url?: string;
  provider?: string;
  observedAt: string;
  fetchedAt: string;
  freshnessMs?: number;
  trustLevel: EvidenceTrustLevel;
  content: TContent;
  summary?: string;
}

export interface EvidenceBundle {
  id: string;
  records: EvidenceRecord[];
  coverage: string[];
  gaps: string[];
  createdAt: string;
}
