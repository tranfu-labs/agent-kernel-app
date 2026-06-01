---
name: prism-replatform
description: Use when working on the Prism replatform from Prism_old to a Pi Agent Kernel architecture. Enforces the Pi-as-engine, Prism-as-product boundary.
---

# Prism Replatform

## Required context

Before non-trivial changes, read:

- `prism-docs/PRISM_CORE_STRATEGY_AND_ARCHITECTURE.md`
- `prism-docs/INFORMATION_ENERGY_MATERIAL_ARCHITECTURE.md`
- `prism-docs/MIGRATION_FROM_PRISM_OLD.md`
- `prism-docs/MVP_AGENT_KERNEL_PLAN.md`

## Rules

1. Do not patch Prism_old as the new product runtime.
2. Keep Pi runtime concerns in `packages/agent-kernel` or `packages/pi-package`.
3. Keep financial domain objects in `packages/domain`.
4. Keep deterministic risk logic in `packages/policies`.
5. Keep tool implementations in `packages/tools`.
6. Do not expose coding tools to product users.
7. Do not implement real trading execution before proposal, risk check, confirmation, and audit foundations exist.
