# R1 M4.5 — manual playtest followups

> **STATUS:** Open. Created 2026-04-24 after M4.5 ship (`214e9ce`).
>
> The M4.5 polish pass landed all 18 relic effect wires behind unit tests and automated CI. These items need a human at the keyboard to verify *feel* — things tests can't judge.

## P4 bodhran_skin — on-beat damage window

**Signal we can't test in vitest:** does the ±80ms on-beat window *feel* rewarding, or is it invisible?

- Implementation samples quarter-note phase from `ctx.currentTime % (60000/bpm)` — no beat-event tracking. With dynamic `rhythmBPM` (Conductor mood-driven), the phase anchor shifts whenever BPM changes. Worst case a player feels like the window drifts mid-run.
- Plan P4 noted risk: "too subtle to notice. Consider adding a one-frame flash or pitch-up sting on the weapon SFX when an on-beat hit fires, gated by reduceParticles."
- **Do:** start a run, hold `bodhran_skin`, kill 30+ enemies across 60s, judge whether the +20% reads. If invisible, pull the P4 VFX/SFX cue from the plan's risk section before pick-rate telemetry lands.

## P5 fingals_horn — Fianna summon feel

- 3 spirits, 260px/s, 8 damage/hit, 350ms per-enemy cooldown, 10s lifetime. Numbers tuned from intuition, not playtest.
- Worth checking:
  - Do spirits feel *useful* in a mid-run encounter, or do they evaporate too fast?
  - Does the 350ms per-enemy cooldown make them feel anaemic against elites?
  - Does 3 spirits at a spawn ring feel "heroic" or "cluttered"?
  - Sprite readability — `fx_fianna_spirit` is 24×24 bone-ivory; does it get lost against pine/heather biomes?
- **Do:** sound the horn during a high-density wave. If spirits underperform, bump `FIANNA_SPIRIT_DAMAGE` (in `src/entities/FiannaSpirit.ts`) before changing AI or sprite.

## P2 pictish_compass — minimap pin clutter

- Plan P2 risk: "with 3 chests + reliquary + relic drops, minimap could get noisy."
- **Do:** trigger a run with multiple simultaneous relic drops (farm elites in W1), hold `pictish_compass`, judge whether the pin soup is helpful or overwhelming on a 150px minimap.

## P1 cairn_stone — heather-biome detection correctness

- Biome voronoi can put the player near a boundary; heather-adjacent-but-not-heather kills won't fire the pulse. Expected behaviour per spec, but worth eyeballing for confusion.
- **Do:** spawn in a clearly-heather area, kill enemies, confirm the ~every-5s magnet pulse reads as "because I'm in heather". If players can't tell *why* the pulse fired, consider a one-frame heather-tinted ring VFX at the kill site.

## Kill-criteria follow-through

Once `?devRelicStats=1` has 30+ runs of data:
- Any relic >70% pick rate → nerf in `src/systems/relics/relicEffects.ts`.
- Any relic <5% → buff in the same file.
- The pure-fn layer makes each of these a one-file edit (see `project_r1_relics_status` memory).
