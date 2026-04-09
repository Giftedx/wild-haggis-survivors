import Phaser from 'phaser';
import { GAME, COLORS } from '../config';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { SpawnSystem } from '../systems/SpawnSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { XPSystem } from '../systems/XPSystem';
import { GrowthSystem } from '../systems/GrowthSystem';
import { UpgradeCardsUI } from '../ui/UpgradeCards';
import { HUD } from '../ui/HUD';
import { EdgeIndicators } from '../ui/EdgeIndicators';
import { Minimap } from '../ui/Minimap';
import { JuiceSystem } from '../systems/JuiceSystem';
import { buildCardPool, drawCards, UpgradeCard } from '../data/upgrades';
import { XP, PLAYER } from '../config';
import { recordRun, loadSave, writeSave } from '../utils/save';
import { audio } from '../systems/AudioSystem';
import { musicEngine, GameMusicState } from '../systems/music/ProceduralMusicEngine';
import { BOSSES } from '../data/enemies';

/**
 * GameScene — the core gameplay loop.
 */
export class GameScene extends Phaser.Scene {
  private player!: Player;
  private spawnSystem!: SpawnSystem;
  private weaponSystem!: WeaponSystem;
  private xpSystem!: XPSystem;
  private growthSystem!: GrowthSystem;
  private upgradeUI!: UpgradeCardsUI;
  private hud!: HUD;
  private juice!: JuiceSystem;
  private edgeIndicators!: EdgeIndicators;
  private minimap!: Minimap;
  private iFrames: boolean = false;
  private isPaused: boolean = false;

  private ownedPassives: string[] = [];
  private evolvedWeapons: string[] = [];
  private killCount: number = 0;
  private bossKillCount: number = 0;
  private bossGoldEarned: number = 0;
  private pauseElements: Phaser.GameObjects.GameObject[] = [];
  private isManualPause: boolean = false;
  private pendingChest: boolean = false;
  private victoryPending: boolean = false;

  constructor() {
    super({ key: 'Game' });
  }

  create(): void {
    // Reset all state — Phaser reuses the scene instance on restart,
    // so field initializers only run once at construction
    this.isPaused = false;
    this.iFrames = false;
    this.isManualPause = false;
    this.pauseElements = [];
    this.victoryPending = false;

    // Ensure timeScale is normal (could be stuck at 0.3 if slow-mo was active on scene exit)
    this.time.timeScale = 1;

    // Set world bounds
    this.physics.world.setBounds(0, 0, GAME.WORLD_WIDTH, GAME.WORLD_HEIGHT);

    // Draw the Highland ground
    this.createHighlandTerrain();

    // Create the player at world center
    this.player = new Player(this, GAME.WORLD_WIDTH / 2, GAME.WORLD_HEIGHT / 2);

    // Systems
    this.spawnSystem = new SpawnSystem(this);
    this.weaponSystem = new WeaponSystem(this, this.spawnSystem.getEnemyGroup());
    this.xpSystem = new XPSystem(this);
    this.growthSystem = new GrowthSystem(this, this.player);
    this.ownedPassives = [];
    this.evolvedWeapons = [];
    this.killCount = 0;
    this.bossKillCount = 0;
    this.bossGoldEarned = 0;

    // Apply permanent upgrades from save data
    this.applyPermanentUpgrades();

    // Upgrade card UI
    this.upgradeUI = new UpgradeCardsUI(this, (card) => this.applyUpgrade(card));
    this.upgradeUI.setRerollCallback(() => this.rerollUpgradeCards());

    // When an enemy is killed
    this.weaponSystem.events.on('enemyKilled', (x: number, y: number, xpValue: number, enemyKey: string, wasBoss: boolean) => {
      this.xpSystem.spawnGem(x, y, xpValue);
      this.killCount++;
      this.juice.showKillBurst(x, y);
      this.juice.hitFreeze();
      audio.playKill();

      // Kill milestones — celebrate at round numbers
      if ([100, 250, 500, 1000, 2500, 5000].includes(this.killCount)) {
        this.juice.showToast(`${this.killCount} KILLS!`, '#ffdd00');
        this.juice.flashWhite(150);
        audio.playLevelUp();
      }

      // Death ripple — push nearby enemies away from the kill (max 6)
      const enemies = this.spawnSystem.getEnemyGroup().getChildren() as Enemy[];
      let pushed = 0;
      for (let i = 0; i < enemies.length && pushed < 6; i++) {
        const e = enemies[i];
        if (!e.active) continue;
        const d = Phaser.Math.Distance.Between(x, y, e.x, e.y);
        if (d < 50 && d > 0) {
          const angle = Phaser.Math.Angle.Between(x, y, e.x, e.y);
          const body = e.body as Phaser.Physics.Arcade.Body;
          const force = 100 / body.mass;
          body.velocity.x += Math.cos(angle) * force;
          body.velocity.y += Math.sin(angle) * force;
          pushed++;
        }
      }

      if (wasBoss) {
        this.bossKillCount++;
        // Scale boss gold with difficulty — xpValue is 25/50/75/100/200 for each boss
        this.bossGoldEarned += Math.ceil(xpValue * 2);
        this.juice.bossDeathSpectacle(x, y);
        this.juice.slowMotion();

        // Check for victory — Taxman killed
        if (enemyKey === 'taxman') {
          // Dedicated flag — can't be cleared by a pre-existing iFrames timer
          this.victoryPending = true;
          this.time.delayedCall(1500, () => this.handleVictory());
        }
      }
    });

    // Floating damage numbers + hit sound
    this.weaponSystem.events.on('damageDealt', (x: number, y: number, amount: number) => {
      this.juice.showDamageNumber(x, y, amount);
      audio.playHit();
    });

    // Projectile trails
    this.weaponSystem.events.on('projectileTrail', (x: number, y: number) => {
      this.juice.spawnTrail(x, y, 0x9966cc);
    });

    // When player levels up, pause and show upgrade choices
    this.xpSystem.events.on('levelup', (newLevel: number) => {
      this.onLevelUp(newLevel);
    });

    // Player ↔ Enemy collision
    this.physics.add.overlap(
      this.player,
      this.spawnSystem.getEnemyGroup(),
      this.onPlayerHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1);
    this.cameras.main.setBounds(0, 0, GAME.WORLD_WIDTH, GAME.WORLD_HEIGHT);

    // HUD + Juice
    this.hud = new HUD(this);
    this.juice = new JuiceSystem(this);
    this.edgeIndicators = new EdgeIndicators(this);
    this.minimap = new Minimap(this);
    this.hud.setOnPause(() => this.togglePause());

    // Apply saved audio settings and start background music
    const audioSave = loadSave();
    audio.setEnabled(audioSave.settings.soundOn);
    if (audioSave.settings.musicOn) {
      musicEngine.start();
    }

    // Treasure chest timer — spawns every 45 seconds
    // Deferred if paused so level-up thinking time doesn't skip chests
    this.pendingChest = false;
    this.time.addEvent({
      delay: 45000,
      loop: true,
      callback: () => {
        if (this.isPaused) {
          this.pendingChest = true;
        } else {
          this.spawnTreasure();
        }
      },
    });

    // ESC to pause
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    }

