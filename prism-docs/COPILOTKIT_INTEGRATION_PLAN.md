# Prism Agent × CopilotKit 对接方案

> 目标：给 Prism 当前的 **Pi Agent Kernel** 配一个 ChatGPT 式的 Web UI，用 **CopilotKit** 做交互层，确保对接 **高效、正确、丝滑**。
>
> 本文是经过多 agent 研究 + 对抗性审查后综合裁决的最终方案。所有协议/API 事实均经 CopilotKit / AG-UI / Pi SDK 官方文档或本地 `.d.ts` 核实。

---

## 0. 一句话结论

> **Pi 当引擎，CopilotKit 当车身，AG-UI 协议当传动轴。** Pi 的事件流（`session.subscribe`）和 AG-UI 的事件流近乎 1:1 同构，整个对接收敛到 **一个 sink 无关的事件翻译器**。MVP 阶段把翻译器以 **in-process 自定义 Agent** 的形式直接挂进 Next.js 里的 CopilotRuntime，**不要**单独部署 HTTP 服务、**不要**走网络 `HttpAgent`，少两跳、少一次协议转换。

---

## 1. 三个项目的定位（取长补短）

| | Pi Agent Kernel | CopilotKit | AG-UI 协议 |
|---|---|---|---|
| 角色 | agent **引擎** | agent **UI / 交互层** | 两者之间的 **接缝** |
| 强项 | 快、类型完整的事件流、工具注册、模型治理、本地可控 | ChatGPT 式对话 + **从工具调用渲染自定义 React 卡片** + HITL + 共享状态 | 开放、MIT、被 Google/AWS/LangChain 采用，前端可换 |
| 弱项 | 无任何 Web UI、无内置 HTTP server | 不自带 agent 引擎（自家 runtime 只是薄代理）、v2 API 正在迁移有坑 | — |

重叠几乎为零 → 理想的整合对象。**差异化在金融 agent，不在聊天 UI**，所以聊天 UI 层要尽量少自己造轮子。

---

## 2. 核心技术事实（决定方案）

### 2.1 Pi 的流式 API 对 Web 友好 ✅
`AgentSession` 是**回调订阅式**（不是 async iterator）：
```ts
const unsub = session.subscribe(event => { /* 翻译 → 输出 */ });
await session.prompt(userText);   // ⚠️ 只在整轮（含重试）结束才 resolve
```
- 必须从 `subscribe` 回调里流式输出，**不能等 `prompt()` 返回**。
- `agent_end` 带 `willRetry`：为 `true` 时**别**关流（重试中）。
- 无 TUI 耦合，这条路干净。

### 2.2 Pi 事件 → AG-UI 事件：近乎 1:1（方案心脏）

| Pi `AgentSessionEvent` | AG-UI 事件 | 说明 |
|---|---|---|
| `agent_start` | `RUN_STARTED {threadId,runId}` | 去重：重试会重发，只发一次 |
| `agent_end {willRetry:false}` | `RUN_FINISHED` | 先收尾所有未闭合 stream |
| `agent_end {willRetry:true}` | *(无)* | 关掉悬空 stream，保持 SSE 开 |
| `message_update` → `text_start` | `TEXT_MESSAGE_START {messageId,role}` | 每个 `messageId#contentIndex` 一次 |
| `message_update` → `text_delta` | `TEXT_MESSAGE_CONTENT {messageId,delta}` | 用 Pi message id 当 messageId |
| `message_update` → `text_end` | `TEXT_MESSAGE_END` | |
| `message_update` → `thinking_delta` | `REASONING_MESSAGE_CONTENT` | 可选，flag 控制 |
| `message_update` → `toolcall_start/delta/end` | `TOOL_CALL_START / ARGS / END` | LLM 流式吐出的「调用」 |
| `tool_execution_end` | `TOOL_CALL_RESULT {toolCallId,content}` | 工具「执行结果」 |
| `message_update` → `error` / 异常 | `RUN_ERROR {message,code}` | 终态 |

