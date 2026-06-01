## Blueprint slice: authoring and validation

Completed in this slice now:

- [x] Write proposal for the vertical-pluggable research blueprint.
- [x] Write design for taxonomy, path, artifact, plane, and safety-boundary contracts.
- [x] Write critic review for the blueprint slice.
- [x] Write test matrix for blueprint acceptance and later implementation verification targets.
- [x] Run `openspec validate "define-vertical-pluggable-research-copilot"` from `/Users/griffith/Projects/Prism`.

Acceptance for this slice now:

- [x] Blueprint documents preserve the approved taxonomy and platform language.
- [x] Blueprint documents explicitly exclude private APIs, account/wallet state, orders/execution, and implementation work from this task.
- [x] Blueprint documents identify affected Prism planes and the research-only safety boundary.
- [x] Validation passes for the OpenSpec change bundle.

## Runtime identity baseline slice (approved immediate implementation)

- [ ] Inject `PRISM_SYSTEM_PROMPT` at the canonical Pi bootstrap boundary in `packages/agent-kernel/src/create-prism-agent-session.ts`.
- [ ] Use the SDK-supported `DefaultResourceLoader({ systemPromptOverride })` path rather than wrapper-local prompt hacks.
- [ ] Add an agent-kernel bootstrap wiring test proving fresh session creation receives the Prism identity prompt and still preserves existing auth/model/tool wiring.
- [ ] Add a prompt-contract test for Prism identity / tool-backed realtime facts / no-direct-execution / artifact-first framing.
- [ ] Run typecheck + agent-kernel tests.
- [ ] Run fresh-session smoke/browser verification for: identity, no-invented live facts, no direct execution.
- [ ] Keep renderer/UI/thread/attachment/HITL work out of this slice.

## Future implementation slices later

Not completed in this blueprint slice; tracked for later implementation work:

- [ ] Add platform domain contracts.
- [ ] Add platform routing/path operations.
- [ ] Platformize funding-basis as the first vertical declaration.
- [ ] Add compare/refresh operations and tests.
- [ ] Add monitor/signal operations and tests.
- [ ] Add proposal/risk operations and tests.
- [ ] Add platform runtime guidance and tool registration updates.
- [ ] Add platform smokes.
- [ ] Add renderer-backed opportunity/report/prep results.
- [ ] Add signal / proposal / execution-prep UI semantics.
- [ ] Add workspace-transition primitives (artifact refs, lineage, freshness, turn→artifact linkage).

## Future implementation verification later

These checks belong to later implementation slices, not to this blueprint-only task:

- [ ] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/domain`.
- [ ] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/operations`.
- [ ] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/agent-kernel`.
- [ ] Run `npm --prefix "/Users/griffith/Projects/Prism" run test -w @agentkernel/storage`.
- [ ] Run `npm --prefix "/Users/griffith/Projects/Prism" run typecheck`.
- [ ] Run `npm --prefix "/Users/griffith/Projects/Prism" run smoke:platform-research-loop`.
- [ ] Run `npm --prefix "/Users/griffith/Projects/Prism" run smoke:monitor-signal`.