    // Fade in from black
    const fadeIn = this.add.rectangle(
      this.scale.width / 2, this.scale.height / 2,
      this.scale.width, this.scale.height, 0x000000, 1
    ).setScrollFactor(0).setDepth(999);
    this.tweens.add({ targets: fadeIn, alpha: 0, duration: 500, onComplete: () => fadeIn.destroy() });

    // Start countdown — game is paused until it finishes
    this.isPaused = true;
    this.physics.pause();
    this.showCountdown();
  }

  private showCountdown(): void {
    const { width, height } = this.scale;
    const steps = ['3', '2', '1', 'SURVIVE!'];
    let i = 0;

    const showNext = () => {
      if (i >= steps.length) {
        this.isPaused = false;
        this.physics.resume();
        return;
      }

      const label = steps[i];
      const isFinal = i === steps.length - 1;
      const text = this.add.text(width / 2, height / 2, label, {
        fontFamily: 'monospace',
        fontSize: isFinal ? '40px' : '64px',
        color: isFinal ? '#d4a017' : '#ffffff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 6,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(1000).setScale(0.5).setAlpha(0);

      this.tweens.add({
        targets: text,
        scale: isFinal ? 1.2 : 1,
        alpha: 1,
        duration: 200,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: text,
            alpha: 0,
            scale: 1.5,
            duration: isFinal ? 400 : 250,
            delay: isFinal ? 300 : 200,
            onComplete: () => {
              text.destroy();
              i++;
              showNext();
            },
          });
        },
      });

      audio.playClick();
    };

    // Small delay before countdown starts
    this.time.delayedCall(300, showNext);
  }

  update(_time: number, delta: number): void {
    if (this.isPaused) return;

    // Cap delta to prevent time warps from tab-backgrounding (browser throttles
    // requestAnimationFrame to ~1fps when backgrounded, producing huge deltas on return)
    delta = Math.min(delta, 100);

    this.player.update();
    this.spawnSystem.update(delta, this.player.x, this.player.y);

    // Pass player facing and upgrade multipliers to weapon system
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (body.velocity.x !== 0 || body.velocity.y !== 0) {
      this.weaponSystem.setPlayerFacing(Math.atan2(body.velocity.y, body.velocity.x));
    }
    this.weaponSystem.setMultipliers(
      this.player.getDamageMultiplier(),
      this.player.getAoeMultiplier(),
      this.player.getAttackSpeedMultiplier()
    );
    this.weaponSystem.update(delta, this.player.x, this.player.y);
    this.xpSystem.update(this.player.x, this.player.y, this.player.getPickupRadius());
    this.growthSystem.update();
    this.juice.update(delta, this.player.getHp() / this.player.getMaxHp());

    // Boss HP bar + edge indicators
    this.updateBossHPBar();
    this.edgeIndicators.update(this.player.x, this.player.y, this.spawnSystem.getEnemyGroup());
    this.minimap.update(this.player.x, this.player.y, this.spawnSystem.getEnemyGroup());
    const musicState: GameMusicState = {
      hp: this.player.getHp(),
      maxHp: this.player.getMaxHp(),
      gameTimeSec: this.spawnSystem.getGameTimeSec(),
      enemyCount: this.spawnSystem.getActiveCount(),
      comboCount: this.juice.getComboCount(),
      killCount: this.killCount,
      bossActive: this.spawnSystem.isBossActive(),
    };
    musicEngine.update(delta, musicState);

    this.hud.update(
      this.player.getHp(), this.player.getMaxHp(),
      this.xpSystem.getLevel(),
      this.xpSystem.getXPFraction(),
      this.spawnSystem.getGameTimeSec(),
      this.killCount,
      this.spawnSystem.getActiveCount(),
      this.weaponSystem.getWeapons().map(w => ({ key: w.config.key, level: w.level, evolved: w.evolved }))
    );
  }

  private onLevelUp(newLevel: number): void {
    // Vacuum all XP gems + audio fanfare
    this.xpSystem.vacuumAllGems();
    audio.playLevelUp();
    this.juice.flashWhite();
    this.juice.hideCombo();

    this.isPaused = true;
    this.physics.pause();
    this.player.onLevelUp(newLevel);
    this.growthSystem.onLevelUp(newLevel);

    // Leveling up heals 10% max HP — a small reward that helps sustain longer runs
    this.player.heal(Math.ceil(this.player.getMaxHp() * 0.10));

    // Build the card pool based on current state
    const ownedWeapons = this.weaponSystem.getWeapons().map(w => w.config.key);
    const weaponLevels: Record<string, number> = {};
    for (const w of this.weaponSystem.getWeapons()) {
      weaponLevels[w.config.key] = w.level;
    }

    let pool = buildCardPool(ownedWeapons, this.ownedPassives, weaponLevels, this.evolvedWeapons);

    // Filter out heal card when at full HP — don't waste a card slot
    if (this.player.getHp() >= this.player.getMaxHp()) {
      pool = pool.filter(c => !(c.effect.type === 'stat_boost' && c.effect.stat === 'heal'));
    }

    // Luck bonus from Sporran passive + Lucky Heather permanent upgrade
    const save = loadSave();
    let luckBonus = 0;
    if (this.ownedPassives.includes('sporran')) luckBonus += 15;
    luckBonus += (save.upgrades['lucky_heather'] ?? 0) * 5;

    const extraChoice = (save.upgrades['extra_choice'] ?? 0) > 0;
    const cardCount = extraChoice ? XP.CARDS_PER_LEVEL + 1 : XP.CARDS_PER_LEVEL;
    const cards = drawCards(pool, cardCount, luckBonus);

    this.upgradeUI.grantReroll();
    this.upgradeUI.show(cards, newLevel);
  }

  /** Reroll the upgrade cards — draws fresh cards from the same pool */
  private rerollUpgradeCards(): void {
    const level = this.xpSystem.getLevel();
    const ownedWeapons = this.weaponSystem.getWeapons().map(w => w.config.key);
    const weaponLevels: Record<string, number> = {};
    for (const w of this.weaponSystem.getWeapons()) {
      weaponLevels[w.config.key] = w.level;
    }

    let pool = buildCardPool(ownedWeapons, this.ownedPassives, weaponLevels, this.evolvedWeapons);
    if (this.player.getHp() >= this.player.getMaxHp()) {
      pool = pool.filter(c => !(c.effect.type === 'stat_boost' && c.effect.stat === 'heal'));
    }

    const save = loadSave();
    let luckBonus = 0;
    if (this.ownedPassives.includes('sporran')) luckBonus += 15;
    luckBonus += (save.upgrades['lucky_heather'] ?? 0) * 5;

    const extraChoice = (save.upgrades['extra_choice'] ?? 0) > 0;
    const cardCount = extraChoice ? XP.CARDS_PER_LEVEL + 1 : XP.CARDS_PER_LEVEL;
    const cards = drawCards(pool, cardCount, luckBonus);

    this.upgradeUI.show(cards, level);
    audio.playClick();
  }

  private applyUpgrade(card: UpgradeCard): void {
    const effect = card.effect;

    switch (effect.type) {
      case 'add_weapon':
        this.weaponSystem.addWeapon(effect.weaponKey);
        this.juice.showToast(`NEW: ${card.name}`, '#44dd44');
        break;

      case 'level_weapon':
        this.weaponSystem.levelUpWeapon(effect.weaponKey);
        this.juice.showToast(`${card.name}`, '#4488dd');
        break;

      case 'add_passive':
        this.ownedPassives.push(effect.passiveKey);
        this.applyPassiveEffect(effect.passiveKey);
        this.juice.showToast(`${card.name}`, '#ddaa00');
        break;

      case 'stat_boost':
        this.applyStatBoost(effect.stat, effect.amount);
        this.juice.showToast(`${card.name}`, '#88ccff');
        break;

      case 'evolve_weapon':
        this.weaponSystem.evolveWeapon(effect.weaponKey, effect.evolutionKey);
        this.evolvedWeapons.push(effect.weaponKey);
        this.juice.showToast(`EVOLVED: ${card.name}!`, '#ffaa00');
        this.juice.flashWhite(300);
        audio.playLevelUp();
        break;
    }

    // Check for queued level-ups before resuming
    if (this.xpSystem.hasPendingLevelUps()) {
      this.xpSystem.processNextLevelUp();
    } else {
      this.xpSystem.processNextLevelUp(); // Clears levelUpInProgress flag
      this.isPaused = false;
      this.physics.resume();

      // Celebrate reaching max level
      if (this.xpSystem.getLevel() >= XP.MAX_LEVEL) {
        this.juice.showToast('MAX LEVEL!', '#ffdd00');
      }

      // Spawn deferred treasure chest if one was due during pause
      if (this.pendingChest) {
        this.pendingChest = false;
        this.spawnTreasure();
      }
    }
  }

  private applyPassiveEffect(key: string): void {
    switch (key) {
      case 'tam_o_shanter':
        this.player.addSpeed(PLAYER.SPEED * 0.10);
        break;
      case 'kilt':
        this.player.addMaxHp(Math.ceil(PLAYER.MAX_HP * 0.15));
        break;
      case 'loch_water':
        this.player.addPickupRadius(PLAYER.PICKUP_RADIUS * 0.25);
        break;
      case 'sporran':
        // Luck — better card rarity (handled by card pool weighting)
        break;
      case 'whisky_flask':
        this.player.addAoeMultiplier(0.20);
        break;
      case 'irn_bru':
        this.player.addAttackSpeedMultiplier(0.20);
        break;
    }
  }

  private applyStatBoost(stat: string, amount: number): void {
    switch (stat) {
      case 'maxHp':
        this.player.addMaxHp(amount);
        break;
      case 'speed':
        this.player.addSpeed(PLAYER.SPEED * amount);
        break;
      case 'pickup':
        this.player.addPickupRadius(amount);
        break;
      case 'drift':
        this.player.reduceDrift(amount);
        break;
      case 'heal':
        this.player.heal(amount);
        break;
      case 'damage':
        this.player.addDamageMultiplier(amount);
        break;
    }
  }

  /** Apply permanent upgrades purchased in the shop to this run */
  private applyPermanentUpgrades(): void {
    const save = loadSave();
    const ups = save.upgrades;

    const thickHide = ups['thick_hide'] ?? 0;
    if (thickHide > 0) this.player.addMaxHp(Math.ceil(PLAYER.MAX_HP * 0.05 * thickHide));

    const strongLegs = ups['strong_legs'] ?? 0;
    if (strongLegs > 0) this.player.addSpeed(PLAYER.SPEED * 0.03 * strongLegs);

    const sharpThistles = ups['sharp_thistles'] ?? 0;
    if (sharpThistles > 0) this.player.addDamageMultiplier(0.05 * sharpThistles);

    const magneticPersonality = ups['magnetic_personality'] ?? 0;
    if (magneticPersonality > 0) this.player.addPickupRadius(PLAYER.PICKUP_RADIUS * 0.10 * magneticPersonality);

    const driftControl = ups['drift_control'] ?? 0;
    for (let i = 0; i < driftControl; i++) this.player.reduceDrift(0.15);

    // extra_choice and lucky_heather affect the card system, not stats
  }

  private togglePause(): void {
    // Don't toggle if upgrade cards are showing
    if (this.isPaused && !this.isManualPause) return;

    if (this.isManualPause) {
      // Resume
      this.isManualPause = false;
      this.isPaused = false;
      this.physics.resume();
      for (const el of this.pauseElements) el.destroy();
      this.pauseElements = [];
      // Spawn deferred treasure chest if one was due during pause
      if (this.pendingChest) {
        this.pendingChest = false;
        this.spawnTreasure();
      }
    } else {
      // Pause
      this.isManualPause = true;
      this.isPaused = true;
      this.physics.pause();

      const { width, height } = this.scale;
      const d = 250;

      this.pauseElements.push(
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
          .setScrollFactor(0).setDepth(d).setInteractive()
      );
      this.pauseElements.push(
        this.add.text(width / 2, height * 0.35, 'PAUSED', {
          fontFamily: 'monospace', fontSize: '36px', color: '#ffffff',
          fontStyle: 'bold', stroke: '#000', strokeThickness: 4,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 1)
      );

      // Resume button
      const resumeBtn = this.add.rectangle(width / 2, height * 0.5, 180, 40, 0x005eb8)
        .setScrollFactor(0).setDepth(d + 1).setInteractive({ useHandCursor: true });
      resumeBtn.on('pointerover', () => resumeBtn.setFillStyle(0x0077dd));
      resumeBtn.on('pointerout', () => resumeBtn.setFillStyle(0x005eb8));
      resumeBtn.on('pointerdown', () => this.togglePause());
      this.pauseElements.push(resumeBtn);
      this.pauseElements.push(
        this.add.text(width / 2, height * 0.5, 'RESUME', {
          fontFamily: 'monospace', fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2)
      );

      // Sound toggles — side by side
      const save = loadSave();
      let sfxOn = save.settings.soundOn;
      const sfxText = this.add.text(width / 2 - 60, height * 0.62, `SFX: ${sfxOn ? 'ON' : 'OFF'}`, {
        fontFamily: 'monospace', fontSize: '13px',
        color: sfxOn ? '#88cc88' : '#886666',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2)
        .setInteractive({ useHandCursor: true });
      sfxText.on('pointerdown', () => {
        sfxOn = !sfxOn;
        sfxText.setText(`SFX: ${sfxOn ? 'ON' : 'OFF'}`);
        sfxText.setColor(sfxOn ? '#88cc88' : '#886666');
        audio.setEnabled(sfxOn);
        const s = loadSave(); s.settings.soundOn = sfxOn; writeSave(s);
      });
      this.pauseElements.push(sfxText);

      let musicOn = save.settings.musicOn;
      const musicText = this.add.text(width / 2 + 60, height * 0.62, `Music: ${musicOn ? 'ON' : 'OFF'}`, {
        fontFamily: 'monospace', fontSize: '13px',
        color: musicOn ? '#88cc88' : '#886666',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2)
        .setInteractive({ useHandCursor: true });
      musicText.on('pointerdown', () => {
        musicOn = !musicOn;
        musicText.setText(`Music: ${musicOn ? 'ON' : 'OFF'}`);
        musicText.setColor(musicOn ? '#88cc88' : '#886666');
        musicEngine.setEnabled(musicOn);
        const s = loadSave(); s.settings.musicOn = musicOn; writeSave(s);
      });
      this.pauseElements.push(musicText);

      // Quit button
      const quitBtn = this.add.rectangle(width / 2, height * 0.72, 180, 40, 0x444444)
        .setScrollFactor(0).setDepth(d + 1).setInteractive({ useHandCursor: true });
      quitBtn.on('pointerover', () => quitBtn.setFillStyle(0x555555));
      quitBtn.on('pointerout', () => quitBtn.setFillStyle(0x444444));
      quitBtn.on('pointerdown', () => { musicEngine.stop(); this.scene.start('Menu'); });
      this.pauseElements.push(quitBtn);
      this.pauseElements.push(
        this.add.text(width / 2, height * 0.72, 'QUIT', {
          fontFamily: 'monospace', fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2)
      );
    }
  }

  private onPlayerHitEnemy(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void {
    if (this.iFrames || this.isPaused || this.victoryPending) return;

    const enemy = enemyObj as Enemy;
    if (!enemy.active) return;

    const dead = this.player.takeDamage(enemy.getDamage());

    this.iFrames = true;
    this.player.setAlpha(0.5);
    this.player.setTintFill(0xff3333); // Red flash on the sprite itself
    this.time.delayedCall(80, () => {
      if (this.player.active) this.player.clearTint();
    });
    this.cameras.main.shake(100, 0.005);
    audio.playPlayerHit();
    this.juice.flashRed();

    // iFrames timer that waits for unpause before clearing
    const clearIFrames = () => {
      // Stop polling if the player died — game is permanently paused
      if (!this.player.active) return;
      if (this.isPaused) {
        this.time.delayedCall(100, clearIFrames);
        return;
      }
      this.iFrames = false;
      this.player.setAlpha(1);
    };
    this.time.delayedCall(500, clearIFrames);

    if (dead) this.handlePlayerDeath();
  }

  private handleVictory(): void {
    // Defer if level-up screen is showing — re-check after a short delay
    if (this.xpSystem.hasPendingLevelUps() || this.upgradeUI !== undefined) {
      // Poll until level-up is resolved
      const waitForLevelUp = () => {
        if (this.xpSystem.hasPendingLevelUps()) {
          this.time.delayedCall(200, waitForLevelUp);
          return;
        }
        this.handleVictory();
      };
      // Only defer if we're actually mid-level-up (isPaused from cards, not from this method)
      if (this.isPaused && !this.isManualPause) {
        this.time.delayedCall(200, waitForLevelUp);
        return;
      }
    }

    this.isPaused = true;
    this.physics.pause();
    musicEngine.playResolution();

    const { width, height } = this.scale;
    const d = 200;
    const timeSurvived = this.spawnSystem.getGameTimeSec();
    const goldEarned = recordRun(timeSurvived, this.killCount, this.bossGoldEarned);

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setScrollFactor(0).setDepth(d).setInteractive();
    this.tweens.add({ targets: overlay, alpha: 0.85, duration: 800 });

    const title = this.add.text(width / 2, height * 0.2, 'VICTORY!', {
      fontFamily: 'monospace', fontSize: '48px', color: '#d4a017',
      fontStyle: 'bold', stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 1).setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: title, alpha: 1, scale: 1, duration: 800, delay: 500, ease: 'Back.easeOut',
    });

    const subtitle = this.add.text(width / 2, height * 0.33, 'The Highlands are safe... for now.', {
      fontFamily: 'monospace', fontSize: '14px', color: '#aaaaaa',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 1).setAlpha(0);
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 600, delay: 1200 });

    const mins = Math.floor(timeSurvived / 60);
    const secs = Math.floor(timeSurvived % 60);
    const statsText = this.add.text(width / 2, height * 0.45,
      `Time: ${mins}:${secs.toString().padStart(2, '0')}  |  Kills: ${this.killCount}  |  +${goldEarned} Gold`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 1).setAlpha(0);
    this.tweens.add({ targets: statsText, alpha: 1, duration: 600, delay: 1600 });

    const playAgainBtn = this.add.rectangle(width / 2, height * 0.58, 200, 40, COLORS.SCOTTISH_BLUE)
      .setScrollFactor(0).setDepth(d + 1).setAlpha(0);
    const playAgainText = this.add.text(width / 2, height * 0.58, 'PLAY AGAIN', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2).setAlpha(0);

    const shopBtn = this.add.rectangle(width / 2, height * 0.67, 200, 40, COLORS.WHISKY_GOLD)
      .setScrollFactor(0).setDepth(d + 1).setAlpha(0);
    const shopText = this.add.text(width / 2, height * 0.67, 'UPGRADES', {
      fontFamily: 'monospace', fontSize: '16px', color: '#000000', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2).setAlpha(0);

    const menuBtn = this.add.rectangle(width / 2, height * 0.76, 200, 40, 0x444444)
      .setScrollFactor(0).setDepth(d + 1).setAlpha(0);
    const menuText = this.add.text(width / 2, height * 0.76, 'MENU', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2).setAlpha(0);

    // Buttons become interactive only after they fade in (prevents invisible click)
    this.tweens.add({ targets: [playAgainBtn, playAgainText], alpha: 1, duration: 400, delay: 2000,
      onComplete: () => playAgainBtn.setInteractive({ useHandCursor: true }) });
    this.tweens.add({ targets: [shopBtn, shopText], alpha: 1, duration: 400, delay: 2150,
      onComplete: () => shopBtn.setInteractive({ useHandCursor: true }) });
    this.tweens.add({ targets: [menuBtn, menuText], alpha: 1, duration: 400, delay: 2300,
      onComplete: () => menuBtn.setInteractive({ useHandCursor: true }) });

    playAgainBtn.on('pointerover', () => playAgainBtn.setFillStyle(0x0077dd));
    playAgainBtn.on('pointerout', () => playAgainBtn.setFillStyle(COLORS.SCOTTISH_BLUE));
    playAgainBtn.on('pointerdown', () => { audio.playClick(); this.scene.start('Game'); });

    shopBtn.on('pointerover', () => shopBtn.setFillStyle(0xe8b420));
    shopBtn.on('pointerout', () => shopBtn.setFillStyle(COLORS.WHISKY_GOLD));
    shopBtn.on('pointerdown', () => { audio.playClick(); this.scene.start('Shop'); });

    menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x555555));
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(0x444444));
    menuBtn.on('pointerdown', () => { audio.playClick(); this.scene.start('Menu'); });
  }

  private handlePlayerDeath(): void {
    this.isPaused = true;
    this.physics.pause();
    audio.playDeath();
    musicEngine.fadeOut(2000);
    this.juice.flashRed(400);
    this.cameras.main.shake(500, 0.02);

    // Death particle burst — the haggis explodes
    const px = this.player.x;
    const py = this.player.y;
    this.player.setActive(false);
    this.player.setVisible(false);

    const colors = [0x8b6914, 0x6b4e0a, 0xd4a017, 0xcc3333];
    for (let i = 0; i < 20; i++) {
      const particle = this.add.circle(
        px, py,
        Phaser.Math.Between(3, 7),
        Phaser.Utils.Array.GetRandom(colors) as number,
        0.9
      );
      const angle = (i / 20) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 100 + Math.random() * 200;
      this.tweens.add({
        targets: particle,
        x: px + Math.cos(angle) * speed,
        y: py + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 600 + Math.random() * 400,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }

    const timeSurvived = this.spawnSystem.getGameTimeSec();
    const goldEarned = recordRun(timeSurvived, this.killCount, this.bossGoldEarned);

    this.time.delayedCall(1200, () => {
      this.showDeathScreen(timeSurvived, goldEarned);
    });
  }

  private showDeathScreen(timeSurvived: number, goldEarned: number): void {
    const { width, height } = this.scale;
    const d = 200;

    // Dark overlay fades in — interactive to block joystick on touch devices
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setScrollFactor(0).setDepth(d).setInteractive();
    this.tweens.add({ targets: overlay, alpha: 0.85, duration: 600 });

    const mins = Math.floor(timeSurvived / 60);
    const secs = Math.floor(timeSurvived % 60);

    // Title — dramatic entrance
    const title = this.add.text(width / 2, height * 0.2, 'YOU DIED', {
      fontFamily: 'monospace', fontSize: '42px', color: '#cc3333',
      fontStyle: 'bold', stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 1).setAlpha(0).setScale(2);

    this.tweens.add({
      targets: title, alpha: 1, scale: 1, duration: 500, delay: 300, ease: 'Back.easeOut',
    });

    // Stats — stagger reveal
    const stats = [
      { label: 'Survived', value: `${mins}:${secs.toString().padStart(2, '0')}` },
      { label: 'Enemies Killed', value: `${this.killCount}` },
      { label: 'Level Reached', value: `${this.xpSystem.getLevel()}` },
    ];

    stats.forEach((stat, i) => {
      const y = height * 0.38 + i * 36;
      const labelText = this.add.text(width / 2 - 10, y, stat.label, {
        fontFamily: 'monospace', fontSize: '14px', color: '#888888',
      }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(d + 1).setAlpha(0);

      const valueText = this.add.text(width / 2 + 10, y, stat.value, {
        fontFamily: 'monospace', fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(d + 1).setAlpha(0);

      const delay = 700 + i * 200;
      const labelFinalX = labelText.x;
      const valueFinalX = valueText.x;
      labelText.setX(labelFinalX - 20);
      valueText.setX(valueFinalX + 20);
      this.tweens.add({ targets: labelText, alpha: 1, x: labelFinalX, duration: 300, delay });
      this.tweens.add({ targets: valueText, alpha: 1, x: valueFinalX, duration: 300, delay: delay + 100 });
    });

    // Gold earned — special highlight
    const goldY = height * 0.58;
    const goldLabel = this.add.text(width / 2, goldY, `+${goldEarned} Gold`, {
      fontFamily: 'monospace', fontSize: '24px', color: '#d4a017', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 1).setAlpha(0);

    this.tweens.add({
      targets: goldLabel, alpha: 1, scale: { from: 0.5, to: 1 },
      duration: 400, delay: 1400, ease: 'Back.easeOut',
    });

    // Buttons — stagger in
    const playAgainBtn = this.add.rectangle(width / 2, height * 0.70, 200, 40, COLORS.SCOTTISH_BLUE)
      .setScrollFactor(0).setDepth(d + 1).setAlpha(0);
    const playAgainText = this.add.text(width / 2, height * 0.70, 'PLAY AGAIN', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2).setAlpha(0);

    const shopBtn = this.add.rectangle(width / 2, height * 0.79, 200, 40, COLORS.WHISKY_GOLD)
      .setScrollFactor(0).setDepth(d + 1).setAlpha(0);
    const shopText = this.add.text(width / 2, height * 0.79, 'UPGRADES', {
      fontFamily: 'monospace', fontSize: '16px', color: '#000000', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2).setAlpha(0);

    const menuBtn = this.add.rectangle(width / 2, height * 0.88, 200, 40, 0x444444)
      .setScrollFactor(0).setDepth(d + 1).setAlpha(0);
    const menuText = this.add.text(width / 2, height * 0.88, 'MENU', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2).setAlpha(0);

    this.tweens.add({ targets: [playAgainBtn, playAgainText], alpha: 1, duration: 300, delay: 1700,
      onComplete: () => playAgainBtn.setInteractive({ useHandCursor: true }) });
    this.tweens.add({ targets: [shopBtn, shopText], alpha: 1, duration: 300, delay: 1850,
      onComplete: () => shopBtn.setInteractive({ useHandCursor: true }) });
    this.tweens.add({ targets: [menuBtn, menuText], alpha: 1, duration: 300, delay: 2000,
      onComplete: () => menuBtn.setInteractive({ useHandCursor: true }) });

    playAgainBtn.on('pointerover', () => playAgainBtn.setFillStyle(0x0077dd));
    playAgainBtn.on('pointerout', () => playAgainBtn.setFillStyle(COLORS.SCOTTISH_BLUE));
    playAgainBtn.on('pointerdown', () => { audio.playClick(); this.scene.start('Game'); });

    shopBtn.on('pointerover', () => shopBtn.setFillStyle(0xe8b420));
    shopBtn.on('pointerout', () => shopBtn.setFillStyle(COLORS.WHISKY_GOLD));
    shopBtn.on('pointerdown', () => { audio.playClick(); this.scene.start('Shop'); });

    menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x555555));
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(0x444444));
    menuBtn.on('pointerdown', () => { audio.playClick(); this.scene.start('Menu'); });
  }

  // ── Boss HP Bar ──

  private updateBossHPBar(): void {
    const enemies = this.spawnSystem.getEnemyGroup().getChildren() as Enemy[];
    let activeBoss: Enemy | null = null;

    // Show the boss with the lowest HP fraction (highest priority target)
    for (const enemy of enemies) {
      if (enemy.active && enemy.isBoss()) {
        if (!activeBoss || enemy.getHpFraction() < activeBoss.getHpFraction()) {
          activeBoss = enemy;
        }
      }
    }

    if (activeBoss) {
      const bossDef = BOSSES.find(b => b.key === activeBoss!.getEnemyKey());
      this.hud.updateBossBar({
        name: bossDef?.name ?? activeBoss.getEnemyKey(),
        hpFraction: activeBoss.getHpFraction(),
      });
    } else {
      this.hud.updateBossBar(null);
    }
  }

  // ── Treasure Chests ──

  private spawnTreasure(): void {
    // Spawn near the player but not on top of them
    const angle = Math.random() * Math.PI * 2;
    const dist = 150 + Math.random() * 200;
    const x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * dist, 50, GAME.WORLD_WIDTH - 50);
    const y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * dist, 50, GAME.WORLD_HEIGHT - 50);

    // Create a glowing chest indicator
    const chest = this.add.circle(x, y, 12, COLORS.WHISKY_GOLD, 0.8).setDepth(5);
    const glow = this.add.circle(x, y, 18, COLORS.WHISKY_GOLD, 0.2).setDepth(4);

    // Pulsing glow animation
    this.tweens.add({
      targets: glow,
      scale: { from: 1, to: 1.5 },
      alpha: { from: 0.3, to: 0 },
      duration: 800,
      repeat: -1,
    });

    // Enable physics for overlap detection
    this.physics.add.existing(chest, true);
    let collected = false;

    // Collect on overlap with player
    const overlap = this.physics.add.overlap(this.player, chest, () => {
      if (collected) return;
      collected = true;

      this.player.heal(Math.ceil(this.player.getMaxHp() * 0.25));
      for (let i = 0; i < 8; i++) {
        this.xpSystem.spawnGem(
          x + Phaser.Math.Between(-20, 20),
          y + Phaser.Math.Between(-20, 20),
          3
        );
      }

      this.juice.flashWhite(100);
      audio.playLevelUp();

      this.tweens.killTweensOf(glow);
      chest.destroy();
      glow.destroy();
      this.physics.world.removeCollider(overlap);
    });

    // Chest despawns after 15 seconds if not collected
    this.time.delayedCall(15000, () => {
      if (collected) return;
      collected = true;
      this.tweens.killTweensOf(glow);
      this.tweens.add({
        targets: [chest, glow],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          chest.destroy();
          glow.destroy();
          this.physics.world.removeCollider(overlap);
        },
      });
    });
  }

  // ── Terrain ──

  private createHighlandTerrain(): void {
    // Parallax sky layer — scrolls at 10% of camera speed
    const skyGfx = this.add.graphics().setScrollFactor(0.1).setDepth(-10);
    const skyW = GAME.WORLD_WIDTH * 1.2;
    const skyH = GAME.WORLD_HEIGHT * 1.2;
    // Sky gradient (top = dark blue, bottom = lighter)
    skyGfx.fillGradientStyle(0x1a2a4a, 0x1a2a4a, 0x3a5a7a, 0x3a5a7a, 1);
    skyGfx.fillRect(-200, -200, skyW, skyH);

    // Parallax mountain silhouettes — scrolls at 30% of camera speed
    const mtGfx = this.add.graphics().setScrollFactor(0.3).setDepth(-5);
    const rngMt = new Phaser.Math.RandomDataGenerator(['mountains']);
    // Draw mountain ridge as a series of triangles
    mtGfx.fillStyle(0x2a3a4a, 0.5);
    for (let i = 0; i < 20; i++) {
      const mx = i * (skyW / 20) - 100;
      const mh = rngMt.between(80, 200);
      const mw = rngMt.between(150, 350);
      const baseY = GAME.WORLD_HEIGHT * 0.5;
      mtGfx.fillTriangle(mx, baseY, mx + mw / 2, baseY - mh, mx + mw, baseY);
    }
    // Closer, darker range
    mtGfx.fillStyle(0x1a2a3a, 0.4);
    for (let i = 0; i < 15; i++) {
      const mx = i * (skyW / 15) - 50;
      const mh = rngMt.between(50, 140);
      const mw = rngMt.between(200, 400);
      const baseY = GAME.WORLD_HEIGHT * 0.6;
      mtGfx.fillTriangle(mx, baseY, mx + mw / 2, baseY - mh, mx + mw, baseY);
    }

    const gfx = this.add.graphics();
    const W = GAME.WORLD_WIDTH;
    const H = GAME.WORLD_HEIGHT;

    // Base grass with slight color variation
    gfx.fillStyle(COLORS.GRASS, 1);
    gfx.fillRect(0, 0, W, H);

    const rng = new Phaser.Math.RandomDataGenerator(['highlands']);

    // Darker grass patches for depth
    for (let i = 0; i < 40; i++) {
      const x = rng.between(0, W);
      const y = rng.between(0, H);
      gfx.fillStyle(0x1d4a17, rng.realInRange(0.1, 0.25));
      gfx.fillCircle(x, y, rng.between(40, 120));
    }

    // Heather patches (purple)
    for (let i = 0; i < 200; i++) {
      const x = rng.between(0, W);
      const y = rng.between(0, H);
      gfx.fillStyle(COLORS.HEATHER, rng.realInRange(0.15, 0.35));
      gfx.fillCircle(x, y, rng.between(8, 25));
    }

    // Stone patches
    for (let i = 0; i < 80; i++) {
      const x = rng.between(0, W);
      const y = rng.between(0, H);
      gfx.fillStyle(COLORS.STONE, rng.realInRange(0.2, 0.4));
      gfx.fillCircle(x, y, rng.between(4, 12));
    }

    // Standing stones — tall narrow rectangles scattered across the map
    for (let i = 0; i < 15; i++) {
      const x = rng.between(100, W - 100);
      const y = rng.between(100, H - 100);
      const w = rng.between(6, 12);
      const h = rng.between(20, 40);

      // Stone body
      gfx.fillStyle(0x666666, 0.6);
      gfx.fillRect(x - w / 2, y - h, w, h);
      // Shadow
      gfx.fillStyle(0x000000, 0.1);
      gfx.fillEllipse(x, y + 2, w + 6, 6);
    }

    // Dirt paths — faint winding lines
    for (let p = 0; p < 3; p++) {
      let px = rng.between(0, W);
      let py = rng.between(0, H);
      gfx.lineStyle(rng.between(8, 14), 0x5a4a30, 0.15);
      gfx.beginPath();
      gfx.moveTo(px, py);
      for (let s = 0; s < 20; s++) {
        px += rng.between(-80, 80);
        py += rng.between(50, 150);
        gfx.lineTo(px, py);
      }
      gfx.strokePath();
    }

    // World edge border
    gfx.lineStyle(4, 0x442200, 0.6);
    gfx.strokeRect(0, 0, W, H);

    // === Water/loch patches with animated shimmer ===
    for (let i = 0; i < 6; i++) {
      const wx = rng.between(200, W - 200);
      const wy = rng.between(200, H - 200);
      const wr = rng.between(30, 60);

      // Dark water base
      const waterBase = this.add.ellipse(wx, wy, wr * 2, wr * 1.2, 0x1a3a5a, 0.5).setDepth(0);
      // Lighter shimmer overlay that pulses
      const shimmer = this.add.ellipse(wx - 5, wy - 3, wr * 1.4, wr * 0.8, 0x3a6a9a, 0.15).setDepth(0);
      this.tweens.add({
        targets: shimmer,
        alpha: { from: 0.1, to: 0.25 },
        x: wx + 5,
        duration: 3000 + rng.between(0, 2000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      // Tiny highlight dot that drifts
      const glint = this.add.circle(wx + rng.between(-10, 10), wy - wr * 0.3, 2, 0x88bbdd, 0.3).setDepth(0);
      this.tweens.add({
        targets: glint,
        x: glint.x + rng.between(-15, 15),
        alpha: { from: 0.15, to: 0.4 },
        duration: 2000 + rng.between(0, 1500),
        yoyo: true,
        repeat: -1,
      });
    }

    // === Ambient mist particles drifting across the playfield ===
    for (let i = 0; i < 20; i++) {
      const mx = rng.between(0, W);
      const my = rng.between(0, H);
      const mist = this.add.ellipse(mx, my,
        rng.between(40, 100), rng.between(20, 40),
        0xccddee, rng.realInRange(0.03, 0.08)
      ).setDepth(1);

      // Slow drift
      this.tweens.add({
        targets: mist,
        x: mist.x + rng.between(-200, 200),
        y: mist.y + rng.between(-80, 80),
        alpha: { from: mist.alpha, to: mist.alpha * 0.3 },
        duration: rng.between(8000, 15000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  getPlayer(): Player { return this.player; }
  getSpawnSystem(): SpawnSystem { return this.spawnSystem; }
  getWeaponSystem(): WeaponSystem { return this.weaponSystem; }
  getXPSystem(): XPSystem { return this.xpSystem; }
}
