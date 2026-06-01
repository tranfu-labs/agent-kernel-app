# Lens: Provider Boundary

Use this lens when work touches exchange providers, market-data services, tool wrappers, operations, or Pi Agent tool registration.

## Goal

Preserve a clean read-plane and prevent provider-specific details from leaking into Prism domain, operation, artifact, or agent-facing contracts.

## Expected boundary

```text
Provider adapter
  -> ExchangeMarketDataService
  -> normalized Prism domain contracts
  -> operation workflow
  -> artifact/tool/API surface
```

## Checks

### Provider adapter

- Uses public/read-only provider endpoints unless an approved governance OpenSpec says otherwise.
- Does not score, rank, compare opportunities, or create artifacts.
- Does not expose private credentials, account state, orders, positions, leverage, margin, transfers, or withdrawals in read-only work.
- Converts provider errors into structured status/warnings rather than silent success.

### ExchangeMarketDataService

- Owns provider-backed market-data normalization.
- Does not become an analytics or opportunity engine.
- Produces common Prism domain contracts such as MarketContext, ticker, funding, depth, and status/warnings.
- Preserves source/freshness/status enough for downstream financial fact integrity.

### Operations

- Depend on domain contracts and injected dependencies.
- Do not import `@agentkernel/tools`.
- Keep pure deterministic cores separate from fetching and persistence.

### Agent kernel / API tools

- Use stable service/tool APIs, not raw provider classes.
- Register product-safe tool schemas.
- Do not expose provider internals or coding tools to product runtime users.

## Failure patterns

- `@agentkernel/operations` imports `@agentkernel/tools`.
- `packages/agent-kernel` imports raw Binance/Bitget provider classes.
- Provider payload shape appears directly in agent-facing tool output.
- Analytics/scoring logic is added to `ExchangeMarketDataService`.
- Tool schema includes provider-specific private fields or account/execution concepts.

## Evidence to request

- Relevant provider/service/operation/tool files.
- Import scans proving package boundaries.
- Tests using fake providers/services for deterministic behavior.
- Live smoke output showing structured status/warnings.
