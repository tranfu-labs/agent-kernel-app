# Prism 核心战略与架构整理

## 1. 顶层哲学

Prism 的第一原则是：

**物质、能量、信息三位一体。**

把这套哲学翻译成产品与系统语言：

- **信息 Information**：外部世界的事实、市场数据、事件、新闻、视频、网页、链上/链下行为、预测市场状态。
- **能量 Energy**：把信息转化为判断、假设、意图、任务、策略、机会、计划、比较、解释、风险评估。
- **物质 Material**：把判断变成可验证结果，例如 artifact、watch plan、alert、执行提案、模拟执行、真实执行、收益与复盘。

Prism 的目标不是“回答问题”，而是：

> 把现实世界信号转化为研究结论、机会识别与受控行动。

---

## 2. Prism 的本质定位

Prism 不应被定义为：

- 金融版 ChatGPT
- 普通聊天机器人
- 单纯的行情终端
- 无边界自动交易系统

Prism 更准确的定义是：

> **一个协作式金融研究经理（collaborative financial research manager）。**

其内部北极星表达是：

> **一个面向市场机会的持续研究操作系统（continuous research operating system for market opportunities）。**

更具体地说：

- 它围绕 **market / event / wallet / theme / venue / strategy** 等对象组织研究。
- 它通过 **可审计的数据平面** 接住现实世界信号。
- 它通过 **Agent Runtime / Operation System** 进行能力编排。
- 它通过 **LLM** 做比较、解释、综合与建议。
- 它把结果沉淀为 **artifact、watch、job、signal、execution proposal、memory**。
- 它既支持 **交互研究**，也支持在 workflow 锁定后的 **持续监控与信号发射**。

一句话总结：

> **Prism 是一个把现实世界信号转化为金融研究结论、机会识别、持续监控、信号输出与受控行动准备的对象中心 AI 工作台。**

更具体地说，Prism 的统一架构定位是 **financial opportunity operating system**，不是单一的套利 scanner 或预测市场 scanner。统一核心见 [`PRISM_OPPORTUNITY_OPERATING_CORE_ARCHITECTURE.md`](./PRISM_OPPORTUNITY_OPERATING_CORE_ARCHITECTURE.md)：

```text
Evidence -> MarketContext -> Comparison -> Signal -> Opportunity -> Score -> Artifact -> Proposal -> Risk
```

---

## 3. Prism 的核心目标

Prism 的核心目标可以拆成四层：

### 3.1 发现机会

不是只告诉用户“发生了什么”，而是发现：

- funding rate divergence
- cross-venue spread / basis / mispricing
- event probability mismatch
- news / video / official source 与 prediction market 定价之间的延迟
- wallet anomaly / 行为异动
- 真实世界状态与市场价格之间的偏差

### 3.2 形成判断

发现机会后，系统必须继续回答：

- 为什么这是机会？
- 这是噪声还是结构性偏差？
- 是否可执行？
- 成本、容量、时延、滑点、费用如何？
- 哪些情况会使结论失效？

### 3.3 推动受控行动

Prism 的行动不应一开始就等同于“自动下单”，而应分层：

1. 发现
2. 评分
3. 研究与补证
4. 持续监控与信号
5. 计划 / proposal
6. 模拟
7. 人工确认或策略授权
8. 执行
9. 跟踪与退出

### 3.4 沉淀策略与研究资产

Prism 产出的不应只是一次性回答，而应积累：

- research brief
- comparison report
- evidence bundle
- watch plan
- thesis update
- execution proposal
- 策略模板与复盘资产

---

## 4. 内部使用 vs 产品化

Prism 不应简单理解为“内部工具”或“直接外部产品”二选一。

### 4.1 推荐路线

> **先作为内部 alpha / edge engine 打磨，再逐步产品化。**

### 4.2 为什么不建议一开始直接做大众产品

原因包括：

- 产品抽象较重，用户教育成本高
- 真正的 alpha 若完全公开，可能快速衰减
- 一旦涉及执行、交易、预测建议，会迅速进入更敏感的信任与治理区域

### 4.3 为什么也不能永远只做内部工具

原因包括：

- 内部系统容易演化成“私人外挂”，缺少清晰产品边界
- 不会被迫打磨对象模型、操作模型、artifact 模型和 UX
- 难以外化为平台、SaaS 或专业终端产品