⚠️ **三个坑**：
1. 文本同时出现在 message 快照**和**嵌套的 `assistantMessageEvent` 增量里 → **只从 `assistantMessageEvent` 驱动**，否则双发重复。
2. `tool_execution_update.partialResult` 是**累积值不是增量** → 客户端 replace，且我们只在 `tool_execution_end` 发一次 `TOOL_CALL_RESULT`，不转发 `_update`。
3. 每个 `START` 必须有对应 `END`（错误/abort/重试时也要补 END），否则前端气泡错乱。

### 2.3 ⛔ 状态模型冲突（已用真实 SDK 事实裁决，结论较初稿反转）

**事实**：CopilotKit 的 `HttpAgent` / AG-UI 是 **stateless POST-per-run**，前端每轮 POST 全量历史。而 Pi `AgentSession` 是**有状态**的。

**SDK 核实结论（决定性）**：Pi `AgentSession` **没有** `initialMessages`/`setMessages`/`addMessage`，`messages` 只读，历史是 **JSONL-on-disk** 模型。→ **「每请求把全量历史重放进新内存会话」（Option A）在 Pi 里不可行**（要么每请求写 JSONL 磁盘 IO，要么逐轮 `prompt` 会重新触发生成）。

**最终裁决（与 in-process 拓扑契合）**：
> **用长连接热会话，按 `(userId, threadId)` 缓存，每轮只喂最新一轮 `prompt()`。** 这是 Pi SDK 的设计本意。
>
> - 因为我们用 **in-process `AbstractAgent`**（不是网络 `HttpAgent`），我们控制 run 生命周期。
> - **HITL 续跑更自然**：确认型工具的 `execute()` 可以 `await` 一个外部 promise，由前端回传的决定来 resolve——确认停留在**同一个活会话**里，不需要「从历史里抠最后一条消息」。
> - 之前研究里「用 Option A」的推荐是基于**网络 HttpAgent** 拓扑；我们换了拓扑，答案随之改变。
>
> 冷启动/重启重建：用 AG-UI 的全量 `messages` 经 `SessionManager`（JSONL）重建，且 **`input.messages` 永远是冲突时的权威**。这是后续持久化的迁移点，不是 MVP 必需。

会话存储要把这个策略做成**唯一的「load-or-create」收口点**。

### 2.4 生成式卡片：服务端工具也能渲染前端卡片 ✅
CopilotKit 的 **Tool Rendering** 模式：`useRenderToolCall({ name, render })`（或 `useCopilotAction({ name, render })` **不带 handler**）。
- **纯按工具名匹配** AG-UI 的 `TOOL_CALL_*` 事件流，**不需要 handler**——后端 Pi 执行工具，前端只渲染。这正是 **opportunity card / evidence / artifact** 的机制。
- 建议注册 `useDefaultRenderTool()` 做 `*` 兜底，否则没注册渲染器的工具调用对用户**不可见**。

### 2.5 权限确认的「地雷」必须正面设计，不是「以后重写」
现有 [`prism-permission-gate.ts`](../packages/pi-package/extensions/prism-permission-gate.ts) 调 `ctx.ui.select`，依赖 `ctx.hasUI`。**in-process SDK 里 `hasUI===false` → 执行类工具会被硬 block**。
- `ctx.ui.select` 是 CLI/RPC 概念，**在 Web in-process 下本就跑不通**。
- **Web 的 HITL 通道就是 AG-UI 本身**：工具发出确认型 tool call → 前端 `useHumanInTheLoop` 渲染确认框 → 用户响应作为 tool result 回传 → 新一轮 POST 续跑（同 `threadId`、新 `runId`）。
- 所以这不是「Phase 4 重写」，而是**一开始就该按 AG-UI HITL 设计**。MVP（只读 scanner）没有执行工具可以**推迟做执行确认**，但 **HITL 管线（一个 trivial 确认往返）必须早验证**，因为它牵动翻译器、会话存储、并发模型、前端渲染器——几乎一切。

---

## 3. 目标架构（已综合裁决）

