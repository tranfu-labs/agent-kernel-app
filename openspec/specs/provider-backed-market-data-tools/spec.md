# provider-backed-market-data-tools Specification

## Purpose
TBD - created by archiving change wire-provider-backed-market-data-tools. Update Purpose after archive.
## Requirements
### Requirement: Provider-backed funding rates tool
The system SHALL expose a `get_funding_rates` Prism tool that returns current funding-rate facts from `ExchangeMarketDataService` instead of mock data.

#### Scenario: Binance linear perpetual funding rates are requested
- **WHEN** Pi Agent calls `get_funding_rates` for Binance linear perpetual symbols
- **THEN** the tool returns normalized funding-rate points with venue, market type, symbol, funding rate, provider, source, status, timestamps, and warnings

#### Scenario: Unsupported funding venue is requested
- **WHEN** Pi Agent calls `get_funding_rates` for an unsupported venue or market type
- **THEN** the tool returns an explicit unsupported or skipped status with warnings and no fabricated funding facts

### Requirement: Provider-backed order book depth tool
The system SHALL expose a `get_orderbook_depth` Prism tool that estimates fillability and slippage from provider-backed order book snapshots instead of mock data.

#### Scenario: Binance depth is available
- **WHEN** Pi Agent calls `get_orderbook_depth` for a Binance linear perpetual symbol and target notional
- **THEN** the tool returns bid and ask fillability, slippage estimates when fillable, liquidity status, provider, source, status, timestamps, and warnings

#### Scenario: Depth cannot satisfy target notional
- **WHEN** the available order book levels cannot fill the requested notional
- **THEN** the tool marks the insufficient side as not fillable and does not fabricate slippage values

#### Scenario: Provider depth request fails
- **WHEN** the provider request fails, times out, is rate limited, or is geo blocked
- **THEN** the tool returns a structured status and warnings without leaking raw provider exceptions to Pi Agent

### Requirement: Exchange markets tool
The system SHALL expose a `get_exchange_markets` Prism tool that returns provider-backed tradable market metadata through normalized Prism contracts.

#### Scenario: Binance exchange markets are requested
- **WHEN** Pi Agent calls `get_exchange_markets` for Binance linear perpetual markets
- **THEN** the tool returns tradable market records with normalized symbol, venue symbol, base asset, quote asset, status, instrument metadata, provider, source, fetched timestamp, and warnings

#### Scenario: Market symbol filter is provided
- **WHEN** Pi Agent calls `get_exchange_markets` with a symbol filter
- **THEN** the tool returns only matching normalized symbols and preserves structured status metadata

### Requirement: Exchange tickers tool
The system SHALL expose a `get_exchange_tickers` Prism tool that returns provider-backed ticker facts through normalized Prism contracts.

#### Scenario: Binance ticker facts are requested
- **WHEN** Pi Agent calls `get_exchange_tickers` for Binance linear perpetual symbols
- **THEN** the tool returns normalized bid, ask, quantity, mark price, index price when available, provider, source, status, timestamps, and warnings

#### Scenario: Partial ticker data is available
- **WHEN** one provider source succeeds and another provider source fails or lacks a field
- **THEN** the tool returns available ticker fields with a partial or structured non-ok status and warnings rather than dropping the entire response silently

### Requirement: Pi Agent registration for market-data tools
The system SHALL register provider-backed market-data tools with Pi Agent using stable Prism tool names and schemas.

#### Scenario: Pi Agent starts with Prism tools registered
- **WHEN** the Prism agent kernel registers tools
- **THEN** `get_funding_rates`, `get_orderbook_depth`, `get_exchange_markets`, and `get_exchange_tickers` are available as Prism tools

### Requirement: Public read-only market data boundary
The provider-backed market-data tools MUST remain public read-only and MUST NOT require or accept private exchange credentials.

#### Scenario: Market-data tool implementation is reviewed
- **WHEN** the implementation is inspected
- **THEN** it contains no account, balance, position, order, margin, leverage, transfer, cancellation, or execution endpoint usage

### Requirement: No fabricated fallback facts
The system MUST NOT return mock or fabricated market facts when provider-backed data is unavailable.

#### Scenario: Binance is unavailable
- **WHEN** Binance cannot provide requested data
- **THEN** the tool returns structured failure metadata and warnings instead of mock funding rates, mock prices, or mock order book depth

