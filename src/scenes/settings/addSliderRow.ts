/**
 * Slider row builder — body extracted from SettingsScene.addSliderRow.
 *
 * Behavior parity required: track + thumb + value text + click-to-jump
 * hit area + gamepad mark + DOM mirror entry. Visuals scale via uiScale
 * (per-element multiplicative); the value text right edge clamps to
 * `width - 44` so it never falls off the panel on narrow viewports.
 *
 * Side-effects: pushes one entry each into ctx.gpRows + ctx.domRowSyncs.
 * On any value change calls ctx.persistAndApply() then ctx.refreshDomActions().
 */
import * as Phaser from 'phaser';
import { audio } from '../../systems/AudioSystem';
import {
  sliderRatioFromValue,
  sliderValueFromRatio,
  steppedSliderBump,
  formatSliderValue,
} from '../settingsSliderMath';
import {
  resolveSettingsPalette,
  SETTINGS_TROUGH_FILL,
  SETTINGS_TROUGH_STROKE,
  SETTINGS_THUMB_STROKE,
} from '../settingsPalette';
import type { SettingsRowContext } from './rowContext';

export type SliderRowKey =
  | 'masterVolume'
  | 'sfxVolume'
  | 'musicVolume'
  | 'uiScale'
  | 'motionScale'
  | 'captionTextScale'
  | 'assistModeGameSpeed';

export function addSliderRow(
  ctx: SettingsRowContext,
  label: string,
  key: SliderRowKey,
  min: number,
  max: number,
  step: number,
): void {
  const { width } = ctx.scene.scale;
  const { y, rowStep } = ctx.takeRowY();

  ctx.addRowLabel(label, y, 6);

  const narrow = ctx.isNarrowLayout();
  const trackX = narrow ? Math.round(width * 0.46) : Math.round(width * 0.46);
  const trackY = y + 14;
  const trackW = narrow ? Math.max(104, width - trackX - 76) : 240;
  const trackH = 8;

  const trough = ctx.scene.add
    .rectangle(trackX, trackY, trackW, trackH, SETTINGS_TROUGH_FILL, 1)
    .setStrokeStyle(1, SETTINGS_TROUGH_STROKE, 0.8)
    .setOrigin(0, 0.5);
  trough.setScale(ctx.uiScale, ctx.uiScale);

  const fillColor = resolveSettingsPalette(ctx.highContrastUi).sectionAccent;
  const fill = ctx.scene.add
    .rectangle(trackX, trackY, 1, trackH - 2, fillColor, 1)
    .setOrigin(0, 0.5);
  fill.setScale(1, ctx.uiScale);

  const thumb = ctx.scene.add
    .circle(trackX, trackY, 7, fillColor, 1)
    .setStrokeStyle(2, SETTINGS_THUMB_STROKE, 1)
    .setInteractive({ useHandCursor: true, draggable: true });
  thumb.setScale(ctx.uiScale);

  const valText = ctx.scene.add
    .text(Math.min(width - 44, trackX + (trackW + 14) * ctx.uiScale), y + 6, '', {
      fontFamily: 'monospace',
      fontSize: narrow ? '11px' : '14px',
      color: ctx.valueColor,
    })
    .setOrigin(0, 0)
    .setScale(ctx.uiScale);

  const scaledTrackW = trackW * ctx.uiScale;
  const trackLeftScaled = trackX;

  const readVal = (): number => ctx.working[key] as number;
  const writeVal = (v: number): void => {
    (ctx.working as unknown as Record<string, number>)[key] = v;
  };

  const syncVisual = () => {
    const current = readVal();
    const ratio = sliderRatioFromValue(current, min, max);
    fill.width = Math.max(1, ratio * trackW);
    thumb.x = trackLeftScaled + ratio * scaledTrackW;
    valText.setText(formatSliderValue(key, current));
  };

  const setFromRatio = (ratio: number) => {
    writeVal(sliderValueFromRatio(ratio, min, max, step));
    syncVisual();
    ctx.persistAndApply();
    ctx.refreshDomActions();
  };

  const bump = (direction: number) => {
    writeVal(steppedSliderBump(readVal(), direction, min, max, step));
    syncVisual();
    ctx.persistAndApply();
    ctx.refreshDomActions();
  };

  syncVisual();

  const hit = ctx.scene.add
    .rectangle(trackLeftScaled, trackY, scaledTrackW, 30 * ctx.uiScale, 0x000000, 0)
    .setOrigin(0, 0.5)
    .setInteractive({ useHandCursor: true });
  hit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    const ratio = (pointer.x - trackLeftScaled) / scaledTrackW;
    audio.playClick();
    setFromRatio(ratio);
  });

  thumb.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => {
    const ratio = (dragX - trackLeftScaled) / scaledTrackW;
    setFromRatio(ratio);
  });
  thumb.on('dragend', () => {
    audio.playClick();
  });

  const markH = Math.max(20, rowStep - 4);
  const mark = ctx.scene.add
    .rectangle(width / 2, y + 14, width - 56, markH, 0x000000, 0)
    .setStrokeStyle(0);
  ctx.gpRows.push({
    kind: 'slider',
    minus: () => bump(-1),
    plus: () => bump(+1),
    mark,
  });
  ctx.domRowSyncs.push(() => ({
    id: `slider-${key}`,
    kind: 'slider',
    label: ctx.compactSettingsLabel(label),
    valueText: formatSliderValue(key, readVal()),
    onActivate: () => bump(+1),
  }));
}
