---
name: funding-rate-arbitrage
description: Find and explain funding-rate arbitrage opportunities across derivative venues such as Binance, Bitget, Bybit, and OKX. Use when the user asks for funding, basis, carry, or market-neutral arbitrage opportunities.
---

# Funding Rate Arbitrage

## Goal

Find market-neutral or hedged opportunities from funding rate divergence and related basis signals.

## Required facts

Always use tools to fetch or calculate:

1. venue and symbol
2. funding rate
3. funding timestamp / next funding time
4. mark price and index price when available
5. bid/ask and order book depth
6. maker/taker fee estimate
7. slippage estimate for the target notional
8. net edge after fees and slippage
9. data freshness

## Workflow

1. Fetch supported markets for target venues.
2. Fetch funding rates for target symbols.
3. Fetch ticker and order book depth.
4. Calculate gross edge, fees, slippage, and net edge.
5. Rank opportunities by net edge, freshness, liquidity, and risk flags.
6. Save an Opportunity artifact when a candidate is worth tracking.
7. Explain assumptions, risks, and invalidation conditions.

## Never

- Never treat funding rate alone as profit.
- Never ignore fees, depth, slippage, or funding timestamp.
- Never invent realtime market facts.
- Never place orders directly.
- Never present estimated edge as guaranteed profit.