```
┌──────────────────────────────────────────────────────────────┐
│ apps/web  (单个 Next.js 应用)                                   │
│                                                                │
│  ① CopilotKit React UI (v2 hooks)                              │
│     - ChatGPT 式对话 (CopilotChat / 或 headless 自绘)           │
│     - useRenderToolCall → <OpportunityCard> 等金融卡片          │
│     - useHumanInTheLoop → 执行确认框 (Phase 4)                  │
│     - <CopilotKit runtimeUrl="/api/copilotkit" agent="prism">  │
│                                                                │
│  ② /api/copilotkit  (CopilotRuntime route = 信任边界/鉴权)      │
│     const runtime = new CopilotRuntime({                       │
│       agents: { prism: new PrismAgent() }   ← in-process!      │
│     })                                                         │
│        │ (无网络跳转，直接进程内调用)                            │
│        ▼                                                       │
│  ③ PrismAgent extends AbstractAgent (来自 packages/agui-bridge) │
│     run(input): Observable<BaseEvent> {                        │
│        sessionStore.loadOrCreate(userId, threadId)             │
│        translator = new PiToAguiTranslator(emit)               │
│        session.subscribe(e => translator.onPiEvent(e))         │
│        await session.prompt(...) // 见 §2.3 状态策略            │
│     }                                                          │
└───────────────┬────────────────────────────────────────────────┘
                │ @agentkernel/agui-bridge (翻译器 + 会话存储, sink 无关)
                │ @agentkernel/agent-kernel (Pi session factory)
                │ @agentkernel/tools (domain tools, TypeBox)
                │ @agentkernel/policies (risk gate, Phase 4)
                ▼
          Pi AgentSession (in-process, noTools:"builtin" + customTools)
```

**关键拓扑决策（对抗审查后改的）**：
- **合并进单个 Next.js 应用**，不单独部署 `apps/agent-api` HTTP 服务（solo dev MVP 不需要独立伸缩/多语言，多一跳只是给架构图好看）。
- **In-process 自定义 `AbstractAgent`**，不走网络 `HttpAgent` → 去掉「AG-UI over HTTP」这一跳和一次协议转换。
- **保留 CopilotRuntime**：它是**服务端信任边界**（鉴权、API key、中间件）。runtime-less 直连会把 agent 端点暴露到浏览器，对金融产品是不可接受的。
- **翻译器放独立包 `packages/agui-bridge`**，sink 无关（既能 `Observable.next()` 又能写 SSE）→ 将来要拆独立服务时，`apps/agent-api` 复用同一个包即可。

---

## 4. 代码骨架（要点）

> 完整可编译草图见多 agent 研究输出；此处给结构与最关键的不变量。

### 4.1 翻译器（`packages/agui-bridge/src/pi-to-agui-translator.ts`）
- 每轮 run 一个实例，构造时传入 `emit(event)` sink（Observable 或 SSE 皆可）。
- `onPiEvent(piEvent)` 按 §2.2 表分发。
- 维护：`runStarted` / `runFinished` 终态 flag、按 `messageId#contentIndex` 的开放文本流、按 `toolCallId` 的开放调用、`resultEmitted` 去重。
- 收尾函数 `closeAllOpenStreams()`：在 `RUN_FINISHED`/`RUN_ERROR`/重试时补齐所有未闭合的 END。
- `serializeToolResult(result, isError)`：把 Pi 的 `AgentToolResult.content[]`（text/image 等）拼成 AG-UI 的 `content` 字符串。
- **稳定 id 映射**：维护 `Pi message id ↔ AG-UI messageId` 映射，避免前端气泡重复/孤立。

