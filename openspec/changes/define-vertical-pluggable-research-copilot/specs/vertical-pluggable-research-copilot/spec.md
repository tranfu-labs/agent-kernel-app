# vertical-pluggable-research-copilot Specification Delta

## ADDED Requirements

### Requirement: Platform research intent is separate from vertical identity

Prism SHALL resolve platform research intent independently from vertical identity so that funding-basis remains the first wedge while future verticals reuse the same control-plane contracts.

#### Scenario: Compare intent remains platform-level across verticals

- **WHEN** Prism receives compare requests for both funding-basis and prediction-market research
- **THEN** Prism resolves the intent as `compare` in both cases
- **AND** keeps the vertical identity separate from the intent taxonomy
- **AND** chooses the compare path before any vertical-specific tool selection

### Requirement: Research-layer paths remain artifact-first and read-only by default

Prism SHALL keep the research layer artifact-first and read-only by default across explore_method, discover, explain, report, compare, refresh, monitor, emit_signal, propose, and evaluate_risk flows.

#### Scenario: Research request stays within read-only boundaries

- **WHEN** Prism performs research-layer orchestration for a supported vertical
- **THEN** the default mode is read-only
- **AND** realtime facts remain tool-backed
- **AND** proposal remains separate from execution
- **AND** emit_signal remains separate from proposal

### Requirement: Refresh preserves historical artifact truth

Prism SHALL derive refresh artifacts from prior artifacts without mutating historical artifact truth.

#### Scenario: Refresh creates a derived object

- **WHEN** Prism refreshes an existing research artifact
- **THEN** it creates a `refresh_artifact` derived from the prior artifact
- **AND** preserves the original artifact unchanged
- **AND** may optionally derive a new artifact version with explicit lineage

### Requirement: Monitoring derives from approved prior research state

Prism SHALL materialize monitoring from approved prior research state rather than hidden prompt-only runtime memory.

#### Scenario: Continuous monitoring uses explicit state lineage

- **WHEN** Prism activates or resumes continuous monitoring for a research subject
- **THEN** the monitor derives from approved prior research state and materialized artifacts
- **AND** emit_signal carries lineage to monitor, source, comparison context, and any derived opportunity artifact
- **AND** Prism does not rely on hidden prompt-only memory as the monitoring source of truth

### Requirement: Vertical declarations define capability and policy boundaries

Prism SHALL define explicit vertical plugin declarations that map supported intents, paths, artifacts, and policy boundaries. Each declaration MUST include at least a stable `vertical`, canonical `supportedIntents`, `supportedPaths`, declared `capabilityKeys`, declared `artifactMappings`, and a research-layer `policyProfile`.

#### Scenario: Funding-basis remains a wedge rather than permanent identity

- **WHEN** Prism declares the funding-basis vertical
- **THEN** the declaration maps platform intents and paths to funding-basis capabilities
- **AND** the policy profile remains read-only at the research layer
- **AND** the declaration does not imply that funding-basis is Prism’s permanent product identity

#### Scenario: New vertical remains extension-safe before full implementation

- **WHEN** Prism introduces a prediction-market sample vertical declaration
- **THEN** the declaration is explicit about supported research-layer capabilities
- **AND** unsupported execution-adjacent behavior remains outside scope
- **AND** extensibility is represented as an explicit plugin boundary rather than hidden prompt behavior
