/**
 * XP-system event listeners — Phase 5 Bucket 7 of the GameScene
 * regrowth audit. Two side-effect-only listeners on `xpSystem.events`:
 *
 *  - `levelup` → LevelUpFlow.handleLevelUp + Player celebrate one-shot
 *    + variant-tagged banter request + accessibility caption.
 *  - `echoReady` → LevelUpFlow.handleEcho + accessibility caption.
 *    Echo cards are post-cap XP picks; same UI, no ceremony.
 *
 * Listeners are added via `events.on` only — the scene reuses the
 * XPSystem instance for the run, and a scene restart builds a fresh
 * instance, so old listeners die with the old instance. No teardown
 * call needed.
 */
import type { XPSystem } from '../../systems/XPSystem';
import type { Player } from '../../entities/Player';
import type { LevelUpFlow } from './LevelUpFlow';
import type { BanterSystem } from '../../systems/BanterSystem';
import { t } from '../../core/i18n';

export interface WireXpSystemListenersInputs {
  xpSystem: XPSystem;
  levelUpFlow: LevelUpFlow;
  player: Player;
  /** Lazy because banter is constructed late in `create()`. */
  getBanter: () => BanterSystem | null;
  /** Lazy because activeVariant is reassigned per run via `create()`. */
  getActiveVariantKey: () => string | undefined;
  caption: (id: string, msg: string, tint: string, dur: number) => void;
}

export function wireXpSystemListeners(inputs: WireXpSystemListenersInputs): void {
  const { xpSystem, levelUpFlow, player, getBanter, getActiveVariantKey, caption } = inputs;

  xpSystem.events.on('levelup', (newLevel: number) => {
    levelUpFlow.handleLevelUp(newLevel);
    // Celebrating one-shot — haggis hops in place. Plays once, loops
    // four frames while the upgrade overlay is up, then the FSM
    // returns to idle/walking when the overlay dismisses.
    player.notifyCelebrate();
    // Tag with the active variant so iron_belly/moor_runner flavor
    // their celebration; other variants fall through to the generic
    // pool silently (missing sub-pool == no special handling).
    getBanter()?.request('level_up', { tag: getActiveVariantKey() });
    caption('level_up', t('ui.captions.level_up'), '#ffdd66', 3500);
  });

  // Post-cap echo cards — same UI as a level-up but without the
  // ceremony (no heal, no aura, no milestone pulse).
  xpSystem.events.on('echoReady', () => {
    levelUpFlow.handleEcho();
    caption('echo_ready', t('ui.captions.echo_ready'), '#c8a8e8', 3500);
  });
}
