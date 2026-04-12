import Phaser from 'phaser';
import {
  DEFAULT_VARIANT_KEY,
  HaggisAccentStyle,
  HaggisPalette,
  VARIANTS,
  VariantDef,
  getVariantByKey,
} from '../data/variants';
import { achievementManager } from '../core/AchievementManager';
import { getAnalyticsManager } from '../core/AnalyticsManager';
import { validateAndRepairBootTextures } from '../core/AssetValidator';
import { metaProgressSystem } from '../core/MetaProgressSystem';
import { t } from '../core/i18n';

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
    validateAndRepairBootTextures(this);

    // Dev tool: skip splash and go straight to sprite export
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('export')) {
      this.scene.start('SpriteExport');
      return;
    }

    getAnalyticsManager().ensureBusHandlersStarted();

    // Initialize global meta progression exactly once (above the Scene lifecycle).
    metaProgressSystem.start();
    achievementManager.start();

    const { width, height } = this.scale;

    // Brief splash screen — textures are already generated, show a quick brand moment
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    const title = this.add.text(width / 2, height * 0.4, t('ui.menu.title'), {
      fontFamily: 'monospace', fontSize: '28px', color: '#d4a017',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    const mascot = this.add.sprite(width / 2, height * 0.55, getVariantByKey(DEFAULT_VARIANT_KEY).textureKey)
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
          onComplete: () => this.scene.start('MainMenu'),
        });
      },
    });
  }

  private generateAllTextures(): void {
    this.createHaggisTextures();
    this.createTourist();
    this.createChef();
    this.createTerrier();
    this.createHighlandCow();
    this.createEagle();
    this.createHaggisHunter();
    this.createAngryScotsman();
    this.createKelpie();
    this.createMidgieSwarm();
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
    this.createGlasgowKite();
    this.createStandaloneTrafficCone();
    this.createTunnockWrapper();
    this.createAbandonedPint();
    this.createBamSeagull();
    // Weapon HUD icons
    this.createWeaponIcons();
    this.createUpgradeCardIcons();
    this.createHudChromeTextures();
  }

  /** Small HUD sprites (shield, dash pips) — avoids emoji / font-dependent glyphs. */
  private createHudChromeTextures(): void {
    const s = 18;
    const g = this.add.graphics();
    const cx = s / 2;
    const cy = s / 2;
    g.fillStyle(0x3a7ca5, 1);
    g.fillTriangle(cx, cy - 7, cx + 6, cy + 2, cx, cy + 7);
    g.fillTriangle(cx, cy - 7, cx - 6, cy + 2, cx, cy + 7);
    g.fillStyle(0x8fd4ff, 0.55);
    g.fillTriangle(cx, cy - 5, cx + 3, cy + 1, cx, cy + 4);
    g.fillTriangle(cx, cy - 5, cx - 3, cy + 1, cx, cy + 4);
    g.generateTexture('hud_shield', s, s);
    g.destroy();

    const ps = 10;
    const gf = this.add.graphics();
    gf.fillStyle(0xd4a017, 1);
    gf.fillCircle(ps / 2, ps / 2, 3.8);
    gf.generateTexture('hud_dash_pip_full', ps, ps);
    gf.destroy();

    const ge = this.add.graphics();
    ge.lineStyle(1.5, 0xd4a017, 0.9);
    ge.strokeCircle(ps / 2, ps / 2, 3.5);
    ge.generateTexture('hud_dash_pip_empty', ps, ps);
    ge.destroy();

    // Snowflake particle for Enemy freeze FX — replaces the raw ❄ emoji
    // that used to be rendered as text. Keeps Enemy.ts consistent with the
    // HUD's "no emoji / font glyphs" principle. Drawn as six radiating arms
    // with a small bright centre dot so it reads as a snowflake even at 10px.
    const snow = 10;
    const gs = this.add.graphics();
    const scx = snow / 2;
    const scy = snow / 2;
    gs.lineStyle(1.5, 0xcce6ff, 1);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      gs.beginPath();
      gs.moveTo(scx, scy);
      gs.lineTo(scx + Math.cos(a) * 4.5, scy + Math.sin(a) * 4.5);
      gs.strokePath();
    }
    gs.fillStyle(0xffffff, 1);
    gs.fillCircle(scx, scy, 1.3);
    gs.generateTexture('fx_snowflake', snow, snow);
    gs.destroy();
  }

  /** Soft elliptical shadow placed under each entity. Dark translucent.
   *  Higher alpha values because the grass backdrop washes out subtle shadows. */
  private createEntityShadow(): void {
    const s = 40;
    const g = this.add.graphics();
    g.fillStyle(0x0a1a0a, 0.25);
    g.fillEllipse(s / 2, s / 2, 36, 12);
    g.fillStyle(0x0a1a0a, 0.4);
    g.fillEllipse(s / 2, s / 2, 28, 9);
    g.fillStyle(0x0a1a0a, 0.55);
    g.fillEllipse(s / 2, s / 2, 20, 6);
    g.generateTexture('entity_shadow', s, s);
    g.destroy();
  }

  /** Bigger shadow for bosses (60x60 → uses its own texture). */
  private createBossShadow(): void {
    const s = 80;
    const g = this.add.graphics();
    g.fillStyle(0x0a1a0a, 0.25);
    g.fillEllipse(s / 2, s / 2, 74, 24);
    g.fillStyle(0x0a1a0a, 0.4);
    g.fillEllipse(s / 2, s / 2, 58, 18);
    g.fillStyle(0x0a1a0a, 0.55);
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

    // Variant 1 — wide flat rock with horizontal crack
    const g1 = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;
    g1.fillStyle(0x333344, 1);
    g1.fillEllipse(cx, cy, 18, 10);
    g1.fillStyle(0x555566, 1);
    g1.fillEllipse(cx - 1, cy - 1, 16, 9);
    g1.fillStyle(0x7a7a8a, 1);
    g1.fillEllipse(cx - 2, cy - 2, 10, 4);
    g1.fillStyle(0x333344, 1);
    g1.fillRect(cx, cy - 1, 3, 1);
    g1.fillRect(cx - 4, cy + 1, 2, 1);
    g1.generateTexture('deco_rock', s, s);
    g1.destroy();

    // Variant 2 — taller, rounder rock with diagonal crack
    const g2 = this.add.graphics();
    g2.fillStyle(0x2e2e40, 1);
    g2.fillEllipse(cx, cy, 14, 13);
    g2.fillStyle(0x4a4a5c, 1);
    g2.fillEllipse(cx - 1, cy - 1, 12, 11);
    g2.fillStyle(0x6a6a7a, 1);
    g2.fillEllipse(cx - 2, cy - 3, 7, 4);
    g2.fillStyle(0x2e2e40, 1);
    g2.fillRect(cx - 1, cy - 2, 1, 3);
    g2.fillRect(cx, cy, 2, 1);
    g2.generateTexture('deco_rock_2', s, s);
    g2.destroy();

    // Variant 3 — small angular pebble cluster
    const g3 = this.add.graphics();
    g3.fillStyle(0x3a3a4a, 1);
    g3.fillEllipse(cx - 3, cy, 10, 8);
    g3.fillEllipse(cx + 4, cy + 1, 8, 7);
    g3.fillStyle(0x585868, 1);
    g3.fillEllipse(cx - 3, cy - 1, 8, 6);
    g3.fillEllipse(cx + 4, cy, 6, 5);
    g3.fillStyle(0x7a7a88, 1);
    g3.fillEllipse(cx - 4, cy - 2, 4, 2);
    // Wee traffic cone lying on its side (if you know, you know)
    g3.fillStyle(0xff6600, 1);
    g3.fillTriangle(cx + 7, cy - 2, cx + 9, cy + 2, cx + 5, cy + 2);
    g3.fillStyle(0xff8833, 1);
    g3.fillTriangle(cx + 7, cy - 1, cx + 8, cy + 1, cx + 6, cy + 1);
    g3.fillStyle(0xffffff, 0.8);
    g3.fillRect(cx + 6, cy, 2, 1);
    g3.generateTexture('deco_rock_3', s, s);
    g3.destroy();
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
    // Tiny upward flower spikes — turns "purple blob" into recognizable heather
    g.fillStyle(0xdd88bb, 1);
    g.fillRect(cx - 5, cy - 5, 1, 3);
    g.fillRect(cx - 2, cy - 6, 1, 3);
    g.fillRect(cx + 1, cy - 5, 1, 3);
    g.fillRect(cx + 4, cy - 4, 1, 3);
    g.fillRect(cx - 1, cy - 4, 1, 2);
    // Pink tips
    g.fillStyle(0xeeaacc, 1);
    g.fillRect(cx - 5, cy - 5, 1, 1);
    g.fillRect(cx - 2, cy - 6, 1, 1);
    g.fillRect(cx + 1, cy - 5, 1, 1);
    g.fillRect(cx + 4, cy - 4, 1, 1);
    g.generateTexture('deco_heather', s, s);
    g.destroy();
  }

  private createGlasgowKite(): void {
    const s = 16;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;
    g.fillStyle(0x99aacc, 0.35);
    g.fillEllipse(cx, cy, 12, 8);
    g.fillStyle(0xaabbdd, 0.3);
    g.fillEllipse(cx - 1, cy - 1, 10, 6);
    g.lineStyle(0.5, 0x8899bb, 0.3);
    g.lineBetween(cx - 4, cy - 2, cx + 3, cy + 1);
    g.lineBetween(cx - 2, cy + 1, cx + 4, cy - 1);
    g.fillStyle(0x8899bb, 0.4);
    g.fillCircle(cx - 2, cy - 4, 1.5);
    g.fillCircle(cx + 2, cy - 4, 1.5);
    g.fillStyle(0x99aacc, 0.25);
    g.fillCircle(cx - 2, cy - 4, 0.8);
    g.fillCircle(cx + 2, cy - 4, 0.8);
    g.fillStyle(0x99aacc, 0.25);
    g.fillTriangle(cx + 5, cy + 2, cx + 8, cy + 5, cx + 4, cy + 4);
    g.generateTexture('deco_glasgow_kite', s, s);
    g.destroy();
  }

  private createStandaloneTrafficCone(): void {
    const s = 16;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;
    g.fillStyle(0xcc4400, 1);
    g.fillTriangle(cx - 6, cy, cx + 5, cy - 3, cx + 5, cy + 3);
    g.fillStyle(0xee6611, 1);
    g.fillTriangle(cx - 5, cy, cx + 4, cy - 2, cx + 4, cy + 2);
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(cx, cy - 2, 3, 4);
    g.fillStyle(0x222222, 1);
    g.fillRect(cx + 4, cy - 4, 3, 8);
    g.generateTexture('deco_cone', s, s);
    g.destroy();
  }

  private createTunnockWrapper(): void {
    const s = 12;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 1;
    g.fillStyle(0xcc1122, 1);
    g.fillEllipse(cx, cy, 8, 5);
    g.fillStyle(0xaaaaaa, 1);
    g.fillEllipse(cx, cy - 1, 8, 3);
    g.fillStyle(0xcc1122, 1);
    g.fillRect(cx - 3, cy - 1, 6, 1);
    g.fillStyle(0xdddddd, 0.6);
    g.fillCircle(cx - 1, cy - 2, 0.7);
    g.fillCircle(cx + 2, cy - 1, 0.5);
    g.generateTexture('deco_tunnock', s, s);
    g.destroy();
  }

  private createAbandonedPint(): void {
    const s = 14;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;
    g.fillStyle(0x888888, 0.5);
    g.fillRect(cx - 3, cy - 5, 6, 10);
    g.fillStyle(0xcc9922, 0.7);
    g.fillRect(cx - 2, cy, 4, 4);
    g.fillStyle(0xeeeeee, 0.6);
    g.fillRect(cx - 2, cy - 1, 4, 1);
    g.fillStyle(0xaabbcc, 0.2);
    g.fillRect(cx - 2, cy - 4, 4, 3);
    g.fillStyle(0xcc1111, 0.8);
    g.fillRect(cx - 1, cy - 3, 2, 1);
    g.fillRect(cx, cy - 3, 1, 3);
    g.generateTexture('deco_tennents', s, s);
    g.destroy();
  }

  private createBamSeagull(): void {
    const s = 36;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;
    g.fillStyle(0x667788, 1);
    g.fillTriangle(cx - 2, cy, cx - 14, cy - 8, cx + 2, cy - 6);
    g.fillTriangle(cx - 2, cy, cx - 14, cy + 8, cx + 2, cy + 6);
    g.fillStyle(0x8899aa, 1);
    g.fillTriangle(cx, cy, cx - 10, cy - 6, cx + 1, cy - 4);
    g.fillTriangle(cx, cy, cx - 10, cy + 6, cx + 1, cy + 4);
    g.fillStyle(0x334455, 1);
    g.fillTriangle(cx - 14, cy - 8, cx - 10, cy - 5, cx - 16, cy - 6);
    g.fillTriangle(cx - 14, cy + 8, cx - 10, cy + 5, cx - 16, cy + 6);
    g.fillStyle(0xcccccc, 1);
    g.fillEllipse(cx + 2, cy, 14, 10);
    g.fillStyle(0xeeeeee, 1);
    g.fillEllipse(cx + 2, cy, 12, 8);
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(cx + 1, cy - 1, 10, 6);
    g.fillStyle(0x889999, 1);
    g.fillTriangle(cx - 5, cy - 2, cx - 5, cy + 2, cx - 10, cy);
    g.fillStyle(0xdddddd, 1);
    g.fillCircle(cx + 10, cy, 5);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx + 10, cy, 4);
    g.fillStyle(0xeedd44, 1);
    g.fillCircle(cx + 11, cy - 1, 1.5);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx + 11, cy - 1, 0.7);
    g.fillStyle(0xdd9922, 1);
    g.fillTriangle(cx + 13, cy - 1, cx + 13, cy + 2, cx + 18, cy + 1);
    g.fillStyle(0xeeaa33, 1);
    g.fillTriangle(cx + 13, cy, cx + 13, cy + 1, cx + 17, cy + 1);
    g.fillStyle(0xcc2222, 1);
    g.fillCircle(cx + 15, cy + 1, 0.7);
    g.fillStyle(0xddbb44, 1);
    g.fillRect(cx + 16, cy - 1, 4, 2);
    g.fillStyle(0xeedd66, 1);
    g.fillRect(cx + 16, cy - 1, 3, 1);
    g.fillStyle(0xdd9988, 1);
    g.fillRect(cx, cy + 4, 1, 4);
    g.fillRect(cx + 3, cy + 4, 1, 4);
    g.fillStyle(0xcc8877, 1);
    g.fillRect(cx - 1, cy + 7, 3, 1);
    g.fillRect(cx + 2, cy + 7, 3, 1);
    g.generateTexture('bam_seagull', s, s);
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
    this.createClaymoreWeaponIcon();
    this.createBagpipesUtilityIcon();
    this.createWilliamBladeIcon();
  }

  /** Upgrade-card icons (passives + stat families). */
  private createUpgradeCardIcons(): void {
    // ── Passive card icons (32×32, displayed at ~1.4× in upgrade overlay) ──
    this.createCardIcon_Sporran();
    this.createCardIcon_WhiskyFlask();
    this.createCardIcon_Kilt();
    this.createCardIcon_TamOShanter();
    this.createCardIcon_IrnBru();
    this.createCardIcon_LochWater();
    this.createCardIcon_ThistleCrown();
    this.createCardIcon_HighlandShield();
    this.createCardIcon_TartanSash();
    // ── Stat boost card icons ──
    this.createCardIcon_StatHealth();
    this.createCardIcon_StatSpeed();
    this.createCardIcon_StatPickup();
    this.createCardIcon_StatDamage();
    this.createCardIcon_StatDrift();
    this.createCardIcon_StatDefense();
    this.createCardIcon_StatUtility();
    this.createCardIcon_StatCooldown();
    this.createCardIcon_StatKnockback();
  }

  /** Shared card icon background — dark border, tinted interior, subtle corner roundness. */
  private cardIconBg(g: Phaser.GameObjects.Graphics, s: number, bgColor: number): void {
    g.fillStyle(0x0b111c, 1);
    g.fillRoundedRect(1, 1, s - 2, s - 2, 6);
    g.fillStyle(bgColor, 1);
    g.fillRoundedRect(3, 3, s - 6, s - 6, 4);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  PASSIVE CARD ICONS — these are the culturally important ones
  // ═══════════════════════════════════════════════════════════════════════════

  /** Sporran: leather pouch with fur trim, metal clasp, and three tassels. */
  private createCardIcon_Sporran(): void {
    const s = 32, g = this.add.graphics();
    this.cardIconBg(g, s, 0x3d2a20);
    const cx = 16, cy = 16;
    // Fur trim (top edge of pouch)
    g.fillStyle(0x8a7a6a, 1);
    g.fillRect(cx - 8, cy - 6, 16, 4);
    g.fillStyle(0xa09080, 1);
    for (let i = 0; i < 8; i++) g.fillRect(cx - 7 + i * 2, cy - 6, 1, 3);
    // Leather body — main pouch shape
    g.fillStyle(0x3a2210, 1);
    g.fillEllipse(cx, cy + 2, 18, 14);
    g.fillStyle(0x5a3a1a, 1);
    g.fillEllipse(cx, cy + 2, 16, 12);
    // Leather highlight (top-left sheen)
    g.fillStyle(0x6a4a28, 1);
    g.fillEllipse(cx - 2, cy, 10, 6);
    // Metal clasp — circular cantle
    g.fillStyle(0x888888, 1);
    g.fillCircle(cx, cy - 1, 4);
    g.fillStyle(0xcccccc, 1);
    g.fillCircle(cx, cy - 1, 3);
    g.fillStyle(0xd4a017, 1);
    g.fillCircle(cx, cy - 1, 2);
    g.fillStyle(0xffcc44, 1);
    g.fillCircle(cx - 1, cy - 2, 0.8);
    // Three tassels hanging below
    g.fillStyle(0x3a2210, 1);
    g.fillRect(cx - 5, cy + 8, 2, 6);
    g.fillRect(cx - 1, cy + 8, 2, 7);
    g.fillRect(cx + 3, cy + 8, 2, 6);
    // Tassel tips
    g.fillStyle(0x5a3a1a, 1);
    g.fillCircle(cx - 4, cy + 14, 1.5);
    g.fillCircle(cx, cy + 15, 1.5);
    g.fillCircle(cx + 4, cy + 14, 1.5);
    g.generateTexture('ucard_sporran', s, s);
    g.destroy();
  }

  /** Whisky Flask: hip flask with screw cap, embossed thistle, amber liquid visible. */
  private createCardIcon_WhiskyFlask(): void {
    const s = 32, g = this.add.graphics();
    this.cardIconBg(g, s, 0x332211);
    const cx = 16, cy = 16;
    // Flask body — rounded rectangle, slightly tapered
    g.fillStyle(0x555555, 1);
    g.fillRoundedRect(cx - 7, cy - 4, 14, 16, 3);
    g.fillStyle(0x888888, 1);
    g.fillRoundedRect(cx - 6, cy - 3, 12, 14, 2);
    // Metallic sheen (left highlight)
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(cx - 5, cy - 2, 3, 12);
    g.fillStyle(0xcccccc, 0.5);
    g.fillRect(cx - 4, cy - 1, 1, 10);
    // Screw cap (top)
    g.fillStyle(0x666666, 1);
    g.fillRect(cx - 3, cy - 8, 6, 5);
    g.fillStyle(0x999999, 1);
    g.fillRect(cx - 2, cy - 7, 4, 3);
    // Cap ridges
    g.fillStyle(0x777777, 1);
    g.fillRect(cx - 3, cy - 7, 6, 1);
    g.fillRect(cx - 3, cy - 5, 6, 1);
    // Amber liquid window (oval inset)
    g.fillStyle(0x442200, 1);
    g.fillEllipse(cx + 1, cy + 3, 6, 8);
    g.fillStyle(0xcc7711, 1);
    g.fillEllipse(cx + 1, cy + 4, 4, 5);
    g.fillStyle(0xee9922, 0.6);
    g.fillEllipse(cx + 1, cy + 3, 2, 3);
    g.generateTexture('ucard_whisky_flask', s, s);
    g.destroy();
  }

  /** Kilt: draped tartan fabric with crossed pattern and belt buckle. */
  private createCardIcon_Kilt(): void {
    const s = 32, g = this.add.graphics();
    this.cardIconBg(g, s, 0x1d2d5a);
    const cx = 16;
    // Kilt body — draped shape, wider at bottom
    g.fillStyle(0x1a3a6a, 1);
    g.fillRect(cx - 10, 8, 20, 18);
    g.fillStyle(0x2a4a8a, 1);
    g.fillRect(cx - 9, 9, 18, 16);
    // Tartan pattern — vertical lines
    g.fillStyle(0x3a6aaa, 0.7);
    g.fillRect(cx - 6, 9, 2, 16);
    g.fillRect(cx + 1, 9, 2, 16);
    g.fillRect(cx + 6, 9, 2, 16);
    // Tartan pattern — horizontal lines
    g.fillStyle(0x5a88cc, 0.5);
    g.fillRect(cx - 9, 12, 18, 1);
    g.fillRect(cx - 9, 17, 18, 1);
    g.fillRect(cx - 9, 22, 18, 1);
    // Accent stripe (red thread through tartan)
    g.fillStyle(0xcc3344, 0.6);
    g.fillRect(cx - 9, 14, 18, 1);
    g.fillRect(cx - 9, 20, 18, 1);
    g.fillRect(cx - 2, 9, 1, 16);
    // Pleats — shadow lines for drape depth
    g.fillStyle(0x0a1a3a, 0.4);
    g.fillRect(cx - 4, 9, 1, 16);
    g.fillRect(cx + 4, 9, 1, 16);
    // Belt at top
    g.fillStyle(0x2a1a0a, 1);
    g.fillRect(cx - 10, 7, 20, 3);
    g.fillStyle(0x3a2a1a, 1);
    g.fillRect(cx - 9, 8, 18, 1);
    // Belt buckle
    g.fillStyle(0xccaa44, 1);
    g.fillRect(cx - 2, 7, 4, 3);
    g.fillStyle(0xffdd66, 1);
    g.fillRect(cx - 1, 8, 2, 1);
    g.generateTexture('ucard_kilt', s, s);
    g.destroy();
  }

  /** Tam o' Shanter: blue bonnet with diced band and red pompom (toorie). */
  private createCardIcon_TamOShanter(): void {
    const s = 32, g = this.add.graphics();
    this.cardIconBg(g, s, 0x2a2238);
    const cx = 16, cy = 15;
    // Main bonnet body — soft round beret shape
    g.fillStyle(0x1a2244, 1);
    g.fillEllipse(cx, cy - 1, 22, 14);
    g.fillStyle(0x2a3366, 1);
    g.fillEllipse(cx, cy - 2, 20, 12);
    // Fabric highlight (top-left)
    g.fillStyle(0x3a4488, 1);
    g.fillEllipse(cx - 3, cy - 4, 10, 6);
    g.fillStyle(0x4a5599, 0.5);
    g.fillEllipse(cx - 4, cy - 5, 6, 3);
    // Diced band (chequered headband) — the distinctive check pattern
    g.fillStyle(0x111122, 1);
    g.fillRect(cx - 11, cy + 4, 22, 4);
    // Red-white-red dicing
    for (let i = 0; i < 11; i++) {
      const col = i % 2 === 0 ? 0xcc2233 : 0xeeeeee;
      g.fillStyle(col, 1);
      g.fillRect(cx - 10 + i * 2, cy + 5, 2, 2);
    }
    // Toorie (pompom on top) — red fluffy ball
    g.fillStyle(0x881122, 1);
    g.fillCircle(cx, cy - 8, 4);
    g.fillStyle(0xcc2244, 1);
    g.fillCircle(cx, cy - 8, 3);
    g.fillStyle(0xee4466, 1);
    g.fillCircle(cx - 1, cy - 9, 1.5);
    g.fillStyle(0xff6688, 0.7);
    g.fillCircle(cx - 1, cy - 10, 0.8);
    g.generateTexture('ucard_tam_o_shanter', s, s);
    g.destroy();
  }

  /** Irn-Bru: iconic glass bottle with bright orange liquid, blue label band. */
  private createCardIcon_IrnBru(): void {
    const s = 32, g = this.add.graphics();
    this.cardIconBg(g, s, 0x44220f);
    const cx = 16;
    // Bottle neck
    g.fillStyle(0x336633, 0.8);
    g.fillRect(cx - 2, 5, 4, 5);
    g.fillStyle(0x448844, 0.6);
    g.fillRect(cx - 1, 6, 2, 3);
    // Cap
    g.fillStyle(0xddaa00, 1);
    g.fillRect(cx - 3, 4, 6, 3);
    g.fillStyle(0xffcc33, 1);
    g.fillRect(cx - 2, 5, 4, 1);
    // Bottle body — wider, rounded
    g.fillStyle(0x224422, 1);
    g.fillRoundedRect(cx - 7, 10, 14, 16, 3);
    // Orange liquid visible through glass
    g.fillStyle(0xdd6600, 1);
    g.fillRoundedRect(cx - 6, 11, 12, 14, 2);
    g.fillStyle(0xff8811, 1);
    g.fillRoundedRect(cx - 5, 12, 10, 12, 2);
    // Radioactive orange glow (inner highlight)
    g.fillStyle(0xffaa33, 0.7);
    g.fillRect(cx - 3, 14, 4, 8);
    g.fillStyle(0xffcc66, 0.4);
    g.fillRect(cx - 2, 15, 2, 6);
    // Blue label band across middle
    g.fillStyle(0x1144aa, 1);
    g.fillRect(cx - 6, 17, 12, 4);
    g.fillStyle(0x2266cc, 1);
    g.fillRect(cx - 5, 18, 10, 2);
    // Glass reflection (white streak, left side)
    g.fillStyle(0xffffff, 0.2);
    g.fillRect(cx - 5, 12, 2, 12);
    g.generateTexture('ucard_irn_bru', s, s);
    g.destroy();
  }

  /** Loch Water: corked glass vial with deep blue-green water, mysterious glow. */
  private createCardIcon_LochWater(): void {
    const s = 32, g = this.add.graphics();
    this.cardIconBg(g, s, 0x12334a);
    const cx = 16;
    // Cork stopper
    g.fillStyle(0x8a6a3a, 1);
    g.fillRect(cx - 3, 5, 6, 4);
    g.fillStyle(0xaa8a5a, 1);
    g.fillRect(cx - 2, 6, 4, 2);
    // Vial neck
    g.fillStyle(0x446688, 0.8);
    g.fillRect(cx - 2, 9, 4, 3);
    // Vial body — rounded flask shape
    g.fillStyle(0x224466, 1);
    g.fillRoundedRect(cx - 8, 12, 16, 14, 4);
    // Deep loch water inside
    g.fillStyle(0x114433, 1);
    g.fillRoundedRect(cx - 7, 13, 14, 12, 3);
    g.fillStyle(0x226655, 1);
    g.fillRoundedRect(cx - 6, 14, 12, 10, 2);
    // Mysterious underwater glow
    g.fillStyle(0x44ccaa, 0.4);
    g.fillCircle(cx, 20, 4);
    g.fillStyle(0x66eedd, 0.3);
    g.fillCircle(cx, 19, 2);
    // Tiny bubbles
    g.fillStyle(0x88ddcc, 0.7);
    g.fillCircle(cx - 3, 17, 1);
    g.fillCircle(cx + 2, 15, 0.8);
    g.fillCircle(cx + 4, 19, 1);
    // Glass reflection
    g.fillStyle(0xffffff, 0.15);
    g.fillRect(cx - 6, 14, 2, 10);
    g.generateTexture('ucard_loch_water', s, s);
    g.destroy();
  }

  /** Thistle Crown: golden crown with purple thistle flower centrepiece, thorny rim. */
  private createCardIcon_ThistleCrown(): void {
    const s = 32, g = this.add.graphics();
    this.cardIconBg(g, s, 0x3a214d);
    const cx = 16, cy = 17;
    // Crown base band — gold
    g.fillStyle(0x8a6a10, 1);
    g.fillRect(cx - 10, cy + 2, 20, 5);
    g.fillStyle(0xcc9922, 1);
    g.fillRect(cx - 9, cy + 3, 18, 3);
    g.fillStyle(0xddaa33, 1);
    g.fillRect(cx - 9, cy + 3, 18, 1);
    // Crown points (5 tines with jewels)
    const tines = [-8, -4, 0, 4, 8];
    const heights = [8, 10, 12, 10, 8];
    for (let i = 0; i < 5; i++) {
      const tx = cx + tines[i];
      const th = heights[i];
      // Tine
      g.fillStyle(0xcc9922, 1);
      g.fillTriangle(tx - 2, cy + 2, tx, cy + 2 - th, tx + 2, cy + 2);
      // Tine highlight
      g.fillStyle(0xddbb44, 0.7);
      g.fillTriangle(tx - 1, cy + 1, tx, cy + 3 - th, tx, cy + 1);
    }
    // Purple thistle flower (centre, atop the middle tine)
    g.fillStyle(0x663388, 1);
    g.fillCircle(cx, cy - 8, 4);
    g.fillStyle(0x8844aa, 1);
    g.fillCircle(cx, cy - 8, 3);
    // Thistle spikes radiating
    g.fillStyle(0xaa66cc, 1);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.fillCircle(cx + Math.cos(a) * 4, cy - 8 + Math.sin(a) * 4, 1);
    }
    // Bright centre
    g.fillStyle(0xcc88ff, 1);
    g.fillCircle(cx, cy - 8, 1.5);
    // Jewels on crown band
    g.fillStyle(0xff3366, 1);
    g.fillCircle(cx - 5, cy + 4, 1.5);
    g.fillCircle(cx + 5, cy + 4, 1.5);
    g.fillStyle(0x44ccff, 1);
    g.fillCircle(cx, cy + 4, 1.5);
    g.generateTexture('ucard_thistle_crown', s, s);
    g.destroy();
  }

  /** Highland Shield: round targe shield with boss centre, leather rim, Celtic knot. */
  private createCardIcon_HighlandShield(): void {
    const s = 32, g = this.add.graphics();
    this.cardIconBg(g, s, 0x1f2b44);
    const cx = 16, cy = 16;
    // Outer rim — dark leather
    g.fillStyle(0x3a2a1a, 1);
    g.fillCircle(cx, cy, 13);
    // Shield face — wooden / leather
    g.fillStyle(0x4a5a6a, 1);
    g.fillCircle(cx, cy, 11);
    g.fillStyle(0x5a6a7a, 1);
    g.fillCircle(cx, cy, 10);
    // Ring decoration (concentric)
    g.lineStyle(1, 0x7a8a9a, 0.8);
    g.strokeCircle(cx, cy, 8);
    g.lineStyle(1, 0x6a7a8a, 0.6);
    g.strokeCircle(cx, cy, 5);
    // Central boss (metal spike/dome)
    g.fillStyle(0x888888, 1);
    g.fillCircle(cx, cy, 4);
    g.fillStyle(0xbbbbbb, 1);
    g.fillCircle(cx, cy, 3);
    g.fillStyle(0xdddddd, 1);
    g.fillCircle(cx, cy, 1.5);
    // Specular highlight
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(cx - 1, cy - 1, 1);
    // Four studs on rim (compass points)
    g.fillStyle(0xccaa44, 1);
    g.fillCircle(cx, cy - 10, 1.5);
    g.fillCircle(cx, cy + 10, 1.5);
    g.fillCircle(cx - 10, cy, 1.5);
    g.fillCircle(cx + 10, cy, 1.5);
    // Rim sheen
    g.fillStyle(0xffffff, 0.1);
    g.fillCircle(cx - 4, cy - 6, 5);
    g.generateTexture('ucard_highland_shield', s, s);
    g.destroy();
  }

  /** Tartan Sash: diagonal cloth band with woven tartan pattern, clan pin. */
  private createCardIcon_TartanSash(): void {
    const s = 32, g = this.add.graphics();
    this.cardIconBg(g, s, 0x3b1f2d);
    // Diagonal sash — upper-right to lower-left
    g.fillStyle(0x661133, 1);
    // Draw thick diagonal band
    for (let i = 0; i < 20; i++) {
      g.fillRect(4 + i, 4 + i, 8, 2);
    }
    g.fillStyle(0x992244, 1);
    for (let i = 0; i < 20; i++) {
      g.fillRect(5 + i, 5 + i, 6, 1);
    }
    // Tartan cross-threads on the sash
    g.fillStyle(0xcc5566, 0.6);
    for (let i = 0; i < 18; i += 4) {
      g.fillRect(5 + i, 5 + i, 6, 1);
    }
    g.fillStyle(0xffcc44, 0.4);
    for (let i = 2; i < 18; i += 6) {
      g.fillRect(5 + i, 5 + i, 6, 1);
    }
    // Clan pin / brooch (circular, near top)
    g.fillStyle(0x888888, 1);
    g.fillCircle(11, 11, 4);
    g.fillStyle(0xcccccc, 1);
    g.fillCircle(11, 11, 3);
    // Pin centre — thistle motif
    g.fillStyle(0x8844aa, 1);
    g.fillCircle(11, 11, 1.5);
    g.fillStyle(0xdddddd, 1);
    g.fillCircle(10, 10, 0.7);
    // Fringe at bottom end
    g.fillStyle(0x661133, 1);
    g.fillRect(22, 24, 2, 4);
    g.fillRect(24, 25, 2, 3);
    g.fillRect(26, 26, 2, 2);
    g.generateTexture('ucard_tartan_sash', s, s);
    g.destroy();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  STAT BOOST CARD ICONS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Health: chunky pixel heart with shading and specular highlight. */
  private createCardIcon_StatHealth(): void {
    const s = 32, g = this.add.graphics();
    this.cardIconBg(g, s, 0x2c1f2a);
    const cx = 16, cy = 16;
    // Heart outline
    g.fillStyle(0x881122, 1);
    g.fillCircle(cx - 4, cy - 2, 6);
    g.fillCircle(cx + 4, cy - 2, 6);
    g.fillTriangle(cx - 10, cy, cx + 10, cy, cx, cy + 11);
    // Heart fill
    g.fillStyle(0xcc2244, 1);
    g.fillCircle(cx - 4, cy - 2, 5);
    g.fillCircle(cx + 4, cy - 2, 5);
    g.fillTriangle(cx - 9, cy - 1, cx + 9, cy - 1, cx, cy + 10);
    // Highlight (top-left lobe)
    g.fillStyle(0xee4466, 1);
    g.fillCircle(cx - 4, cy - 3, 3);
    g.fillStyle(0xff6688, 0.6);
    g.fillCircle(cx - 5, cy - 4, 1.5);
    // Specular
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(cx - 5, cy - 5, 1);
    g.generateTexture('ucard_stat_health', s, s);
    g.destroy();
  }

  /** Speed: lightning bolt with electric glow. */
  private createCardIcon_StatSpeed(): void {
    const s = 32, g = this.add.graphics();
    this.cardIconBg(g, s, 0x213047);
    const cx = 16;
    // Outer glow
    g.fillStyle(0x4488ff, 0.2);
    g.fillCircle(cx, 16, 10);
    // Bolt outline
    g.fillStyle(0x3366aa, 1);
    g.fillTriangle(cx + 4, 5, cx - 2, 15, cx + 3, 15);
    g.fillTriangle(cx - 1, 15, cx - 5, 27, cx + 4, 15);
    // Bolt fill — bright
    g.fillStyle(0x66aaff, 1);
    g.fillTriangle(cx + 3, 7, cx - 1, 15, cx + 2, 15);
    g.fillTriangle(cx, 15, cx - 3, 25, cx + 3, 15);
    // Inner bright core
    g.fillStyle(0xaaddff, 1);
    g.fillTriangle(cx + 1, 9, cx, 15, cx + 1, 15);
    g.fillTriangle(cx, 15, cx - 1, 23, cx + 2, 15);
    // Electric sparks
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(cx - 3, 12, 1);
    g.fillCircle(cx + 4, 18, 1);
    g.fillCircle(cx - 1, 21, 0.8);
    g.generateTexture('ucard_stat_speed', s, s);
    g.destroy();
  }

  /** Pickup: horseshoe magnet with red/blue poles and attraction lines. */
  private createCardIcon_StatPickup(): void {
    const s = 32, g = this.add.graphics();
    this.cardIconBg(g, s, 0x243a22);
    const cx = 16, cy = 14;
    // Magnet body (U-shape, chunky)
    // Left pole
    g.fillStyle(0x882222, 1);
    g.fillRect(cx - 10, cy - 6, 5, 14);
    g.fillStyle(0xcc3333, 1);
    g.fillRect(cx - 9, cy - 5, 3, 12);
    // Right pole
    g.fillStyle(0x222288, 1);
    g.fillRect(cx + 5, cy - 6, 5, 14);
    g.fillStyle(0x3344cc, 1);
    g.fillRect(cx + 6, cy - 5, 3, 12);
    // Bottom curve connecting poles
    g.fillStyle(0x666666, 1);
    g.fillRect(cx - 10, cy + 6, 20, 5);
    g.fillRoundedRect(cx - 10, cy + 4, 20, 8, 4);
    g.fillStyle(0x999999, 1);
    g.fillRect(cx - 6, cy + 7, 12, 3);
    // Pole tips (bright caps)
    g.fillStyle(0xff4444, 1);
    g.fillRect(cx - 10, cy - 7, 5, 3);
    g.fillStyle(0x4466ff, 1);
    g.fillRect(cx + 5, cy - 7, 5, 3);
    // Attraction field lines
    g.fillStyle(0x99dd88, 0.5);
    g.fillCircle(cx, cy - 8, 1);
    g.fillCircle(cx - 2, cy - 10, 0.8);
    g.fillCircle(cx + 2, cy - 10, 0.8);
    g.generateTexture('ucard_stat_pickup', s, s);
    g.destroy();
  }

  /** Damage: crossed swords with blade gleam. */
  private createCardIcon_StatDamage(): void {
    const s = 32, g = this.add.graphics();
    this.cardIconBg(g, s, 0x3c2318);
    const cx = 16, cy = 16;
    // Sword 1 (upper-left to lower-right) — blade
    g.fillStyle(0x667788, 1);
    for (let i = 0; i < 18; i++) g.fillRect(5 + i, 5 + i, 3, 2);
    g.fillStyle(0x99aabb, 1);
    for (let i = 0; i < 16; i++) g.fillRect(6 + i, 6 + i, 2, 1);
    // Sword 2 (upper-right to lower-left) — blade
    g.fillStyle(0x667788, 1);
    for (let i = 0; i < 18; i++) g.fillRect(24 - i, 5 + i, 3, 2);
    g.fillStyle(0x99aabb, 1);
    for (let i = 0; i < 16; i++) g.fillRect(24 - i, 6 + i, 2, 1);
    // Cross guard 1
    g.fillStyle(0xcc8833, 1);
    g.fillRect(cx - 1, cy - 3, 6, 2);
    // Cross guard 2
    g.fillStyle(0xcc8833, 1);
    g.fillRect(cx - 5, cy - 1, 6, 2);
    // Centre impact spark
    g.fillStyle(0xffaa44, 1);
    g.fillCircle(cx, cy, 3);
    g.fillStyle(0xffdd88, 1);
    g.fillCircle(cx, cy, 1.5);
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(cx, cy, 0.8);
    g.generateTexture('ucard_stat_damage', s, s);
    g.destroy();
  }

  /** Drift: clockwise spiral arrow with motion blur. */
  private createCardIcon_StatDrift(): void {
    const s = 32, g = this.add.graphics();
    this.cardIconBg(g, s, 0x2a2744);
    const cx = 16, cy = 16;
    // Outer spiral arc
    g.lineStyle(3, 0x7755aa, 1);
    g.beginPath();
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 1.5 - Math.PI / 2;
      const r = 5 + i * 0.4;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.strokePath();
    // Inner spiral — brighter
    g.lineStyle(2, 0xaa88dd, 1);
    g.beginPath();
    for (let i = 0; i < 15; i++) {
      const a = (i / 15) * Math.PI * 1.3 - Math.PI / 2;
      const r = 3 + i * 0.35;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.strokePath();
    // Centre dot
    g.fillStyle(0xc1a4ff, 1);
    g.fillCircle(cx, cy, 2.5);
    g.fillStyle(0xe8d4ff, 1);
    g.fillCircle(cx, cy, 1.2);
    // Arrow head at spiral end
    g.fillStyle(0xc1a4ff, 1);
    const endA = (20 / 20) * Math.PI * 1.5 - Math.PI / 2;
    const endR = 5 + 20 * 0.4;
    const ex = cx + Math.cos(endA) * endR;
    const ey = cy + Math.sin(endA) * endR;
    g.fillTriangle(ex, ey, ex - 3, ey - 3, ex + 2, ey - 2);
    g.generateTexture('ucard_stat_drift', s, s);
    g.destroy();
  }

  /** Defense: plate armor chestpiece (distinct from Highland Shield targe). */
  private createCardIcon_StatDefense(): void {
    const s = 32, g = this.add.graphics();
    this.cardIconBg(g, s, 0x1f2e3a);
    const cx = 16, cy = 16;
    // Breastplate body
    g.fillStyle(0x556677, 1);
    g.fillRoundedRect(cx - 9, cy - 8, 18, 20, 4);
    g.fillStyle(0x778899, 1);
    g.fillRoundedRect(cx - 8, cy - 7, 16, 18, 3);
    // Neck opening
    g.fillStyle(0x1f2e3a, 1);
    g.fillEllipse(cx, cy - 7, 8, 4);
    // Centre ridge
    g.fillStyle(0x99aabb, 1);
    g.fillRect(cx - 1, cy - 5, 2, 14);
    // Metallic highlights (left plate sheen)
    g.fillStyle(0xaabbcc, 0.6);
    g.fillRect(cx - 6, cy - 4, 3, 10);
    g.fillStyle(0xccddee, 0.3);
    g.fillRect(cx - 5, cy - 3, 1, 8);
    // Rivet details
    g.fillStyle(0xbbccdd, 1);
    g.fillCircle(cx - 5, cy - 3, 1);
    g.fillCircle(cx + 5, cy - 3, 1);
    g.fillCircle(cx - 5, cy + 6, 1);
    g.fillCircle(cx + 5, cy + 6, 1);
    // Bottom edge shadow
    g.fillStyle(0x334455, 1);
    g.fillRect(cx - 8, cy + 10, 16, 2);
    g.generateTexture('ucard_stat_defense', s, s);
    g.destroy();
  }

  /** Utility: glowing star with sparkle rays. */
  private createCardIcon_StatUtility(): void {
    const s = 32, g = this.add.graphics();
    this.cardIconBg(g, s, 0x2d2d22);
    const cx = 16, cy = 16;
    // Outer glow
    g.fillStyle(0xd8d86e, 0.15);
    g.fillCircle(cx, cy, 12);
    // Star rays (8 pointed)
    g.fillStyle(0x99993a, 1);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = 10;
      g.fillTriangle(
        cx, cy,
        cx + Math.cos(a - 0.15) * r, cy + Math.sin(a - 0.15) * r,
        cx + Math.cos(a + 0.15) * r, cy + Math.sin(a + 0.15) * r
      );
    }
    // Inner star body
    g.fillStyle(0xcccc55, 1);
    g.fillCircle(cx, cy, 5);
    g.fillStyle(0xdddd77, 1);
    g.fillCircle(cx, cy, 3.5);
    // Bright centre
    g.fillStyle(0xffffaa, 1);
    g.fillCircle(cx, cy, 2);
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(cx - 1, cy - 1, 1);
    // Sparkle dots on ray tips
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(cx, cy - 10, 1);
    g.fillCircle(cx, cy + 10, 1);
    g.fillCircle(cx - 10, cy, 1);
    g.fillCircle(cx + 10, cy, 1);
    g.generateTexture('ucard_stat_utility', s, s);
    g.destroy();
  }

  /** Cooldown: hourglass with sand flowing, wooden frame, brass fittings. */
  private createCardIcon_StatCooldown(): void {
    const s = 32, g = this.add.graphics();
    this.cardIconBg(g, s, 0x2a2238);
    const cx = 16, cy = 16;
    // Brass frame — top bar
    g.fillStyle(0x886622, 1);
    g.fillRect(cx - 8, 5, 16, 3);
    g.fillStyle(0xbb9933, 1);
    g.fillRect(cx - 7, 6, 14, 1);
    // Brass frame — bottom bar
    g.fillStyle(0x886622, 1);
    g.fillRect(cx - 8, 24, 16, 3);
    g.fillStyle(0xbb9933, 1);
    g.fillRect(cx - 7, 25, 14, 1);
    // Glass — upper bulb
    g.fillStyle(0x445566, 0.6);
    g.fillTriangle(cx - 6, 8, cx + 6, 8, cx, cy);
    g.fillStyle(0x5a7a8a, 0.4);
    g.fillTriangle(cx - 5, 9, cx + 5, 9, cx, cy - 1);
    // Glass — lower bulb
    g.fillStyle(0x445566, 0.6);
    g.fillTriangle(cx, cy, cx - 6, 24, cx + 6, 24);
    g.fillStyle(0x5a7a8a, 0.4);
    g.fillTriangle(cx, cy + 1, cx - 5, 23, cx + 5, 23);
    // Sand — pile in lower half
    g.fillStyle(0xddaa44, 1);
    g.fillTriangle(cx - 4, 24, cx + 4, 24, cx, 19);
    g.fillStyle(0xffcc66, 1);
    g.fillTriangle(cx - 3, 23, cx + 3, 23, cx, 20);
    // Sand — remaining in upper half
    g.fillStyle(0xddaa44, 0.7);
    g.fillRect(cx - 3, 9, 6, 3);
    g.fillStyle(0xffcc66, 0.5);
    g.fillRect(cx - 2, 10, 4, 1);
    // Falling sand stream (centre)
    g.fillStyle(0xddaa44, 1);
    g.fillRect(cx - 0.5, cy - 2, 1, 5);
    // Side pillars
    g.fillStyle(0x886622, 1);
    g.fillRect(cx - 7, 8, 2, 16);
    g.fillRect(cx + 5, 8, 2, 16);
    g.generateTexture('ucard_stat_cooldown', s, s);
    g.destroy();
  }

  /** Knockback: impact shockwave with force arrows pushing outward. */
  private createCardIcon_StatKnockback(): void {
    const s = 32, g = this.add.graphics();
    this.cardIconBg(g, s, 0x3a2818);
    const cx = 16, cy = 16;
    // Impact centre — bright flash
    g.fillStyle(0xffcc88, 1);
    g.fillCircle(cx, cy, 4);
    g.fillStyle(0xffeecc, 1);
    g.fillCircle(cx, cy, 2);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(cx, cy, 1);
    // Shockwave rings
    g.lineStyle(2, 0xffaa55, 0.6);
    g.strokeCircle(cx, cy, 7);
    g.lineStyle(1.5, 0xffcc88, 0.3);
    g.strokeCircle(cx, cy, 10);
    // Force arrows (4 cardinal directions)
    const arrows = [
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
    ];
    for (const { dx, dy } of arrows) {
      const ax = cx + dx * 11;
      const ay = cy + dy * 11;
      g.fillStyle(0xffaa55, 0.8);
      // Arrow head
      g.fillTriangle(
        ax + dx * 3, ay + dy * 3,
        ax - dy * 2, ay + dx * 2,
        ax + dy * 2, ay - dx * 2
      );
    }
    // Diagonal force lines
    g.fillStyle(0xffcc88, 0.3);
    g.fillCircle(cx - 8, cy - 8, 1.5);
    g.fillCircle(cx + 8, cy - 8, 1.5);
    g.fillCircle(cx - 8, cy + 8, 1.5);
    g.fillCircle(cx + 8, cy + 8, 1.5);
    g.generateTexture('ucard_stat_knockback', s, s);
    g.destroy();
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
    const s = 32;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;
    // Bag — dark outline
    g.fillStyle(0x1a0d00, 1);
    g.fillEllipse(cx + 1, cy + 6, 22, 17);
    // Bag — dark leather base
    g.fillStyle(0x4a2200, 1);
    g.fillEllipse(cx + 1, cy + 6, 20, 15);
    // Bag — mid-tone leather
    g.fillStyle(0x7a3d10, 1);
    g.fillEllipse(cx + 1, cy + 5, 16, 12);
    // Bag — highlight sheen top-left
    g.fillStyle(0xaa6030, 1);
    g.fillEllipse(cx - 2, cy + 3, 10, 7);
    g.fillStyle(0xcc8855, 0.6);
    g.fillEllipse(cx - 3, cy + 2, 6, 4);
    // Blowpipe going up-left
    g.fillStyle(0x221100, 1);
    g.fillRect(cx - 10, cy - 2, 2, 9);
    g.fillStyle(0x553322, 1);
    g.fillRect(cx - 9, cy - 2, 1, 8);
    // Gold ferrule on blowpipe
    g.fillStyle(0xddaa00, 1);
    g.fillRect(cx - 11, cy - 3, 4, 2);
    g.fillStyle(0xffdd44, 1);
    g.fillRect(cx - 10, cy - 3, 2, 1);
    // Drone pipes — 3 pipes rising from bag
    g.fillStyle(0x221100, 1);
    g.fillRect(cx - 4, cy - 12, 3, 14);
    g.fillRect(cx + 1, cy - 14, 3, 16);
    g.fillRect(cx + 6, cy - 12, 3, 14);
    // Pipe shading
    g.fillStyle(0x553322, 1);
    g.fillRect(cx - 3, cy - 12, 1, 13);
    g.fillRect(cx + 2, cy - 14, 1, 15);
    g.fillRect(cx + 7, cy - 12, 1, 13);
    // Gold ferrule caps on drone pipes
    g.fillStyle(0xddaa00, 1);
    g.fillRect(cx - 5, cy - 13, 5, 2);
    g.fillRect(cx, cy - 15, 5, 2);
    g.fillRect(cx + 5, cy - 13, 5, 2);
    // Gold cap shine
    g.fillStyle(0xffee66, 1);
    g.fillRect(cx - 4, cy - 13, 2, 1);
    g.fillRect(cx + 1, cy - 15, 2, 1);
    g.fillRect(cx + 6, cy - 13, 2, 1);
    // Chanter pipe — extends down-left
    g.fillStyle(0x221100, 1);
    g.fillRect(cx - 14, cy + 4, 14, 3);
    g.fillStyle(0x553322, 1);
    g.fillRect(cx - 14, cy + 4, 14, 1);
    // Chanter bell end
    g.fillStyle(0x221100, 1);
    g.fillRect(cx - 16, cy + 3, 3, 5);
    g.fillStyle(0x553322, 1);
    g.fillRect(cx - 15, cy + 4, 1, 3);
    // Sound wave arcs from chanter
    g.lineStyle(1, 0xffaa33, 0.9);
    g.strokeCircle(cx - 17, cy + 5, 3);
    g.lineStyle(1, 0xffaa33, 0.6);
    g.strokeCircle(cx - 17, cy + 5, 5);
    g.lineStyle(1, 0xffaa33, 0.35);
    g.strokeCircle(cx - 17, cy + 5, 7);
    g.generateTexture('wicon_bagpipe_blast', s, s);
    g.destroy();
  }

  /** Bagpipes utility weapon — distinct from bagpipe_blast (AoE). Shows
   *  the full instrument played horizontally with a musical note accent,
   *  so the player can tell them apart at a glance. */
  private createBagpipesUtilityIcon(): void {
    const s = 32;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;
    // Subtle green/gold aura to distinguish from blast version
    g.fillStyle(0x336622, 0.25);
    g.fillCircle(cx, cy, 14);
    g.fillStyle(0x44aa33, 0.15);
    g.fillCircle(cx, cy, 10);
    // Bag — dark outline, playing position (right-center)
    g.fillStyle(0x1a0d00, 1);
    g.fillEllipse(cx + 5, cy + 2, 18, 15);
    // Bag — dark leather
    g.fillStyle(0x4a2200, 1);
    g.fillEllipse(cx + 5, cy + 2, 16, 13);
    // Bag — mid leather
    g.fillStyle(0x7a3d10, 1);
    g.fillEllipse(cx + 5, cy + 1, 13, 10);
    // Bag — highlight
    g.fillStyle(0xaa6030, 1);
    g.fillEllipse(cx + 3, cy - 1, 8, 6);
    g.fillStyle(0xcc8855, 0.5);
    g.fillEllipse(cx + 2, cy - 2, 5, 3);
    // Chanter — long horizontal pipe going left (playing position)
    g.fillStyle(0x221100, 1);
    g.fillRect(cx - 13, cy + 2, 15, 3);
    g.fillStyle(0x553322, 1);
    g.fillRect(cx - 13, cy + 2, 15, 1);
    // Chanter bell
    g.fillStyle(0x221100, 1);
    g.fillRect(cx - 15, cy + 1, 3, 5);
    // Two drone pipes — sticking up from bag
    g.fillStyle(0x221100, 1);
    g.fillRect(cx + 2, cy - 12, 3, 13);
    g.fillRect(cx + 7, cy - 10, 3, 11);
    // Drone pipe shading
    g.fillStyle(0x553322, 1);
    g.fillRect(cx + 3, cy - 12, 1, 12);
    g.fillRect(cx + 8, cy - 10, 1, 10);
    // Gold ferrule caps
    g.fillStyle(0xddaa00, 1);
    g.fillRect(cx + 1, cy - 13, 5, 2);
    g.fillRect(cx + 6, cy - 11, 5, 2);
    g.fillStyle(0xffee66, 1);
    g.fillRect(cx + 2, cy - 13, 2, 1);
    g.fillRect(cx + 7, cy - 11, 2, 1);
    // Musical note — top-left corner, clearly visible
    g.fillStyle(0xffee44, 1);
    g.fillCircle(cx - 10, cy - 8, 2.5);
    g.fillRect(cx - 8, cy - 14, 2, 7);
    // Note flag
    g.fillRect(cx - 8, cy - 14, 5, 2);
    // Second smaller note
    g.fillStyle(0xffdd22, 0.8);
    g.fillCircle(cx - 4, cy - 12, 1.5);
    g.fillRect(cx - 2, cy - 16, 1.5, 5);
    g.generateTexture('wicon_bagpipes', s, s);
    g.destroy();
  }

  private createScotchMistIcon(): void {
    const s = 32;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;
    // Layer 1 — outermost wisps (very faint)
    g.fillStyle(0x3a4d55, 0.35);
    g.fillCircle(cx - 8, cy + 4, 7);
    g.fillCircle(cx + 8, cy + 4, 7);
    g.fillCircle(cx, cy - 4, 8);
    g.fillCircle(cx - 5, cy + 6, 5);
    g.fillCircle(cx + 5, cy + 6, 5);
    // Layer 2 — mid fog
    g.fillStyle(0x556677, 0.55);
    g.fillCircle(cx - 6, cy + 3, 6);
    g.fillCircle(cx + 6, cy + 3, 6);
    g.fillCircle(cx, cy - 3, 7);
    g.fillCircle(cx - 3, cy + 4, 5);
    g.fillCircle(cx + 3, cy + 4, 5);
    // Layer 3 — main cloud body
    g.fillStyle(0x6a7d8e, 0.75);
    g.fillCircle(cx - 4, cy + 1, 5);
    g.fillCircle(cx + 4, cy + 1, 5);
    g.fillCircle(cx, cy - 2, 6);
    g.fillCircle(cx - 1, cy + 2, 5);
    g.fillCircle(cx + 1, cy + 2, 5);
    // Layer 4 — bright top highlights
    g.fillStyle(0x8899aa, 0.9);
    g.fillCircle(cx - 2, cy, 4);
    g.fillCircle(cx + 2, cy, 4);
    g.fillCircle(cx, cy - 2, 4.5);
    // Swirling wisps at edges
    g.fillStyle(0x99aabb, 0.5);
    g.fillCircle(cx - 12, cy + 2, 2.5);
    g.fillCircle(cx + 12, cy + 2, 2.5);
    g.fillCircle(cx, cy + 10, 2.5);
    g.fillStyle(0xaabbcc, 0.35);
    g.fillCircle(cx - 13, cy, 1.5);
    g.fillCircle(cx + 13, cy, 1.5);
    // Tiny skull hint — barely visible in the fog (danger!)
    g.fillStyle(0x223344, 0.7);
    g.fillCircle(cx, cy + 1, 3);
    g.fillStyle(0x334455, 0.5);
    g.fillRect(cx - 1, cy + 3, 2, 2);
    // Skull eye sockets
    g.fillStyle(0x1a2a33, 0.8);
    g.fillCircle(cx - 1, cy + 1, 0.8);
    g.fillCircle(cx + 1, cy + 1, 0.8);
    // Sparkle/particle dots
    g.fillStyle(0xccddee, 1);
    g.fillCircle(cx - 2, cy - 3, 1);
    g.fillCircle(cx + 4, cy - 1, 0.8);
    g.fillStyle(0xddeeff, 0.8);
    g.fillCircle(cx - 6, cy + 1, 0.8);
    g.fillCircle(cx + 7, cy, 0.7);
    g.fillCircle(cx, cy + 6, 0.7);
    g.generateTexture('wicon_scotch_mist', s, s);
    g.destroy();
  }

  private createNessieTentacleIcon(): void {
    const s = 32;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;
    // S-curve tentacle — 3 segments thick to thin (bottom-left to top-right)
    // Segment 1 — thickest (base), outline
    g.fillStyle(0x0d2e1a, 1);
    g.fillCircle(cx - 7, cy + 8, 6);
    g.fillCircle(cx - 3, cy + 5, 5.5);
    // Segment 1 — body
    g.fillStyle(0x1e5c36, 1);
    g.fillCircle(cx - 7, cy + 8, 5);
    g.fillCircle(cx - 3, cy + 5, 4.5);
    // Segment 1 — highlight
    g.fillStyle(0x3a8c56, 1);
    g.fillCircle(cx - 8, cy + 7, 2.5);
    g.fillCircle(cx - 4, cy + 4, 2.2);
    // Slimy sheen on seg 1
    g.fillStyle(0x55bb77, 0.6);
    g.fillCircle(cx - 8, cy + 6, 1.2);
    // Suckers on inner curve of seg 1
    g.fillStyle(0xbbaa88, 1);
    g.fillCircle(cx - 4, cy + 9, 1.2);
    g.fillCircle(cx - 1, cy + 7, 1.0);
    // Segment 2 — mid, outline
    g.fillStyle(0x0d2e1a, 1);
    g.fillCircle(cx + 1, cy + 1, 4.5);
    g.fillCircle(cx + 4, cy - 2, 4);
    // Segment 2 — body
    g.fillStyle(0x226644, 1);
    g.fillCircle(cx + 1, cy + 1, 3.5);
    g.fillCircle(cx + 4, cy - 2, 3.2);
    // Segment 2 — highlight
    g.fillStyle(0x44996a, 1);
    g.fillCircle(cx, cy, 1.8);
    g.fillCircle(cx + 3, cy - 3, 1.5);
    // Suckers on seg 2 inner curve
    g.fillStyle(0xbbaa88, 1);
    g.fillCircle(cx + 4, cy + 2, 1.0);
    g.fillCircle(cx + 6, cy - 1, 0.9);
    // Segment 3 — thinnest (tip), outline
    g.fillStyle(0x0d2e1a, 1);
    g.fillCircle(cx + 8, cy - 6, 3);
    g.fillCircle(cx + 10, cy - 9, 2.2);
    // Segment 3 — body
    g.fillStyle(0x2a7752, 1);
    g.fillCircle(cx + 8, cy - 6, 2.2);
    g.fillCircle(cx + 10, cy - 9, 1.5);
    // Segment 3 — highlight (bright tip)
    g.fillStyle(0x55cc88, 1);
    g.fillCircle(cx + 7, cy - 7, 1.0);
    // Water droplets splashing off
    g.fillStyle(0x88ccee, 0.9);
    g.fillCircle(cx + 13, cy - 8, 1.2);
    g.fillCircle(cx + 11, cy - 12, 1.0);
    g.fillCircle(cx - 10, cy + 10, 1.0);
    g.fillStyle(0x66bbdd, 0.7);
    g.fillCircle(cx + 14, cy - 5, 0.8);
    g.fillCircle(cx - 12, cy + 7, 0.8);
    g.generateTexture('wicon_nessie_tentacle', s, s);
    g.destroy();
  }

  // === Player ===

  private createHaggisTextures(): void {
    for (const variant of VARIANTS) {
      this.createHaggisVariantTexture(variant);
    }
  }

  private createHaggisVariantTexture(variant: VariantDef): void {
    const s = 56;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 - 2;
    const { palette } = variant.appearance;

    // Dark outline body (draw first, slightly larger)
    g.fillStyle(palette.outline, 1);
    g.fillEllipse(cx, cy + 2, 44, 34);
    // Furry body — layered ellipses for a shaggy look
    g.fillStyle(palette.bodyDark, 1);
    g.fillEllipse(cx, cy + 2, 40, 30);
    g.fillStyle(palette.bodyLight, 1);
    g.fillEllipse(cx, cy, 34, 26);
    // Fur tuft highlights
    g.fillStyle(palette.fur, 1);
    g.fillEllipse(cx - 5, cy - 4, 16, 11);
    g.fillEllipse(cx + 6, cy - 2, 10, 7);

    // Legs — left pair shorter than right (the drift gimmick!)
    g.fillStyle(palette.outline, 1);
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
    g.fillStyle(palette.snout, 1);
    g.fillCircle(cx + 1, cy + 4, 4);
    // Nose
    g.fillStyle(palette.outline, 1);
    g.fillCircle(cx + 2, cy + 3, 1.5);

    this.drawHaggisVariantAccent(g, variant.appearance.accentStyle, cx, cy, palette);

    g.generateTexture(variant.textureKey, s, s);
    g.destroy();
  }

  private drawHaggisVariantAccent(
    g: Phaser.GameObjects.Graphics,
    accentStyle: HaggisAccentStyle,
    cx: number,
    cy: number,
    palette: HaggisPalette
  ): void {
    switch (accentStyle) {
      case 'racing_band':
        g.fillStyle(palette.accent, 1);
        g.fillRect(cx - 17, cy - 9, 34, 3);
        g.fillStyle(0xffffff, 0.5);
        g.fillRect(cx - 14, cy - 8, 9, 1);
        g.fillRect(cx + 3, cy - 8, 9, 1);
        break;
      case 'iron_belly':
        g.fillStyle(0x2e333b, 1);
        g.fillEllipse(cx + 2, cy + 6, 18, 10);
        g.fillStyle(palette.accent, 1);
        g.fillRect(cx - 4, cy + 2, 2, 8);
        g.fillRect(cx + 2, cy + 2, 2, 8);
        break;
      case 'forager':
        g.fillStyle(palette.accent, 1);
        g.fillCircle(cx - 10, cy + 2, 3);
        g.fillCircle(cx + 8, cy + 5, 2.5);
        g.fillStyle(0xb7f08f, 0.8);
        g.fillCircle(cx - 9, cy + 1, 1.2);
        g.fillCircle(cx + 9, cy + 4, 1.2);
        break;
      case 'surefoot':
        g.fillStyle(palette.accent, 1);
        g.fillRect(cx - 6, cy - 12, 12, 3);
        g.fillStyle(0xffffff, 0.8);
        g.fillRect(cx - 1, cy - 13, 2, 5);
        break;
      case 'pipe_breath':
        // Subtle wind swirl lines around the body — musical/wind themed
        g.lineStyle(1.5, palette.accent, 0.6);
        g.beginPath();
        g.arc(cx - 8, cy - 2, 8, -Math.PI * 0.3, Math.PI * 0.5);
        g.strokePath();
        g.beginPath();
        g.arc(cx + 10, cy + 1, 6, Math.PI * 0.2, Math.PI * 0.9);
        g.strokePath();
        // Small music note accent on head
        g.fillStyle(palette.accent, 0.9);
        g.fillCircle(cx + 12, cy - 10, 2);
        g.fillRect(cx + 13, cy - 16, 1.5, 7);
        break;
      default:
        break;
    }
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

    // === Socks-and-sandals legs (the universal tourist crime) ===
    // White socks pulled up high
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(cx - 7, cy + 12, 5, 8);
    g.fillRect(cx + 2, cy + 12, 5, 8);
    // Sock ribbing
    g.fillStyle(0xcccccc, 1);
    g.fillRect(cx - 7, cy + 12, 5, 1);
    g.fillRect(cx + 2, cy + 12, 5, 1);
    // Sandal straps (brown)
    g.fillStyle(0x664422, 1);
    g.fillRect(cx - 8, cy + 18, 7, 2);
    g.fillRect(cx + 1, cy + 18, 7, 2);
    g.fillRect(cx - 6, cy + 17, 2, 4);
    g.fillRect(cx + 4, cy + 17, 2, 4);
    // Sunburned knees poking between shorts and socks
    g.fillStyle(0xee8877, 1);
    g.fillRect(cx - 7, cy + 10, 5, 3);
    g.fillRect(cx + 2, cy + 10, 5, 3);

    // === Cargo shorts (khaki, bulging pockets) ===
    g.fillStyle(0x887755, 1);
    g.fillRect(cx - 9, cy + 4, 18, 8);
    g.fillStyle(0xaa9966, 1);
    g.fillRect(cx - 8, cy + 5, 16, 6);
    // Pocket flaps
    g.fillStyle(0x887755, 1);
    g.fillRect(cx - 8, cy + 6, 6, 3);
    g.fillRect(cx + 3, cy + 6, 6, 3);
    // Greggs bag poking out of pocket (white paper bag, blue oval logo)
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(cx + 4, cy + 5, 4, 3);
    g.fillStyle(0x2244aa, 1);
    g.fillEllipse(cx + 6, cy + 6, 2, 1.5);

    // === Bright blue cagoule (Regatta's finest — tourist armour against Glasgow weather) ===
    g.fillStyle(0x113388, 1);
    g.fillRect(cx - 12, cy - 6, 24, 12);
    g.fillStyle(0x2255cc, 1);
    g.fillRect(cx - 11, cy - 5, 22, 10);
    // Nylon sheen highlight (crinkly cheap material)
    g.fillStyle(0x4477dd, 0.4);
    g.fillRect(cx - 8, cy - 4, 10, 3);
    // Zip line down center
    g.fillStyle(0x1144aa, 1);
    g.fillRect(cx, cy - 5, 1, 10);
    // Rain droplets on jacket (it's always raining)
    g.fillStyle(0xaaddff, 0.6);
    g.fillCircle(cx - 6, cy - 2, 0.7);
    g.fillCircle(cx + 4, cy + 1, 0.7);
    g.fillCircle(cx - 3, cy + 3, 0.7);

    // === Bumbag / fanny pack (the mark of the tourist) ===
    g.fillStyle(0x222222, 1);
    g.fillEllipse(cx, cy + 3, 14, 5);
    g.fillStyle(0x444444, 1);
    g.fillEllipse(cx, cy + 3, 12, 4);
    // Zip
    g.fillStyle(0xddaa00, 1);
    g.fillRect(cx - 1, cy + 2, 2, 1);

    // === Head (SUNBURNED despite clearly overcast sky) ===
    g.fillStyle(0xcc6644, 1);
    g.fillCircle(cx, cy - 12, 9);
    g.fillStyle(0xee8866, 1);
    g.fillCircle(cx, cy - 12, 8);
    // Peeling nose highlight
    g.fillStyle(0xff9977, 1);
    g.fillCircle(cx, cy - 10, 2);
    // Wide bewildered eyes
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 4, cy - 13, 3.5);
    g.fillCircle(cx + 4, cy - 13, 3.5);
    g.fillStyle(0x334455, 1);
    g.fillCircle(cx - 4, cy - 13, 2);
    g.fillCircle(cx + 4, cy - 13, 2);
    // Tiny pupils (shrunken from existential panic)
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 4, cy - 13, 0.8);
    g.fillCircle(cx + 4, cy - 13, 0.8);
    // Worried eyebrows (raised, not angry — pure confusion)
    g.lineStyle(1.5, 0x884422, 1);
    g.lineBetween(cx - 7, cy - 16, cx - 3, cy - 17);
    g.lineBetween(cx + 7, cy - 16, cx + 3, cy - 17);
    // Open mouth
    g.fillStyle(0x993322, 1);
    g.fillEllipse(cx, cy - 8, 3, 2.5);

    // === Tartan bucket hat (the tat-shop special from Buchanan Street) ===
    g.fillStyle(0x886644, 1);
    g.fillEllipse(cx, cy - 19, 22, 5);
    g.fillStyle(0xbb8855, 1);
    g.fillEllipse(cx, cy - 19, 20, 4);
    // Hat crown
    g.fillStyle(0x886644, 1);
    g.fillRect(cx - 8, cy - 24, 16, 6);
    g.fillStyle(0xbb8855, 1);
    g.fillRect(cx - 7, cy - 23, 14, 5);
    // Tartan check pattern on hat (red crossing lines)
    g.fillStyle(0xcc3322, 0.7);
    g.fillRect(cx - 7, cy - 21, 14, 1);
    g.fillRect(cx - 3, cy - 23, 1, 5);
    g.fillRect(cx + 3, cy - 23, 1, 5);
    // Sunburned ear tips poking below hat brim
    g.fillStyle(0xff7755, 1);
    g.fillCircle(cx - 10, cy - 16, 2);
    g.fillCircle(cx + 10, cy - 16, 2);

    // === "I ♥ SCOTLAND" shopping bag (hanging from arm) ===
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(cx + 12, cy - 2, 8, 10);
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx + 13, cy - 1, 6, 8);
    // Heart (tiny red)
    g.fillStyle(0xff2222, 1);
    g.fillCircle(cx + 15, cy + 1, 1);
    g.fillCircle(cx + 17, cy + 1, 1);
    g.fillTriangle(cx + 14, cy + 2, cx + 18, cy + 2, cx + 16, cy + 4);
    // Bag handles
    g.lineStyle(1, 0xcccccc, 1);
    g.lineBetween(cx + 14, cy - 2, cx + 12, cy - 4);
    g.lineBetween(cx + 18, cy - 2, cx + 18, cy - 4);

    // === Selfie stick + phone (held up, blocking the view) ===
    g.fillStyle(0x666666, 1);
    g.fillRect(cx - 14, cy - 6, 2, 18);
    g.fillStyle(0x222222, 1);
    g.fillRect(cx - 16, cy - 10, 5, 5);
    g.fillStyle(0x4488cc, 0.8);
    g.fillRect(cx - 15, cy - 9, 3, 3);

    g.generateTexture('tourist', s, s);
    g.destroy();
  }

  private createChef(): void {
    const s = 48;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // === Legs (black work trousers, scuffed) ===
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(cx - 7, cy + 12, 5, 8);
    g.fillRect(cx + 2, cy + 12, 5, 8);
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 8, cy + 18, 6, 3);
    g.fillRect(cx + 2, cy + 18, 6, 3);

    // === Grease-splattered apron over shirt ===
    g.fillStyle(0x999988, 1);
    g.fillRect(cx - 10, cy - 4, 20, 18);
    g.fillStyle(0xddddcc, 1);
    g.fillRect(cx - 9, cy - 3, 18, 16);
    g.fillStyle(0xaa8833, 0.6);
    g.fillCircle(cx - 4, cy + 2, 2.5);
    g.fillCircle(cx + 5, cy + 6, 2);
    g.fillStyle(0x886622, 0.5);
    g.fillCircle(cx + 2, cy + 1, 1.5);
    g.fillCircle(cx - 6, cy + 8, 1.5);
    g.fillStyle(0xccccbb, 1);
    g.fillRect(cx - 11, cy - 1, 2, 1);
    g.fillRect(cx + 9, cy - 1, 2, 1);

    // === Arms (sleeves rolled up, beefy forearms) ===
    g.fillStyle(0xbb7755, 1);
    g.fillRect(cx - 14, cy - 2, 4, 6);
    g.fillRect(cx + 10, cy - 2, 4, 6);

    // === Head (ruddy, no-nonsense, been working since 6am) ===
    g.fillStyle(0xaa5533, 1);
    g.fillCircle(cx, cy - 10, 8);
    g.fillStyle(0xddaa88, 1);
    g.fillCircle(cx, cy - 10, 7);
    g.fillStyle(0xee8866, 0.6);
    g.fillCircle(cx - 4, cy - 8, 2);
    g.fillCircle(cx + 4, cy - 8, 2);
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 5, cy - 11, 4, 1.5);
    g.fillRect(cx + 1, cy - 11, 4, 1.5);
    g.fillStyle(0x996644, 0.4);
    g.fillEllipse(cx - 3, cy - 9, 4, 1.5);
    g.fillEllipse(cx + 3, cy - 9, 4, 1.5);
    // "Gonnae no dae that" mouth
    g.fillStyle(0x884433, 1);
    g.fillRect(cx - 3, cy - 6, 6, 1);
    g.fillCircle(cx - 3, cy - 5, 0.5);
    g.fillCircle(cx + 3, cy - 5, 0.5);

    // === Paper chip-shop hat (soda-jerk fold) ===
    g.fillStyle(0xccccbb, 1);
    g.fillRect(cx - 8, cy - 20, 16, 4);
    g.fillStyle(0xeeeedd, 1);
    g.fillRect(cx - 7, cy - 19, 14, 3);
    g.fillStyle(0xddddcc, 1);
    g.fillRect(cx - 9, cy - 16, 18, 3);
    g.fillStyle(0xeeeedd, 1);
    g.fillRect(cx - 8, cy - 16, 16, 2);
    g.fillStyle(0xbbbbaa, 0.8);
    g.fillRect(cx - 8, cy - 17, 16, 1);
    g.fillStyle(0xccbb99, 0.6);
    g.fillCircle(cx + 3, cy - 18, 1.5);

    // === Chip fork (pale cream wood, two flat broad tines) ===
    g.fillStyle(0xddccaa, 1);
    g.fillRect(cx + 12, cy + 2, 2, 10);
    g.fillStyle(0xeeddbb, 1);
    g.fillRect(cx + 12, cy + 3, 2, 8);
    g.fillStyle(0xddccaa, 1);
    g.fillRect(cx + 11, cy - 3, 2, 6);
    g.fillRect(cx + 14, cy - 3, 2, 6);
    g.fillStyle(0xeeddbb, 1);
    g.fillRect(cx + 11, cy - 2, 2, 4);
    g.fillRect(cx + 14, cy - 2, 2, 4);
    g.fillStyle(0xddaa33, 1);
    g.fillRect(cx + 10, cy - 5, 7, 3);
    g.fillStyle(0xeebb44, 1);
    g.fillRect(cx + 11, cy - 4, 5, 1);

    // === Steam wisps ===
    g.fillStyle(0xdddddd, 0.5);
    g.fillCircle(cx - 6, cy - 20, 2);
    g.fillCircle(cx + 2, cy - 22, 2.5);
    g.fillCircle(cx + 7, cy - 19, 2);

    g.generateTexture('chef', s, s);
    g.destroy();
  }

  /** Highland Midge — swarm enemy replacing the terrier.
   *  Scottish midges are iconic: tiny, fast, travel in packs, bite on
   *  contact. Perfect match for the swarm behavior (packSize 5, low HP,
   *  high speed). Much more recognizable at small size than a dog sprite. */
  private createTerrier(): void {
    const s = 32;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 1;

    // Fuzzy aura — slight motion blur halo around the midge
    g.fillStyle(0x333344, 0.3);
    g.fillCircle(cx, cy, 10);

    // Wing blur — translucent ovals behind the body, angled outward.
    // Drawn first so the body sits on top.
    g.fillStyle(0xccddee, 0.35);
    g.fillEllipse(cx - 6, cy - 4, 9, 5);
    g.fillEllipse(cx + 6, cy - 4, 9, 5);
    g.fillStyle(0xeeffff, 0.5);
    g.fillEllipse(cx - 5, cy - 4, 6, 3);
    g.fillEllipse(cx + 5, cy - 4, 6, 3);

    // Body — chunky little oval, dark outline first
    g.fillStyle(0x1a1a22, 1);
    g.fillEllipse(cx, cy + 1, 12, 9);
    g.fillStyle(0x332a1a, 1);
    g.fillEllipse(cx, cy, 10, 7);
    // Abdomen segments (horizontal stripes)
    g.fillStyle(0x1a1a22, 0.7);
    g.fillRect(cx - 4, cy, 8, 1);
    g.fillRect(cx - 4, cy + 2, 8, 1);
    // Abdomen highlight (tiny warm tone to read as insect)
    g.fillStyle(0x5a4428, 1);
    g.fillCircle(cx - 1, cy - 1, 2);

    // Head — small dark bulb at the front
    g.fillStyle(0x0a0a11, 1);
    g.fillCircle(cx, cy - 4, 3);
    // Giant buggy eyes (red, compound) — the iconic midge tell
    g.fillStyle(0xcc2244, 1);
    g.fillCircle(cx - 2, cy - 5, 1.5);
    g.fillCircle(cx + 2, cy - 5, 1.5);
    g.fillStyle(0xff6688, 1);
    g.fillCircle(cx - 2, cy - 5, 0.7);
    g.fillCircle(cx + 2, cy - 5, 0.7);

    // Tiny proboscis poking forward
    g.fillStyle(0x0a0a11, 1);
    g.fillRect(cx, cy - 7, 1, 2);

    // Six spindly legs dangling below
    g.lineStyle(1, 0x0a0a11, 1);
    g.lineBetween(cx - 4, cy + 4, cx - 6, cy + 8);
    g.lineBetween(cx - 1, cy + 4, cx - 2, cy + 9);
    g.lineBetween(cx - 3, cy + 4, cx - 4, cy + 9);
    g.lineBetween(cx + 4, cy + 4, cx + 6, cy + 8);
    g.lineBetween(cx + 1, cy + 4, cx + 2, cy + 9);
    g.lineBetween(cx + 3, cy + 4, cx + 4, cy + 9);

    // Thorax highlight
    g.fillStyle(0x5a4428, 0.9);
    g.fillCircle(cx, cy - 2, 1);

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

    // Nostril steam (it's cauld out)
    g.fillStyle(0xcccccc, 0.4);
    g.fillCircle(cx - 2, cy - 1, 1.5);
    g.fillCircle(cx + 3, cy - 1, 1.5);
    g.fillStyle(0xeeeeee, 0.25);
    g.fillCircle(cx - 3, cy - 2, 1);
    g.fillCircle(cx + 4, cy - 2, 1);

    // Mud on hooves (been in the field)
    g.fillStyle(0x3a2a0a, 0.7);
    g.fillCircle(cx - 11, cy + 23, 2);
    g.fillCircle(cx + 4, cy + 23, 2);

    // Extra shaggy fringe strands (individual hairs)
    g.fillStyle(0xbb9955, 0.7);
    for (let i = 0; i < 8; i++) {
      const fx = cx - 13 + i * 3.5;
      const len = 3 + (i % 3);
      g.fillRect(fx, cy - 9, 1, len);
    }

    g.generateTexture('highland_cow', s, s);
    g.destroy();
  }

  /** Highland Crow — oriented with the head pointing RIGHT (Phaser
   *  sprites default-face +X at rotation 0), so the crow is flying
   *  forward into whatever direction it's moving rather than moonwalking
   *  sideways. Body is horizontal, wings sweep up and down, tail trails
   *  behind on the left, beak points out the right.
   */
  /** Golden eagle — broad wingspan, hooked beak, fierce eye, talons.
   *  Faces RIGHT (Phaser +X at rotation 0) so it flies forward. */
  private createEagle(): void {
    const s = 48;
    const g = this.add.graphics();
    const cx = s / 2 - 2, cy = s / 2;

    // Wings — broad sweep, layered feathers for depth
    // Outer wing (darkest)
    g.fillStyle(0x1a1208, 1);
    g.fillTriangle(cx - 2, cy, cx - 8, cy - 20, cx + 6, cy - 14);
    g.fillTriangle(cx - 2, cy, cx - 8, cy + 20, cx + 6, cy + 14);
    // Mid wing (warm brown)
    g.fillStyle(0x3a2a14, 1);
    g.fillTriangle(cx, cy, cx - 5, cy - 15, cx + 4, cy - 11);
    g.fillTriangle(cx, cy, cx - 5, cy + 15, cx + 4, cy + 11);
    // Inner wing highlight (golden brown)
    g.fillStyle(0x5a4020, 1);
    g.fillTriangle(cx + 1, cy, cx - 3, cy - 10, cx + 3, cy - 8);
    g.fillTriangle(cx + 1, cy, cx - 3, cy + 10, cx + 3, cy + 8);
    // Feather tips — jagged edge on outer wings
    g.fillStyle(0x1a1208, 1);
    g.fillTriangle(cx - 8, cy - 20, cx - 4, cy - 16, cx - 10, cy - 16);
    g.fillTriangle(cx - 8, cy + 20, cx - 4, cy + 16, cx - 10, cy + 16);

    // Body — barrel shape
    g.fillStyle(0x1a1208, 1);
    g.fillEllipse(cx, cy, 16, 11);
    g.fillStyle(0x3a2a14, 1);
    g.fillEllipse(cx, cy, 14, 9);
    // Breast — lighter underbelly
    g.fillStyle(0x5a4828, 0.7);
    g.fillEllipse(cx - 1, cy + 1, 10, 6);

    // Tail — forked, trailing left
    g.fillStyle(0x1a1208, 1);
    g.fillTriangle(cx - 6, cy - 3, cx - 6, cy + 3, cx - 13, cy - 1);
    g.fillTriangle(cx - 6, cy - 1, cx - 6, cy + 4, cx - 12, cy + 2);

    // Head — golden-brown, distinct from dark body
    g.fillStyle(0x1a1208, 1);
    g.fillCircle(cx + 9, cy, 6);
    g.fillStyle(0x6a5030, 1);
    g.fillCircle(cx + 9, cy, 5);
    // Crown feathers (lighter patch on top of head)
    g.fillStyle(0x8a7040, 0.8);
    g.fillCircle(cx + 8, cy - 2, 3);

    // Beak — strong hooked beak, yellow-black
    g.fillStyle(0x222200, 1);
    g.fillTriangle(cx + 13, cy - 2, cx + 13, cy + 2, cx + 18, cy + 1);
    g.fillStyle(0xddaa22, 1);
    g.fillTriangle(cx + 13, cy - 1, cx + 13, cy + 1, cx + 17, cy + 1);
    // Hook at tip
    g.fillStyle(0x111100, 1);
    g.fillCircle(cx + 17, cy + 1, 0.8);

    // Eye — fierce, bright
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx + 10, cy - 1, 2);
    g.fillStyle(0xffcc00, 1);
    g.fillCircle(cx + 10, cy - 1, 1.2);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx + 10, cy - 2, 0.5);

    // Talons — visible below body (hanging in flight)
    g.fillStyle(0x333322, 1);
    g.fillRect(cx - 2, cy + 4, 2, 4);
    g.fillRect(cx + 2, cy + 4, 2, 4);
    g.fillStyle(0x111100, 1);
    g.fillRect(cx - 3, cy + 7, 4, 1);
    g.fillRect(cx + 1, cy + 7, 4, 1);

    g.generateTexture('eagle', s, s);
    g.destroy();
  }

  private createHaggisHunter(): void {
    const s = 48;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // === Green wellies (proper mucky ones) ===
    g.fillStyle(0x1a3a1a, 1);
    g.fillRect(cx - 8, cy + 10, 6, 10);
    g.fillRect(cx + 2, cy + 10, 6, 10);
    g.fillStyle(0x2a5522, 1);
    g.fillRect(cx - 7, cy + 11, 4, 8);
    g.fillRect(cx + 3, cy + 11, 4, 8);
    g.fillStyle(0x554422, 0.7);
    g.fillCircle(cx - 6, cy + 18, 1.5);
    g.fillCircle(cx + 5, cy + 17, 1);
    g.fillCircle(cx - 4, cy + 16, 0.8);

    // === Wax Barbour jacket ===
    g.fillStyle(0x1a2a11, 1);
    g.fillRect(cx - 12, cy - 6, 24, 18);
    g.fillStyle(0x2d4a22, 1);
    g.fillRect(cx - 11, cy - 5, 22, 16);
    g.fillStyle(0x3a5a2a, 0.6);
    g.fillRect(cx - 10, cy - 4, 20, 3);
    g.fillStyle(0x1a3311, 1);
    g.fillRect(cx - 10, cy + 2, 8, 4);
    g.fillRect(cx + 2, cy + 2, 8, 4);
    g.fillStyle(0x886633, 1);
    g.fillCircle(cx - 6, cy + 3, 0.8);
    g.fillCircle(cx + 6, cy + 3, 0.8);
    g.fillStyle(0x664422, 1);
    g.fillRect(cx - 8, cy - 6, 16, 2);

    // === Binoculars around neck ===
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 3, cy - 1, 2.5);
    g.fillCircle(cx + 3, cy - 1, 2.5);
    g.fillStyle(0x333333, 1);
    g.fillCircle(cx - 3, cy - 1, 1.8);
    g.fillCircle(cx + 3, cy - 1, 1.8);
    g.fillStyle(0x88ccff, 0.7);
    g.fillCircle(cx - 3, cy - 2, 0.6);
    g.fillCircle(cx + 3, cy - 2, 0.6);
    g.lineStyle(1, 0x333333, 0.8);
    g.lineBetween(cx - 3, cy - 3, cx - 4, cy - 6);
    g.lineBetween(cx + 3, cy - 3, cx + 4, cy - 6);

    // === Head (weather-beaten, determined) ===
    g.fillStyle(0x885533, 1);
    g.fillCircle(cx, cy - 12, 8);
    g.fillStyle(0xddaa77, 1);
    g.fillCircle(cx, cy - 12, 7);
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 5, cy - 13, 3, 1.5);
    g.fillRect(cx + 2, cy - 13, 3, 1.5);
    g.lineStyle(0.8, 0xaa7744, 0.6);
    g.lineBetween(cx - 6, cy - 14, cx - 8, cy - 15);
    g.lineBetween(cx + 6, cy - 14, cx + 8, cy - 15);
    g.fillStyle(0xcc7755, 0.5);
    g.fillCircle(cx - 4, cy - 10, 2);
    g.fillCircle(cx + 4, cy - 10, 2);
    g.fillStyle(0x554433, 0.7);
    g.fillRect(cx - 5, cy - 9, 10, 3);

    // === Flat cap (proper tweed) ===
    g.fillStyle(0x3a3322, 1);
    g.fillRect(cx - 10, cy - 20, 20, 6);
    g.fillStyle(0x5a5533, 1);
    g.fillRect(cx - 9, cy - 19, 18, 4);
    g.fillStyle(0x4a4422, 0.7);
    g.fillCircle(cx - 5, cy - 18, 0.5);
    g.fillCircle(cx + 2, cy - 17, 0.5);
    g.fillCircle(cx + 6, cy - 18, 0.5);
    g.fillStyle(0x3a3322, 1);
    g.fillRect(cx - 12, cy - 15, 14, 2);

    // === Big haggis net on a pole ===
    g.fillStyle(0x664411, 1);
    g.fillRect(cx + 13, cy - 14, 2, 22);
    g.lineStyle(2, 0x333322, 1);
    g.strokeCircle(cx + 19, cy - 16, 7);
    g.lineStyle(1, 0x998866, 0.8);
    g.strokeCircle(cx + 19, cy - 16, 6);
    g.lineStyle(0.8, 0x998866, 0.5);
    g.lineBetween(cx + 13, cy - 16, cx + 25, cy - 16);
    g.lineBetween(cx + 19, cy - 22, cx + 19, cy - 10);
    g.lineBetween(cx + 14, cy - 20, cx + 24, cy - 12);
    g.lineBetween(cx + 14, cy - 12, cx + 24, cy - 20);

    g.generateTexture('haggis_hunter', s, s);
    g.destroy();
  }

  private createAngryScotsman(): void {
    const s = 52;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // === Legs (bare, muscular, one sock fallen) ===
    g.fillStyle(0xcc7755, 1);
    g.fillRect(cx - 8, cy + 13, 6, 9);
    g.fillRect(cx + 2, cy + 13, 6, 9);
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(cx + 2, cy + 19, 6, 4);
    g.fillStyle(0xdddddd, 0.8);
    g.fillRect(cx - 8, cy + 20, 6, 3);
    g.fillStyle(0xcccccc, 1);
    g.fillEllipse(cx - 5, cy + 21, 7, 3);

    // === Royal Stewart tartan kilt ===
    g.fillStyle(0x881111, 1);
    g.fillRect(cx - 13, cy + 1, 26, 14);
    g.fillStyle(0xcc2222, 1);
    g.fillRect(cx - 12, cy + 2, 24, 12);
    g.fillStyle(0x114411, 0.8);
    g.fillRect(cx - 12, cy + 4, 24, 2);
    g.fillRect(cx - 12, cy + 10, 24, 2);
    g.fillRect(cx - 8, cy + 2, 2, 12);
    g.fillRect(cx + 2, cy + 2, 2, 12);
    g.fillStyle(0x2244aa, 0.7);
    g.fillRect(cx - 12, cy + 7, 24, 1);
    g.fillRect(cx - 3, cy + 2, 1, 12);
    g.fillRect(cx + 7, cy + 2, 1, 12);
    g.fillStyle(0xffffff, 0.4);
    g.fillRect(cx - 12, cy + 3, 24, 1);
    g.fillRect(cx - 12, cy + 12, 24, 1);
    g.fillStyle(0xcccccc, 1);
    g.fillCircle(cx + 8, cy + 8, 1);

    // === Bare barrel chest (Groundskeeper Willie physique) ===
    g.fillStyle(0xaa5533, 1);
    g.fillRect(cx - 14, cy - 9, 28, 12);
    g.fillStyle(0xddbb99, 1);
    g.fillRect(cx - 13, cy - 8, 26, 10);
    g.fillStyle(0xccaa88, 0.4);
    g.fillEllipse(cx - 5, cy - 4, 8, 6);
    g.fillEllipse(cx + 5, cy - 4, 8, 6);
    g.fillStyle(0xee6644, 0.6);
    g.fillTriangle(cx - 8, cy - 8, cx + 8, cy - 8, cx, cy - 3);
    g.fillStyle(0x883311, 0.5);
    g.fillCircle(cx - 3, cy - 4, 2);
    g.fillCircle(cx + 3, cy - 3, 2);
    g.fillCircle(cx, cy - 5, 1.5);
    g.fillCircle(cx - 1, cy - 2, 1);

    // === Head (thick neck, pure fury) ===
    g.fillStyle(0xcc6644, 1);
    g.fillRect(cx - 5, cy - 10, 10, 4);
    g.fillStyle(0xdd8866, 1);
    g.fillRect(cx - 4, cy - 9, 8, 3);
    g.fillStyle(0xaa5533, 1);
    g.fillCircle(cx, cy - 15, 10);
    g.fillStyle(0xdd8866, 1);
    g.fillCircle(cx, cy - 15, 9);
    g.lineStyle(0.8, 0xcc5533, 0.7);
    g.lineBetween(cx - 4, cy - 22, cx - 6, cy - 19);
    g.lineBetween(cx + 3, cy - 23, cx + 5, cy - 20);
    g.fillStyle(0xee7755, 0.4);
    g.fillCircle(cx, cy - 14, 7);

    // === MASSIVE red beard ===
    g.fillStyle(0x771100, 1);
    g.fillEllipse(cx, cy - 8, 20, 12);
    g.fillStyle(0xbb3311, 1);
    g.fillEllipse(cx, cy - 8, 18, 10);
    g.fillStyle(0xdd5522, 1);
    g.fillEllipse(cx, cy - 9, 16, 8);
    g.fillStyle(0x881100, 1);
    g.fillRect(cx - 7, cy - 3, 2, 4);
    g.fillRect(cx - 3, cy - 2, 2, 5);
    g.fillRect(cx + 1, cy - 3, 2, 4);
    g.fillRect(cx + 5, cy - 2, 2, 5);
    g.fillStyle(0x992211, 1);
    g.fillRect(cx, cy - 1, 2, 3);
    g.fillStyle(0xddaa00, 1);
    g.fillCircle(cx + 1, cy + 2, 0.8);

    // === Furious eyebrows ===
    g.fillStyle(0x661100, 1);
    g.fillTriangle(cx - 9, cy - 19, cx - 2, cy - 17, cx - 2, cy - 19);
    g.fillTriangle(cx + 9, cy - 19, cx + 2, cy - 17, cx + 2, cy - 19);

    // === Eyes (tiny, narrowed, RAGING) ===
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 4, cy - 16, 2);
    g.fillCircle(cx + 4, cy - 16, 2);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 4, cy - 16, 1);
    g.fillCircle(cx + 4, cy - 16, 1);

    // === Buckfast bottle (dark green glass, cream label, gold foil neck) ===
    g.fillStyle(0x0a2a0a, 1);
    g.fillRect(cx + 13, cy - 4, 5, 12);
    g.fillStyle(0x1a4418, 1);
    g.fillRect(cx + 14, cy - 3, 3, 10);
    g.fillStyle(0xddaa44, 1);
    g.fillRect(cx + 13, cy - 1, 5, 5);
    g.fillStyle(0xeeddbb, 1);
    g.fillRect(cx + 14, cy, 3, 3);
    g.fillStyle(0x0a2a0a, 1);
    g.fillRect(cx + 15, cy - 7, 2, 4);
    g.fillStyle(0xccaa22, 1);
    g.fillRect(cx + 14, cy - 8, 4, 2);
    g.fillStyle(0xddbb33, 1);
    g.fillRect(cx + 15, cy - 9, 2, 1);

    // === Sgian-dubh handle in right sock ===
    g.fillStyle(0x111111, 1);
    g.fillRect(cx + 4, cy + 19, 2, 3);
    g.fillStyle(0xcc8833, 1);
    g.fillCircle(cx + 5, cy + 19, 1);

    // === Kilt pin ===
    g.fillStyle(0xcccccc, 1);
    g.fillCircle(cx + 9, cy + 9, 1);
    g.fillStyle(0xeeeeee, 1);
    g.fillCircle(cx + 9, cy + 9, 0.5);

    g.generateTexture('angry_scotsman', s, s);
    g.destroy();
  }

  /** Kelpie — Scottish water horse. Bold silhouette, glowing green eye. */
  private createKelpie(): void {
    const s = 48;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Legs — thick, visible at small scale
    g.fillStyle(0x0c2030, 1);
    g.fillRect(cx - 10, cy + 6, 5, 10);
    g.fillRect(cx - 2, cy + 7, 5, 9);
    g.fillRect(cx + 6, cy + 6, 5, 10);
    // Hooves
    g.fillStyle(0x060d14, 1);
    g.fillRect(cx - 10, cy + 15, 5, 2);
    g.fillRect(cx - 2, cy + 15, 5, 2);
    g.fillRect(cx + 6, cy + 15, 5, 2);

    // Body — chunky dark barrel
    g.fillStyle(0x0c2030, 1);
    g.fillEllipse(cx, cy + 4, 34, 18);
    g.fillStyle(0x194050, 1);
    g.fillEllipse(cx, cy + 3, 30, 14);

    // Neck — wide triangle rising left
    g.fillStyle(0x0c2030, 1);
    g.fillTriangle(cx - 8, cy + 4, cx - 10, cy - 10, cx - 2, cy + 2);
    g.fillStyle(0x194050, 1);
    g.fillTriangle(cx - 7, cy + 2, cx - 9, cy - 8, cx - 3, cy + 1);

    // Head — blocky horse head
    g.fillStyle(0x0c2030, 1);
    g.fillEllipse(cx - 14, cy - 8, 12, 10);
    g.fillStyle(0x194050, 1);
    g.fillEllipse(cx - 14, cy - 8, 10, 8);
    // Muzzle
    g.fillStyle(0x0c2030, 1);
    g.fillRect(cx - 21, cy - 8, 6, 5);
    g.fillStyle(0x163848, 1);
    g.fillRect(cx - 20, cy - 7, 5, 3);

    // Ear — single pointed ear (reads better than two at this scale)
    g.fillStyle(0x0c2030, 1);
    g.fillTriangle(cx - 16, cy - 12, cx - 12, cy - 12, cx - 14, cy - 18);

    // Eye — BIG glowing green, the kelpie's signature tell
    g.fillStyle(0x111818, 1);
    g.fillCircle(cx - 12, cy - 10, 3);
    g.fillStyle(0x33dd99, 1);
    g.fillCircle(cx - 12, cy - 10, 2);
    g.fillStyle(0xbbffdd, 1);
    g.fillCircle(cx - 13, cy - 11, 0.8);

    // Mane — 3 bold strands, not fiddly detail
    g.fillStyle(0x0a4858, 0.9);
    g.fillRect(cx - 9, cy - 11, 3, 8);
    g.fillRect(cx - 6, cy - 9, 3, 7);
    g.fillStyle(0x226878, 0.6);
    g.fillRect(cx - 8, cy - 8, 2, 6);

    // Tail — single bold sweep
    g.fillStyle(0x0a4858, 0.8);
    g.fillTriangle(cx + 15, cy + 2, cx + 20, cy - 4, cx + 22, cy + 6);

    g.generateTexture('kelpie', s, s);
    g.destroy();
  }

  /** Midgie swarm — a roiling cloud of tiny biting midges. The individual
   *  bugs are too small to draw, so the sprite is a dark buzzing cloud
   *  with glowing red eyes scattered through it and tiny wing-flicker dots. */
  private createMidgieSwarm(): void {
    const s = 26;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Haze cloud — layered for depth
    g.fillStyle(0x1a0a1a, 0.3);
    g.fillCircle(cx, cy, 11);
    g.fillStyle(0x2a1228, 0.5);
    g.fillEllipse(cx - 1, cy + 1, 18, 12);
    g.fillStyle(0x3a1a30, 0.6);
    g.fillEllipse(cx, cy, 14, 10);

    // Individual midges — tiny dots scattered through the cloud
    // Dark bodies
    g.fillStyle(0x441133, 1);
    g.fillCircle(cx - 4, cy - 2, 1.5);
    g.fillCircle(cx + 3, cy - 1, 1.5);
    g.fillCircle(cx - 1, cy + 3, 1.5);
    g.fillCircle(cx + 5, cy + 2, 1.2);
    g.fillCircle(cx - 5, cy + 3, 1.2);
    g.fillCircle(cx + 1, cy - 4, 1.2);

    // Red eyes — angry little pinpricks scattered through
    g.fillStyle(0xff3344, 1);
    g.fillCircle(cx - 4, cy - 3, 0.7);
    g.fillCircle(cx + 3, cy - 2, 0.7);
    g.fillCircle(cx - 1, cy + 2, 0.7);
    g.fillCircle(cx + 5, cy + 1, 0.7);
    g.fillCircle(cx - 5, cy + 2, 0.7);
    g.fillCircle(cx + 1, cy - 5, 0.7);

    // Wing flicker — tiny bright dots (translucent)
    g.fillStyle(0xccaacc, 0.5);
    g.fillCircle(cx - 3, cy - 4, 0.5);
    g.fillCircle(cx + 4, cy - 3, 0.5);
    g.fillCircle(cx, cy + 1, 0.5);
    g.fillCircle(cx + 6, cy, 0.5);

    // Dangling legs — two pairs visible at bottom
    g.lineStyle(1, 0x220a18, 0.8);
    g.lineBetween(cx - 3, cy + 4, cx - 4, cy + 7);
    g.lineBetween(cx + 2, cy + 4, cx + 3, cy + 7);
    g.lineBetween(cx - 1, cy + 5, cx - 2, cy + 8);
    g.lineBetween(cx + 4, cy + 3, cx + 5, cy + 6);

    g.generateTexture('midgie_swarm', s, s);
    g.destroy();
  }

  private createBoss(): void {
    // Kept for backwards compat — bosses now use dedicated per-boss textures,
    // but 'boss' is still referenced as a generic fallback.
    const s = 72;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Menacing dark body (deeper gradient)
    g.fillStyle(0x330808, 1);
    g.fillCircle(cx, cy, 32);
    g.fillStyle(0x661111, 1);
    g.fillCircle(cx, cy, 28);
    g.fillStyle(0x992222, 1);
    g.fillCircle(cx, cy, 22);
    g.fillStyle(0xaa2a2a, 0.6);
    g.fillCircle(cx - 3, cy - 3, 16);
    // Crown horns (sharper, more menacing)
    g.fillStyle(0x664400, 1);
    g.fillTriangle(cx - 14, cy - 24, cx - 10, cy - 10, cx - 19, cy - 10);
    g.fillTriangle(cx, cy - 28, cx - 5, cy - 10, cx + 5, cy - 10);
    g.fillTriangle(cx + 14, cy - 24, cx + 10, cy - 10, cx + 19, cy - 10);
    g.fillStyle(0xddaa00, 1);
    g.fillTriangle(cx - 13, cy - 22, cx - 11, cy - 11, cx - 17, cy - 11);
    g.fillTriangle(cx, cy - 26, cx - 4, cy - 11, cx + 4, cy - 11);
    g.fillTriangle(cx + 13, cy - 22, cx + 11, cy - 11, cx + 17, cy - 11);
    // Horn tips (bright gold)
    g.fillStyle(0xffcc33, 1);
    g.fillCircle(cx - 14, cy - 23, 1.5);
    g.fillCircle(cx, cy - 27, 1.5);
    g.fillCircle(cx + 14, cy - 23, 1.5);
    // Evil eyes (narrowed slits, not circles)
    g.fillStyle(0xffff00, 1);
    g.fillEllipse(cx - 9, cy - 4, 12, 6);
    g.fillEllipse(cx + 9, cy - 4, 12, 6);
    g.fillStyle(0xff0000, 1);
    g.fillEllipse(cx - 9, cy - 4, 6, 4);
    g.fillEllipse(cx + 9, cy - 4, 6, 4);
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - 9, cy - 4, 1.5);
    g.fillCircle(cx + 9, cy - 4, 1.5);

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

    // Green stem stub (it's a flower head, not just a purple blob)
    g.fillStyle(0x336622, 1);
    g.fillRect(cx - 1, cy + 5, 2, 3);
    g.fillStyle(0x448833, 1);
    g.fillRect(cx - 1, cy + 5, 1, 2);

    g.generateTexture('thistle', s, s);
    g.destroy();
  }

  private createCaber(): void {
    const s = 24;
    const g = this.add.graphics();
    g.fillStyle(0x2a1a04, 1);
    g.fillRect(2, 5, 20, 12);
    g.fillStyle(0x7a5510, 1);
    g.fillRect(3, 6, 18, 10);
    g.fillStyle(0x5a3e08, 0.8);
    g.fillRect(3, 8, 18, 1);
    g.fillRect(3, 12, 18, 1);
    g.fillStyle(0x9a7522, 0.5);
    g.fillRect(3, 7, 18, 1);
    g.fillRect(3, 10, 18, 1);
    g.fillStyle(0x4a3008, 1);
    g.fillCircle(8, 10, 1.5);
    g.fillCircle(16, 9, 1);
    g.fillStyle(0x3a2206, 1);
    g.fillCircle(8, 10, 0.8);
    g.fillStyle(0x5a3e08, 1);
    g.fillCircle(20, 11, 3);
    g.fillStyle(0x7a5510, 1);
    g.fillCircle(20, 11, 2);
    g.fillStyle(0x5a3e08, 1);
    g.fillCircle(20, 11, 1);
    g.fillStyle(0x4a3008, 0.6);
    g.fillRect(3, 6, 18, 1);
    g.fillRect(3, 15, 18, 1);
    g.generateTexture('caber', s, s);
    g.destroy();
  }

  /** Haggis ball — the bouncing projectile for Jobby Hurler/Cannon.
   *  Lumpy, organic, with a wet sheen and visible oat-fleck texture. */
  private createHaggisBall(): void {
    const s = 18;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;
    g.fillStyle(0x2a1a06, 1);
    g.fillCircle(cx, cy, 7);
    g.fillCircle(cx + 1, cy - 1, 6);
    g.fillStyle(0x5a3e0a, 1);
    g.fillCircle(cx, cy, 6);
    g.fillCircle(cx + 1, cy - 1, 5);
    g.fillStyle(0x7a5a12, 1);
    g.fillCircle(cx - 1, cy - 1, 5);
    g.fillStyle(0x9a7822, 0.8);
    g.fillCircle(cx - 2, cy - 2, 1.2);
    g.fillCircle(cx + 2, cy + 1, 1);
    g.fillCircle(cx - 1, cy + 2, 0.8);
    g.fillCircle(cx + 3, cy - 1, 0.8);
    g.fillCircle(cx - 3, cy + 1, 0.6);
    g.fillStyle(0xbb9933, 0.7);
    g.fillCircle(cx - 2, cy - 2, 1.5);
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(cx - 3, cy - 3, 0.7);
    g.fillStyle(0xcccccc, 0.35);
    g.fillCircle(cx - 1, cy - 6, 1.2);
    g.fillCircle(cx + 2, cy - 7, 1);
    g.generateTexture('haggis_ball', s, s);
    g.destroy();
  }

  /** XP gem — golden diamond with faceted light and a bright sparkle.
   *  The player's eye is trained to chase these, so they need to pop. */
  private createXPGem(): void {
    const s = 16;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Dark outline — gives the gem a solid border
    g.fillStyle(0x6a4a00, 1);
    g.fillTriangle(cx, cy - 7, cx - 6, cy, cx + 6, cy);
    g.fillTriangle(cx, cy + 7, cx - 6, cy, cx + 6, cy);
    // Main gem body — warm gold
    g.fillStyle(0xd4a017, 1);
    g.fillTriangle(cx, cy - 6, cx - 5, cy, cx + 5, cy);
    g.fillTriangle(cx, cy + 6, cx - 5, cy, cx + 5, cy);
    // Left facet — slightly darker for depth
    g.fillStyle(0xb08818, 1);
    g.fillTriangle(cx, cy - 6, cx - 5, cy, cx, cy);
    // Right facet — slightly lighter
    g.fillStyle(0xe8b820, 1);
    g.fillTriangle(cx, cy - 6, cx + 5, cy, cx, cy);
    // Bottom facet — warm shadow
    g.fillStyle(0xa07010, 1);
    g.fillTriangle(cx, cy + 6, cx - 4, cy + 1, cx + 4, cy + 1);
    // Bright center band — the "fire" in the gem
    g.fillStyle(0xffdd66, 1);
    g.fillRect(cx - 3, cy - 1, 6, 2);
    // Hot sparkle — upper left
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 1, cy - 3, 1.2);
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(cx + 2, cy - 1, 0.6);

    g.generateTexture('xp_gem', s, s);
    g.destroy();
  }

  // === Unique Boss Textures ===

  private createBossGordon(): void {
    const s = 80;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 4;

    // === Body (chef whites, splattered, IMPOSING) ===
    g.fillStyle(0x777777, 1);
    g.fillCircle(cx, cy, 32);
    g.fillStyle(0xddddcc, 1);
    g.fillCircle(cx, cy, 30);
    g.fillStyle(0xeeeedd, 1);
    g.fillCircle(cx - 3, cy - 3, 24);
    // Grease stains on whites
    g.fillStyle(0xccbb88, 0.4);
    g.fillCircle(cx - 10, cy + 8, 3);
    g.fillCircle(cx + 8, cy + 12, 2.5);
    g.fillCircle(cx - 4, cy + 14, 2);
    // Double-breasted buttons
    g.fillStyle(0x222222, 1);
    g.fillCircle(cx - 5, cy + 4, 1.8);
    g.fillCircle(cx - 5, cy + 10, 1.8);
    g.fillCircle(cx + 5, cy + 4, 1.8);
    g.fillCircle(cx + 5, cy + 10, 1.8);

    // === Face (PURPLE with rage — this man has ascended beyond anger) ===
    g.fillStyle(0x883355, 1);
    g.fillCircle(cx, cy - 6, 14);
    g.fillStyle(0xcc6688, 1); // purple-red rage face
    g.fillCircle(cx, cy - 6, 13);
    // Flushed to absolute beetroot
    g.fillStyle(0xdd5566, 0.4);
    g.fillCircle(cx, cy - 5, 10);
    // FOREHEAD FURROWS — THE Ramsay signature (3-4 deep horizontal lines)
    g.lineStyle(1.2, 0x994466, 0.8);
    g.lineBetween(cx - 8, cy - 18, cx + 8, cy - 18);
    g.lineBetween(cx - 9, cy - 16, cx + 9, cy - 16);
    g.lineBetween(cx - 8, cy - 14, cx + 8, cy - 14);
    g.lineStyle(0.8, 0x884455, 0.5);
    g.lineBetween(cx - 7, cy - 17, cx + 7, cy - 17);
    // Forehead veins too (visible through the furrows)
    g.lineStyle(0.8, 0xaa3344, 0.5);
    g.lineBetween(cx - 5, cy - 19, cx - 7, cy - 16);
    g.lineBetween(cx + 4, cy - 19, cx + 6, cy - 16);

    // Furious eyebrows (THICKER, MORE ANGRY)
    g.fillStyle(0x331100, 1);
    g.fillTriangle(cx - 12, cy - 14, cx - 2, cy - 11, cx - 2, cy - 15);
    g.fillTriangle(cx + 12, cy - 14, cx + 2, cy - 11, cx + 2, cy - 15);
    // Bloodshot eyes
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 6, cy - 9, 3.5);
    g.fillCircle(cx + 6, cy - 9, 3.5);
    // Bloodshot veins in eyes
    g.lineStyle(0.5, 0xff4444, 0.6);
    g.lineBetween(cx - 8, cy - 10, cx - 6, cy - 9);
    g.lineBetween(cx + 8, cy - 10, cx + 6, cy - 9);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 6, cy - 9, 2);
    g.fillCircle(cx + 6, cy - 9, 2);
    // Rage-dilated pupils
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - 6, cy - 9, 1);
    g.fillCircle(cx + 6, cy - 9, 1);

    // MASSIVE open yelling mouth (IT'S RAAAAW)
    g.fillStyle(0x111111, 1);
    g.fillEllipse(cx, cy - 1, 12, 8);
    g.fillStyle(0xcc1111, 1);
    g.fillEllipse(cx, cy, 10, 6);
    // Teeth (top and bottom)
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx - 4, cy - 3, 2, 2);
    g.fillRect(cx, cy - 3, 2, 2);
    g.fillRect(cx - 3, cy + 2, 2, 2);
    g.fillRect(cx + 1, cy + 2, 2, 2);
    // Uvula
    g.fillStyle(0xff6666, 1);
    g.fillCircle(cx, cy + 1, 1);

    // === GIANT chef hat (askew from screaming) ===
    g.fillStyle(0xbbbbbb, 1);
    g.fillRect(cx - 13, cy - 28, 28, 6);
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(cx - 12, cy - 27, 26, 5);
    // Puffy top (tilted slightly — he's been screaming so hard his hat shifted)
    g.fillStyle(0xbbbbbb, 1);
    g.fillCircle(cx - 9, cy - 33, 8);
    g.fillCircle(cx + 1, cy - 36, 9);
    g.fillCircle(cx + 11, cy - 34, 8);
    g.fillStyle(0xeeeeee, 1);
    g.fillCircle(cx - 9, cy - 33, 7);
    g.fillCircle(cx + 1, cy - 36, 8);
    g.fillCircle(cx + 11, cy - 34, 7);

    // === Cleaver in right hand ===
    g.fillStyle(0x221100, 1);
    g.fillRect(cx + 24, cy + 6, 4, 10);
    g.fillStyle(0x888888, 1);
    g.fillRect(cx + 21, cy - 6, 10, 14);
    g.fillStyle(0xdddddd, 1);
    g.fillRect(cx + 22, cy - 5, 8, 12);
    g.fillStyle(0xffffff, 0.8);
    g.fillRect(cx + 23, cy - 4, 2, 10);

    // === Battered fish in left hand (chippy meets fine dining) ===
    g.fillStyle(0xaa7711, 1);
    g.fillEllipse(cx - 26, cy + 4, 10, 16);
    g.fillStyle(0xcc9922, 1);
    g.fillEllipse(cx - 26, cy + 4, 8, 14);
    // Batter texture
    g.fillStyle(0xddaa33, 0.6);
    g.fillCircle(cx - 27, cy + 1, 1);
    g.fillCircle(cx - 25, cy + 6, 1);

    g.generateTexture('boss_gordon', s, s);
    g.destroy();
  }

  private createBossTourBus(): void {
    const s = 80;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // === Bus body (MAGENTA/HOT PINK — the unmistakable First Glasgow livery) ===
    g.fillStyle(0x551133, 1); // dark outline
    g.fillRect(cx - 34, cy - 16, 68, 32);
    g.fillStyle(0xaa2266, 1); // First Glasgow magenta-pink
    g.fillRect(cx - 33, cy - 15, 66, 30);
    // Yellow swoosh stripe (the First Bus signature accent)
    g.fillStyle(0xddcc22, 1);
    g.fillRect(cx - 33, cy - 8, 66, 2);
    g.fillStyle(0xbbaa11, 1);
    g.fillRect(cx - 33, cy - 6, 66, 1);

    // === Open top deck rail (it's an open-top! in GLASGOW! in the RAIN!) ===
    g.fillStyle(0x333333, 1);
    g.fillRect(cx - 30, cy - 18, 60, 2);
    // Rail posts
    g.fillRect(cx - 28, cy - 20, 1, 4);
    g.fillRect(cx - 18, cy - 20, 1, 4);
    g.fillRect(cx - 8, cy - 20, 1, 4);
    g.fillRect(cx + 2, cy - 20, 1, 4);
    g.fillRect(cx + 12, cy - 20, 1, 4);
    g.fillRect(cx + 22, cy - 20, 1, 4);

    // === HORIZONTAL rain hitting the open top (Glasgow rain goes SIDEWAYS) ===
    g.lineStyle(0.8, 0xaaddff, 0.4);
    g.lineBetween(cx - 25, cy - 22, cx - 20, cy - 21);
    g.lineBetween(cx - 10, cy - 23, cx - 5, cy - 22);
    g.lineBetween(cx + 5, cy - 21, cx + 10, cy - 20);
    g.lineBetween(cx + 18, cy - 22, cx + 23, cy - 21);
    g.lineBetween(cx - 15, cy - 20, cx - 10, cy - 19);
    g.lineBetween(cx + 12, cy - 23, cx + 17, cy - 22);

    // === Tourist faces in windows (wee pink dots with bewildered expressions) ===
    g.fillStyle(0x222244, 1);
    g.fillRect(cx - 30, cy - 13, 60, 6);
    // Window panes
    g.fillStyle(0x88ccff, 0.7);
    for (let i = 0; i < 6; i++) {
      g.fillRect(cx - 29 + i * 10, cy - 12, 8, 5);
    }
    // Tourist faces (sunburned pink, in each window)
    g.fillStyle(0xee8877, 1);
    g.fillCircle(cx - 25, cy - 10, 1.5);
    g.fillCircle(cx - 15, cy - 10, 1.5);
    g.fillCircle(cx - 5, cy - 10, 1.5);
    g.fillCircle(cx + 5, cy - 10, 1.5);
    g.fillCircle(cx + 15, cy - 10, 1.5);
    g.fillCircle(cx + 25, cy - 10, 1.5);

    // === Destination sign — "YOKER" (Limmy deep cut: the mystical far-away realm) ===
    // Anyone from Glasgow will clock this immediately. "I've no business in Yoker..."
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 12, cy - 15, 24, 4);
    g.fillStyle(0xff8800, 1); // amber LED dot-matrix
    g.fillRect(cx - 10, cy - 14, 20, 2);
    // Dot-matrix pixel letters suggesting "YOKER" (Y-O-K-E-R pattern)
    // Y
    g.fillStyle(0xffaa00, 1);
    g.fillRect(cx - 9, cy - 14, 1, 1);
    g.fillRect(cx - 7, cy - 14, 1, 1);
    g.fillRect(cx - 8, cy - 13, 1, 1);
    // O
    g.fillRect(cx - 5, cy - 14, 2, 1);
    g.fillRect(cx - 5, cy - 13, 2, 1);
    // K
    g.fillRect(cx - 2, cy - 14, 1, 2);
    g.fillRect(cx - 1, cy - 14, 1, 1);
    // E
    g.fillRect(cx + 1, cy - 14, 2, 1);
    g.fillRect(cx + 1, cy - 13, 1, 1);
    // R
    g.fillRect(cx + 4, cy - 14, 2, 1);
    g.fillRect(cx + 4, cy - 13, 1, 1);
    g.fillRect(cx + 5, cy - 13, 1, 1);

    // === Headlights (angry, bearing down on you) ===
    g.fillStyle(0xffff66, 1);
    g.fillCircle(cx + 33, cy - 4, 4);
    g.fillCircle(cx + 33, cy + 4, 4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx + 33, cy - 4, 2);
    g.fillCircle(cx + 33, cy + 4, 2);
    // Light beam glow
    g.fillStyle(0xffff88, 0.15);
    g.fillTriangle(cx + 36, cy - 6, cx + 36, cy + 6, cx + 46, cy);

    // === Traffic cone on bumper (Duke of Wellington nod!) ===
    g.fillStyle(0xff6600, 1);
    g.fillTriangle(cx + 34, cy + 9, cx + 38, cy + 14, cx + 30, cy + 14);
    g.fillStyle(0xff8833, 1);
    g.fillTriangle(cx + 34, cy + 10, cx + 37, cy + 14, cx + 31, cy + 14);
    // White stripe on cone
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(cx + 31, cy + 12, 6, 1);

    // === Bumper (heavy, industrial) ===
    g.fillStyle(0x333333, 1);
    g.fillRect(cx - 33, cy + 14, 66, 4);
    g.fillStyle(0x555555, 1);
    g.fillRect(cx - 33, cy + 14, 66, 1);

    // === Wheels (big, chunky) ===
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 20, cy + 20, 7);
    g.fillCircle(cx + 20, cy + 20, 7);
    g.fillStyle(0x333333, 1);
    g.fillCircle(cx - 20, cy + 20, 5);
    g.fillCircle(cx + 20, cy + 20, 5);
    g.fillStyle(0x888888, 1);
    g.fillCircle(cx - 20, cy + 20, 2);
    g.fillCircle(cx + 20, cy + 20, 2);

    // === Exhaust fumes belching from rear ===
    g.fillStyle(0x444444, 0.4);
    g.fillCircle(cx - 36, cy + 8, 4);
    g.fillCircle(cx - 40, cy + 5, 5);
    g.fillCircle(cx - 44, cy + 2, 4);
    g.fillStyle(0x555555, 0.25);
    g.fillCircle(cx - 38, cy + 4, 3);
    g.fillCircle(cx - 42, cy + 1, 3.5);

    g.generateTexture('boss_tour_bus', s, s);
    g.destroy();
  }

  private createBossLaird(): void {
    const s = 80;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 4;

    // === Royal cloak (deep purple, regal, EXPENSIVE) ===
    g.fillStyle(0x0a0022, 1);
    g.fillCircle(cx, cy + 2, 30);
    g.fillStyle(0x1a0044, 1);
    g.fillCircle(cx, cy + 2, 28);
    g.fillStyle(0x2a0066, 1);
    g.fillCircle(cx, cy, 24);
    // Velvet sheen
    g.fillStyle(0x3a0088, 0.4);
    g.fillEllipse(cx - 4, cy - 4, 30, 20);
    // Gold braid trim on cloak
    g.lineStyle(1.5, 0xddaa00, 0.8);
    g.strokeCircle(cx, cy + 1, 25);

    // === Ermine fur trim (white with black spots — proper royal) ===
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx - 28, cy + 14, 56, 5);
    g.fillStyle(0xeeeedd, 1);
    g.fillRect(cx - 27, cy + 15, 54, 3);
    // Black ermine tail spots (more of them, evenly spaced)
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 22, cy + 16, 1.5);
    g.fillCircle(cx - 14, cy + 16, 1.5);
    g.fillCircle(cx - 6, cy + 16, 1.5);
    g.fillCircle(cx + 2, cy + 16, 1.5);
    g.fillCircle(cx + 10, cy + 16, 1.5);
    g.fillCircle(cx + 18, cy + 16, 1.5);
    // Tail dangles
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 22, cy + 17, 1, 2);
    g.fillRect(cx - 6, cy + 17, 1, 2);
    g.fillRect(cx + 10, cy + 17, 1, 2);

    // === Face (sneering, chin UP, looking down at you) ===
    g.fillStyle(0xaa6644, 1);
    g.fillCircle(cx, cy - 6, 12);
    g.fillStyle(0xffccaa, 1);
    g.fillCircle(cx, cy - 6, 11);
    // Powdered complexion (slightly paler than normal)
    g.fillStyle(0xffddc8, 0.5);
    g.fillCircle(cx, cy - 7, 9);

    // Prominent chin (jutting forward, looking down at the peasants)
    g.fillStyle(0xffccaa, 1);
    g.fillEllipse(cx, cy + 1, 6, 4);

    // Monocle on right eye
    g.lineStyle(1.5, 0xddaa00, 1);
    g.strokeCircle(cx + 5, cy - 8, 4);
    g.fillStyle(0xaaddff, 0.2);
    g.fillCircle(cx + 5, cy - 8, 3);
    // Monocle chain
    g.lineStyle(0.8, 0xbb8800, 0.7);
    g.lineBetween(cx + 9, cy - 6, cx + 12, cy);

    // Sneering eyes (half-lidded, contemptuous)
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 5, cy - 8, 3);
    g.fillCircle(cx + 5, cy - 8, 3);
    g.fillStyle(0x224488, 1);
    g.fillCircle(cx - 5, cy - 8, 1.5);
    g.fillCircle(cx + 5, cy - 8, 1.5);
    // Heavy, contemptuous eyelids
    g.fillStyle(0xddbb99, 1);
    g.fillRect(cx - 8, cy - 10, 6, 2);
    g.fillRect(cx + 2, cy - 10, 6, 2);

    // Walrus mustache (thick, drooping over the lip — stuffy old aristocrat)
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(cx - 8, cy - 3, 16, 3);
    g.fillStyle(0xcccccc, 1);
    g.fillRect(cx - 7, cy - 3, 14, 2);
    // Drooping ends (hangs past the mouth — walrus style)
    g.fillStyle(0xbbbbbb, 1);
    g.fillRect(cx - 8, cy - 1, 3, 3);
    g.fillRect(cx + 6, cy - 1, 3, 3);
    // Mustache highlight
    g.fillStyle(0xdddddd, 0.6);
    g.fillRect(cx - 5, cy - 3, 10, 1);

    // Thin sneer (curled lip — pure contempt for the working class)
    g.fillStyle(0xcc8877, 1);
    g.fillRect(cx - 3, cy, 6, 1);
    // One corner turned up (the sneer)
    g.fillStyle(0xcc8877, 1);
    g.fillCircle(cx + 3, cy - 1, 0.8);

    // === Signet ring (golden dot on right side — old money) ===
    g.fillStyle(0xddaa00, 1);
    g.fillCircle(cx + 20, cy + 6, 2);
    g.fillStyle(0xffcc44, 1);
    g.fillCircle(cx + 20, cy + 6, 1.2);

    // === BIG golden crown (more ornate, more jewels) ===
    g.fillStyle(0x553300, 1);
    g.fillRect(cx - 16, cy - 22, 32, 8);
    g.fillStyle(0xddaa00, 1);
    g.fillRect(cx - 15, cy - 21, 30, 6);
    // Gold highlight band
    g.fillStyle(0xffcc33, 0.6);
    g.fillRect(cx - 15, cy - 20, 30, 2);
    // Crown points (taller, more ornate)
    g.fillStyle(0x553300, 1);
    g.fillTriangle(cx - 16, cy - 22, cx - 11, cy - 34, cx - 6, cy - 22);
    g.fillTriangle(cx - 4, cy - 22, cx, cy - 36, cx + 4, cy - 22);
    g.fillTriangle(cx + 6, cy - 22, cx + 11, cy - 34, cx + 16, cy - 22);
    g.fillStyle(0xddaa00, 1);
    g.fillTriangle(cx - 15, cy - 22, cx - 11, cy - 32, cx - 7, cy - 22);
    g.fillTriangle(cx - 3, cy - 22, cx, cy - 34, cx + 3, cy - 22);
    g.fillTriangle(cx + 7, cy - 22, cx + 11, cy - 32, cx + 14, cy - 22);
    // Jewels (rubies AND sapphires)
    g.fillStyle(0xff1133, 1);
    g.fillCircle(cx - 11, cy - 30, 2.2);
    g.fillCircle(cx + 11, cy - 30, 2.2);
    g.fillStyle(0x2244ff, 1);
    g.fillCircle(cx, cy - 33, 2.5);
    // Jewel highlights
    g.fillStyle(0xff6677, 1);
    g.fillCircle(cx - 11, cy - 31, 0.8);
    g.fillCircle(cx + 11, cy - 31, 0.8);
    g.fillStyle(0x6688ff, 1);
    g.fillCircle(cx, cy - 34, 1);
    // Tiny gold fleur-de-lis on crown band
    g.fillStyle(0xffcc33, 1);
    g.fillCircle(cx - 8, cy - 19, 1);
    g.fillCircle(cx + 8, cy - 19, 1);

    g.generateTexture('boss_laird', s, s);
    g.destroy();
  }

  private createBossHunterGeneral(): void {
    const s = 80;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 4;

    // === Military body (safari khaki-green, not camo) ===
    g.fillStyle(0x1a2a11, 1);
    g.fillCircle(cx, cy + 2, 30);
    g.fillStyle(0x3a5a28, 1);
    g.fillCircle(cx, cy + 2, 28);
    g.fillStyle(0x4a6a38, 1);
    g.fillCircle(cx, cy, 24);

    // === Jodhpurs visible below (buff/khaki riding pants) ===
    g.fillStyle(0x887755, 1);
    g.fillRect(cx - 12, cy + 18, 10, 6);
    g.fillRect(cx + 2, cy + 18, 10, 6);
    // Riding boots (tall, polished brown)
    g.fillStyle(0x442211, 1);
    g.fillRect(cx - 12, cy + 22, 10, 4);
    g.fillRect(cx + 2, cy + 22, 10, 4);
    g.fillStyle(0x553322, 1);
    g.fillRect(cx - 11, cy + 22, 8, 3);
    g.fillRect(cx + 3, cy + 22, 8, 3);

    // === Gold shoulder epaulettes (MASSIVE, ostentatious) ===
    g.fillStyle(0x886600, 1);
    g.fillRect(cx - 24, cy - 8, 8, 5);
    g.fillRect(cx + 16, cy - 8, 8, 5);
    g.fillStyle(0xddaa00, 1);
    g.fillRect(cx - 23, cy - 7, 6, 3);
    g.fillRect(cx + 17, cy - 7, 6, 3);
    // Fringe tassels
    g.fillStyle(0xccaa00, 1);
    g.fillRect(cx - 24, cy - 4, 1, 3);
    g.fillRect(cx - 22, cy - 4, 1, 3);
    g.fillRect(cx - 20, cy - 4, 1, 3);
    g.fillRect(cx + 20, cy - 4, 1, 3);
    g.fillRect(cx + 22, cy - 4, 1, 3);

    // === Medals row (5 medals — he awards himself new ones weekly) ===
    g.fillStyle(0xcc2222, 1);
    g.fillCircle(cx - 10, cy + 2, 2.5);
    g.fillStyle(0xddaa00, 1);
    g.fillCircle(cx - 5, cy + 2, 2.5);
    g.fillStyle(0x2244aa, 1);
    g.fillCircle(cx, cy + 2, 2.5);
    g.fillStyle(0x22aa44, 1);
    g.fillCircle(cx + 5, cy + 2, 2.5);
    g.fillStyle(0xdddddd, 1);
    g.fillCircle(cx + 10, cy + 2, 2.5);
    // Medal ribbons
    g.fillStyle(0xcc2222, 0.7);
    g.fillRect(cx - 11, cy - 1, 3, 2);
    g.fillStyle(0xddaa00, 0.7);
    g.fillRect(cx - 6, cy - 1, 3, 2);
    g.fillStyle(0x2244aa, 0.7);
    g.fillRect(cx - 1, cy - 1, 3, 2);

    // === Face (ruddy, supremely confident, colonial pomposity) ===
    g.fillStyle(0xaa6644, 1);
    g.fillCircle(cx, cy - 6, 12);
    g.fillStyle(0xffccaa, 1);
    g.fillCircle(cx, cy - 6, 11);

    // Handlebar mustache (MASSIVE, waxed, curled at ends)
    g.fillStyle(0x3a2a11, 1);
    g.fillRect(cx - 10, cy - 3, 20, 3);
    // Curled ends (pointing upward — proper handlebar)
    g.fillCircle(cx - 11, cy - 4, 2);
    g.fillCircle(cx + 11, cy - 4, 2);
    g.fillStyle(0x4a3a22, 1);
    g.fillCircle(cx - 11, cy - 5, 1);
    g.fillCircle(cx + 11, cy - 5, 1);

    // Monocle (iconic)
    g.lineStyle(2, 0xddaa00, 1);
    g.strokeCircle(cx + 5, cy - 8, 4.5);
    g.fillStyle(0xaaddff, 0.15);
    g.fillCircle(cx + 5, cy - 8, 3.5);
    // Monocle chain
    g.lineStyle(0.8, 0x886600, 0.8);
    g.lineBetween(cx + 9, cy - 5, cx + 12, cy);

    // Confident eyes (stern, looking down the gun)
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 5, cy - 8, 3);
    g.fillCircle(cx + 5, cy - 8, 3);
    g.fillStyle(0x336644, 1);
    g.fillCircle(cx - 5, cy - 8, 1.5);
    g.fillCircle(cx + 5, cy - 8, 1.5);

    // One eyebrow cocked (the confident hunter)
    g.fillStyle(0x3a2a11, 1);
    g.fillRect(cx - 8, cy - 12, 6, 1.5);
    g.fillTriangle(cx + 2, cy - 13, cx + 8, cy - 12, cx + 2, cy - 11);

    // === Pith helmet (HIGH DOME — classic safari, the colonial big-game look) ===
    // Wide brim (flat, wider at rear)
    g.fillStyle(0x776644, 1);
    g.fillEllipse(cx, cy - 18, 30, 8);
    g.fillStyle(0xbbaa77, 1);
    g.fillEllipse(cx, cy - 18, 28, 7);
    // HIGH dome (taller than you'd think — rigid, not floppy)
    g.fillStyle(0x776644, 1);
    g.fillEllipse(cx, cy - 24, 18, 12);
    g.fillStyle(0xaa9966, 1);
    g.fillEllipse(cx, cy - 24, 16, 11);
    // Dome highlight (catches the light at the peak)
    g.fillStyle(0xccbb88, 0.6);
    g.fillEllipse(cx - 2, cy - 28, 10, 5);
    // Ventilation knob on top (the little finial — real pith helmet detail)
    g.fillStyle(0x887755, 1);
    g.fillCircle(cx, cy - 30, 2);
    g.fillStyle(0xaa9966, 1);
    g.fillCircle(cx, cy - 30, 1.2);
    // Puggaree band (cloth wrap — the distinctive belt of fabric around the base)
    g.fillStyle(0x554422, 1);
    g.fillRect(cx - 13, cy - 19, 26, 3);
    g.fillStyle(0x665533, 1);
    g.fillRect(cx - 12, cy - 19, 24, 2);
    // Puggaree fold lines
    g.fillStyle(0x443311, 0.5);
    g.fillRect(cx - 8, cy - 19, 1, 2);
    g.fillRect(cx - 2, cy - 19, 1, 2);
    g.fillRect(cx + 4, cy - 19, 1, 2);

    // === Comically oversized blunderbuss ===
    // Stock (ornate wood)
    g.fillStyle(0x331100, 1);
    g.fillRect(cx + 22, cy + 4, 6, 18);
    g.fillStyle(0x553322, 1);
    g.fillRect(cx + 23, cy + 5, 4, 16);
    // Barrel (flared at the end — that's what makes it a blunderbuss)
    g.fillStyle(0x333333, 1);
    g.fillRect(cx + 24, cy - 20, 4, 26);
    g.fillStyle(0x555555, 1);
    g.fillRect(cx + 25, cy - 19, 2, 24);
    // Flared muzzle (the iconic blunderbuss bell)
    g.fillStyle(0x333333, 1);
    g.fillTriangle(cx + 22, cy - 24, cx + 30, cy - 24, cx + 26, cy - 20);
    g.fillStyle(0x555555, 1);
    g.fillTriangle(cx + 23, cy - 23, cx + 29, cy - 23, cx + 26, cy - 20);
    // Gold trigger guard
    g.fillStyle(0xddaa00, 1);
    g.fillCircle(cx + 24, cy + 4, 1.5);

    g.generateTexture('boss_hunter_general', s, s);
    g.destroy();
  }

  private createBossTaxman(): void {
    const s = 80;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 4;

    // === Pinstripe cloak (death meets the civil service) ===
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx, cy + 2, 32);
    g.fillStyle(0x0a0a0a, 1);
    g.fillCircle(cx, cy + 2, 30);
    g.fillStyle(0x141414, 1);
    g.fillCircle(cx, cy, 26);
    // Pinstripes (subtle gray on black — bespoke reaper)
    g.fillStyle(0x222222, 0.6);
    g.fillRect(cx - 18, cy - 6, 1, 36);
    g.fillRect(cx - 12, cy - 6, 1, 36);
    g.fillRect(cx - 6, cy - 6, 1, 36);
    g.fillRect(cx, cy - 6, 1, 36);
    g.fillRect(cx + 6, cy - 6, 1, 36);
    g.fillRect(cx + 12, cy - 6, 1, 36);
    g.fillRect(cx + 18, cy - 6, 1, 36);
    // Cloak folds (deeper black)
    g.fillStyle(0x000000, 1);
    g.fillRect(cx - 14, cy + 2, 2, 28);
    g.fillRect(cx - 4, cy + 2, 2, 28);
    g.fillRect(cx + 8, cy + 2, 2, 28);
    g.fillRect(cx + 18, cy + 2, 2, 28);

    // === Necktie (visible at collar — death is DRESSED for work) ===
    g.fillStyle(0x881111, 1);
    g.fillTriangle(cx - 2, cy - 6, cx + 2, cy - 6, cx, cy + 4);
    g.fillStyle(0xaa2222, 1);
    g.fillTriangle(cx - 1, cy - 5, cx + 1, cy - 5, cx, cy + 2);

    // === Hood (iconic — deep, dark) ===
    g.fillStyle(0x000000, 1);
    g.fillTriangle(cx - 18, cy - 6, cx, cy - 34, cx + 18, cy - 6);
    g.fillStyle(0x080808, 1);
    g.fillTriangle(cx - 16, cy - 6, cx, cy - 30, cx + 16, cy - 6);
    g.fillStyle(0x000000, 1);
    g.fillEllipse(cx, cy - 10, 20, 16);

    // === Skull face ===
    g.fillStyle(0x777766, 1);
    g.fillCircle(cx, cy - 6, 13);
    g.fillStyle(0xddddcc, 1);
    g.fillCircle(cx, cy - 6, 12);
    // Cheekbone definition
    g.fillStyle(0xccccbb, 1);
    g.fillCircle(cx - 6, cy - 4, 3);
    g.fillCircle(cx + 6, cy - 4, 3);

    // === Thin wire-rimmed spectacles (the civil servant look — perched on bone) ===
    g.lineStyle(0.8, 0x888888, 1); // thin wire — not thick frames
    g.strokeCircle(cx - 5, cy - 8, 3.5);
    g.strokeCircle(cx + 5, cy - 8, 3.5);
    // Bridge (thin wire connecting the lenses)
    g.lineStyle(0.6, 0x888888, 1);
    g.lineBetween(cx - 2, cy - 8, cx + 2, cy - 8);
    // Temple arms (thin, going behind where ears would be)
    g.lineBetween(cx - 8, cy - 8, cx - 12, cy - 6);
    g.lineBetween(cx + 8, cy - 8, cx + 12, cy - 6);
    // Wire glint (catches the light — sinister)
    g.fillStyle(0xcccccc, 0.4);
    g.fillCircle(cx - 7, cy - 9, 0.5);
    g.fillCircle(cx + 7, cy - 9, 0.5);

    // Glowing red eyes behind the spectacles (HMRC sees ALL)
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - 5, cy - 8, 3);
    g.fillCircle(cx + 5, cy - 8, 3);
    g.fillStyle(0xff0000, 1);
    g.fillCircle(cx - 5, cy - 8, 2);
    g.fillCircle(cx + 5, cy - 8, 2);
    g.fillStyle(0xff6644, 1);
    g.fillCircle(cx - 5, cy - 8, 1);
    g.fillCircle(cx + 5, cy - 8, 1);
    // Red glow leaking through lenses
    g.fillStyle(0xff2200, 0.3);
    g.fillCircle(cx - 5, cy - 8, 4);
    g.fillCircle(cx + 5, cy - 8, 4);

    // Nose cavity
    g.fillStyle(0x000000, 1);
    g.fillTriangle(cx - 1, cy - 3, cx + 1, cy - 3, cx, cy + 1);
    // Jagged skull teeth (grinning — they've found a discrepancy)
    g.fillStyle(0x000000, 1);
    g.fillRect(cx - 6, cy + 2, 12, 4);
    g.fillStyle(0xddddcc, 1);
    g.fillRect(cx - 5, cy + 2, 1, 3);
    g.fillRect(cx - 3, cy + 2, 1, 4);
    g.fillRect(cx - 1, cy + 2, 1, 3);
    g.fillRect(cx + 1, cy + 2, 1, 4);
    g.fillRect(cx + 3, cy + 2, 1, 3);

    // === SCYTHE (the weapon that signs your P45) ===
    // Handle
    g.fillStyle(0x1a0a00, 1);
    g.fillRect(cx + 24, cy - 28, 3, 56);
    g.fillStyle(0x331a00, 1);
    g.fillRect(cx + 25, cy - 27, 1, 54);
    // Scythe blade
    g.fillStyle(0x444444, 1);
    g.fillTriangle(cx + 10, cy - 32, cx + 26, cy - 28, cx + 26, cy - 18);
    g.fillStyle(0xbbbbbb, 1);
    g.fillTriangle(cx + 12, cy - 30, cx + 25, cy - 27, cx + 25, cy - 20);
    g.fillStyle(0xeeeeee, 0.7);
    g.fillTriangle(cx + 12, cy - 30, cx + 23, cy - 28, cx + 13, cy - 28);

    // === Calculator hanging from scythe handle (the real weapon) ===
    g.fillStyle(0x222222, 1);
    g.fillRect(cx + 20, cy + 10, 6, 8);
    g.fillStyle(0x333333, 1);
    g.fillRect(cx + 21, cy + 11, 4, 6);
    // Screen (showing a big number — your tax bill)
    g.fillStyle(0x88ff88, 0.8);
    g.fillRect(cx + 21, cy + 11, 4, 2);
    // Buttons
    g.fillStyle(0x888888, 0.8);
    g.fillRect(cx + 21, cy + 14, 1, 1);
    g.fillRect(cx + 23, cy + 14, 1, 1);
    g.fillRect(cx + 21, cy + 16, 1, 1);
    g.fillRect(cx + 23, cy + 16, 1, 1);
    // String attaching to handle
    g.lineStyle(0.8, 0x444444, 0.7);
    g.lineBetween(cx + 23, cy + 10, cx + 25, cy + 8);

    g.generateTexture('boss_taxman', s, s);
    g.destroy();
  }

  private createPiper(): void {
    const s = 48;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 7, cy + 12, 5, 8);
    g.fillRect(cx + 2, cy + 12, 5, 8);
    g.fillStyle(0xeeeeee, 0.5);
    g.fillTriangle(cx - 5, cy + 14, cx - 4, cy + 16, cx - 6, cy + 16);
    g.fillTriangle(cx + 4, cy + 14, cx + 5, cy + 16, cx + 3, cy + 16);
    g.fillStyle(0xcc0000, 1);
    g.fillRect(cx - 7, cy + 12, 5, 1);
    g.fillRect(cx + 2, cy + 12, 5, 1);

    g.fillStyle(0x001a44, 1);
    g.fillRect(cx - 10, cy + 2, 20, 12);
    g.fillStyle(0x003366, 1);
    g.fillRect(cx - 9, cy + 3, 18, 10);
    g.fillStyle(0x004488, 0.8);
    g.fillRect(cx - 9, cy + 6, 18, 1);
    g.fillRect(cx - 9, cy + 10, 18, 1);
    g.fillRect(cx - 4, cy + 3, 1, 10);
    g.fillRect(cx + 4, cy + 3, 1, 10);
    g.fillStyle(0x2266aa, 0.5);
    g.fillRect(cx - 9, cy + 8, 18, 1);

    // Full dress sporran (white horsehair, silver cantle)
    g.lineStyle(1, 0xcccccc, 0.9);
    g.lineBetween(cx - 7, cy + 3, cx + 7, cy + 3);
    g.fillStyle(0xdddddd, 1);
    g.fillEllipse(cx, cy + 6, 8, 6);
    g.fillStyle(0xeeeeee, 1);
    g.fillEllipse(cx, cy + 6, 6, 5);
    g.fillStyle(0xcccccc, 0.6);
    g.fillRect(cx - 2, cy + 4, 1, 4);
    g.fillRect(cx + 1, cy + 5, 1, 3);
    g.fillStyle(0x888899, 1);
    g.fillEllipse(cx, cy + 3, 8, 3);
    g.fillStyle(0xaaaabb, 1);
    g.fillEllipse(cx, cy + 3, 6, 2);
    g.fillStyle(0xccccdd, 0.8);
    g.fillCircle(cx - 2, cy + 3, 0.5);
    g.fillCircle(cx, cy + 3, 0.5);
    g.fillCircle(cx + 2, cy + 3, 0.5);
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 2, cy + 8, 1, 4);
    g.fillRect(cx, cy + 8, 1, 4);
    g.fillRect(cx + 2, cy + 8, 1, 4);
    g.fillCircle(cx - 2, cy + 12, 0.8);
    g.fillCircle(cx, cy + 12, 0.8);
    g.fillCircle(cx + 2, cy + 12, 0.8);

    // Military doublet
    g.fillStyle(0x0a0a1a, 1);
    g.fillRect(cx - 10, cy - 6, 20, 10);
    g.fillStyle(0x222244, 1);
    g.fillRect(cx - 9, cy - 5, 18, 8);
    g.fillStyle(0xcccccc, 1);
    g.fillCircle(cx - 2, cy - 3, 0.8);
    g.fillCircle(cx - 2, cy, 0.8);
    g.fillCircle(cx + 2, cy - 3, 0.8);
    g.fillCircle(cx + 2, cy, 0.8);
    g.fillStyle(0xdddd00, 0.8);
    g.fillRect(cx - 10, cy - 6, 3, 2);
    g.fillRect(cx + 7, cy - 6, 3, 2);

    // Head (GOING RED from blowing)
    g.fillStyle(0xcc5533, 1);
    g.fillCircle(cx, cy - 12, 8);
    g.fillStyle(0xee7755, 1);
    g.fillCircle(cx, cy - 12, 7);
    g.fillStyle(0xff8866, 1);
    g.fillCircle(cx - 7, cy - 10, 3);
    g.fillCircle(cx + 7, cy - 10, 3);
    g.fillStyle(0xffaa88, 0.8);
    g.fillCircle(cx - 7, cy - 11, 1.5);
    g.fillCircle(cx + 7, cy - 11, 1.5);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 3, cy - 14, 1.8);
    g.fillCircle(cx + 3, cy - 14, 1.8);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 3, cy - 14, 0.8);
    g.fillCircle(cx + 3, cy - 14, 0.8);
    g.fillStyle(0xaaddff, 0.8);
    g.fillCircle(cx + 6, cy - 15, 0.8);

    // Tam o'shanter (diced border, badge, red toorie)
    g.fillStyle(0x001133, 1);
    g.fillEllipse(cx, cy - 19, 16, 5);
    g.fillStyle(0x002255, 1);
    g.fillEllipse(cx, cy - 20, 14, 4);
    g.fillStyle(0xcc0000, 1);
    g.fillRect(cx - 7, cy - 18, 2, 1);
    g.fillRect(cx - 3, cy - 18, 2, 1);
    g.fillRect(cx + 1, cy - 18, 2, 1);
    g.fillRect(cx + 5, cy - 18, 2, 1);
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(cx - 5, cy - 18, 2, 1);
    g.fillRect(cx - 1, cy - 18, 2, 1);
    g.fillRect(cx + 3, cy - 18, 2, 1);
    g.fillStyle(0xddaa00, 1);
    g.fillCircle(cx - 3, cy - 20, 1.5);
    g.fillStyle(0xffcc22, 1);
    g.fillCircle(cx - 3, cy - 20, 0.8);
    g.fillStyle(0x990000, 1);
    g.fillCircle(cx + 5, cy - 23, 3.5);
    g.fillStyle(0xcc1111, 1);
    g.fillCircle(cx + 5, cy - 23, 3);
    g.fillStyle(0xee3333, 0.7);
    g.fillCircle(cx + 4, cy - 24, 1.5);

    // BAGPIPES (tartan bag under arm)
    g.fillStyle(0x002244, 1);
    g.fillEllipse(cx - 14, cy, 16, 14);
    g.fillStyle(0x114466, 1);
    g.fillEllipse(cx - 14, cy, 14, 12);
    g.fillStyle(0x003366, 0.8);
    g.fillRect(cx - 20, cy - 2, 12, 1);
    g.fillRect(cx - 20, cy + 2, 12, 1);
    g.fillRect(cx - 16, cy - 5, 1, 10);
    g.fillRect(cx - 12, cy - 5, 1, 10);

    // Drone pipes with gold ferrules
    g.fillStyle(0x1a1100, 1);
    g.fillRect(cx - 19, cy - 16, 2, 18);
    g.fillRect(cx - 15, cy - 18, 2, 20);
    g.fillRect(cx - 11, cy - 16, 2, 18);
    g.fillStyle(0x443300, 1);
    g.fillRect(cx - 19, cy - 15, 1, 17);
    g.fillRect(cx - 15, cy - 17, 1, 19);
    g.fillRect(cx - 11, cy - 15, 1, 17);
    g.fillStyle(0xddaa00, 1);
    g.fillRect(cx - 20, cy - 17, 4, 2);
    g.fillRect(cx - 16, cy - 19, 4, 2);
    g.fillRect(cx - 12, cy - 17, 4, 2);
    g.fillStyle(0xccaa00, 0.8);
    g.fillRect(cx - 20, cy - 8, 4, 1);
    g.fillRect(cx - 16, cy - 8, 4, 1);
    g.fillRect(cx - 12, cy - 8, 4, 1);

    g.fillStyle(0x1a1100, 1);
    g.fillRect(cx - 8, cy - 12, 6, 2);

    g.generateTexture('piper', s, s);
    g.destroy();
  }

  private createSheep(): void {
    const s = 36;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Wool body (matted, dirty hill sheep)
    g.fillStyle(0x999988, 1);
    g.fillEllipse(cx, cy, 28, 20);
    g.fillStyle(0xddddcc, 1);
    g.fillCircle(cx - 8, cy, 7);
    g.fillCircle(cx - 2, cy - 3, 8);
    g.fillCircle(cx + 4, cy - 2, 7);
    g.fillCircle(cx + 8, cy + 1, 6);
    g.fillCircle(cx - 6, cy + 3, 6);
    g.fillCircle(cx + 2, cy + 4, 6);
    g.fillStyle(0xbbbb99, 0.6);
    g.fillCircle(cx - 5, cy + 4, 3);
    g.fillCircle(cx + 6, cy + 3, 2.5);
    g.fillStyle(0xaaaa88, 0.4);
    g.fillCircle(cx - 8, cy + 2, 2);
    g.fillStyle(0xeeeedd, 1);
    g.fillCircle(cx - 4, cy - 4, 4);
    g.fillCircle(cx + 3, cy - 3, 4);

    // Thistle stuck in wool
    g.fillStyle(0x9966cc, 1);
    g.fillCircle(cx - 10, cy - 3, 1.5);
    g.fillStyle(0xbb88ee, 1);
    g.fillCircle(cx - 10, cy - 3, 0.8);
    g.fillStyle(0x336622, 1);
    g.fillRect(cx - 10, cy - 2, 1, 3);

    // Legs
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 8, cy + 8, 3, 5);
    g.fillRect(cx - 3, cy + 8, 3, 5);
    g.fillRect(cx + 2, cy + 8, 3, 5);
    g.fillRect(cx + 7, cy + 8, 3, 5);
    g.fillStyle(0x332211, 0.7);
    g.fillRect(cx - 8, cy + 12, 3, 1);
    g.fillRect(cx + 7, cy + 12, 3, 1);

    // Head (Scottish Blackface)
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx + 11, cy - 1, 6);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(cx + 11, cy - 1, 5);
    g.fillStyle(0xddddcc, 0.7);
    g.fillRect(cx + 10, cy - 2, 2, 4);

    // DRAMATIC CURLING RAM'S HORNS
    g.fillStyle(0x887755, 1);
    g.fillTriangle(cx + 6, cy - 4, cx + 2, cy - 9, cx + 4, cy - 2);
    g.fillStyle(0xaa9966, 1);
    g.fillTriangle(cx + 6, cy - 4, cx + 3, cy - 8, cx + 5, cy - 3);
    g.fillStyle(0x776644, 0.6);
    g.fillRect(cx + 4, cy - 6, 2, 1);
    g.fillStyle(0x887755, 1);
    g.fillTriangle(cx + 16, cy - 4, cx + 20, cy - 9, cx + 18, cy - 2);
    g.fillStyle(0xaa9966, 1);
    g.fillTriangle(cx + 16, cy - 4, cx + 19, cy - 8, cx + 17, cy - 3);
    g.fillStyle(0x776644, 0.6);
    g.fillRect(cx + 17, cy - 6, 2, 1);

    // Ears (one up, one flopped)
    g.fillStyle(0x000000, 1);
    g.fillTriangle(cx + 8, cy - 7, cx + 10, cy - 4, cx + 6, cy - 4);
    g.fillTriangle(cx + 14, cy - 4, cx + 16, cy - 2, cx + 13, cy - 1);

    // Creepy yellow eyes with horizontal SLIT PUPILS
    g.fillStyle(0xffdd00, 1);
    g.fillCircle(cx + 10, cy - 2, 1.8);
    g.fillCircle(cx + 13, cy - 2, 1.8);
    g.fillStyle(0x000000, 1);
    g.fillRect(cx + 9, cy - 2, 2, 1);
    g.fillRect(cx + 12, cy - 2, 2, 1);

    // Manic grin
    g.fillStyle(0x444444, 1);
    g.fillRect(cx + 12, cy + 2, 4, 2);
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(cx + 12, cy + 2, 1, 1);
    g.fillRect(cx + 14, cy + 2, 1, 1);
    g.fillRect(cx + 13, cy + 3, 1, 1);

    g.generateTexture('sheep', s, s);
    g.destroy();
  }

  private createGhost(): void {
    const s = 40;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    g.fillStyle(0x668888, 0.35);
    g.fillEllipse(cx, cy - 2, 30, 28);
    g.fillStyle(0x88aaaa, 0.5);
    g.fillEllipse(cx, cy - 2, 26, 24);
    g.fillStyle(0xaacccc, 0.45);
    g.fillEllipse(cx - 2, cy - 4, 20, 18);

    // Trailing tartan sash
    g.fillStyle(0x334466, 0.4);
    g.fillRect(cx - 4, cy - 8, 8, 20);
    g.fillStyle(0x446688, 0.3);
    g.fillRect(cx - 3, cy - 7, 6, 18);
    g.fillStyle(0x556688, 0.3);
    g.fillRect(cx - 3, cy - 3, 6, 1);
    g.fillRect(cx - 3, cy + 3, 6, 1);
    g.fillRect(cx - 1, cy - 7, 1, 18);

    // Wavy ghost-tail
    g.fillStyle(0x88aaaa, 0.5);
    for (let i = 0; i < 5; i++) {
      g.fillCircle(cx - 12 + i * 6, cy + 10, 5);
    }
    g.fillStyle(0xaacccc, 0.4);
    for (let i = 0; i < 5; i++) {
      g.fillCircle(cx - 12 + i * 6, cy + 9, 4);
    }

    // Chain links (castle dungeon ghost)
    g.lineStyle(1.5, 0x8899aa, 0.6);
    g.strokeCircle(cx + 10, cy + 4, 2);
    g.strokeCircle(cx + 12, cy + 7, 2);
    g.strokeCircle(cx + 10, cy + 10, 2);

    // French hood (Mary Queen of Scots)
    g.fillStyle(0x222233, 0.6);
    g.fillEllipse(cx, cy - 12, 18, 6);
    g.fillStyle(0x1a1a2a, 0.7);
    g.fillEllipse(cx, cy - 13, 16, 4);
    g.fillStyle(0xbbccdd, 0.5);
    g.fillRect(cx - 5, cy - 11, 10, 2);
    g.fillStyle(0xccddee, 0.4);
    g.fillRect(cx - 4, cy - 11, 8, 1);

    // Hollow eye sockets (glowing blue-green)
    g.fillStyle(0x000000, 0.9);
    g.fillCircle(cx - 5, cy - 6, 4);
    g.fillCircle(cx + 5, cy - 6, 4);
    g.fillStyle(0x44ddaa, 1);
    g.fillCircle(cx - 5, cy - 6, 2.2);
    g.fillCircle(cx + 5, cy - 6, 2.2);
    g.fillStyle(0xaaffdd, 1);
    g.fillCircle(cx - 5, cy - 7, 0.8);
    g.fillCircle(cx + 5, cy - 7, 0.8);

    // Wailing O-mouth
    g.fillStyle(0x000000, 0.9);
    g.fillEllipse(cx, cy + 2, 6, 6);
    g.fillStyle(0x1a3344, 1);
    g.fillEllipse(cx, cy + 2, 4, 4);

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

    // Wee feather sticking out (brown, wispy)
    g.fillStyle(0x886644, 0.8);
    g.fillTriangle(cx + 12, cy - 4, cx + 16, cy - 8, cx + 13, cy - 2);
    g.fillStyle(0xaa8866, 0.6);
    g.fillTriangle(cx + 12, cy - 3, cx + 15, cy - 7, cx + 13, cy - 2);
    g.lineStyle(0.5, 0x664422, 0.7);
    g.lineBetween(cx + 12, cy - 2, cx + 15, cy - 7);

    g.generateTexture('nest', s, s);
    g.destroy();
  }

  /** Treasure chest — arched lid, metal bands, rivets, golden lock. */
  private createChestTexture(): void {
    const s = 32;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 1;

    // Dark outline
    g.fillStyle(0x2a1a06, 1);
    g.fillRect(cx - 14, cy - 4, 28, 16);
    g.fillEllipse(cx, cy - 4, 28, 10); // arched lid outline

    // Chest body (rich wood)
    g.fillStyle(0x7a5a10, 1);
    g.fillRect(cx - 13, cy - 3, 26, 14);
    // Lid — lighter, arched
    g.fillStyle(0x9a7418, 1);
    g.fillEllipse(cx, cy - 4, 26, 8);
    g.fillStyle(0xb08820, 0.8);
    g.fillEllipse(cx, cy - 5, 22, 5);
    // Wood grain lines
    g.fillStyle(0x5a4008, 0.7);
    g.fillRect(cx - 13, cy + 2, 26, 1);
    g.fillRect(cx - 13, cy + 6, 26, 1);
    g.fillRect(cx - 13, cy + 9, 26, 1);

    // Metal bands — horizontal straps
    g.fillStyle(0x6a5500, 1);
    g.fillRect(cx - 14, cy - 1, 28, 2);
    g.fillStyle(0xccaa33, 1);
    g.fillRect(cx - 14, cy - 1, 28, 1);
    // Tartan accent on bands (Scottish treasure!)
    g.fillStyle(0xcc2222, 0.6);
    g.fillRect(cx - 14, cy, 28, 1);
    g.fillStyle(0x224488, 0.4);
    g.fillRect(cx - 14, cy - 2, 28, 1);
    // Vertical metal band (center strap)
    g.fillStyle(0x6a5500, 1);
    g.fillRect(cx - 1, cy - 8, 2, 18);
    g.fillStyle(0xccaa33, 0.8);
    g.fillRect(cx, cy - 7, 1, 16);

    // Metal rivets — at intersections
    g.fillStyle(0xddbb44, 1);
    g.fillCircle(cx - 12, cy - 1, 1);
    g.fillCircle(cx + 12, cy - 1, 1);
    g.fillCircle(cx, cy - 1, 1.2);
    g.fillCircle(cx - 12, cy + 9, 0.8);
    g.fillCircle(cx + 12, cy + 9, 0.8);

    // Lock — ornate golden clasp
    g.fillStyle(0x443300, 1);
    g.fillRect(cx - 3, cy + 1, 6, 6);
    g.fillStyle(0xffcc44, 1);
    g.fillRect(cx - 2, cy + 2, 4, 4);
    g.fillStyle(0xffeebb, 1);
    g.fillCircle(cx, cy + 3, 1.5);
    g.fillStyle(0x221100, 1);
    g.fillCircle(cx, cy + 4, 0.8);

    g.generateTexture('chest', s, s);
    g.destroy();
  }

  /** Health orb — Irn-Bru orange with a bold highlight. */
  private createHealthOrb(): void {
    const s = 18;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;
    g.fillStyle(0x884400, 1);
    g.fillCircle(cx, cy, 7);
    g.fillStyle(0xee7700, 1);
    g.fillCircle(cx, cy, 6);
    g.fillStyle(0xff9922, 0.8);
    g.fillCircle(cx - 1, cy - 1, 4);
    g.fillStyle(0xffbb44, 0.6);
    g.fillCircle(cx - 2, cy - 2, 2);
    g.fillStyle(0xffffff, 0.6);
    g.fillRect(cx - 3, cy - 4, 1, 5);
    g.fillStyle(0xffffff, 0.3);
    g.fillRect(cx - 2, cy - 3, 1, 3);
    g.fillStyle(0xffdd88, 0.8);
    g.fillCircle(cx + 1, cy + 1, 0.6);
    g.fillCircle(cx + 2, cy - 1, 0.5);
    g.fillCircle(cx - 1, cy + 2, 0.4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 3, cy - 3, 0.8);
    g.generateTexture('health_orb', s, s);
    g.destroy();
  }

  private createDeepFryer(): void {
    const s = 48;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(cx - 18, cy - 6, 36, 22);
    g.fillStyle(0x555555, 1);
    g.fillRect(cx - 17, cy - 5, 34, 20);
    g.fillStyle(0x777777, 1);
    g.fillRect(cx - 16, cy - 4, 32, 4);
    g.fillStyle(0x444444, 1);
    g.fillRect(cx - 18, cy - 8, 36, 3);
    g.fillStyle(0x999999, 1);
    g.fillRect(cx - 18, cy - 7, 36, 1);
    g.fillStyle(0x222222, 1);
    g.fillRect(cx - 22, cy - 5, 5, 3);
    g.fillRect(cx + 17, cy - 5, 5, 3);

    // Bubbling oil (VOLCANIC)
    g.fillStyle(0x774400, 1);
    g.fillRect(cx - 15, cy - 3, 30, 16);
    g.fillStyle(0xbb7700, 1);
    g.fillRect(cx - 14, cy - 2, 28, 14);
    g.fillStyle(0xdd9922, 1);
    g.fillRect(cx - 13, cy - 1, 26, 2);
    g.fillStyle(0xffdd44, 1);
    g.fillCircle(cx - 9, cy + 1, 2.5);
    g.fillCircle(cx + 5, cy + 3, 2.5);
    g.fillCircle(cx + 11, cy, 2);
    g.fillCircle(cx - 3, cy + 7, 2.5);
    g.fillCircle(cx - 11, cy + 5, 1.8);
    g.fillCircle(cx + 8, cy + 8, 1.5);
    g.fillCircle(cx + 1, cy + 1, 1.8);
    g.fillStyle(0xffffcc, 0.9);
    g.fillCircle(cx - 9, cy, 1.2);
    g.fillCircle(cx + 5, cy + 2, 1.2);
    g.fillCircle(cx - 3, cy + 6, 1.2);
    g.fillCircle(cx + 1, cy, 1);

    // Battered Mars bar
    g.fillStyle(0xaa7711, 1);
    g.fillRect(cx - 6, cy + 2, 12, 5);
    g.fillStyle(0xcc9922, 1);
    g.fillRect(cx - 5, cy + 3, 10, 3);
    g.fillStyle(0xddaa33, 0.7);
    g.fillCircle(cx - 3, cy + 3, 0.8);
    g.fillCircle(cx + 2, cy + 4, 0.8);

    // Pizza crunch (battered pizza slice — peak Glasgow)
    g.fillStyle(0xaa7711, 1);
    g.fillTriangle(cx + 8, cy + 3, cx + 14, cy + 8, cx + 4, cy + 8);
    g.fillStyle(0xcc9922, 1);
    g.fillTriangle(cx + 8, cy + 4, cx + 13, cy + 7, cx + 5, cy + 7);
    g.fillStyle(0xcc3322, 0.6);
    g.fillCircle(cx + 9, cy + 6, 0.8);

    // Salt shaker (left)
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(cx - 22, cy + 2, 4, 8);
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx - 21, cy + 3, 2, 6);
    g.fillStyle(0x888888, 1);
    g.fillCircle(cx - 20, cy + 2, 0.5);
    g.fillCircle(cx - 19, cy + 2, 0.5);
    g.fillStyle(0xaaaaaa, 1);
    g.fillCircle(cx - 20, cy + 6, 0.5);

    // Vinegar bottle (right)
    g.fillStyle(0x443311, 1);
    g.fillRect(cx + 18, cy + 1, 4, 9);
    g.fillStyle(0x664422, 1);
    g.fillRect(cx + 19, cy + 2, 2, 7);
    g.fillStyle(0x443311, 1);
    g.fillRect(cx + 19, cy - 1, 2, 3);
    g.fillStyle(0xddddaa, 1);
    g.fillRect(cx + 19, cy + 4, 2, 3);

    // Steam wisps (THICK)
    g.fillStyle(0xdddddd, 0.7);
    g.fillCircle(cx - 8, cy - 11, 3.5);
    g.fillCircle(cx, cy - 14, 4);
    g.fillCircle(cx + 8, cy - 11, 3.5);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(cx - 8, cy - 12, 2.5);
    g.fillCircle(cx, cy - 15, 3);
    g.fillCircle(cx + 8, cy - 12, 2.5);
    g.fillStyle(0xeeeeee, 0.3);
    g.fillCircle(cx + 3, cy - 18, 2);

    // Grease-spatter warning glow
    g.fillStyle(0xff6600, 0.25);
    g.fillCircle(cx, cy + 3, 22);

    g.generateTexture('deep_fryer', s, s);
    g.destroy();
  }

  // === Evolution weapon icons ===

  /** Thistle Storm — multiple thistles in a radiating burst */
  private createThistleStormIcon(): void {
    const s = 32;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;
    // Purple homing energy aura — outer glow
    g.fillStyle(0x440066, 0.3);
    g.fillCircle(cx, cy, 15);
    g.fillStyle(0x6622aa, 0.2);
    g.fillCircle(cx, cy, 11);
    // Energy trails from thistles to centre
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const tx = cx + Math.cos(a) * 11;
      const ty = cy + Math.sin(a) * 11;
      g.lineStyle(1, 0x9944cc, 0.4);
      g.lineBetween(cx, cy, tx, ty);
    }
    // 7 thistle heads radiating in a spiral pattern
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.3;
      const r = 9 + (i % 2) * 1.5;
      const tx = cx + Math.cos(a) * r;
      const ty = cy + Math.sin(a) * r;
      // Thistle head — dark outline
      g.fillStyle(0x2a0044, 1);
      g.fillCircle(tx, ty, 3);
      // Thistle head — purple body
      g.fillStyle(0x7722aa, 1);
      g.fillCircle(tx, ty, 2.2);
      // Thistle head — lighter centre
      g.fillStyle(0xaa55dd, 1);
      g.fillCircle(tx, ty, 1.2);
      // Spike tip extending outward
      g.fillStyle(0xcc88ff, 1);
      g.fillCircle(tx + Math.cos(a) * 2.5, ty + Math.sin(a) * 2.5, 0.9);
      // Side spikes
      g.fillStyle(0xbb66ee, 0.8);
      g.fillCircle(tx + Math.cos(a + 1.2) * 2, ty + Math.sin(a + 1.2) * 2, 0.7);
      g.fillCircle(tx + Math.cos(a - 1.2) * 2, ty + Math.sin(a - 1.2) * 2, 0.7);
    }
    // Bright magical core — white/purple
    g.fillStyle(0x9944dd, 1);
    g.fillCircle(cx, cy, 4);
    g.fillStyle(0xdd88ff, 1);
    g.fillCircle(cx, cy, 2.5);
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(cx, cy, 1.2);
    g.generateTexture('wicon_thistle_storm', s, s);
    g.destroy();
  }

  /** Highland Games — flaming caber */
  private createHighlandGamesIcon(): void {
    const s = 32;
    const g = this.add.graphics();
    // Caber diagonal: bottom-left to upper-right
    // Dark outline shadow of caber
    g.fillStyle(0x1a0e00, 1);
    g.fillRect(3, 14, 22, 8);
    // Caber body — dark wood tone
    g.fillStyle(0x3a2208, 1);
    g.fillRect(4, 15, 20, 6);
    // Caber — mid wood grain band
    g.fillStyle(0x6b4010, 1);
    g.fillRect(4, 16, 20, 4);
    // Caber — light grain highlight
    g.fillStyle(0x8b5a18, 1);
    g.fillRect(4, 16, 20, 1);
    g.fillStyle(0x7a4e14, 0.6);
    g.fillRect(6, 18, 14, 1);
    // Wood grain detail lines
    g.fillStyle(0x2e1c06, 0.7);
    g.fillRect(8, 15, 1, 6);
    g.fillRect(14, 15, 1, 6);
    g.fillRect(20, 15, 1, 6);
    // Ground crack lines beneath caber
    g.fillStyle(0x1a0e00, 0.8);
    g.fillRect(5, 21, 8, 1);
    g.fillRect(3, 22, 5, 1);
    g.fillRect(7, 22, 6, 1);
    // Scorch marks on caber near impact end
    g.fillStyle(0x0a0600, 0.7);
    g.fillCircle(24, 18, 3);
    g.fillCircle(21, 20, 2);
    // Flame explosion at right (impact) end — outer red
    g.fillStyle(0xcc2200, 0.85);
    g.fillCircle(27, 12, 6);
    g.fillCircle(26, 17, 5);
    g.fillTriangle(25, 9, 32, 14, 28, 7);
    g.fillTriangle(29, 16, 32, 10, 32, 19);
    // Flame — orange mid layer
    g.fillStyle(0xff6600, 1);
    g.fillCircle(27, 13, 4.5);
    g.fillCircle(26, 16, 3.5);
    g.fillTriangle(26, 10, 31, 14, 28, 8);
    // Flame — yellow hot core
    g.fillStyle(0xffcc00, 1);
    g.fillCircle(27, 14, 3);
    g.fillCircle(26, 16, 2);
    // Flame — white hottest point
    g.fillStyle(0xffeeaa, 1);
    g.fillCircle(27, 15, 1.5);
    // Ember particles
    g.fillStyle(0xff8800, 0.9);
    g.fillCircle(30, 8, 1);
    g.fillCircle(32, 12, 0.8);
    g.fillStyle(0xffcc22, 0.8);
    g.fillCircle(31, 6, 0.7);
    g.fillCircle(29, 5, 0.8);
    g.generateTexture('wicon_highland_games', s, s);
    g.destroy();
  }

  /** Jobby Cannon — multiple wee jobbies radiating */
  private createHaggisCannonIcon(): void {
    const s = 32;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;
    // Motion lines outward
    g.lineStyle(1.5, 0x7a5010, 0.5);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.lineBetween(cx, cy, cx + Math.cos(a) * 13, cy + Math.sin(a) * 13);
    }
    // 6 smaller jobbies radiating outward with motion trails
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const r = 10;
      const jx = cx + Math.cos(a) * r;
      const jy = cy + Math.sin(a) * r;
      // Trail dots (2 dots behind each jobby)
      g.fillStyle(0x5a3808, 0.5);
      g.fillCircle(jx - Math.cos(a) * 3, jy - Math.sin(a) * 3, 1.2);
      g.fillStyle(0x6b4a0a, 0.35);
      g.fillCircle(jx - Math.cos(a) * 5, jy - Math.sin(a) * 5, 0.8);
      // Small jobby — outline
      g.fillStyle(0x1e1004, 1);
      g.fillCircle(jx, jy, 2.8);
      // Small jobby — dark brown
      g.fillStyle(0x5a3808, 1);
      g.fillCircle(jx, jy, 2.2);
      // Small jobby — mid swirl
      g.fillStyle(0x8a5a14, 1);
      g.fillCircle(jx - 0.5, jy - 0.5, 1.2);
      // Jobby tip
      g.fillStyle(0xaa7020, 0.8);
      g.fillCircle(jx - 0.8, jy - 0.8, 0.6);
    }
    // Impact splatter effects at edges
    g.fillStyle(0x6b4a0a, 0.7);
    g.fillCircle(cx - 12, cy - 12, 1.5);
    g.fillCircle(cx + 12, cy - 10, 1.2);
    g.fillCircle(cx - 10, cy + 12, 1.2);
    g.fillStyle(0x8a5a14, 0.5);
    g.fillCircle(cx + 13, cy + 8, 1.0);
    g.fillCircle(cx - 8, cy - 13, 0.8);
    // Central chunky jobby — outline
    g.fillStyle(0x1e1004, 1);
    g.fillCircle(cx, cy, 6.5);
    // Central jobby — dark brown base
    g.fillStyle(0x4a2c06, 1);
    g.fillCircle(cx, cy, 5.5);
    // Central jobby — mid coil
    g.fillStyle(0x7a4e10, 1);
    g.fillCircle(cx - 1, cy - 1, 4);
    // Central jobby — highlight swirl
    g.fillStyle(0xaa7020, 1);
    g.fillCircle(cx - 1.5, cy - 1.5, 2.2);
    // Central jobby — top sheen
    g.fillStyle(0xcc9030, 0.7);
    g.fillCircle(cx - 2, cy - 2, 1.2);
    // Steam wisps
    g.fillStyle(0xddccbb, 0.4);
    g.fillCircle(cx - 1, cy - 7, 1.5);
    g.fillCircle(cx + 1, cy - 9, 1.2);
    g.fillStyle(0xccbbaa, 0.25);
    g.fillCircle(cx, cy - 11, 1.0);
    g.generateTexture('wicon_haggis_cannon', s, s);
    g.destroy();
  }

  /** Highland Fling — massive expanding ring */
  private createHighlandFlingIcon(): void {
    const s = 32;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;
    // Outer ring — blue, motion-blurred (wider stroke)
    g.lineStyle(3, 0x2255cc, 0.6);
    g.strokeCircle(cx, cy, 14);
    // Outer ring motion blur extension dots
    g.fillStyle(0x3366dd, 0.35);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.fillCircle(cx + Math.cos(a) * 14.5, cy + Math.sin(a) * 14.5, 1.2);
    }
    // Ring 1 — outer solid blue
    g.lineStyle(2, 0x3366ee, 1);
    g.strokeCircle(cx, cy, 13);
    // Ring 2 — mid cyan
    g.lineStyle(2, 0x4499ff, 0.85);
    g.strokeCircle(cx, cy, 9);
    // Ring 3 — inner white/bright
    g.lineStyle(2, 0x88ccff, 0.7);
    g.strokeCircle(cx, cy, 5);
    // Musical notes scattered between rings
    g.fillStyle(0xaaddff, 0.85);
    // Note 1 — upper right area
    g.fillCircle(cx + 10, cy - 6, 1.5);
    g.fillRect(cx + 11, cy - 10, 1.5, 4.5);
    g.fillRect(cx + 11, cy - 10, 4, 1.5);
    // Note 2 — lower left area
    g.fillCircle(cx - 8, cy + 9, 1.2);
    g.fillRect(cx - 7, cy + 5, 1.2, 4);
    // Energy scatter dots between rings
    g.fillStyle(0x66aaff, 0.7);
    g.fillCircle(cx + 7, cy + 7, 1.0);
    g.fillCircle(cx - 7, cy - 7, 1.0);
    g.fillCircle(cx - 10, cy + 4, 0.9);
    g.fillCircle(cx + 4, cy - 10, 0.9);
    g.fillStyle(0x99ccff, 0.5);
    g.fillCircle(cx + 11, cy + 2, 0.8);
    g.fillCircle(cx - 2, cy + 11, 0.8);
    // Bright white centre flash
    g.fillStyle(0x2244bb, 1);
    g.fillCircle(cx, cy, 4);
    g.fillStyle(0x66aaff, 1);
    g.fillCircle(cx, cy, 3);
    g.fillStyle(0xccddff, 1);
    g.fillCircle(cx, cy, 1.8);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx, cy, 1);
    g.generateTexture('wicon_highland_fling', s, s);
    g.destroy();
  }

  /** The Haar — dense fog cloud */
  private createTheHaarIcon(): void {
    const s = 32;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;
    // Layer 1 — outermost dissolving wisps (very faint)
    g.fillStyle(0x2a3a33, 0.3);
    g.fillCircle(cx - 10, cy + 4, 7);
    g.fillCircle(cx + 10, cy + 4, 7);
    g.fillCircle(cx, cy - 6, 8);
    g.fillCircle(cx - 7, cy + 7, 5);
    g.fillCircle(cx + 7, cy + 7, 5);
    g.fillCircle(cx - 12, cy + 1, 4);
    g.fillCircle(cx + 12, cy + 1, 4);
    // Layer 2 — edge fog, green-tinged (poisonous)
    g.fillStyle(0x334433, 0.5);
    g.fillCircle(cx - 8, cy + 3, 6);
    g.fillCircle(cx + 8, cy + 3, 6);
    g.fillCircle(cx, cy - 4, 7);
    g.fillCircle(cx - 5, cy + 5, 5);
    g.fillCircle(cx + 5, cy + 5, 5);
    // Layer 3 — main fog bank
    g.fillStyle(0x445544, 0.7);
    g.fillCircle(cx - 6, cy + 2, 5.5);
    g.fillCircle(cx + 6, cy + 2, 5.5);
    g.fillCircle(cx, cy - 2, 6.5);
    g.fillCircle(cx - 3, cy + 3, 5);
    g.fillCircle(cx + 3, cy + 3, 5);
    // Layer 4 — denser centre fog
    g.fillStyle(0x556655, 0.82);
    g.fillCircle(cx - 4, cy + 1, 4.5);
    g.fillCircle(cx + 4, cy + 1, 4.5);
    g.fillCircle(cx, cy - 1, 5.5);
    // Layer 5 — ominous dark core
    g.fillStyle(0x1e2d1e, 0.88);
    g.fillCircle(cx, cy + 1, 5);
    g.fillCircle(cx - 1, cy, 4);
    g.fillCircle(cx + 1, cy, 4);
    // Ghostly shapes barely visible — spectral figure outline
    g.fillStyle(0x334433, 0.5);
    g.fillCircle(cx, cy - 1, 3);
    g.fillRect(cx - 2, cy + 2, 4, 4);
    // Ghost "eye" glints
    g.fillStyle(0x99cc88, 0.45);
    g.fillCircle(cx - 1, cy - 1, 0.9);
    g.fillCircle(cx + 1, cy - 1, 0.9);
    // Green-tinged wisp highlights
    g.fillStyle(0x88cc77, 0.5);
    g.fillCircle(cx - 2, cy - 3, 1.5);
    g.fillCircle(cx + 4, cy - 1, 1.2);
    g.fillStyle(0xaaddaa, 0.4);
    g.fillCircle(cx - 6, cy + 1, 1.0);
    g.fillCircle(cx + 6, cy + 1, 1.0);
    g.fillCircle(cx, cy + 8, 1.0);
    g.generateTexture('wicon_the_haar', s, s);
    g.destroy();
  }

  /** Nessie Unleashed — full tentacle swirl */
  private createNessieUnleashedIcon(): void {
    const s = 32;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;
    // Water spray/splash background
    g.fillStyle(0x336688, 0.3);
    g.fillCircle(cx, cy, 15);
    g.fillStyle(0x224466, 0.2);
    g.fillCircle(cx, cy, 12);
    // Splash droplets
    g.fillStyle(0x66aacc, 0.7);
    g.fillCircle(cx + 13, cy - 4, 1.5);
    g.fillCircle(cx - 13, cy + 3, 1.2);
    g.fillCircle(cx + 4, cy - 14, 1.3);
    g.fillCircle(cx - 5, cy + 13, 1.2);
    g.fillStyle(0x88ccee, 0.5);
    g.fillCircle(cx + 14, cy + 2, 1.0);
    g.fillCircle(cx - 2, cy - 14, 0.9);
    // 4 tentacles spiralling outward from centre
    const tentacleAngles = [0.4, 1.9, 3.4, 4.9];
    for (let t = 0; t < 4; t++) {
      const baseAngle = tentacleAngles[t];
      // Draw 3 segments per tentacle, spiralling out
      for (let seg = 0; seg < 3; seg++) {
        const a = baseAngle + seg * 0.6;
        const r = 4 + seg * 3.5;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        const size = 3.8 - seg * 0.8;
        // Outline
        g.fillStyle(0x0d2e1a, 1);
        g.fillCircle(px, py, size + 0.7);
        // Dark green body
        g.fillStyle(0x1a5c36, 1);
        g.fillCircle(px, py, size);
        // Mid green
        g.fillStyle(0x2a8052, 1);
        g.fillCircle(px - 0.5, py - 0.5, size * 0.65);
        // Highlight
        g.fillStyle(0x44aa6a, 1);
        g.fillCircle(px - 0.8, py - 0.8, size * 0.35);
        // Sucker on inner curve
        if (seg > 0) {
          const suckerA = a + 1.5;
          const sx = px + Math.cos(suckerA) * (size - 0.5);
          const sy = py + Math.sin(suckerA) * (size - 0.5);
          g.fillStyle(0xbbaa88, 1);
          g.fillCircle(sx, sy, 0.9);
        }
        // Bioluminescent accent dot
        g.fillStyle(0x33ffaa, 0.4);
        g.fillCircle(px + Math.cos(a + 0.8) * size * 0.8, py + Math.sin(a + 0.8) * size * 0.8, 0.6);
      }
    }
    // Central golden eye — dark outline
    g.fillStyle(0x3a2a00, 1);
    g.fillCircle(cx, cy, 5);
    // Eye iris — golden
    g.fillStyle(0xcc9900, 1);
    g.fillCircle(cx, cy, 4);
    // Eye lighter gold
    g.fillStyle(0xffcc22, 1);
    g.fillCircle(cx, cy, 3);
    // Eye bright highlight
    g.fillStyle(0xffee88, 1);
    g.fillCircle(cx - 0.5, cy - 0.5, 1.5);
    // Slit pupil — vertical black line
    g.fillStyle(0x000000, 1);
    g.fillRect(cx - 0.7, cy - 3, 1.4, 6);
    // Bioluminescent rim around eye
    g.lineStyle(1, 0x33ffaa, 0.5);
    g.strokeCircle(cx, cy, 5.5);
    g.generateTexture('wicon_nessie_unleashed', s, s);
    g.destroy();
  }

  /** Highland Claymore — broad two-handed sword (distinct from caber log projectile). */
  private createClaymoreWeaponIcon(): void {
    const s = 32;
    const g = this.add.graphics();
    // Sword slightly diagonal: tip upper-right, pommel lower-left
    // Blade — dark steel edge shadow (outline)
    g.fillStyle(0x2a3038, 1);
    g.fillTriangle(24, 3, 10, 19, 14, 22);
    // Blade — dark steel face
    g.fillStyle(0x4e6070, 1);
    g.fillTriangle(24, 3, 11, 18, 15, 21);
    // Blade — light steel face (the broad flat side)
    g.fillStyle(0xa8c0d0, 1);
    g.fillTriangle(23, 4, 13, 19, 16, 20);
    // Blade — bright edge gleam line
    g.fillStyle(0xddeeff, 0.9);
    g.fillTriangle(22, 6, 14, 17, 15, 18);
    // Blade — specular highlight near tip
    g.fillStyle(0xeef8ff, 0.8);
    g.fillTriangle(23, 5, 20, 8, 21, 7);
    // Fuller groove (blood groove) — subtle darker line down the centre
    g.fillStyle(0x3a5060, 0.7);
    g.fillRect(16, 8, 1, 9);
    // Wide crossguard — dark outline
    g.fillStyle(0x2a1e14, 1);
    g.fillRect(5, 18, 22, 5);
    // Crossguard — base dark brown
    g.fillStyle(0x4a3828, 1);
    g.fillRect(6, 19, 20, 3);
    // Crossguard — mid highlight
    g.fillStyle(0x6a5440, 1);
    g.fillRect(6, 19, 20, 1);
    // Crossguard ornate ends — rounded caps
    g.fillStyle(0x3a2a1c, 1);
    g.fillCircle(5, 20, 3);
    g.fillCircle(27, 20, 3);
    g.fillStyle(0x6a5440, 1);
    g.fillCircle(5, 19.5, 1.8);
    g.fillCircle(27, 19.5, 1.8);
    // Leather-wrapped grip — dark base
    g.fillStyle(0x2a1a10, 1);
    g.fillRect(11, 22, 10, 6);
    // Grip wrap — cross-hatch bands
    g.fillStyle(0x4a3020, 1);
    g.fillRect(11, 23, 10, 1);
    g.fillRect(11, 25, 10, 1);
    g.fillRect(11, 27, 10, 1);
    // Grip highlight
    g.fillStyle(0x5a3828, 0.6);
    g.fillRect(12, 22, 2, 6);
    // Heavy round pommel — dark outline
    g.fillStyle(0x1a1006, 1);
    g.fillCircle(16, 28, 4.5);
    // Pommel — gold base
    g.fillStyle(0x886a1c, 1);
    g.fillCircle(16, 28, 3.8);
    // Pommel — mid gold
    g.fillStyle(0xb89030, 1);
    g.fillCircle(16, 27.5, 2.8);
    // Pommel — highlight
    g.fillStyle(0xd8b848, 0.9);
    g.fillCircle(15.2, 27, 1.5);
    g.generateTexture('wicon_claymore', s, s);
    g.destroy();
  }

  /** William Blade — evolved claymore. Legendary golden aura, ornate blade,
   *  shockwave lines. Should feel unmistakably "evolved" next to base claymore. */
  private createWilliamBladeIcon(): void {
    const s = 32;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Legendary golden aura — 3 layers radiating outward
    g.fillStyle(0xffaa00, 0.18);
    g.fillCircle(cx, cy, 15);
    g.fillStyle(0xffcc22, 0.22);
    g.fillCircle(cx, cy, 12);
    g.fillStyle(0xffdd44, 0.28);
    g.fillCircle(cx, cy, 9);

    // Shockwave arc lines — the evolution's signature
    g.lineStyle(1.5, 0xffcc44, 0.6);
    g.strokeCircle(cx, cy, 14);
    g.lineStyle(1, 0xffdd66, 0.4);
    g.strokeCircle(cx, cy, 11);

    // Blade — gold/bright steel (evolved version is GOLD not plain steel)
    // Blade dark gold outline/shadow
    g.fillStyle(0x5a3a00, 1);
    g.fillTriangle(cx + 1, cy - 12, cx - 4, cy + 4, cx + 6, cy + 4);
    // Blade — gold base
    g.fillStyle(0xaa7a10, 1);
    g.fillTriangle(cx + 1, cy - 11, cx - 3, cy + 3, cx + 5, cy + 3);
    // Blade — bright gold face
    g.fillStyle(0xd4a830, 1);
    g.fillTriangle(cx + 1, cy - 10, cx - 1, cy + 2, cx + 4, cy + 2);
    // Blade — brilliant gold sheen
    g.fillStyle(0xffe050, 1);
    g.fillTriangle(cx + 1, cy - 9, cx, cy + 1, cx + 2.5, cy);
    // Blade — specular gleam (bright white-gold streak)
    g.fillStyle(0xfff5aa, 0.9);
    g.fillTriangle(cx + 1, cy - 9, cx + 3, cy - 4, cx + 2, cy - 3);
    // Gold edge glow
    g.lineStyle(1, 0xffee66, 0.5);
    g.lineBetween(cx + 1, cy - 11, cx - 3, cy + 3);

    // Ornate golden crossguard — dark gold outline
    g.fillStyle(0x3a2800, 1);
    g.fillRect(cx - 9, cy + 3, 19, 5);
    // Crossguard — dark gold base
    g.fillStyle(0x7a5410, 1);
    g.fillRect(cx - 8, cy + 4, 17, 3);
    // Crossguard — bright gold mid
    g.fillStyle(0xddaa33, 1);
    g.fillRect(cx - 7, cy + 4, 15, 2);
    // Crossguard — shine line
    g.fillStyle(0xffdd66, 1);
    g.fillRect(cx - 7, cy + 4, 15, 1);
    // Jewelled tips — left
    g.fillStyle(0x3a2800, 1);
    g.fillCircle(cx - 8, cy + 5, 3.5);
    g.fillStyle(0xcc8822, 1);
    g.fillCircle(cx - 8, cy + 5, 2.8);
    g.fillStyle(0xff4444, 1);
    g.fillCircle(cx - 8, cy + 5, 1.6);
    g.fillStyle(0xff9999, 0.8);
    g.fillCircle(cx - 8.4, cy + 4.6, 0.7);
    // Jewelled tips — right
    g.fillStyle(0x3a2800, 1);
    g.fillCircle(cx + 9, cy + 5, 3.5);
    g.fillStyle(0xcc8822, 1);
    g.fillCircle(cx + 9, cy + 5, 2.8);
    g.fillStyle(0x4488ff, 1);
    g.fillCircle(cx + 9, cy + 5, 1.6);
    g.fillStyle(0xaaccff, 0.8);
    g.fillCircle(cx + 8.6, cy + 4.6, 0.7);

    // Leather grip — ornate dark
    g.fillStyle(0x2a1800, 1);
    g.fillRect(cx - 2, cy + 7, 5, 7);
    // Grip wrap bands — gold thread
    g.fillStyle(0xcc9922, 1);
    g.fillRect(cx - 2, cy + 8, 5, 1);
    g.fillRect(cx - 2, cy + 10, 5, 1);
    g.fillRect(cx - 2, cy + 12, 5, 1);
    // Grip highlight
    g.fillStyle(0x3a2808, 0.7);
    g.fillRect(cx - 1, cy + 7, 1.5, 7);

    // Large ornate pommel — dark gold outline
    g.fillStyle(0x2a1800, 1);
    g.fillCircle(cx + 1, cy + 14, 5);
    // Pommel — gold base
    g.fillStyle(0xaa7820, 1);
    g.fillCircle(cx + 1, cy + 14, 4.2);
    // Pommel — bright gold
    g.fillStyle(0xddaa33, 1);
    g.fillCircle(cx + 1, cy + 13.5, 3.2);
    // Pommel — shine
    g.fillStyle(0xffee66, 1);
    g.fillCircle(cx + 0.2, cy + 13, 1.8);
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(cx - 0.3, cy + 12.5, 0.8);

    g.generateTexture('wicon_william_blade', s, s);
    g.destroy();
  }

}
