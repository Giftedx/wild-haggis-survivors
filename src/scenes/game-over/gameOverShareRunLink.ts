/**
 * Share-run link — W82 viral lever. Sits next to the "↻ same seed"
 * rerun link on Game Over. Clicking builds a deep-link URL that
 * encodes the run's seed + variant + curse.
 *
 * Share path (priority order):
 *   1. Web Share API with postcard image + URL (mobile / Chrome 86+ with
 *      file-share support) — opens the native share sheet so the player
 *      can drop the run directly into Discord, Mastodon, iMessage etc.
 *   2. Web Share API URL-only (browsers with share but no canShare files).
 *   3. Clipboard URL copy — existing desktop fallback.
 *
 * The postcard blob is built synchronously within the click handler so it
 * stays inside the browser's user-activation window (required by the Web
 * Share API on many browsers).
 *
 * Render contract mirrors the sibling links (postcard / rerun-seed):
 * pure presentation, payload re-read at click time so late-arriving
 * swaps are honoured.
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
import { renderPostcardBlob } from '../../utils/postcard';
import { buildPostcardPayloadFromGameOver } from '../gameOverFormatting';
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

/** Feature-detect Web Share API (including file-sharing capability). */
function getWebShareMode(postcardFile: File | null): 'file' | 'url' | 'none' {
  if (typeof navigator === 'undefined') return 'none';
  const nav = navigator as Navigator & {
    share?: (data: ShareData) => Promise<void>;
    canShare?: (data: ShareData) => boolean;
  };
  if (typeof nav.share !== 'function') return 'none';
  if (postcardFile && typeof nav.canShare === 'function' && nav.canShare({ files: [postcardFile] })) {
    return 'file';
  }
  return 'url';
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

  let done = false;

  const markShared = () => {
    done = true;
    text.setText(`↗ ${t('ui.gameOver.share_run_shared')}`);
    text.setColor(palette.success);
    audio.playClick();
  };

  const markCopied = () => {
    done = true;
    text.setText(`↗ ${t('ui.gameOver.share_run_copied')}`);
    text.setColor(palette.success);
    audio.playClick();
  };

  const doCopy = () => {
    if (done) return;
    const p = getPayload();
    if (!p || typeof p.runSeed !== 'number') return;
    const variant = pickVariantKey(p.variantKey);
    if (!variant) return;
    const base = getShareBaseUrl();
    if (!base) return;

    const curse = getCurseByKey(p.curseKey ?? null);
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

    // Build postcard blob synchronously — must happen before any async call
    // so it stays inside the browser's user-activation window.
    const canvas = scene.game.canvas as HTMLCanvasElement | undefined;
    const curseDef = curse;
    let postcardFile: File | null = null;
    if (canvas) {
      try {
        const blob = renderPostcardBlob(canvas, buildPostcardPayloadFromGameOver(p, curseDef ? t(curseDef.nameKey) : null));
        if (blob) postcardFile = new File([blob], 'wild-haggis-run.png', { type: 'image/png' });
      } catch { /* non-fatal */ }
    }

    const mode = getWebShareMode(postcardFile);

    if (mode !== 'none') {
      const shareData: ShareData = {
        title: 'Wild Haggis Survivors',
        url,
      };
      if (mode === 'file' && postcardFile) shareData.files = [postcardFile];
      const nav = navigator as Navigator & { share: (data: ShareData) => Promise<void> };
      nav.share(shareData).then(() => {
        markShared();
      }).catch(() => {
        // User dismissed share sheet — allow retry.
      });
      return;
    }

    // Desktop / unsupported: clipboard URL copy.
    if (copyTextToClipboard(url)) markCopied();
  };

  text.on('pointerover', () => { if (!done) text.setColor(palette.hover); });
  text.on('pointerout', () => { if (!done) text.setColor(palette.idle); });
  text.on('pointerdown', doCopy);
}
