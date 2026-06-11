/**
 * CailleachGauntletScheduler — scene orchestrator for V2 of The Moor
 * Remembers. Ticks the pure `cailleachGauntlet` state machine each
 * frame; fires hook callbacks on every phase-transition edge.
 *
 * Sister to `CairnOfEchoesScheduler` — hook-driven, pure-tick,
 * Phaser-free; the scene wires sprite spawn / boss spawn / outcome
 * commit / banter through hooks.
 *
 * Spec: `docs/superpowers/specs/2026-05-22-moor-remembers-v2-design.md`.
 */
import {
  advanceGauntlet,
  initialGauntletState,
  type CailleachGauntletState,
  type GauntletTickInput,
} from './cailleachGauntlet';
import type { FallenCairn } from '../../utils/save/fallenCairns';

export interface CailleachGauntletSchedulerHooks {
  getTouchedThisRun(): readonly FallenCairn[];
  getGameTimeMs(): number;
  getPlayerPosition(): { readonly x: number; readonly y: number };
  isBossDead(): boolean;
  isPlayerDead(): boolean;
  onArmed(payload: { readonly touchedSavedAts: readonly number[] }): void;
  onCandlesLit(payload: {
    readonly touchedSavedAts: readonly number[];
    readonly candleRing: readonly { readonly x: number; readonly y: number }[];
  }): void;
  onCailleachSpawned(payload: {
    readonly centerX: number;
    readonly centerY: number;
  }): void;
  onWin(payload: { readonly wreathedSavedAts: readonly number[] }): void;
  onLose(payload: { readonly extinguishedSavedAts: readonly number[] }): void;
}

export class CailleachGauntletScheduler {
  private state: CailleachGauntletState = initialGauntletState();

  constructor(private readonly hooks: CailleachGauntletSchedulerHooks) {}

  reset(): void {
    this.state = initialGauntletState();
  }

  getState(): CailleachGauntletState {
    return this.state;
  }

  tick(): void {
    const touched = this.hooks.getTouchedThisRun();
    const pos = this.hooks.getPlayerPosition();
    const input: GauntletTickInput = {
      gameTimeMs: this.hooks.getGameTimeMs(),
      touchedSavedAts: touched.map((c) => c.savedAt),
      playerX: pos.x,
      playerY: pos.y,
      bossDead: this.hooks.isBossDead(),
      playerDead: this.hooks.isPlayerDead(),
    };
    const prev = this.state;
    const next = advanceGauntlet(prev, input);
    if (next === prev) return;
    this.state = next;
    this.fireTransitionHooks(prev, next, pos);
  }

  private fireTransitionHooks(
    prev: CailleachGauntletState,
    next: CailleachGauntletState,
    playerPos: { readonly x: number; readonly y: number },
  ): void {
    // idle → armed
    if (prev.phase === 'idle' && next.phase === 'armed') {
      this.hooks.onArmed({ touchedSavedAts: next.touchedSavedAts });
      return;
    }
    // idle → candles_lit (multi-step in one call when post-14:00)
    if (prev.phase === 'idle' && next.phase === 'candles_lit') {
      this.hooks.onArmed({ touchedSavedAts: next.touchedSavedAts });
      this.hooks.onCandlesLit({
        touchedSavedAts: next.touchedSavedAts,
        candleRing: next.candleRing,
      });
      return;
    }
    // idle → engaged (multi-step in one call — very-late touch case)
    if (prev.phase === 'idle' && next.phase === 'engaged') {
      this.hooks.onArmed({ touchedSavedAts: next.touchedSavedAts });
      this.hooks.onCandlesLit({
        touchedSavedAts: next.touchedSavedAts,
        candleRing: next.candleRing,
      });
      this.hooks.onCailleachSpawned({ centerX: playerPos.x, centerY: playerPos.y });
      return;
    }
    // armed → candles_lit
    if (prev.phase === 'armed' && next.phase === 'candles_lit') {
      this.hooks.onCandlesLit({
        touchedSavedAts: next.touchedSavedAts,
        candleRing: next.candleRing,
      });
      return;
    }
    // armed → engaged (multi-step in one call)
    if (prev.phase === 'armed' && next.phase === 'engaged') {
      this.hooks.onCandlesLit({
        touchedSavedAts: next.touchedSavedAts,
        candleRing: next.candleRing,
      });
      this.hooks.onCailleachSpawned({ centerX: playerPos.x, centerY: playerPos.y });
      return;
    }
    // candles_lit → engaged
    if (prev.phase === 'candles_lit' && next.phase === 'engaged') {
      this.hooks.onCailleachSpawned({
        centerX: playerPos.x,
        centerY: playerPos.y,
      });
      return;
    }
    // engaged → resolved
    if (prev.phase === 'engaged' && next.phase === 'resolved') {
      if (next.outcome === 'win') {
        this.hooks.onWin({ wreathedSavedAts: next.touchedSavedAts });
      } else if (next.outcome === 'lose') {
        this.hooks.onLose({ extinguishedSavedAts: next.touchedSavedAts });
      }
    }
  }
}
