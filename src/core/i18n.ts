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
      rarity: {
        common: 'COMMON',
        uncommon: 'UNCOMMON',
        rare: 'RARE',
        legendary: 'LEGENDARY',
      },
    },
    menu: {
      title: 'Wild Haggis\nSurvivors',
      kill_credits: 'The glen remembers: {count} lifetime culls',
      /** Shown instead of kill_credits when totalKills === 0 — warmer first-run greeting. */
      kill_credits_fresh: 'The glen stirs — yir first run awaits.',
      hint_suspended: 'Yir last run is still here — pick up the trail, or start fresh with a new loadout.',
      hint_fresh: 'Next: choose the wee beastie and kit for the moor.',
      /** Shown only on the very first visit — surfaces the Comfort panel
       *  so players discover motion / caption / text-scale controls up
       *  front, not after they've been flashed at for half a run. */
      hint_fresh_with_comfort: 'Next: pick a wee beastie and kit.  (Need calmer motion or bigger text? Options → Comfort.)',
      start_run: 'START RUN',
      resume_run: 'RESUME RUN',
      new_run_loadout: 'NEW RUN (LOADOUT)',
      meta_upgrades: 'LASTING BOONS',
      options: 'OPTIONS',
      /** Quiet motto on the bottom credit strip — same voice as Soul Charter. */
      built_on_moor: 'built on the moor',
      stats_short: 'Best {bestTime}  |  Kills {bestKills}  |  Combo {bestCombo}x  |  Runs {totalRuns}  |  Wins {victories}  |  Gold {gold}',
      stats_long: 'Best {bestTime}  |  Kills {bestKills}  |  Combo {bestCombo}x\nRuns {totalRuns}  |  Wins {victories}  |  Gold {gold}',
      history_summary: '{totalRuns} runs  |  {winRate}% won  |  Avg {avgTime}  |  {trend}',
      trend_improving: 'pure flying',
      trend_steady: 'haudin yir ain',
      trend_declining: 'the moor\'s no\' impressed',
      trend_new: 'first hoofprints on the moor',
      // ── Daily Challenge + seeded runs ──
      daily_challenge: 'DAILY CHALLENGE',
      /** Subtitle when the player hasn't attempted today's daily. */
      daily_fresh: 'Today: {code}  ·  No attempt yet',
      /** Subtitle after a victory on today's daily. */
      daily_cleared: 'Today: {code}  ·  Cleared ✓',
      /** Subtitle mid-run-cycle — tried but not yet completed. */
      daily_attempts: 'Today: {code}  ·  {attempts} attempt(s)',
      enter_seed: 'Enter custom seed...',
      rerun_last: '⟲ Rerun last run',
      seed_prompt: 'Enter a 7-character seed code (or a number):',
      seed_invalid: 'That seed didn\'t take — check it and try again.',
      chronicle: 'THE HERD CHRONICLE',
      deeds: 'YIR DEEDS',
      curse: 'CURSE O\' THE MOOR',
    },
    curseScene: {
      title: 'CURSE O\' THE MOOR',
      /** Subtitle — sets the tone: this is a trade, deliberately taken. Hearth. */
      subtitle: 'The moor\'ll dig in its teeth for a heavier purse. Pick yir poison — or none at all.',
      /** Default "no curse" tile — always an option. Hearth. */
      none_title: 'A CLEAN RUN',
      none_desc: 'Nae curse. Just you an\' the moor. Usual gold.',
      /** Chip on each curse tile showing the gold reward. */
      gold_chip: '+{pct}% gold',
      /** Button on each tile. */
      pick: 'TAKE IT ON',
      /** Button on the "no curse" tile. */
      pick_none: 'START CLEAN',
      back: 'BACK',
      /** Corner ribbon — shown on tiles whose curse the player has bested at least once. */
      bested_badge: '✓ BESTED',
    },
    chronicle: {
      // ── Header (Hearth voice default, Edge voice for failure/victory moods) ──
      title: 'THE HERD CHRONICLE',
      /** Subtitle when there's nothing to show — a fresh save. Hearth. */
      sub_empty: 'The page is blank. The moor is waitin — make a mark.',
      /** Exactly one entry. Hearth. */
      sub_first_run: 'First run logged. The ink\'s still wet.',
      /** 2+ trailing victories — Edge voice, deadpan pride. */
      sub_victory_streak: 'On a roll. Every last wan o\' them.',
      /** Last run was a win (no streak yet) — Edge. */
      sub_fresh_victory: 'That\'s yir lot, eh? Braw.',
      /** 3+ losses in a row — Hearth compassion, no shaming. */
      sub_loss_streak: 'Rough stretch. The herd still believes in ye.',
      /** Recent avg trending up. Hearth. */
      sub_improving: 'Pure flying lately. Keep the heid.',
      /** Recent avg trending down. Hearth, gentle. */
      sub_declining: 'Wee dip — the moor\'s no\' impressed, but it\'s no\' done wi\' ye.',
      /** Default. Hearth. */
      sub_steady: 'Haudin yir ain. The glen remembers every hoofprint.',

      // ── Lifetime panel ──
      lifetime_heading: 'LIFETIME ON THE MOOR',
      stat_runs: 'Runs',
      stat_victories: 'Wins',
      stat_win_rate: 'Win Rate',
      stat_total_culls: 'Total culls',
      stat_total_gold: 'Gold banked',
      stat_time_on_moor: 'Time on the moor',
      stat_best_time: 'Longest run',
      stat_best_kills: 'Most culls',
      stat_best_combo: 'Best combo',

      // ── Milestones panel ──
      milestones_heading: 'MILESTONES',
      milestone_first_victory: 'First win: {time} survived, {kills} culls',
      milestone_first_victory_none: 'First win — still oot there, waitin on ye.',
      milestone_longest: 'Longest run — {time} ({variant})',
      milestone_most_kills: 'Most culls in a run — {kills} ({variant})',
      milestone_highest_combo: 'Best combo — {combo}x',
      milestone_favorite_variant: 'Favourite wee beastie — {variant} ({count} runs)',
      milestone_favorite_weapon: 'Weapon of choice — {weapon} ({count} runs)',
      milestone_win_streak: 'On a {count}-run winning streak ✓',
      milestone_loss_streak: '{count} tough runs back-to-back — moor\'s nae kindness today, but ye\'re still here.',
      past_the_bell_line: '🔔 Past the bell — best {time}',
      hearth_beats_line: '🌾 Hearth beats: {count}',
      curses_line: '☠ Curses bested: {bested} / {total} ({victories} wins, {runs} attempts)',
      stones_walked_line: '⟁ Stones walked: {total} (mending {mending} · fire {fire} · haste {haste})',
      stones_walked_line_with_fav: '{base} · favourite {favourite}',
      echoes_touched_line: '⟡ Echoes touched: {count}',
      ironmoor_line: '⚔ Ironmoor — {victories}/{attempts} wins ({pct}%) · longest {longest}',
      ironmoor_line_with_fastest: '{base} · fastest win {fastest}',

      // ── Cull codex (meta SaveManager — first kill per enemy key) ──
      codex_heading: 'CULL CODEX',
      codex_progress: '{discovered} / {total} beasties logged',
      codex_empty: 'Nae names in the book yet — the moor\'s still holdin secrets.',

      // ── Run list ──
      runs_heading: 'RECENT RUNS',
      runs_empty: 'Nothin logged yet. Go bag the first tale.',
      runs_cap_note: 'The last {max} runs are kept. Older tales fade intae the mist.',
      run_row_victory: '✦ {time} · {kills} culls · L{level} · {variant}',
      run_row_defeat: '{time} · {kills} culls · L{level} · {variant}',
      run_daily_tag: '[DAILY]',
      /** Badge rendered on a run row where the player bore a curse. */
      run_curse_chip: '⚖ {curse}',
      /** Hover tooltip on the rerun-this-seed button. */
      rerun_tooltip: 'rerun {seed}',
      /** Same tooltip when the rerun will carry a curse forward. */
      rerun_tooltip_with_curse: 'rerun {seed} ☠ {curse}',

      // W2 Moor Road log — appended to run rows that hit a picker.
      moorRoad: {
        title: 'Moor Road log',
        empty: 'Ye\'ve no picked a road yet. Head out, choose wisely.',
      },

      // ── Actions ──
      back: 'BACK',
      prev: '< PREV',
      next: 'NEXT >',
    },
    deeds: {
      title: 'YIR DEEDS',
      /** Subtitle shown when 0 deeds earned — Hearth warmth, no pressure. */
      sub_empty: 'Nae deeds stamped yet. That\'s fine — the moor keeps count.',
      /** Subtitle shown when some but not all earned — Hearth. */
      sub_partial: '{earned} of {total} pinned tae the board. Go bag the rest.',
      /** All 9 earned — Edge voice, dry pride. */
      sub_complete: 'Every last wan o\' them. The full board. Pure legend.',
      /** Header chip showing tally. */
      counter: '{earned} / {total} done',
      /** Label under a locked/binary deed whose trigger we won\'t spoil. */
      locked_mystery: 'A rumour on the moor. Find it yirself.',
      /** Status tags. */
      status_locked: 'NOT YET',
      status_in_progress: 'ON THE WAY',
      status_unlocked: 'DONE',
      back: 'BACK',
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
      /** Lifetime tally chip on unlocked variant cards — silent at 0 runs. */
      variant_tally: '✦ {wins} won · {runs} runs',
      status_current: 'Yir run archetype right now',
      status_switch: 'Switch before ye head oot',
      status_locked: 'Locked — earn it',
      selected: 'SELECTED',
      select: 'SELECT',
      locked: 'LOCKED',
      sfx_toggle: 'SFX: {state}',
      music_toggle: 'Music: {state}',
    },
    shop: {
      title: 'GOLD SHOP',
      gold_bank: '{count} golden haggis tucked away',
      /** Shown instead of gold_bank when count === 0 — warmer first-run copy. */
      gold_bank_fresh: 'Skint, for now — the moor pays those who come back.',
      page: 'Page {current} / {total}',
      max: 'MAX',
      cost_gold: '{cost}g',
      back_to_menu: 'BACK TO MENU',
      prev: '< PREV',
      next: 'NEXT >',
    },
    gameOver: {
      victory_title: 'The moor is yours!',
      /** Post-Bell opt-in prompt, flashed during the victory ceremony. */
      keep_going_offer: 'Keep goin\'? Hit ENTER afore the bell rings.',
      /** Confirmation toast once the player has committed to Post-Bell. */
      post_bell_start: 'Post-Bell — the moor\'s no\' done with ye yet.',
      /** Send-off toast when the player finally falls in Post-Bell. */
      post_bell_sendoff: 'Ye went further than any haggis before ye.',
      death_title: 'Hooves down — braw try',
      /** Rotating death titles — picked randomly so each death feels different. */
      death_title_2: 'Aw naw — doon ye go',
      death_title_3: 'That\'s yir lot, pal',
      death_title_4: 'Hooves up — no\' this time',
      victory_sub: 'The Highlands breathe easier. Bask a minute; the glen will still be here.',
      death_sub: 'Nae shame in it — every tumble teaches the hooves. Yir progress is saved. When ye\'re ready, we go again.',
      /** Rotating death subtitles — each one a different tone of Glesga compassion. */
      death_sub_2: 'Ach, ye were doin\' well there. The moor\'ll wait for ye — it always does.',
      death_sub_3: 'If ye fall oot that tree and break yer legs, dinnae come runnin\' tae me. …Kiddin\'. Come back any time.',
      death_sub_4: 'I don\'t mean to speak ill of the dead but — ye were brilliant, so ye were. Go again.',
      run_variant: 'This run: {label}',
      stat_time: 'Time',
      stat_kills: 'Culls',
      stat_level: 'Level',
      stat_bosses: 'Bosses Floored',
      stat_passives: 'Curios',
      stat_combo: 'Best Streak',
      weapons_line: '{count} weapons ({evolved} went legendary)',
      weapons_line_one: '1 weapon ({evolved} went legendary)',
      damage_by_weapon: 'Who put the boot in',
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
      new_best: 'YA DANCER!',
      // ── Seed share / daily readout ──
      seed_normal: 'Seed: {code}',
      seed_daily: 'Daily seed: {code}',
      seed_copy_hint: 'tap to copy',
      seed_copied: 'Copied: {code}',
      // W27 Capture & Share — small link beside the seed readout.
      postcard_hint: 'save postcard',
      postcard_saved: 'postcard saved',
      /** Restart the current run with its exact seed — one-more-try retry. */
      rerun_same_seed: '↻ same seed',
      /** Same link when a curse is active — flag that the rerun re-applies it. */
      rerun_same_seed_with_curse: '↻ same seed ☠ {curse}',
      /** W66 Ironmoor victory banner — pride posture. */
      ironmoor_victory_banner: '⚔ IRONMOOR VICTORY — ONE LIFE, AYE',
      /** W66 Ironmoor death banner — compassionate register. */
      ironmoor_death_banner: '⚔ Ironmoor run — walked it proud.',
      /** W66 Ironmoor chronicle wipe — shown once on ironmoor death when prior ironmoor rows get cleared. Best-times survive elsewhere. */
      ironmoor_wipe_toast: '⚔ Chronicle wiped — one life, nae pity',

      // ── "Whit got ye" death reflection panel ──
      // Voice-driven, compassionate. Headlines describe WHAT happened; tips
      // give ONE concrete takeaway. Hearth register by default; Edge voice
      // only where it earns it (boss respect, deadpan acknowledgment).
      whit_heading: 'WHIT GOT YE',

      // Headlines — present tense, warm. `{source}` interpolated with the
      // resolved enemy name where available.
      whit_headline_hazard: 'The moor itself burned ye — watch the ground, pal.',
      whit_headline_boss_crushed: 'The {source} caught ye squarely. That\'s yir lot.',
      whit_headline_elite_kill: 'A golden {source} — hit harder than it looked.',
      whit_headline_one_shot: 'A {source} hit that should not\'ve landed. Heavy swing, nae warning.',
      whit_headline_same_killer: 'A {source} stuck tae ye — kept chippin away.',
      whit_headline_swarmed: 'Swarmed — three kinds at once and nae room tae breathe.',
      whit_headline_low_hp_neglect: 'Ye were hurt for a while, pal. The moor noticed.',
      whit_headline_unlucky: 'Just one o\' they runs. The moor\'s fickle.',

      // Tips — one actionable line each. Same voice register.
      whit_tip_hazard: 'Next time, dash clear o\' the glowin ground. It disnae forgive.',
      whit_tip_boss_crushed: 'Kite the big yins. Save yir dash for their wind-ups.',
      whit_tip_elite_kill: 'Gold glow means trouble — burn it down first, the rest can wait.',
      whit_tip_one_shot: 'Big hits want space. Keep yir distance when ye see a heavy frame.',
      whit_tip_same_killer: 'When somethin sticks, break the rhythm — dash sideways, no\' back.',
      whit_tip_swarmed: 'Keep movin. Corners kill ye faster than any single beastie.',
      whit_tip_low_hp_neglect: 'Find a quiet corner when yir low. A healin chest can turn a run.',
      whit_tip_unlucky: 'Shake it aff. The next run\'s already waitin.',

      // ── Curse chip (end-of-run) — shown regardless of win/lose ──
      /** Small chip showing the curse the player bore this run + its gold bonus. */
      curse_chip: 'Bore the {curse} — +{pct}% gold',
    },
    metaShop: {
      title: 'LASTING BOONS',
      subtitle: 'Lifetime culls become tricks that follow ye from run to run.',
      kill_credits: '{count} culls banked for the long road',
      /** Shown instead of kill_credits when count === 0. */
      kill_credits_fresh: 'The long road starts here — nae culls banked yet.',
      requires: 'Needs: {title}',
      requires_achievement: 'Needs: {title} ({hint})',
      requires_previous: 'Requires: {name} first',
      back: 'BACK',
    },
    settings: {
      title: 'OPTIONS',
      subtitle: 'Comfort and sound — kept apart from yir meta save, so experiments stay safe.',
      comfort_hint: 'If text feels wee or the moor washes things oot, nudge UI scale or high-contrast mode here.',
      // Section headings group the 8 rows into three tidy bands so players can
      // scan straight to the setting they want instead of reading the whole list.
      section_sound: 'Hearth sound',
      section_comfort: 'Comfort & motion',
      section_access: 'Accessibility',
      master_volume: 'Master volume',
      sfx_volume: 'SFX volume',
      music_volume: 'Music volume',
      ui_scale: 'UI scale',
      /** Graduated motion intensity — on top of the binary screen-shake
       *  toggle, this scales flash alpha, slow-mo duration, and particle
       *  counts. At 0 the beat still lands but the intensity is tamed. */
      motion_scale: 'Motion intensity',
      screen_shake: 'Screen shake',
      damage_numbers: 'Damage numbers',
      reduce_particles: 'Reduce particles (perf)',
      /** Run telemetry — end-of-run only, no PII; copy must stay anonymous-forward. */
      telemetry_opt_in: 'Share anonymous run-end stats (opt in)',
      high_contrast_ui: 'High-contrast UI',
      /** On-screen captions for critical audio cues (boss warnings,
       *  low HP, evolution ready, combo milestones, death, victory). */
      captions: 'Captions',
      /** Banter frequency row — ambient Glesga commentary volume. */
      banter_frequency: 'Banter',
      banter_off: 'Wheesht',
      banter_sparing: 'Sparing',
      banter_normal: 'Natural',
      banter_chatty: 'Gabby',
      on: 'ON',
      off: 'OFF',
      back: 'BACK',
      /** W2 Moor Road: auto-pick the safest route at act breaks instead of showing the picker. */
      skipActIntermissions: 'Skip road-forks (auto-pick safest route)',
      /** W66 Ironmoor: single-life mode — no Second-Wind revive. Pride posture, opt-in. */
      ironmoorMode: 'Ironmoor (single life — nae second wind)',
      /** W18 language cycle row. Scots overlay falls back to en silently. */
      language: 'Language',
      locale_en: 'English (Glesga)',
      locale_scs: 'Scots',
      /** W66 Ironmoor opt-in ceremony — shown when player flips the toggle OFF→ON. */
      ironmoor_confirm_title: 'Ye sure, big yin?',
      ironmoor_confirm_body: 'Ironmoor is ONE LIFE. Nae Second Wind, nae revives. Die once — ye walk tae the menu. The wee ⚔ badge marks yer Chronicle row for ever. Switch it aff any time before ye start.',
      ironmoor_confirm_yes: 'Aye, I\'m ready',
      ironmoor_confirm_no: 'Naw, cancel',
    },
    /** W2 Moor Road — the between-act modal. */
    actIntermission: {
      title_act_1: 'Awright, which way then?',
      title_act_2: 'Last stretch — pick yer poison.',
      pick_hint: 'Click or press 1/2/3 tae commit, big yin.',
    },
    /** Ancestral Echo — spectral haggis at last-death spot, touch for reward. */
    ancestralEcho: {
      announce_toast: '⟡ An echo lingers where ye fell.',
      announce_caption: 'A pale haggis walks where ye last fell — walk tae it for a wee blessing.',
      touch_toast: '⟡ The moor remembers — a wee blessing.',
      touch_caption: 'Spectral blessing received — gold banked and wounds eased.',
    },
    /** Standing Stones — mid-run trinity at the 5:00 mark. */
    standingStones: {
      announce_toast: 'Three stones stir — pick yer blessing.',
      announce_caption: 'Three standing stones have risen — walk tae one tae claim it.',
      warn_toast: 'The moor rumbles — stones are waking.',
      warn_caption: 'Somethin\' is stirrin\' underfoot — stones rise in fifteen seconds.',
      grant_toast: '{title} — the stone\'s blessing holds.',
      mending: {
        title: 'Stone o\' Mending',
        desc: 'The stone breathes warmth — HP mends itsel\' slow and sure.',
      },
      fire: {
        title: 'Stone o\' Fire',
        desc: 'A rune flares — strikes find the soft spots mair often.',
      },
      haste: {
        title: 'Stone o\' Haste',
        desc: 'The air quickens — weapons fire a shade faster.',
      },
    },
    upgradeCards: {
      level_title: 'Level {level} — pick yir poison',
      choose_upgrade: 'What calls to ye?',
      reroll: 'Fresh picks ({count})',
      chest_evolution_title: 'SOMETHIN\' LEGENDARY',
      chest_evolution_sub: 'The chest cracked open and the moor felt it. Pick up what\'s inside.',
    },
    hud: {
      combo: '{count}× streak{bonus}',
      combo_bonus: ' · +{pct}% wallop',
      level_fmt: 'Lv {level}',
      wave_objective: 'Wave {wave}  •  {goal}',
      goal_countdown: 'Goal {time}',
      goal_finale: 'Finale',
      /** W2 Moor Road chip — shown under the curse chip once the player has cleared an act. */
      act_chip: '— Act {act} —',
      /** W66 Ironmoor chip — shown when single-life mode is on. */
      ironmoor_chip: '⚔ IRONMOOR',
      kills_enemies: 'Kills: {kills}  Enemies: {count}{suffix}',
      enemies_capped_suffix: ' MAX!',
      dash_label: 'Dash ',
      dash_ready: 'ready',
      dash_cooldown_pct: '{pct}%',
      /** Rolling 1s window — same meter as HUD damage log, not kill streak. */
      dps_line: 'DPS (1s): {dps}',
      /** Shown under the wave objective when the run started with a curse. */
      curse_chip: 'Curse: {name} (+{pct}% gold)',
    },
    /** Gold elite modifiers — names for future tooltips / codex. */
    elite_affix: {
      swift: { name: 'Swift', blurb: 'Faster feet — harder to shake.' },
      bulwark: { name: 'Bulwark', blurb: 'Extra meat on the bone.' },
      relentless: { name: 'Relentless', blurb: 'Barely budges when ye hit it.' },
      wealthy: { name: 'Wealthy', blurb: 'Fatter gem — worth the scrap.' },
      volatile: { name: 'Volatile', blurb: 'Pops on death — mind the crowd.' },
    },
    pause: {
      title: 'PAUSED',
      /** Rotating quips shown below the pause title — wee breather moments. */
      quip_1: 'Away and put the kettle on.',
      quip_2: 'Two pints, prick!',
      quip_3: 'Gonnae no dae that? Just gonnae no.',
      quip_4: 'Willie hears ya. Willie don\'t care.',
      quip_5: 'Ahm no\' well.',
      quip_6: 'Steel is heavier than feathers… but they\'re both a kilogramme.',
      quip_7: 'Is this a coup?',
      quip_8: 'Yer ma sells Avon.',
      resume: 'RESUME',
      quit: 'END RUN',
      time_line: 'Time: {time}',
      stats_mid: 'Kills: {kills}  |  Level: {level}',
      stats_loadout: 'Weapons: {w}  |  Curios: {c}',
      /** Shown when coinGoldEarned > 0 — sporran / pickups / milestones this run. */
      stats_gold: 'Gold this run: {gold}g',
      /** Kill combo — current chain vs best this run (pause is a good place to brag). */
      stats_streak: 'Streak: {current} (best {best})',
      /** Matches HUD bottom-left rolling DPS window. */
      stats_dps: 'DPS (1s): {dps}',
      /** Total weapon damage recorded this run (RunStatsTracker). */
      stats_damage: 'Damage dealt: {dmg}',
      /** Subtle affordance under RESUME — keyboard + gamepad Start. */
      keys_resume: 'ESC / P / Start — resume',
      passives_heading: 'Curios:',
      /** Pause overlay — reference for gold elite trait names (lines use ui.elite_affix.*). */
      elite_affix_heading: 'Gold elites — traits:',
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
      /**
       * Three-char HUD pill abbreviations. Separate from pause_short because
       * the pause overlay has room for fuller descriptions while the HUD
       * pill is tiny.
       */
      hud_abbrev: {
        sporran: 'SPR',
        whisky_flask: 'WFL',
        kilt: 'KLT',
        tam_o_shanter: 'TAM',
        irn_bru: 'IRN',
        loch_water: 'LOC',
        // The 3 rare passives — disambiguating short forms so the fallback
        // substring trick doesn't render ambiguous pills like "THI" (was
        // thistle_shot or thistle_crown?) or "HIG" (shield or claymore?)
        // or "TAR" (looks like black goo).
        thistle_crown: 'CRN',    // crown
        highland_shield: 'SHD',  // shield
        tartan_sash: 'SAS',      // sash
      },
    },
    bossWarning: {
      gordon: "The kitchen's marching — Gordon's comin' and he's RAGIN!",
      tour_bus: "Tour bus on the horizon — it's no' stoppin' at Yoker this time.",
      the_laird: 'The Laird strides oot — mind yir manners and yir hide.',
      hunter_general: "The Hunter-General — and they've brought pals.",
      taxman: "The Taxman's here — and he's no' takin' a cheque.",
    },
    game: {
      evolution_primed: 'Legend ready: {name} — crack a chest and let it loose!',
      level_banner: 'Level {level} — get in!',
      level_power_surge: 'Level {level} — the moor clears for ye!',
      level_up_fallback: 'Levelled up, ya wee belter!',
      kill_milestone: '{count} culls! +{gold}g',
      /** Unique kill milestone patter — each threshold gets its own Glesga one-liner. */
      kill_100: 'A hunner doon! No\' bad for a wee beastie. +{gold}g',
      kill_250: '250 culls — yir pure flying noo. +{gold}g',
      kill_500: '500! Half a grand o\' them. The moor\'s runnin\' oot. +{gold}g',
      kill_1000: 'A THOUSAND. The glen will tell stories about ye. +{gold}g',
      kill_2500: 'Two and a half grand! That\'s no\' normal, pal. +{gold}g',
      kill_5000: 'FIVE THOUSAND. Yer da sells Avon but you sell pain. +{gold}g',
      /** Ceilidh Chain pulse — every 8th kill, magnet widens 2s. */
      ceilidh_pulse: '♪ Ceilidh! — moor picks up the beat.',
      /** Combo milestone shouts — Glesga cultural Easter eggs */
      combo_11: 'ELEVEN!',
      combo_50: 'THAT\'S PLENTY!',
      combo_100: 'YER DA SELLS AVON!',
      combo_200: 'PEOPLE MAKE GLASGOW!',
      combo_dropped: 'Aw, {count} streak gone. Ye were doin\' well there.',
      combo_dropped_big: '{count} streak doon the pan! Ye were pure flying and aw.',
      boss_kill_heal: 'Boss doon! That\'s yir heal — +{hp} HP',
      boss_enraged: 'The beast is RAGIN!',
      /** Per-boss kill celebrations — the big punchline after the big fight. */
      boss_killed_gordon: 'Gordon\'s DOON! Back tae the kitchen, big man!',
      boss_killed_tour_bus: 'Bus terminated! Next stop: the scrapyard via Yoker.',
      boss_killed_the_laird: 'The Laird\'s on his erse! Yer bum\'s oot the windae, pal!',
      boss_killed_hunter_general: 'Hunter-General floored! Take yir medals and yir pith helmet!',
      boss_killed_taxman: 'THE TAXMAN IS DOON! Tax-free zone declared!',
      boss_killed_generic: 'Boss doon! Get it right round ye!',
      achievement_unlock: '★ {title}',
      upgrade_new_weapon: 'New kit: {name} — get it right round them!',
      upgrade_weapon_level: '{name} — pure sharper noo',
      upgrade_add_passive: '{name} — curio pocketed, ya dancer',
      upgrade_stat_boost: '{name}',
      upgrade_evolve_weapon: 'Legend forged: {name}! Mon then!',
      max_level_toast: 'Max level — yir a walking storm! That\'s plenty.',
      /** Shown when XP converts to gold at max level (batched). */
      xp_overflow_gold: 'Max level — the moor pays in gold: +{gold}g (overflow XP).',
      /** Shown once per account the first time an enemy key is culled — meta codex. */
      codex_first_cull: 'First cull logged: {name} — the herd\'s takin notes.',
      second_wind: 'Second wind — yir no done yet, pal!',
      treasure_nearby: 'Somethin\' glintin\' oot there…',
      treasure_collected: 'Chest cracked — that\'s a feed and a half (+25% HP)',
      golden_nearby: 'Glimmer o\' gold nearby!',
      golden_collected: 'Golden chest — nice wee earner! +{gold}g',
      controls_hint: 'WASD to roam  •  SPACE for a cheeky dash  •  ESC, P, or Start to catch yir breath',
      armor_blocked: '-{amount} dinged off',
      countdown_go: 'MON THEN!',
      gold_pickup_float: '+{gold}g',
      /** Second gold elite within the chain window — see `BALANCE.enemy.eliteChain*`. */
      elite_chain_double: 'Back-to-back gold elites! +{gold}g',
      elite_chain_triple: 'Elite hat-trick — the moor pays! +{gold}g',
      /** One-time luck bonus when HP first drops into the mercy band. */
      moor_mercy_luck: 'The moor remembers the desperate — yer draws lean finer!',
      moor_mercy_luck_caption: 'Mercy luck — next level-up cards favour rare finds.',
    },
    /**
     * Moor moments — timed hearth beats mid-run (caption + toast + small gift).
     * Voice: warm Still Game register; no punch-down, just moor texture.
     */
    moor_moment: {
      peat_glint: {
        caption: 'Somethin\' winks up from the peat — no\' the taxman, for once.',
        toast: 'Peat glint — +{gold}g tucked in yir sporran.',
        caption_home: 'The bog hoards coins like stories — yir boots earned this one.',
        toast_home: 'Deep peat — +{gold}g from the squelch, ya dancer.',
      },
      loch_breath: {
        caption: 'The loch exhales; the air tastes like tomorrow\'s rain.',
        toast: 'Loch breath — +{xp} XP, neat.',
        caption_home: 'Water-sky mirrors yer feet; the loch slips ye a wee lesson.',
        toast_home: 'Loch-side — +{xp} XP, borrowed from the deep.',
      },
      heather_rest: {
        caption: 'Sit a minute. The heather disnae judge.',
        toast: 'Heather rest — +{hp} HP, ya dancer.',
        caption_home: 'Purple hush — the heather holds ye like a cousin.',
        toast_home: 'Bloom kin — +{hp} HP, soft as a blanket.',
      },
      pine_pull: {
        caption: 'The pines lean in, tryin\' tae tell ye a secret.',
        toast: 'Pine pull — pickups lean yer way for a bit.',
        caption_home: 'Resin and shadow — the wood tugs the world toward yer pouch.',
        toast_home: 'Under the needles — pickups drift yer way a while.',
      },
      crow_bargain: {
        caption: 'A crow negotiates overhead. Ye win this round.',
        toast: 'Crow bargain — +{gold}g, receipt optional.',
        caption_home: 'Open sky, purple ground — the crow likes the odds on heather.',
        toast_home: 'Heather crow — +{gold}g, witnessed by the wind alone.',
      },
      distant_tune: {
        caption: 'Somewhere a practice chanter\'s warblin\'. Free concert.',
        toast: 'Distant tune — +{xp} XP for listenin\'.',
        caption_home: 'The chanter hides in the pine; the tune still finds yer ear.',
        toast_home: 'Forest tune — +{xp} XP, smuggled through the branches.',
      },
      warm_stone: {
        caption: 'Ye find a dry stone still holdin\' yesterday\'s sun.',
        toast: 'Warm stone — +{hp} HP, like a mug o\' tea.',
        caption_home: 'Squat on the bog-stone — damp air, dry heart, warm blood.',
        toast_home: 'Bog stone — +{hp} HP, like heat from nowhere.',
      },
      wind_shift: {
        caption: 'The wind turns; the moor rearranges its furniture.',
        toast: 'Wind shift — the glen brings bits and bobs closer.',
        caption_home: 'The loch wind rearranges the shore — and yer reach.',
        toast_home: 'Shore gust — the waterline brings the shinies nearer.',
      },
      amber_glow: {
        caption: 'The peat holds a slow ember — patience pays in coin.',
        toast: 'Amber glow — +{gold}g from the patient bog.',
        caption_home: 'Deep bog amber — the squelch saved this wan just for ye.',
        toast_home: 'Home peat — +{gold}g, warm as a range.',
      },
      whisky_nip: {
        caption: 'A wee flask left oan the moor — someone else\'s tomorrow is yer today.',
        toast: 'Wee nip o\' whisky — +{gold}g warmth for the hooves.',
      },
      boon_at_ceiling: 'XP bar\'s chokker — have +{gold}g instead, ya legend.',
    },
    /** Run-start identity handoff (variant + intent); shown as an early toast in GameScene. */
    run: {
      start_identity: '{name}\n{flavor}',
      resume_identity: 'Trail picked back up — {name}\n{flavor}',
    },
    tips: {
      dash: 'SPACE dashes through bodies and bad luck alike.',
      combo: 'Keep the streak alive — combos put the boot in harder.',
      armor: 'Armor takes the edge off every dunt. Stack it and laugh.',
      evolve: 'Max a weapon plus its paired curio, then crack a chest — somethin\' legendary wakes up.',
      piper: 'Pipers cheer for the wrong team — silence them early.',
      kite: 'The drift pulls clockwise — like the Clockwork Orange. Lean intae it.',
    },
    /**
     * Banter — ambient Glesga commentary surfaced by BanterSystem.
     * Tone register (per Soul Charter + voice memory):
     *   - Hearth (Still Game warmth): ambient, celebratory, cozy.
     *   - Edge   (Limmy bite):        failure, low-HP, boss warnings.
     * Keep lines SHORT — these ride the toast strip and the captions bar.
     */
    banter: {
      boss_warn: {
        a: 'Somethin\' big\'s comin\'. Square up.',
        b: 'Heavy footsteps. That\'s no\' a rambler.',
        c: 'The moor\'s gone quiet. Bad sign, that.',
        d: 'Aw naw. Here we go.',
        e: 'Big silhouette on the horizon — nae a sheep.',
        // ── Per-boss character warnings (Limmy bite). Each boss gets
        //    three distinct lines anchored to their fantasy. ──
        gordon: {
          a: 'Heid chef\'s oot fae the kitchen. Brace yersel.',
          b: 'Smell that burnin\'? That\'s Gordon.',
          c: 'Big man wi\' a cleaver. Nae jokin\'.',
        },
        tour_bus: {
          a: 'A hale busload. Aw naw.',
          b: 'Forty tourists wi\' cameras. Run.',
          c: 'That coach isnae stoppin\' fer a tea-break.',
        },
        the_laird: {
          a: 'The Laird\'s come tae collect.',
          b: 'Posh git on horseback. Snobby dunter.',
          c: 'Tweeds and teeth. Watch yer flanks.',
        },
        hunter_general: {
          a: 'The General\'s got yer scent.',
          b: 'Proper soldier noo. Nae mair eejits.',
          c: 'Musket an\' medals. Mind they\'re loaded.',
        },
        taxman: {
          a: 'The Taxman\'s here. An\' he\'s no\' takin\' council tax.',
          b: 'Bureaucrat wi\' a scythe. Pure nightmare fuel.',
          c: 'Final demand. Brown envelope, black cloak.',
        },
      },
      low_hp: {
        a: 'Yer on the last shred, wee yin.',
        b: 'One mair dunt an\' it\'s lights oot.',
        c: 'Gie it laldy — nothin\' tae lose noo.',
        d: 'Hangin\' by a thistle.',
        e: 'Last-chance weather — make it count.',
        iron_belly: {
          a: 'The wall\'s shakin\' — mind the cracks.',
          b: 'Even iron rings when it\'s nearly through.',
          c: 'Belly\'s loud — nae in a guid way.',
          d: 'One mair chip an\' the myth cracks.',
        },
        moor_runner: {
          a: 'Legs owe a debt — pay in blood or bail.',
          b: 'Ye\'re slower than yer shadow noo.',
          c: 'Run\'s ower if ye don\'t move smarter.',
          d: 'Sprint or story — pick one.',
        },
        glen_forager: {
          a: 'Satchel\'s light — so are ye, almost.',
          b: 'Wrong pick, wrang moment. Survive it.',
          c: 'Forager\'s gambit — dice are up.',
          d: 'Empty pockets, emptier veins — move.',
        },
        surefoot: {
          a: 'Footing slipped — find it or fold.',
          b: 'Stones turned traitor underhoof.',
          c: 'Balance is a luxury ye dinnae have.',
          d: 'Wobble once mair an\' it\'s ower.',
        },
        pipe_breath: {
          a: 'Wind knocked oot — pipe\'s whistlin\' empty.',
          b: 'One bad note from silence. Breathe.',
          c: 'Lungs say stop; pride says nae.',
          d: 'Reed\'s cracked — blow careful noo.',
        },
        laird: {
          a: 'Tartan\'s tae the ankles — steady, Laird.',
          b: 'Blood oan the estate — no\' the end o\' it.',
          c: 'Crown\'s wobblin\' — haud yer heid up.',
          d: 'A Laird standin\' bleedin\' is still a Laird standin\'.',
        },
        wee_ghostie: {
          a: 'Fadin\' at the edges... haud oan.',
          b: 'Near the veil — step back fae it.',
          c: 'A whisper\'s aw that\'s left. Breathe it in.',
          d: 'Half here. Stay the other half.',
        },
      },
      boss_down: {
        a: 'Away in a box. Pure textbook.',
        b: 'That\'s him telt.',
        c: 'Lang may yir wee lum reek, ya beauty.',
        d: 'Boss doon — the glen exhales.',
        // ── Per-boss celebration (hearth warmth). Victory voice. ──
        gordon: {
          a: 'Telt Gordon where tae stick the cleaver.',
          b: 'Chef\'s oot. Last orders.',
          c: 'Kitchen\'s closed. Yer welcome.',
        },
        tour_bus: {
          a: 'Bus is oot o\' service.',
          b: 'Tourist trap, that. Snap shut.',
          c: 'End o\' the line fer them.',
        },
        the_laird: {
          a: 'Laird\'s nae laird nae mair.',
          b: 'Land\'s back wi\' the moor.',
          c: 'Posher than a polished thistle, an\' just as flat noo.',
        },
        hunter_general: {
          a: 'General\'s off-duty. Permanently.',
          b: 'Outranked the big yin.',
          c: 'That\'s him decommissioned.',
        },
        taxman: {
          a: 'Taxman took a loss fer once.',
          b: 'Death\'s back oan the books.',
          c: 'Owes us nothin\'. We owe him nothin\'. Sorted.',
        },
      },
      weapon_evolve: {
        a: 'Now THAT\'S a proper weapon.',
        b: 'Legendary. As it should be.',
        c: 'The moor trembles. Good.',
        d: 'That\'s the glow-up the legends promised.',
        thistle_shot: {
          a: 'Thistle barbs — sharpened tae spite.',
          b: 'Nae a soft prick noo. That\'s the spirit.',
          c: 'Every needle earned its legend.',
          d: 'Thistle crown — naebody kneels.',
        },
        bagpipe_blast: {
          a: 'Drone turned weapon — the glen\'s deafened.',
          b: 'Blow till the windows rattle. Guid.',
          c: 'That\'s nae a tune — that\'s a declaration.',
          d: 'Drone\'s no\' background — it\'s verdict.',
        },
        caber_toss: {
          a: 'Tree\'s away — pure lumber justice.',
          b: 'Heave ho — the moor clears a path.',
          c: 'Spinning timber — naebody stands twice.',
          d: 'Timber\'s airborne — physics is on yer side.',
        },
        scotch_mist: {
          a: 'Mist wi\' teeth. Lovely.',
          b: 'Ye cannae see it — but it sees them.',
          c: 'Weather turned nasty. Their problem.',
          d: 'Haar wi\' teeth — bonnie an\' cruel.',
        },
        haggis_hurler: {
          a: 'Haggis evolved — chaos o\' the finest kind.',
          b: 'Naebody survives a well-aimed supper.',
          c: 'The platter\'s lethal noo. Fair.',
          d: 'Supper\'s evolved — they\'re the side dish.',
        },
        nessie_tentacle: {
          a: 'Loch\'s lendin\' a hand. Tentacle tax paid.',
          b: 'Somethin\' grabbed the deep end — an\' it\'s yers.',
          c: 'Splash o\' legend. Splash o\' pain.',
          d: 'Deep water diplomacy — firm handshake.',
        },
        claymore: {
          a: 'Big sword energy. The moor approves.',
          b: 'Two-handed trouble — swing once, end it.',
          c: 'Steel wi\' stories. Mair stories comin\'.',
          d: 'Claymore sings — choir o\' one.',
        },
        bagpipes: {
          a: 'The pipes woke up proper. Run.',
          b: 'Skirl turned slaughter — beautiful.',
          c: 'Every note a cut. Pure ceilidh violence.',
          d: 'Ceilidh\'s cancelled — fer them.',
        },
      },
      curse_start: {
        generic: {
          a: 'The moor remembers yir bargain.',
          b: 'Curse taken — nae takin\' it back noo.',
          c: 'Paid in teeth fer gold. Let\'s see it.',
          d: 'Deal\'s sealed — the glen\'s collectin\' interest.',
        },
        heavy_legs: {
          a: 'Heavy legs, heavier purse. Ye asked fer it.',
          b: 'The moor\'s pullin\' at yer boots noo. Worth the gold?',
          c: 'Slower trot — shinier haul. That\'s the deal.',
          d: 'Boots feel like treacle — gold\'s heavy that way.',
        },
        thin_hide: {
          a: 'Thin hide, thick trouble. Mind the dunts.',
          b: 'Every nip stings louder. Ye wanted the bonus.',
          c: 'Paper skin, metal nerve. Off ye go.',
          d: 'Skin\'s paper — nerves are steel. Supposedly.',
        },
        restless_spirits: {
          a: 'Restless spirits — they\'re aw comin\' fer a blether.',
          b: 'Mair boots on the heather. Ye paid fer the crowd.',
          c: 'The glen\'s busier than a ceilidh. Enjoy.',
          d: 'Extra company — paid admission, nae refunds.',
        },
        empty_larder: {
          a: 'Empty larder start — belly rumblin\', pockets jinglin\'.',
          b: 'Less in the tank, mair in the purse. Fair swap?',
          c: 'Ye skipped breakfast fer gold. Classic.',
          d: 'Hunger\'s loud — purse is louder. Ye chose.',
        },
        windless_pipes: {
          a: 'Pipes are quiet — weapons drag their heels.',
          b: 'Nae wind in the reeds. Time yer shots.',
          c: 'Slow an\' steady, bonus an\' braw.',
          d: 'The drone\'s sleepin\' — you\'re awake.',
        },
      },
      level_up: {
        a: 'Look at ye go.',
        b: 'Anither notch. Nae messin\'.',
        c: 'The moor\'s takin\' notes.',
        d: 'Yer gettin\' the hang o\' this.',
        e: 'Levelled up — the glen noticed.',
        f: 'Mair in the tank — spend it wisely.',
        // ── Variant voice — classic uses the generic a–f lines only. ──
        iron_belly: {
          a: 'Another layer tae the wall.',
          b: 'Bigger, stronger, steadier.',
          c: 'The belly remembers every dunt.',
          d: 'Iron thickens — so does the legend.',
        },
        moor_runner: {
          a: 'Feet gettin\' faster by the minute.',
          b: 'Pure flyin\'. Nae stop sign in sight.',
          c: 'Moor\'s a blur. Lovely.',
          d: 'Cadence up — the heather blurs.',
        },
        glen_forager: {
          a: 'Level up — pockets get deeper, appetite stays.',
          b: 'Mair room in the satchel. Guid haul ahead.',
          c: 'Ye grow like a bramble — sharp an\' useful.',
          d: 'Satchel straps stretch — greed approved.',
        },
        surefoot: {
          a: 'Level up — feet remember every stone.',
          b: 'Steadier gait — the moor\'s nae movin\' ye easy.',
          c: 'Surefoot, surer heid. On ye go.',
          d: 'Footprint widens — confidence, nae swagger.',
        },
        pipe_breath: {
          a: 'Level up — lungs like bellows noo.',
          b: 'Breath holds the tune; the tune holds the fight.',
          c: 'Wind in the chest, fire in the hooves.',
          d: 'Reed holds mair — so dae ye.',
        },
        laird: {
          a: 'The Laird grows intae his tartan.',
          b: 'Another generation o\' hoof — the croft thrives.',
          c: 'Stature earned, no\' given. Braw.',
          d: 'The glen notes the rise, aye.',
        },
        wee_ghostie: {
          a: 'A wee bit brighter. A wee bit nearer.',
          b: 'Shape finds form. Hush.',
          c: 'Thicker at the edges noo.',
          d: 'Faint, but fierce.',
        },
      },
      first_blood: {
        a: 'First yin doon. Off ye trot.',
        b: 'Hoof prints in the heather. Game on.',
        c: 'That\'s the ice broken.',
        d: 'First notch on the moor — ink\'s still wet.',
        iron_belly: {
          a: 'First dunt bounced — the belly never flinched.',
          b: 'Wall\'s up; one enemy doon. Business.',
          c: 'Iron held. They didnae.',
          d: 'First dent — the myth holds.',
        },
        moor_runner: {
          a: 'First kill at a canter — habits already.',
          b: 'Ye didn\'t stop tae chat. Respect.',
          c: 'Speed merchant: first sale complete.',
          d: 'Opening sprint — nae warm-up.',
        },
        glen_forager: {
          a: 'First harvest — satchel\'s nae empty noo.',
          b: 'Picked clean. One less pest.',
          c: 'Taste o\' the glen — bitter fer them.',
          d: 'First berry — sharp, as intended.',
        },
        surefoot: {
          a: 'First strike — planted, nae slidin\'.',
          b: 'Footing held. They didnae.',
          c: 'Clean step, clean finish.',
          d: 'First root — nae wobble.',
        },
        pipe_breath: {
          a: 'First note cut deep — nae encore.',
          b: 'Breath out, problem doon.',
          c: 'Drone o\' doom. First verse.',
          d: 'Opening skirl — crowd o\' one.',
        },
        laird: {
          a: 'First poacher telt. The land speaks for itsel\'.',
          b: 'Trespasser doon — estate defends itsel\'.',
          c: 'Opening blow, clean. The tartan holds.',
          d: 'First droplet on the heather. Proper.',
        },
        wee_ghostie: {
          a: 'First ane slips through the veil.',
          b: 'Touch o\' cold — and they\'re doon.',
          c: 'Quiet strike. They never saw ye.',
          d: 'A breath. A blow. A body.',
        },
      },
      kill_streak: {
        a: 'Pure mental, this.',
        b: 'Ye\'re on fire, wee man.',
        c: 'Cannae stop, will nae stop.',
        d: 'The glen\'s tremblin\'.',
        e: 'Combo\'s a ceilidh — naebody leaves early.',
        iron_belly: {
          a: 'Chain keeps goin\' — the wall\'s nae tired.',
          b: 'Momentum like a ceilidh table — nae stoppin\'.',
          c: 'Streak\'s a habit noo. Belly approves.',
          d: 'Wall\'s a drum — ye\'re the solo.',
        },
        moor_runner: {
          a: 'Ye\'re stringin\' them like fence posts.',
          b: 'Hot streak — cold feet nae invited.',
          c: 'Runnin\' tally — and ye\'re still runnin\'.',
          d: 'Lap record — blood edition.',
        },
        glen_forager: {
          a: 'Harvest mode: nae a berry left standin\'.',
          b: 'Combo\'s a full basket — keep pickin\'.',
          c: 'Streak\'s ripe — dinnae let it rot.',
          d: 'Basket overflow — guid problem.',
        },
        surefoot: {
          a: 'Rhythm locked — nae wobble in the chain.',
          b: 'One after another — feet knew the route.',
          c: 'Steady slaughter. Elegant, almost.',
          d: 'Metronome o\' mayhem — tick tick.',
        },
        pipe_breath: {
          a: 'Streak\'s a tune — ye\'re on the chorus.',
          b: 'Breath holds; the beat keeps killin\'.',
          c: 'Rollin\' riff o\' ruin. Lovely.',
          d: 'Crescendo — nae conductor needed.',
        },
        laird: {
          a: 'The Laird declares open season — an\' the moor listens.',
          b: 'Estate cleared, row efter row. Braw work.',
          c: 'The tartan cuts them doon like grain.',
          d: 'A Laird hits heavy — an\' often.',
        },
        wee_ghostie: {
          a: 'They drop like they never were.',
          b: 'Chain o\' whispers — each ane final.',
          c: 'Weightless, but the strikes land.',
          d: 'A hush that leaves naebody standin\'.',
        },
      },
      recover: {
        a: 'Back fae the brink. Deep breath.',
        b: 'Still here. Still kickin\'.',
        c: 'Steady the heid. Yer awright.',
        d: 'Colour back — the moor relents.',
        iron_belly: {
          a: 'Wall\'s back — paint it thicker next time.',
          b: 'Iron remembers how tae hold.',
          c: 'Shrugged it off. Mostly.',
          d: 'Dents polish oot — eventually.',
        },
        moor_runner: {
          a: 'Feet found the beat again.',
          b: 'Back in stride — nae funeral yet.',
          c: 'Second wind — third if ye need it.',
          d: 'Cadence returns — mercy granted.',
        },
        glen_forager: {
          a: 'Satchel still shut — that\'s a win.',
          b: 'Ye lived tae forage anither day.',
          c: 'Bit o\' colour back in the cheeks.',
          d: 'Larder waits — ye earned the walk.',
        },
        surefoot: {
          a: 'Planted again — guid.',
          b: 'Footing honest. Heid follows.',
          c: 'Steady as ye meant tae be.',
          d: 'Roots find stone — ye\'re upright.',
        },
        pipe_breath: {
          a: 'Breath back in the tune.',
          b: 'Pipes warm — play on.',
          c: 'Air\'s yours again. Use it.',
          d: 'Reed dries — next note\'s yours.',
        },
        laird: {
          a: 'Resilience — a Laird\'s trade, that.',
          b: 'Back oan hoof. Estate stands.',
          c: 'The land heals faster than the pride.',
          d: 'Minor stumble. The tartan forgives.',
        },
        wee_ghostie: {
          a: 'Pulled back fae the veil. Thin work.',
          b: 'Flicker held. Form returns.',
          c: 'Still here — faintly, but here.',
          d: 'Ghost knits itsel\' back tae shape.',
        },
      },
      biome_change: {
        a: 'Different smell tae the air here.',
        b: 'New bit o\' moor. Watch yer step.',
        c: 'The terrain\'s shiftin\'.',
        d: 'Postcode changed — same attitude.',
        bog: {
          a: 'Squelch. The bog\'s got opinions aboot yer boots.',
          b: 'Peat underfoot — dinnae rush it.',
          c: 'Wet air, thick thoughts. Classic bog.',
          d: 'Mud tax — pay in dignity.',
        },
        loch: {
          a: 'Loch breath — cauld enough tae sharpen ye.',
          b: 'Water\'s watchin\' from the edge. Always.',
          c: 'Ripple weather. Mind the pull.',
          d: 'Shoreline politics — ye\'re a tourist.',
        },
        pine: {
          a: 'Needles underhoof — the forest\'s carpet.',
          b: 'Tall shadows. Short temper if ye rush.',
          c: 'Sap an\' silence. Nae a bad combo.',
          d: 'Canopy closes — mind yer heid.',
        },
        heather: {
          a: 'Heather\'s up — purple haze, open sky.',
          b: 'Wind off the tops — ye cannae hide here.',
          c: 'Open moor, honest fight. Lovely.',
          d: 'Tops are honest — nae cover, nae lies.',
        },
      },
      moor_moment: {
        a: 'The moor noticed ye. That\'s rare.',
        b: 'Gift frae the glen — dinnae spend it a\' at once.',
        c: 'Hearth beat — the land\'s still payin\' attention.',
        d: 'Somethin\' kind tumbled oot the weather.',
        e: 'The glen tipped its hat — briefly, but sincerely.',
        f: 'Luck\'s a loan — spend it before it notices.',
        home_bog: {
          a: 'Standin\' in the squelch — the peat pays interest.',
          b: 'Bog kin — the mud remembers yer name.',
          c: 'Deep peat blessing. Yer boots earned it.',
          d: 'Kin rates — squelch discount applied.',
        },
        home_loch: {
          a: 'Loch glass — the water tipped ye a favour.',
          b: 'Shore gift: the deep disnae charge interest.',
          c: 'Yir reflection smiled back. Briefly.',
          d: 'Home water — nae strangers at this shore.',
        },
        home_pine: {
          a: 'Needle kin — the wood leans yer way.',
          b: 'Sap on the wind — that\'s a pine handshake.',
          c: 'Forest tithe: paid in kindness.',
          d: 'Needle kin — bark remembers the old songs.',
        },
        home_heather: {
          a: 'Bloom kin — the purple hush held ye tight.',
          b: 'Heather tithe: soft ground, sharp fortune.',
          c: 'Open sky tithe — nae roof but plenty heart.',
          d: 'Purple kin — wind off the tops knows yer name.',
        },
        bog: {
          a: 'Squelch brought luck — bog\'s generous the day.',
          b: 'Peat air, lucky air.',
          c: 'Mud kissed yer boots — say thank ye.',
        },
        loch: {
          a: 'Water luck — even dry boots get a splash.',
          b: 'Ripple paid ye — nae receipt.',
          c: 'Loch winked — naebody else saw it.',
        },
        pine: {
          a: 'Shadow luck — the trees shared a crumb.',
          b: 'Sap-stained fortune. Guid.',
          c: 'Bough nodded — contract sealed.',
        },
        heather: {
          a: 'Wind off the tops — carried a coin o\' cheer.',
          b: 'Purple hour — the moor tipped its hat.',
          c: 'Tops gave a whisper — listen close.',
        },
      },
      idle: {
        a: 'Quiet, this. Too quiet, mibbe.',
        b: 'Listen tae the wind.',
        c: 'A wee breather.',
        d: 'Somethin\'s brewin\'. Always is.',
        e: 'Calm afore the ceilidh — savour it.',
        f: 'The moor hums low — dinnae interrupt.',
        iron_belly: {
          a: 'Even the wall needs a sit-down.',
          b: 'Belly\'s quiet — dinnae trust it fully.',
          c: 'Rest is tactical. So\'s pie.',
          d: 'Iron naps — nightmares don\'t.',
        },
        moor_runner: {
          a: 'Stillness itch — feet want the next lap.',
          b: 'Quiet\'s just the startin\' gun loadin\'.',
          c: 'Breathin\' room — then back tae blur.',
          d: 'Idle hooves — guilty hooves.',
        },
        glen_forager: {
          a: 'Eyes still roamin\' — habit, that.',
          b: 'Nae pickin\' just noo. Patience, thief.',
          c: 'Satchel\'s patient. The moor isnae.',
          d: 'Hands empty — eyes full. Fer noo.',
        },
        surefoot: {
          a: 'Standin\' still — but the map keeps turnin\'.',
          b: 'Silence is just slow footwork.',
          c: 'Calm feet, sharp ears.',
          d: 'Pause is posture — nae weakness.',
        },
        pipe_breath: {
          a: 'Rest between phrases — still music.',
          b: 'Hums in the chest — nae audience needed.',
          c: 'Quiet stage — pipes tune themselves.',
          d: 'Silence is the rest — nae the song.',
        },
        laird: {
          a: 'The Laird surveys his land.',
          b: 'A breath on the heather — aye, earned.',
          c: 'Tartan smoothed. Heid clear.',
          d: 'Even a Laird needs a wee pause.',
        },
        wee_ghostie: {
          a: 'Hover. Drift. Listen.',
          b: 'The moor feels ye fainter here.',
          c: 'Breath thin as gossamer.',
          d: 'Still. Like a held note.',
        },
      },
      // W2 Moor Road.
      act_intermission_enter: {
        a: 'Awright, which way, big yin?',
        b: 'Road forks. Choose, or don\'t.',
        c: 'Split in the path. Mind yer feet.',
      },
      act_complete: {
        a: 'That\'s one doon. Braw.',
        b: 'On tae the next bit.',
      },
      route_picked: {
        generic: {
          a: 'Line picked. Walk it, aye.',
          b: 'Decision made. Nae takin\' it back.',
        },
        up_the_brae: {
          a: 'Up we go then.',
          b: 'Keep climbin\', bold lad.',
        },
        round_the_loch: {
          a: 'Water\'s cauld, mind.',
          b: 'Longer way, safer way.',
        },
        through_the_kirkyard: {
          a: 'Hope yer no\' feart.',
          b: 'Shortcut through the deid.',
        },
        stand_yer_ground: {
          a: 'Nae runnin\' noo.',
          b: 'Aye, dig in, ya daftie.',
        },
        run_for_the_hills: {
          a: 'Leg it — smart lad.',
          b: 'Nae shame in a retreat.',
        },
        buckie_pitstop: {
          a: 'Needed a break anyway.',
          b: 'Tonic o\' the moor, that.',
        },
      },
    },
  },
  captions: {
    /** Per-event accessibility captions — short, descriptive. Semantic
     *  parity with the audio/toast cue they accompany, not flavor copy. */
    victory_chorus: 'The moor resounds — victory chord swells.',
    death_fall: 'Hooves down — the moor quiets.',
    low_hp: 'HP dangerously low — heartbeat thunders.',
    /** W2 Moor Road — fired when ActIntermissionScene launches. */
    act_intermission_open: 'Road splits — pick a route with 1, 2, or 3.',
  },
  biomes: {
    bog: {
      name: 'The Bog',
      entry: 'Intae the bog, wee man — watch yir hooves.',
    },
    loch: {
      name: 'Loch Edge',
      entry: 'Loch\'s watchin\'. Somethin\' under there.',
    },
    pine: {
      name: 'Pine Thicket',
      entry: 'Dark amang the pines. Stay sharp.',
    },
    heather: {
      name: 'Heather Bloom',
      entry: 'The heather\'s singin\' — this is haggis country.',
    },
  },
  metaItem: {
    speed_tier_1: {
      name: 'Sprint Boots',
      description: 'Quicker hooves from the first step (+10% base move speed).',
    },
    speed_tier_2: {
      name: 'Sprint Boots II',
      description: 'Fleet as a highland hare (+15% base move speed).',
    },
    health_tier_1: {
      name: 'Thick Pelt',
      description: 'Room for one more mistake (+10% base max HP).',
    },
    health_tier_2: {
      name: 'Thick Pelt II',
      description: 'Built like a Maryhill tenement (+15% base max HP).',
    },
    pickup_tier_1: {
      name: 'Magnetic Whiskers',
      description: 'Gems lean toward ye (+22 pickup radius).',
    },
    damage_tier_1: {
      name: 'Highland Temper',
      description: 'Hits land heavier (+5% damage).',
    },
    damage_tier_2: {
      name: 'Highland Temper II',
      description: 'Every wallop counts double (+10% damage).',
    },
    regen_tier_1: {
      name: "Moor's Grace",
      description: 'The moor patches its ain — slow but sure (+0.2 HP/sec).',
    },
    crit_tier_1: {
      name: 'Sharper Eye',
      description: 'A keen eye for the soft bits (+3% crit chance).',
    },
    cooldown_tier_1: {
      name: 'Nimble Hooves',
      description: 'Faster than a Glesga taxi meter — weapons cycle quicker (-8% cooldown).',
    },
    xp_tier_1: {
      name: 'Quick Study',
      description: 'The moor teaches ye faster if ye pay attention (+5% XP gain).',
    },
    armor_tier_1: {
      name: 'Stone Skin',
      description: 'Thick as a Partick bouncer — dunts bounce right off (+2 armor).',
    },
    dash_tier_1: {
      name: 'Lighter Step',
      description: 'Dash comes back like a bad penny (-10% dash cooldown).',
    },
  },
  curse: {
    // Curse names + flavour descriptions — voice-driven, a trade knowingly taken.
    heavy_legs: {
      name: 'Heavy Legs',
      desc: 'The moor drags at yir hooves — every step a wee bit heavier.',
    },
    thin_hide: {
      name: 'Thin Hide',
      desc: 'Yir coat\'s threadbare the day — every blow lands harder.',
    },
    restless_spirits: {
      name: 'Restless Spirits',
      desc: 'The glen stirs. They\'re comin quicker, pal — stay sharp.',
    },
    empty_larder: {
      name: 'Empty Larder',
      desc: 'Startin hungry. Less in ye tae lose, but less tae spare.',
    },
    windless_pipes: {
      name: 'Windless Pipes',
      desc: 'Reeds hang quiet. Weapons fire a shade slower — patience pays.',
    },
  },
  evolution: {
    thistle_storm: {
      name: 'Thistle Storm',
      description: 'Eight homing thistles seek their quarry across the moor. The storm has teeth.',
    },
    highland_fling: {
      name: 'The Highland Fling',
      description: 'A great sonic ring blooms outward. The moor sings; yir enemies come apart.',
    },
    highland_games: {
      name: 'Highland Games',
      description: 'The caber detonates on its final pierce, leaving a burning patch o\' grass. Heave, ho.',
    },
    the_haar: {
      name: 'The Haar',
      description: 'The great Highland fog rolls in. Half the moor vanishes; anything caught in it dissolves.',
    },
    haggis_cannon: {
      name: 'Jobby Cannon',
      description: 'Rapid-fire wee jobbies — every bounce ends in a messy pop.',
    },
    nessie_unleashed: {
      name: 'Nessie Unleashed',
      description: 'Every tentacle, every angle. The loch herself comes to yir aid.',
    },
    william_blade: {
      name: 'William Blade',
      description: 'Legendary claymore — shockwaves tear across the moor like a battle-cry.',
    },
  },
  achievement: {
    ach_kills_1000: {
      title: 'Cull of the Glen',
      description: 'A thousand culls — the moor knows yir name.',
    },
    ach_kills_5000: {
      title: 'Seasoned Culler',
      description: 'Five thousand. The glen will tell stories about ye.',
    },
    ach_survive_5m: {
      title: 'Finding Yir Feet',
      description: 'Five minutes standing — the hooves hold.',
    },
    ach_survive_10m: {
      title: 'Heather Marathon',
      description: 'Ten minutes and still standin\'. No\' bad, pal.',
    },
    ach_full_run: {
      title: 'Still Here, Pal',
      description: 'Fifteen minutes. The full cycle. That\'s plenty.',
    },
    ach_defeat_taxman: {
      title: 'Tax-Free Zone',
      description: 'The Taxman picked the wrong glen.',
    },
    ach_first_victory: {
      title: 'The Moor Is Yours',
      description: 'First victory — the Highlands breathe easier.',
    },
    ach_first_evolution: {
      title: 'Legend Forged',
      description: 'Evolved a weapon. Somethin\' ancient stirred — and it\'s got teeth.',
    },
    ach_codex_half: {
      title: 'Naturalist',
      description: 'Logged at least half the moor\'s beasties in the cull codex.',
    },
    ach_codex_loremaster: {
      title: 'Loremaster o\' the Moor',
      description: 'Every last creature type — first blood recorded. The book is complete.',
    },
    ach_moor_hearth_30: {
      title: 'Hearth-Kept',
      description: 'Thirty moor gifts accepted — the glen counts ye as kin.',
    },
    ach_all_bosses: {
      title: 'Cleaned Hoose',
      description: 'Every last wan o\' them, floored in a single run.',
    },
    ach_walk_every_road: {
      title: 'Kent the Moor',
      description: 'Walked all six Moor Road routes — nae stone unturned.',
    },
    ach_ironmoor_victor: {
      title: 'Hard as Granite',
      description: 'Won a run wi\' Ironmoor on — single life, nae wobble.',
    },
    ach_full_herd: {
      title: 'The Full Herd',
      description: 'Unlocked every wee haggis — the glen runs thick.',
    },
    ach_laird_victor: {
      title: 'Lord o\' the Moor',
      description: 'Won a run as The Laird — tartan still straight.',
    },
    ach_stone_circle: {
      title: 'Stone Circle',
      description: 'Walked every standing stone — mending, fire, haste, all three.',
    },
    ach_echo_touched: {
      title: 'The Moor Remembers',
      description: 'Touched an Ancestral Echo — nae grief wasted.',
    },
    ach_ceilidh_commander: {
      title: 'Ceilidh Commander',
      description: 'Pulled fifteen ceilidh chains — the moor\'s dancin\' tae yer beat.',
    },
    ach_past_the_bell: {
      title: 'Past the Bell',
      description: 'Stayed when the Taxman fell — the moor wasnae done with ye.',
    },
    ach_endless_endurance: {
      title: 'Endless Endurance',
      description: 'A full minute past the bell — daft thing, but ye made it look easy.',
    },
    ach_cursed_victor: {
      title: 'Cursed Victor',
      description: 'Won a run wi a curse on yir back — paid in teeth, walked oot anyway.',
    },
    ach_combo_100: {
      title: 'Storm Chaser',
      description: 'Strung a hundred culls intae a single streak — the moor\'s roarin\' wi ye.',
    },
  },
  tutorial: {
    move: 'WASD or stick to roam — weapons fire themselves. SPACE: a cheeky dash through trouble (and through enemies).',
    gem: 'Gather gems to level. Max a weapon plus its paired curio, then pop a treasure chest for a legendary glow-up.',
    drift: 'Yir wee haggis drifts clockwise — crooked legs! Lean into it.',
    /** One-shot when the first affixed gold elite spawns — `{name}` is the trait title. */
    elite_affix_first: '{name} — gold elites carry a trait. The tag by the bar tells ye which.',
    moor_moment_first: 'The moor gives wee gifts noo and then — a line, a boon, a breath. Bide wi it.',
    ceilidh_chain_first: 'Ceilidh Chain — every 8th kill in a streak pulls coins an\' gems in close. Keep the jig gaun.',
    standing_stones_first: 'Standing Stones — three boons on the moor. Walk up tae the one ye want; the other two crumble.',
    ancestral_echo_first: 'Yer ghost frae last run is oot on the moor. Touch it fur gold an\' a wee heal — it only lingers 30s.',
  },
  weapon: {
    thistle_shot: {
      name: 'Thistle Shot',
      description: 'Sharp thistles fly at the nearest bother.',
    },
    bagpipe_blast: {
      name: 'Bagpipe Blast',
      description: 'A wee shockwave to knock the breath oot o\' foes.',
    },
    caber_toss: {
      name: 'Caber Toss',
      description: 'A log the size of a door, thrown clean through a crowd.',
    },
    scotch_mist: {
      name: 'Scotch Mist',
      description: 'Trail a creeping fog. What wanders in doesnae wander oot.',
    },
    haggis_hurler: {
      name: 'Jobby Hurler',
      description: 'Bouncing wee jobbies that ricochet till they stick.',
    },
    nessie_tentacle: {
      name: "Nessie's Tentacle",
      description: 'A sweeping arm from the loch — wide reach, meatier knockback.',
    },
    claymore: {
      name: 'Highland Claymore',
      description: 'A sword the weight of a man. Slow to lift, enormous in the sweep.',
    },
    bagpipes: {
      name: 'Ceòl Mòr Bagpipes',
      description: 'A great drone that presses on yir enemies like weather.',
    },
  },
  boss: {
    gordon: { name: 'Gordon the Chef' },
    tour_bus: { name: 'The Tour Bus' },
    the_laird: { name: 'The Laird' },
    hunter_general: { name: 'The Haggis Hunter General' },
    taxman: { name: 'Death (The Taxman)' },
  },
  variant: {
    classic: {
      name: 'Classic Haggis',
      flavor: 'The baseline beast. Crooked legs, straight ambition.',
    },
    moor_runner: {
      name: 'Moor Runner',
      flavor: 'Lean and wind-cut, built to skim the heather.',
    },
    iron_belly: {
      name: 'Iron Belly',
      flavor: 'Heavy, stubborn — an\' hard tae stop once it starts rollin\'.',
    },
    glen_forager: {
      name: 'Glen Forager',
      flavor: 'A scavenger of glens and glittering spoils.',
    },
    surefoot: {
      name: 'Surefoot',
      flavor: 'The drift still whispers, aye, but it no longer decides.',
    },
    pipe_breath: {
      name: 'Pipe Breath',
      flavor: 'Wheesht — the moor exhales through this one.',
    },
    laird: {
      name: 'The Laird',
      flavor: 'Wears the tartan proper. Lordly swagger, heavier swing.',
    },
    wee_ghostie: {
      name: 'Wee Ghostie',
      flavor: 'Pale an\' thin — here an\' no\' here. Hits hard, breaks easy.',
    },
    summary: {
      speed: '{sign}{pct}% speed',
      hp: '{sign}{val} HP',
      armor: '{sign}{val} armor',
      pickup: '{sign}{val} pickup',
      xp: '{sign}{pct}% XP',
      dmg: '{sign}{pct}% dmg',
      drift: '{sign}{pct}% drift',
      cdr: '{sign}{pct}% CDR',
      baseline: 'Baseline stats',
    },
    unlock: {
      // These are short labels interpolated into a "Label: current/required" strip.
      // Kept terse so the line doesn't overflow the variant panel.
      survive: 'Survive',
      best_kills: 'Best kills',
      total_gold: 'Gold banked',
      victories: 'Victories',
      ready: 'Ye earned this one',
    },
  },
  permanentUpgrade: {
    thick_hide: { name: 'Thick Hide', description: 'A hide thick enough to shrug off the first wee knocks (+5% starting HP).' },
    strong_legs: { name: 'Gallus Legs', description: 'Quicker hooves from the very first step — pure gallus (+3% speed).' },
    sharp_thistles: { name: 'Sharp Thistles', description: 'Every thistle hits a shade harder (+5% damage).' },
    magnetic_personality: { name: 'Magnetic Personality', description: 'Gems lean toward ye of their own accord (+10% pickup radius).' },
    lucky_heather: { name: 'Lucky Heather', description: 'The glen rolls kinder picks (+10% card rarity).' },
    drift_control: { name: 'Drift Control', description: 'Tighter turns, fewer tumbles (-15% clockwise drift).' },
    extra_choice: { name: 'Extra Choice', description: 'One more pick at every level-up, for when ye cannae decide.' },
    battle_hardened: { name: 'Battle Hardened', description: 'Old scars become plate — start each run with +2 armor.' },
    weapon_training: { name: 'Battle-Tested', description: 'Ye\'ve been oot before — yir Thistle Shot starts a level stronger.' },
    crit_power: { name: 'Heid-the-Baw', description: 'Ye ken exactly where tae wallop them (+3% crit chance, +25% crit damage).' },
    xp_boost: { name: 'Scholar\'s Mind', description: 'The glen teaches ye faster (+8% XP gain).' },
    lucky_start: { name: 'Lucky Start', description: 'Start each run with a random curio already in yir pocket.' },
    natural_recovery: { name: 'Moor\'s Mend', description: 'The moor patches ye up as ye run — slow and steady like (+0.3 HP/sec).' },
    revival: { name: 'Second Wind', description: 'Once per run, shrug off death wi\' 50% HP and keep going.' },
    double_dash: { name: 'Double Dash', description: 'Two dashes in the hoof instead of one.' },
    treasure_magnet: { name: 'Treasure Magnet', description: 'Chests and coins linger a few breaths longer (+5s).' },
    dirk_hand: { name: 'Dirk Hand', description: 'A quicker draw on every weapon (+3% attack speed).' },
  },
  upgradeCard: {
    // Weapon cards
    add_bagpipe_blast: {
      name: 'Bagpipe Blast',
      description: 'A ring of rude sound. Foes scatter like pigeons on Buchanan Street.',
    },
    add_caber_toss: {
      name: 'Caber Toss',
      description: 'Hurl a caber through a line of them — Highland Games in combat form.',
    },
    add_scotch_mist: {
      name: 'Scotch Mist',
      description: 'Trail a choking fog. Anything that lingers in it learns.',
    },
    add_haggis_hurler: {
      name: 'Jobby Hurler',
      description: 'Wee jobbies that ricochet off the arena edges till something soft stops them.',
    },
    add_nessie_tentacle: {
      name: "Nessie's Tentacle",
      description: 'A sweeping arm from the loch — wide reach, meatier knockback.',
    },
    add_claymore: {
      name: 'Highland Claymore',
      description: 'A slow, enormous cleave. Pair with the Tartan Sash to forge a legend.',
    },
    add_bagpipes: {
      name: 'Ceòl Mòr Bagpipes',
      description: 'A great drone that presses on the crowd till it folds.',
    },
    // Passive cards
    add_sporran: {
      name: 'Sporran',
      description: 'A wee leather pouch. Somehow rarer cards turn up more often (+15% Luck). Evolves Thistle Shot.',
    },
    add_whisky_flask: {
      name: 'Whisky Flask',
      description: 'A nip before the fight — every AoE blooms 20% wider. Evolves Bagpipe Blast.',
    },
    add_kilt: {
      name: 'Kilt',
      description: 'It\'s breezy but it works — room for one more daft mistake (+15% max HP). Evolves Caber Toss.',
    },
    add_tam_o_shanter: {
      name: "Tam o' Shanter",
      description: 'A jaunty blue bonnet. The drift respects it, a little (+10% speed). Evolves Scotch Mist.',
    },
    add_irn_bru: {
      name: 'Irn Bru',
      description: "Scotland's other national drink — weapons fizz 20% faster. Evolves Jobby Hurler.",
    },
    add_loch_water: {
      name: 'Loch Water',
      description: 'Drawn from the depths. Gems hear it and come running (+25% pickup radius). Evolves Nessie\'s Tentacle.',
    },
    add_thistle_crown: {
      name: 'Thistle Crown',
      description: 'Prickly as a Glesga bus queue. +5% crit; attackers take 3 damage on contact.',
    },
    add_highland_shield: {
      name: 'Highland Shield',
      description: 'For when it aw goes sideways. Every 20s, shrug off a lethal hit.',
    },
    add_tartan_sash: {
      name: 'Tartan Sash',
      description: 'Pattern o\' clan and courage. +8% damage on everything. Evolves Highland Claymore.',
    },
    // Stat boost cards
    boost_hp: {
      name: 'Thick Hide',
      description: 'Room for a wee bit more punishment (+10 max HP). Stack as many as ye like.',
    },
    boost_speed: {
      name: 'Quick Feet',
      description: 'Fresher legs, faster steps (+8% move speed). The drift still whispers, mind.',
    },
    boost_pickup: {
      name: 'Keen Nose',
      description: 'Gems on the wind — ye smell them sooner (+15 pickup radius).',
    },
    boost_damage: {
      name: 'Sharpened Thistles',
      description: 'Every thistle given a shade more edge (+10% damage, everything).',
    },
    boost_drift: {
      name: 'Balanced Legs',
      description: 'The drift eases a little (-15%). Inputs land closer to where ye aim.',
    },
    heal: {
      name: 'Haggis Supper',
      description: 'A full plate before the fight. Instantly heal 25% of yir max HP.',
    },
    boost_crit: {
      name: 'Eagle Eye',
      description: 'Ye ken where it hurts (+5% crit chance).',
    },
    boost_regen: {
      name: 'Highland Spring',
      description: 'Like a sip o\' Irn-Bru for the soul (+0.5 HP/sec, slow and steady).',
    },
    boost_armor: {
      name: 'Iron Hide',
      description: 'Harder skin, flatter damage (+3 armor on every hit).',
    },
    boost_cooldown: {
      name: 'Battle Frenzy',
      description: 'The blood kens the beat (-10% weapon cooldowns).',
    },
    banish: {
      name: 'Highland Purge',
      description: 'Wipe the 5 weakest nearby off the moor. That\'s plenty — gie yerself some space.',
    },
    boost_lifesteal: {
      name: 'Vampiric Touch',
      description: 'A wee nip o\' life from every cull (+1 HP each).',
    },
    boost_projectile_speed: {
      name: 'Swift Thistles',
      description: 'Thistles wi\' a bit more zip — they arrive before the scream (+15% projectile speed).',
    },
    boost_boss_heal: {
      name: 'Trophy Hunter',
      description: 'When a boss folds, heal 20% max HP. Ye earned that, big yin.',
    },
    boost_knockback: {
      name: 'Highland Force',
      description: 'Every hit lands with a proper shove (+25% knockback).',
    },
    boost_xp: {
      name: 'Wisdom of the Highlands',
      description: 'The moor teaches, if ye\'ll listen (+15% XP from enemies).',
    },
    boost_luck: {
      name: 'Heather Fortune',
      description: 'The glen rolls a shade kinder — +8 luck on level-up draws (rarer picks, stacks wi\' curios).',
    },
    // Templates used by buildCardPool for level-up cards.
    // Space between "Lv" and the number to match ui.hud.level_fmt for visual
    // consistency across HUD + card + game-over weapon summaries.
    levelup: {
      name: '{weapon} Lv {level}',
      description: 'Hone {weapon} up tae level {level}. Every notch counts.',
    },
    evolution_hint: ' At Lv 5, crack a chest while carrying {passive} — somethin\' legendary stirs.',
  },
  // W2 Moor Road — route labels + descriptions.
  // Voice-card rules (M3 pass):
  //   - Labels ≤ 5 words, Glesga rhythm.
  //   - Descs ≤ 15 words, benefit first, cost second.
  //   - Kirkyard + buckie carry the Limmy bite; others warm.
  routes: {
    up_the_brae: {
      label: 'Up the brae',
      desc: 'Elites get brave. Yer next treasure\'s got a golden coat.',
    },
    round_the_loch: {
      label: 'Round the loch',
      desc: 'Catch yer breath (+25% HP). Two mair wells waitin\'.',
    },
    through_the_kirkyard: {
      label: 'Through the kirkyard',
      desc: 'Shortcut through the deid. Thicker crowd, ninety seconds. Hunter\'s watchin\'.',
    },
    stand_yer_ground: {
      label: 'Stand yer ground',
      desc: 'XP doubles fer thirty seconds. Nae new trouble.',
    },
    run_for_the_hills: {
      label: 'Run for the hills',
      desc: 'Full heal, dashes back. But they\'re comin\' faster noo.',
    },
    buckie_pitstop: {
      label: 'Buckie pit-stop',
      desc: 'Fifteen seconds\' peace, free reroll. Enemies hit a bit harder after.',
    },
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


export type LocaleKey = 'en' | 'scs';
export const DEFAULT_LOCALE: LocaleKey = 'en';

let activeLocale: LocaleKey = DEFAULT_LOCALE;

/**
 * Scots is code-split — the Scots overlay lives in `./i18n.scs` and is
 * only fetched when the player selects it. Until the chunk resolves,
 * `LOCALES.scs` falls back to EN_STRINGS and `t()` renders in English.
 *
 * Callers that need deterministic Scots resolution (tests, boot paths
 * on a Scots-saved profile) should `await ensureLocaleReady('scs')`
 * before the first `t()` call.
 */
let scsOverlay: LocaleTree | null = null;
let scsLoadPromise: Promise<LocaleTree> | null = null;

/**
 * Preload a locale's overlay chunk. English is always resident (it IS
 * the reference tree). For Scots, triggers the dynamic `import('./i18n.scs')`
 * and resolves when the chunk is cached. Safe to call repeatedly — a
 * single in-flight promise is memoized.
 */
export function ensureLocaleReady(key: LocaleKey): Promise<void> {
  if (key !== 'scs') return Promise.resolve();
  if (scsOverlay) return Promise.resolve();
  if (!scsLoadPromise) {
    scsLoadPromise = import('./i18n.scs').then((m) => {
      scsOverlay = m.SCS_STRINGS;
      return scsOverlay;
    });
  }
  return scsLoadPromise.then(() => undefined);
}

/**
 * LOCALES exposes the active overlay map. `scs` is a getter so it always
 * reflects the current lazy-load state — before the chunk resolves it
 * returns EN_STRINGS (silent fallback); after, the loaded Scots tree.
 */
export const LOCALES: Readonly<Record<LocaleKey, LocaleTree>> = {
  en: EN_STRINGS,
  get scs(): LocaleTree {
    return scsOverlay ?? EN_STRINGS;
  },
} as Readonly<Record<LocaleKey, LocaleTree>>;

/**
 * Switch the active locale. Unknown keys fall back to English silently.
 * For Scots, kicks off the code-split chunk fetch in the background —
 * use `await ensureLocaleReady('scs')` first if you need the next `t()`
 * call to resolve against the Scots tree rather than fall back to EN.
 */
export function setLocale(key: LocaleKey): void {
  activeLocale = key;
  if (key === 'scs') void ensureLocaleReady('scs');
}

/** Read the active locale. */
export function getLocale(): LocaleKey {
  return activeLocale;
}

/**
 * Resolve a dot-path key against the active dictionary. Missing paths
 * fall back to the English tree, then to the key string itself. Keeps
 * partial-locale rollout safe: a Scots overlay only needs to define the
 * keys it's ready to ship — and until the Scots chunk loads, every key
 * falls back to EN.
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  if (activeLocale !== DEFAULT_LOCALE) {
    const overlay = getLeaf(LOCALES[activeLocale], key);
    if (overlay !== undefined) return interpolate(overlay, vars);
  }
  const raw = getLeaf(EN_STRINGS, key);
  if (raw === undefined) return key;
  return interpolate(raw, vars);
}
