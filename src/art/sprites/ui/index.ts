/**
 * UI ornament sprites — card-rarity frames, banter-bubble corners and
 * the toast parchment background. Restrained, Hearth-anchored chrome
 * that should feel like a pub bulletin board, never a slick AAA HUD.
 */

import * as Phaser from 'phaser';

import {
  bakeCardFrameCommon,
  bakeCardFrameUncommon,
  bakeCardFrameRare,
  bakeCardFrameLegendary,
  bakeBanterCornerHearth,
  bakeBanterCornerEdge,
  bakeBanterCornerFey,
  bakeToastFrame,
} from './cardFrames';

export function bakeUi(scene: Phaser.Scene): void {
  bakeCardFrameCommon(scene);
  bakeCardFrameUncommon(scene);
  bakeCardFrameRare(scene);
  bakeCardFrameLegendary(scene);
  bakeBanterCornerHearth(scene);
  bakeBanterCornerEdge(scene);
  bakeBanterCornerFey(scene);
  bakeToastFrame(scene);
}
