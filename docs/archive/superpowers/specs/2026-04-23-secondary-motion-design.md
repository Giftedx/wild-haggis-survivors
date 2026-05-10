# Secondary Motion — design spec (W71 Phase 2 slice)

**Date:** 2026-04-23
**Flagship:** W71 (Animation rig — skeletal haggis + weather-reactive motion). Master-plan S-tier row.
**Scope:** First narrow slice of W71 Phase 2. Ships true Disney-12 "secondary motion" for the player haggis via **baked keyframes + phase-offset tail** plus a **tier-gated mantle overlay** driven by run kill count. No spring-damper, no runtime rig solver — keyframes only. Fits flagship kill-criterion fallback posture by construction.
**Session size:** one session (~3–5h).

---

## 1. Problem statement

Phase 0 (player AnimationController + 2-frame drawers) and Phase 1 (30 enemy frame drawers) shipped primary keyframe animation — one texture per (state, frame). Every shape on the haggis moves on the same beat. There is no *secondary motion*: the tail does not trail the body, the back does not catch up after the haggis hurries into motion, and the kill milestones that DESIGN_IDEAS §M7 ("Heather Mantle") promises have no visual handhold.

The master plan's W71 row calls out "secondary motion for mantle, whiskers, tartan" as Phase 2 scope. DESIGN_IDEAS flags mantle patterns as explicitly blocked on the rig layer. A full skeletal solver is the risk the flagship kill-criterion guards against ("if rig inflates frame time >10%, descope to keyframe animation only"). Keyframe secondary motion IS the fallback; starting there is the disciplined path.

### Player outcome

- The haggis tail visibly *lags* the body — a felt beat of weight and cadence on walking, attacks, hurts, celebrations, deaths.
- At kill milestones (50, 250), a **heather mantle** appears on the haggis's back — a silent visual reward that carries across the rest of the run. Alpha-tweens in (motion-reduced: instant).
- Zero gameplay change. Pure visual warmth.

### Craft outcome

- Two additions to `HaggisBodyFrame`: `tailX?`, `tailY?`. Drawn by the existing `drawHaggisBody`.
- Tail offsets authored in `haggisFrames.ts` following a per-state lag rule (see §3.2). No new modules in the animation layer.
- One new sprite drawer file (`haggisMantle.ts`) + one new BootScene atlas bake loop + one new Player overlay sprite. Pattern-matched to existing accessory drawers.
- Replay-safe by construction — all state frame-indexed, mantle tier derived deterministically from kill count, no floats, no rng.

---

## 2. Non-goals

- **No runtime rig solver.** No springs, no dampers, no per-frame physics. The flagship kill criterion names "keyframe animation only" as the fallback — this slice ships the fallback as the primary.
- **No whiskers / whisker bristle.** Current haggis sprite has no whiskers. Adding them is a separate art task — deferred to a Phase 2b slice.
- **No weather-reactive motion.** No weather system exists (`grep weather src/systems` → nothing). Deferred to Phase 2c, which builds the weather director first.
- **No enemy secondary motion.** Player-only this slice. Enemy rig extension is a separate slice once the player pattern proves out.
- **No per-variant mantle *shape*.** Universal mantle shape, per-variant palette tint (`palette.fur` + `palette.bodyDark`). Handcraft bar met via the tint + the tier gating, not via 30 bespoke silhouettes.
- **No gameplay effect on the mantle.** DESIGN_IDEAS §M7 ("pulses and staggers nearby enemies at max threshold") is out of scope — this slice ships the visual only. Gameplay pulse is a followup that depends on this slice landing first.
- **No new UI copy or toast on tier cross.** Silent milestone — the mantle appearing IS the signal. Banter on mantle tier gain is deferred; EN+SCS parity cost out of scope.
- **No Chronicle surface.** Mantle tier is transient per run, does not persist.
- **No threshold playtest tuning in this slice.** Thresholds 50 / 250 ship as placeholders with tunable constants + a clear comment. First playtest pass delivers tuned numbers; structurally cheap to adjust.

---

## 3. Architecture

### 3.1 `HaggisBodyFrame` extension

Two fields added to the existing interface in `src/animation/frameDrawers/haggisBodyDraw.ts`:

```ts
export interface HaggisBodyFrame {
  readonly breathY?: number;
  readonly leftLegY?: number;
  readonly rightLegY?: number;
  readonly bodyX?: number;
  /** NEW — tail x offset (px). Positive = tail trails right. */
  readonly tailX?: number;
  /** NEW — tail y offset (px). Positive = tail sinks. */
  readonly tailY?: number;
}
```

