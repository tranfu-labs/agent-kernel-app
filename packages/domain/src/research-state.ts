import type { SourceMap } from "./source-map.js";

// Open vertical identifier: a vertical declares its own id (e.g. "funding_basis") without
// editing `domain`. Known ids are kept as literals for autocomplete; `(string & {})` keeps
// the type open. (Phase 2 relocates the financial id constants into the funding vertical.)
// eslint-disable-next-line @typescript-eslint/ban-types
export type ResearchVertical = "funding_basis" | "prediction_market" | (string & {});

export type ResearchPhase =
  | "goal_framing"
  | "method_exploration"
  | "source_mapping"
  | "fact_gathering"
  | "synthesis"
  | "materialization"
  | "monitoring"
  | "proposal_review";

export type AutonomyMode = "auto" | "auto_with_notice" | "pause_required";

export type PauseReason =
  | "goal_change_required"
  | "scope_expansion_requires_confirmation"
  | "source_conflict"
  | "method_lock_required"
  | "proposal_review_required"
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
