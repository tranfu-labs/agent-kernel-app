import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const EXECUTION_TOOL_NAMES = new Set([
  "place_order",
  "cancel_order",
  "close_position",
]);

export default function prismPermissionGate(pi: ExtensionAPI) {
  pi.on("tool_call", async (event, ctx) => {
    if (!EXECUTION_TOOL_NAMES.has(event.toolName)) return undefined;

    if (!ctx.hasUI) {
      return {
        block: true,
        reason: "Execution tool blocked: interactive confirmation is required.",
      };
    }

    const choice = await ctx.ui.select(
      `Prism execution tool requested: ${event.toolName}\n\nAllow this tool call?`,
      ["No", "Yes"],
    );

    if (choice !== "Yes") {
      return { block: true, reason: "Execution tool blocked by user." };
    }

    return undefined;
  });
}
