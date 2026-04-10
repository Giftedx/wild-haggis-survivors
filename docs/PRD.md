# Wild Haggis Survivors — PRD / Roadmap

**Scope:** Improve stability, maintainability, and shipping velocity without changing core gameplay feel.

## Current Snapshot (as discovered)
- **Stack:** Phaser 3 + Vite + TypeScript + Vitest
- **Game loop:** Boot → Menu (variants) → Game (survivors loop) → Shop (meta upgrades)
- **Persistence:** localStorage save with schema migration (`SAVE_SCHEMA_VERSION = 2`)
- **Existing design docs:** Procedural music engine spec/plan under `docs/superpowers/`

## Priority Queue

### P0 — Repo Hygiene / Build Integrity (must fix first)
- [ ] Stop tracking build output (`dist/`) and local installs (`node_modules/`) in git; add `.gitignore`; remove from index.
- [ ] Ensure `npm ci`, `npm run build`, `npm test` are reproducible.
- [ ] Decide/implement deployment strategy (CI deploy vs committed build artifacts).

### P0a — Tooling Blocker (Context7 MCP)
- [ ] Fix/enable passing arguments into Context7 MCP tools (`resolve-library-id`, `query-docs`) so dependency docs can be fetched as required by the workflow.

### P1 — Lifecycle & Timing Stability
- [ ] Audit and standardize timers (Phaser timers vs `setTimeout`) so pause/slow-mo/restart behavior is consistent and safe.
- [ ] Reduce cross-system reach-through (`as any` scene service calls) by introducing typed service interfaces.
- [ ] Add shutdown/cleanup guarantees for timers/listeners that can outlive a run.

### P2 — Performance Hardening
- [ ] Pool or cap hot-path transient effects (damage text, rings, pickups) to prevent GC spikes at high kill rates.
- [ ] Add a debug overlay toggle (FPS, active enemies/projectiles, pool sizes, tween count) for profiling.

### P3 — Type Safety / Data Consistency
- [ ] Replace stringly-typed keys (weapons/passives/upgrades/stats) with TypeScript unions derived from data sources.
- [ ] Add compile-time checks to prevent content drift (descriptions vs effects).

### P4 — Tests & Tooling
- [ ] Expand `save` tests: migration edge cases, corrupted payloads, unlock evaluation.
- [ ] Add basic lint/format + CI gating (optional but recommended).

## Acceptance Criteria (for the stabilization pass)
- `git status` clean after install/build/test (no `dist/` or `node_modules/` noise).
- `npm run build` succeeds consistently.
- `npm test` passes consistently.
- No regressions in: pause, level-up modal, victory/death screen, scene restart (“play again”).

