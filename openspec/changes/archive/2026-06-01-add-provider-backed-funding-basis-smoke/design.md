# Provider-Backed Funding-Basis Smoke Design

## Current context

Slice 1 added `scanFundingBasisArbitrage` with an injected `FundingBasisContextProvider`. Slice 2 added Bitget normalization to `ExchangeMarketDataService`. This slice bridges those pieces with a live read-only smoke.

## Alternatives considered

### Option A: Register Pi Agent tool now

Expose `scan_funding_basis_arbitrage` to Pi Agent and test via agent session.

- Pros: closer to product runtime.
- Cons: mixes operation/tool registration with provider-backed vertical validation.

### Option B: Add direct operation smoke first

Call `scanFundingBasisArbitrage` directly with an adapter around `ExchangeMarketDataService`.

- Pros: smallest vertical proof; isolates provider+operation behavior before agent runtime.
- Cons: not yet usable by Pi Agent.

### Option C: Add live provider smoke only

Test Binance/Bitget contexts separately without invoking funding-basis operation.

- Pros: narrower.
- Cons: does not prove Information -> Energy -> Material wiring.

## Recommended design

Use Option B. Add a direct smoke in `apps/agent-api/src/smoke-funding-basis-provider.ts`.

## Data flow

```text
ExchangeMarketDataService.getMarketContext({ venue, symbols, include: market/ticker/funding/depth })
  -> first context for requested venue/symbol
  -> scanFundingBasisArbitrage({ contextProvider, artifactStore })
  -> JSON summary
```

## Failure behavior

- The smoke should not fabricate facts.
- If one provider is unavailable, output can be `partial` or `failed` with warnings.
- A failed smoke process is acceptable only when the operation cannot return structured output; normal provider unavailability should be represented in JSON.

## Safety

The smoke uses public market data only. It does not create credentials, private clients, account methods, execution methods, or persistent orders.
