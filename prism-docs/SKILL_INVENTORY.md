# Prism Skill Inventory

本文件定义新 Prism 基于 Pi Agent Kernel 的第一批领域 skills。Skill 是 agent 的行为 playbook，用来指导“如何完成某类任务”，但不是产品核心数据模型。产品核心仍由 operation、domain contract、policy 和 artifact 承担。

---

## 1. Skill 分层原则

每个 skill 必须说明：

- 何时使用
- 目标是什么
- 必须获取哪些事实
- 允许使用哪些 tools
- 输出什么 artifact
- 禁止事项
- 风险/权限要求
- 示例任务

Skill 不应承担：

- 交易执行权限判断
- 事实生成
- 余额/价格/盘口等实时数据生成
- 替代 deterministic risk engine
- 替代 artifact/domain contract

---

## 2. P0 Skills

### 2.1 funding-rate-arbitrage

**用途**：当用户想寻找 Binance、Bitget、Bybit、OKX 等永续合约资金费率套利机会时使用。

**目标**：发现 funding rate divergence，并计算扣除费用、滑点、容量后的净机会。

**必须事实**：

- venue
- symbol
- funding rate
- funding timestamp
- mark price
- index price
- bid/ask
- order book depth
- maker/taker fee
- minimum order size
- position mode support

**核心 tools**：

- `get_exchange_markets`
- `get_funding_rates`
- `get_tickers`
- `get_orderbook_depth`
- `calculate_funding_edge`
- `calculate_slippage`
- `rank_opportunities`
- `save_opportunity_artifact`

**输出 artifact**：

- `OpportunityArtifact`

**禁止事项**：

- 不得只看 funding rate 就建议交易。
- 不得忽略手续费、滑点、深度、时间戳。
- 不得直接下单。
- 不得把估算收益表述为确定收益。

---

### 2.2 cross-exchange-basis-arbitrage

**用途**：当用户想寻找跨交易所现货/永续/交割合约价差、basis、mispricing 时使用。

**目标**：识别跨 venue spread，估算可执行容量和净 edge。

**必须事实**：

- spot/perp price
- bid/ask spread
- order book depth
- funding rate if perp involved
- borrow/withdraw/deposit constraints when relevant
- fees
- latency/freshness

**核心 tools**：

- `get_exchange_tickers`
- `get_orderbook_depth`
- `calculate_basis`
- `calculate_net_edge`
- `check_market_freshness`
- `save_opportunity_artifact`

**输出 artifact**：

- `OpportunityArtifact`

---

### 2.3 polymarket-event-research

**用途**：分析 Polymarket event/market 的价格、盘口、流动性、事件背景和概率判断。

**目标**：把 Polymarket 市场对象转化为证据化 research brief 或机会判断。

**必须事实**：

- market/event metadata
- outcomes and prices
- CLOB order book
- volume/liquidity
- price history
- rules/resolution source
- relevant external evidence

**核心 tools**：

- `get_polymarket_event`
- `get_polymarket_market`
- `get_polymarket_clob_book`
- `get_polymarket_price_series`
- `search_source_evidence`
- `create_research_brief`

**输出 artifact**：

- `ResearchBriefArtifact`
- `OpportunityArtifact` when actionable

---

### 2.4 execution-risk-review

**用途**：在任何交易执行、策略授权、自动化计划之前进行风险审查。

**目标**：把 Opportunity 或 TradeProposal 转换为 deterministic risk decision。

**必须事实**：

- proposal legs
- venue
- symbol
- notional
- order type
- expected slippage
- available balance
- current position
- max notional policy
- venue permission
- kill switch status

**核心 tools**：

- `get_account_balances`
- `get_positions`
- `simulate_execution`
- `risk_check_trade`
- `create_trade_proposal_artifact`
- `request_user_confirmation`

**输出 artifact**：

- `RiskCheckArtifact`
- `TradeProposalArtifact`

**禁止事项**：

- 不得让 LLM 直接决定是否下单。
- 不得绕过 deterministic risk check。
- 不得在未确认情况下执行真实交易。

---

## 3. P1 Skills

### 3.1 wallet-smart-money-analysis

分析钱包行为、历史盈亏、市场偏好、持仓行为和潜在 signal。

来源：`Prism_old/piea-backend/app/polymarket/wallet_engine/`。

### 3.2 market-liquidity-analysis

分析订单簿深度、价差、成交容量、滑点和市场可执行性。

### 3.3 source-evidence-review

对新闻、网页、官方来源、公告、视频等外部事实做证据化审查。

### 3.4 watch-plan-management

把机会、研究结论或 thesis 转换成 watch plan、alert 或 background job。

---

## 4. P2 Skills

### 4.1 governed-execution

真实执行交易的高级 skill。必须在 P0/P1 工具和风险系统稳定后再启用。

### 4.2 post-trade-review

执行后复盘：成交质量、滑点、PnL、风险偏差、策略更新。

### 4.3 strategy-template-authoring

把多次机会/执行沉淀为可复用策略模板。

---

## 5. Skill 文件建议布局

```text
packages/skills/
├── funding-rate-arbitrage/
│   └── SKILL.md
├── cross-exchange-basis-arbitrage/
│   └── SKILL.md
├── polymarket-event-research/
│   └── SKILL.md
├── execution-risk-review/
│   └── SKILL.md
├── wallet-smart-money-analysis/
│   └── SKILL.md
└── market-liquidity-analysis/
    └── SKILL.md
```
