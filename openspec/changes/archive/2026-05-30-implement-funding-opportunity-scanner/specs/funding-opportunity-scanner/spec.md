# funding-opportunity-scanner Spec Delta

## ADDED Requirements

### Requirement: Deterministic funding opportunity scan

Prism SHALL provide an operation-level funding scanner that composes provider-backed market-data tools into ranked opportunity candidates without relying on agent prompt loops for the core scan logic.

#### Scenario: Scanner returns candidates from provider facts

- **WHEN** funding, ticker, and selected depth facts are available for requested symbols
- **THEN** the scanner ranks candidates deterministically
- **AND** each candidate includes edge estimates, liquidity status, freshness status, and risk flags

### Requirement: Depth is fetched only for selected candidates

The scanner SHALL avoid fetching order book depth for every requested symbol.

#### Scenario: Candidate set exceeds depth limit

- **WHEN** the input contains more symbols than `maxCandidatesForDepth`
- **THEN** the scanner fetches depth only for the top ranked candidates

### Requirement: Scanner materializes opportunities

The scanner SHALL optionally save the strongest valid candidate as an `OpportunityArtifact`.

#### Scenario: Save artifact is enabled

- **WHEN** at least one candidate exists and `saveArtifact` is not false
- **THEN** the strongest candidate is saved as an opportunity artifact
- **AND** the scanner output includes the saved artifact id

### Requirement: Provider unavailability is structured

The scanner SHALL not fabricate market facts when providers are unavailable.

#### Scenario: Provider data is unavailable

- **WHEN** funding or ticker data returns timeout, failed, geo_blocked, rate_limited, unsupported, or empty results
- **THEN** the scanner returns structured status and warnings
- **AND** does not create a fabricated opportunity
