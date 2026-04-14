/**
 * LevelUpFlow — owns the level-up ceremony and the upgrade-card resolution
 * pipeline that used to live across ~335 lines of GameScene: the banner
 * + aura + heal + milestone power-surge at `onLevelUp`, the card pool
 * build + luck-bonused draw, the reroll flow, `applyUpgrade` and its two
 * dispatch helpers (`applyPassiveEffect`, `applyStatBoost`), and the
 * forced-evolution chest handoff.
 *
 * Extraction is mechanical — these methods still mutate scene state
 * through the hooks object rather than via `scene as any`. The hooks
 * surface is wide because the level-up flow genuinely touches a wide
 * slice of the game: player, weapons, xp, spawns, juice, status FX,
 * time manager, tutorial, event bus, and run-scoped collections.
 */
import Phaser from 'phaser';
import type { Player } from '../../entities/Player';
import type { Enemy } from '../../entities/Enemy';
import type { WeaponSystem } from '../../systems/WeaponSystem';
import type { XPSystem } from '../../systems/XPSystem';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { StatusFxPool } from '../../systems/StatusFxPool';
import type { TutorialSystem } from '../../systems/TutorialSystem';
import type { TimeManager } from '../../systems/TimeManager';
import type { UpgradeCardsUI } from '../../ui/UpgradeCards';
import type { RNG } from '../../utils/rng';
import { XP, PLAYER } from '../../config';
import {
  buildCardPool,
  drawCards,
  UpgradeCard,
} from '../../data/upgrades';
import {
  evolutionRecipeToUpgradeCard,
  findEligibleChestEvolution,
} from '../../core/evolutionChest';
import { t } from '../../core/i18n';
import { loadSave } from '../../utils/save';
import { audio } from '../../systems/AudioSystem';
import { globalEventBus } from '../../core/GlobalEventBus';
import { applyPassiveEffect as applyPassiveEffectPure } from './passiveEffects';

export interface LevelUpFlowHooks {
  getPlayer(): Player;
  getWeaponSystem(): WeaponSystem;
  getXPSystem(): XPSystem;
  getSpawnSystem(): SpawnSystem;
  getJuice(): JuiceSystem;
  getStatusFxPool(): StatusFxPool;
  getTutorialSystem(): TutorialSystem;
  getTimeManager(): TimeManager;
  getUpgradeUI(): UpgradeCardsUI;
  getRunRng(): RNG;
  getOwnedPassives(): string[];
  pushOwnedPassive(key: string): void;
  getEvolvedWeapons(): string[];
  pushEvolvedWeapon(key: string): void;
  getAnnouncedEvolutionReady(): Set<string>;
  addKill(n?: number): void;
  getUiViewport(): { x: number; y: number; width: number; height: number };
  armIFrames(durationMs: number): void;
  drainPendingChests(): void;
  caption(id: string, message: string, tint?: string, durationMs?: number): void;
  requestBanter?(context: import('../../data/banter').BanterContext, tag?: string): void;
}

