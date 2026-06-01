## ADDED Requirements

### Requirement: Prediction-market sample vertical remains research-only

Prism SHALL model the World Cup + Polymarket sample vertical as a read-only research vertical that exercises source inspection, discovery, comparison, reporting, and read-only proposal preparation without implementing participation or execution flows.

#### Scenario: Prediction-market sample declaration stays inside research boundaries
- **WHEN** Prism resolves the prediction-market sample vertical
- **THEN** it exposes inspect_source, discover, compare, report, and read-only propose platform capabilities
- **AND** it does not expose wallet, private-key, bet placement, or automatic participation capabilities