### 4.2 自定义 Agent（`packages/agui-bridge/src/prism-agent.ts`）
```ts
class PrismAgent extends AbstractAgent {
  protected run(input: RunAgentInput): Observable<BaseEvent> {
    return new Observable(sub => {
      const emit = (e) => sub.next(e);
      const translator = new PiToAguiTranslator(emit, {
        threadId: input.threadId, runId: input.runId,
      });
      // ↓ 状态策略收口点（§2.3）：Option A 重放 / Option C 热缓存
      const session = await sessionStore.loadOrCreate(userId, input.threadId, input.messages);
      const unsub = session.subscribe(e => {
        translator.onPiEvent(e);
        if (e.type === "agent_end" && !e.willRetry) { sub.complete(); }
      });
      try { await session.prompt(latestTurn(input)); }
      catch (err) { translator.fail(String(err), "PI_PROMPT_ERROR"); sub.complete(); }
      return () => { unsub(); /* abort/dispose 见 §5 */ };
    });
  }
}
```

### 4.3 会话存储（`packages/agui-bridge/src/session-store.ts`）
- 接口 `loadOrCreate(userId, threadId, messages)` —— **唯一收口点**，§2.3 策略只改这里。
- **会话身份 = `(authUserId, threadId)`**，`userId` 来自服务端校验的 token，**绝不信任 client body**（安全关键）。
- 内存 TTL + LRU 上限（防 OOM）；标注「持久化迁移点」：未来按 transcript 持久化、冷启重建。

### 4.4 前端（`apps/web`）
- `<CopilotKit runtimeUrl="/api/copilotkit" agent="prism">`。
- **用 v2 hooks**：`useRenderToolCall`（卡片）、`useHumanInTheLoop`（确认）、`useFrontendTool`（前端工具）——**不要用已 deprecated 的 `useCopilotAction`**。
- 起步可先用现成 `CopilotChat` 组件跑通，再换 headless 自绘做 ChatGPT 视觉。

---

## 5. 风险与必须 guard 的失败模式

| 风险 | 处理 |
|---|---|
| **同 threadId 并发** | `prompt()` 在 `isStreaming` 时会抛。早检查 `isStreaming` → 返回 409 / `RUN_ERROR{code:BUSY}`，前端锁住输入框。用 per-thread async mutex 消除 TOCTOU。**不要**静默起第二轮（会 token 交错）。 |
| **`prompt()` 抛异常** | 始终 try/catch → `RUN_ERROR`。别假设 `agent_end` 一定触发。 |
| **重试关错流** | `agent_end{willRetry:true}` 不发 `RUN_FINISHED`；server 回调里也要判 `willRetry`。 |
| **START/END 不配对** | finish/error/retry 时 `closeAllOpenStreams()`。 |
| **双发文本** | 只从 `assistantMessageEvent` 驱动。 |
| **partialResult 累积** | 只在 `tool_execution_end` 发一次结果。 |
| **背压** | 优先用 Hono `streamSSE`（await writeSSE 天然背压）；裸 `res.write` 要处理 `drain`。 |
| **客户端断连** | `close` → 清 keep-alive 定时器 + `unsubscribe` + `session.abort()`（止血 token）+ 仅 ephemeral 才 `dispose`。 |
| **SSE 被代理掐断** | 每 ~15s 发 `: ping\n\n`；设 `x-accel-buffering: no`。 |
| **CopilotKit v2 已知 bug** | 前端工具重复执行、`_isRenderAndWait` 在 prod 构建报错、非 LangGraph 的 HITL issue。→ spike 阶段务必验证一次确认往返在 **prod build** 下也工作。 |
| **threadId 越权** | 见 §4.3，会话按 `(userId, threadId)` 隔离。 |

---

## 6. 分阶段实施（spike 优先）

### ⭐ Phase −1：垂直切片 spike（最先做，一个 throwaway 分支）
验证**最高风险路径**，而不是先铺广度。一条端到端切片：
1. 一个 trivial Pi 工具 `getOpportunity()` 返回写死的卡片数据。
2. 一个 **gated** 工具 `confirmAction()`，暂停等用户 yes/no（验证 HITL 往返，不只 fire-and-forget）。
3. Pi session **in-process** 跑在单个 Next.js route 里，翻译器内联。
4. 前端渲染：流式文本 + 从工具调用渲染的 opportunity card + 确认框（响应回灌同一轮 run）。
5. **验证 §2.3 的 Pi 历史 seed 可行性**（决定 Option A vs C）。
6. 中途杀掉服务器，确认重启行为（或有意识接受 MVP 丢会话）。
7. 在 **production build** 下复测一遍（避开 v2 已知 prod bug）。

