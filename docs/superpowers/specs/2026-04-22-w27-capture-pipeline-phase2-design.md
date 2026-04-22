# W27 Capture & Share Pipeline — Phase 2 design spec

**Date:** 2026-04-22
**Tier:** A (per `HUGE_INITIATIVES_MASTER_PLAN.md`)
**Phase 1 shipped:** postcard PNG with run facts + tartan frame (`src/utils/postcard.ts`, 2026-04-17). Tartan footer added 2026-04-18.
**Phase 2 scope:** short clip (WebM) + full screenshot at any pause.

---

## 1. Problem statement

Phase 1 ships a still postcard — a single composited PNG at run end. It captures *what happened*, but not *how it felt*. Survivor runs pivot on moments: the last-second clutch, the fifty-kill combo, the boss burn. A still can't carry motion.

Phase 2 closes the share surface:

- **Rolling clip (WebM)** — player can save the last 15 seconds of gameplay at any time. Captures kills, boss moments, clutch dodges without asking "did I remember to hit record."
- **Full screenshot** — the current Phaser canvas, saved as PNG, at any pause or end screen. Fills the gap between "postcard" (ceremony band) and "raw frame" (the view the player saw).

Both write to local disk via the standard `download` anchor; no server, no CDN. Matches master plan: *"Share is local-save-then-user-uploads."*

### Player outcome

- "I just killed tour_bus with 2 HP" → one keypress → WebM file on disk.
- "This frame is beautiful, I want it as my wallpaper" → pause → screenshot button → PNG file on disk.
- Neither requires the player to know what the game was going to record.

### Craft outcome

- Clip and screenshot land inside the existing postcard tone: local file with a run-signature filename, no network egress, no CDN.
- Kill criterion (verbatim from master plan): *"If pipeline adds >200 KB to shipped bundle or 3% CPU during capture, cut highlights and keep postcards only."* Phase 1 stays regardless.

---

## 2. Non-goals

- **No video-editing UI.** Save-and-user-uploads. Per master plan.
- **No public CDN / server upload.** Local file only. Per master plan.
- **No audio track in clip v1.** Canvas stream only; no `AudioNode` capture. Reason: audio adds codec complexity + file size; clip is visual-first and players reading a WebM in Discord already get in-player audio from the embed. Ship later if requested.
- **No manual "start recording" mode.** Rolling buffer is the whole model — always recording the last 15 s, save grabs the buffer. No UX debt of forgetting to hit record.
- **No deterministic camera path** from the prior draft. That was for a "highlight reel" that pre-selects shots; we ship the simpler "whatever was on screen" clip.
- **No replay-driven clip generation.** Clips capture the live canvas stream, not the T1 replay system. The two surfaces stay orthogonal — replay for determinism, capture for share.
- **Not wiring into the existing TimeManager token system.** Capture operates outside game physics.

---

## 3. Architecture

Two independent capture surfaces, both reading from the Phaser canvas. No game-state mutation, no physics interaction, no audio context entanglement.

### 3.1 Clip — `src/utils/clipRecorder.ts` (new)

Rolling buffer, always on during gameplay, save-on-demand.

```
GameScene.create:
  clipRecorder = new ClipRecorder(game.canvas, {
    fps: 30,
    durationSec: 15,
    mimeType: 'video/webm;codecs=vp9',  // fallback to vp8, then skip
  });
  clipRecorder.start();

GameScene.shutdown:
  clipRecorder.stop();

// Save — keybind + gameOver button + pause button
clipRecorder.saveLast(labelFrom(payload));
```

**Mechanism:** `canvas.captureStream(30)` → `MediaRecorder` with `timeslice=500` → ring buffer of last `durationSec * 2` chunks. `saveLast()` concatenates current buffer contents into a Blob and downloads.

**Browser support:** Chrome 49+, Firefox 45+, Safari 14.1+. Feature-detected at construct; if `MediaRecorder` + `canvas.captureStream` aren't available, `ClipRecorder` no-ops and the UI button hides itself (`isAvailable()` getter). No exception thrown.

**Codec priority:** `video/webm;codecs=vp9` → `video/webm;codecs=vp8` → `video/webm` → bail. No MP4 — H.264 encode in the browser requires proprietary codec paths that Firefox lacks.

**Buffer memory:** 30 fps × 15 s × keyframe-heavy WebM ≈ 3–6 MB resident. Acceptable; same order as one Phaser texture atlas.

### 3.2 Screenshot — `src/utils/screenshot.ts` (new)

One-shot canvas-to-PNG.

```
await saveScreenshot(game.canvas, filename);
```

**Mechanism:** `canvas.toBlob('image/png')` → `URL.createObjectURL` → temp anchor click → revoke URL.

No buffer, no background work. Zero runtime cost until invoked.

### 3.3 Integration surfaces

