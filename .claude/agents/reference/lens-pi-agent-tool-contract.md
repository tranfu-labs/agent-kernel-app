# Lens: Pi Agent Tool Contract

Use this lens when work registers, changes, or consumes Pi Agent / Prism runtime tools.

## Goal

Prism product tools must expose safe, product-level capabilities only. They must not expose development tools, private credentials, account operations, or execution powers in read-only MVP work.

## Checks

### Schema safety

Tool input schemas must not include read-only MVP forbidden fields:

```text
apiKey
secret
passphrase
account
balance
position
openOrder
orderId for execution
side for execution
quantity for execution
leverage
margin
transfer
withdrawal
private
```

Market research tools may include product-safe inputs such as venues, symbols, market type, fee estimate, notional estimate, include flags, and artifact saving flags.

### Runtime safety

- Product runtime users must not receive coding tools such as `read`, `write`, `edit`, or `bash`.
- Tool implementation must use stable Prism service/operation APIs.
- Tool implementation must not import raw provider classes directly when a service boundary exists.
- Tool must not execute trades or mutate accounts unless an approved governance OpenSpec exists.

### Fact integrity

- Tool descriptions and prompt guidance must tell the model not to invent market facts.
- Tool output must include status/warnings/summary where provider data can be partial.
- Tool output must preserve enough lineage for opportunities and artifacts.

## Failure patterns

- Agent tool schema includes private credentials or account/execution fields.
- Tool description implies direct execution for a read-only scanner.
- Tool calls raw provider adapters instead of stable service/operation APIs.
- Tool hides warnings and returns only a natural-language summary.
- Tool output cannot distinguish real provider facts from missing data.

## Evidence to request

- Tool definition file.
- Tool schema fields.
- Prompt snippets/guidelines.
- Operation/service call path.
- Contract tests or smoke scripts invoking the tool.
- Safety grep for forbidden fields.
