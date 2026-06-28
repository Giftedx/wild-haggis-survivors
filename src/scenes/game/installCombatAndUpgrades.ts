/**
 * installCombatAndUpgrades — `GameScene.create()` phase 3.
 *
 * Wires the camera follow, environmental hazard zones, the core combat
 * trio (StatusFxPool + Spawn/Weapon/XP systems), per-run state resets,
 * variant starter kit (weapons / modifiers / passives), the Selkie
 * dual-form bind, the Drouthy/Pibroch variant tweaks, and the permanent
 * upgrades + Ironmoor lock — in the exact order the inline block used.
 *
 * Why extract: ~120 LOC of `create()`. Pulling it into an ordered phase
 * installer makes the run-start sequence legible and shrinks the scene
 * class toward the facade target. Behaviour is identical: same call
 * order, same field writes, same RNG consumption (`applyPermanentUpgrades`
 * reads `runRng` at the same point).
 *
 * Why type-couple to GameScene (precedent: `buildCombatCollisionHooks`):
 * the phase reads + writes many scene fields outside any sub-system's
 * public surface. A type-only `import type { GameScene }` keeps the
 * wiring honest without a runtime import cycle.
 */
import { GAME } from '../../config';
import type { GameScene } from '../GameScene';
import type { VariantDef } from '../../data/variants';
import type { IRunState } from '../../core/SaveManager';
import { installHazardZones } from './installHazardZones';
import { tryMoorMercyLuck as moorMomentsTryMercyLuck } from './moorMoments';
import { installCoreCombatSystems } from './installCoreCombatSystems';
import { createRuneEffectBag } from '../../systems/runes/runeEffects';
import { RuneConditionSystem } from '../../systems/RuneConditionSystem';
import {
  applyPermanentUpgrades,
  applyVariantModifiers,
  applyVariantStartPassives,
  applyVariantStartWeapons,
} from './runStartModifiers';
import { getSelkieRunStartPickupBonus } from '../../entities/selkieForm';

