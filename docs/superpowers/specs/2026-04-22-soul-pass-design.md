# Soul Pass — Clip Audio + Ambient Wildlife design spec

**Date:** 2026-04-22
**Scope:** Two independent soul-forward features shipped in one session. Each is small and bounded; each has its own kill criterion; each can be reverted without touching the other.

**Feature A — Clip audio track.** Extends W27 Phase 2 ClipRecorder (shipped `4fda7ab`) to capture the shared AudioContext alongside canvas video. Current clips are silent; Phase 3 adds audio so shared clips carry the game's feel.

**Feature B — Ambient wildlife.** New `WildlifeSystem` spawns three non-combat creatures (hare, red deer, buzzard) that flee player/combat and populate the moor between fights. Fills the "empty-arena" gap flagged in `docs/DESIGN_IDEAS.md` §7.

---

## 1. Problem statement

### Feature A

Phase 2 silent clips land in Discord without the procedural-music heartbeat or the boss fanfare that made the moment. The player lived a full sensory beat; the clip captures only the visual half.

### Feature B

Twenty-four combat entity types ship. The moor has **zero** non-combat life. Between combat beats — during the first minute, between waves, standing at a Standing Stone pick — the world is silent pixel grass. DESIGN_IDEAS §7 explicitly flagged this: *"Non-combat wildlife — red deer, hares, buzzards, otters. Flee combat; gather at burns. Cheap soul if scoped tight."*

---

## 2. Non-goals (both features)

- **No mobile-specific path.** Both features work on desktop-first; mobile playtest deferred to W95.
- **No new runtime dependencies.** Everything uses browser-native APIs (MediaStream, Phaser Arcade).
- **No replay-determinism concerns for Feature A.** Clip capture is downstream of render; doesn't touch game state.
- **Feature B is NOT combat:** wildlife never collides with projectiles, never takes damage, never drops XP or gold, never blocks movement, never shows on minimap.

### Feature A non-goals

- **No audio mixing UI.** Clip captures whatever the player hears. Music volume / SFX volume already ship via SettingsManager.
- **No music-only or SFX-only clip modes.** Single audio track, whole output.
- **No audio-only export.** Clips remain video+audio; audio-only is a different surface.
- **No Safari-specific workaround.** If Safari's multi-track MediaRecorder throws, we fall back to silent clip — user still gets a file.

### Feature B non-goals

- **No breeding / population dynamics.** Creatures spawn, wander, flee, despawn. No simulated ecology.
- **No interactable creatures** (pet-the-deer, feed-the-hare). Pure ambience.
- **No new biomes**. Creatures spawn in existing biomes, weighted per creature.
- **No ambient creature sounds.** Silent. Reason: AudioSystem budget is tight; creature-chirps would clutter the mix.
- **No creature animation beyond 2 states.** Idle + moving frames only. Secondary polish ships later if needed.

---

## 3. Feature A — Architecture (Clip Audio Track)

### 3.1 Audio destination plumbing

`src/systems/audioContext.ts` owns the shared `AudioContext` + output compressor. Current signal graph:

```
[AudioSystem SFX nodes] ─┐
                         ├─> DynamicsCompressor ─> ctx.destination  (speakers)
[musicEngine nodes] ─────┘
```

Phase 3 adds a parallel tap **after** the compressor, into a `MediaStreamAudioDestinationNode`:

```
... ─> DynamicsCompressor ─┬─> ctx.destination  (speakers)
                           └─> MediaStreamAudioDestinationNode  (recorder tap)
```

New export in `audioContext.ts`:

```typescript
export function createRecordingAudioStream(): MediaStream | null;
```

Returns the `.stream` of a newly-created destination node, or `null` if AudioContext isn't available. Caller holds the stream; disconnecting it is caller responsibility.

Singleton behaviour: one destination node is kept and reused across calls. Disconnecting it on scene shutdown releases the tap.

### 3.2 ClipRecorder extension

`ClipRecorder.start(audioStream?: MediaStream)` — optional arg. When present:
1. Combine canvas stream + audio stream tracks into one `MediaStream`.
2. Pass combined stream to `new MediaRecorder(combined, { mimeType })`.
3. On failure (Safari multi-track quirks), catch, log warn, start again with canvas-only stream. Clip still saves, just silent. `selectedMimeType()` reports which path taken.

New public method `hasAudio(): boolean` — true when the active recorder was constructed with audio.

### 3.3 GameScene wiring

