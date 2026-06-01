import type { Artifact } from "@agentkernel/domain";
import {
  explainMissingOpportunityArtifact,
  explainOpportunityArtifact,
  READ_ONLY_OPPORTUNITY_EXPLANATION_BOUNDARY,
  type OpportunityExplanation,
  type OpportunityExplanationStatus,
} from "./opportunity-explanation.js";

export interface OpportunityResearchReport {
  artifactId: string;
  status: OpportunityExplanationStatus;
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

export function generateMissingOpportunityResearchReport(artifactId: string): OpportunityResearchReport {
  return reportFromExplanation(explainMissingOpportunityArtifact(artifactId));
}

export function generateOpportunityResearchReport(artifact: Artifact): OpportunityResearchReport {
  return reportFromExplanation(explainOpportunityArtifact(artifact));
}

function reportFromExplanation(explanation: OpportunityExplanation): OpportunityResearchReport {
  const executiveSummary = buildExecutiveSummary(explanation);
  const thesis = explanation.status === "ok" ? explanation.whyInteresting : [];
  const evidence = buildEvidence(explanation);
  const risks = explanation.warnings.length > 0 ? explanation.warnings : ["No artifact warnings were recorded."];
  const limitations = buildLimitations(explanation);

  const report: OpportunityResearchReport = {
    artifactId: explanation.artifactId,
    status: explanation.status,
    title: explanation.title,
    executiveSummary,
    thesis,
    keyMetrics: explanation.keyMetrics,
    evidence,
    risks,
    scoreExplanation: explanation.scoreExplanation,
    lineage: explanation.lineage,
    assumptions: explanation.assumptions,
    limitations,
    readOnlyBoundary: READ_ONLY_OPPORTUNITY_EXPLANATION_BOUNDARY,
    suggestedFollowUps: explanation.suggestedFollowUps,
    markdown: "",
  };

  report.markdown = buildMarkdown(report);
  return report;
}

function buildExecutiveSummary(explanation: OpportunityExplanation): string {
  if (explanation.status !== "ok") return `No research report was generated because artifact ${explanation.artifactId} returned status ${explanation.status}.`;
  const title = explanation.title ?? explanation.opportunityId ?? explanation.artifactId;
  const netEdge = explanation.keyMetrics.netEdgeBps !== undefined ? ` Estimated net edge is ${explanation.keyMetrics.netEdgeBps} bps.` : " Estimated net edge is unavailable.";
  const score = explanation.keyMetrics.score !== undefined ? ` Saved score is ${explanation.keyMetrics.score}.` : " Saved score is unavailable.";
  return `${title} is a saved opportunity artifact research report.${netEdge}${score}`;
}

function buildEvidence(explanation: OpportunityExplanation): string[] {
  const evidence: string[] = [];

  if (explanation.lineage.opportunityIds.length > 0) evidence.push(`Opportunity lineage: ${explanation.lineage.opportunityIds.join(", ")}.`);
  if (explanation.lineage.marketContextIds.length > 0) evidence.push(`Market context lineage: ${explanation.lineage.marketContextIds.join(", ")}.`);
  if (explanation.lineage.comparisonIds.length > 0) evidence.push(`Comparison lineage: ${explanation.lineage.comparisonIds.join(", ")}.`);
  if (explanation.lineage.signalIds.length > 0) evidence.push(`Signal lineage: ${explanation.lineage.signalIds.join(", ")}.`);
  if (explanation.legs.length > 0) evidence.push(`Legs: ${explanation.legs.map((leg) => `${leg.side} ${leg.symbol} on ${leg.venue}`).join("; ")}.`);

  return evidence.length > 0 ? evidence : ["No lineage evidence was available in the saved artifact."];
}

function buildLimitations(explanation: OpportunityExplanation): string[] {
  const limitations = [
    "This report uses saved artifact facts only and does not refresh live market data by default.",
    "Funding rates, depth, fees, slippage, and venue conditions may have changed after artifact creation.",
  ];

  if (explanation.status !== "ok") limitations.push("The source artifact could not be converted into a valid opportunity explanation.");
  if (explanation.lineage.marketContextIds.length === 0) limitations.push("The artifact does not include market-context lineage IDs.");

  return limitations;
}

function buildMarkdown(report: OpportunityResearchReport): string {
  return [
    `# ${report.title ?? `Opportunity Research Report: ${report.artifactId}`}`,
    "",
    "## Executive Summary",
    report.executiveSummary,
    "",
    "## Thesis",
    ...bullets(report.thesis),
    "",
    "## Key Metrics",
    ...bullets(metricLines(report.keyMetrics)),
    "",
    "## Evidence",
    ...bullets(report.evidence),
    "",
    "## Risks",
    ...bullets(report.risks),
    "",
    "## Score Explanation",
    ...bullets(report.scoreExplanation),
    "",
    "## Assumptions",
    ...bullets(report.assumptions),
    "",
    "## Limitations",
    ...bullets(report.limitations),
    "",
    "## Boundary",
    report.readOnlyBoundary,
  ].join("\n");
}

function bullets(values: string[]): string[] {
  return values.length > 0 ? values.map((value) => `- ${value}`) : ["- unavailable"];
}

function metricLines(metrics: OpportunityResearchReport["keyMetrics"]): string[] {
  return [
    metrics.grossEdgeBps !== undefined ? `Gross edge: ${metrics.grossEdgeBps} bps` : undefined,
    metrics.feeEstimateBps !== undefined ? `Fee estimate: ${metrics.feeEstimateBps} bps` : undefined,
    metrics.slippageEstimateBps !== undefined ? `Slippage estimate: ${metrics.slippageEstimateBps} bps` : undefined,
    metrics.netEdgeBps !== undefined ? `Net edge: ${metrics.netEdgeBps} bps` : undefined,
    metrics.confidence !== undefined ? `Confidence: ${metrics.confidence}` : undefined,
    metrics.score !== undefined ? `Score: ${metrics.score}` : undefined,
  ].filter((value): value is string => value !== undefined);
}
