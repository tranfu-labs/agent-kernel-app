# Lens: Artifact Lineage

## Trigger conditions

Use this lens for OpportunityArtifact, TradeProposalArtifact, research reports, evidence bundles, operation outputs, and any workflow where a user may later ask "why is this opportunity valid?" or "what data produced this result?".

## Purpose

Ensure Prism outputs are durable, inspectable product objects rather than disposable chat text.

## Checks

1. **Artifact existence:** Important opportunity/proposal/research outputs SHOULD be materialized as artifacts when the workflow produces reusable results.
2. **Evidence linkage:** Artifacts SHOULD reference evidence bundle IDs or include evidence summaries.
3. **Comparison linkage:** Cross-venue artifacts SHOULD reference comparison IDs where applicable.
4. **Signal linkage:** Opportunity artifacts SHOULD reference signal IDs where applicable.
5. **Calculation inputs:** Artifacts SHOULD preserve calculation inputs for edge, fee, slippage, score, and freshness where applicable.
6. **Warnings:** Artifacts SHOULD include provider/status/freshness warnings that affect interpretation.
7. **Future-turn usability:** Output SHOULD include artifact IDs so future turns can inspect or explain saved artifacts.
8. **No chat-only result:** A workflow that claims to produce a durable opportunity SHOULD NOT only return prose.

## Evidence to collect

Inspect:

```text
packages/domain/src/artifact.ts
packages/domain/src/evidence.ts
packages/domain/src/opportunity.ts
packages/operations/src/*artifact*.ts
packages/tools/src/artifacts/
apps/agent-api/src/smoke-*.ts
```

Check operation outputs for `artifactId` or `artifactIds`.

## Pass criteria

- Artifacts include enough lineage to explain their origin.
- Operation outputs expose artifact IDs when saving is enabled.
- Warnings and freshness survive into artifacts.
- Future explanation flows can retrieve and reason from saved artifacts.

## Fail / partial criteria

- **FAIL:** Operation returns only chat/prose for durable opportunity output.
- **FAIL:** Artifact lacks references to evidence/comparison/signal or equivalent embedded lineage.
- **PARTIAL:** Artifact exists but omits warnings/freshness/calculation inputs.
- **PARTIAL:** Artifact is saved but output does not return artifact ID.

## Bad examples

<bad-example>
Opportunity scan returns:

```json
{ "summary": "ETH looks interesting" }
```

WRONG. It must return structured opportunity data and artifact IDs when saving is enabled.
</bad-example>

<bad-example>
Artifact stores only final score and title.

WRONG. It should include lineage and calculation context sufficient for later explanation.
</bad-example>
