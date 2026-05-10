# Top 10 Biggest Unshipped Tasks — Wild Haggis Survivors

**Generated:** 2026-04-26
**Method:** Read every doc under `docs/` (HUGE_INITIATIVES master plan + verdict, DESIGN_IDEAS, PRD, specs/, plans/, research/, ADRs, today's three-model audit reports, BANTER_GAPS, ART_AUDIT, PHASE_0_GATE_NOTES, prompts/), cross-checked against project memory and current branch state.
**Filter:** Only **unshipped** or **partially-shipped** initiatives. Items marked SHIPPED in memory (R1 Relics, V2 Variants, C1 Almanac, E1 Seasonal, H1 Croft, F1 Haar, A1 M5/M6, M1 Moor Nodes, U1 Runes data, T1 Replay, W18 Scots, W71 Phase 0+2, Phaser 4 migration) excluded from scope but referenced where they affect remaining work.

---

## Ranking

| # | Task | Tier | Est | Ship Gate |
|---|------|------|-----|-----------|
| 1 | [A1 Accessibility Foundation completion (M1–M4)](01-a1-accessibility-foundation.md) | S | 5–6 weeks | PEAT + cultural + disability consultant |
| 2 | [W71 Skeletal Animation Rig (Phase 1+)](02-w71-skeletal-animation-rig.md) | S | 8–12 weeks | Phase 0 gate A/B + perf budget |
| 3 | [P3 Cloud Saves & Cross-Device](03-p3-cloud-saves.md) | S | 6–10 weeks | Backend selection + auth |
| 4 | [W95 Mobile Platform Rework](04-w95-mobile-rework.md) | S | 4–6 weeks | Real-device QA matrix |
| 5 | [Scene Refactor + Biomes + Endless Mode](05-scene-refactor-biomes-endless.md) **— A+B+C functionally shipped 2026-04-29 → 2026-05-09 under different module names; see Notes** | S | 4–6 weeks | Phase A+B before C |
| 6 | [B1 Banter Density Phase 4+5 (~390 leaves)](06-b1-banter-density-phase4-5.md) | A | 2–3 weeks | Cailleach Gaelic review |
| 7 | [W27 Capture Pipeline Phase 2 (clip + highlight)](07-w27-capture-pipeline-phase2.md) | A | 2–3 weeks | Bundle ≤+200 KB |
| 8 | [C2 Weapon Lore Pass completion](08-c2-weapon-lore-completion.md) | A | 1–2 weeks | Native + Burns audit |
| 9 | [U1 Runes M4 — wire offers + consumers](09-u1-runes-m4-wire-consumers.md) **— SHIPPED 2026-04-26 (`a86afe5`); see [blocked/09-shipped.md](blocked/09-shipped.md)** | A | 1–2 weeks | Triple-audit T111 reversal |
| 10 | [T401 GameScene Decomposition](10-t401-gamescene-decomposition.md) | A | 2–3 weeks | Zero behaviour change |

---

## Notes Worth Carrying Forward

### Memory hygiene (caught during this scan)
- **Memory claim "zero TODO/FIXME" is partly refuted.** Grep found 6 concrete deferred features still in code:
  - `src/data/variants.ts:358` — Cailleach +8% crit modifier deferred (`VariantModifier` lacks crit field).
  - `src/data/variants.ts:386` — Cailleach accent art deferred (`accentStyle: 'none'` shipped).
  - `src/art/sprites/enemies/deanApparition.ts:151` — wraith event-bus gate deferred (pending narrative event).
  - `src/art/sprites/enemies/ledgerWraith.ts:166` and `src/data/enemies.ts:495` — priest ranged beam-weapon deferred (themed `ranged` placeholder).
  - `src/data/banter.ts:1199,1278` — banter trigger wiring deferred per Task 6 pattern.
- **Plus dozens of "deferred"/"stub"/"not yet" semantic comments** that aren't actionable but pollute searches. Audit candidate.

### Two specs written but ship status unverified by memory
- `docs/superpowers/specs/2026-04-09-procedural-music-engine-design.md` — Conductor + layer system shipped per memory, but full Tier-1 procedural-generation scope (mood-driven layer selection, biome-scoped timbres, dynamic BPM ramp, replay-deterministic seeding) may be partial. Audit needed before declaring done.
- `docs/superpowers/specs/2026-04-13-scene-refactor-biomes-endless-design.md` — Three-phase cascade (refactor + biomes + endless). Endless mode (Post-Bell escalation already exists per `src/core/PostBellEscalation.ts`, but elite variants + overcharge evolution + Phase B Biome system unverified.

### Open human gates (not in any of the 10 prompts but block ship)
- **Mobile real-device pass (T203)** — iPhone + Android playtests on real hardware, ≥30 min sessions.
- **Cultural reviews (T211)** — Doric (Aberdeen/Aberdeenshire native), Shetlandic (Lerwick native), Burns Canongate Burns Suppers audit. V2 variants + C2 Burns lore + B1 Cailleach Gaelic gated on these.
- **PEAT photosensitivity audit (A1 M1)** — Photosensitive Epilepsy Analysis Tool run on kill bursts, crit confirms, boss spectacle, combo milestones, Haar shader.
- **Disability consultant review** — ACCESSIBILITY_RESEARCH §8.3 Tier 1 sign-off on photosensitivity splash copy + Assist Mode UX.
- **Blind playtest** — Triple-audit footnote; needed before public launch.

### Architectural traps to remember
- **Phaser 4 imports break in node-env vitest** (`src/main.ts` configures arcade fixed-step; Phaser eval touches `window`). Extract testable logic into pure helper modules (e.g. `actIntermissionResolve.ts`) and import the helpers in tests, never the scene class.
- **Bag-vs-cached-field divergence** — `RunModifiers` writes don't propagate to systems that snapshot the bag at run-start (`SpawnSystem.spawnIntervalMult`, `WeaponSystem.curseCooldownMul`). Any system that consumes `RunModifiers` mid-run must re-sync via setter, and `RouteDef.modifierDeltas` must be widened deliberately. Implications for U1 runes consumer wiring (#9) and any future relic effect that mutates run mods.
- **Arcade fixed-step is part of T1 replay contract** (ADR-0002 Phase 3) — `physics.arcade.fps: 60, fixedStep: true` is load-bearing. Don't revert without updating `src/replay/replayDeterminism.test.ts` and the addendum.
- **`scene.time.delayedCall` respects timeScale** — at `timeScale = 0` (hit freeze, intermission), delayed calls never fire. Use `TimeManager.scheduleRealTime(ms, cb)` for wall-clock-timed work that must execute regardless. Route `onResume` callbacks already follow this.
- **Phaser depth budget** (per memory) — HUD chrome 50–60 < banter 80–92 < gameplay-critical 95–101 < countdown 1000 < node prompt 1400 < relic prompt 1600. Anything new must claim a slot or risk z-order regressions.

### Branch state at scan time

**2026-04-26 snapshot:** Current branch `master` has uncommitted changes that look like in-flight work on **T213 (FTUE progressive disclosure)** and **T310 (bundle lazy-loading)** — both shipped in subsequent commits same day per Closeout block in `docs/superpowers/plans/2026-04-26-triple-audit-execution-plan.md`.

**2026-05-09 update:** Since the original scan, the codebase restructure (Phases 0–7) completed
2026-05-09 (`c0097d8`). GameScene 2874 → 1672 LOC. Many helper modules previously
named in #5 Phase A (`CollisionRouter`, `LevelUpFlow`, `RunLifecycle`, `OverlayStack`,
`SceneResetter`) shipped under nearby names (`installCombatCollisions`, `LevelUpFlow`,
`RunLifecycle`, `RunPersistenceCoordinator`, `RunPersistenceBridge`, `IFrameController`).
Phase B (biomes) shipped 2026-04-29/30 (Seawrack `a160662`, Haar `4c97626`, Frost `24c9301`).
Phase C (endless / post-bell) is wired through `src/core/PostBellEscalation.ts`,
`src/scenes/game/RunLifecycle.ts:isPostBell()`, `src/systems/postBellBossCadence.ts`,
`src/systems/cursedSpawnRoll.ts`, and surfaces in `gameOverFormatting`,
`chronicleAggregates`, `save.endless.test.ts`. **#5 charter is functionally shipped under
different module names; #9 is fully shipped (see `blocked/09-shipped.md`).**

### Triple-audit 2026-04-26 deferral list (for context)
- **T401** — GameScene decomposition (this list, #10) explicitly P3-deferred, allowed post-ship if timeboxed.
- **T407** — DOM accessibility layer (broader than A1) explicitly P3-deferred. **Not** in top 10 because A1 (#1) covers the user-facing accessibility commitments; T407 is an internal abstraction layer that A1 may pull in opportunistically.
- **T214** — Drift micro-practice tutorial (15–30s guided drift before combat). Optional FTUE beat; T213 progressive disclosure (in-flight) covers higher-value wins.
- **T311** — Croft visual polish (placeholder rects, Art Bible cross-check). Manual review work, not flagship-sized.

### Future flagships not in the 10 (because spec/scope still vague)
- **Forking act maps** (Slay-the-Spire 14+ nodes per act with visible rewards). M1 Moor Road shipped a single picker per act; multi-path tree is a separate big feature with no spec yet.
- **Active equipment item slot** (Hades cast, Isaac active). New slot-mechanic; no spec, no balance pass scoped.
- **Weapon fusion / unions** (HoloCure 2-weapon fusion, Vampire Survivors unions). Beyond current evolution paths; would invalidate parts of WeaponSystem + balance.
- **Multi-protagonist beyond variants** (separate movement profiles, not just stat tweaks). Memory shows 15-variant roster (Witch's Hare added 2026-04-28); conceptually capped at ~10 in design — pool is now over the original ceiling. Real new protagonists with distinct movement profiles would be a different track.
- **Item encyclopedia depth** (Spelunky/Isaac log every entity). C1 Almanac shipped four books, but tier coverage may stop short of full encyclopedia ambition.

These are noted so a future planning session can scope them; not promoted to top-10 yet.

### Soul Charter shipping objectives state
1. ✅ Stabilize high-impact UX (T306, T403, T404, T408 all in v2.3.0/2.3.1).
2. ✅ Prevent regressions (e2e: comfort-smoke + 14-test visual regression sweep).
3. ⧗ Defer broader foundation (a11y schema expansion). **A1 M1–M4 (#1) closes this.**
4. ⧗ Ship-bar gate (Soul Check). Active discipline; no work item.

### Source-of-truth for "is X shipped?"
The single best answer is the **memory index** (`MEMORY.md` → individual `*_status.md` files). The plan/spec docs lag behind by hours-to-days during shipping sprints. When in doubt, run `git log --oneline --grep "<initiative-tag>" -20` and read the latest status memory file. Don't trust the agents' summaries blindly — they read the design specs which are the spec, not the build log.

---

## How to use these prompts

Each `0X-*.md` file is a self-contained briefing meant to be pasted into a fresh Claude session (or `/feature-dev` start). They name the source docs, the scope, the sub-tasks, the gates, the anti-patterns, and the verification path. They assume the reader has not seen this conversation.

Pick by capacity:
- **Solo session, time-boxed (1–4 hrs):** #6, #8, #9 (content-shaped or single-system).
- **Multi-session sprint:** #1, #5, #7, #10 (multi-file, single-domain).
- **Quarter-scale flagship:** #2, #3, #4 (cross-platform / engine / infra).

Don't combine flagships. The "at most one flagship at a time" rule from `HUGE_INITIATIVES_MASTER_PLAN.md` is load-bearing.
