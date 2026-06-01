# Provider-Backed Funding-Basis Smoke Test Matrix

| Layer | Test type | Purpose | Command or method | Persistent? | Owner |
|---|---|---|---|---:|---|
| Operations | Regression | Existing funding-basis core/wrapper tests still pass | `npm run test -w @agentkernel/operations` | Yes | Generator/Evaluator |
| Tools | Regression | Existing Binance/Bitget normalization tests still pass | `npm run test -w @agentkernel/tools` | Yes | Generator/Evaluator |
| Contract | Typecheck | Verify package wiring compiles | `npm run typecheck` | No | Evaluator |
| Smoke | Live read-only | Verify provider-backed context can feed funding-basis operation | `npm run smoke:funding-basis-provider` | No | Evaluator |
| Safety | Static scan | Verify no private/account/execution endpoint introduced | `grep -RIn --exclude='*.tsbuildinfo' --exclude-dir='dist' --exclude-dir='node_modules' "place_order\|cancel_order\|get_positions\|get_account_balances\|apiKey\|secret\|leverage\|margin\|withdraw\|transfer" packages apps prism-docs` | No | Evaluator |

## PASS criteria

- Offline operations/tools tests pass.
- Root typecheck passes.
- Live smoke returns structured JSON or documents provider/network blocker.
- Safety scan shows no new private/account/execution implementation path.
