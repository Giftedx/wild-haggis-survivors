import * as Phaser from 'phaser';
import { COLORS_CSS } from '../../config';
import { t } from '../../core/i18n';
import { audio } from '../../systems/AudioSystem';
import { textStyle } from '../../ui/typography';
import { type BanterPoolEntryVM, banterDiscoverySummary } from './buildBanterEntries';
import { buildBanterDetail } from './buildBanterDetail';

const ROW_BG_HEARD = 0x1a2236;
const ROW_BG_UNHEARD = 0x0e1524;
const ROW_STROKE_HEARD = 0x355079;
const ROW_STROKE_UNHEARD = 0x1f2c48;
const PANEL_BG = 0x12192b;
const PANEL_STROKE = 0x355079;
const SCRIM_COLOR = 0x000000;

/**
 * Tone pill tints — mirror `TONE_COLORS` from `BanterSystem.ts` so an
 * Almanac row reads with the same warm-green/urgent-coral voice cue as
 * the in-game toast it was authored for.
 */
const TONE_TINT = {
  hearth: 0x7cc06c,
  edge: 0xff8866,
} as const;

/** Max heard lines to render inline before collapsing into a "… N more" chip. */
const HEARD_LINE_DISPLAY_CAP = 8;
/** Max ??? teaser rows inline. Unheard pools can be huge (level_up has
 *  ~44 lines) so the cap keeps the panel readable; overflow collapses
 *  into a "… N more to find" chip the same way heard lines do. */
const UNHEARD_LINE_DISPLAY_CAP = 8;

export interface BanterBookHandle {
  destroy(): void;
}

