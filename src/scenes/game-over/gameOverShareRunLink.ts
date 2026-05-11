/**
 * Share-run link — W82 viral lever. Sits next to the "↻ same seed"
 * rerun link on Game Over. Clicking builds a deep-link URL that
 * encodes the run's seed + variant + curse and copies it to the
 * clipboard. Anyone who pastes that URL into a browser is dropped
 * straight into the same starting conditions (the receiver still plays
 * their own inputs — this is a setup share, not a replay).
 *
 * Builds on the deterministic seed/variant/curse contract the rerun-seed
 * link already uses; the only new surface is the URL codec
 * (`src/utils/sharedRunUrl.ts`) + the BootScene `?run=...` router.
 *
 * Render contract mirrors the sibling links (postcard / rerun-seed):
 * pure presentation, payload re-read at click time so late-arriving
 * swaps are honoured, success state is one-shot per link instance.
 */
import * as Phaser from 'phaser';

import { t } from '../../core/i18n';
import { audio } from '../../systems/AudioSystem';
import { getCurseByKey, type CurseKey } from '../../data/curses';
import { VARIANT_KEYS, type VariantKey } from '../../data/variants';
import { copyTextToClipboard } from '../../utils/clipboard';
import {
  buildSharedRunUrl,
  type SharedRunChallenge,
} from '../../utils/sharedRunUrl';
import { resolveCopyActionLinkPalette } from '../gameOverLinkPalette';
import type { GameOverPayload } from '../gameOverPayload';
import { COPY_ACTION_LINK_TEXT_BASE } from './copyActionLinkText';

export interface RenderGameOverShareRunLinkOpts {
  centerX: number;
  y: number;
  depth: number;
  delay: number;
  /** Payload accessor — re-read at click time so a late-arriving payload is honoured. */
  getPayload: () => GameOverPayload | null;
}

function pickVariantKey(raw: string | undefined): VariantKey | null {
  if (!raw) return null;
  return (VARIANT_KEYS as readonly string[]).includes(raw) ? (raw as VariantKey) : null;
}

/**
 * Distil the sharer's outcome from `payload` into a `SharedRunChallenge`,
 * or null if the run wasn't winnable yet (zero-second crash before any
 * play). The codec's defensive bounds catch tampering on the receiving
 * side; this just funnels the live values through.
 */
function buildChallengeFromPayload(
  payload: GameOverPayload,
): SharedRunChallenge | null {
  const secs = payload.summary?.timeSurvivedSec;
  if (typeof secs !== 'number' || !Number.isFinite(secs) || secs <= 0) {
    return null;
  }
  return {
    outcome: payload.mode === 'victory' ? 'victory' : 'death',
    timeSurvivedSec: Math.floor(secs),
  };
}

/**
 * Compute the base URL the share link should layer params onto.
 * Returns `window.location.origin + pathname` so any pre-existing
 * query/hash on the sharer's URL is dropped — recipients should land
 * on a clean URL, not inherit the sharer's UTM tags or devDps flags.
 */
function getShareBaseUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return `${window.location.origin}${window.location.pathname}`;
  } catch {
    return null;
  }
}

export function renderGameOverShareRunLink(
  scene: Phaser.Scene,
  opts: RenderGameOverShareRunLinkOpts,
): void {
  const { centerX, y, depth, delay, getPayload } = opts;
  const hint = t('ui.gameOver.share_run_hint');
  const palette = resolveCopyActionLinkPalette(false);
  const text = scene.add
    .text(centerX, y, `↗ ${hint}`, {
      ...COPY_ACTION_LINK_TEXT_BASE,
      color: palette.idle,
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(depth)
    .setAlpha(0)
    .setInteractive({ useHandCursor: true });
  scene.tweens.add({ targets: text, alpha: 1, duration: 260, delay });

  let copied = false;
  const doCopy = () => {
    if (copied) return;
    const p = getPayload();
    if (!p || typeof p.runSeed !== 'number') return;
    const variant = pickVariantKey(p.variantKey);
    if (!variant) return;
    const base = getShareBaseUrl();
    if (!base) return;
    // Validate the curse key through the curse table so a stale /
    // build-removed curse falls back to "clean" — same forward-
    // compat policy the URL codec uses on the recipient side.
    const curse = getCurseByKey(p.curseKey ?? null);
    // V2 — attach the sharer's outcome (time + win/loss flag) so the
    // recipient lands on a "↗ Shared run · 12:34 to beat" banner.
    // The codec floors fractional seconds and rejects non-finite /
    // out-of-range values, so a malformed payload silently degrades
    // to the V1 (setup-only) share rather than refusing the whole URL.
    const challenge = buildChallengeFromPayload(p);
    const url = buildSharedRunUrl(
      {
        seed: p.runSeed,
        variantKey: variant,
        curseKey: curse ? (curse.key as CurseKey) : null,
        challenge: null,
      },
      base,
      { challenge },
    );
    const ok = copyTextToClipboard(url);
    if (ok) {
      copied = true;
      text.setText(`↗ ${t('ui.gameOver.share_run_copied')}`);
      text.setColor(palette.success);
      audio.playClick();
    }
  };
  text.on('pointerover', () => { if (!copied) text.setColor(palette.hover); });
  text.on('pointerout', () => { if (!copied) text.setColor(palette.idle); });
  text.on('pointerdown', doCopy);
}
