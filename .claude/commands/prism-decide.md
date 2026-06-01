---
description: Research a technical/selection/architecture question with multi-agent rigor, then return a decision (not a menu)
argument-hint: <the technical question, e.g. "which charting lib for the workspace UI" or "websocket vs polling for the read plane">
---

You have been asked to decide a technical question for Prism: **$ARGUMENTS**

Run the research-and-decide flow. Do not jump from the question to the first plausible answer.

1. **Classify the level** (0–4 per `prism-docs/SPEC_GUIDED_HARNESS_DEVELOPMENT.md`). If it's truly
   Level 0–1 and you already know the answer with confidence, just answer inline and stop.

2. **Dispatch `prism-researcher`** (Agent tool, subagent_type `prism-researcher`) with the question
   and any context you already have. It researches external options against Prism's actual
   architecture and current milestone, then returns a decision with rationale.

3. **Pressure-test if architecture-sensitive.** If the decision touches domain contracts, provider/tool
   boundaries, the read plane, analytics architecture, artifact lifecycle, scoring/risk, or execution
   governance (Level 3+), dispatch `prism-critic` to challenge the researcher's decision before you
   accept it. Resolve critic findings (inline rebuttal, or `prism-rebuttal` if heavy).

4. **Decide and report.** Within the **technical/reversible** boundary, give the user the decision plus
   the rationale — do not push the choice back to them. Escalate to the user **only** product-defining,
   preference-driven, or irreversible/outward-facing forks (changes to Prism's identity/north star/milestone,
   taste calls with no objective best, or delete-data / spend-money / execute-trade / publish / permission /
   product-defining-contract changes). This is the precise form of AGENTS.md non-drift rule #8.

5. **Hand off if it leads to build work.** If the decision implies an architecture-sensitive change,
   say so and offer to continue via `prism-planner` (and OpenSpec for Level 3+) rather than implementing ad hoc.
