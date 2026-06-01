# Prism Web ChatGPT Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current three-panel workspace homepage in `apps/web` with a first-phase ChatGPT-like Prism product shell built around a CopilotKit conversation surface.

**Architecture:** Keep Prism in control of the outer Next.js app shell, branding, welcome state, and future extension points. Let CopilotKit power the main conversation surface and composer first, then bridge Prism product state and artifact-aware modules into that surface later. In phase 1, remove `CommandBar`, `OpportunityFeed`, `OpportunityDetail`, and `ExecutionPrepPanel` from the homepage’s primary layout so the product reads as a mature AI chat application rather than an internal dashboard.

**Tech Stack:** Next.js 15, React 19, TypeScript, npm workspaces, `@copilotkit/react-core`, optional `@copilotkit/runtime`, existing `apps/web` shell files, existing `apps/agent-api` product API.

---

## File structure

### Reuse
- `apps/web/app/layout.tsx` — root metadata and top-level provider mount
- `apps/web/app/page.tsx` — homepage route, rewritten to use the new shell
- `apps/web/app/globals.css` — global reset + product shell styles
- `apps/web/package.json` — add CopilotKit dependencies and scripts if needed
- `apps/web/README.md` — update UI description from three-panel workspace to chat shell

### Create
- `apps/web/app/providers.tsx` — CopilotKit provider wrapper for the app
- `apps/web/components/prism-shell.tsx` — top-level two-column shell: sidebar + main area
- `apps/web/components/prism-sidebar.tsx` — light sidebar with Prism branding, new chat, and light history placeholders
- `apps/web/components/prism-welcome.tsx` — welcome state with headline, subtitle, lightweight prompt suggestions, and composer placement
- `apps/web/components/prism-chat-surface.tsx` — CopilotKit chat surface wrapper used for both welcome and conversation states
- `apps/web/components/prism-header.tsx` — light top header for the main content area
- `apps/web/lib/copilot-config.ts` — runtime URL, agent id, and any shell constants

### Phase-1 demotion targets
These files should stop being homepage-structuring components in phase 1. Do not delete them yet; just remove them from the primary page composition so they can be revisited in a later Prism-specific module phase.
- `apps/web/components/command-bar.tsx`
- `apps/web/components/opportunity-feed.tsx`
- `apps/web/components/opportunity-detail.tsx`
- `apps/web/components/execution-prep-panel.tsx`
- `apps/web/components/session-status.tsx`

---

### Task 1: Add CopilotKit foundation and provider

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/app/providers.tsx`
- Modify: `apps/web/app/layout.tsx`

- [ ] **Step 1: Add CopilotKit dependencies to the web app**

Update `apps/web/package.json` dependencies so phase 1 has a real conversation foundation:

```json
{
  "dependencies": {
    "@copilotkit/react-core": "^1.9.5",
    "next": "15.3.3",
    "react": "19.1.0",
    "react-dom": "19.1.0"
  }
}
```

If the installed package version differs after resolution, keep the lockfile result, but start from the `@copilotkit/react-core` package and use its `v2` entrypoints.

- [ ] **Step 2: Install dependencies and verify they resolve**

Run:

```bash
npm install
```

Expected: root workspace install completes without removing existing Prism packages.

- [ ] **Step 3: Create the app provider wrapper**

Create `apps/web/app/providers.tsx` with a minimal CopilotKit wrapper:

```tsx
"use client";

import type { ReactNode } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-core/v2/styles.css";

import { copilotRuntimeUrl } from "../lib/copilot-config";

export function Providers({ children }: { children: ReactNode }) {
  return <CopilotKit runtimeUrl={copilotRuntimeUrl}>{children}</CopilotKit>;
}
```

- [ ] **Step 4: Create the Copilot config module**

Create `apps/web/lib/copilot-config.ts`:

```ts
export const copilotRuntimeUrl = "/api/copilotkit";
export const prismCopilotAgentId = "default";
```

- [ ] **Step 5: Wrap the root layout with the provider**

Update `apps/web/app/layout.tsx` to mount the new provider:

```tsx
import type { ReactNode } from "react";

import { Providers } from "./providers";
import "./globals.css";

