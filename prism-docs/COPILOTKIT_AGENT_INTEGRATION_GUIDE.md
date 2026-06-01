# Prism Agent ⇄ CopilotKit 集成契约与扩展指南

> 本文是 **Prism 自研 agent** 与 **CopilotKit v2 展示层** 之间的**操作级契约文档**：消息流程、职责边界、功能耦合矩阵、"加新功能怎么做"的标准配方、协作方式。
>
> 配套文档：[`COPILOTKIT_INTEGRATION_PLAN.md`](./COPILOTKIT_INTEGRATION_PLAN.md)（战略/选型/裁决）。本文是它的**落地操作面**。
>
> 所有事实均基于实际安装的 `@copilotkit/react-core@v2` / `@copilotkit/runtime@v2` / `@ag-ui/client@0.0.53` 与本仓库 `packages/agui-bridge` 代码验证。

---

## 0. 第一原则（必须内化）

> **我们造 agent，CopilotKit 只负责展示。两者唯一的契约是 AG-UI 事件流。**

- Agent 端的全部职责 = **产出一段合法的 AG-UI 事件流**。
- CopilotKit 端的全部职责 = **把事件流渲染成 ChatGPT 式界面**。
- 因此：**判断任何新功能"要不要动 agent"，只需问一句——它需要 agent 多产出/读取某种 AG-UI 信息吗？** 不需要 → 纯前端；需要 → 按本文 §4 配方做。

但要进一步内化一条更重要的产品原则：

> **Prism 的目标不是“让聊天更像 Prism”，而是“让 deterministic 的金融研究输出更像产品对象”。**

也就是说：
- “修 prompt / 修身份”只是基础步骤
- 真正让产品变成 Prism 的，是 **artifact / opportunity / report / execution-prep** 这些结果如何以一等公民方式被呈现出来
- 因而 **tool/result renderer 与 UI 语义契约** 的优先级，应与身份修正处于同一层级

这条原则让前后端可以**各自独立推进**：前端开发者只读本文"展示侧"，agent 开发者只读"产出侧"，接口就是事件词表。

---

## 1. 端到端消息流程（已验证）

发一条消息，数据这样流动：

```
① CopilotChat 输入框 submit
     agent.addMessage({role:"user", content}) + copilotkit.runAgent()
     （客户端 AbstractAgent.messages 累积全量历史；prepareRunAgentInput 快照成 RunAgentInput）
② POST /api/copilotkit            （single-route 模式：基础路径单端点）
     Content-Type: application/json   Accept: text/event-stream
     body = { method:"agent/run", params:{agentId:"default"}, body:<RunAgentInput> }
③ createCopilotRuntimeHandler（mode:"single-route"）
     解信封 → createJsonRequest 拆出内层 RunAgentInput
     resolveAgents → agents["default"].clone()  （每请求一个克隆）
     agent.setMessages(input.messages); setState; threadId = input.threadId
     → InMemoryAgentRunner.run() → agent.runAgent(input, {onEvent,…})
④ PrismAgent.run(input): Observable<BaseEvent>          ← 我们的代码
     key = { userId: resolveUserId(input), threadId: input.threadId }
     WarmSessionStore.loadOrCreate(key)  → 取/建“热” Pi 会话（进程内常驻）
     若 session.isStreaming → fail("BUSY")
     session.subscribe(piEvent → PiToAguiTranslator.onPiEvent → emit AG-UI 事件)
     text = latestUserText(input.messages)   ← 只取最后一条 user 文本
     await session.prompt(text)               ← 只喂最新一轮；历史由 Pi 会话自持(JSONL)
⑤ runner 将 Observable 每个事件 → @ag-ui/encoder.encode → SSE `data:{json}\n\n` 流回
     （response：text/event-stream, no-cache, keep-alive；abort → 取消订阅 → PrismAgent teardown）
⑥ 客户端 transformHttpEventStream 解析 SSE → BaseEvent
     AbstractAgent.runAgent 管线：verifyEvents → apply → 折叠进 agent.messages
⑦ useAgent 订阅 messages 变化 → useSyncExternalStore 节流重渲染
     CopilotChat 用 streamdown 流式渲染 markdown/代码；工具调用走 renderToolCall 注册表
```

