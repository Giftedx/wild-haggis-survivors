import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';
/**
 * `ucard_stat_knockback` — knockback stat. Design pivot (v2): prior
 * icon was a radial golden core with two concentric stroked circles
 * and four CARDINAL arrows + corner sparkles. Reads "generic AoE
 * burst" or "compass rose" — any radial push effect. No directional
 * anchor, no target. New pitch: DIRECTIONAL SHOVE. Big armoured FIST
 * on the left punching RIGHT with thick impact SHOCKWAVE RINGS + a
 * small TARGET SILHOUETTE being flung right with speed lines. The
 * asymmetry + target-being-punted is unambiguously "knockback" — no
 * confusion with AoE, pickup radius, or speed burst.
 */
export function drawStatKnockback(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x3a2818);
  const cx = 16, cy = 16;

  // FIST on the left — iron gauntlet silhouette punching right
  // Forearm
  g.fillStyle(0x2a1a06, 1);
  g.fillRect(cx - 14, cy - 2.5, 6, 5);
  g.fillStyle(0x5a3a14, 1);
  g.fillRect(cx - 14, cy - 2, 6, 4);
  g.fillStyle(0x8a6020, 1);
  g.fillRect(cx - 14, cy - 2, 6, 1);
  // Knuckle block
  g.fillStyle(0x2a1a06, 1);
  g.fillRect(cx - 9, cy - 4, 5, 8);
  g.fillStyle(0x7a5420, 1);
  g.fillRect(cx - 9, cy - 3.5, 5, 7);
  g.fillStyle(0xaa8030, 1);
  g.fillRect(cx - 9, cy - 3.5, 5, 2);
  // Brass knuckle studs — 3 bright spikes
  g.fillStyle(0xffdd55, 1);
  g.fillCircle(cx - 5, cy - 2, 0.9);
  g.fillCircle(cx - 5, cy, 0.9);
  g.fillCircle(cx - 5, cy + 2, 0.9);
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(cx - 5.2, cy - 2.2, 0.4);

  // IMPACT SHOCKWAVE — concentric arc rings bursting from the fist
  // forward-right (not symmetric radial — directional).
  g.lineStyle(2, 0xffcc44, 0.9);
  g.beginPath();
  g.arc(cx - 4, cy, 3.5, -Math.PI * 0.45, Math.PI * 0.45);
  g.strokePath();
  g.lineStyle(1.8, 0xffaa33, 0.75);
  g.beginPath();
  g.arc(cx - 4, cy, 6, -Math.PI * 0.5, Math.PI * 0.5);
  g.strokePath();
  g.lineStyle(1.5, 0xff8822, 0.55);
  g.beginPath();
  g.arc(cx - 4, cy, 9, -Math.PI * 0.55, Math.PI * 0.55);
  g.strokePath();

  // Bright impact flash at knuckle
  g.fillStyle(0xffffcc, 0.9);
  g.fillCircle(cx - 3, cy, 2);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 3, cy, 1);

  // TARGET SILHOUETTE being punted right — small stubby figure
  // launched backward with motion lines.
  g.fillStyle(0x1a0408, 1);
  // Body (little blob)
  g.fillEllipse(cx + 8, cy, 3.5, 4);
  // Head
  g.fillCircle(cx + 8, cy - 3, 1.8);
  // Arms flung back
  g.fillRect(cx + 5, cy - 1, 2, 0.8);
  g.fillRect(cx + 5, cy + 1, 2, 0.8);
  // Little feet up (flying)
  g.fillRect(cx + 10, cy + 1, 1.5, 0.8);
  g.fillRect(cx + 10, cy + 2.5, 1.5, 0.8);

  // Motion speed lines behind the target — "just got hit" punctuation
  g.fillStyle(0xffcc44, 0.9);
  g.fillRect(cx + 4, cy - 2, 3, 0.5);
  g.fillStyle(0xffaa33, 0.8);
  g.fillRect(cx + 3, cy + 1, 3.5, 0.5);
  g.fillStyle(0xff8822, 0.7);
  g.fillRect(cx + 4, cy + 3, 2.5, 0.4);

  // Little impact sparks on target body
  g.fillStyle(0xffffcc, 1);
  g.fillCircle(cx + 7, cy - 1, 0.5);
  g.fillCircle(cx + 9, cy + 1.5, 0.5);

  g.generateTexture('ucard_stat_knockback', s, s);
  g.destroy();
}
