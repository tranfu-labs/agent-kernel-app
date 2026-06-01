"use client";

import { CopilotChat } from "@copilotkit/react-core/v2";

import { ModelMenu } from "../components/model-menu";

// Full-page ChatGPT/DeepSeek-style chat. The selected model is forwarded through
// <CopilotKit properties={{ model }}> and applied by KernelAgent.run via session.setModel().
export default function Page() {
  return (
    <main className="ak-page">
      <ModelMenu />
      <CopilotChat
        className="ak-chat"
        labels={{
          welcomeMessageText: "Hi, I'm your AgentKernel assistant. Ask me anything.",
          chatInputPlaceholder: "Message the agent…",
          chatDisclaimerText: "The agent can make mistakes. Verify important information.",
        }}
      />
    </main>
  );
}
