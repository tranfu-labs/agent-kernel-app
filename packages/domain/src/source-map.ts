export type SourceRole = "official" | "market" | "rules" | "news" | "context";
export type SourceTrustLevel = "high" | "medium" | "low" | "unknown";
export type SourceStatus = "ok" | "degraded" | "missing";

export interface SourceEntry {
  id: string;
  type: string;
  role: SourceRole;
  trustLevel: SourceTrustLevel;
  freshness: string;
  status: SourceStatus;
  lastCheckedAt?: string;
  notes?: string;
}

export interface SourceMap {
  entries: SourceEntry[];
}
