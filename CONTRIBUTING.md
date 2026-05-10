# CONTRIBUTING.md — How AI Agents Touch This Codebase

> **Project posture (2026-05-10).** Wild Haggis Survivors is a continuous-deployment passion project. The build at [`wild-haggis-survivors.pages.dev`](https://wild-haggis-survivors.pages.dev) is the product. There is no launch event. Every commit is a release. Read more in [`docs/PRD.md`](docs/PRD.md).

> **Audience.** This codebase is touched almost exclusively by AI agents (Claude Code + Claude Opus 4.7). The doc is written for agents; if you're a human reading this, the same rules apply but you'll find the source code easier to scan than the prose.

---

## The one question that matters before shipping

**Can a real human play this change without a contributor walking them through it?**

If yes, ship. If no, fix the legibility before shipping. Everything below is in service of that question — not parallel to it.

---

## Enforced gates (CI fails on regression)

These run on every commit via `npm run ci`. If your change breaks one, fix the root cause — never bypass with `--no-verify`, `as any`, or `// @ts-ignore`.

| Gate | Source | What it catches |
|---|---|---|
| **TypeScript compile** | `npm run build` (tsc --noEmit) | Type errors. vitest's esbuild is permissive; this is the truth. |
| **Vitest unit tests** | `npm test` | 5100+ unit tests, helper state machines, save migrations, i18n parity |
| **ESLint** | `npm run lint` | `no-console` (src/, with structured `warn`/`error`/`info`/`debug` allowed), `no-restricted-syntax` bans `it.skip`/`it.only`/`xit`/etc., unused vars |
| **i18n parity** | [`src/core/i18n.locale.test.ts`](src/core/i18n.locale.test.ts) | SCS→EN orphan check + EN→SCS scoped to `ui.banter.*` (banter is bilingual-locked) |
| **Replay determinism** | [`src/replay/replayDeterminism.test.ts`](src/replay/replayDeterminism.test.ts) | T1 contract: state-affecting RNG via `runRng`, fixed-step physics |
| **Save schema migration** | [`src/utils/save/`](src/utils/save/) `*.test.ts` | Schema bump requires `migrateV{N-1}ToV{N}` step + roundtrip |
| **Bundle budget** | [`scripts/check-bundle-budget.mjs`](scripts/check-bundle-budget.mjs) | vendor-phaser ≤390 KB gzip / index ≤320 KB / sprite-art ≤240 KB |
| **Flash budget** | [`scripts/check-flash-budget.mjs`](scripts/check-flash-budget.mjs) | All flash methods route through `motionScale` + `reduceFlashing` caps |
| **Playwright e2e** | `npm run test:e2e` (after `npm run build`) | 37+ smoke specs across desktop browsers |

`npm run ci` runs lint + vitest + build. `npm run ci:all` adds e2e. Use `ci:all` before declaring UI-touching work done.

---

## Sacred invariants

Constraints that look arbitrary but are load-bearing. Documented at the site AND here. When working in the neighbourhood of one, surface it in the change description.

| Invariant | Source | Lock |
|---|---|---|
| Replay determinism | [ADR-0002](docs/adr/0002-deterministic-replay-format.md) | All state-affecting RNG via `runRng` (never `Math.random()`); arcade fixed-step `fps:60`; lifecycle RNG-stream order locked (append-only) |
| i18n parity (banter) | [`i18n.locale.test.ts`](src/core/i18n.locale.test.ts) | EN→SCS scoped to `ui.banter.*`; orphan SCS keys also blocked |
| Save schema | [`save/schema.ts`](src/utils/save/schema.ts) | `SAVE_SCHEMA_VERSION` bump requires matching migration step; chain runs every load |
| Hazard immunity | [`isPlayerHazardImmune.ts`](src/systems/isPlayerHazardImmune.ts) | Single shared predicate; both HazardZones + HazardsSystem read it (don't inline the OR-chain) |
| `BURNS_EVOLUTION_THRESHOLD` | [`BalanceConfig.ts`](src/core/BalanceConfig.ts) | Derived from `EVOLUTION_RECIPES.length`; achievement copy interpolates `{count}` (don't hard-code numbers) |

---

## Cross-cutting chains (walk all steps, or none)

If your change touches one of these surfaces, every step in the chain lands in the same change. Partial chains rot fast.

**Save state** → schema bump in [`save/schema.ts`](src/utils/save/schema.ts) → migration step in [`migrations.ts`](src/utils/save/migrations.ts) → type in [`types.ts`](src/utils/save/types.ts) → bumper / query / history helpers as needed → roundtrip test → i18n if surfaced in UI.

**Player-facing copy** → EN key in [`src/core/i18n/`](src/core/i18n/) → SCS key in [`src/core/i18n.scs.ts`](src/core/i18n.scs.ts) → resolve via `t('namespace.key')` → CI parity gate.

**Damage to player** → use [`isPlayerHazardImmune`](src/systems/isPlayerHazardImmune.ts) (don't inline) → respect post-hit iframes → respect parry hooks where relevant.

**State-affecting randomness** → `getRunRng()` only (never `Math.random()` for state) → if in lifecycle reset, append at tail (don't reorder).

**New mechanic** → pure helper at `src/entities/<name>.ts` or `src/systems/<name>.ts` + test → Phaser-bound orchestrator at `src/scenes/game/<name>.ts` → wire from `Player.update` / `GameScene.update` (after `isGameplayPaused()` early-return) → texture-exists guards on every `scene.add.image/sprite` → i18n keys → banter pool entry if voiceful → **e2e smoke spec for input-wiring features**.

**Player-facing visual / audio** → reduce-motion respected (existing settings: `motionScale`, `reduceParticles`, `reduceFlashing`, `disableSeasonalEvents`, `disableHazards`) → no rapid full-screen flashes >3 Hz → colorblind-distinct (shape + intensity, not color alone) → captions where audio carries meaning ([`docs/A1_CAPTIONS_INDEX.md`](docs/A1_CAPTIONS_INDEX.md)) → keyboard + gamepad parity for any new mouse/touch interaction.

---

## Principles (guidance, not gates)

- **Stand the test of time.** Clear over clever. Names describe what something IS, not what it's named-after or will-become. Comments explain WHY when non-obvious; otherwise silent.
- **Ultra efficient.** No per-frame allocations in hot paths (`Player.update`, `Enemy.update`, `WeaponSystem.fire*`). Cache invalidation correct. Profile, don't guess. New systems target ≤5 KB gzip.
- **Secure.** Boundary validation at every IO surface. The save loader's `JSON.parse` + try/catch fallback is the model. No `eval`, no `innerHTML`, no `document.write`. No remote endpoints without an ADR + threat model.
- **Compose, don't fatten.** Pure helper → scene-game orchestrator → scene wires. The Drift / Whisky / Stance / Parry / Clootie / Beithir / Reliquary / Cairn ships all follow this. Match the sister pattern.
- **Minimal slop.** No defensive try/catch around things that don't throw. No comments restating well-named code. No half-finished impls. No deferrals masquerading as features.

---

## When the bar can't be cleared

Declare the trade-off explicitly in the commit body or spec. Template:

```
Trade-off: <which gate / chain / invariant can't be cleared>
Why: <one paragraph; what's structural vs what's deferred>
What we gained: <one paragraph>
Follow-up: <task ID + path, or "won't lift, structural">
```

If you can't fill all four cleanly, the trade-off isn't ready — keep working.

---

## Cross-references

- [`README.md`](README.md) — entry point + commands.
- [`AGENTS.md`](AGENTS.md) — agent working agreement (this doc supersedes the older "QUALITY_BAR" framing it cited).
- [`CLAUDE.md`](CLAUDE.md) — Phaser 4 gotchas + architecture quick-map + `### Key Mechanics` index.
- [`docs/DESIGN_SOUL.md`](docs/DESIGN_SOUL.md) — player-facing tone filter (Soul Check); parallel to this doc, not subordinate.
- [`docs/REVIEW.md`](docs/REVIEW.md) — adversarial audit, 2026-05-10. Open issues from C1-C7 + S1-S8 are the queue.
- [`docs/PRD.md`](docs/PRD.md) — what's shipped + what's open.
- [`docs/INDEX.md`](docs/INDEX.md) — top-level docs map.

---

## Changes to this doc

Trivial wording: edit. Filter / chain / invariant additions: spec under [`docs/superpowers/specs/`](docs/superpowers/specs/) or ADR for architectural shifts. Filter relaxations: ADR.