export class LevelUpFlow {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly hooks: LevelUpFlowHooks,
  ) {}

  handleLevelUp(newLevel: number): void {
    const scene = this.scene;
    const player = this.hooks.getPlayer();
    const juice = this.hooks.getJuice();
    const xpSystem = this.hooks.getXPSystem();
    const timeManager = this.hooks.getTimeManager();

    this.hooks.getTutorialSystem().notifyFirstLevelReached(newLevel);
    xpSystem.vacuumAllGems();
    audio.playLevelUp();
    juice.flashWhite();
    juice.hideCombo();

    const { x, y, width } = this.hooks.getUiViewport();
    const banner = scene.add.text(x + width / 2, y + 140, t('ui.game.level_banner', { level: newLevel }), {
      fontFamily: 'monospace', fontSize: '36px', color: '#d4a017',
      fontStyle: 'bold', stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(199).setAlpha(0).setScale(0.5);
    scene.tweens.add({
      targets: banner, alpha: 1, scale: 1.1, duration: 300, ease: 'Back.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: banner, alpha: 0, scale: 1.3, duration: 400, delay: 200,
          onComplete: () => banner.destroy(),
        });
      },
    });

    timeManager.request('LEVEL_UP', { pausePhysics: true, timeScale: 0 });
    player.onLevelUp(newLevel);

    // ── Golden aura pulse around the player ──
    const auraOuter = scene.add.circle(player.x, player.y, 30, 0xffdd44, 0.4).setDepth(2);
    const auraInner = scene.add.circle(player.x, player.y, 20, 0xffee88, 0.6).setDepth(2);
    scene.tweens.add({
      targets: auraOuter, scale: 3, alpha: 0, duration: 700, ease: 'Quad.easeOut',
      onComplete: () => auraOuter.destroy(),
    });
    scene.tweens.add({
      targets: auraInner, scale: 2.2, alpha: 0, duration: 500, ease: 'Quad.easeOut',
      onComplete: () => auraInner.destroy(),
    });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const sparkle = scene.add.circle(player.x, player.y, 2.5, 0xffee88, 0.9).setDepth(3);
      scene.tweens.add({
        targets: sparkle,
        x: player.x + Math.cos(angle) * 45,
        y: player.y + Math.sin(angle) * 45,
        alpha: 0, scale: 0.3,
        duration: 500 + i * 20,
        ease: 'Quad.easeOut',
        onComplete: () => sparkle.destroy(),
      });
    }

    player.heal(Math.ceil(player.getMaxHp() * 0.10));

    // Milestone damage pulse at levels 10, 20, 30
    if ([10, 20, 30].includes(newLevel)) {
      const dmg = newLevel * 3;
      const radius = 300 + newLevel * 10;
      const radiusSq = radius * radius;
      const enemies = this.hooks.getSpawnSystem().getEnemyGroup().children.entries as Enemy[];
      for (const e of enemies) {
        if (!e.active || e.isBoss()) continue;
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        if (dx * dx + dy * dy <= radiusSq) e.takeDamageWithKillEvents(dmg);
      }
      juice.flashWhite(400);
      juice.showToast(t('ui.game.level_power_surge', { level: newLevel }), '#ff8800');
      const ring = this.hooks.getStatusFxPool().acquireArc(player.x, player.y, 20, 0xffaa44, 0.5);
      scene.tweens.add({
        targets: ring, radius, alpha: 0, duration: 600,
        onComplete: () => { ring.setVisible(false); },
      });
    }

    const cards = this.buildCardDraw(newLevel);

    const evoRecipe = this.findEvolution();
    if (evoRecipe && !this.hooks.getAnnouncedEvolutionReady().has(evoRecipe.baseWeapon)) {
      this.hooks.getAnnouncedEvolutionReady().add(evoRecipe.baseWeapon);
      const evoCard = evolutionRecipeToUpgradeCard(evoRecipe);
      const msg = t('ui.game.evolution_primed', { name: t(evoCard.name) });
      juice.showToast(msg, '#ffcc44');
      this.hooks.caption(`evo_${evoRecipe.baseWeapon}`, msg, '#ffcc44');
    }

    if (cards.length === 0) {
      juice.showToast(t('ui.game.level_up_fallback'), '#ffdd00');
      timeManager.release('LEVEL_UP');
      xpSystem.processNextLevelUp();
      return;
    }

    const ui = this.hooks.getUpgradeUI();
    ui.grantReroll();
    ui.show(cards, newLevel);
  }

  reroll(): void {
    const level = this.hooks.getXPSystem().getLevel();
    const cards = this.buildCardDraw(level);
    this.hooks.getUpgradeUI().show(cards, level);
    audio.playClick();
  }

  offerChestEvolution(): void {
    const recipe = this.findEvolution();
    if (!recipe) return;
    this.hooks.getTimeManager().request('LEVEL_UP', { pausePhysics: true, timeScale: 0 });
    const card = evolutionRecipeToUpgradeCard(recipe);
    this.hooks.getUpgradeUI().show([card], this.hooks.getXPSystem().getLevel(), {
      bannerTitle: t('ui.upgradeCards.chest_evolution_title'),
      bannerSubtitle: t('ui.upgradeCards.chest_evolution_sub'),
      hideReroll: true,
    });
  }

  apply(card: UpgradeCard): void {
    const effect = card.effect;
    const cardTitle = t(card.name);
    const player = this.hooks.getPlayer();
    const juice = this.hooks.getJuice();
    const weaponSystem = this.hooks.getWeaponSystem();
    const scene = this.scene;

    switch (effect.type) {
      case 'add_weapon':
        weaponSystem.addWeapon(effect.weaponKey);
        juice.showToast(t('ui.game.upgrade_new_weapon', { name: cardTitle }), '#44dd44');
        juice.flashWhite(200);
        {
          const ring = this.hooks.getStatusFxPool().acquireArc(player.x, player.y, 10, 0x44dd44, 0.5);
          scene.tweens.add({ targets: ring, radius: 80, alpha: 0, duration: 400, onComplete: () => { ring.setVisible(false); } });
        }
        break;

      case 'level_weapon':
        weaponSystem.levelUpWeapon(effect.weaponKey);
        juice.showToast(t('ui.game.upgrade_weapon_level', { name: cardTitle }), '#4488dd');
        break;

      case 'add_passive':
        this.hooks.pushOwnedPassive(effect.passiveKey);
        this.applyPassiveEffect(effect.passiveKey);
        juice.showToast(t('ui.game.upgrade_add_passive', { name: cardTitle }), '#ddaa00');
        break;

      case 'stat_boost':
        this.applyStatBoost(effect.stat, effect.amount);
        juice.showToast(t('ui.game.upgrade_stat_boost', { name: cardTitle }), '#88ccff');
        break;

      case 'evolve_weapon':
        weaponSystem.evolveWeapon(effect.weaponKey, effect.evolutionKey);
        if (!this.hooks.getEvolvedWeapons().includes(effect.weaponKey)) {
          this.hooks.pushEvolvedWeapon(effect.weaponKey);
        }
        this.hooks.getAnnouncedEvolutionReady().delete(effect.weaponKey);
        juice.showToast(t('ui.game.upgrade_evolve_weapon', { name: cardTitle }), '#ffaa00');
        juice.evolutionSpectacle(player.x, player.y, cardTitle);
        audio.playLevelUp();
        this.hooks.requestBanter?.('weapon_evolve', effect.weaponKey);
        globalEventBus.emit('GLOBAL_WEAPON_EVOLVED', {
          weaponKey: effect.weaponKey,
          evolvedKey: effect.evolutionKey,
        });
        break;
    }

    const xpSystem = this.hooks.getXPSystem();
    if (xpSystem.hasPendingLevelUps()) {
      xpSystem.processNextLevelUp();
    } else {
      xpSystem.processNextLevelUp();
      this.hooks.getTimeManager().release('LEVEL_UP');

      player.setAlpha(0.7);
      this.hooks.armIFrames(1000);

      if (xpSystem.getLevel() >= XP.MAX_LEVEL) {
        juice.showToast(t('ui.game.max_level_toast'), '#ffdd00');
      }

      this.hooks.drainPendingChests();
    }
  }

  private buildCardDraw(_level: number): UpgradeCard[] {
    const weaponSystem = this.hooks.getWeaponSystem();
    const player = this.hooks.getPlayer();
    const ownedPassives = this.hooks.getOwnedPassives();
    const evolvedWeapons = this.hooks.getEvolvedWeapons();

    const ownedWeapons = weaponSystem.getWeapons().map(w => w.config.key);
    const weaponLevels: Record<string, number> = {};
    for (const w of weaponSystem.getWeapons()) {
      weaponLevels[w.config.key] = w.level;
    }

    let pool = buildCardPool(ownedWeapons, ownedPassives, weaponLevels, evolvedWeapons);
    if (player.getHp() >= player.getMaxHp()) {
      pool = pool.filter(c => !(c.effect.type === 'stat_boost' && (c.effect.stat === 'heal' || c.effect.stat === 'healPercent')));
    }

    const save = loadSave();
    let luckBonus = 0;
    if (ownedPassives.includes('sporran')) luckBonus += 15;
    luckBonus += (save.upgrades['lucky_heather'] ?? 0) * 10;
    luckBonus += player.getLuckDrawBonus();

    const extraChoice = (save.upgrades['extra_choice'] ?? 0) > 0;
    const cardCount = extraChoice ? XP.CARDS_PER_LEVEL + 1 : XP.CARDS_PER_LEVEL;
    const rng = this.hooks.getRunRng();
    return drawCards(pool, cardCount, luckBonus, () => rng.next(), {
      duplicateWeightMultiplier: 0.22,
      synergyContext: { ownedWeaponKeys: ownedWeapons },
    });
  }

  private findEvolution(): ReturnType<typeof findEligibleChestEvolution> {
    const weaponSystem = this.hooks.getWeaponSystem();
    const ownedWeapons = weaponSystem.getWeapons().map((w) => w.config.key);
    const weaponLevels: Record<string, number> = {};
    for (const w of weaponSystem.getWeapons()) {
      weaponLevels[w.config.key] = w.level;
    }
    return findEligibleChestEvolution(
      ownedWeapons,
      this.hooks.getOwnedPassives(),
      weaponLevels,
      this.hooks.getEvolvedWeapons(),
    );
  }

  applyPassiveEffect(key: string): void {
    applyPassiveEffectPure(this.hooks.getPlayer(), key);
  }

  private applyStatBoost(stat: string, amount: number): void {
    const player = this.hooks.getPlayer();
    switch (stat) {
      case 'maxHp':
        player.addMaxHp(amount);
        break;
      case 'speed':
        player.addSpeed(PLAYER.SPEED * amount);
        break;
      case 'pickup':
        player.addPickupRadius(amount);
        break;
      case 'drift':
        player.reduceDrift(amount);
        break;
      case 'heal':
        player.heal(amount);
        break;
      case 'healPercent':
        player.heal(Math.ceil(player.getMaxHp() * amount));
        break;
      case 'damage':
        player.addDamageMultiplier(amount);
        break;
      case 'crit':
        player.addCritChance(amount);
        break;
      case 'regen':
        player.addHpRegen(amount);
        break;
      case 'armor':
        player.addArmor(amount);
        break;
      case 'cooldown':
        player.addCooldownReduction(amount);
        break;
      case 'xpMultiplier':
        player.addXpMultiplier(amount);
        break;
      case 'luck':
        player.addLuckDrawBonus(amount);
        break;
      case 'lifesteal':
        player.addLifesteal(amount);
        break;
      case 'projectileSpeed':
        player.addProjectileSpeedMul(amount);
        break;
      case 'knockback':
        player.addKnockbackMul(amount);
        break;
      case 'bossHeal':
        player.addBossHealFrac(amount);
        break;
      case 'banish': {
        const BANISH_RANGE = 300;
        const BANISH_RANGE_SQ = BANISH_RANGE * BANISH_RANGE;
        const px = player.x, py = player.y;
        const spawnSystem = this.hooks.getSpawnSystem();
        const juice = this.hooks.getJuice();
        const xpSystem = this.hooks.getXPSystem();
        const enemies = (spawnSystem.getEnemyGroup().children.entries as Enemy[])
          .filter(e => {
            if (!e.active || e.isBoss() || e.getBehavior() === 'hazard') return false;
            const dx = e.x - px;
            const dy = e.y - py;
            return dx * dx + dy * dy <= BANISH_RANGE_SQ;
          })
          .sort((a, b) => a.getHp() - b.getHp())
          .slice(0, amount);
        for (const e of enemies) {
          const enemyKey = e.getEnemyKey();
          const xpValue = e.getXpValue();
          const wasElite = e.isElite();
          const eliteAffixId = e.getEliteAffixId();
          juice.showKillBurst(e.x, e.y, 0xffffff);
          xpSystem.spawnGem(e.x, e.y, xpValue);
          this.hooks.addKill(1);
          e.forceKill();
          globalEventBus.emit('GLOBAL_ENEMY_KILLED', {
            enemyKey,
            xpValue,
            wasBoss: false,
            wasElite,
            eliteAffixId: wasElite ? eliteAffixId : undefined,
          });
        }
        juice.flashWhite(200);
        break;
      }
    }
  }
}
