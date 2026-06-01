## Core contracts

### Intent taxonomy

```text
discover
explore_method
explain
report
compare
refresh
monitor
emit_signal
propose
evaluate_risk
inspect_source
extension_required
general
```

### Path contract

```text
User input
-> resolve intent
-> resolve vertical
-> resolve capability
-> choose path
-> choose operation(s)
-> materialize artifacts
```

### Artifact family

```text
research_brief
method_artifact
source_snapshot
market_context_snapshot
comparison_artifact
signal_artifact
opportunity_artifact
research_report
monitor_definition
proposal_artifact
risk_artifact
refresh_artifact
```

`opportunity_artifact` is a first-class platform artifact. Verticals that support opportunity framing, explanation, or reporting MUST declare that artifact family explicitly rather than treating opportunity as an implicit byproduct of `signal_artifact` or `research_report` generation.

### Refresh rule

```text
artifact_v1
-> refresh
-> refresh_artifact_v1
-> optionally derive artifact_v2
```

### Prism planes affected

- Information plane: intent resolution, vertical selection, capability routing, artifact definitions, and policy interpretation for research workflows.
- Energy plane: orchestration path selection, deterministic operation sequencing, and monitor/signal flow control that remain bounded by approved research contracts.
- Material plane: persisted artifact families, lineage, refresh derivation, and storage-visible outputs produced by research workflows.

### Safety boundary

The platform blueprint operates inside an explicit research-only safety boundary, not merely an implied read-only posture.

- Allowed: public-data research, tool-backed fact retrieval, artifact creation, explanation, comparison, monitoring definitions, signal emission, proposal drafting, and risk evaluation within research contracts.
- Disallowed: private/authenticated account endpoints, wallet or portfolio state, balances or positions, order submission, execution control, and any broker/exchange write path.
- Required separation: `emit_signal`, `propose`, and any future execution slice remain distinct contracts so that research outputs cannot directly become execution actions.

### Runtime identity baseline (implementation slice)

The current implementation slice treats runtime identity as a **bootstrap concern**, not a UI concern:

- Canonical boundary: `packages/agent-kernel/src/createPrismAgentSession.ts`
- Mechanism: inject `prism-system-prompt.ts` into fresh Pi sessions through the SDK-supported resource-loader path
- Purpose: ensure fresh sessions identify and behave as Prism rather than a generic coding assistant
- Non-goals of this slice:
  - no renderer work
  - no workspace UI redesign
  - no `/threads` support
  - no attachment/multimodal behavior
  - no execution or risk-workflow expansion

This slice is foundational only. Product differentiation still depends on later deterministic result rendering and workspace-transition primitives.

### Vertical plugin declaration minimum fields

Each vertical plugin declaration is the minimum explicit boundary between the platform control plane and vertical-specific capability wiring. At minimum, a declaration MUST include:

- `vertical`: stable vertical identifier
- `supportedIntents`: platform intent names supported by the vertical, using canonical taxonomy values such as `explore_method`, `emit_signal`, and `evaluate_risk`
- `supportedPaths`: mapping from supported intent to orchestration path/capability entrypoint
- `capabilityKeys`: explicit capability identifiers the vertical exposes to the platform control plane
- `artifactMappings`: artifact families the vertical can materialize, including `opportunity_artifact` when the vertical supports opportunity framing or reporting
- `policyProfile`: research-layer policy boundary, including read-only status and any explicit exclusions around execution-adjacent behavior

## Hard rules

1. Read-only is the default research-layer mode.
2. Realtime facts must remain tool-backed.
3. Proposal and execution are separate.
4. Signal and proposal are separate.
5. Funding-basis is a wedge, not Prism’s permanent identity.
6. Continuous monitoring must derive from approved prior research state, not hidden prompt-only memory.
