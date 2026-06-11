# Prompt #7 — W27 Capture Pipeline Phase 2 (Highlight Reel + Clip Export)

## Goal

Build on the postcard scaffold (shipped 2026-04-17 per `docs/HUGE_INITIATIVES_MASTER_PLAN.md` §W27 + `Postcard.ts`) by adding highlight selection + video/GIF clip export. The vision is "one surface for postcards + highlight clips + screenshots" — consolidating W20/W50/W79 visions into a single share pipeline. Estimated 2–3 person-weeks. Bundle budget cap +200 KB gzip.

## Why this is #7

It's a "share what you played" feature — high virality ROI for a small team game. PRD calls it out as A-tier polish. Postcard scaffold proves the camera-path-and-export pattern works; Phase 2 adds the runtime memorable-moment detection + video encoding. Behind A1/W71/P3/W95/Phase Refactor because it's not a ship blocker; it's a multiplier on player-shared content once shipped.

## Source documents

1. `docs/superpowers/plans/2026-04-22-w27-capture-pipeline-phase2.md` — Phase 2 plan.
2. `docs/superpowers/specs/2026-04-22-w27-capture-pipeline-phase2-design.md` — design spec.
3. `docs/HUGE_INITIATIVES_MASTER_PLAN.md` §W27.
4. `docs/DESIGN_IDEAS.md` §232–240 (capture vision).
5. Existing code: `src/postcard/Postcard.ts` (or wherever — grep for "Postcard").
6. `docs/research/MUSIC_ART_TECH_RESEARCH.md` §codec / Web video sections.
7. `src/replay/` — replay infrastructure (T1 deterministic) is reusable for re-playing a recorded clip frame-by-frame to encode.

## Scope

### Phase 2.A — Highlight detection + selection
1. **In-run "highlight buffer".** Continuously record last N seconds (e.g. 8 s) into a ring buffer. On notable events, freeze the buffer for export:
   - Boss kill (auto-highlight)
   - Combo milestone (10x, 25x, 50x, 100x)
   - Rare evolution pickup
   - Near-death survive (HP <10% → recovered)
   - Player death (final 8 s as a "what got me" replay)
2. **Highlight queue UI** at run end (next to existing run summary): browse 3–5 candidate clips, swipe/click to dismiss or save.
3. **Save format.** First class: replay-data slice (.json, ~5–20 KB per clip). Second class: encoded video (Phase 2.B).

### Phase 2.B — Clip export (video / GIF)
1. **Codec choice.** Options:
   - **WebM via MediaRecorder** — built into browsers, ~50–150 KB per 8 s clip at 480p. iOS Safari spotty until iOS 17.5+.
   - **GIF via gif.js or gifenc** — broadest compatibility, larger files, no audio.
   - **MP4 via WASM ffmpeg** — heavy bundle (+800 KB minimum), best quality, broadest playback.
   ADR-recommended: WebM with GIF fallback for Safari < 17.5. MP4 deferred unless community demands.
2. **Encoding pipeline.**
   - Replay buffer slice → re-render frame-by-frame off-screen Phaser canvas → MediaRecorder consumes canvas stream → blob.
   - Audio is harder; v1 ships video-only. Audio sync is Phase 3.
3. **Camera path.** During highlight playback, follow the action with a deterministic camera script (re-uses replay deterministic camera).
4. **Bitrate / size targets.**
   - 480p, 30 fps, 8 s = ~150 KB at WebM medium quality.
   - 360p GIF, 24 fps, 8 s = ~500 KB.

### Phase 2.C — Export + share UX
1. **Save to device** — download trigger, default filename includes run + variant + timestamp.
2. **Share intent** (mobile) — `navigator.share({ files: [blob] })` if supported; otherwise fall back to download.
3. **Copy to clipboard** (image / GIF only) — for desktop posting.
4. **Watermark** — small "wild haggis survivors" + game URL bottom-right. Brand-aware.
5. **No CDN in v1.** All exports are client-side; player chooses to upload elsewhere. Privacy-first.

### Phase 2.D — Postcard / clip unification
1. Existing postcard generation gets a "include video" toggle.
2. Single share modal: choose Image (postcard) or Clip (video) per export.

