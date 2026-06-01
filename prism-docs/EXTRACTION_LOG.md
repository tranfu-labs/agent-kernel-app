# Prism_old Extraction Log

This log tracks every capability extracted from `/Users/griffith/Projects/Prism_old` into the new Prism architecture.

Use this template for each extraction:

```text
Name:
Category:
Old source path:
New target path:
Why useful:
Migration mode: wrap | port | rewrite | document only
Information/Energy/Material plane:
Runtime risk:
Trading risk:
Tests/fixtures available:
Validation command:
Next step:
```

---

## 2026-05-29 — Initial architecture mining

Name: Prism_old datasource architecture lessons
Category: architecture lesson
Old source path:
- `/Users/griffith/Projects/Prism_old/piea-backend/app/datasources/README.md`
- `/Users/griffith/Projects/Prism_old/piea-backend/app/datasources/_common/fetch_envelope.py`
- `/Users/griffith/Projects/Prism_old/piea-backend/app/datasources/exchanges/native/contracts.py`
- `/Users/griffith/Projects/Prism_old/piea-backend/app/datasources/exchanges/native/registry.py`
New target path:
- `prism-docs/PRISM_OLD_SYSTEMATIC_EXTRACTION_PLAN.md`
Why useful:
- Defines safe L1/L2/L3 data-source layering, fetch envelope semantics, native exchange contract strategy, and provider degradation patterns.
Migration mode: document only
Information/Energy/Material plane: Information
Runtime risk: low
Trading risk: low
Tests/fixtures available:
- `Prism_old/piea-backend/tests/datasources/*`
- `Prism_old/piea-backend/tests/test_cross_venue_funding_opportunity_scan.py`
Validation command:
- `npm run typecheck`
Next step:
- Implement provider-backed Binance public market-data contracts before replacing mock tools.

---

## 2026-05-29 — Binance market-data read-plane design

Name: Binance public market-data read plane
Category: architecture lesson / tool design
Old source path:
- `/Users/griffith/Projects/Prism_old/piea-backend/app/datasources/_common/fetch_envelope.py`
- `/Users/griffith/Projects/Prism_old/piea-backend/app/datasources/exchanges/native/contracts.py`
- `/Users/griffith/Projects/Prism_old/piea-backend/app/datasources/exchanges/native/registry.py`
- `/Users/griffith/Projects/Prism_old/piea-backend/app/datasources/exchanges/native/binance_usds_futures.py`
- `/Users/griffith/Projects/Prism_old/piea-backend/app/datasources/exchanges/binance_derivatives.py`
- Binance official USDⓈ-M Futures public market-data REST documentation
New target path:
- `prism-docs/BINANCE_MARKET_DATA_READ_PLANE.md`
- future `packages/domain/src/fetch-status.ts`
- future `packages/domain/src/market-data.ts`
- future `packages/tools/src/exchanges/providers/binance-usds-futures.ts`
Why useful:
- Defines the contract-first architecture for replacing mock funding/orderbook data with safe, efficient, provider-backed Binance public market data.
Migration mode: document only, then native TypeScript port
Information/Energy/Material plane: Information
Runtime risk: low for public read-only data
Trading risk: low; private/account/execution endpoints are explicitly out of scope
Tests/fixtures available:
- `Prism_old/piea-backend/tests/datasources/*`
- `Prism_old/piea-backend/tests/test_cross_venue_funding_opportunity_scan.py`
Validation command:
- `npm run typecheck`
- future `npm run smoke:binance-market-data`
Next step:
- Implement fetch/status and market-data contracts before replacing mock Binance tools.
