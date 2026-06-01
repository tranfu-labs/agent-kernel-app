# Critic Review

## Verdict

ACCEPT with strict scope controls.

## Findings

```json
{
  "verdict": "ACCEPT",
  "findings": [
    {
      "severity": "major",
      "area": "tool_contract",
      "issue": "The new tool overlaps conceptually with scan_funding_opportunities.",
      "why_it_matters": "Ambiguous tool names can cause Pi Agent to choose the wrong tool or mix single-venue and cross-venue semantics.",
      "recommendation": "Keep the new tool separate, explicitly named scan_funding_basis_arbitrage, and update prompt guidance to prefer it for Binance/Bitget cross-venue scans."
    },
    {
      "severity": "major",
      "area": "architecture",
      "issue": "Tool registration could leak provider-specific implementation details into Pi Agent.",
      "why_it_matters": "Pi Agent should call Prism product tools, not raw provider endpoints or provider payloads.",
      "recommendation": "Compose through ExchangeMarketDataService and scanFundingBasisArbitrage only. Do not import provider classes in agent-kernel."
    },
    {
      "severity": "critical",
      "area": "safety",
      "issue": "Funding arbitrage language can imply executable trading actions.",
      "why_it_matters": "The MVP is read-only and must not expose account or execution capability before governance exists.",
      "recommendation": "Tool descriptions and schemas must say read-only, candidate/opportunity only, and must not include order/account/leverage/margin fields."
    },
    {
      "severity": "major",
      "area": "financial_fact_integrity",
      "issue": "Provider failures during tool execution could create misleading empty or fabricated results.",
      "why_it_matters": "A user-facing agent tool must preserve provider warnings and avoid inventing facts.",
      "recommendation": "Smoke and tests must verify missing funding produces no opportunities/artifacts and warnings are surfaced."
    },
    {
      "severity": "minor",
      "area": "testability",
      "issue": "Live smoke depends on exchange reachability.",
      "why_it_matters": "Network failures should not block local deterministic validation.",
      "recommendation": "Keep deterministic tests as the gate; treat live smoke partial status as acceptable when safe."
    }
  ]
}
```

## Rebuttal Decisions

```json
{
  "verdict": "READY_FOR_IMPLEMENTATION",
  "decisions": [
    {
      "finding_id": "C1",
      "severity": "major",
      "decision": "accept",
      "reason": "The older scan_funding_opportunities tool is single-venue oriented while this slice exposes a cross-venue funding-basis operation.",
      "plan_change": "Register a separate scan_funding_basis_arbitrage tool and add prompt guidance that prefers it for Binance/Bitget cross-venue discovery.",
      "verification": "Tool registry smoke confirms the new tool exists; prompt guidance is inspected in register-prism-tools.ts.",
      "scope_impact": "narrows scope",
      "blocks_implementation": false
    },
    {
      "finding_id": "C2",
      "severity": "major",
      "decision": "accept",
      "reason": "Agent-kernel should compose stable Prism service and operation APIs rather than raw provider adapters.",
      "plan_change": "Use ExchangeMarketDataService.getMarketContext and scanFundingBasisArbitrage; do not import raw Binance/Bitget provider classes in agent-kernel.",
      "verification": "Static provider-boundary scan checks agent-kernel imports; operations import scan checks confirm @agentkernel/operations does not import @agentkernel/tools.",
      "scope_impact": "No scope change",
      "blocks_implementation": false
    },
    {
      "finding_id": "C3",
      "severity": "critical",
      "decision": "accept",
      "reason": "Funding arbitrage language can imply execution, but this MVP slice is read-only.",
      "plan_change": "Keep the tool schema limited to venues, symbols, marketType, estimatedFeeBps, targetNotionalUsd, and saveArtifacts; add read-only prompt guidance.",
      "verification": "Safety scan checks for private/account/order/leverage/margin/transfer/withdrawal fields and execution surfaces.",
      "scope_impact": "narrows scope",
      "blocks_implementation": false
    },
    {
      "finding_id": "C4",
      "severity": "major",
      "decision": "accept",
      "reason": "Provider warnings and missing funding facts must remain visible and must not become fabricated opportunities.",
      "plan_change": "Require missing funding to produce no signals, no opportunities, and no artifacts while preserving warnings/status.",
      "verification": "Operations tests cover missing funding; provider and tool smokes verify partial degradation with zero artifacts when no opportunities exist.",
      "scope_impact": "No scope change",
      "blocks_implementation": false
    },
    {
      "finding_id": "C5",
      "severity": "minor",
      "decision": "accept",
      "reason": "Live exchange reachability can fail locally and should not block deterministic correctness.",
      "plan_change": "Treat live smoke partial status as acceptable only when warnings are explicit and no fabricated facts or artifacts appear.",
      "verification": "Network-degradation smoke acceptance rule is recorded in test-matrix.md.",
      "scope_impact": "No scope change",
      "blocks_implementation": false
    }
  ],
  "unresolved_findings": [],
  "required_plan_updates": [],
  "required_test_updates": [],
  "summary": "All critic findings are resolved with explicit read-only, provider-boundary, financial-fact-integrity, and network-degradation verification requirements."
}
```
