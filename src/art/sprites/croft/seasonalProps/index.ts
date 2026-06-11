import * as Phaser from 'phaser';
import type { CroftLayout } from '../../../../scenes/croft/CroftComposition';
import { drawBurnsNightProps } from './burnsNight';
import { drawBrackenTurnProps } from './brackenTurn';
import { drawLammasProps } from './lammas';
import { drawImbolcProps } from './imbolc';
import { drawHogmanayProps } from './hogmanay';
import { drawSamhainProps } from './samhain';
import { drawBeltaneProps } from './beltane';
import { drawStAndrewsProps } from './stAndrews';

/**
 * H1 M3 T21 — Seasonal croft props dispatcher. Routes to per-event
 * drawers based on the active seasonal event key. No-op for unknown
 * keys so future events merge cleanly.
 */
export function drawSeasonalProps(
  g: Phaser.GameObjects.Graphics,
  eventKey: string | null,
  layout: CroftLayout,
): void {
  if (!eventKey) return;
  switch (eventKey) {
    case 'burns_night':
      drawBurnsNightProps(g, layout);
      return;
    case 'bracken_turn':
      drawBrackenTurnProps(g, layout);
      return;
    case 'lammas':
      drawLammasProps(g, layout);
      return;
    case 'imbolc':
      drawImbolcProps(g, layout);
      return;
    case 'hogmanay':
      drawHogmanayProps(g, layout);
      return;
    case 'samhain':
      drawSamhainProps(g, layout);
      return;
    case 'beltane':
      drawBeltaneProps(g, layout);
      return;
    case 'st_andrews':
      drawStAndrewsProps(g, layout);
      return;
    default:
      return;
  }
}
