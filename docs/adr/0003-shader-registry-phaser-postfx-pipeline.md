# ADR 0003 — ShaderRegistry uses Phaser 3 `PostFXPipeline`, not a bespoke GL layer

**Status:** Proposed (drafted with F1 flagship spec + plan, 2026-04-23)
**Date:** 2026-04-23
**Supersedes:** —
**Superseded by:** —

## Context

WHS ships zero custom shaders today. All VFX comes from programmatic sprite generation (`BootScene.ts`), pooled particles (`JuiceSystem.ts`), and Phaser's built-in tinting / tween / camera effects.

The game-feel research surfaced multiple high-value custom shaders — palette swap (for variant haggis recolours + colorblind modes), outline (for elites + hazards), dissolve (for enemy deaths), heat-shimmer (for fire hazards + Cailleach aura), **haar fog** (signature Scottish visual, biome transitions), bloom, and chromatic aberration (moment-flashes). The music/art-tech research (§6) documents the two paths to ship these:

1. **Bespoke WebGL layer.** Write direct `WebGLRenderingContext` calls outside Phaser's pipeline. Maximum control; maximum cost; requires duplicating context-lost handling, batching, culling, viewport sync, uniform management.
2. **Phaser 3 `PostFXPipeline`** (available since v3.50). Subclass the built-in base, provide a fragment-shader source string + uniform-setter hooks, register in game config, apply via `camera.setPostPipeline('name')` or `sprite.setPostPipeline(...)`. Phaser handles context-lost, batching, render-target allocation, pipeline stacking, and Canvas-mode graceful fallback.

F1 ships the first shader (haar fog). Future shaders (palette swap, outline, dissolve, etc.) want to slot into an established pattern, not each reinvent the infrastructure.

## Decision

**Every custom shader in WHS subclasses `Phaser.Renderer.WebGL.Pipelines.PostFXPipeline`, is registered in a central `ShaderRegistry`, and is configured in `src/main.ts`'s game-config `pipeline` map.** Bespoke WebGL outside Phaser's pipeline is forbidden.

```typescript
// src/main.ts
import { HaarFogPipeline } from './systems/shaders/HaarFogPipeline';

const config: Phaser.Types.Core.GameConfig = {
  // ...
  pipeline: {
    'HaarFog': HaarFogPipeline,
    // future shaders register the same way
  },
};
```

Each shader subclass follows the same shape:

- Constructor calls `super({ game, renderTarget: true, fragShader: FRAG_SHADER_SOURCE })`.
- `onPreRender()` sets uniforms via `set1f`, `set3f`, `setInt`.
- State-controlling methods (e.g., `setDensity`, `setColor`) store values; `onPreRender` reads them.
- Fragment-shader source is GLSL ES 1.00 or 3.00, embedded as a string or imported from a `.frag` file.
- Context-lost is handled by Phaser automatically; override `onContextRestore` if the pipeline holds external state (e.g., pre-generated noise texture).

## Alternatives considered

1. **Bespoke WebGL layer** (§Context option 1). Rejected: duplicates infrastructure Phaser already provides. Context-lost handling, batching, Canvas fallback — all non-trivial. Cost vastly outweighs the flexibility gained.

2. **Use only Phaser's built-in FX pipelines** (`Blur`, `Bloom`, `ColorMatrix`, `Glow`, `Pixelate`, `Shadow`, `Shine`, `Vignette`, etc.). Rejected: the built-ins cover generic effects well but not WHS-specific ones (haar fog, palette swap with game-authored LUTs, dissolve with noise-driven alpha). We need *custom* fragment shaders. Built-ins can still be used in parallel for the generic cases.

3. **Per-shader ad-hoc registration** (not via a central registry). Rejected: leads to drift; each new shader would re-learn the same patterns. A central `ShaderRegistry` is a trivial convention that saves hours across F1 → future shaders.

4. **Vertex shaders / full-pipeline subclassing** (not `PostFXPipeline` but the underlying `SinglePipeline` or `MultiPipeline`). Rejected for v1: WHS's needs are per-pixel colour/alpha transformations, which `PostFXPipeline` (fragment-only) covers fully. Vertex-shader work (mesh deformation, procedural geometry) isn't on the roadmap; if it lands, a separate ADR extends this one.

## Consequences

### Positive

- **Consistent pattern.** Every custom shader lands in `src/systems/shaders/`, subclasses `PostFXPipeline`, registers via `ShaderRegistry`, gets the same perf-profiling harness (`shaderPerf.ts`).
- **Canvas-mode graceful fallback.** Phaser silently no-ops `PostFXPipeline` on Canvas; we get this for free.
- **Context-lost resilience.** Phaser's `webglcontextlost` → `webglcontextrestored` lifecycle is handled; we only handle subclass-specific state (e.g., re-uploading the noise texture).
- **Performance profiling uniform across shaders.** `shaderPerf.wrapWithProfiler(pipeline).measure()` works on any pipeline subclass.
- **New shaders ship fast.** Adding palette-swap as an A1-flagship sub-task is a ~100-line subclass, not a separate infrastructure project.

### Negative / cost

- **Fragment-only (for now).** If a future feature demands vertex-shader work (mesh effects, procedural geometry), this ADR must be extended. Expected rare.
- **GLSL string embedding.** Shader source lives in `.ts` files as strings (no `.frag` syntax highlighting). Mitigated by keeping shader source short and well-commented.
- **Phaser upgrade coupling.** If Phaser 4 reworks the pipeline system, we port the subclasses. Phaser 3 → 4 migration is itself a future flagship (`2026-04-23-phaser4-migration.md` plan pre-existing); ADR holds under current Phaser 3.90+.

### Neutral

- No current bundle cost — `PostFXPipeline` is part of the Phaser core (we already ship it in `vendor-phaser`). Each custom shader adds only its fragment source + JS wrapper (~2–5 KB gzip each).

## Notes

- **F1 ships first shader (haar fog).** See `docs/superpowers/specs/2026-04-23-haar-shader-design.md`.
- **Photosensitivity accessibility** (per `docs/research/ACCESSIBILITY_RESEARCH.md §2.5`) is a cross-cutting concern for every shader. Each subclass respects `reduceFlashing` and `motionScale` settings when computing animated uniforms.
- **PEAT audit** (A1 flagship Task 7) covers shader-driven VFX — shaders don't get a pass from seizure-safety auditing.

## References

- `docs/research/MUSIC_ART_TECH_RESEARCH.md §6` — full shader landscape + GLSL examples.
- `docs/superpowers/specs/2026-04-23-haar-shader-design.md` — F1 spec (the first shader).
- `docs/superpowers/plans/2026-04-23-haar-shader.md` — F1 plan.
- [Phaser 3 PostFXPipeline — Phaser Help](https://docs.phaser.io/phaser/concepts/fx)
- [Phaser 3 Examples — Custom Post FX Pipeline](https://phaser.io/examples/v3.85.0/renderer/view/custom-post-fx-pipeline)
