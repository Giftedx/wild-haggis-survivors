/**
 * Run-intro toasts — Phase 5 Bucket 11 of the GameScene regrowth audit.
 *
 * Two side-effect-only helpers fire shortly after `create()` settles:
 *
 * - **Replay watching-toast** — when the run is playing back a recorded
 *   blob, surface a short toast and flip the persistent HUD chip on so
 *   the viewer knows they're not driving. Toast is transient; chip
 *   stays for the run.
 * - **Ancestor whisper** — 3 s into a fresh run, surface a one-liner
 *   from a past haggis. Skipped on a player's very first run (history
 *   empty) and during replay playback (the scene is reproducing a
 *   prior run; whispering about other runs would break the illusion).
 *
 * The 3 s delayed call uses `scene.time.delayedCall`, so it respects
 * scene shutdown — the inner `scene.isActive()` guard is belt-and-
 * braces against a stale callback firing into a stopped scene if the
 * player abandons inside the delay window.
 */
import type Phaser from 'phaser';
import type { ReplayInput } from '../../replay/ReplayInput';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { HUD } from '../../ui/HUD';
import type { ISaveData } from '../../core/SaveManager';
import { pickAncestor } from '../../data/ancestorWhispers';
import { t } from '../../core/i18n';
import { TOAST_COLORS } from '../../ui/toastPalette';

export interface RunIntroToastsContext {
  scene: Phaser.Scene;
  replayInput: ReplayInput | null;
  juice: JuiceSystem;
  hud: HUD;
  /** Re-loads from `metaSaveManager` at delayed-call time so the
   *  3-s-old snapshot doesn't go stale if anything writes meta in the
   *  interim. */
  loadMetaSave: () => ISaveData;
  /** Tunnelled through `GameScene.getJuice()` so a stale callback
   *  fired after teardown sees `null` instead of crashing on a
   *  destroyed reference. */
  getJuice: () => JuiceSystem | null;
}

const KIN_KEYS = [
  'Great-great-gran',
  'Great-gran',
  'Gran',
  'Auntie',
  'Uncle',
  'Cousin',
  'Elder',
  'Forebear',
] as const;

export function showRunIntroToasts(ctx: RunIntroToastsContext): void {
  if (ctx.replayInput) {
    ctx.juice.showToast(t('ui.replay.watching_toast'), '#88ccff');
    ctx.hud.setReplayMode(true);
    // Replay runs skip the ancestor whisper — the run reproduces a past
    // haggis, so whispering about a different past haggis would clash.
    return;
  }

  ctx.scene.time.delayedCall(3000, () => {
    if (!ctx.scene.scene.isActive()) return;
    const save = ctx.loadMetaSave();
    const history = save.runHistory ?? [];
    if (history.length === 0) return;
    const pick = pickAncestor({
      runHistory: history.map((h) => ({
        name: h.name ?? '',
        seed: String(h.runSeed ?? ''),
      })),
      rngSample: Math.random(),
    });
    if (!pick || !pick.name) return;
    const line = t(pick.whisperKey);
    const kinKey = KIN_KEYS[Math.floor(Math.random() * KIN_KEYS.length)]!;
    const kin = t(`ancestor.kin.${kinKey}`);
    const msg = t('ancestor.toast', { kin, name: pick.name, line });
    ctx.getJuice()?.showToast(msg, TOAST_COLORS.info);
  });
}
