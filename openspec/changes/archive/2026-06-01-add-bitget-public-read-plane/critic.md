# Critic Review and Rebuttal Decisions

## Verdict

ACCEPT with scope constraints.

## Findings

### Finding 1: Raw provider shapes must not leak

- Severity: major
- Area: provider boundary
- Issue: Adding Bitget as raw tools would bypass domain normalization.
- Recommendation: Keep raw payloads inside provider/service and output domain contracts.

Decision: accept.

Plan change: Implement provider behind `ExchangeMarketDataService`.

### Finding 2: Scope can creep into live scanner/Pi integration

- Severity: major
- Area: scope
- Issue: Provider work could expand into operation registration and live smoke.
- Recommendation: Limit this slice to provider and service normalization.

Decision: accept.

Plan change: Pi Agent and live funding-basis smoke are deferred.

### Finding 3: Safety risk from exchange naming

- Severity: major
- Area: safety
- Issue: Exchange integrations can accidentally add private/account methods.
- Recommendation: Public market endpoints only and static safety scan required.

Decision: accept.

Plan change: Safety scan is a completion requirement.

### Finding 4: Tests must be deterministic

- Severity: major
- Area: testability
- Issue: Provider tests should not depend on live Bitget availability.
- Recommendation: Use mocked fetch and fake provider payloads.

Decision: accept.

Plan change: All persistent tests are offline.
