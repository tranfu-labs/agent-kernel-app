# Critic Review and Rebuttal Decisions

## Critic verdict

REVISE the old plan before implementation.

## Findings

### Finding 1: Old plan is provider-first and too broad

- Severity: major
- Area: scope / testability
- Issue: The plan combines domain contracts, Bitget provider, service routing, operation, Pi Agent registration, smoke scripts, and docs.
- Why it matters: Provider/network failures will obscure whether the core opportunity evaluation is correct.
- Recommendation: Implement a core-first offline slice before live provider work.

Decision: accept.

Plan change: This OpenSpec and rewritten plan start with deterministic domain/operation/artifact logic only. Bitget provider and Pi Agent registration are deferred.

### Finding 2: Operation purity boundary is unclear

- Severity: major
- Area: architecture
- Issue: The old plan risked mixing fetching, scoring, saving, and presentation in a single operation.
- Why it matters: Mixed orchestration makes financial math hard to test and review.
- Recommendation: Use a pure `evaluateFundingBasisContexts` core and a thin `scanFundingBasisArbitrage` wrapper.

Decision: accept.

Plan change: The final architecture explicitly separates pure Energy-layer evaluation from injected orchestration.

### Finding 3: Existing plan conflicts with current `MarketContext` shape

- Severity: major
- Area: contract
- Issue: Examples treated `MarketContext.funding` as a direct `FundingRatePoint`, but current code defines it as `FundingContext` with `.current`.
- Why it matters: Implementing the old snippets would fail typecheck or create wrong assumptions.
- Recommendation: Use `context.funding?.current?.fundingRate` and preserve `FundingContext.status`/warnings.

Decision: accept.

Plan change: The rewritten implementation plan uses the actual contract shape.

### Finding 4: Operations package should not import tools for this slice

- Severity: major
- Area: architecture
- Issue: The old plan used `MemoryArtifactStore` from `@agentkernel/tools` inside `@agentkernel/operations` tests/implementation.
- Why it matters: It creates an unnecessary dependency and weakens operation purity.
- Recommendation: Define a local `ArtifactStoreLike` interface or keep artifact creation pure.

Decision: accept.

Plan change: `scanFundingBasisArbitrage` uses an injected `ArtifactStoreLike` interface.

### Finding 5: Artifact lineage must be tested, not assumed

- Severity: major
- Area: material / artifact lineage
- Issue: The old plan said artifacts would be saved but did not make lineage a first-class test target.
- Why it matters: Users must later inspect why an opportunity was valid.
- Recommendation: Add tests for artifact IDs, comparison IDs, signal IDs, calculation inputs, warnings, and createdBy.

Decision: accept.

Plan change: Artifact lineage gets dedicated persistent tests and acceptance criteria.

### Finding 6: Safety boundary must remain static-checkable

- Severity: major
- Area: safety
- Issue: Funding-basis work is close to trading concepts, so execution creep is a risk.
- Why it matters: MVP is explicitly read-only and no-execution.
- Recommendation: Include no-execution static scan in the test matrix.

Decision: accept.

Plan change: Static safety scan is included before completion.

## Deferred concerns

- Bitget live endpoint normalization is deferred to the next OpenSpec slice.
- Pi Agent registration is deferred until offline core tests pass.
- Live smoke is deferred until provider-backed data exists.
