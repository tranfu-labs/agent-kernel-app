# Add Provider-Backed Funding-Basis Smoke

## What changes

Add a read-only vertical smoke that wires provider-backed Binance and Bitget `MarketContext` outputs into the existing `scanFundingBasisArbitrage` operation.

This slice validates the first real Information -> Energy -> Material path without Pi Agent registration:

```text
ExchangeMarketDataService
  -> Binance + Bitget MarketContext
  -> scanFundingBasisArbitrage
  -> Opportunity candidates
  -> optional in-memory OpportunityArtifacts
```

## Why now

The funding-basis core is validated offline and Bitget public read-plane normalization is implemented. The next slice should prove the two pieces work together with provider-backed public facts before exposing the operation to Pi Agent.

## In scope

- Add an adapter from `ExchangeMarketDataService.getMarketContext` to `FundingBasisContextProvider`.
- Add a read-only smoke entrypoint in `apps/agent-api`.
- Add npm smoke scripts.
- Allow provider failures to degrade with structured statuses and warnings.
- Keep artifact saving in-memory for smoke validation.
- Run build/typecheck/tests/safety scan.

## Out of scope

- Pi Agent tool registration.
- Agent prompt/skill updates.
- Persistent artifact storage.
- Private exchange APIs.
- Account data, balances, positions, orders, leverage, margin, transfers, withdrawals, or execution.

## Affected planes

- **Information:** provider-backed Binance/Bitget public market contexts.
- **Energy:** existing deterministic funding-basis operation.
- **Material:** in-memory opportunity artifacts from existing operation artifact creation.

## Affected packages

- `packages/operations`
- `apps/agent-api`
- root package scripts

## Acceptance criteria

- Smoke script builds.
- Smoke script returns JSON with status, summary, opportunity count, artifact IDs, and warnings.
- Provider-unavailable/rate-limited/geo-blocked outcomes are accepted if explicit and non-fabricated.
- Existing operations/tools tests pass.
- Root typecheck passes.
- Safety scan shows no new private/account/execution implementation path.