`drawHaggisBody` applies both offsets to the two tail-nub circles (currently lines 84–88). Default 0 preserves existing frames. Every enemy drawer that piggybacks on `HaggisBodyFrame` (if any — checked during implementation) continues to work with the defaulted fields.

### 3.2 Tail lag authoring rule

**Rule:** tail-offset at frame *N* authored as if reading `body[N - lag]`, lag = 1 in all states. This is *secondary-motion-by-delay*, Disney-12 principle 6. The visual symptom on 2-frame loops (idle, hurt) is counter-phase; on longer cycles (walking, attacking, celebrating, dying) it is visibly trailing. The rule — not the symptom — generalises to enemy rigs later. Values per state:

| State | Tail lag rule | Concrete values |
|-------|---------------|-----------------|
| `idle` (2f, 2fps) | Counter-phase breath. Body inhales → tail is still on the exhale, and vice versa. | `idle[0]`: body breathY=+1, **tailY=-1**. `idle[1]`: breathY=-1, **tailY=+1**. |
| `walking` (4f, 24fps) | Tail swings side-to-side with leg-shuffle phase. Body's leg contact at frame N → tail swings opposite-direction at frame N. | `walking[0]`: **tailX=-1**. `walking[1]`: **tailX=0**. `walking[2]`: **tailX=+1**. `walking[3]`: **tailX=0**. |
| `attacking` (4f, 24fps, one-shot) | Body lunges forward, tail drags back 1 frame. | `attacking[0]`: bodyX=+1, **tailX=0**. `attacking[1]`: bodyX=+2, **tailX=-1** (still catching up). `attacking[2]`: bodyX=+1, **tailX=-1**. `attacking[3]`: bodyX=0, **tailX=0**. |
| `hurt` (2f, 30fps) | Body flinches back, tail lags forward for 1 frame before catching. | `hurt[0]`: bodyX=-2, **tailX=+1**. `hurt[1]`: bodyX=-1, **tailX=0**. |
| `celebrating` (4f, 12fps, loop) | Body hops; tail flails. Opposite-phase y on the big apex. | `celebrating[0]`: breathY=+2, **tailY=0**. `celebrating[1]`: breathY=-6, **tailY=+3** (trailing). `celebrating[2]`: breathY=-1, **tailY=+1** (catching). `celebrating[3]`: breathY=-1, **tailY=-1** (overshoot sway). |
| `dying` (3f, 12fps, one-shot) | Tail flops last. | `dying[0]`: breathY=+1, **tailY=0**. `dying[1]`: breathY=+4, **tailY=+3**. `dying[2]`: breathY=+6, **tailY=+5** (tail still falling as body is already down). |

Rationale for table-in-spec: tail values encode animation intent — reviewers should see them without reading implementation. Values captured here become the fixture for the regression test in §5.

### 3.3 Mantle overlay sprite

New file `src/art/sprites/haggisMantle.ts`:

```ts
export type MantleTier = 0 | 1 | 2;

/** Pure drawer. Draws tier shape into `g` at canvas origin. */
export function drawMantleTier(
  g: Phaser.GameObjects.Graphics,
  variant: VariantDef,
  tier: MantleTier,
): void;
```

- Canvas size: `HAGGIS_SPRITE_SIZE` (56). Matches body sprite so overlay aligns pixel-perfect.
- Tier 0: draws nothing (mantle overlay still exists on the player so alpha-tween path is uniform — simply invisible). Atlas key omitted.
- Tier 1 (partial — collar): thin arc behind the neck + upper-back. Palette `bodyDark` outline + `fur` fill at 0.7 alpha.
- Tier 2 (full — collar + cape): collar of tier 1 + extended back cape down to mid-body. Same palette.

### 3.4 BootScene mantle atlas bake

In `BootScene.create()` (graphics-texture generation requires an active scene, per existing bake pattern), new method `bakeHaggisMantleAtlas()` loops:

```ts
for (const variant of VARIANTS) {
  for (const tier of [1, 2] as MantleTier[]) {
    const g = this.add.graphics();
    drawMantleTier(g, variant, tier);
    g.generateTexture(`mantle_${variant.key}_${tier}`, 56, 56);
    g.destroy();
  }
}
```

