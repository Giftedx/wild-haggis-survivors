# Wild Haggis Survivors — PRD / Roadmap

**Scope:** Stability, maintainability, and shipping velocity without changing
core gameplay feel. Ralph-mode managed.

## Current Snapshot (2026-04-17)

- **Stack:** Phaser 3.90 + Vite 6 + TypeScript 6 + Vitest 3
- **Game loop:** Boot → Menu (variants) → Game (survivors loop + biomes +
  curses + post-bell endless + W2 Moor Road acts) → Shop (Golden
  Haggis meta) / MetaShop
- **Persistence:** localStorage save with schema migration
  (`SAVE_SCHEMA_VERSION = 4`, W2-routes bump) + `SettingsManager`
  with independent version gate
- **Tests:** 232 files, 2325 tests, full green
- **Build:** `npm run build` clean (~6.2s); vendor-phaser chunk
  ~1.48MB (gzip ~340KB), app chunk ~679KB (gzip ~190KB)
- **Lint:** `npm run lint` clean (zero errors)
- **CI:** `.github/workflows/ci.yml` + `deploy.yml` present
- **TODO/FIXME markers:** zero (in production code)
- **Scene reach-through (`this.scene as unknown`)**: **0** — fully
  retired. ISceneContext extended with optional `caption`,
  `requestBanter`, `getCurrentBiomeId`, `getSecondsPastBell` surfaces.
- **Production `as any` count:** **0** (17 → 0 since last PRD; two
  residual hits are doc-comment self-references in
  `LevelUpFlow.ts` / `PickupSpawner.ts`, not real casts).
- **Real timers (setTimeout/setInterval) outside tests:** 7 files
  — tightly scoped cluster: audio (AudioSystem, audioContext),
  music (ProceduralMusicEngine, NoteScheduler), TimeManager
  `scheduleRealTime` wrapper, FilmGrainOverlay, main.ts bootstrap.
- **PWA precache:** 2116 KiB (7 entries).
- **Systems shipped since last PRD:**
  - **W2 Moor Road** (2026-04-16) — 3 acts, 2 pickers, 6 routes,
    `RunActState`, `ActIntermissionScene`, Skip Intermissions opt-out,
    Chronicle route breadcrumb, Playwright smoke, Glesga voice pass,
    bilingual Scots strings, four resume-correctness bug fixes
    (bag-vs-cached-field, actState replay on resume, Ironmoor
    mid-run toggle lock, abandon-vs-pagehide auto-save race).
  - **W66 Ironmoor** (2026-04-16) — opt-in permadeath alt mode,
    separate `bestIronmoorSeconds` leaderboard, chronicle-wipe-on-
    death, ironmoor run_start/run_end telemetry flag.
  - **W18 Bilingual (Scots / English)** Phase A + Phase B v1
    (2026-04-16 → 2026-04-17) — `LOCALES` map, `setLocale`,
    populated `SCS_STRINGS` across UI shell, toasts, decision
    moments, loadout, bosses, biomes, tutorial; parity regression
    test. Banter pool still deferred.
  - **Analytics / portal telemetry** (2026-04-17) — six-commit pass:
    variant/curse/ironmoor/daily/deathCause tags on run_start /
    run_end, weapon_evolved + achievement_unlocked +
    codex_first_cull + global_shop_purchase + route_picked
    subscribers. `AnalyticsManager.test.ts` 10 → 28 tests.
  - **Palette / colour-token consolidation** (2026-04-17 commit
    e020928) — `COLORS_CSS.BLACK` route 10 pure-black text strokes;
    chronicle row + menu + settings palette tests.
  - **Core systems previously noted:** a11y (motion scale, high
    contrast, captions, banter frequency), biomes (Voronoi moor
    regions), curses (opt-in run modifiers → bonus gold), post-bell
    endless mode, meta shop, run history / chronicles,
    DeathCauseTracker / classifier, Achievements, TutorialSystem,
    StatusFxPool, DebugOverlay, BiomeController, PauseMenu,
    PickupSpawner, LevelUpFlow, RunLifecycle, HazardZones,
    BanterSystem, ProceduralMusicEngine.

## Priority Queue

