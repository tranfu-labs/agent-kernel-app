# binance-public-market-data-coverage Specification

## ADDED Requirements

### Requirement: Broad Binance public data provider coverage

The Binance USDⓈ-M Futures provider SHALL support broad public market-data coverage while remaining public read-only.

#### Scenario: Core public data endpoints are available

- **WHEN** Prism needs Binance market metadata, current funding, book ticker, 24h ticker, selected depth, funding history, open interest, or OHLCV series
- **THEN** the provider exposes typed methods for those public endpoints
- **AND** each method returns an `AdapterFetchResult` with provider, source, status, fetched timestamp, warnings, elapsed time, and request weight when known

#### Scenario: Extended public context is requested

- **WHEN** Prism needs positioning, open-interest history, mark/index/premium klines, or recent aggregate trade context
- **THEN** the provider exposes public read-only methods for those data families as implemented slices
- **AND** raw Binance response shapes remain below the provider/service boundary

#### Scenario: Private endpoint is considered

- **WHEN** an endpoint requires private credentials or can read or mutate account, position, order, margin, leverage, wallet, transfer, or execution state
- **THEN** it is excluded from this provider expansion
- **AND** requires a separate OpenSpec change before implementation

### Requirement: Provider coverage does not expand Pi Agent tool sprawl

Prism SHALL NOT expose one Pi Agent tool per Binance endpoint.

#### Scenario: New Binance provider method is added

- **WHEN** a provider method is added for a Binance public endpoint
- **THEN** the method is composed through service-level normalized contracts or operation-level workflows
- **AND** it is not automatically registered as a separate Pi Agent tool

### Requirement: Request weight and cache discipline

The expanded Binance provider and service SHALL preserve request efficiency.

#### Scenario: Expensive or per-symbol data is requested

- **WHEN** depth, klines, funding history, open interest history, positioning ratios, or trade data is requested
- **THEN** Prism applies explicit cache TTLs and request coalescing where applicable
- **AND** full-universe scans avoid fetching expensive per-symbol data before coarse screening

#### Scenario: Provider rate metadata is known

- **WHEN** Binance documents request weight for an endpoint
- **THEN** the provider records that request weight in the fetch result metadata or endpoint metadata near provider code
