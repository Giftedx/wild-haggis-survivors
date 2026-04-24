# F1 — Shader pipeline + Haar fog implementation plan

> **STATUS:** In progress (2026-04-24 Phaser 4 rebase).
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Ship custom Phaser filter-render-node infrastructure + first shader (animated haar fog) per `docs/superpowers/specs/2026-04-23-haar-shader-design.md`. 4 milestones.

**Architecture:** Central `ShaderRegistry` registers all custom render nodes at game-config time via `Phaser.Types.Core.GameConfig.renderNodes`. `HaarFogRenderNode` extends `Phaser.Renderer.WebGL.RenderNodes.BaseFilterShader` (GPU: GLSL source + uniform setup + texture setup). `HaarFogController` extends `Phaser.Filters.Controller` (state: density, colour, elapsed time) and references the render node by id `'HaarFog'`. Applied via `camera.filters.internal.add(new HaarFogController(camera))`. Fragment shader samples pre-generated 2D noise texture. Biome transitions drive density ramps via `BiomeController`. Accessibility settings cap haar intensity and transition speed.

> **2026-04-24 note.** The original plan body references Phaser 3 `PostFXPipeline`; the migration to Phaser 4 (shipped 2026-04-23) deleted that class. All task code follows the filter-render-node split documented in `docs/adr/0003-shader-registry-phaser-postfx-pipeline.md §2026-04-24 addendum`. File names updated: `HaarFogPipeline` → `HaarFogRenderNode` + `HaarFogController`.

**Tech Stack:** TypeScript strict, Phaser 4 (WebGL only), GLSL ES, Vitest, Playwright. Canvas renderer: controllers silently no-op.

**Commit cadence:** One commit per TDD cycle. `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`.

**Branch:** `master`.

**Guardrails on every task:**
- `npm test` green after each step.
- `npm run lint` after multi-file changes.
- WebGL-context-lost handler must not crash.
- Haar must silently no-op on Canvas mode.
- Perf: `<0.5 ms/frame` at 60fps on mid-range mobile.

---

## File structure

### New files

| Path | Responsibility |
|------|------|
| `src/systems/shaders/ShaderRegistry.ts` | Central registration + per-pipeline lifecycle. |
| `src/systems/shaders/ShaderRegistry.test.ts` | Registration + lookup tests. |
| `src/systems/shaders/HaarFogPipeline.ts` | PostFXPipeline subclass; embedded GLSL. |
| `src/systems/shaders/HaarFogPipeline.test.ts` | Uniform setting + density/colour logic (Phaser renderer mocked). |
| `src/systems/shaders/shaders/sharedNoise.ts` | Pre-generated 256×256 noise texture factory. |
| `src/systems/shaders/shaders/sharedNoise.test.ts` | Deterministic generation tests. |
| `src/systems/shaders/shaderPerf.ts` | Per-pipeline frame-cost profiler. |
| `src/systems/shaders/shaderPerf.test.ts` | Helper-math tests. |
| `e2e/haar-biome-transition.spec.ts` | Playwright screenshot-compare. |

### Modified files

| Path | Change |
|------|--------|
| `src/main.ts` | Game config registers `HaarFogPipeline` via `pipeline: { HaarFog: HaarFogPipeline }`. |
| `src/scenes/GameScene.ts` | `camera.setPostPipeline('HaarFog')` applied based on biome. |
| `src/scenes/ActIntermissionScene.ts` | Apply haar density ramp at intermission start + exit. |
| `src/scenes/game/biomeController.ts` (or equivalent) | Drive `uFogDensity` per biome's ambient setting. |
| `src/core/SaveManager.ts` | Respect `reduceFlashing`, `motionScale` when computing haar density. |
| `docs/ART_STYLE_BIBLE.md §Weather & atmosphere` | Update haar shader reference. |
| `docs/PRD.md` | Note shader pipeline infrastructure. |

---

## Milestone plan

