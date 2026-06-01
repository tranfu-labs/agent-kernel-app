# Design: Artifact-Backed Opportunity Research Report

## Architecture

```text
User provides artifactId
  -> Pi Agent calls generate_opportunity_research_report
  -> tool reads ctx.artifactStore.get(artifactId)
  -> tool handles missing artifact
  -> generateOpportunityResearchReport delegates to explainOpportunityArtifact
  -> operation formats deterministic structured report
  -> tool returns JSON details
```

## Dependency Direction

```text
packages/agent-kernel -> @agentkernel/operations
packages/agent-kernel -> runtime artifact store
packages/operations -> @agentkernel/domain
```

Disallowed:

```text
@agentkernel/operations -> @agentkernel/tools
generate_opportunity_research_report -> get_market_context by default
generate_opportunity_research_report schema -> account/order/leverage/margin/transfer/withdrawal/credential fields
```

## Report Contract

```ts
interface OpportunityResearchReport {
  artifactId: string;
  status: "ok" | "not_found" | "unsupported_artifact_type" | "invalid_artifact";
  title?: string;
  executiveSummary: string;
  thesis: string[];
  keyMetrics: OpportunityExplanation["keyMetrics"];
  evidence: string[];
  risks: string[];
  scoreExplanation: string[];
  lineage: OpportunityExplanation["lineage"];
  assumptions: string[];
  limitations: string[];
  readOnlyBoundary: string;
  suggestedFollowUps: string[];
  markdown: string;
}
```

## Safety

The report is research output only. It must include the same read-only boundary used by opportunity explanation and must not introduce execution, account, credential, leverage, margin, transfer, or withdrawal fields.
