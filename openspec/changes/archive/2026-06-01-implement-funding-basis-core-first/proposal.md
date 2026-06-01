# Implement Funding-Basis Core-First Slice

## What changes

Add the first implementation slice for the Binance / Bitget funding-basis arbitrage MVP by building the deterministic core before adding or depending on live Bitget provider support.

This change introduces a core-first offline path that can convert normalized `MarketContext` inputs into:

```text
CrossVenueComparison -> Signal -> Opportunity -> Score -> OpportunityArtifact
```

It also adds a thin `scanFundingBasisArbitrage` orchestration wrapper with dependency-injected context loading and artifact saving.

## Why now

The existing Funding-Basis MVP plan is too broad for immediate execution because it starts with provider integration and Pi Agent wiring before the Energy-layer evaluator is proven. A smaller core-first slice improves correctness, testability, and development speed by validating comparison, scoring, lifecycle, and artifact lineage offline first.

## In scope

- Minimal domain contract deltas needed by the core-first slice:
  - `CrossVenueComparison`
  - `Signal`
  - `OpportunityLeg`
  - `OpportunityScore`
  - optional lineage fields on `Opportunity`
  - optional lineage fields on `Artifact`
- Pure deterministic Energy-layer helpers:
  - `buildCrossVenueComparison`
  - `deriveFundingBasisSignal`
  - `scoreFundingBasisOpportunity`
  - `evaluateFundingBasisContexts`
- Thin operation wrapper:
  - `scanFundingBasisArbitrage`
  - dependency-injected context provider
  - dependency-injected artifact store-like interface
- Offline deterministic tests using fixture `MarketContext` objects.
- Artifact lineage tests proving comparison IDs, signal IDs, and calculation inputs survive into saved artifacts.
- Static safety check for no private/account/execution capability.

## Out of scope

- Live Bitget provider implementation.
- New Binance provider behavior.
- Pi Agent tool registration.
- Live network smoke.
- Python analytics worker.
- Web UI.
- Account balances, positions, open orders, private credentials, order placement, cancellation, leverage, margin, transfer, withdrawal, or automatic trading.

## Affected planes

- **Information:** consumes already-normalized provider-backed `MarketContext` fixtures or dependency outputs; does not fetch live facts in this slice.
- **Energy:** adds deterministic comparison, signal derivation, scoring, and evaluation logic.
- **Material:** materializes OpportunityArtifacts with comparison/signal lineage and calculation context.

## Affected packages

- `packages/domain`
- `packages/operations`
- `docs/superpowers/plans`
- `prism-docs` only if contract docs need to reflect implemented names after the slice.

## Safety boundaries

This change is read-only. It must not introduce private exchange credentials, account data, positions, order data, order placement, cancellation, leverage, margin, transfers, withdrawals, or automatic trading. Opportunity outputs must use candidate/proposal language and must not instruct direct execution.

## Acceptance criteria

- Domain contracts compile with `npm run typecheck -w @agentkernel/domain`.
- Operations tests pass with `npm run test -w @agentkernel/operations`.
- Operation typecheck passes with `npm run typecheck -w @agentkernel/operations`.
- `evaluateFundingBasisContexts` can be tested with no network and no tools package dependency.
- `scanFundingBasisArbitrage` is a thin wrapper over the pure evaluator and injected dependencies.
- Artifact output includes artifact IDs when saving is enabled.
- Opportunity artifacts include comparison IDs, signal IDs, calculation inputs, warnings, and `createdBy: "operation"`.
- Static safety scan finds no new private/account/execution implementation path.