Textures produced: 10 variants × 2 tiers = **20 textures**. (Tier 0 skipped — no texture needed, overlay stays hidden.)

### 3.5 `computeMantleTier` pure helper

New file `src/animation/mantleTier.ts`:

```ts
export const MANTLE_TIERS = {
  /** Placeholder — tune after first playtest. */
  tier1KillThreshold: 50,
  tier2KillThreshold: 250,
} as const;

export function computeMantleTier(kills: number): MantleTier {
  if (kills >= MANTLE_TIERS.tier2KillThreshold) return 2;
  if (kills >= MANTLE_TIERS.tier1KillThreshold) return 1;
  return 0;
}
```

Pure. Unit-tested. Exported constants so followup playtest passes just change numbers.

### 3.6 `Player` mantle integration

Additions to `src/entities/Player.ts`:

```ts
private mantleOverlay: Phaser.GameObjects.Sprite | null = null;
private mantleTier: MantleTier = 0;

// inside spawn()
// Tier 0 has no baked texture — create sprite with tier-1 key but hidden.
// First setMantleTier(1) will show + tween; first setMantleTier(2) will
// swap texture key then show + tween.
const key = `mantle_${this.variantKey}_1`;
this.mantleOverlay = scene.add.sprite(this.x, this.y, key);
this.mantleOverlay.setDepth(this.depth + 1);
this.mantleOverlay.setAlpha(0);
this.mantleOverlay.setVisible(false);

// inside update() — sync position + scale after body update
if (this.mantleOverlay) {
  this.mantleOverlay.setPosition(this.x, this.y);
  // Scale changes only on level-up — skip the matrix work when unchanged.
  if (this.mantleOverlay.scaleX !== this.scaleX) {
    this.mantleOverlay.setScale(this.scaleX, this.scaleY);
  }
}

public setMantleTier(tier: MantleTier, opts: { instant?: boolean } = {}): void {
  if (tier === this.mantleTier) return;
  this.mantleTier = tier;
  if (!this.mantleOverlay) return;
  if (tier === 0) {
    this.mantleOverlay.setVisible(false);
    this.mantleOverlay.setAlpha(0);
    return;
  }
  this.mantleOverlay.setTexture(`mantle_${this.variantKey}_${tier}`);
  this.mantleOverlay.setVisible(true);
  if (opts.instant) {
    this.mantleOverlay.setAlpha(1);
    return;
  }
  this.scene.tweens.add({
    targets: this.mantleOverlay,
    alpha: { from: 0, to: 1 },
    duration: 300,
    ease: 'Cubic.easeOut',
  });
}
```

**Scale propagation**: overlay reads `this.scaleX` each frame and only calls `setScale` when it has changed (level-up mechanic, rare). Overlay is not reparented — reading scale explicitly avoids inheriting transient pose mutations (hit-flash scale-pulses) from the haggis sprite.

**Depth policy**: mantle overlay at `this.depth + 1`. At time of writing no other `+1`-offset claimant exists in Player's render tree; verify during impl with a grep for `this.depth + 1`. If a conflict emerges, promote mantle to `this.depth + 2` and document in `Player.ts` next to the overlay creation.

**Cleanup**: `Player.destroy()` destroys the overlay. Scene `shutdown` sweeps scene-added objects by default; belt-and-braces explicit destroy in Player covers the rare mid-run teardown case.

### 3.7 GameScene kill-count → tier wiring

`RunScoreState` already tracks kills (R3a extraction). The tier check fires on kill increment, not per-frame:

- Option A (chosen): wrap `RunScoreState.incrementKills` with a notifier. After increment, if `computeMantleTier(kills)` differs from the Player's current tier, call `player.setMantleTier(newTier)`.
- Option B (rejected): GameScene.update() polls kills every frame and diff-checks. Wasted work, per-frame branch cost.

`GameScene.handleEnemyKill` already bumps `RunScoreState.incrementKills`. Threading the tier check inline there (via a single helper call) is the minimal surface change. No new plugin, no event bus.

**Spawn-time pre-seed:** immediately after Player spawn and after wiring the `onKillsChanged` callback, GameScene calls `player.setMantleTier(computeMantleTier(runScore.getKills()), { instant: true })`. Covers three cases uniformly: fresh run (0 → tier 0, no visible change), replay starting mid-run (kills > 0 → correct tier with no reveal tween), save-load continuing a run if that ever becomes a thing. Without this, first kill after spawn on a pre-seeded run would trigger the reveal tween for a tier the haggis should already be wearing.