- **M1 — Infrastructure** (tasks 1–6). `ShaderRegistry` + shared noise + perf harness. Ship gate: registry registers a placeholder PostFXPipeline; unit tests pass.
- **M2 — HaarFogPipeline** (tasks 7–12). GLSL fragment shader + uniform wiring + test coverage. Ship gate: haar renders visibly on a test scene.
- **M3 — Biome-transition integration** (tasks 13–17). Density ramps, ActIntermissionScene wiring, biome controller. Ship gate: `e2e/haar-biome-transition.spec.ts` passes.
- **M4 — Accessibility + perf** (tasks 18–22). `reduceFlashing` + `motionScale` caps; perf profiling on target hardware. Ship gate: <0.5ms/frame on mid-range mobile.

---

## M1 — Infrastructure

### Task 1: Shared noise texture

**Files:** `src/systems/shaders/shaders/sharedNoise.ts` + test.

- [ ] **Step 1:** Failing test: `createNoiseTexture(256, seed=42)` returns 256×256 RGBA; consistent per seed.
- [ ] **Step 2:** Implement Perlin/simplex noise generator; export as `CanvasTexture` suitable for WebGL upload.
- [ ] **Step 3:** Green.
- [ ] **Step 4:** Commit: `feat(shaders): shared noise texture factory`.

### Task 2: `shaderPerf.ts` harness

- [ ] **Step 1:** Failing test: `wrapWithProfiler(pipeline).measure()` returns ms-elapsed number.
- [ ] **Step 2:** Implement using `performance.now()` hooks on pipeline onPreRender/onDraw.
- [ ] **Step 3:** Commit.

### Task 3: `ShaderRegistry` skeleton

- [ ] **Step 1:** Failing test: `ShaderRegistry.register('test', TestPipeline)` + `get('test')` round-trip.
- [ ] **Step 2:** Implement registry.
- [ ] **Step 3:** Commit.

### Task 4: `main.ts` pipeline wiring

**Files:** `src/main.ts`.

- [ ] **Step 1:** Failing smoke test: game config includes `pipeline` key.
- [ ] **Step 2:** Register a placeholder `TestPipeline` to verify Phaser accepts the config.
- [ ] **Step 3:** Green.
- [ ] **Step 4:** Commit.

### Task 5: WebGL-context-lost handler

- [ ] **Step 1:** Failing smoke: on `webglcontextlost` event, pipeline silently no-ops.
- [ ] **Step 2:** Implement handler; on `webglcontextrestored`, re-initialise pipeline state.
- [ ] **Step 3:** Commit.

### Task 6: M1 ship gate

- [ ] Registry + noise + perf + lifecycle all green.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(shaders): M1 — infrastructure + placeholder pipeline`.

---

## M2 — HaarFogPipeline

### Task 7: Minimal fragment shader

**Files:** `src/systems/shaders/HaarFogPipeline.ts`.

- [ ] **Step 1:** Failing test: `HaarFogPipeline` constructor accepts Phaser game config; fragment-shader source string is non-empty.
- [ ] **Step 2:** Implement class + embed GLSL source per spec §4.
- [ ] **Step 3:** Commit: `feat(shaders): HaarFogPipeline skeleton`.

### Task 8: Uniform setters

- [ ] **Step 1:** Failing test: `setDensity(0.5)` + `onPreRender()` calls `set1f('uFogDensity', 0.5)`.
- [ ] **Step 2:** Implement `setDensity`, `setColor`, `onPreRender`.
- [ ] **Step 3:** Commit.

### Task 9: Default colour + density

- [ ] **Step 1:** Failing test: default colour is `(0.9, 0.9, 0.95)`; default density 0.
- [ ] **Step 2:** Wire defaults in constructor.
- [ ] **Step 3:** Commit.

### Task 10: Shader compilation sanity

- [ ] **Step 1:** Failing smoke test: `HaarFogPipeline.boot()` completes without throwing.
- [ ] **Step 2:** Handle compilation errors gracefully (log, no-op).
- [ ] **Step 3:** Commit.

### Task 11: Visual verification

- [ ] **Step 1:** Create scratch test scene applying haar at density 0.5. Capture screenshot.
- [ ] **Step 2:** Manual review: fog visible as grey-white haze.
- [ ] **Step 3:** Commit if visual adjustments needed.

### Task 12: M2 ship gate

- [ ] `HaarFogPipeline` renders visibly in test harness.
- [ ] Perf profiler reports <0.5ms for haar-only scene.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(shaders): M2 — HaarFogPipeline renders correctly`.

