"use client";

import { CopilotChat } from "@copilotkit/react-core/v2";

import { ModelMenu } from "./model-menu";

export function ChatPanel({ sessionId, threadId }: { sessionId: string; threadId: string }) {
  return (
    <section className="ak-chat-panel" aria-label="Active discussion">
      <ModelMenu />
      <CopilotChat
        key={sessionId}
        threadId={threadId}
        className="ak-chat"
        labels={{
          welcomeMessageText: "Hi, I'm your AgentKernel assistant. Ask me anything.",
          chatInputPlaceholder: "Message the agent...",
          chatDisclaimerText: "The agent can make mistakes. Verify important information.",
        }}
      />
    </section>
  );
}
