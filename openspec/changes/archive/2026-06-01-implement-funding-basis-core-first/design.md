# Funding-Basis Core-First Design

## Current context

The current Funding-Basis MVP plan attempts to deliver domain contracts, Bitget provider integration, cross-venue scoring, operation/artifact behavior, Pi Agent integration, smoke scripts, and docs in one broad pass. Formal review found this too large and provider-first.

The repo already has normalized market data contracts in `packages/domain/src/market-data.ts`. In particular, `MarketContext.funding` is a `FundingContext`, so funding values must be read from `context.funding?.current?.fundingRate`, not `context.funding?.fundingRate`.

`@agentkernel/operations` currently depends only on `@agentkernel/domain`; this slice preserves that boundary by using a local `ArtifactStoreLike` interface instead of importing `MemoryArtifactStore` from `@agentkernel/tools`.

## Alternatives considered

### Option A: Provider-first vertical

Implement Bitget provider, service routing, operation, artifacts, and Pi Agent tool together.

- Pros: reaches live data faster.
- Cons: mixes provider failures with core math bugs; larger blast radius; harder to test offline; encourages unverified operation shape.

### Option B: Core-first offline slice

Implement domain deltas, deterministic evaluator, thin wrapper, artifact lineage, and offline tests first.

- Pros: proves Energy and Material behavior before live read-plane work; small and testable; respects operation purity.
- Cons: does not yet produce live Binance / Bitget scans.

### Option C: Domain-only contract slice

Only add contracts and docs, deferring evaluator logic.

- Pros: smallest change.
- Cons: does not prove whether contracts are usable; delays the most important design feedback.

## Recommended design

Use Option B. Build a deterministic core that accepts normalized `MarketContext` values and returns structured comparisons, signals, scored opportunities, and artifacts. Then add a thin orchestration wrapper that fetches contexts through an injected provider and optionally saves artifacts through an injected store.

## Final architecture

```text
Fixture or injected MarketContext inputs
  -> evaluateFundingBasisContexts()
      -> buildCrossVenueComparison()
      -> deriveFundingBasisSignal()
      -> scoreFundingBasisOpportunity()
      -> createOpportunityArtifact()
  -> scanFundingBasisArbitrage()
      -> injected contextProvider
      -> pure evaluator
      -> injected ArtifactStoreLike.save()
```

## Domain changes

Add focused contracts only where current contracts lack necessary structure:

- `CrossVenueComparison` in `packages/domain/src/comparison.ts`
- `Signal` in `packages/domain/src/signal.ts`
- `OpportunityLeg`, `OpportunityScore`, and optional `comparisonIds`, `signalIds`, `legs`, `score`, `lifecycleStage` in `packages/domain/src/opportunity.ts`
- optional `opportunityIds`, `evidenceBundleIds`, `marketContextIds`, `comparisonIds`, `signalIds`, `createdBy` in `packages/domain/src/artifact.ts`

Existing fields remain compatible unless typecheck shows a real conflict.

## Operation boundaries

`evaluateFundingBasisContexts` is the pure core. It must not call network, tools, filesystem, or artifact store. It accepts normalized contexts and configuration.

`scanFundingBasisArbitrage` is the wrapper. It may call injected dependencies but should not own scoring math. It should be small enough that tests can prove orchestration separately from scoring.

## Failure modes

- Missing venue context: return warnings and skip the incomplete symbol pair.
- Missing funding value: produce a comparison with warnings and no positive opportunity unless enough inputs exist.
- Partial provider status from injected contexts: propagate `status` and warnings into output and artifact content.
- Save disabled: return opportunities without artifact IDs.
- Save enabled but no artifact store: return a warning rather than fabricate artifact IDs.

## Safety and governance

No private/account/execution capability is introduced. Output language uses `candidate`, not direct execution language. Any future proposal/execution path requires a separate governance OpenSpec.

## Migration notes

This slice does not replace the existing Binance-only `funding-opportunity-scan.ts`. It adds a separate cross-venue core and operation so existing smoke behavior can remain stable.