### 4.4 结论

推荐采用双层战略：

- **第一层：内部系统**
  - 验证机会发现、研究流程、执行闭环、策略资产积累
- **第二层：外部产品**
  - 把可共享的研究能力、机会发现能力和工作流能力抽象成专业金融产品

---

## 5. 产品化时卖的是什么

Prism 可以提供四种价值，但不建议一开始同时全部对外售卖。

### 5.1 信息优势

- 更快获得真实信息
- 多源事实聚合
- 比普通 AI 更可追溯、可验证

### 5.2 机会优势

- 更快发现 funding 套利、跨 venue 错价、预测市场延迟、wallet 异动等机会

### 5.3 决策工作流优势

- 围绕对象持续研究
- 记住上下文
- 沉淀 artifact
- 跟踪 thesis、watch、compare 流程

### 5.4 执行优势

- 生成执行提案
- 模拟执行
- 条件触发策略执行
- 受控执行

### 5.5 对外最适合优先出售的价值

> **研究与机会发现工作流**，而不是一开始就卖“自动执行”。

---

## 6. 产品形态建议

Prism 不只有一种形态，可以有四种产品形态，从轻到重。

### 6.1 研究 Copilot

形态：

- Web app
- Chat + object workspace
- 多源证据面板
- compare / brief / watch

特点：

- 易理解
- 合规压力相对较小
- 适合作为产品入口

### 6.2 机会发现终端

形态：

- scanner + ranking + alerts + workspace
- 以“机会流”而不是聊天为中心

能力：

- funding divergence scanner
- cross-venue mispricing scanner
- prediction market lag scanner
- wallet anomaly scanner
- opportunity scoring

这是最有潜力的产品化形态之一。

### 6.3 研究与执行一体化工作台

形态：

- object workspace
- evidence pane
- opportunity pane
- strategy pane
- execution pane
- artifact pane

特点：

- 最符合“信息 → 能量 → 物质”
- 最重，也最强
- 更适合专业用户和内部系统

### 6.4 基础设施 / API / Agent OS

形态：

- API / SDK / runtime platform
- Object resolution API
- evidence graph API
- opportunity detection API
- execution policy API

更偏平台层与 B2B 方向。

### 6.5 当前最合理的产品化形态

> **Prism 应优先作为“专业研究与机会发现工作台”产品化，而不是直接做全自动执行平台。**

---

## 7. 对外产品功能建议

### 7.1 第一阶段适合开放的功能

- 对象研究（market / event / wallet / theme）
- 多源信息聚合（行情 / 新闻 / 网页 / 视频 / 官方来源）
- compare / brief / evidence bundle / thesis note
- 机会发现（funding divergence、prediction lag、wallet anomaly）
- watchlist / alerts / source change alert
- 执行前支持（trade proposal、simulation、cost / risk estimate）

### 7.2 第二阶段再逐步开放的功能

- governed execution
- one-click proposal confirmation
- broker / exchange connectors
- recurring scans / scheduled jobs
- shared workspace / team collaboration
- PnL / attribution / postmortem

---

## 8. 产品交互形态判断

### 8.1 聊天不是主角

Prism 不应做成 chat-first 产品。聊天可以保留，但不应是主界面。

### 8.2 更合理的产品主界面

应该是 workspace-first / object-first / artifact-first：

- 左侧：对象 / 线程 / 机会导航
- 中间：对象工作区（overview / evidence / compare / timeline / thesis）
- 右侧：agent / notes / actions / plans
- 底部或侧边：artifact pane

### 8.3 原因

chat-first 会带来以下问题：

- 对象结构不明显
- 多源证据承载差
- artifact 容易退化成对话文本
- 执行与监控工作流不自然

所以 Prism 的原则应是：

> **workspace-first，chat is a surface, not the system.**

---

## 9. 为什么 Pi 适合作为 Prism 的 Runtime 内核

结论：

> **以 Pi Agent 为内核，做 Prism 这样的垂直金融产品，是一条非常有效的方案。**

原因有五个：

### 9.1 快

Pi 的核心小、路径短、负担轻，交互效率高。
金融场景对响应速度尤其敏感：

- 套利机会可能很快衰减
- 事件信息可能几分钟就失去 edge
- UI 卡顿会直接影响“可执行感”

### 9.2 架构清楚

