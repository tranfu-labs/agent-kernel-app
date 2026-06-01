# opportunity-research-report Specification

## Purpose
TBD - created by archiving change add-artifact-backed-opportunity-research-report. Update Purpose after archive.
## Requirements
### Requirement: Opportunity artifacts can produce read-only research reports

Prism SHALL generate deterministic read-only research reports from saved opportunity artifacts using explicit artifact IDs.

#### Scenario: Valid opportunity artifact report

- **WHEN** a user provides an artifact ID for a saved opportunity artifact and asks for a report
- **THEN** Prism calls `generate_opportunity_research_report` with that artifact ID
- **AND** returns a structured report with executive summary, thesis, metrics, evidence, risks, lineage, assumptions, limitations, markdown, and read-only boundary

#### Scenario: Missing artifact report

- **WHEN** the artifact store has no artifact for the requested ID
- **THEN** the report status is `not_found`
- **AND** Prism suggests rerunning the scanner or providing a valid artifact ID

#### Scenario: Report stays artifact-backed

- **WHEN** Prism generates an MVP opportunity research report
- **THEN** it uses saved artifact facts and explanation output
- **AND** it does not refresh live market data by default
- **AND** it does not produce execution instructions or expose account/order/credential/leverage/margin/transfer/withdrawal fields

