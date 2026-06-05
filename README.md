# AgentKernel

A reusable foundation for building **agent-native products**: a Pi Agent runtime kernel, an
AG-UI / CopilotKit web workspace, and a vertical-plugin model so one kernel can power many
domains.

> Status: early. This repository was extracted from an internal financial-research product
> (Prism) and is being generalized into a domain-agnostic kernel. The **funding-basis** vertical
> currently ships as the working **reference vertical** — proof that the kernel runs a real
> domain end-to-end while the core types are progressively genericized.

## What's in here

| Layer | Packages | Role |
|---|---|---|
| **Agent runtime** | `agent-kernel`, `pi-agent` | Pi Agent session wrapper, control-plane (intent → capability → path → tool-access → policy), provider config |
| **Agent ↔ UI seam** | `agui-bridge` | Pi event stream → AG-UI protocol translator (sink-agnostic, zero domain coupling) |
| **Web workspace** | `apps/web` | Next.js + CopilotKit chat/workspace shell over the kernel |
| **API bridge** | `apps/agent-api` | Streaming/API entrypoint + smoke tests |
| **Domain primitives** | `domain`, `storage` | Artifact, evidence, fact-envelope contracts + artifact persistence |
| **Policy** | `policies` | Read-only / permission / confirmation policy framework |
| **Reference vertical** | `operations`, `tools`, `skills` | Funding-basis research over public exchange data (Binance/Bitget). Replaceable. |

## Architecture

```text
Pi Agent runtime  ──>  agent-kernel control plane  ──>  vertical plugins (tools + skills + contracts)
                                  │
                          agui-bridge (Pi ↔ AG-UI)
                                  │
                          apps/web (CopilotKit workspace)
```

- The **kernel is meant to be vertical-agnostic**: a vertical contributes its tools, skills, and
  contracts; the kernel owns session, routing, and the UI seam.
- **No execution**: this is a read-only research foundation. There is no order placement,
  wallet, or trade-execution capability, and adding one must go through an explicit governance design.
- Real-time facts come from tools, never from model prose.

## Quickstart

```bash
npm ci
npm run build        # tsc -b across the workspace
npm run typecheck
npm run web:build    # Next.js workspace UI
npm run smoke:pi     # verify a Pi Agent session can be created and respond
```

For live smokes that hit public endpoints, create a gitignored `.env.smoke` (see the
placeholders inside it) — never commit real keys.

## Deployment

Company handoff and deployment preparation live in:

- [`docs/deployment/agent-kernel-app-company-handoff.md`](docs/deployment/agent-kernel-app-company-handoff.md)

The deployable product name is:

```text
agent-kernel-app
```

For local secret setup, copy the tracked template and fill only local or CI-managed values:

```bash
cp .env.example .env.smoke
```

Never commit real API keys. `.env.smoke` is gitignored.

## Adding a vertical

A vertical plugs into the kernel by contributing:

1. **Tools** — deterministic, provider-backed read functions (`packages/tools` is the reference).
2. **Skills** — playbooks the agent loads (`packages/skills`).
3. **Contracts** — domain objects that extend the generic `Artifact` primitive (`packages/domain`).
4. **Registration** — wire the vertical's tools/skills into a kernel session.

The funding-basis vertical is the worked example. Full injection-based vertical registration
(so the kernel core carries zero domain vocabulary) is in progress — see the roadmap below.

## Roadmap

- [ ] Genericize core types so the kernel ships no domain-specific vocabulary
      (open vertical/source identifiers, domain enums moved into verticals).
- [ ] Injection-based vertical registration (kernel no longer imports vertical packages).
- [ ] A second, non-financial example vertical to prove generality.

## License

MIT © 2026 tranfu-labs — see [LICENSE](./LICENSE).
