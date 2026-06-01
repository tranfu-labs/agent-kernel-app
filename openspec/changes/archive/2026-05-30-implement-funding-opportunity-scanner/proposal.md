# Change: Implement deterministic funding opportunity scanner

## Why

Prism now has provider-backed Binance market-data tools and a network-resilient live access path, but the product workflow still depends on the agent prompt to manually sequence low-level tools. That is inefficient, inconsistent, and hard to validate.

The next product step is a deterministic operation-level scanner that converts provider-backed market facts into ranked funding opportunity candidates and materializes an `OpportunityArtifact` when appropriate.

## What Changes

Add a P0 `scan_funding_opportunities` capability that:

- fetches funding rates and tickers for selected symbols;
- coarse-ranks candidates deterministically;
- fetches order book depth only for top candidates;
- calculates gross/net funding edge with fee and slippage estimates;
- produces structured risk flags and provider warnings;
- optionally saves the strongest candidate as an OpportunityArtifact;
- exposes the scanner as a Pi Agent tool.

## Scope

In scope:

- Binance `linear_perp` P0 scanner.
- User-provided symbol list.
- Deterministic ranking based on funding magnitude and net edge.
- Depth only for selected top candidates.
- Artifact materialization for the best candidate or explicit provider-unavailable result.
- Unit tests and smoke coverage.

Out of scope:

- Private exchange APIs.
- Real trading execution.
- Cross-exchange hedging.
- Python analytics.
- OHLCV/indicator features.
- Background jobs or alerts.
- Multi-venue production support beyond structured unsupported status.
