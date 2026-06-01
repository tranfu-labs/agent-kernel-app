# Prism MVP1 Funding-Basis Copilot Design

## Goal

MVP1 is Prism's first built-in vertical on top of the broader financial opportunity substrate: a read-only Binance/Bitget funding-basis opportunity copilot.

When a user says they want to find arbitrage opportunities on Binance and Bitget, Prism should identify the funding-basis research intent, apply defaults or ask for missing high-risk parameters, call the funding-basis scanner, retrieve provider-backed market context from both venues, generate structured comparisons/signals/opportunities/scores, optionally save artifacts, and explain the result with evidence and warnings.

MVP1 proves that Prism can turn natural-language financial research intent into traceable tool calls, provider-backed facts, structured opportunities, and durable material outputs.

## Product Positioning

Prism should behave like a Cursor-like financial research copilot, not a fixed trading bot.

Cursor does not replace the programmer's entire project judgment. It provides code understanding, editing, testing, context, and iteration support. Prism should similarly provide market fact retrieval, opportunity scanning, evidence-backed analysis, strategy parameter collaboration, and artifact memory while leaving financial judgment, strategy preferences, and future execution decisions under human control.

## Scope

MVP1 implements one narrow built-in workflow:

```text
Binance / Bitget
linear perpetuals
funding-basis-v1
read-only public market data
opportunity cards + artifacts
no execution
```

The default user story is:

```text
User: I want to find arbitrage opportunities on Binance and Bitget.

Prism:
  -> identifies cross-venue funding-basis intent
  -> applies safe defaults or asks for missing high-risk parameters
  -> calls scan_funding_basis_arbitrage
  -> fetches Binance and Bitget MarketContext through ExchangeMarketDataService
  -> generates Comparison / Signal / Opportunity / Score
  -> saves OpportunityArtifact when appropriate
  -> returns opportunity cards, assumptions, warnings, and next-step options
```

## Non-goals

MVP1 must not implement:

- private exchange API keys;
- balances, positions, open orders, or fills;
- order placement or cancellation;
- leverage or margin mutation;
- transfer or withdrawal;
- automatic trading;
- complete intent router;
- complete plugin marketplace;
- complete provider registry;
- Polymarket connector;
- A-share connector;
- full Web UI;
- complex workflow engine.

MVP1 may prepare future proposal/risk/execution context, but it must remain read-only.

## Architecture Principles

### Narrow implementation, broad substrate

MVP1 should be narrow in implementation but broad in architecture.

Narrow implementation:

```text
scan_funding_basis_arbitrage
Binance / Bitget
linear perpetuals
funding-basis-v1
```

Broad substrate:

```text
Evidence -> MarketContext -> Comparison -> Signal -> Opportunity -> Score -> Artifact -> Proposal -> Risk
```

The funding-basis scanner is one vertical-specific implementation of the shared substrate, not the whole Prism architecture.

### Fixed foundation

These foundations are fixed and should not be changed by user prompting or LLM improvisation:

- provider-backed facts only;
- no fabricated realtime financial data;
- read-only safety boundary;
- normalized MarketContext objects;
- structured Comparison / Signal / Opportunity / Score / Artifact chain;
- status and warning propagation;
- artifact lineage;
- operation purity;
- Pi Agent does not own product semantics or scoring formulas;
- future execution requires separate governance design.

### Flexible strategy layer

The user may adjust strategy parameters without code changes:

- symbols;
- target notional;
- estimated fees;
- minimum edge threshold;
- minimum funding difference;
- mode: conservative, balanced, or research;
- report verbosity;
- artifact saving preference;
- watchlist or human notes.

User-provided strategy preferences become overrides to the default workflow.

## Substrate vs Vertical-Specific Boundaries

MVP1 must clearly separate platform substrate concepts from funding-basis vertical concepts.