Pi 已经清晰划分：

- session
- runtime
- tools
- skills
- extensions
- sdk / rpc / interactive / print modes

有利于垂直产品在清晰边界上扩展，而不是乱改。

### 9.3 可插拔

Pi 支持：

- custom tools
- event interception
- permission gates
- commands
- custom UI
- model/provider 扩展

这让它非常适合作为垂直 agent runtime substrate。

### 9.4 支持 CLI / SDK / RPC

这对产品化非常关键，因为 Prism 不会只停留在 terminal，而需要：

- internal harness
- web app
- background jobs
- API integration

Pi 已经提供了向这些方向演化的基础。

### 9.5 比 Claude / Codex 自带 app 更可控

Pi 是开放的、可二次改造的。
对于垂直产品来说，宿主控制权极其重要。

---

## 10. 但 Pi 不等于 Prism

这一点必须非常明确。

> **Prism 不应该只是“一个装了很多 skill 的 Pi”。**

### 10.1 原因一：产品边界会塌

如果 Prism 只是一堆 skills / extensions / prompts 的组合，最终会得到一个很强但很散的金融 agent 环境，而不是产品。

### 10.2 原因二：对象模型不够硬

Pi 原生更偏 session / tool 中心。
Prism 需要自己的强对象模型：

- ResearchObject
- ObjectContext
- Opportunity
- ExecutionPlan
- WatchPlan
- EvidenceGraph

### 10.3 原因三：治理与执行层不是 Pi 的主场

Pi 可以做 permission / hook / session state，但金融执行治理更重，需要 Prism 自己定义：

- 风险等级
- side-effect semantics
- confirmation chain
- source trust
- simulation before execution
- audit trail

结论：

> **Pi 是发动机，Prism 是整车。**

---

## 11. 建议的总体产品与技术架构

推荐把 Prism 设计为四层产品系统。

### 11.1 Interaction Layer

面向用户的产品层：

- Web UI 主工作台
- Agent 对话 / 命令面板
- Opportunity feed
- Object workspace
- Artifact viewer
- Watch / alert / execution panels

### 11.2 Prism Domain Layer

Prism 真正的核心层：

- Object Registry
- ObjectContext Engine
- Evidence Graph
- ResearchWorkingSet
- Opportunity Engine
- Artifact System
- Watch / Job System
- Execution Policy Engine

### 11.3 Agent Runtime Layer

可基于 Pi 实现：

- Agent session runtime
- Tool execution
- Commands
- Extension hooks
- Model/provider orchestration
- Session tree / history

### 11.4 Infra / Data / Execution Layer

- exchange connectors
- Polymarket connectors
- web / news / video ingestion
- wallet / onchain data
- scheduler / queue / worker
- database / trace / audit

---

## 12. 推荐的技术分层方式

### 12.1 不建议

不建议直接 fork Pi 全量改成 Prism。

问题：

- 通用 runtime 与垂直业务高度耦合
- 难以跟进 upstream 更新
- 容易在 fork 里塞入大量金融特判逻辑

### 12.2 建议方式

采用三段式：

#### A. Pi Core

尽量保持接近 upstream：

- 作为 runtime substrate
- 少做必要 patch

#### B. Prism Adapter Layer

建立适配桥：

- PrismToolAdapter
- PrismSessionAdapter
- PrismContextInjector
- PrismOperationResolver
- PrismPermissionGate
- PrismArtifactBridge

#### C. Prism Product App

独立的产品系统：

- web app
- backend
- domain services
- job system
- execution system
- persistence

这能避免把产品绑死在 Pi 上。

---

## 13. 模块划分建议

### 13.1 Runtime Kernel（基于 Pi）

负责：

- 会话
- 模型
- 工具执行
- 扩展事件
- 基础 agent 交互

尽量少放金融业务逻辑。

### 13.2 Prism Domain Core

核心模块包括：

#### Object System
- ResearchObject
- ObjectRelation
- ObjectIdentityResolver

#### Context System
- ObjectContext
- ResearchWorkingSet
- ContextAssembler
- ArtifactRecall

#### Evidence System
- EvidenceRecord
- EvidenceBundle
- SourceRegistry
- Freshness / Trust Scoring

#### Artifact System
- research_brief
- comparison_report
- watch_plan
- thesis_update
- execution_proposal

