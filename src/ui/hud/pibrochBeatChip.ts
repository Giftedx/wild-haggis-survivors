import type * as Phaser from 'phaser';
import type { HudWidgetContext } from './hudWidget';

/**
 * Pibroch Beat Indicator — Wild Living World Phase 2 HUD chip.
 *
 * Sits at the bottom of the left skill-widget column (below the
 * Selkie form chip). Shown only when the player owns a Waulking
 * Mallet *or* its evolution Pibroch Hammer — those are the two
 * weapons whose damage actually couples to the music engine's
 * quarter-note clock. For every other run the chip stays invisible
 * and contributes no per-frame cost (HUD update is gated on visible).
 *
 * Two visual modes, switched by the `reduceFlashing` setting:
 *
 *   - **Full mode** — 4 pip dots that fill from left to right with
 *     the beat index modulo 4. The 4th pip is brighter (the crescendo
 *     beat) so the player learns to time the heavy hit. The whole
 *     pip rack flashes briefly gold when the engine reports the hit
 *     window is aligned.
 *   - **Reduced mode** — single static label "BEAT" stays steady;
 *     no flash, no pulse, no animated pips. Accessibility-safe
 *     (matches the rest of the HUD's `reduceFlashing` contract).
 *
 * The chip never modifies gameplay state; it's a readout of the
 * already-existing alignment math (`isWaulkingBeatAligned`).
 */
const PIBROCH_CHIP_W = 56;
const PIBROCH_CHIP_H = 11;
export const PIBROCH_CHIP_HEIGHT_PX = PIBROCH_CHIP_H;

export interface PibrochBeatChipRefs {
  bg: Phaser.GameObjects.Rectangle;
  /** Static label drawn when `reduceFlashing` is enabled. */
  reducedLabel: Phaser.GameObjects.Text;
  /** Four pip dots; index 0 = leftmost lead-in, index 3 = crescendo. */
  pips: Phaser.GameObjects.Rectangle[];
}

export function buildPibrochBeatChip(ctx: HudWidgetContext): PibrochBeatChipRefs {
  const { scene, depth: d, hpBarH } = ctx;
  const x = 12;
  // Sits BELOW the Selkie chip. The column's height stack at this
  // point is: hp(hpBarH) + 1 + 3px gap + 2 + chipH(parry) + 2 +
  // chipH(companion) + 2 + chipH(selkie) + 2 + this chip.
  const y =
    12 + hpBarH + 1 + 3 + 2 + PIBROCH_CHIP_H + 2 + PIBROCH_CHIP_H + 2 + PIBROCH_CHIP_H + 2;

  const bg = ctx.addEl(
    scene.add.rectangle(x, y, PIBROCH_CHIP_W, PIBROCH_CHIP_H, 0x2a2418, 0.85)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0xc89a52, 0.6)
      .setScrollFactor(0)
      .setDepth(d)
      .setVisible(false),
  );

  const reducedLabel = ctx.addEl(
    scene.add.text(x + PIBROCH_CHIP_W / 2, y + PIBROCH_CHIP_H / 2, 'BEAT', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#e6c468',
      fontStyle: 'bold',
    })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(d + 1)
      .setVisible(false),
  );

  // Four pip dots, evenly spaced across the chip's inner width. Pip 3
  // is the crescendo — slightly bigger so it reads even at the muted
  // colour.
  const pips: Phaser.GameObjects.Rectangle[] = [];
  const innerW = PIBROCH_CHIP_W - 12;
  const gap = innerW / 3;
  for (let i = 0; i < 4; i++) {
    const px = x + 6 + i * gap;
    const py = y + PIBROCH_CHIP_H / 2;
    const isCrescendo = i === 3;
    const size = isCrescendo ? 4 : 3;
    const pip = ctx.addEl(
      scene.add.rectangle(px, py, size, size, isCrescendo ? 0xe6c468 : 0x9a7028, 0.5)
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(d + 1)
        .setVisible(false),
    );
    pips.push(pip);
  }

  return { bg, reducedLabel, pips };
}

/**
 * Apply a frame's pip / label state. Caller decides which mode to
 * render — the chip stays presentation-only and never reads from
 * `SettingsManager` directly so unit tests can drive it deterministically.
 */
export function applyPibrochBeatChipState(
  refs: PibrochBeatChipRefs,
  state: {
    visible: boolean;
    reducedMode: boolean;
    beatIndex: number;
    aligned: boolean;
  },
): void {
  refs.bg.setVisible(state.visible);
  if (!state.visible) {
    refs.reducedLabel.setVisible(false);
    for (const pip of refs.pips) pip.setVisible(false);
    return;
  }

  if (state.reducedMode) {
    refs.reducedLabel.setVisible(true);
    for (const pip of refs.pips) pip.setVisible(false);
    return;
  }

  refs.reducedLabel.setVisible(false);
  const cycleStep = ((Math.max(0, Math.floor(state.beatIndex)) % 4) + 4) % 4;
  for (let i = 0; i < refs.pips.length; i++) {
    const pip = refs.pips[i];
    pip.setVisible(true);
    const isCrescendo = i === 3;
    if (i <= cycleStep) {
      // Lit pip — brighter when aligned.
      const colour = isCrescendo ? 0xfff0a0 : 0xe6c468;
      pip.setFillStyle(colour, state.aligned ? 1 : 0.8);
    } else {
      // Dim pip — waiting.
      const colour = isCrescendo ? 0x9a7028 : 0x4a3a14;
      pip.setFillStyle(colour, 0.55);
    }
  }
}
