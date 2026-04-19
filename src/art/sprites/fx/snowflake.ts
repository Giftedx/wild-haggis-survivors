/**
 * `fx_snowflake` — crisp ice-crystal particle with six main arms and
 * tiny branching detail. Used by the weather system for snow.
 */

import Phaser from 'phaser';

export function bakeSnowflake(scene: Phaser.Scene): void {
  // ── Snowflake particle — crisp ice crystal with branching arms ──
  const snow = 10;
  const gs = scene.add.graphics();
  const scx = snow / 2;
  const scy = snow / 2;
  // Outer glow
  gs.fillStyle(0xaaddff, 0.15);
  gs.fillCircle(scx, scy, 4.5);
  // Six main arms
  gs.lineStyle(1.5, 0xcce6ff, 1);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    gs.beginPath();
    gs.moveTo(scx, scy);
    gs.lineTo(scx + Math.cos(a) * 4.2, scy + Math.sin(a) * 4.2);
    gs.strokePath();
    // Tiny branch on each arm (crystalline detail)
    gs.lineStyle(0.8, 0xddeeff, 0.7);
    const midX = scx + Math.cos(a) * 2.5;
    const midY = scy + Math.sin(a) * 2.5;
    const branchA1 = a + Math.PI * 0.3;
    const branchA2 = a - Math.PI * 0.3;
    gs.beginPath();
    gs.moveTo(midX, midY);
    gs.lineTo(midX + Math.cos(branchA1) * 1.5, midY + Math.sin(branchA1) * 1.5);
    gs.strokePath();
    gs.beginPath();
    gs.moveTo(midX, midY);
    gs.lineTo(midX + Math.cos(branchA2) * 1.5, midY + Math.sin(branchA2) * 1.5);
    gs.strokePath();
    gs.lineStyle(1.5, 0xcce6ff, 1);
  }
  // Bright centre crystal
  gs.fillStyle(0xffffff, 1);
  gs.fillCircle(scx, scy, 1.3);
  gs.fillStyle(0xeef8ff, 0.7);
  gs.fillCircle(scx, scy, 0.7);
  gs.generateTexture('fx_snowflake', snow, snow);
  gs.destroy();
}
