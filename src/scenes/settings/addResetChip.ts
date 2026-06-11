/**
 * Reset-to-defaults chip — body extracted from
 * SettingsScene.addResetChip. Quiet secondary-tier button on the BACK
 * row (right side); click clears persisted settings and restarts the
 * scene so every slider/toggle visibly snaps back.
 *
 * Owns its own y coordinate (not from ctx.takeRowY) — sits inline with
 * the BACK button rather than claiming a fresh row.
 */
import { audio } from '../../systems/AudioSystem';
import { t } from '../../core/i18n';
import { createGameButton } from '../../ui/gameButton';
import { performSettingsReset } from '../settingsResetAction';
import type { SettingsManager } from '../../core/SettingsManager';
import type { SettingsRowContext } from './rowContext';

export interface AddResetChipDeps {
  /** Y coordinate inline with the BACK button. */
  y: number;
  settingsManager: Pick<SettingsManager, 'reset' | 'load'>;
  /** Restart fn — called after `performSettingsReset` flushes defaults. */
  restartScene: () => void;
}

export function addResetChip(ctx: SettingsRowContext, deps: AddResetChipDeps): void {
  const { width } = ctx.scene.scale;
  const narrow = ctx.isNarrowLayout();
  const chipW = narrow ? 84 : 110;
  const chipH = 32;
  const cx = narrow ? width - chipW / 2 - 28 : width - 90;
  const { rect: btn, label: txt } = createGameButton(ctx.scene, {
    x: cx,
    y: deps.y,
    width: chipW,
    height: chipH,
    label: t('ui.settings.reset_action'),
    tier: 'secondary',
    fontSize: narrow ? '11px' : '13px',
    uiScale: ctx.uiScale,
    fillOverride: 0x2a2430,
    hoverOverride: 0x3a3040,
    textColorOverride: '#c8b8d4',
  });
  btn.setStrokeStyle(1.5, 0x5a4e64, 0.9);
  btn.setScale(ctx.uiScale).setDepth(21);
  txt.setScale(ctx.uiScale).setDepth(22);

  const doReset = () => {
    audio.playClick();
    performSettingsReset({
      settingsManager: deps.settingsManager,
      restartScene: deps.restartScene,
    });
  };

  btn.on('pointerdown', doReset);
  txt.setInteractive({ useHandCursor: true });
  txt.on('pointerdown', doReset);

  const mark = ctx.scene.add
    .rectangle(cx, deps.y, chipW + 10, chipH + 6, 0x000000, 0)
    .setStrokeStyle(0);
  ctx.gpRows.push({
    kind: 'toggle',
    toggle: doReset,
    mark,
  });
  const resetLabel = t('ui.settings.reset_action');
  ctx.domRowSyncs.push(() => ({
    id: 'launch-reset',
    kind: 'launch',
    label: resetLabel,
    onActivate: doReset,
  }));
}