### 3.8 Motion-reduce a11y

`settingsComfort` exposes a `reduceMotion` flag (existing per W45 Comfort). Before calling `setMantleTier(tier)`, GameScene checks the flag; if set, passes `{ instant: true }`. Avoids the 300ms tween. The keyframe tail lag is inherent in the bakes — cannot be "reduced" without re-authoring, and at 1–3 px amplitude it is already below the visual-motion threshold the comfort flag is guarding against.

### 3.9 Replay + determinism

- Tail lag: baked frames. Frame index comes from `AnimationController`, which is deterministic under `ReplayInput`. Byte-identical playback.
- Mantle tier: `computeMantleTier(kills)`. `kills` comes from `RunScoreState`, deterministic under replay. Byte-identical.
- Tweens: `scene.tweens` advances on scene time. Replay branch runs identical time scheduling. Tween alpha at any frame = deterministic function of tween start time.
- Rig state survives restart: mantle tier re-evaluates on spawn (`computeMantleTier(current kills)`), so a replay that jumps in at kill 300 instantly shows tier 2 without a reveal tween — correct behaviour.

No changes to `ReplayRecorder`, `ReplayInput`, `replayDeterminism.test.ts`.

**Tween determinism fallback.** Phaser 4's tween manager advances on scene update step (fixed-step since T1 Phase 3). Tween progression should be deterministic under `ReplayInput`. Impl-time verification: run the determinism regression with the mantle overlay active and one tier-cross during the replay — if byte-identity breaks, replace the 300ms alpha tween with an instant alpha set in the replay playback branch. Trivial one-line guard using the existing `whs_replay_mode` flag. Either outcome keeps byte-identical replay intact.

---

## 4. File map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/animation/frameDrawers/haggisBodyDraw.ts` | **Modify** | Add `tailX`, `tailY` fields to `HaggisBodyFrame`; apply to the two tail-nub circles. |
| `src/animation/frameDrawers/haggisFrames.ts` | **Modify** | Author `tailX` / `tailY` values per §3.2 table across all 6 states. |
| `src/animation/frameDrawers/haggisFrames.test.ts` | **Modify** | Add regression test covering every `(state, frame)` tail value per §3.2. |
| `src/animation/mantleTier.ts` | **Create** | `MANTLE_TIERS` constants + `computeMantleTier(kills): MantleTier`. |
| `src/animation/mantleTier.test.ts` | **Create** | Boundary tests (0/49/50/249/250/10000). |
| `src/art/sprites/haggisMantle.ts` | **Create** | `drawMantleTier(g, variant, tier)` pure drawer. |
| `src/art/sprites/haggisMantle.test.ts` | **Create** | Fence: every `VariantKey` accepted, tier 1/2 produces non-empty graphics ops (via command count). |
| `src/scenes/BootScene.ts` | **Modify** | Add `bakeHaggisMantleAtlas()` call in preload; bake loop per §3.4. |
| `src/entities/Player.ts` | **Modify** | `mantleOverlay` field, spawn/update/setMantleTier per §3.6. |
| `src/entities/Player.mantle.test.ts` | **Create** | `setMantleTier` state transitions, instant-mode bypass, idempotence. |
| `src/scenes/game/RunScoreState.ts` | **Modify** | Add an `onKillsChanged` notifier hook (single callback, set once by GameScene). |
| `src/scenes/game/RunScoreState.test.ts` | **Modify** | Test notifier fires on increment, idempotent on no-change. |
| `src/scenes/GameScene.ts` | **Modify** | Wire `RunScoreState.onKillsChanged` → `player.setMantleTier(computeMantleTier(kills), { instant: reduceMotion })`. Single helper method. |
**Total:** 5 modified, 4 created. 14 file touches max.

---

## 5. Testing

- **Tail lag regression** (`haggisFrames.test.ts`): every state's authored frames match the §3.2 table by object-equality. Guard against accidental regressions when frames are re-tuned.
- **`HaggisBodyFrame` default**: calling `drawHaggisBody` with no `tailX`/`tailY` does not throw and does not translate the tail (graphics ops snapshot unchanged vs pre-change baseline).
- **Mantle tier math** (`mantleTier.test.ts`): 0/49 → 0, 50 → 1, 249 → 1, 250 → 2, 10000 → 2. Tier is monotonic in kills.
- **Mantle drawer** (`haggisMantle.test.ts`): for every `VariantKey`, `drawMantleTier(g, variant, 1)` and `(…, 2)` issue a non-zero count of fill calls. Tier 0 issues zero.
- **Player.setMantleTier** (`Player.mantle.test.ts`):
  - Transition 0→1 with default opts triggers `scene.tweens.add` once with 300ms duration.
  - Transition 0→1 with `{ instant: true }` sets alpha=1 directly, no tween.
  - Transition 1→1 is idempotent (no work, no tween).
  - Transition 2→0 hides overlay + sets alpha=0.
