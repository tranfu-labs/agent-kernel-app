export type PlatformIntent =
  | "discover"
  | "explore_method"
  | "explain"
  | "report"
  | "compare"
  | "refresh"
  | "monitor"
  | "emit_signal"
  | "propose"
  | "evaluate_risk"
  | "inspect_source"
  | "extension_required"
  | "general";

import type { PlatformVertical } from "./platform-capability-routing.js";

export function resolvePlatformIntent(input: { input: string; vertical: PlatformVertical }): PlatformIntent {
  const normalizedInput = input.input;

  if (/extension required|needs? (an )?extension|unsupported|暂不支持|扩展/i.test(normalizedInput)) {
    return "extension_required";
  }

  if (input.vertical === "general") {
    return "general";
  }
  if (/monitor|watch|alert|跟踪|监控/i.test(normalizedInput)) return "monitor";
  if (/signal|变化|告警/i.test(normalizedInput)) return "emit_signal";
  if (/risk|风险/i.test(normalizedInput)) return "evaluate_risk";
  if (/proposal|建议方案|提案/i.test(normalizedInput)) return "propose";
  if (/compare|对比/i.test(normalizedInput)) return "compare";
  if (/refresh|更新|刷新/i.test(normalizedInput)) return "refresh";
  if (/report|报告/i.test(normalizedInput)) return "report";
  if (/explain|解释|why|candidate/i.test(normalizedInput)) return "explain";
  if (/method|方法|路径/i.test(normalizedInput)) return "explore_method";
  if (/discover|find|scan|找|寻找|机会|研究/i.test(normalizedInput)) return "discover";
  if (/source|api|规则|来源/i.test(normalizedInput)) return "inspect_source";
  if (input.vertical === "prediction_market") {
    return "inspect_source";
  }
  return "general";
}
