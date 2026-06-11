import type Phaser from 'phaser';
import { COLORS } from '../config';
import { textStyle } from './typography';
import { audio } from '../systems/AudioSystem';

const TRACK_W = 40;
const TRACK_H = 20;
const THUMB_R = 8;
const TRACK_ON = COLORS.SCOTTISH_BLUE;
const TRACK_OFF = COLORS.PANEL_SURFACE;
const TRACK_HOVER_ON = 0x0077dd;
const TRACK_HOVER_OFF = 0x252540;

/** Pure visual state — testable without Phaser. */
export function resolveToggleVisual(on: boolean) {
  return {
    trackColor: on ? TRACK_ON : TRACK_OFF,
    trackColorOff: TRACK_OFF,
    trackHover: on ? TRACK_HOVER_ON : TRACK_HOVER_OFF,
    thumbX: on ? (TRACK_W / 2 - THUMB_R) : -(TRACK_W / 2 - THUMB_R),
  };
}

export interface GameToggleOpts {
  x: number;
  y: number;
  label: string;
  initialValue: boolean;
  onChange: (value: boolean) => void;
}

export interface GameToggleResult {
  container: Phaser.GameObjects.Container;
  setValue: (on: boolean) => void;
  destroy: () => void;
}

export function createGameToggle(
  scene: Phaser.Scene,
  opts: GameToggleOpts,
): GameToggleResult {
  let on = opts.initialValue;

  const label = scene.add
    .text(-60, 0, opts.label, textStyle('label'))
    .setOrigin(1, 0.5);

  const track = scene.add
    .rectangle(0, 0, TRACK_W, TRACK_H, on ? TRACK_ON : TRACK_OFF)
    .setInteractive({ useHandCursor: true });

  const thumb = scene.add
    .circle(on ? (TRACK_W / 2 - THUMB_R) : -(TRACK_W / 2 - THUMB_R), 0, THUMB_R, 0xffffff);

  const container = scene.add.container(opts.x, opts.y, [label, track, thumb]);

  function updateVisual() {
    const v = resolveToggleVisual(on);
    track.setFillStyle(v.trackColor);
    thumb.setX(v.thumbX);
  }

  track.on('pointerover', () => {
    track.setFillStyle(resolveToggleVisual(on).trackHover);
  });
  track.on('pointerout', updateVisual);
  track.on('pointerdown', () => {
    on = !on;
    updateVisual();
    audio.playClick();
    opts.onChange(on);
  });

  return {
    container,
    setValue: (val: boolean) => { on = val; updateVisual(); },
    destroy: () => container.destroy(),
  };
}
