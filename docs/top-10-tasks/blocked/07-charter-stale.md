# Charter #7 — W27 Capture Pipeline Phase 2 — STALE

**Date marked stale:** 2026-04-26
**Original charter:** `docs/top-10-tasks/07-w27-capture-pipeline-phase2.md`
**Status:** Closed. The work the charter describes is either already shipped or explicitly out of scope per the design spec.

## Why stale

The charter (drafted ahead of the spec) describes Phase 2 as a "highlight reel + automatic memorable-moment detection + replay-driven encoding" surface. The actual Phase 2 design — `docs/superpowers/specs/2026-04-22-w27-capture-pipeline-phase2-design.md` §2 non-goals — pivoted away from highlight reel and replay-driven generation:

> **No deterministic camera path** from the prior draft. That was for a "highlight reel" that pre-selects shots; we ship the simpler "whatever was on screen" clip.
> **No replay-driven clip generation.** Clips capture the live canvas stream, not the T1 replay system. The two surfaces stay orthogonal — replay for determinism, capture for share.

The plan that *did* ship is the simpler "rolling buffer + on-demand save" model. Phase 2a (screenshot) and Phase 2b (clip) both shipped 2026-04-22 — see verification block at the bottom of the design spec.

A subsequent slice ("Soul Pass — Feature A: Clip audio track") shipped audio capture on 2026-04-22 as well — see `docs/superpowers/specs/2026-04-22-soul-pass-design.md` §Feature A. Audio was listed as Phase 3 stretch in the charter; it's now in production.

## What's verifiably shipped

| Charter ask | Status | Evidence |
|---|---|---|
| Highlight buffer (last N seconds) | Shipped as 15s rolling clip buffer | `src/utils/clipRecorder.ts` |
| Notable-event detection | NOT SHIPPED — explicit non-goal | Design spec §2 |
| Highlight queue UI | NOT SHIPPED — explicit non-goal | Design spec §2 |
| WebM via MediaRecorder | Shipped | `src/utils/clipRecorder.ts` |
| GIF fallback | NOT SHIPPED — descope lever per charter §Risk; not needed (vp9/vp8/webm fallback chain covers Safari 14.1+) | Design spec §3.1 |
| Save to device | Shipped (F9, F10, GameOver buttons, Pause buttons) | `src/scenes/GameScene.ts:1494-1505`, `src/scenes/GameOverScene.ts`, `src/scenes/game/PauseMenu.ts` |
| Watermark | NOT SHIPPED — descope lever | — |
| Postcard + clip unification | Filename builder shared (`src/utils/captureFilename.ts`); unified share modal not built | — |
| Bundle ≤ +200 KB | Verified +1.39 KiB gzip | Spec verification block |
| E2E smoke | Shipped (`e2e/capture-smoke.spec.ts`) | — |
| Audio track on clip (Phase 3 stretch) | SHIPPED via Soul Pass Feature A | `src/systems/audioContext.ts:256-278`, `e2e/capture-smoke.spec.ts` |

## Future work surface (if a Phase 4 ever lands)

From design spec §12 (out-of-scope extensions):

1. **Pre-composite HUD-free clip** — needs second render target. Modest scope. Useful for postcard-style shareable footage.
2. **Clip trimming UI** — would need `<video>` + scrubber + likely 200+ KB dep. Out of budget without ffmpeg-wasm.
3. **Share-directly-to-social** — requires CDN; explicitly out of v1 per master plan.
4. **Replay-driven clip generation** — would need T1 playback → offscreen canvas → MediaRecorder. Fit for T1 Phase 4 if pursued.

From the charter that didn't make it:

5. **Watermark / brand overlay** — small visible "wild haggis survivors" footer on clip + screenshot. Compositor work. Modest scope.
6. **Copy screenshot to clipboard** — `navigator.clipboard.write([new ClipboardItem({'image/png': blob})])` for desktop posting. Tiny scope.
7. **Postcard scene "Generate clip" unification** — single share modal instead of two button pairs.

## What was actually shipped this session (2026-04-26)

To make the charter execution productive rather than waste the dispatch, one Phase 4 slice was implemented:

- **Copy screenshot to clipboard** (item #6 above). New helper `copyImageToClipboard()` in `src/utils/clipboard.ts`. New "Copy frame" surfaces alongside the existing "Save frame" buttons on GameOverScene and PauseMenu. New i18n keys EN + SCS. New unit tests. Minimal bundle impact (<1 KiB).

See commit history for details.