#### Opportunity System
- Opportunity
- OpportunityDetector
- OpportunityScore
- OpportunityLifecycle

#### Execution Governance
- ExecutionPolicy
- RiskLevel
- ConfirmationPolicy
- SimulationResult
- ExecutionDecision

### 13.3 Data Plane

- exchange providers
- funding / OI / basis readers
- Polymarket readers
- news / web / video ingestion
- wallet / onchain readers

### 13.4 Agent Orchestration

- intent interpretation
- capability resolution
- operation planning
- operation dispatch
- synthesis
- artifact persistence
- context update

注意：主抽象应是 **operation**，而不是 skill。

### 13.5 Product UI

- object pages
- workspace shell
- evidence viewer
- opportunity feed
- artifact browser
- watch / jobs
- chat / command surface

---

## 14. 工作流程建议

### 14.1 北极星研究循环

Prism 的北极星研究循环必须固定为：

1. goal framing
2. method exploration
3. capability / boundary check
4. source mapping
5. fact gathering
6. synthesis
7. materialization
8. review / monitor / proposal handoff

任何未来新 vertical、新 tool、新 workflow，都不应绕过这条主循环，而应在其内部扩展。

### 14.2 研究型流程

1. 识别对象与目标
2. 做 framing 与方法探索
3. 组装上下文与 source map
4. 决定 operation
5. 拉数据 / 取证据
6. LLM 综合解释与比较
7. 生成 artifact
8. 更新 context / memory / working set
9. 如 workflow 已稳定，则可交接给持续监控

输出：

- answer
- brief
- compare
- watch plan
- thesis update
- signal candidate
- proposal draft later

### 14.3 机会发现流程

1. detector 扫描
2. 发现 candidate
3. 评分
4. 拉补充证据
5. 形成解释与建议
6. 生成 opportunity artifact
7. 发 alert / 加 watch / 请求确认

输出：

- opportunity
- score
- rationale
- next action

### 14.3 持续监控与信号流程

1. 已确认方法或 workflow 转成 monitor definition
2. scheduler / trigger 启动 refresh
3. 更新 source / facts / market context
4. 与历史 artifact 和阈值比较
5. 生成 refresh artifact 与 signal artifact
6. 发出 checkpoint / alert / signal
7. 必要时升级为 proposal review

输出：

- refresh artifact
- signal artifact
- checkpoint summary
- proposal escalation later

### 14.4 执行流程

1. opportunity / proposal → execution proposal
2. policy gate
3. simulation
4. fee / risk / capacity check
5. confirmation
6. execution connector
7. result tracking
8. post-trade artifact
9. memory / strategy update

输出：

- execution record
- pnl tracking
- postmortem note

---

## 15. Pi 在 Prism 里适合承担什么，不适合承担什么

### 15.1 最适合承担的

- Agent runtime
- Tool calling substrate
- Extension / event system
- Internal power-user console
- SDK / RPC substrate

### 15.2 不适合直接承担的

- Prism 的最终产品主界面
- 金融对象模型
- 机会检测引擎
- 核心执行与风险治理
- 长期 artifact / evidence graph / watch jobs

结论：

> **Pi 适合作为 Prism 的 runtime substrate，但 Prism 的产品本体必须由自己的 domain 与 product layers 承担。**

---

## 16. Pi Web 的判断

### 16.1 值得作为原型和参考

Pi Web 说明 Pi 具备向 Web 形态迁移的潜力，适合作为：

- 内部原型壳
- agent web surface
- 快速验证聊天 / 工具流 / 消息展示

### 16.2 但不建议直接作为最终产品形态

因为 Prism 需要更复杂的界面：

- object workspace
- opportunity feed
- evidence timeline
- compare panes
- execution flow
- artifact browser
- watch management

推荐判断：

- **短期：拿 Pi Web 做内部原型壳**
- **中期：Prism 自己长出 Web Product Shell**
- **长期：Pi 退到 runtime / service 层**

---

## 17. 与 OpenClaw / Claude / Codex 的关系判断

### 17.1 OpenClaw

适合学习：

- workflow orchestration
- hooks
- watches / jobs / 外部通知

不适合直接作为 Prism 主内核。

### 17.2 Claude / Codex 自带软件

适合学习：

- 交互风格
- 响应节奏
- 执行反馈方式

不适合作为产品宿主，因为：

