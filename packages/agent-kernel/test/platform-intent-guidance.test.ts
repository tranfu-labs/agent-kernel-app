import test from "node:test";
import assert from "node:assert/strict";
import { resolvePlatformResearchGuidanceRequest } from "../src/funding-basis.js";

test("World Cup + Polymarket requests route to prediction-market inspect/discover guidance without pretending support is implemented", () => {
  const result = resolvePlatformResearchGuidanceRequest("Help me research whether the World Cup final market on Polymarket is worth watching");

  assert.equal(result.vertical, "prediction_market");
  assert.equal(result.intent === "inspect_source" || result.intent === "discover", true);
  assert.equal(result.readOnly, true);
  assert.equal(result.extensionRequired, true);
});

test("funding-basis requests route to the canonical funding vertical path", () => {
  const result = resolvePlatformResearchGuidanceRequest("Find Binance/Bitget funding opportunities and report them");

  assert.equal(result.vertical, "funding_basis");
  assert.equal(result.readOnly, true);
  assert.match(result.capability, /funding_basis\./);
});
