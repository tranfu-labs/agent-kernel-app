# Lens: Financial Fact Integrity

## Trigger conditions

Use this lens for market data, exchange providers, funding/basis calculations, order book depth, opportunity scanning, artifacts, agent explanations, and any user-visible financial output.

## Purpose

Ensure financial facts come from provider-backed tools/services, preserve provenance, and degrade explicitly when data is unavailable.

## Checks

1. **Tool-backed facts:** Prices, funding rates, order book depth, volumes, open interest, and timestamps MUST come from tools/services/providers, not LLM prose.
2. **Provenance:** Outputs SHOULD preserve `source`, `provider`, `fetchedAt` or `observedAt`, `status`, `freshness`, and `warnings` where relevant.
3. **Structured failure:** Missing, stale, rate-limited, timeout, geo-blocked, unsupported, or provider-unavailable data MUST become structured status/warnings.
4. **No fabricated fallback:** Provider failure MUST NOT be replaced with mock facts in live paths.
5. **Normalization boundary:** Raw provider payloads MUST be normalized before reaching domain artifacts or agent-facing tools.
6. **Calculation transparency:** Edge, fee, slippage, and score outputs SHOULD include enough inputs or lineage to explain the result.
7. **Freshness:** User-visible opportunities SHOULD expose freshness or timestamp status.
8. **Warning propagation:** Provider warnings SHOULD flow into comparisons, signals, opportunities, and artifacts.

## Evidence to collect

Inspect:

```text
packages/tools/src/exchanges/providers/
packages/tools/src/exchanges/exchange-market-data-service.ts
packages/tools/src/exchanges/get-*.ts
packages/operations/src/
packages/domain/src/
apps/agent-api/src/smoke-*.ts
```

Run or inspect tests for provider normalization and failure mapping.

## Pass criteria

- User-visible financial facts are traceable to provider/service results.
- Failure states are structured.
- No live path fabricates facts.
- Artifacts and opportunities carry enough provenance for explanation.

## Fail / partial criteria

- **FAIL:** LLM is allowed to invent prices/funding/depth.
- **FAIL:** Live smoke succeeds with mock facts after provider failure.
- **FAIL:** Provider raw payload is exposed as primary agent-facing contract.
- **PARTIAL:** Facts are provider-backed but freshness/warnings are lost before artifact output.

## Bad examples

<bad-example>
"If Bitget is unavailable, use a hardcoded funding rate so the scan can continue."

WRONG. Return structured unavailable/partial status and warnings. Do not fabricate facts.
</bad-example>

<bad-example>
"The agent can estimate current funding from memory."

WRONG. Real-time financial facts must come from tools.
</bad-example>
