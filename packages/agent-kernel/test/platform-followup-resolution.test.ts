import test from "node:test";
import assert from "node:assert/strict";
import { resolvePlatformFollowup } from "../src/funding-basis.js";

test("resolvePlatformFollowup requires opportunity artifacts for explain follow-ups", () => {
  const result = resolvePlatformFollowup({
    input: "Why is the first opportunity good?",
    intent: "explain",
    path: "path_explain",
  });

  assert.equal(result.requiresArtifactContext, true);
  assert.equal(result.requiredArtifactKind, "opportunity_artifact");
  assert.deepEqual(result.notes, ["explanations must resolve a previously identified opportunity artifact"]);
});

test("resolvePlatformFollowup requires artifact collections for report follow-ups", () => {
  const result = resolvePlatformFollowup({
    input: "Report the best opportunities",
    intent: "report",
    path: "path_report",
  });

  assert.equal(result.requiresArtifactContext, true);
  assert.equal(result.requiredArtifactKind, "artifact_collection");
  assert.deepEqual(result.notes, ["reports must resolve an artifact collection before generation"]);
});

test("resolvePlatformFollowup requires opportunity artifacts for proposal follow-ups", () => {
  const result = resolvePlatformFollowup({
    input: "Propose the best trade plan",
    intent: "propose",
    path: "path_propose",
  });

  assert.equal(result.requiresArtifactContext, true);
  assert.equal(result.requiredArtifactKind, "opportunity_artifact");
  assert.deepEqual(result.notes, ["proposals must start from a previously identified opportunity artifact"]);
});

test("resolvePlatformFollowup requires proposal artifacts for risk evaluation follow-ups", () => {
  const result = resolvePlatformFollowup({
    input: "Evaluate the proposal risk",
    intent: "evaluate_risk",
    path: "path_evaluate_risk",
  });

  assert.equal(result.requiresArtifactContext, true);
  assert.equal(result.requiredArtifactKind, "proposal_artifact");
  assert.deepEqual(result.notes, ["risk evaluation must inspect a proposal artifact"]);
});

test("resolvePlatformFollowup leaves unrelated paths artifact-agnostic", () => {
  const result = resolvePlatformFollowup({
    input: "Inspect funding rates",
    intent: "inspect_source",
    path: "path_inspect_source",
  });

  assert.equal(result.requiresArtifactContext, false);
  assert.equal(result.requiredArtifactKind, undefined);
  assert.deepEqual(result.notes, ["no artifact context is required for this path"]);
});
