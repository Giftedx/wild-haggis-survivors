import Phaser from 'phaser';
import { COLORS_CSS } from '../config';
import {
  DEFAULT_VARIANT_KEY,
  VARIANTS,
  VariantDef,
  getVariantByKey,
} from '../data/variants';
import { achievementManager } from '../core/AchievementManager';
import { getAnalyticsManager } from '../core/AnalyticsManager';
import { musicEngine } from '../systems/music/ProceduralMusicEngine';
import { validateAndRepairBootTextures } from '../core/AssetValidator';
import { metaProgressSystem } from '../core/MetaProgressSystem';
import { SaveManager } from '../core/SaveManager';
import { getSettingsManager } from '../core/SettingsManager';
import { applyLocaleFromUserSettings } from '../core/applyLocaleFromSettings';
import { t } from '../core/i18n';
import { setPendingCurse } from '../data/curses';
import { allAtlasKeysForVariant, ALL_ANIMATION_STATES } from '../animation/textureAtlas';
import { getFrameCountForState } from '../animation/frameClock';
import { drawHaggisFrame, getHaggisSpriteSize } from '../animation/frameDrawers/haggisFrames';
import { drawHaggisBody } from '../animation/frameDrawers/haggisBodyDraw';
import { CLASSIC_VARIANT } from '../art/palettes';
import type { AnimationState } from '../animation/animationStates';
import { ACCESSORY_REGISTRY } from '../entities/haggisComposition/accessoryRegistry';
import { bakeDecorations } from '../art/sprites/decorations';
import { bakeHud } from '../art/sprites/hud';
import { bakeFx } from '../art/sprites/fx';
import { bakeProjectiles } from '../art/sprites/projectiles';
import { bakePickups } from '../art/sprites/pickups';
import { bakeWeaponIcons } from '../art/sprites/icons/weapons';
import { bakeCardIcons } from '../art/sprites/icons/cards';

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

    // W18 locale scaffolding — apply persisted language before any other
    // scene pulls strings. `t(...)` called before this point resolves
    // through the default (en) locale, which is the intended fallback.
    // Scots overlay is code-split; returned promise resolves once the
    // chunk lands (fire-and-forget here — the Boot splash tween gives
    // the dynamic import plenty of time to complete before MainMenu).
    void applyLocaleFromUserSettings(getSettingsManager().load());

    // Atlas bakes must happen on every boot path — quickplay AND
    // sprite-export included — so Game never starts with `__MISSING`
    // textures and so the export PNG contains every Phase-0 atlas
    // frame alongside the legacy sprites.
    const bakeMs = this.bakeHaggisAtlas();
    console.info(`[BootScene] Haggis atlas bake: ${bakeMs.toFixed(1)} ms`);

    const accessoryBakeMs = this.bakeAccessoryAtlas();
    console.info(`[BootScene] Accessory atlas bake: ${accessoryBakeMs.toFixed(1)} ms`);

    // Dev tool: skip splash and go straight to sprite export
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('export')) {
      this.scene.start('SpriteExport');
      return;
    }

    getAnalyticsManager().ensureBusHandlersStarted();
    musicEngine.ensureBusHandlersStarted();

    // Initialize global meta progression exactly once (above the Scene lifecycle).
    metaProgressSystem.start();
    achievementManager.start();

    // Dev-only: skip splash + menus and start a fresh run (clean curse, no resume).
    // Optional fixed seed: ?quickplay&seed=12345
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      const bootParams = new URLSearchParams(window.location.search);
      if (bootParams.has('quickplay')) {
        try {
          new SaveManager().clearActiveRun();
        } catch {
          /* ignore */
        }
        setPendingCurse(null);
        const raw = bootParams.get('seed');
        const n = raw != null && raw !== '' ? Number(raw) : NaN;
        const seed = Number.isFinite(n) ? n : undefined;
        this.scene.start('Game', seed !== undefined ? { seed } : {});
        return;
      }
    }

    const { width, height } = this.scale;

    // ── Boot splash — a Highland dawn painting, not a logo screen ──
    // Deep night sky base
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1a);

    // ── Sky gradient — dark indigo at top warming to pre-dawn amber at horizon ──
    const skyGfx = this.add.graphics().setAlpha(0);
    // Upper sky — deep blue-black
    skyGfx.fillGradientStyle(0x0a0a1e, 0x0a0a1e, 0x1a2a4a, 0x1a2a4a, 1);
    skyGfx.fillRect(0, 0, width, height * 0.5);
    // Lower sky — pre-dawn glow (warm amber-orange band at horizon)
    skyGfx.fillGradientStyle(0x1a2a4a, 0x1a2a4a, 0x3a2a1a, 0x3a2a1a, 1);
    skyGfx.fillRect(0, height * 0.4, width, height * 0.25);

    // ── Stars (a handful of pinpricks — it's still early) ──
    const starsGfx = this.add.graphics().setAlpha(0);
    starsGfx.fillStyle(0xffffff, 0.6);
    starsGfx.fillCircle(width * 0.15, height * 0.12, 1);
    starsGfx.fillCircle(width * 0.4, height * 0.08, 0.8);
    starsGfx.fillCircle(width * 0.7, height * 0.15, 1);
    starsGfx.fillCircle(width * 0.85, height * 0.1, 0.7);
    starsGfx.fillCircle(width * 0.55, height * 0.2, 0.8);
    starsGfx.fillStyle(0xffffff, 0.3);
    starsGfx.fillCircle(width * 0.25, height * 0.25, 0.6);
    starsGfx.fillCircle(width * 0.6, height * 0.05, 0.6);

    // ── Layered mountain ridges — back to front, lighter to darker ──
    const mtGfx = this.add.graphics().setAlpha(0);
    const baseY = height * 0.65;
    // Far range (faintest, blue-grey — barely visible through haar)
    mtGfx.fillStyle(0x1a2a3a, 0.4);
    mtGfx.fillTriangle(0, baseY, width * 0.2, baseY - 40, width * 0.4, baseY);
    mtGfx.fillTriangle(width * 0.25, baseY, width * 0.5, baseY - 55, width * 0.75, baseY);
    mtGfx.fillTriangle(width * 0.6, baseY, width * 0.8, baseY - 35, width, baseY);
    // Mid range (darker, more defined peaks)
    mtGfx.fillStyle(0x0e1a2a, 0.6);
    mtGfx.fillTriangle(0, baseY, width * 0.25, baseY - 70, width * 0.5, baseY);
    mtGfx.fillTriangle(width * 0.3, baseY, width * 0.6, baseY - 90, width * 0.9, baseY);
    mtGfx.fillTriangle(width * 0.65, baseY, width * 0.85, baseY - 60, width, baseY);
    // Near range (darkest, sharpest — the foothills)
    mtGfx.fillStyle(0x0a0e1a, 0.8);
    mtGfx.fillTriangle(0, baseY, width * 0.15, baseY - 30, width * 0.35, baseY);
    mtGfx.fillTriangle(width * 0.5, baseY, width * 0.7, baseY - 45, width * 0.9, baseY);
    // Ground fill below mountains
    mtGfx.fillStyle(0x0a0e1a, 0.8);
    mtGfx.fillRect(0, baseY, width, height - baseY);

    // ── Dawn light on horizon (warm amber glow bleeding through mountain gaps) ──
    const dawnGfx = this.add.graphics().setAlpha(0);
    dawnGfx.fillStyle(0xdd8833, 0.15);
    dawnGfx.fillEllipse(width * 0.5, baseY, width * 0.6, 30);
    dawnGfx.fillStyle(0xeebb55, 0.08);
    dawnGfx.fillEllipse(width * 0.5, baseY - 5, width * 0.4, 20);

    // ── Heather wash (purple moor carpet below the mountains) ──
    const heatherWash = this.add.graphics().setAlpha(0);
    heatherWash.fillStyle(0x2a1a30, 0.2);
    heatherWash.fillRect(0, baseY, width, height - baseY);
    heatherWash.fillStyle(0x3a2244, 0.1);
    heatherWash.fillEllipse(width * 0.3, height * 0.78, width * 0.4, 30);
    heatherWash.fillEllipse(width * 0.7, height * 0.82, width * 0.3, 25);

    // ── Mist wisps (layered haar drifting across the moor) ──
    const mist1 = this.add.ellipse(width * 0.25, height * 0.6, 220, 25, 0xccccbb, 0).setAlpha(0);
    const mist2 = this.add.ellipse(width * 0.65, height * 0.57, 180, 18, 0xccddee, 0).setAlpha(0);
    const mist3 = this.add.ellipse(width * 0.45, height * 0.63, 140, 15, 0xbbccbb, 0).setAlpha(0);

    // ── Title — whisky gold with warm glow ──
    const title = this.add.text(width / 2, height * 0.35, t('ui.menu.title'), {
      fontFamily: 'monospace', fontSize: '32px', color: COLORS_CSS.WHISKY_GOLD,
      fontStyle: 'bold', stroke: COLORS_CSS.INK, strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0);

    // ── Tagline — the soul charter in miniature ──
    const tagline = this.add.text(width / 2, height * 0.48, t('ui.menu.built_on_moor'), {
      fontFamily: 'monospace', fontSize: '12px', color: '#8a7a5a',
      fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0);

    const mascot = this.add.sprite(width / 2, height * 0.62, getVariantByKey(DEFAULT_VARIANT_KEY).textureKey)
      .setScale(2.5).setAlpha(0);

    // ── Staggered fade-in: sky → stars → mountains → dawn → mist → title → mascot ──
    // The player watches the Highland dawn unfold in ~2 seconds.
    const allFadeTargets = [skyGfx, starsGfx, mtGfx, dawnGfx, heatherWash, mist1, mist2, mist3, title, tagline, mascot];
    this.tweens.add({ targets: skyGfx, alpha: 1, duration: 400 });
    this.tweens.add({ targets: starsGfx, alpha: 1, duration: 300, delay: 100 });
    this.tweens.add({ targets: mtGfx, alpha: 1, duration: 500, delay: 200 });
    this.tweens.add({ targets: dawnGfx, alpha: 1, duration: 600, delay: 300 });
    this.tweens.add({ targets: heatherWash, alpha: 1, duration: 400, delay: 300 });
    this.tweens.add({ targets: [mist1, mist2, mist3], alpha: 0.06, duration: 500, delay: 400 });
    this.tweens.add({ targets: title, alpha: 1, duration: 400, delay: 500 });
    this.tweens.add({ targets: tagline, alpha: 1, duration: 400, delay: 700 });
    this.tweens.add({
      targets: mascot,
      alpha: 1,
      duration: 400,
      delay: 600,
      onComplete: () => {
        // Stars slowly fade as dawn brightens
        this.tweens.add({ targets: starsGfx, alpha: 0, duration: 1200 });
        // Gentle mascot bob while the splash holds
        this.tweens.add({
          targets: mascot,
          y: mascot.y - 4,
          duration: 800,
          yoyo: true,
          ease: 'Sine.easeInOut',
        });
        // Hold, then fade everything and transition
        this.tweens.add({
          targets: allFadeTargets,
          alpha: 0,
          delay: 800,
          duration: 400,
          onComplete: () => this.scene.start('MainMenu'),
        });
      },
    });
  }

  private generateAllTextures(): void {
    this.createHaggisTextures();
    this.createTourist();
    this.createChef();
    this.createMidge();
    this.createHighlandCow();
    this.createEagle();
    this.createHaggisHunter();
    this.createAngryScotsman();
    this.createKelpie();
    this.createMidgieSwarm();
    this.createBuckfastNed();
    this.createTrafficConeTotem();
    this.createEdinburghGhostGuide();
    this.createBarghest();
    this.createKelpieFoal();
    this.createBlueManOfMinch();
    this.createHaarWraith();
    this.createGaleWraith();
    this.createSeeliePiper();
    this.createUnseelieFiddler();
    this.createRedcap();
    this.createCeilidhCaller();
    this.createTomeWraith();
    this.createDeanApparition();
    this.createLedgerWraith();
    this.createAuditorPriest();
    // Generic `boss` texture removed 2026-04-19 — no BOSSES config
    // referenced it, so it was dead weight. Dedicated bosses below.
    bakeProjectiles(this);

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
    bakePickups(this);
    // Ground shadows + weather + film grain live in src/art/sprites/fx/.
    bakeFx(this);
    // Environmental decoration sprites (thistle, rocks, heather, etc.).
    bakeDecorations(this);
    // HUD chrome (shield, dash pips) lives in src/art/sprites/hud/.
    bakeHud(this);
    this.createBamSeagull();
    // Weapon + upgrade-card icons — still inline, next D-phase will move
    // them into src/art/sprites/icons/.
    bakeWeaponIcons(this);
    bakeCardIcons(this);
  }

  // === Terrain decorations ===
  //
  // All seven deco_* sprites moved to `src/art/sprites/decorations/`
  // and wired via `bakeDecorations(this)` in generateAllTextures.
  // Per-sprite files live at:
  //   decorations/thistle.ts       → deco_thistle
  //   decorations/rocks.ts         → deco_rock, deco_rock_2, deco_rock_3
  //   decorations/heather.ts       → deco_heather
  //   decorations/glasgowKite.ts   → deco_glasgow_kite
  //   decorations/trafficCone.ts   → deco_cone
  //   decorations/tunnock.ts       → deco_tunnock
  //   decorations/abandonedPint.ts → deco_tennents

  private createBamSeagull(): void {
    // 36×36 — Glasgow's apex predator. Will mug you for a chip.
    // Menacing posture, beady eyes, stolen chip in beak. Pure bam energy.
    const s = 36;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // ── Wings (swept back, aggressive posture — mid-swoop) ──
    // Outer wing feathers — dark grey with distinct tips
    g.fillStyle(0x556677, 1);
    g.fillTriangle(cx - 2, cy, cx - 14, cy - 9, cx + 2, cy - 6);
    g.fillTriangle(cx - 2, cy, cx - 14, cy + 9, cx + 2, cy + 6);
    // Mid wing — lighter grey
    g.fillStyle(0x778899, 1);
    g.fillTriangle(cx, cy, cx - 10, cy - 6, cx + 1, cy - 4);
    g.fillTriangle(cx, cy, cx - 10, cy + 6, cx + 1, cy + 4);
    // Inner wing (near body) — lightest
    g.fillStyle(0x99aabb, 0.7);
    g.fillTriangle(cx, cy, cx - 6, cy - 3, cx + 1, cy - 2);
    g.fillTriangle(cx, cy, cx - 6, cy + 3, cx + 1, cy + 2);
    // Wingtip feather separation — dark fingers at end of each wing
    g.fillStyle(0x334455, 1);
    g.fillTriangle(cx - 14, cy - 9, cx - 10, cy - 6, cx - 16, cy - 7);
    g.fillTriangle(cx - 12, cy - 8, cx - 9, cy - 5, cx - 14, cy - 5);
    g.fillTriangle(cx - 14, cy + 9, cx - 10, cy + 6, cx - 16, cy + 7);
    g.fillTriangle(cx - 12, cy + 8, cx - 9, cy + 5, cx - 14, cy + 5);

    // ── Body (chunky, barrel-chested — this bird eats well) ──
    g.fillStyle(0xbbbbbb, 1);
    g.fillEllipse(cx + 2, cy, 14, 10);
    g.fillStyle(0xdddddd, 1);
    g.fillEllipse(cx + 2, cy, 12, 8);
    // White breast
    g.fillStyle(0xf5f5f5, 1);
    g.fillEllipse(cx + 1, cy - 1, 10, 6);
    // Subtle belly shadow
    g.fillStyle(0xaabbbb, 0.4);
    g.fillEllipse(cx + 2, cy + 2, 8, 3);
    // Tail feathers (stubby, fanning behind)
    g.fillStyle(0x889999, 1);
    g.fillTriangle(cx - 5, cy - 2, cx - 5, cy + 2, cx - 10, cy);
    g.fillStyle(0x778888, 1);
    g.fillTriangle(cx - 5, cy - 1, cx - 5, cy + 3, cx - 9, cy + 1);

    // ── Head (larger, rounder — the bam glare needs room) ──
    g.fillStyle(0xcccccc, 1);
    g.fillCircle(cx + 10, cy, 5.5);
    g.fillStyle(0xeeeeee, 1);
    g.fillCircle(cx + 10, cy, 5);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx + 10, cy - 0.5, 4.5);

    // ── Eye (BEADY, CALCULATING — sizing up your chippy) ──
    // Yellow iris ring
    g.fillStyle(0xeedd44, 1);
    g.fillCircle(cx + 11, cy - 1, 2);
    // Pupil — BLACK, soulless, aggressive
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx + 11.5, cy - 1, 1.2);
    // Eye glint (tiny, makes the stare more unsettling)
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx + 11, cy - 2, 0.5);
    // Furrowed brow line (angry — this seagull has INTENT)
    g.fillStyle(0x999999, 0.8);
    g.fillRect(cx + 9, cy - 3, 4, 1);

    // ── Beak (open, aggressive — mid-SQUAWK) ──
    // Upper beak — orange-yellow, hooked at tip
    g.fillStyle(0xcc8811, 1);
    g.fillTriangle(cx + 13, cy - 1, cx + 13, cy + 1, cx + 18, cy);
    g.fillStyle(0xeeaa33, 1);
    g.fillTriangle(cx + 14, cy - 0.5, cx + 14, cy + 0.5, cx + 17, cy);
    // Lower beak (slightly dropped — open mouth, screaming)
    g.fillStyle(0xcc8811, 1);
    g.fillTriangle(cx + 13, cy + 1, cx + 13, cy + 3, cx + 17, cy + 2);
    g.fillStyle(0xddaa22, 1);
    g.fillTriangle(cx + 14, cy + 1, cx + 14, cy + 2, cx + 16, cy + 2);
    // Red spot on lower beak (herring gull signature)
    g.fillStyle(0xcc2222, 1);
    g.fillCircle(cx + 15, cy + 2, 0.7);
    // Open mouth cavity (dark, screaming)
    g.fillStyle(0x442222, 1);
    g.fillRect(cx + 13, cy + 1, 3, 1);

    // ── STOLEN CHIP in beak (the whole reason Glasgow fears these) ──
    g.fillStyle(0xddaa33, 1);
    g.fillRect(cx + 16, cy - 2, 5, 2);
    g.fillStyle(0xeebb44, 1);
    g.fillRect(cx + 16, cy - 2, 4, 1);
    // Chip grease sheen
    g.fillStyle(0xffdd66, 0.5);
    g.fillRect(cx + 17, cy - 2, 2, 1);

    // ── Legs (orange-pink, webbed feet gripping) ──
    g.fillStyle(0xdd9977, 1);
    g.fillRect(cx, cy + 4, 1, 4);
    g.fillRect(cx + 3, cy + 4, 1, 4);
    // Webbed feet — splayed toes
    g.fillStyle(0xcc8866, 1);
    g.fillRect(cx - 1, cy + 7, 3, 1);
    g.fillRect(cx + 2, cy + 7, 3, 1);
    // Tiny toe detail
    g.fillStyle(0xdd9977, 0.8);
    g.fillRect(cx - 1, cy + 8, 1, 1);
    g.fillRect(cx + 4, cy + 8, 1, 1);

    g.generateTexture('bam_seagull', s, s);
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
    drawHaggisBody(g, variant, {});
    g.generateTexture(variant.textureKey, s, s);
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

    // === Legs (plain under cagoule — simplified for readability) ===
    g.fillStyle(0xee8877, 1);
    g.fillRect(cx - 7, cy + 10, 5, 8);
    g.fillRect(cx + 2, cy + 10, 5, 8);
    g.fillStyle(0x664422, 1);
    g.fillRect(cx - 8, cy + 17, 7, 2);
    g.fillRect(cx + 1, cy + 17, 7, 2);

    // === Bright blue cagoule (THE tourist silhouette — Regatta's finest) ===
    g.fillStyle(0x0e2d77, 1);
    g.fillRect(cx - 12, cy - 6, 24, 18);
    g.fillStyle(0x2255cc, 1);
    g.fillRect(cx - 11, cy - 5, 22, 16);
    // Nylon sheen highlight
    g.fillStyle(0x4477dd, 0.4);
    g.fillRect(cx - 8, cy - 4, 10, 4);
    // Zip line down center
    g.fillStyle(0x1144aa, 1);
    g.fillRect(cx, cy - 5, 1, 16);

    // === Head (SUNBURNED despite clearly overcast sky) ===
    g.fillStyle(0xcc6644, 1);
    g.fillCircle(cx, cy - 12, 9);
    g.fillStyle(0xee8866, 1);
    g.fillCircle(cx, cy - 12, 8);
    // Sunburn flush on cheeks
    g.fillStyle(0xff7755, 0.35);
    g.fillCircle(cx - 4, cy - 10, 2);
    g.fillCircle(cx + 4, cy - 10, 2);
    // Wide bewildered eyes
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 4, cy - 13, 3.5);
    g.fillCircle(cx + 4, cy - 13, 3.5);
    g.fillStyle(0x445566, 1);
    g.fillCircle(cx - 4, cy - 13, 2);
    g.fillCircle(cx + 4, cy - 13, 2);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 4, cy - 13, 0.8);
    g.fillCircle(cx + 4, cy - 13, 0.8);
    // Worried eyebrows
    g.lineStyle(1.5, 0x884422, 1);
    g.lineBetween(cx - 7, cy - 16, cx - 3, cy - 17);
    g.lineBetween(cx + 7, cy - 16, cx + 3, cy - 17);
    // Open mouth
    g.fillStyle(0x993322, 1);
    g.fillEllipse(cx, cy - 8, 3, 2);

    // === Tartan bucket hat (the tat-shop special from Buchanan Street) ===
    g.fillStyle(0x776633, 1);
    g.fillEllipse(cx, cy - 19, 22, 5);
    g.fillStyle(0xbb8855, 1);
    g.fillEllipse(cx, cy - 19, 20, 4);
    g.fillStyle(0x886644, 1);
    g.fillRect(cx - 8, cy - 24, 16, 6);
    g.fillStyle(0xbb8855, 1);
    g.fillRect(cx - 7, cy - 23, 14, 5);
    // Tartan check
    g.fillStyle(0xcc3322, 0.7);
    g.fillRect(cx - 7, cy - 21, 14, 1);
    g.fillRect(cx - 3, cy - 23, 1, 5);
    g.fillRect(cx + 3, cy - 23, 1, 5);
    // Sunburned ears poking below brim
    g.fillStyle(0xff7755, 1);
    g.fillCircle(cx - 10, cy - 16, 2);
    g.fillCircle(cx + 10, cy - 16, 2);

    // === Selfie stick + phone (the identifying prop — sticks UP above the silhouette) ===
    g.fillStyle(0x555555, 1);
    g.fillRect(cx - 14, cy - 6, 2, 18);
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 17, cy - 11, 6, 7);
    g.fillStyle(0x4488cc, 0.8);
    g.fillRect(cx - 16, cy - 10, 4, 4);
    // Screen glow
    g.fillStyle(0xffffcc, 0.25);
    g.fillCircle(cx - 14, cy - 12, 3);

    g.generateTexture('tourist', s, s);
    g.destroy();
  }

  private createChef(): void {
    const s = 48;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // === Legs (black work trousers, scuffed from the kitchen) ===
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(cx - 7, cy + 12, 5, 8);
    g.fillRect(cx + 2, cy + 12, 5, 8);
    // Trouser crease highlight
    g.fillStyle(0x222222, 0.6);
    g.fillRect(cx - 5, cy + 13, 1, 6);
    g.fillRect(cx + 4, cy + 13, 1, 6);
    // Non-slip kitchen shoes (chunky, black, oil-resistant)
    g.fillStyle(0x0a0a0a, 1);
    g.fillRect(cx - 8, cy + 18, 6, 3);
    g.fillRect(cx + 2, cy + 18, 6, 3);
    // Shoe sole edge (white rubber)
    g.fillStyle(0x444444, 1);
    g.fillRect(cx - 8, cy + 20, 6, 1);
    g.fillRect(cx + 2, cy + 20, 6, 1);

    // === Grease-splattered apron over shirt ===
    g.fillStyle(0x888877, 1);
    g.fillRect(cx - 10, cy - 4, 20, 18);
    g.fillStyle(0xddddcc, 1);
    g.fillRect(cx - 9, cy - 3, 18, 16);
    // Apron strings visible at sides (tied at back, ends peeking)
    g.fillStyle(0xccccbb, 1);
    g.fillRect(cx - 11, cy - 1, 2, 1);
    g.fillRect(cx + 9, cy - 1, 2, 1);
    // String dangling below knot at back
    g.lineStyle(1, 0xbbbbaa, 0.7);
    g.lineBetween(cx - 11, cy, cx - 12, cy + 4);
    g.lineBetween(cx + 10, cy, cx + 11, cy + 4);
    // Grease splatters (variety of sizes, ages — old and fresh)
    g.fillStyle(0xaa8833, 0.6);
    g.fillCircle(cx - 4, cy + 2, 2.5);
    g.fillCircle(cx + 5, cy + 6, 2);
    g.fillStyle(0x886622, 0.5);
    g.fillCircle(cx + 2, cy + 1, 1.5);
    g.fillCircle(cx - 6, cy + 8, 1.5);
    // Fresh red sauce splash (just happened — tomato or brown)
    g.fillStyle(0xcc4422, 0.35);
    g.fillCircle(cx - 2, cy + 5, 1);
    g.fillCircle(cx + 3, cy + 9, 0.8);
    // Apron pocket with pen and notepad edge visible
    g.fillStyle(0xbbbbaa, 1);
    g.fillRect(cx - 4, cy + 8, 8, 4);
    g.fillStyle(0xccccbb, 1);
    g.fillRect(cx - 3, cy + 8, 6, 3);
    // Pen (blue bic sticking out)
    g.fillStyle(0x2244aa, 1);
    g.fillRect(cx + 1, cy + 6, 1, 4);
    g.fillStyle(0x4466cc, 1);
    g.fillRect(cx + 1, cy + 6, 1, 1);

    // === Arms (sleeves rolled up, beefy forearms — burns and all) ===
    g.fillStyle(0xaa6644, 1);
    g.fillRect(cx - 14, cy - 2, 4, 7);
    g.fillRect(cx + 10, cy - 2, 4, 7);
    g.fillStyle(0xbb7755, 1);
    g.fillRect(cx - 13, cy - 1, 2, 5);
    g.fillRect(cx + 11, cy - 1, 2, 5);
    // Burn mark on forearm (kitchen hazard — tiny red mark)
    g.fillStyle(0xcc6644, 0.5);
    g.fillCircle(cx - 12, cy + 2, 0.7);
    // Ruddy knuckles (hands — been working hard)
    g.fillStyle(0xcc8866, 1);
    g.fillRect(cx - 14, cy + 4, 3, 2);
    g.fillRect(cx + 11, cy + 4, 3, 2);

    // === Head (ruddy, no-nonsense, been on shift since 6am) ===
    g.fillStyle(0xaa5533, 1);
    g.fillCircle(cx, cy - 10, 8);
    g.fillStyle(0xddaa88, 1);
    g.fillCircle(cx, cy - 10, 7);
    // Flushed cheeks (hot kitchen)
    g.fillStyle(0xee8866, 0.6);
    g.fillCircle(cx - 4, cy - 8, 2);
    g.fillCircle(cx + 4, cy - 8, 2);
    // Sweat bead on temple
    g.fillStyle(0xaaddff, 0.6);
    g.fillCircle(cx + 6, cy - 12, 0.8);
    // Dark eyes (tired but focused — seen a thousand orders today)
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 5, cy - 11, 4, 1.5);
    g.fillRect(cx + 1, cy - 11, 4, 1.5);
    // Under-eye shadows (bags — long shift)
    g.fillStyle(0x996644, 0.4);
    g.fillEllipse(cx - 3, cy - 9, 4, 1.5);
    g.fillEllipse(cx + 3, cy - 9, 4, 1.5);
    // Five o'clock shadow (hasn't shaved — been working)
    g.fillStyle(0x997766, 0.25);
    g.fillRect(cx - 4, cy - 7, 8, 3);
    // "Gonnae no dae that" mouth — thin, exasperated line
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
    // Handle
    g.fillStyle(0xccbb99, 1);
    g.fillRect(cx + 12, cy + 2, 2, 10);
    g.fillStyle(0xddccaa, 1);
    g.fillRect(cx + 12, cy + 3, 2, 8);
    // Tines (two prongs)
    g.fillStyle(0xddccaa, 1);
    g.fillRect(cx + 11, cy - 3, 2, 6);
    g.fillRect(cx + 14, cy - 3, 2, 6);
    g.fillStyle(0xeeddbb, 1);
    g.fillRect(cx + 11, cy - 2, 2, 4);
    g.fillRect(cx + 14, cy - 2, 2, 4);
    // === CHIP on the fork (golden, glistening, this is what it's all about) ===
    g.fillStyle(0xcc9922, 1);
    g.fillRect(cx + 10, cy - 6, 7, 4);
    g.fillStyle(0xddaa33, 1);
    g.fillRect(cx + 10, cy - 5, 7, 2);
    // Chip golden highlight
    g.fillStyle(0xeebb44, 1);
    g.fillRect(cx + 11, cy - 5, 5, 1);
    // Grease sheen on chip
    g.fillStyle(0xffdd66, 0.4);
    g.fillRect(cx + 11, cy - 6, 3, 1);
    // Chip batter crust edge (darker, crunchy)
    g.fillStyle(0xaa7711, 1);
    g.fillRect(cx + 10, cy - 3, 7, 1);

    // === Steam wisps (thicker — it's fresh from the fryer) ===
    g.fillStyle(0xcccccc, 0.4);
    g.fillCircle(cx - 6, cy - 20, 2.5);
    g.fillCircle(cx + 2, cy - 23, 3);
    g.fillCircle(cx + 7, cy - 19, 2.5);
    g.fillStyle(0xdddddd, 0.3);
    g.fillCircle(cx - 4, cy - 22, 2);
    g.fillCircle(cx + 4, cy - 21, 1.8);
    // Rising heat haze (barely visible shimmer above steam)
    g.fillStyle(0xeeeeee, 0.15);
    g.fillCircle(cx, cy - 25, 3);

    g.generateTexture('chef', s, s);
    g.destroy();
  }

  private createMidge(): void {
    const s = 32;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 1;

    // Reduced motion-blur halo (half alpha — reads as single insect, not swarm)
    g.fillStyle(0x333344, 0.15);
    g.fillCircle(cx, cy, 10);

    // ── Wings — two defined translucent ovals with visible leading edge ──
    // Left wing
    g.fillStyle(0xccddee, 0.4);
    g.fillEllipse(cx - 6, cy - 4, 10, 5);
    g.lineStyle(0.8, 0x8899aa, 0.6);
    g.lineBetween(cx - 10, cy - 5, cx - 2, cy - 3);
    // Right wing
    g.fillStyle(0xccddee, 0.4);
    g.fillEllipse(cx + 6, cy - 4, 10, 5);
    g.lineStyle(0.8, 0x8899aa, 0.6);
    g.lineBetween(cx + 2, cy - 3, cx + 10, cy - 5);

    // Body — chunky little oval, dark outline first
    g.fillStyle(0x1a1a22, 1);
    g.fillEllipse(cx, cy + 1, 12, 9);
    g.fillStyle(0x332a1a, 1);
    g.fillEllipse(cx, cy, 10, 7);
    // Abdomen segments (horizontal stripes)
    g.fillStyle(0x1a1a22, 0.7);
    g.fillRect(cx - 4, cy, 8, 1);
    g.fillRect(cx - 4, cy + 2, 8, 1);
    // Abdomen highlight
    g.fillStyle(0x5a4428, 1);
    g.fillCircle(cx - 1, cy - 1, 2);

    // Head — small dark bulb at the front
    g.fillStyle(0x0a0a11, 1);
    g.fillCircle(cx, cy - 4, 3);
    // Giant buggy compound eyes (red) — the iconic midge tell
    g.fillStyle(0xcc2244, 1);
    g.fillCircle(cx - 2, cy - 5, 1.5);
    g.fillCircle(cx + 2, cy - 5, 1.5);
    g.fillStyle(0xff6688, 1);
    g.fillCircle(cx - 2, cy - 5, 0.7);
    g.fillCircle(cx + 2, cy - 5, 0.7);

    // Proboscis
    g.fillStyle(0x0a0a11, 1);
    g.fillRect(cx, cy - 7, 1, 2);

    // ── Six distinct legs — three per side, visibly separated ──
    g.lineStyle(1, 0x0a0a11, 1);
    // Left side: front, mid, rear — each with clear separation
    g.lineBetween(cx - 4, cy + 3, cx - 8, cy + 7);   // front left
    g.lineBetween(cx - 3, cy + 4, cx - 6, cy + 10);  // mid left
    g.lineBetween(cx - 2, cy + 5, cx - 4, cy + 11);  // rear left
    // Right side: mirror
    g.lineBetween(cx + 4, cy + 3, cx + 8, cy + 7);   // front right
    g.lineBetween(cx + 3, cy + 4, cx + 6, cy + 10);  // mid right
    g.lineBetween(cx + 2, cy + 5, cx + 4, cy + 11);  // rear right

    // Thorax highlight
    g.fillStyle(0x5a4428, 0.9);
    g.fillCircle(cx, cy - 2, 1);

    g.generateTexture('midge', s, s);
    g.destroy();
  }

  private createHighlandCow(): void {
    const s = 64;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // ── Body outline ──
    g.fillStyle(0x3a1e08, 1);
    g.fillEllipse(cx, cy + 4, 46, 30);
    // Big shaggy brown body
    g.fillStyle(0x8b4513, 1);
    g.fillEllipse(cx, cy + 3, 42, 26);
    // Lighter mid-layer (warm reddish-brown — Highland breed colour)
    g.fillStyle(0xa0522d, 0.7);
    g.fillEllipse(cx - 3, cy + 1, 34, 22);
    // Belly sag (heavier at the bottom — these are stocky beasts)
    g.fillStyle(0x6a3010, 0.4);
    g.fillEllipse(cx, cy + 10, 30, 10);
    // Shaggy fur tufts at body edges (not smooth — wild and wind-blown)
    g.fillStyle(0x8b4513, 1);
    g.fillCircle(cx - 16, cy + 2, 4);
    g.fillCircle(cx + 16, cy + 3, 4);
    g.fillCircle(cx - 12, cy + 10, 3);
    g.fillCircle(cx + 12, cy + 10, 3);
    g.fillCircle(cx - 18, cy + 6, 3);
    g.fillCircle(cx + 18, cy + 5, 3);
    // Back ridge highlight (spine catches the light)
    g.fillStyle(0xbb6a30, 0.4);
    g.fillEllipse(cx, cy - 4, 28, 5);

    // ── Legs (chunky, furry at the top) ──
    g.fillStyle(0x3a1e08, 1);
    g.fillRect(cx - 13, cy + 14, 5, 10);
    g.fillRect(cx - 5, cy + 14, 5, 10);
    g.fillRect(cx + 2, cy + 14, 5, 10);
    g.fillRect(cx + 10, cy + 14, 5, 10);
    // Fur feathering at leg tops
    g.fillStyle(0x7a3810, 0.6);
    g.fillCircle(cx - 11, cy + 14, 3);
    g.fillCircle(cx - 3, cy + 14, 3);
    g.fillCircle(cx + 4, cy + 14, 3);
    g.fillCircle(cx + 12, cy + 14, 3);
    // Hooves — dark, cloven
    g.fillStyle(0x0a0a0a, 1);
    g.fillRect(cx - 13, cy + 22, 5, 3);
    g.fillRect(cx - 5, cy + 22, 5, 3);
    g.fillRect(cx + 2, cy + 22, 5, 3);
    g.fillRect(cx + 10, cy + 22, 5, 3);
    // Hoof split (cloven detail)
    g.fillStyle(0x3a1e08, 0.5);
    g.fillRect(cx - 11, cy + 22, 1, 3);
    g.fillRect(cx - 3, cy + 22, 1, 3);
    g.fillRect(cx + 4, cy + 22, 1, 3);
    g.fillRect(cx + 12, cy + 22, 1, 3);

    // ── Head ──
    g.fillStyle(0x3a1e08, 1);
    g.fillCircle(cx, cy - 10, 13);
    g.fillStyle(0x8b4513, 1);
    g.fillCircle(cx, cy - 10, 12);

    // ── Ears (visible beside horns — pink inner ear) ──
    g.fillStyle(0x6a3010, 1);
    g.fillTriangle(cx - 12, cy - 14, cx - 8, cy - 10, cx - 14, cy - 10);
    g.fillTriangle(cx + 12, cy - 14, cx + 8, cy - 10, cx + 14, cy - 10);
    // Pink inner ear (warm — healthy beast)
    g.fillStyle(0xdd9988, 0.6);
    g.fillTriangle(cx - 12, cy - 13, cx - 9, cy - 11, cx - 13, cy - 11);
    g.fillTriangle(cx + 12, cy - 13, cx + 9, cy - 11, cx + 13, cy - 11);

    // ── Iconic: massive shaggy fringe (covers eyes completely) ──
    g.fillStyle(0xccaa77, 1);
    g.fillRect(cx - 14, cy - 18, 28, 10);
    // Darker fringe depth layer underneath
    g.fillStyle(0x8b6633, 0.7);
    g.fillRect(cx - 13, cy - 12, 26, 4);
    // Stringy bits of fringe (varied thickness, natural)
    g.fillStyle(0xa0522d, 1);
    for (let i = 0; i < 7; i++) {
      const fx = cx - 12 + i * 4;
      const len = 4 + (i % 3);
      g.fillRect(fx, cy - 10, 2, len);
    }
    // Lighter individual hair strands over the top
    g.fillStyle(0xddbb88, 0.8);
    for (let i = 0; i < 8; i++) {
      const fx = cx - 13 + i * 3.5;
      const len = 3 + (i % 4);
      g.fillRect(fx, cy - 9, 1, len);
    }
    // Windswept strand going sideways (it's always windy on the moor)
    g.fillStyle(0xccaa77, 0.7);
    g.fillRect(cx + 13, cy - 14, 3, 1);
    g.fillRect(cx + 14, cy - 13, 2, 1);

    // ── Iconic: huge curved horns (with growth rings) ──
    g.fillStyle(0x1a0a00, 1);
    g.fillTriangle(cx - 16, cy - 16, cx - 8, cy - 12, cx - 22, cy - 8);
    g.fillTriangle(cx + 16, cy - 16, cx + 8, cy - 12, cx + 22, cy - 8);
    g.fillStyle(0xbbaa66, 1);
    g.fillTriangle(cx - 15, cy - 15, cx - 9, cy - 12, cx - 20, cy - 9);
    g.fillTriangle(cx + 15, cy - 15, cx + 9, cy - 12, cx + 20, cy - 9);
    // Horn tip highlight (lighter, polished)
    g.fillStyle(0xddcc88, 0.7);
    g.fillCircle(cx - 19, cy - 9, 1.5);
    g.fillCircle(cx + 19, cy - 9, 1.5);
    // Growth rings (subtle darker bands — shows age)
    g.fillStyle(0x887744, 0.4);
    g.fillRect(cx - 14, cy - 13, 3, 1);
    g.fillRect(cx + 11, cy - 13, 3, 1);

    // ── Snout (wet, pink, expressive) ──
    g.fillStyle(0x3a1e08, 1);
    g.fillCircle(cx, cy - 4, 5.5);
    g.fillStyle(0xd4956b, 1);
    g.fillCircle(cx, cy - 4, 4.5);
    // Muzzle highlight (moist — healthy)
    g.fillStyle(0xddaa88, 0.5);
    g.fillCircle(cx - 1, cy - 5, 2);
    // Nostrils (bigger, flared — heavy breathing)
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 2, cy - 3, 1);
    g.fillCircle(cx + 2, cy - 3, 1);
    // Dewdrop on nostril (THE Highland detail — it's always damp)
    g.fillStyle(0xccddee, 0.6);
    g.fillCircle(cx - 2, cy - 2, 0.7);

    // ── Nostril steam (it's cauld out) ──
    g.fillStyle(0xcccccc, 0.35);
    g.fillCircle(cx - 3, cy - 1, 2);
    g.fillCircle(cx + 3, cy - 1, 2);
    g.fillStyle(0xdddddd, 0.2);
    g.fillCircle(cx - 4, cy - 2, 1.5);
    g.fillCircle(cx + 5, cy - 2, 1.5);
    // Second breath plume (lingering in cold air)
    g.fillStyle(0xeeeeee, 0.12);
    g.fillCircle(cx - 5, cy - 3, 1.5);
    g.fillCircle(cx + 6, cy - 3, 1.5);

    // ── Mouth hint (chewing cud — it's what coos do) ──
    g.fillStyle(0x3a1e08, 0.5);
    g.fillRect(cx - 2, cy - 1, 4, 1);

    // ── Mud on hooves and lower legs (been in the field all winter) ──
    g.fillStyle(0x3a2a0a, 0.6);
    g.fillCircle(cx - 11, cy + 23, 2.5);
    g.fillCircle(cx + 4, cy + 23, 2.5);
    g.fillCircle(cx - 3, cy + 22, 1.5);
    g.fillCircle(cx + 12, cy + 22, 1.5);
    // Mud splash up the leg
    g.fillStyle(0x4a3a10, 0.3);
    g.fillCircle(cx - 12, cy + 20, 1);
    g.fillCircle(cx + 11, cy + 19, 1);

    // ── Tail tuft (swishing — long-haired, catches the wind) ──
    g.fillStyle(0x6a3010, 1);
    g.fillTriangle(cx - 20, cy + 2, cx - 22, cy + 8, cx - 18, cy + 6);
    g.fillStyle(0x8b4513, 0.8);
    g.fillTriangle(cx - 20, cy + 3, cx - 21, cy + 7, cx - 18, cy + 5);

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
  /** Golden eagle — Scotland's national bird. Broad wingspan, hooked beak,
   *  fierce amber eye, layered flight feathers with individual primary tips.
   *  Faces RIGHT (Phaser +X at rotation 0) so it flies forward. */
  private createEagle(): void {
    const s = 56;  // up from 48 — eagle should dominate the seagull
    const g = this.add.graphics();
    const cx = s / 2 - 2, cy = s / 2;

    // ── Wings — broad sweep reaching near canvas edges (~2px margin) ──
    // Outer wing (darkest — primary feathers)
    g.fillStyle(0x1a1208, 1);
    g.fillTriangle(cx - 2, cy, cx - 10, cy - 24, cx + 7, cy - 17);
    g.fillTriangle(cx - 2, cy, cx - 10, cy + 24, cx + 7, cy + 17);
    // Mid wing coverts (warm brown)
    g.fillStyle(0x3a2a14, 1);
    g.fillTriangle(cx, cy, cx - 6, cy - 18, cx + 5, cy - 13);
    g.fillTriangle(cx, cy, cx - 6, cy + 18, cx + 5, cy + 13);
    // Inner wing highlight (golden-brown scapulars)
    g.fillStyle(0x5a4020, 1);
    g.fillTriangle(cx + 1, cy, cx - 3, cy - 12, cx + 4, cy - 10);
    g.fillTriangle(cx + 1, cy, cx - 3, cy + 12, cx + 4, cy + 10);
    // Individual primary feather tips — separated fingers at wingtips
    g.fillStyle(0x0e0a04, 1);
    g.fillTriangle(cx - 10, cy - 24, cx - 5, cy - 19, cx - 13, cy - 20);
    g.fillTriangle(cx - 8, cy - 22, cx - 4, cy - 17, cx - 11, cy - 17);
    g.fillTriangle(cx - 5, cy - 20, cx - 1, cy - 15, cx - 8, cy - 15);
    g.fillTriangle(cx - 10, cy + 24, cx - 5, cy + 19, cx - 13, cy + 20);
    g.fillTriangle(cx - 8, cy + 22, cx - 4, cy + 17, cx - 11, cy + 17);
    g.fillTriangle(cx - 5, cy + 20, cx - 1, cy + 15, cx - 8, cy + 15);
    // Feather barring detail
    g.fillStyle(0x4a3818, 0.5);
    g.fillRect(cx - 5, cy - 14, 7, 1);
    g.fillRect(cx - 5, cy + 13, 7, 1);
    g.fillRect(cx - 3, cy - 11, 5, 1);
    g.fillRect(cx - 3, cy + 10, 5, 1);

    // ── Body — barrel-shaped, thicker (+2px each side) ──
    g.fillStyle(0x1a1208, 1);
    g.fillEllipse(cx, cy, 20, 13);
    g.fillStyle(0x3a2a14, 1);
    g.fillEllipse(cx, cy, 18, 11);
    // Breast
    g.fillStyle(0x5a4828, 0.7);
    g.fillEllipse(cx - 1, cy + 1, 12, 8);
    // Back feather sheen
    g.fillStyle(0x6a5030, 0.4);
    g.fillEllipse(cx, cy - 2, 12, 5);

    // ── Tail — broad, fanned, banded ──
    g.fillStyle(0x1a1208, 1);
    g.fillTriangle(cx - 8, cy - 5, cx - 8, cy + 5, cx - 17, cy);
    g.fillStyle(0x2a1a0c, 1);
    g.fillTriangle(cx - 8, cy - 4, cx - 8, cy + 4, cx - 16, cy);
    g.fillStyle(0x4a3818, 0.6);
    g.fillRect(cx - 14, cy - 1, 5, 2);

    // ── Head — golden-brown nape ──
    g.fillStyle(0x1a1208, 1);
    g.fillCircle(cx + 11, cy, 7);
    g.fillStyle(0x5a4020, 1);
    g.fillCircle(cx + 11, cy, 6);
    g.fillStyle(0x8a7040, 1);
    g.fillCircle(cx + 10, cy - 2, 4);
    g.fillStyle(0xaa8850, 0.7);
    g.fillCircle(cx + 9, cy - 3, 2.5);

    // ── Beak — massive, hooked ──
    g.fillStyle(0xccaa22, 1);
    g.fillCircle(cx + 16, cy, 2);
    g.fillStyle(0x1a1800, 1);
    g.fillTriangle(cx + 16, cy - 2, cx + 16, cy + 1, cx + 23, cy);
    g.fillStyle(0x444422, 1);
    g.fillTriangle(cx + 17, cy - 1, cx + 17, cy + 0.5, cx + 22, cy);
    g.fillStyle(0x0a0800, 1);
    g.fillCircle(cx + 22, cy + 0.5, 1.2);
    g.fillStyle(0x333322, 1);
    g.fillTriangle(cx + 16, cy + 1, cx + 16, cy + 3, cx + 20, cy + 2);

    // ── Eye — fierce amber, with heavy brow ridge ──
    g.fillStyle(0x2a1a0c, 1);
    g.fillRect(cx + 9, cy - 4, 5, 1);
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx + 12, cy - 1, 2.5);
    g.fillStyle(0xddaa00, 1);
    g.fillCircle(cx + 12, cy - 1, 1.8);
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx + 12, cy - 1, 0.7);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx + 12, cy - 2, 0.7);

    // ── Talons — powerful ──
    g.fillStyle(0x333322, 1);
    g.fillRect(cx - 2, cy + 5, 2, 5);
    g.fillRect(cx + 3, cy + 5, 2, 5);
    g.fillStyle(0x0a0800, 1);
    g.fillRect(cx - 3, cy + 9, 1, 2);
    g.fillRect(cx, cy + 9, 1, 2);
    g.fillRect(cx + 2, cy + 9, 1, 2);
    g.fillRect(cx + 5, cy + 9, 1, 2);
    g.fillStyle(0x3a2a14, 0.6);
    g.fillCircle(cx - 1, cy + 5, 2.5);
    g.fillCircle(cx + 4, cy + 5, 2.5);

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

    // === Wax Barbour jacket (the £300 uniform of the rural obsessive) ===
    g.fillStyle(0x1a2a11, 1);
    g.fillRect(cx - 12, cy - 6, 24, 18);
    g.fillStyle(0x2d4a22, 1);
    g.fillRect(cx - 11, cy - 5, 22, 16);
    // Wax sheen (oiled cotton catches light — subtle left highlight)
    g.fillStyle(0x3a5a2a, 0.5);
    g.fillRect(cx - 10, cy - 4, 8, 4);
    // Corduroy collar (brown, popped against the wind)
    g.fillStyle(0x664422, 1);
    g.fillRect(cx - 8, cy - 7, 16, 2);
    g.fillStyle(0x775533, 1);
    g.fillRect(cx - 7, cy - 7, 14, 1);
    // Deep pockets (handwarmer and game pockets)
    g.fillStyle(0x1a3311, 1);
    g.fillRect(cx - 10, cy + 2, 8, 4);
    g.fillRect(cx + 2, cy + 2, 8, 4);
    // Brass popper buttons
    g.fillStyle(0x886633, 1);
    g.fillCircle(cx - 6, cy + 3, 0.8);
    g.fillCircle(cx + 6, cy + 3, 0.8);
    g.fillStyle(0xaa8844, 0.6);
    g.fillCircle(cx - 6, cy + 3, 0.4);
    g.fillCircle(cx + 6, cy + 3, 0.4);
    // Rain beading on wax jacket (the whole point of the wax!)
    g.fillStyle(0xaaddee, 0.4);
    g.fillCircle(cx - 8, cy - 2, 0.7);
    g.fillCircle(cx + 5, cy + 1, 0.6);
    g.fillCircle(cx - 3, cy + 5, 0.6);
    g.fillCircle(cx + 8, cy - 3, 0.5);
    // Thermos flask peeking from inside pocket (green, tartan)
    g.fillStyle(0x225522, 1);
    g.fillRect(cx - 10, cy - 1, 3, 4);
    g.fillStyle(0x337733, 1);
    g.fillRect(cx - 10, cy, 3, 2);
    // Tartan band on thermos
    g.fillStyle(0xcc3322, 0.6);
    g.fillRect(cx - 10, cy + 1, 3, 1);

    // === Binoculars around neck (Swarovski — he takes this seriously) ===
    g.fillStyle(0x0a0a0a, 1);
    g.fillCircle(cx - 3, cy - 1, 2.5);
    g.fillCircle(cx + 3, cy - 1, 2.5);
    g.fillStyle(0x222222, 1);
    g.fillCircle(cx - 3, cy - 1, 2);
    g.fillCircle(cx + 3, cy - 1, 2);
    // Bridge connecting barrels
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 1, cy - 2, 2, 1);
    // Lens glass (blue-coated, glinting)
    g.fillStyle(0x88ccff, 0.7);
    g.fillCircle(cx - 3, cy - 2, 0.8);
    g.fillCircle(cx + 3, cy - 2, 0.8);
    // Neckstrap
    g.lineStyle(1, 0x333322, 0.8);
    g.lineBetween(cx - 3, cy - 3, cx - 4, cy - 6);
    g.lineBetween(cx + 3, cy - 3, cx + 4, cy - 6);

    // === Head (weather-beaten, wind-burned, deeply determined) ===
    g.fillStyle(0x885533, 1);
    g.fillCircle(cx, cy - 12, 8);
    g.fillStyle(0xddaa77, 1);
    g.fillCircle(cx, cy - 12, 7);
    // Wind-burned cheeks (raw red from years on the moor)
    g.fillStyle(0xcc7755, 0.5);
    g.fillCircle(cx - 4, cy - 10, 2.5);
    g.fillCircle(cx + 4, cy - 10, 2.5);
    // Crow's feet wrinkles (squinting into the wind for decades)
    g.lineStyle(0.6, 0xaa7744, 0.5);
    g.lineBetween(cx - 7, cy - 13, cx - 8, cy - 14);
    g.lineBetween(cx - 7, cy - 12, cx - 8, cy - 12);
    g.lineBetween(cx + 7, cy - 13, cx + 8, cy - 14);
    g.lineBetween(cx + 7, cy - 12, cx + 8, cy - 12);
    // Narrowed determined eyes (scanning for haggis)
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 5, cy - 13, 3, 1.5);
    g.fillRect(cx + 2, cy - 13, 3, 1.5);
    // Furrowed brow (concentration)
    g.lineStyle(0.8, 0xaa7744, 0.6);
    g.lineBetween(cx - 6, cy - 14, cx - 3, cy - 15);
    g.lineBetween(cx + 6, cy - 14, cx + 3, cy - 15);
    // Ruddy nose (gin blossoms — cold weather + whisky)
    g.fillStyle(0xdd8866, 0.4);
    g.fillCircle(cx, cy - 10, 1.5);
    // Stubbled jaw (hasn't been home in days — obsessive)
    g.fillStyle(0x887766, 0.25);
    g.fillRect(cx - 4, cy - 9, 8, 3);
    // Set jaw (thin-lipped determination)
    g.fillStyle(0x554433, 0.7);
    g.fillRect(cx - 3, cy - 8, 6, 1);

    // === Flat cap (proper Harris Tweed) ===
    g.fillStyle(0x3a3322, 1);
    g.fillRect(cx - 10, cy - 20, 20, 6);
    g.fillStyle(0x5a5533, 1);
    g.fillRect(cx - 9, cy - 19, 18, 4);
    // Tweed fleck pattern (tiny dots of colour in the weave)
    g.fillStyle(0x4a4422, 0.7);
    g.fillCircle(cx - 5, cy - 18, 0.5);
    g.fillCircle(cx + 2, cy - 17, 0.5);
    g.fillCircle(cx + 6, cy - 18, 0.5);
    g.fillStyle(0x665544, 0.4);
    g.fillCircle(cx - 2, cy - 18, 0.5);
    g.fillCircle(cx + 4, cy - 17, 0.5);
    // Peak (stiff, forward-pointing)
    g.fillStyle(0x3a3322, 1);
    g.fillRect(cx - 12, cy - 15, 14, 2);
    g.fillStyle(0x4a4433, 0.7);
    g.fillRect(cx - 11, cy - 15, 12, 1);
    // Rain bead on peak
    g.fillStyle(0xaaddee, 0.35);
    g.fillCircle(cx - 8, cy - 15, 0.5);

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

    // === Royal Stewart tartan kilt (THE kilt — bold, proud, swinging) ===
    g.fillStyle(0x771111, 1);
    g.fillRect(cx - 13, cy + 1, 26, 14);
    g.fillStyle(0xcc2222, 1);
    g.fillRect(cx - 12, cy + 2, 24, 12);
    // Green sett lines (horizontal + vertical)
    g.fillStyle(0x114411, 0.8);
    g.fillRect(cx - 12, cy + 4, 24, 2);
    g.fillRect(cx - 12, cy + 10, 24, 2);
    g.fillRect(cx - 8, cy + 2, 2, 12);
    g.fillRect(cx + 2, cy + 2, 2, 12);
    // Blue overchecks
    g.fillStyle(0x2244aa, 0.7);
    g.fillRect(cx - 12, cy + 7, 24, 1);
    g.fillRect(cx - 3, cy + 2, 1, 12);
    g.fillRect(cx + 7, cy + 2, 1, 12);
    // White guard lines
    g.fillStyle(0xffffff, 0.4);
    g.fillRect(cx - 12, cy + 3, 24, 1);
    g.fillRect(cx - 12, cy + 12, 24, 1);
    // Kilt pleats shadow (right side — back pleats visible at the side)
    g.fillStyle(0x991111, 0.5);
    g.fillRect(cx + 10, cy + 2, 1, 12);
    g.fillRect(cx + 12, cy + 2, 1, 12);
    // Kilt swinging motion shadow (bottom edge — it's swinging as he charges)
    g.fillStyle(0x661111, 0.4);
    g.fillRect(cx - 12, cy + 13, 24, 1);
    // Kilt pin (safety pin with clan crest — ornate)
    g.fillStyle(0xbbbbbb, 1);
    g.fillCircle(cx + 9, cy + 8, 1.2);
    g.fillStyle(0xeeeeee, 1);
    g.fillCircle(cx + 9, cy + 8, 0.6);
    // Pin shaft
    g.fillStyle(0xcccccc, 0.8);
    g.fillRect(cx + 9, cy + 9, 1, 3);

    // === Bare barrel chest (Groundskeeper Willie physique — HENCH) ===
    g.fillStyle(0xaa5533, 1);
    g.fillRect(cx - 14, cy - 9, 28, 12);
    g.fillStyle(0xddbb99, 1);
    g.fillRect(cx - 13, cy - 8, 26, 10);
    // Pec definition (this man does NOT skip chest day)
    g.fillStyle(0xccaa88, 0.4);
    g.fillEllipse(cx - 5, cy - 4, 8, 6);
    g.fillEllipse(cx + 5, cy - 4, 8, 6);
    // Sunburn / flush V-shape on chest
    g.fillStyle(0xee6644, 0.5);
    g.fillTriangle(cx - 8, cy - 8, cx + 8, cy - 8, cx, cy - 3);
    // CHEST HAIR (ginger, dense — the Willie special)
    g.fillStyle(0x883311, 0.5);
    g.fillCircle(cx - 3, cy - 4, 2);
    g.fillCircle(cx + 3, cy - 3, 2);
    g.fillCircle(cx, cy - 5, 1.5);
    g.fillCircle(cx - 1, cy - 2, 1);
    g.fillCircle(cx + 5, cy - 5, 1);
    g.fillCircle(cx - 5, cy - 5, 1);
    // Happy trail down to kilt
    g.fillStyle(0x883311, 0.4);
    g.fillRect(cx - 1, cy - 2, 2, 3);
    // Visible veins on arms (RAGING — blood pressure through the roof)
    g.fillStyle(0xcc8866, 0.4);
    g.lineStyle(0.7, 0xcc7755, 0.5);
    g.lineBetween(cx - 12, cy - 6, cx - 14, cy - 3);
    g.lineBetween(cx + 12, cy - 6, cx + 14, cy - 3);
    // Sweat beads on chest (he's working himself into a frenzy)
    g.fillStyle(0xaaddee, 0.3);
    g.fillCircle(cx + 6, cy - 6, 0.6);
    g.fillCircle(cx - 8, cy - 3, 0.5);

    // === Head (thick neck, pure FURY) ===
    // Neck (thick — veins visible)
    g.fillStyle(0xcc6644, 1);
    g.fillRect(cx - 5, cy - 10, 10, 4);
    g.fillStyle(0xdd8866, 1);
    g.fillRect(cx - 4, cy - 9, 8, 3);
    // Neck vein (pulsing with rage)
    g.lineStyle(0.6, 0xcc5544, 0.5);
    g.lineBetween(cx - 3, cy - 10, cx - 4, cy - 7);
    g.lineBetween(cx + 3, cy - 10, cx + 4, cy - 7);
    // Head (round, red, PURPLE with fury)
    g.fillStyle(0xaa5533, 1);
    g.fillCircle(cx, cy - 15, 10);
    g.fillStyle(0xdd8866, 1);
    g.fillCircle(cx, cy - 15, 9);
    // Rage flush (face going beetroot)
    g.fillStyle(0xee7755, 0.45);
    g.fillCircle(cx, cy - 14, 7);
    // Forehead veins (bursting with rage — like Gordon but rawer)
    g.lineStyle(0.8, 0xcc5533, 0.7);
    g.lineBetween(cx - 4, cy - 22, cx - 6, cy - 19);
    g.lineBetween(cx + 3, cy - 23, cx + 5, cy - 20);

    // === MASSIVE red beard (magnificent, wild, untamed) ===
    g.fillStyle(0x661100, 1);
    g.fillEllipse(cx, cy - 8, 20, 12);
    g.fillStyle(0xaa2a11, 1);
    g.fillEllipse(cx, cy - 8, 18, 10);
    g.fillStyle(0xcc4422, 1);
    g.fillEllipse(cx, cy - 9, 16, 8);
    // Lighter beard highlight (catches the light)
    g.fillStyle(0xdd5522, 0.6);
    g.fillEllipse(cx - 2, cy - 10, 10, 5);
    // Beard strands (wild, individual locks visible)
    g.fillStyle(0x881100, 1);
    g.fillRect(cx - 7, cy - 3, 2, 4);
    g.fillRect(cx - 3, cy - 2, 2, 5);
    g.fillRect(cx + 1, cy - 3, 2, 4);
    g.fillRect(cx + 5, cy - 2, 2, 5);
    // Braided strand or bead in beard (Viking touch)
    g.fillStyle(0x992211, 1);
    g.fillRect(cx, cy - 1, 2, 3);
    g.fillStyle(0xddaa00, 1);
    g.fillCircle(cx + 1, cy + 2, 1);
    g.fillStyle(0xffcc33, 0.6);
    g.fillCircle(cx + 1, cy + 2, 0.5);

    // === Furious eyebrows (MASSIVE, slammed down over the eyes) ===
    g.fillStyle(0x661100, 1);
    g.fillTriangle(cx - 9, cy - 19, cx - 2, cy - 17, cx - 2, cy - 19);
    g.fillTriangle(cx + 9, cy - 19, cx + 2, cy - 17, cx + 2, cy - 19);
    // Brow ridge shadow (deep-set rage eyes)
    g.fillStyle(0x993311, 0.4);
    g.fillRect(cx - 7, cy - 17, 14, 1);

    // === Eyes (tiny, narrowed, ABSOLUTELY RAGING) ===
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 4, cy - 16, 2);
    g.fillCircle(cx + 4, cy - 16, 2);
    // Bloodshot (red veins in eye whites)
    g.fillStyle(0xff6644, 0.3);
    g.fillCircle(cx - 4, cy - 16, 2);
    g.fillCircle(cx + 4, cy - 16, 2);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 4, cy - 16, 1);
    g.fillCircle(cx + 4, cy - 16, 1);

    // === SPITTLE (he's screaming — flecks of spit flying) ===
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(cx + 8, cy - 8, 0.6);
    g.fillCircle(cx + 10, cy - 10, 0.5);
    g.fillCircle(cx + 6, cy - 6, 0.4);

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

  /** Ned — Glesga's finest. Shiny shell suit, Burberry cap tilted at 45°,
   *  white socks pulled high, trainers, pure menace. Fast flanking enemy.
   *  Texture key kept as 'kelpie' for data compatibility. */
  private createKelpie(): void {
    const s = 48;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // ── White trainers ──
    g.fillStyle(0xcccccc, 1);
    g.fillRect(cx - 9, cy + 16, 7, 4);
    g.fillRect(cx + 2, cy + 16, 7, 4);
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(cx - 8, cy + 17, 5, 2);
    g.fillRect(cx + 3, cy + 17, 5, 2);
    // Trainer stripes
    g.fillStyle(0x2244cc, 1);
    g.fillRect(cx - 7, cy + 17, 1, 2);
    g.fillRect(cx + 5, cy + 17, 1, 2);

    // ── White socks pulled HIGH (the classic ned look) ──
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(cx - 7, cy + 10, 5, 7);
    g.fillRect(cx + 3, cy + 10, 5, 7);
    g.fillStyle(0xdddddd, 1);
    // Sock ribbing
    g.fillRect(cx - 7, cy + 11, 5, 1);
    g.fillRect(cx - 7, cy + 13, 5, 1);
    g.fillRect(cx + 3, cy + 11, 5, 1);
    g.fillRect(cx + 3, cy + 13, 5, 1);

    // ── Shell suit trousers — shiny blue with white stripe ──
    g.fillStyle(0x1133aa, 1);
    g.fillRect(cx - 8, cy + 4, 6, 8);
    g.fillRect(cx + 2, cy + 4, 6, 8);
    g.fillStyle(0x2255cc, 1);
    g.fillRect(cx - 7, cy + 5, 4, 6);
    g.fillRect(cx + 3, cy + 5, 4, 6);
    // White side stripe (the iconic tracksuit stripe)
    g.fillStyle(0xeeeeee, 0.8);
    g.fillRect(cx - 8, cy + 5, 1, 6);
    g.fillRect(cx + 7, cy + 5, 1, 6);
    // Sheen highlight (shiny synthetic material)
    g.fillStyle(0x4477dd, 0.4);
    g.fillRect(cx - 6, cy + 6, 2, 4);
    g.fillRect(cx + 4, cy + 6, 2, 4);

    // ── Shell suit jacket — same shiny blue, zip front ──
    g.fillStyle(0x0e2888, 1);
    g.fillRect(cx - 10, cy - 8, 20, 14);
    g.fillStyle(0x1133aa, 1);
    g.fillRect(cx - 9, cy - 7, 18, 12);
    g.fillStyle(0x2255cc, 1);
    g.fillRect(cx - 8, cy - 6, 16, 10);
    // Jacket sheen
    g.fillStyle(0x4477ee, 0.3);
    g.fillRect(cx - 6, cy - 5, 6, 8);
    // White side stripes on jacket
    g.fillStyle(0xeeeeee, 0.8);
    g.fillRect(cx - 10, cy - 7, 1, 12);
    g.fillRect(cx + 9, cy - 7, 1, 12);
    // Zip line (centre)
    g.fillStyle(0xaaaaaa, 0.7);
    g.fillRect(cx, cy - 6, 1, 10);
    // Zip pull
    g.fillStyle(0xcccccc, 1);
    g.fillRect(cx - 1, cy - 2, 2, 2);
    // Collar — popped up (of course)
    g.fillStyle(0x0e2888, 1);
    g.fillRect(cx - 8, cy - 10, 16, 3);
    g.fillStyle(0x1133aa, 1);
    g.fillRect(cx - 7, cy - 9, 14, 2);

    // ── Gold chain (visible at neckline — THE ned accessory) ──
    g.fillStyle(0xddaa00, 0.8);
    g.lineStyle(1, 0xccaa00, 0.9);
    g.lineBetween(cx - 5, cy - 8, cx - 2, cy - 6);
    g.lineBetween(cx - 2, cy - 6, cx + 2, cy - 6);
    g.lineBetween(cx + 2, cy - 6, cx + 5, cy - 8);
    // Chain pendant (Sovereign coin or cross — tiny gold dot)
    g.fillStyle(0xddaa00, 1);
    g.fillCircle(cx, cy - 5, 1.2);
    g.fillStyle(0xffcc33, 0.7);
    g.fillCircle(cx, cy - 5, 0.6);

    // ── Arms (one in pocket, one gesturing "come ahead") ──
    g.fillStyle(0x1133aa, 1);
    g.fillRect(cx - 13, cy - 4, 4, 8);
    g.fillRect(cx + 9, cy - 4, 4, 8);
    // Skin-colour hands
    g.fillStyle(0xddaa88, 1);
    g.fillRect(cx - 13, cy + 3, 3, 3);
    g.fillRect(cx + 10, cy + 3, 3, 3);
    // SOVEREIGN RING on right hand (massive gold ring — the ned signet)
    g.fillStyle(0xddaa00, 1);
    g.fillCircle(cx + 12, cy + 4, 1.5);
    g.fillStyle(0xffcc33, 1);
    g.fillCircle(cx + 12, cy + 4, 0.8);

    // ── Head ──
    g.fillStyle(0xcc9966, 1);
    g.fillCircle(cx, cy - 14, 8);
    g.fillStyle(0xddaa77, 1);
    g.fillCircle(cx, cy - 14, 7);
    // Ruddy cheeks (been oot in the cauld, or just bravado)
    g.fillStyle(0xddaa88, 0.5);
    g.fillCircle(cx - 4, cy - 12, 2);
    g.fillCircle(cx + 4, cy - 12, 2);
    // Thin buzz-cut hair (just visible under cap at the sides)
    g.fillStyle(0x554433, 0.3);
    g.fillRect(cx - 7, cy - 17, 2, 3);
    g.fillRect(cx + 5, cy - 17, 2, 3);

    // Narrowed suspicious eyes (sizing you up)
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx - 4, cy - 16, 3, 2);
    g.fillRect(cx + 1, cy - 16, 3, 2);
    g.fillStyle(0x222222, 1);
    g.fillRect(cx - 3, cy - 16, 2, 2);
    g.fillRect(cx + 2, cy - 16, 2, 2);

    // Aggressive eyebrows (furrowed — "what are YOU lookin at")
    g.fillStyle(0x553322, 1);
    g.fillRect(cx - 5, cy - 17, 4, 1);
    g.fillRect(cx + 1, cy - 17, 4, 1);

    // Mouth — sneering grin (missing tooth adds character)
    g.fillStyle(0x553322, 1);
    g.fillRect(cx - 3, cy - 11, 6, 1);
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(cx - 2, cy - 11, 1, 1);
    // Gap tooth (one missing — been in a scrap)
    g.fillRect(cx + 2, cy - 11, 1, 1);

    // ── Burberry check cap — tilted at 45° (THE ned signature) ──
    // Cap body — beige check pattern
    g.fillStyle(0xccaa77, 1);
    g.fillEllipse(cx + 2, cy - 20, 18, 7);
    g.fillStyle(0xddbb88, 1);
    g.fillEllipse(cx + 2, cy - 21, 16, 5);
    // Burberry check pattern (red/black lines on beige)
    g.fillStyle(0xcc3322, 0.5);
    g.fillRect(cx - 4, cy - 22, 12, 1);
    g.fillRect(cx - 2, cy - 20, 8, 1);
    g.fillStyle(0x222222, 0.3);
    g.fillRect(cx - 1, cy - 23, 1, 4);
    g.fillRect(cx + 4, cy - 23, 1, 4);
    // Peak (brim) tilted up
    g.fillStyle(0xaa8855, 1);
    g.fillRect(cx - 6, cy - 19, 8, 2);
    g.fillStyle(0xbbaa66, 1);
    g.fillRect(cx - 5, cy - 19, 6, 1);

    // ── Buckfast bottle in hand (optional but peak ned) ──
    g.fillStyle(0x224422, 1);
    g.fillRect(cx + 10, cy + 1, 3, 6);
    g.fillStyle(0x336633, 1);
    g.fillRect(cx + 10, cy + 2, 2, 4);
    // Cream label
    g.fillStyle(0xddcc88, 1);
    g.fillRect(cx + 10, cy + 3, 2, 2);
    // Gold cap
    g.fillStyle(0xddaa00, 1);
    g.fillRect(cx + 10, cy + 1, 2, 1);

    g.generateTexture('kelpie', s, s);
    g.destroy();
  }

  /** Midgie swarm — a roiling cloud of tiny biting midges. The individual
   *  bugs are too small to draw, so the sprite is a dark buzzing cloud
   *  with glowing red eyes scattered through it and tiny wing-flicker dots. */
  /** Midgie swarm — a roiling hellcloud of biting Highland midges.
   *  The sprite is a dark seething mass with scattered red eyes, wing flicker,
   *  and tiny silhouettes of individual midges at the edges. Pure dread. */
  private createMidgieSwarm(): void {
    const s = 26;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // ── Outermost haze — the swarm's "reach" ──
    g.fillStyle(0x0a040a, 0.15);
    g.fillCircle(cx, cy, 12);
    // Irregular outer wisps (cloud isn't perfectly round — it churns)
    g.fillStyle(0x1a0a1a, 0.25);
    g.fillEllipse(cx - 2, cy - 1, 20, 14);
    g.fillEllipse(cx + 1, cy + 2, 16, 16);
    // Mid-density cloud
    g.fillStyle(0x2a1228, 0.45);
    g.fillEllipse(cx, cy, 16, 12);
    // Dense inner cloud (where most midges are)
    g.fillStyle(0x3a1a30, 0.6);
    g.fillEllipse(cx, cy, 12, 9);
    // Darkest churning core
    g.fillStyle(0x2a0e22, 0.7);
    g.fillEllipse(cx - 1, cy, 8, 6);

    // ── Individual midge silhouettes at cloud edges (tiny, distinct) ──
    // Positioned at the edge so they read as separate creatures
    const midges: [number, number, number][] = [
      [-5, -3, 1.5], [4, -2, 1.5], [-2, 3, 1.5],
      [6, 2, 1.2], [-6, 2, 1.2], [1, -5, 1.2],
      [-3, 5, 1.0], [5, -4, 1.0], [3, 4, 1.0],
    ];
    for (const [dx, dy, r] of midges) {
      // Tiny dark body
      g.fillStyle(0x331122, 1);
      g.fillCircle(cx + dx, cy + dy, r);
      // Even tinier wings (bright flicker on each midge)
      g.fillStyle(0xccbbdd, 0.4);
      g.fillCircle(cx + dx - 0.5, cy + dy - r, 0.6);
      g.fillCircle(cx + dx + 0.5, cy + dy - r, 0.6);
    }

    // ── Red eyes — angry pinpricks staring out from the cloud ──
    g.fillStyle(0xff2233, 1);
    g.fillCircle(cx - 4, cy - 3, 0.8);
    g.fillCircle(cx + 3, cy - 2, 0.8);
    g.fillCircle(cx - 1, cy + 2, 0.8);
    g.fillCircle(cx + 5, cy + 1, 0.7);
    g.fillCircle(cx - 5, cy + 2, 0.7);
    g.fillCircle(cx + 1, cy - 5, 0.7);
    g.fillCircle(cx - 3, cy + 4, 0.6);
    g.fillCircle(cx + 4, cy - 4, 0.6);
    // Brighter pair in the centre (the biggest midge, staring right at you)
    g.fillStyle(0xff4455, 1);
    g.fillCircle(cx - 1, cy - 1, 0.9);
    g.fillCircle(cx + 1, cy - 1, 0.9);

    // ── Wing flicker — translucent bright dots (motion) ──
    g.fillStyle(0xddccee, 0.45);
    g.fillCircle(cx - 4, cy - 4, 0.6);
    g.fillCircle(cx + 5, cy - 3, 0.6);
    g.fillCircle(cx, cy + 1, 0.5);
    g.fillCircle(cx + 7, cy, 0.5);
    g.fillCircle(cx - 6, cy - 1, 0.5);
    g.fillCircle(cx + 2, cy + 5, 0.5);

    // ── Dangling legs at bottom edge (visible stragglers) ──
    g.lineStyle(0.8, 0x220a18, 0.7);
    g.lineBetween(cx - 3, cy + 5, cx - 4, cy + 8);
    g.lineBetween(cx + 2, cy + 5, cx + 3, cy + 8);
    g.lineBetween(cx - 1, cy + 5, cx - 2, cy + 9);
    g.lineBetween(cx + 4, cy + 4, cx + 5, cy + 7);
    g.lineBetween(cx, cy + 6, cx - 1, cy + 9);

    g.generateTexture('midgie_swarm', s, s);
    g.destroy();
  }

  /**
   * Buckfast Ned — DESIGN_IDEAS section 3 Urban Ghaists family opener.
   * Scrawny tracksuit silhouette with a dark-green Buckfast bottle.
   * Smaller than angry_scotsman (who is the raging henchman archetype);
   * ned reads as "lean, jittery, streetwise". Kept concise vs. the big
   * hero enemies — a family opener, not a showpiece.
   */
  private createBuckfastNed(): void {
    const s = 44;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Tracksuit legs (navy with white stripe).
    g.fillStyle(0x0a1428, 1);
    g.fillRect(cx - 5, cy + 8, 4, 10);
    g.fillRect(cx + 1, cy + 8, 4, 10);
    g.fillStyle(0xdcdcdc, 1);
    g.fillRect(cx - 4, cy + 8, 1, 10);
    g.fillRect(cx + 2, cy + 8, 1, 10);
    // Trainers.
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(cx - 3, cy + 19, 5, 2);
    g.fillEllipse(cx + 3, cy + 19, 5, 2);

    // Tracksuit top (matching navy, hood up).
    g.fillStyle(0x0a1428, 1);
    g.fillRect(cx - 7, cy - 6, 14, 14);
    g.fillStyle(0x1a2438, 1);
    g.fillRect(cx - 6, cy - 5, 12, 12);
    // White chest zip.
    g.fillStyle(0xdcdcdc, 0.7);
    g.fillRect(cx, cy - 5, 1, 11);
    // Hood shadow framing the face.
    g.fillStyle(0x050810, 1);
    g.fillEllipse(cx, cy - 10, 12, 8);

    // Pale gaunt face in the hood (sharp cheekbones, sunk eyes).
    g.fillStyle(0xd8b89a, 1);
    g.fillEllipse(cx, cy - 10, 8, 6);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 2, cy - 10, 0.8);
    g.fillCircle(cx + 2, cy - 10, 0.8);
    // Thin scowl.
    g.lineStyle(0.8, 0x222222, 1);
    g.lineBetween(cx - 1, cy - 7, cx + 2, cy - 7);

    // Buckfast bottle in right hand — dark green glass, cream label, gold foil.
    g.fillStyle(0x0a2a0a, 1);
    g.fillRect(cx + 7, cy - 1, 4, 11);
    g.fillStyle(0x1a4418, 1);
    g.fillRect(cx + 8, cy, 2, 9);
    g.fillStyle(0xeeddbb, 1);
    g.fillRect(cx + 7, cy + 3, 4, 3);
    g.fillStyle(0xccaa22, 1);
    g.fillRect(cx + 8, cy - 3, 2, 3);

    // Shadow under the figure.
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(cx, cy + 20, 12, 3);

    g.generateTexture('buckfast_ned', s, s);
    g.destroy();
  }

  /**
   * Traffic Cone Totem — DESIGN_IDEAS section 3 Urban Ghaists #2.
   * Three stacked Glasgow-orange traffic cones on a slick base. Static
   * (chase at speed 0) so the hit-response path stays standard. When
   * killed the totem collapses and spits four slick patches in the
   * cardinals (wired through EnemyKillHandler.onTotemFall).
   */
  private createTrafficConeTotem(): void {
    const s = 44;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 4;

    // Wet asphalt base.
    g.fillStyle(0x222222, 0.6);
    g.fillEllipse(cx, cy + 14, 20, 5);

    // Lower cone — biggest, hazard orange with reflective bands.
    g.fillStyle(0x8a3a08, 1);
    g.fillTriangle(cx - 10, cy + 12, cx + 10, cy + 12, cx, cy + 2);
    g.fillStyle(0xdd5a10, 1);
    g.fillTriangle(cx - 9, cy + 11, cx + 9, cy + 11, cx, cy + 3);
    g.fillStyle(0xffe6cc, 1);
    g.fillRect(cx - 7, cy + 7, 14, 1);
    g.fillRect(cx - 6, cy + 10, 12, 1);

    // Middle cone.
    g.fillStyle(0x8a3a08, 1);
    g.fillTriangle(cx - 7, cy + 2, cx + 7, cy + 2, cx, cy - 6);
    g.fillStyle(0xdd5a10, 1);
    g.fillTriangle(cx - 6, cy + 1, cx + 6, cy + 1, cx, cy - 5);
    g.fillStyle(0xffe6cc, 1);
    g.fillRect(cx - 5, cy - 2, 10, 1);

    // Top cone — smallest.
    g.fillStyle(0x8a3a08, 1);
    g.fillTriangle(cx - 4, cy - 6, cx + 4, cy - 6, cx, cy - 12);
    g.fillStyle(0xdd5a10, 1);
    g.fillTriangle(cx - 3, cy - 7, cx + 3, cy - 7, cx, cy - 11);

    // Warning glow — cones have catch-light on their rim so the totem
    // reads as a hazard, not decor.
    g.fillStyle(0xffcc44, 0.25);
    g.fillCircle(cx, cy + 2, 12);

    g.generateTexture('traffic_cone_totem', s, s);
    g.destroy();
  }

  /**
   * Edinburgh Ghost Guide — DESIGN_IDEAS section 3 Urban Ghaists #3.
   * Spectral Victorian tour guide silhouette with a lantern. Ranged
   * enemy that keeps distance and lobs projectiles; visually reads as
   * a fluorescent-flicker ghost rather than a solid hench figure.
   */
  private createEdinburghGhostGuide(): void {
    const s = 44;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Ectoplasmic aura.
    g.fillStyle(0x8fc6d4, 0.15);
    g.fillEllipse(cx, cy, 32, 36);
    g.fillStyle(0x8fc6d4, 0.08);
    g.fillEllipse(cx, cy, 40, 44);

    // Long Victorian frock coat — spectral grey-blue.
    g.fillStyle(0x1a2838, 1);
    g.fillTriangle(cx - 10, cy + 18, cx + 10, cy + 18, cx + 6, cy - 4);
    g.fillTriangle(cx - 10, cy + 18, cx - 6, cy - 4, cx + 6, cy - 4);
    g.fillStyle(0x334858, 1);
    g.fillTriangle(cx - 8, cy + 16, cx + 8, cy + 16, cx + 5, cy - 3);
    g.fillTriangle(cx - 8, cy + 16, cx - 5, cy - 3, cx + 5, cy - 3);
    // Coat-tails trail (translucent ghost fade).
    g.fillStyle(0x334858, 0.4);
    g.fillTriangle(cx - 10, cy + 18, cx - 14, cy + 21, cx - 6, cy + 18);
    g.fillTriangle(cx + 10, cy + 18, cx + 14, cy + 21, cx + 6, cy + 18);

    // Wispy trailing bottom (no hard feet — ghost drift).
    g.fillStyle(0x8fc6d4, 0.35);
    g.fillRect(cx - 6, cy + 16, 12, 2);
    g.fillStyle(0x8fc6d4, 0.2);
    g.fillRect(cx - 8, cy + 18, 16, 1);

    // Pale gaunt face above the collar.
    g.fillStyle(0xd8e6ee, 0.95);
    g.fillEllipse(cx, cy - 9, 8, 10);
    // Collar — white Victorian shirt-front.
    g.fillStyle(0xe0e8f0, 0.9);
    g.fillRect(cx - 3, cy - 4, 6, 2);
    // Hollow eyes — cyan pinpricks.
    g.fillStyle(0x8fc6d4, 1);
    g.fillCircle(cx - 2, cy - 10, 1);
    g.fillCircle(cx + 2, cy - 10, 1);
    // Thin moustache for that tour-guide beat.
    g.lineStyle(0.8, 0x2a3848, 1);
    g.lineBetween(cx - 3, cy - 6, cx + 3, cy - 6);

    // Top hat.
    g.fillStyle(0x10141a, 1);
    g.fillRect(cx - 5, cy - 18, 10, 5);
    g.fillRect(cx - 7, cy - 13, 14, 2);
    g.fillStyle(0xa89050, 0.6);
    g.fillRect(cx - 5, cy - 15, 10, 1); // hat band

    // Lantern in hand — outstretched, glowing.
    g.fillStyle(0xa89050, 1);
    g.fillRect(cx + 11, cy + 2, 2, 5); // pole
    g.fillStyle(0xffcc66, 0.9);
    g.fillCircle(cx + 12, cy + 2, 3);
    g.fillStyle(0xfff0a0, 1);
    g.fillCircle(cx + 12, cy + 2, 1.5);
    // Lantern glow halo.
    g.fillStyle(0xffd88a, 0.25);
    g.fillCircle(cx + 12, cy + 2, 6);

    g.generateTexture('edinburgh_ghost_guide', s, s);
    g.destroy();
  }

  /**
   * Barghest — DESIGN_IDEAS section 3 Cryptids family opener.
   * Shadow-hound silhouette that dives in from the edge, eyes and
   * fangs the only bright points on a near-black body. Contrasts
   * the eagle's clean silver dive: slower-reading silhouette, more
   * ominous palette, teeth drawn so the collision feels earned.
   */
  private createBarghest(): void {
    const s = 44;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Menacing under-shadow.
    g.fillStyle(0x000000, 0.35);
    g.fillEllipse(cx, cy + 15, 26, 5);

    // Lean hound body — elongated ellipse, nearly black.
    g.fillStyle(0x0a0a0f, 1);
    g.fillEllipse(cx, cy + 4, 26, 12);
    g.fillStyle(0x141418, 1);
    g.fillEllipse(cx, cy + 3, 22, 10);
    // Fur shadow hints — darker streaks along the back.
    g.fillStyle(0x050508, 0.7);
    g.fillEllipse(cx - 6, cy + 1, 4, 3);
    g.fillEllipse(cx + 4, cy, 4, 3);

    // Legs — 4, scruffy and taut mid-bound.
    g.fillStyle(0x0a0a0f, 1);
    g.fillRect(cx - 10, cy + 8, 2, 7);
    g.fillRect(cx - 4, cy + 9, 2, 6);
    g.fillRect(cx + 2, cy + 9, 2, 6);
    g.fillRect(cx + 8, cy + 8, 2, 7);

    // Tail — curling shadow behind.
    g.fillStyle(0x0a0a0f, 1);
    g.fillTriangle(cx - 12, cy + 2, cx - 16, cy - 2, cx - 12, cy + 6);

    // Head — low and forward, teeth bared.
    g.fillStyle(0x0a0a0f, 1);
    g.fillEllipse(cx + 11, cy, 9, 7);
    g.fillStyle(0x141418, 1);
    g.fillEllipse(cx + 11, cy - 1, 7, 5);

    // Ears — pointed, laid back.
    g.fillStyle(0x0a0a0f, 1);
    g.fillTriangle(cx + 8, cy - 4, cx + 6, cy - 9, cx + 10, cy - 6);
    g.fillTriangle(cx + 13, cy - 4, cx + 16, cy - 9, cx + 15, cy - 5);

    // Red eyes — the signature glow.
    g.fillStyle(0xcc0a00, 1);
    g.fillCircle(cx + 10, cy - 1, 1.2);
    g.fillCircle(cx + 14, cy - 1, 1.2);
    // Eye bloom.
    g.fillStyle(0xff3a20, 0.7);
    g.fillCircle(cx + 10, cy - 1, 0.6);
    g.fillCircle(cx + 14, cy - 1, 0.6);

    // Bared fangs — tiny white triangles below the snout.
    g.fillStyle(0xe8e8e8, 1);
    g.fillTriangle(cx + 13, cy + 2, cx + 14, cy + 3, cx + 14, cy + 1);
    g.fillTriangle(cx + 15, cy + 2, cx + 16, cy + 3, cx + 16, cy + 1);

    // Dive trail — faint motion streaks behind.
    g.fillStyle(0x220022, 0.3);
    g.fillRect(cx - 18, cy + 2, 4, 1);
    g.fillRect(cx - 20, cy + 5, 3, 1);

    g.generateTexture('barghest', s, s);
    g.destroy();
  }

  /**
   * Kelpie Foal — DESIGN_IDEAS section 3 Cryptids #2. Young water-
   * horse; flees when the player gets close (reuses sheep's `flee`
   * behaviour). Shimmer-blue coat with mane-drip detail so it reads
   * as water-spirit rather than livestock.
   */
  private createKelpieFoal(): void {
    const s = 36;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Soft under-glow — water-spirit aura.
    g.fillStyle(0x4a8ab0, 0.2);
    g.fillEllipse(cx, cy + 2, 26, 20);

    // Body — compact, slightly rounder than adult.
    g.fillStyle(0x1a3348, 1);
    g.fillEllipse(cx, cy + 3, 18, 10);
    g.fillStyle(0x2e5070, 1);
    g.fillEllipse(cx, cy + 2, 15, 8);
    // Dappled lighter highlights — wet-coat feel.
    g.fillStyle(0x6fa0c0, 0.6);
    g.fillEllipse(cx - 3, cy, 5, 3);
    g.fillEllipse(cx + 4, cy + 1, 4, 2);

    // Legs — 4 thin ones, pale at hooves.
    g.fillStyle(0x1a3348, 1);
    g.fillRect(cx - 7, cy + 7, 2, 6);
    g.fillRect(cx - 2, cy + 8, 2, 5);
    g.fillRect(cx + 2, cy + 8, 2, 5);
    g.fillRect(cx + 6, cy + 7, 2, 6);
    g.fillStyle(0xa0c8e0, 0.8);
    g.fillRect(cx - 7, cy + 12, 2, 1);
    g.fillRect(cx + 6, cy + 12, 2, 1);

    // Head.
    g.fillStyle(0x1a3348, 1);
    g.fillEllipse(cx + 8, cy - 2, 7, 6);
    g.fillStyle(0x2e5070, 1);
    g.fillEllipse(cx + 8, cy - 3, 6, 4);

    // Eye — luminous cyan.
    g.fillStyle(0x8fe0ff, 1);
    g.fillCircle(cx + 10, cy - 3, 1);

    // Ears — tiny, water-pointed.
    g.fillStyle(0x1a3348, 1);
    g.fillTriangle(cx + 6, cy - 6, cx + 8, cy - 8, cx + 8, cy - 5);
    g.fillTriangle(cx + 10, cy - 6, cx + 12, cy - 8, cx + 10, cy - 5);

    // Mane — dripping water strands on neck.
    g.fillStyle(0x6fa0c0, 0.8);
    g.fillRect(cx + 3, cy - 4, 1, 5);
    g.fillRect(cx + 5, cy - 5, 1, 6);
    g.fillStyle(0xa0c8e0, 0.7);
    g.fillRect(cx + 4, cy - 4, 1, 4);
    // Drips below.
    g.fillStyle(0x8fd0f0, 0.6);
    g.fillCircle(cx + 3, cy + 2, 0.8);
    g.fillCircle(cx + 6, cy + 3, 0.6);

    // Tail — wispy water tail.
    g.fillStyle(0x4a8ab0, 0.7);
    g.fillTriangle(cx - 8, cy + 2, cx - 13, cy + 1, cx - 9, cy + 6);

    g.generateTexture('kelpie_foal', s, s);
    g.destroy();
  }

  /**
   * Blue Man of the Minch — DESIGN_IDEAS section 3 Cryptids #3.
   * Hebridean ocean spirit; slow ranged enemy that lobs a kenning
   * projectile. Visual pitch: waist-up humanoid torso rising out of
   * dripping water, deep indigo skin, pale-green eyes.
   */
  private createBlueManOfMinch(): void {
    const s = 48;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 4;

    // Water pool at the base — he's "rising" from it.
    g.fillStyle(0x0a2238, 0.7);
    g.fillEllipse(cx, cy + 16, 28, 6);
    g.fillStyle(0x1a3d58, 0.5);
    g.fillEllipse(cx, cy + 15, 24, 4);
    // Water ripple suggestion.
    g.fillStyle(0x8fc0e0, 0.4);
    g.fillRect(cx - 10, cy + 14, 20, 1);

    // Waist / torso.
    g.fillStyle(0x0a1a3d, 1);
    g.fillEllipse(cx, cy + 6, 18, 14);
    g.fillStyle(0x1a2f5a, 1);
    g.fillEllipse(cx, cy + 4, 15, 11);
    // Chest sheen.
    g.fillStyle(0x4060a0, 0.5);
    g.fillEllipse(cx - 2, cy + 2, 10, 5);

    // Arms — one raised holding kenning-stone (throwing stance).
    g.fillStyle(0x0a1a3d, 1);
    g.fillRect(cx + 7, cy - 3, 3, 8);
    g.fillRect(cx - 10, cy, 3, 8);
    // Kenning projectile in raised hand — glowing cyan rune-stone.
    g.fillStyle(0x5fc0e0, 0.85);
    g.fillCircle(cx + 12, cy - 5, 2.5);
    g.fillStyle(0x9fe0ff, 1);
    g.fillCircle(cx + 12, cy - 5, 1.3);
    // Projectile glow ring.
    g.fillStyle(0x5fc0e0, 0.3);
    g.fillCircle(cx + 12, cy - 5, 5);

    // Shoulders + neck.
    g.fillStyle(0x0a1a3d, 1);
    g.fillRect(cx - 8, cy - 6, 16, 3);
    g.fillRect(cx - 2, cy - 9, 4, 4);

    // Head — gaunt, angled.
    g.fillStyle(0x0a1a3d, 1);
    g.fillEllipse(cx, cy - 12, 10, 10);
    g.fillStyle(0x1a2f5a, 1);
    g.fillEllipse(cx, cy - 13, 8, 8);

    // Eyes — pale sea-green pinpricks.
    g.fillStyle(0xc8f0a0, 1);
    g.fillCircle(cx - 2, cy - 13, 1);
    g.fillCircle(cx + 2, cy - 13, 1);

    // Beard — wet hair strands hanging off chin.
    g.fillStyle(0x050a18, 0.9);
    g.fillRect(cx - 3, cy - 8, 1, 4);
    g.fillRect(cx, cy - 8, 1, 5);
    g.fillRect(cx + 3, cy - 8, 1, 4);

    // Drips from shoulders.
    g.fillStyle(0x5fc0e0, 0.6);
    g.fillCircle(cx - 9, cy + 4, 0.8);
    g.fillCircle(cx + 8, cy + 4, 0.8);

    g.generateTexture('blue_man_of_minch', s, s);
    g.destroy();
  }

  /**
   * Haar Wraith — DESIGN_IDEAS section 3 Weather family opener.
   * Pale-grey mist-silhouette; a faint humanoid torso dissolving into
   * drifting fog. Dies fast, but leaves a fog patch that halves the
   * player's pickup radius for a few seconds — magnet-farm pressure,
   * not damage. Visual reads "weather spirit" rather than "enemy".
   */
  private createHaarWraith(): void {
    const s = 44;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Ambient haar — broad low-contrast halo.
    g.fillStyle(0xc8d0dc, 0.12);
    g.fillCircle(cx, cy, 18);
    g.fillStyle(0xc8d0dc, 0.08);
    g.fillCircle(cx, cy, 22);

    // Mist tendrils spiralling outward.
    g.fillStyle(0xb8c0cc, 0.35);
    g.fillEllipse(cx - 12, cy + 2, 8, 3);
    g.fillEllipse(cx + 12, cy - 2, 8, 3);
    g.fillEllipse(cx, cy + 12, 10, 3);
    g.fillEllipse(cx - 4, cy - 10, 6, 2);

    // Body — soft humanoid torso.
    g.fillStyle(0x6a7685, 0.55);
    g.fillEllipse(cx, cy + 4, 12, 14);
    g.fillStyle(0x8a95a5, 0.6);
    g.fillEllipse(cx, cy + 3, 10, 12);
    // Fade to nothing at the bottom — dissolving into mist.
    g.fillStyle(0xc8d0dc, 0.3);
    g.fillEllipse(cx, cy + 10, 14, 5);
    g.fillStyle(0xc8d0dc, 0.15);
    g.fillEllipse(cx, cy + 14, 18, 4);

    // Head — high-contrast against the mist so kill-target is readable.
    g.fillStyle(0x2a3340, 0.8);
    g.fillEllipse(cx, cy - 6, 9, 10);
    g.fillStyle(0x454f5c, 0.85);
    g.fillEllipse(cx, cy - 7, 7, 8);

    // Eyes — pale pinpricks (haar-light glow).
    g.fillStyle(0xe0e8f2, 1);
    g.fillCircle(cx - 2, cy - 7, 1);
    g.fillCircle(cx + 2, cy - 7, 1);

    // Mouth — hollow slit.
    g.fillStyle(0x0a1018, 0.9);
    g.fillRect(cx - 1, cy - 4, 3, 1);

    // Drift arms — hinted, translucent.
    g.fillStyle(0x6a7685, 0.4);
    g.fillEllipse(cx - 9, cy + 2, 4, 8);
    g.fillEllipse(cx + 9, cy + 2, 4, 8);

    // Top wisps — rising.
    g.fillStyle(0xd8e0ea, 0.5);
    g.fillCircle(cx - 2, cy - 13, 1.2);
    g.fillCircle(cx + 3, cy - 14, 1);

    g.generateTexture('haar_wraith', s, s);
    g.destroy();
  }

  /**
   * Gale Wraith — DESIGN_IDEAS section 3 Weather #2. Billowing wind
   * form with visible sweep arcs. Visual reads "gust of wind" so the
   * shove-on-contact feels earned. Contrast to haar_wraith's pale
   * stillness — gale_wraith is all motion lines.
   */
  private createGaleWraith(): void {
    const s = 44;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Outer gust halo — long directional streaks to the left (lee-side).
    g.fillStyle(0x9db0c0, 0.22);
    g.fillEllipse(cx - 4, cy, 30, 14);
    g.fillStyle(0x9db0c0, 0.1);
    g.fillEllipse(cx - 8, cy, 38, 18);

    // Swirling wind arcs — the signature motion readable silhouette.
    g.lineStyle(1.5, 0xd8e4ec, 0.85);
    g.beginPath();
    g.arc(cx + 2, cy - 2, 10, -Math.PI * 0.85, Math.PI * 0.35);
    g.strokePath();
    g.lineStyle(1.2, 0xc0d0dc, 0.7);
    g.beginPath();
    g.arc(cx - 2, cy + 1, 14, -Math.PI * 0.75, Math.PI * 0.55);
    g.strokePath();
    g.lineStyle(1, 0xa8b8c8, 0.5);
    g.beginPath();
    g.arc(cx - 4, cy + 4, 18, -Math.PI * 0.6, Math.PI * 0.65);
    g.strokePath();

    // Core body — denser than haar, still translucent.
    g.fillStyle(0x4a5e72, 0.7);
    g.fillEllipse(cx + 2, cy, 12, 14);
    g.fillStyle(0x6a7e92, 0.8);
    g.fillEllipse(cx + 2, cy - 1, 9, 11);

    // Head — small, leaning into the gust.
    g.fillStyle(0x2a3a48, 0.85);
    g.fillEllipse(cx + 4, cy - 9, 7, 8);
    g.fillStyle(0x455868, 0.9);
    g.fillEllipse(cx + 4, cy - 10, 5, 6);

    // Eyes — bright white-blue, narrowed like a squint against wind.
    g.fillStyle(0xf0f8ff, 1);
    g.fillRect(cx + 2, cy - 10, 2, 1);
    g.fillRect(cx + 5, cy - 10, 2, 1);

    // Leading-edge streaks — high contrast, directional.
    g.fillStyle(0xe8f0f8, 0.8);
    g.fillRect(cx + 8, cy - 3, 6, 1);
    g.fillRect(cx + 10, cy + 1, 5, 1);
    g.fillRect(cx + 8, cy + 5, 6, 1);

    // Trail wisps — fading off to the left.
    g.fillStyle(0xa8b8c8, 0.3);
    g.fillRect(cx - 12, cy - 2, 6, 1);
    g.fillRect(cx - 15, cy + 1, 5, 1);
    g.fillRect(cx - 13, cy + 4, 7, 1);

    g.generateTexture('gale_wraith', s, s);
    g.destroy();
  }

  /**
   * Seelie Piper — DESIGN_IDEAS section 3 Faerie family opener.
   * "Fair-court" faerie orbiting the player; pale gold palette with
   * sparkle-before-commit hint in the visual. Pairs with
   * unseelie_fiddler as the light half of a Seelie/Unseelie pair.
   */
  private createSeeliePiper(): void {
    const s = 40;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Fair-court glow.
    g.fillStyle(0xffe49a, 0.25);
    g.fillCircle(cx, cy, 14);
    g.fillStyle(0xffe49a, 0.12);
    g.fillCircle(cx, cy, 18);

    // Tiny body — sprite-sized fairy.
    g.fillStyle(0xb4955a, 1);
    g.fillEllipse(cx, cy + 2, 9, 11);
    g.fillStyle(0xdfc68a, 1);
    g.fillEllipse(cx, cy + 1, 7, 9);

    // Head.
    g.fillStyle(0xffd9a0, 1);
    g.fillCircle(cx, cy - 5, 3);

    // Eyes — bright gold pinpricks.
    g.fillStyle(0xff9628, 1);
    g.fillCircle(cx - 1, cy - 5, 0.6);
    g.fillCircle(cx + 1, cy - 5, 0.6);

    // Tiny pipe in hand — gold with pale tip.
    g.fillStyle(0xb4955a, 1);
    g.fillRect(cx + 3, cy - 2, 6, 1);
    g.fillStyle(0xffe49a, 1);
    g.fillRect(cx + 8, cy - 2, 1, 1);

    // Wings — iridescent, fanned out.
    g.fillStyle(0xffe49a, 0.6);
    g.fillEllipse(cx - 6, cy - 2, 6, 10);
    g.fillEllipse(cx + 6, cy - 2, 6, 10);
    // Wing highlights.
    g.fillStyle(0xffffff, 0.5);
    g.fillEllipse(cx - 6, cy - 3, 3, 5);
    g.fillEllipse(cx + 6, cy - 3, 3, 5);

    // Sparkle trail — three dots of different sizes.
    g.fillStyle(0xfff0c0, 0.9);
    g.fillCircle(cx - 10, cy + 5, 1);
    g.fillStyle(0xfff0c0, 0.6);
    g.fillCircle(cx - 13, cy + 2, 0.7);
    g.fillStyle(0xfff0c0, 0.35);
    g.fillCircle(cx - 15, cy + 6, 0.5);

    g.generateTexture('seelie_piper', s, s);
    g.destroy();
  }

  /**
   * Unseelie Fiddler — DESIGN_IDEAS section 3 Faerie #2. "Dark-court"
   * pair-mate. Orbits like seelie_piper but in violet-black palette
   * with cold-blue eye-glow; plays a small fiddle instead of pipes.
   */
  private createUnseelieFiddler(): void {
    const s = 40;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Dark-court aura — cold indigo.
    g.fillStyle(0x2a1a3a, 0.32);
    g.fillCircle(cx, cy, 14);
    g.fillStyle(0x2a1a3a, 0.15);
    g.fillCircle(cx, cy, 18);

    // Body — darker.
    g.fillStyle(0x1a0f28, 1);
    g.fillEllipse(cx, cy + 2, 9, 11);
    g.fillStyle(0x3a2855, 1);
    g.fillEllipse(cx, cy + 1, 7, 9);

    // Head.
    g.fillStyle(0x4a3065, 1);
    g.fillCircle(cx, cy - 5, 3);

    // Eyes — cold blue pinpricks (contrast to Seelie's gold).
    g.fillStyle(0x8fd0f0, 1);
    g.fillCircle(cx - 1, cy - 5, 0.6);
    g.fillCircle(cx + 1, cy - 5, 0.6);

    // Fiddle in hand — dark-wood body, pale string.
    g.fillStyle(0x20101a, 1);
    g.fillRect(cx + 3, cy - 2, 5, 2);
    // Neck + string.
    g.fillStyle(0x8fd0f0, 0.85);
    g.fillRect(cx + 4, cy - 2, 4, 0.5);
    // Bow — angled across.
    g.fillStyle(0x8a6c40, 1);
    g.fillRect(cx + 2, cy - 5, 8, 0.5);

    // Wings — darker and more jagged (unseelie drape).
    g.fillStyle(0x4a2a6a, 0.6);
    g.fillTriangle(cx - 4, cy - 4, cx - 8, cy + 2, cx - 4, cy + 4);
    g.fillTriangle(cx + 4, cy - 4, cx + 8, cy + 2, cx + 4, cy + 4);
    // Wing highlights — violet edge.
    g.fillStyle(0x9f7ac8, 0.5);
    g.fillTriangle(cx - 5, cy - 2, cx - 7, cy + 1, cx - 5, cy + 2);
    g.fillTriangle(cx + 5, cy - 2, cx + 7, cy + 1, cx + 5, cy + 2);

    // Shadow trail — dark pinpricks (pair to Seelie's sparkle).
    g.fillStyle(0x3a2040, 0.8);
    g.fillCircle(cx - 10, cy + 5, 1);
    g.fillStyle(0x3a2040, 0.55);
    g.fillCircle(cx - 13, cy + 2, 0.7);
    g.fillStyle(0x3a2040, 0.3);
    g.fillCircle(cx - 15, cy + 6, 0.5);

    g.generateTexture('unseelie_fiddler', s, s);
    g.destroy();
  }

  /**
   * Redcap — DESIGN_IDEAS section 3 Faerie #3. Short stocky goblin
   * with a crimson cap "freshly dipped" and an iron pike. Dive
   * behaviour gives the trio a non-orbit silhouette so the two
   * courtiers + the enforcer read as three distinct Faerie beats.
   */
  private createRedcap(): void {
    const s = 32;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Ground shadow.
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, cy + 10, 16, 3);

    // Stocky body — earthy brown leather-and-rags.
    g.fillStyle(0x2a1e14, 1);
    g.fillEllipse(cx, cy + 5, 14, 10);
    g.fillStyle(0x5a3e20, 1);
    g.fillEllipse(cx, cy + 4, 12, 8);
    // Belt — iron rivet row.
    g.fillStyle(0x2a2a2a, 1);
    g.fillRect(cx - 6, cy + 3, 12, 1);

    // Short stubby legs / boots.
    g.fillStyle(0x1a1408, 1);
    g.fillRect(cx - 5, cy + 9, 3, 3);
    g.fillRect(cx + 2, cy + 9, 3, 3);

    // Arms — one gripping a short iron pike (weapon + threat telegraph).
    g.fillStyle(0x4a2e18, 1);
    g.fillRect(cx - 8, cy + 1, 3, 5);
    g.fillRect(cx + 5, cy + 1, 3, 5);
    // Pike shaft.
    g.fillStyle(0x2a1a10, 1);
    g.fillRect(cx + 7, cy - 7, 1, 10);
    // Pike head — dull iron tip.
    g.fillStyle(0x505058, 1);
    g.fillTriangle(cx + 6, cy - 7, cx + 9, cy - 7, cx + 7.5, cy - 10);

    // Head — round goblinoid, pale sickly green-grey.
    g.fillStyle(0xa0b088, 1);
    g.fillEllipse(cx, cy - 3, 10, 9);

    // Pointed goblin ears.
    g.fillStyle(0x80907a, 1);
    g.fillTriangle(cx - 5, cy - 5, cx - 5, cy - 1, cx - 8, cy - 3);
    g.fillTriangle(cx + 5, cy - 5, cx + 5, cy - 1, cx + 8, cy - 3);

    // Face — hungry yellow eyes + wide toothy grin.
    g.fillStyle(0xffd040, 1);
    g.fillRect(cx - 3, cy - 4, 2, 2);
    g.fillRect(cx + 1, cy - 4, 2, 2);
    // Black pupils.
    g.fillStyle(0x000000, 1);
    g.fillRect(cx - 2, cy - 3, 1, 1);
    g.fillRect(cx + 2, cy - 3, 1, 1);
    // Grin.
    g.fillStyle(0x2a1010, 1);
    g.fillRect(cx - 3, cy - 1, 6, 1);
    // Fangs — one top, one bottom (cartoon goblin read).
    g.fillStyle(0xffffdd, 1);
    g.fillRect(cx - 2, cy - 1, 1, 1);
    g.fillRect(cx + 1, cy - 1, 1, 1);

    // The CAP — crimson, dipped darker at the tip (the signature).
    // Pointed hood shape over the top of the head.
    g.fillStyle(0x901818, 1);
    g.fillTriangle(cx - 6, cy - 7, cx + 6, cy - 7, cx + 3, cy - 14);
    g.fillTriangle(cx - 6, cy - 7, cx + 3, cy - 14, cx - 3, cy - 12);
    // Main cap body — brighter red.
    g.fillStyle(0xc42828, 1);
    g.fillTriangle(cx - 5, cy - 7, cx + 5, cy - 7, cx + 2, cy - 13);
    g.fillTriangle(cx - 5, cy - 7, cx + 2, cy - 13, cx - 2, cy - 11);
    // Dripping "dipped" beads at the brim — dark blood.
    g.fillStyle(0x501010, 1);
    g.fillCircle(cx - 4, cy - 6, 1);
    g.fillCircle(cx + 3, cy - 6, 0.8);
    g.fillStyle(0x300808, 0.9);
    g.fillCircle(cx - 4, cy - 4, 0.6);

    g.generateTexture('redcap', s, s);
    g.destroy();
  }

  /**
   * Ceilidh Caller — DESIGN_IDEAS section 3 Academic family. Ethereal
   * dance-master; visual suggests "calling the dance" through a
   * raised arm pose and translucent robes. The "forces enemies to
   * move in sync" bullet stays open pending a group-AI pass — the
   * caller's orbit gives the rotational feel now.
   */
  private createCeilidhCaller(): void {
    const s = 42;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Soft ghostly halo.
    g.fillStyle(0xb090d0, 0.2);
    g.fillEllipse(cx, cy, 22, 24);
    g.fillStyle(0xb090d0, 0.1);
    g.fillEllipse(cx, cy, 28, 30);

    // Long robes — flared to suggest mid-twirl.
    g.fillStyle(0x2a1a48, 0.9);
    g.fillTriangle(cx - 9, cy + 14, cx + 9, cy + 14, cx + 4, cy - 2);
    g.fillTriangle(cx - 9, cy + 14, cx - 4, cy - 2, cx + 4, cy - 2);
    g.fillStyle(0x4a3068, 1);
    g.fillTriangle(cx - 7, cy + 13, cx + 7, cy + 13, cx + 3, cy - 1);
    g.fillTriangle(cx - 7, cy + 13, cx - 3, cy - 1, cx + 3, cy - 1);
    // Robe swirl highlight — lavender stripe on one side.
    g.fillStyle(0x9070b0, 0.5);
    g.fillTriangle(cx - 6, cy + 11, cx - 2, cy, cx - 5, cy + 2);

    // Belt / sash.
    g.fillStyle(0xffd080, 0.85);
    g.fillRect(cx - 7, cy + 1, 14, 1);

    // Torso.
    g.fillStyle(0x3a2055, 1);
    g.fillEllipse(cx, cy - 3, 10, 8);

    // Head — pale, narrow.
    g.fillStyle(0xe0c8e8, 0.95);
    g.fillEllipse(cx, cy - 10, 7, 8);

    // Eyes — half-lidded (dance focus).
    g.fillStyle(0x2a1048, 1);
    g.fillRect(cx - 2, cy - 10, 1, 1);
    g.fillRect(cx + 1, cy - 10, 1, 1);

    // Hair — long, dark, tied back.
    g.fillStyle(0x1a0a28, 1);
    g.fillEllipse(cx, cy - 13, 6, 3);

    // One arm raised overhead (the "call").
    g.fillStyle(0x3a2055, 1);
    g.fillRect(cx + 4, cy - 12, 2, 8);
    // Hand pinprick.
    g.fillStyle(0xe0c8e8, 1);
    g.fillCircle(cx + 5, cy - 13, 1);

    // Other arm curved in front (dance pose).
    g.fillStyle(0x3a2055, 1);
    g.fillRect(cx - 7, cy - 3, 2, 6);
    g.fillStyle(0xe0c8e8, 1);
    g.fillCircle(cx - 8, cy + 1, 1);

    // Sparkle dots — suggests the "calling" music.
    g.fillStyle(0xffd0e0, 0.8);
    g.fillCircle(cx + 8, cy - 13, 0.6);
    g.fillStyle(0xffd0e0, 0.5);
    g.fillCircle(cx + 11, cy - 10, 0.5);
    g.fillStyle(0xffd0e0, 0.3);
    g.fillCircle(cx + 13, cy - 13, 0.4);

    g.generateTexture('ceilidh_caller', s, s);
    g.destroy();
  }

  /**
   * Tome Wraith — DESIGN_IDEAS section 3 Academic #2. Floating open
   * book with torn pages orbiting the volume; a faint ghostly face
   * rises between the pages. "Scroll-unfurl telegraph" lives in the
   * visual — the existing `ranged` AI carries the projectile cadence.
   */
  private createTomeWraith(): void {
    const s = 40;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Ghostly halo — cool parchment-blue.
    g.fillStyle(0xb0c8d8, 0.18);
    g.fillEllipse(cx, cy, 26, 22);

    // Book spine — shadow beneath the open volume.
    g.fillStyle(0x201a14, 1);
    g.fillRect(cx - 1, cy + 2, 2, 8);

    // Open book body — two page sheets angled apart, leather cover
    // wrapping under the pages.
    g.fillStyle(0x4a2818, 1);
    g.fillTriangle(cx - 12, cy + 4, cx + 12, cy + 4, cx, cy + 10);
    // Left page — parchment.
    g.fillStyle(0xeadfb8, 1);
    g.fillTriangle(cx - 11, cy + 3, cx - 1, cy + 3, cx - 6, cy + 8);
    g.fillTriangle(cx - 11, cy + 3, cx - 11, cy - 4, cx - 1, cy - 2);
    g.fillTriangle(cx - 11, cy + 3, cx - 1, cy - 2, cx - 1, cy + 3);
    // Right page.
    g.fillStyle(0xf0e4c0, 1);
    g.fillTriangle(cx + 1, cy + 3, cx + 11, cy + 3, cx + 6, cy + 8);
    g.fillTriangle(cx + 11, cy + 3, cx + 11, cy - 4, cx + 1, cy - 2);
    g.fillTriangle(cx + 11, cy + 3, cx + 1, cy - 2, cx + 1, cy + 3);
    // Ink lines — horizontal writing strokes on both pages.
    g.fillStyle(0x1a1a2a, 0.85);
    g.fillRect(cx - 9, cy, 7, 1);
    g.fillRect(cx - 9, cy + 2, 7, 1);
    g.fillRect(cx + 2, cy, 7, 1);
    g.fillRect(cx + 2, cy + 2, 7, 1);
    g.fillStyle(0x1a1a2a, 0.5);
    g.fillRect(cx - 9, cy + 4, 6, 1);
    g.fillRect(cx + 2, cy + 4, 6, 1);

    // Ghostly face rising between the pages — eyes + mouth as black
    // pits on a pale translucent smear.
    g.fillStyle(0xe4d8e0, 0.8);
    g.fillEllipse(cx, cy - 6, 9, 12);
    g.fillStyle(0x120814, 1);
    g.fillRect(cx - 2, cy - 8, 1, 2);
    g.fillRect(cx + 1, cy - 8, 1, 2);
    g.fillRect(cx - 2, cy - 3, 4, 1);

    // Torn page scraps orbiting — three small pale rectangles at varied
    // angles to suggest the volume is shedding paper as it moves.
    g.fillStyle(0xeadfb8, 0.9);
    g.fillRect(cx + 11, cy - 8, 3, 2);
    g.fillStyle(0xeadfb8, 0.7);
    g.fillRect(cx - 13, cy - 10, 3, 2);
    g.fillStyle(0xeadfb8, 0.5);
    g.fillRect(cx + 13, cy + 3, 2, 2);

    g.generateTexture('tome_wraith', s, s);
    g.destroy();
  }

  /**
   * Dean Apparition — DESIGN_IDEAS section 3 Academic #3. Formal
   * ghostly dean in academic gown + mortarboard, stern moustached
   * face, arms folded in a disciplinary pose. Mass-override chase
   * so contact shoves the player — "the academy does not wait".
   */
  private createDeanApparition(): void {
    const s = 44;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Ghostly halo — cold blue-grey.
    g.fillStyle(0x6a7890, 0.18);
    g.fillEllipse(cx, cy, 28, 30);

    // Gown — long formal robe, dark with gold trim at the sleeves.
    g.fillStyle(0x18181c, 1);
    g.fillTriangle(cx - 12, cy + 18, cx + 12, cy + 18, cx + 4, cy - 3);
    g.fillTriangle(cx - 12, cy + 18, cx - 4, cy - 3, cx + 4, cy - 3);
    g.fillStyle(0x2a2a30, 1);
    g.fillTriangle(cx - 10, cy + 17, cx + 10, cy + 17, cx + 3, cy - 2);
    g.fillTriangle(cx - 10, cy + 17, cx - 3, cy - 2, cx + 3, cy - 2);
    // Front panel — formal vertical slit with gold piping.
    g.fillStyle(0x4a3820, 1);
    g.fillRect(cx - 1, cy, 2, 16);
    g.fillStyle(0xc8a040, 0.7);
    g.fillRect(cx - 2, cy, 1, 16);
    g.fillRect(cx + 1, cy, 1, 16);

    // Folded arms across the chest — sleeves end with a gold cuff.
    g.fillStyle(0x1a1a20, 1);
    g.fillRect(cx - 9, cy, 18, 4);
    g.fillStyle(0xc8a040, 0.75);
    g.fillRect(cx - 9, cy, 1, 4);
    g.fillRect(cx + 8, cy, 1, 4);

    // Head — pale, angular.
    g.fillStyle(0xd8c8b8, 0.95);
    g.fillEllipse(cx, cy - 8, 8, 10);

    // Mortarboard — flat cap with tassle trailing.
    g.fillStyle(0x0a0a0e, 1);
    g.fillRect(cx - 8, cy - 13, 16, 2);
    g.fillRect(cx - 5, cy - 15, 10, 2);
    // Tassle — string + bob.
    g.fillStyle(0xc8a040, 1);
    g.fillRect(cx + 6, cy - 13, 1, 4);
    g.fillCircle(cx + 6, cy - 9, 1.3);

    // Face: stern eyebrows + downturned mouth + thick moustache.
    g.fillStyle(0x1a1010, 1);
    g.fillRect(cx - 3, cy - 9, 2, 1);
    g.fillRect(cx + 1, cy - 9, 2, 1);
    // Eyes — beady points.
    g.fillRect(cx - 2, cy - 8, 1, 1);
    g.fillRect(cx + 1, cy - 8, 1, 1);
    // Moustache — drooping bar.
    g.fillStyle(0x2a1010, 1);
    g.fillRect(cx - 3, cy - 5, 6, 1);
    g.fillRect(cx - 4, cy - 4, 1, 1);
    g.fillRect(cx + 3, cy - 4, 1, 1);
    // Mouth — firm line.
    g.fillStyle(0x1a1010, 1);
    g.fillRect(cx - 2, cy - 3, 4, 1);

    g.generateTexture('dean_apparition', s, s);
    g.destroy();
  }

  /**
   * Ledger Wraith — DESIGN_IDEAS section 3 Taxman's Retinue opener.
   * Translucent auditor silhouette, hollow eyes, trailing ledger pages
   * with red-ink drips. The "immune until Taxman takes damage" bullet
   * is deferred pending an event-bus gate — the wraith reads as a
   * Retinue advance scout on pure sprite language, not a new AI state.
   */
  private createLedgerWraith(): void {
    const s = 40;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Ghostly halo — cold paper-blue.
    g.fillStyle(0x8899aa, 0.18);
    g.fillEllipse(cx, cy, 22, 26);
    g.fillStyle(0x8899aa, 0.1);
    g.fillEllipse(cx, cy, 28, 32);

    // Floor-length robes — ink-stained.
    g.fillStyle(0x1a1a28, 0.9);
    g.fillTriangle(cx - 9, cy + 15, cx + 9, cy + 15, cx + 3, cy - 4);
    g.fillTriangle(cx - 9, cy + 15, cx - 3, cy - 4, cx + 3, cy - 4);
    g.fillStyle(0x2a2a3a, 1);
    g.fillTriangle(cx - 7, cy + 14, cx + 7, cy + 14, cx + 2, cy - 3);
    g.fillTriangle(cx - 7, cy + 14, cx - 2, cy - 3, cx + 2, cy - 3);

    // Torso — boxy, clerkly.
    g.fillStyle(0x20202e, 1);
    g.fillRect(cx - 5, cy - 5, 10, 8);

    // Stamped seal at chest — parchment white.
    g.fillStyle(0xe8ddb0, 0.9);
    g.fillRect(cx - 2, cy - 2, 4, 3);
    g.fillStyle(0xaa2020, 1);
    g.fillRect(cx - 1, cy - 1, 2, 1);

    // Head — pale, gaunt.
    g.fillStyle(0xddd4b0, 0.95);
    g.fillEllipse(cx, cy - 10, 7, 8);

    // Hollow eye sockets — two black pits.
    g.fillStyle(0x000000, 1);
    g.fillRect(cx - 2, cy - 11, 1, 2);
    g.fillRect(cx + 1, cy - 11, 1, 2);

    // Thin moustache / dour frown.
    g.fillStyle(0x1a1010, 1);
    g.fillRect(cx - 2, cy - 8, 4, 1);

    // Floating ledger page — parchment with ink ruled lines.
    g.fillStyle(0xe8ddb0, 0.92);
    g.fillRect(cx + 7, cy - 4, 7, 8);
    g.fillStyle(0x1a1a28, 0.8);
    g.fillRect(cx + 8, cy - 3, 5, 1);
    g.fillRect(cx + 8, cy - 1, 5, 1);
    g.fillRect(cx + 8, cy + 1, 5, 1);

    // Quill held in opposite hand — white feather with dark nib.
    g.fillStyle(0xf0e8d0, 1);
    g.fillRect(cx - 10, cy - 7, 1, 6);
    g.fillStyle(0x1a1010, 1);
    g.fillRect(cx - 10, cy - 2, 1, 2);

    // Red-ink drips beneath the page — signature threat beat.
    g.fillStyle(0xaa2020, 1);
    g.fillCircle(cx + 10, cy + 6, 1);
    g.fillStyle(0xaa2020, 0.7);
    g.fillCircle(cx + 13, cy + 8, 0.7);
    g.fillStyle(0xaa2020, 0.45);
    g.fillCircle(cx + 8, cy + 10, 0.5);

    g.generateTexture('ledger_wraith', s, s);
    g.destroy();
  }

  /**
   * Auditor Priest — DESIGN_IDEAS section 3 Taxman's Retinue #2.
   * Monastic, censer-tipped staff, book in the other hand. The "beam
   * ranged" bullet is deferred pending a beam-weapon class; the priest
   * ships on the existing `ranged` behaviour, its writ-of-audit
   * projectile reads through the sprite — the glowing censer bead at
   * the staff tip carries the threat telegraph.
   */
  private createAuditorPriest(): void {
    const s = 42;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // Ghostly aura — muted gold (censer glow bleeding out).
    g.fillStyle(0xffc840, 0.15);
    g.fillEllipse(cx, cy, 24, 28);

    // Floor-length cassock — charcoal wool.
    g.fillStyle(0x1a1820, 0.95);
    g.fillTriangle(cx - 10, cy + 16, cx + 10, cy + 16, cx + 3, cy - 4);
    g.fillTriangle(cx - 10, cy + 16, cx - 3, cy - 4, cx + 3, cy - 4);
    g.fillStyle(0x3a3540, 1);
    g.fillTriangle(cx - 8, cy + 15, cx + 8, cy + 15, cx + 2, cy - 3);
    g.fillTriangle(cx - 8, cy + 15, cx - 2, cy - 3, cx + 2, cy - 3);

    // Gold trim hem — thin line across the robe bottom.
    g.fillStyle(0xffc840, 0.8);
    g.fillRect(cx - 8, cy + 14, 16, 1);

    // Cowl shoulders — slight hunch forward.
    g.fillStyle(0x2a252f, 1);
    g.fillEllipse(cx, cy - 5, 12, 7);

    // Head — pale, hood-framed.
    g.fillStyle(0xddd4ba, 0.95);
    g.fillEllipse(cx, cy - 10, 7, 9);

    // Hood shadow over eyes.
    g.fillStyle(0x1a1820, 0.85);
    g.fillEllipse(cx, cy - 12, 8, 4);

    // Slit eyes glowing beneath the hood.
    g.fillStyle(0xffc840, 1);
    g.fillRect(cx - 2, cy - 11, 1, 1);
    g.fillRect(cx + 1, cy - 11, 1, 1);

    // Thin gaunt mouth line.
    g.fillStyle(0x1a1010, 1);
    g.fillRect(cx - 2, cy - 8, 4, 1);

    // Left hand clutching a small black book with gold clasp.
    g.fillStyle(0x1a1010, 1);
    g.fillRect(cx - 11, cy - 2, 5, 6);
    g.fillStyle(0xffc840, 1);
    g.fillRect(cx - 11, cy, 5, 1);
    g.fillRect(cx - 9, cy - 2, 1, 6);

    // Right hand raised holding the staff.
    g.fillStyle(0xddd4ba, 1);
    g.fillCircle(cx + 7, cy - 4, 1);

    // The staff — long dark shaft rising past the head.
    g.fillStyle(0x2a1a10, 1);
    g.fillRect(cx + 7, cy - 16, 1, 14);

    // Censer at the staff tip — glowing gold bead with bright core.
    g.fillStyle(0xffc840, 0.9);
    g.fillCircle(cx + 8, cy - 17, 3);
    g.fillStyle(0xfff0a0, 1);
    g.fillCircle(cx + 8, cy - 17, 1.5);
    g.fillStyle(0xfff8c8, 0.7);
    g.fillCircle(cx + 8, cy - 17, 0.7);
    // Wisps of smoke above the censer.
    g.fillStyle(0xddd0a0, 0.3);
    g.fillCircle(cx + 8, cy - 20, 1);
    g.fillStyle(0xddd0a0, 0.18);
    g.fillCircle(cx + 7, cy - 22, 0.8);

    g.generateTexture('auditor_priest', s, s);
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
    // Puffy top (tilted slightly — he's been screaming so hard his hat shifted).
    // Center puff y=-35 (was -36 — radius-9 circle there clipped at y=-1).
    g.fillStyle(0xbbbbbb, 1);
    g.fillCircle(cx - 9, cy - 33, 8);
    g.fillCircle(cx + 1, cy - 35, 9);
    g.fillCircle(cx + 11, cy - 34, 8);
    g.fillStyle(0xeeeeee, 1);
    g.fillCircle(cx - 9, cy - 33, 7);
    g.fillCircle(cx + 1, cy - 35, 8);
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
    const s = 96;  // up from 80 — a bus dwarfs a man
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // All offsets scaled 1.2× from 80px originals to fill 96px canvas proportionally.

    // === Bus body (MAGENTA/HOT PINK — the unmistakable First Glasgow livery) ===
    g.fillStyle(0x551133, 1);
    g.fillRect(cx - 41, cy - 19, 82, 38);
    g.fillStyle(0xaa2266, 1);
    g.fillRect(cx - 40, cy - 18, 80, 36);
    // Yellow swoosh stripe
    g.fillStyle(0xddcc22, 1);
    g.fillRect(cx - 40, cy - 10, 80, 3);
    g.fillStyle(0xbbaa11, 1);
    g.fillRect(cx - 40, cy - 7, 80, 1);

    // === Open top deck rail ===
    g.fillStyle(0x333333, 1);
    g.fillRect(cx - 36, cy - 22, 72, 2);
    g.fillRect(cx - 34, cy - 24, 1, 4);
    g.fillRect(cx - 22, cy - 24, 1, 4);
    g.fillRect(cx - 10, cy - 24, 1, 4);
    g.fillRect(cx + 2, cy - 24, 1, 4);
    g.fillRect(cx + 14, cy - 24, 1, 4);
    g.fillRect(cx + 26, cy - 24, 1, 4);

    // === HORIZONTAL rain (Glasgow rain goes SIDEWAYS) ===
    g.lineStyle(1, 0xaaddff, 0.4);
    g.lineBetween(cx - 30, cy - 26, cx - 24, cy - 25);
    g.lineBetween(cx - 12, cy - 28, cx - 6, cy - 27);
    g.lineBetween(cx + 6, cy - 25, cx + 12, cy - 24);
    g.lineBetween(cx + 22, cy - 26, cx + 28, cy - 25);
    g.lineBetween(cx - 18, cy - 24, cx - 12, cy - 23);
    g.lineBetween(cx + 14, cy - 28, cx + 20, cy - 27);

    // === Tourist faces in windows ===
    g.fillStyle(0x222244, 1);
    g.fillRect(cx - 36, cy - 16, 72, 7);
    g.fillStyle(0x88ccff, 0.7);
    for (let i = 0; i < 6; i++) {
      g.fillRect(cx - 35 + i * 12, cy - 15, 10, 6);
    }
    g.fillStyle(0xee8877, 1);
    g.fillCircle(cx - 30, cy - 12, 2);
    g.fillCircle(cx - 18, cy - 12, 2);
    g.fillCircle(cx - 6, cy - 12, 2);
    g.fillCircle(cx + 6, cy - 12, 2);
    g.fillCircle(cx + 18, cy - 12, 2);
    g.fillCircle(cx + 30, cy - 12, 2);

    // === Destination sign — "YOKER" ===
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 14, cy - 18, 28, 5);
    g.fillStyle(0xff8800, 1);
    g.fillRect(cx - 12, cy - 17, 24, 3);
    g.fillStyle(0xffaa00, 1);
    // Y
    g.fillRect(cx - 11, cy - 17, 1, 1);
    g.fillRect(cx - 9, cy - 17, 1, 1);
    g.fillRect(cx - 10, cy - 16, 1, 1);
    // O
    g.fillRect(cx - 6, cy - 17, 2, 1);
    g.fillRect(cx - 6, cy - 16, 2, 1);
    // K
    g.fillRect(cx - 3, cy - 17, 1, 2);
    g.fillRect(cx - 2, cy - 17, 1, 1);
    // E
    g.fillRect(cx, cy - 17, 2, 1);
    g.fillRect(cx, cy - 16, 1, 1);
    // R
    g.fillRect(cx + 3, cy - 17, 2, 1);
    g.fillRect(cx + 3, cy - 16, 1, 1);
    g.fillRect(cx + 4, cy - 16, 1, 1);

    // === Headlights (angry, bearing down) ===
    g.fillStyle(0xffff66, 1);
    g.fillCircle(cx + 40, cy - 5, 5);
    g.fillCircle(cx + 40, cy + 5, 5);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx + 40, cy - 5, 2.5);
    g.fillCircle(cx + 40, cy + 5, 2.5);
    g.fillStyle(0xffff88, 0.15);
    g.fillTriangle(cx + 43, cy - 7, cx + 43, cy + 7, cx + 55, cy);

    // === Traffic cone on bumper (Duke of Wellington nod!) ===
    g.fillStyle(0xff6600, 1);
    g.fillTriangle(cx + 41, cy + 11, cx + 46, cy + 17, cx + 36, cy + 17);
    g.fillStyle(0xff8833, 1);
    g.fillTriangle(cx + 41, cy + 12, cx + 44, cy + 17, cx + 37, cy + 17);
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(cx + 37, cy + 15, 7, 1);

    // === Bumper ===
    g.fillStyle(0x333333, 1);
    g.fillRect(cx - 40, cy + 17, 80, 5);
    g.fillStyle(0x555555, 1);
    g.fillRect(cx - 40, cy + 17, 80, 1);

    // === Wheels ===
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 24, cy + 24, 8);
    g.fillCircle(cx + 24, cy + 24, 8);
    g.fillStyle(0x333333, 1);
    g.fillCircle(cx - 24, cy + 24, 6);
    g.fillCircle(cx + 24, cy + 24, 6);
    g.fillStyle(0x888888, 1);
    g.fillCircle(cx - 24, cy + 24, 2.5);
    g.fillCircle(cx + 24, cy + 24, 2.5);

    // === Exhaust fumes ===
    g.fillStyle(0x444444, 0.4);
    g.fillCircle(cx - 43, cy + 10, 5);
    g.fillCircle(cx - 48, cy + 6, 6);
    g.fillCircle(cx - 53, cy + 2, 5);
    g.fillStyle(0x555555, 0.25);
    g.fillCircle(cx - 46, cy + 5, 4);
    g.fillCircle(cx - 50, cy + 1, 4);

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
    // Right horn — visibly bent wrong, ~30° off the symmetric curl
    g.fillStyle(0x887755, 1);
    g.fillTriangle(cx + 16, cy - 3, cx + 22, cy - 5, cx + 19, cy - 1);
    g.fillStyle(0xaa9966, 1);
    g.fillTriangle(cx + 16, cy - 3, cx + 21, cy - 4, cx + 18, cy - 1);
    g.fillStyle(0x776644, 0.6);
    g.fillRect(cx + 19, cy - 3, 2, 1);

    // Ears (one up, one flopped)
    g.fillStyle(0x000000, 1);
    g.fillTriangle(cx + 8, cy - 7, cx + 10, cy - 4, cx + 6, cy - 4);
    g.fillTriangle(cx + 14, cy - 4, cx + 16, cy - 2, cx + 13, cy - 1);

    // Creepy green-yellow WRONG eyes — goat eyes should not glow like this
    g.fillStyle(0xccff00, 1);
    g.fillCircle(cx + 10, cy - 2, 2);
    g.fillCircle(cx + 13, cy - 2, 2);
    g.fillStyle(0x000000, 1);
    g.fillRect(cx + 9, cy - 2, 2, 1);
    g.fillRect(cx + 12, cy - 2, 2, 1);

    // Asymmetric manic grin (left corner raised 3px — deeply wrong)
    g.fillStyle(0x444444, 1);
    g.fillRect(cx + 11, cy - 1, 1, 2);   // left corner high up
    g.fillRect(cx + 12, cy, 1, 2);
    g.fillRect(cx + 13, cy + 1, 1, 2);
    g.fillRect(cx + 14, cy + 2, 1, 2);   // right corner stays low
    g.fillRect(cx + 15, cy + 2, 1, 2);
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(cx + 11, cy - 1, 1, 1);
    g.fillRect(cx + 13, cy + 1, 1, 1);
    g.fillRect(cx + 15, cy + 2, 1, 1);

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

    // Wailing O-mouth (eternal scream)
    g.fillStyle(0x000000, 0.9);
    g.fillEllipse(cx, cy + 2, 6, 6);
    g.fillStyle(0x1a3344, 1);
    g.fillEllipse(cx, cy + 2, 4, 4);

    // ── Mary's crucifix (she wore one to the scaffold — ghostly gold) ──
    g.fillStyle(0xccaa55, 0.4);
    g.fillRect(cx - 1, cy - 3, 2, 5);
    g.fillRect(cx - 2, cy - 2, 4, 1);
    g.fillStyle(0xddbb66, 0.3);
    g.fillCircle(cx, cy - 3, 0.6);

    // ── Ectoplasmic drip (ghostly substance trailing down) ──
    g.fillStyle(0x88aaaa, 0.25);
    g.fillRect(cx - 8, cy + 12, 2, 4);
    g.fillCircle(cx - 7, cy + 16, 1);
    g.fillStyle(0xaacccc, 0.2);
    g.fillRect(cx + 6, cy + 13, 1, 3);
    g.fillCircle(cx + 6, cy + 16, 0.8);

    // ── Faint execution mark (dark line across neck — she was beheaded) ──
    g.fillStyle(0x884455, 0.2);
    g.fillRect(cx - 4, cy - 3, 8, 1);

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

  private createDeepFryer(): void {
    const s = 48;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // ── Stainless steel body (industrial, battered from years of service) ──
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(cx - 18, cy - 6, 36, 22);
    g.fillStyle(0x555555, 1);
    g.fillRect(cx - 17, cy - 5, 34, 20);
    // Top rim (polished steel — catches light)
    g.fillStyle(0x777777, 1);
    g.fillRect(cx - 16, cy - 4, 32, 4);
    // Control panel strip (above the vat)
    g.fillStyle(0x444444, 1);
    g.fillRect(cx - 18, cy - 8, 36, 3);
    g.fillStyle(0x999999, 1);
    g.fillRect(cx - 18, cy - 7, 36, 1);
    // Temperature dial (red dot — it's on MAX)
    g.fillStyle(0xcc2222, 1);
    g.fillCircle(cx - 14, cy - 7, 1);
    g.fillStyle(0x666666, 1);
    g.fillCircle(cx - 10, cy - 7, 1);
    // Handles (heavy, welded)
    g.fillStyle(0x222222, 1);
    g.fillRect(cx - 22, cy - 5, 5, 3);
    g.fillRect(cx + 17, cy - 5, 5, 3);
    // Wire chip basket handle (visible above the oil — the tool of the trade)
    g.lineStyle(1.5, 0x888888, 0.8);
    g.lineBetween(cx + 14, cy - 8, cx + 14, cy - 12);
    g.lineBetween(cx + 12, cy - 12, cx + 16, cy - 12);
    // Basket hook
    g.fillStyle(0x999999, 1);
    g.fillCircle(cx + 14, cy - 12, 1);

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

    // (Salt shaker and vinegar bottle removed — declutter for readability)

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


  private bakeHaggisAtlas(): number {
    const startMs = performance.now();
    const size = getHaggisSpriteSize();
    for (const variant of VARIANTS) {
      const allKeys = allAtlasKeysForVariant('haggis', variant.key);
      for (const key of allKeys) {
        // Atlas key shape: `haggis_<variant>_<state>_<frame>`. All FSM
        // state names are single tokens (idle, walking, attacking,
        // hurt, celebrating, dying), so the state always sits at [-2]
        // regardless of how many underscores the variant key contains.
        const parts = key.split('_');
        const frame = Number(parts[parts.length - 1]);
        const state = parts[parts.length - 2] as AnimationState;
        const g = this.add.graphics();
        drawHaggisFrame(g, {
          variantPalette: CLASSIC_VARIANT,
          state,
          frame,
          variantKey: variant.key,
        });
        g.generateTexture(key, size, size);
        g.destroy();
      }
    }
    return performance.now() - startMs;
  }

  private bakeAccessoryAtlas(): number {
    const startMs = performance.now();
    for (const drawer of Object.values(ACCESSORY_REGISTRY)) {
      const authored = new Set<AnimationState>(drawer.authoredStates);
      for (const state of ALL_ANIMATION_STATES) {
        const frameCount = getFrameCountForState(state);
        for (let frame = 0; frame < frameCount; frame++) {
          const g = this.add.graphics();
          // Unauthored states fall back to the drawer's idle frame 0 —
          // rigid accessories ride the head anchor without per-state
          // motion. Authored states get their own beat.
          if (authored.has(state)) {
            drawer.draw(g, { variantPalette: CLASSIC_VARIANT, state, frame });
          } else {
            drawer.draw(g, { variantPalette: CLASSIC_VARIANT, state: 'idle', frame: 0 });
          }
          const key = `${drawer.id}_${state}_${frame}`;
          g.generateTexture(key, 80, 80);
          g.destroy();
        }
      }
    }
    return performance.now() - startMs;
  }

}
