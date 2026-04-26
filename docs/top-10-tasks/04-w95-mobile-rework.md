# Prompt #4 — W95 Mobile Platform Rework

## Goal

Make Wild Haggis Survivors first-class on mobile (portrait phone primarily, landscape tablet secondarily) — not just a desktop site that scales. Phase 0 (mobile safe-area) plan exists; full rework includes one-thumb play, gesture input, safe-area + notch handling, mobile HUD, real-device QA across iOS/Android. Estimated 4–6 person-weeks including device matrix testing.

## Why this is #4

`docs/HUGE_INITIATIVES_MASTER_PLAN.md` §W95 flags this as S-tier platform-gating. The game already runs on mobile via the virtual joystick + browser autoscale, but:
- HUD doesn't respect notch / status-bar safe areas.
- Touch posture (joystick + auto-attack) hasn't been ergonomics-tuned for one-thumb play.
- No gesture support (pinch / swipe) for menus.
- Triple-audit T203 (mobile real-device pass) is an explicit human gate that has not closed.
- No CI matrix for mobile webview engines.

Memory shows W2 Moor Road and Croft scenes were built without mobile breakpoints in mind originally; pieces have been retrofitted, but the holistic posture is still desktop-first.

## Source documents

1. `docs/superpowers/plans/2026-04-22-w95-phase0-mobile-safe-area.md` — Phase 0 plan (sketched, not executed).
2. `docs/HUGE_INITIATIVES_MASTER_PLAN.md` §W95.
3. `docs/HUGE_INITIATIVES_VERDICT.md` §270 (mobile decision).
4. `docs/superpowers/plans/2026-04-26-triple-audit-execution-plan.md` — T203 (mobile real-device pass) + T408 (1.4 scale + mobile visual regression).
5. `src/core/InputManager.ts` (or equivalent — locate via grep for `touchstart` / `pointerdown`).
6. `src/ui/` — HUD elements that need safe-area awareness.
7. `e2e/design-verify.spec.ts` (modified on current branch — already touches viewport size).

## Scope

### Phase 0 — Safe-area + viewport correctness
1. **Safe-area insets.** Use `env(safe-area-inset-top|right|bottom|left)` from CSS (Phaser canvas wraps a host div). Reserve top inset for Settings/Pause buttons; bottom inset for joystick + active-attack hand zone.
2. **Viewport meta.** Confirm `viewport-fit=cover` is set in `index.html`. Without it, iOS Safari ignores safe-area-inset.
3. **Orientation lock policy.** Decide: portrait-only? Both? If both, lock per-scene preference (MainMenu portrait, GameScene either, Croft portrait).
4. **Resize-event behaviour.** Phaser `Scale.RESIZE` mode handles canvas resize but layouts (HUD, Croft, Almanac, Curse) need explicit reflow handlers. Check `src/scenes/*` for `scene.scale.on('resize', ...)` coverage.
5. **Visual regression at mobile widths.** Triple-audit T408 added 1.4 scale + mobile breakpoints to `e2e/design-verify.spec.ts`. Extend to all screens.

### Phase 1 — Input ergonomics
1. **Joystick zone tuning.** Bottom-left thumb radius needs to be tunable per-device. Sample: iPhone 13 reach is different from Pixel 7 Pro.
2. **Auto-aim posture.** Game is auto-attack but aim is implicit (closest enemy). Touch posture: thumb on joystick, no second hand needed. Confirm.
3. **Gesture menus.** Swipe-to-dismiss in level-up cards, tap-and-hold for tooltip / Almanac entry detail, pinch-to-zoom on Almanac art (if relevant).
4. **Pause button.** Top-right corner, safe-area-aware. Currently exists; reposition.
5. **Keyboard fallback off mobile.** Don't show keyboard hints in HUD when touch is the active input. Detect via `'ontouchstart' in window` + first-input heuristic.

### Phase 2 — Mobile HUD + scene polish
1. **HUD reflow.** Weapon row scales correctly; doesn't overlap minimap; banter toasts don't crash into thumb zones.
2. **Modal sizing.** Curse / GameOver / Pause / Level-up cards constrain max-width to look right on phone (large-tablet OK).
3. **Croft scene.** Hub navigation icons must be reachable one-thumb. Minimum tap target 44pt iOS / 48dp Android (per `ACCESSIBILITY_RESEARCH.md`).
4. **Almanac.** List + entry detail two-pane only on tablet; phone is single-pane stack.
5. **Settings.** Long lists need touch-friendly scroll. Gamepad remap UI from A1 needs touch fallback (drag a key onto a binding).

