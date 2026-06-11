/**
 * Input rebind launch row — body extracted from
 * SettingsScene.addInputRebindRow. Click opens the SettingsInput
 * sub-scene which restarts SettingsScene on return so any binding
 * changes show up live.
 */
import { audio } from '../../systems/AudioSystem';
import { t } from '../../core/i18n';
import type { SettingsRowContext } from './rowContext';

export interface AddInputRebindRowDeps {
  /** Opens the rebind sub-scene; SettingsScene owns the returnTo lookup. */
  openRebindScene: () => void;
}

export function addInputRebindRow(
  ctx: SettingsRowContext,
  deps: AddInputRebindRowDeps,
): void {
  const { width } = ctx.scene.scale;
  const { y, rowStep } = ctx.takeRowY();

  ctx.addRowLabel(t('ui.inputRebind.title'), y);

  const chipW = ctx.isNarrowLayout() ? 118 : 130;
  const chipH = 26;
  const cx = ctx.rightControlCenter(chipW);
  const cy = y + 18;
  const btn = ctx.scene.add
    .rectangle(cx, cy, chipW, chipH, 0x2d6a3e, 1)
    .setStrokeStyle(1.5, 0x4a9a5e, 0.9)
    .setInteractive({ useHandCursor: true });
  btn.setScale(ctx.uiScale);

  const txt = ctx.scene.add
    .text(cx, cy, t('ui.inputRebind.title'), {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#d4c2e8',
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setScale(ctx.uiScale);

  const launch = () => {
    audio.playClick();
    ctx.persistAndApply();
    deps.openRebindScene();
  };

  btn.on('pointerdown', launch);
  txt.setInteractive({ useHandCursor: true });
  txt.on('pointerdown', launch);

  const markH = Math.max(20, rowStep - 4);
  const mark = ctx.scene.add
    .rectangle(width / 2, y + 10, width - 56, markH, 0x000000, 0)
    .setStrokeStyle(0);
  ctx.gpRows.push({
    kind: 'toggle',
    toggle: launch,
    mark,
  });
  const rebindLabel = t('ui.inputRebind.title');
  ctx.domRowSyncs.push(() => ({
    id: 'launch-rebind',
    kind: 'launch',
    label: ctx.compactSettingsLabel(rebindLabel),
    onActivate: launch,
  }));
}