/** Run `create()` phase 3: combat systems, variant kit, permanent upgrades. */
export function installCombatAndUpgrades(
  scene: GameScene,
  { selectedVariant, resumeRun }: { selectedVariant: VariantDef; resumeRun: IRunState | null },
): void {
  // Camera before GrowthSystem so baseZoom matches the zoom used in-game (GrowthSystem reads cameras.main.zoom in its ctor).
  scene.cameras.main.startFollow(scene.player, true, 0.08, 0.08);
  scene.cameras.main.setZoom(1.3);
  scene.cameras.main.setBounds(0, 0, GAME.WORLD_WIDTH, GAME.WORLD_HEIGHT);

  scene.hazardZones = installHazardZones({
    scene,
    prior: scene.hazardZones,
    getPlayer: () => scene.player,
    getJuice: () => scene.juice,
    getDeathCauseTracker: () => scene.deathCauseTracker,
    getSpawnSystem: () => scene.spawnSystem,
    getRunRng: () => scene.runRng,
    getIFrameController: () => scene.iFrameController,
    getRunScore: () => scene.runScore,
    getRunModifiers: () => scene.runModifiers,
    getRunLifecycle: () => scene.runLifecycle,
    getRelicEffectDriver: () => scene.relicEffectDriver ?? null,
    getCurrentTimeMs: () => scene.time.now,
    tryMoorMercyLuck: (hp) => moorMomentsTryMercyLuck(scene.moorMomentsState, scene.buildMoorMomentsContext(), hp),
  });

  ({
    statusFxPool: scene.statusFxPool,
    spawnSystem: scene.spawnSystem,
    weaponSystem: scene.weaponSystem,
    xpSystem: scene.xpSystem,
  } = installCoreCombatSystems({
    scene,
    runModifiers: scene.runModifiers,
    bossHpTracker: scene.bossHpTracker,
    getRelicEffectDriver: () => scene.relicEffectDriver ?? null,
  }));
  scene.ownedPassives = [];
  scene.evolvedWeapons = [];
  scene.ownedRuneIds = [];
  // U1 — fresh rune bag + system per run (scene instance is reused).
  scene.runeBag = createRuneEffectBag();
  scene.runeSystem = new RuneConditionSystem(scene.runeBag);
  scene.xpOverflowGoldBatch = 0;
  scene.revivalAvailable = false;

  // Pre-allocate floating text pool for armor/gold feedback.
  scene.floatTextPool.init(scene);

  // Variant starter weapon: variants with startWithWeapons get their
  // thematic weapon; all others get the default Thistle Shot.
  // Called before applyPermanentUpgrades so weapon_training levels the
  // right weapon. WeaponSystem constructor is now starter-weapon-free.
  applyVariantStartWeapons(scene.weaponSystem, selectedVariant);

  // Variant modifiers establish the run archetype before permanent upgrades stack on top.
  applyVariantModifiers(scene.player, selectedVariant);
  // V2 followup — variant starter passives land before permanent
  // upgrades so lucky_start reads the pre-populated ownedPassives.
  applyVariantStartPassives(scene.player, scene.ownedPassives, selectedVariant);

  // Wild Living World — Selkie Dual-Form bind. Player owns the form
  // state; the listener routes the shift into the LivingWorld
  // director so future subsystems (music bridge, atmosphere) can
  // react to it. Phase 2 — also bind a biome accessor so the seal
  // form's coastal-affinity bloom resolves against the live biome,
  // and apply the run-start pickup-radius blessing (no-op for any
  // non-Selkie variant — `getSelkieRunStartPickupBonus` short-circuits).
  scene.player.bindSelkieRun(selectedVariant.key, (form) => {
    scene.livingWorldDirector.notify({
      kind: 'form_shifted',
      from: form === 'seal' ? 'haggis' : 'seal',
      to: form,
    });
    // Wild Living World Phase 2 — banter follow-up. Pass the new form
    // as the sub-pool tag so the engine picks `seal` / `haggis` lines
    // appropriately. Priority 27 keeps dash-spam from outshouting
    // higher-tier events (boss warnings, low-HP); the no-repeat ring
    // handles cadence within the pool.
    scene.requestBanter('form_shifted', form);
  });
  scene.player.setBiomeAccessor(() => {
    if (!scene.biomeController) return null;
    return scene.biomeController.currentBiomeAt(scene.player.x, scene.player.y);
  });
  {
    // Selkie Phase 2 — small one-shot pickup-radius blessing at run
    // start so the seal's coastal affinity reads as "kit the player
    // brought" rather than purely a biome reaction. Goes through the
    // public `addPickupRadius` accessor so the bonus participates in
    // `recalcStats` (which clamps + reapplies fog mul + selkie flat).
    const bonus = getSelkieRunStartPickupBonus(selectedVariant.key);
    if (bonus > 0) scene.player.addPickupRadius(bonus);
  }

  // Drouthy Haggis — pre-load Whisky Breath stacks so the first burst
  // is available from the opening bell (flask was half-drunk already).
  if (selectedVariant.startWhiskyStacks) {
    scene.player.setWhiskyBreathStacks(selectedVariant.startWhiskyStacks);
  }

  // Pibroch Haggis — widen the beat-alignment window so rhythm hits
  // come naturally (the ceòl mòr is already in them).
  if (selectedVariant.modifiers.pibrochWindowExtensionMs) {
    scene.weaponSystem.setPibrochWindowExtensionMs(selectedVariant.modifiers.pibrochWindowExtensionMs);
  }

  // Apply permanent upgrades from save data. The two flag outputs
  // don't live on Player so come back as a result object.
  const permResult = applyPermanentUpgrades({
    player: scene.player,
    weaponSystem: scene.weaponSystem,
    ownedPassives: scene.ownedPassives,
    runRng: scene.runRng,
  });
  scene.revivalAvailable = permResult.revivalAvailable;
  // W66 Ironmoor: lock the ironmoor flag in at run start. On a fresh
  // run we read the live setting; on resume we prefer the snapshot
  // value so a player who toggled Ironmoor OFF between quit + resume
  // doesn't retroactively get Second Wind back on a permadeath run.
  scene.activeIronmoorRun = resumeRun?.ironmoor
    ?? scene.settingsManager.load().ironmoorMode;
  if (scene.activeIronmoorRun) {
    // Opt-in single-life mode suppresses the Second-Wind grant
    // regardless of permanent-upgrade purchases.
    scene.revivalAvailable = false;
  }
  scene.chestDurationBonusMs = permResult.chestDurationBonusMs;
}