In `create()`, after `ClipRecorder` construction (lines ~1075 from Task 10):

```typescript
if (this.clipRecorder?.isAvailable()) {
  const audioStream = createRecordingAudioStream();
  this.clipRecorder.start(audioStream ?? undefined);
}
```

In `shutdown()` hook, after `clipRecorder?.stop()`, call a new `disposeRecordingAudioStream()` to release the destination node.

### 3.4 Error handling

| Failure | Behaviour |
|---|---|
| AudioContext unavailable (pre-user-gesture) | `createRecordingAudioStream()` returns null; start() silent-clip path |
| `createMediaStreamDestination` throws | Catch, return null, silent-clip path |
| Combined-stream MediaRecorder construction throws (Safari) | Catch, retry with canvas-only, log warn once |
| Audio track becomes silent mid-record (muted tab) | Acceptable — user muted it |

### 3.5 Kill criterion

- Primary: `.webm` files saved via F9 contain an audio track when played back (verified manually in browser + via `npm run build` preview).
- Secondary: bundle delta <3 KB (audioContext wiring + ClipRecorder flag).

If kill criterion fails, revert Feature A commits. Feature B is independent and stays.

---

## 4. Feature B — Architecture (Ambient Wildlife)

### 4.1 Data

`src/data/wildlife.ts` — new file:

```typescript
export type WildlifeKey = 'hare' | 'red_deer' | 'buzzard';

export interface WildlifeDef {
  key: WildlifeKey;
  spriteKey: string;
  scale: number;
  baseSpeed: number;           // idle wander speed px/s
  fleeSpeed: number;           // when threatened
  fleeRadius: number;          // detection radius for player
  enemyFleeRadius: number;     // detection radius for enemies
  biomeWeights: Record<BiomeId, number>;  // 0 = never spawn here
  aerial: boolean;             // if true: skips enemy-flee logic + renders above combat layer
}

export const WILDLIFE_DEFS: Record<WildlifeKey, WildlifeDef>;
```

Three entries with hand-tuned values (exact numbers set during impl).

### 4.2 Sprite drawers

`src/art/sprites/wildlife/hare.ts`, `red_deer.ts`, `buzzard.ts`. Each exports a single `draw<Name>(g, x, y, frame)` function following the existing enemy sprite pattern in `src/art/sprites/enemies/*`. Baked to textures in `BootScene` via the existing atlas-baking pattern.

Two frames per creature (idle, moving) — keeps atlas compact. Texture keys: `wildlife_hare_idle`, `wildlife_hare_move`, etc.

Palettes: soft naturalistic tones (browns, cream, slate for buzzard) — deliberately low-saturation so eye doesn't confuse them with combat entities.

### 4.3 WildlifeSystem

`src/systems/WildlifeSystem.ts`:

```typescript
export class WildlifeSystem {
  constructor(scene: Phaser.Scene, biomeManager: BiomeManager, reduceParticles: () => boolean);
  update(time: number, delta: number, player: Player, enemies: Phaser.GameObjects.Group): void;
  shutdown(): void;
  getActiveCount(): number;  // for perf test / debug
}
```

Internals:
- Pool of up to 5 active `AmbientCreature` instances (Phaser sprite + state).
- Spawn rolls every 3–5 s: 40% hare, 25% deer, 20% buzzard, 15% skip. Weighted by biome (buzzard biome weight 0.3 in bog, etc).
- Spawn position: off-screen by 100–200 px in random direction from camera bounds. Despawn when >500 px off-screen.
- State machine per creature: `wander → flee → wander`. Flee triggered by distance check to player or nearest enemy (skipped for aerial).
- No physics body for projectile collision — just a Phaser sprite with simple velocity integration in the system update loop.

### 4.4 GameScene wiring

```typescript
this.wildlifeSystem = new WildlifeSystem(
  this,
  this.biomeManager,
  () => getSettingsManager().load().reduceParticles,
);
```

Update call threaded into the existing per-frame loop. Shutdown hook calls `wildlifeSystem.shutdown()`.

### 4.5 Opt-out

When `reduceParticles` is true (the existing ambient-decoration gate), `update()` early-returns and despawns all active creatures. Matches existing ambient pattern (MainMenu hearth, Settings heather strip).

### 4.6 Determinism contract

Wildlife uses `Math.random()` for spawn rolls — this is explicitly OK per `rng.ts` policy for cosmetic paths (matches orbit/bob/particles in Enemy.ts). Not recorded by ReplayRecorder; playback runs with fresh Math.random() so wildlife is visually different each playback, which is fine.

