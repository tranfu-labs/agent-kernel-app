# funding-opportunity-scanner Specification Delta

## MODIFIED Requirements

### Requirement: Deterministic funding opportunity scan

Prism SHALL provide an operation-level funding scanner that composes provider-backed market-data context into ranked opportunity candidates without relying on agent prompt loops for the core scan logic.

#### Scenario: Scanner returns candidates from provider facts

- **WHEN** funding, ticker, 24h volume, funding history, open interest, and selected depth facts are available for requested symbols
- **THEN** the scanner ranks candidates deterministically
- **AND** each candidate includes edge estimates, liquidity status, freshness status, evidence summaries, and risk flags

#### Scenario: Extended context is partially unavailable

- **WHEN** current funding and ticker facts are available but funding history, open interest, series, or positioning context is unavailable
- **THEN** the scanner can still produce candidates with reduced confidence and structured warnings
- **AND** it does not fabricate missing context

### Requirement: Depth is fetched only for selected candidates

The scanner SHALL avoid fetching order book depth and other expensive per-symbol context for every requested symbol.

#### Scenario: Candidate set exceeds expensive-context limits

- **WHEN** the input contains more symbols than the configured candidate limits
- **THEN** the scanner fetches depth, detailed history, open-interest history, series, positioning, or microstructure only for selected candidates after coarse screening

### Requirement: Scanner materializes opportunities

The scanner SHALL optionally save the strongest valid candidate as an `OpportunityArtifact` with evidence sufficient for later inspection.

#### Scenario: Save artifact is enabled

- **WHEN** at least one candidate exists and `saveArtifact` is not false
- **THEN** the strongest candidate is saved as an opportunity artifact
- **AND** the artifact includes calculation inputs, calculation outputs, provider statuses, warnings, and evidence summaries for the market-data families used
