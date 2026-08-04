import type { AchievementId } from './BalanceConfig';
import { ACHIEVEMENT_DEFS } from './BalanceConfig';
import { t } from './i18n';
import { globalEventBus } from './GlobalEventBus';
import { SaveManager } from './SaveManager';
import { BOSSES } from '../data/enemies';
import { ROUTES } from '../data/routes';
import { VARIANT_KEYS, VARIANTS } from '../data/variants';
import { getCodexRosterTotal } from '../ui/chronicleAggregates';
import { loadSave } from '../utils/save';

/**
 * Listens to global gameplay events and unlocks achievements into SaveManager.
 * Registered after MetaProgressSystem so kill totals are up to date on GLOBAL_ENEMY_KILLED.
 */
export class AchievementManager {
  private save: SaveManager;
  private started = false;
  private unsubs: Array<() => void> = [];

  constructor(saveManager?: SaveManager) {
    this.save = saveManager ?? new SaveManager();
  }

  /** Boss keys killed during the current run — reset on run start. */
  private runBossKills = new Set<string>();

  start(): void {
    if (this.started) return;
    this.started = true;
    this.runBossKills.clear();
    this.unsubs.push(
      globalEventBus.on('GLOBAL_ENEMY_KILLED', (p) => this.onEnemyKilled(p)),
      globalEventBus.on('GLOBAL_RUN_TIME_SEC', (p) => this.onRunTime(p)),
      globalEventBus.on('GLOBAL_RUN_ENDED', (p) => this.onRunEnded(p)),
      globalEventBus.on('GLOBAL_WEAPON_EVOLVED', () => this.tryUnlock('ach_first_evolution')),
      // V2 — Cailleach Gauntlet win. Fires on successful gauntlet
      // resolution; unlock the achievement that gates the
      // cailleach_mantle tartan.
      globalEventBus.on('GLOBAL_CAILLEACH_GAUNTLET_WON', () => this.tryUnlock('ach_crown_the_cailleach')),
      globalEventBus.on('GLOBAL_MOOR_MOMENT', () => this.onMoorMoment()),
      globalEventBus.on('GLOBAL_COMBO_MILESTONE', (p) => this.onComboMilestone(p))
    );
  }

  private onComboMilestone(p: import('./GlobalEventBus').GlobalComboMilestonePayload): void {
    if (p.count >= 100) this.tryUnlock('ach_combo_100');
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    for (const u of this.unsubs) u();
    this.unsubs = [];
  }

  private onEnemyKilled(p: import('./GlobalEventBus').GlobalEnemyKilledPayload): void {
    const s = this.save.load();
    if (p.enemyKey) {
      let codexNew = false;
      this.save.update((cur) => {
        if (cur.codexCulledKeys.includes(p.enemyKey)) return cur;
        codexNew = true;
        return {
          ...cur,
          codexCulledKeys: [...cur.codexCulledKeys, p.enemyKey].sort(),
        };
      });
      if (codexNew) {
        globalEventBus.emit('CODEX_FIRST_CULL', { enemyKey: p.enemyKey });
        const n = this.save.load().codexCulledKeys.length;
        const total = getCodexRosterTotal();
        const halfTarget = Math.max(1, Math.ceil(total * 0.5));
        if (n >= halfTarget) this.tryUnlock('ach_codex_half');
        if (n >= total) this.tryUnlock('ach_codex_loremaster');
      }
    }
    // Kill-count achievements read the LIFETIME total (balance + spent) so
    // heavy MetaShop spenders don't permanently fall off the unlock curve.
    const lifetimeKills = s.totalKills + s.totalKillsSpent;
    if (lifetimeKills >= 1000) this.tryUnlock('ach_kills_1000');
    if (lifetimeKills >= 5000) this.tryUnlock('ach_kills_5000');
    if (p.wasBoss) {
      this.runBossKills.add(p.enemyKey);
      if (p.enemyKey === 'taxman') this.tryUnlock('ach_defeat_taxman');
      // Derive from BOSSES data so adding/removing a boss type keeps the
      // achievement threshold honest.
      if (this.runBossKills.size >= BOSSES.length) this.tryUnlock('ach_all_bosses');
    }
  }

