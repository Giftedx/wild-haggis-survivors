/**
 * CairnOfEchoesScheduler — orchestrates the persistent cairns spawned
 * by past-self deaths (The Moor Remembers, spec dated 2026-05-22).
 *
 * Loads the cairn list from meta save at run-start; each tick checks
 * which cairns are within `CAIRN_RENDER_RADIUS_PX` and routes
 * spawn/destroy through hook callbacks (so the scheduler itself stays
 * Phaser-free + unit-testable). Walk-over detection uses
 * `CAIRN_TOUCH_RADIUS_PX` (matches AncestralEcho's touch radius — the
 * cairn IS the settled echo). Each cairn fires walk-over at most once
 * per run; resets via `reset()`.
 *
 * Sister to `CairnStackingScheduler` — same hook-driven shape, same
 * pure-tick-method, same `reset()` contract.
 */
import {
  CAIRN_RENDER_RADIUS_PX,
  CAIRN_TOUCH_RADIUS_PX,
  type FallenCairn,
} from '../../utils/save/fallenCairns';
import { pickWhisper, type WhisperResult } from './cairnOfEchoesWhisper';

export interface CairnOfEchoesSchedulerHooks {
  getCairns(): readonly FallenCairn[];
  getRngSample(): number;
  isFirstDeathTouchEver(): boolean;
  getOldDroverRevealedCount(): number;
  onWalkOver(payload: { cairn: FallenCairn; whisper: WhisperResult }): void;
  onSpriteCreate(cairn: FallenCairn): void;
  onSpriteDestroy(cairn: FallenCairn): void;
}

export class CairnOfEchoesScheduler {
  private cairns: FallenCairn[] = [];
  private rendered: Set<FallenCairn> = new Set();
  private touchedThisRun: FallenCairn[] = [];

  constructor(private readonly hooks: CairnOfEchoesSchedulerHooks) {}

  /** Populate cairn list from meta save. Call once at run-start after `reset()`. */
  load(): void {
    this.cairns = [...this.hooks.getCairns()];
  }

  /** Reset per-run state (touched list + rendered set). Call from `create()` before `load()`. */
  reset(): void {
    this.rendered.clear();
    this.touchedThisRun.length = 0;
  }

  /**
   * Merge a fresh cairn into the live list mid-run — called by
   * AncestralEcho's `onSettle` callback so a just-died echo immediately
   * joins the scheduler without a scene restart.
   */
  addCairn(cairn: FallenCairn): void {
    this.cairns.push(cairn);
  }

  /**
   * Per-frame tick. Culls/unculls sprites by render radius; fires
   * walk-over at most once per cairn per run when inside touch radius.
   *
   * @param _delta — raw wall-clock delta (unused; kept for sister-shape parity)
   * @param playerX — world-space X
   * @param playerY — world-space Y
   */
  tick(_delta: number, playerX: number, playerY: number): void {
    for (const cairn of this.cairns) {
      const dx = cairn.x - playerX;
      const dy = cairn.y - playerY;
      const distSq = dx * dx + dy * dy;
      const inRender = distSq <= CAIRN_RENDER_RADIUS_PX * CAIRN_RENDER_RADIUS_PX;
      const sprited = this.rendered.has(cairn);

      if (inRender && !sprited) {
        this.hooks.onSpriteCreate(cairn);
        this.rendered.add(cairn);
      } else if (!inRender && sprited) {
        this.hooks.onSpriteDestroy(cairn);
        this.rendered.delete(cairn);
      }

      if (
        inRender &&
        !this.touchedThisRun.includes(cairn) &&
        distSq <= CAIRN_TOUCH_RADIUS_PX * CAIRN_TOUCH_RADIUS_PX
      ) {
        this.touchedThisRun.push(cairn);
        const whisper = pickWhisper({
          variantKey: cairn.variantKey,
          isFirstDeathTouchEver: this.hooks.isFirstDeathTouchEver(),
          oldDroverRevealedCount: this.hooks.getOldDroverRevealedCount(),
          rngSample: this.hooks.getRngSample(),
        });
        this.hooks.onWalkOver({ cairn, whisper });
      }
    }
  }

  /**
   * Tear down: destroy all rendered sprites and clear all internal state.
   * Call when the run ends or the scene shuts down.
   */
  destroy(): void {
    for (const cairn of this.rendered) {
      this.hooks.onSpriteDestroy(cairn);
    }
    this.rendered.clear();
    this.touchedThisRun.length = 0;
    this.cairns = [];
  }

  /** Coordinates for all loaded cairns — fed to the minimap overlay. */
  getMinimapMarkers(): Array<{ x: number; y: number }> {
    return this.cairns.map((c) => ({ x: c.x, y: c.y }));
  }

  /**
   * V2 (Cailleach Gauntlet) — read which cairns have been walked over
   * this run, in touch order. The gauntlet state machine consumes this
   * to count toward the 7-touch threshold.
   */
  getTouchedThisRun(): readonly FallenCairn[] {
    return this.touchedThisRun;
  }

  /** V2 — full FallenCairn refs (not just coords) for state-coloured minimap. */
  getMinimapCairns(): readonly FallenCairn[] {
    return this.cairns;
  }
}
