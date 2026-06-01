# Lens: Risk Governance Readiness

Use this lens when work approaches proposals, approvals, risk checks, execution tickets, audit, or any capability that could eventually lead to trading or account mutation.

## Goal

Read-only MVP work should be shaped so it can later feed governed action, but it must not silently implement execution, account mutation, or irreversible behavior before explicit governance exists.

## Current boundary

For read-only MVP work:

```text
Allowed:
- provider-backed facts
- comparisons
- signals
- opportunities
- scores
- artifacts
- reports
- watch/research suggestions

Not allowed:
- private credentials
- balances/positions/open orders/fills
- order placement or cancellation
- leverage or margin changes
- transfers or withdrawals
- automatic trading
```

## Future governance requirements

Any real execution capability requires a separate approved governance OpenSpec covering:

```text
proposal contract
risk policy
deterministic risk checks
explicit user confirmation
permission model
kill switch
execution ticket
receipt and reconciliation
audit events
failure handling
rollback/non-rollback semantics
```

## Checks

- Current slice does not require private credentials.
- Current output can become a proposal later without already being executable.
- Artifact/opportunity lineage is sufficient for future risk review.
- No code path mutates accounts or exchange state.
- Tool prompt guidance blocks direct execution.
- Non-goals explicitly defer governance/execution if out of scope.

## Failure patterns

- Read-only scanner adds `placeOrder`, `cancelOrder`, leverage, margin, transfer, or withdrawal surface.
- Tool output says to execute without creating a proposal/risk/audit flow.
- Private account data is fetched to improve opportunity quality before governance exists.
- Execution is hidden behind a generic provider method or adapter.
- Proposal/risk concepts are added without deterministic checks or audit design.

## Evidence to request

- OpenSpec non-goals.
- Tool schemas and prompt guidance.
- Safety grep for execution/account terms.
- Artifact/opportunity lineage fields.
- Explicit note that execution governance is deferred to a separate OpenSpec.
