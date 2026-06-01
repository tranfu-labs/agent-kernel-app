# Funding-Basis Core-First Tasks

## Implementation tasks

- [ ] Add domain contracts for comparisons, signals, opportunity scoring, and artifact lineage.
- [ ] Add deterministic comparison, signal, scoring, and artifact helpers in `@agentkernel/operations`.
- [ ] Add `evaluateFundingBasisContexts` as the pure Energy-layer core.
- [ ] Add `scanFundingBasisArbitrage` as a thin dependency-injected wrapper.
- [ ] Add offline operation tests using fixture `MarketContext` objects.
- [ ] Add artifact lineage tests for saved opportunity artifacts.
- [ ] Export new domain and operation modules.
- [ ] Rewrite `docs/superpowers/plans/2026-05-30-funding-basis-arbitrage-mvp.md` so execution starts with this core-first slice.
- [ ] Run deterministic validation:
  - `npm run typecheck -w @agentkernel/domain`
  - `npm run test -w @agentkernel/operations`
  - `npm run typecheck -w @agentkernel/operations`
- [ ] Run safety scan:
  - `grep -RIn "place_order\|cancel_order\|get_positions\|get_account_balances\|apiKey\|secret\|leverage\|margin\|withdraw\|transfer" packages apps prism-docs`

## Deferred tasks

- [ ] Add Bitget public provider.
- [ ] Route Bitget through `ExchangeMarketDataService`.
- [ ] Add live read-only smoke.
- [ ] Register `scan_funding_basis_arbitrage` with Pi Agent.
- [ ] Update skill guidance after the operation is provider-backed.
- [ ] Archive the OpenSpec change only after implementation and verification are complete.

## Pause conditions

Pause and revise the design if:

- `@agentkernel/operations` needs to depend on `@agentkernel/tools` for the core slice.
- The operation wrapper starts owning scoring math.
- Tests require live network access.
- Any private/account/execution endpoint becomes necessary.
- Artifact lineage cannot preserve comparison IDs, signal IDs, calculation inputs, and warnings.
