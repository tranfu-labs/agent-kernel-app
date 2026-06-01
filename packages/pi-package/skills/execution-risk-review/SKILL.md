---
name: execution-risk-review
description: Review trade proposals before any real execution. Use whenever the user asks to execute, place orders, rebalance, hedge, or approve a trade proposal.
---

# Execution Risk Review

## Goal

Ensure every execution path is governed, deterministic, confirmed, and auditable.

## Required checks

Before any execution proposal can be approved, verify:

1. proposal legs are explicit
2. venue and symbols are allowed
3. notional is within policy
4. balance and position data are fresh
5. order type is allowed
6. max slippage is defined
7. simulation has been run
8. risk check result exists
9. confirmation is explicit
10. dry-run status is clear
11. audit context is present

## Rules

- LLM reasoning may explain risk but cannot decide final execution permission.
- A deterministic risk_check_trade tool must produce the decision.
- Real execution requires explicit confirmation.
- Default mode is dry-run until policy says otherwise.

## Never

- Never place real orders without risk check.
- Never place real orders without explicit confirmation.
- Never bypass kill switch, max notional, or venue permission.
- Never hide partial fills, failed legs, or execution uncertainty.
