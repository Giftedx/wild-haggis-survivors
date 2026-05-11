# Initiatives — What's Done, What's Open, What Won't Ship

> **2026-05-10 reframe.** This doc was previously titled "Huge Initiatives — Master Plan" with a flagship roster + kill criteria column. The kill criteria referenced telemetry that doesn't exist (no users, no analytics) — they were aspirational gating language for a single-author continuous-deployment passion project. Per [`docs/REVIEW.md`](REVIEW.md) C1 + S3, the ship-target framing is gone. The project posture is **continuous live deployment** at [`wild-haggis-survivors.pages.dev`](https://wild-haggis-survivors.pages.dev); features land + improve in place. Historical "kill criteria" are preserved in the archived planning notes but no longer treated as gates.

> **Doing now:** features ship when they're ready, not against a roadmap. The list below is "what's interesting to me right now" + "what's blocked on humans" + "what I've decided not to build".

---

## What's done (shipped to live)

Initiatives that landed in the live build between 2026-04-09 and 2026-05-09.

| ID | Initiative | Outcome |
|---|---|---|
| W2 | Moor Road multi-act campaign | 3 acts, 6 routes, Skip Intermissions opt-out. Shipped 2026-04-16. |
| W66 | Ironmoor permadeath | Opt-in alt mode, separate leaderboard. Shipped 2026-04-16. |
| W18 | Bilingual Scots / English | EN reference + SCS overlay; banter parity-fenced in CI. Shipped 2026-04-16/18. |
| T1 | Deterministic replay | 3 phases: recorder + best-effort playback + fixed-step physics. Shipped 2026-04-17/18. |
| F1 | Shader pipeline + Haar fog | First Phaser 4 custom shader; haar density per-biome. Shipped 2026-04-24. |
| H1 | Gran's Croft hub | Persistent hub between runs with trophies + variant selection + bookshelf entry to Almanac. Shipped 2026-04-24. |
| M1 | Moor Road multi-node | 3-5 node micro-maps per act, 7 node types, 56 def entries. Shipped 2026-04-24. |
| C1 | Highland Almanac | Discovery-log meta hub (Beasties / Weys / Finds / Banter). Shipped 2026-04-24. |
| R1 | Relics third tier | 18 handcrafted relics, 3-slot cap, drops from elites + bosses. Shipped 2026-04-24. |
| V2 | Variants pack | 14 → 15 variants (Witch's Hare added 2026-04-28). Shipped 2026-04-24. |
| U1 | Runes | 30 rule-stack cards, conditions + effects in evaluator pair. Shipped 2026-04-25. |
| E1 | Seasonal events | 13 events with calendar gating (Burns Night, Beltane, Samhain, Hogmanay + 9 more). Shipped 2026-04-24/29. |
| C2 | Weapon lore pass | 103 EN flavour leaves + 30 SCS rune overlays. Shipped + truth-up 2026-04-26. |
| B1 | Banter density push | 5 phases of new authored lines across all contexts. Shipped 2026-04-26. |
| B5 | Biomes charter | Phases 0–2 (gloaming + seawrack + haar + frost). Shipped 2026-04-29/30. |
| N1 | Nicnevin (boss #2) | Wild Hunt gem-pull. Shipped 2026-05-09. |

Plus the 2026-05-09 mechanics sprint: Stance Toggle (Q), Shinty Parry (E), Clootie Wager landmark, Cairn Stacking, Race the Beithir, Sgian Dubh + Sgian Geal, Shinty Stick + Caman Storm, Stag Antler + Monarch's Charge, Field Note Pickup, Lemmings Easter Egg, Sporran Deck Phase 0+1, Taxman Grudge Ledger.

---

## What's open

Work I'd like to do, in roughly the order I'd like to do it. None has a deadline; deadlines mean nothing on a continuous-deployment passion project.

### Active or near-term

- ~~**Backfill e2e smoke specs for the 2026-05-09 sprint mechanics.**~~ ✅ Shipped 2026-05-10. 4 new + 3 fixed Phase-3 specs in `5d9edf6`; grudge event-split fix in `0a1915b`. 10 mechanic specs pass + 1 declaratively skipped. Closed REVIEW C3.
- ~~**Sporran Deck Phase 2.**~~ ✅ Shipped 2026-05-10. Phase 2 chronicle persistence + v19 save migration + v4 replay blob in `e183bcb`. Phase 3 pool 12→18 with deed/seasonal/variant gates in `f514cb8`. Pip-strip hover tooltip in `1c3dd31`. Spec at `docs/superpowers/specs/2026-05-10-sporran-deck-phase2-design.md`.
- **PEAT photosensitivity audit** ([`docs/A1_PEAT_AUDIT.md`](A1_PEAT_AUDIT.md)). Resolved-by-acceptance per REVIEW C5: `reduceFlashing` defaulted ON + first-launch photosensitivity splash + README §"Photosensitivity" discloses unaudited status. Paid PEAT pass remains a candidate, not a blocking gate.

### Blocked on humans (not me)

- **Native-speaker review** for Doric / Shetlandic / Gaelic / Burns Canongate content (`docs/C2_DIALECT_REVIEW.md` + `docs/C2_BURNS_PROVENANCE.md`). Live build now ships a cultural-content first-launch splash inviting feedback; reviewers TBD.
- **W95 Mobile rework** — playtest matrix at `docs/MOBILE_DEVICE_TEST_MATRIX.md` pending hardware. Phase 0 mobile safe-area shipped; thumb-zone full rework deferred.
- **P3 Cloud saves** — architectural ratification done ([ADR-0006](adr/0006-cloud-save-backend.md)), Worker prototype shipped. Outstanding: privacy-policy text at `/privacy.html`, GDPR controller legal name + UK address, Resend account creation, Cloudflare D1 provision.

### Open candidates (interesting but not picked)

- **W71 Skeletal animation rig** — Phase 0 prototype + Phase 1 enemy animation + Phase 2 secondary motion shipped 2026-04-22/23. Full rig still open; JS hot path is covered by `src/animation/animationPerf.bench.test.ts`, and boot atlas bake cost is guarded by `e2e/w71-atlas-bake-budget.spec.ts`. 2026-05-11: ADR-0005's lazy-bake descope landed (`src/scenes/boot/variantAtlasBaker.ts` + `variantAtlasKeys.ts`); boot bake dropped from ~430 ms to ~251 ms by deferring non-active-variant atlases to `GameScene.create()`. Next descope candidate is enemy spawn-time lazy bake; deferred until a measurable trigger fires.
- **W27 Capture & share** — Phase 0 postcard prototype shipped 2026-04-17/18; Phase 2 screenshot + rolling clip export + audio tap + clipboard path shipped 2026-04-22/26. 2026-05-11: capture reliability hardening added MP4 container fallback, extension-correct filenames, and explicit unsupported-browser feedback for F9. **2026-05-11 (later same day): W82 seed-share URLs landed** — Game Over "↗ share this run" link copies a `?run=<seedCode>&v=<variant>&c=<curse>` deep link to the clipboard; recipients visiting the URL skip the menu and start in Game with the sharer's exact starting conditions (seed + variant + curse), banner toast confirms what loaded. Builds on the deterministic T1 replay foundation (ADR-0002): the recipient still plays their own inputs — this is a setup share, not a frame-by-frame replay. Codec lives at `src/utils/sharedRunUrl.ts`; BootScene router branch + URL scrub via `history.replaceState`; e2e covered by `e2e/seed-share-url.spec.ts`. **2026-05-11 (W82 V2): challenge-mode share URLs** — the codec now also carries `t` (seconds survived) + `o` (`v` victory / `d` death) so the recipient's banner gains a Hearth-voice "↗ Shared run · Classic · Heavy Legs · 12:34 to beat / outlast" tail. Codec parses defensively: tampering / partial params / out-of-range times degrade the challenge to null while the setup half still resolves. **2026-05-11 (W82 Phase 3): boss-kill highlights** — on every boss kill (gordon / tour_bus / taxman / each_uisge / nicnevin / the_laird / hunter_general) `ClipRecorder.snapshot()` lifts a non-destructive copy of the rolling 15s buffer into `GameScene.bossKillHighlight`. The recorder keeps rolling for future kills (a subsequent boss replaces the held snapshot, latest-only by design — memory cap ~6 MB). At Game Over a "🎬 Save Gordon kill" link appears on its own row beneath the existing capture links, downloading `whs_highlight_<variant>_<boss>_<mm-ss>_<date>[_<seed>].<webm|mp4>` straight from the held Blob. The link is gated on captureEnabled + `getBossKillHighlight() != null`, so non-boss runs keep the existing tighter layout. Still open: a unified run-end share surface (one button that produces postcard + clip + share URL) + automatic highlight reel selection + a local "friends' challenges" surface that tracks attempted-vs-beaten challenges over time.
- **Bodach Glas (boss #3)** — flagged in N1 follow-ups; cultural review pending (Solway Remnant lineage).
- **B5 Phase 3 Edinburgh biome** — gated on cultural consultation per `docs/research/CULTURAL_SENSITIVITIES_RESEARCH.md §2.7`.

---

## What won't ship

Decisions to NOT build, with the reasoning preserved so future-self doesn't re-litigate.

| Idea | Why not |
|---|---|
| WebGPU for pixel art (A2) | Solves no problem we have. Phaser 4 + Arcade is fine at our scale. |
| WASM hot path (A4) | Same — no measured bottleneck. |
| E2E encrypted saves (B1 old) | Browser game; threat model doesn't justify the UX cost (key recovery is brutal). |
| Monorepo for one game (G1) | Nothing to monorepo with. |
| Plugin API (G4) | One developer; nothing to plug in. |
| Academic partnership row (H3) | Not a product feature. |
| PvP / 3D / LLM-narrative (I-moonshots) | Different products. |
| Voronoi-explainer tooltip as flagship (W33) | It's a tooltip. |
| Companion app (W68) | Different product. |
| Diegetic patch notes (W97) | Bad UX — players want changelogs out-of-game. |
| "Moor Library" content rollup (W100) | Aggregates 17 features as one row; cannot legally PDF-export licensed Scottish material. |
| Enemies slowing 60% (M20) | Breaks the survivors-genre core loop. |
| Soul Weave (W1) | An ADR, not a program. |
| A11y-as-Aesthetic (W69) | A naming exercise; needs disability-community consult before shipping. |
| Ethics Charter (W80) | A blog post until externally audited; not a feature. |
| Steam release with collaborators | Decided 2026-05-10: no commercial-release framing. The build is its own product. |
| Telemetry / analytics | Decided 2026-05-10: passion project, not a measured product. |

---

## Reframe note (2026-05-10)

The previous version of this doc had a "Real flagships (pick ONE next; rest are parking lot)" section + per-row kill criteria like *"If 15-relic launch tests show build dominance (one relic picked >60% of runs), rebalance and defer launch"*. There are no launch tests; there is no telemetry; the kill criterion can never fire. That whole register treated the project as commercial infrastructure-in-progress when in fact it's a continuously-deployed live build that's already its own product. This reframe drops the language and tracks what's true: **shipped**, **open**, **won't ship**.

If the project posture changes — explicit ship target, paid release, telemetry — restore the kill-criterion framing then. Until then, the three-bucket list is the honest one.
