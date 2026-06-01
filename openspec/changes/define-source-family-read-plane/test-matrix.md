## Blueprint acceptance checks

### 1. Proposal states why Prism needs a source-family read plane
- Check: `proposal.md` explicitly explains why one-function-per-source growth is not acceptable for Prism’s north star.
- Command: `grep -n "one-function-per-source\|workspace-first\|artifact-first\|source-family" "/Users/griffith/Projects/Prism/openspec/changes/define-source-family-read-plane/proposal.md"`
- Expected evidence: clear explanation that Prism is a product platform, not a connector pile.

### 2. Proposal defines out-of-scope boundaries
- Check: `proposal.md` explicitly excludes private/authenticated connectors, balances/positions/orders/execution, full UI/workspace redesign, and full implementation work.
- Command: `grep -n "Out of scope / non-goals\|private\|execution\|UI\|implementation" "/Users/griffith/Projects/Prism/openspec/changes/define-source-family-read-plane/proposal.md"`
- Expected evidence: explicit exclusions that keep the slice architectural and read-only.

### 3. Design rejects a fake universal cross-market payload schema
- Check: `design.md` explicitly says one universal payload schema is forbidden.
- Command: `grep -n "universal\|payload schema is forbidden\|shared envelope" "/Users/griffith/Projects/Prism/openspec/changes/define-source-family-read-plane/design.md"`
- Expected evidence: common envelope + family-specific payload rule.

### 4. Design defines source families and capability registry
- Check: `design.md` names the initial source families and capability registry fields.
- Command: `grep -n "source family\|capability registry\|capabilityKey\|venue_market_data\|event_rules_data\|contextual_evidence" "/Users/griffith/Projects/Prism/openspec/changes/define-source-family-read-plane/design.md"`
- Expected evidence: explicit family list and semantic capability pattern.

### 5. Design keeps providers replaceable and product semantics in Prism
- Check: `design.md` states adapters are replaceable, operations are provider-agnostic, and agent-visible tools remain high-level.
- Command: `grep -n "replaceable\|provider-agnostic\|Agent tool boundary\|endpoint-shaped" "/Users/griffith/Projects/Prism/openspec/changes/define-source-family-read-plane/design.md"`
- Expected evidence: clear provider boundary and anti-sprawl tool rule.

### 6. Tasks define a staged adoption path rather than a big-bang rewrite
- Check: `tasks.md` separates blueprint authoring now from later implementation slices.
- Command: `grep -n "Blueprint slice\|Immediate implementation slices later\|Future verification later" "/Users/griffith/Projects/Prism/openspec/changes/define-source-family-read-plane/tasks.md"`
- Expected evidence: current slice is spec-only, implementation staged later.

## First implementation slice verification targets

These checks are the minimum acceptance set for the **venue_market_data proving slice**.

### 7. Domain contracts exist for source descriptors, capabilities, and fact envelopes
- Suggested evidence: tests in `@agentkernel/domain` covering `sourceId`, `sourceFamily`, `authRequirement`, `freshnessClass`, `status`, `coverage`, and payload family typing for `venue_market_data`.

### 8. Existing exchange read plane is registered as the first `venue_market_data` family
- Suggested evidence: adapter/query-service tests in `@agentkernel/tools` proving Binance/Bitget expose semantic capabilities (`instrument.catalog`, `market.snapshot`, `market.funding`, `market.depth`) rather than only endpoint helpers.

### 9. `getMarketContext()` is rerouted through the family service without changing its public output shape
- Suggested evidence: a compatibility test in `@agentkernel/tools` asserting the same `contexts`, `status`, `warnings`, and `fetchedAt` semantics as before.

### 10. Funding-basis operations remain unchanged and green
- Suggested evidence: existing `@agentkernel/operations` tests stay green with no changes to operation files, proving the new family layer is additive and non-disruptive.

### 11. Agent-visible tools remain operation-level and unchanged
- Suggested evidence: no diff in `packages/agent-kernel/src/register-prism-tools.ts`, and no new endpoint-shaped user tools are added.

## Later implementation verification targets

### 12. Structured degradation becomes first-class
- Suggested evidence later: tests for timeout / partial / rate-limited / unsupported provider states producing explicit coverage and blocked-comparison semantics.

### 13. Second-family sample proves non-exchange extensibility
- Suggested evidence later: one event/rules or contextual-evidence family integration that uses the same envelope/governance pattern without forcing exchange-shaped payloads.

## OpenSpec validation

### 13. Change bundle validates
- Check: the OpenSpec change bundle parses and validates.
- Command: `openspec validate "define-source-family-read-plane"`
- Expected evidence: command exits successfully with no validation errors.
