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
- [x] Phaser vendor chunk is 1.48MB ungz. Investigate whether
  `phaser/src/phaser-core.js` (or build-time subset imports) can
  drop unused subsystems (we use Arcade physics, zero Tilemaps,
  zero Matter). **Done 2026-04-17.** Vite `resolve.alias`
  swaps `phaser` for the prebuilt `phaser/dist/phaser-arcade-physics.js`
  (Matter + Box2D dropped). Vendor chunk 1481.77 KB → 1362.90 KB
  (-118.87 KB uncompressed, -34.83 KB gzip). Combined with the
  Scots lazy-load, PWA precache dropped 2117 → 1965 KiB (-152 KiB).
  Runtime verified: MainMenu renders clean, no console errors,
  all 2336 tests pass.
- [x] PWA precache reports 2116 KiB — confirm that's acceptable
  for install-on-visit, or move large assets out of precache.
  **Resolved 2026-04-17: acceptable — and subsequently reduced.**
  Every byte is required on the first frame so runtime-caching
  would break offline-from-first-visit. The other two P2 items
  did most of the work: Scots lazy-load (-37 KiB from precache)
  plus Phaser arcade-physics subset (-115 KiB from precache) —
  total precache is now 1965 KiB, a 152 KiB drop from the
  original 2117 KiB without sacrificing the offline guarantee.
- [x] App chunk climbed 500 KB → 679 KB over the W2 / W66 / W18 pass.
  Investigate whether the Scots overlay + route data can be
  lazy-loaded (currently eager via `EN_STRINGS` / `SCS_STRINGS`
  imports). **Done 2026-04-17.** SCS_STRINGS extracted to
  `src/core/i18n.scs.ts`, lazy-loaded via `ensureLocaleReady`
  on locale switch. App chunk 679.74 KB → 641.68 KB (-38 KB,
  -14 KB gzip). PWA precache 2117 KiB → 2080 KiB (Scots chunk
  excluded via `workbox.globIgnores`). English-only players —
  the default — never download the Scots dictionary.

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
- [x] Finish **W18 Phase B — banter Scots overlay**. Done 2026-04-18 —
  294 leaf keys translated across generic + per-boss + per-variant +
  per-weapon + per-curse + per-biome + per-route sub-pools. Voice
  register per `feedback_voice_register` (Still Game hearth default,
  Limmy edge for boss warnings / low-HP / decision moments). Parity
  guard in `src/core/i18n.locale.test.ts` enforces every EN banter
  leaf has a Scots translation. See `docs/BANTER_GAPS.md`.

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
