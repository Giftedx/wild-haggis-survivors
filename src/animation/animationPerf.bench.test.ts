/**
 * Animation runtime perf benchmark — W71 ADR-0005.
 *
 * Measures the per-tick cost of `AnimationController.tick()` across the
 * "perf-bench scene" topology defined in the W71 charter:
 *   200 enemies + 1 player + a stress-margin of frame churn.
 *
 * The texture-swap rig's hot path is a pure FSM eval + a pure frame-clock
 * advance + at most one `sprite.setTexture(key)` on a frame boundary.
 * Phaser-side, `setTexture` is a hashmap lookup (no GPU upload), so the
 * cost lives in this module's JS work. This bench captures exactly that
 * cost so a future regression — runtime spring solver, mesh-deformation
 * detour, etc. — surfaces in CI rather than on a player's machine.
 *
 * Budget rationale (charter Acceptance §"Frame-time regression ≤10% on
 * the perf-bench scene"):
 *   - 60 fps target = 16.67 ms/frame.
 *   - Full procedural baseline cost was the entire scaleY bob loop
 *     (`Math.sin(phase) * 0.04` + `setScale(...)`) running on every
 *     enemy, every frame. That cost is roughly comparable per-entity to
 *     this bench's tick.
 *   - We assert `avgTickMs <= 0.5 ms / 201 entities = ~2.5 us per
 *     entity` is comfortably hit. The actual numbers in CI tend to land
 *     ~10x faster than that on the GitHub runner; the threshold here is
 *     a regression watch, not a tight gate.
 *
 * Why not a full E2E perf gate?
 *   - E2E would require live Phaser + RAF + GPU. Vitest node-env covers
 *     the only code path that's not "Phaser doing its own thing".
 *   - The AnimationController hot path is pure JS; it does not change
 *     behavior in node vs. browser. The browser-side cost is dominated
 *     by Phaser's own batched render, which W71 doesn't change.
 */

import { describe, expect, it } from 'vitest';

import { AnimationController } from './AnimationController';
import type { AnimationSignals } from './animationStates';
import { createPerfProbe } from '../systems/shaders/shaderPerf';

interface SpriteStub {
  setTexture: (key: string) => void;
}

function makeSpriteStub(): SpriteStub {
  // Cheapest possible setTexture — no instrumentation in the hot path.
  return { setTexture: () => undefined };
}

function makeController(subject: string, variant: string | null): AnimationController {
  return new AnimationController({
    sprite: makeSpriteStub() as unknown as Phaser.GameObjects.Sprite,
    subject,
    variant,
  });
}

interface SignalRecipe {
  readonly velocityMag: number;
  readonly hp: number;
}

function buildEntityPool(): Array<{ controller: AnimationController; recipe: SignalRecipe }> {
  const entities: Array<{ controller: AnimationController; recipe: SignalRecipe }> = [];
  // 1 player.
  entities.push({
    controller: makeController('haggis', 'classic'),
    recipe: { velocityMag: 200, hp: 100 },
  });
  // 200 enemies, 3 archetypes round-robin (matching Phase 1 ship).
  const archetypes: ReadonlyArray<{ subject: string }> = [
    { subject: 'buckfast_ned' },
    { subject: 'eagle' },
    { subject: 'haggis_hunter' },
  ];
  for (let i = 0; i < 200; i++) {
    const arch = archetypes[i % archetypes.length];
    // Mix of stationary / moving entities — exercises both `idle` and
    // `walking` branches in the FSM each tick.
    const moving = i % 4 !== 0;
    entities.push({
      controller: makeController(arch.subject, null),
      recipe: { velocityMag: moving ? 100 : 0, hp: 20 },
    });
  }
  return entities;
}

const FIXED_STEP_MS = 16.6667; // ADR-0002 60 fps fixed-step.
const STEADY_STATE_TICKS = 600; // 10 seconds at 60 fps.