### Phase 3 — Performance + battery
1. **Phaser pixel ratio.** `pixelArt: true` already set; confirm `resolution: window.devicePixelRatio` not over-sampling on retina.
2. **60 fps on mid-range Android (e.g. Pixel 6a).** Profile, find the worst frame, fix.
3. **Battery drain.** 30-min run on locked screen at 50% brightness shouldn't drain >20% battery on a year-old phone.
4. **Bundle size for mobile networks.** Already covered by T310 lazy-loading work in flight.

### Phase 4 — Real-device QA matrix
Manual playtest sessions:
- iPhone (current iOS, model in last 2 years): Safari + Chrome.
- Android (Pixel + Samsung Galaxy in last 2 years): Chrome + Samsung Internet.
- iPad: Safari.
- Android tablet: Chrome.
Each device: 30-min run completing W2 act 1 + Croft visit + Almanac browse + Settings remap + cloud sign-in (if P3 Cloud Saves landed).

## Sub-tasks

1. CSS safe-area + viewport meta (Phase 0 fast).
2. Per-scene resize handlers audit + fixes.
3. Joystick zone tuning + per-device defaults.
4. Gesture handlers (swipe / tap-and-hold / pinch).
5. HUD reflow at 360 / 414 / 768 / 1024 widths.
6. Tap-target audit (`ACCESSIBILITY_RESEARCH.md` 44pt rule).
7. Visual regression sweep at mobile breakpoints.
8. Perf profile on Pixel 6a; fix worst frames.
9. Real-device matrix playtest (T203 closes here).
10. Document quirks in `docs/MOBILE_QUIRKS.md`.

## Acceptance criteria

- All scenes lay out correctly at 360 / 414 / 768 / 1024 widths in portrait.
- All interactive elements ≥44pt tap target.
- Safe-area insets respected on iPhone with notch + Dynamic Island.
- Joystick reachable one-thumb on iPhone Mini-class and Pixel 7 Pro alike.
- Gesture menus work on both iOS and Android.
- 60 fps sustained on Pixel 6a baseline 30-min run.
- Battery drain ≤20% per 30-min run on locked screen mid-brightness.
- T203 sign-off: real-device playtest log in `docs/MOBILE_PLAYTEST_LOG.md`.
- `npm run test:e2e` extended with mobile viewport spec; passes on Playwright iPhone + Pixel emulation.
- T408 visual regression sweep updated to cover Phase 0–2 changes.

## Anti-patterns to avoid

- **Don't fork the mobile build.** Single bundle, responsive layout. PRD already calls this out.
- **Don't kill desktop input.** Mouse / keyboard / gamepad must remain first-class.
- **Don't disable hover effects on touch.** Some hover effects (Almanac tooltip) become tap-and-hold; convert, don't remove.
- **Don't render two HUDs.** Same HUD reflows; no `if (mobile) <MobileHUD />`.
- **Don't ship without device-matrix test.** Emulator coverage isn't sufficient (Safari on iOS is uniquely cursed).

## Verification path

```
npm run lint
npm run build
npm test
npm run test:e2e        # incl. Playwright mobile viewports
npm run preview         # eyeball at 360/414/768/1024 widths
```

Plus manual on real devices per matrix in Phase 4.

## CLAUDE.md gotchas relevant here

- Overlay input blocking — full-screen modals must `.setInteractive()` or the virtual joystick activates through them. Already a pattern; verify across new mobile screens.
- Phaser ScenePlugin vs SceneManager — orientation-change scene refresh routes through `game.scene`.
- Pixel art — `pixelArt: true` + `roundPixels: true`. Don't fight Phaser's pixel snapping at higher devicePixelRatio.

## Soul checks

- Mobile player's first 60 seconds is the Soul Check moment (`DESIGN_SOUL.md` Great Moment Recipe). Currently underwhelming because HUD elements can be off-screen; Phase 2 reflow is the soul fix.
- Voice Card: any new touch hint copy in Hearth register ("tap and haud", not "press and hold").

## Risk + descope levers

If timeline slips:
- Phase 4 device matrix: cut to iPhone + Pixel only, defer Samsung + tablets. (-3 days)
- Phase 1 gestures: keep swipe-to-dismiss only, defer pinch-zoom + tap-and-hold. (-2 days)

Risk to manage:
- iOS Safari + WebGL bugs (Phaser 4 audio context unlocking on first tap is fragile). Audit early.
- Android Chrome WebView vs full Chrome divergence. Test both.
