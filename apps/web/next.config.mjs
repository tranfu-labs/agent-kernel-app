/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The Pi engine and the AgentKernel server packages are Node-only (heavy, ESM, dynamic
  // requires). Keep them OUT of the bundler and require them at runtime from node_modules.
  // This only works on a persistent Node server (`next start`), not on edge/serverless.
  serverExternalPackages: [
    "@earendil-works/pi-coding-agent",
    "@agentkernel/agent-kernel",
    "@agentkernel/agui-bridge",
    "@agentkernel/storage",
  ],
};

export default nextConfig;
