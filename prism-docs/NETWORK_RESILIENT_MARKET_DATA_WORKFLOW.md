# Network-Resilient Market Data Workflow

This document defines how Prism development continues efficiently when local networks cannot reach exchange production endpoints such as Binance.

Prism must not let local DNS pollution, geo-blocking, TLS/SNI blocking, VPN instability, or provider downtime block deterministic development.

---

## 1. Decision

Use this default workflow:

```text
Local Prism development
  -> deterministic tests and fixture/provider tests by default
  -> structured provider statuses for unavailable live data
  -> optional remote live market-data proxy or remote smoke runner for production exchange access
```

Do not require every developer machine to reach Binance production domains directly.

---

## 2. Current known issue pattern

Some local networks resolve or route Binance production domains incorrectly.

Observed failure modes include:

```text
fapi.binance.com -> unexpected IPs or 0.0.0.0
a curl request never completes TCP/TLS
Node fetch returns UND_ERR_CONNECT_TIMEOUT
forced correct DNS/IP still resets at TLS/SNI
```

At the same time, a cloud server in a working region may resolve and access Binance normally:

```text
GET https://fapi.binance.com/fapi/v1/time -> 200
GET https://fapi.binance.com/fapi/v1/exchangeInfo -> 200
GET https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT -> 200
GET https://fapi.binance.com/fapi/v1/depth?symbol=BTCUSDT&limit=5 -> 200
```

Therefore local live failures are often infrastructure/network issues, not Prism provider logic issues.

---

## 3. Development rules

### 3.1 Local development must remain deterministic

Local development should rely on:

- TypeScript typecheck
- unit tests
- fixture tests
- mocked/fake provider tests
- structured failure tests
- smoke tests that accept provider-unavailable statuses

Local tests must not require production Binance access unless explicitly marked as live.

### 3.2 Live provider access is optional and environment-gated

Live tests should run only when the environment can reach the provider or when a remote proxy is configured.

Use environment variables for live paths:

```bash
PRISM_BINANCE_USDS_FUTURES_BASE_URL=https://fapi.binance.com
```

For a reachable testnet path:

```bash
PRISM_BINANCE_USDS_FUTURES_BASE_URL=https://testnet.binancefuture.com
```

For the local or deployed Prism read-only proxy:

```bash
PRISM_BINANCE_USDS_FUTURES_BASE_URL=http://127.0.0.1:8000/prism-binance-futures
```

Start the local proxy server with:

```bash
npm run dev -w @agentkernel/agent-api
```

Run the live smoke through the configured base URL with:

```bash
PRISM_BINANCE_USDS_FUTURES_BASE_URL=http://127.0.0.1:8000/prism-binance-futures npm run smoke:binance-market-data
```

### 3.3 Never fabricate market facts

If live data is unavailable, tools must return structured statuses such as:

```text
timeout
geo_blocked
rate_limited
unsupported
failed
partial
```

Pi Agent may explain the unavailability and save an explicit provider-unavailable artifact, but it must not invent funding rates, prices, order book depth, or liquidity.

### 3.4 Keep provider access in the TypeScript read plane

The network workaround must not change the architecture:

```text
TS ExchangeMarketDataService owns provider access, normalization, cache, status, and Pi Agent tool boundaries.
Python owns heavy analytics after normalized inputs exist.
```

A proxy is an infrastructure transport seam, not a second business logic implementation.

---

## 4. Recommended architecture for network resilience

### 4.1 Local default path

```text
Prism local dev
  -> ExchangeMarketDataService
  -> Binance provider
  -> local network
  -> structured status if unavailable
```

This path is enough for most implementation work because tests should be deterministic.

### 4.2 Remote proxy path

```text
Prism local dev
  -> ExchangeMarketDataService
  -> PRISM_BINANCE_USDS_FUTURES_BASE_URL
  -> internal read-only market-data proxy
  -> Binance production REST
```

The proxy should be thin and public-read-only.

It may proxy only approved endpoints:

```text
GET /prism-binance-futures/fapi/v1/time
GET /prism-binance-futures/fapi/v1/exchangeInfo
GET /prism-binance-futures/fapi/v1/premiumIndex
GET /prism-binance-futures/fapi/v1/ticker/bookTicker
GET /prism-binance-futures/fapi/v1/depth
```

Do not proxy private endpoints, account endpoints, order endpoints, transfer endpoints, leverage endpoints, or margin endpoints.

### 4.3 Remote smoke runner path

```text
Local deterministic development
  -> SSH or CI job on cloud server
  -> live read-only Binance smoke
  -> report provider status and sample shape
```

Use this when a proxy is not yet deployed.

---

## 5. Server placement guidance

A production NewAPI server can be used to prove Binance connectivity or host a very thin read-only proxy only if capacity allows.

Do not place the full Prism development environment on a small production gateway server when it has:

- limited root disk
- no swap
- existing production workloads
- no Node/npm installed
- existing Docker, database, bridge, and gateway services

