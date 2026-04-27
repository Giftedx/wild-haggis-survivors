/**
 * Tiny haggis expression sprites for HUD, toasts, future mood portraits,
 * and export review. These are deliberately face-first: readable at 24px.
 */
import * as Phaser from 'phaser';

type Mood =
  | 'idle_blink'
  | 'hurt_flinch'
  | 'low_hp'
  | 'level_up'
  | 'dash_smear'
  | 'victory_bounce'
  | 'coorie_rest'
  | 'determined';

export const PLAYER_MOOD_TEXTURE_KEYS: readonly `player_mood_${Mood}`[] = [
  'player_mood_idle_blink',
  'player_mood_hurt_flinch',
  'player_mood_low_hp',
  'player_mood_level_up',
  'player_mood_dash_smear',
  'player_mood_victory_bounce',
  'player_mood_coorie_rest',
  'player_mood_determined',
];

function drawMiniHaggis(
  g: Phaser.GameObjects.Graphics,
  mood: Mood,
): void {
  const cx = 18;
  const cy = mood === 'victory_bounce' ? 16 : 18;
  const hurt = mood === 'hurt_flinch' || mood === 'low_hp';
  const bodyDark = hurt ? 0x5a2a20 : 0x6a3a24;
  const bodyMid = hurt ? 0xa85a48 : 0xa85c3a;
  const bodyHi = hurt ? 0xd89078 : 0xd8a078;

  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(18, 29, mood === 'dash_smear' ? 28 : 22, 5);

  if (mood === 'dash_smear') {
    g.fillStyle(0xb8d8ff, 0.32);
    g.fillEllipse(12, cy + 1, 28, 13);
    g.fillStyle(0xd8e8ff, 0.25);
    g.fillEllipse(9, cy, 19, 9);
  }

  // Ears and body silhouette.
  g.fillStyle(0x1a0804, 1);
  g.fillTriangle(cx - 10, cy - 9, cx - 6, cy - 17, cx - 2, cy - 8);
  g.fillTriangle(cx + 2, cy - 8, cx + 7, cy - 17, cx + 11, cy - 9);
  g.fillEllipse(cx, cy, 25, 18);
  g.fillStyle(bodyDark, 1);
  g.fillEllipse(cx, cy, 23, 16);
  g.fillStyle(bodyMid, 1);
  g.fillEllipse(cx - 1, cy - 2, 18, 11);
  g.fillStyle(bodyHi, 0.9);
  g.fillEllipse(cx - 4, cy - 4, 9, 5);

  if (mood === 'coorie_rest') {
    g.fillStyle(0x8060a0, 1);
    g.fillRect(cx - 12, cy + 3, 24, 5);
    g.fillStyle(0xb090d0, 0.9);
    g.fillRect(cx - 10, cy + 4, 20, 1);
    g.fillStyle(0xc8a040, 0.9);
    g.fillRect(cx - 8, cy + 6, 16, 1);
  }

  // Eyes and mouth.
  g.fillStyle(0x120604, 1);
  switch (mood) {
    case 'idle_blink':
      g.fillRect(cx - 6, cy - 3, 4, 1);
      g.fillRect(cx + 3, cy - 3, 4, 1);
      g.fillRect(cx - 1, cy + 3, 3, 1);
      break;
    case 'hurt_flinch':
      g.fillRect(cx - 7, cy - 6, 5, 1);
      g.fillRect(cx - 6, cy - 2, 5, 1);
      g.fillRect(cx + 3, cy - 5, 5, 1);
      g.fillRect(cx + 4, cy - 1, 5, 1);
      g.fillRect(cx - 1, cy + 4, 5, 1);
      g.fillStyle(0xffd080, 1);
      g.fillCircle(cx + 10, cy - 10, 1.4);
      break;
    case 'low_hp':
      g.fillCircle(cx - 5, cy - 4, 1.5);
      g.fillCircle(cx + 5, cy - 4, 1.5);
      g.fillRect(cx - 3, cy + 4, 6, 1);
      g.fillStyle(0xc42828, 0.85);
      g.fillCircle(cx + 9, cy + 3, 1.2);
      break;
    case 'level_up':
      g.fillCircle(cx - 5, cy - 4, 1.6);
      g.fillCircle(cx + 5, cy - 4, 1.6);
      g.fillStyle(0xfff0b0, 0.95);
      g.fillRect(cx - 6, cy + 3, 12, 2);
      break;
    case 'dash_smear':
      g.fillCircle(cx - 3, cy - 4, 1.4);
      g.fillCircle(cx + 6, cy - 4, 1.4);
      g.fillRect(cx - 1, cy + 4, 7, 1);
      break;
    case 'victory_bounce':
      g.fillCircle(cx - 5, cy - 4, 1.7);
      g.fillCircle(cx + 5, cy - 4, 1.7);
      g.fillRect(cx - 4, cy + 3, 8, 2);
      break;
    case 'coorie_rest':
      g.fillRect(cx - 6, cy - 4, 4, 1);
      g.fillRect(cx + 2, cy - 4, 4, 1);
      g.fillRect(cx - 2, cy + 2, 4, 1);
      break;
    case 'determined':
      g.fillRect(cx - 7, cy - 6, 5, 1);
      g.fillRect(cx + 2, cy - 6, 5, 1);
      g.fillCircle(cx - 5, cy - 3, 1.4);
      g.fillCircle(cx + 5, cy - 3, 1.4);
      g.fillRect(cx - 3, cy + 4, 6, 1);
      break;
  }

  if (mood === 'level_up' || mood === 'victory_bounce') {
    g.fillStyle(0xffc840, 0.9);
    g.fillCircle(cx - 13, cy - 12, 1.3);
    g.fillCircle(cx + 13, cy - 10, 1.1);
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(cx - 14, cy - 13, 2, 1);
    g.fillRect(cx + 12, cy - 11, 2, 1);
  }
}

export function bakePlayerMoodSprites(scene: Phaser.Scene): void {
  for (const key of PLAYER_MOOD_TEXTURE_KEYS) {
    const mood = key.replace('player_mood_', '') as Mood;
    const g = scene.add.graphics();
    drawMiniHaggis(g, mood);
    g.generateTexture(key, 36, 36);
    g.destroy();
  }
}
