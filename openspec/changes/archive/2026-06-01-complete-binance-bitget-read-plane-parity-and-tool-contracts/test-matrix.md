# Test Matrix

## Goal

Prove that Binance and Bitget public read-plane data can safely feed the funding-basis MVP through normalized Prism contracts and read-only tools.

Live network availability is not required for deterministic correctness. Live smoke verifies structured degradation and may return partial/failed status.

## Matrix

| Area | Scenario | Expected Result | Test Type |
|---|---|---|---|
| MarketContext parity | Binance fixture has market, ticker, funding.current, depth | Context has common minimum fields and `status=ok` | deterministic unit |
| MarketContext parity | Bitget fixture has market, ticker, funding.current, depth | Context has common minimum fields and `status=ok` | deterministic unit |
| Funding-basis workflow | Binance funding higher than Bitget | comparison + signal + opportunity; short Binance, long Bitget | deterministic operation |
| Funding-basis workflow | Bitget funding higher than Binance | comparison + signal + opportunity; short Bitget, long Binance | deterministic operation |
| Financial fact integrity | Binance funding.current missing | comparison warning; no signal; no opportunity; no artifact | deterministic operation |
| Financial fact integrity | Bitget funding.current missing | comparison warning; no signal; no opportunity; no artifact | deterministic operation |
| Liquidity degradation | depth missing on one or both venues | no fabricated slippage; liquidity/scoring degrades explicitly | deterministic operation/service |
| Provider failure | provider result failed/rate_limited/geo_blocked | status/warnings preserved; no fabricated facts | deterministic service |
| Depth safeguards | symbols exceed maxSymbolsForDepth | depth skipped warning; no unsafe full-universe depth scan | deterministic service |
| Tool contract | get_exchange_markets valid input | read-only markets output with status/warnings | tool/unit or smoke |
| Tool contract | get_exchange_tickers valid input | read-only ticker output with provider/source/status/warnings | tool/unit or smoke |
| Tool contract | get_funding_rates valid input | read-only funding output with provider/source/status/warnings | tool/unit or smoke |
| Tool contract | get_orderbook_depth valid input | read-only depth/slippage output with status/warnings | tool/unit or smoke |
| Tool contract | get_market_context valid input | MarketContext[] output with status/warnings/fetchedAt | tool/unit or smoke |
| Tool contract | unsupported venue or market type | structured unsupported status and warnings, no crash | tool/unit |
| Tool safety | tool input contracts | no apiKey/secret/account/order/leverage/margin/transfer/withdrawal fields | static inspection |
| Provider boundary | package dependencies/imports | `@agentkernel/operations` does not import `@agentkernel/tools` | static inspection |
| Artifact lineage | valid opportunity saved | artifact has opportunityIds, comparisonIds, signalIds, createdBy, contentJson | deterministic operation |
| Live smoke | provider-backed Binance/Bitget scan | `ok` or `partial`; no fabricated facts; no opportunities if current funding missing | live smoke |
| Safety scan | repo grep for execution/private patterns | no new implementation paths, only docs/deny lists if matched | static scan |

## Required Commands

```bash
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations
npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/tools
npm --prefix "/Users/griffith/Projects/Prism" run typecheck
npm --prefix "/Users/griffith/Projects/Prism" run smoke:funding-basis-provider
grep -RIn --exclude='*.tsbuildinfo' --exclude-dir='dist' --exclude-dir='node_modules' "place_order\|cancel_order\|get_positions\|get_account_balances\|apiKey\|secret\|leverage\|margin\|withdraw\|transfer" "/Users/griffith/Projects/Prism/packages" "/Users/griffith/Projects/Prism/apps" "/Users/griffith/Projects/Prism/prism-docs"
```

## Acceptance Rules

- Deterministic tests must pass.
- Typecheck must pass.
- Live smoke may be `partial` or `failed` only when failures are structured and no opportunities/artifacts are fabricated from missing facts.
- Safety scan must not reveal new private/account/execution implementation.
- Any missing current funding fact must block signal/opportunity/artifact generation.
- `@agentkernel/operations` must remain provider-agnostic.
