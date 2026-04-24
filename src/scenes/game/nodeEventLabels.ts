/**
 * Plain-English labels for Moor Road node event keys.
 *
 * v1 stopgap so the NodePromptUI has something to show while M5 wires
 * the full i18n + SCS parity. Once M5 lands, the scene will resolve
 * `t('nodes.boon.buff_damage.label')` instead of calling these.
 */

export function shrineLabelFromKey(key: string): string {
  switch (key) {
    case 'buff_damage':
      return 'Sharpen your teeth';
    case 'buff_speed':
      return 'Quicken your trot';
    case 'buff_luck':
      return 'A turn of fortune';
    case 'buff_armor':
      return 'Harden your hide';
    case 'buff_regen':
      return 'Slow mending';
    case 'buff_pickup':
      return 'Wider gather';
    case 'buff_crit':
      return 'A lucky tusk';
    case 'buff_reflect':
      return 'The moor bites back';
    case 'buff_dodge':
      return 'A side-step ready';
    case 'buff_xp':
      return 'Quick wisdom';
    case 'buff_gold':
      return 'A handful of coin';
    default:
      return key;
  }
}

export function bargainLabelFromOfferKey(key: string): string {
  switch (key) {
    case 'rare_relic':
      return 'a rare relic';
    case 'buff_damage_run':
      return 'less damage taken';
    case 'buff_cooldown_run':
      return 'faster weapons';
    case 'buff_speed_run':
      return 'a swifter foot';
    case 'weapon_upgrade_token':
      return 'a token of sharpening';
    default:
      return key;
  }
}
