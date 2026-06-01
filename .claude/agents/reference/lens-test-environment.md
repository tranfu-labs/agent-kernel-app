# Lens: Test Environment

Use this lens when planning or evaluating any Level 2+ or Level 3+ Prism work.

## Goal

Every meaningful slice should have deterministic tests, integration coverage, smoke coverage when applicable, type checks, and safety checks. Live provider behavior must not be the only test path.

## Test layers

### Contract tests

Use when public domain/tool/operation contracts change.

Check:

- schema fields
- output shape
- required status/warnings/lineage
- forbidden fields

### Pure core unit tests

Use for deterministic logic such as comparisons, scoring, filtering, ranking, risk flags, and artifact content derivation.

Check:

- no network
- no provider dependencies
- fixed timestamps when needed
- missing fact behavior
- ranking/scoring determinism

### Integration tests with fake providers/services

Use for provider/service/tool wrappers.

Check:

- normalized outputs
- error/status propagation
- provider parity
- boundary preservation

### Smoke tests

Use for app/API or registered-tool paths.

Check:

- tool registration
- provider-backed path runs
- partial network degradation is visible
- no artifacts without opportunities

### Safety checks

Use for read-only financial work.

Check:

- no private/account/execution schema fields
- no order placement/cancellation/leverage/margin/transfer/withdrawal path
- product runtime does not expose coding tools
- package boundaries are preserved

## Required matrix format

A test matrix should list:

```text
check name
purpose
persistent or inline
command or file
expected result
what failure means
```

## Failure patterns

- Plan says "run tests" without exact commands.
- Only live smoke exists for core logic.
- Tests assert happy path but not missing facts.
- No typecheck for changed package boundaries.
- No regression test for a known bug.
- Safety scan ignores generated files but not runtime code.

## Evidence to request

- Test files added or updated.
- Exact commands run.
- Expected and actual output summaries.
- Mapping from acceptance criteria to tests.
- Explanation for any skipped or blocked check.
