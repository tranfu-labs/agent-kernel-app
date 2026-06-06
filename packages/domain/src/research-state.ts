import type { SourceMap } from "./source-map.js";

export type ResearchVertical = "general" | (string & {});

export type ResearchPhase =
  | "goal_framing"
  | "method_exploration"
  | "source_mapping"
  | "fact_gathering"
  | "synthesis"
  | "materialization"
  | "monitoring"
  | "review";

export type AutonomyMode = "auto" | "auto_with_notice" | "pause_required";

export type PauseReason =
  | "goal_change_required"
  | "scope_expansion_requires_confirmation"
  | "source_conflict"
  | "method_lock_required"
  | "boundary_guard";

export interface MethodState {
  status: "exploring" | "compared" | "locked" | "superseded";
  candidateMethods: string[];
  selectedMethod?: string;
  methodArtifacts: string[];
  methodSelectionReason?: string;
  requiredCapabilities: string[];
  requiresPrivateApis: boolean;
}

export interface ResearchPauseState {
  reason: PauseReason;
  detail: string;
}

export interface ResearchState {
  goal: string;
  scope: string;
  vertical: ResearchVertical;
  currentPhase: ResearchPhase;
  intentStack: string[];
  methodState: MethodState;
  sourceMap: SourceMap;
  factSet: string[];
  candidateSet: string[];
  artifactSet: string[];
  openQuestions: string[];
  nextSteps: string[];
  autonomyMode: AutonomyMode;
  pauseState?: ResearchPauseState;
  history: string[];
}

export function createResearchState(input: {
  goal: string;
  scope: string;
  vertical: ResearchVertical;
}): ResearchState {
  return {
    goal: input.goal,
    scope: input.scope,
    vertical: input.vertical,
    currentPhase: "method_exploration",
    intentStack: ["explore_method"],
    methodState: {
      status: "exploring",
      candidateMethods: [],
      methodArtifacts: [],
      requiredCapabilities: [],
      requiresPrivateApis: false,
    },
    sourceMap: {
      entries: [],
    },
    factSet: [],
    candidateSet: [],
    artifactSet: [],
    openQuestions: [],
    nextSteps: [],
    autonomyMode: "pause_required",
    pauseState: {
      reason: "method_lock_required",
      detail: "Method selection must be locked before live discovery or monitoring.",
    },
    history: [],
  };
}

export function isMethodLocked(state: ResearchState): boolean {
  return state.methodState.status === "locked";
}
