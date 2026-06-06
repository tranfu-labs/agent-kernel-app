import test from "node:test";
import assert from "node:assert/strict";
import {
  createResearchState,
  isMethodLocked,
  type ResearchState,
  type SourceMap,
} from "../src/index.js";

test("createResearchState starts after goal framing in method exploration with structured pause state", () => {
  const state = createResearchState({
    goal: "Research documentation sources for a support assistant",
    scope: "Product docs and FAQ pages",
    vertical: "knowledge_base",
  });

  const expectedSourceMap: SourceMap = {
    entries: [],
  };

  assert.equal(state.currentPhase, "method_exploration");
  assert.equal(state.methodState.status, "exploring");
  assert.equal(state.autonomyMode, "pause_required");
  assert.equal(state.pauseState?.reason, "method_lock_required");
  assert.deepEqual(state.sourceMap, expectedSourceMap);
  assert.deepEqual(state.artifactSet, []);
});

test("isMethodLocked only returns true for locked method states", () => {
  const exploring: ResearchState = createResearchState({
    goal: "Research support workflow",
    scope: "Public docs",
    vertical: "support_assistant",
  });

  const locked: ResearchState = {
    ...exploring,
    methodState: {
      ...exploring.methodState,
      status: "locked",
      selectedMethod: "multi_source_document_research",
    },
    autonomyMode: "auto_with_notice",
    pauseState: undefined,
  };

  assert.equal(isMethodLocked(exploring), false);
  assert.equal(isMethodLocked(locked), true);
});