---

## M3 — Biome-transition integration

### Task 13: `BiomeController` haar ambient density

**Files:** `src/scenes/game/biomeController.ts`.

- [ ] **Step 1:** Failing test: each biome has an `ambientHaarDensity: number` (default 0; loch=0.15, coastal=0.25).
- [ ] **Step 2:** Add field to `BiomeDef`.
- [ ] **Step 3:** `BiomeController` sets haar density on biome enter.
- [ ] **Step 4:** Commit.

### Task 14: Biome-transition density ramp

- [ ] **Step 1:** Failing test: transition from biome A (ambient 0) to biome B (ambient 0.2) ramps haar 0 → 1 over 1s, pauses 500ms at 1, ramps back to 0.2 over 1s.
- [ ] **Step 2:** Implement ramp using Phaser tween on `uFogDensity`.
- [ ] **Step 3:** Commit.

### Task 15: ActIntermissionScene haar entry + exit

**Files:** `src/scenes/ActIntermissionScene.ts`.

- [ ] **Step 1:** Failing smoke test: intermission-start triggers haar ramp to 1.0 (obscuring); picker UI fades in.
- [ ] **Step 2:** Wire haar ramp into scene lifecycle.
- [ ] **Step 3:** Commit.

### Task 16: `e2e/haar-biome-transition.spec.ts`

- [ ] **Step 1:** Playwright test: trigger act 1→2 intermission, screenshot at frame 500 and 1000; assert haar visibly present.
- [ ] **Step 2:** Commit.

### Task 17: M3 ship gate

- [ ] E2E passes.
- [ ] Biome transitions use haar.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(shaders): M3 — biome-transition haar integration`.

---

## M4 — Accessibility + perf

### Task 18: `reduceFlashing` cap

- [ ] **Step 1:** Failing test: when `settings.reduceFlashing === true`, max haar density caps at 0.4 and ramp duration ≥ 2s.
- [ ] **Step 2:** Read setting in `HaarFogPipeline.setDensity` via SettingsManager.
- [ ] **Step 3:** Commit.

### Task 19: `motionScale` ramp-speed cap

- [ ] **Step 1:** Failing test: when `motionScale === 0`, ramp duration doubles (2s → 4s).
- [ ] **Step 2:** Wire setting.
- [ ] **Step 3:** Commit.

### Task 20: Canvas-mode no-op

- [ ] **Step 1:** Failing test: if renderer is Canvas, `HaarFogPipeline.apply()` silently skips.
- [ ] **Step 2:** Detect renderer type; conditional-skip.
- [ ] **Step 3:** Commit.

### Task 21: Perf profiling on target hardware

- [ ] **Step 1:** Run game on mid-range mobile device (or emulator). Capture frame-time via `shaderPerf`.
- [ ] **Step 2:** If >0.5ms/frame: consider reducing noise-texture resolution to 128×128 or capping density.
- [ ] **Step 3:** Document findings in `docs/ACCESSIBILITY_AUDIT.md` (perf section).
- [ ] **Step 4:** Commit any perf-driven refactor.

### Task 22: M4 ship gate + launch

- [ ] `<0.5ms/frame` on target hardware confirmed.
- [ ] Bundle delta ≤ +100 KB gzip verified.
- [ ] `reduceFlashing` + `motionScale` both cap haar correctly.
- [ ] Canvas-mode no-op verified.
- [ ] `npm run ci:all` green.
- [ ] Ship commit: `feat(shaders): F1 — Shader pipeline + Haar fog shipped`.

---

## Final ship gate (F1 complete)

- [ ] All 4 milestones passed.
- [ ] Signature visual shipping on biome transitions.
- [ ] Accessibility caps verified.
- [ ] Perf within budget.
- [ ] Ship commit.

---

## Risk-watch

| Signal | Response |
|---|---|
| Shader fails to compile on specific GPU/browser | Silent fallback to no-haar; log warning. |
| Perf >0.5ms/frame | Reduce noise resolution; cap density; or ship as transition-only (no ambient). |
| Visible artefacts (banding, flicker) | Adjust noise octaves; higher-precision uniforms. |
| Context-lost crashes | WebGL-context-lost handler must be robust; e2e covers. |
