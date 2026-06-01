# Lens: No Execution / Safety Boundary

## Trigger conditions

Use this lens for all market-data, opportunity, risk, proposal, exchange, wallet, account, and trading-related work.

## Purpose

Prevent private credentials, account data, order placement, cancellation, leverage/margin operations, or automatic trading from entering read-only MVP work before governance foundations exist.

## Checks

1. **No private credentials:** Read-only MVP work MUST NOT require exchange API keys, secrets, session tokens, or private account credentials.
2. **No account data:** Read-only MVP work MUST NOT fetch balances, positions, open orders, fills, or account configuration.
3. **No execution:** MUST NOT add real `place_order`, `cancel_order`, leverage, margin, transfer, withdrawal, or execution endpoints.
4. **No automatic trading:** Agent or operation MUST NOT recommend or trigger direct execution.
5. **Governance required:** Any proposal/execution capability requires separate approved governance OpenSpec covering risk checks, confirmation, audit, kill switch, and permissions.
6. **Safe language:** Opportunity explanations SHOULD say "candidate", "research", "proposal", or "requires confirmation", not "execute now".
7. **Static scan:** Implementation SHOULD be checked for prohibited terms when relevant.

## Suggested static scan

Use a read-only grep/static scan adapted to the task:

```bash
grep -RIn "place_order\|cancel_order\|get_positions\|get_account_balances\|apiKey\|secret\|leverage\|margin\|withdraw\|transfer" packages apps prism-docs
```

Review matches carefully; documentation non-goals may be legitimate.

## Pass criteria

- No private credentials or account/execution endpoints introduced.
- Any future execution references are documented as non-goals or future phases.
- Trade proposal work, if present, is gated behind risk/confirmation/audit design.

## Fail / partial criteria

- **FAIL:** Real order placement or cancellation path appears without governance OpenSpec.
- **FAIL:** Private credentials are required for read-only market-data work.
- **FAIL:** Account data is fetched in MVP scanner.
- **PARTIAL:** Docs imply direct execution even though code does not implement it.

## Bad examples

<bad-example>
"Add Bitget provider and also wire authenticated balances because we may need it later."

WRONG. YAGNI and violates read-only MVP boundary.
</bad-example>

<bad-example>
"The agent should tell the user to execute the top opportunity."

WRONG. It may generate research or a pending proposal only after the proposal/risk/confirmation path exists.
</bad-example>
