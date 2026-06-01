# Lens: Network Degradation

Use this lens when work touches live providers, smoke scripts, market-data fetching, or any path that can fail because of network/provider availability.

## Goal

Network or provider failure must not block deterministic development, and missing live facts must never be converted into fabricated opportunities, artifacts, or reports.

## Required behavior

- Deterministic unit/integration tests do not require live network.
- Provider failures return structured status and warnings.
- Partial live data is visible in outputs.
- Missing funding, price, depth, source, or freshness facts degrade explicitly.
- Missing required facts do not create opportunities or artifacts as if facts existed.

## Acceptable partial smoke

A live smoke with `partial` status can be acceptable when all are true:

```text
- deterministic tests pass
- provider failure is surfaced as status/warnings
- opportunity count is zero when required facts are missing
- artifact count is zero when no opportunity exists
- output makes the degradation visible to operators
```

## Failure patterns

- A smoke passes while provider data is missing and opportunities are still produced.
- Missing funding rate becomes `0` without warning.
- Missing price/depth/freshness is treated as a real fact.
- Provider errors are swallowed or collapsed into generic success.
- Live network is the only way to test core opportunity logic.
- Artifact saving occurs for incomplete or fabricated opportunities.

## Evidence to request

- Unit tests for missing-fact behavior.
- Integration tests with fake failing providers.
- Smoke script output for provider-backed path.
- Checks that artifacts are only saved for real opportunities.
- Warning/status fields in tool and operation outputs.
