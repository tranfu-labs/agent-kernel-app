# funding-basis-copilot Specification

## Purpose
TBD - created by archiving change register-funding-basis-arbitrage-readonly-tool. Update Purpose after archive.
## Requirements
### Requirement: Funding-basis copilot resolves MVP1 intents safely

Prism SHALL provide lightweight MVP1 guidance that maps ordinary Binance/Bitget funding-basis research requests to the read-only scanner while keeping lookup, drilldown, explanation, and extension-required requests distinct.

#### Scenario: Ordinary Binance/Bitget request uses scanner defaults

- **WHEN** a user asks for Binance/Bitget funding-basis arbitrage opportunities without explicit parameters
- **THEN** Prism resolves the request to `cross_venue_funding_basis`
- **AND** prefers `scan_funding_basis_arbitrage`
- **AND** applies disclosed defaults for Binance/Bitget, BTCUSDT/ETHUSDT/SOLUSDT, linear perpetuals, 1000 USD notional, 4 bps estimated fees, balanced mode, and artifact saving

#### Scenario: High-risk request stays read-only

- **WHEN** a user asks to execute, place orders, or deploy large capital through the funding-basis flow
- **THEN** Prism resolves the request to read-only ask-first behavior
- **AND** does not expose execution, account, order, leverage, margin, transfer, withdrawal, or credential fields

#### Scenario: Future vertical request is extension-required

- **WHEN** a user asks for Polymarket, A-share, spot-perp, or custom-data-source opportunities
- **THEN** Prism explains that the request needs a different provider/context/operation/skill path
- **AND** does not route the request to `scan_funding_basis_arbitrage`

### Requirement: Funding-basis scanner returns opportunity cards

Prism SHALL return product-facing opportunity cards alongside structured comparisons, signals, opportunities, status, warnings, and artifact IDs.

#### Scenario: Formal opportunity exists

- **WHEN** the scanner creates a formal opportunity from provider-backed market contexts
- **THEN** the output includes one opportunity card per opportunity
- **AND** each card includes symbol, opportunity type, venues, candidate long/short venue, funding rates, funding difference, fee/slippage/net edge estimates, target notional, score, confidence, warnings, freshness, artifact ID when saved, assumptions, and next actions

#### Scenario: No formal opportunity exists

- **WHEN** required funding facts are missing or no opportunity is eligible
- **THEN** the scanner returns no opportunities
- **AND** returns no opportunity cards
- **AND** saves no opportunity artifacts
- **AND** preserves explicit warnings/status instead of fabricating facts

### Requirement: Funding-basis artifacts preserve operation lineage

Prism SHALL materialize saved funding-basis opportunities as operation-created artifacts with lineage sufficient for follow-up explanation and reports.

#### Scenario: Artifact saving is enabled for a valid opportunity

- **WHEN** `saveArtifacts=true` and a formal funding-basis opportunity exists
- **THEN** the saved artifact includes the opportunity ID, comparison IDs, signal IDs, operation creator marker, markdown summary, and structured opportunity content
- **AND** the scanner output includes the saved artifact ID

#### Scenario: Material envelope hardening is deferred

- **WHEN** follow-up Material-layer hardening is scheduled
- **THEN** Prism tracks explicit artifact content for assumptions, provider fact or market-context references, warnings, calculated metrics, and score explanation as follow-up work rather than claiming full envelope completeness in this change