> spike 过了 → 架构成立，回填真实工具/策略/持久化。没过 → 几天而非几周就发现问题。

### Phase 0：真实工具闭环（UI 之前的前置）
- [`get-funding-rates.ts`](../packages/tools/src/exchanges/get-funding-rates.ts) 接真实 Binance/Bitget API（现在是 mock）。
- agent-kernel 确认 `customTools` 真正注册进 session。
- CLI 验证 agent 会自动调用工具。

### Phase 1：agui-bridge 包（翻译器 + 会话存储）
- ✅ **已完成并验证**：新建 [`packages/agui-bridge`](../packages/agui-bridge)，含 AG-UI 事件类型、Pi 事件结构镜像（按真实 `.d.ts` 校正）、`PiToAguiTranslator` 翻译器，**11 个单测全通过 + 全 monorepo typecheck 通过**。覆盖：纯文本轮、工具调用流式 args、无流式 args 补发、retry 不收尾、START/END 配对、RUN_STARTED 去重、文本/工具交错、reasoning 开关、结果序列化。
- ⏳ **待做**：会话存储（`(userId,threadId)` 收口点）、`PrismAgent extends AbstractAgent`（把翻译器接到 `@ag-ui/client` 的 Observable sink）。

### Phase 2：CopilotKit 前端
- `apps/web`：`<CopilotKit>` + `/api/copilotkit` 路由注册 in-process `PrismAgent`。
- 先 `CopilotChat` 跑通对话；`useRenderToolCall` 渲染 `OpportunityCard` + `useDefaultRenderTool` 兜底。

### Phase 3：产品化打磨
- headless UI 做 ChatGPT 视觉；artifact 持久化（现仅 [`MemoryArtifactStore`](../packages/tools/src/artifacts/memory-artifact-store.ts)）；按需 `useCoAgent` 共享状态。

### Phase 4：执行 + HITL 落地
- 重写权限确认：弃 `ctx.ui.select`，用 `useHumanInTheLoop` 的 AG-UI 往返；执行工具接入。

---

## 7. 写代码前必须拍板的决策清单（优先级排序）

1. **部署目标：常驻 Node 进程 还是 serverless？** —— 决定 in-memory 会话前提是否成立。若 Vercel serverless，in-memory Pi 会话**不工作**，拓扑要先改。**（最高优先，gating）**
2. **会话身份 = `(校验过的 userId, threadId)`** —— 安全关键，无法事后补。
3. **状态策略（已裁决，见 §2.3）**：Pi 无法 seed 历史 → **热会话 + 每轮喂最新一轮**，配 in-process 拓扑；冷启从 JSONL 重建，`input.messages` 为权威。
4. **In-process Pi + AG-UI HITL**（不用 `ctx.ui`/RPC）—— 把「Phase 4 重写」正名为「一开始就这么设计」。
5. **拓扑**：MVP 合并进 Next.js（in-process AbstractAgent），翻译器放 `packages/agui-bridge` 保持可拆分。
6. **CopilotKit 用 v2 hooks**，预算 v2 已知 bug。
7. **稳定 messageId 映射** 在翻译器里钉死。
8. **同 thread 并发行为**（推荐 409 + 锁输入框 + 处理 SSE 重连）。

---

## 8. 诚实备注：CopilotKit vs assistant-ui

你已明确选 CopilotKit，本方案据此设计。但对抗审查给出一个值得知道的事实：

- 因为后端说的是 **AG-UI（开放协议）**，前端**可替换**——`@assistant-ui/react-ag-ui` 同样原生消费 AG-UI，更轻，自带消息重建和 interrupt-based HITL。
- CopilotKit 的三大卖点里，你**确定需要**生成式卡片（✅ 有，但 assistant-ui 也有），**最终需要** HITL（两家当下都有坑），**共享状态 `useCoAgent`** 对「聊天 + 卡片」的研究工具**可能用不到**。
- **结论**：本方案把投资压在 **AG-UI 接缝**上（翻译器 + bridge 包），所以即便将来想换 assistant-ui，**后端零改动**。这是「取长补短」最稳的下注——锁定度低，前端可换，引擎不动。

