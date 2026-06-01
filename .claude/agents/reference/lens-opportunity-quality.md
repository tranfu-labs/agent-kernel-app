# Lens: Opportunity Quality

Use this lens when work creates, scores, ranks, reports, artifacts, or proposals for opportunities.

## Goal

An opportunity must be financially explainable, evidence-backed, and ready to flow toward artifacts and future proposal/risk governance without pretending that incomplete facts are complete.

## Checks

### Financial meaning

- Opportunity has a clear thesis.
- Legs are explicit when the strategy has legs.
- Long/short or buy/sell direction is explainable from provider-backed facts.
- Edge, fee, slippage, freshness, liquidity, and risk assumptions are separated.
- Score explanation names the drivers and uncertainty.

### Evidence and lineage

- Opportunity links to comparisons/signals/evidence/market contexts when available.
- Warnings from provider or operation are preserved.
- Artifact content can explain why the opportunity exists.
- Missing facts reduce confidence or block opportunity creation, rather than being filled by the model.

### Product usefulness

- Output is suitable for an opportunity card or report.
- User can tell what to inspect next.
- Opportunity can later feed Proposal -> Risk without already executing.
- No direct trading recommendation is disguised as a read-only finding.

## Funding-basis-specific checks

- Funding-rate difference comes from current provider-backed funding facts.
- Long venue and short venue direction follow the lower/higher funding logic used by the approved operation.
- Estimated net edge separates funding difference, fees, slippage, and freshness/liquidity limitations.
- Missing funding on either venue blocks opportunity creation.
- Missing depth does not fabricate slippage; it should warn or reduce confidence.

## Failure patterns

- Opportunity exists with no current funding/price/source facts.
- Score is high despite stale or missing evidence.
- Artifact/report lacks comparison or signal lineage.
- Opportunity text claims certainty beyond provider facts.
- LLM fills missing rates, prices, or market context.
- Read-only output tells the agent to execute directly.

## Evidence to request

- Operation tests for opportunity creation and missing-fact behavior.
- Score/explanation test cases.
- Artifact lineage tests.
- Tool/API output examples.
- Warnings/status propagation.