- **RunScoreState notifier**: `incrementKills` fires `onKillsChanged(newKills)`. Noop if no callback set.
- **No e2e change required** this slice — visual-only feature verified via unit + manual playtest.

The GameScene wire itself (2 lines: compute tier + call setter) is not unit-tested directly — `RunScoreState.onKillsChanged` fires deterministically (covered above), `computeMantleTier` is pure (covered above), `Player.setMantleTier` is tested (covered above). Testing the composition would require a mock Player and mock RunScoreState whose combined surface exceeds the value of the check. Build smoke + manual playtest cover the wire.

### Kill-criterion check

- Bundle delta: target ≤ **5 KB gzip** for the whole slice. 20 baked textures (10 variants × 2 tiers) × small procedural mantle shapes. Raw uncompressed data is ~250 KB at 56×56 RGBA; after Phaser atlas packing + Vite asset pipeline gzip, realistic landing is 3–5 KB. Bundle-delta report in the follow-up plan logs actual.
- Frame-time: target ≤ **1%** regression. Measurement via existing `AutoBattler` + `game.loop.actualFps` sample over a 5-minute soak. Expected delta: unmeasurable (sprite swap + alpha tween, no per-frame work beyond existing overlay position sync).
- If bundle delta > 5 KB or frame-time > 3%: descope mantle-tier-2 bakes first, then mantle entirely (keep tail lag). Tail lag is essentially free — always ships.

---

## 6. Rollout

- Single branch off `master`.
- Tasks ordered: (a) pure helpers + frames + mantle drawer with tests, (b) BootScene bake + Player overlay wire, (c) RunScoreState notifier + GameScene wire + a11y gate, (d) verify kill-criterion via AutoBattler, (e) manual playtest 5min.
- Merge gate: `npm run ci` green + manual eyeball of tail lag feel + mantle tier cross.

---

## 7. Open followups (explicitly deferred)

1. **Whisker bristle on hurt** — baseline whiskers need authoring first. Separate slice.
2. **Weather-reactive secondary motion** — blocks on a weather director system. Separate slice.
3. **Mantle gameplay pulse** (DESIGN_IDEAS §M7 stagger-nearby-enemies at tier 2) — hooks into combat systems, needs balance pass. Separate slice.
4. **Tier-cross VFX + banter line** — currently silent. Followup writes a `mantle_tier_gained` banter pool (EN+SCS) and a short flash VFX.
5. **Per-variant mantle silhouette** — currently universal shape with variant tint. Upgrade to per-variant shapes (sporran cape for `laird`, frost cape for `cailleach`, etc.) once the baseline lands.
6. **Enemy secondary motion** — extend tail lag rule to animated enemies with tails (kelpie, eagle, etc.). Blocked on verifying the tail-nub pattern generalises.
7. **Threshold tuning** — first playtest pass updates `MANTLE_TIERS.tier1KillThreshold` / `tier2KillThreshold` based on actual kill rates across modes (classic, Ironmoor, cursed).
8. **Mantle persistence across runs** — currently transient. If W11 Gran's Croft ships, mantle-tier-2 achievements could earn a persistent ornament in the hub.

---

## 8. Links

- `docs/HUGE_INITIATIVES_MASTER_PLAN.md` — W71 row (kill criterion: ≤10% frame-time).
- `docs/DESIGN_IDEAS.md` §M7 (Heather Mantle), §1 "Signature mechanics".
- `docs/DESIGN_SOUL.md` — warmth + handcraft north star.
- `src/animation/frameDrawers/haggisBodyDraw.ts` / `haggisFrames.ts` — Phase 0 foundation.
- `src/animation/frameDrawers/enemies/` — Phase 1 pattern (30 animated enemies).
- `src/scenes/game/RunScoreState.ts` — kill counter source.
- Voice register memory (`feedback_voice_register.md`) — in-scope once tier-cross banter is authored (followup §7.4).
