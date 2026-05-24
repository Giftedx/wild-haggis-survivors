import * as Phaser from 'phaser';
import type { HudWidgetContext } from './hudWidget';

/**
 * Mood Portrait — a tiny procedurally drawn haggis face in the HUD skill
 * column that reflects the player's current health state (DESIGN_IDEAS §7).
 *
 * Five expressions, driven by HP fraction:
 *   happy    HP > 0.75 — upward arc mouth, bright tan fill
 *   neutral  HP 0.50–0.75 — flat mouth
 *   worried  HP 0.25–0.50 — slight frown, angled brow marks
 *   grimace  HP ≤ 0.25 — sharp frown, darkened fill
 *   wince    overrides for WINCE_DURATION_MS after HP drops — squinting
 *            eyes, closed mouth, brief dark flash
 *
 * Sits below the full skill-widget column (HP / whisky / stance / parry /
 * companion / selkie / pibroch) so it never overlaps conditional chips.
 * Always visible — the face is a run-long character portrait, not earned
 * mechanic feedback.
 *
 * Drawn as Phaser Graphics and redrawn only on state transition — no
 * per-frame redraw cost on steady-state runs.
 */

export type MoodState = 'happy' | 'neutral' | 'worried' | 'grimace' | 'wince';

export interface MoodPortraitRefs {
  g: Phaser.GameObjects.Graphics;
}

/** Size of the face in logical pixels (power-of-two friendly for pixel art). */
const FACE_W = 22;
const FACE_H = 22;
/** Gap from the bottom of the chip column. */
const CHIP_H = 11;
/** Number of chip-height+gap units stacked above the portrait:
 *  stance + parry + companion + selkie + pibroch = 5 chips at 13 px each. */
const CHIPS_ABOVE = 5;

export function buildMoodPortrait(ctx: HudWidgetContext): MoodPortraitRefs {
  const { scene, depth: d, hpBarH } = ctx;
  const chipColumnX = 12;
  // Fixed y: top-pad + HP bar + whisky + (5 chips × 13 px each) + 4 px gap
  const y = 12 + hpBarH + 1 + 3 + 2 + CHIPS_ABOVE * (CHIP_H + 2) + 4;
  // Center the 22 px face within the 56 px chip column width.
  const x = chipColumnX + (56 - FACE_W) / 2;
  const g = ctx.addEl(
    scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(d + 1)
      .setPosition(x, y),
  );
  drawFace(g, 'happy');
  return { g };
}

/** Redraws the face only when the expression changes. Returns the new state. */
export function applyMoodPortraitState(
  refs: MoodPortraitRefs,
  input: { mood: MoodState },
  prev: MoodState | null,
): MoodState {
  if (input.mood === prev) return prev;
  refs.g.clear();
  drawFace(refs.g, input.mood);
  return input.mood;
}

/** Derive expression from HP fraction and wince timer. */
export function resolveMood(hpFraction: number, winceRemainingMs: number): MoodState {
  if (winceRemainingMs > 0) return 'wince';
  if (hpFraction > 0.75) return 'happy';
  if (hpFraction > 0.50) return 'neutral';
  if (hpFraction > 0.25) return 'worried';
  return 'grimace';
}

/** Duration the wince expression holds after taking damage. */
export const WINCE_DURATION_MS = 280;

// ── Private drawing helpers ─────────────────────────────────────────────────

const COLOR = {
  outline: 0x1a0a04,
  skinHappy: 0xc8a06a,
  skinNeutral: 0xb89058,
  skinWorried: 0xa87840,
  skinGrimace: 0x8a5a28,
  skinWince: 0x9a6838,
  eyeDark: 0x1a0a04,
  eyeHi: 0xfff8f0,
  browMark: 0x3a1e08,
  mouth: 0x2a1008,
};