**两个必须记住的事实：**
1. **runner 调的是 `agent.runAgent`，不是直接 `run()`** → 你的事件会经过 CopilotKit 的 `verifyEvents`（强制 START/END 配对、顺序合法）。翻译器产出非法序列会当场被抓。
2. **single-route 只对"请求"用 JSON 信封；"响应"永远是标准 SSE 事件流。** 线程列表 `/threads` 走的是 multi-route GET，**不在 single-route 方法表里 → 返回 405**（见 §5 缺口）。

---

## 2. 接缝与职责表（S1–S5）

| # | 接缝（我们的代码） | CopilotKit / AG-UI 拥有 | 我们拥有 |
|---|---|---|---|
| S1 | `new CopilotRuntime({ agents:{ default: prismAgent } })` | agents map 契约、`resolveAgents`、每请求 `clone()`、按 `agentId` 查找、`InMemoryAgentRunner` + 历史 store | 提供 `AbstractAgent` 实例；进程单例生命周期（`globalThis.__prismAgent`）；**热会话依赖常驻进程（`next start`，不能 serverless）** |
| S2 | `createCopilotRuntimeHandler({mode:"single-route",basePath,cors})` | 信封解析、路由、方法校验、CORS、SSE 编码（`@ag-ui/encoder`） | 仅配置值，无自定义传输代码 |
| S3 | `class PrismAgent extends AbstractAgent` 的 `run()` | 经 `runAgent` 包裹：`verifyEvents`/`apply`/`finalizeRunEvents`、订阅、传播 abort | Observable 主体：取热会话、并发守卫、subscribe+prompt、收尾、错误→`fail()` |
| S4 | 手写 `AguiEvent` 联合 + `PiToAguiTranslator` | 定义/消费 17 种 AG-UI 事件、折叠成消息、渲染 | **产出合法事件流**（最核心）。⚠️ 见 §6 脆弱点 |
| S5 | 读 `RunAgentInput`（`latestUserText`） | 客户端构造 + zod 校验 | 只读 `threadId`(会话键)/`runId`(id 生成)/最后 user 文本；**刻意忽略**全量历史、`state`、`tools`、`context`。`userId` 服务端解析，**绝不信任客户端** |

---

## 3. 翻译器现状：已支持 vs 缺口

**✅ 已产出**（`pi-to-agui-translator.ts`）：
- 生命周期 `RUN_STARTED` / `RUN_FINISHED` / `RUN_ERROR`（含 `agent_end{willRetry:true}` 不收尾、`stopReason=error`→`RUN_ERROR`）
- 文本 `TEXT_MESSAGE_START/CONTENT/END`（每 `(message,contentIndex)` 一条，START/END 严格配对）
- 工具 `TOOL_CALL_START/ARGS/END` + `TOOL_CALL_RESULT`（含无流式 args 兜底、结果缺调用时合成 START/END、去重）
- 推理 `REASONING_MESSAGE_CONTENT`（`emitReasoning` 开关，默认关）

**⚠️ 已定义类型但未产出**：`STATE_SNAPSHOT` / `STATE_DELTA`（共享状态——只差在翻译器里接一下）

**❌ 完全未建（真缺口）**：`MESSAGES_SNAPSHOT`（线程重开恢复）、`ACTIVITY_*`（活动/A2UI）、`Custom`（带载荷自定义消息）、推理 `*_START/*_END` 括号、中断/HITL 暂停-恢复事件、`/threads` REST 端点。

**输入侧缺口**：`RunAgentInput.tools` 被忽略（挡住前端工具 + HITL）；`latestUserText` 只读字符串 `content`（丢弃多模态附件 + 仅含工具结果的 HITL 恢复 POST）。

---

## 4. 功能耦合矩阵 + "加新功能"标准配方

**耦合分类**：A 纯前端 · B 需 agent 多发 AG-UI 事件 · C 需 agent 读 `RunAgentInput` · D 需 run 外的后端端点 · E 需 Pi 引擎支持。

