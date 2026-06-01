## Core contracts

### Source family principle

Prism must not attempt to normalize all future markets and data sources into one universal payload shape.

Instead, the Information Plane is partitioned into **source families** that share common governance and a common outer envelope, while preserving family-specific normalized payloads.

Initial source families:

1. `venue_market_data`
   - crypto exchange data today
   - later equities-style quote/market sources where semantically appropriate
2. `event_rules_data`
   - sports schedules, odds snapshots, prediction-market event metadata, resolution rules
3. `contextual_evidence`
   - official documents, web pages, news, browser-derived snapshots, local datasets/files

Every family uses a shared provenance/freshness/degradation envelope, but not a shared universal payload schema.

### Read-plane layering

```text
transport adapter
-> source descriptor / capability registry
-> fact envelope normalization
-> read-plane gateway / resolver
-> family query service
-> deterministic operation
-> artifact / signal / report / prep
```

### Source descriptor minimum fields

Every source/adapter declaration must include at minimum:

- `sourceId`
- `sourceFamily`
- `providerName`
- `transport`: `sdk | rest | browser | file | stream`
- `authRequirement`: `public | service_token | user_secret | session_cookie | browser_login`
- `trustLevel`: `official | high | medium | low`
- `freshnessClass`: `realtime | near_realtime | delayed | historical | static`
- `costClass`
- `rateLimitClass`
- `supportedCapabilities`
- `degradationModes`

### Capability registry

The registry is the anti-sprawl center of the architecture.

Capabilities must be semantic, not endpoint-shaped. Examples:

#### Venue / market family
- `instrument.catalog`
- `market.snapshot`
- `market.depth`
- `market.funding`
- `market.series`
- `market.open_interest`

#### Event / rules family
- `event.catalog`
- `event.rules`
- `event.odds_snapshot`
- `event.orderbook`
- `event.timeline`

#### Contextual evidence family
- `document.snapshot`
- `source.verification`
- `source.change_detection`
- `web.extract`
- `dataset.scan`
- `dataset.schema`
- `dataset.slice`

Each capability declaration must include:
- `capabilityKey`
- `queryShape`
- `responseShape`
- `mode`: `snapshot | batch | stream`
- `sourcePriority`
- `authRequirement`
- `freshnessClass`
- `degradationModes`

### Canonical fact envelope

Every capability response must be wrapped in a shared Prism fact envelope:

```ts
{
  sourceId,
  provider,
  sourceFamily,
  capabilityKey,
  status,            // ok | partial | timeout | rate_limited | geo_blocked | unsupported | failed
  warnings,
  observedAt,
  fetchedAt,
  freshnessClass,
  freshnessMs,
  trustLevel,
  authRequirement,
  coverage,          // what was requested vs returned vs missing
  payload            // family-specific normalized payload
}
```

The envelope is shared; `payload` is family-specific.

This preserves cross-family governance while avoiding a fake universal domain model.

### Read-plane gateway

The gateway is the canonical TypeScript read boundary. It owns:

- capability -> source resolution
- cache / in-flight coalescing
- freshness policy
- provider health mapping
- rate-limit awareness
- retry budget
- stale-read policy
- structured degradation

The gateway does **not** own:
- ranking
- comparison semantics
- opportunity scoring
- artifact policy
- user-facing product copy

### Family query services

Family query services are semantic wrappers around the gateway, not raw providers.

Examples:
- `VenueMarketDataQueryService`
- `EventDataQueryService`
- `EvidenceQueryService`

They convert capability-level reads into family-meaningful snapshots/context objects that operations can consume.

### Operations boundary

Operations remain deterministic and provider-agnostic.

Examples:
- `scan_funding_basis_arbitrage`
- `compare_market_contexts`
- future `research_equity_object`
- future `inspect_source_evidence`
- future `discover_prediction_market_mispricing`

Operations must consume family query services or normalized fact envelopes, never raw provider payloads or SDK objects.

### Agent tool boundary

Agent-visible tools should remain at two levels only:

1. **Product operations**
   - discover / compare / explain / report / refresh / prep / monitor
2. **Selected drilldown contracts**
   - get market context
   - get evidence bundle
   - get event context

Agent-visible tools must **not** expand one-to-one with provider endpoints.

### Prism planes affected

- Information plane: source descriptors, capability registry, normalized envelopes, read gateway, family query services, freshness/auth/degradation rules
- Energy plane: deterministic operations that consume normalized capability outputs rather than provider quirks
- Material plane: artifacts, reports, signals, monitor definitions, and degraded research outputs backed by normalized fact lineage

### Safety boundary

This blueprint stays inside the explicit read-only research boundary.

- Allowed: public-data reads, browser-based source inspection, file/dataset inspection, normalized fact extraction, artifact-backed research outputs
- Disallowed: account/wallet state, balances, positions, private order routes, execution-control connectors, write APIs
- Required separation: any future private/auth connector family must be a **separate** governed family, not an extension of the public-read base contract

### Hard rules

1. Realtime facts must remain provider-backed.
2. Providers are replaceable; Prism contracts are stable.
3. Operations must not import raw provider classes.
4. Agent tools must not become endpoint-shaped.
5. One universal cross-market payload schema is forbidden.
6. Degradation must be explicit and structured, never implied by missing arrays alone.
7. Funding-basis is the first proving family, not Prism’s permanent identity.
8. TS remains the canonical read-plane owner; Python stays behind TS wrappers for heavy analytics.
9. Public-read connectors and private/governed connectors must remain separate contract families.
10. New connector admission must be gated by reusable capability fit, not convenience alone.

### Adoption path

#### Stage 0 — Freeze anti-sprawl rule
No new endpoint-shaped agent-visible tools.
No raw provider payloads in operation or artifact contracts.

#### Stage 1 — Extract source-plane contracts
From the current exchange implementation, extract:
- source descriptor
- capability declaration
- fact envelope
- freshness/auth/health/degradation contract

#### Stage 2 — Register current exchange adapters as capability providers
Convert Binance + Bitget into the first `venue_market_data` family members without changing product-facing operation names.

#### Stage 3 — Route existing tools through the gateway
Keep current product tools stable, but make them consume capability-registered family services rather than direct monolithic exchange methods.

#### Stage 4 — Validate with one non-crypto family
Add exactly one second family sample (preferred: prediction/event family) to prove the abstraction works outside exchange-shaped data.

#### Stage 5 — Add browser-backed and file-backed adapters
Only after family contracts are stable.

#### Stage 6 — Add stream adapters
Reserve stream contracts now; implement later after snapshot plane is stable.
