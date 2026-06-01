## Why

Prism’s current read plane already has strong seeds — provider adapters, normalized fetch envelopes, TTL caching, and deterministic operations — but it is still structurally shaped around the funding/exchange wedge. If we keep growing by adding one function and one tool per source, future domains such as A-shares, HK/US equities, football/sports, prediction markets, browser-derived sources, and file/dataset inputs will cause tool sprawl, schema drift, duplicated retry/freshness logic, and product semantics leaking out of provider quirks.

Prism is not a “query many APIs” product. It is a workspace-first, artifact-first research operating system. That means the Information Plane must be designed as a **Prism-owned data capability platform**:
- providers/adapters remain replaceable
- normalized facts remain stable
- operations stay deterministic and provider-agnostic
- agent-visible tools stay high-level and product-safe
- new source families can plug into the same discover / explain / compare / refresh / monitor / emit_signal workflows

This change defines that source-plane blueprint before implementation continues to sprawl around exchange-specific helper functions.

## What changes

- Define a **source-family-based read plane** for Prism rather than a universal “one schema for all markets” or one-function-per-endpoint growth model.
- Introduce the core blueprint layers:
  - transport adapters
  - source descriptors and capability registry
  - canonical fact envelope with status/freshness/provenance
  - read-plane gateway / resolver
  - family-specific domain query services
  - operations consuming capabilities instead of raw provider functions
  - agent tool registration limited to product-level operations and selected drilldown contracts
- Define three initial source families:
  1. **venue-market data** (crypto exchanges, later equities-style quote venues)
  2. **event/rules data** (sports, prediction/event markets, schedules, resolution rules)
  3. **contextual evidence** (web/news/official sources, browser-derived snapshots, documents, local datasets)
- Define explicit connector capability metadata, auth tiers, freshness classes, degradation modes, and admission rules.
- Keep the first implementation horizon narrow: prove the abstraction by evolving the current Binance/Bitget read plane into the first source family, then validate with one second non-crypto family before broad expansion.

## Impact

- Affects `@agentkernel/domain`, `@agentkernel/tools`, `@agentkernel/operations`, `@agentkernel/agent-kernel`, and `@agentkernel/storage` at the blueprint/specification level.
- Preserves the current MVP1 funding-basis path while preventing future source integration from degenerating into endpoint-shaped tool sprawl.
- Creates the architectural contract needed for later verticals (prediction markets, equities, sports, evidence sources) without forcing them into one fake universal market schema.

## Out of scope / non-goals

- Implementing the full source-plane runtime in this change.
- Private/authenticated data connectors, account-linked providers, portfolio/wallet state, balances, positions, or order/execution connectors.
- Broad UI/workspace rendering changes.
- Replacing the current funding-basis scanner in this slice.
- Designing a universal payload schema for all source families.
- Making every provider directly agent-visible.
- Full streaming/monitoring engine implementation.

## Acceptance outcomes

- `proposal.md`, `design.md`, `test-matrix.md`, and `tasks.md` define a Prism-owned, source-family-based read-plane blueprint.
- The blueprint explicitly preserves Information -> Energy -> Material separation and keeps product semantics out of raw providers.
- The blueprint explicitly defines capability registry, fact envelope, auth/freshness/degradation rules, and agent-tool exposure boundaries.
- The blueprint explicitly rejects both “one-function-per-source” growth and a fake universal cross-market schema.
- The blueprint identifies a staged adoption path: **first a narrow `venue_market_data` proving slice via `getMarketContext()`**, then one second family sample, then broader rollout.
