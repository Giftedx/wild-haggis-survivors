/**
 * Language cycle row (W18) — body extracted from
 * SettingsScene.addLocaleRow. Cycles through locales; restarts the
 * scene after each change so existing labels re-resolve against the
 * new overlay.
 *
 * Caller passes `restartScene` because scene.start needs the
 * SceneReturnTarget; capturing the scene's `returnTo` field stays in
 * the SettingsScene closure.
 */
import { audio } from '../../systems/AudioSystem';
import { t, type LocaleKey } from '../../core/i18n';
import { cycleLocaleKey, labelForLocale } from '../settingsLocale';
import type { SettingsRowContext } from './rowContext';

export interface AddLocaleRowDeps {
  /** Restart fn — Settings scene tears down and re-creates with new locale. */
  restartScene: () => void;
}

export function addLocaleRow(ctx: SettingsRowContext, deps: AddLocaleRowDeps): void {
  const { width } = ctx.scene.scale;
  const { y, rowStep } = ctx.takeRowY();

  ctx.addRowLabel(t('ui.settings.language'), y);

  const chipW = ctx.isNarrowLayout() ? 118 : 130;
  const chipH = 26;
  const cx = ctx.rightControlCenter(chipW);
  const cy = y + 18;
  const btn = ctx.scene.add
    .rectangle(cx, cy, chipW, chipH, 0x2d6a3e, 1)
    .setStrokeStyle(1.5, 0x4a9a5e, 0.9)
    .setInteractive({ useHandCursor: true });
  btn.setScale(ctx.uiScale);

  const current = (): LocaleKey => ctx.working.localeKey ?? 'en';
  const localeLabel = () =>
    ctx.isNarrowLayout() ? current().toUpperCase() : labelForLocale(current());
  const txt = ctx.scene.add
    .text(cx, cy, localeLabel(), {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#d4c2e8',
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setScale(ctx.uiScale);

  const sync = () => {
    txt.setText(localeLabel());
  };

  const cycle = () => {
    audio.playClick();
    ctx.working.localeKey = cycleLocaleKey(current());
    sync();
    ctx.persistAndApply();
    deps.restartScene();
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
  const langLabel = t('ui.settings.language');
  ctx.domRowSyncs.push(() => ({
    id: 'cycle-locale',
    kind: 'cycle',
    label: ctx.compactSettingsLabel(langLabel),
    valueText: localeLabel(),
    onActivate: cycle,
  }));
}