| Surface | Clip | Screenshot |
|---|---|---|
| **GameOverScene** (death/victory) | "Save clip" button in footer, next to existing postcard save | "Save frame" button in footer |
| **PauseMenu** | "Save last 15s" button | "Save screenshot" button |
| **Keybind** | `F9` (configurable via settings later) | `F10` |

Buttons hide themselves when `clipRecorder.isAvailable()` is false. No dead UI for unsupported browsers.

### 3.4 Filename scheme

Match existing postcard convention:

```
whs_<mode>_<variant>_<MMmSSs>_<YYYY-MM-DD>[_<seed>].<ext>
whs_victory_classic_12m34s_2026-04-22.webm
whs_death_laird_05m21s_2026-04-22.png
```

Pure function `buildCaptureFilename(kind: 'clip' | 'screenshot', payload: CapturePayload): string` in `src/utils/captureFilename.ts`. Shared between the two surfaces so the naming stays in lockstep.

### 3.5 Feature gate

`captureEnabled: boolean` added to `SettingsManager` (default `true`) — flat field alongside existing entries like `skipActIntermissions`, `ironmoorMode`. Player opt-out lives under Comfort matrix for anyone wary of the capture machinery running in the background (privacy posture, low-spec machines). When `false`, `ClipRecorder.start()` is a no-op and UI buttons hide.

---

## 4. Data flow

```
Phaser canvas ─┬─> captureStream (30 fps) ─> MediaRecorder ─> ring buffer
               │                                                  │
               │                                              saveLast()
               │                                                  ▼
               │                                         Blob → anchor → download
               │
               └─> toBlob() ─> Blob → anchor → download  (screenshot path)
```

No state crosses into game physics. No coupling to `TimeManager`, `ReplayRecorder`, or `AudioSystem`. Capture is a pure consumer of the rendered output.

### Timing determinism contract

Clip is inherently non-deterministic — it captures whatever the renderer put on screen, subject to RAF jitter and browser compositor timing. This is fine and intended. The T1 replay system preserves game-state determinism; the clip preserves the rendered-frame stream. Two different trust contracts.

**Explicit guard:** no write path from clip/screenshot back into game state. The capture surface is strictly downstream of render. Enforced by module boundary — `clipRecorder.ts` and `screenshot.ts` import nothing from `src/scenes/` or `src/systems/`.

---

## 5. Error handling