### P1 — Lifecycle & Typing Finish-Work ✅ CLOSED
- [x] **Kill the last 7 scene reach-throughs** (`this.scene as unknown`).
  Done 2026-04-13.
- [x] **Audit the 17 production `as any`** escape hatches. Done
  2026-04-17 — production count now 0; pool teardown helper plus
  typed narrowing adopted across GameScene, LevelUpFlow,
  PickupSpawner, input, XPSystem, WeaponSystem, UpgradeCards,
  SpawnSystem. The only remaining `as any` hits in `src/` are two
  self-referential doc comments (`LevelUpFlow.ts`,
  `PickupSpawner.ts`) explaining the retirement.

### P2 — Bundle & Asset Budget
- [ ] Phaser vendor chunk is 1.48MB ungz. Investigate whether
  `phaser/src/phaser-core.js` (or build-time subset imports) can
  drop unused subsystems (we use Arcade physics, zero Tilemaps,
  zero Matter).
- [x] PWA precache reports 2116 KiB — confirm that's acceptable
  for install-on-visit, or move large assets out of precache.
  **Resolved 2026-04-17: acceptable.** Breakdown is vendor-phaser
  ~1482 KB + app ~680 KB + workbox ~6 KB + 2 PWA icons + shell.
  Every byte is required on the first frame to render the game,
  so runtime-caching any of them would break the offline-from-
  first-visit guarantee the PWA is built to provide. The only
  reductions with real impact are further Phaser subsetting (own
  P2 item) and app-chunk lazy-load (ditto) — both change the
  precache as a side effect, not by moving assets out of it.
- [ ] App chunk climbed 500 KB → 679 KB over the W2 / W66 / W18 pass.
  Investigate whether the Scots overlay + route data can be
  lazy-loaded (currently eager via `EN_STRINGS` / `SCS_STRINGS`
  imports).

### P3 — Accessibility Finish-Work
- [x] Exercise the Comfort panel end-to-end in CI via a smoke test:
  motionScale=0 + highContrastUi + captions + banter=off through
  one full boss encounter. Done 2026-04-17 —
  `e2e/comfort-smoke.spec.ts` (commit 5696ddb).
- [x] Document the a11y matrix in `docs/DESIGN_SOUL.md` so designers
  can see every knob at a glance. Done 2026-04-17.

### P4 — Content Authoring Velocity
- [x] The `banter.ts` sub-pool schema is tag-driven — land a
  one-page "how to add a new boss / variant voice" note so future
  content drops don't require engine diffs. Done 2026-04-17 —
  `docs/BANTER_AUTHORING.md` (commit c621b09).
- [x] Consider extending banter to **weapon evolution moments** and
  **curse acceptance** — both have narrative weight and the
  priority slots are open (30-50 range).
  **Shipped pre-PRD-snapshot — `weapon_evolve` pool at priority
  65 with 8 weapon sub-tags, `curse_start` pool at priority 59
  with 5 curse sub-tags; triggers wired in `LevelUpFlow.ts:250`
  and `GameScene.ts:716`.** Verified 2026-04-17.
- [ ] Finish **W18 Phase B — banter Scots overlay**. UI parity is
  green; banter pool deferred pending voice-register review.

### P5 — Observability
- [x] Ship a telemetry toggle (opt-in) for run-completion distribution
  + death-cause histogram. Done 2026-04-17 — see "Analytics /
  portal telemetry" under shipped systems.
- [x] DebugOverlay exists — surface active pool sizes, tween count,
  scheduled-music-events lookahead depth behind a keybind. Done
  2026-04-17 (commit 199083f).

## Acceptance Criteria (each queue item)

- `npm run lint` clean
- `npm test` 2325+ passing
- `npm run build` green
- No new `as any`, no new scene reach-through
- Manual smoke: pause, level-up modal, victory/death, scene restart,
  biome-cross, boss intro/outro, low-HP band, curse acceptance, W2
  act intermission, Ironmoor opt-in

## Deferred / Not This Pass

- Locales beyond English + Scots (infrastructure is ready; not
  committing to a third locale's maintenance burden yet).
- Cloud save (requires server; save-file encryption sufficient for
  single-device use).
- Gamepad rebinding UI (current binds adequate).
