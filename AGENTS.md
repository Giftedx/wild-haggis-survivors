# AGENTS.md — Working Agreement for AI Agents

This repo is **Wild Haggis Survivors**, a Phaser 4 + TypeScript browser game bundled with Vite.

## Read [`CONTRIBUTING.md`](CONTRIBUTING.md) first

The working agreement: one headline question (*"can a real human play this change without a contributor walking them through it?"*) + the CI gates that make it self-enforcing + the cross-cutting chains (save / i18n / damage / RNG / new-mechanic / accessibility) + the sacred invariants (replay determinism, i18n parity, save migration, hazard immunity, BURNS_EVOLUTION_THRESHOLD).

If the bar conflicts with a task you've been given, surface the conflict — don't paper over it.

## How to run / verify
- **Dev**: `npm run dev`
- **Test**: `npm test` (Vitest)
- **Lint**: `npm run lint`
- **Build**: `npm run build` (TypeScript typecheck + Vite build)
- **Preview build**: `npm run preview`
- **E2E (Playwright, production preview)**: `npm run test:e2e` (requires a prior `npm run build` unless the preview server already serves `dist/`). `e2e/fixtures.ts` defaults **`AUTO_BATTLE` off** before each navigation; specs that need the dev auto-battler set **`AUTO_BATTLE = true`** in their own `page.addInitScript` (runs after the fixture).
- **Full local gate (matches GitHub Actions)**: `npm run ci:all` — lint, Vitest, build, bundle budget, flash budget, LOC report, then Playwright E2E

Before claiming anything is “fixed” or “done”, run at least `npm test` and `npm run build`. For changes that touch UI, boot, or CI, prefer **`npm run ci:all`** once dependencies are installed (and Playwright browsers are available: `npx playwright install chromium`).

**Windows / Git:** If almost every file shows as modified but diffs are only `100755` ↔ `100644`, run `git config core.filemode false` in the repo root (local setting).

## Player experience & tone

Player-facing copy & tone → [`docs/VOICE_CARD.md`](docs/VOICE_CARD.md). Visuals → [`docs/ART_STYLE_BIBLE.md`](docs/ART_STYLE_BIBLE.md). Soul charter principles + accessibility matrix → [`docs/DESIGN_SOUL.md`](docs/DESIGN_SOUL.md). Live ideas sketchpad → [`docs/DESIGN_IDEAS.md`](docs/DESIGN_IDEAS.md). Banter recipes → [`docs/BANTER_AUTHORING.md`](docs/BANTER_AUTHORING.md).

Eight deep reference docs at [`docs/research/`](docs/research/) (~150k words: roguelite patterns, Scottish content ×2, game feel, music/art tech, accessibility, cultural sensitivities, narrative). Consult when designing a system that benefits from it. No mandatory citation — link from a spec or PR only when the reference is genuinely load-bearing.

## Architecture quick map
- **Scenes**: `BootScene` → (splashes) → `MainMenuScene` → `MenuScene` (variant loadout) → `CroftScene` (hub) → `CurseScene` / `SporranScene` → `GameScene` → `GameOverScene` → `ShopScene` / `MetaShopScene`. `ActIntermissionScene` is a paired modal for W2 Moor Road between-act route picks.
- **Core systems** (instantiated by `GameScene`): `SpawnSystem`, `WeaponSystem`, `XPSystem`, `JuiceSystem`, `AudioSystem`, `ProceduralMusicEngine`. Player level growth is handled inside `Player.onLevelUp` / `playerGrowthScale` (no `GrowthSystem` class). Per-run state holders live under `src/scenes/game/`: `RunScoreState`, `RunActState`, `RunLifecycle`, etc.
- **Persistence (T132 diagram)** — three independent `localStorage` keys, each owned by a single module:
  - `whs_save` — `src/utils/save/` module, barrel at `src/utils/save.ts` (legacy combined save: meta progression + run history + replay blob; current schema **v24**, see `src/utils/save/schema.ts` `SAVE_SCHEMA_VERSION`). Module split (2026-05-07): `types.ts`, `schema.ts`, `io.ts`, `migrations.ts`, `bumpers.ts`, `history.ts`, `queries.ts`, `variants.ts`. The `save.ts` barrel re-exports the public surface so existing importers keep working. Recent additions: v18 `lemmingsSeenForVariant` (per-variant gate for the DMA-Design easter egg); v19 `RunHistoryEntry.sporranPicks` (S1 chronicle persistence); v20–v22 mechanic-counter trio gating `*_first` banter sub-pools (`beithirCuresLifetime` / `clootieWagersLifetime` / `cairnBlessingsLifetime`); v23 `livingWorldUnlocks` (WLW Phase 2 companions roster); v24 `grudgeVerdictsLifetime`. See migration chain in `migrations.ts`.
  - `whs_meta_save` — `src/core/SaveManager.ts` (`SaveManager.save`; meta-only save: kills, unlocks, achievements, `activeRun: IRunState | null` for mid-run resume; current schema **v12**).
  - `whs_game_settings` — `src/core/SettingsManager.ts` (audio / motion / accessibility / keybindings / locale; settings schema **v1**).
  - **All three** route their `setItem` catch through `src/utils/saveFailure.ts` `emitSaveFailure(path, err)` which fires `globalEventBus.GLOBAL_SAVE_FAILED`. `GameScene.create()` listens and toasts; structured `console.warn` records the failure either way (T131).
  - The historical `whs_save` and the newer `whs_meta_save` overlap on some fields by design — the migration to a single owner is a future cleanup tracked in P3.
