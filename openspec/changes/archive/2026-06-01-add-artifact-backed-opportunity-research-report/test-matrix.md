# Test Matrix

## Goal

Prove `generate_opportunity_research_report` generates deterministic artifact-backed reports and stays read-only.

## Matrix

| Area | Scenario | Expected Result | Test Type |
|---|---|---|---|
| Pure operation | Valid opportunity artifact | `status = "ok"`, report sections and markdown generated | deterministic/unit |
| Missing artifact | Store miss | `status = "not_found"` | deterministic/unit + smoke |
| Unsupported artifact | Non-opportunity artifact | `status = "unsupported_artifact_type"` | deterministic/unit |
| Invalid content | Invalid opportunity content | `status = "invalid_artifact"` | deterministic/unit |
| Safety | Report boundary | Read-only text present; no execution instructions | deterministic/unit |
| Tool contract | Registered schema | Only `artifactId` | deterministic/unit |
| Smoke | Runtime fixture | Registered tool reads artifact and returns report | app smoke |

## Required Commands

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/agent-kernel
npm --prefix "/Users/griffith/Projects/Prism" run typecheck
npm --prefix "/Users/griffith/Projects/Prism" run smoke:opportunity-research-report
grep -RIn --exclude='*.tsbuildinfo' --exclude-dir='dist' --exclude-dir='node_modules' "place_order\|cancel_order\|get_positions\|get_account_balances\|apiKey\|secret\|leverage\|margin\|withdraw\|transfer" "/Users/griffith/Projects/Prism/packages" "/Users/griffith/Projects/Prism/apps" "/Users/griffith/Projects/Prism/prism-docs"
```