Full Prism staging should use a separate machine with at least:

```text
2-4 vCPU
8 GiB RAM
60 GiB+ SSD
Node 22
Python 3.12+
Docker
```

Recommended progression:

```text
local dev + remote smoke
  -> thin read-only proxy
  -> dedicated Prism staging server
```

---

## 6. Diagnostic commands

### 6.1 Public IP

```bash
python3 - <<'PY'
import json, urllib.request
with urllib.request.urlopen("https://api.ipify.org?format=json", timeout=10) as r:
    print(json.load(r))
PY
```

### 6.2 DNS and TCP diagnosis

```bash
python3 - <<'PY'
import socket, time
hosts = [
    "fapi.binance.com",
    "api.binance.com",
    "developers.binance.com",
    "testnet.binancefuture.com",
    "example.com",
]
print("== DNS ==")
for host in hosts:
    try:
        infos = socket.getaddrinfo(host, 443, proto=socket.IPPROTO_TCP)
        addrs = []
        for info in infos:
            addr = info[4][0]
            if addr not in addrs:
                addrs.append(addr)
        print(host, addrs[:8])
    except Exception as error:
        print(host, type(error).__name__, error)
print("== TCP ==")
for host in hosts:
    start = time.time()
    try:
        with socket.create_connection((host, 443), timeout=8) as sock:
            print(host, "tcp_ok", round((time.time() - start) * 1000), "ms", sock.getpeername())
    except Exception as error:
        print(host, "tcp_fail", type(error).__name__, str(error), round((time.time() - start) * 1000), "ms")
PY
```

### 6.3 Direct Binance production curl

```bash
curl -4 -sS -m 15 \
  -w '\nHTTP_CODE=%{http_code}\nREMOTE_IP=%{remote_ip}\nTIME_CONNECT=%{time_connect}\nTIME_APPCONNECT=%{time_appconnect}\nTIME_STARTTRANSFER=%{time_starttransfer}\nTIME_TOTAL=%{time_total}\n' \
  'https://fapi.binance.com/fapi/v1/time'
```

### 6.4 Prism live provider diagnostic

Run from repo root:

```bash
node --import tsx -e '
import { getExchangeMarkets, getExchangeTickers, getFundingRates, getOrderbookDepth } from "./packages/tools/src/index.ts";

const calls = {
  markets: await getExchangeMarkets({ venue: "binance", marketType: "linear_perp", symbols: ["BTCUSDT", "ETHUSDT"] }),
  funding: await getFundingRates({ venues: ["binance"], marketType: "linear_perp", symbols: ["BTCUSDT", "ETHUSDT"] }),
  tickers: await getExchangeTickers({ venues: ["binance"], marketType: "linear_perp", symbols: ["BTCUSDT", "ETHUSDT"], fields: ["book", "mark"] }),
  depth: await getOrderbookDepth({ venue: "binance", marketType: "linear_perp", symbol: "BTCUSDT", notionalUsd: 1000, limit: 5 }),
};

console.log(JSON.stringify({
  markets: { status: calls.markets.status, count: calls.markets.markets.length, warnings: calls.markets.warnings },
  funding: { status: calls.funding.status, count: calls.funding.rates.length, warnings: calls.funding.warnings, sample: calls.funding.rates[0] },
  tickers: { status: calls.tickers.status, count: calls.tickers.tickers.length, warnings: calls.tickers.warnings, sample: calls.tickers.tickers[0] },
  depth: { status: calls.depth.status, liquidityStatus: calls.depth.liquidityStatus, warnings: calls.depth.warnings, snapshotLevels: calls.depth.snapshot?.bids.length },
}, null, 2));
'
```

For testnet:

```bash
PRISM_BINANCE_USDS_FUTURES_BASE_URL=https://testnet.binancefuture.com node --import tsx -e '<same script as above>'
```

---

## 7. Acceptance criteria for network-resilient market data

A market-data change is acceptable only if:

1. Unit and fixture tests pass without live network access.
2. Live provider failures return structured statuses instead of raw exceptions.
3. Agent smoke can complete with real facts or explicit provider-unavailable artifacts.
4. A live smoke path exists for a remote/proxy environment that can reach providers.
5. No private exchange or execution endpoint is introduced as a workaround.
6. The developer can continue implementing contracts, normalization, artifacts, and analytics when Binance production is unreachable locally.

---

## 8. Practical default

When local Binance production access fails, do this instead of blocking development:

```text
1. Continue deterministic local implementation and tests.
2. Run testnet diagnostics if needed.
3. Use remote live smoke or remote read-only proxy for production facts.
4. Preserve timeout/geo_blocked/rate_limited statuses in artifacts.
5. Move full staging to a dedicated Prism server when needed.
```

This keeps Prism aligned with the north star:

```text
provider-backed Information
  -> deterministic and agent-guided Energy
  -> artifact-backed Material
```
