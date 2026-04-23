# F1 — Shader pipeline + Haar fog design spec

**Date:** 2026-04-23
**Initiative:** F1 (`docs/HUGE_INITIATIVES_MASTER_PLAN.md`)
**Status:** Draft
**Prerequisite:** None. Phaser 3 PostFX pipeline infrastructure is core to all future shader work; F1 establishes it.

---

## 1. Problem statement

WHS renders a pixel-art world with Phaser 3's built-in renderer. No custom shaders ship today. All visual effects come from:
- Programmatic sprite generation in `BootScene.ts`.
- Particle systems in `JuiceSystem.ts`.
- Alpha tinting, simple tweens, camera shake.

`MUSIC_ART_TECH_RESEARCH.md §6` covers the Phaser 3 `PostFXPipeline` and `PreFXPipeline` systems in detail. They're built-in since v3.50, well-supported, and a natural layer for the visual flourishes the Soul Charter demands: palette swaps, outlines, dissolves, heat-shimmers, bloom, chromatic aberration. We just haven't used them.

`GAME_FEEL_RESEARCH.md §7.5` and Part 11 of the music/art tech doc both single out **haar fog** as the single-highest-ROI custom shader we could ship: Scottish-specific, transformative, and technically reasonable.

### Player outcome

- Biome transitions feel *cinematic* — haar rolls in, obscures, lifts.
- Moor Road act intermissions open with a haar-wash (pairing with the picker UI).
- Loch and coastal biomes get ambient haar as an always-present atmospheric layer.
- A signature visual identity emerges — players *see* "oh, this is a WHS game" from the haar alone.

### Why this is a pipeline-level flagship, not a single-shader polish ticket

Shipping just the haar shader is 80% of the work; setting up the `ShaderRegistry` infrastructure, documenting the conventions, adding perf profiling, and hooking into the existing camera/scene lifecycle is 20%. Doing both together makes future shaders (palette swap, outline, dissolve, etc.) drop into an established scaffold. This is an *enabling* flagship.

---

## 2. Design

### Two layers

1. **Infrastructure layer** — `ShaderRegistry` module, Phaser `PostFXPipeline` base-class conventions, compile-time shader loading, registration at game-config time, per-scene/per-camera/per-sprite apply paths, profiling hooks.

2. **Haar fog shader** — first real custom shader using the infrastructure. Animated noise-driven fog overlay.

### Haar shader — visual target

- **Drifting fog layers** — two overlapping 2D noise samples moving at different speeds (one `+0.02t`, one `-0.015t`) combined with alpha threshold into a mist that drifts.
- **Density controlled** by a 0–1 uniform (`uFogDensity`). 0 = invisible, 0.5 = ambient, 1.0 = obscuring.
- **Colour** pulled from a `uFogColor` vec3 — default pale off-white-blue `(0.9, 0.9, 0.95)`, but can be tinted (e.g., *Beltane* biome fire-tinted orange; *Cailleach* presence cold-blue).
- **Scale** — noise tiled so it doesn't obviously repeat (scale factor 0.3–0.5).
- **Animation** — `uTime` uniform drives per-frame update.

Performance:
- Single fragment-shader pass.
- Noise sampled from a pre-generated 256×256 texture (faster than per-pixel noise math).
- Budget: < 0.5 ms per frame on mid-range mobile hardware.

### Integration points

- **Biome transitions** (`BiomeController` or equivalent) — when biome changes, ramp `uFogDensity` from 0 → 1 over 1s, pause 500ms at 1, ramp back to biome's ambient density (0 or 0.15–0.3) over 1s. During the 1.0 peak, biome swap happens; the haar hides the transition.
- **Moor Road act intermissions** (`ActIntermissionScene`) — haar rolls in at intermission start (opacity 1.0), picker UI fades in, player picks, haar rolls out as the next act begins.
- **Ambient in Loch / Coastal biomes** — `uFogDensity` parked at 0.15–0.3 during normal play; varies subtly with time.
- **Cailleach presence** (when the variant is active or during her Bargain event) — haar tints cold-blue, density bumps.
- **Accessibility** — `reduceFlashing` or `motionScale=0` setting caps haar opacity at 0.4 max and caps ramp speed (≥2s for any transition), per `ACCESSIBILITY_RESEARCH.md §2.5` photosensitivity-safe design.

