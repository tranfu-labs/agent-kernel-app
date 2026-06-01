## Main risks

1. The control plane could drift back into funding-only naming.
2. Refresh could overwrite historical artifact truth.
3. Proposal/risk could accidentally pull execution fields into research schemas.
4. Monitor/signal could become hidden runtime state instead of materialized objects.
5. Prediction-market extensibility could remain aspirational if plugin boundaries are not explicit.

## Required rebuttals

- Every new domain type must map to an explicit artifact family or state object.
- Operations must stay provider-agnostic.
- Tool schemas must remain read-only.
- Tests must prove signal/proposal/execution separation.
