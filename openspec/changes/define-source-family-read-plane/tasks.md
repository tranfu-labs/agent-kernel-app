## Blueprint slice: source-family read-plane architecture

Completed in this slice now:

- [x] Write proposal for a Prism-owned source-family read-plane blueprint.
- [x] Write design for source families, capability registry, fact envelope, read gateway, and package boundaries.
- [x] Write test matrix for blueprint acceptance and later implementation verification targets.

Acceptance for this slice now:

- [x] The blueprint explicitly rejects one-function-per-source growth.
- [x] The blueprint explicitly rejects a fake universal cross-market payload schema.
- [x] The blueprint keeps provider adapters replaceable and product semantics in Prism.
- [x] The blueprint defines staged adoption from current exchange code to a generalized source plane.

## Immediate implementation slice later (narrowed proving slice)

Completed in the first implementation slice now:

- [x] Extract minimal source descriptor / capability / fact-envelope contracts into `@agentkernel/domain` for `venue_market_data` only.
- [x] Add a minimal `venue_market_data` registry/query service in `@agentkernel/tools` backed by the current Binance/Bitget exchange service.
- [x] Route only `getMarketContext()` through that new family service.
- [x] Preserve all existing funding-basis operation logic and current agent-visible tool names/schemas.
- [x] Add focused parity tests proving `getMarketContext()` behavior is unchanged while envelopes/registry now exist.

## Later implementation slices after the proving slice

- [ ] Route the rest of the low-level exchange tools through the family gateway.
- [ ] Add structured degradation semantics and coverage maps to market-data outputs.
- [ ] Add connector admission rules and auth-family boundaries.
- [ ] Add one second non-crypto source family sample (preferred: event/prediction-market family).
- [ ] Introduce a broader shared read-plane gateway across families.
- [ ] Revisit operation-level routing only after the first family seam is proven.

## Future verification later

These checks belong to later implementation slices, not this blueprint-only task:

- [ ] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/domain` for source-plane contract tests.
- [ ] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/tools` for adapter/gateway tests.
- [ ] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations` for operation/provider-agnostic integration.
- [ ] Run `npm --prefix "/Users/griffith/Projects/Prism" run typecheck`.
- [ ] Run exchange-family smokes under degraded provider conditions.
- [ ] Run one second-family sample smoke proving non-exchange semantics fit the same outer contracts.
