# Test Matrix

## Goal

Prove that `scan_funding_basis_arbitrage` is exposed as a read-only Pi Agent/API tool and preserves the tested Binance/Bitget funding-basis workflow.

## Matrix

| Area | Scenario | Expected Result | Test Type |
|---|---|---|---|
| Copilot guidance | Ordinary Binance/Bitget request | Resolves to `cross_venue_funding_basis`, defaults, and `scan_funding_basis_arbitrage` | deterministic/unit + smoke |
| Copilot guidance | High-risk or execution-shaped request | Resolves to read-only ask-first behavior | deterministic/unit + smoke |
| Extension boundary | Polymarket/A-share/spot-perp request | Resolves to extension-required and does not prefer the funding scanner | deterministic/unit + smoke |
| Tool registry | createPrismToolDefinitions includes `scan_funding_basis_arbitrage` | Tool appears with read-only schema and prompt guidance | deterministic/unit or smoke |
| Tool schema | Inputs include venues, symbols, marketType, estimatedFeeBps, targetNotionalUsd, saveArtifacts | No credential/account/order/execution fields | static/manual + safety scan |
| Context provider | Tool fetches one MarketContext per venue/symbol | Uses `ExchangeMarketDataService.getMarketContext`, not raw providers | code review/test |
| Operation output | Valid contexts | Returns comparisons, signals, opportunities, opportunity cards, summary | deterministic/unit or smoke |
| Missing funding | Provider returns no current funding | No signal/opportunity/artifact; warnings surfaced | smoke/test |
| Artifact saving | saveArtifacts=false | No artifact IDs | smoke/test |
| Artifact saving | saveArtifacts=true and opportunity exists | Artifact saved via `ctx.artifactStore.save` | deterministic/unit later |
| Network degradation | Live provider failure | partial/failed status acceptable; no fabricated facts | live smoke |
| Boundary | `@agentkernel/operations` imports | No `@agentkernel/tools` dependency | static grep |
| Safety | Repo scan | No new private/account/execution implementation | static grep |

## Required Commands

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/agent-kernel
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/tools
npm --prefix "/Users/griffith/Projects/Prism" run typecheck
npm --prefix "/Users/griffith/Projects/Prism" run smoke:funding-basis-copilot
npm --prefix "/Users/griffith/Projects/Prism" run smoke:funding-basis-provider
npm --prefix "/Users/griffith/Projects/Prism" run smoke:funding-basis-tool
grep -RIn --exclude='*.tsbuildinfo' --exclude-dir='dist' --exclude-dir='node_modules' "place_order\|cancel_order\|get_positions\|get_account_balances\|apiKey\|secret\|leverage\|margin\|withdraw\|transfer" "/Users/griffith/Projects/Prism/packages" "/Users/griffith/Projects/Prism/apps" "/Users/griffith/Projects/Prism/prism-docs"
```

## Requirement-to-Evidence Map

| Requirement | Evidence |
|---|---|
| Ordinary Binance/Bitget requests prefer scanner defaults | Agent-kernel guidance tests and copilot smoke verify default resolution. |
| High-risk requests stay read-only and ask first | Agent-kernel guidance tests and copilot smoke verify ask-first resolution. |
| Future verticals are extension-required | Agent-kernel guidance tests and copilot smoke verify Polymarket/A-share handling. |
| Tool is registered as `scan_funding_basis_arbitrage` | Tool registry smoke executes the registered tool path. |
| Tool schema remains read-only | Static/manual schema inspection plus safety scan for private/account/execution fields. |
| Agent-kernel uses stable service/operation APIs | Code review/static scan confirms `ExchangeMarketDataService.getMarketContext` and `scanFundingBasisArbitrage` are used, not raw provider classes. |
| `@agentkernel/operations` remains provider-agnostic | Static import scan confirms no `@agentkernel/tools` import from `packages/operations`. |
| Opportunity cards expose assumptions and lineage pointers | Operations card/scanner tests and tool smoke verify cards align with opportunities/artifact IDs. |
| Missing funding creates no opportunities, cards, or artifacts | Operations regression tests and tool smoke assertion cover no-opportunity/no-card/no-artifact behavior. |
| Live provider failure degrades visibly | Provider/tool smokes may return partial only with explicit warnings/status and no fabricated facts. |
| Artifact saving uses operation artifact path | Operation artifact tests and tool smoke verify artifact IDs only appear when opportunities exist. |

## Acceptance Rules

- Typecheck passes.
- Existing deterministic package tests pass.
- New tool smoke executes and returns structured JSON.
- Live partial status is acceptable only when warnings are explicit and no opportunities/artifacts are fabricated from missing facts.
- Safety scan finds no new private/account/execution implementation.
- Each success criterion has a matching evidence source in the requirement-to-evidence map.
