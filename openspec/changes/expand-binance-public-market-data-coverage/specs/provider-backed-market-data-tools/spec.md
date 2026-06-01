# provider-backed-market-data-tools Specification Delta

## ADDED Requirements

### Requirement: Market context tool

Prism SHALL expose a high-level `get_market_context` tool that composes selected normalized market-data families for selected symbols.

#### Scenario: Market context is requested for selected Binance symbols

- **WHEN** Pi Agent calls `get_market_context` for Binance linear perpetual symbols with include flags such as market, ticker, funding, funding history, open interest, series, positioning, or depth
- **THEN** the tool returns normalized `MarketContext` records with aggregated status, warnings, source metadata, and timestamps
- **AND** the tool does not expose raw Binance response arrays as the primary contract

#### Scenario: Unsafe full-universe expensive context is requested

- **WHEN** a request would fetch depth, klines, trade data, or other expensive per-symbol context for an unsafe number of symbols
- **THEN** the tool skips or rejects the expensive include with structured warnings instead of issuing an uncontrolled full-universe scan

### Requirement: Market series tool

Prism SHALL expose a `get_market_series` tool for normalized OHLCV-like series used by analytics and research flows.

#### Scenario: Market series is requested

- **WHEN** Pi Agent calls `get_market_series` for a selected Binance symbol, interval, and series type
- **THEN** the tool returns normalized series records suitable for downstream analytics
- **AND** the output includes provider/source/status/timestamp/warning metadata

### Requirement: Existing ticker tool supports 24h context

The existing `get_exchange_tickers` tool SHALL support 24h ticker context when requested.

#### Scenario: 24h ticker fields are requested

- **WHEN** Pi Agent calls `get_exchange_tickers` with `fields` containing `24h`
- **THEN** the tool returns available last price, 24h volume, quote volume, and price-change fields through the normalized `ExchangeTicker` contract
