/**
 * Banter frequency cycle row — body extracted from
 * SettingsScene.addBanterFrequencyRow. Tap-to-cycle chip with the
 * current frequency label (Wheesht / Sparing / Natural / Gabby).
 *
 * Mutates `ctx.working.banterFrequency` in place rather than replacing
 * the working object — the captured `ctx.working` ref stays valid.
 */
import { audio } from '../../systems/AudioSystem';
import { t } from '../../core/i18n';
import {
  banterChipStyle,
  cycleBanterFrequency,
  labelForBanterFrequency,
} from '../settingsBanterFrequency';
import type { SettingsRowContext } from './rowContext';

export function addBanterFrequencyRow(ctx: SettingsRowContext): void {
  const { width } = ctx.scene.scale;
  const { y, rowStep } = ctx.takeRowY();

  ctx.addRowLabel(t('ui.settings.banter_frequency'), y);

  const chipW = ctx.isNarrowLayout() ? 104 : 110;
  const chipH = 26;
  const cx = ctx.rightControlCenter(chipW);
  const cy = y + 18;
  const initialStyle = banterChipStyle(ctx.working.banterFrequency);
  const btn = ctx.scene.add
    .rectangle(cx, cy, chipW, chipH, initialStyle.fillColor, 1)
    .setStrokeStyle(1.5, initialStyle.strokeColor, 0.9)
    .setInteractive({ useHandCursor: true });
  btn.setScale(ctx.uiScale);

  const txt = ctx.scene.add
    .text(cx, cy, labelForBanterFrequency(ctx.working.banterFrequency), {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: initialStyle.textColor,
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setScale(ctx.uiScale);

  const sync = () => {
    const v = ctx.working.banterFrequency;
    const style = banterChipStyle(v);
    txt.setText(labelForBanterFrequency(v));
    txt.setColor(style.textColor);
    btn.setFillStyle(style.fillColor);
    btn.setStrokeStyle(1.5, style.strokeColor, 0.9);
  };

  const cycle = () => {
    audio.playClick();
    ctx.working.banterFrequency = cycleBanterFrequency(ctx.working.banterFrequency);
    sync();
    ctx.persistAndApply();
    ctx.refreshDomActions();
  };

  btn.on('pointerdown', cycle);
  txt.setInteractive({ useHandCursor: true });
  txt.on('pointerdown', cycle);

  const markH = Math.max(20, rowStep - 4);
  const mark = ctx.scene.add
    .rectangle(width / 2, y + 10, width - 56, markH, 0x000000, 0)
    .setStrokeStyle(0);
  ctx.gpRows.push({
    kind: 'toggle',
    toggle: cycle,
    mark,
  });
  const banterLabel = t('ui.settings.banter_frequency');
  ctx.domRowSyncs.push(() => ({
    id: 'cycle-banter',
    kind: 'cycle',
    label: ctx.compactSettingsLabel(banterLabel),
    valueText: labelForBanterFrequency(ctx.working.banterFrequency),
    onActivate: cycle,
  }));
}
