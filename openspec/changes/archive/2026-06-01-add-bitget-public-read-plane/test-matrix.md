# Bitget Public Read Plane Test Matrix

| Layer | Test type | Purpose | Command or method | Persistent? | Owner |
|---|---|---|---|---:|---|
| Provider | Unit | Verify URL paths, params, and Bitget code handling with mocked fetch | `npm run test -w @agentkernel/tools -- bitget-usdt-futures-provider` | Yes | Generator |
| Service | Unit/integration | Verify Bitget payloads normalize into domain contracts | `npm run test -w @agentkernel/tools -- exchange-market-data-service` | Yes | Generator |
| Regression | Package tests | Verify existing tools tests still pass | `npm run test -w @agentkernel/tools` | Mixed | Evaluator |
| Contract | Typecheck | Verify tools package compiles | `npm run typecheck -w @agentkernel/tools` | No | Evaluator |
| Safety | Static scan | Verify no private/account/execution endpoints | `grep -RIn --exclude='*.tsbuildinfo' --exclude-dir='dist' --exclude-dir='node_modules' "place_order\|cancel_order\|get_positions\|get_account_balances\|apiKey\|secret\|leverage\|margin\|withdraw\|transfer" packages apps prism-docs` | No | Evaluator |

## Environment assumptions

- Local deterministic tests only.
- No live Bitget calls.
- No credentials.
- Public endpoint paths only.

## PASS criteria

- Provider tests pass.
- Service normalization tests pass.
- Full tools tests pass.
- Tools typecheck passes.
- Safety scan has no new private/account/execution implementation matches.
