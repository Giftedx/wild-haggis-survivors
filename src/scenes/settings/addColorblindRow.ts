/**
 * Colorblind LUT mode cycle row (A1 M2) — body extracted from
 * SettingsScene.addColorblindRow. Cycles through modes and applies
 * the SVG filter to the canvas live (no scene restart needed).
 */
import { audio } from '../../systems/AudioSystem';
import { t } from '../../core/i18n';
import { cycleColorblindMode, labelForColorblindMode } from '../settingsColorblind';
import { applyColorblindFilterToCanvas } from '../../systems/accessibility/applyColorblindFilter';
import type { SettingsRowContext } from './rowContext';

export function addColorblindRow(ctx: SettingsRowContext): void {
  const { width } = ctx.scene.scale;
  const { y, rowStep } = ctx.takeRowY();

  ctx.addRowLabel(t('ui.settings.colorblind_mode'), y);

  const chipW = ctx.isNarrowLayout() ? 118 : 130;
  const chipH = 26;
  const cx = ctx.rightControlCenter(chipW);
  const cy = y + 18;
  const btn = ctx.scene.add
    .rectangle(cx, cy, chipW, chipH, 0x2d6a3e, 1)
    .setStrokeStyle(1.5, 0x4a9a5e, 0.9)
    .setInteractive({ useHandCursor: true });
  btn.setScale(ctx.uiScale);

  const current = () => ctx.working.colorblindMode;
  const txt = ctx.scene.add
    .text(cx, cy, labelForColorblindMode(current()), {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#d4c2e8',
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setScale(ctx.uiScale);

  const cycle = () => {
    audio.playClick();
    ctx.working.colorblindMode = cycleColorblindMode(current());
    txt.setText(labelForColorblindMode(current()));
    ctx.persistAndApply();
    const canvas = ctx.scene.sys.game.canvas as HTMLCanvasElement | undefined;
    if (canvas) applyColorblindFilterToCanvas(canvas, current());
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
  const cbLabel = t('ui.settings.colorblind_mode');
  ctx.domRowSyncs.push(() => ({
    id: 'cycle-colorblind',
    kind: 'cycle',
    label: ctx.compactSettingsLabel(cbLabel),
    valueText: labelForColorblindMode(current()),
    onActivate: cycle,
  }));
}
