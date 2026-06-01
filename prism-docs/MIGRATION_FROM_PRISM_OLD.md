# Prism Replatform：从 Prism_old 迁移到 Pi Agent Kernel

## 1. 决策结论

Prism 不再以 `Prism_old` 的自研 Python agent runtime 作为长期产品内核继续堆叠能力，而是采用：

> **Pi Agent Kernel as runtime substrate, Prism as financial intelligence-to-action product system.**

也就是：

- **Pi Agent** 承担通用 agent loop、tool calling、skills、extensions、session、provider/model、SDK/RPC 能力。
- **Prism** 承担金融对象模型、证据系统、机会发现、交易提案、风险治理、执行审计与 Web 工作台。
- **Prism_old** 作为能力矿山，用于提炼 skills、tools/functions、prompts、domain contracts、测试样本与经验教训。

本迁移不是在旧系统上继续局部修补，而是一次 **replatform**：保留 Prism 哲学和领域资产，替换底层 agent 发动机。

---

## 2. 为什么不继续 patch Prism_old

Prism_old 已有大量能力，但每新增一项外部数据或交易能力，都需要修改多层：

```text
datasource
model
action
registry
operation catalog
intent router
session orchestrator
context builder
presentation
frontend
tests
```

这导致：

- 外部数据接入慢
- 新交易所接入慢
- 执行能力接入复杂
- action/capability/operation 多真源容易漂移
- agent runtime 变成长期自研负担
- 业务能力被 orchestration glue 拖慢

新的方式应变成：

```text
一个新能力 = tool + skill + operation contract + domain artifact + risk policy
```

---

## 3. Prism_old 的角色

`/Users/griffith/Projects/Prism_old` 不作为新系统主干继续演化，而作为：

```text
legacy capability mine
```

需要从中提炼四类资产。

### 3.1 Skills

从旧文档、workflow、prompt、测试和产品经验中提炼：

- Polymarket event research
- Polymarket trading preparation
- Funding-rate arbitrage
- Cross-exchange basis arbitrage
- Wallet / smart money analysis
- Market liquidity analysis
- Source evidence review
- Execution risk review

### 3.2 Tools / Functions

优先迁移或包装：

- Polymarket Gamma / CLOB / Data API
- CEX market data read plane
- Binance / Bybit / Bitget / OKX connectors
- funding rate / open interest / basis / ticker / order book readers
- wallet engine
- market screening functions
- analyzers
- artifact persistence
- observation / web research components

短期优先 wrapper，不急着重写：

```text
Pi tool -> legacy adapter -> Prism_old Python service/function
```

### 3.3 Prompts

提炼：

- global system prompt
- research prompt
- comparison prompt
- market / wallet analysis prompt
- trading constitution
- execution risk prompt
- artifact output prompt
- language/style prompt

### 3.4 Domain Contracts

提炼并升级为新 Prism 的物质层对象：

- ResearchObject
- ObjectContext
- EvidenceRecord / EvidenceBundle
- Opportunity
- OpportunityScore
- TradeProposal
- RiskCheckResult
- ExecutionTicket
- ExecutionReceipt
- WatchPlan
- Artifact
- AuditEvent

---

## 4. 新 Prism 目标结构

推荐目录：

```text
Prism/
├── prism-docs/
│   ├── PRISM_CORE_STRATEGY_AND_ARCHITECTURE.md
│   ├── MIGRATION_FROM_PRISM_OLD.md
│   ├── SKILL_INVENTORY.md
│   ├── TOOL_INVENTORY.md
│   ├── DOMAIN_CONTRACTS.md
│   └── MVP_AGENT_KERNEL_PLAN.md
│
├── apps/
│   ├── web/                 # workspace-first Prism product UI
│   └── agent-api/           # API/streaming/session bridge for Pi kernel
│
├── packages/
│   ├── agent-kernel/        # Pi SDK adapter and Prism agent session factory
│   ├── skills/              # Prism domain skills
│   ├── tools/               # market data, exchange, polymarket, risk, execution, artifact tools
│   ├── domain/              # domain contracts and pure domain logic
│   ├── operations/          # product-level operation contracts
│   ├── policies/            # risk, permission, confirmation, audit policies
│   └── storage/             # persistence adapters
│
├── legacy-adapters/
│   └── prism-old/           # wrappers around Prism_old capabilities
│
└── docs/
```

---

## 5. 迁移顺序

### Phase 0 — Extraction

产出：

- `SKILL_INVENTORY.md`
- `TOOL_INVENTORY.md`
- `DOMAIN_CONTRACTS.md`
- `MVP_AGENT_KERNEL_PLAN.md`

目标：明确什么迁、怎么迁、先迁什么。

### Phase 1 — Pi Agent Kernel PoC

建立：

- `packages/agent-kernel`
- `packages/tools`
- `packages/skills`
- `packages/domain`
- `legacy-adapters/prism-old`

第一条闭环：

```text
Binance / Bitget funding-basis opportunity scanner
```

只读，不真实交易。

### Phase 2 — Trade Proposal

增加：

- Opportunity refresh
- simulation
- fee / slippage / capacity estimate
- deterministic risk check
- TradeProposal artifact
- pending confirmation ticket

仍不真实下单。

### Phase 3 — Gated Execution

增加：

- exchange credential vault
- dry-run default
- max notional policy
- explicit confirmation
- audit log
- kill switch
- place/cancel/get-order/get-position tools

只允许小额、受控、可审计执行。

---

## 6. 迁移原则

1. **Replatform, not patch**：不要继续在旧 runtime 上补 agent 能力。
2. **Pi is engine, Prism is vehicle**：Pi 做 agent kernel，Prism 做金融产品系统。
3. **Skills are playbooks, not product core**：skill 指导 agent 怎么做，产品核心由 operation/domain/policy 承担。
4. **Facts from tools only**：实时价格、盘口、资金费率、余额、仓位等必须来自工具。
5. **No direct LLM-to-order execution**：LLM 不能直接裸下单。
6. **Proposal before execution**：先 TradeProposal，再 RiskCheck，再 confirmation，再 execution。
7. **Artifact-first**：有价值输出必须沉淀为 artifact，而不是只留在聊天文本。
8. **Workspace-first**：chat 是 surface，不是系统本体。

---

## 7. 废弃/弱化的旧系统部分

优先不迁移：

- 旧 `SessionOrchestrator` 的复杂手写 routing
- 静态 OperationCatalog 多真源体系
- 过重的 chat_service orchestration glue
- 与新 Pi kernel 重叠的 runtime/tool-loop/provider/session 功能
- 只服务旧 UI 的 presentation glue

优先保留/提炼：

- 数据源函数
- analyzers
- wallet engine
- Polymarket clients
- artifact/object/context 设计经验
- tests/eval fixtures
- 风险与治理文档

---

## 8. 最终目标

Prism 新系统的目标不是“金融聊天机器人”，而是：

> **一个以 Pi Agent 为运行时内核、以机会发现和受控执行为核心物质输出的金融 intelligence-to-action workbench。**
