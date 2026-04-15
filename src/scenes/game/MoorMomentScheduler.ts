import { XP } from '../../config';
import type { Player } from '../../entities/Player';
import type { XPSystem } from '../../systems/XPSystem';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { BanterSystem } from '../../systems/BanterSystem';
import type { SFXManager } from '../../systems/audio/SFXManager';
import type { TutorialSystem } from '../../systems/TutorialSystem';
import type { RunModifiers } from '../../core/RunModifiers';
import { audio } from '../../systems/AudioSystem';
import { globalEventBus } from '../../core/GlobalEventBus';
import { t } from '../../core/i18n';
import type { BiomeId } from '../../data/biomes';
import type { RNG } from '../../utils/rng';
import {
  MOOR_HOME_REWARD,
  MOOR_MOMENT_BURST_TINT,
  MOOR_MOMENT_FIRST_SEC,
  MOOR_MOMENT_GAP_BASE_SEC,
  MOOR_MOMENT_GAP_JITTER_SEC,
  shuffleMoorMoments,
  type MoorMomentDef,
} from '../../data/moorMoments';

export interface MoorMomentSchedulerHooks {
  getRunRng: () => RNG;
  getPlayer: () => Player | undefined;
  getVictoryPending: () => boolean;
  getCurrentBiomeId: () => BiomeId | null;
  getTutorialSystem: () => TutorialSystem | undefined;
  getRunModifiers: () => RunModifiers;
  getXPSystem: () => XPSystem;
  getJuice: () => JuiceSystem;
  getBanter: () => BanterSystem | null;
  getSFXManager: () => SFXManager;
  addCoinGold: (amount: number) => void;
  caption: (id: string, message: string, tint?: string, durationMs?: number) => void;
}

/**
 * Owns the moor-moment schedule (shuffled draws from `moorMoments.ts`) plus
 * the fire pipeline: tutorial notify → caption/toast → reward → burst →
 * SFX → event bus → banter. Kept in one place so the orchestration rules
 * (home biome bonuses, level-cap XP fallback, anti-clobber gap) stay legible.
 */
export class MoorMomentScheduler {
  private schedule: MoorMomentDef[] = [];
  private index = 0;
  private nextAtSec = MOOR_MOMENT_FIRST_SEC;

  constructor(private readonly hooks: MoorMomentSchedulerHooks) {}

  /** Reset to run-start state and re-seed the schedule off the run RNG. */
  reset(): void {
    this.schedule = shuffleMoorMoments(this.hooks.getRunRng());
    this.index = 0;
    this.nextAtSec = MOOR_MOMENT_FIRST_SEC;
  }

  /**
   * On run resume, push the next moor moment out so the resumed run doesn't
   * fire one immediately after rehydration.
   */
  pushAfterResume(gameTimeSec: number): void {
    this.nextAtSec = Math.max(this.nextAtSec, Math.floor(gameTimeSec) + 65);
  }

  /** Called once per integer run-second. Fires at most one moment per tick. */
  tick(runSec: number): void {
    if (this.hooks.getVictoryPending()) return;
    if (runSec < this.nextAtSec) return;
    const player = this.hooks.getPlayer();
    if (!player?.active) return;
    if (this.schedule.length === 0) {
      this.schedule = shuffleMoorMoments(this.hooks.getRunRng());
    }
    const def = this.schedule[this.index % this.schedule.length];
    this.index++;
    if (this.index % this.schedule.length === 0) {
      this.schedule = shuffleMoorMoments(this.hooks.getRunRng());
    }
    const gap =
      MOOR_MOMENT_GAP_BASE_SEC +
      this.hooks.getRunRng().int(0, MOOR_MOMENT_GAP_JITTER_SEC);
    this.nextAtSec = runSec + gap;
    this.fire(def);
  }

  private fire(def: MoorMomentDef): void {
    const h = this.hooks;
    const player = h.getPlayer();
    if (!player) return;

    h.getTutorialSystem()?.notifyMoorMomentIfFirst();

    const here = h.getCurrentBiomeId();
    const atHome = Boolean(
      def.homeBiome && def.captionKeyHome && def.toastKeyHome && here === def.homeBiome,
    );
    const captionResolveKey = atHome ? def.captionKeyHome! : def.captionKey;
    const toastResolveKey = atHome ? def.toastKeyHome! : def.toastKey;

    const cap = t(captionResolveKey);
    const captionText = cap !== captionResolveKey ? cap : '';
    if (captionText) {
      h.caption(`moor_${def.id}`, captionText, '#c9a86c', 5200);
    }

    const r = def.reward;
    let toastStr: string;
    if (r.kind === 'gold') {
      const baseGold = atHome ? r.amount * MOOR_HOME_REWARD.goldMult : r.amount;
      const g = Math.max(1, Math.floor(baseGold * h.getRunModifiers().goldMult));
      h.addCoinGold(g);
      toastStr = t(toastResolveKey, { gold: g });
    } else if (r.kind === 'xp') {
      if (h.getXPSystem().getLevel() >= XP.MAX_LEVEL) {
        let g = Math.max(5, Math.floor(r.amount / 2));
        if (atHome) g = Math.max(5, Math.floor(g * MOOR_HOME_REWARD.goldMult));
        h.addCoinGold(g);
        toastStr = t('ui.moor_moment.boon_at_ceiling', { gold: g });
      } else {
        const xpBase = atHome ? r.amount * MOOR_HOME_REWARD.xpMult : r.amount;
        const xpShow = Math.ceil(xpBase * player.getXpMultiplier());
        h.getXPSystem().grantBonusXp(xpBase);
        toastStr = t(toastResolveKey, { xp: xpShow });
      }
    } else if (r.kind === 'heal') {
      const hp = atHome ? Math.ceil(r.amount * MOOR_HOME_REWARD.healMult) : r.amount;
      player.heal(hp);
      toastStr = t(toastResolveKey, { hp });
    } else {
      const flat = atHome ? r.flatPx + MOOR_HOME_REWARD.magnetFlatBonus : r.flatPx;
      const dur = atHome ? r.durationMs + MOOR_HOME_REWARD.magnetDurationMsBonus : r.durationMs;
      player.grantMoorMomentMagnet(flat, dur);
      toastStr = t(toastResolveKey);
    }

    const burstTint =
      atHome && def.homeBiome
        ? MOOR_MOMENT_BURST_TINT[def.homeBiome]
        : here
          ? MOOR_MOMENT_BURST_TINT[here]
          : undefined;
    h.getJuice().showMoorMomentBurst(player.x, player.y, burstTint);
    h.getJuice().showToast(toastStr, '#e8c896');
    h.getJuice().flashWhite(72);
    h.getSFXManager().tryPlay('moor_moment', () => audio.playMoorMomentImmediate());

    globalEventBus.emit('GLOBAL_MOOR_MOMENT', {
      momentId: def.id,
      atHomeBiome: atHome,
      biomeId: here,
    });

    let banterTag: string | undefined;
    if (atHome && def.homeBiome) banterTag = `home_${def.homeBiome}`;
    else if (here) banterTag = here;
    h.getBanter()?.request('moor_moment', banterTag ? { tag: banterTag } : undefined);
  }
}