export const metadata = {
  title: "Prism",
  description: "Research cross-exchange arbitrage with Prism",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Run web typecheck to catch import/API issues immediately**

Run:

```bash
npm run typecheck -w @agentkernel/web
```

Expected: FAIL only if CopilotKit import names or paths differ from the installed version; adjust imports before moving on.

- [ ] **Step 7: Commit**

```bash
git add apps/web/package.json apps/web/app/providers.tsx apps/web/app/layout.tsx apps/web/lib/copilot-config.ts package-lock.json
git commit -m "feat: add CopilotKit foundation for Prism web"
```

---

### Task 2: Replace the homepage shell with ChatGPT-like app chrome

**Files:**
- Create: `apps/web/components/prism-shell.tsx`
- Create: `apps/web/components/prism-sidebar.tsx`
- Create: `apps/web/components/prism-header.tsx`
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: Create the light sidebar component**

Create `apps/web/components/prism-sidebar.tsx`:

```tsx
interface PrismSidebarProps {
  recentChats: string[];
}

export function PrismSidebar({ recentChats }: PrismSidebarProps) {
  return (
    <aside className="prism-sidebar">
      <div className="prism-sidebar-brand">
        <span className="prism-brand-mark">P</span>
        <div>
          <strong>Prism</strong>
          <p>Arbitrage research</p>
        </div>
      </div>

      <button className="prism-new-chat" type="button">
        New chat
      </button>

      <div className="prism-sidebar-section">
        <p className="prism-sidebar-label">Recent</p>
        <div className="prism-sidebar-list">
          {recentChats.map((chat) => (
            <button key={chat} className="prism-sidebar-item" type="button">
              {chat}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Create the light header component**

Create `apps/web/components/prism-header.tsx`:

```tsx
export function PrismHeader() {
  return (
    <header className="prism-header">
      <div>
        <p className="prism-header-eyebrow">Prism</p>
        <h1 className="prism-header-title">用 Prism 研究跨交易所套利机会</h1>
      </div>
      <div className="prism-header-badges">
        <span className="prism-badge">Read-only</span>
        <span className="prism-badge">Binance + Bitget</span>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Create the app shell wrapper**

Create `apps/web/components/prism-shell.tsx`:

```tsx
import type { ReactNode } from "react";

import { PrismHeader } from "./prism-header";
import { PrismSidebar } from "./prism-sidebar";

interface PrismShellProps {
  children: ReactNode;
}

const recentChats = [
  "Funding opportunities overview",
  "Compare BTC and ETH",
  "Research next steps",
];

export function PrismShell({ children }: PrismShellProps) {
  return (
    <main className="prism-app-shell">
      <PrismSidebar recentChats={recentChats} />
      <section className="prism-main-column">
        <PrismHeader />
        <div className="prism-main-surface">{children}</div>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Rewrite `apps/web/app/page.tsx` to use the new shell**

Replace the current three-panel composition with a shell-only page:

```tsx
import { PrismChatSurface } from "../components/prism-chat-surface";
import { PrismShell } from "../components/prism-shell";

export default function Page() {
  return (
    <PrismShell>
      <PrismChatSurface />
    </PrismShell>
  );
}
```

- [ ] **Step 5: Rewrite global CSS around the new layout**

Replace the old `.workspace-shell`, `.workspace-grid`, `.panel`, and placeholder-block shell styles with a chat-product shell. The new CSS must define at least these selectors:

```css
:root {
  color-scheme: dark;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #0b1020;
  color: #edf2f7;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: #0b1020;
}

body {
  min-height: 100vh;
}

.prism-app-shell {
  display: grid;
  min-height: 100vh;
  grid-template-columns: 280px minmax(0, 1fr);
  background:
    radial-gradient(circle at top, rgba(59, 130, 246, 0.14), transparent 32%),
    #0b1020;
}

.prism-sidebar {
  border-right: 1px solid rgba(148, 163, 184, 0.12);
  padding: 20px 16px;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(18px);
}

.prism-main-column {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.prism-main-surface {
  display: flex;
  min-height: 0;
  flex: 1;
}
```

Also add matching styles for `.prism-header`, `.prism-badge`, `.prism-sidebar-brand`, `.prism-new-chat`, `.prism-sidebar-label`, `.prism-sidebar-item`, and mobile collapse rules.

- [ ] **Step 6: Run the web build and verify the old shell is gone**

Run:

```bash
npm run build -w @agentkernel/web
```

Expected: PASS and no page output references to `CommandBar`, `OpportunityFeed`, `OpportunityDetail`, or `ExecutionPrepPanel` as visible homepage headings.

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/page.tsx apps/web/app/globals.css apps/web/components/prism-shell.tsx apps/web/components/prism-sidebar.tsx apps/web/components/prism-header.tsx
git commit -m "feat: replace Prism web homepage shell"
```

---

### Task 3: Add the welcome state and CopilotKit chat surface

**Files:**
- Create: `apps/web/components/prism-welcome.tsx`
- Create: `apps/web/components/prism-chat-surface.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: Create the welcome state component**

Create `apps/web/components/prism-welcome.tsx`:

```tsx
interface PrismWelcomeProps {
  suggestions: string[];
  onSuggestionClick: (value: string) => void;
}

export function PrismWelcome({ suggestions, onSuggestionClick }: PrismWelcomeProps) {
  return (
    <section className="prism-welcome">
      <div className="prism-welcome-copy">
        <p className="prism-welcome-kicker">Prism AI Research</p>
        <h2>用 Prism 研究跨交易所套利机会</h2>
        <p>
          通过对话推进发现、分析和研究准备，从 Binance 与 Bitget 的公开市场数据开始。
        </p>
      </div>

      <div className="prism-suggestion-list">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            className="prism-suggestion-item"
            onClick={() => onSuggestionClick(suggestion)}
            type="button"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create the CopilotKit chat surface wrapper**

Create `apps/web/components/prism-chat-surface.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import { CopilotChat } from "@copilotkit/react-core/v2";

import { prismCopilotAgentId } from "../lib/copilot-config";
import { PrismWelcome } from "./prism-welcome";

const suggestions = [
  "帮我看看现在有哪些值得研究的跨所机会",
  "解释为什么当前没有可信候选",
  "比较两个主要候选方向",
  "帮我整理下一步研究思路",
];

export function PrismChatSurface() {
  const [initialPrompt, setInitialPrompt] = useState<string>();

  const welcome = useMemo(
    () => <PrismWelcome suggestions={suggestions} onSuggestionClick={setInitialPrompt} />,
    [],
  );

  return (
    <section className="prism-chat-stage">
      <CopilotChat
        agentId={prismCopilotAgentId}
        className="prism-copilot-chat"
        initialMessage={initialPrompt}
        instructions={welcome}
      />
    </section>
  );
}
```

If the installed CopilotKit version uses a different prop name than `instructions` or `initialMessage`, adapt to the real API immediately. The implementation goal is stable: welcome state above or inside the chat surface, plus a typed suggestion click path into the composer.

- [ ] **Step 3: Style the welcome state and chat stage**

Add CSS for these selectors:

```css
.prism-chat-stage {
  display: flex;
  min-height: 0;
  flex: 1;
  justify-content: center;
  padding: 12px 24px 24px;
}

.prism-copilot-chat {
  display: flex;
  width: 100%;
  max-width: 960px;
  flex: 1;
}

.prism-welcome {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: 28px;
  padding: 40px 0 20px;
}

.prism-welcome-copy h2 {
  margin: 0 0 12px;
  font-size: clamp(2.2rem, 4vw, 3.6rem);
  line-height: 1.05;
}

.prism-welcome-copy p {
  max-width: 680px;
  color: #9fb0c8;
  font-size: 1.05rem;
}

.prism-suggestion-list {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
```

Also add matching styles for `.prism-suggestion-item`, `.prism-welcome-kicker`, and mobile single-column behavior.

- [ ] **Step 4: Run typecheck and build after the first real CopilotKit integration**

Run:

```bash
npm run typecheck -w @agentkernel/web && npm run build -w @agentkernel/web
```

Expected: PASS. If CopilotKit component props differ, adjust the wrapper until this passes.

- [ ] **Step 5: Manual dev verification**

Run:

```bash
PORT=3001 npm run dev -w @agentkernel/web
```

Open `http://localhost:3001` and verify:
- the page reads like a mature AI product;
- sidebar is light, not dominant;
- welcome state is the main focus before chatting;
- prompt suggestions are lightweight;
- the main composer is the visual landing point;
- there are no fixed three-column dashboard panels.

If CopilotKit is not yet backed by a runtime, it is acceptable in this task for the page to render the shell and composer while interaction is stubbed or visually present. The point of phase 1 is product shape first.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/prism-welcome.tsx apps/web/components/prism-chat-surface.tsx apps/web/app/globals.css
git commit -m "feat: add Prism chat-first welcome surface"
```

---

### Task 4: Add a minimal CopilotKit runtime bridge for local development

**Files:**
- Create: `apps/web/app/api/copilotkit/route.ts`
- Modify: `apps/web/package.json`
- Test: `npm run build -w @agentkernel/web`

- [ ] **Step 1: Create the runtime route**

Create `apps/web/app/api/copilotkit/route.ts` using the minimal CopilotKit runtime scaffold available in the installed version. Start from this structure and adjust imports to match the real package exports:

```ts
import { NextRequest } from "next/server";
import { CopilotRuntime, copilotRuntimeNextJSAppRouterEndpoint } from "@copilotkit/runtime";

const runtime = new CopilotRuntime({});

export const POST = async (request: NextRequest) => {
  const handler = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: {
      async process() {
        return {
          threadId: "prism-phase1",
          messages: [
            {
              role: "assistant",
              content:
                "Prism web chat shell is live. Domain-specific opportunity and prep modules will be layered in next.",
            },
          ],
        };
      },
    },
  });

  return handler(request);
};
```

The exact adapter shape may differ by installed version; the implementation intent is fixed: provide a minimal local conversation path so the CopilotKit surface renders and responds during phase 1.

- [ ] **Step 2: Add a dedicated web dev script if needed**

If you need a stable local entrypoint, update `apps/web/package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "typecheck": "tsc --noEmit"
  }
}
```

Do not add extra wrapper scripts unless they are actually needed.

- [ ] **Step 3: Verify the route compiles**

Run:

```bash
npm run typecheck -w @agentkernel/web && npm run build -w @agentkernel/web
```

Expected: PASS with the runtime route included.

- [ ] **Step 4: Manual end-to-end shell verification**

Run:

```bash
PORT=3001 npm run dev -w @agentkernel/web
```

In the browser, verify:
- the page renders the welcome state;
- entering text into the composer produces a basic assistant response through the CopilotKit route;
- the conversation page looks like a mature chat product rather than a dashboard or demo console.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/api/copilotkit/route.ts apps/web/package.json
git commit -m "feat: add local CopilotKit runtime bridge"
```

---

### Task 5: Retire the old homepage framing and update docs

**Files:**
- Modify: `apps/web/README.md`
- Modify: `apps/web/app/page.tsx`
- Optional delete later, but do not delete in this task: existing phase-0 workspace components

- [ ] **Step 1: Remove leftover homepage framing that implies a three-panel workspace**

Check `apps/web/app/page.tsx` and ensure it no longer imports or renders:

```tsx
CommandBar
OpportunityFeed
OpportunityDetail
ExecutionPrepPanel
SessionStatus
```

The homepage must render only the shell + chat surface.

- [ ] **Step 2: Rewrite the web README around the new product shape**

Replace the old required shell region list with a phase-1 chat-shell description like this:

```md
# Prism Web

Prism Web is the first-phase ChatGPT-like product shell for Prism.

## Phase 1 shape

The app currently prioritizes:

- a light AI-product sidebar;
- a branded welcome state;
- a CopilotKit-powered conversation surface;
- a product-grade composer;
- extension points for later Prism-specific research modules.

## Deferred to later phases

Phase 1 does not yet make opportunity cards, prep artifacts, or discover-health panels first-class homepage modules.
Those will be layered into the conversation product after the shell itself is correct.
```

- [ ] **Step 3: Run final web verification**

Run:

```bash
npm run typecheck -w @agentkernel/web && npm run build -w @agentkernel/web
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/README.md apps/web/app/page.tsx
git commit -m "docs: update Prism web phase-1 shell description"
```

---

## Final verification checklist

After all tasks:

- [ ] `npm run typecheck -w @agentkernel/web`
- [ ] `npm run build -w @agentkernel/web`
- [ ] `PORT=3001 npm run dev -w @agentkernel/web`
- [ ] Open `http://localhost:3001`
- [ ] Confirm the product now reads as a ChatGPT-like mature AI shell
- [ ] Confirm the three-panel workspace framing is gone
- [ ] Confirm the page still leaves clean extension points for Prism-specific result modules

## Self-review

- **Spec coverage:** This plan covers removal of the old homepage shell, adoption of CopilotKit for the main conversation surface and composer, creation of a light sidebar and welcome state, and deliberate deferral of heavy Prism-specific modules.
- **Placeholder scan:** No `TODO`/`TBD` placeholders remain; where CopilotKit APIs may differ by installed version, the plan names the exact adaptation point and still gives the intended behavior.
- **Type consistency:** `PrismShell`, `PrismSidebar`, `PrismHeader`, `PrismWelcome`, and `PrismChatSurface` are introduced once and referenced consistently.
