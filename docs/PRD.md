# Wild Haggis Survivors — PRD / Roadmap

**Scope:** Stability, maintainability, and shipping velocity without changing
core gameplay feel. Ralph-mode managed.

## Current Snapshot (2026-04-13)

- **Stack:** Phaser 3.90 + Vite 6 + TypeScript 6 + Vitest 3
- **Game loop:** Boot → Menu (variants) → Game (survivors loop + biomes +
  curses + post-bell endless) → Shop (Golden Haggis meta) / MetaShop
- **Persistence:** localStorage save with schema migration
  (`SAVE_SCHEMA_VERSION = 8`) + `SettingsManager` with independent
  version gate
- **Tests:** 68 files, 466 tests, full green
- **Build:** `npm run build` clean (~4.5s); vendor-phaser chunk
  ~1.48MB (gzip ~340KB), app chunk ~500KB (gzip ~133KB)
- **Lint:** `npm run lint` clean (zero errors)
- **CI:** `.github/workflows/ci.yml` + `deploy.yml` present
- **TODO/FIXME markers:** zero
- **Scene reach-through (`this.scene as unknown`)**: 7 call sites in
  5 files — remaining scaffold for typed interfaces
- **Production `as any` count:** 17 in 8 files (down from heavy use
  pre-StatComposer/ISceneContext; test doubles exempt)
- **Real timers (setTimeout/setInterval) outside tests:** 2 (audio
  + music engine — both tightly scoped)
- **Systems shipped since last PRD:** a11y (motion scale, high
  contrast, captions, banter frequency), biomes (Voronoi moor
  regions), curses (opt-in run modifiers → bonus gold), post-bell
  endless mode, meta shop, run history / chronicles,
  DeathCauseTracker / classifier, Achievements, TutorialSystem,
  StatusFxPool, DebugOverlay, BiomeController, PauseMenu widget,
  PickupSpawner, LevelUpFlow, RunLifecycle, HazardZones. GameScene
  dropped 3088 → 1656 LOC (-46%).
- **Just shipped:** BanterSystem — context-reactive Glesga
  commentary with per-boss + per-variant sub-pools, four-step
  frequency setting (Wheesht / Sparing / Natural / Gabby).

## Priority Queue

### P1 — Lifecycle & Typing Finish-Work
- [ ] **Kill the last 7 scene reach-throughs** (`this.scene as unknown`)
  in XPGem, Player, UpgradeCards, JuiceSystem, SpawnSystem. Finish
  the `ISceneContext` pattern by adding typed surfaces (e.g.
  `requestBanter`, `caption`) and converting the reach-through call
  sites in those files.
- [ ] **Audit the 17 production `as any`** escape hatches
  (GameScene, LevelUpFlow, PickupSpawner, input, XPSystem,
  WeaponSystem, UpgradeCards, SpawnSystem) and replace with typed
  narrowing where the intent is clear.

### P2 — Bundle & Asset Budget
- [ ] Phaser vendor chunk is 1.48MB ungz. Investigate whether
  `phaser/src/phaser-core.js` (or build-time subset imports) can
  drop unused subsystems (we use Arcade physics, zero Tilemaps,
  zero Matter).
- [ ] PWA precache reports 1945 KiB — confirm that's acceptable
  for install-on-visit, or move large assets out of precache.

### P3 — Accessibility Finish-Work
- [ ] Exercise the Comfort panel end-to-end in CI via a smoke test:
  motionScale=0 + highContrastUi + captions + banter=off through
  one full boss encounter.
- [ ] Document the a11y matrix in `docs/DESIGN_SOUL.md` so designers
  can see every knob at a glance.

### P4 — Content Authoring Velocity
- [ ] The `banter.ts` sub-pool schema is tag-driven — land a
  one-page "how to add a new boss / variant voice" note so future
  content drops don't require engine diffs.
- [ ] Consider extending banter to **weapon evolution moments** and
  **curse acceptance** — both have narrative weight and the
  priority slots are open (30-50 range).

### P5 — Observability
- [ ] Ship a telemetry toggle (opt-in) for run-completion distribution
  + death-cause histogram, so balance tuning has numbers not vibes.
- [ ] DebugOverlay exists — surface active pool sizes, tween count,
  scheduled-music-events lookahead depth behind a keybind.

## Acceptance Criteria (each queue item)

- `npm run lint` clean
- `npm test` 466+ passing
- `npm run build` green
- No new `as any`, no new scene reach-through
- Manual smoke: pause, level-up modal, victory/death, scene restart,
  biome-cross, boss intro/outro, low-HP band, curse acceptance

## Deferred / Not This Pass

- Localisation beyond EN (infrastructure is `EN_STRINGS` shaped for it;
  not ready to commit to a second locale's maintenance burden yet).
- Cloud save (requires server; save-file encryption sufficient for
  single-device use).
- Gamepad rebinding UI (current binds adequate).
