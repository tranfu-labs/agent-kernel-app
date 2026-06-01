import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";

import { normalizeBitgetDepthLimit } from "../../src/exchanges/providers/bitget-rate-limits.ts";
import { BitgetUsdtFuturesProvider } from "../../src/exchanges/providers/bitget-usdt-futures.ts";

describe("Bitget USDT Futures provider", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("normalizes depth limits to supported Bitget buckets", () => {
    assert.equal(normalizeBitgetDepthLimit(0), 50);
    assert.equal(normalizeBitgetDepthLimit(5), 5);
    assert.equal(normalizeBitgetDepthLimit(6), 15);
    assert.equal(normalizeBitgetDepthLimit(16), 50);
    assert.equal(normalizeBitgetDepthLimit(51), 100);
  });

  it("uses public mix market endpoints and params", async () => {
    const calls: string[] = [];
    mock.method(globalThis, "fetch", async (url: string | URL) => {
      const value = url.toString();
      calls.push(value);
      if (value.includes("contracts")) return Response.json({ code: "00000", msg: "success", data: [] });
      if (value.includes("tickers")) return Response.json({ code: "00000", msg: "success", data: [] });
      if (value.includes("current-fund-rate")) return Response.json({ code: "00000", msg: "success", data: [] });
      return Response.json({ code: "00000", msg: "success", data: { bids: [], asks: [], ts: "1760000000000" } });
    });

    const provider = new BitgetUsdtFuturesProvider({ baseUrl: "https://example.test/proxy", timeoutMs: 1_000 });

    await provider.getContracts();
    await provider.getTickers(["BTC/USDT"]);
    await provider.getCurrentFundingRates(["BTC/USDT"]);
    await provider.getOrderbook("BTC/USDT", 6);

    assert.equal(new URL(calls[0]).pathname, "/proxy/api/v2/mix/market/contracts");
    assert.equal(new URL(calls[0]).searchParams.get("productType"), "USDT-FUTURES");
    assert.equal(new URL(calls[1]).pathname, "/proxy/api/v2/mix/market/tickers");
    assert.equal(new URL(calls[1]).searchParams.get("symbol"), "BTCUSDT");
    assert.equal(new URL(calls[2]).pathname, "/proxy/api/v2/mix/market/current-fund-rate");
    assert.equal(new URL(calls[3]).pathname, "/proxy/api/v2/mix/market/merge-depth");
    assert.equal(new URL(calls[3]).searchParams.get("limit"), "15");
  });

  it("maps Bitget non-success codes to failed provider results", async () => {
    mock.method(globalThis, "fetch", async () => Response.json({ code: "40001", msg: "bad request", data: null }));
    const provider = new BitgetUsdtFuturesProvider({ baseUrl: "https://example.test", timeoutMs: 1_000 });

    const result = await provider.getTickers(["BTCUSDT"]);

    assert.equal(result.status, "failed");
    assert.match(result.reason ?? "", /Bitget request failed/);
    assert.deepEqual(result.warnings, ["failed"]);
  });
});
