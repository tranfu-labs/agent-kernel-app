# Prism MVP Agent Kernel Plan

本文件定义基于 Pi Agent Kernel 的新 Prism 第一阶段 MVP。

## Status

把本文件视为 MVP 目标与产品边界说明，不要把它当成当前 control-plane implementation 的唯一 source of truth。

当前更高优先级的实现设计与计划见：

- [`../docs/superpowers/specs/2026-05-31-vertical-pluggable-research-copilot-design.md`](../docs/superpowers/specs/2026-05-31-vertical-pluggable-research-copilot-design.md)
- [`../docs/superpowers/plans/2026-05-31-vertical-pluggable-research-copilot.md`](../docs/superpowers/plans/2026-05-31-vertical-pluggable-research-copilot.md)
- [`../openspec/changes/define-vertical-pluggable-research-copilot/`](../openspec/changes/define-vertical-pluggable-research-copilot/)

当前第一阶段 MVP 的详细 funding-basis vertical spec 见 [`MVP_FUNDING_BASIS_ARBITRAGE_PLAN.md`](./MVP_FUNDING_BASIS_ARBITRAGE_PLAN.md)。该 spec 将本文件的 MVP 目标落到 Opportunity Operating Core 架构下的 Binance / Bitget funding-basis arbitrage read-only 闭环。

---

## 1. MVP 目标

第一阶段不做完整交易平台，不做自动下单，不做泛化金融助手。

MVP 目标是：

> **用 Pi Agent Kernel 跑通跨交易所 funding / basis 机会发现闭环，并把结果沉淀为 OpportunityArtifact。**

首个场景：

```text
Binance / Bitget BTC、ETH、SOL 永续合约 funding-basis opportunity scanner
```

---

## 2. 为什么选这个 MVP

相比 Polymarket 真实交易或复杂策略执行，funding/basis scanner 更适合验证新架构：

- 数据结构明确
- 工具调用边界清楚
- 不需要一开始处理真实下单
- 容易验证结果正确性
- 能直接体现 Prism 的机会发现价值
- 可逐步扩展到 execution proposal

---

## 3. 用户故事

### Story 1 — 机会发现

用户输入：

```text
帮我找现在 Binance / Bitget 上 BTC、ETH、SOL 有没有合约套利机会。
```

Agent 应：

1. 识别任务为 funding / basis opportunity scan。
2. 加载 `funding-rate-arbitrage` skill。
3. 调用 exchange market data tools。
4. 获取 funding、ticker、orderbook depth。
5. 计算 fee/slippage/net edge。
6. 排序机会。
7. 保存 OpportunityArtifact。
8. 返回结构化机会卡片。

### Story 2 — 解释机会

用户输入：

```text
解释第一个机会为什么值得看。
```

Agent 应：

1. 读取 OpportunityArtifact。
2. 拉取最新数据刷新 freshness。
3. 解释 edge、费用、滑点、风险、失效条件。
4. 不得建议直接执行。

### Story 3 — 生成交易提案，不下单

用户输入：

```text
针对第一个机会生成执行方案。
```

Agent 应：

1. 刷新 opportunity。
2. 模拟执行。
3. 运行 risk check。
4. 生成 TradeProposalArtifact。
5. 状态为 `pending_confirmation` 或 `risk_checked`。
6. 不调用真实 `place_order`。

---

## 4. MVP 架构

```text
apps/agent-api
  ↓
packages/agent-kernel
  ↓ Pi SDK
packages/skills/funding-rate-arbitrage
  ↓
packages/tools/exchanges
packages/tools/opportunities
packages/tools/artifacts
  ↓
legacy-adapters/prism-old 或 native exchange clients
  ↓
exchange APIs / storage
```

---

## 5. MVP 必需模块

### 5.1 agent-kernel

职责：

- 创建 PrismAgentSession
- 注册 Prism tools
- 加载 Prism skills
- 配置模型/provider
- 禁用 coding tools for product runtime
- 处理 streaming events
- 桥接 session 到产品 API

### 5.2 skills/funding-rate-arbitrage

职责：

- 定义 agent 做 funding arbitrage scan 的步骤
- 强制获取必要事实
- 约束输出格式
- 禁止直接执行交易

### 5.3 tools/exchanges

P0 tools：

- `get_exchange_markets`
- `get_funding_rates`
- `get_exchange_tickers`
- `get_orderbook_depth`

### 5.4 tools/opportunities

P0 tools：

- `calculate_funding_edge`
- `calculate_basis`
- `calculate_slippage`
- `rank_opportunities`

### 5.5 tools/artifacts

P0 tools：

- `save_opportunity_artifact`
- `get_artifact`

### 5.6 domain

P0 contracts：

- `EvidenceRecord`
- `EvidenceBundle`
- `Opportunity`
- `Artifact`

P1 contracts：

- `TradeProposal`
- `RiskCheckResult`

---

## 6. MVP 输出格式

Agent 最终应返回类似：

```json
{
  "summary": "发现 2 个候选机会，1 个具备进一步研究价值。",
  "opportunities": [
    {
      "symbol": "ETHUSDT",
      "type": "funding_rate_arbitrage",
      "venues": ["binance", "bitget"],
      "grossEdgeBps": 21.4,
      "feeEstimateBps": 6.2,
      "slippageEstimateBps": 3.5,
      "netEdgeBps": 11.7,
      "confidence": 0.74,
      "liquidityStatus": "sufficient",
      "freshnessStatus": "fresh",
      "riskFlags": ["funding_time_mismatch_possible"],
      "nextAction": "refresh_and_create_trade_proposal"
    }
  ],
  "artifactId": "..."
}
```

---

## 7. 验收标准

MVP 成功标准：

1. Agent 能自动选择正确 tools。
2. 所有价格、funding、orderbook 事实来自 tools。
3. 输出包含 timestamp / freshness。
4. 输出 OpportunityArtifact。
5. 不真实下单。
6. 对费用、滑点、深度有基本估算。
7. 能解释为什么机会有效或无效。
8. 能在数据缺失时降级，而不是编造。

---

## 8. 非目标

MVP 不做：

- 自动交易
- 高频执行
- 复杂 portfolio management
- 多用户权限系统
- 完整 Web 工作台
- Polymarket 真实下单
- team collaboration

---

## 9. 后续阶段

### Phase 2 — Trade Proposal

增加：

- `simulate_execution`
- `risk_check_trade`
- `save_trade_proposal_artifact`
- `request_user_confirmation`

### Phase 3 — Gated Execution

增加：

- `place_order`
- `cancel_order`
- `get_order_status`
- `get_positions`
- `get_account_balances`
- audit log
- kill switch
- API key vault

### Phase 4 — Workspace Product

增加：

- Opportunity Feed
- Evidence Panel
- Artifact Browser
- Execution Tickets
- Agent Command Surface

---

## 10. 推荐第一批文件

```text
packages/agent-kernel/src/createPrismAgent.ts
packages/agent-kernel/src/registerPrismTools.ts
packages/skills/funding-rate-arbitrage/SKILL.md
packages/tools/exchanges/src/getFundingRates.ts
packages/tools/exchanges/src/getOrderbookDepth.ts
packages/tools/opportunities/src/calculateFundingEdge.ts
packages/tools/artifacts/src/saveOpportunityArtifact.ts
packages/domain/src/opportunity.ts
packages/domain/src/artifact.ts
apps/agent-api/src/server.ts
```
