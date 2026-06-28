# LOC Budget Report (formerly: ratchet)

**Status (2026-05-10).** The per-file LOC ratchet test (`src/utils/locBudget.test.ts`) was deleted. It was raised six times in one day on 2026-05-09 and survived ~24 hours after the Phase-7 restructure shipped — the discipline fought the actual workflow on a single-author codebase and became a logbook of permission slips. See [`docs/REVIEW.md` C2](REVIEW.md) for the audit.

It's been replaced with a **reporter** at [`scripts/report-loc.mjs`](../scripts/report-loc.mjs), wired into `npm run ci` via `npm run loc-report`. The reporter:

- **Reports** every watched file's current LOC against a 2026-05-10 baseline. Output surfaces in CI logs; no failure on growth.
- **Hard-fails** only on `src/scenes/GameScene.ts > 1400 lines`. Single guardrail; everything else informational. (Ceiling was 2200 against the 1819 baseline; ratcheted to 1400 on 2026-06-28 after the facade decomposition cut the file to 1192 — see below.)
- **Optional `--strict` mode** (`node scripts/report-loc.mjs --strict`) fails on >25% growth from baseline. Not wired into CI; available for one-off audits.

## Why one guardrail not seventeen

The original ratchet had 17 ceilings. New mechanics overwhelmingly land in `Player.ts` (state) + `Enemy.ts` (AI) + `WeaponSystem.ts` (combat) + `AudioSystem.ts` (SFX) + `HUD.ts` (UI) + `data/banter.ts` (voice) + `GameScene.ts` (wiring). Forcing extraction on every feature in those files was friction without proportional benefit on a single-author codebase. The reporter makes growth visible; humans (or future agents auditing growth) still see the trend, but no commit gets blocked just because a feature added 30 lines to one file.

`GameScene.ts` keeps the hard ceiling because it's the wiring file and growth there compounds — every new system bolts a new init/update/destroy cycle on top. 1400 lines is ~17% past the 2026-06-28 baseline of 1192. Past that, the file stops being legible to a fresh reader and a slice extraction is genuinely warranted.

### 2026-06-28 facade decomposition

`GameScene.create()` was a ~930-line monolith. It was decomposed into four ordered phase installers — `installWorldAndAtmosphere` → `installPlayerAndRunStart` → `installCombatAndUpgrades` → `installUiLandmarksAndFlow` (in `src/scenes/game/`) — plus the largest inline install hook bags (combat collisions, run flow, run-end composers, run bookkeeping, cairn systems, runtime ambient, run-end shutdown) moved to sibling `build*Hooks.ts` / `build*Deps.ts` builders, matching the existing `buildRuneSystemControllerHooks` / `buildPauseMenuHooks` idiom. `create()` is now a ~57-line phase sequence. The file went **2186 → 1192 LOC** (−45%) with behaviour preserved (full vitest + e2e green; RNG branch/consumption order preserved inside each phase for replay determinism). The hard ceiling was ratcheted 2200 → 1400 in the same change to lock the win.

## When to act on the report

- **Any single file >25% past baseline:** a slice extraction probably belongs in the next commit. Run `--strict` to surface explicitly.
- **GameScene approaching 1400:** a slice extraction is required before the next mechanic lands. Hard-fail catches this on next commit.
- **Cumulative growth across the watched files exceeds ~5% in a sprint:** worth a "did we just bolt 7 mechanics onto fat files" reflection. The reporter output makes this visible week-to-week.

## Baseline (2026-05-10)

The reporter holds the same list as below. To rebaseline (e.g. after a major restructure ships), edit `BASELINE` in `scripts/report-loc.mjs` and update this table.

| File | Baseline LOC | Note |
|------|-------------|------|
| `core/i18n.ts` | 111 | Phase 3.1 split barrel |
| `core/i18n.scs.ts` | 15 | Phase 3.2 barrel |
| `scenes/GameScene.ts` | **1193** | **Hard-ceilinged at 1400** (facade decomposition 2026-06-28; was 1819 / 2200. 1192 by `wc -l`; reporter counts split = wc + 1) |
| `data/banter.ts` | 2682 | Pure data, parity-fenced |
| `utils/save.ts` | 91 | Phase 1 split barrel |
| `art/sprites/icons/cards.ts` | 2 | Phase 2 barrel |
| `art/sprites/icons/weapons.ts` | 2 | Phase 2 barrel |
| `entities/Enemy.ts` | 1657 | Hot path; heavily factored |
| `art/sprites/croft/seasonalProps.ts` | 2 | Phase 2 barrel |
| `entities/Player.ts` | 1847 | Hot path; heavily factored |
| `systems/JuiceSystem.ts` | 1060 | Phase 6 sub-system split |
| `scenes/SettingsScene.ts` | 678 | Phase 5 row builders |
| `systems/WeaponSystem.ts` | 1670 | Orchestrator |
| `scenes/GameOverScene.ts` | 293 | Phase 7 splits |
| `ui/HUD.ts` | 1294 | Widget builders |
| `systems/AudioSystem.ts` | 1485 | Orchestrator |
| `art/sprites/decorations/biomeProps.ts` | 2 | Phase 2 barrel |

## Files kept whole (no extraction planned)

These sit at their natural size as anti-regrowth guardrails, not primary deflation targets. The original Phase-7 restructure already factored them where seams existed.

- `entities/Player.ts` — heavily factored via `entities/` siblings (driftMastery, whiskyBreath, burnLeapInput, dashReverseStumble, mantlePulse, Player.mantle, playerLevelScaling, softBoundarySteer, playerGrowthScale, xpGemMagnet, xpGemTier) + `systems/runes/runeConsumer.ts`. Marginal further yield, hot-path risk.
- `entities/Enemy.ts` — same shape, hot path.
- `data/banter.ts` — pure data, parity-fenced; splitting moves bytes without architectural payoff.
- `systems/AudioSystem.ts` — orchestrator with no obvious sub-system seams.
- `systems/WeaponSystem.ts` — orchestrator; sub-system seams thin.