describe('animation perf — AnimationController.tick across 201 entities', () => {
  // 30s under full vitest concurrency; isolated runtime ~1-2s — see T420 (commit 7411a41).
  // 600 ticks × 201 entities can stretch past the 5s default when CI/dev machines are
  // saturated by the 432-file vitest pool.
  it('records steady-state per-tick cost below the regression budget', { timeout: 30_000 }, () => {
    const entities = buildEntityPool();
    const probe = createPerfProbe(STEADY_STATE_TICKS);

    // A fixed signal recipe per entity drives a deterministic tick load.
    // Walking entities: occasional hurt edges (every 90 ticks ~= 1.5 s).
    // Idle entities: pure idle loop.
    for (let t = 0; t < STEADY_STATE_TICKS; t++) {
      probe.measure(() => {
        for (let i = 0; i < entities.length; i++) {
          const e = entities[i];
          const hurtEdge = e.recipe.velocityMag > 0 && t % 90 === 0;
          const signals: AnimationSignals = {
            velocityMag: e.recipe.velocityMag,
            hurtEdge,
            attackEdge: false,
            celebrateEdge: false,
            hp: e.recipe.hp,
          };
          e.controller.tick(FIXED_STEP_MS, signals);
        }
      });
    }

    expect(probe.samples).toBe(STEADY_STATE_TICKS);
    const avg = probe.avg();
    const max = probe.max();
    // Sanity: average per-tick cost across 201 entities sits well below
    // a single-frame budget. 0.5 ms is ~3% of a 60 fps frame budget for
    // the entire animation system; in practice we land 10-50x faster.
    expect(avg).toBeLessThan(0.5);
    // Worst-frame guard — pause/GC pulses can spike above the average
    // but should not approach a frame budget.
    expect(max).toBeLessThan(5);
    // Diagnostic: surface the numbers in CI logs without making them a
    // test assertion (so a faster machine doesn't fail "too good").
    console.info(
      `[animationPerf] 201 entities × ${STEADY_STATE_TICKS} ticks: ` +
      `avg ${avg.toFixed(4)} ms/tick, max ${max.toFixed(4)} ms/tick, ` +
      `per-entity avg ${(avg / entities.length * 1000).toFixed(2)} us`,
    );
  });

  it('matches the W71 Phase 0 baseline shape (idle pool churns no work)', () => {
    // 100 fully-idle entities. The frame clock at 2 fps means most
    // ticks DO advance the frame index (idle frames are 500 ms apart
    // and we're stepping 16.67 ms; only every ~30th tick hits a frame
    // boundary), so this case is dominated by the FSM eval and the
    // accMs accumulator math.
    const entities: AnimationController[] = [];
    for (let i = 0; i < 100; i++) {
      entities.push(makeController('haggis', 'classic'));
    }
    const probe = createPerfProbe(60);
    const idleSignals: AnimationSignals = {
      velocityMag: 0,
      hurtEdge: false,
      attackEdge: false,
      celebrateEdge: false,
      hp: 100,
    };
    for (let t = 0; t < 60; t++) {
      probe.measure(() => {
        for (let i = 0; i < entities.length; i++) {
          entities[i].tick(FIXED_STEP_MS, idleSignals);
        }
      });
    }
    expect(probe.avg()).toBeLessThan(0.25);
  });

  it('hurt-edge bursts do not regress past the busy-tick budget', () => {
    // Stress: every entity takes a hurt edge every tick. This forces
    // the FSM to evaluate state transitions and reset frame indices
    // repeatedly — the worst real-world load is a screen-clear AoE
    // burst (e.g. fiery flagon evolution).
    const entities: AnimationController[] = [];
    for (let i = 0; i < 50; i++) {
      entities.push(makeController('buckfast_ned', null));
    }
    const probe = createPerfProbe(60);
    const burstSignals: AnimationSignals = {
      velocityMag: 100,
      hurtEdge: true,
      attackEdge: false,
      celebrateEdge: false,
      hp: 20,
    };
    for (let t = 0; t < 60; t++) {
      probe.measure(() => {
        for (let i = 0; i < entities.length; i++) {
          entities[i].tick(FIXED_STEP_MS, burstSignals);
        }
      });
    }
    // Hurt-edge ticks include a setTexture call (hot path), but our
    // stub is a no-op; the JS work remains under the busy-tick budget.
    expect(probe.avg()).toBeLessThan(0.5);
  });
});
