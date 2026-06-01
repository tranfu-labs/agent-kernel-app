// Base kernel seam — domain-free. The funding-basis reference vertical is exported from the
// "./funding-basis" subpath (see package.json "exports"), not from this barrel, so the kernel
// core carries no domain vocabulary.
export * from "./configure-provider.js";
export * from "./create-agent-session.js";
export * from "./system-prompt.js";
export * from "./vertical.js";