---

## 3. Non-goals

- **Not replacing Phaser's built-in FX pipelines.** We *use* `PostFXPipeline` as the base class; this is additive.
- **Not a shader-heavy game.** Haar is the first; follow-up shaders (palette swap, outline, dissolve, bloom) ship in separate tickets, not under F1.
- **Not screen-wide always-on effects.** Haar is gated by biome/context; it doesn't cover combat by default.
- **Not GPU-heavy** — budget is strict.
- **Not colour-cycling psychedelic effects.** Haar is *one* atmospheric overlay, not a general-purpose visual FX system for every trigger.
- **Not Canvas-mode support.** WebGL renderer only. (Canvas is a fallback mode; haar disabled on Canvas.)
- **Not custom vertex shaders** — fragment-only for v1.

---

## 4. Architecture

### New files

- `src/systems/shaders/ShaderRegistry.ts` — central registration of all custom pipelines. Called from game config.
- `src/systems/shaders/HaarFogPipeline.ts` — `PostFXPipeline` subclass implementing haar.
- `src/systems/shaders/shaders/haarFog.frag` (or embedded as string in HaarFogPipeline.ts) — GLSL fragment shader source.
- `src/systems/shaders/shaders/sharedNoise.ts` — pre-generated noise texture factory (used by haar, reusable for future shaders).
- `src/systems/shaders/shaderPerf.ts` — performance profiling helpers.

### Files to modify

- `src/main.ts` — game config registers `HaarFogPipeline`.
- `src/scenes/GameScene.ts` — camera-level haar apply via `camera.setPostPipeline`; density controlled by `BiomeController`.
- `src/scenes/ActIntermissionScene.ts` — apply haar at intermission start; animate density.
- `src/scenes/game/biomeController.ts` (or equivalent) — drive `uFogDensity` per biome's ambient setting.
- `src/core/SaveManager.ts` / settings — respect `reduceFlashing`, `motionScale` when computing haar density.
- `docs/ART_STYLE_BIBLE.md §Weather & atmosphere` — update with haar shader reference.
- `docs/PRD.md` — note shader-pipeline infrastructure.

### Fragment shader (GLSL ES)

```glsl
precision mediump float;

uniform sampler2D uMainSampler;
uniform sampler2D uNoiseTex;
uniform float uTime;
uniform float uFogDensity;     // 0-1
uniform vec3 uFogColor;        // RGB 0-1

varying vec2 outTexCoord;

void main() {
  vec2 uv = outTexCoord;

  // Two noise samples at different scales/speeds for layered feel
  float n1 = texture2D(uNoiseTex, uv * 0.5 + vec2(uTime * 0.02, 0.0)).r;
  float n2 = texture2D(uNoiseTex, uv * 0.3 + vec2(0.0, -uTime * 0.015)).r;

  // Combine — n1 dominates; n2 adds variation
  float fog = (n1 * 0.6 + n2 * 0.4) * uFogDensity;

  vec4 scene = texture2D(uMainSampler, uv);
  gl_FragColor = mix(scene, vec4(uFogColor, 1.0), fog);
}
```

### Data shape

```typescript
interface HaarConfig {
  density: number;          // 0-1
  color: [number, number, number]; // RGB 0-1
  ambientDensity: number;   // resting density for this biome
  transitionMs: number;     // ramp speed
}

class HaarFogPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  setDensity(density: number): void;
  setColor(r: number, g: number, b: number): void;
  onPreRender(): void {
    this.set1f('uTime', performance.now() * 0.001);
    this.set1f('uFogDensity', this.currentDensity);
    this.set3f('uFogColor', this.currentColor[0], this.currentColor[1], this.currentColor[2]);
  }
}
```

### ShaderRegistry pattern

```typescript
// src/main.ts
import { ShaderRegistry } from './systems/shaders/ShaderRegistry';
import { HaarFogPipeline } from './systems/shaders/HaarFogPipeline';

const config: Phaser.Types.Core.GameConfig = {
  // ...
  pipeline: {
    'HaarFog': HaarFogPipeline,
    // future shaders registered here
  },
};
```

Future shaders (palette swap, outline, dissolve) register the same way, each a `PostFXPipeline` subclass in `src/systems/shaders/`.

