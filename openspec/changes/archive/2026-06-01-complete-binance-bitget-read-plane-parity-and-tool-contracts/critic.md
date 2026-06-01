# Critic Review

## Verdict

REVISE before implementation unless the scope remains strictly focused on parity, read-only tool contracts, and deterministic tests.

## Findings

```json
{
  "verdict": "REVISE",
  "findings": [
    {
      "severity": "major",
      "area": "scope",
      "issue": "The work could drift into the broader Binance endpoint expansion already described in expand-binance-public-market-data-coverage.",
      "why_it_matters": "Adding klines, positioning, or microstructure now would delay the funding-basis MVP and add domain contracts before the first cross-venue loop is stable.",
      "recommendation": "Limit this change to Binance/Bitget common minimum MarketContext, read-only tool contracts, and funding-basis workflow verification. Defer market series, positioning, and microstructure."
    },
    {
      "severity": "major",
      "area": "architecture",
      "issue": "Direct Pi Agent integration before tool contract parity could stabilize a weak or inconsistent market-data contract.",
      "why_it_matters": "Pi Agent should consume stable Prism tools, not raw provider quirks or temporary wrappers.",
      "recommendation": "Add parity and tool contract tests first, then perform Agent/API smoke through the stable tool surface."
    },
    {
      "severity": "critical",
      "area": "financial_fact_integrity",
      "issue": "Provider failures or missing funding facts must not create opportunities.",
      "why_it_matters": "Generating opportunities from absent facts violates Prism's provider-backed fact principle and can mislead downstream decisions.",
      "recommendation": "Require deterministic tests for missing Binance funding and missing Bitget funding. Both must produce warnings but no signal, opportunity, or artifact."
    },
    {
      "severity": "major",
      "area": "provider_boundary",
      "issue": "The operation layer might become coupled to provider/service implementation details while completing the workflow.",
      "why_it_matters": "Operations should remain pure over domain contracts so they are testable offline and reusable across providers.",
      "recommendation": "Keep @agentkernel/operations dependent only on @agentkernel/domain. Compose ExchangeMarketDataService from app/tool layers."
    },
    {
      "severity": "major",
      "area": "testability",
      "issue": "Live smoke can fail due to timeout, geo-block, or exchange availability.",
      "why_it_matters": "If deterministic tests depend on live network, local development becomes blocked by environment instead of correctness.",
      "recommendation": "Make deterministic fixture tests the gating proof. Treat live smoke as degradation verification where partial/failed is acceptable if structured and safe."
    },
    {
      "severity": "critical",
      "area": "safety",
      "issue": "Read-plane and tool work must not introduce private credentials or execution-shaped inputs.",
      "why_it_matters": "The MVP explicitly excludes account/execution capability until governance, risk checks, confirmation, audit, and kill switch exist.",
      "recommendation": "Add a safety scan and inspect tool input contracts for apiKey, secret, balances, positions, orders, leverage, margin, transfer, and withdrawal fields."
    }
  ]
}
```

## Rebuttal / Decisions

### Finding: Scope drift into broad Binance expansion

Decision: accept.

Implementation will exclude market series, positioning ratios, recent trades, aggregate trades, microstructure, and new analytics inputs. Those stay in the existing broad Binance expansion change for later.

### Finding: Direct Pi Agent integration before contract parity

Decision: accept.

The next implementation should first add deterministic parity and tool-contract tests. Agent/API smoke comes only after the tool surface is stable.

### Finding: Missing funding facts could create opportunities

Decision: accept.

This is a critical invariant. Tests must cover missing Binance funding and missing Bitget funding, and verify no signal/opportunity/artifact is produced.

### Finding: Operation/provider coupling risk

Decision: accept.

No implementation may make `@agentkernel/operations` import `@agentkernel/tools`. `scanFundingBasisArbitrage` remains dependency-injected.

### Finding: Live smoke unreliability

Decision: accept.

Live smoke verifies behavior under real provider conditions but is not the only correctness proof. Deterministic tests must pass without network.

### Finding: Safety risk

Decision: accept.

The verification checklist includes a no-execution grep and manual review of tool input contracts.
