# network-resilient-market-data Specification

## Purpose
TBD - created by archiving change add-read-only-binance-market-data-proxy. Update Purpose after archive.
## Requirements
### Requirement: Read-only Binance market-data proxy

Prism SHALL provide a minimal optional proxy for Binance USDⓈ-M Futures public market-data endpoints so local development can use a remote network path when direct local Binance access is unavailable.

#### Scenario: Allowed public endpoint is proxied

- **WHEN** a client sends `GET /prism-binance-futures/fapi/v1/premiumIndex?symbol=BTCUSDT`
- **THEN** the proxy forwards the request to the configured Binance upstream
- **AND** returns the upstream status and JSON body

#### Scenario: Private or unknown endpoint is rejected

- **WHEN** a client sends a request for an endpoint outside the allowlist
- **THEN** the proxy rejects the request without contacting Binance

### Requirement: Proxy does not change Prism market-data semantics

The proxy SHALL remain a transport seam only. Prism market-data normalization, provider status handling, caching, tool schemas, and artifact semantics SHALL remain in the TypeScript read plane.

#### Scenario: Prism tools use proxy via base URL

- **WHEN** `PRISM_BINANCE_USDS_FUTURES_BASE_URL` points to the proxy base path
- **THEN** existing Prism Binance tools can fetch data without changing their tool contracts

### Requirement: Live smoke is environment-gated

Prism SHALL provide a live Binance market-data smoke command that can target production, testnet, or a read-only proxy through configuration.

#### Scenario: Provider is unreachable

- **WHEN** the target network cannot reach the configured provider
- **THEN** the smoke reports structured provider statuses and warnings instead of relying on fabricated facts