| 功能 | 类别 | agent 侧要做什么 | 现状 |
|---|---|---|---|
| 聊天外壳 / Labels / useAgent / inspector / sandbox fns | **A** | 无 | ✅ 现成 |
| **内联工具/结果卡片**（useRenderToolCall / WildcardToolCallRender） | **B** | 发 `TOOL_CALL_START/ARGS/END/RESULT` | ✅ **翻译器已全发**，前端只需按工具名注册渲染器 |
| 静态/动态建议（useSuggestions） | **A** | 动态时走普通 run，无新事件 | ✅ 现成 |
| **推理/思考显示** | **B** | 现仅发 `REASONING_MESSAGE_CONTENT`，需补 `REASONING_(MESSAGE_)START/END` | ⚠️ 部分缺 |
| **前端工具**（useFrontendTool） | **C+E** | 读 `input.tools` → 暴露给 Pi LLM → 发 `TOOL_CALL_*` 后停（结果下一轮回灌） | ❌ 现忽略 tools |
| **Human-in-the-loop 确认** | **C+E** | 发 `TOOL_CALL_*` 后**暂停**（不发 RESULT）；下一轮 POST 的工具结果消息回灌热会话续跑。Pi 工具 `execute()` await 外部 promise | ❌ 待建（`latestUserText` 已预留：工具结果-only POST 返回 null 交 HITL 分支） |
| **线程历史/持久化**（useThreads） | **D** | 建线程元数据 store + `GET/POST/PATCH/DELETE /threads`（+ 可选 WS）；发 `MESSAGES_SNAPSHOT` 重开恢复 | ❌ 现 `/threads`→405 |
| **共享状态** | **B+E** | 发 `STATE_SNAPSHOT`（基线）+ `STATE_DELTA`（JSON Patch）；Pi 暴露可 diff 状态 | ⚠️ 类型已定义，翻译器未发 |
| 活动消息 / A2UI 生成式 UI | **B+E** | 发 `ACTIVITY_SNAPSHOT/DELTA`；Pi 产出活动/组件树载荷 | ❌ 未建（重活） |
| 自定义消息（useRenderCustomMessages） | **B/A** | 带载荷需 `Custom` 事件；纯位置装饰近 A | ❌ 未建 |
| **附件/文件**（useAttachments） | **A前端 + C/E** | 上传 UI 纯前端；要 agent 用文件需放宽 `latestUserText` 读多模态 + Pi 支持多模态 | ⚠️ 现丢弃非文本 |

### 标准配方（每加一个功能照此走）
1. **查矩阵定类别**（A/B/C/D/E）。
2. **A 类**：只在 `apps/web` 加 hook/组件，agent 零改动。
3. **B 类**：在 `PiToAguiTranslator` 增/补对应事件映射 + 在 `agui-events.ts` 扩 wire 类型 + 加翻译器单测；前端注册对应 render hook。
4. **C 类**：在 `PrismAgent.run`/`latestUserText` 读 `input.tools`/工具结果消息；可能需 Pi 工具配合。
5. **D 类**：在常驻后端加 REST 端点（注意 single-route 不自动服务）。
6. **E 类**：在 Pi 引擎层（`packages/agent-kernel` / `packages/tools`）做暂停-恢复/多模态/状态暴露。
7. **始终**：翻译器改动配单测（`packages/agui-bridge/test/`），跑 `tsc -b` + 冒烟脚本。

---

## 5. 当前已知问题清单（即 backlog）

| 项 | 影响 | 处理 |
|---|---|---|
| `/threads` → 405 | useThreads 线程历史不可用（当前无侧栏，无影响） | 加线程端点（D 类，功能后续） |
| `RunAgentInput.tools` 被忽略 | 前端工具 / HITL 无法工作 | C 类，做 HITL 时一起 |
| 推理事件缺 START/END | 思考块渲染可能不完整 | B 类小改 |
| `STATE_*` 未发 | 共享状态不可用 | B 类，翻译器接一下 |
| `resolveUserId` 硬编码 "local" | **多用户会串会话（安全）** | 接真实鉴权再上多用户 |
| ~~浏览器发消息暂无回复~~ | ✅ **已解决**：`prism-agent-runtime.ts` 已接入 cloudaikey provider（dev 从 repo 根 `.env.smoke` 读，生产用真实环境变量）；浏览器已验证真实流式对话 |

---

## 6. 关键脆弱点（重点盯防）

1. **S4 手写镜像类型**：`agui-events.ts` / `pi-types.ts` 是手抄的事件/Pi 类型，emit 处一个 `as unknown as BaseEvent` 强转。**AG-UI 或 Pi 升级改了字段名 → 编译通过但运行时在 `verifyEvents`/`apply` 炸**。升级这两个包后务必跑冒烟脚本回归。
2. **S5 无状态重放 vs 热会话**：CopilotKit 假设无状态重放（每轮发全量 `messages`），我们用有状态热会话（Pi 自持历史）。桥接靠"接受 hydration 调用但忽略、只喂最新一轮"。**所以必须常驻进程，且 HITL 恢复要单独处理工具结果消息**。
3. **single-route /threads 405**：任何走 multi-route 的客户端功能（线程）在 single-route 下会 405，需显式建端点。
4. **`AbstractAgent.clone()` 不保留子类字段**（已踩并修复）：CopilotKit runner **每请求 `agent.clone()`**，基类 clone 不带子类实例字段（`store`/`resolveUserId`），导致 `run()` 内 `this.xxx` 为 undefined。**任何给 `PrismAgent` 加实例字段，必须同步更新覆写的 `clone()`**。注意：直接调 `agent.run()`（如冒烟脚本）不触发 clone，只有走 CopilotRuntime 的真实路径才暴露——所以**改 agent 必须在浏览器真实路径回归，不能只靠冒烟脚本**。

