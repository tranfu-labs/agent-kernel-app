import test from "node:test";
import assert from "node:assert/strict";
import type { Artifact } from "@agentkernel/domain";
import { MemoryArtifactStore } from "../src/memory-artifact-store.js";

test("MemoryArtifactStore reads saved artifacts by ID", async () => {
  const store = new MemoryArtifactStore();
  const artifact: Artifact<{ value: string }> = {
    id: "artifact_support_handbook_summary",
    type: "research_brief",
    title: "Support handbook summary",
    objectIds: [],
    contentJson: { value: "fixture" },
    createdAt: "2026-05-30T00:00:00.000Z",
    updatedAt: "2026-05-30T00:00:00.000Z",
  };

  await store.save(artifact);

  assert.deepEqual(await store.get(artifact.id), artifact);
  assert.equal(await store.get("missing_artifact"), undefined);
});

test("MemoryArtifactStore keeps original and derived refresh artifacts", async () => {
  const store = new MemoryArtifactStore();
  const artifact: Artifact<{ value: string }> = {
    id: "artifact_support_handbook_summary",
    type: "research_brief",
    title: "Support handbook summary",
    objectIds: [],
    contentJson: { value: "fixture" },
    createdAt: "2026-05-30T00:00:00.000Z",
    updatedAt: "2026-05-30T00:00:00.000Z",
  };
  const refreshArtifact = {
    artifactRef: artifact.id,
    refreshedAt: "2026-05-31T00:00:00.000Z",
    sourceRefs: ["docs:product", "docs:faq"],
    deltaSummary: ["FAQ coverage was expanded."],
    warnings: [],
    preservedArtifactRef: artifact.id,
  };

  await store.save(artifact);
  await store.saveDerivedArtifact("workflow_artifact_support_handbook_summary", refreshArtifact);

  assert.deepEqual(await store.get(artifact.id), artifact);
  assert.deepEqual(await store.get("workflow_artifact_support_handbook_summary"), refreshArtifact as Artifact);
});
