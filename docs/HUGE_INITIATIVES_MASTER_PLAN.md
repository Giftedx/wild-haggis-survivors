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
| V2 | Variants pack | 14 → 15 variants (Witch's Hare added 2026-04-28). 16th variant — Morningside Haggis (posh Edinburgh, pearl brooch, "ane" voice, blank modifier by design) shipped 2026-05-23. Shipped 2026-04-24. |
| U1 | Runes | 30 rule-stack cards, conditions + effects in evaluator pair. Shipped 2026-04-25. |
| E1 | Seasonal events | 14 events with calendar gating (Burns Night, Beltane, Samhain, Hogmanay + 10 more, incl. Culloden). Shipped 2026-04-24/29; Culloden added 2026-05-24. |
| C2 | Weapon lore pass | 103 EN flavour leaves + 30 SCS rune overlays. Shipped + truth-up 2026-04-26. |
| B1 | Banter density push | 5 phases of new authored lines across all contexts. Shipped 2026-04-26. |
| B5 | Biomes charter | Phases 0–2 (gloaming + seawrack + haar + frost). Shipped 2026-04-29/30. |
| N1 | Nicnevin (boss #2) | Wild Hunt gem-pull. Shipped 2026-05-09. |

Plus the 2026-05-09 mechanics sprint: Stance Toggle (Q), Shinty Parry (E), Clootie Wager landmark, Cairn Stacking, Race the Beithir, Sgian Dubh + Sgian Geal, Shinty Stick + Caman Storm, Stag Antler + Monarch's Charge, Field Note Pickup, Lemmings Easter Egg, Sporran Deck Phase 0+1, Taxman Grudge Ledger.

| MR1 | The Moor Remembers (V1) | Persistent cross-run cairns + Old Drover hidden grandfather voice arc. Shipped 2026-05-22. |
| MR2 | The Moor Remembers (V2 — Cailleach Gauntlet) | 7-cairn-touch trigger + candle ring at 14:00 + Cailleach boss at 15:00 with new `wail` behaviour. Win → wreathed cairns + Stormcrown relic + Cailleach's Mantle tartan. Lose → extinguished candles (cairns abide). Schema v10→v11. Shipped 2026-05-22. |
| WLW | Wild Living World — Whistle-Call Companions (Phases 1–4) | 4 companions in stable unlock chain: sheepdog (default), stoat_scout (3 clootie wagers), golden eagle (Cailleach Gauntlet win), kelpie_foal (first Each Uisge kill). Companion picker in Gran's Croft; `livingWorldUnlocks` save bag (schema v23); null opt-out path. All 4 shipped 2026-05-23. |

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
- **W27 Capture & share** — Phase 0 postcard prototype shipped 2026-04-17/18; Phase 2 screenshot + rolling clip export + audio tap + clipboard path shipped 2026-04-22/26. 2026-05-11: capture reliability hardening added MP4 container fallback, extension-correct filenames, and explicit unsupported-browser feedback for F9. **2026-05-11 (later same day): W82 seed-share URLs landed** — Game Over "↗ share this run" link copies a `?run=<seedCode>&v=<variant>&c=<curse>` deep link to the clipboard; recipients visiting the URL skip the menu and start in Game with the sharer's exact starting conditions (seed + variant + curse), banner toast confirms what loaded. Builds on the deterministic T1 replay foundation (ADR-0002): the recipient still plays their own inputs — this is a setup share, not a frame-by-frame replay. Codec lives at `src/utils/sharedRunUrl.ts`; BootScene router branch + URL scrub via `history.replaceState`; e2e covered by `e2e/seed-share-url.spec.ts`. **2026-05-11 (W82 V2): challenge-mode share URLs** — the codec now also carries `t` (seconds survived) + `o` (`v` victory / `d` death) so the recipient's banner gains a Hearth-voice "↗ Shared run · Classic · Heavy Legs · 12:34 to beat / outlast" tail. Codec parses defensively: tampering / partial params / out-of-range times degrade the challenge to null while the setup half still resolves. **2026-05-11 (W82 Phase 3): boss-kill highlights** — on every boss kill (any key — the callback is key-agnostic; the original 7 + nuckelavee / earl_beardie / black_douglas added 2026-05-24 are all covered) `ClipRecorder.snapshot()` lifts a non-destructive copy of the rolling 15s buffer into `GameScene.bossKillHighlight`. The recorder keeps rolling for future kills (a subsequent boss replaces the held snapshot, latest-only by design — memory cap ~6 MB). At Game Over a "🎬 Save Gordon kill" link appears on its own row beneath the existing capture links, downloading `whs_highlight_<variant>_<boss>_<mm-ss>_<date>[_<seed>].<webm|mp4>` straight from the held Blob. The link is gated on captureEnabled + `getBossKillHighlight() != null`, so non-boss runs keep the existing tighter layout. **2026-05-24: Web Share API integration** — the "↗ share this run" link now uses `navigator.share()` on mobile / Chrome 86+: priority order is (1) native share sheet with postcard image + URL (file canShare), (2) share sheet URL-only, (3) clipboard URL copy fallback. Postcard blob built synchronously within the click handler to stay inside the user-activation window. `renderPostcardBlob()` added to `postcard.ts`. Still open: a local "friends' challenges" surface that tracks attempted-vs-beaten challenges over time.
- **Wee Tales (run-end prose epitaph)** — ✅ shipped 2026-05-11. A single italic 1–2 sentence procedural prose line closes every run, rendered as a soft footer below the Game Over action button row. `src/utils/weeTale.ts` exposes `computeWeeTaleTags(ctx)` + `pickWeeTale(ctx, rngSample)` — pure picker that filters a tag-driven catalogue (`requires`/`forbids` constraints), weights matches by 4^specificity so a memorable run (e.g. Taxman + post-bell death) wins the pool over generic fallbacks, and returns an `{ i18nKey, params }` descriptor the scene resolves through `t()`. Catalogue: 17 templates (10 death + 7 victory) ranging from single-tag fallbacks to tier-3 specifics (`death.taxman_postbell`, `victory.three_bosses`). Hearth-voice register per `docs/VOICE_CARD.md` — grave-warm for death, warm-without-bragging for victory, no maudlin / saccharine. EN + SCS parity locked by a new fence at `src/core/i18n.locale.test.ts` (every EN `ui.weeTale.*` leaf must have a Scots translation). Seed-deterministic: the wee-tale sub-RNG is branched off `payload.runSeed` (XOR'd with a fixed magic to isolate it from gameplay RNG streams), so the same run always closes with the same line. Boss-kill roster + biomes-visited threaded through `GameOverPayload` via `RunExitComposer.getBossKilledKeys` / `getBiomesVisited`. E2E in `e2e/wee-tale.spec.ts` asserts both a victory-triple-boss render and a Taxman-death render. **v2 shipped 2026-05-22:** variant-voiced lines (Cailleach / Glaswegian / Doric Quinie / Burns's Wee Beastie — 4 each = 16 templates) + 2 universal `{name}`-bearing lines, gated by a synthetic `has_name` tag so empty / missing runNames never render as literal `{name}`. Picker's `4^specificity` routing makes the variant choice the dominant signal for memorable runs (e.g. Cailleach + Taxman victory lands on `ui.weeTale.variant.cailleach.victory_taxman` decisively). Burns citations are verbatim from Kinsley (see `docs/C2_BURNS_PROVENANCE.md` §"Wee Tales v2"). EN+SCS parity locked. Spec: `docs/superpowers/specs/2026-05-22-wee-tales-v2-design.md`. **v3 shipped 2026-05-23** (`7b01301` + `a35dc7b`): 10 of the remaining 11 variants covered — witch_hare (Gowdie confession-Scots), anticlockwise (wry mirror), wee_ghostie (spectral-gentle), laird (estate-Scots), selkie (tidal-lyrical), moor_runner (Hearth/velocity), iron_belly (Hearth/stoic), glen_forager (Hearth/forager), surefoot (Hearth/balance), pipe_breath (Hearth/breath). VOICE_CARD shipped entries added for the 5 new distinct registers. classic intentionally uses generic pool only. **v4 shipped 2026-05-24** (`6902252`): peerie_shetlander added — 5 templates (death_baseline, death_short, death_nuckelavee, victory_baseline, victory_epic) in Shetlandic register (Norse-inflected, sea-stoic, da/du/voe/skerry orthography). EN+SCS parity complete. **v5 shipped 2026-05-24** (`c293ff7`): 18 biome-contextual templates (1 death + 1 victory × 9 biomes: bog/loch/pine/heather/coastal/haar/frost/cairngorm/glen_coe). Tier-2 requires (mode + biome only, no has_name) so variant-voiced tier-3 lines still win when a named variant is active. All biome tags now consumed by the catalogue. Wee Tales: **complete** — all 27 non-classic variants have baselines; all 9 biomes have atmospheric lines; 15+ tier-4 cross-combos for thematic variant×boss moments.
- ~~**The Moor Remembers V2 — Cailleach Gauntlet.**~~ ✅ Shipped 2026-05-22. Touch 7 cairns by 14:00 → candle ring lights, Cailleach (Tier-2 boss with new `wail` behaviour) spawns at 15:00. Win wreathes the 7 cairns (gold + double buff) + drops Stormcrown relic (restricted-drop, +18% damage + 6% crit-freeze) + unlocks `cailleach_mantle` tartan (winter-frost palette) via new `ach_crown_the_cailleach` achievement. Lose extinguishes the candles — diverges from the original V2 sketch ("all cairns wipe") to preserve the moor as memory. Spec: [`docs/superpowers/specs/2026-05-22-moor-remembers-v2-design.md`](superpowers/specs/2026-05-22-moor-remembers-v2-design.md). Schema bumps v10 → v11.
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
