# Critic Review and Rebuttal Decisions

## Verdict

ACCEPT with scope constraints.

## Findings

### Finding 1: Pi Agent registration would expand scope

- Severity: major
- Area: scope
- Issue: Adding Pi Agent tool registration now would mix runtime integration with provider-backed operation validation.
- Recommendation: Add direct operation smoke first.

Decision: accept.

Plan change: Pi Agent registration is deferred.

### Finding 2: Live network must not be a deterministic test dependency

- Severity: major
- Area: testability
- Issue: CI/local network may fail due provider availability, geo-blocking, or rate limits.
- Recommendation: Keep persistent tests offline; smoke can report structured provider statuses.

Decision: accept.

Plan change: Existing offline tests remain required; live smoke is a non-persistent check.

### Finding 3: Smoke must not hide provider failures

- Severity: major
- Area: financial fact integrity
- Issue: The smoke could treat missing facts as opportunities if not careful.
- Recommendation: Propagate operation status and warnings directly.

Decision: accept.

Plan change: Smoke returns status, warnings, opportunity count, and artifact IDs.
