# Design: Deterministic funding opportunity scanner

## Architecture

```text
Pi Agent
  -> scan_funding_opportunities tool
  -> packages/operations scanFundingOpportunities
  -> packages/tools market-data functions
  -> ExchangeMarketDataService
  -> provider/proxy/testnet
  -> OpportunityArtifact
```

The scanner is an operation-level capability. It prevents inefficient agent loops over low-level tools and keeps ranking/materialization deterministic.

## P0 algorithm

Input:

```ts
{
  venues: string[];
  symbols: string[];
  targetNotionalUsd: number;
  maxCandidatesForDepth?: number;
  feeEstimateBps?: number;
  saveArtifact?: boolean;
}
```

P0 supports Binance `linear_perp`. Other venues return structured risk flags until their providers exist.

Flow:

1. Normalize symbols through the existing tools path.
2. Fetch funding rates for requested venues/symbols.
3. Fetch tickers for the same symbol universe.
4. Build candidates from available Binance funding points.
5. Coarse-rank by absolute funding rate.
6. Fetch order book depth only for top `maxCandidatesForDepth` candidates.
7. Calculate gross/net edge against a zero baseline placeholder for single-venue funding carry until cross-venue support exists.
8. Add explicit risk flags for single-venue assumption, provider warnings, stale/unknown liquidity, and non-positive net edge.
9. Save the strongest candidate as an `OpportunityArtifact` if requested.

## Risk flags

Examples:

```text
single_venue_funding_carry_assumption
provider_warning:timeout
liquidity_unknown
non_positive_net_edge
artifact_not_saved
```

## Artifact behavior

If data is available and `saveArtifact !== false`, save the strongest candidate.

If provider data is unavailable, return zero opportunities and warnings; do not fabricate an opportunity.

## Tool registration

Register `scan_funding_opportunities` in `packages/agent-kernel/src/register-prism-tools.ts`.

The tool should return the full structured scanner output, not prose-only text.

## Testing

- Unit test candidate ranking, depth limiting, artifact save behavior, and provider-unavailable behavior with fake dependencies.
- Smoke test the real tool path with testnet/proxy-compatible configuration.
