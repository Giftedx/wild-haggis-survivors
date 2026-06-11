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
import * as Phaser from 'phaser';
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
import { XP, PLAYER, COLORS_CSS } from '../../config';
import {
  buildCardPool,
  drawCards,
  UpgradeCard,
  ECHO_CARDS,
} from '../../data/upgrades';
import {
  evolutionRecipeToUpgradeCard,
  findEligibleChestEvolution,
} from '../../core/evolutionChest';
import { t } from '../../core/i18n';
import { bumpFirstTimeEvent, bumpItemAcquired, bumpSeenRune, loadSave } from '../../utils/save';
import { audio } from '../../systems/AudioSystem';
import { globalEventBus } from '../../core/GlobalEventBus';
import { applyPassiveEffect as applyPassiveEffectPure } from './passiveEffects';
import {
  filterHealCardsWhenFull,
  resolveLuckBonus,
  resolveCardCount,
} from './levelUpDraw';

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
  /**
   * C1 M3 Task 16 — stable per-run discovery id (shape: `run:${seed}`).
   * Threaded through so `bumpItemAcquired` can stamp the firstAcquiredAt
   * record with the run that picked the item — keeps the persisted log
   * matching SpawnSystem's beasties stamps.
   */
  getDiscoveryRunId(): string;

  /**
   * R1 M3 T20f — additive luck-draw points from held relics. Default
   * 0 when the driver isn't wired (unit-test scenes). LevelUpFlow
   * threads this on top of `resolveLuckBonus()` so a relic composes
   * with the existing sporran/lucky_heather ladder.
   */
  getRelicLuckPoints?(): number;

  /**
   * R1 M2 T15 — legendary chest Relic override. When a chest would
   * show an evolution card, this hook rolls the 25% Relic-override
   * chance. Returning `true` means the override fired: a Relic
   * pickup was spawned in place of the evolution offer and the UI
   * should NOT be shown. Returning `false` (or omitting the hook)
   * routes the normal evolution flow.
   */
  tryChestLegendaryRelicOverride?(): boolean;

  /**
   * U1 Task 14 — rune lifecycle hooks.
   *
   * - `isBossKilledThisRun()` is the design gate for rune cards. The card
   *    pool also has a release gate in `upgrades.ts` so runes stay hidden
   *    until their effect bag is fully consumed by gameplay systems.
   * - `getOwnedRuneIds()` filters out runes already held this run so a
   *    duplicate slot is never offered.
   * - `grantRune(runeId)` is invoked by apply() when a `grant_rune` card
   *    is picked. The scene side registers the RuneDef with the
   *    RuneConditionSystem. Missing hook = rune picks are no-ops
   *    (graceful degrade for unit-test scenes without the system wired).
   */
  isBossKilledThisRun?(): boolean;
  getOwnedRuneIds?(): readonly string[];
  grantRune?(runeId: string): void;
  /** Phase B Endless — gates the Overcharge mythic card. Optional so test scenes pass. */
  isPostBell?(): boolean;
  /**
   * Phase B Endless — list of weapon keys already overcharged this run.
   * Filters Overcharge cards from the offer pool. Optional for test scenes.
   */
  getOverchargedWeaponKeys?(): readonly string[];
}