### Tests / fences

- `HaarFogPipeline.test.ts` — pipeline construction, uniform setting, density/colour logic. Phaser renderer mocked.
- `sharedNoise.test.ts` — noise texture generation is deterministic.
- `shaderPerf.test.ts` — profiling helper returns reasonable numbers.
- `e2e/haar-biome-transition.spec.ts` — Playwright screenshot-compare across biome transition, asserts haar visible.

GPU-specific tests (does the shader actually run?) handled by manual verification + e2e smoke.

### Fallback path

If WebGL unavailable or context-lost: `HaarFogPipeline` silently no-ops. Game renders without haar — no crash. Player experience degraded but playable.

---

## 5. Performance budget

- **Per-frame cost:** < 0.5 ms on mid-range mobile (iPhone 12-equivalent, 2019 Android flagship).
- **Memory cost:** 256×256 noise texture = 64KB. Shared across all HaarFogPipeline instances. Budget: +100 KB gzip total for infrastructure + shader.
- **GPU saturation check:** at 60fps on the slowest supported device, haar must not push frame time past 16.67 ms threshold.

Profiling tooling (`shaderPerf.ts`) exposes per-pipeline frame cost for debug-mode logging.

---

## 6. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Haar tanks performance on low-end mobile | Quality-tier detection at startup; haar disabled on detected-low devices. `reduceParticles` setting also caps haar. |
| Shader compiles fail on certain browser/GPU combos | Silent fallback to no-haar. Log warning to console. No crash. |
| WebGL context lost mid-session | Handle `webglcontextlost` event; re-register pipeline on `webglcontextrestored`. Phaser 3 handles most of this. |
| Biome transition haar disorients motion-sensitive players | `motionScale` and `reduceFlashing` both cap haar intensity and slow transition speed. |
| Photosensitivity concern (fog pulsing) | Fog is continuous-density, not strobing. PEAT audit confirms no flash hazard. |
| Future shaders create a "shader zoo" with per-shader bugs | `ShaderRegistry` + shared `PostFXPipeline` conventions limit each shader to ~100-line fragment code. Reviewable. |
| Canvas-mode users miss the feature | Acceptable — WHS has been WebGL-preferred; Canvas is a fallback mode with other known degradations. |
| Memory fragmentation from many pipeline instances | Single shared instance per effect, not per-sprite. |

---

## 7. Kill criteria

- **Per-frame haar cost** < 0.5 ms on target low-end hardware (measured via `shaderPerf.ts`).
- **Bundle delta** ≤ +100 KB gzip (including noise texture + shader source + ShaderRegistry).
- **`npm run ci:all`** green (lint + 2980+ vitest + build + e2e).
- **Screenshot smoke**: `e2e/haar-biome-transition.spec.ts` shows visible haar during transition.
- **No crash** when WebGL unavailable / context-lost (graceful fallback).
- **Accessibility:** `reduceFlashing + motionScale=0` combination fully caps haar to ≤ 0.4 density and slow transitions.

If haar is un-performant on any supported-hardware target and can't be optimised in 2 weeks, ship as **transition-only** (disabled during ambient biome play). If even transition-only fails performance gates, ship infrastructure without haar and defer haar to Phase 2.

---

## 8. Cross-references

- `docs/research/MUSIC_ART_TECH_RESEARCH.md §6` — shader pipeline details (palette swap, outline, dissolve, bloom — all future tickets).
- `docs/research/MUSIC_ART_TECH_RESEARCH.md §Part 11 — SH6` — haar as single highest-ROI shader.
- `docs/research/GAME_FEEL_RESEARCH.md §7.5` — haar as signature Scottish feel element.
- `docs/research/ACCESSIBILITY_RESEARCH.md §2.5` — photosensitivity-safe design for animated effects.
- `docs/ART_STYLE_BIBLE.md §Weather & atmosphere` — haar as signature visual.
- `docs/research/SCOTTISH_RESEARCH.md §2.9 & 4.2` — haar as real-world Scottish weather; loch-breath, east-coast sea-fog.

---

*Spec complete. Plan breaks into M1 ShaderRegistry + infrastructure, M2 HaarFogPipeline implementation + noise texture, M3 biome-transition integration, M4 accessibility settings + perf validation.*
