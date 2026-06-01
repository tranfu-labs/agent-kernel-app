export type FetchStatus =
  | "ok"
  | "partial"
  | "empty"
  | "failed"
  | "skipped"
  | "timeout"
  | "rate_limited"
  | "geo_blocked"
  | "unsupported";

export interface AdapterFetchResult<TPayload = unknown> {
  status: FetchStatus;
  provider: string;
  source: string;
  payload?: TPayload;
  reason?: string;
  warnings: string[];
  observedAt?: string;
  fetchedAt: string;
  freshnessMs?: number;
  elapsedMs?: number;
  requestWeight?: number;
}
