# Lens: Operation Purity

## Trigger conditions

Use this lens for Prism operation workflows, scanners, scoring pipelines, artifact materialization flows, and any work that transforms market facts into opportunities or proposals.

## Purpose

Prevent operation workflows from becoming untestable large functions that mix fetching, evaluation, scoring, storage, and presentation.

## Checks

1. **Pure core:** Deterministic logic SHOULD be separated into pure functions when practical.
2. **Thin orchestration:** Scanner/orchestration wrappers SHOULD coordinate fetching and saving, not hide core calculations.
3. **Offline testability:** Core logic MUST be testable with fixture or mocked inputs and no live network.
4. **Layer separation:** Information fetching, Energy evaluation/scoring, and Material artifact persistence SHOULD remain separate.
5. **Stable inputs:** Pure evaluators SHOULD accept normalized Prism contracts, not raw provider payloads.
6. **Stable outputs:** Pure evaluators SHOULD return structured comparisons/signals/opportunities/scores, not prose-only results.
7. **No agent calculation:** Pi Agent should orchestrate and explain; it SHOULD NOT own deterministic financial calculations.
8. **No hidden side effects:** Pure core functions MUST NOT save artifacts, mutate global state, or call network providers.

## Preferred pattern

For funding-basis work:

```text
evaluateFundingBasisContexts(normalized MarketContext[])
  -> comparisons
  -> signals
  -> opportunities
  -> scores

scanFundingBasisArbitrage(input, deps)
  -> fetch MarketContext via service
  -> call evaluateFundingBasisContexts
  -> save artifacts if requested
```

## Evidence to collect

Read operation files and tests, usually under:

```text
packages/operations/src/
packages/operations/test/
packages/tools/src/exchanges/
packages/domain/src/
```

Look for function boundaries and test inputs.

## Pass criteria

- Core calculations can run offline with mocked normalized inputs.
- Orchestration wrapper is thin and dependency-injected.
- Tests cover pure core and wrapper separately.
- No raw provider payloads enter operation core.

## Fail / partial criteria

- **FAIL:** Core opportunity logic requires live network.
- **FAIL:** Operation mixes fetch/evaluate/score/save/format in a way that cannot be tested independently.
- **PARTIAL:** Pure core exists but tests only cover wrapper behavior.
- **PARTIAL:** Artifact save path is not separately testable.

## Bad examples

<bad-example>
A single `scanFundingBasisArbitrage()` function fetches Binance/Bitget data, calculates edge, ranks, saves artifacts, formats markdown, and registers a Pi tool result, with tests that only run live smoke.

WRONG. Split pure evaluation from orchestration and add offline tests.
</bad-example>
