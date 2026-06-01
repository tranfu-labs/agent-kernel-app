# Prism Domain Contracts

Prism 的产品核心不是 chat，也不是 skill，而是一组金融 intelligence-to-action 领域对象。本文件定义新 Prism 的第一批 domain contracts。

---

## 1. 设计原则

1. Domain object 是 Prism 的物质层。
2. Agent 输出必须尽量沉淀为 domain object / artifact。
3. 实时事实必须有 source / timestamp / freshness。
4. 交易执行必须通过 proposal / risk check / confirmation / receipt。
5. LLM 负责解释和综合，不负责确定性风险裁决。

---

## 2. ResearchObject

表示 Prism 研究或操作的对象。

```ts
type ResearchObjectType =
  | "polymarket_event"
  | "polymarket_market"
  | "wallet"
  | "token"
  | "venue"
  | "strategy"
  | "theme";

interface ResearchObject {
  id: string;
  type: ResearchObjectType;
  label: string;
  externalRefs: Record<string, string>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

---

## 3. EvidenceRecord / EvidenceBundle

```ts
interface EvidenceRecord {
  id: string;
  sourceType: "exchange" | "polymarket" | "web" | "official" | "wallet" | "calculation";
  sourceName: string;
  url?: string;
  provider?: string;
  observedAt: string;
  fetchedAt: string;
  freshnessMs?: number;
  trustLevel: "low" | "medium" | "high" | "official";
  content: unknown;
  summary?: string;
}

interface EvidenceBundle {
  id: string;
  records: EvidenceRecord[];
  coverage: string[];
  gaps: string[];
  createdAt: string;
}
```

---

## 4. Opportunity

表示可研究或可行动的机会。

```ts
type OpportunityType =
  | "funding_rate_arbitrage"
  | "cross_exchange_basis"
  | "polymarket_mispricing"
  | "prediction_market_lag"
  | "wallet_signal"
  | "liquidity_dislocation";

interface Opportunity {
  id: string;
  type: OpportunityType;
  title: string;
  objects: string[];
  venues: string[];
  symbols: string[];
  grossEdgeBps?: number;
  feeEstimateBps?: number;
  slippageEstimateBps?: number;
  netEdgeBps?: number;
  confidence: number;
  liquidityStatus: "unknown" | "insufficient" | "sufficient" | "strong";
  freshnessStatus: "fresh" | "stale" | "mixed";
  riskFlags: string[];
  evidenceBundleId?: string;
  status: "candidate" | "researching" | "confirmed" | "dismissed" | "proposal_created" | "expired";
  createdAt: string;
  updatedAt: string;
}
```

---

## 5. TradeProposal

交易提案。任何真实执行前必须先生成 proposal。

```ts
type TradeProposalStatus =
  | "draft"
  | "risk_checked"
  | "pending_confirmation"
  | "approved"
  | "executing"
  | "executed"
  | "rejected"
  | "cancelled"
  | "failed";

interface TradeLeg {
  venue: string;
  symbol: string;
  marketType: "spot" | "linear_perp" | "inverse_perp" | "polymarket";
  side: "buy" | "sell" | "long" | "short";
  orderType: "market" | "limit" | "post_only";
  notionalUsd: number;
  quantity?: number;
  limitPrice?: number;
  reduceOnly?: boolean;
}

interface TradeProposal {
  id: string;
  opportunityId?: string;
  strategy: string;
  legs: TradeLeg[];
  expectedGrossEdgeBps?: number;
  expectedNetEdgeBps?: number;
  maxSlippageBps: number;
  maxTotalNotionalUsd: number;
  assumptions: string[];
  riskCheckId?: string;
  status: TradeProposalStatus;
  createdBy: "agent" | "user" | "system";
  createdAt: string;
  updatedAt: string;
}
```

---

## 6. RiskCheckResult

确定性风控结果。

```ts
interface RiskCheckResult {
  id: string;
  proposalId: string;
  decision: "pass" | "fail" | "requires_confirmation" | "requires_size_reduction";
  checks: Array<{
    name: string;
    status: "pass" | "fail" | "warning";
    detail: string;
  }>;
  maxAllowedNotionalUsd?: number;
  requiredConfirmation: boolean;
  blockingReasons: string[];
  warnings: string[];
  policyVersion: string;
  checkedAt: string;
}
```

---

## 7. ExecutionTicket / ExecutionReceipt

```ts
interface ExecutionTicket {
  id: string;
  proposalId: string;
  riskCheckId: string;
  confirmationId?: string;
  dryRun: boolean;
  status: "pending" | "approved" | "executing" | "completed" | "partial" | "failed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

interface ExecutionReceipt {
  id: string;
  ticketId: string;
  venue: string;
  orderId?: string;
  clientOrderId?: string;
  status: "accepted" | "rejected" | "filled" | "partial" | "cancelled" | "failed";
  requested: unknown;
  response: unknown;
  filledQuantity?: number;
  averagePrice?: number;
  fees?: unknown;
  createdAt: string;
}
```

---

## 8. Artifact

```ts
type ArtifactType =
  | "research_brief"
  | "comparison_report"
  | "opportunity"
  | "trade_proposal"
  | "risk_check"
  | "execution_receipt"
  | "watch_plan"
  | "post_trade_review";

interface Artifact<T = unknown> {
  id: string;
  type: ArtifactType;
  title: string;
  objectIds: string[];
  contentMarkdown?: string;
  contentJson: T;
  evidenceBundleId?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 9. AuditEvent

所有执行相关动作都必须产生 audit event。

```ts
interface AuditEvent {
  id: string;
  actorType: "user" | "agent" | "system";
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  input: unknown;
  output?: unknown;
  decision?: string;
  reason?: string;
  createdAt: string;
}
```

---

## 10. Contract 优先级

P0：

- EvidenceRecord
- EvidenceBundle
- Opportunity
- Artifact

P1：

- TradeProposal
- RiskCheckResult
- ExecutionTicket

P2：

- ExecutionReceipt
- AuditEvent
- WatchPlan
- StrategyTemplate
