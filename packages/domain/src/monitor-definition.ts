import type { ResearchVertical } from "./research-state.js";

export interface MonitorDefinition {
  goalRef: string;
  methodRef: string;
  vertical: ResearchVertical;
  watchedEntities: string[];
  sourcePolicy: string[];
  refreshCadence: string;
  triggerConditions: string[];
  comparisonRules: string[];
  thresholds: string[];
  signalRules: string[];
  escalationRules: string[];
  pauseRules: string[];
  status: "draft" | "active" | "paused" | "archived";
}
