import * as Phaser from 'phaser';
import { COLORS_CSS } from '../config';
import {
  DEFAULT_VARIANT_KEY,
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
import { loadSave } from '../utils/save';
import {
  bakeEnemyAtlas,
  bakeNonVariantAccessoryAtlas,
  ensureAllVariantAtlases,
  ensureVariantAtlas,
} from './boot/variantAtlasBaker';
import { bakeDecorations } from '../art/sprites/decorations';
import { bakeGranTextures } from '../art/sprites/croft/gran';
import { bakeHearthTextures } from '../art/sprites/croft/hearth';
import { uploadNoiseTexture, type TextureManagerLike } from '../systems/shaders/shaders/uploadNoise';
import {
  markPhotosensitivityWarningSeen,
  shouldShowPhotosensitivityWarning,
} from '../ui/photosensitivityWarning';
import { showPhotosensitivityWarningSplash } from '../ui/PhotosensitivityWarningSplash';
import {
  markCulturalContentSplashSeen,
  shouldShowCulturalContentSplash,
} from '../ui/culturalContent';
import { showCulturalContentSplash } from '../ui/CulturalContentSplash';
import { ensureLazyToolScene } from '../tools/lazyToolScenes';
import { bakeHud } from '../art/sprites/hud';
import { bakeFx } from '../art/sprites/fx';
import { bakeProjectiles } from '../art/sprites/projectiles';
import { bakePickups } from '../art/sprites/pickups';
import { bakeWeaponIcons } from '../art/sprites/icons/weapons';
import { bakeCardIcons } from '../art/sprites/icons/cards';
import { bakeRelicIcons } from '../art/sprites/icons/relics';
import { bakeWildlife } from '../art/sprites/wildlife';
import { bakeEnemies } from '../art/sprites/enemies';
import { bakeBosses } from '../art/sprites/bosses';
import { bakePlayerVariants } from '../art/sprites/players';
import { bakeNodeMarkers } from '../art/sprites/nodeMarkers';
import { bakeMoorMomentTokens } from '../art/sprites/moorMomentTokens';
import { bakeCroftWarmthProps } from '../art/sprites/croft/warmthProps';
import { bakeCroftInteriorTextures } from '../art/sprites/croft/interiorTextures';
import { bakeCroftKeepsakes } from '../art/sprites/croft/keepsakes';
import { bakeCroftVisitors } from '../art/sprites/croft/visitors';
import { bakeUi } from '../art/sprites/ui';
import { snapshotTextureKeys, outlineNewTextures } from '../art/outlinePostProcess';
// Side-effect imports — registers each animated enemy drawer into the
// registry on module load; the lazy bake helper in `boot/variantAtlasBaker`
// iterates the registry but does not own the registration.
// Side-effect imports — registers each drawer into the registry on module load:
import '../animation/frameDrawers/enemies/buckfastNedFrames';
import '../animation/frameDrawers/enemies/eagleFrames';
import '../animation/frameDrawers/enemies/haggisHunterFrames';
import '../animation/frameDrawers/enemies/touristFrames';
import '../animation/frameDrawers/enemies/chefFrames';
import '../animation/frameDrawers/enemies/highlandCowFrames';
import '../animation/frameDrawers/enemies/angryScotsmanFrames';
import '../animation/frameDrawers/enemies/piperFrames';
import '../animation/frameDrawers/enemies/ghostFrames';
import '../animation/frameDrawers/enemies/sheepFrames';
import '../animation/frameDrawers/enemies/kelpieFrames';
import '../animation/frameDrawers/enemies/barghestFrames';
import '../animation/frameDrawers/enemies/cuSithFrames';
import '../animation/frameDrawers/enemies/kelpieFoalFrames';
import '../animation/frameDrawers/enemies/blueManOfMinchFrames';
import '../animation/frameDrawers/enemies/edinburghGhostGuideFrames';
import '../animation/frameDrawers/enemies/redcapFrames';
import '../animation/frameDrawers/enemies/haarWraithFrames';
import '../animation/frameDrawers/enemies/galeWraithFrames';
import '../animation/frameDrawers/enemies/tomeWraithFrames';
import '../animation/frameDrawers/enemies/deanApparitionFrames';
import '../animation/frameDrawers/enemies/ledgerWraithFrames';
import '../animation/frameDrawers/enemies/seelieFrames';
import '../animation/frameDrawers/enemies/unseelieFiddlerFrames';
import '../animation/frameDrawers/enemies/ceilidhCallerFrames';
import '../animation/frameDrawers/enemies/auditorPriestFrames';
import '../animation/frameDrawers/enemies/gordonFrames';
import '../animation/frameDrawers/enemies/tourBusFrames';
import '../animation/frameDrawers/enemies/lairdFrames';
import '../animation/frameDrawers/enemies/hunterGeneralFrames';
import '../animation/frameDrawers/enemies/taxmanFrames';

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
    //
    // ADR-0005 descope (2026-05-11): boot now bakes only the default
    // variant + the saved selected variant (~13ms total instead of
    // ~210ms for all 15 variants). Other variants bake lazily via
    // `ensureVariantAtlas(scene, key)` in `GameScene.create()` once the
    // active variant is resolved. The sprite-export tool below force-
    // bakes every variant so the composite PNG stays complete.
    const nonVariantAccessoryStart = performance.now();
    const nonVariantAccessoryCount = bakeNonVariantAccessoryAtlas(this);
    console.info(
      `[BootScene] Non-variant accessory bake: +${nonVariantAccessoryCount} keys, ${(performance.now() - nonVariantAccessoryStart).toFixed(1)} ms`,
    );

    const classicReport = ensureVariantAtlas(this, DEFAULT_VARIANT_KEY);
    console.info(
      `[BootScene] Variant atlas bake (default ${DEFAULT_VARIANT_KEY}): +${classicReport.bakedHaggis + classicReport.bakedAccessories + classicReport.bakedMantle} keys, ${classicReport.totalMs.toFixed(1)} ms`,
    );

    // Saved-variant warmup keeps the cold-vs-Play latency invariant the
    // ADR optimised for: a returning player who picked, say, the
    // Cailleach last session sees zero bake hitch when they hit Play
    // because the atlas is already in cache before MainMenu renders.
    try {
      const savedSave = loadSave();
      const savedVariant = savedSave.selectedVariant;
      if (savedVariant && savedVariant !== DEFAULT_VARIANT_KEY) {
        const savedReport = ensureVariantAtlas(this, savedVariant);
        console.info(
          `[BootScene] Variant atlas bake (saved ${savedVariant}): +${savedReport.bakedHaggis + savedReport.bakedAccessories + savedReport.bakedMantle} keys, ${savedReport.totalMs.toFixed(1)} ms`,
        );
      }
    } catch {
      /* Save read failures are surfaced by `emitSaveFailure` elsewhere; the
         classic-only fallback above keeps boot functional in the meantime. */
    }

    const enemyBakeStart = performance.now();
    const enemyCount = bakeEnemyAtlas(this);
    console.info(
      `[BootScene] Enemy atlas bake: +${enemyCount} keys, ${(performance.now() - enemyBakeStart).toFixed(1)} ms`,
    );

    // Dev tool: skip splash and go straight to sprite export. The
    // export tool needs every variant atlas in cache (it composites
    // a single PNG over all variants), so warm the rest here.
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('export')) {
      const exportStart = performance.now();
      const exportReports = ensureAllVariantAtlases(this);
      const exportTotal = exportReports.reduce(
        (a, r) => a + r.bakedHaggis + r.bakedAccessories + r.bakedMantle,
        0,
      );
      console.info(
        `[BootScene] Sprite-export warmup: +${exportTotal} keys, ${(performance.now() - exportStart).toFixed(1)} ms`,
      );
      void this.startSpriteExportScene();
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
      fontFamily: 'monospace', fontSize: '12px', color: COLORS_CSS.STATUS_TAN,
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
        // Hold, then fade everything and transition to MainMenu — with
        // an A1 M5 intercept: on a fresh save, surface the
        // photosensitivity warning splash before the first menu paints.
        // The dawn painting is already faded to black underneath the
        // modal, so there's no competing imagery.
        this.tweens.add({
          targets: allFadeTargets,
          alpha: 0,
          delay: 800,
          duration: 400,
          onComplete: () => this.maybeShowPhotosensitivityWarningThenStart(),
        });
      },
    });
  }

  /**
   * A1 M5 (+ 2026-05-10 cultural splash) — first-launch acknowledgement
   * chain. Called once the boot dawn painting has faded. On a fresh save
   * the photosensitivity splash shows first (safety-critical), then on
   * dismissal the cultural-content notice shows (respect-signal for the
   * dialect content), then MainMenu. Returning players skip whichever
   * splash they've already dismissed. Both flags are sticky — there is
   * no way to re-trigger short of wiping settings storage.
   */
  private maybeShowPhotosensitivityWarningThenStart(): void {
    const settings = getSettingsManager();
    const goMenu = () => this.scene.start('MainMenu');
    const maybeCulturalThenMenu = () => {
      if (!shouldShowCulturalContentSplash(settings.load())) {
        goMenu();
        return;
      }
      showCulturalContentSplash(this, {
        onDismiss: () => {
          settings.update((cur) => markCulturalContentSplashSeen(cur));
          goMenu();
        },
      });
    };
    if (!shouldShowPhotosensitivityWarning(settings.load())) {
      maybeCulturalThenMenu();
      return;
    }
    showPhotosensitivityWarningSplash(this, {
      onDismiss: () => {
        settings.update((cur) => markPhotosensitivityWarningSeen(cur));
        maybeCulturalThenMenu();
      },
    });
  }

  private async startSpriteExportScene(): Promise<void> {
    try {
      await ensureLazyToolScene(this.game, 'SpriteExport');
      this.scene.start('SpriteExport');
    } catch (err) {
      console.error('[BootScene] Failed to load SpriteExport scene', err);
      this.add
        .text(
          this.scale.width / 2,
          this.scale.height / 2,
          'Sprite export failed to load',
          {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: COLORS_CSS.WHISKY_GOLD,
          },
        )
        .setOrigin(0.5);
    }
  }

  private generateAllTextures(): void {
    // Per-bake timing — atlas-export pipelines (Playwright + headless
    // Chromium) trip a "Framebuffer Unsupported" pageerror during this
    // method when the texture set is large. The console.info trail
    // makes the failing bake call identifiable next time the export
    // hangs. See `reference_atlas_export_phaser4_limit.md` in memory.
    const bake = (label: string, fn: () => void): void => {
      const t0 = performance.now();
      const before = this.textures.getTextureKeys().length;
      fn();
      const after = this.textures.getTextureKeys().length;
      console.info(
        `[BootScene] bake ${label}: +${after - before} keys, ${(performance.now() - t0).toFixed(1)} ms`,
      );
    };

    // Player variants — outline each variant texture.
    let before = snapshotTextureKeys(this);
    bake('player-variants', () => bakePlayerVariants(this));
    outlineNewTextures(this, before);

    // Enemies — outline every enemy sprite (shadows excluded internally).
    before = snapshotTextureKeys(this);
    bake('enemies', () => bakeEnemies(this));
    outlineNewTextures(this, before);

    // Projectiles — outline every projectile sprite.
    before = snapshotTextureKeys(this);
    bake('projectiles', () => bakeProjectiles(this));
    outlineNewTextures(this, before);

    // Bosses — outline every boss sprite (shadows excluded internally).
    before = snapshotTextureKeys(this);
    bake('bosses', () => bakeBosses(this));
    outlineNewTextures(this, before);

    // Pickups — NO outline (glows fight with borders).
    bake('pickups', () => bakePickups(this));
    // Ground shadows + weather + film grain live in src/art/sprites/fx/.
    bake('fx', () => bakeFx(this));
    // Environmental decoration sprites (thistle, rocks, heather, etc.).
    bake('decorations', () => bakeDecorations(this));
    // HUD chrome (shield, dash pips) lives in src/art/sprites/hud/.
    bake('hud', () => bakeHud(this));
    // Weapon + upgrade-card icons live in src/art/sprites/icons/.
    bake('weapon-icons', () => bakeWeaponIcons(this));
    bake('card-icons', () => bakeCardIcons(this));
    bake('relic-icons', () => bakeRelicIcons(this));
    // Moor Road route markers + moor-moment tokens.
    bake('node-markers', () => bakeNodeMarkers(this));
    bake('moor-tokens', () => bakeMoorMomentTokens(this));
    // Ambient wildlife (hare, etc.) for world dressing.
    bake('wildlife', () => bakeWildlife(this));
    // H1 Gran's Croft — hub sprites (Gran, hearth, etc.).
    bake('croft-gran', () => bakeGranTextures(this));
    bake('croft-hearth', () => bakeHearthTextures(this));
    bake('croft-interior', () => bakeCroftInteriorTextures(this));
    bake('croft-warmth', () => bakeCroftWarmthProps(this));
    bake('croft-keepsakes', () => bakeCroftKeepsakes(this));
    // Croft visitors — postie, neighbour, weans, standing sheepdog,
    // a returning haggis pal. Warmth-only NPCs, no gameplay role yet.
    bake('croft-visitors', () => bakeCroftVisitors(this));
    // UI ornament — card-rarity frames, banter-bubble corners, toast
    // parchment. Available for future UI systems to opt in.
    bake('ui', () => bakeUi(this));
    // F1 — shared noise texture for haar fog (and future shaders that
    // sample from it: dissolve, heat-shimmer). One TextureManager entry
    // referenced by `NOISE_TEXTURE_KEY`; Phaser handles WebGL
    // context-lost restore automatically for cached entries.
    uploadNoiseTexture(this.textures as unknown as TextureManagerLike);
  }



}
