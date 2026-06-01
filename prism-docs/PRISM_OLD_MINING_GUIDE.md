# Prism_old Mining Guide

This guide defines how to use `/Users/griffith/Projects/Prism_old` as a function, skill, prompt, and architecture reference mine for the new Pi Agent Kernel based Prism.

## 1. Goal

Do not migrate Prism_old wholesale. Extract only useful assets that accelerate the new Prism architecture.

Prism_old is a mine for:

- functions
- tools
- data connectors
- prompts
- skills/playbooks
- domain contracts
- tests and fixtures
- architecture lessons

Prism_old is not the new runtime.

---

## 2. Asset categories

### 2.1 Tool / Function

Reusable deterministic implementation.

Examples:

- Polymarket Gamma client
- Polymarket CLOB order book reader
- funding rate readers
- ticker / order book / OHLCV readers
- wallet engine functions
- analyzers

Target location:

```text
packages/tools/
legacy-adapters/prism-old/
```

Migration style:

1. Wrap old function/API first.
2. Add typed input/output.
3. Add freshness/source/timestamp fields.
4. Later port or rewrite if needed.

---

### 2.2 Skill / Playbook

Reusable agent workflow guidance.

Examples:

- event research workflow
- compare workflow
- wallet analysis workflow
- funding arbitrage workflow
- risk review workflow

Target location:

```text
packages/skills/
packages/pi-package/skills/
```

Skill must say:

- when to use
- required facts
- tools to call
- output artifact
- forbidden shortcuts
- risk rules

---

### 2.3 Prompt

Reusable system or task guidance.

Examples:

- system prompt
- research synthesis prompt
- compare prompt
- wallet summary prompt
- risk/execution prompt

Target location:

```text
packages/agent-kernel/
packages/pi-package/prompts/
```

Prompt should not contain realtime facts. It should only shape behavior.

---

### 2.4 Domain Contract

Stable product object or artifact shape.

Examples:

- ObjectContext
- EvidenceBundle
- ResearchBrief
- CompareArtifact
- Opportunity
- TradeProposal
- RiskCheck

Target location:

```text
packages/domain/
```

---

### 2.5 Test / Fixture

Existing regression knowledge.

Examples:

- provider response fixtures
- wallet engine tests
- CEX read-plane tests
- intent routing examples
- observation fixtures

Target location:

```text
tests/ or package-local test fixtures later
```

---

### 2.6 Architecture Lesson

Useful design lesson, not necessarily code.

Examples:

- ObjectContext as truth
- artifact-first outputs
- provider-backed facts
- action/capability drift pitfalls
- permission gate gaps

Target location:

```text
prism-docs/
AGENTS.md
```

---

## 3. Extraction template

When extracting anything from Prism_old, record:

```text
Name:
Category:
Old source path:
New target path:
Why useful:
Migration mode: wrap | port | rewrite | document only
Runtime risk:
Trading risk:
Tests/fixtures available:
Next step:
```

---

## 4. First extraction priorities

### P0

1. Polymarket Gamma / CLOB readers
2. CEX funding/ticker/orderbook readers
3. funding / basis opportunity calculations
4. artifact persistence shape
5. funding-rate-arbitrage skill details
6. execution-risk-review skill details

### P1

1. wallet engine
2. market overview analyzers
3. source evidence / web research parts
4. compare artifact logic
5. context packet ideas

### P2

1. old chat/session routing lessons
2. old UI presentation ideas
3. old governance tooling

---

## 5. What not to extract directly

Avoid directly moving:

- old monolithic orchestration glue
- old session router complexity
- old action policy duplication
- old operation catalog static lists
- old chat-first assumptions
- old execution placeholders without policy gates

Extract lessons, not the accidental complexity.

---

## 6. Current first target

First target extraction:

> Build mock-to-real path for Binance / Bitget funding-basis scanner.

Needed assets from Prism_old:

- exchange market data contracts
- funding rate readers
- ticker readers
- order book depth logic
- existing tests/fixtures if available

New target:

```text
packages/tools/src/exchanges/
packages/tools/src/opportunities/
legacy-adapters/prism-old/
```
