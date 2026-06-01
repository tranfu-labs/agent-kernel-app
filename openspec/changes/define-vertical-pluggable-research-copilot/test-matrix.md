## Blueprint acceptance checks

### 1. Proposal states scope and non-goals
- Check: `proposal.md` explicitly lists out-of-scope or non-goal exclusions for private APIs, account/wallet state, orders/execution, and implementation work.
- Command: `grep -n "Out of scope / non-goals\|private\|wallet\|execution\|implementation work" "/Users/griffith/Projects/Prism/openspec/changes/define-vertical-pluggable-research-copilot/proposal.md"`
- Expected evidence: matching lines under an `Out of scope / non-goals` section plus an `Acceptance outcomes` section.

### 2. Proposal defines testable blueprint outcomes
- Check: `proposal.md` contains acceptance outcomes for the blueprint change itself, including OpenSpec validation.
- Command: `grep -n "Acceptance outcomes\|openspec validate" "/Users/griffith/Projects/Prism/openspec/changes/define-vertical-pluggable-research-copilot/proposal.md"`
- Expected evidence: explicit, document-level outcomes that can be verified without implementation code.

### 3. Design names affected Prism planes
- Check: `design.md` explicitly names the Information, Energy, and Material planes.
- Command: `grep -n "Prism planes affected\|Information plane\|Energy plane\|Material plane" "/Users/griffith/Projects/Prism/openspec/changes/define-vertical-pluggable-research-copilot/design.md"`
- Expected evidence: a dedicated section that identifies all three planes and describes their role in this blueprint.

### 4. Design makes the safety boundary explicit
- Check: `design.md` defines a research-only safety boundary with allowed/disallowed behavior and required separation between signal, proposal, and execution.
- Command: `grep -n "Safety boundary\|Disallowed\|Required separation\|execution" "/Users/griffith/Projects/Prism/openspec/changes/define-vertical-pluggable-research-copilot/design.md"`
- Expected evidence: explicit text that excludes private/authenticated endpoints, account or wallet state, and order/execution paths.

### 5. Tasks separate blueprint now from implementation later
- Check: `tasks.md` separates blueprint authoring/validation acceptance from future implementation slices.
- Command: `grep -n "Blueprint slice\|Acceptance for this slice now\|Future implementation slices later\|Future implementation verification later" "/Users/griffith/Projects/Prism/openspec/changes/define-vertical-pluggable-research-copilot/tasks.md"`
- Expected evidence: completed blueprint items are marked for this slice now, while code/test/smoke work remains explicitly deferred.

## Later implementation verification targets

These checks are intentionally deferred to later implementation slices; this blueprint change only defines what those checks must prove.

### 6. Intent taxonomy resolution remains vertical-independent
- Check: the eventual implementation resolves canonical intents before any vertical-specific capability/tool binding.
- Suggested command later: `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/domain -- --runInBand`
- Expected evidence later: contract tests showing a shared taxonomy can route funding-basis and future verticals without changing intent names.

### 7. Capability routing selects path before tool
- Check: orchestration chooses a platform path/capability entrypoint before selecting any concrete tool/provider.
- Suggested command later: `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations -- --runInBand`
- Expected evidence later: test assertions or snapshots proving path selection precedes tool binding.

### 8. Refresh creates delta artifacts without mutating originals
- Check: refresh flow creates `refresh_artifact` lineage and only optionally derives a new artifact version.
- Suggested command later: `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/storage -- --runInBand`
- Expected evidence later: persisted lineage showing original artifact immutability plus derived refresh outputs.

### 9. Proposal schemas exclude account/order/execution fields
- Check: proposal-facing contracts exclude account IDs, balances, wallet addresses, order payloads, and execution directives.
- Suggested command later: `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/domain -- --runInBand`
- Expected evidence later: schema assertions proving proposal artifacts stay inside the research boundary.

### 10. Evaluate-risk remains deterministic
- Check: risk evaluation over the same inputs yields stable outputs and does not depend on hidden runtime state.
- Suggested command later: `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations -- --runInBand`
- Expected evidence later: repeated test runs with identical fixtures returning identical results.

### 11. Monitor emission produces signal artifacts with lineage
- Check: monitor workflows produce `signal_artifact` outputs linked back to approved prior research state.
- Suggested command later: `npm --prefix "/Users/griffith/Projects/Prism" run smoke:monitor-signal`
- Expected evidence later: smoke output or persisted records showing signal lineage to prior artifacts.

### 12. Research-layer code respects safety boundaries
- Check: implementation does not introduce execution/account/private-field research schemas, `@agentkernel/tools` imports in compare/proposal/evaluate_risk operations, or raw provider references in agent-kernel routing/guidance.
- Suggested commands later:
  - `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/agent-kernel -- --runInBand`
  - `npm --prefix "/Users/griffith/Projects/Prism" run typecheck`
- Expected evidence later: passing tests/static checks plus code review confirming boundary compliance.

## OpenSpec validation

### 13. Change bundle validates
- Check: the OpenSpec change bundle parses and validates after the blueprint edits.
- Command: `openspec validate "define-vertical-pluggable-research-copilot"`
- Expected evidence: command exits successfully with no validation errors.
