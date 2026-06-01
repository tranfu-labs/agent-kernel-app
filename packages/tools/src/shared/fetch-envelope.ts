import type { AdapterFetchResult, FetchStatus } from "@agentkernel/domain";

export interface FetchEnvelopeOptions {
  provider: string;
  source: string;
  requestWeight?: number;
  timeoutMs?: number;
  observedAt?: string;
}

export class ProviderFetchError extends Error {
  constructor(
    message: string,
    readonly status: FetchStatus = "failed",
  ) {
    super(message);
  }
}

export async function providerFetchErrorFromResponse(response: Response, providerName: string): Promise<ProviderFetchError> {
  const body = await response.text().catch(() => "");
  const status = mapHttpResponseToFetchStatus(response.status, body);
  return new ProviderFetchError(
    `${providerName} request failed with HTTP ${response.status}.`,
    status,
  );
}

export async function withFetchEnvelope<TPayload>(
  options: FetchEnvelopeOptions,
  fetcher: (signal: AbortSignal) => Promise<TPayload>,
): Promise<AdapterFetchResult<TPayload>> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = options.timeoutMs === undefined
    ? undefined
    : setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const payload = await fetcher(controller.signal);
    const fetchedAt = new Date().toISOString();
    return {
      status: "ok",
      provider: options.provider,
      source: options.source,
      payload,
      warnings: [],
      observedAt: options.observedAt,
      fetchedAt,
      freshnessMs: options.observedAt ? Date.parse(fetchedAt) - Date.parse(options.observedAt) : undefined,
      elapsedMs: Date.now() - startedAt,
      requestWeight: options.requestWeight,
    };
  } catch (error) {
    const status = mapProviderErrorStatus(error);
    return {
      status,
      provider: options.provider,
      source: options.source,
      reason: error instanceof Error ? error.message : "Unknown provider error.",
      warnings: [status],
      observedAt: options.observedAt,
      fetchedAt: new Date().toISOString(),
      elapsedMs: Date.now() - startedAt,
      requestWeight: options.requestWeight,
    };
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}

export function mapHttpStatusToFetchStatus(statusCode: number): FetchStatus {
  return mapHttpResponseToFetchStatus(statusCode);
}

export function mapHttpResponseToFetchStatus(statusCode: number, body = ""): FetchStatus {
  if (statusCode === 418 || statusCode === 429) return "rate_limited";
  if (statusCode === 451) return "geo_blocked";
  if (statusCode === 403 && isRestrictedLocationBody(body)) return "geo_blocked";
  if (statusCode >= 500) return "failed";
  if (statusCode >= 400) return "failed";
  return "ok";
}

function mapProviderErrorStatus(error: unknown): FetchStatus {
  if (error instanceof ProviderFetchError) return error.status;
  if (error instanceof DOMException && error.name === "AbortError") return "timeout";
  if (error instanceof Error && error.name === "AbortError") return "timeout";
  return "failed";
}

function isRestrictedLocationBody(body: string): boolean {
  const normalized = body.toLowerCase();
  return normalized.includes("restricted location")
    || normalized.includes("service unavailable in a restricted location")
    || normalized.includes("eligibility");
}