- **Data files**: `src/config.ts`, `src/data/{weapons,enemies,upgrades,permanentUpgrades,variants,routes,banter,curses,biomes,eliteAffixes,hazards,relics,runes,nodeBanks,nodeTypes}.ts` (plus `metaShopItems`, `moorMoments`, `flavour`, `ancestorWhispers`, `haggisNames`, `enemyAmbientTrigger`).
- **W2 Moor Road**: act gating via `dispatchActComplete.ts` (gordon → act 1, tour_bus → act 2; taxman rides the victory path). Routes are data-driven with `modifierDeltas` applied at pick-resolve time + optional `onResume(ctx)` for side-effect callbacks (heals, spawn tilts, timed releases). `DEFAULT_ROUTE_ON_SKIP` backs the Skip Intermissions setting.
- **T1 Deterministic replay** (`src/replay/`): `ReplayRecorder` captures `ReplayFrame[]` + optional v2 metadata (`curseKey`, `routes`, `composedStats`). `ReplayInput` implements `IInput` so `Player` can be driven by replayed frames. GameScene `create()` has mutually exclusive record vs. playback branches; act intermissions auto-resolve from recorded picks during playback. ADR-0002 documents the format + the cosmetic-RNG + cross-build non-goals.
- **W18 Bilingual** (`src/core/i18n.ts` + `src/core/i18n.scs.ts`): English is the reference; Scots is a partial overlay that falls back key-by-key. SCS ships in a code-split chunk lazy-loaded on locale switch — English-only players never download it. Two parity fences in `src/core/i18n.locale.test.ts`: SCS→EN subset (no orphans) and EN→SCS scoped to `ui.banter.*` (W18 Phase B completion — banter additions are bilingual-locked at CI). Banter recipes: `docs/BANTER_AUTHORING.md`.

## High-risk Phaser correctness gotchas (treat as rules)
- **Scene instances are reused**: `scene.start('Game')` reuses the same `GameScene` instance; `create()` must reset all transient state.
- **`scene.time` keeps running during `physics.pause()`**: guard timer callbacks or defer work via flags.
- **`delta` is wall-clock**: cap large deltas to avoid “tab background” time-warps.
- **`delayedCall` respects `timeScale`**: at `timeScale = 0` it will not advance; use real timers only when you explicitly need wall-clock behavior. `TimeManager.scheduleRealTime(ms, cb)` is the prescribed wall-clock scheduler — W2 route `onResume` callbacks use it for timed-release effects so they don't stall during hit-freeze.
- **Phaser `ScenePlugin` vs `SceneManager`**: `this.scene` inside a Scene is the per-scene `ScenePlugin` (has `launch`, `pause`, `stop` operating on the owning scene). `game.scene` is the global `SceneManager` (has `start`, `run`, `getScene` by key — but no `launch`). Tests or external code that need `launch(key, data)` must go via `game.scene.getScene('Game').scene.launch(...)`.
- **Phaser imports break node-env vitest**: `phaser` touches `window` at module eval. Scene `.ts` files that import Phaser cannot be imported into vitest tests under the default node env. Extract testable logic into pure helper modules (e.g. `ActIntermissionScene.ts` delegates to `actIntermissionResolve.ts`; tests hit the helper directly).
- **Arcade fixed-step is a contract, not a knob**: `src/main.ts` sets `physics.arcade` with `fps: 60, fixedStep: true` — the T1 replay format assumes this integration step. Reverting to variable-delta physics breaks `src/replay/replayDeterminism.test.ts` and invalidates recorded blobs; treat the config line as load-bearing and update ADR-0002 if changing it.

## Repo hygiene (CRITICAL)
**This is a Source Repo.** Build artifacts are produced, not committed.

Unless the user explicitly requests otherwise:
- **Never commit `node_modules/`** (vendor blobs).
- **Never commit `dist/`** (build output).
- **Never commit `.env*`** (secrets).
- Keep `.gitignore` enforcing these rules.

If you are asked to commit `node_modules/` or `dist/`, do it, but call out the consequences (huge diffs, slow clones, merge pain).

## Editing guidelines
- Prefer **minimal, high-confidence fixes** for bug work (avoid broad refactors in the same change).
- Keep gameplay logic in systems/entities; keep UI logic in `src/ui/`.
- Keep balance changes in data/config files when possible.
- Avoid new cross-system reach-through (`as any` to access scene internals). Prefer explicit, typed interfaces passed into systems/entities.

### Player-facing changes

Ask the headline question from [`CONTRIBUTING.md`](CONTRIBUTING.md): *can a real human play this change without a contributor walking them through it?* If no, fix the legibility before shipping. That covers warmth, clarity, tone, voice, and pacing in one filter.

## Commit conventions
- Follow existing commit style (examples in `git log`): `fix: ...`, `feat: ...`, `refactor: ...`, `docs: ...`, `chore: ...`
- Keep commit messages concise and intent-focused.

## Documentation
- `CLAUDE.md` contains deeper project notes and “gotchas” — keep it accurate (e.g., it should mention Vitest exists).

