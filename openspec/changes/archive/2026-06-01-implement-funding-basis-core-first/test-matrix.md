# Funding-Basis Core-First Test Matrix

| Layer | Test type | Purpose | Command or method | Persistent? | Owner |
|---|---|---|---|---:|---|
| Contract | Typecheck | Verify domain contract exports compile | `npm run typecheck -w @agentkernel/domain` | No | Generator/Evaluator |
| Pure core | Unit | Verify comparison, signal, scoring, and evaluation logic offline | `npm run test -w @agentkernel/operations -- funding-basis-core` | Yes | Generator |
| Wrapper | Integration | Verify wrapper calls injected context provider and artifact store | `npm run test -w @agentkernel/operations -- funding-basis-arbitrage` | Yes | Generator |
| Material | Unit/integration | Verify artifact IDs, comparison IDs, signal IDs, warnings, and calculation inputs are preserved | `npm run test -w @agentkernel/operations -- funding-basis-artifacts` | Yes | Generator |
| Regression | Package tests | Verify existing operations tests still pass | `npm run test -w @agentkernel/operations` | Mixed | Evaluator |
| Contract | Typecheck | Verify operation package compiles | `npm run typecheck -w @agentkernel/operations` | No | Evaluator |
| Safety | Static scan | Verify no private/account/execution capability introduced | `grep -RIn "place_order\|cancel_order\|get_positions\|get_account_balances\|apiKey\|secret\|leverage\|margin\|withdraw\|transfer" packages apps prism-docs` | No | Evaluator |
| Docs/spec | Consistency | Verify rewritten plan references core-first slice and defers provider/Pi work | Read plan/OpenSpec files | No | Evaluator |

## Environment assumptions

### Local deterministic

- No network.
- Fixture `MarketContext` objects only.
- Stable timestamps and IDs.
- Used for comparison, signal, scoring, operation, and artifact tests.

### Local integration

- In-memory fake context provider.
- In-memory fake artifact store implementing `ArtifactStoreLike`.
- No `@agentkernel/tools` dependency required by `@agentkernel/operations`.

### Live read-only

Not used in this slice. Live Binance/Bitget smoke is deferred.

### CI

- Typecheck.
- Operations tests.
- Static safety scan.

## Evaluator handoff

A PASS requires:

- Domain typecheck passes.
- Operations tests pass.
- Operation typecheck passes.
- Persistent tests exist for pure core, wrapper, and artifact lineage.
- No private/account/execution implementation path is introduced.

A PARTIAL verdict applies if implementation works but docs/plan remain out of sync or artifact lineage misses warnings/calculation inputs.

A FAIL verdict applies if the slice requires live network, imports tools into operations for artifact storage, fabricates financial facts, or introduces execution/private capability.