| Layer | Concepts | Rule |
| --- | --- | --- |
| Platform substrate | Evidence, MarketContext, Comparison, Signal, Opportunity, Score, Artifact, Proposal/Risk boundary | Must remain general enough for future Polymarket, A-share, custom data sources, custom providers, custom operations, and custom skills. |
| Funding-basis vertical | ExchangeMarketContext, CrossVenueComparison, funding-basis-v1 scoring, scan_funding_basis_arbitrage, Binance/Bitget provider path | May be specific to Binance/Bitget linear perpetual funding-basis discovery. |

MVP1 implementation must not make the substrate crypto-only, Binance/Bitget-only, or funding-basis-only. Vertical-specific types are allowed, but they should remain examples of broader abstractions rather than replacements for those abstractions.

## MVP1 Must Not Block Future Extensions

MVP1 does not implement a plugin system, but implementation choices must preserve future extension paths.

MVP1 implementation must not:

- make `Opportunity` crypto-only;
- make `Artifact` funding-basis-only;
- make top-level `MarketContext` exchange-only;
- make tool selection assume all arbitrage means Binance/Bitget funding basis;
- treat funding-basis scoring dimensions as globally universal;
- require Pi Agent prompt logic to own financial scoring or product semantics;
- collapse provider fetching, opportunity logic, artifact creation, and presentation into an untestable monolith.

Future verticals should be able to add new context, comparison, signal, operation, scoring, and artifact variants without rewriting the MVP1 foundation.

## Hybrid Parameter Mode

MVP1 uses a hybrid parameter mode.

### Default-first path

For ordinary requests such as:

```text
Find Binance/Bitget arbitrage opportunities.
Scan funding opportunities.
帮我看看 Binance/Bitget 有没有套利机会。
```

Prism should run with defaults and disclose assumptions:

```text
symbols = BTCUSDT, ETHUSDT, SOLUSDT
targetNotionalUsd = 1000
estimatedFeeBps = 4
mode = balanced
saveArtifacts = true
```

The response should say these defaults were used and invite the user to rerun with custom symbols, notional, fees, or strictness.

### Ask-first path

For high-risk or execution-shaped requests such as:

```text
I want to deploy large capital.
Help me actually execute this.
Use 100,000 USDT.
Place the trade today.
```

Prism should not execute. It should restate the read-only boundary and ask for research parameters such as symbols, notional assumptions, fee assumptions, and risk constraints.

### Override path

When the user provides parameters, Prism should apply them directly:

```text
Only scan BTC and ETH.
Use 6 bps fee assumption.
Use conservative mode.
Do not save artifacts.
```

## Intent Classification and Tool Selection Rules

MVP1 does not need a complete intent router, but the funding-basis skill and tool guidance should follow explicit intent rules.

| Intent | Example user language | Default behavior |
| --- | --- | --- |
| `cross_venue_funding_basis` | "Binance/Bitget 套利", "资金费率套利", "funding basis opportunity", "scan Binance and Bitget" | Use `scan_funding_basis_arbitrage` as the primary workflow. |
| `funding_rate_lookup` | "Binance BTC funding rate 是多少", "show Bitget ETH funding" | Use low-level funding-rate tools for lookup, not opportunity creation. |
| `market_context_lookup` | "看一下 BTCUSDT 的盘口/价格/funding", "inspect market context" | Use `get_market_context` or `get_orderbook_depth` for drilldown. |
| `opportunity_explanation` | "解释第一个机会", "why is this candidate interesting?" | Use saved artifact/comparison/signal lineage first; use low-level tools only for additional drilldown. |
| `unsupported_or_extension_required` | "Polymarket 世界杯套利", "A 股自定义数据源", "现货永续套利" | Explain that MVP1's built-in workflow is Binance/Bitget funding-basis; identify the needed provider, operation, and skill without pretending the funding scanner supports it. |

The Agent should prefer the highest-level safe operation that matches the user intent. Low-level tools are for lookup, explanation, and drilldown; they should not replace the funding-basis scanner for primary opportunity discovery.

