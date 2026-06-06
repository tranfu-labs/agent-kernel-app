import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createCoverage,
  createSourceCapabilityDescriptor,
  createSourceDescriptor,
  type FactEnvelope,
} from "../src/source-family.ts";

describe("source-family contracts", () => {
  it("creates a source descriptor scoped to public read capabilities", () => {
    const descriptor = createSourceDescriptor({
      sourceId: "docs:product",
      sourceFamily: "document",
      providerName: "product-docs",
      transport: "rest",
      authRequirement: "public",
      trustLevel: "official",
      freshnessClass: "static",
      supportedCapabilities: ["document.read", "document.search"],
    });
    assert.equal(descriptor.sourceId, "docs:product");
    assert.equal(descriptor.sourceFamily, "document");
    assert.equal(descriptor.transport, "rest");
    assert.equal(descriptor.authRequirement, "public");
    assert.equal(descriptor.trustLevel, "official");
    assert.deepEqual(descriptor.supportedCapabilities, ["document.read", "document.search"]);
    assert.ok(descriptor.degradationModes.includes("timeout"));
  });

  it("creates a semantic capability descriptor, not an endpoint shape", () => {
    const capability = createSourceCapabilityDescriptor({
      capabilityKey: "document.search",
      sourceFamily: "document",
      authRequirement: "public",
      freshnessClass: "static",
      mode: "batch",
      supportedSources: ["docs:product", "docs:faq"],
    });
    assert.equal(capability.capabilityKey, "document.search");
    assert.equal(capability.sourceFamily, "document");
    assert.equal(capability.mode, "batch");
    assert.deepEqual(capability.supportedSources, ["docs:product", "docs:faq"]);
  });

  it("computes coverage gaps from requested vs returned", () => {
    const coverage = createCoverage(["intro", "billing", "security"], ["intro", "security"]);
    assert.deepEqual(coverage.missing, ["billing"]);
  });

  it("fact envelope keeps a shared shape while payload stays family-specific", () => {
    const envelope: FactEnvelope<number[]> = {
      sourceId: "docs:product",
      provider: "product-docs",
      sourceFamily: "document",
      capabilityKey: "document.search",
      status: "ok",
      warnings: [],
      observedAt: "2026-01-01T00:00:00.000Z",
      fetchedAt: "2026-01-01T00:00:00.000Z",
      freshnessClass: "static",
      authRequirement: "public",
      coverage: createCoverage(["intro"], ["intro"]),
      payload: [1, 2, 3],
    };
    assert.equal(envelope.sourceFamily, "document");
    assert.deepEqual(envelope.payload, [1, 2, 3]);
  });
});