| Failure | Detection | Behaviour |
|---|---|---|
| `MediaRecorder` unsupported | Feature detect at construct | `isAvailable()` returns false; UI hides |
| Selected codec unsupported | `MediaRecorder.isTypeSupported()` iterate | Fall through priority list; if all fail, `isAvailable()` false |
| `captureStream` throws (some mobile Safari) | try/catch in constructor | Log warn, `isAvailable()` false |
| Buffer overflow (shouldn't happen with fixed ring) | Shift oldest chunk | Silent — this is the point |
| `saveLast()` called before any chunks | Check buffer length | Toast: "Nothing to save yet — play for a moment first" |
| `toBlob()` returns null | Null check | Toast: "Couldn't save screenshot — try again" |
| Download anchor blocked by popup blocker | Can't detect | No mitigation; user retries. Chrome/FF allow same-origin data: downloads freely |

All failure paths surface via the existing `JuiceSystem.showToast(message, color)` — one-line warm-tone Scots-inflected text, matching postcard save failure pattern. `TOAST_COLORS.warning` for failures, `TOAST_COLORS.positive` for "saved" confirmation.

---

## 6. Components

### New files

| File | Purpose | LOC estimate |
|---|---|---|
| `src/utils/clipRecorder.ts` | Rolling-buffer WebM recorder | ~180 |
| `src/utils/clipRecorder.test.ts` | Pure helper + MediaRecorder mock tests | ~140 |
| `src/utils/screenshot.ts` | One-shot canvas-to-PNG | ~40 |
| `src/utils/screenshot.test.ts` | `toBlob` mock + filename check | ~60 |
| `src/utils/captureFilename.ts` | Shared filename builder | ~35 |
| `src/utils/captureFilename.test.ts` | Filename shape pinning tests | ~50 |

### Modified files

| File | Change |
|---|---|
| `src/scenes/GameScene.ts` | Construct `ClipRecorder` in `create`; `stop` in `shutdown`. Behind feature gate. |
| `src/scenes/GameOverScene.ts` | Add "Save clip" + "Save frame" buttons to existing footer; hide when unavailable |
| `src/scenes/game/PauseMenu.ts` | Add two buttons under existing entries; hide when unavailable |
| `src/ui/SettingsScene.ts` | Add "Capture enabled" toggle under Comfort |
| `src/core/SettingsManager.ts` + tests | Add `captureEnabled: boolean` (default `true`) as a flat field; migration via existing `settingsVersion` bump |
| `src/core/i18n.ts` + `src/core/i18n.scs.ts` | 6 new keys: clip/screenshot button labels, success toasts, failure toasts. EN + SCS locked by parity fence |

### Reused files

- `src/utils/postcard.ts` unchanged. Postcard path and capture path share only the filename-builder.
- `src/scenes/gameOverPayload.ts` — `CapturePayload` type reuses `PostcardPayload` fields (mode, variant, time, seed).

---

## 7. Testing

### Pure helper tests (vitest, no Phaser)

- `captureFilename.test.ts` — shape pinning across {mode, variant, time, seed present/absent}, bilingual-safe (no locale chars in filename), path-safe (no `/`, `:`, etc.).
- `clipRecorder.test.ts` — ring buffer FIFO behaviour, `saveLast()` with empty/partial/full buffer, codec priority fallback, `isAvailable()` under feature-absence. `MediaRecorder` mocked with a fake that emits predictable chunks.
- `screenshot.test.ts` — `toBlob` mock returns fixed blob; `saveScreenshot` constructs correct anchor + filename; null-blob path surfaces toast.

### Bundle + perf verification

- `npm run build` gzip bundle delta recorded. Kill-criterion line: fail plan if app chunk grows >200 KB. (Expected: ~5 KB — all three modules are tiny helpers.)
- Manual CPU profile: 60 s of gameplay with clip recording enabled vs. disabled. Kill-criterion: fail plan if delta >3% mean frame CPU. (Expected: <1% — `captureStream` runs in the renderer process separately from JS main thread.)

### E2E (Playwright)

One smoke test: load preview build, start run, trigger clip save via keybind, assert `download` event fires with correct filename pattern. No actual file assertion (browser sandbox) — filename is the verifiable signal.

---

## 8. Rollout phases

| Phase | Deliverable | Exit |
|---|---|---|
| **2a** | Screenshot — smallest scope, zero runtime cost. Ships first so the pattern (capture utility + UI surfaces + i18n keys + settings toggle + test stack) validates under low risk. | Screenshot key + button works across all 3 surfaces (GameOver, Pause). Bundle +<3 KB. |
| **2b** | Clip — rolling-buffer recorder. Ships on top of the pattern proven in 2a. | Clip save works during mid-run, survives pause/resume, survives scene restart. Bundle +<15 KB. CPU overhead <3% mean. |

Each phase commits independently. 2a → 2b ordering protects against the hard problem (MediaRecorder browser quirks) landing on top of an unproven UI pattern.

---

## 9. Kill criterion wiring

Pre-commit of 2b final commit: run `npm run build` and log the gzipped `dist/assets/index-*.js` size. Compare to pre-W27-phase-2 baseline (captured before phase 2a starts). Fail the plan if delta >200 KB.

Perf check is manual, not CI-gated — a 60 s Chrome DevTools profile with clip recording on vs. off. Record the numbers in the final commit body. If >3% regression, descope: ship 2a, park 2b behind a disabled feature flag.

---

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| `MediaRecorder` state machine edge cases (pause/resume during restart) | Start/stop is tied to `GameScene.create`/`shutdown`. No pause-while-recording state. Pause just freezes the last frame in the buffer, which is fine. |
| Ring buffer grows unboundedly due to slow GC | Fixed chunk count (`durationSec * 2 / (timeslice/1000) = 60 chunks`); array shift on overflow |
| Mobile Safari `captureStream` throws | Feature detect at construct → `isAvailable()` false → UI hides → no crash |
| Download anchor blocked on some embedded contexts (itch.io iframe) | Test in preview. If blocked, fall back to `URL.createObjectURL` + new-tab open so user right-clicks to save |
| Clip captures HUD and postcard overlay, which may be unwanted | V1 accepts this — the HUD *is* the gameplay. Future enhancement: pre-composite without HUD by reading a second render target. Not in Phase 2 scope. |
| Player saves the same clip 5 times in 3 seconds | Debounce `saveLast` at 1 per 500 ms; second press within window shows "already saving" toast |

---

## 11. Dependencies

- **No new npm packages.** `MediaRecorder` and `canvas.captureStream` are browser-native.
- **No new Phaser features.** Canvas is accessed via `scene.game.canvas`.
- **No new audio path.** Explicitly out of scope.
- **No save-schema break.** `captureEnabled` added as flat optional field in `SettingsManager`; existing saves default to `true` via coercion in `loadSettings`, mirroring the pattern for `skipActIntermissions` and `ironmoorMode`.

---

## 12. Out-of-scope extensions (future work)

- Audio track on clip (needs `AudioContext.createMediaStreamDestination` + merging into `MediaRecorder` — non-trivial on Safari).
- Clip trimming UI (would need `<video>` + scrubber — 200+ KB dep likely).
- Share-directly-to-social (requires CDN, per master plan explicitly out of v1).
- Deterministic replay-to-video export (would need T1 playback → offscreen canvas → MediaRecorder; fit for T1 Phase 4 if pursued).
- Pre-composite HUD-free clip (second render target).

---

*Spec complete. Next: `superpowers:writing-plans` generates an implementation plan with checkbox steps for Phase 2a then 2b.*
