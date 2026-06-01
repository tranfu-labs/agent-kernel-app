# opportunity-explanation Specification Delta

## ADDED Requirements

### Requirement: Opportunity artifacts are explainable by artifact ID

Prism SHALL provide a read-only artifact-backed explanation flow for saved opportunity artifacts using an explicit artifact ID.

#### Scenario: Valid opportunity artifact is explained

- **WHEN** a user provides an artifact ID for a saved opportunity artifact
- **THEN** Prism calls `explain_opportunity_artifact` with that artifact ID
- **AND** reads the saved artifact from the runtime artifact store
- **AND** returns a structured explanation with opportunity metrics, legs, warnings, score explanation, lineage, assumptions, suggested follow-ups, and the read-only boundary

#### Scenario: Missing artifact returns structured miss

- **WHEN** the artifact store has no artifact for the requested ID
- **THEN** the result status is `not_found`
- **AND** Prism suggests rerunning the scanner or providing a valid artifact ID

#### Scenario: Unsupported artifact type is rejected

- **WHEN** the artifact exists but its type is not `opportunity`
- **THEN** the result status is `unsupported_artifact_type`
- **AND** Prism does not attempt to reinterpret the artifact as an opportunity

#### Scenario: Invalid opportunity content is rejected

- **WHEN** the artifact type is `opportunity` but `contentJson` does not contain usable opportunity content
- **THEN** the result status is `invalid_artifact`
- **AND** Prism does not fabricate missing opportunity facts

### Requirement: Opportunity explanation is artifact-backed and deterministic

Prism SHALL build MVP opportunity explanations from saved artifact fields and shall not refresh live market data by default.

#### Scenario: Partial lineage is visible

- **WHEN** an opportunity artifact lacks comparison, signal, evidence, or market-context lineage IDs
- **THEN** Prism still returns an explanation if the opportunity content is usable
- **AND** the warnings explicitly name the missing lineage categories

#### Scenario: Score is unavailable

- **WHEN** a usable opportunity artifact lacks a score
- **THEN** Prism returns an explanation
- **AND** the explanation states that the score is unavailable instead of inventing one

#### Scenario: Explanation stays read-only

- **WHEN** Prism returns an opportunity explanation
- **THEN** the explanation includes `This is a read-only research explanation. It is not financial advice, a trade recommendation, or an execution instruction.`
- **AND** the tool schema includes only `artifactId`
- **AND** Prism does not expose account, order, credential, leverage, margin, transfer, withdrawal, or execution fields
