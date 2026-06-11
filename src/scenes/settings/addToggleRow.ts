/**
 * Toggle row builder — body extracted from SettingsScene.addToggleRow.
 *
 * Behavior parity required: track + sliding thumb (animated) + glossy
 * highlight + ON/OFF status text + forgiving hitbox + gamepad mark +
 * DOM mirror entry. The optional `confirmOnEnable` ceremony defers the
 * flip when toggling FROM off TO on so callers can route through a
 * modal (Ironmoor mode); off→on without a modal flips immediately.
 *
 * Uses ctx.scene.tweens for the thumb slide animation.
 */
import { audio } from '../../systems/AudioSystem';
import { toggleStateDisplay, resolveToggleTrackStyle } from '../settingsToggle';
import type { SettingsRowContext } from './rowContext';

export type ToggleRowKey =
  | 'screenShake'
  | 'damageNumbers'
  | 'reduceParticles'
  | 'reduceFlashing'
  | 'highContrastUi'
  | 'captionsEnabled'
  | 'telemetryOptIn'
  | 'skipActIntermissions'
  | 'ironmoorMode'
  | 'speedrunTimerVisible'
  | 'captureEnabled'
  | 'assistMode'
  | 'assistModeExtendedIFrames'
  | 'assistModeExtendedComboWindow'
  | 'assistModeInvincibility'
  | 'disableSeasonalEvents'
  | 'disableHazards';

export function addToggleRow(
  ctx: SettingsRowContext,
  label: string,
  key: ToggleRowKey,
  confirmOnEnable?: (proceed: () => void) => void,
): void {
  const { width } = ctx.scene.scale;
  const { y, rowStep } = ctx.takeRowY();

  ctx.addRowLabel(label, y);

  const readVal = (): boolean => ctx.working[key] as boolean;
  const writeVal = (v: boolean): void => {
    (ctx.working as unknown as Record<string, boolean>)[key] = v;
  };

  const trackStyle = resolveToggleTrackStyle(readVal());
  const narrow = ctx.isNarrowLayout();
  const cx = ctx.rightControlCenter(narrow ? 54 : 58);
  const cy = y + 18;
  const trackW = narrow ? 54 : 58;
  const trackH = 22;
  const thumbR = 9;

  const btn = ctx.scene.add
    .rectangle(cx, cy, trackW, trackH, trackStyle.trackFill, 1)
    .setStrokeStyle(1.5, trackStyle.trackBorder, 0.9)
    .setInteractive({ useHandCursor: true });
  btn.setScale(ctx.uiScale);

  const shadow = ctx.scene.add
    .rectangle(cx, cy - (trackH / 2) + Math.round(2 * ctx.uiScale), trackW - 4, 2, 0x000000, 0.3)
    .setScale(ctx.uiScale);

  const thumbLeftX = cx - trackW / 2 + thumbR + 3;
  const thumbRightX = cx + trackW / 2 - thumbR - 3;
  const thumb = ctx.scene.add
    .circle(readVal() ? thumbRightX : thumbLeftX, cy, thumbR, trackStyle.thumbFill, 1)
    .setStrokeStyle(1, 0x000000, 0.4)
    .setScale(ctx.uiScale);
  const thumbGloss = ctx.scene.add
    .circle(readVal() ? thumbRightX : thumbLeftX, cy - 2, thumbR * 0.5, 0xffffff, 0.35)
    .setScale(ctx.uiScale);

  const initialState = toggleStateDisplay(readVal());
  const txt = ctx.scene.add
    .text(narrow ? cx : cx - trackW / 2 - 8, cy, initialState.text, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: initialState.color,
      fontStyle: 'bold',
    })
    .setOrigin(narrow ? 0.5 : 1, 0.5)
    .setScale(ctx.uiScale);

  const sync = () => {
    const isOn = readVal();
    const s = resolveToggleTrackStyle(isOn);
    btn.setFillStyle(s.trackFill);
    btn.setStrokeStyle(1.5, s.trackBorder, 0.9);
    const state = toggleStateDisplay(isOn);
    txt.setText(state.text);
    txt.setColor(state.color);
    ctx.scene.tweens.killTweensOf(thumb);
    ctx.scene.tweens.killTweensOf(thumbGloss);
    const targetX = isOn ? thumbRightX : thumbLeftX;
    ctx.scene.tweens.add({
      targets: [thumb, thumbGloss],
      x: targetX,
      duration: 140,
      ease: 'Quad.easeOut',
    });
    thumb.setFillStyle(s.thumbFill);
  };

  const doToggle = () => {
    audio.playClick();
    const nextValue = !readVal();
    if (nextValue && confirmOnEnable) {
      confirmOnEnable(() => {
        writeVal(true);
        sync();
        ctx.persistAndApply();
        ctx.refreshDomActions();
      });
      return;
    }
    writeVal(nextValue);
    sync();
    ctx.persistAndApply();
    ctx.refreshDomActions();
  };

  btn.on('pointerdown', doToggle);
  txt.setInteractive({ useHandCursor: true });
  txt.on('pointerdown', doToggle);
  thumb.setInteractive({ useHandCursor: true });
  thumb.on('pointerdown', doToggle);
  void shadow;

  const markH = Math.max(20, rowStep - 4);
  const mark = ctx.scene.add
    .rectangle(width / 2, y + 10, width - 56, markH, 0x000000, 0)
    .setStrokeStyle(0);
  ctx.gpRows.push({
    kind: 'toggle',
    toggle: doToggle,
    mark,
  });
  ctx.domRowSyncs.push(() => ({
    id: `toggle-${key}`,
    kind: 'toggle',
    label: ctx.compactSettingsLabel(label),
    valueText: toggleStateDisplay(readVal()).text,
    onActivate: doToggle,
  }));
}
