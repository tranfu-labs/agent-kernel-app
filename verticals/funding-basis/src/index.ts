// Funding-basis reference vertical — the financial example domain exposed as
// `@agentkernel/funding-basis`. This is the migration surface for funding-specific prompt,
// tools, routing, operations, and market-data helpers so consumers do not depend on the
// domain-free kernel core.
export * from "./funding-basis-plugin.js";
export * from "./prism-runtime-context.js";
export * from "./prism-system-prompt.js";
export * from "./register-prism-tools.js";
export * from "./session-artifact-references.js";
export * from "./path-guidance.js";
export * from "./platform-followup-resolution.js";
export * from "./platform-intent-guidance.js";
export * from "./platform-intent-resolution.js";
export * from "./platform-orchestration-template.js";
export * from "./platform-policy-gate.js";
export * from "./platform-tool-access.js";
export * from "./platform-vertical-resolution.js";
export * from "./funding-basis-copilot-guidance.js";

// Funding operations/tools migration surface. Phase 2 makes consumers depend on the vertical
// package first; later file moves can be internal to this package without changing callers.
export * from "@agentkernel/operations";
export * from "@agentkernel/tools";
