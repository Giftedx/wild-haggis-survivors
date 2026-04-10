/**
 * Lightweight i18n — dot-path keys, `{var}` interpolation, missing keys return the key string.
 * Future locales can replace `EN_STRINGS` or merge overrides.
 */

export type LocaleTree = { readonly [k: string]: string | LocaleTree };

export const EN_STRINGS: LocaleTree = {
  ui: {
    menu: {
      title: 'Wild Haggis Survivors',
      kill_credits: 'Kill credits: {count}',
      hint_suspended: 'Suspended run on disk — resume or start a new loadout.',
      hint_fresh: 'Choose your loadout on the next screen.',
      start_run: 'START RUN',
      resume_run: 'RESUME RUN',
      new_run_loadout: 'NEW RUN (LOADOUT)',
      meta_upgrades: 'META UPGRADES',
      options: 'OPTIONS',
    },
    gameOver: {
      victory_title: 'VICTORY!',
      death_title: 'YOU DIED',
      victory_sub: 'The Highlands are safe... for now.',
      death_sub: 'The glen took its due. Bank the run and go again.',
      run_variant: 'Run Variant: {label}',
      stat_time: 'Time',
      stat_kills: 'Kills',
      stat_level: 'Level',
      stat_bosses: 'Bosses',
      stat_passives: 'Passives',
      weapons_line: 'Weapons {count} ({evolved} evolved)',
      damage_by_weapon: 'DAMAGE BY WEAPON',
      gold_title: '+{amount} Gold',
      gold_breakdown: 'Time {timeGold}  |  Kills {killGold}  |  Boss {bossGold}  |  Coins {coinGold}',
      play_again: 'PLAY AGAIN',
      upgrades: 'UPGRADES',
      menu: 'MENU',
      damage_summary: 'Kills {kills}  ·  Time {time}  ·  Gold +{gold}',
      no_weapon_damage: '(no weapon damage recorded)',
      more_weapons: '… +{count} more',
      unlock_single: 'NEW VARIANT UNLOCKED',
      unlock_multi: 'NEW VARIANTS UNLOCKED',
      next_tip: 'NEXT RUN TIP',
      meta_buy: '{cost} kills',
      owned: 'OWNED',
      locked: 'LOCKED',
    },
    metaShop: {
      title: 'META UPGRADES',
      subtitle: 'Spend lifetime kills on permanent run bonuses.',
      kill_credits: 'Kill credits: {count}',
      requires: 'Requires: {title}',
      back: 'BACK',
    },
    settings: {
      title: 'OPTIONS',
      subtitle: 'Stored separately from meta progression / run saves.',
      master_volume: 'Master volume',
      sfx_volume: 'SFX volume',
      music_volume: 'Music volume',
      screen_shake: 'Screen shake',
      damage_numbers: 'Damage numbers',
      reduce_particles: 'Reduce particles (perf)',
      on: 'ON',
      off: 'OFF',
      back: 'BACK',
    },
    tips: {
      dash: 'Tip: Press SPACE to dash through enemies.',
      combo: 'Tip: Combos boost your damage when you keep killing.',
      armor: 'Tip: Armor reduces all incoming damage.',
      evolve: 'Tip: Max a weapon plus its passive, then open a treasure chest to evolve it.',
      piper: 'Tip: Pipers buff nearby enemies. Kill them first.',
      kite: 'Tip: Clockwise kiting works with the drift.',
    },
  },
  metaItem: {
    speed_tier_1: {
      name: 'Sprint Boots',
      description: '+10% base move speed for new runs.',
    },
    health_tier_1: {
      name: 'Thick Pelt',
      description: '+10% base max HP for new runs.',
    },
    pickup_tier_1: {
      name: 'Magnetic Whiskers',
      description: '+22 pickup radius on new runs.',
    },
    damage_tier_1: {
      name: 'Highland Temper',
      description: '+5% damage on new runs.',
    },
  },
  evolution: {
    thistle_storm: {
      name: 'Thistle Storm',
      description: '8 homing thistles seek enemies across the screen.',
    },
    highland_fling: {
      name: 'The Highland Fling',
      description: 'Massive pulsating sonic ring shatters all enemies.',
    },
    highland_games: {
      name: 'Highland Games',
      description: 'Caber explodes on final pierce, leaving a burning zone.',
    },
    the_haar: {
      name: 'The Haar',
      description: 'Dense fog covers 40% of the screen, melting enemies.',
    },
    haggis_cannon: {
      name: 'Haggis Cannon',
      description: 'Rapid-fire haggis that explode on each bounce.',
    },
    nessie_unleashed: {
      name: 'Nessie Unleashed',
      description: 'Multiple massive tentacles sweep the entire screen.',
    },
  },
  achievement: {
    ach_kills_1000: {
      title: 'Cull of the Glen',
      description: 'Reach 1,000 lifetime kills (meta).',
    },
    ach_survive_10m: {
      title: 'Heather Marathon',
      description: 'Survive 10 minutes in a single run.',
    },
    ach_defeat_taxman: {
      title: 'Tax-Free Zone',
      description: 'Defeat the Taxman.',
    },
  },
  tutorial: {
    move: 'Use WASD or Left Stick to move. Weapons auto-fire.',
    gem: 'Collect gems to level up.',
  },
};

function getLeaf(tree: LocaleTree, key: string): string | undefined {
  const parts = key.split('.');
  let cur: unknown = tree;
  for (const p of parts) {
    if (cur === null || typeof cur !== 'object' || !(p in (cur as object))) {
      return undefined;
    }
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === 'string' ? cur : undefined;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  let s = template;
  for (const [k, v] of Object.entries(vars)) {
    s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}

/**
 * Resolve a dot-path key against the active dictionary. Missing paths return `key` unchanged.
 * Interpolation: `t('ui.gameOver.gold_title', { amount: 12 })` with string containing `{amount}`.
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  const raw = getLeaf(EN_STRINGS as unknown as LocaleTree, key);
  if (raw === undefined) return key;
  return interpolate(raw, vars);
}

export const i18n = { t };
