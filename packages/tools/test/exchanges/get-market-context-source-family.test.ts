import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { getMarketContext } from "../../src/exchanges/get-market-context.ts";
import { defaultExchangeMarketDataService } from "../../src/exchanges/exchange-market-data-service.ts";

const fetchedAt = "2026-05-30T00:00:00.000Z";
const original = defaultExchangeMarketDataService.getMarketContext;

afterEach(() => {
  defaultExchangeMarketDataService.getMarketContext = original;
});

describe("getMarketContext parity after source-family reroute", () => {
  it("keeps the same public output shape while routing through the venue family service", async () => {
    defaultExchangeMarketDataService.getMarketContext = async (input) => ({
      contexts: [
        { venue: input.venue, marketType: input.marketType, symbol: "BTCUSDT", status: "ok", warnings: [], fetchedAt },
      ],
      status: "ok",
      warnings: [],
      fetchedAt,
    });

    const output = await getMarketContext({ venue: "binance", symbols: ["BTCUSDT"], include: ["ticker", "funding"] });

    assert.deepEqual(Object.keys(output).sort(), ["contexts", "fetchedAt", "status", "warnings"]);
    assert.equal(output.status, "ok");
    assert.equal(output.fetchedAt, fetchedAt);
    assert.equal(output.contexts[0]?.venue, "binance");
    assert.equal(output.contexts[0]?.symbol, "BTCUSDT");
    assert.deepEqual(output.warnings, []);
  });

  it("propagates degraded status/warnings unchanged", async () => {
    defaultExchangeMarketDataService.getMarketContext = async () => ({
      contexts: [],
      status: "timeout",
      warnings: ["timeout", "provider_timeout:binance"],
      fetchedAt,
    });

    const output = await getMarketContext({ venue: "binance", symbols: ["BTCUSDT"] });

    assert.equal(output.status, "timeout");
    assert.deepEqual(output.warnings, ["timeout", "provider_timeout:binance"]);
    assert.deepEqual(output.contexts, []);
  });
});