export class LevelUpFlow {
  /**
   * When true, the UpgradeCards UI is currently showing a post-cap echo
   * pick rather than a standard level-up. `apply()` branches on this to
   * route through `applyEcho` (no level-up ceremony, no heal, no
   * milestone pulse; releases the ECHO token instead of LEVEL_UP).
   */
  private echoInFlight: boolean = false;

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
      fontFamily: 'monospace', fontSize: '36px', color: COLORS_CSS.WHISKY_GOLD,
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
      const enemies = this.hooks.getSpawnSystem().getEnemyGroup().getChildren() as Enemy[];
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
    markOfferedRunesSeen(cards);
    ui.show(cards, newLevel);
  }

  reroll(): void {
    const level = this.hooks.getXPSystem().getLevel();
    const cards = this.buildCardDraw(level);
    if (cards.length === 0) {
      this.hooks.getUpgradeUI().hide();
      this.hooks.getJuice().showToast(t('ui.game.level_up_fallback'), '#ffdd00');
      this.hooks.getTimeManager().release('LEVEL_UP');
      this.hooks.getXPSystem().processNextLevelUp();
      return;
    }
    markOfferedRunesSeen(cards);
    this.hooks.getUpgradeUI().show(cards, level);
    audio.playClick();
  }

  offerChestEvolution(): void {
    const recipe = this.findEvolution();
    if (!recipe) return;
    // R1 M2 T15 — 25% Relic-override on a legendary chest roll. The
    // override fires only when an evolution was actually eligible, so
    // early-game chests (no lv5 weapon + matching passive yet) still
    // surface their existing legendary card when the pool has one.
    if (this.hooks.tryChestLegendaryRelicOverride?.() === true) return;
    this.hooks.getTimeManager().request('LEVEL_UP', { pausePhysics: true, timeScale: 0 });
    const card = evolutionRecipeToUpgradeCard(recipe);
    this.hooks.getUpgradeUI().show([card], this.hooks.getXPSystem().getLevel(), {
      bannerTitle: t('ui.upgradeCards.chest_evolution_title'),
      bannerSubtitle: t('ui.upgradeCards.chest_evolution_sub'),
      hideReroll: true,
    });
  }

  /**
   * Post-cap echo pick — called from XPSystem's `echoReady` event.
   * Mirrors the level-up card flow but skips the level-up ceremony
   * (banner, heal, aura, milestone pulse) because the player isn't
   * levelling up — they're receiving a small echo of progression
   * from the moor. Uses the ECHO_CARDS pool, not the normal card pool.
   */
  handleEcho(): void {
    this.echoInFlight = true;
    const timeManager = this.hooks.getTimeManager();
    timeManager.request('ECHO', { pausePhysics: true, timeScale: 0 });

    const rng = this.hooks.getRunRng();
    const cards = drawCards([...ECHO_CARDS], XP.CARDS_PER_LEVEL, 0, () => rng.next(), {
      duplicateWeightMultiplier: 0.3,
    });

    const ui = this.hooks.getUpgradeUI();
    ui.show(cards, this.hooks.getXPSystem().getLevel(), {
      bannerTitle: t('ui.upgradeCards.echo_title'),
      bannerSubtitle: t('ui.upgradeCards.echo_sub'),
      hideReroll: true,
    });
  }

  apply(card: UpgradeCard): void {
    if (this.echoInFlight) {
      this.applyEcho(card);
      return;
    }
    const effect = card.effect;
    const cardTitle = t(card.name);
    const player = this.hooks.getPlayer();
    const juice = this.hooks.getJuice();
    const weaponSystem = this.hooks.getWeaponSystem();
    const scene = this.scene;

    const runId = this.hooks.getDiscoveryRunId();
    const now = Date.now();

    switch (effect.type) {
      case 'add_weapon':
        weaponSystem.addWeapon(effect.weaponKey);
        bumpItemAcquired(effect.weaponKey, runId, now);
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
        bumpItemAcquired(effect.passiveKey, runId, now);
        juice.showToast(t('ui.game.upgrade_add_passive', { name: cardTitle }), COLORS_CSS.LEGENDARY);
        break;

      case 'stat_boost':
        this.applyStatBoost(effect.stat, effect.amount);
        juice.showToast(t('ui.game.upgrade_stat_boost', { name: cardTitle }), '#88ccff');
        break;

      case 'grant_rune':
        this.hooks.grantRune?.(effect.runeId);
        bumpItemAcquired(effect.runeId, runId, now);
        juice.showToast(t('ui.game.upgrade_grant_rune', { name: cardTitle }), '#bca3d4');
        // U1 Task 18 — once-per-account cairn-hush line on the first rune
        //              pick. Subsequent rune picks fall through silently;
        //              per-rune bespoke lines are M3+ content work.
        if (bumpFirstTimeEvent('rune_first_pickup')) {
          this.hooks.requestBanter?.('first_time', 'rune_first_pickup');
        }
        break;

      case 'evolve_weapon':
        weaponSystem.evolveWeapon(effect.weaponKey, effect.evolutionKey);
        bumpItemAcquired(effect.evolutionKey, runId, now);
        if (!this.hooks.getEvolvedWeapons().includes(effect.weaponKey)) {
          this.hooks.pushEvolvedWeapon(effect.weaponKey);
        }
        this.hooks.getAnnouncedEvolutionReady().delete(effect.weaponKey);
        juice.showToast(t('ui.game.upgrade_evolve_weapon', { name: cardTitle }), '#ffaa00');
        juice.evolutionSpectacle(player.x, player.y, cardTitle);
        audio.playLevelUp();
        // B1 Phase 3 Task 18 — reserved first-pickup line for this weapon
        // evolution key across all saves. Priority 110 beats the generic
        // `weapon_evolve` (65) call that follows, so the bespoke milestone
        // line fires instead of the generic evolve-shout. Subsequent
        // evolutions of the same weapon fall through to the normal pool.
        {
          const firstEvoEvent = `evo_${effect.weaponKey}`;
          if (bumpFirstTimeEvent(firstEvoEvent)) {
            this.hooks.requestBanter?.('first_time', firstEvoEvent);
          }
        }
        this.hooks.requestBanter?.('weapon_evolve', effect.weaponKey);
        globalEventBus.emit('GLOBAL_WEAPON_EVOLVED', {
          weaponKey: effect.weaponKey,
          evolvedKey: effect.evolutionKey,
        });
        break;

      case 'overcharge_weapon':
        // Phase B Endless — Overcharge applies +25% damage / +20% area on
        // top of the evolved stats. Idempotent at the WeaponSystem level.
        weaponSystem.applyOvercharge(effect.weaponKey);
        juice.showToast(t('ui.game.upgrade_overcharge_weapon', { name: cardTitle }), '#ff66cc');
        // Spectral pop on the player — quieter than full evolution spectacle
        // because Overcharge layers onto a weapon that's already legendary.
        {
          const ring = this.hooks.getStatusFxPool().acquireArc(player.x, player.y, 12, 0xff66cc, 0.55);
          scene.tweens.add({ targets: ring, radius: 110, alpha: 0, duration: 600, onComplete: () => { ring.setVisible(false); } });
        }
        audio.playLevelUp();
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

  /**
   * Echo card resolution — stat-only effect, brief toast, then advance
   * the echo queue. Skips the heal / iFrames / chest-drain that
   * `apply()` normally runs because echoes are a lightweight cadence,
   * not a full level-up beat.
   *
   * Re-entrance note: `processNextEcho` emits `echoReady` synchronously
   * when the queue has more echoes waiting, which calls back into
   * `handleEcho` and opens the UI again. We branch on XPSystem's
   * `isEchoInProgress` (not `hasPendingEchoes`) to decide whether the
   * flow is genuinely done — the pending counter is already zero
   * mid-chain because each pick consumes one.
   */
  private applyEcho(card: UpgradeCard): void {
    const effect = card.effect;
    if (effect.type === 'stat_boost') {
      this.applyStatBoost(effect.stat, effect.amount);
      const juice = this.hooks.getJuice();
      // CRIT_GOLD (#ffdd44) — warm "victory" tone. Pre-2026-05-12 this was
      // cool-blue (#88ccff) which read as ephemeral/consolation; playtester
      // feedback was that the cap felt like a dead-end. Gold + bumped echo
      // magnitudes (upgrades.ts ECHO_CARDS) make the cadence feel like
      // real progress instead of background drip.
      juice.showToast(t('ui.game.upgrade_echo_applied', { name: t(card.name) }), '#ffdd44');
    }

    const xpSystem = this.hooks.getXPSystem();
    xpSystem.processNextEcho();
    if (!xpSystem.isEchoInProgress()) {
      this.echoInFlight = false;
      this.hooks.getTimeManager().release('ECHO');
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

    const rawPool = buildCardPool(
      ownedWeapons,
      ownedPassives,
      weaponLevels,
      evolvedWeapons,
      {
        bossKilledThisRun: this.hooks.isBossKilledThisRun?.() ?? false,
        ownedRuneIds: this.hooks.getOwnedRuneIds?.() ?? [],
        isPostBell: this.hooks.isPostBell?.() ?? false,
        overchargedWeaponKeys: this.hooks.getOverchargedWeaponKeys?.() ?? [],
      },
    );
    const pool = filterHealCardsWhenFull(rawPool, player.getHp() >= player.getMaxHp());

    const save = loadSave();
    const luckBonus =
      resolveLuckBonus(save, ownedPassives, player.getLuckDrawBonus())
      + (this.hooks.getRelicLuckPoints?.() ?? 0);
    const cardCount = resolveCardCount(save, XP.CARDS_PER_LEVEL);
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

  /**
   * M1 F8 — grant a passive from outside the level-up modal (node
   * trader, future event rewards). Mirrors the `add_passive` case in
   * `apply()` but without the upgrade-card toast: callers surface
   * their own flavoured toast. Idempotent-ish — if the key is already
   * held the push is a no-op at the hook side (set semantics), and
   * `applyPassiveEffectPure` re-applies stats (safe for this roster:
   * no key layers ownership — first grant is the only grant because
   * rolling never returns held keys).
   */
  grantPassive(key: string): void {
    this.hooks.pushOwnedPassive(key);
    this.applyPassiveEffect(key);
    bumpItemAcquired(key, this.hooks.getDiscoveryRunId(), Date.now());
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
        const enemies = (spawnSystem.getEnemyGroup().getChildren() as Enemy[])
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

/**
 * U1 Task 15 — on every offered rune in a card-draw, stamp its id into
 * `seenRunes` so the meta-unlock collection persists across runs. Seeing
 * counts; picking is not required. Best-effort (the save layer swallows
 * its own errors) so the hot level-up path never blocks.
 */
function markOfferedRunesSeen(cards: readonly UpgradeCard[]): void {
  for (const c of cards) {
    if (c.effect.type === 'grant_rune') bumpSeenRune(c.effect.runeId);
  }
}