---

## 9. 实施进度（实时）

| 项 | 状态 |
|---|---|
| gating #1 部署目标 | ✅ **已裁决：常驻 Node 进程（Railway `next start`），多 agent 高置信** |
| gating #3 状态策略 | ✅ 已用真实 SDK 事实裁决：Pi 无法 seed 历史 → 热会话+每轮喂最新一轮（见 §2.3） |
| 拓扑（in-process AbstractAgent） | ✅ **已核实可行**：`AgentsConfig = Record<string, AbstractAgent>`，官方支持注册本地 agent |
| `packages/agui-bridge` 翻译器 + 类型 | ✅ 已实现，单测通过 |
| `WarmSessionStore`（`(userId,threadId)` 收口点） | ✅ 已实现 + 单测 |
| `PrismAgent extends AbstractAgent` | ✅ 已实现 + 单测（mock session 驱动合成事件，零 API 成本） |
| agui-bridge 全量验证 | ✅ **24 单测全过 + typecheck 通过** |
| `apps/web` 路由改 in-process `PrismAgent` | ✅ 已重写（弃用 HttpAgent），`serverExternalPackages` 外置 Pi |
| `next build` | ✅ **生产构建通过**，`/api/copilotkit` 动态路由就绪，Pi 引擎成功外置 |
| Phase 0 真实 funding 数据 | ✅ 部分完成（已有 Binance/Bitget provider） |
| **实时端到端冒烟（真 LLM）** | ✅ **通过**：cloudaikey(claude-3-5-haiku) 真实 token 流过 Pi→AG-UI；minimal + full(全工具) 双模式均 GREEN |
| 真实错误路径 | ✅ provider 400 → 翻译器正确 emit `RUN_ERROR`（已加 stopReason=error 检测 + 单测） |
| 修复：工具 schema OpenAI 兼容性 | ✅ `scan_funding_basis_arbitrage` 的 `Type.Tuple` 改为定长 union 数组（原 schema 会阻断所有 OpenAI 兼容 provider） |
| 安全：`resolveUserId` 接真实鉴权 | ⏳ 待做（当前硬编码 "local"，仅本地/MVP） |
| 生成式卡片 `useRenderToolCall` + HITL | ⏳ 待做（前端组件层） |

**整条链路已用真实 LLM 验证打通**：浏览器/`next build` → CopilotRuntime → in-process `PrismAgent` → `WarmSessionStore` → 真实 Pi 会话(cloudaikey) → `PiToAguiTranslator` → AG-UI 事件流。剩余为前端体验层（卡片/HITL）与生产化（鉴权/持久化）。

冒烟工具：[`packages/agui-bridge/scripts/smoke.ts`](../packages/agui-bridge/scripts/smoke.ts)（`SMOKE_MINIMAL=1` 可绕过工具单测流式链路）、[`scripts/debug-raw.ts`](../packages/agui-bridge/scripts/debug-raw.ts)（原始 Pi 事件 + fetch 拦截诊断）。密钥只读自 gitignored 的 `.env.smoke`，从不打印/提交。

---

## 附：相关文件
- 引擎封装：[`packages/agent-kernel/src/create-prism-agent-session.ts`](../packages/agent-kernel/src/create-prism-agent-session.ts)
- ✅ AG-UI 桥（翻译器，已建）：[`packages/agui-bridge/src/pi-to-agui-translator.ts`](../packages/agui-bridge/src/pi-to-agui-translator.ts)
- 领域类型：[`packages/domain/src/`](../packages/domain/src/)
- 工具（待接真实数据）：[`packages/tools/src/`](../packages/tools/src/)
- 战略/架构母文档：[`PRISM_CORE_STRATEGY_AND_ARCHITECTURE.md`](./PRISM_CORE_STRATEGY_AND_ARCHITECTURE.md)