---

## 6.5 Runtime identity baseline 只是地基

当前阶段需要明确一条执行规则：

- **runtime identity baseline** 的目标只是把 fresh Pi session 的身份边界拉回 Prism
- 它解决的是“别像 generic coding assistant / Codex”
- 它**不等于**已经让产品像 Prism workbench

因此在协作与验收上，必须把下面两类工作分开：
1. **bootstrap identity**：`createPrismAgentSession` 注入 Prism runtime prompt
2. **product materialization**：tool/result renderer、signal/proposal/execution-prep 语义、artifact/workspace 过渡原语

前者是必要条件，后者才是让产品真正贴近北极星的决定性步骤。

## 7. 近期路线（按北极星重新排序）

为避免把产品做成“更像 Prism 的 generic chat”，近期路线按下面顺序推进：

1. **Runtime identity 基线修正**
   - 在 `createPrismAgentSession` 明确注入 Prism identity/policy
   - 这是基础步骤，不是最终交付物

2. **Tool/result renderer 与 identity 同优先级**
   - 先为已有 deterministic domain tools 做 renderer
   - 优先：opportunity scan、artifact/report、execution-prep、freshness/warnings/provenance
   - 这是让产品开始像 Prism 的最大跃迁点

3. **signal / proposal / execution-prep 的 UI 语义分层**
   - 这些边界不能只靠 prompt 说清楚，必须在 renderer copy/badge/CTA 中体现

4. **workspace 过渡原语**
   - 不急着做完整 workspace，但要先有：
     - opportunity/result cards
     - artifact references
     - lineage / freshness / warnings
     - chat turn → artifact linkage

5. **之后再考虑**
   - suggestions
   - `/threads`
   - attachments / multimodal
   - HITL / interrupts

## 8. 协作方式与推进

- **本文 = 唯一契约源**。前端任务只需读 §4 矩阵的"展示侧"；agent 任务读"产出侧"+ §3 现状。
- **新功能流程**：查 §4 矩阵 → 按 §4 配方实现 → 改翻译器必配单测 → `tsc -b` + 冒烟验证 → 更新本文 §3/§5。
- **CopilotKit 官方文档**（展示侧权威，按需查）：
  - 组件/hooks v2 参考：`https://docs.copilotkit.ai/reference/v2`
  - AG-UI 事件词表（我们产出侧的权威）：`https://docs.ag-ui.com/concepts/events`
  - 本文负责把这两者**翻译到我们的具体栈**——官方文档是泛化的，本文是 Prism 特化的。
- **分层不变**：展示需求别往 Pi 引擎里塞；引擎能力别在前端硬编码。所有跨层耦合只走 AG-UI 事件。

---

## 附：关键文件
- 翻译器（产出侧核心）：[`packages/agui-bridge/src/pi-to-agui-translator.ts`](../packages/agui-bridge/src/pi-to-agui-translator.ts)
- 事件 wire 类型：[`packages/agui-bridge/src/agui-events.ts`](../packages/agui-bridge/src/agui-events.ts)
- Agent 适配：[`packages/agui-bridge/src/prism-agent.ts`](../packages/agui-bridge/src/prism-agent.ts)
- 热会话存储：[`packages/agui-bridge/src/session-store.ts`](../packages/agui-bridge/src/session-store.ts)
- 路由/运行时：[`apps/web/app/api/copilotkit/route.ts`](../apps/web/app/api/copilotkit/route.ts) · [`apps/web/lib/prism-agent-runtime.ts`](../apps/web/lib/prism-agent-runtime.ts)
- 引擎封装：[`packages/agent-kernel/src/create-prism-agent-session.ts`](../packages/agent-kernel/src/create-prism-agent-session.ts)
- 冒烟验证：[`packages/agui-bridge/scripts/smoke.ts`](../packages/agui-bridge/scripts/smoke.ts)
