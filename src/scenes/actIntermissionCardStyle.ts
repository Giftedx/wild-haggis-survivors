/**
 * Pure style resolver for the ActIntermissionScene route cards.
 *
 * Each of the 3 route cards has a 2-state warm-gold border: idle is
 * the thinner, dimmer gold you see until the player hovers, hover
 * jumps to a brighter gold with one more pixel of stroke thickness
 * so the focused card reads clearly even with the backdrop
 * darkening the scene. Pulling the styling out of the scene
 * prevents drift between POINTER_OVER / POINTER_OUT handlers and
 * the card's initial render.
 */

export interface ActIntermissionCardBorderState {
  color: number;
  thickness: number;
}

export interface ActIntermissionCardStyle {
  idle: ActIntermissionCardBorderState;
  hover: ActIntermissionCardBorderState;
}

export const ACT_INTERMISSION_CARD_IDLE_COLOR = 0xd4a017;
export const ACT_INTERMISSION_CARD_HOVER_COLOR = 0xffe08a;

export function resolveActIntermissionCardStyle(): ActIntermissionCardStyle {
  return {
    idle: {
      color: ACT_INTERMISSION_CARD_IDLE_COLOR,
      thickness: 2,
    },
    hover: {
      color: ACT_INTERMISSION_CARD_HOVER_COLOR,
      thickness: 3,
    },
  };
}
