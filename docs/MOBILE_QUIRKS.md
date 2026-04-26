# W95 Mobile Quirks Log

Running notebook of mobile-only behaviour the team has observed or
designed around. Update as new quirks surface during human playtest.

## Engine-side gotchas (already handled)

### Phaser 4 + iPhone canvas tap hangs (P4-12 / P4-13, fixed)

A `canvas.tap()` from Playwright iPhone emulation used to silently hang
the page event loop. Root cause was the audio-activation retry path in
`src/systems/audioContext.ts` using `queueMicrotask` instead of
`setTimeout`. Don't revert that fix — see ADR + commit history. The
`mobile-smoke.spec.ts` two-tap test guards the regression.

### Safe-area insets via body padding (W95 Phase 0, shipped)

`index.html` applies `padding: env(safe-area-inset-*)` to `<body>`. Phaser
canvas inherits the inset because the body scales with the visible
viewport. `src/utils/input.ts` `readBodySafeInsets()` reads the computed
padding and feeds it into `clampJoystickOrigin` so the joystick never
spawns under a notch or in the gesture-bar zone.

If you add a new fixed-position element (chrome button, modal anchor, …)
keep it inside the body padding box — don't position-absolute against
the document edge or it will clip on notched devices.

### Viewport meta — `viewport-fit=cover`

`index.html` already sets `<meta name="viewport" … viewport-fit=cover>`.
This is required for iOS Safari to expose `env(safe-area-inset-*)`
values; without it the `env()` values resolve to 0 and the safe-area
work above is silently ineffective. Do not remove or weaken this meta.

## Touch input quirks (designed around)

### Right-half tap = dash, left-half = joystick

`src/utils/input.ts` `setupTouchInput()` divides the canvas at `width *
0.6` — left 60% spawns the virtual joystick, right 40% queues a dash on
release. UI hit-tests run first (`scene.input.hitTestPointer`) so taps
on level-up cards / pause buttons / overlays don't trigger gameplay.

The split is now visibly hinted on first mobile run: `setupTouchInput()`
spawns a faint additive band + `TAP TAE DASH` label centred in the right
40% (depth 998/999, `setName('dash-zone-hint-band|label')`). The band
breathes via `dashZoneHintPulseAlpha` and self-dismisses on the first
tap inside the zone (320ms fade). Geometry helpers + the visibility gate
are pure (`src/ui/dashZoneAffordance.ts`) and unit-covered across the
canonical mobile viewport widths used by `mobile-viewport-reflow.spec.ts`.

`mobile-viewport-reflow.spec.ts` asserts the band's centreX + width track
`width * 0.8` and `width * 0.4` on touch-primary emulation, so a future
canvas-fraction tweak that drops out of sync with `setupTouchInput`'s
literal `0.6` will fail CI. Both layers reference `DASH_ZONE_X_FRACTION`;
update one and the unit + e2e fences will catch the drift.

### Tap target minimum (≥44pt)

iOS HIG requires 44pt; Material Design suggests 48dp. We use 44 as the
floor for both via `src/utils/touchTargets.ts` `MIN_TOUCH_TARGET_PX`.
Wire any new interactive Phaser text/glyph through `computeMinTapHitArea`
+ `setInteractive({ hitArea, hitAreaCallback, useHandCursor })` instead
of bare `setInteractive({ useHandCursor: true })`.

The HUD pause button is the canonical example — search HUD.ts for
`computeMinTapHitArea`.

## Known fragile paths

### iOS Safari + AudioContext

iOS will not let an AudioContext start until the first user gesture.
Phaser hooks this through the canvas pointerdown but multi-touch can race
the resume. If audio is silent on iOS but works on desktop, the most
likely culprit is `audioContext.resume()` failing silently. The
`runWhenAudioActivated` helper in `src/systems/audioContext.ts` exists
to retry — don't bypass it.

### iOS Safari + WebGL framebuffer

Some iOS Safari versions disagree with Phaser's WebGL2 default. The
Playwright fixture `e2e/fixtures.ts` sets `window.FORCE_CANVAS = true`
to fall back to Canvas2D in tests. Production sticks with WebGL — but
if a real iPhone reports a black canvas with no console error,
forcing the canvas renderer (`renderer: Phaser.CANVAS` in
`src/main.ts`) is the kill-switch.

### Android Chrome WebView vs full Chrome

Web app launched from a "Add to Home Screen" PWA on Android uses a
WebView instance with a slightly different feature set than full
Chrome. Most divergences are around Service Worker scope and audio.
If the PWA install path breaks, test in full Chrome first to isolate
which side is at fault.

### Tablet portrait vs landscape

Phaser `RESIZE` scale mode handles the pixel reflow but anchor-based UI
(`scene.scale.on('resize', …)` listeners) needs to repaint. The HUD's
`refreshResponsiveLayout()` covers the in-game case. New scenes must add
a resize listener if they have any anchor logic; missing the listener
manifests as off-screen UI on rotate, NOT as a crash.

## Open quirks (awaiting human confirmation)

These are guesses to verify during T203. Confirm or refute each:

- **iPhone Dynamic Island corner clipping** — the safe-area padding moves
  the canvas, but elements that use `setOrigin(1, 0)` and anchor to the
  top-right with a small offset (e.g. kill counter at `width - 12`) may
  still kiss the right edge of the island if the inset isn't large
  enough. Verify on iPhone 14 Pro / 15 Pro.
- **Samsung Internet font fallback** — the bilingual SCS chunk uses a
  custom font. If Samsung Internet doesn't load it, glyphs may render in
  a generic fallback. Verify by viewing Scots locale on a Galaxy device.
- **iPad Magic Keyboard input** — connect-and-disconnect flow may leave
  Phaser in a stale "is touch device" state since `device.input.touch`
  is sampled once at boot.

## Cross-references

- `docs/MOBILE_DEVICE_TEST_MATRIX.md` — playtest manifest
- `docs/top-10-tasks/blocked/04-blocked-on-human.md` — what only humans can close
- `docs/research/ACCESSIBILITY_RESEARCH.md` §motor — tap target + touch latency canon
