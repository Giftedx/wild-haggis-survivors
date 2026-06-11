/**
 * NicnevinWildHuntController — owns the lifetime of the Wild Hunt
 * mechanic for the duration of a run. Subscribes to the global
 * `bossEnraged` event at construction so it self-arms the moment
 * Nicnevin crosses 50 % HP, and exposes a single `tick(delta, ...)` to
 * be called from `tickFrameWorld` each frame.
 *
 * The state machine itself lives in pure helpers in `nicnevinWildHunt.ts`
 * (unit-tested in isolation). This file is the wiring shell that binds
 * the helper to scene-level dependencies (XPSystem override / scatter,
 * juice toast, audio sting) and the global event bus.
 *
 * Lifetime:
 *  - constructed in `installRunStartupHud`.
 *  - `tick(delta, ...)` called per frame from `tickFrameWorld` *after*
 *    `spawnSystem.update` (so boss position is current) and *before*
 *    `xpSystem.update` (so the override pin lands before gem magnet).
 *  - `dispose()` removes the bus listener; called on scene reset /
 *    re-entry so leftover subscriptions never bleed across runs.
 */
import { globalEventBus } from '../../core/GlobalEventBus';
import {
  WildHuntState,
  createWildHuntState,
  startWildHunt,
  stopWildHunt,
  tickWildHunt,
} from './nicnevinWildHunt';

export interface NicnevinWildHuntDeps {
  setPullSourceOverride(source: { x: number; y: number } | null): void;
  scatterGems(): void;
  /** Toast / SFX / caption hook for cycle-start beats. */
  onPullStart(): void;
}

export interface NicnevinTickInputs {
  bossX: number;
  bossY: number;
  bossActive: boolean;
}

export class NicnevinWildHuntController {
  private state: WildHuntState = createWildHuntState();
  private unsub: (() => void) | null = null;
  private deps: NicnevinWildHuntDeps;

  constructor(deps: NicnevinWildHuntDeps) {
    this.deps = deps;
    this.unsub = globalEventBus.on('bossEnraged', (enemyKey: string) => {
      if (enemyKey !== 'nicnevin') return;
      startWildHunt(this.state);
      this.deps.onPullStart();
    });
  }

  tick(delta: number, inputs: NicnevinTickInputs): void {
    tickWildHunt(this.state, delta, inputs, {
      setPullSourceOverride: this.deps.setPullSourceOverride,
      scatterGems: this.deps.scatterGems,
      onPullStart: this.deps.onPullStart,
    });
  }

  /** Forces the cycle to idle without releasing the override (caller
   *  is responsible for clearing it via `setPullSourceOverride(null)`
   *  if needed). Used by run-reset paths. */
  reset(): void {
    stopWildHunt(this.state);
  }

  dispose(): void {
    this.unsub?.();
    this.unsub = null;
    stopWildHunt(this.state);
  }

  /** Test/debug accessor — returns a snapshot of the current state. */
  getStateForDebug(): Readonly<WildHuntState> {
    return { ...this.state };
  }
}
