# network-resilient-market-data Specification Delta

## MODIFIED Requirements

### Requirement: Read-only Binance market-data proxy

Prism SHALL provide a minimal optional proxy for Binance USDⓈ-M Futures public market-data endpoints so local development can use a remote network path when direct local Binance access is unavailable.

#### Scenario: Allowed public endpoint is proxied

- **WHEN** a client sends a GET request through the proxy for an allowlisted Binance USDⓈ-M Futures public market-data endpoint
- **THEN** the proxy forwards the request to the configured Binance upstream
- **AND** returns the upstream status and JSON body

#### Scenario: Expanded public data endpoint is proxied

- **WHEN** a client sends a GET request through the proxy for newly supported public endpoints such as 24h ticker, funding history, open interest, klines, positioning ratios, or aggregate trades
- **THEN** the proxy allows the request only if the endpoint is explicitly allowlisted as public read-only

#### Scenario: Private or unknown endpoint is rejected

- **WHEN** a client sends a request for an endpoint outside the allowlist
- **THEN** the proxy rejects the request without contacting Binance
