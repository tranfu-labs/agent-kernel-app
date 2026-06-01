# Prism Tool Inventory

本文件定义新 Prism 第一批 Pi Agent tools。Tool 是 agent 能调用的确定性能力，负责获取事实、计算结果、创建 artifact 或执行受控动作。

---

## 1. Tool 设计原则

1. Tool 必须小而准。
2. Tool 输出必须结构化。
3. 所有实时金融事实必须来自 tool。
4. 执行类 tool 必须 gated。
5. Tool 不应把 LLM reasoning 写死。
6. Tool 应携带 freshness / source / provider / timestamp。
7. Tool error 应结构化，不能只返回自然语言。

---

## 2. Tool 分类

```text
market-data tools
exchange tools
polymarket tools
opportunity tools
risk tools
execution tools
artifact tools
account tools
source/evidence tools
```

---

## 3. P0 Market Data Tools

The Binance implementation plan and safety/efficiency rules are defined in [`BINANCE_MARKET_DATA_READ_PLANE.md`](./BINANCE_MARKET_DATA_READ_PLANE.md). The TS/Python boundary for market data and analytics is defined in [`TS_PYTHON_TECHNICAL_ROUTE.md`](./TS_PYTHON_TECHNICAL_ROUTE.md). These documents are the design source for replacing mock Binance data with provider-backed public market data and adding Python-powered analytics without drifting from Prism's tool boundary.

### get_exchange_markets

列出交易所支持的市场。

**输入**：

```json
{ "venue": "binance|bitget|bybit|okx", "market_type": "spot|linear_perp|inverse_perp" }
```

**输出**：market list with symbol, base, quote, contract type, status, min size.

**旧来源**：`Prism_old/piea-backend/app/datasources/exchanges/native/`。

---

### get_funding_rates

获取当前或近期资金费率。

**输入**：

```json
{ "venues": ["binance", "bitget"], "symbols": ["BTCUSDT", "ETHUSDT"] }
```

**输出**：funding rate, next funding time, mark/index price, timestamp.

**旧来源**：CEX read plane / funding actions。

---

### get_exchange_tickers

获取 ticker / bid / ask / mark / index / volume。

---

### get_orderbook_depth

获取 order book，并可计算目标 notional 下的可成交深度。

---

### get_ohlcv_series

获取 OHLCV 序列，用于趋势、波动和上下文。

---

## 4. P0 Polymarket Tools

### get_polymarket_event

获取 Polymarket event metadata。

**旧来源**：`app/polymarket/gamma.py`。

### get_polymarket_market

获取单个 market detail。

### get_polymarket_clob_book

获取 CLOB order book。

**旧来源**：`app/polymarket/clob.py`。

### get_polymarket_price_series

获取价格历史。

**旧来源**：`app/polymarket/clob_timeseries.py`。

---

## 5. P0 Opportunity Tools

### scan_funding_opportunities

确定性资金费率机会扫描器。优先用于资金费率机会发现，避免 Agent 手动循环调用低层 market-data tools。

**输入**：venues, symbols, targetNotionalUsd, maxCandidatesForDepth, feeEstimateBps, saveArtifact.

**输出**：ranked candidates, OpportunityArtifacts, savedArtifactId, provider status, warnings.

---

### calculate_funding_edge

计算 funding divergence 的 gross/net edge。

**输入**：funding rates, fees, slippage estimate, notional.

**输出**：gross edge, fee estimate, slippage estimate, net edge, assumptions.

---

### calculate_basis

计算 spot/perp 或 venue/venue basis。

---

### calculate_slippage

根据 orderbook 计算目标 notional 下的滑点。

---

### rank_opportunities

根据 net edge、confidence、freshness、liquidity、risk flags 排序机会。

---

## 6. P0 Artifact Tools

### save_opportunity_artifact

保存机会 artifact。

### save_research_brief_artifact

保存研究简报。

### save_trade_proposal_artifact

保存交易提案。

### save_risk_check_artifact

保存风控审查结果。

---

## 7. P1 Account / Risk Tools

### get_account_balances

查询账户余额。必须权限受控。

### get_positions

查询当前仓位。必须权限受控。

### simulate_execution

基于 orderbook、fee、notional、order type 模拟成交。

### risk_check_trade

确定性风控检查：

- max notional
- max slippage
- venue allowed
- symbol allowed
- balance sufficient
- position exposure
- kill switch
- dry-run mode
- hedge completeness

### request_user_confirmation

请求用户确认执行。

---

## 8. P2 Execution Tools

真实交易 tools 只能在前置系统稳定后启用。

### place_order

真实下单。必须：

- risk check passed
- confirmation present
- audit context present
- notional within policy
- dry-run explicitly false

### cancel_order

撤单。

### get_order_status

查询订单状态。

### close_position

平仓。必须 gated。

---

## 9. Source / Evidence Tools

### search_source_evidence

搜索外部证据。

### fetch_url_content

抓取网页内容。

### verify_official_source

判断来源是否官方或高可信。

### create_evidence_bundle

创建证据 bundle。

---

## 10. Legacy Adapter Strategy

短期工具实现可以调用 Prism_old：

```text
Pi tool -> legacy-adapters/prism-old -> Prism_old Python backend/API/function
```

优先 wrapper 的旧模块：

| Tool | Prism_old 来源 | 迁移策略 |
|---|---|---|
| get_polymarket_event | `app/polymarket/gamma.py` | wrapper |
| get_polymarket_clob_book | `app/polymarket/clob.py` | wrapper |
| get_funding_rates | `app/datasources/exchanges/` | wrapper |
| get_orderbook_depth | `app/datasources/exchanges/native/` | wrapper |
| get_ohlcv_series | `market_data` actions | wrapper |
| wallet analysis | `app/polymarket/wallet_engine/` | wrapper |
| artifact save | `app/services/artifact_service.py` | redesign/storage adapter |

---

## 11. Tool 文件建议布局

```text
packages/tools/
├── market-data/
├── exchanges/
├── polymarket/
├── opportunities/
├── risk/
├── execution/
├── artifacts/
├── account/
└── evidence/
```