## Follow-up Interaction Examples

```text
User: 只看 ETH，手续费 8 bps，保守模式重跑。
Prism: rerun scan_funding_basis_arbitrage with symbols=ETHUSDT, estimatedFeeBps=8, mode=conservative.

User: 解释第一个机会为什么值得看。
Prism: use the saved artifact, comparison, signal, score explanation, warnings, and optional low-level drilldown.

User: 这个能不能直接做？
Prism: explain that MVP1 is read-only and that execution requires future Proposal / Risk / Confirmation / Audit governance.

User: 我想研究 Polymarket 世界杯机会。
Prism: classify as extension-required for MVP1, explain needed data sources, PredictionMarketContext, InformationMarketComparison, and a prediction-market operation.
```

## Default Workflow

The MVP1 workflow is:

```text
1. User expresses Binance/Bitget arbitrage research intent.
2. Pi Agent maps the request to cross-venue funding-basis intent.
3. Pi Agent applies the hybrid parameter policy.
4. Pi Agent selects the funding-basis skill/workflow.
5. Pi Agent calls scan_funding_basis_arbitrage.
6. Tool calls ExchangeMarketDataService.getMarketContext for each venue/symbol.
7. Operation evaluates normalized MarketContext objects.
8. Operation creates comparisons, signals, opportunities, scores, and artifacts.
9. Agent returns opportunity cards, warnings, assumptions, artifact IDs, and next-step options.
10. User can rerun with overrides, ask for explanation, inspect data, or continue research.
```

The Agent should not manually recreate the scanner by calling low-level tools and doing ad hoc LLM calculations. Low-level market tools are for drilldown and explanation after the scanner result, not the primary opportunity workflow.

## Opportunity Card Output

MVP1's primary product output is an opportunity card plus optional artifact.

Each opportunity card should include:

```text
symbol
opportunity type
venues
candidate long venue
candidate short venue
funding rates by venue
funding difference bps
basis or price difference when available
estimated fee bps
estimated slippage bps when available
estimated net edge bps
target notional
score
confidence
warnings
data freshness
artifact id
next action
```

If no opportunity is found, Prism should still return a useful no-opportunity result:

```text
No actionable funding-basis opportunities found.
Why: missing funding, insufficient edge, stale provider data, or warnings.
Artifacts: none if no opportunity exists.
Next: retry later, use research mode, inspect market contexts, or rerun with different assumptions.
```

## Artifact Requirements

Artifacts are Material-layer outputs, not disposable chat text.

A saved MVP1 artifact should preserve:

```text
opportunityIds
marketContextIds
comparisonIds
signalIds
provider facts
calculated metrics
assumptions
warnings
score explanation
createdBy: operation
```

Artifacts support follow-up explanation, reruns, reports, future proposal/risk work, and long-term research memory.

## Extension Boundary

MVP1 does not implement a plugin system, but it must not block future extensions.

### Keep vertical-specific

It is acceptable for MVP1 to narrow:

```text
venues: Binance / Bitget
marketType: linear_perp
operation: scan_funding_basis_arbitrage
scoringVersion: funding-basis-v1
```

### Keep substrate-general

It is not acceptable to make the broader substrate crypto-only or Binance/Bitget-only.

The following must remain general enough for future verticals:

```text
Evidence
MarketContext
Comparison
Signal
Opportunity
Score
Artifact
ToolDefinition
Skill playbook
Provider status/warnings
Proposal/Risk boundary
```

Future verticals should map naturally onto the same substrate.

## Future Expansion Examples

### Polymarket World Cup opportunity research

A future Polymarket vertical should be able to map to:

```text
external API / video / news / official sources
  -> EvidenceBundle
  -> PredictionMarketContext
  -> InformationMarketComparison
  -> mispricing or lag Signal
  -> Opportunity
  -> Score
  -> ResearchArtifact
  -> future WatchProposal / TradeProposal / Risk
```

