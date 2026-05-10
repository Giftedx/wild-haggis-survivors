# Phase 0 Gate Notes

> Phase 0 of the Moor-Renders-Itself push. Spec: `docs/superpowers/specs/2026-04-18-moor-renders-itself-design.md` (v3). Plan: `docs/superpowers/plans/2026-04-18-moor-phase-0-prototype-plan.md`. Gate criteria live in spec §14.

> **2026-04-26 status update.** Phase 0, Phase 1 (enemy archetypes — buckfast_ned / eagle / haggis_hunter wired through `AnimationController`, plus 27 additional drawers self-registered in the registry), and Phase 2 (secondary-motion: tail lag + tier-gated heather mantle) have all shipped. Format choice ratified in [ADR-0005](adr/0005-skeletal-animation-rig.md). Runtime perf baseline captured in `src/animation/animationPerf.bench.test.ts` — 201-entity steady state averages 0.0196 ms/tick on the CI runner (≈0.10 µs/entity). Remaining Phase 0 gates (live FPS A/B vs procedural baseline, Gate A 24-h squint test, Gate B external reviewer panel) remain human-gated; tracked in `docs/top-10-tasks/blocked/02-blocked-on-human.md`.

## Commits shipped

| Task | Commit | Summary |
|------|--------|---------|
| 1 | `e06ffdf` | ART_STYLE_BIBLE.md |
| 2 | `26e7b97` | palettes.ts + VariantPalette |
| 3 | `1fb376d` | animationStates FSM |
| 4 | `f0f3d2e` | frameClock 24 fps |
| 5 | `be82373` | textureAtlas key mapping |
| 6 | `fed46e7` | haggisFrames idle × 2 + walking stubs |
| 7 | `b2f47ee` | haggisFrames walking × 4 authored |
| 8 | `adcbb1d` | BootScene bakeHaggisAtlas + measurement hook |
| 9 | `63e044f` | AnimationController |
| 10 | `9231aba` + `22ef78f` | Player wires AnimationController, retires wobblePhase (+ lint fix) |
| 11 | `398dfc7` | HaggisContainer |
| 12+13 | `5f6c17d` | AccessoryDrawer interface + tam_o_shanter drawer + accessory atlas bake |
| 14 | `10dbd5e` | Player.equipAccessory + sync loop |
| 15 | `08a17b9` | debug T + K hotkeys |
| 16 | `57897ea` | debug I/W/H/ESC force-state hotkeys |
| 17 | `fba3ee5` | CombinationsPreviewScene + C hotkey |

## Engineering metrics

### Test suite

- Pre-Phase-0 baseline: 2615 tests (from prior session wrap).
- Post-Phase-0: **2657 tests** (+42 from new animation + palette + registry + drawer modules).
- All green. `npm test -- --run`.

### Build

- `npm run build` — clean (tsc + vite).
- App chunk: **707.10 kB** (gzip 193.94 kB). Was ~681 kB pre-Phase-0 (+26 kB for atlas bake + drawer code; well within budget).
- Phaser vendor chunk unchanged at 1362.90 kB (gzip 305.01 kB).
- Scots i18n chunk: 54.90 kB (gzip 21.75 kB) — unchanged.
- PWA precache: 7 entries, **2028.12 KiB** (≈ 2 MB, acceptable per PRD P2 precedent).

### Lint

- `npm run lint` — clean (zero errors).

## Texture bake times (dev machine)

**Live-run measurement deferred.** The browser console log fires on first BootScene run:

```
[BootScene] Haggis atlas bake: X.X ms
[BootScene] Accessory atlas bake: X.X ms
```

Capture these numbers on the first real `npm run dev` session and record here. Calibrates Phases 1-3 bake expectations per spec v3 §6.

- Haggis atlas (classic only, idle + walking, 6 textures): **<CAPTURE FROM RUN>** ms
- Accessory atlas (tam only, idle + walking, 6 textures): **<CAPTURE FROM RUN>** ms
- Total boot-time overhead: **<CAPTURE FROM RUN>** ms