function drawFace(g: Phaser.GameObjects.Graphics, mood: MoodState): void {
  const cx = FACE_W / 2;
  const cy = FACE_H / 2;

  // Outer outline ellipse
  g.fillStyle(COLOR.outline, 1);
  g.fillEllipse(cx, cy, FACE_W, FACE_H - 2);

  // Skin fill
  const skin = mood === 'happy' ? COLOR.skinHappy
    : mood === 'neutral' ? COLOR.skinNeutral
      : mood === 'worried' ? COLOR.skinWorried
        : mood === 'grimace' ? COLOR.skinGrimace
          : COLOR.skinWince;
  g.fillStyle(skin, 1);
  g.fillEllipse(cx, cy, FACE_W - 2, FACE_H - 4);

  if (mood === 'wince') {
    drawWinceFace(g, cx, cy);
  } else {
    drawNormalEyes(g, cx, cy);
    if (mood === 'worried') drawBrowMarks(g, cx, cy, 1);
    if (mood === 'grimace') drawBrowMarks(g, cx, cy, 2);
    drawMouth(g, cx, cy, mood);
  }
}

function drawNormalEyes(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  const eyeY = cy - 2;
  const leftX = cx - 4;
  const rightX = cx + 4;
  g.fillStyle(COLOR.eyeDark, 1);
  g.fillCircle(leftX, eyeY, 2);
  g.fillCircle(rightX, eyeY, 2);
  // Tiny catch-light
  g.fillStyle(COLOR.eyeHi, 0.9);
  g.fillCircle(leftX + 0.8, eyeY - 0.8, 0.7);
  g.fillCircle(rightX + 0.8, eyeY - 0.8, 0.7);
}

function drawBrowMarks(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  severity: 1 | 2,
): void {
  // Short angled marks above the eyes — slanting down toward the nose
  const eyeY = cy - 2;
  const browY = eyeY - 3.5;
  const angle = severity * 1.5; // px drop from outer to inner
  g.lineStyle(1.2, COLOR.browMark, 0.9);
  // Left brow — outer end is higher
  g.lineBetween(cx - 7, browY, cx - 2, browY + angle);
  // Right brow — outer end is higher
  g.lineBetween(cx + 7, browY, cx + 2, browY + angle);
}

function drawMouth(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  mood: MoodState,
): void {
  const mouthY = cy + 4;
  g.fillStyle(COLOR.mouth, 1);

  if (mood === 'happy') {
    // Smile: center horizontal segment + two up-curved ends
    g.fillRect(cx - 2.5, mouthY, 5, 1.5);
    g.fillRect(cx - 4, mouthY - 1, 2, 1.5);
    g.fillRect(cx + 2, mouthY - 1, 2, 1.5);
  } else if (mood === 'neutral') {
    g.fillRect(cx - 3, mouthY, 6, 1.5);
  } else if (mood === 'worried') {
    // Slight frown
    g.fillRect(cx - 2.5, mouthY, 5, 1.5);
    g.fillRect(cx - 4, mouthY + 1, 2, 1.5);
    g.fillRect(cx + 2, mouthY + 1, 2, 1.5);
  } else if (mood === 'grimace') {
    // Deeper frown + teeth gap suggestion
    g.fillRect(cx - 3, mouthY, 6, 1.5);
    g.fillRect(cx - 4.5, mouthY + 1.5, 2.5, 2);
    g.fillRect(cx + 2, mouthY + 1.5, 2.5, 2);
  }
}

function drawWinceFace(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  // Squinting eyes — tight horizontal slits
  const eyeY = cy - 2;
  g.lineStyle(1.5, COLOR.eyeDark, 1);
  g.lineBetween(cx - 6, eyeY, cx - 2, eyeY);
  g.lineBetween(cx + 2, eyeY, cx + 6, eyeY);
  // Short eyebrow press lines above
  g.lineStyle(1, COLOR.browMark, 0.85);
  g.lineBetween(cx - 5, eyeY - 2.5, cx - 2, eyeY - 1);
  g.lineBetween(cx + 5, eyeY - 2.5, cx + 2, eyeY - 1);
  // Tight mouth line
  g.lineStyle(1.5, COLOR.mouth, 1);
  g.lineBetween(cx - 3, cy + 4, cx + 3, cy + 4);
}