- 闭源
- 不可控
- 无法深度承载你的对象模型和治理系统

### 17.3 Pi

最适合做：

> **Prism 的高性能、可插拔、可扩展 Agent Runtime Core**

---

## 18. 最终建议

### 18.1 总体路线

> **Pi Runtime as core, Prism as product system.**

### 18.2 核心原则

1. Pi 只做 runtime，不做产品本体。
2. Prism 的一等公民不是 chat，而是 object / evidence / opportunity / artifact / execution plan。
3. 所有执行能力先 governed，再 automation。
4. 先 internal-first，产品架构从第一天按 externalizable 标准设计。
5. 核心执行抽象用 operation，不要用 skill / prompt 做核心业务建模。

### 18.3 当前最合理的产品方向

> **Prism 先作为内部 intelligence-to-action engine 打磨；对外先产品化为专业研究与机会发现工作台，而不是直接做自动执行平台。**

### 18.4 一句话收束

> **把 Pi 当作 Prism 的高性能、可插拔 agent runtime 内核，是非常正确的；但 Prism 必须在 Pi 之上建立自己的金融对象模型、证据系统、机会引擎、治理层与 Web 产品工作台。**

---

## 19. 当前架构决议：Replatform on Pi Agent Kernel

### 19.1 决议

Prism 新主线采用：

> **Prism Replatform on Pi Agent Kernel**

这意味着：

- `Prism_old` 不再作为长期主 runtime 继续 patch。
- `Prism_old` 作为 legacy capability mine，用于提炼 skill、tool/function、prompt、domain contract、测试样本与治理经验。
- 新 Prism 以 Pi Agent 为 runtime substrate，重新建立金融 intelligence-to-action 产品层。
- 第一 MVP 聚焦机会发现，而不是全自动交易。

### 19.2 新主线目录与文档

当前决议相关文档：

- [`INFORMATION_ENERGY_MATERIAL_ARCHITECTURE.md`](./INFORMATION_ENERGY_MATERIAL_ARCHITECTURE.md) — 信息 / 能量 / 物质三位一体转换的架构共识。
- [`MIGRATION_FROM_PRISM_OLD.md`](./MIGRATION_FROM_PRISM_OLD.md) — 从 Prism_old 迁移到 Pi Agent Kernel 的总体路线。
- [`SKILL_INVENTORY.md`](./SKILL_INVENTORY.md) — 第一批 Prism domain skills。
- [`TOOL_INVENTORY.md`](./TOOL_INVENTORY.md) — 第一批 Pi/Prism tools 与 legacy wrapper 策略。
- [`DOMAIN_CONTRACTS.md`](./DOMAIN_CONTRACTS.md) — Opportunity、TradeProposal、RiskCheck、Artifact 等物质层对象。
- [`MVP_AGENT_KERNEL_PLAN.md`](./MVP_AGENT_KERNEL_PLAN.md) — 基于 Pi Agent Kernel 的第一条 MVP 闭环。

### 19.3 实施原则

1. **Replatform, not patch**：不继续在旧自研 runtime 上堆能力。
2. **Pi is engine, Prism is vehicle**：Pi 提供 agent loop / tools / skills / extensions / provider / session；Prism 提供金融领域系统。
3. **Skill is playbook, not product core**：skill 负责 agent 行为说明，核心业务由 operation/domain/policy 承担。
4. **Facts from tools only**：实时市场事实、交易所数据、账户数据必须来自 tool。
5. **Proposal before execution**：任何真实执行前必须先生成 TradeProposal，再经过 RiskCheck 和 confirmation。
6. **Artifact-first**：机会、研究、风控、执行结果都必须沉淀为 artifact。
7. **Workspace-first**：chat 是 surface，不是产品本体。

### 19.4 第一 MVP

第一 MVP：

> **Binance / Bitget funding-basis opportunity scanner**

目标闭环：

```text
用户请求机会发现
  ↓
Pi Agent 加载 funding-rate-arbitrage skill
  ↓
调用 exchange market-data tools
  ↓
计算 funding / basis / fee / slippage / net edge
  ↓
生成 OpportunityArtifact
  ↓
在工作台展示 opportunity card
```

明确非目标：

- 不做全自动交易
- 不直接下单
- 不做完整多用户权限系统
- 不做高频执行
- 不以 chat-first 作为最终产品形态
