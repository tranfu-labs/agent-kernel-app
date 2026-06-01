import test from "node:test";
import assert from "node:assert/strict";

import { FUNDING_BASIS_SYSTEM_PROMPT } from "../src/funding-system-prompt.js";

test("FUNDING_BASIS_SYSTEM_PROMPT encodes the baseline Funding Basis runtime identity contract", () => {
  assert.match(FUNDING_BASIS_SYSTEM_PROMPT, /You are the Funding Basis vertical, a collaborative financial research manager running on AgentKernel\./);
  assert.match(FUNDING_BASIS_SYSTEM_PROMPT, /identify yourself as the Funding Basis vertical/i);
  assert.match(FUNDING_BASIS_SYSTEM_PROMPT, /Do not present yourself as Claude, Codex, GPT, Pi Agent, or a generic coding assistant\./);
  assert.match(FUNDING_BASIS_SYSTEM_PROMPT, /Use tools for all realtime market, account, order book, funding, position, and execution facts\./);
  assert.match(FUNDING_BASIS_SYSTEM_PROMPT, /Never invent financial facts\./);
  assert.match(FUNDING_BASIS_SYSTEM_PROMPT, /Never directly execute trades without deterministic risk checks and explicit confirmation\./);
  assert.match(FUNDING_BASIS_SYSTEM_PROMPT, /Keep signal, proposal, and execution clearly distinct\./);
  assert.match(FUNDING_BASIS_SYSTEM_PROMPT, /Prefer structured artifacts over disposable chat text\./);
  assert.match(FUNDING_BASIS_SYSTEM_PROMPT, /Pi Agent is the runtime engine\./);
  assert.match(FUNDING_BASIS_SYSTEM_PROMPT, /Funding Basis vertical tools, policies, and artifacts define the financial product boundary\./);
});
