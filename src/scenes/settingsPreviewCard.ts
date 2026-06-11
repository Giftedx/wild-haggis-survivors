import type Phaser from 'phaser';
import { t } from '../core/i18n';

/**
 * Pure descriptor for what the Settings live-preview card should show
 * given the current in-flight (unsaved) settings values. Making this a
 * pure function lets us unit-test visibility/scaling rules without a
 * Phaser harness — the scene-coupled renderer below is a thin wrapper.
 */
export interface SettingsPreviewInputs {
  uiScale: number;
  damageNumbers: boolean;
  highContrastUi: boolean;
  screenShake: boolean;
}

export interface SettingsPreviewDescriptor {
  panel: {
    bgColor: number;
    bgAlpha: number;
    strokeColor: number;
    strokeWidth: number;
  };
  label: {
    text: string;
    fontSize: number;
    color: string;
  };
  damage: {
    text: string;
    fontSize: number;
    color: string;
    visible: boolean;
  };
  /** Small visual hint that shake is on — a thin rule under the label. */
  shakeIndicator: {
    visible: boolean;
  };
}

export function describeSettingsPreview(inputs: SettingsPreviewInputs): SettingsPreviewDescriptor {
  const hc = inputs.highContrastUi;
  return {
    panel: {
      bgColor: hc ? 0x0b1020 : 0x161f30,
      bgAlpha: hc ? 0.96 : 0.9,
      strokeColor: hc ? 0x8fb4ff : 0x3a4a6a,
      strokeWidth: hc ? 2 : 1,
    },
    label: {
      text: 'Sample',
      fontSize: Math.round(14 * inputs.uiScale),
      color: hc ? '#ffffff' : '#c8d0e0',
    },
    damage: {
      text: '-24!',
      fontSize: Math.round(16 * inputs.uiScale),
      color: hc ? '#ffeebb' : '#ffcc44',
      visible: inputs.damageNumbers,
    },
    shakeIndicator: {
      visible: inputs.screenShake,
    },
  };
}

export interface RenderSettingsPreviewOpts {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  depth: number;
}

export interface SettingsPreviewHandle {
  refresh(inputs: SettingsPreviewInputs): void;
  destroy(): void;
}

/**
 * Renders a compact live-preview card. Call `refresh(inputs)` whenever
 * the working settings change — the card repaints synchronously without
 * spawning new tween loops.
 */
export function renderSettingsPreview(
  scene: Phaser.Scene,
  opts: RenderSettingsPreviewOpts,
  initial: SettingsPreviewInputs,
): SettingsPreviewHandle {
  const desc = describeSettingsPreview(initial);

  const panel = scene.add
    .rectangle(opts.centerX, opts.centerY, opts.width, opts.height, desc.panel.bgColor, desc.panel.bgAlpha)
    .setStrokeStyle(desc.panel.strokeWidth, desc.panel.strokeColor, 1)
    .setScrollFactor(0)
    .setDepth(opts.depth);

  const header = scene.add
    .text(opts.centerX, opts.centerY - opts.height / 2 + 12, t('ui.settings.preview_heading'), {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#8899aa',
      fontStyle: 'bold',
    })
    .setOrigin(0.5, 0.5)
    .setScrollFactor(0)
    .setDepth(opts.depth + 1);

  const label = scene.add
    .text(opts.centerX - 40, opts.centerY, desc.label.text, {
      fontFamily: 'monospace',
      fontSize: `${desc.label.fontSize}px`,
      color: desc.label.color,
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(opts.depth + 1);

  const damage = scene.add
    .text(opts.centerX + 40, opts.centerY, desc.damage.text, {
      fontFamily: 'monospace',
      fontSize: `${desc.damage.fontSize}px`,
      color: desc.damage.color,
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(opts.depth + 1);
  damage.setAlpha(desc.damage.visible ? 1 : 0);

  const shake = scene.add
    .rectangle(opts.centerX, opts.centerY + opts.height / 2 - 10, opts.width - 24, 2, 0x8fb4ff, 0.6)
    .setScrollFactor(0)
    .setDepth(opts.depth + 1);
  shake.setAlpha(desc.shakeIndicator.visible ? 1 : 0);

  const refresh = (inputs: SettingsPreviewInputs) => {
    const d = describeSettingsPreview(inputs);
    panel.setFillStyle(d.panel.bgColor, d.panel.bgAlpha);
    panel.setStrokeStyle(d.panel.strokeWidth, d.panel.strokeColor, 1);
    label.setFontSize(d.label.fontSize);
    label.setColor(d.label.color);
    damage.setFontSize(d.damage.fontSize);
    damage.setColor(d.damage.color);
    damage.setAlpha(d.damage.visible ? 1 : 0);
    shake.setAlpha(d.shakeIndicator.visible ? 1 : 0);
  };

  const destroy = () => {
    panel.destroy();
    header.destroy();
    label.destroy();
    damage.destroy();
    shake.destroy();
  };

  return { refresh, destroy };
}
