import type { PlatformIntent } from "./platform-intent.js";

export type PlatformPath =
  | "path_explore_method"
  | "path_discover"
  | "path_explain"
  | "path_report"
  | "path_compare"
  | "path_refresh"
  | "path_monitor"
  | "path_emit_signal"
  | "path_propose"
  | "path_evaluate_risk"
  | "path_inspect_source"
  | "path_extension_required"
  | "path_general";

export function choosePlatformPath(intent: PlatformIntent): PlatformPath {
  switch (intent) {
    case "explore_method":
      return "path_explore_method";
    case "discover":
      return "path_discover";
    case "explain":
      return "path_explain";
    case "report":
      return "path_report";
    case "compare":
      return "path_compare";
    case "refresh":
      return "path_refresh";
    case "monitor":
      return "path_monitor";
    case "emit_signal":
      return "path_emit_signal";
    case "propose":
      return "path_propose";
    case "evaluate_risk":
      return "path_evaluate_risk";
    case "inspect_source":
      return "path_inspect_source";
    case "extension_required":
      return "path_extension_required";
    case "general":
    default:
      return "path_general";
  }
}