### A-share custom data source research

A future A-share vertical should be able to map to:

```text
custom data source
  -> EvidenceBundle
  -> EquityMarketContext
  -> event/price Comparison
  -> Signal
  -> Opportunity
  -> Score
  -> Artifact
  -> future broker/execution governance
```

## Modes

MVP1 should reserve three strategy modes.

### Conservative

Require more complete facts before producing an opportunity. Missing funding blocks opportunity creation. Missing depth should usually block or lower confidence sharply.

### Balanced

Default mode. Missing funding blocks opportunity creation. Missing depth may produce warnings and lower confidence, but must not fabricate slippage.

### Research

Can surface near-threshold candidates for investigation, but they should be clearly labeled as research candidates. They should not be saved as formal OpportunityArtifacts unless they satisfy the normal opportunity requirements or the artifact type explicitly represents research/watch context.

## Safety Rules

MVP1 must always enforce:

```text
read-only
no private credentials
no account state
no execution
no fabricated market facts
missing funding -> no formal opportunity
missing opportunity -> no opportunity artifact
warnings stay visible
future execution requires governance OpenSpec
```

## Required Verification Seeds

The implementation plan should turn these seeds into concrete tests, smokes, or static checks.

### Intent and tool guidance

- Ordinary Binance/Bitget arbitrage phrases map to `cross_venue_funding_basis` guidance and prefer `scan_funding_basis_arbitrage`.
- High-risk or execution-shaped phrases trigger read-only ask-first behavior.
- Polymarket, A-share, spot-perp, or custom-data-source phrases are classified as extension-required, not silently routed to the funding-basis scanner.
- Low-level tools are documented and tested as lookup/drilldown paths, not as the primary scanner path.

### Tool contract

- `scan_funding_basis_arbitrage` schema remains read-only.
- The schema contains no credential, account, order, leverage, margin, transfer, withdrawal, or execution fields.
- Tool prompt guidance tells Pi Agent not to invent market facts and to preserve warnings.

### Operation behavior

- Missing funding on either venue produces no formal opportunity and no opportunity artifact.
- Missing depth does not fabricate slippage; it produces warning/lower confidence behavior according to mode.
- User overrides change scanner input deterministically.
- Conservative, balanced, and research modes have distinct documented behavior before being exposed as product controls.

### Artifact and opportunity card

- Opportunity cards include assumptions, warnings, score/confidence, data freshness, and artifact ID when saved.
- Artifacts preserve marketContextIds, comparisonIds, signalIds, opportunityIds, assumptions, warnings, and createdBy.
- No opportunity means no opportunity artifact unless the artifact type explicitly represents a research/watch report.

### Smoke and safety

- `scan_funding_basis_arbitrage` tool smoke executes the registered tool path.
- Live partial status is acceptable only with explicit warnings and no fabricated opportunities/artifacts.
- Static safety scan finds no private/account/execution implementation in read-only MVP work.
- Provider-boundary scan confirms agent-kernel does not import raw provider classes and operations do not import tools.

## Design Decision

MVP1 should use:

```text
Approach B: Binance/Bitget default workflow + strategy overrides.
```

Rejected alternatives:

- fixed scanner only: too narrow and not Cursor-like;
- complete plugin platform now: too heavy for MVP1;
- complete intent router now: useful later but unnecessary before the first vertical is product-stable.

## Success Criteria

MVP1 design is successful when:

- ordinary Binance/Bitget arbitrage requests run with safe defaults;
- high-risk or execution-shaped requests are kept read-only and ask for research parameters;
- user overrides are converted into scanner parameters or strategy mode;
- scanner output is shown as opportunity cards with assumptions and warnings;
- artifacts preserve lineage;
- low-level tools are used for drilldown, not ad hoc primary scanning;
- architecture remains compatible with future Polymarket, A-share, custom data source, custom provider, custom operation, and custom skill expansion.
