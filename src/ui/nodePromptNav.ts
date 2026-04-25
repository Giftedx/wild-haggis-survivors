import {
  firstEnabledModalFocusIndex,
  moveModalFocusIndex,
  type ModalFocusEntry,
} from './modalFocus';

export type NodePromptNavEntry = ModalFocusEntry;

export const firstEnabledPromptEntryIndex = firstEnabledModalFocusIndex;
export const movePromptFocusIndex = moveModalFocusIndex;