  private onRunTime(p: import('./GlobalEventBus').GlobalRunTimePayload): void {
    if (p.gameTimeSec >= 300) this.tryUnlock('ach_survive_5m');
    if (p.gameTimeSec >= 600) this.tryUnlock('ach_survive_10m');
    if (p.gameTimeSec >= 900) this.tryUnlock('ach_full_run');
  }

  private onRunEnded(p: import('./GlobalEventBus').GlobalRunEndedPayload): void {
    if (p.outcome === 'victory') this.tryUnlock('ach_first_victory');
    this.runBossKills.clear();
    // W2 + W66 deeds read the gameplay save's freshly-written final
    // entry — RunHistoryRecorder runs ahead of this bus emit.
    try {
      const gameplay = loadSave();
      const seen = new Set<string>();
      for (const entry of gameplay.runHistory ?? []) {
        for (const pick of entry.routes ?? []) seen.add(pick.routeKey);
      }
      if (seen.size >= ROUTES.length) this.tryUnlock('ach_walk_every_road');

      if (p.outcome === 'victory') {
        const lastEntry = gameplay.runHistory?.[gameplay.runHistory.length - 1];
        if (lastEntry?.ironmoor === true) this.tryUnlock('ach_ironmoor_victor');
        if (lastEntry?.variantKey === 'laird') this.tryUnlock('ach_laird_victor');
      }

      // ach_full_herd: unlocked every playable variant. Read after the
      // save migrator's `evaluateVariantUnlocks` pass has run on this
      // run's stats, so freshly-won unlocks are reflected immediately.
      const unlocked = gameplay.unlockedVariants ?? [];
      if (unlocked.length >= VARIANT_KEYS.length) this.tryUnlock('ach_full_herd');

      // ach_stone_circle — picked each Standing Stone boon at least once.
      const stones = gameplay.standingStonesPicked ?? {};
      if ((stones.mending ?? 0) > 0 && (stones.fire ?? 0) > 0 && (stones.haste ?? 0) > 0) {
        this.tryUnlock('ach_stone_circle');
      }

      // ach_echo_touched — touched at least one Ancestral Echo.
      if ((gameplay.ancestralEchoesTouched ?? 0) > 0) {
        this.tryUnlock('ach_echo_touched');
      }

      // ach_relic_seeker — picked any Reliquary curio at least once.
      // Encourages the off-path detour; once earned the pin on the
      // minimap is still useful for future curio variety.
      const relics = gameplay.reliquaryCuriosPicked ?? {};
      for (const count of Object.values(relics)) {
        if (count > 0) {
          this.tryUnlock('ach_relic_seeker');
          break;
        }
      }

      // ach_ceilidh_commander — fired 15 lifetime Ceilidh Chain pulses
      // (every-8th-kill flares). Threshold is comfortable for a mid-game
      // player: ~2-3 full runs with competent combo play.
      if ((gameplay.ceilidhPulsesLifetime ?? 0) >= 15) {
        this.tryUnlock('ach_ceilidh_commander');
      }

      // ach_past_the_bell — entered Post-Bell at all (any positive endless
      // record). The "longest" line in the Chronicle now has a deed to pair
      // with it.
      const endlessSec = gameplay.bestEndlessSeconds ?? 0;
      if (endlessSec > 0) {
        this.tryUnlock('ach_past_the_bell');
      }
      // ach_endless_endurance — survived a full minute past the bell.
      if (endlessSec >= 60) {
        this.tryUnlock('ach_endless_endurance');
      }

      // ach_cursed_victor — won a run with any curse active. Reads
      // runHistory rather than the live runModifiers so the unlock
      // also fires when the just-finished run is the cursed victory.
      const wonAnyCursedRun = (gameplay.runHistory ?? []).some(
        (e) => e.isVictory && typeof e.curseKey === 'string' && e.curseKey.length > 0,
      );
      if (wonAnyCursedRun) {
        this.tryUnlock('ach_cursed_victor');
      }

      // ach_cailleach_unlock — won 3 cursed runs. The increment is handled
      // by applyRunSummary in save.ts (cursedVictoriesCompleted field) so
      // we just read the already-persisted gameplay-save count here.
      // Threshold matches VariantDef: VARIANTS.find(v=>v.key==='cailleach').unlock.required.
      const cailleachRequired = VARIANTS.find((v) => v.key === 'cailleach')?.unlock as
        | { type: 'cursed_victories'; required: number }
        | undefined;
      if ((gameplay.cursedVictoriesCompleted ?? 0) >= (cailleachRequired?.required ?? 3)) {
        this.tryUnlock('ach_cailleach_unlock');
      }

      // V2 Track 1 — ach_doric_unlock. Won a run without ever overlapping a
      // healing circle. Counter written by applyRunSummary via
      // `RunHistoryContext.enteredHealingCircle`; threshold matches
      // VariantDef.doric_quinie.unlock.required (currently 1).
      const doricRequired = VARIANTS.find((v) => v.key === 'doric_quinie')?.unlock as
        | { type: 'runs_without_healing'; required: number }
        | undefined;
      if ((gameplay.runsWithoutHealingCircleCompleted ?? 0) >= (doricRequired?.required ?? 1)) {
        this.tryUnlock('ach_doric_unlock');
      }

      // V2 Track 2 — ach_peerie_unlock. Won a run where visited biomes were
      // a subset of {loch, pine} (coastal only — never bog, never heather).
      // Counter written by applyRunSummary via
      // `RunHistoryContext.biomesVisited`; threshold matches
      // VariantDef.peerie_shetlander.unlock.required (currently 1).
      const peerieRequired = VARIANTS.find((v) => v.key === 'peerie_shetlander')?.unlock as
        | { type: 'runs_in_coastal_only'; required: number }
        | undefined;
      if ((gameplay.runsInCoastalOnlyCompleted ?? 0) >= (peerieRequired?.required ?? 1)) {
        this.tryUnlock('ach_peerie_unlock');
      }

      // E1 M2 T11 — ach_burns_beastie_unlock. Tightened to
      // `burns_night_full_evo`: a victory with at least
      // `BURNS_EVOLUTION_THRESHOLD` weapon evolutions during a run
      // that ends inside a Burns Night window.
      // Counter written by applyRunSummary via
      // `RunHistoryContext.seasonalEventKey` + evolvedWeaponCount;
      // threshold matches VariantDef.burns_wee_beastie.unlock.required.
      const burnsRequired = VARIANTS.find((v) => v.key === 'burns_wee_beastie')?.unlock as
        | { type: 'burns_night_full_evo'; required: number }
        | undefined;
      if ((gameplay.burnsNightFullEvoRunsCompleted ?? 0) >= (burnsRequired?.required ?? 1)) {
        this.tryUnlock('ach_burns_beastie_unlock');
      }
    } catch {
      // best-effort — don't let a corrupt save block run-end flow.
    }
  }

  private onMoorMoment(): void {
    let next = 0;
    this.save.update((cur) => {
      next = cur.moorMomentsLifetime + 1;
      return { ...cur, moorMomentsLifetime: next };
    });
    if (next >= 30) this.tryUnlock('ach_moor_hearth_30');
  }

  private tryUnlock(id: AchievementId): void {
    if (!ACHIEVEMENT_DEFS[id]) return;
    let did = false;
    this.save.update((cur) => {
      if (cur.unlockedAchievements.includes(id)) return cur;
      did = true;
      return {
        ...cur,
        unlockedAchievements: [...cur.unlockedAchievements, id],
      };
    });
    if (did) {
      globalEventBus.emit('ACHIEVEMENT_UNLOCKED', {
        id,
        title: t(ACHIEVEMENT_DEFS[id].titleKey),
      });
    }
  }
}

export const achievementManager = new AchievementManager();
