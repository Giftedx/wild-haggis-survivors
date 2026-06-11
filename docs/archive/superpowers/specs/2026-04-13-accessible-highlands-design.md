# The Accessible Highlands — Design Spec

**Date:** 2026-04-13
**Charter:** `docs/DESIGN_SOUL.md` explicitly names accessibility as **non-negotiable** ("comfort is part of kindness, not an optional afterthought"). This spec delivers on that promise.

## Scope

Three deep, inclusive pillars. One session. Each shippable independently, committed in sequence.

### Pillar 1 — Reduced Motion (photosensitivity / vestibular)
Screen shake, white flash, slow-motion, particle bursts, parallax — all respond to a single `motionScale` setting in [0, 1]. At `0.3`, the game still communicates impact but stops triggering migraines. At `1.0`, current behavior unchanged.

### Pillar 2 — Captions (hearing-impaired / mute-audio play)
A caption queue overlay surfaces critical audio cues as on-screen text:
- Boss warnings (per-boss flavor preserved)
- Low-HP heartbeat
- Combo milestones (at thresholds that already have toasts, this layers alongside)
- Evolution ready chime
- Player death impact
- Victory chorus

### Pillar 3 — Readability (low-vision)
- **Text scale** — global font multiplier in [0.85, 1.5]. Applied to HUD, overlays, toasts. Layout gracefully reflows.
- **High contrast** — overlay backdrop alpha lifts from ~0.6 to ~0.85, text stroke thickness doubles, UI panel strokes widen.

## Non-goals (this session)

- Colorblind palette transforms — pending design review of enemy/status-effect color semantics.
- Key remapping UI — existing InputManager already abstracts keys; surfacing a remap UI is its own pass.
- Preset system (Comfort / Standard / Intense) — build individual controls first; compose into presets once validated.
- Screen reader semantic markup — Phaser renders canvas; a true screen reader layer is a platform-level project.

## Architecture

### Settings plumbing

`SettingsManager` (`src/core/SettingsManager.ts`) is the single source of truth. Add:
```ts
interface AccessibilitySettings {
  motionScale: number;         // 0..1, default 1
  captionsEnabled: boolean;    // default false
  textScale: number;           // 0.85..1.5, default 1
  highContrast: boolean;       // default false
}
```
Persisted in `localStorage` alongside existing settings. Migration: absent fields coerce to defaults — no schema version bump needed.

### Motion scale

New helper `getMotionScale()` returns live setting. Consumers read every call (not cached) so runtime toggling works:

| Consumer | Effect at `motionScale = 0.3` |
|---|---|
| `JuiceSystem.cameraShake` → `tryCameraShake` | amplitude × 0.3 |
| `JuiceSystem.flashWhite` / `flashRed` | alpha × 0.3 |
| `JuiceSystem.slowMotion` | duration × 0.3, floor 60ms |
| `JuiceSystem.bossDeathSpectacle` | particle count × 0.3, rounded up to min 4 |
| `JuiceSystem.killBurst` | particle count × 0.3 |
| Parallax (terrain sky/mountains) | scrollFactor ×= (0.3 + 0.7 × motionScale) — never fully frozen |

Existing `cameraShake` tests stay green; scaling is applied at call boundary.

### Captions

`CaptionManager` (`src/systems/a11y/CaptionManager.ts`) is a small module:
```ts
class CaptionManager {
  enqueue(id: string, message: string, durationMs: number, tint?: string): void;
  update(deltaMs: number): void;
  clear(): void;
}
```

A single `CaptionOverlay` scene-level Graphics+Text renders the active caption stack (up to 3, oldest fades first). Depth 90 (below HUD 100, above gameplay).

Hook points (all already fire `audio.play*` or `musicEngine.play*` events):
1. `SpawnSystem.announceBoss` — per-boss warning key via `t(boss.warningKey)`
2. `Player.onHit` (new event or inline) — "Low HP — easy, wee yin" once hp drops below 20%
3. `JuiceSystem` combo milestones — piggybacks on existing milestone toast
4. `GameScene.offerTreasureEvolutionIfEligible` — "Evolution primed — crack a chest"
5. `GameScene.handlePlayerDeath` — "Hooves down"
6. `GameScene.handleVictory` — "The moor bows"

Captions are localized — Glesga voice preserved. Duration scales with message length (~2.5s base + 40ms/char).

### Text scale

`scaledFontSize(px: number): string` helper in a new `src/utils/a11yText.ts`:
```ts
export function scaledFontSize(basePx: number): string {
  return `${Math.round(basePx * getTextScale())}px`;
}
```

Replace key `fontSize: '16px'` etc. with `fontSize: scaledFontSize(16)` in:
- HUD (`src/ui/HUD.ts`)
- UpgradeCards
- JuiceSystem toasts + damage numbers
- GameScene boundary warnings

Not a goal: retrofitting every single text call in the codebase. Target the surfaces players read most.

### High contrast

Two global tweaks when enabled:
1. Overlay backdrops: pause screen, level-up modal, death/victory overlays — alpha lifts from current values by +0.25 (capped at 0.95).
2. Text stroke: `scaledStroke(n)` helper doubles stroke thickness on primary labels.

## Tests

- `SettingsManager.a11y.test.ts` — round-trip, defaults, clamping.
- `motionScale.test.ts` — scaling math, floor values, slow-mo duration clamp.
- `CaptionManager.test.ts` — enqueue/update/clear, stack cap, fade timing, id-based dedupe.
- `a11yText.test.ts` — scale boundaries, no-op at 1.0.

## Glesga voice

The settings panel is titled **"Comfort o' the Moor"**. Labels use warm, direct copy:
- Reduced motion: *"Calm the moor — less shake, less flash"*
- Captions: *"Show the moor's whispers on screen"*
- Text scale: *"Bigger words for aul' eyes"*
- High contrast: *"Sharper edges, for when the haar's thick"*

No shame language. Kindness in friction.

## Ship order

1. Settings + persistence + migration (commit 1)
2. Reduced motion through JuiceSystem (commit 2)
3. Caption system + 6 hook points (commit 3)
4. Text scale + high contrast (commit 4)
5. Settings panel + first-run hint (commit 5)

Each commit leaves the game shippable. Each has its own tests.
