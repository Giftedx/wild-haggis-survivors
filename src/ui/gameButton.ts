/**
 * Unified button factory — one visual language for every interactive
 * rectangle in the game. Three tiers (primary / secondary / tertiary)
 * cover every semantic role.
 *
 * Scene call sites swap from ad-hoc rectangles + text pairs to:
 *   const { rect, label } = createGameButton(scene, { ... });
 *
 * Palette, hover-fill, click sound, and hand-cursor are all wired
 * internally — scenes only choose tier, position, size, and label.
 */
import type Phaser from 'phaser';
import { COLORS } from '../config';
import { getSettingsManager } from '../core/SettingsManager';
import { attachButtonHoverFill } from './buttonHover';

// ── Tier palette ─────────────────────────────────────────────────────

export type ButtonTier = 'primary' | 'secondary' | 'tertiary';

export interface ButtonStyle {
  fill: number;
  hover: number;
  textColor: string;
  fontSize: string;
  strokeThickness: number;
}

const STYLES: Record<ButtonTier, ButtonStyle> = {
  primary: {
    fill: COLORS.SCOTTISH_BLUE,
    hover: 0x0077dd,
    textColor: '#ffffff',
    fontSize: '18px',
    strokeThickness: 3,
  },
  secondary: {
    fill: 0x3a4357,
    hover: 0x4a5568,
    textColor: '#ffffff',
    fontSize: '16px',
    strokeThickness: 2,
  },
  tertiary: {
    fill: 0x252540,
    hover: 0x2a2244,
    textColor: '#e8d4a0',
    fontSize: '15px',
    strokeThickness: 2,
  },
};

export function resolveButtonStyle(tier: ButtonTier): ButtonStyle {
  return STYLES[tier];
}

// ── HC tier border ──────────────────────────────────────────────────
//
// In high-contrast mode the three tier fills can read as "just
// different shades of dark" — primary / secondary lose the saturation
// cue when paired with a HC backdrop. Layering a per-tier brass
// outline restores the hierarchy without depending on hue alone:
//
//   - primary   — thick, bright brass: the visual "primary CTA" tier.
//   - secondary — thin, dim brass: present but recessive.
//   - tertiary  — no border: stays quiet.
//
// Returns null when the tier should not draw a border, otherwise
// `{ color, width, alpha }`. Pure — exported for unit tests.
export interface ButtonHcBorder {
  color: number;
  width: number;
  alpha: number;
}

const HC_BORDERS: Record<ButtonTier, ButtonHcBorder | null> = {
  primary: { color: 0xe8c860, width: 2.4, alpha: 0.95 },
  secondary: { color: 0x8a7c50, width: 1.2, alpha: 0.7 },
  tertiary: null,
};

export function resolveTierBorder(
  tier: ButtonTier,
  highContrast: boolean,
): ButtonHcBorder | null {
  if (!highContrast) return null;
  return HC_BORDERS[tier];
}

// ── Factory ─────────────────────────────────────────────────────────

export interface GameButtonOpts {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  tier: ButtonTier;
  /** Override default font size for this tier. */
  fontSize?: string;
  /** UI scale multiplier (from settings). */
  uiScale?: number;
  /** Override tier's default fill color. */
  fillOverride?: number;
  /** Override tier's default hover color. */
  hoverOverride?: number;
  /** Override tier's default text color. */
  textColorOverride?: string;
  /**
   * Force HC styling on/off for this button. When omitted, the factory
   * reads `highContrastUi` from the live settings; tests pass an
   * explicit boolean to keep the helper deterministic.
   */
  highContrast?: boolean;
}

export interface GameButtonResult {
  rect: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

/**
 * Create a rectangle button with consistent tier styling, hover fill,
 * click sound, and hand cursor. Returns both objects so the caller
 * can wire pointerdown handlers and manage depth/scroll.
 */
export function createGameButton(
  scene: Phaser.Scene,
  opts: GameButtonOpts,
): GameButtonResult {
  const style = STYLES[opts.tier];
  const fill = opts.fillOverride ?? style.fill;
  const hover = opts.hoverOverride ?? style.hover;
  const textColor = opts.textColorOverride ?? style.textColor;
  const fontSize = opts.fontSize ?? style.fontSize;

  const rect = scene.add
    .rectangle(opts.x, opts.y, opts.width, opts.height, fill, 1)
    .setInteractive({ useHandCursor: true });

  const highContrast = opts.highContrast ?? readHighContrastFromSettings();
  const border = resolveTierBorder(opts.tier, highContrast);
  if (border !== null) {
    rect.setStrokeStyle(border.width, border.color, border.alpha);
  }

  const label = scene.add
    .text(opts.x, opts.y, opts.label, {
      fontFamily: 'monospace',
      fontSize,
      color: textColor,
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: style.strokeThickness,
    })
    .setOrigin(0.5);

  if (opts.uiScale !== undefined) label.setScale(opts.uiScale);

  attachButtonHoverFill(rect, fill, hover, true);

  return { rect, label };
}

// Reading the live settings can throw inside test harnesses that mount
// gameButton without a configured manager — fall back to "no HC" so
// the legacy code path keeps working when the helper is unreachable.
function readHighContrastFromSettings(): boolean {
  try {
    return getSettingsManager().load().highContrastUi === true;
  } catch {
    return false;
  }
}

/**
 * Toggle disabled appearance on a game button. When disabled:
 *   - rect alpha → 0.6, label alpha → 0.5
 *   - interaction disabled (no hover, no click)
 * When re-enabled, restores full alpha and interaction.
 */
export function setGameButtonDisabled(
  btn: GameButtonResult,
  disabled: boolean,
  idleFill?: number,
): void {
  if (disabled) {
    btn.rect.setAlpha(0.6);
    btn.label.setAlpha(0.5);
    btn.rect.disableInteractive();
  } else {
    btn.rect.setAlpha(1);
    btn.label.setAlpha(1);
    btn.rect.setInteractive({ useHandCursor: true });
    if (idleFill !== undefined) btn.rect.setFillStyle(idleFill);
  }
}
