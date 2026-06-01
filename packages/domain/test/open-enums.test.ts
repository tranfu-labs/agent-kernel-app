import test from "node:test";
import assert from "node:assert/strict";

import { createResearchState, type ResearchVertical } from "../src/research-state.js";
import type { Artifact, ArtifactType } from "../src/artifact.js";

// T6: a vertical id the base never knew about is accepted without editing `domain`.
test("T6: ResearchVertical accepts a novel vertical id", () => {
  const vertical: ResearchVertical = "logistics_eta_monitor";
  const state = createResearchState({ goal: "g", scope: "s", vertical });
  assert.equal(state.vertical, "logistics_eta_monitor");
});

// T7: a novel artifact type is accepted; base family constants remain usable.
test("T7: ArtifactType accepts a novel type and keeps base families", () => {
  const novel: ArtifactType = "shipment_delay_report";
  const known: ArtifactType = "research_brief";
  const artifact: Artifact<{ note: string }> = {
    id: "a1",
    type: novel,
    title: "t",
    objectIds: [],
    contentJson: { note: "n" },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
  assert.equal(artifact.type, "shipment_delay_report");
  assert.equal(known, "research_brief");
});
