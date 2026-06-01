# Test Matrix

## Goal

Prove `explain_opportunity_artifact` explains saved opportunity artifacts offline, preserves lineage/warnings/score facts, and stays read-only.

## Matrix

| Area | Scenario | Expected Result | Test Type |
|---|---|---|---|
| Storage | Saved artifact can be read by ID | `MemoryArtifactStore.get(id)` returns saved artifact | deterministic/unit |
| Pure operation | Valid opportunity artifact | `status = "ok"`, metrics/legs/lineage/warnings preserved | deterministic/unit |
| Missing artifact | Store miss | `status = "not_found"` and follow-up suggests rerun/provide valid ID | deterministic/unit + smoke |
| Unsupported artifact | Non-opportunity artifact | `status = "unsupported_artifact_type"` | deterministic/unit |
| Invalid content | Opportunity artifact content is not object-shaped | `status = "invalid_artifact"` | deterministic/unit |
| Partial lineage | Missing comparison/signal/evidence/market context IDs | Explanation succeeds with explicit missing-lineage warnings | deterministic/unit |
| Missing score | Opportunity has no score | Explanation succeeds and states score unavailable | deterministic/unit |
| Tool contract | Registered schema | `explain_opportunity_artifact` schema includes only `artifactId` | deterministic/unit |
| Smoke | Runtime context saved fixture | Registered tool reads artifact and returns explanation | app smoke |
| Safety | Boundary and static scan | Read-only text present; no execution/private fields introduced | deterministic + static scan |

## Required Commands

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/storage
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/agent-kernel
npm --prefix "/Users/griffith/Projects/Prism" run typecheck
npm --prefix "/Users/griffith/Projects/Prism" run smoke:opportunity-explanation
grep -RIn --exclude='*.tsbuildinfo' --exclude-dir='dist' --exclude-dir='node_modules' "place_order\|cancel_order\|get_positions\|get_account_balances\|apiKey\|secret\|leverage\|margin\|withdraw\|transfer" "/Users/griffith/Projects/Prism/packages" "/Users/griffith/Projects/Prism/apps" "/Users/griffith/Projects/Prism/prism-docs"
```

## Acceptance Rules

- Typecheck passes.
- Storage, operations, and agent-kernel deterministic tests pass.
- Smoke executes through the registered tool path.
- No live market data is fetched by default.
- Safety scan finds no new private/account/execution implementation.