## Sub-tasks

1. ADR for codec + compression strategy.
2. Highlight ring-buffer infrastructure in `src/replay/`.
3. Notable-event detector — wire to existing event bus + add classifications.
4. Highlight queue UI in run-end scene.
5. WebM encoder pipeline (off-screen canvas → MediaRecorder).
6. GIF fallback path for unsupported Safari.
7. Save-to-device + share-intent + clipboard paths.
8. Watermark + branding overlay (camera composite layer).
9. Postcard scene gains "Generate clip" button.
10. Bundle audit — ensure ≤+200 KB.
11. e2e test — start run → trigger boss kill → highlight detected → export clip.
12. Manual playtest export pass on chromium/firefox/webkit + mobile.

## Acceptance criteria

- 3–5 highlight candidates surface at run-end automatically.
- Player can export at least one clip per run as WebM or GIF.
- Output renders correctly in QuickTime + VLC + browser preview.
- Watermark present + readable.
- Bundle delta ≤+200 KB gzip.
- Privacy: no upload happens without explicit user share action.
- `npm run ci:all` green.
- Cross-browser smoke green (chromium / firefox / webkit).

## Anti-patterns to avoid

- **Don't ship MP4 in v1.** WASM ffmpeg is ~800 KB; budget cap blown. WebM + GIF only.
- **Don't auto-upload anywhere.** Share intent triggers user-chosen target. Privacy-first per `CULTURAL_SENSITIVITIES_RESEARCH.md` philosophy.
- **Don't re-render every frame from raw replay.** Use replay slice → camera script + animation re-play; fixed-step physics ensures determinism (per ADR-0002 Phase 3).
- **Don't break determinism.** Highlight encoding runs off-thread / off-canvas; main canvas + game state must not be touched mid-run.
- **Don't blow the bundle cap.** Lazy-load encoder library; only fetch when player opts to export.

## Verification path

```
npm run lint
npm run build
npm test                # encoder pipeline unit tests
npm run test:e2e        # highlight detect + export flow
npm run preview         # manual export each browser
```

Plus:
- Bundle size diff before vs after — `npm run build` reports gzip stats; document delta.
- 5 example exports — boss kill, combo, evolution, near-death survive, player death — each opened in a non-browser player.

## CLAUDE.md gotchas relevant here

- **AudioContext singleton + DynamicsCompressor.** Audio export (Phase 3, deferred) must respect the shared compressor; don't re-route audio for a separate encode.
- **`scene.time.delayedCall` respects timeScale.** Highlight buffer ticking must use `TimeManager.scheduleRealTime` if it needs wall-clock cadence at hit-freeze.
- **Replay determinism.** ADR-0002 Phase 3 contract — fixed-step physics. Highlight encoder reuses replay; if encoder reads physics state, must respect determinism guarantee.
- **Phaser 4 imports + node-env.** Pure encoder modules in `src/replay/highlightEncoder.ts` etc. Vitest covers logic; Phaser glue in scene side.

## Soul checks

- The clip player gets is the postcard of the run — must look great. `ART_STYLE_BIBLE.md` palette consistency in re-rendered output.
- `GAME_FEEL_RESEARCH.md` §moment anatomy — highlight clips should be ≤8 s and capture the satisfying beat, not the lead-up.
- Voice Card: highlight modal copy in Hearth register ("Save the bonny moment").

## Risk + descope levers

If timeline slips:
- Drop GIF fallback; ship WebM-only with "your browser doesn't support clip export, use Chrome/Firefox" message. (-2 days)
- Drop watermark; keep brand off v1. (-1 day)
- Drop clipboard copy; keep download-only. (-1 day)

If bundle budget blown:
- Cut MediaRecorder, use Canvas-to-image-sequence + GIF only. Smaller bundle, larger output files.

## Future stretch (Phase 3 — not in this prompt)
- Audio sync (record audio in parallel, mux client-side via WASM remixer).
- Cinematic mode (W79 reference) — script-driven slow-mo replay through the run for "highlights of an entire run" video.
- Cloud upload (after P3 Cloud Saves ships, if at all).
