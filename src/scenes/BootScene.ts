import Phaser from 'phaser';

/**
 * BootScene — generates all placeholder sprites programmatically.
 * Each entity has a distinct shape and visual identity, not just colored circles.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload(): void {
    this.generateAllTextures();
  }

  create(): void {
    const { width, height } = this.scale;

    // Brief splash screen — textures are already generated, show a quick brand moment
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    const title = this.add.text(width / 2, height * 0.4, 'Wild Haggis Survivors', {
      fontFamily: 'monospace', fontSize: '20px', color: '#d4a017',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    const mascot = this.add.sprite(width / 2, height * 0.55, 'haggis')
      .setScale(2).setAlpha(0);

    // Fade in title and mascot, then transition
    this.tweens.add({
      targets: [title, mascot],
      alpha: 1,
      duration: 400,
      onComplete: () => {
        this.tweens.add({
          targets: [title, mascot],
          alpha: 0,
          delay: 600,
          duration: 300,
          onComplete: () => this.scene.start('Menu'),
        });
      },
    });
  }

  private generateAllTextures(): void {
    this.createHaggis();
    this.createTourist();
    this.createChef();
    this.createTerrier();
    this.createHighlandCow();
    this.createEagle();
    this.createHaggisHunter();
    this.createAngryScotsman();
    this.createBoss();
    this.createThistle();
    this.createCaber();
    this.createHaggisBall();
    this.createXPGem();

    this.createDeepFryer();

  }

  // === Player ===

  private createHaggis(): void {
    const s = 48;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 - 2;

    // Furry body — layered ellipses for a shaggy look
    g.fillStyle(0x6b4e0a, 1);
    g.fillEllipse(cx, cy + 2, 36, 28);
    g.fillStyle(0x8b6914, 1);
    g.fillEllipse(cx, cy, 32, 24);
    // Fur tuft highlights
    g.fillStyle(0xa07818, 1);
    g.fillEllipse(cx - 4, cy - 3, 14, 10);

    // Legs — left pair shorter than right (the gimmick!)
    g.fillStyle(0x5a3e08, 1);
    g.fillRect(cx - 11, cy + 10, 4, 7);
    g.fillRect(cx - 4,  cy + 10, 4, 7);
    g.fillRect(cx + 4,  cy + 10, 4, 11); // longer
    g.fillRect(cx + 11, cy + 10, 4, 11); // longer

    // Eyes — wide, expressive
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 7, cy - 3, 5);
    g.fillCircle(cx + 7, cy - 3, 5);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 5, cy - 3, 2.5);
    g.fillCircle(cx + 9, cy - 3, 2.5);
    // Eye glint
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 6, cy - 5, 1);
    g.fillCircle(cx + 8, cy - 5, 1);

    // Snout
    g.fillStyle(0xd4956b, 1);
    g.fillCircle(cx + 1, cy + 3, 3);

    g.generateTexture('haggis', s, s);
    g.destroy();
  }

  // === Enemies ===

  private createTourist(): void {
    const s = 32;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Body (red shirt)
    g.fillStyle(0xcc4444, 1);
    g.fillRect(cx - 8, cy - 2, 16, 14);
    // Head
    g.fillStyle(0xffccaa, 1);
    g.fillCircle(cx, cy - 6, 7);
    // Sun hat
    g.fillStyle(0xddcc88, 1);
    g.fillRect(cx - 10, cy - 13, 20, 4);
    g.fillRect(cx - 6, cy - 16, 12, 4);
    // Camera (rectangle on chest)
    g.fillStyle(0x333333, 1);
    g.fillRect(cx - 3, cy + 1, 6, 4);

    g.generateTexture('tourist', s, s);
    g.destroy();
  }

  private createChef(): void {
    const s = 32;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Body (white coat)
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(cx - 8, cy - 2, 16, 14);
    // Head
    g.fillStyle(0xffccaa, 1);
    g.fillCircle(cx, cy - 6, 7);
    // Chef hat (tall white rectangle)
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx - 6, cy - 20, 12, 14);
    g.fillRect(cx - 8, cy - 10, 16, 3);
    // Cleaver
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(cx + 9, cy, 3, 10);
    g.fillStyle(0x664422, 1);
    g.fillRect(cx + 9, cy + 8, 3, 4);

    g.generateTexture('chef', s, s);
    g.destroy();
  }

  private createTerrier(): void {
    const s = 20;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Small dog body
    g.fillStyle(0x996633, 1);
    g.fillEllipse(cx, cy, 14, 10);
    // Head
    g.fillStyle(0x886622, 1);
    g.fillCircle(cx + 5, cy - 2, 5);
    // Eyes
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx + 7, cy - 3, 1.5);
    // Ears
    g.fillStyle(0x664411, 1);
    g.fillTriangle(cx + 3, cy - 6, cx + 1, cy - 2, cx + 5, cy - 2);
    g.fillTriangle(cx + 7, cy - 6, cx + 5, cy - 2, cx + 9, cy - 2);

    g.generateTexture('terrier', s, s);
    g.destroy();
  }

  private createHighlandCow(): void {
    const s = 44;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Big brown body
    g.fillStyle(0x8b4513, 1);
    g.fillEllipse(cx, cy + 2, 36, 24);
    // Shaggy fur overlay
    g.fillStyle(0xa0522d, 0.6);
    g.fillEllipse(cx - 2, cy, 28, 18);
    // Head
    g.fillStyle(0x8b4513, 1);
    g.fillCircle(cx, cy - 8, 10);
    // Fringe (the iconic shaggy fringe!)
    g.fillStyle(0xa0522d, 1);
    g.fillRect(cx - 10, cy - 14, 20, 6);
    // Horns
    g.fillStyle(0xccaa77, 1);
    g.fillTriangle(cx - 12, cy - 12, cx - 8, cy - 8, cx - 14, cy - 6);
    g.fillTriangle(cx + 12, cy - 12, cx + 8, cy - 8, cx + 14, cy - 6);
    // Snout
    g.fillStyle(0xd4956b, 1);
    g.fillCircle(cx, cy - 4, 4);

    g.generateTexture('highland_cow', s, s);
    g.destroy();
  }

  private createEagle(): void {
    const s = 28;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Wings spread (triangles)
    g.fillStyle(0x555555, 1);
    g.fillTriangle(cx, cy, cx - 14, cy + 4, cx - 6, cy - 4);
    g.fillTriangle(cx, cy, cx + 14, cy + 4, cx + 6, cy - 4);
    // Body
    g.fillStyle(0x666666, 1);
    g.fillEllipse(cx, cy, 10, 8);
    // Head
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx, cy - 4, 4);
    // Beak
    g.fillStyle(0xdd8800, 1);
    g.fillTriangle(cx, cy - 6, cx + 3, cy - 3, cx - 1, cy - 3);
    // Eye
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx + 1, cy - 5, 1);

    g.generateTexture('eagle', s, s);
    g.destroy();
  }

  private createHaggisHunter(): void {
    const s = 32;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Body (green camo jacket)
    g.fillStyle(0x336633, 1);
    g.fillRect(cx - 8, cy - 2, 16, 14);
    g.fillStyle(0x2d5a2d, 0.5);
    g.fillRect(cx - 6, cy, 4, 4);
    g.fillRect(cx + 2, cy + 4, 4, 4);
    // Head
    g.fillStyle(0xffccaa, 1);
    g.fillCircle(cx, cy - 6, 7);
    // Flat cap
    g.fillStyle(0x444444, 1);
    g.fillRect(cx - 8, cy - 12, 16, 4);
    g.fillRect(cx - 10, cy - 10, 20, 2);
    // Net (carried)
    g.lineStyle(1, 0x888888, 0.8);
    g.strokeCircle(cx - 10, cy + 4, 5);

    g.generateTexture('haggis_hunter', s, s);
    g.destroy();
  }

  private createAngryScotsman(): void {
    const s = 36;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Kilt body
    g.fillStyle(0x0055aa, 1);
    g.fillRect(cx - 9, cy, 18, 12);
    // Tartan pattern on kilt
    g.lineStyle(1, 0x003388, 0.5);
    g.lineBetween(cx - 9, cy + 3, cx + 9, cy + 3);
    g.lineBetween(cx - 9, cy + 6, cx + 9, cy + 6);
    g.lineBetween(cx - 9, cy + 9, cx + 9, cy + 9);
    // Upper body
    g.fillStyle(0xffccaa, 1);
    g.fillRect(cx - 7, cy - 6, 14, 8);
    // Head
    g.fillCircle(cx, cy - 10, 7);
    // Angry eyebrows
    g.lineStyle(2, 0x664422, 1);
    g.lineBetween(cx - 5, cy - 13, cx - 2, cy - 11);
    g.lineBetween(cx + 5, cy - 13, cx + 2, cy - 11);
    // Red beard
    g.fillStyle(0xcc5522, 1);
    g.fillRect(cx - 5, cy - 7, 10, 4);

    g.generateTexture('angry_scotsman', s, s);
    g.destroy();
  }

  private createBoss(): void {
    const s = 60;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Menacing dark body
    g.fillStyle(0x881111, 1);
    g.fillCircle(cx, cy, 26);
    g.fillStyle(0xaa2222, 1);
    g.fillCircle(cx, cy, 20);
    // Crown/horns
    g.fillStyle(0xddaa00, 1);
    g.fillTriangle(cx - 12, cy - 18, cx - 8, cy - 8, cx - 16, cy - 8);
    g.fillTriangle(cx, cy - 22, cx - 4, cy - 8, cx + 4, cy - 8);
    g.fillTriangle(cx + 12, cy - 18, cx + 8, cy - 8, cx + 16, cy - 8);
    // Evil eyes
    g.fillStyle(0xffff00, 1);
    g.fillCircle(cx - 7, cy - 4, 5);
    g.fillCircle(cx + 7, cy - 4, 5);
    g.fillStyle(0xff0000, 1);
    g.fillCircle(cx - 7, cy - 4, 2.5);
    g.fillCircle(cx + 7, cy - 4, 2.5);

    g.generateTexture('boss', s, s);
    g.destroy();
  }

  // === Projectiles ===

  private createThistle(): void {
    const s = 12;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Purple thistle head
    g.fillStyle(0x9966cc, 1);
    g.fillCircle(cx, cy, 4);
    // Spiky points
    g.fillStyle(0xbb88ee, 1);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.fillTriangle(
        cx, cy,
        cx + Math.cos(a) * 6, cy + Math.sin(a) * 6,
        cx + Math.cos(a + 0.3) * 4, cy + Math.sin(a + 0.3) * 4
      );
    }

    g.generateTexture('thistle', s, s);
    g.destroy();
  }

  private createCaber(): void {
    const s = 20;
    const g = this.add.graphics();

    // Long brown rectangle
    g.fillStyle(0x8b6914, 1);
    g.fillRect(2, 6, 16, 8);
    // Wood grain
    g.lineStyle(1, 0x6b4e0a, 0.4);
    g.lineBetween(2, 8, 18, 8);
    g.lineBetween(2, 12, 18, 12);

    g.generateTexture('caber', s, s);
    g.destroy();
  }

  private createHaggisBall(): void {
    const s = 14;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Small round haggis
    g.fillStyle(0x6b4e0a, 1);
    g.fillCircle(cx, cy, 5);
    g.fillStyle(0x8b6914, 0.6);
    g.fillCircle(cx - 1, cy - 1, 3);

    g.generateTexture('haggis_ball', s, s);
    g.destroy();
  }

  private createXPGem(): void {
    const s = 12;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Diamond shape (whisky drop)
    g.fillStyle(0xd4a017, 1);
    g.fillTriangle(cx, cy - 5, cx - 4, cy, cx + 4, cy);
    g.fillTriangle(cx, cy + 5, cx - 4, cy, cx + 4, cy);
    // Bright center
    g.fillStyle(0xffcc44, 0.6);
    g.fillCircle(cx, cy, 2);

    g.generateTexture('xp_gem', s, s);
    g.destroy();
  }

  private createDeepFryer(): void {
    const s = 32;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Metal vat
    g.fillStyle(0x888888, 1);
    g.fillRect(cx - 12, cy - 4, 24, 16);
    // Oil (bubbling yellow)
    g.fillStyle(0xcc8800, 1);
    g.fillRect(cx - 10, cy - 2, 20, 10);
    // Bubbles
    g.fillStyle(0xffaa00, 0.6);
    g.fillCircle(cx - 5, cy, 2);
    g.fillCircle(cx + 3, cy + 2, 2);
    g.fillCircle(cx + 7, cy - 1, 1.5);
    // Steam wisps
    g.lineStyle(1, 0xcccccc, 0.4);
    g.lineBetween(cx - 4, cy - 6, cx - 6, cy - 12);
    g.lineBetween(cx + 2, cy - 5, cx + 4, cy - 11);
    g.lineBetween(cx + 8, cy - 6, cx + 6, cy - 13);

    g.generateTexture('deep_fryer', s, s);
    g.destroy();
  }

}
