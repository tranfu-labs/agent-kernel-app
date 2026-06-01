import test from "node:test";
import assert from "node:assert/strict";
import type { Artifact, FundingContext, MarketContext, Venue } from "@agentkernel/domain";
import { scanFundingBasisArbitrage } from "../src/funding-basis-arbitrage.js";
import type { FundingBasisOpportunityArtifactContent } from "../src/funding-basis-core.js";

const fetchedAt = "2026-05-30T00:00:00.000Z";

function funding(venue: Venue, rate: number): FundingContext {
  return {
    current: {
      venue,
      marketType: "linear_perp",
      symbol: "ETHUSDT",
      venueSymbol: "ETHUSDT",
      fundingRate: rate,
      observedAt: fetchedAt,
      provider: `${venue}-fixture`,
      source: "fixture",
      status: "ok",
      warnings: [],
    },
    history: [],
    status: "ok",
    warnings: [],
  };
}

function context(venue: Venue, fundingRate: number): MarketContext {
  return {
    venue,
    marketType: "linear_perp",
    symbol: "ETHUSDT",
    funding: funding(venue, fundingRate),
    status: "ok",
    warnings: [],
    fetchedAt,
  };
}

test("scanFundingBasisArbitrage uses injected dependencies and returns artifact IDs", async () => {
  const saved: Artifact[] = [];
  const requested: string[] = [];

  const result = await scanFundingBasisArbitrage({
    input: {
      venues: ["binance", "bitget"],
      symbols: ["ETHUSDT"],
      marketType: "linear_perp",
      estimatedFeeBps: 4,
      saveArtifacts: true,
    },
    contextProvider: {
      getMarketContext: async ({ venue, symbol }) => {
        requested.push(`${venue}:${symbol}`);
        return venue === "binance" ? context("binance", 0.0012) : context("bitget", -0.0002);
      },
    },
    artifactStore: {
      save: (artifact) => {
        saved.push(artifact);
        return artifact;
      },
    },
    now: () => fetchedAt,
  });

  assert.deepEqual(requested, ["binance:ETHUSDT", "bitget:ETHUSDT"]);
  assert.equal(result.vertical, "funding_basis");
  assert.equal(result.platformIntent, "discover");
  assert.equal(result.capability, "funding_basis.discover");
  assert.equal(result.path, "path_discover");
  assert.equal(result.status, "ok");
  assert.equal(result.opportunities.length, 1);
  assert.equal(result.artifactIds.length, 1);
  assert.equal(saved[0]?.id, result.artifactIds[0]);
  assert.deepEqual(saved[0]?.marketContextIds, ["market_context_binance_ETHUSDT", "market_context_bitget_ETHUSDT"]);
  const content = saved[0]?.contentJson as FundingBasisOpportunityArtifactContent | undefined;
  assert.equal(content?.artifactEnvelope.assumptions.estimatedFeeBps, 4);
  assert.equal(content?.artifactEnvelope.assumptions.mode, "balanced");
  assert.deepEqual(content?.artifactEnvelope.marketContextIds, ["market_context_binance_ETHUSDT", "market_context_bitget_ETHUSDT"]);
  assert.deepEqual(content?.artifactEnvelope.providerFactRefs, [
    "funding:binance-fixture:fixture:binance:ETHUSDT",
    "funding:bitget-fixture:fixture:bitget:ETHUSDT",
  ]);
});

test("scanFundingBasisArbitrage returns opportunity cards with disclosed assumptions", async () => {
  const result = await scanFundingBasisArbitrage({
    input: {
      venues: ["binance", "bitget"],
      symbols: ["ETHUSDT"],
      marketType: "linear_perp",
      estimatedFeeBps: 4,
      targetNotionalUsd: 1000,
      mode: "balanced",
      saveArtifacts: false,
    },
    contextProvider: {
      getMarketContext: async ({ venue }) => venue === "binance" ? context("binance", 0.0012) : context("bitget", -0.0002),
    },
    now: () => fetchedAt,
  });

  assert.equal(result.vertical, "funding_basis");
  assert.equal(result.platformIntent, "discover");
  assert.equal(result.capability, "funding_basis.discover");
  assert.equal(result.path, "path_discover");
  assert.equal(result.opportunities.length, 1);
  assert.equal(result.opportunityCards.length, 1);
  assert.equal(result.opportunityCards[0]?.symbol, "ETHUSDT");
  assert.equal(result.opportunityCards[0]?.assumptions.targetNotionalUsd, 1000);
  assert.equal(result.opportunityCards[0]?.assumptions.estimatedFeeBps, 4);
  assert.equal(result.opportunityCards[0]?.assumptions.mode, "balanced");
  assert.equal(result.opportunityCards[0]?.artifactId, undefined);
});

test("scanFundingBasisArbitrage preserves degraded status when no opportunities are produced", async () => {
  const result = await scanFundingBasisArbitrage({
    input: {
      venues: ["binance", "bitget"],
      symbols: ["BTCUSDT", "ETHUSDT"],
      marketType: "linear_perp",
      estimatedFeeBps: 4,
      saveArtifacts: false,
    },
    contextProvider: {
      getMarketContext: async ({ venue, symbol }) => ({
        venue,
        marketType: "linear_perp",
        symbol,
        funding: {
          current: venue === "binance"
            ? {
                venue,
                marketType: "linear_perp",
                symbol,
                venueSymbol: symbol,
                fundingRate: 0.0012,
                observedAt: fetchedAt,
                provider: `${venue}-fixture`,
                source: "fixture",
                status: "ok",
                warnings: [],
              }
            : undefined,
          history: [],
          status: venue === "binance" ? "ok" : "rate_limited",
          warnings: venue === "binance" ? [] : [`missing_current_funding_rate:${symbol}`, "rate_limited"],
        },
        status: venue === "binance" ? "ok" : "rate_limited",
        warnings: venue === "binance" ? [] : [`missing_current_funding_rate:${symbol}`, "rate_limited"],
        fetchedAt,
      }),
    },
    now: () => fetchedAt,
  });

  assert.equal(result.status, "partial");
  assert.equal(result.opportunities.length, 0);
  assert.match(result.summary, /No funding-basis candidates/);
  assert.ok(result.warnings.includes("missing_current_funding_rate:BTCUSDT"));
  assert.ok(result.warnings.includes("missing_current_funding_rate:ETHUSDT"));
  assert.ok(result.warnings.includes("missing_funding_diff:BTCUSDT"));
  assert.ok(result.warnings.includes("missing_funding_diff:ETHUSDT"));
});

test("scanFundingBasisArbitrage treats missing symbols as a caller error instead of applying demo defaults", async () => {
  const requested: string[] = [];

  const result = await scanFundingBasisArbitrage({
    input: {
      venues: ["binance", "bitget"],
      symbols: [],
      marketType: "linear_perp",
      estimatedFeeBps: 4,
      saveArtifacts: false,
    },
    contextProvider: {
      getMarketContext: async ({ venue, symbol }) => {
        requested.push(`${venue}:${symbol}`);
        return context(venue, 0.0012);
      },
    },
    now: () => fetchedAt,
  });

  assert.deepEqual(requested, []);
  assert.equal(result.status, "failed");
  assert.equal(result.opportunities.length, 0);
  assert.ok(result.warnings.includes("missing_symbols"));
});
