# Critic Review

## Finding 1: Artifact content may be too thin

Current funding-basis opportunity artifacts preserve the opportunity object and key lineage fields, but assumptions and provider fact references are not yet fully explicit in the Material envelope.

### Rebuttal / Decision

Accept. MVP explanation will use the existing `Opportunity` content shape, artifact lineage fields, markdown summary, risk flags, and score explanation. Missing assumptions or lineage are surfaced as warnings instead of being invented. Material envelope hardening remains follow-up work tracked by the prior funding-basis change.

## Finding 2: Agent might refresh live data during explanation

Live refresh could mix historical artifact facts with new market facts and make the explanation nondeterministic.

### Rebuttal / Decision

Accept. `explain_opportunity_artifact` only reads the artifact store and delegates to a pure operation. Drilldown/refresh remains a future explicit user-requested flow outside this MVP slice.

## Finding 3: Explanation might sound like execution advice

Opportunity explanations can drift into trade recommendations if the boundary is not explicit.

### Rebuttal / Decision

Accept. Every explanation includes the exact read-only boundary text and suggested follow-ups that avoid execution steps.

## Finding 4: Artifact ID first is less ergonomic than “first opportunity”

Users may prefer session-index follow-ups.

### Rebuttal / Decision

Accept. Artifact ID first is deterministic and testable for MVP. Session-index references can later map to artifact IDs without changing the explanation operation.
