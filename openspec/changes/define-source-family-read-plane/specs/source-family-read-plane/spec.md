# source-family-read-plane Specification Delta

## ADDED Requirements

### Requirement: Prism SHALL organize new data integrations by source family, not one function per source

Prism SHALL treat data integration as a product-platform capability owned by the Information Plane. New sources SHALL enter Prism through a source-family architecture rather than by adding one endpoint-shaped function or one agent-visible tool per source.

#### Scenario: A new market source is admitted without tool explosion

- **WHEN** Prism adds a new public data source for a supported market or evidence family
- **THEN** the source is modeled as a source-family adapter with declared semantic capabilities
- **AND** the agent-visible tool surface does not grow one-to-one with provider endpoints
- **AND** product workflows continue to operate through stable operations and drilldown contracts

### Requirement: Prism SHALL use a shared fact envelope with family-specific payloads

Prism SHALL wrap source outputs in a shared provenance/freshness/degradation envelope while keeping family-specific normalized payload schemas.

#### Scenario: Heterogeneous sources share governance but not fake uniform payloads

- **WHEN** Prism ingests data from two different source families (for example venue market data and event/rules data)
- **THEN** both results carry shared status, freshness, warnings, provider/source identity, and coverage semantics
- **AND** each family preserves its own normalized payload shape
- **AND** Prism does not force both families into one universal cross-market payload schema

### Requirement: Prism SHALL register semantic capabilities, not raw endpoints

Prism SHALL define data-access capabilities as semantic capability keys and resolve them through a central capability registry.

#### Scenario: An operation requests capabilities rather than provider endpoints

- **WHEN** a Prism operation needs market-funding, market-snapshot, or event-rules data
- **THEN** it requests those semantic capabilities from the read plane
- **AND** the read plane resolves them to the best matching source adapters
- **AND** operations do not depend on raw provider endpoint names or SDK methods

### Requirement: Prism SHALL keep operations provider-agnostic

Operations SHALL consume family query services or normalized fact envelopes, never raw provider payloads or provider classes.

#### Scenario: Provider implementation changes without changing operation semantics

- **WHEN** one source adapter is replaced, upgraded, or swapped for a different library/SDK
- **THEN** deterministic operations continue to consume the same normalized contracts
- **AND** opportunity, report, and artifact behavior does not require rewriting provider-specific logic

### Requirement: Prism SHALL separate public-read connectors from private/governed connectors

The first source-plane blueprint SHALL support only public-read connector classes. Private/authenticated account connectors SHALL be treated as a separate future governed family, not an extension of the same base contract.

#### Scenario: A future account-linked provider is proposed

- **WHEN** a provider requires account secrets, portfolio state, balances, positions, or execution-related capabilities
- **THEN** it is excluded from the public-read source-family contract
- **AND** it cannot be admitted by reusing the same base connector interface without a separate governance design

### Requirement: Prism SHALL preserve structured degradation across all source families

The source-family read plane SHALL make timeout, partial, rate-limited, geo-blocked, unsupported, schema-changed, and similar degraded states first-class and structured.

#### Scenario: One source family times out during a research workflow

- **WHEN** a provider or source fails to return all requested data
- **THEN** Prism returns an explicit degraded status with warnings, coverage gaps, and freshness/provenance markers
- **AND** downstream operations can distinguish “no result” from “insufficient evidence”
- **AND** the agent is not forced to infer product semantics from missing arrays alone

### Requirement: Prism SHALL stage adoption through one proven family first, then one heterogeneity sample

Prism SHALL evolve the data plane incrementally: first by refactoring the existing exchange read plane into the initial source family, then by validating the abstraction with one second non-exchange family before broad expansion.

#### Scenario: Expansion is gated by proof, not by source count

- **WHEN** Prism plans new domains such as equities, sports, or prediction markets
- **THEN** it first proves the source-family architecture with the existing exchange family
- **AND** then proves one second family sample without breaking the first
- **AND** broad expansion does not proceed until the capability registry, fact envelope, and family query services are validated in both families