### 4.7 Performance budget

- 5 creatures × 4 updates/frame = 20 sprite updates. Negligible.
- Per-frame flee-distance check: for each creature, 1 player distance + nearest-of-N-enemies distance. N capped at 400; using squared-distance comparison. Budget <0.5 ms/frame.

### 4.8 Kill criterion

- Primary: 60 s of gameplay with wildlife on vs off shows FPS delta <2 fps (measured in preview build).
- Secondary: no wildlife visible on minimap, no wildlife-player collision damage, no wildlife-projectile interaction.

If either fails, cap active count to 3 (instead of 5), and/or disable buzzards (aerial was cheapest to cut). If still failing, revert whole feature.

---

## 5. Testing

### Feature A

- `src/systems/audioContext.test.ts` — extend existing. Tests: `createRecordingAudioStream()` returns MediaStream when AudioContext present; returns null when absent; repeated calls reuse the same destination node; `disposeRecordingAudioStream()` releases the node.
- `src/utils/clipRecorder.test.ts` — extend existing. Tests: `start(audioStream)` constructs recorder with combined tracks; `start()` without audioStream matches current behaviour; Safari-fail path falls back to canvas-only stream; `hasAudio()` reflects the active track set.

### Feature B

- `src/data/wildlife.test.ts` — sanity: every WILDLIFE_DEF has non-negative weights summing to positive across biomes; scale + speed values in plausible ranges; `aerial` buzzard's enemy flee radius is 0.
- `src/systems/WildlifeSystem.test.ts` — pure state-machine tests: wander → flee transition on proximity; flee → wander transition after timer; despawn on off-screen; reduceParticles early-return. Uses a mock scene + mock Player with distance helpers.

### E2E

- Extend `e2e/capture-smoke.spec.ts` with one assertion: `download.suggestedFilename()` matches `.webm` AND (via `page.evaluate` inspection) the ClipRecorder reports `hasAudio() === true`.
- No new e2e for wildlife — visual-only feature, smoke via build + manual.

---

## 6. Rollout order

1. **Feature A first** (smaller, extends existing module, lower risk, reversible via single commit range).
2. **Feature B second** (net-new system + 3 sprite drawers).

Each feature ships as its own commit cluster. A revert of Feature B doesn't touch audio work; a revert of Feature A doesn't touch wildlife.

---

## 7. Risks summary

| Risk | Mitigation |
|---|---|
| Safari multi-track MediaRecorder throws | Silent-clip fallback (Feature A §3.4) |
| Audio tap changes music/SFX mix audibly | Destination node is parallel-after-compressor — signal path to speakers unchanged |
| Wildlife sprites read as enemies | Low-saturation palette + softer silhouettes + no minimap dot |
| Wildlife spawn clusters feel artificial | Randomized per-frame timer, weighted biome spawn, not uniform grid |
| 5-creature cap too many on low-end | `reduceParticles` already disables them entirely; dynamic cap follow-up if needed |
| Replay determinism break | Wildlife uses Math.random (cosmetic-OK per rng.ts policy); Feature A never touches game state |

---

## 8. Out-of-scope extensions (future work)

- Audio-aware clip highlights (auto-select 15s window around loud peaks).
- Wildlife interactions: feed a hare, pet a deer unlock.
- Gather-at-burns behaviour for deer/otters (requires burn hazards or water tiles first).
- Seasonal variants (white hare in winter palette).
- Wildlife audio (deer call, buzzard cry) — deferred per §2.

---

*Spec complete. Next: `superpowers:writing-plans` generates the implementation plan with checkbox steps.*

---

## Verification — Feature A (2026-04-22)

- **Bundle delta** over W27 Phase 2 baseline (`221.50 KiB` gzip): **+0.27 KiB** gzip (new total: `221.77 KiB`).
- **Kill criterion** (<200 KiB combined over all capture work, per W27 master plan): ✅ PASS.
- **E2E audio assertion** (F9 test in `e2e/capture-smoke.spec.ts`): ✅ PASS. `getClipRecorder().hasAudio() === true` asserted in headless Chromium.
- **Manual playback verification**: ⏸ Deferred. Agent cannot open a .webm in a media player. When a human saves a clip via F9 during a live run, the .webm should contain an audio track. If playback reveals silent audio, check `getAudioContext()` liveness (post-user-gesture) at the moment `createRecordingAudioStream` is called — the tap only produces signal if the shared compressor is active.
