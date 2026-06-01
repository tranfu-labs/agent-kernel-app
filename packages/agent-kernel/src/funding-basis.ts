// Funding-basis reference vertical — the financial example domain, exposed via the
// "@agentkernel/agent-kernel/funding-basis" subpath. In a later phase these symbols relocate
// into a standalone `verticals/funding-basis` package; this barrel is the migration seam so
// consumers depend on the vertical surface, not on the kernel core barrel.
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