## FPS baseline

**AutoBattler stress comparison deferred — requires a live browser + dev-tools FPS counter.**

Procedure:
1. Start `npm run dev`, open browser to `http://localhost:3000`.
2. In devtools console, before starting a run: `globalThis.AUTO_BATTLE = true`.
3. Start a run. Wait 3-5 minutes. Record average FPS (use Chrome's performance tab FPS meter).
4. Check out the parent commit (`git checkout <pre-phase-0-sha>`), repeat, compare.
5. Delta should be within 5 % — texture-swap animation is cheap at runtime, so a regression would be a surprise.

- Pre-Phase-0 AutoBattler 10× stress (5 min run): **<BASELINE_FPS>** avg
- Post-Phase-0 AutoBattler 10× stress (5 min run): **<CURRENT_FPS>** avg
- Delta: **<DELTA>**%. Within the 5% gate? **<YES/NO>**

## Gate A — 24 h cooldown self-review

**Date ready for review:** 2026-04-19 (24 h after final Task 17 commit `fba3ee5`, landed 2026-04-18 00:26 UTC).
**Date completed:** _<FILL IN AFTER 24H WAIT>_

Steps:
1. `npm run dev`, enable `globalThis.DEV_HOTKEYS = true` in console.
2. Start a classic-variant run.
3. Press `K` to capture haggis idle; walk for 1 s, press `K` again for walking; press `T` then `K` for with-tam idle; press `W` then `K` for with-tam walking. Screenshots land in the browser downloads.
4. Rename + move to `.superpowers/captures/phase0_*.png`.
5. Capture 3 reference sprites from the existing game (dean_apparition, tome_wraith, redcap) via the same mechanism or by pressing `C` to enter CombinationsPreview and screenshot-tool.
6. Open all screenshots in one image viewer. Squint test. Side-by-side comparison.

**Charter checks (per `docs/ART_STYLE_BIBLE.md`):**
- Defined silhouette (squint test)?
- Light model: upper-left highlight visible?
- Layered depth (3+ tonal passes)?
- Focal hierarchy readable?
- Palette discipline — nothing outside `src/art/palettes.ts`?
- Character pose — does the haggis feel alive?
- Tam sits convincingly on the head across states?

**Outcome:** _<PASS / REWORK>_
**Notes:** _<FILL IN>_

## Gate B — external review

**Date completed:** _<FILL IN AFTER REVIEWS>_

Procedure:
1. Record 15-30 s gameplay clip showing classic haggis walking with tam toggling via `T`, and a few combat beats.
2. Save to `.superpowers/captures/phase0_gameplay.mp4` (or .webm).
3. Share with ≥ 2 non-developer reviewers.
4. Ask: "Does this look handcrafted / polished / Scottish? Any one-sentence reaction?"
5. Record responses below.

**Reviewers:**
- R1: _<name>_ — response: _<one-line>_
- R2: _<name>_ — response: _<one-line>_

**Outcome:** _<PASS / REWORK / BLOCKED on reviewers>_

## Caveats carried from spec v3

- External reviewer pool not pre-sourced. If the panel cannot be convened within a reasonable window, the Gate B test degrades to solo-dev self-review with explicit acknowledgement that this is less rigorous than the spec intends.
- Gate C (≥ 5 failed iterations on same drawer) escalates to user for strategy re-eval rather than auto-close. Decision point: remain procedural-only, or revisit hybrid pixel-art pipeline (Option D from brainstorming).
- Phase 1 cannot start until Gate A + B both pass here.

## Post-gate plan

- If PASS: tag commit `phase-0-ship`, proceed to writing the Phase 1 plan (animation foundation across all 9 variants + 3 enemy archetypes). Spec §16 is the roadmap.
- If REWORK: iterate the failing drawer(s). Use session-log commits so git bisect remains useful.
- If BLOCKED: escalate to user, document the block in this file, pause.
