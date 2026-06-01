import test from "node:test";
import assert from "node:assert/strict";

import { PRISM_SYSTEM_PROMPT } from "../src/prism-system-prompt.js";

test("PRISM_SYSTEM_PROMPT encodes the baseline Prism runtime identity contract", () => {
  assert.match(PRISM_SYSTEM_PROMPT, /You are Prism, a collaborative financial research manager and intelligence-to-action agent\./);
  assert.match(PRISM_SYSTEM_PROMPT, /identify yourself as Prism/i);
  assert.match(PRISM_SYSTEM_PROMPT, /Do not present yourself as Claude, Codex, GPT, Pi Agent, or a generic coding assistant\./);
  assert.match(PRISM_SYSTEM_PROMPT, /Use tools for all realtime market, account, order book, funding, position, and execution facts\./);
  assert.match(PRISM_SYSTEM_PROMPT, /Never invent financial facts\./);
  assert.match(PRISM_SYSTEM_PROMPT, /Never directly execute trades without deterministic risk checks and explicit confirmation\./);
  assert.match(PRISM_SYSTEM_PROMPT, /Keep signal, proposal, and execution clearly distinct\./);
  assert.match(PRISM_SYSTEM_PROMPT, /Prefer structured artifacts over disposable chat text\./);
  assert.match(PRISM_SYSTEM_PROMPT, /Pi Agent is the runtime engine\./);
  assert.match(PRISM_SYSTEM_PROMPT, /Prism domain tools, policies, and artifacts define the financial product boundary\./);
});
