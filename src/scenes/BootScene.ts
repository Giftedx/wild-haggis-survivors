import Phaser from 'phaser';

/**
 * BootScene — generates all placeholder sprites programmatically.
 *
 * Design principles (updated):
 *  - Silhouette first: each enemy has one big iconic shape so it reads at a
 *    glance even at small screen sizes. Details are secondary.
 *  - Bolder color blocks with chunky outlines (1–2px dark borders) so edges
 *    don't blur into the background.
 *  - Canvas sizes are ~1.5× the old ones so the art has room to breathe.
 *    Hitboxes in Enemy.ts were bumped proportionally — keep them in sync
 *    if you resize anything here.
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
      fontFamily: 'monospace', fontSize: '28px', color: '#d4a017',
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
    this.createPiper();
    this.createSheep();
    this.createNest();
    this.createGhost();
    this.createBossGordon();
    this.createBossTourBus();
    this.createBossLaird();
    this.createBossHunterGeneral();
    this.createBossTaxman();
    this.createChestTexture();
    this.createHealthOrb();
    // Ground shadows & decoration
    this.createEntityShadow();
    this.createBossShadow();
    this.createThistlePatch();
    this.createRock();
    this.createHeather();
    // Weapon HUD icons
    this.createWeaponIcons();
  }

  /** Soft elliptical shadow placed under each entity. Dark translucent.
   *  Higher alpha values because the grass backdrop washes out subtle shadows. */
  private createEntityShadow(): void {
    const s = 40;
    const g = this.add.graphics();
    // Layered ellipses for a soft-edged look
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(s / 2, s / 2, 36, 12);
    g.fillStyle(0x000000, 0.4);
    g.fillEllipse(s / 2, s / 2, 28, 9);
    g.fillStyle(0x000000, 0.55);
    g.fillEllipse(s / 2, s / 2, 20, 6);
    g.generateTexture('entity_shadow', s, s);
    g.destroy();
  }

  /** Bigger shadow for bosses (60x60 → uses its own texture). */
  private createBossShadow(): void {
    const s = 80;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(s / 2, s / 2, 74, 24);
    g.fillStyle(0x000000, 0.4);
    g.fillEllipse(s / 2, s / 2, 58, 18);
    g.fillStyle(0x000000, 0.55);
    g.fillEllipse(s / 2, s / 2, 42, 12);
    g.generateTexture('boss_shadow', s, s);
    g.destroy();
  }

  // === Terrain decorations ===

  private createThistlePatch(): void {
    const s = 20;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;
    // Stem
    g.fillStyle(0x2a4a1a, 1);
    g.fillRect(cx - 1, cy, 2, 7);
    // Leaves
    g.fillStyle(0x3a6622, 1);
    g.fillTriangle(cx - 4, cy + 3, cx - 1, cy + 1, cx - 1, cy + 5);
    g.fillTriangle(cx + 4, cy + 3, cx + 1, cy + 1, cx + 1, cy + 5);
    // Purple thistle head
    g.fillStyle(0x442266, 1);
    g.fillCircle(cx, cy - 3, 4);
    g.fillStyle(0x9966cc, 1);
    g.fillCircle(cx, cy - 3, 3);
    // Spikes
    g.fillStyle(0xbb88ee, 1);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.fillRect(cx + Math.cos(a) * 3 - 0.5, cy - 3 + Math.sin(a) * 3 - 0.5, 1, 1);
    }
    g.generateTexture('deco_thistle', s, s);
    g.destroy();
  }

  private createRock(): void {
    const s = 24;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;
    // Rock outline
    g.fillStyle(0x333344, 1);
    g.fillEllipse(cx, cy, 18, 10);
    // Rock body
    g.fillStyle(0x555566, 1);
    g.fillEllipse(cx - 1, cy - 1, 16, 9);
    // Highlight
    g.fillStyle(0x7a7a8a, 1);
    g.fillEllipse(cx - 2, cy - 2, 10, 4);
    // Crack detail
    g.fillStyle(0x333344, 1);
    g.fillRect(cx, cy - 1, 3, 1);
    g.fillRect(cx - 4, cy + 1, 2, 1);
    g.generateTexture('deco_rock', s, s);
    g.destroy();
  }

  private createHeather(): void {
    const s = 20;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;
    // Base bush outline
    g.fillStyle(0x5a2244, 1);
    g.fillEllipse(cx, cy, 14, 7);
    // Purple heather clumps
    g.fillStyle(0x884466, 1);
    g.fillCircle(cx - 4, cy, 3);
    g.fillCircle(cx, cy - 1, 3.5);
    g.fillCircle(cx + 4, cy, 3);
    // Highlights
    g.fillStyle(0xcc77aa, 1);
    g.fillCircle(cx - 4, cy - 1, 1.5);
    g.fillCircle(cx, cy - 2, 1.8);
    g.fillCircle(cx + 4, cy - 1, 1.5);
    g.generateTexture('deco_heather', s, s);
    g.destroy();
  }

  // === Weapon HUD icons ===
  // Pre-render each weapon's icon so the HUD can render them as sprites
  // instead of cryptic text labels like "TS1" / "CT3".

  private createWeaponIcons(): void {
    // Base weapon icons
    this.createWeaponIconFromTexture('wicon_thistle_shot', 'thistle');
    this.createWeaponIconFromTexture('wicon_caber_toss', 'caber');
    this.createWeaponIconFromTexture('wicon_haggis_hurler', 'haggis_ball');
    this.createBagpipeBlastIcon();
    this.createScotchMistIcon();
    this.createNessieTentacleIcon();
    // Evolution icons — drawn distinctly so the HUD slot visibly changes
    // when a weapon evolves (previously evolved weapons stuck on their
    // base icon because wicon_{evolutionKey} didn't exist).
    this.createThistleStormIcon();
    this.createHighlandGamesIcon();
    this.createHaggisCannonIcon();
    this.createHighlandFlingIcon();
    this.createTheHaarIcon();
    this.createNessieUnleashedIcon();
  }

  /** Use an existing texture as a weapon icon (for projectile weapons). */
  private createWeaponIconFromTexture(iconKey: string, sourceKey: string): void {
    // Just alias — the HUD will use the existing projectile texture.
    // We register a separate key so future changes don't couple hud to projectile look.
    if (!this.textures.exists(sourceKey)) return;
    const src = this.textures.get(sourceKey).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    if (!src) return;
    this.textures.addImage(iconKey, src as HTMLImageElement);
  }

  private createBagpipeBlastIcon(): void {
    const s = 18;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;
    // Bagpipe bag
    g.fillStyle(0x442200, 1);
    g.fillEllipse(cx, cy + 2, 12, 10);
    g.fillStyle(0x884422, 1);
    g.fillEllipse(cx, cy + 2, 10, 8);
    // Drone pipes
    g.fillStyle(0x221100, 1);
    g.fillRect(cx - 4, cy - 6, 1.5, 7);
    g.fillRect(cx - 1, cy - 7, 1.5, 8);
    g.fillRect(cx + 2, cy - 6, 1.5, 7);
    // Gold caps
    g.fillStyle(0xddaa00, 1);
    g.fillRect(cx - 4, cy - 7, 2, 1.5);
    g.fillRect(cx - 1, cy - 8, 2, 1.5);
    g.fillRect(cx + 2, cy - 7, 2, 1.5);
    g.generateTexture('wicon_bagpipe_blast', s, s);
    g.destroy();
  }

  private createScotchMistIcon(): void {
    const s = 18;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;
    // Cloud shape
    g.fillStyle(0x556677, 0.9);
    g.fillCircle(cx - 4, cy + 1, 4);
    g.fillCircle(cx, cy - 2, 5);
    g.fillCircle(cx + 4, cy + 1, 4);
    g.fillStyle(0x7788aa, 0.9);
    g.fillCircle(cx - 3, cy, 3);
    g.fillCircle(cx + 1, cy - 3, 3.5);
    g.fillCircle(cx + 4, cy, 3);
    // Sparkle
    g.fillStyle(0xccddee, 1);
    g.fillCircle(cx, cy - 2, 1);
    g.generateTexture('wicon_scotch_mist', s, s);
    g.destroy();
  }

  private createNessieTentacleIcon(): void {
    const s = 18;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;
    // Tentacle outline
    g.fillStyle(0x114422, 1);
    g.fillCircle(cx - 4, cy + 4, 3.5);
    g.fillCircle(cx, cy, 3.5);
    g.fillCircle(cx + 4, cy - 4, 3.5);
    // Tentacle body
    g.fillStyle(0x336644, 1);
    g.fillCircle(cx - 4, cy + 4, 3);
    g.fillCircle(cx, cy, 3);
    g.fillCircle(cx + 4, cy - 4, 3);
    // Highlights
    g.fillStyle(0x66aa77, 1);
    g.fillCircle(cx - 4, cy + 3, 1.2);
    g.fillCircle(cx, cy - 1, 1.2);
    g.fillCircle(cx + 4, cy - 5, 1.2);
    // Suckers
    g.fillStyle(0xccaa88, 1);
    g.fillCircle(cx - 2, cy + 5, 0.8);
    g.fillCircle(cx + 2, cy + 1, 0.8);
    g.fillCircle(cx + 6, cy - 3, 0.8);
    g.generateTexture('wicon_nessie_tentacle', s, s);
    g.destroy();
  }

  // === Player ===

  private createHaggis(): void {
    const s = 56;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 - 2;

    // Dark outline body (draw first, slightly larger)
    g.fillStyle(0x3a2808, 1);
    g.fillEllipse(cx, cy + 2, 44, 34);
    // Furry body — layered ellipses for a shaggy look
    g.fillStyle(0x6b4e0a, 1);
    g.fillEllipse(cx, cy + 2, 40, 30);
    g.fillStyle(0x8b6914, 1);
    g.fillEllipse(cx, cy, 34, 26);
    // Fur tuft highlights
    g.fillStyle(0xa07818, 1);
    g.fillEllipse(cx - 5, cy - 4, 16, 11);
    g.fillEllipse(cx + 6, cy - 2, 10, 7);

    // Legs — left pair shorter than right (the drift gimmick!)
    g.fillStyle(0x3a2808, 1);
    g.fillRect(cx - 13, cy + 11, 5, 9);
    g.fillRect(cx - 5,  cy + 11, 5, 9);
    g.fillRect(cx + 4,  cy + 11, 5, 13); // longer
    g.fillRect(cx + 12, cy + 11, 5, 13); // longer

    // Eye whites
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 8, cy - 4, 6);
    g.fillCircle(cx + 8, cy - 4, 6);
    // Pupils
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 6, cy - 3, 3);
    g.fillCircle(cx + 10, cy - 3, 3);
    // Eye glint
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 7, cy - 5, 1.2);
    g.fillCircle(cx + 9, cy - 5, 1.2);

    // Snout
    g.fillStyle(0xd4956b, 1);
    g.fillCircle(cx + 1, cy + 4, 4);
    // Nose
    g.fillStyle(0x3a2808, 1);
    g.fillCircle(cx + 2, cy + 3, 1.5);

    g.generateTexture('haggis', s, s);
    g.destroy();
  }

  // === Enemies ===
  //
  // Drawing convention: each enemy starts with a 1–2px darker outline under
  // its main body so the silhouette pops. Iconic element is drawn last to
  // sit on top visually.

  private createTourist(): void {
    const s = 48;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Legs (shorts)
    g.fillStyle(0x4466aa, 1);
    g.fillRect(cx - 7, cy + 12, 5, 8);
    g.fillRect(cx + 2, cy + 12, 5, 8);

    // Hawaiian shirt body (bright red with yellow pattern)
    g.fillStyle(0x881111, 1); // dark outline
    g.fillRect(cx - 12, cy - 4, 24, 18);
    g.fillStyle(0xdd2222, 1);
    g.fillRect(cx - 11, cy - 3, 22, 16);
    // Floral pattern dots
    g.fillStyle(0xffdd44, 1);
    g.fillCircle(cx - 6, cy + 1, 2);
    g.fillCircle(cx + 4, cy + 4, 2);
    g.fillCircle(cx - 2, cy + 7, 2);
    g.fillCircle(cx + 8, cy - 1, 1.5);

    // Head
    g.fillStyle(0xaa6644, 1); // outline
    g.fillCircle(cx, cy - 10, 9);
    g.fillStyle(0xffccaa, 1);
    g.fillCircle(cx, cy - 10, 8);
    // Sunglasses band
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 7, cy - 11, 14, 3);
    // Lens glint
    g.fillStyle(0x88ccff, 0.7);
    g.fillRect(cx - 6, cy - 10, 4, 1);
    g.fillRect(cx + 2, cy - 10, 4, 1);

    // Iconic: huge sun hat
    g.fillStyle(0x886611, 1); // outline
    g.fillRect(cx - 16, cy - 19, 32, 4);
    g.fillStyle(0xddbb55, 1);
    g.fillRect(cx - 15, cy - 18, 30, 2);
    // Hat crown
    g.fillStyle(0x886611, 1);
    g.fillRect(cx - 9, cy - 24, 18, 6);
    g.fillStyle(0xddbb55, 1);
    g.fillRect(cx - 8, cy - 23, 16, 5);

    // Iconic: camera hanging from neck
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 5, cy + 1, 10, 6);
    // Lens
    g.fillStyle(0x444444, 1);
    g.fillCircle(cx, cy + 4, 2.5);
    g.fillStyle(0x88ccff, 1);
    g.fillCircle(cx, cy + 4, 1.5);
    // Strap
    g.lineStyle(1, 0x444444, 1);
    g.lineBetween(cx - 5, cy + 1, cx - 6, cy - 3);
    g.lineBetween(cx + 5, cy + 1, cx + 6, cy - 3);

    g.generateTexture('tourist', s, s);
    g.destroy();
  }

  private createChef(): void {
    const s = 48;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Legs
    g.fillStyle(0x222222, 1);
    g.fillRect(cx - 7, cy + 12, 5, 8);
    g.fillRect(cx + 2, cy + 12, 5, 8);

    // White chef coat body
    g.fillStyle(0x888888, 1); // outline
    g.fillRect(cx - 12, cy - 4, 24, 18);
    g.fillStyle(0xf0f0f0, 1);
    g.fillRect(cx - 11, cy - 3, 22, 16);
    // Double-row buttons
    g.fillStyle(0x222222, 1);
    g.fillCircle(cx - 3, cy, 1.2);
    g.fillCircle(cx - 3, cy + 4, 1.2);
    g.fillCircle(cx - 3, cy + 8, 1.2);
    g.fillCircle(cx + 3, cy, 1.2);
    g.fillCircle(cx + 3, cy + 4, 1.2);
    g.fillCircle(cx + 3, cy + 8, 1.2);

    // Head
    g.fillStyle(0xaa6644, 1);
    g.fillCircle(cx, cy - 10, 8);
    g.fillStyle(0xffccaa, 1);
    g.fillCircle(cx, cy - 10, 7);
    // Angry brow
    g.lineStyle(2, 0x221100, 1);
    g.lineBetween(cx - 5, cy - 13, cx - 2, cy - 11);
    g.lineBetween(cx + 5, cy - 13, cx + 2, cy - 11);
    // Mustache
    g.fillStyle(0x221100, 1);
    g.fillRect(cx - 4, cy - 8, 8, 2);

    // Iconic: tall puffy chef hat
    g.fillStyle(0xcccccc, 1); // outline
    g.fillRect(cx - 10, cy - 19, 20, 4);
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx - 9, cy - 18, 18, 3);
    // Puffy top (stacked circles)
    g.fillStyle(0xcccccc, 1);
    g.fillCircle(cx - 5, cy - 23, 5);
    g.fillCircle(cx, cy - 25, 6);
    g.fillCircle(cx + 5, cy - 23, 5);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 5, cy - 23, 4);
    g.fillCircle(cx, cy - 25, 5);
    g.fillCircle(cx + 5, cy - 23, 4);

    // Iconic: cleaver in hand
    g.fillStyle(0x444444, 1); // handle
    g.fillRect(cx + 13, cy + 8, 3, 6);
    g.fillStyle(0xaaaaaa, 1); // blade outline
    g.fillRect(cx + 11, cy - 2, 7, 10);
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(cx + 12, cy - 1, 5, 8);

    g.generateTexture('chef', s, s);
    g.destroy();
  }

  private createTerrier(): void {
    const s = 32;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Body outline
    g.fillStyle(0x4a2a0a, 1);
    g.fillEllipse(cx, cy + 1, 22, 14);
    // Body
    g.fillStyle(0x996633, 1);
    g.fillEllipse(cx, cy, 20, 12);
    // Lighter belly
    g.fillStyle(0xccaa77, 1);
    g.fillEllipse(cx, cy + 3, 14, 6);

    // Legs
    g.fillStyle(0x4a2a0a, 1);
    g.fillRect(cx - 8, cy + 4, 3, 6);
    g.fillRect(cx - 3, cy + 4, 3, 6);
    g.fillRect(cx + 2, cy + 4, 3, 6);
    g.fillRect(cx + 6, cy + 4, 3, 6);

    // Head (front-right)
    g.fillStyle(0x4a2a0a, 1);
    g.fillCircle(cx + 7, cy - 3, 7);
    g.fillStyle(0x886622, 1);
    g.fillCircle(cx + 7, cy - 3, 6);
    // Snout
    g.fillStyle(0xccaa77, 1);
    g.fillEllipse(cx + 11, cy - 1, 5, 4);
    // Nose
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx + 13, cy - 2, 1.5);
    // Tongue
    g.fillStyle(0xff6688, 1);
    g.fillRect(cx + 12, cy + 1, 3, 2);

    // Eye
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx + 8, cy - 4, 2);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx + 9, cy - 4, 1.2);

    // Iconic: pointy stand-up ears
    g.fillStyle(0x3a1a04, 1);
    g.fillTriangle(cx + 4, cy - 10, cx + 2, cy - 3, cx + 7, cy - 5);
    g.fillTriangle(cx + 10, cy - 10, cx + 8, cy - 3, cx + 13, cy - 5);
    g.fillStyle(0x664411, 1);
    g.fillTriangle(cx + 5, cy - 9, cx + 4, cy - 4, cx + 7, cy - 5);
    g.fillTriangle(cx + 10, cy - 9, cx + 9, cy - 4, cx + 12, cy - 5);

    // Tail
    g.fillStyle(0x4a2a0a, 1);
    g.fillRect(cx - 11, cy - 2, 4, 3);
    g.fillStyle(0x886622, 1);
    g.fillRect(cx - 10, cy - 1, 3, 2);

    g.generateTexture('terrier', s, s);
    g.destroy();
  }

  private createHighlandCow(): void {
    const s = 64;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Body outline
    g.fillStyle(0x3a1e08, 1);
    g.fillEllipse(cx, cy + 4, 46, 30);
    // Big brown body
    g.fillStyle(0x8b4513, 1);
    g.fillEllipse(cx, cy + 3, 42, 26);
    // Shaggy fur overlay
    g.fillStyle(0xa0522d, 0.7);
    g.fillEllipse(cx - 3, cy + 1, 34, 22);
    // Shaggy tufts
    g.fillStyle(0x8b4513, 1);
    g.fillCircle(cx - 14, cy + 2, 4);
    g.fillCircle(cx + 14, cy + 3, 4);
    g.fillCircle(cx - 10, cy + 10, 3);
    g.fillCircle(cx + 10, cy + 10, 3);

    // Legs (chunky)
    g.fillStyle(0x3a1e08, 1);
    g.fillRect(cx - 13, cy + 14, 5, 10);
    g.fillRect(cx - 5, cy + 14, 5, 10);
    g.fillRect(cx + 2, cy + 14, 5, 10);
    g.fillRect(cx + 10, cy + 14, 5, 10);
    // Hooves
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 13, cy + 22, 5, 2);
    g.fillRect(cx - 5, cy + 22, 5, 2);
    g.fillRect(cx + 2, cy + 22, 5, 2);
    g.fillRect(cx + 10, cy + 22, 5, 2);

    // Head
    g.fillStyle(0x3a1e08, 1);
    g.fillCircle(cx, cy - 10, 13);
    g.fillStyle(0x8b4513, 1);
    g.fillCircle(cx, cy - 10, 12);

    // Iconic: massive shaggy fringe (covers eyes)
    g.fillStyle(0xccaa77, 1);
    g.fillRect(cx - 14, cy - 18, 28, 10);
    // Stringy bits of fringe
    g.fillStyle(0xa0522d, 1);
    for (let i = 0; i < 7; i++) {
      const fx = cx - 12 + i * 4;
      g.fillRect(fx, cy - 10, 2, 5);
    }
    g.fillStyle(0xccaa77, 0.8);
    for (let i = 0; i < 7; i++) {
      const fx = cx - 12 + i * 4 + 1;
      g.fillRect(fx, cy - 9, 1, 4);
    }

    // Iconic: huge curved horns
    g.fillStyle(0x221100, 1);
    g.fillTriangle(cx - 16, cy - 16, cx - 8, cy - 12, cx - 22, cy - 8);
    g.fillTriangle(cx + 16, cy - 16, cx + 8, cy - 12, cx + 22, cy - 8);
    g.fillStyle(0xccaa77, 1);
    g.fillTriangle(cx - 15, cy - 15, cx - 9, cy - 12, cx - 20, cy - 9);
    g.fillTriangle(cx + 15, cy - 15, cx + 9, cy - 12, cx + 20, cy - 9);

    // Snout
    g.fillStyle(0x3a1e08, 1);
    g.fillCircle(cx, cy - 4, 5);
    g.fillStyle(0xd4956b, 1);
    g.fillCircle(cx, cy - 4, 4);
    // Nostrils
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 1, cy - 3, 0.8);
    g.fillCircle(cx + 2, cy - 3, 0.8);

    g.generateTexture('highland_cow', s, s);
    g.destroy();
  }

  private createEagle(): void {
    const s = 44;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Iconic: wide wings spread (outline first)
    g.fillStyle(0x222222, 1);
    g.fillTriangle(cx, cy, cx - 22, cy + 8, cx - 10, cy - 6);
    g.fillTriangle(cx, cy, cx + 22, cy + 8, cx + 10, cy - 6);
    // Wing gradient
    g.fillStyle(0x555555, 1);
    g.fillTriangle(cx, cy + 1, cx - 20, cy + 7, cx - 9, cy - 5);
    g.fillTriangle(cx, cy + 1, cx + 20, cy + 7, cx + 9, cy - 5);
    // Wing tip feathers
    g.fillStyle(0x333333, 1);
    g.fillTriangle(cx - 18, cy + 7, cx - 22, cy + 3, cx - 20, cy + 9);
    g.fillTriangle(cx + 18, cy + 7, cx + 22, cy + 3, cx + 20, cy + 9);

    // Body
    g.fillStyle(0x221100, 1);
    g.fillEllipse(cx, cy, 14, 12);
    g.fillStyle(0x5a3a1a, 1);
    g.fillEllipse(cx, cy, 12, 10);
    // Chest highlight
    g.fillStyle(0x886633, 1);
    g.fillEllipse(cx, cy + 2, 8, 5);

    // Head (white)
    g.fillStyle(0x222222, 1);
    g.fillCircle(cx, cy - 6, 6);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx, cy - 6, 5);

    // Iconic: yellow hooked beak
    g.fillStyle(0x885500, 1);
    g.fillTriangle(cx - 1, cy - 9, cx + 5, cy - 4, cx - 1, cy - 4);
    g.fillStyle(0xffcc22, 1);
    g.fillTriangle(cx, cy - 9, cx + 4, cy - 5, cx, cy - 5);

    // Eye
    g.fillStyle(0xffcc22, 1);
    g.fillCircle(cx + 1, cy - 7, 2);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx + 1, cy - 7, 1);

    g.generateTexture('eagle', s, s);
    g.destroy();
  }

  private createHaggisHunter(): void {
    const s = 48;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Legs (dark pants)
    g.fillStyle(0x222a11, 1);
    g.fillRect(cx - 7, cy + 12, 5, 8);
    g.fillRect(cx + 2, cy + 12, 5, 8);

    // Body (camo jacket, dark outline)
    g.fillStyle(0x1a3311, 1);
    g.fillRect(cx - 12, cy - 4, 24, 18);
    g.fillStyle(0x336633, 1);
    g.fillRect(cx - 11, cy - 3, 22, 16);
    // Camo patches
    g.fillStyle(0x5a7733, 1);
    g.fillRect(cx - 9, cy - 1, 4, 3);
    g.fillRect(cx + 3, cy, 5, 4);
    g.fillRect(cx - 5, cy + 5, 4, 3);
    g.fillStyle(0x223311, 1);
    g.fillRect(cx - 2, cy + 1, 3, 4);
    g.fillRect(cx + 6, cy + 6, 3, 3);

    // Head
    g.fillStyle(0xaa6644, 1);
    g.fillCircle(cx, cy - 10, 8);
    g.fillStyle(0xffccaa, 1);
    g.fillCircle(cx, cy - 10, 7);
    // Eyes (squinting, determined)
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 4, cy - 11, 3, 1.5);
    g.fillRect(cx + 1, cy - 11, 3, 1.5);
    // Stubble
    g.fillStyle(0x554433, 0.6);
    g.fillRect(cx - 4, cy - 7, 8, 2);

    // Flat cap (iconic)
    g.fillStyle(0x222222, 1);
    g.fillRect(cx - 10, cy - 18, 20, 5);
    g.fillStyle(0x555555, 1);
    g.fillRect(cx - 9, cy - 17, 18, 3);
    // Cap brim
    g.fillStyle(0x222222, 1);
    g.fillRect(cx - 12, cy - 14, 14, 2);

    // Iconic: big net on a pole
    g.fillStyle(0x664411, 1); // pole
    g.fillRect(cx + 11, cy - 12, 2, 20);
    // Net hoop
    g.lineStyle(2, 0x222222, 1);
    g.strokeCircle(cx + 17, cy - 14, 7);
    g.lineStyle(1, 0xaaaaaa, 0.8);
    g.strokeCircle(cx + 17, cy - 14, 6);
    // Net mesh lines
    g.lineStyle(1, 0xaaaaaa, 0.6);
    g.lineBetween(cx + 11, cy - 14, cx + 23, cy - 14);
    g.lineBetween(cx + 17, cy - 20, cx + 17, cy - 8);

    g.generateTexture('haggis_hunter', s, s);
    g.destroy();
  }

  private createAngryScotsman(): void {
    const s = 52;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Legs (bare, muscular)
    g.fillStyle(0xaa6644, 1);
    g.fillRect(cx - 7, cy + 13, 5, 9);
    g.fillRect(cx + 2, cy + 13, 5, 9);
    // Socks
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx - 8, cy + 20, 6, 3);
    g.fillRect(cx + 2, cy + 20, 6, 3);

    // Kilt body (blue tartan)
    g.fillStyle(0x002266, 1);
    g.fillRect(cx - 12, cy + 1, 24, 14);
    g.fillStyle(0x0055aa, 1);
    g.fillRect(cx - 11, cy + 2, 22, 12);
    // Tartan crossing pattern
    g.lineStyle(1, 0x003388, 1);
    g.lineBetween(cx - 11, cy + 5, cx + 11, cy + 5);
    g.lineBetween(cx - 11, cy + 9, cx + 11, cy + 9);
    g.lineBetween(cx - 11, cy + 12, cx + 11, cy + 12);
    g.lineBetween(cx - 6, cy + 2, cx - 6, cy + 14);
    g.lineBetween(cx, cy + 2, cx, cy + 14);
    g.lineBetween(cx + 6, cy + 2, cx + 6, cy + 14);
    g.lineStyle(1, 0x66aaff, 0.6);
    g.lineBetween(cx - 11, cy + 6, cx + 11, cy + 6);
    g.lineBetween(cx - 3, cy + 2, cx - 3, cy + 14);

    // Shirt (sleeveless)
    g.fillStyle(0xaa6644, 1);
    g.fillRect(cx - 10, cy - 7, 20, 9);
    g.fillStyle(0xffccaa, 1);
    g.fillRect(cx - 9, cy - 6, 18, 7);

    // Head
    g.fillStyle(0xaa6644, 1);
    g.fillCircle(cx, cy - 13, 9);
    g.fillStyle(0xffccaa, 1);
    g.fillCircle(cx, cy - 13, 8);

    // Iconic: massive red beard (HUGE — this is the defining feature)
    g.fillStyle(0x881100, 1);
    g.fillEllipse(cx, cy - 7, 18, 10);
    g.fillStyle(0xcc4422, 1);
    g.fillEllipse(cx, cy - 7, 16, 8);
    g.fillStyle(0xee6633, 1);
    g.fillEllipse(cx, cy - 8, 14, 6);
    // Beard wisps
    g.fillStyle(0x881100, 1);
    g.fillRect(cx - 6, cy - 2, 2, 3);
    g.fillRect(cx - 2, cy - 1, 2, 4);
    g.fillRect(cx + 2, cy - 2, 2, 3);
    g.fillRect(cx + 5, cy - 1, 2, 3);

    // Angry eyebrows (prominent, thick)
    g.fillStyle(0x661100, 1);
    g.fillTriangle(cx - 8, cy - 17, cx - 2, cy - 15, cx - 2, cy - 17);
    g.fillTriangle(cx + 8, cy - 17, cx + 2, cy - 15, cx + 2, cy - 17);

    // Eyes (tiny, narrowed, angry)
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 4, cy - 14, 2);
    g.fillCircle(cx + 4, cy - 14, 2);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 4, cy - 14, 1);
    g.fillCircle(cx + 4, cy - 14, 1);

    g.generateTexture('angry_scotsman', s, s);
    g.destroy();
  }

  private createBoss(): void {
    // Kept for backwards compat — bosses now use dedicated per-boss textures,
    // but 'boss' is still referenced as a generic fallback.
    const s = 72;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Menacing dark body
    g.fillStyle(0x441111, 1);
    g.fillCircle(cx, cy, 32);
    g.fillStyle(0x881111, 1);
    g.fillCircle(cx, cy, 28);
    g.fillStyle(0xaa2222, 1);
    g.fillCircle(cx, cy, 22);
    // Crown horns
    g.fillStyle(0x886600, 1);
    g.fillTriangle(cx - 14, cy - 22, cx - 10, cy - 10, cx - 19, cy - 10);
    g.fillTriangle(cx, cy - 26, cx - 5, cy - 10, cx + 5, cy - 10);
    g.fillTriangle(cx + 14, cy - 22, cx + 10, cy - 10, cx + 19, cy - 10);
    g.fillStyle(0xddaa00, 1);
    g.fillTriangle(cx - 13, cy - 21, cx - 11, cy - 11, cx - 17, cy - 11);
    g.fillTriangle(cx, cy - 24, cx - 4, cy - 11, cx + 4, cy - 11);
    g.fillTriangle(cx + 13, cy - 21, cx + 11, cy - 11, cx + 17, cy - 11);
    // Evil eyes
    g.fillStyle(0xffff00, 1);
    g.fillCircle(cx - 9, cy - 4, 6);
    g.fillCircle(cx + 9, cy - 4, 6);
    g.fillStyle(0xff0000, 1);
    g.fillCircle(cx - 9, cy - 4, 3);
    g.fillCircle(cx + 9, cy - 4, 3);

    g.generateTexture('boss', s, s);
    g.destroy();
  }

  // === Projectiles ===

  private createThistle(): void {
    const s = 16;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Outline
    g.fillStyle(0x442266, 1);
    g.fillCircle(cx, cy, 6);
    // Purple thistle head
    g.fillStyle(0x9966cc, 1);
    g.fillCircle(cx, cy, 5);
    // Spiky points
    g.fillStyle(0xbb88ee, 1);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.fillTriangle(
        cx, cy,
        cx + Math.cos(a) * 7, cy + Math.sin(a) * 7,
        cx + Math.cos(a + 0.3) * 5, cy + Math.sin(a + 0.3) * 5
      );
    }
    // Bright center
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(cx, cy, 1.5);

    g.generateTexture('thistle', s, s);
    g.destroy();
  }

  private createCaber(): void {
    const s = 24;
    const g = this.add.graphics();

    // Outline
    g.fillStyle(0x3a2808, 1);
    g.fillRect(2, 5, 20, 12);
    // Long brown rectangle
    g.fillStyle(0x8b6914, 1);
    g.fillRect(3, 6, 18, 10);
    // Wood grain
    g.fillStyle(0x6b4e0a, 1);
    g.fillRect(3, 9, 18, 1);
    g.fillRect(3, 13, 18, 1);
    // Highlight
    g.fillStyle(0xbb8822, 0.6);
    g.fillRect(3, 7, 18, 1);

    g.generateTexture('caber', s, s);
    g.destroy();
  }

  private createHaggisBall(): void {
    const s = 18;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Outline
    g.fillStyle(0x3a2808, 1);
    g.fillCircle(cx, cy, 7);
    // Small round haggis
    g.fillStyle(0x6b4e0a, 1);
    g.fillCircle(cx, cy, 6);
    g.fillStyle(0x8b6914, 0.8);
    g.fillCircle(cx - 1, cy - 1, 4);
    // Highlight
    g.fillStyle(0xa07818, 0.9);
    g.fillCircle(cx - 2, cy - 2, 2);

    g.generateTexture('haggis_ball', s, s);
    g.destroy();
  }

  private createXPGem(): void {
    const s = 16;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Outline
    g.fillStyle(0x886600, 1);
    g.fillTriangle(cx, cy - 7, cx - 6, cy, cx + 6, cy);
    g.fillTriangle(cx, cy + 7, cx - 6, cy, cx + 6, cy);
    // Diamond shape (whisky drop)
    g.fillStyle(0xd4a017, 1);
    g.fillTriangle(cx, cy - 6, cx - 5, cy, cx + 5, cy);
    g.fillTriangle(cx, cy + 6, cx - 5, cy, cx + 5, cy);
    // Bright center
    g.fillStyle(0xffdd66, 1);
    g.fillTriangle(cx, cy - 3, cx - 2, cy, cx + 2, cy);
    // Sparkle
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(cx - 1, cy - 2, 1);

    g.generateTexture('xp_gem', s, s);
    g.destroy();
  }

  // === Unique Boss Textures ===

  private createBossGordon(): void {
    const s = 80;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 4;

    // Body outline
    g.fillStyle(0x888888, 1);
    g.fillCircle(cx, cy, 32);
    // Chef body (white)
    g.fillStyle(0xeeeeee, 1);
    g.fillCircle(cx, cy, 30);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 3, cy - 3, 24);
    // Buttons
    g.fillStyle(0x222222, 1);
    g.fillCircle(cx - 4, cy + 4, 1.8);
    g.fillCircle(cx - 4, cy + 10, 1.8);
    g.fillCircle(cx + 4, cy + 4, 1.8);
    g.fillCircle(cx + 4, cy + 10, 1.8);

    // Face
    g.fillStyle(0xaa5533, 1);
    g.fillCircle(cx, cy - 6, 13);
    g.fillStyle(0xffaa88, 1);
    g.fillCircle(cx, cy - 6, 12);
    // Furious eyebrows
    g.fillStyle(0x441100, 1);
    g.fillTriangle(cx - 10, cy - 14, cx - 2, cy - 11, cx - 2, cy - 14);
    g.fillTriangle(cx + 10, cy - 14, cx + 2, cy - 11, cx + 2, cy - 14);
    // Angry red eyes
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 6, cy - 9, 3);
    g.fillCircle(cx + 6, cy - 9, 3);
    g.fillStyle(0xff0000, 1);
    g.fillCircle(cx - 6, cy - 9, 2);
    g.fillCircle(cx + 6, cy - 9, 2);
    // Open yelling mouth
    g.fillStyle(0x111111, 1);
    g.fillEllipse(cx, cy - 1, 7, 5);
    g.fillStyle(0xcc2222, 1);
    g.fillEllipse(cx, cy, 5, 3);

    // Iconic: GIANT chef hat
    g.fillStyle(0xcccccc, 1);
    g.fillRect(cx - 14, cy - 28, 28, 6);
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx - 13, cy - 27, 26, 5);
    // Puffy top (huge)
    g.fillStyle(0xcccccc, 1);
    g.fillCircle(cx - 10, cy - 33, 8);
    g.fillCircle(cx, cy - 36, 9);
    g.fillCircle(cx + 10, cy - 33, 8);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 10, cy - 33, 7);
    g.fillCircle(cx, cy - 36, 8);
    g.fillCircle(cx + 10, cy - 33, 7);

    // Iconic: cleaver (bigger than enemy version)
    g.fillStyle(0x221100, 1);
    g.fillRect(cx + 22, cy + 6, 4, 10);
    g.fillStyle(0x888888, 1);
    g.fillRect(cx + 19, cy - 6, 10, 14);
    g.fillStyle(0xdddddd, 1);
    g.fillRect(cx + 20, cy - 5, 8, 12);
    // Blade highlight
    g.fillStyle(0xffffff, 0.8);
    g.fillRect(cx + 21, cy - 4, 2, 10);

    g.generateTexture('boss_gordon', s, s);
    g.destroy();
  }

  private createBossTourBus(): void {
    const s = 80;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Bus body outline
    g.fillStyle(0x551111, 1);
    g.fillRect(cx - 34, cy - 16, 68, 32);
    // Bus body (red)
    g.fillStyle(0xcc2222, 1);
    g.fillRect(cx - 33, cy - 15, 66, 30);
    // Upper stripe
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx - 33, cy - 8, 66, 2);
    g.fillStyle(0x881111, 1);
    g.fillRect(cx - 33, cy - 6, 66, 1);

    // Windows (big, clear)
    g.fillStyle(0x222244, 1);
    g.fillRect(cx - 30, cy - 13, 60, 6);
    g.fillStyle(0x88ccff, 0.9);
    for (let i = 0; i < 6; i++) {
      g.fillRect(cx - 29 + i * 10, cy - 12, 8, 5);
    }
    // Bus destination sign
    g.fillStyle(0xffdd44, 1);
    g.fillRect(cx - 10, cy - 13, 20, 4);
    g.fillStyle(0x222222, 1);
    for (let i = 0; i < 5; i++) {
      g.fillRect(cx - 8 + i * 4, cy - 12, 2, 2);
    }

    // Headlights
    g.fillStyle(0xffff66, 1);
    g.fillCircle(cx + 33, cy - 4, 4);
    g.fillCircle(cx + 33, cy + 4, 4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx + 33, cy - 4, 2);
    g.fillCircle(cx + 33, cy + 4, 2);

    // Bumper
    g.fillStyle(0x444444, 1);
    g.fillRect(cx - 33, cy + 14, 66, 3);

    // Wheels
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 20, cy + 18, 7);
    g.fillCircle(cx + 20, cy + 18, 7);
    g.fillStyle(0x333333, 1);
    g.fillCircle(cx - 20, cy + 18, 5);
    g.fillCircle(cx + 20, cy + 18, 5);
    g.fillStyle(0x888888, 1);
    g.fillCircle(cx - 20, cy + 18, 2);
    g.fillCircle(cx + 20, cy + 18, 2);

    g.generateTexture('boss_tour_bus', s, s);
    g.destroy();
  }

  private createBossLaird(): void {
    const s = 80;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 4;

    // Royal cloak outline
    g.fillStyle(0x110033, 1);
    g.fillCircle(cx, cy + 2, 30);
    g.fillStyle(0x220066, 1);
    g.fillCircle(cx, cy + 2, 28);
    g.fillStyle(0x330088, 1);
    g.fillCircle(cx, cy, 24);
    // Fur trim on cloak
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx - 26, cy + 14, 52, 4);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 18, cy + 16, 1.5);
    g.fillCircle(cx - 10, cy + 16, 1.5);
    g.fillCircle(cx - 2, cy + 16, 1.5);
    g.fillCircle(cx + 8, cy + 16, 1.5);
    g.fillCircle(cx + 18, cy + 16, 1.5);

    // Face
    g.fillStyle(0xaa6644, 1);
    g.fillCircle(cx, cy - 6, 11);
    g.fillStyle(0xffccaa, 1);
    g.fillCircle(cx, cy - 6, 10);
    // Regal mustache
    g.fillStyle(0xdddddd, 1);
    g.fillRect(cx - 6, cy - 3, 12, 2);
    g.fillRect(cx - 7, cy - 2, 3, 3);
    g.fillRect(cx + 4, cy - 2, 3, 3);
    // Stern eyes
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 4, cy - 8, 3);
    g.fillCircle(cx + 4, cy - 8, 3);
    g.fillStyle(0x000088, 1);
    g.fillCircle(cx - 4, cy - 8, 1.5);
    g.fillCircle(cx + 4, cy - 8, 1.5);

    // Iconic: BIG golden crown
    g.fillStyle(0x664400, 1);
    g.fillRect(cx - 15, cy - 22, 30, 8);
    g.fillStyle(0xddaa00, 1);
    g.fillRect(cx - 14, cy - 21, 28, 6);
    // Crown points
    g.fillStyle(0x664400, 1);
    g.fillTriangle(cx - 15, cy - 22, cx - 11, cy - 32, cx - 6, cy - 22);
    g.fillTriangle(cx - 4, cy - 22, cx, cy - 34, cx + 4, cy - 22);
    g.fillTriangle(cx + 6, cy - 22, cx + 11, cy - 32, cx + 15, cy - 22);
    g.fillStyle(0xddaa00, 1);
    g.fillTriangle(cx - 14, cy - 22, cx - 11, cy - 30, cx - 7, cy - 22);
    g.fillTriangle(cx - 3, cy - 22, cx, cy - 32, cx + 3, cy - 22);
    g.fillTriangle(cx + 7, cy - 22, cx + 11, cy - 30, cx + 14, cy - 22);
    // Jewels in crown
    g.fillStyle(0xff1133, 1);
    g.fillCircle(cx - 11, cy - 29, 2);
    g.fillCircle(cx, cy - 31, 2.5);
    g.fillCircle(cx + 11, cy - 29, 2);
    g.fillStyle(0xff6677, 1);
    g.fillCircle(cx - 11, cy - 30, 0.8);
    g.fillCircle(cx, cy - 32, 1);
    g.fillCircle(cx + 11, cy - 30, 0.8);

    g.generateTexture('boss_laird', s, s);
    g.destroy();
  }

  private createBossHunterGeneral(): void {
    const s = 80;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 4;

    // Military body outline
    g.fillStyle(0x113311, 1);
    g.fillCircle(cx, cy + 2, 30);
    g.fillStyle(0x2d5a2d, 1);
    g.fillCircle(cx, cy + 2, 28);
    g.fillStyle(0x3a6b3a, 1);
    g.fillCircle(cx, cy, 24);
    // Shoulder epaulettes
    g.fillStyle(0xddaa00, 1);
    g.fillRect(cx - 22, cy - 6, 6, 4);
    g.fillRect(cx + 16, cy - 6, 6, 4);
    // Medals row
    g.fillStyle(0xddaa00, 1);
    g.fillCircle(cx - 8, cy + 2, 2);
    g.fillCircle(cx - 2, cy + 2, 2);
    g.fillCircle(cx + 4, cy + 2, 2);

    // Face
    g.fillStyle(0xaa6644, 1);
    g.fillCircle(cx, cy - 6, 11);
    g.fillStyle(0xffccaa, 1);
    g.fillCircle(cx, cy - 6, 10);
    // Bushy mustache
    g.fillStyle(0x4a3a22, 1);
    g.fillRect(cx - 8, cy - 3, 16, 3);
    // Eyes
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 4, cy - 8, 3);
    g.fillCircle(cx + 4, cy - 8, 3);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 4, cy - 8, 1.5);
    g.fillCircle(cx + 4, cy - 8, 1.5);
    // Monocle (iconic detail)
    g.lineStyle(2, 0xddaa00, 1);
    g.strokeCircle(cx + 4, cy - 8, 4);
    g.lineStyle(1, 0x886600, 0.8);
    g.lineBetween(cx + 8, cy - 6, cx + 10, cy - 2);

    // Iconic: military peaked cap
    g.fillStyle(0x113311, 1);
    g.fillRect(cx - 16, cy - 22, 32, 8);
    g.fillStyle(0x1a3a1a, 1);
    g.fillRect(cx - 15, cy - 21, 30, 6);
    // Cap brim
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 18, cy - 16, 24, 3);
    // Gold badge
    g.fillStyle(0x886600, 1);
    g.fillCircle(cx, cy - 20, 4);
    g.fillStyle(0xffdd44, 1);
    g.fillCircle(cx, cy - 20, 3);
    g.fillStyle(0xff3333, 1);
    g.fillCircle(cx, cy - 20, 1.5);

    // Iconic: rifle
    g.fillStyle(0x221100, 1);
    g.fillRect(cx + 24, cy - 22, 4, 38);
    g.fillStyle(0x554433, 1);
    g.fillRect(cx + 25, cy - 21, 2, 36);
    // Barrel tip
    g.fillStyle(0x111111, 1);
    g.fillRect(cx + 24, cy - 24, 4, 3);

    g.generateTexture('boss_hunter_general', s, s);
    g.destroy();
  }

  private createBossTaxman(): void {
    const s = 80;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 4;

    // Cloak outline
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx, cy + 2, 32);
    g.fillStyle(0x0a0a0a, 1);
    g.fillCircle(cx, cy + 2, 30);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(cx, cy, 26);
    // Cloak folds
    g.fillStyle(0x000000, 1);
    g.fillRect(cx - 14, cy + 2, 3, 28);
    g.fillRect(cx - 4, cy + 2, 3, 28);
    g.fillRect(cx + 8, cy + 2, 3, 28);
    g.fillRect(cx + 18, cy + 2, 3, 28);

    // Hood (iconic)
    g.fillStyle(0x000000, 1);
    g.fillTriangle(cx - 18, cy - 6, cx, cy - 34, cx + 18, cy - 6);
    g.fillStyle(0x0a0a0a, 1);
    g.fillTriangle(cx - 16, cy - 6, cx, cy - 30, cx + 16, cy - 6);
    // Hood shadow inside
    g.fillStyle(0x000000, 1);
    g.fillEllipse(cx, cy - 10, 20, 16);

    // Skull face (iconic)
    g.fillStyle(0x888866, 1);
    g.fillCircle(cx, cy - 6, 13);
    g.fillStyle(0xddddcc, 1);
    g.fillCircle(cx, cy - 6, 12);
    // Empty eye sockets (glowing red)
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - 5, cy - 8, 4);
    g.fillCircle(cx + 5, cy - 8, 4);
    g.fillStyle(0xff0000, 0.9);
    g.fillCircle(cx - 5, cy - 8, 2.5);
    g.fillCircle(cx + 5, cy - 8, 2.5);
    g.fillStyle(0xffaa88, 1);
    g.fillCircle(cx - 5, cy - 8, 1);
    g.fillCircle(cx + 5, cy - 8, 1);
    // Nose cavity
    g.fillStyle(0x000000, 1);
    g.fillTriangle(cx - 1, cy - 3, cx + 1, cy - 3, cx, cy + 1);
    // Jagged skull teeth
    g.fillStyle(0x000000, 1);
    g.fillRect(cx - 6, cy + 2, 12, 3);
    g.fillStyle(0xddddcc, 1);
    g.fillRect(cx - 5, cy + 2, 1, 3);
    g.fillRect(cx - 3, cy + 2, 1, 3);
    g.fillRect(cx - 1, cy + 2, 1, 3);
    g.fillRect(cx + 1, cy + 2, 1, 3);
    g.fillRect(cx + 3, cy + 2, 1, 3);

    // Iconic: SCYTHE
    g.fillStyle(0x221100, 1);
    g.fillRect(cx + 24, cy - 28, 3, 52);
    g.fillStyle(0x442200, 1);
    g.fillRect(cx + 24, cy - 28, 2, 52);
    // Scythe blade
    g.fillStyle(0x555555, 1);
    g.fillTriangle(cx + 12, cy - 32, cx + 26, cy - 28, cx + 26, cy - 18);
    g.fillStyle(0xcccccc, 1);
    g.fillTriangle(cx + 14, cy - 30, cx + 25, cy - 27, cx + 25, cy - 20);
    // Blade edge highlight
    g.fillStyle(0xffffff, 0.7);
    g.fillTriangle(cx + 14, cy - 30, cx + 23, cy - 28, cx + 15, cy - 28);

    g.generateTexture('boss_taxman', s, s);
    g.destroy();
  }

  private createPiper(): void {
    const s = 48;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Legs (black socks with diamond pattern)
    g.fillStyle(0x222222, 1);
    g.fillRect(cx - 7, cy + 12, 5, 8);
    g.fillRect(cx + 2, cy + 12, 5, 8);
    g.fillStyle(0xdddddd, 0.6);
    g.fillRect(cx - 6, cy + 14, 3, 1);
    g.fillRect(cx + 3, cy + 14, 3, 1);

    // Kilt
    g.fillStyle(0x003366, 1);
    g.fillRect(cx - 10, cy + 2, 20, 12);
    g.fillStyle(0x336699, 1);
    g.fillRect(cx - 9, cy + 3, 18, 10);
    // Tartan
    g.lineStyle(1, 0x004488, 1);
    g.lineBetween(cx - 9, cy + 6, cx + 9, cy + 6);
    g.lineBetween(cx - 9, cy + 10, cx + 9, cy + 10);

    // Jacket
    g.fillStyle(0x222233, 1);
    g.fillRect(cx - 10, cy - 6, 20, 10);
    g.fillStyle(0x446688, 1);
    g.fillRect(cx - 9, cy - 5, 18, 8);

    // Head
    g.fillStyle(0xaa6644, 1);
    g.fillCircle(cx, cy - 12, 8);
    g.fillStyle(0xffccaa, 1);
    g.fillCircle(cx, cy - 12, 7);
    // Puffed cheeks (blowing pipes)
    g.fillStyle(0xffaa88, 1);
    g.fillCircle(cx - 6, cy - 10, 2);
    g.fillCircle(cx + 6, cy - 10, 2);
    // Eyes
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 3, cy - 13, 1);
    g.fillCircle(cx + 3, cy - 13, 1);

    // Tam o'shanter (tartan beret)
    g.fillStyle(0x002244, 1);
    g.fillEllipse(cx, cy - 19, 14, 5);
    g.fillStyle(0x003366, 1);
    g.fillEllipse(cx, cy - 20, 12, 4);
    // Pom-pom
    g.fillStyle(0xcc0000, 1);
    g.fillCircle(cx + 4, cy - 23, 2.5);

    // Iconic: BAGPIPES — big checkered bag under the arm
    g.fillStyle(0x442200, 1);
    g.fillEllipse(cx - 14, cy + 2, 14, 12);
    g.fillStyle(0x884422, 1);
    g.fillEllipse(cx - 14, cy + 2, 12, 10);
    // Bag pattern
    g.fillStyle(0xaa6633, 1);
    g.fillRect(cx - 18, cy - 1, 3, 3);
    g.fillRect(cx - 13, cy + 3, 3, 3);
    g.fillRect(cx - 18, cy + 4, 3, 3);

    // Drone pipes sticking up from bag (iconic!)
    g.fillStyle(0x221100, 1);
    g.fillRect(cx - 19, cy - 14, 2, 16);
    g.fillRect(cx - 15, cy - 16, 2, 18);
    g.fillRect(cx - 11, cy - 14, 2, 16);
    g.fillStyle(0x664422, 1);
    g.fillRect(cx - 19, cy - 13, 1, 15);
    g.fillRect(cx - 15, cy - 15, 1, 17);
    g.fillRect(cx - 11, cy - 13, 1, 15);
    // Pipe caps
    g.fillStyle(0xddaa00, 1);
    g.fillRect(cx - 20, cy - 15, 4, 2);
    g.fillRect(cx - 16, cy - 17, 4, 2);
    g.fillRect(cx - 12, cy - 15, 4, 2);

    // Chanter (blow pipe to mouth)
    g.fillStyle(0x221100, 1);
    g.fillRect(cx - 5, cy - 11, 3, 3);

    g.generateTexture('piper', s, s);
    g.destroy();
  }

  private createSheep(): void {
    const s = 36;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Wool body outline
    g.fillStyle(0xbbbbbb, 1);
    g.fillEllipse(cx, cy, 28, 20);
    // Cloud-shaped wool body (multiple overlapping circles)
    g.fillStyle(0xf0f0f0, 1);
    g.fillCircle(cx - 8, cy, 7);
    g.fillCircle(cx - 2, cy - 3, 8);
    g.fillCircle(cx + 4, cy - 2, 7);
    g.fillCircle(cx + 8, cy + 1, 6);
    g.fillCircle(cx - 6, cy + 3, 6);
    g.fillCircle(cx + 2, cy + 4, 6);
    // Wool highlights
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 4, cy - 4, 4);
    g.fillCircle(cx + 3, cy - 3, 4);
    g.fillCircle(cx - 7, cy + 1, 3);

    // Legs (small, poke out from under wool)
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 8, cy + 8, 3, 5);
    g.fillRect(cx - 3, cy + 8, 3, 5);
    g.fillRect(cx + 2, cy + 8, 3, 5);
    g.fillRect(cx + 7, cy + 8, 3, 5);

    // Head (iconic black face poking out)
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx + 11, cy - 1, 6);
    g.fillStyle(0x222222, 1);
    g.fillCircle(cx + 11, cy - 1, 5);
    // Ears
    g.fillStyle(0x000000, 1);
    g.fillTriangle(cx + 8, cy - 7, cx + 10, cy - 4, cx + 6, cy - 4);
    g.fillTriangle(cx + 14, cy - 7, cx + 12, cy - 4, cx + 16, cy - 4);
    // Glowing yellow eyes (creepy!)
    g.fillStyle(0xffdd00, 1);
    g.fillCircle(cx + 10, cy - 2, 1.5);
    g.fillCircle(cx + 13, cy - 2, 1.5);
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx + 10, cy - 2, 0.5);
    g.fillCircle(cx + 13, cy - 2, 0.5);
    // Snout
    g.fillStyle(0x555555, 1);
    g.fillRect(cx + 13, cy + 1, 3, 2);

    g.generateTexture('sheep', s, s);
    g.destroy();
  }

  private createGhost(): void {
    const s = 40;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Ghost body outline (ethereal, translucent)
    g.fillStyle(0x88aabb, 0.5);
    g.fillEllipse(cx, cy - 2, 28, 26);
    // Main body
    g.fillStyle(0xaabbcc, 0.7);
    g.fillEllipse(cx, cy - 2, 26, 24);
    g.fillStyle(0xccddee, 0.6);
    g.fillEllipse(cx - 2, cy - 4, 20, 18);

    // Wavy ghost-tail bottom (iconic)
    g.fillStyle(0xaabbcc, 0.7);
    for (let i = 0; i < 5; i++) {
      g.fillCircle(cx - 12 + i * 6, cy + 10, 5);
    }
    g.fillStyle(0xccddee, 0.6);
    for (let i = 0; i < 5; i++) {
      g.fillCircle(cx - 12 + i * 6, cy + 9, 4);
    }

    // Hollow eye sockets
    g.fillStyle(0x000000, 0.9);
    g.fillCircle(cx - 5, cy - 6, 4);
    g.fillCircle(cx + 5, cy - 6, 4);
    // Glowing blue pupils
    g.fillStyle(0x44aaff, 1);
    g.fillCircle(cx - 5, cy - 6, 2);
    g.fillCircle(cx + 5, cy - 6, 2);
    g.fillStyle(0xaaddff, 1);
    g.fillCircle(cx - 5, cy - 7, 0.8);
    g.fillCircle(cx + 5, cy - 7, 0.8);

    // Spooky open mouth
    g.fillStyle(0x000000, 0.9);
    g.fillEllipse(cx, cy + 2, 6, 5);
    g.fillStyle(0x1a3355, 1);
    g.fillEllipse(cx, cy + 2, 4, 3);

    g.generateTexture('ghost', s, s);
    g.destroy();
  }

  private createNest(): void {
    const s = 40;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Nest base outline
    g.fillStyle(0x3a2808, 1);
    g.fillEllipse(cx, cy + 4, 34, 20);
    // Nest twigs base
    g.fillStyle(0x6b4e0a, 1);
    g.fillEllipse(cx, cy + 3, 32, 18);
    g.fillStyle(0x886622, 1);
    g.fillEllipse(cx, cy + 1, 28, 14);
    // Twig detail (criss-crossed lines)
    g.lineStyle(1, 0x4a2a0a, 1);
    g.lineBetween(cx - 14, cy + 6, cx + 12, cy - 2);
    g.lineBetween(cx - 12, cy - 2, cx + 14, cy + 5);
    g.lineBetween(cx - 10, cy + 8, cx + 10, cy + 3);
    g.lineBetween(cx - 8, cy + 2, cx + 8, cy + 8);
    // Nest inside (darker)
    g.fillStyle(0x3a2808, 1);
    g.fillEllipse(cx, cy - 1, 20, 8);

    // Eggs (iconic, big and speckled)
    g.fillStyle(0xbbaa88, 1);
    g.fillEllipse(cx - 6, cy - 3, 8, 10);
    g.fillEllipse(cx + 6, cy - 3, 8, 10);
    g.fillEllipse(cx, cy - 2, 8, 10);
    g.fillStyle(0xeeeecc, 1);
    g.fillEllipse(cx - 6, cy - 4, 6, 8);
    g.fillEllipse(cx + 6, cy - 4, 6, 8);
    g.fillEllipse(cx, cy - 3, 6, 8);
    // Egg speckles
    g.fillStyle(0x8b6914, 1);
    g.fillCircle(cx - 6, cy - 2, 0.7);
    g.fillCircle(cx - 4, cy - 5, 0.7);
    g.fillCircle(cx + 6, cy - 4, 0.7);
    g.fillCircle(cx + 7, cy - 1, 0.7);
    g.fillCircle(cx, cy - 1, 0.7);
    g.fillCircle(cx + 1, cy - 5, 0.7);
    g.fillCircle(cx - 1, cy - 3, 0.7);

    g.generateTexture('nest', s, s);
    g.destroy();
  }

  private createChestTexture(): void {
    const s = 32;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Chest outline
    g.fillStyle(0x3a2808, 1);
    g.fillRect(cx - 14, cy - 7, 28, 18);
    // Chest body (wooden)
    g.fillStyle(0x8b6914, 1);
    g.fillRect(cx - 13, cy - 6, 26, 16);
    // Wood planks
    g.fillStyle(0x6b4e0a, 1);
    g.fillRect(cx - 13, cy, 26, 1);
    g.fillRect(cx - 13, cy + 5, 26, 1);
    // Chest lid highlight
    g.fillStyle(0xa07818, 1);
    g.fillRect(cx - 13, cy - 6, 26, 5);
    // Metal bands
    g.fillStyle(0x886600, 1);
    g.fillRect(cx - 13, cy - 2, 26, 2);
    g.fillStyle(0xddaa00, 1);
    g.fillRect(cx - 13, cy - 2, 26, 1);
    // Lock
    g.fillStyle(0x554400, 1);
    g.fillRect(cx - 3, cy + 1, 6, 6);
    g.fillStyle(0xffcc44, 1);
    g.fillRect(cx - 2, cy + 2, 4, 4);
    g.fillStyle(0x000000, 1);
    g.fillRect(cx - 1, cy + 3, 2, 2);

    g.generateTexture('chest', s, s);
    g.destroy();
  }

  private createHealthOrb(): void {
    const s = 18;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Outline
    g.fillStyle(0x116611, 1);
    g.fillCircle(cx, cy, 7);
    // Orb body
    g.fillStyle(0x44dd44, 1);
    g.fillCircle(cx, cy, 6);
    // Inner glow
    g.fillStyle(0x88ff88, 0.8);
    g.fillCircle(cx - 1, cy - 1, 4);
    // Cross
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx - 1, cy - 4, 2, 8);
    g.fillRect(cx - 4, cy - 1, 8, 2);
    // Shine
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(cx - 2, cy - 2, 1);

    g.generateTexture('health_orb', s, s);
    g.destroy();
  }

  private createDeepFryer(): void {
    const s = 48;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Vat outline
    g.fillStyle(0x222222, 1);
    g.fillRect(cx - 18, cy - 6, 36, 22);
    // Metal vat
    g.fillStyle(0x666666, 1);
    g.fillRect(cx - 17, cy - 5, 34, 20);
    g.fillStyle(0x888888, 1);
    g.fillRect(cx - 16, cy - 4, 32, 4);
    // Rim
    g.fillStyle(0x555555, 1);
    g.fillRect(cx - 18, cy - 8, 36, 3);
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(cx - 18, cy - 7, 36, 1);
    // Handles
    g.fillStyle(0x222222, 1);
    g.fillRect(cx - 22, cy - 5, 5, 3);
    g.fillRect(cx + 17, cy - 5, 5, 3);

    // Bubbling oil (iconic)
    g.fillStyle(0x884400, 1);
    g.fillRect(cx - 15, cy - 3, 30, 16);
    g.fillStyle(0xcc8800, 1);
    g.fillRect(cx - 14, cy - 2, 28, 14);
    g.fillStyle(0xddaa22, 1);
    g.fillRect(cx - 13, cy - 1, 26, 2);

    // Bubbles
    g.fillStyle(0xffdd44, 1);
    g.fillCircle(cx - 8, cy + 2, 2.5);
    g.fillCircle(cx + 4, cy + 4, 2);
    g.fillCircle(cx + 10, cy, 1.5);
    g.fillCircle(cx - 3, cy + 8, 2);
    g.fillStyle(0xffffcc, 0.8);
    g.fillCircle(cx - 8, cy + 1, 1.2);
    g.fillCircle(cx + 4, cy + 3, 1);
    g.fillCircle(cx - 3, cy + 7, 1);

    // Steam wisps (iconic — tells you it's hot)
    g.fillStyle(0xdddddd, 0.7);
    g.fillCircle(cx - 8, cy - 11, 3);
    g.fillCircle(cx, cy - 14, 3.5);
    g.fillCircle(cx + 8, cy - 11, 3);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(cx - 8, cy - 12, 2);
    g.fillCircle(cx, cy - 15, 2.5);
    g.fillCircle(cx + 8, cy - 12, 2);

    // Warning glow around hazard
    g.fillStyle(0xff4400, 0.3);
    g.fillCircle(cx, cy + 3, 22);

    g.generateTexture('deep_fryer', s, s);
    g.destroy();
  }

  // === Evolution weapon icons ===

  /** Thistle Storm — multiple thistles in a radiating burst */
  private createThistleStormIcon(): void {
    const s = 22;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;
    // Central bright core
    g.fillStyle(0xbb88ee, 1);
    g.fillCircle(cx, cy, 3);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(cx, cy, 1.5);
    // 5 thistle heads radiating out
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const tx = cx + Math.cos(a) * 7;
      const ty = cy + Math.sin(a) * 7;
      g.fillStyle(0x442266, 1);
      g.fillCircle(tx, ty, 2.5);
      g.fillStyle(0x9966cc, 1);
      g.fillCircle(tx, ty, 2);
      // Tiny spikes
      g.fillStyle(0xbb88ee, 1);
      g.fillCircle(tx + Math.cos(a) * 2, ty + Math.sin(a) * 2, 0.8);
    }
    g.generateTexture('wicon_thistle_storm', s, s);
    g.destroy();
  }

  /** Highland Games — flaming caber */
  private createHighlandGamesIcon(): void {
    const s = 22;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;
    // Caber body (rotated diagonally)
    g.fillStyle(0x3a2808, 1);
    g.fillRect(cx - 8, cy - 2, 16, 5);
    g.fillStyle(0x8b6914, 1);
    g.fillRect(cx - 7, cy - 1, 14, 3);
    g.fillStyle(0xa07818, 1);
    g.fillRect(cx - 7, cy - 1, 14, 1);
    // Flames at one end
    g.fillStyle(0xff3300, 0.9);
    g.fillCircle(cx + 9, cy, 3);
    g.fillStyle(0xff8800, 1);
    g.fillCircle(cx + 9, cy - 1, 2);
    g.fillStyle(0xffdd00, 1);
    g.fillCircle(cx + 9, cy - 2, 1);
    // Flame tips
    g.fillStyle(0xff6600, 0.7);
    g.fillTriangle(cx + 9, cy - 4, cx + 11, cy, cx + 7, cy - 2);
    g.generateTexture('wicon_highland_games', s, s);
    g.destroy();
  }

  /** Haggis Cannon — multiple haggis balls radiating */
  private createHaggisCannonIcon(): void {
    const s = 22;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;
    // Central haggis
    g.fillStyle(0x3a2808, 1);
    g.fillCircle(cx, cy, 4);
    g.fillStyle(0x6b4e0a, 1);
    g.fillCircle(cx, cy, 3);
    // Motion trails radiating out
    g.fillStyle(0x8b6914, 1);
    g.fillCircle(cx - 6, cy - 4, 2);
    g.fillCircle(cx + 6, cy - 4, 2);
    g.fillCircle(cx - 6, cy + 4, 2);
    g.fillCircle(cx + 6, cy + 4, 2);
    g.fillCircle(cx + 8, cy, 1.5);
    g.fillCircle(cx - 8, cy, 1.5);
    // Motion lines
    g.lineStyle(1, 0xa07818, 0.7);
    g.lineBetween(cx, cy, cx - 6, cy - 4);
    g.lineBetween(cx, cy, cx + 6, cy - 4);
    g.lineBetween(cx, cy, cx - 6, cy + 4);
    g.lineBetween(cx, cy, cx + 6, cy + 4);
    g.generateTexture('wicon_haggis_cannon', s, s);
    g.destroy();
  }

  /** Highland Fling — massive expanding ring */
  private createHighlandFlingIcon(): void {
    const s = 22;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;
    // Concentric rings (the shockwave)
    g.lineStyle(2, 0x4488ff, 1);
    g.strokeCircle(cx, cy, 9);
    g.lineStyle(2, 0x6699ff, 0.8);
    g.strokeCircle(cx, cy, 6);
    g.lineStyle(2, 0x88bbff, 0.6);
    g.strokeCircle(cx, cy, 3);
    // Bright center
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx, cy, 1.5);
    // Motion hints
    g.fillStyle(0xaaccff, 0.7);
    g.fillCircle(cx - 10, cy, 1);
    g.fillCircle(cx + 10, cy, 1);
    g.fillCircle(cx, cy - 10, 1);
    g.fillCircle(cx, cy + 10, 1);
    g.generateTexture('wicon_highland_fling', s, s);
    g.destroy();
  }

  /** The Haar — dense fog cloud */
  private createTheHaarIcon(): void {
    const s = 22;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;
    // Layered fog cloud
    g.fillStyle(0x445566, 0.7);
    g.fillCircle(cx - 4, cy + 2, 5);
    g.fillCircle(cx + 4, cy + 2, 5);
    g.fillCircle(cx, cy - 2, 6);
    g.fillStyle(0x667788, 0.8);
    g.fillCircle(cx - 3, cy + 1, 4);
    g.fillCircle(cx + 3, cy + 1, 4);
    g.fillCircle(cx, cy - 1, 5);
    g.fillStyle(0x99aabb, 0.9);
    g.fillCircle(cx - 2, cy, 3);
    g.fillCircle(cx + 2, cy, 3);
    // Bright wisps
    g.fillStyle(0xccddee, 1);
    g.fillCircle(cx, cy - 2, 1.5);
    g.fillCircle(cx - 4, cy + 1, 1);
    g.fillCircle(cx + 4, cy + 1, 1);
    g.generateTexture('wicon_the_haar', s, s);
    g.destroy();
  }

  /** Nessie Unleashed — full tentacle swirl */
  private createNessieUnleashedIcon(): void {
    const s = 22;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;
    // Swirling tentacle — multiple arcs
    g.fillStyle(0x114422, 1);
    g.fillCircle(cx, cy, 9);
    g.fillStyle(0x226644, 1);
    g.fillCircle(cx, cy, 7);
    // Tentacle segments swirling outward
    g.fillStyle(0x66aa77, 1);
    const segs = 8;
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const r = 3 + (i % 2) * 2;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      g.fillCircle(px, py, 1.3);
    }
    // Bright eye center
    g.fillStyle(0xffcc22, 1);
    g.fillCircle(cx, cy, 2);
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx, cy, 1);
    g.generateTexture('wicon_nessie_unleashed', s, s);
    g.destroy();
  }

}
