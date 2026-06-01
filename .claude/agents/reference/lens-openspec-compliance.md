# Lens: OpenSpec Compliance

## Trigger conditions

Use this lens for any Level 3/4 Prism work, including changes to domain contracts, Pi Agent tool contracts, provider boundaries, market-data read plane behavior, analytics architecture, operation workflows, artifact lifecycle, scoring, risk, policy, or execution governance.

## Purpose

Verify that substantial work has an OpenSpec source of truth before implementation and that implementation stays inside the approved scope.

## Checks

1. **OpenSpec required?** If the work is architecture-sensitive, an OpenSpec change MUST exist before implementation.
2. **Required files:** The change SHOULD include `proposal.md`, `design.md`, and `tasks.md`.
3. **Critic/test matrix:** Level 3/4 changes SHOULD include `critic.md` and `test-matrix.md`, or equivalent sections in `design.md` / `tasks.md`.
4. **Scope clarity:** Proposal MUST state in-scope and out-of-scope work.
5. **Acceptance criteria:** Acceptance criteria MUST be testable, not vague.
6. **Affected planes:** Design MUST identify affected `Information`, `Energy`, and/or `Material` planes.
7. **Safety boundary:** Design MUST explicitly state whether private APIs, account data, order data, or execution are out of scope.
8. **Task alignment:** Implementation plan tasks MUST map back to proposal/design acceptance criteria.

## Evidence to collect

Read:

```text
openspec/changes/<change>/proposal.md
openspec/changes/<change>/design.md
openspec/changes/<change>/tasks.md
openspec/changes/<change>/critic.md
openspec/changes/<change>/test-matrix.md
```

If the exact change name is unknown, inspect `openspec/changes/` and ask for clarification if multiple active changes could apply.

## Pass criteria

- Required OpenSpec exists when needed.
- Scope and non-goals are explicit.
- Design identifies affected planes and boundaries.
- Tasks and tests are implementation-ready.
- No implementation work exceeds approved scope.

## Fail / partial criteria

- **FAIL:** Architecture-sensitive work proceeds with no OpenSpec.
- **FAIL:** OpenSpec permits private/execution capability without governance design.
- **PARTIAL:** OpenSpec exists but lacks critic/test matrix for Level 3/4 work.
- **PARTIAL:** Acceptance criteria are vague or not testable.

## Bad examples

<bad-example>
"This is just adding a provider, so no OpenSpec is needed."

WRONG. A new provider affects provider boundaries and market-data read plane behavior, so OpenSpec is required.
</bad-example>

<bad-example>
"Acceptance: scanner works correctly."

WRONG. This is not testable. Specify expected commands, output shape, provider failure behavior, and artifact requirements.
</bad-example>
