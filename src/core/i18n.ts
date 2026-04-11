/**
 * Lightweight i18n — dot-path keys, `{var}` interpolation, missing keys return the key string.
 * Future locales can replace `EN_STRINGS` or merge overrides.
 */

export type LocaleTree = { readonly [k: string]: string | LocaleTree };

export const EN_STRINGS: LocaleTree = {
  ui: {
    common: {
      owned: 'Yours',
      locked: 'Not yet',
      buy_kills: '{cost} culls',
      on: 'ON',
      off: 'OFF',
    },
    menu: {
      title: 'Wild Haggis\nSurvivors',
      kill_credits: 'The glen remembers: {count} lifetime culls',
      hint_suspended: 'Yir last run is still here — pick up the trail, or start fresh with a new loadout.',
      hint_fresh: 'Next: choose the wee beastie and kit for the moor.',
      start_run: 'START RUN',
      resume_run: 'RESUME RUN',
      new_run_loadout: 'NEW RUN (LOADOUT)',
      meta_upgrades: 'LASTING BOONS',
      options: 'OPTIONS',
    },
    loadout: {
      subtitle: 'Drift, scrape through, bank gold, come back bolder. The herd believes in ye.',
      stats_hint: 'Deed-unlocked variants are sidegrades — same heart, new tricks. Golden haggis still fuels the long-game shop.',
      play: 'PLAY',
      upgrades: 'GOLD SHOP',
      current_loadout: 'CURRENT LOADOUT: {name}',
      variant_loadout: 'VARIANT LOADOUT',
      requirement_ready: 'Ye earned this one. Ready when ye are.',
      requirement_progress: '{label}: {current} / {required}',
      requirement_locked: 'Unlock',
      status_current: 'Yir run archetype right now',
      status_switch: 'Switch before the next outing',
      status_locked: 'Waits on an achievement',
      selected: 'SELECTED',
      select: 'SELECT',
      locked: 'LOCKED',
      sfx_toggle: 'SFX: {state}',
      music_toggle: 'Music: {state}',
    },
    shop: {
      title: 'GOLD SHOP',
      gold_bank: '{count} golden haggis tucked away',
      page: 'Page {current} / {total}',
      max: 'MAX',
      cost_gold: '{cost}g',
      back_to_menu: 'BACK TO MENU',
      prev: '< PREV',
      next: 'NEXT >',
    },
    gameOver: {
      victory_title: 'The moor is yours!',
      death_title: 'Hooves down — braw try',
      victory_sub: 'The Highlands breathe easier. Bask a minute; the glen will still be here.',
      death_sub: 'Nae shame in it — every tumble teaches the hooves. Yir progress is saved. When ye\'re ready, we go again.',
      run_variant: 'This run: {label}',
      stat_time: 'Time',
      stat_kills: 'Kills',
      stat_level: 'Level',
      stat_bosses: 'Bosses',
      stat_passives: 'Passives',
      weapons_line: 'Weapons {count} ({evolved} evolved)',
      damage_by_weapon: 'Who carried the fight',
      gold_title: '{amount} golden haggis earned',
      gold_breakdown: 'Time {timeGold}  |  Kills {killGold}  |  Boss {bossGold}  |  Coins {coinGold}',
      play_again: 'PLAY AGAIN',
      upgrades: 'GOLD SHOP',
      menu: 'MENU',
      damage_summary: 'Kills {kills}  ·  Time {time}  ·  Gold +{gold}',
      no_weapon_damage: '(quiet run — nae weapon tally this time)',
      more_weapons: '… +{count} more',
      unlock_single: 'NEW VARIANT — WELCOME TAE THE HERD',
      unlock_multi: 'NEW VARIANTS — THE HERD GROWS',
      next_tip: 'FOR THE NEXT RUN',
    },
    metaShop: {
      title: 'LASTING BOONS',
      subtitle: 'Lifetime culls become tricks that follow ye from run to run.',
      kill_credits: '{count} culls banked for the long road',
      requires: 'Needs: {title}',
      back: 'BACK',
    },
    settings: {
      title: 'OPTIONS',
      subtitle: 'Comfort and sound — kept apart from yir meta save, so experiments stay safe.',
      comfort_hint: 'If text feels wee or the moor washes things out, nudge UI scale or high-contrast mode here.',
      master_volume: 'Master volume',
      sfx_volume: 'SFX volume',
      music_volume: 'Music volume',
      ui_scale: 'UI scale',
      screen_shake: 'Screen shake',
      damage_numbers: 'Damage numbers',
      reduce_particles: 'Reduce particles (perf)',
      high_contrast_ui: 'High-contrast UI',
      on: 'ON',
      off: 'OFF',
      back: 'BACK',
    },
    upgradeCards: {
      level_title: 'Level {level} — grow fiercer',
      choose_upgrade: 'What calls to ye?',
      reroll: 'Fresh picks ({count})',
      chest_evolution_title: 'Treasure evolution',
      chest_evolution_sub: 'The relic inside wakes a legend in yir hands.',
    },
    hud: {
      combo: '{count}× streak{bonus}',
      combo_bonus: ' · +{pct}% wallop',
      level_fmt: 'Lv {level}',
      wave_objective: 'W{wave}  •  {goal}',
      goal_countdown: 'Goal {m}:{s}',
      goal_finale: 'Finale',
      kills_enemies: 'Kills: {kills}  Enemies: {count}{suffix}',
      enemies_capped_suffix: ' MAX!',
      dash_label: 'Dash ',
      dash_ready: 'ready',
      dash_cooldown_pct: '{pct}%',
      dps_line: 'DPS: {dps}',
    },
    pause: {
      title: 'PAUSED',
      resume: 'RESUME',
      quit: 'END RUN',
      time_line: 'Time: {m}:{s}',
      stats_mid: 'Kills: {kills}  |  Level: {level}',
      stats_loadout: 'Weapons: {w}  |  Curios: {c}',
      passives_heading: 'Curios:',
    },
    passive: {
      pause_short: {
        sporran: 'Sporran (+15% Luck)',
        whisky_flask: 'Whisky Flask (+20% AoE)',
        kilt: 'Kilt (+15% Max HP)',
        tam_o_shanter: "Tam o' Shanter (+10% Speed)",
        irn_bru: 'Irn Bru (+20% Atk Spd)',
        loch_water: 'Loch Water (+25% Pickup)',
        thistle_crown: 'Thistle Crown (Crit+Thorns)',
        highland_shield: 'Highland Shield (Death Save)',
        tartan_sash: 'Tartan Sash (+8% Dmg, Claymore Evo)',
      },
    },
    bossWarning: {
      gordon: "The kitchen's marching — Gordon approaches!",
      tour_bus: 'Tour bus on the road — dinnae let it park on yir toes!',
      the_laird: 'The Laird strides oot — mind yir manners and yir hide.',
      hunter_general: 'The Hunter-General — reinforcements at their back.',
      taxman: 'The Taxman cometh — settle yir accounts or run.',
    },
    game: {
      evolution_primed: 'Legend ready: {name} — find a treasure chest!',
      level_banner: 'Level {level}!',
      level_power_surge: 'Level {level} — the moor clears for ye!',
      level_up_fallback: 'Level up!',
      kill_milestone: '{count} culls! +{gold}g',
      boss_kill_heal: 'Boss felled — +{hp} HP',
      achievement_unlock: '★ {title}',
      upgrade_new_weapon: 'New kit: {name}',
      upgrade_weapon_level: '{name} — sharper',
      upgrade_add_passive: '{name} — curio claimed',
      upgrade_stat_boost: '{name}',
      upgrade_evolve_weapon: 'Legend forged: {name}!',
      max_level_toast: 'Max level — yir a walking storm!',
      second_wind: 'Second wind — yir no done yet!',
      treasure_nearby: 'Something shiny on the wind…',
      treasure_collected: 'Chest cracked — hearty heal (+25% HP)',
      golden_nearby: 'Glimmer o\' gold nearby!',
      golden_collected: 'Golden chest — +{gold}g',
      controls_hint: 'WASD to move  •  SPACE to dash  •  ESC to pause',
      armor_blocked: '-{amount} blocked',
      countdown_go: 'SURVIVE!',
      gold_pickup_float: '+{gold}g',
    },
    /** Run-start identity handoff (variant + intent); shown as an early toast in GameScene. */
    run: {
      start_identity: '{name}\n{flavor}',
      resume_identity: 'Trail picked back up — {name}\n{flavor}',
    },
    tips: {
      dash: 'SPACE dashes through bodies and bad luck alike.',
      combo: 'Keep the streak alive — combos sweeten every hit.',
      armor: 'Armor shaves the sting off what gets through.',
      evolve: 'Max a weapon and its paired curio, then crack a chest for something legendary.',
      piper: 'Pipers cheer for the wrong team — silence them early.',
      kite: 'The drift pulls clockwise; let it work for ye, not against ye.',
    },
  },
  metaItem: {
    speed_tier_1: {
      name: 'Sprint Boots',
      description: 'Quicker hooves from the first step (+10% base move speed).',
    },
    health_tier_1: {
      name: 'Thick Pelt',
      description: 'Room for one more mistake (+10% base max HP).',
    },
    pickup_tier_1: {
      name: 'Magnetic Whiskers',
      description: 'Gems lean toward ye (+22 pickup radius).',
    },
    damage_tier_1: {
      name: 'Highland Temper',
      description: 'Hits land heavier (+5% damage).',
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
      name: 'Jobby Cannon',
      description: 'Rapid-fire wee jobbies — every bounce ends in a messy pop.',
    },
    nessie_unleashed: {
      name: 'Nessie Unleashed',
      description: 'Multiple massive tentacles sweep the entire screen.',
    },
    william_blade: {
      name: 'William Blade',
      description: 'Legendary claymore shockwaves tear across the moor in rapid succession.',
    },
  },
  achievement: {
    ach_kills_1000: {
      title: 'Cull of the Glen',
      description: 'A thousand culls — the moor knows yir name.',
    },
    ach_survive_10m: {
      title: 'Heather Marathon',
      description: 'Ten stubborn minutes in one run.',
    },
    ach_defeat_taxman: {
      title: 'Tax-Free Zone',
      description: 'The Taxman picked the wrong glen.',
    },
  },
  tutorial: {
    move: 'WASD or stick to roam — weapons fire themselves. SPACE: a cheeky dash through trouble (and through enemies).',
    gem: 'Gather gems to level. Max a weapon plus its paired curio, then pop a treasure chest for a legendary glow-up.',
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