export interface BanterBookViewport {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface BanterBookOpts {
  readonly expandedKey: string | null;
  readonly onToggle: (key: string) => void;
}

/**
 * C1 M4 — Banter book renderer.
 *
 * Single-column list of pool rows; clicking a row expands a detail
 * overlay with the heard lines the player has collected so far. Each
 * row shows a tone pill (hearth/edge), the pool's label, and a
 * heard-count chip. Mirrors the chrome of Beasties / Weys / Finds so
 * the four-book Almanac stays visually coherent.
 *
 * Task 18 scope: pool list + heard lines on expansion. Unheard teasers
 * (Task 20) and rare-marker + Hear Again (Task 21) land in the same
 * renderer on subsequent commits.
 */
export function renderBanterBook(
  scene: Phaser.Scene,
  viewport: BanterBookViewport,
  entries: readonly BanterPoolEntryVM[],
  uiScale: number,
  opts: BanterBookOpts,
): BanterBookHandle {
  const objects: Phaser.GameObjects.GameObject[] = [];
  const { x: vx, y: vy, width: vw, height: vh } = viewport;

  const summary = banterDiscoverySummary(entries);
  const progress = scene.add
    .text(vx + vw / 2, vy + 12,
      t('ui.almanac.banter_progress', { heard: summary.heardLines, total: summary.totalLines }),
      textStyle('label', { color: COLORS_CSS.WHISKY_GOLD }))
    .setOrigin(0.5, 0)
    .setScale(uiScale);
  objects.push(progress);

  const listTop = vy + 40;
  const listHeight = Math.max(1, vh - 48);
  // Fit every pool into the list — height adapts to pool count.
  const rowCount = Math.max(1, entries.length);
  const rowH = Math.min(38, listHeight / rowCount);
  const rowGap = 4;
  const rowInnerW = vw - 16;

  entries.forEach((entry, i) => {
    const rowY = listTop + rowH / 2 + i * rowH;
    if (rowY + rowH / 2 > vy + vh) return; // clip if oversized viewport packs too many pools

    const row = scene.add
      .rectangle(vx + vw / 2, rowY, rowInnerW, rowH - rowGap,
        entry.heardLines > 0 ? ROW_BG_HEARD : ROW_BG_UNHEARD, 0.9)
      .setStrokeStyle(1,
        entry.heardLines > 0 ? ROW_STROKE_HEARD : ROW_STROKE_UNHEARD, 0.9)
      .setInteractive({ useHandCursor: true });
    row.on('pointerdown', () => {
      audio.playClick();
      opts.onToggle(entry.key);
    });
    objects.push(row);

    // Tone pill — warm-green / coral. Silenced if the pool hasn't been
    // discovered yet (use the idle stroke colour so the page doesn't
    // spoil "this pool carries edgy lines" before the player has heard
    // one).
    const pillX = vx + 18;
    const pill = scene.add.rectangle(
      pillX, rowY, 10, 10,
      entry.heardLines > 0 ? TONE_TINT[entry.tone] : ROW_STROKE_UNHEARD,
      entry.heardLines > 0 ? 0.95 : 0.5,
    );
    objects.push(pill);

    const label = scene.add
      .text(pillX + 16, rowY,
        t(`ui.almanac.banter_pool.${entry.context}.label`),
        textStyle('label', {
          color: entry.heardLines > 0 ? COLORS_CSS.TEXT_PRIMARY : COLORS_CSS.TEXT_DIM,
          wordWrap: { width: Math.max(60, (rowInnerW - 160) / Math.max(1, uiScale)) },
        }))
      .setOrigin(0, 0.5)
      .setScale(uiScale);
    // Resolve i18n fallback inline so the row still reads before
    // authored leaves ship (same pattern as BeastiesBook lore).
    const labelRaw = label.text;
    const labelKey = `ui.almanac.banter_pool.${entry.context}.label`;
    if (labelRaw === labelKey) {
      label.setText(fallbackPoolLabel(entry.context));
    }
    objects.push(label);

    const chip = scene.add
      .text(vx + vw - 26, rowY,
        t('ui.almanac.banter_heard_chip', { heard: entry.heardLines, total: entry.totalLines }),
        textStyle('small', {
          color: entry.heardLines > 0 ? COLORS_CSS.WHISKY_GOLD : COLORS_CSS.TEXT_DIM,
        }))
      .setOrigin(1, 0.5)
      .setScale(uiScale);
    objects.push(chip);
  });

  if (opts.expandedKey !== null) {
    const expanded = entries.find((e) => e.key === opts.expandedKey);
    if (expanded) {
      renderExpandedOverlay(scene, viewport, expanded, uiScale, opts.onToggle, objects);
    }
  }

  return {
    destroy(): void {
      for (const o of objects) o.destroy();
      objects.length = 0;
    },
  };
}

function renderExpandedOverlay(
  scene: Phaser.Scene,
  viewport: BanterBookViewport,
  entry: BanterPoolEntryVM,
  uiScale: number,
  onToggle: (key: string) => void,
  sink: Phaser.GameObjects.GameObject[],
): void {
  const { x: vx, y: vy, width: vw, height: vh } = viewport;
  const detail = buildBanterDetail(entry);

  const scrim = scene.add
    .rectangle(vx + vw / 2, vy + vh / 2, vw, vh, SCRIM_COLOR, 0.72)
    .setInteractive();
  scrim.on('pointerdown', () => {
    audio.playClick();
    onToggle(entry.key);
  });
  sink.push(scrim);

  const panelW = Math.min(520, vw - 32);
  const panelH = Math.min(360, vh - 32);
  const panelCx = vx + vw / 2;
  const panelCy = vy + vh / 2;

  const panel = scene.add
    .rectangle(panelCx, panelCy, panelW, panelH, PANEL_BG, 0.98)
    .setStrokeStyle(1, PANEL_STROKE, 1)
    .setInteractive();
  panel.on('pointerdown', () => undefined);
  sink.push(panel);

  // Tone accent stripe across the top.
  const stripe = scene.add.rectangle(
    panelCx, panelCy - panelH / 2 + 6, panelW - 4, 6,
    TONE_TINT[entry.tone], 0.95,
  );
  sink.push(stripe);

  // Title — pool label, fall back to formatted context.
  const titleRaw = t(detail.titleKey);
  const titleText = titleRaw === detail.titleKey ? detail.titleFallback : titleRaw;
  const title = scene.add
    .text(panelCx, panelCy - panelH / 2 + 24, titleText,
      textStyle('heading', { color: COLORS_CSS.WHISKY_GOLD }))
    .setOrigin(0.5, 0)
    .setScale(uiScale);
  sink.push(title);

  // Progress chip under the title — `X of Y heard`.
  const progressChip = scene.add
    .text(panelCx, panelCy - panelH / 2 + 64,
      t('ui.almanac.banter_heard_chip', { heard: detail.heardLines, total: detail.totalLines }),
      textStyle('small', { color: COLORS_CSS.TEXT_SUBTITLE }))
    .setOrigin(0.5, 0)
    .setScale(uiScale);
  sink.push(progressChip);

  // Hint — one italic line describing when this pool fires.
  const hintRaw = t(detail.hintKey);
  const hintText = hintRaw === detail.hintKey ? detail.hintFallback : hintRaw;
  const hint = scene.add
    .text(panelCx, panelCy - panelH / 2 + 92, hintText, {
      ...textStyle('small', {
        color: COLORS_CSS.TEXT_MUTED,
        align: 'center',
        wordWrap: { width: (panelW - 40) / Math.max(1, uiScale) },
      }),
      fontStyle: 'italic',
    })
    .setOrigin(0.5, 0)
    .setScale(uiScale);
  sink.push(hint);

  // Lines list — heard block first, unheard teasers below. Both
  // paginate to keep big pools readable.
  const listTop = panelCy - panelH / 2 + 128;
  const listMaxY = panelCy + panelH / 2 - 44;
  const lineGap = 18 * uiScale;
  let cursorY = listTop;

  if (detail.heardLines === 0) {
    const empty = scene.add
      .text(panelCx, cursorY,
        t('ui.almanac.banter_none_heard'),
        textStyle('small', { color: COLORS_CSS.TEXT_DIM, align: 'center' }))
      .setOrigin(0.5, 0)
      .setScale(uiScale);
    sink.push(empty);
    cursorY += empty.height * uiScale + 8;
  } else {
    const heardToShow = detail.heard.slice(0, HEARD_LINE_DISPLAY_CAP);
    for (const line of heardToShow) {
      if (cursorY + lineGap > listMaxY) break;
      const raw = t(line.key);
      const text = raw === line.key ? line.key : raw;
      const heardRow = scene.add
        .text(panelCx, cursorY, `• ${text}`, {
          ...textStyle('small', {
            color: COLORS_CSS.TEXT_PRIMARY,
            align: 'center',
            wordWrap: { width: (panelW - 48) / Math.max(1, uiScale) },
          }),
        })
        .setOrigin(0.5, 0)
        .setScale(uiScale);
      sink.push(heardRow);
      cursorY += heardRow.height * uiScale + 4;
    }
    if (detail.heard.length > HEARD_LINE_DISPLAY_CAP) {
      const overflow = detail.heard.length - HEARD_LINE_DISPLAY_CAP;
      const more = scene.add
        .text(panelCx, cursorY,
          t('ui.almanac.banter_more_heard', { count: overflow }),
          textStyle('small', { color: COLORS_CSS.TEXT_SUBTITLE, align: 'center' }))
        .setOrigin(0.5, 0)
        .setScale(uiScale);
      sink.push(more);
      cursorY += more.height * uiScale + 4;
    }
  }

  // Unheard teaser rows — ??? per line so the player sees how many
  // lines are still waiting to be heard, paginated.
  if (detail.unheard.length > 0 && cursorY + lineGap <= listMaxY) {
    cursorY += 4;
    const unheardToShow = detail.unheard.slice(0, UNHEARD_LINE_DISPLAY_CAP);
    for (const line of unheardToShow) {
      if (cursorY + lineGap > listMaxY) break;
      const teaser = scene.add
        .text(panelCx, cursorY, `· ${line.teaserText}`,
          textStyle('small', { color: COLORS_CSS.TEXT_DIM, align: 'center' }))
        .setOrigin(0.5, 0)
        .setScale(uiScale);
      sink.push(teaser);
      cursorY += teaser.height * uiScale + 2;
    }
    if (detail.unheard.length > UNHEARD_LINE_DISPLAY_CAP && cursorY + lineGap <= listMaxY) {
      const overflow = detail.unheard.length - UNHEARD_LINE_DISPLAY_CAP;
      const more = scene.add
        .text(panelCx, cursorY,
          t('ui.almanac.banter_more_unheard', { count: overflow }),
          textStyle('small', { color: COLORS_CSS.TEXT_DIM, align: 'center' }))
        .setOrigin(0.5, 0)
        .setScale(uiScale);
      sink.push(more);
    }
  }

  // Close button.
  const closeBtn = scene.add
    .text(panelCx + panelW / 2 - 10, panelCy - panelH / 2 + 10, '×',
      textStyle('heading', { color: COLORS_CSS.TEXT_MUTED }))
    .setOrigin(1, 0)
    .setScale(uiScale)
    .setInteractive({ useHandCursor: true });
  closeBtn.on('pointerdown', () => {
    audio.playClick();
    onToggle(entry.key);
  });
  sink.push(closeBtn);
}

/**
 * Human-readable fallback for `ui.almanac.banter_pool.<context>.label`
 * so the row still reads before translator copy ships. Authoring
 * overlay i18n wins at render time; this only fires for unlabelled
 * contexts.
 */
function fallbackPoolLabel(context: string): string {
  return context
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
