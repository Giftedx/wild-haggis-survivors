export type TimeTokenSpec = {
  /** If set, requests a timeScale (lowest active value wins). */
  timeScale?: number;
  /** If true, requests physics paused (any active pause wins). */
  pausePhysics?: boolean;
  /** Optional auto-expire duration in ms (ticks down via update(deltaMs)). */
  durationMs?: number;
};

type ActiveToken = {
  timeScale?: number;
  pausePhysics: boolean;
  remainingMs: number | null;
};

import Phaser from 'phaser';

export type TimeAdapter = {
  setTimeScale: (value: number) => void;
  pausePhysics: () => void;
  resumePhysics: () => void;
  getPhysicsPaused: () => boolean;
};

export function createPhaserTimeAdapter(scene: Phaser.Scene): TimeAdapter {
  return {
    setTimeScale: (v) => { scene.time.timeScale = v; },
    pausePhysics: () => { scene.physics.world.pause(); },
    resumePhysics: () => { scene.physics.world.resume(); },
    getPhysicsPaused: () => scene.physics.world.isPaused,
  };
}

/**
 * TimeManager is the single authority for timeScale + physics pause state.
 * Systems must request/release tokens; direct mutation elsewhere is forbidden.
 */
export class TimeManager {
  private adapter: TimeAdapter;
  private tokens = new Map<string, ActiveToken>();

  private appliedTimeScale = 1;
  private appliedPhysicsPaused = false;

  constructor(adapter: TimeAdapter) {
    this.adapter = adapter;
  }

  reset(): void {
    this.tokens.clear();
    this.recomputeAndApply();
  }

  request(key: string, spec: TimeTokenSpec): void {
    const token: ActiveToken = {
      timeScale: spec.timeScale,
      pausePhysics: Boolean(spec.pausePhysics),
      remainingMs: spec.durationMs !== undefined ? Math.max(0, spec.durationMs) : null,
    };
    this.tokens.set(key, token);
    this.recomputeAndApply();
  }

  /** Convenience: request a token and auto-expire after durationMs. */
  requestForDuration(key: string, spec: Omit<TimeTokenSpec, 'durationMs'>, durationMs: number): void {
    this.request(key, { ...spec, durationMs });
  }

  release(key: string): void {
    if (!this.tokens.has(key)) return;
    this.tokens.delete(key);
    this.recomputeAndApply();
  }

  has(key: string): boolean {
    return this.tokens.has(key);
  }

  getEffectiveTimeScale(): number {
    return this.appliedTimeScale;
  }

  isPhysicsPaused(): boolean {
    return this.appliedPhysicsPaused;
  }

  /** Tick durations and apply any resulting state changes. */
  update(deltaMs: number): void {
    if (this.tokens.size === 0) return;
    if (deltaMs <= 0) return;

    let changed = false;
    for (const [key, token] of this.tokens) {
      if (token.remainingMs === null) continue;
      token.remainingMs -= deltaMs;
      if (token.remainingMs <= 0) {
        this.tokens.delete(key);
        changed = true;
      }
    }

    if (changed) this.recomputeAndApply();
  }

  private recomputeAndApply(): void {
    // Lowest timeScale wins (slowest). Default 1.
    let effectiveTimeScale = 1;
    let anyTimeScale = false;
    let pausePhysics = false;

    for (const t of this.tokens.values()) {
      if (t.pausePhysics) pausePhysics = true;
      if (t.timeScale !== undefined) {
        anyTimeScale = true;
        effectiveTimeScale = Math.min(effectiveTimeScale, t.timeScale);
      }
    }

    if (!anyTimeScale) effectiveTimeScale = 1;

    // Apply timeScale
    if (effectiveTimeScale !== this.appliedTimeScale) {
      this.appliedTimeScale = effectiveTimeScale;
      this.adapter.setTimeScale(effectiveTimeScale);
    }

    // Apply physics pause
    if (pausePhysics !== this.appliedPhysicsPaused) {
      this.appliedPhysicsPaused = pausePhysics;
      if (pausePhysics) {
        if (!this.adapter.getPhysicsPaused()) this.adapter.pausePhysics();
      } else {
        if (this.adapter.getPhysicsPaused()) this.adapter.resumePhysics();
      }
    }
  }
}

