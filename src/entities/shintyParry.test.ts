import { describe, it, expect } from 'vitest';
import {
  createShintyParryState,
  tickShintyParry,
  consumeParry,
  isParryActive,
  isParryReady,
  parryCooldownFraction,
  reflectShintyProjectile,
  PARRY_WINDOW_MS,
  PARRY_COOLDOWN_MS,
} from './shintyParry';

describe('shintyParry', () => {
  describe('initial state', () => {
    it('starts idle and ready', () => {
      const s = createShintyParryState();
      expect(s.windowRemainingMs).toBe(0);
      expect(s.cooldownRemainingMs).toBe(0);
      expect(isParryReady(s)).toBe(true);
      expect(isParryActive(s)).toBe(false);
    });
  });

  describe('window cast', () => {
    it('opens the window on a parry edge from idle', () => {
      const s = createShintyParryState();
      const r = tickShintyParry(s, { dtMs: 16, parryPressed: true });
      expect(r.windowOpenedEdge).toBe(true);
      expect(r.isWindowActive).toBe(true);
      expect(r.state.windowRemainingMs).toBe(PARRY_WINDOW_MS);
      expect(r.state.cooldownRemainingMs).toBe(0);
    });

    it('does not open a fresh window mid-window', () => {
      let s = createShintyParryState();
      s = tickShintyParry(s, { dtMs: 16, parryPressed: true }).state;
      // Press again 50 ms in. The window should not refresh — the
      // remaining time should keep ticking down from where it was.
      const r = tickShintyParry(s, { dtMs: 50, parryPressed: true });
      expect(r.windowOpenedEdge).toBe(false);
      expect(r.state.windowRemainingMs).toBe(PARRY_WINDOW_MS - 50);
    });

    it('does not open during cooldown', () => {
      let s = createShintyParryState();
      // Open window, consume it (hit lands).
      s = tickShintyParry(s, { dtMs: 16, parryPressed: true }).state;
      const c = consumeParry(s);
      expect(c.consumed).toBe(true);
      s = c.state;
      // E pressed again — cooldown should block.
      const r = tickShintyParry(s, { dtMs: 16, parryPressed: true });
      expect(r.windowOpenedEdge).toBe(false);
      expect(r.isWindowActive).toBe(false);
    });

    it('reopens after cooldown elapses', () => {
      let s = createShintyParryState();
      s = tickShintyParry(s, { dtMs: 16, parryPressed: true }).state;
      s = consumeParry(s).state;
      // Tick the cooldown out without input.
      let elapsed = 0;
      while (elapsed < PARRY_COOLDOWN_MS + 10) {
        s = tickShintyParry(s, { dtMs: 50, parryPressed: false }).state;
        elapsed += 50;
      }
      expect(isParryReady(s)).toBe(true);
      const r = tickShintyParry(s, { dtMs: 16, parryPressed: true });
      expect(r.windowOpenedEdge).toBe(true);
    });
  });

  describe('window expiry', () => {
    it('closes the window after PARRY_WINDOW_MS without consume', () => {
      let s = createShintyParryState();
      s = tickShintyParry(s, { dtMs: 16, parryPressed: true }).state;
      // Tick past the window without pressing again or consuming.
      let elapsed = 0;
      while (elapsed < PARRY_WINDOW_MS + 50) {
        s = tickShintyParry(s, { dtMs: 50, parryPressed: false }).state;
        elapsed += 50;
      }
      expect(isParryActive(s)).toBe(false);
    });

    it('expiry without consume does NOT trigger cooldown — a whiff is free of cooldown', () => {
      // Design choice: only consumed parries cost cooldown. Whiffs
      // are punished by the lost timing window itself, not by
      // grounding the player. Tweak this test if the design flips.
      let s = createShintyParryState();
      s = tickShintyParry(s, { dtMs: 16, parryPressed: true }).state;
      let elapsed = 0;
      while (elapsed < PARRY_WINDOW_MS + 50) {
        s = tickShintyParry(s, { dtMs: 50, parryPressed: false }).state;
        elapsed += 50;
      }
      expect(s.cooldownRemainingMs).toBe(0);
      expect(isParryReady(s)).toBe(true);
    });
  });

  describe('consume on hit', () => {
    it('negates the hit and sets cooldown when window is active', () => {
      let s = createShintyParryState();
      s = tickShintyParry(s, { dtMs: 16, parryPressed: true }).state;
      const r = consumeParry(s);
      expect(r.consumed).toBe(true);
      expect(r.state.windowRemainingMs).toBe(0);
      expect(r.state.cooldownRemainingMs).toBe(PARRY_COOLDOWN_MS);
    });

    it('does not consume when no window is active', () => {
      const s = createShintyParryState();
      const r = consumeParry(s);
      expect(r.consumed).toBe(false);
      expect(r.state).toBe(s);
    });

    it('only consumes once per window even if called twice', () => {
      let s = createShintyParryState();
      s = tickShintyParry(s, { dtMs: 16, parryPressed: true }).state;
      const r1 = consumeParry(s);
      const r2 = consumeParry(r1.state);
      expect(r1.consumed).toBe(true);
      expect(r2.consumed).toBe(false);
    });
  });

  describe('determinism', () => {
    it('same input stream produces same output stream', () => {
      // Replay parity contract: identical (state, input) sequences
      // must produce identical (state, output) sequences. Two parallel
      // runs with the same script.
      type Step = { dtMs: number; parryPressed: boolean; consume: boolean };
      const script: Step[] = [
        { dtMs: 16, parryPressed: false, consume: false },
        { dtMs: 16, parryPressed: true, consume: false },
        { dtMs: 100, parryPressed: false, consume: true },
        { dtMs: 200, parryPressed: false, consume: false },
        { dtMs: 1500, parryPressed: false, consume: false },
        { dtMs: 16, parryPressed: true, consume: false },
        { dtMs: 50, parryPressed: false, consume: true },
      ];
      const run = (): ShintyParryStateLike[] => {
        let s = createShintyParryState();
        const trace: ShintyParryStateLike[] = [s];
        for (const step of script) {
          s = tickShintyParry(s, { dtMs: step.dtMs, parryPressed: step.parryPressed }).state;
          if (step.consume) s = consumeParry(s).state;
          trace.push(s);
        }
        return trace;
      };
      const a = run();
      const b = run();
      expect(a).toEqual(b);
    });
  });

  describe('HUD accessors', () => {
    it('parryCooldownFraction returns 1 when ready', () => {
      const s = createShintyParryState();
      expect(parryCooldownFraction(s)).toBe(1);
    });

    it('parryCooldownFraction returns 1 during active window', () => {
      let s = createShintyParryState();
      s = tickShintyParry(s, { dtMs: 16, parryPressed: true }).state;
      // The chip should not show a cooldown sweep while the player is
      // actively parrying — the active state is its own visual.
      expect(parryCooldownFraction(s)).toBe(1);
    });

    it('parryCooldownFraction grows from 0 to 1 across cooldown', () => {
      let s = createShintyParryState();
      s = tickShintyParry(s, { dtMs: 16, parryPressed: true }).state;
      s = consumeParry(s).state;
      // Just consumed — cooldownRemainingMs = full → fraction = 0.
      expect(parryCooldownFraction(s)).toBeCloseTo(0, 5);
      s = tickShintyParry(s, { dtMs: PARRY_COOLDOWN_MS / 2, parryPressed: false }).state;
      expect(parryCooldownFraction(s)).toBeCloseTo(0.5, 1);
      s = tickShintyParry(s, { dtMs: PARRY_COOLDOWN_MS, parryPressed: false }).state;
      expect(parryCooldownFraction(s)).toBe(1);
    });
  });

  describe('reflection prototype helper', () => {
    function activeState(): ShintyParryStateLike {
      return tickShintyParry(createShintyParryState(), { dtMs: 16, parryPressed: true }).state;
    }

    it('reflects an enemy projectile along the facing vector while preserving speed and damage', () => {
      const result = reflectShintyProjectile(activeState(), {
        projectile: { owner: 'enemy', velocityX: -30, velocityY: 40, damage: 7, reflectable: true },
        facing: { x: 10, y: 0 },
      });

      expect(result.reflected).toBe(true);
      expect(result.reason).toBeNull();
      expect(result.projectile).toEqual({
        owner: 'player',
        velocityX: 50,
        velocityY: 0,
        damage: 7,
      });
      expect(result.state).toEqual({ windowRemainingMs: 0, cooldownRemainingMs: PARRY_COOLDOWN_MS });
    });

    it('falls back to reversing incoming velocity when facing is zero-length', () => {
      const result = reflectShintyProjectile(activeState(), {
        projectile: { owner: 'enemy', velocityX: 12, velocityY: -16, damage: 3, reflectable: true },
        facing: { x: 0, y: 0 },
      });

      expect(result.reflected).toBe(true);
      expect(result.projectile?.velocityX).toBe(-12);
      expect(result.projectile?.velocityY).toBe(16);
    });

    it('does not reflect or consume while parry is cooling down', () => {
      const cooldown = consumeParry(activeState()).state;
      const result = reflectShintyProjectile(cooldown, {
        projectile: { owner: 'enemy', velocityX: -100, velocityY: 0, damage: 5, reflectable: true },
        facing: { x: 1, y: 0 },
      });

      expect(result.reflected).toBe(false);
      expect(result.reason).toBe('cooldown');
      expect(result.projectile).toBeNull();
      expect(result.state).toBe(cooldown);
    });

    it('does not reflect immune projectiles and leaves the window available', () => {
      const state = activeState();
      const result = reflectShintyProjectile(state, {
        projectile: { owner: 'enemy', velocityX: -100, velocityY: 0, damage: 5, reflectable: false },
        facing: { x: 1, y: 0 },
      });

      expect(result.reflected).toBe(false);
      expect(result.reason).toBe('immune');
      expect(result.projectile).toBeNull();
      expect(result.state).toBe(state);
    });

    it('ignores player-owned projectiles without spending the parry window', () => {
      const state = activeState();
      const result = reflectShintyProjectile(state, {
        projectile: { owner: 'player', velocityX: 100, velocityY: 0, damage: 5, reflectable: true },
        facing: { x: 1, y: 0 },
      });

      expect(result.reflected).toBe(false);
      expect(result.reason).toBe('not_enemy_projectile');
      expect(result.projectile).toBeNull();
      expect(result.state).toBe(state);
    });

    it('same inputs produce identical reflected outputs', () => {
      const input = {
        projectile: { owner: 'enemy' as const, velocityX: -6, velocityY: 8, damage: 4, reflectable: true },
        facing: { x: 3, y: 4 },
      };

      expect(reflectShintyProjectile(activeState(), input)).toEqual(reflectShintyProjectile(activeState(), input));
    });
  });
});

type ShintyParryStateLike = {
  readonly windowRemainingMs: number;
  readonly cooldownRemainingMs: number;
};
