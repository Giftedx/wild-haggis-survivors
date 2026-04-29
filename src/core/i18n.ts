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
      chronicle: 'CHRONICLE',
      deeds: 'YIR DEEDS',
      almanac: 'ALMANAC',
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
    croft: {
      trophy_quip: {
        empty: {
          a: 'That shelf\'s a wee bit bare, mind. Awa an\' bag me somethin.',
          b: 'Ye\'ll fill it yet. I\'ve got faith in that coupon o\' yours.',
        },
        gordon: {
          a: 'Gordon? That man salted his tatties like he owed them money.',
          b: 'Went down with the ladle still swingin. No surprise there.',
        },
        each_uisge: {
          a: 'The water-horse. Ma gran warned me about thon. Ye listened.',
          b: 'Aye. Beautiful things by the loch arenae always beautiful.',
        },
        tour_bus: {
          a: 'That bus service was a pure disgrace. Stops on a whim, so it did.',
          b: 'Heard the driver used to bill folk for the scenery. Good riddance.',
        },
        the_laird: {
          a: 'The Laird thought the glen belonged tae him. The moor disagreed.',
          b: 'A stick like that, an\' still couldnae outwalk a wee haggis.',
        },
        hunter_general: {
          a: 'Pith helmet on the moor? The man was askin\' fir bother.',
          b: 'Wrote it all doon in that journal till the very end, mind.',
        },
        taxman: {
          a: 'The taxman. Pure dead brilliant tae see him off. Here, have a biscuit.',
          b: 'Every run of red ink in that ledger\'s a wee victory, so it is.',
        },
      },
      /** Scene title — Hearth voice, kept short so the banner reads at a glance. */
      title: 'GRAN\'S CROFT',
      /** Sub-line under the title — Hearth warmth, Still Game register. */
      subtitle: 'Hearth, kettle, and the kindness o\' the stove.',
      /** Gran's opening greeting when the scene fades in. Still Game hearth. */
      gran_greet: 'Come awa in — the kettle\'s on.',
      /** Back button — exits the croft back to the loadout screen. "Ben" is Scots for inward, so we stay outward-facing with "the door". */
      back: 'BACK TAE THE DOOR',
      actions: {
        /** Primary action — starts a fresh run (via Curse picker). Hearth voice. */
        start_run: 'OOT THE DOOR',
        /** Shop sub-view — Gran\'s sporran holds the meta upgrades. */
        shop: 'GRAN\'S SPORRAN',
        /** Chronicle sub-view — the herd album lives on the mantelpiece. */
        chronicle: 'THE ALBUM',
        /** Settings sub-view — the wireless prop wires to the settings panel. */
        settings: 'THE WIRELESS',
      },
      /**
       * T404 — small "{seen}/{total} bested" chip rendered under the
       * bookshelf hit-zone so the player sees their Almanac progress at
       * a glance. Hidden when no beasties seen so the chip never reads
       * as "0 / N" nag. Kept short — it sits next to the diegetic prop.
       */
      almanac_chip: '{seen} / {total} kent',
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
      /**
       * Task 10 — explicit "act reached" chip on the run sub-line.
       * Derived from `1 + routes.length` (capped at 3), shown only when
       * the player crossed at least one picker (act ≥ 2). Parity with
       * the pause-panel `ui.pause.stats_act` radiator line: same Edge
       * voice (terse, scannable), but rendered inline as a chip rather
       * than a full "Act {act} of 3" line because the chronicle row is
       * already dense with weapons/bosses/combo segments.
       */
      run_act_reached: '↟ Act {act}',

      // W2 Moor Road log — appended to run rows that hit a picker.
      moorRoad: {
        title: 'Moor Road log',
        empty: 'Ye\'ve no picked a road yet. Head out, choose wisely.',
      },

      // ── Actions ──
      back: 'BACK',
      prev: '< PREV',
      next: 'NEXT >',
      name_prefix: '{name}',
      /** Top-right cross-link — takes the player to the Highland Almanac discovery log. */
      view_almanac: '→ Highland Almanac',
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
    almanac: {
      // C1 Highland Almanac — four-book discovery log. Hearth voice.
      title: 'THE HIGHLAND ALMANAC',
      /** Sits under the title — generic scene subtitle. Tab-specific
       *  progress lines live inside each book (M2+). */
      subtitle: 'What the moor has shown ye, pressed intae the pages.',
      // Tab labels — short, shouty, monospace. Match the tonal register
      // of CHRONICLE / DEEDS / LASTING BOONS above.
      tab_beasties: 'BEASTIES',
      tab_weys: 'WEYS',
      tab_finds: 'FINDS',
      tab_banter: 'BANTER',
      /** Placeholder body for tabs that have not yet shipped content. */
      coming_soon: 'Page unturned — the ink\'s still dryin.',
      /** Beasties book — progress pill at the top of the grid. */
      beasties_progress: '{seen} of {total} beasties kent',
      /** Kill-count chip on each cell. Intentionally short — the cell
       *  is ~100px wide so long labels would overflow. */
      beasties_kill_chip: '×{count}',
      /** Weys book — progress pill at the top of the column grid. */
      weys_progress: '{picked} of {total} weys walked',
      /** Pick-count chip on each cell. Cells are narrow; keep it terse. */
      weys_pickcount_chip: '×{count}',
      /** Title shown over a route the player has not yet walked. */
      wey_unknown_title: 'Untrod road',
      /** Lore line shown when the route is still hidden. */
      wey_unknown_lore: 'Not yet walked. The moor keeps the path quiet till ye choose it.',
      /** Finds book — progress pill at the top of the grid. */
      finds_progress: '{acquired} of {total} finds gathered',
      /** Acquire-count chip on each cell. */
      finds_count_chip: '×{count}',
      /** Title + lore shown over an entry the player has not yet acquired. */
      find_unknown_title: 'Hidden find',
      find_unknown_lore: 'Not yet found. Some treasures only the moor can deliver.',
      /** Category badge labels — surface in the expanded detail panel. */
      find_cat_weapon: 'WEAPON',
      find_cat_evolution: 'EVOLUTION',
      find_cat_passive: 'PASSIVE',
      find_cat_permanent: 'LASTING BOON',
      find_cat_relic: 'RELIC',
      /** Banter book — progress pill at the top of the pool list. */
      banter_progress: '{heard} of {total} lines kent',
      /** P2.4 — legend for the ✨ prefix on rare-pool rows (first-time
       *  marks, relic lifted, Burns echo). Sits below the progress total. */
      banter_rare_legend: '✨ — special pools (one-shot lines)',
      /** Per-pool heard-count chip (row chip + expanded panel). */
      banter_heard_chip: '{heard}/{total}',
      /** Shown in the expansion when the pool has no heard lines yet. */
      banter_none_heard: 'Nae lines yet — keep walkin.',
      /** Shown when heard lines overflow the inline display cap. */
      banter_more_heard: '… an {count} mair ye\'ve heard',
      /** Shown when unheard teaser rows overflow the inline display cap. */
      banter_more_unheard: '… an {count} mair waitin tae be heard',
      /** Tone pill labels surfaced in the expanded panel. */
      banter_tone_hearth: 'HEARTH',
      banter_tone_edge: 'EDGE',
      /** Pool labels + trigger hints. Hints fall back in-code if a leaf
       *  is missing (see `buildBanterDetail.HINT_FALLBACK`); labels use
       *  a title-cased context fallback. */
      banter_pool: {
        first_time: { label: 'First-Time Marks', hint: 'Fires the first time ye cross a milestone.' },
        boss_warn: { label: 'Boss On Approach', hint: 'Fires when a boss is on the horizon.' },
        low_hp: { label: 'Last Gasp', hint: 'Fires when yir hide\'s thin.' },
        boss_down: { label: 'Boss Felled', hint: 'Fires when a boss drops.' },
        weapon_evolve: { label: 'Evolution', hint: 'Fires when a weapon graduates tae its legendary form.' },
        level_up: { label: 'Level Up', hint: 'Fires on level up.' },
        curse_start: { label: 'Curse at the Door', hint: 'Fires when ye pick a curse at the Croft.' },
        first_blood: { label: 'First Blood', hint: 'Fires on the first kill of a run.' },
        kill_streak: { label: 'Killstreak', hint: 'Fires when the culls stack up.' },
        recover: { label: 'Recover', hint: 'Fires when ye claw health back.' },
        biome_change: { label: 'Biome Shift', hint: 'Fires when the moor shifts beneath ye.' },
        moor_moment: { label: 'Moor Moment', hint: 'Fires when the moor offers a painted beat.' },
        idle: { label: 'Idle', hint: 'Fires in quiet stretches.' },
        act_intermission_enter: { label: 'Moor Road Opens', hint: 'Fires when an intermission opens.' },
        act_complete: { label: 'Act Closed', hint: 'Fires when an act closes oot.' },
        route_picked: { label: 'Route Picked', hint: 'Fires when ye choose a road.' },
        gran_commentary: { label: 'Gran\'s Wink', hint: 'Fires when Gran hovers at the edge o\' the run.' },
        death_reflection: { label: 'Death Reflection', hint: 'Fires on the death screen.' },
        haggis_ambient: { label: 'Wee Monologues', hint: 'Fires while the beastie trots between scraps.' },
        burns_citation: { label: 'Burns Echo', hint: 'Fires when a moment echoes a Burns line.' },
        reliquary_pick: { label: 'Relic Lifted', hint: 'Fires when ye lift a curio fae the moor.' },
        enemy_ambient: { label: 'Beastie Brush', hint: 'Fires when a specific beastie wanders close.' },
        cailleach_whisper: { label: 'Cailleach\'s Whisper', hint: 'Fires when the Winter Queen leans in close.' },
        seasonal_event: { label: 'Feast-Day', hint: 'Fires when a feast-day touches the moor.' },
      },
      back: 'BACK',
    },
    loadout: {
      subtitle: 'Drift, scrape through, bank gold, come back bolder. The herd believes in ye.',
      stats_hint: 'Deed-unlocked variants are sidegrades — same heart, new tricks. Golden haggis still fuels the long-game shop.',
      /** H1 T7 — the primary menu button now carries the player to Gran's Croft rather than straight to the run. Keep voice Hearth (Still Game). */
      play: 'AWA TAE GRAN\'S',
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
      /** P3.7 — legend for the tier-pip row on each item; explains the
       *  empty-square stack so new players don't read it as rarity. */
      tier_pip_legend: 'pips = tiers owned',
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
      /** Phase B Endless — toast when the moor reshuffles every 3 min post-bell. */
      post_bell_reseed: 'The moor shifts beneath ye.',
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
      /** Small amber eyebrow above the variant chip on the result screen — identity celebration. */
      this_run_eyebrow: 'THIS RUN',
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
      /** "Back to the hub" — post-T9 leads to CroftScene, not MainMenu. Hearth voice. */
      menu: 'TAE GRAN\'S',
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
      // ── Postcard footer labels (W18 Phase B — localized render). ──
      // These ride the exported PNG's summary strip; each label fronts
      // the next field so a Scots postcard reads "culls 432" instead of
      // "kills 432". Templates use {clock} / {curse} interpolation so
      // the utility stays locale-agnostic.
      postcard_time_label: 'time',
      postcard_kills_label: 'kills',
      postcard_seed_label: 'seed',
      postcard_outcome_victory: '✦ VICTORY',
      postcard_outcome_fell: 'FELL',
      postcard_ironmoor_tag: '⚔ Ironmoor',
      postcard_past_bell: '🔔 +{clock} past the bell',
      postcard_curse_tag: '☠ {curse}',
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
      save_frame: 'Save frame',
      save_clip: 'Save clip',
      copy_frame: 'Copy frame',
      name_framing: {
        death: 'Here lies {name}.',
        victory: '{name} walked home.',
      },
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
      /** A1 M6 — Assist Mode section. Master toggle + four sub-settings.
       *  Effects themselves land in a future update — the rows persist
       *  prefs today so settings carry forward when the wiring arrives. */
      section_assist: 'Assist Mode (coming soon)',
      /** Tiny heading on the live-preview card above slider changes. */
      preview_heading: 'PREVIEW',
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
      /** A1 M5 — strict photosensitivity posture. Hard-caps flash alpha
       *  at 0.4, floors flash duration at 200ms, clamps haar density at
       *  0.4 with maximum ramp stretch. Stronger than motionScale alone. */
      reduce_flashing: 'Reduce flashing (photosensitivity)',
      /** Run telemetry — end-of-run only, no PII; copy must stay anonymous-forward. */
      telemetry_opt_in: 'Share anonymous run-end stats (opt in)',
      high_contrast_ui: 'High-contrast UI',
      /** On-screen captions for critical audio cues (boss warnings,
       *  low HP, evolution ready, combo milestones, death, victory). */
      captions: 'Captions',
      /** A1 M4 — caption text size multiplier (80%–140%). Independent of
       *  uiScale so players can enlarge captions without rescaling the HUD. */
      caption_text_scale: 'Caption size',
      /** A1 M2 — colorblind LUT mode. Simulation matrices for design
       *  audits + monochrome for real severe-deficit accommodation. */
      colorblind_mode: 'Colour mode',
      colorblind_off: 'Off',
      colorblind_protanopia: 'Protanopia',
      colorblind_deuteranopia: 'Deuteranopia',
      colorblind_tritanopia: 'Tritanopia',
      colorblind_monochrome: 'Monochrome',
      /** E1 M4 — opt-out for real-world-date-gated seasonal events. */
      disable_seasonal_events: 'Disable seasonal events',
      /** Round 2 hazards — opt-out for dynamic biome hazards. */
      disable_hazards: 'Disable biome hazards',
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
      /** H1 speedrun timer: centisecond HUD precision (M:SS.cc) instead of the calm M:SS. */
      speedrun_timer: 'Speedrun timer (centiseconds)',
      /** W18 language cycle row. Scots overlay falls back to en silently. */
      language: 'Language',
      locale_en: 'English (Glesga)',
      locale_scs: 'Scots',
      /** Reset-to-defaults row label + action chip text. Restores every comfort setting in one click. */
      reset_defaults: 'Reset to defaults',
      reset_action: 'RESET',
      /** W66 Ironmoor opt-in ceremony — shown when player flips the toggle OFF→ON. */
      ironmoor_confirm_title: 'Ye sure, big yin?',
      ironmoor_confirm_body: 'Ironmoor is ONE LIFE. Nae Second Wind, nae revives. Die once — ye walk tae the menu. The wee ⚔ badge marks yer Chronicle row for ever. Switch it aff any time before ye start.',
      ironmoor_confirm_yes: 'Aye, I\'m ready',
      ironmoor_confirm_no: 'Naw, cancel',
      capture_enabled: 'Capture enabled',
      /** A1 M6 — Assist Mode master toggle. Turning it on reveals the
       *  sub-settings below; effects arrive in a follow-up update. */
      assist_mode: 'Assist Mode',
      /** Slider: global gameplay speed under Assist Mode (50%–100%). */
      assist_mode_speed: 'Game speed',
      /** Toggle: longer invulnerability after a hit. */
      assist_mode_extended_iframes: 'Extended post-hit invulnerability',
      /** Toggle: longer grace before the combo counter drops. */
      assist_mode_extended_combo: 'Extended combo grace',
      /** Toggle: full invincibility. Biggest hammer in the box. */
      assist_mode_invincibility: 'Invincibility',
      /** Preset row labels — single cycling row replaces individual sub-toggles
       *  in the live UI. Off → Timing → Invincibility. Game speed stays hidden
       *  pending replay-determinism wiring (see A1_ASSIST_MODE_CALLSITES.md). */
      assist_mode_preset_off: 'Off',
      assist_mode_preset_timing: 'Timing help',
      assist_mode_preset_invincible: 'Invincibility',
    },
    /** A1 M3 — key + gamepad remapping scene copy. Hearth register. */
    inputRebind: {
      title: 'Controls',
      subtitle: 'Bind every action yer own way. Click a slot to capture a new key.',
      unbound: '—',
      unbound_a11y: 'unbound',
      gamepadPrefix: 'Pad',
      rebind_hint: 'Press any key tae set. ESC cancels.',
      conflict_warning: 'That key already binds another action.',
      reset_defaults: 'Reset to defaults',
      back: 'Back',
      action: {
        moveUp: 'Move up',
        moveDown: 'Move doon',
        moveLeft: 'Move left',
        moveRight: 'Move right',
        dash: 'Dash',
        pause: 'Pause',
      },
      /**
       * T407 adoption #5 — screen-reader-only strings for the DOM focus
       * mirror. The visible Phaser chips already render the binding code
       * directly; the mirror folds these descriptors into a single label
       * (e.g. "Move up — primary keyboard — W") so a screen reader hears
       * the full row in one breath. `{row}` is substituted with the
       * composed action + slot + kind during a live capture.
       */
      a11y: {
        slot_primary: 'primary',
        slot_secondary: 'secondary',
        kind_keyboard: 'keyboard',
        kind_gamepad: 'gamepad',
        capture_keyboard: 'Press a key for {row}. Escape to cancel.',
        capture_gamepad: 'Press a button for {row}. Escape to cancel.',
      },
    },
    /**
     * A1 M5 — first-launch photosensitivity warning splash. Shown once
     * on fresh save, dismissed forever via the "I understand" button
     * (flag `photosensitivityWarningSeen` in SettingsManager). Voice
     * stays in the Hearth register — safety-critical copy is warm,
     * direct, and avoids both sterile disclaimer tone and Limmy edge.
     */
    photosensitivity: {
      title: 'A wee word before ye start',
      body: 'This game has flashing lights, rapid motion, and bright colour. If ye or someone near ye has had photosensitive seizures, turn on Reduce Flashing in Settings before ye play — it caps flashes and slows motion. Ye can change it any time.',
      hint: 'Settings → Accessibility → Reduce flashing',
      dismiss: 'I understand',
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
    /**
     * Reliquary — single rare pickup, placed off-path between 6:00 and
     * 12:00. Grants one run-scoped curio on touch.
     */
    /** R1 M4 — discard modal copy when sporran is full + relic drop-roll toast shell. */
    relics: {
      sporran_full: {
        title: 'Sporran\'s full',
        hint: 'Pick one to let go, or skip the new relic.',
        keep_new: 'Click a held relic to swap, or here to skip',
        keep_new_short: 'Skip new relic',
        discard: 'Let this go',
      },
    },
    reliquary: {
      grant_toast: '⟡ A relic hums — {title}.',
      grant_caption: '{desc}',
      echoing_reed: {
        title: 'Echoing Reed',
        desc: 'A reed thrums low — pickups drift wider toward ye.',
      },
      flint_charm: {
        title: 'Flint Charm',
        desc: 'The charm strikes warm — yir blows bite crit a shade more.',
      },
      cairn_moss: {
        title: 'Cairn Moss',
        desc: 'Moss cool underfoot — the moor mends ye steady.',
      },
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
      /** Post-cap echo pick banner — the moor keeps giving past max level. */
      echo_title: 'Moor Echo',
      echo_sub: 'The land remembers ye — pick what it whispers.',
    },
    /**
     * Pre-Run First-Footing — Hogmanay seasonal hook (DESIGN_IDEAS §1).
     * Toast fires 1.5 s after run start when the date sits inside the
     * Hogmanay window (Dec 28 – Jan 3). Each gift carries a small
     * mechanical boon (see `firstFooting.ts` mapping) plus the line
     * here. Hearth-warm tone — the visitor across the threshold is a
     * promise, not a stranger.
     */
    firstFooting: {
      toast: {
        shortbread: 'A first-footer at the door — shortbread for the year. +20 HP.',
        whisky: 'A first-footer at the door — whisky for the year. The moor breathes slower.',
        coal: 'A first-footer at the door — coal for the hearth. Less of the cold tae bite.',
        silver: 'A first-footer at the door — silver in the hand. Gold flows kinder.',
      },
    },
    /**
     * Beltane Twin-Fire Blessing — Apr 28 – May 4 seasonal hook
     * (DESIGN_IDEAS §1; SCOTTISH_RESEARCH.md fire-festival entry).
     * Single fixed blessing — heal 15 HP + +10% goldMult — paired
     * with this Hearth-warm announcement.
     */
    beltane: {
      blessing_toast: 'Through the twin fires — purified for the season. +15 HP, gold flows kinder.',
    },
    /**
     * Samhain Veil — Oct 28 – Nov 3 seasonal hook (DESIGN_IDEAS §1;
     * SCOTTISH_RESEARCH.md veil-thinning entry). The dead come closer;
     * the bonfires hearten. +25 HP heal, slightly busier waves.
     */
    samhain: {
      blessing_toast: 'The veil thins — bonfires hearten the herd. +25 HP, but the dead come faster.',
    },
    /**
     * St Andrew's Saltire — Nov 27 – Dec 3 seasonal hook. National-day
     * defensive blessing — +20 HP heal, damage taken reduced 5%. The
     * saltire deflects the worst hits.
     */
    standrews: {
      blessing_toast: 'Saltire over the moor — saint\'s hand on the brow. +20 HP, hits land softer.',
    },
    /**
     * Burns Night Bardic Blessing — Jan 18 – Feb 1 seasonal hook.
     * The bard of haggis quickens the verse — +18 HP heal,
     * weaponCooldownMult ×0.95. Coexists with the Burns's Wee Beastie
     * variant unlock that gates on full-evo runs in this window.
     */
    burnsNight: {
      blessing_toast: 'Address to the haggis read aloud — the bard quickens the verse. +18 HP, weapons fire keener.',
    },
    /**
     * Imbolc Brigid Blessing — Feb 2 – Feb 8 seasonal hook
     * (DESIGN_IDEAS §12; SCOTTISH_RESEARCH §1 Brigid / Brìde).
     * Brigid's mantle warms the haggis; lambing-season energy
     * carries her hooves. +12 HP heal, moveSpeedMult ×1.05.
     */
    imbolc: {
      blessing_toast: 'Brìde\'s mantle warms ye — first stir of spring. +12 HP, hooves a wee bit quicker.',
    },
    /**
     * Lùnastal / Lammas Harvest Blessing — Jul 29 – Aug 4 seasonal
     * hook (DESIGN_IDEAS §12; SCOTTISH_RESEARCH §1 Lùnastal,
     * SCOTTISH_RESEARCH_DEEP §13.4 Lammas / loaf-mass). The loaf is
     * broken at the cairn and shared. +14 HP heal, +10% additive XP
     * multiplier — the harvest cuts cleaner.
     */
    lammas: {
      blessing_toast: 'Loaf-mass at the cairn — Lugh\'s harvest opens. +14 HP, every gem reads a wee bit richer.',
    },
    /**
     * Cu Sith Three-Bay Warning toasts (DESIGN_IDEAS §1; SCOTTISH_
     * RESEARCH §1.2). Fires from `wireSceneEventBus` on the
     * `CU_SITH_BAY` global event, throttled to 2.5 s globally.
     */
    cuSith: {
      bay: {
        first: 'A Cu Sith hools across the moor.',
        second: 'Cu Sith — second bay; closer.',
        third: 'Cu Sith — third bay; brace.',
      },
    },
    hud: {
      combo: '{count}× streak{bonus}',
      combo_bonus: ' · +{pct}% wallop',
      level_fmt: 'Lv {level}',
      wave_objective: 'Wave {wave}  •  {goal}',
      /** H1 speedrun split toast fired on boss kills when the timer is on. */
      speedrun_split: 'SPLIT: {time}',
      goal_countdown: 'Goal {time}',
      goal_finale: 'Finale',
      /** W2 Moor Road chip — shown under the curse chip once the player has cleared an act. */
      act_chip: '— Act {act} —',
      /** W66 Ironmoor chip — shown when single-life mode is on. */
      ironmoor_chip: '⚔ IRONMOOR',
      /** P2.12 — daily-mode reminder. Persistent for the whole run. */
      daily_chip: '☀ DAILY · {seed}',
      kills_enemies: 'Kills: {kills}  Enemies: {count}{suffix}',
      /** P1.8 — compact mobile single-line variant. Used below 600 px so
       *  the right-aligned readout stays one line clear of the dash row. */
      kills_enemies_compact: 'K:{kills} · E:{count}{suffix}',
      enemies_capped_suffix: ' MAX!',
      dash_label: 'Dash ',
      dash_ready: 'ready',
      dash_cooldown_pct: '{pct}%',
      /** W95 — visible right-zone tap hint shown on touch-primary devices
       *  until the player taps the dash zone for the first time. */
      dash_zone_hint: 'TAP TAE DASH',
      /** Rolling 1s window — same meter as HUD damage log, not kill streak. */
      dps_line: 'DPS (1s): {dps}',
      /** Shown under the wave objective when the run started with a curse. */
      curse_chip: 'Curse: {name} (+{pct}% gold)',
      /** M1 F3 — mid-run gold balance shown under the level readout. */
      gold_chip: '{gold}g',
    },
    /** T1 replay playback UI. */
    replay: {
      /** Toast shown at the start of a replay so it's clear this isn't a live run. */
      watching_toast: 'Watching replay · recorded run',
      /** Tooltip on the Chronicle "watch" button for v1 (seed-only) blobs. */
      chronicle_watch_tooltip: 'Watch this run · seed-only (best-effort)',
      /** Tooltip for v2 (HD) blobs — curse + routes + composed stats locked in. */
      chronicle_watch_tooltip_hd: 'Watch this run · HD (curse + stats locked)',
      /** Glyph for the Chronicle watch button on v1 blobs. */
      chronicle_watch_glyph: '▶',
      /** Glyph for v2 (HD) blobs. Superscript 2 flags the HD payload. */
      chronicle_watch_glyph_hd: '▶²',
      /** Persistent HUD chip shown throughout playback. Top-left corner. */
      hud_chip: '▶ REPLAY',
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
      /** T402 — Moor Road act marker, shown from act 2 onward. */
      stats_act: 'Act {act} of 3',
      /** T402 — comma-separated route picks resolved this run. */
      stats_routes: 'Routes: {routes}',
      /** T402 — comma-separated held relic labels. */
      stats_relics: 'Sporran: {relics}',
      /** T402 follow-up — variant identity (haggis pick) shown above the
       *  act / routes / relics block. Always emitted when the variant is
       *  not the default 'classic' so the radiator shows what made the
       *  run unique. */
      stats_variant: 'Variant: {variant}',
      /** T402 follow-up — comma-separated owned rune labels. Empty
       *  collections omit the line. */
      stats_runes: 'Runes: {runes}',
      /** Subtle affordance under RESUME — keyboard + gamepad Start. */
      keys_resume: 'ESC / P / Start — resume',
      /** R1 M3 T21 — whisky_dram active-relic button label. */
      whisky_dram_use: 'Sip the Whisky Dram (+20% HP)',
      whisky_dram_drunk: 'Whisky Dram — took the edge off.',
      /** R1 M4.5 P5 — fingals_horn active-relic button + summon toast. */
      fingals_horn_use: 'Sound Fingal\'s Horn (summon the Fianna)',
      fingals_horn_sounded: 'The Fianna rise at your call.',
      passives_heading: 'Curios:',
      /** Pause overlay — reference for gold elite trait names (lines use ui.elite_affix.*). */
      elite_affix_heading: 'Gold elites — traits:',
      save_screenshot: 'Save screenshot',
      save_clip: 'Save last 15s',
      name_header: '{name}',
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
      each_uisge: "Something beautiful by the water. Dinnae touch it.",
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
      boss_killed_each_uisge: 'Oot the water and oot o\' luck. The loch takes its ain.',
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
      upgrade_grant_rune: 'Rune struck: {name} — cairn-chiseled.',
      /** U1 M4 — rune pulse drains. Hearth-with-bite voice. */
      rune_thistle_pulse: 'Thistle pulse — heal blooms ({count}).',
      rune_reroll_grant: 'Rune reroll — try again, dear ({count}).',
      rune_shrine_pulse: 'Shrine echo — wee bonny boost ({count}).',
      rune_thistle_bomb: 'Thistle bomb — purple wallop!',
      rune_lightning: 'Storm rune — chain crack!',
      rune_chest_omen: 'Lucky-streak rune — gold gleam (+50g).',
      upgrade_echo_applied: 'Echo heard — {name}.',
      upgrade_evolve_weapon: 'Legend forged: {name}! Mon then!',
      /** Phase B Endless — Overcharge mythic-tier toast. Edge register. */
      upgrade_overcharge_weapon: 'Overcharged: {name} — pure radge.',
      max_level_toast: 'Max level — yir a walking storm! That\'s plenty.',
      /** Shown when XP converts to gold at max level (batched). */
      xp_overflow_gold: 'Max level — the moor pays in gold: +{gold}g (overflow XP).',
      /** Shown once per account the first time an enemy key is culled — meta codex. */
      codex_first_cull: 'First cull logged: {name} — the herd\'s takin notes.',
      second_wind: 'Second wind — yir no done yet, pal!',
      treasure_nearby: 'Somethin\' glintin\' oot there…',
      treasure_collected: 'Chest cracked — that\'s a feed and a half (+25% HP)',
      /** R1 — relic pickup floating in the world, not yet collected. */
      relic_drop_near: 'A relic hums — walk on oer.',
      /** R1 — relic tucked into the sporran (either first add or a discard-swap). */
      relic_collected: 'Relic tucked intae the sporran.',
      golden_nearby: 'Glimmer o\' gold nearby!',
      golden_collected: 'Golden chest — nice wee earner! +{gold}g',
      /** E1 T10 — Burns Night haggis-platter pickup. */
      burns_platter_nearby: 'Smell that? Haggis on the moor — pipes\'ll be startin soon.',
      burns_platter_collected: 'The bard\'s feast — full belly, quick fists (+30% dmg, 60s).',
      controls_hint: 'WASD to roam  •  SPACE to dash  •  ESC for a breather',
      armor_blocked: '-{amount} dinged off',
      countdown_go: 'MON THEN!',
      gold_pickup_float: '+{gold}g',
      /** Polaroid pickup (DESIGN_IDEAS §11) — tourist drops a snapshot;
       *  the haggis "accepts being photographed" for a wee XP bonus.
       *  String is the float-text shown above the pickup at collect. */
      polaroid_pickup_float: 'Photogenic! +XP',
      /** Second gold elite within the chain window — see `BALANCE.enemy.eliteChain*`. */
      elite_chain_double: 'Back-to-back gold elites! +{gold}g',
      elite_chain_triple: 'Elite hat-trick — the moor pays! +{gold}g',
      /** One-time luck bonus when HP first drops into the mercy band. */
      moor_mercy_luck: 'The moor remembers the desperate — yer draws lean finer!',
      moor_mercy_luck_caption: 'Mercy luck — next level-up cards favour rare finds.',
      /** T131 — surfaced when localStorage.setItem throws (quota / private mode). */
      save_failed: 'The cairn won\'t take it — saving failed ({path}). Yer last steps may not stick.',
      /** T301 — surfaces the auto-picked route name when Skip Intermissions is on. */
      skip_route_picked: 'Moor chose for ye — {route}.',
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
        // Generic-pool expansion (2026-04-29). Five originals + seven
        // fresh = twelve total, comfortably exceeding the no-repeat
        // window (8) so back-to-back boss arrivals never recycle the
        // same warning. Voice register: EDGE per Voice Card — terse,
        // braced-up, hint of dread without melodrama.
        f: 'The corbies stopped callin\'. They ken what\'s up.',
        g: 'Ground\'s shakin\'. Heather\'s tensin\'.',
        h: 'Sun went thin. Wind\'s holdin\' its breath.',
        i: 'Get yer hooves planted. Yer name\'s been spoken.',
        j: 'Whatever\'s comin\' — it doesnae miss.',
        k: 'Aye, that\'s the one ye\'ve been dodgin\' aw run.',
        l: 'Big yin on approach. Naebody ye want tae meet twice.',
        // ── Per-boss character warnings (Limmy bite). Each boss gets
        //    three distinct lines anchored to their fantasy. ──
        gordon: {
          a: 'Heid chef\'s oot fae the kitchen. Brace yersel.',
          b: 'Smell that burnin\'? That\'s Gordon.',
          c: 'Big man wi\' a cleaver. Nae jokin\'.',
        },
        each_uisge: {
          a: 'That horse\'s hooves point backwards. Run.',
          b: 'Beautiful and deadly. The loch always sends the best ones.',
          c: 'Dinnae let it look ye in the eye.',
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
        f: 'Heart\'s thumpin\' like a drum kit.',
        g: 'Wha\'s the eejit on this brae? Me, evidently.',
        h: 'Skin and shoulders — that\'s aw left.',
        i: 'Nae even on the bus hame yet.',
        j: 'Doon tae fumes. Move smart.',
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
        glaswegian: {
          a: 'Right, this is gettin\' ridiculous. Get a grip, eh.',
          b: 'Hoof doon tae the bone. Pure no\' great, this.',
          c: 'Last gasp — make it count or git tae.',
          d: 'Hingin\' by a thread, pal. Pure hingin\'.',
        },
        cailleach: {
          a: 'The moor\'s seen worse. Haud on, aye.',
          b: 'Ancient bones dinnae shatter easy. Survive this.',
          c: 'Tae the veil an\' back — ye\'ve done it afore.',
          d: 'Wee bit o\' blood never stopped the Cailleach.',
        },
        anticlockwise: {
          a: 'Whole world\'s leanin\' the wrong way again.',
          b: 'Every step turns left. Even the hurtin\'.',
          c: 'Widdershins or no, ma ribs felt that.',
          d: 'Gie\'s a tick — ma balance is back-tae-front.',
        },
        doric_quinie: {
          a: 'Sair dunt, min. Haud on noo.',
          b: 'Bowfin, thon. Keep movin.',
          c: 'Doon tae the bone, quinie. Grit teeth.',
          d: 'Ma breest\'s sore. Onwards.',
        },
        peerie_shetlander: {
          a: 'Peerie step noo, du. Wind\'s up.',
          b: 'Skerry teeth bitin\'. Haud tae course.',
          c: 'Keep tee risin\', du. Nae yet.',
          d: 'Voe\'s cold. I\'m caulder. Onwards.',
        },
        // Burns citational — echoes of "To a Mouse". Native-speaker /
        // editorial audit per spec §5 (The Canongate Burns) still pending.
        burns_wee_beastie: {
          a: 'Och, my breastie trembles — sleekit pangs.',
          b: 'The best-laid schemes gang aft agley.',
          c: 'An icy blast has blawn ma hoose awa.',
          d: 'A wee bit blude — still honest, still mine.',
        },
        // Witch's Hare — Isobel Gowdie's confession voice (1662). Sma'
        // bones, hare-quick, witch-eyed. Mystical-impish register.
        witch_hare: {
          a: 'Elf-shot bites. The hare-form stretches.',
          b: 'Sma\' bones complainin\'. Hop yet.',
          c: 'Doune isnae done. The pelt holds.',
          d: 'Sych and meikle care, but no done.',
        },
      },
      boss_down: {
        a: 'Away in a box. Pure textbook.',
        b: 'That\'s him telt.',
        c: 'Lang may yir wee lum reek, ya beauty.',
        d: 'Boss doon — the glen exhales.',
        e: 'Doon — and the moor took notes.',
        f: 'Cleared. Glen breathes again.',
        g: 'A boss is a man wi\' a job. Job\'s done.',
        h: 'Doon swift. Pints later.',
        i: 'Wan less name on the slate.',
        // ── Per-boss celebration (hearth warmth). Victory voice. ──
        gordon: {
          a: 'Telt Gordon where tae stick the cleaver.',
          b: 'Chef\'s oot. Last orders.',
          c: 'Kitchen\'s closed. Yer welcome.',
        },
        each_uisge: {
          a: 'Ye resisted the beautiful thing. That\'s the hardest skill.',
          b: 'Braw. Even the deep water kenned that was over.',
          c: 'Horse is doon. No\' a horse.',
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
        e: 'The thing has woken up.',
        f: 'That\'s no a weapon noo. That\'s a verdict.',
        g: 'Heard the moor say "aye". Heard masel say it back.',
        h: 'Legend in yer haunds. Mind the grip.',
        i: 'Aye, that\'ll dae nicely.',
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
          e: 'Auld powers stirred. They\'ll get theirs.',
          f: 'Strong stuff, that. Heather notices.',
          g: 'Crossed the threshold willingly. Brave or daft.',
          h: 'A pact under stane and turf. Mind the terms.',
          i: 'Rune-ink barely dry — the moor accepts.',
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
        glaswegian: {
          a: 'Sharper, aye. Pure sharper.',
          b: 'Levellin\' up — the toon taught ye well.',
          c: 'Anither notch, anither grudge.',
          d: 'That\'s new muscle. Use it or lose it.',
        },
        cailleach: {
          a: 'Centuries o\' practice — and still learnin\'.',
          b: 'Wiser, elder, braw-er.',
          c: 'The moor shapes ye, aye. Keep growin\'.',
          d: 'Auld bones, new power. Guid.',
        },
        anticlockwise: {
          a: 'Aye, gettin\' the turn o\' it.',
          b: 'Left is right noo. Right is new.',
          c: 'Ma legs found the pattern.',
          d: 'The glen keeps its ain time. So dae I.',
        },
        doric_quinie: {
          a: 'Braw, thon. Fit\'s next, min?',
          b: 'Aye — the glen learns ye.',
          c: 'Stronger the day. Fit we work for.',
          d: 'Fit like, a level up. Braw.',
        },
        peerie_shetlander: {
          a: 'Stronger, du. The wind kens.',
          b: 'Peerie gains stack. Aye, mirry.',
          c: 'Learnt the skerry. The ocean taught me.',
          d: 'Up again. Like the tide, du.',
        },
        burns_wee_beastie: {
          a: 'Gie me ae spark o\' Nature\'s fire!',
          b: 'Risin\' — the bard smiles.',
          c: 'A man\'s a man for a\' that — an\' so\'s a haggis.',
          d: 'Honest growth. Sonsie at last.',
        },
        witch_hare: {
          a: 'Anither leap learnt by hare.',
          b: 'The covine kens. Ye grow.',
          c: 'I sall gae intill ane haire — bigger this time.',
          d: 'Auldwife Isobel proud. Ye\'re ridden far.',
        },
      },
      first_blood: {
        a: 'First yin doon. Off ye trot.',
        b: 'Hoof prints in the heather. Game on.',
        c: 'That\'s the ice broken.',
        d: 'First notch on the moor — ink\'s still wet.',
        e: 'Wan oot the road. Plenty mair tae go.',
        f: 'Tally opens. Slate willnae stay clean lang.',
        g: 'Aye — feet remember the moves.',
        h: 'Drew first blood; the bracken takes notes.',
        i: 'Started weel. Continue.',
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
        glaswegian: {
          a: 'First yin doon. Straight up, nae messin\'.',
          b: 'Right, game on. That wan was for starters.',
          c: 'One doon. Plenty mair tae go, pal.',
          d: 'Clean hit. Let\'s get intae it.',
        },
        cailleach: {
          a: 'First blood — the moor remembers this moment.',
          b: 'She\'s stirred. Best they didnae wake her.',
          c: 'Ancient grudge, first settled. Aye.',
          d: 'Tae the glen — this yin belongs tae the Cailleach noo.',
        },
        anticlockwise: {
          a: 'First o\' them. Left-handed, same as me.',
          b: 'Caught that wan comin\' the other way.',
          c: 'Ma drift met its match.',
          d: 'Widdershins means forward — so it does.',
        },
        doric_quinie: {
          a: 'First doon, min. Aye.',
          b: 'Fit like, pal? Tae the bottom wi ye.',
          c: 'That\'s thon settled, quinie.',
          d: 'Caught wan — same as ma grandfaither wid.',
        },
        peerie_shetlander: {
          a: 'First wan doon. Sea gave.',
          b: 'Caught aff the lee side. Peerie quick.',
          c: 'Ower the gunnel wi yon. Done.',
          d: 'Aye, du. The harvest begins.',
        },
        burns_wee_beastie: {
          a: 'First doon — fair fa\' yir honest face!',
          b: 'Thou need na start awa sae hasty.',
          c: 'Scots, wha hae — an\' taken first blood.',
          d: 'Auld lang syne begins wi\' a cull.',
        },
        witch_hare: {
          a: 'First blood for Isobel\'s wirds.',
          b: 'The hare-form bites first.',
          c: 'Coursed it. Ane doon.',
          d: 'Sma\' but wickit.',
        },
      },
      kill_streak: {
        a: 'Pure mental, this.',
        b: 'Ye\'re on fire, wee man.',
        c: 'Cannae stop, will nae stop.',
        d: 'The glen\'s tremblin\'.',
        e: 'Combo\'s a ceilidh — naebody leaves early.',
        f: 'Pure dancin\' — feet kent the steps.',
        g: 'Chef\'s in the kitchen noo.',
        h: 'Could dae this aw day, mind ye.',
        i: 'Moor\'s a wee bit lighter the noo.',
        j: 'Got the rhythm — a Limmy Sunday.',
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
        glaswegian: {
          a: 'That\'s a streak, by the way.',
          b: 'Stackin\' them up like empties.',
          c: 'Every one\'s gettin\' it. Aye.',
          d: 'Keep gaun — ye\'re pure on it.',
        },
        cailleach: {
          a: 'The moor harvests its own. Carry on.',
          b: 'Aye, they fall. As all things dae, eventually.',
          c: 'Streak like winter — lang an\' relentless.',
          d: 'She\'s been at this since afore yer gran was born.',
        },
        anticlockwise: {
          a: 'Round an\' round they go. Other way, mind.',
          b: 'They reckoned wi\' clockwise. Joke\'s on them.',
          c: 'Left, left, left — aye, the left\'s havin\' it.',
          d: 'The whole glen\'s spinnin\' backwards the noo.',
        },
        doric_quinie: {
          a: 'Aye, min, they\'re droppin.',
          b: 'Jist like haulin nets — pull steady.',
          c: 'Thon\'s a braw count. Keep an een on the line.',
          d: 'Fishin\'s fine the day, quinie.',
        },
        peerie_shetlander: {
          a: 'Rowin\' steady, du. They fall.',
          b: 'Peerie blades, mony o them.',
          c: 'Like herring runs — mass comes, mass goes.',
          d: 'The voe runs red. Braw ebb.',
        },
        burns_wee_beastie: {
          a: 'Canny, canny — the streak minds itsel.',
          b: 'A man\'s a man, an\' this man\'s on fire.',
          c: 'Sonsie an\' stern — the moor submits.',
          d: 'Coortin\' lichtnin\', ilka stroke sure.',
        },
        witch_hare: {
          a: 'Coursing the moor like Auldearn.',
          b: 'Twelve and ane — the covine\'s count.',
          c: 'Hare-feet, hare-heart, hare\'s tally.',
          d: 'The auld dance — kill, leap, kill again.',
        },
      },
      recover: {
        a: 'Back fae the brink. Deep breath.',
        b: 'Still here. Still kickin\'.',
        c: 'Steady the heid. Yer awright.',
        d: 'Colour back — the moor relents.',
        e: 'Back tae the world o\' the livin\'.',
        f: 'Gran wid say "telt ye". She\'d be right.',
        g: 'Wheesht — that wis ower close.',
        h: 'Maw aye said the haggis bounces back.',
        i: 'Knees creak. Heid clears. Onwards.',
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
        glaswegian: {
          a: 'Back fae the brink. Respect.',
          b: 'Stitched up. Back oan it.',
          c: 'Pulled it oot the bag. No\' deid yet.',
          d: 'Alive. Barely. Dinnae waste it.',
        },
        cailleach: {
          a: 'The moor heals its ain. Aye.',
          b: 'She\'s weathered worse. Back on hoof.',
          c: 'Ancient body, ancient mend. Slow but sure.',
          d: 'Roots hold — even in the bleakest glen.',
        },
        anticlockwise: {
          a: 'Breathin\' easier. Still the wrong way, mind.',
          b: 'Feet back under me. All four pointin\' left.',
          c: 'Ma heart kent the turn.',
          d: 'Back tae it, widdershins an\' all.',
        },
        doric_quinie: {
          a: 'Back tae the hale o\' it. Braw.',
          b: 'Hale again. Fit a relief, eh.',
          c: 'Ken ma legs again. Aye.',
          d: 'Fisher-family constitution, thon.',
        },
        peerie_shetlander: {
          a: 'Breath back. The sea took nae yet.',
          b: 'Peerie wounds knit. Crofter tough.',
          c: 'Hale again, du. Mirry noo.',
          d: 'Northern bones mend. Carry on.',
        },
        burns_wee_beastie: {
          a: 'Nae man can tether time or tide — but breath returns.',
          b: 'Blude warm again, heid clear.',
          c: 'An honest recovery — sonsie noo.',
          d: 'Thou\'rt blessed — breath is lent, not owed.',
        },
        witch_hare: {
          a: 'Hom again, sma\' an\' hale.',
          b: 'The pelt mends. Auldwife\'s herbs.',
          c: 'Even the witch sleeps a wee.',
          d: 'Eldritch herbs ower the wound. Awa wi\' it.',
        },
      },
      biome_change: {
        a: 'Different smell tae the air here.',
        b: 'New bit o\' moor. Watch yer step.',
        c: 'The terrain\'s shiftin\'.',
        d: 'Postcode changed — same attitude.',
        e: 'Hooves notice afore the heid does.',
        f: 'Land\'s humming a different tune.',
        g: 'New ground — same haggis, same drift.',
        h: 'The moor changes its mind every furlong.',
        i: 'Mind tha switch. Mind tha smell.',
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
        g: 'A kind hour in the middle of a hard day.',
        h: 'The moor blinks — ye caught it payin\' mind.',
        i: 'Wee grace, nae strings. Tak it.',
        j: 'A gift the wind didnae bother signin\'.',
        k: 'Somewhere a thrush decided ye deserved a note.',
        l: 'The ground kept a warm spot for ye.',
        m: 'Lichen\'s pointed the way — polite, that.',
        n: 'Even the midgies took a breather. Rare.',
        o: 'A stone yielded — the moor makes exceptions.',
        p: 'Yon sky leaned doon an\' said well dune.',
        q: 'A clearin\' opens — briefly. Dinnae waste it.',
        r: 'Cauld air, bright gift. Fair exchange.',
        s: 'The day found a loose thread — pulled it lucky.',
        t: 'The moor\'s in a generous mood. Rare weather.',
        u: 'A rook laughed — in yer favour, this time.',
        v: 'Fog parted enough fer a wee boon.',
        w: 'Yer shadow came back smilin\'. Odd, that.',
        x: 'The grass rememberin\' yer steps. Kind.',
        y: 'Thistle moved — pointed ye at fortune.',
        z: 'The glen tipped a pocket empty fer ye.',
        home_bog: {
          a: 'Standin\' in the squelch — the peat pays interest.',
          b: 'Bog kin — the mud remembers yer name.',
          c: 'Deep peat blessing. Yer boots earned it.',
          d: 'Kin rates — squelch discount applied.',
          e: 'Hame peat hummed — kent yer weight, gave a gift.',
          f: 'Squelch pledge — the bog picks favourites, ya lucky dunter.',
        },
        home_loch: {
          a: 'Loch glass — the water tipped ye a favour.',
          b: 'Shore gift: the deep disnae charge interest.',
          c: 'Yir reflection smiled back. Briefly.',
          d: 'Home water — nae strangers at this shore.',
          e: 'Home ripple — the water read yer heart, paid fair.',
          f: 'Loch kin tithe — a whisper fer the known boots.',
        },
        home_pine: {
          a: 'Needle kin — the wood leans yer way.',
          b: 'Sap on the wind — that\'s a pine handshake.',
          c: 'Forest tithe: paid in kindness.',
          d: 'Needle kin — bark remembers the old songs.',
          e: 'Home wood cracked a branch — nae warnin\', a nod.',
          f: 'Pine kin rate — reduced tariff fer the familiar.',
        },
        home_heather: {
          a: 'Bloom kin — the purple hush held ye tight.',
          b: 'Heather tithe: soft ground, sharp fortune.',
          c: 'Open sky tithe — nae roof but plenty heart.',
          d: 'Purple kin — wind off the tops knows yer name.',
          e: 'Hame bloom knelt — crown fer the rightful.',
          f: 'Purple home — the tops added interest this time.',
        },
        bog: {
          a: 'Squelch brought luck — bog\'s generous the day.',
          b: 'Peat air, lucky air.',
          c: 'Mud kissed yer boots — say thank ye.',
          d: 'Peat settled softer round yer feet — decision, that.',
          e: 'A reed bent the right way, free o\' charge.',
          f: 'Marsh gas o\' luck — dinnae ask questions.',
        },
        loch: {
          a: 'Water luck — even dry boots get a splash.',
          b: 'Ripple paid ye — nae receipt.',
          c: 'Loch winked — naebody else saw it.',
          d: 'Still water held a coin fer ye — nae explanation.',
          e: 'Wave turned backwards. The loch cheats kindly.',
          f: 'Lochside luck — earned the deep\'s approval.',
        },
        pine: {
          a: 'Shadow luck — the trees shared a crumb.',
          b: 'Sap-stained fortune. Guid.',
          c: 'Bough nodded — contract sealed.',
          d: 'Cone fell at yer feet — forest pension.',
          e: 'Resin kept a secret, then telt ye.',
          f: 'Under the needles — the wood skimmed some off fer ye.',
        },
        heather: {
          a: 'Wind off the tops — carried a coin o\' cheer.',
          b: 'Purple hour — the moor tipped its hat.',
          c: 'Tops gave a whisper — listen close.',
          d: 'Purple held its breath — then breathed fortune at ye.',
          e: 'Ridge wind threw ye a wee parcel.',
          f: 'Tops tilted — the hill had yer back the day.',
        },
      },
      // ── Gran's commentary (B1 Phase 2). Hearth — Gran-voice: elder
      //    warmth *about* the run. Keep lines short and tender. Never
      //    shaming, especially in the defeat sub-pool (per DESIGN_SOUL
      //    Warmth Audit). Generic pool is the fallback when no tag is
      //    passed; tagged sub-pools cover the four spec §3 triggers:
      //    run_start, run_end_victory, run_end_defeat, moor_moment,
      //    seasonal_event.
      gran_commentary: {
        a: 'Kettle\'s on, hen. Back in a wee while.',
        b: 'Mind yersel\' oot there.',
        c: 'Granny\'s watchin\'. Take yer time.',
        d: 'Aye, yon haggis is farin\' braw.',
        e: 'Come awa\' in when yer ready.',
        f: 'The moor\'ll keep. So will the tea.',
        g: 'Yer grandpa\'d be fair chuffed.',
        h: 'Haud steady, wee yin.',
        i: 'Ma da used tae say — ah, never mind.',
        j: 'Yer ma\'d be greetin and laughin both.',
        k: 'There\'s tatties in the larder. Dinnae forget.',
        l: 'Mind ye eat afore the trail. Marches on its stomach.',
        run_start: {
          a: 'Aff ye go, bonnie. I\'ll keep the fire lit.',
          b: 'Heather\'s oot bonnie this mornin\' — gan cannie.',
          c: 'Nae rush. The moor\'ll wait fer ye.',
          d: 'Pack the warm in yer belly, wee yin.',
          e: 'Wind\'s fair gentle the day. Lucky lass.',
          f: 'Yer boots are dry. Best time tae run.',
          g: 'Gie it laldy — I\'ll put the scone on.',
          h: 'Mind the fairies — dinnae stare back.',
        },
        run_end_victory: {
          a: 'Come awa\' in, champion. Kettle\'s singin\'.',
          b: 'Proud as a peacock on a thistle.',
          c: 'Ye fair lit up the moor the day.',
          d: 'Naebody\'s eaten like this since yer grandpa.',
          e: 'Aw, the bonniest run. Sit yersel\' doon.',
          f: 'That\'s ma hen. Feet up by the fire.',
        },
        run_end_defeat: {
          a: 'Come awa\' in. Blanket\'s warm.',
          b: 'Nae matter, wee yin. The moor\'ll be there the morn.',
          c: 'Ye did grand. Really, ye did.',
          d: 'Every brave haggis taks a breather. Coorie in.',
          e: 'Saved ye a scone. It\'s no goin\' anywhere.',
          f: 'Rest, bonnie. The glen forgives.',
        },
        moor_moment: {
          a: 'See yon peat-glint? Yer grandpa loved that.',
          b: 'The heather\'s pure purple — wee miracle, that.',
          c: 'Bog smells like hame the day, eh?',
          d: 'Kite\'s callin\'. Means rain soon.',
          e: 'Distant sheep lookin\' fair smug.',
          f: 'Wind through the pines — that\'s a lullaby.',
        },
        seasonal_event: {
          a: 'It\'s that time o\' year again, hen.',
          b: 'Granny\'s lit the candle. Come by after.',
          c: 'Special night. Dae the moor proud.',
          d: 'Auld bones ken this season.',
          e: 'Keep a wee toast fer the ancestors.',
          f: 'The year\'s turnin\'. Steady yersel\'.',
        },
        // ── B1 Phase 4 expansion — H1 Croft hub touchpoints. Gran's
        //    voice anchors the croft per Voice Card §Gran (warmer than
        //    Hearth, never patronising). Wired to CroftScene at first
        //    arrival, mantel glance, drove-route returns, and the
        //    morning-visit reset. Hearth voice throughout.
        croft_arrival: {
          a: 'Door\'s open. Boots on the mat. Same as ever.',
          b: 'Aye, ye made it back. Kettle was started ten minutes ago.',
          c: 'Coorie in. The moor can wait while ye warm.',
          d: 'Smell that? Stew\'s on its second day. Better that way.',
          e: 'Sit yersel\' doon — fire\'s built, blanket\'s aired.',
          f: 'A wee dram\'s in the dresser. Dinnae act surprised.',
          g: 'Took ye long enough. I\'ve had time fer two crosswords.',
          h: 'The dog says hello. He\'s tactful that way.',
        },
        morning_hub: {
          a: 'Mornin\', wee yin. The kettle\'s yawnin\' too.',
          b: 'First light\'s the kindest light. Aye.',
          c: 'Porridge wi a thumb o\' jam. Yer da\'s recipe.',
          d: 'New day\'s a fresh sheet. Write somethin\' guid on it.',
          e: 'I lit the fire afore I lit the lamp. Old habit.',
          f: 'The robin\'s back at the feeder — guid omen.',
          g: 'A wee cuppa, then the moor. In that order, mind.',
          h: 'The dew\'s up an the heather\'s smug. Off ye go.',
        },
        drove_return: {
          a: 'Back from the drove? Hooves up, kid.',
          b: 'Drove was kind, then? Or just kind enough?',
          c: 'Map\'s redder by an inch. That\'s yir doing.',
          d: 'Tell me three things ye saw. Just three. Then sleep.',
          e: 'A long road back is still a road back. Welcome.',
          f: 'Yer satchel\'s heavy — sit, breathe, dinnae spill.',
          g: 'Aye, aye — drove went how it went. Now: tea.',
          h: 'Kept the fire fer ye. Had faith ye\'d find it.',
        },
        mantel_glance: {
          a: 'See yon photo? Yer grandpa, day he won the Caber Toss.',
          b: 'That tin held grandma\'s shortbread. Empty since \'82, mind.',
          c: 'The pipes on the mantel — yer uncle\'s. Still in tune.',
          d: 'Wee porcelain doggie. Yer ma loved that thing.',
          e: 'That clock keeps its own time. Always has.',
          f: 'See the medal? Sheepdog trials, second place. Robbed.',
          g: 'Photo from the Glasgow trip. Aye, even then ye scowled.',
          h: 'The brass kelpie. Yer da brought it back from Skye.',
        },
      },
      idle: {
        a: 'Quiet, this. Too quiet, mibbe.',
        b: 'Listen tae the wind.',
        c: 'A wee breather.',
        d: 'Somethin\'s brewin\'. Always is.',
        e: 'Calm afore the ceilidh — savour it.',
        f: 'The moor hums low — dinnae interrupt.',
        g: 'Curlew up the brae somewhere.',
        h: 'A breeze. That\'s aw.',
        i: 'Distant bagpipes — or just ma heid?',
        j: 'Mind\'s wandered tae shortbread.',
        k: 'The moor breathes oot.',
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
        glaswegian: {
          a: 'Stop starin\', get movin\'.',
          b: 'Aye, take yer time. Enemies dinnae wait.',
          c: 'Moor\'s lookin\' at ye. Gie\'s somethin\' tae watch.',
          d: 'Dae somethin\' — or dinnae. Yer call, pal.',
        },
        cailleach: {
          a: 'The Cailleach watches. The moor waits wi\' her.',
          b: 'Still as stone, patient as winter.',
          c: 'Aye, pause. The glen\'s been waitin\' longer than ye.',
          d: 'She\'s in nae rush. The moor goes nowhere.',
        },
        anticlockwise: {
          a: 'Standin\' still. Even that leans left.',
          b: 'World\'s quiet when yer no\' fightin\' the turn.',
          c: 'Pause — ma drift still dreams of the left.',
          d: 'Widdershins stops for nae yin. Least of all me.',
        },
        doric_quinie: {
          a: 'Fit like, min. Naethin doon the road yet.',
          b: 'Quate spell. I\'ll tak it.',
          c: 'Nae trouble, nae troth. Aye.',
          d: 'Hear yon wind? Smells o\' haar.',
        },
        peerie_shetlander: {
          a: 'Quate. Hear the wind aff the skerries.',
          b: 'Even the seabirds are stillt.',
          c: 'Peerie pause. Watch the sky, du.',
          d: 'Voe\'s glass. That\'ll break shortly.',
        },
        burns_wee_beastie: {
          a: 'For auld lang syne, I wait.',
          b: 'A quait moment, an\' the heart takes stock.',
          c: 'My love is like a red, red rose — the moor rests.',
          d: 'Should auld acquaintance be forgot... the glen remembers.',
        },
        witch_hare: {
          a: 'Listen for elf-bow.',
          b: 'Sit still. The hare watches.',
          c: 'Even Gowdie pauses. Even hares breathe.',
          d: 'The covine waits patient.',
        },
      },
      // W2 Moor Road.
      act_intermission_enter: {
        a: 'Awright, which way, big yin?',
        b: 'Road forks. Choose, or don\'t.',
        c: 'Split in the path. Mind yer feet.',
        d: 'Twa roads. Pick the one ye\'ll mind in the morning.',
        e: 'Crossroads. Auld stones at every fork — choose canny.',
        f: 'Path branches. The moor watches both.',
        g: 'Stop. Breathe. Then choose.',
        h: 'Either way leads back tae the moor — pick yer mood.',
      },
      act_complete: {
        a: 'That\'s one doon. Braw.',
        b: 'On tae the next bit.',
        c: 'Act\'s closed. Stones rest a wee.',
        d: 'Through that bit. Lighter for it.',
        e: 'A chapter telt. Page turns.',
        f: 'Cleared. Breath\'s steady.',
        g: 'Behind ye, then. Forward, then.',
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
      reliquary_pick: {
        a: 'Moor handed ye a wee somethin\'.',
        b: 'That relic\'s been waitin\' on ye.',
        c: 'Aye — the hum had yer name on it.',
        d: 'Off-path pays, noo and again.',
      },
      // ── Haggis inner monologue (B1 Phase 2 Task 10). Hearth,
      //    wee-beastie simple — peaceful sensory notes, food daydreams,
      //    small philosophy. Short lines; childlike not infantile.
      //    Fires only during quiet stretches (HP>75%, no enemy within
      //    200px for 10s) so the voice always reads as a head-on-paws
      //    moment rather than mid-combat chatter.
      haggis_ambient: {
        a: 'Grass smells guid the day.',
        b: 'Heather ticklin\' ma belly.',
        c: 'Wee bug landed on ma nose.',
        d: 'This stane\'s warm.',
        e: 'Wind\'s at that whistlin\' thing again.',
        f: 'Cloud looks like a turnip.',
        g: 'Sun on ma back. Braw.',
        h: 'Moss is saft the day.',
        i: 'Peat smells like hame.',
        j: 'Butterflies. Dinnae trust \'em.',
        k: 'Hungry.',
        l: 'Thinkin\' aboot tatties.',
        m: 'A bowl o\' parritch wid dae.',
        n: 'Cauld neeps. Aye.',
        o: 'Stovies, wi gravy.',
        p: 'A buttered piece an\' jam.',
        q: 'A wee bridie, mibbe.',
        r: 'Shortbread. Always shortbread.',
        s: 'Scone dreams.',
        t: 'Am I a haggis? Aye.',
        u: 'Hooves exist. That\'s somethin\'.',
        v: 'Whit\'s a hoof fer, really?',
        w: 'Moor\'s big. Ma hooves are wee.',
        x: 'I exist. That\'s me, that.',
        y: 'Thinkin\' aboot thinkin\'.',
        z: 'Am I a guid haggis? Aye, probably.',
        aa: 'Glen kens ma name, I reckon.',
        ab: 'Sheep ower there. Ignorin\' me.',
        ac: 'A rook. Dinnae like rooks.',
        ad: 'Somebody whistlin\' far off.',
        ae: 'Awfy quiet the day.',
        af: 'Birds singin\'. Nice.',
        ag: 'Heard a deer, mibbe.',
        ah: 'Naebody aboot.',
        ai: 'Tired, a bit.',
        aj: 'Happy enough.',
        ak: 'Still a wee bit hungry.',
        al: 'Warm. Guid warm.',
        am: 'Content, I think.',
        an: 'Peaceful. Rare, this.',
        ao: 'Nae complaints.',
        ap: 'If I were a stag...',
        aq: 'Wonder if Gran\'s bakin\'.',
        ar: 'A nap wid dae me guid.',
        as: 'Could I fly? Prob\'ly no.',
        at: 'Wish I could speak like weans.',
        au: 'Whit\'s the sea like, I wonder?',
        av: 'Wait. Wis there somethin\'?',
        aw: 'Forgot whit I wis thinkin\' aboot.',
        ax: 'Thistle. Prickly wee gits.',
        // Wild-haggis-myth tribute: the FDA's 1971 sheep-lung rule made
        // real haggis literally illegal in the United States, and the
        // joke writes itself. Eight leaves drop into the haggis_ambient
        // round-robin so the wee monologue surfaces the contraband
        // identity once or twice a run without dominating.
        // Ref: SCOTTISH_RESEARCH_DEEP.md §11.7.
        ay: 'They banned me in the States, ye ken.',
        az: 'Nae welcome in New York. Aye, fancy.',
        ba: 'Fae the FDA: thou shalt no haggis. Very dramatic.',
        bb: 'Contraband, me. Imagine.',
        bc: 'Cannae cross the Atlantic legal. Tragedy.',
        bd: 'Forty-five year banned. Aulder than ma maw.',
        be: 'Some folk wid smuggle me in a kilt, mind.',
        bf: 'I\'m banned an\' I\'m proud. Nice ring tae it.',
      },
      // ── Enemy flavour (B1 Phase 3 Task 17). Fires on first-encounter of
      //    an enemy type and on a rare 1/20 respawn roll thereafter.
      //    Generic pool = untagged fallback — warm, curious, moor-voiced
      //    noticing. Tagged sub-pools land family-by-family as Task 17
      //    progresses (Cryptids / Faerie / Weather / Urban / Academic /
      //    Retinue / Moor-Classic / Bosses). Each tag colours the voice
      //    to the enemy family per spec §3.
      enemy_ambient: {
        a: 'New shape on the moor. Mind yer step.',
        b: 'Somethin\' unfamiliar. Stay braw.',
        c: 'Aye, that\'s a new yin fer the kin-book.',
        // ── Cryptids family. Uncanny-warm naming voice.
        barghest: {
          a: 'A muckle black dug wi too mony teeth. Mind the shadow first.',
          b: 'Barghest. Heard o them — didnae want tae see one.',
          c: 'Black hound\'s oot. Keep low an keep movin\'.',
        },
        cu_sith: {
          a: 'A Cu Sith — green pelt, bullock-big. Listen fer the bays.',
          b: 'Fairy hound on the moor. The third hool\'s the one tae watch.',
          c: 'Cu Sith is here. Mind the covine that keeps it.',
        },
        kelpie_foal: {
          a: 'Wee yin\'s aw shimmer an ribbon. Dinnae follow the glow.',
          b: 'Kelpie foal, tempty wee thing. Hooves on land, aye?',
          c: 'Shimmerin\' like wet tinfoil. That\'s nae invite.',
        },
        blue_man_of_minch: {
          a: 'Blue fella fae the sea. Talks in riddles — dinnae answer.',
          b: 'Minch-folk dinnae come ashore fer fun. Heads up.',
          c: 'Salt-blue an watchin\'. Keep yer kennings tae yersel.',
        },
        // ── Faerie Courts family. Warm-tricksy. Bargain never.
        seelie_piper: {
          a: 'Fair-court piper. Mind yer manners — an yer hooves.',
          b: 'Seelie one. Smile an nod, but nae bargains.',
          c: 'Pretty tune. Pretty teeth. Careful, aye.',
        },
        unseelie_fiddler: {
          a: 'Unseelie reel. No a tune ye hum back.',
          b: 'Dark-court fiddler. Dance a wide circle.',
          c: 'Black bow an a crooked grin. Dinnae clap.',
        },
        redcap: {
          a: 'Redcap. Nae courtier — aw teeth an bonnet.',
          b: 'That bunnet\'s dripped. Hope it stays dripped.',
          c: 'Wee goblin in the bloodiest hat on the moor.',
        },
        // ── Weather family. Elemental-thin.
        haar_wraith: {
          a: 'The haar\'s got a face this time. No like it.',
          b: 'Fog wi shoulders. Watch yer pockets.',
          c: 'Sea-mist that walks. Keep movin\' — ye\'ll lose it.',
        },
        gale_wraith: {
          a: 'Wind wi a grudge. Brace yer hooves.',
          b: 'Gale-spirit. It shoves — it\'s nae personal.',
          c: 'Weather that pushes back. Fair play tae it.',
        },
        // ── Urban Ghaists family. Glesga patter, sharp-comic.
        buckfast_ned: {
          a: 'A ned wi a bottle. Classic Friday-night bother.',
          b: 'Buckie\'s oot the bag. Slip-slide time.',
          c: 'Mon then big man — nae need fer the tonic.',
        },
        traffic_cone_totem: {
          a: 'Roadworks on the moor? Somebody\'s takin\' a lend.',
          b: 'Cone-heid totem. Tip it — worse comes. Mind that.',
          c: 'Static in a high-viz vest. Tread careful.',
        },
        edinburgh_ghost_guide: {
          a: 'Ghost tour guide. Narrates yer death wi footnotes.',
          b: 'Auld Reekie in a waistcoat. Pure patter, nae mercy.',
          c: 'Lantern raised, script ready. Nae tip fer this one.',
        },
        // ── Academic Apparitions family. Stern-scholarly wi wry warmth.
        ceilidh_caller: {
          a: 'Caller spirit. Tells ye where tae turn — no polite, no wrong.',
          b: 'A deid fiddle-maister wi a sense o time. Mind the beat.',
          c: 'She calls the reel, the reel obeys. Aye, even you.',
        },
        tome_wraith: {
          a: 'A book that stares back. That\'s no how libraries work.',
          b: 'Pages turnin\' on their ain. Somethin\' bookish an cross.',
          c: 'Tome wi a face. Dinnae argue the footnotes.',
        },
        dean_apparition: {
          a: 'Dean\'s gown an stern breath. The academy does not wait.',
          b: 'Mortarboard ghost. Will mark ye late.',
          c: 'Auld dean, auld grudge, auld hallways in his walk.',
        },
        // ── Taxman's Retinue. Bureaucratic-dread register.
        ledger_wraith: {
          a: 'Ledger comes first. That\'s how the Taxman sends his callin\' card.',
          b: 'Quill an grudge. He owes ye nothin\' — takes it onyway.',
          c: 'First o his clerks. That means the big yin\'s countin\' doors.',
        },
        auditor_priest: {
          a: 'Priest wi a ledger staff. Nae sermon — just arithmetic.',
          b: 'Auditor ordained. The collection plate is yersel.',
          c: 'Censer swings slow. Every swing\'s a receipt.',
        },
        // ── Moor-Classic (Task 17). Original enemies, each anchored to
        //    its silhouette. Hearth default; short, character-first.
        tourist: {
          a: 'Tourist. Got a map, nae idea. Dangerous when bored.',
          b: 'Rambler wi a camera an nae sense. Classic.',
        },
        chef: {
          a: 'Chef on the moor. Somebody\'s missin\' a dinner service.',
          b: 'Apron an cleaver. Bad combo on yer doorstep.',
        },
        midge: {
          a: 'Midges are oot. Nae breeze tae save ye.',
          b: 'Wee bitey thing. Multiplies if ye pause.',
        },
        highland_cow: {
          a: 'Heilan coo. She\'ll get tae ye. Nae hurry, but she\'ll get there.',
          b: 'Shaggy tank. Gie her room — everyone else does.',
        },
        eagle: {
          a: 'Eagle\'s spotted ye. Look up, aye — up!',
          b: 'Gold talons. Stick tae the thicker heather.',
        },
        haggis_hunter: {
          a: 'Actual haggis hunter. Nae subtle aboot it.',
          b: 'He\'s here fer the kin. We dinnae like that.',
        },
        angry_scotsman: {
          a: 'Angry man in a kilt. Some grudge, some lager.',
          b: 'Bellowin\' up the path. Somebody told him aboot us.',
        },
        deep_fryer: {
          a: 'A deep-fryer in the wild. The moor accepts nothin\' an fears less.',
          b: 'Oil bubbles where nae oil should be. Steer wide.',
        },
        piper: {
          a: 'Piper\'s oot. Wrang tune, wrang team.',
          b: 'Bag drone gone wrang. Mind the circle.',
        },
        berserker: {
          a: 'Berserker. Nae plan, all arm.',
          b: 'Big lad wi nae brakes. Dance aside.',
        },
        ghost: {
          a: 'Ghost. Nae body tae ken whit it wants.',
          b: 'Flicker an breath. Naebody likes a phase-shifter.',
        },
        nest: {
          a: 'A nest oot here? Kill it afore it kills the moor.',
          b: 'Keek — the moor\'s hatched somethin\'. Squish the egg.',
        },
        sheep: {
          a: 'Wee sheep. Aye, they fear us. Still a dunt if ye ignore them.',
          b: 'Scarey wee thing. Same hooves, different courage.',
        },
        kelpie: {
          a: 'Kelpie, full-grown. Dinnae climb on its back.',
          b: 'Water-horse. Means well fer nobody.',
        },
        midgie_swarm: {
          a: 'Swarm o midges. Keep a breeze at yer back.',
          b: 'Cloud o bites. Blow them off, dinnae stop.',
        },
      },
      // ── First-time reserved (B1 Phase 3 Task 18). Priority 110 — these
      //    fire ONCE per save, ever, the tick the milestone lands. Tone
      //    per event (Edge for big defeats, Hearth for warm firsts). Each
      //    event seeded with 2 lines so the no-repeat ring never starves
      //    if the save-flag guard ever drops a write. Wiring lands with
      //    each call site in follow-up commits — present pool ships
      //    content-only so the parity fence + priority ladder stabilise.
      first_time: {
        a: 'Aye, that\'s a first. The kin-book remembers.',
        b: 'New chapter fer the moor. Never happened afore.',
        boss_gordon_kill: {
          a: 'First time ye bested Gordon. The kitchen shut its windaes fer ye.',
          b: 'Cleaver doon. Glen\'s takin\' notes.',
        },
        // each_uisge first-kill fired the generic fallback until 2026-04-29
        // because the tag had no sub-pool. Added to close the gap with the
        // other five bosses. Voice register: GRAVE — the Each-Uisge is the
        // Fey-tier mythos boss (water-horse / shapeshifter), not a comedy
        // beat. Lines mark the moment without making light of it.
        boss_each_uisge_kill: {
          a: 'Water-horse felled. The loch\'s remembering yer name in cold.',
          b: 'First Each-Uisge bested. The deepest waters lost a king.',
        },
        boss_tour_bus_kill: {
          a: 'Hale busload beaten. The guidebooks will lie aboot this.',
          b: 'First tour bus ever tipped. Pure havoc — braw havoc.',
        },
        boss_the_laird_kill: {
          a: 'Laird\'s fallen ance. The tenants are stunned quiet.',
          b: 'First stoon tae the tweed. Moor\'s cheerin\' low.',
        },
        boss_hunter_general_kill: {
          a: 'Hunter-General met his match. First time. Worth a photo.',
          b: 'Nae more hunters\' general. First o kin tae say it.',
        },
        boss_taxman_kill: {
          a: 'Taxman paid in full. First time any haggis has done it.',
          b: 'Ledger clean. The moor exhaled — an ye heard it.',
        },
        evo_thistle_shot: {
          a: 'Thistle evolved first. That prickle\'s written in the song.',
          b: 'First thistle-turn. Scotland\'s flower gets meaner still.',
        },
        evo_bagpipe_blast: {
          a: 'Pipes blasted first. The moor\'s ears are ringin\' proud.',
          b: 'Bagpipe blast evolved. The first drone they\'ll fear.',
        },
        evo_caber_toss: {
          a: 'First caber evolved. Games night just got heavier.',
          b: 'Caber\'s turned. A log wi intention.',
        },
        evo_scotch_mist: {
          a: 'Mist evolved. Whisky-fog wi a say in things.',
          b: 'First mist-turn. The moor breathes wi teeth noo.',
        },
        evo_haggis_hurler: {
          a: 'First haggis-hurler evolved. Cousins takin\' fire — we\'ll buy em a pint.',
          b: 'Hurler bloomed. Arc\'s as proud as a pibroch.',
        },
        evo_nessie_tentacle: {
          a: 'Tentacle\'s a whole thing noo. Nessie waved back an all.',
          b: 'First evolution doon in the loch. Big ripples.',
        },
        evo_claymore: {
          a: 'Claymore\'s evolved. First swing that reads auld Gaelic.',
          b: 'Claymore bloomed. A sweep wi a century behind it.',
        },
        // P1.4 — no evo_bagpipes leaf: bagpipes is utility-only, no
        // evolution recipe. Pool intentionally absent in `data/banter.ts`.
        combo_100: {
          a: 'A hundred in a row. Ye just climbed ahint the ancestors.',
          b: 'First century combo. Gran\'s proud, the moor\'s proud, aye.',
        },
        ironmoor_first_victory: {
          a: 'Ironmoor survived ance. That\'s a wee legend noo.',
          b: 'First iron-run cleared. Nae echo left — an that\'s the point.',
        },
        /** R1 M4 T26 — first Relic ever. Gran voice, quiet reverence. */
        relic_first_pickup: {
          a: 'A relic, hen. Tuck it away — things like this remember ye.',
          b: 'Away an pocket that — the glen only hands these oot ance.',
        },
        /** U1 Task 18 — first Rune ever. Gran voice, hush of cairn-age. */
        rune_first_pickup: {
          a: 'A rune, hen — older than speech. Carry it gently.',
          b: 'A stone that was carved before the glen had a name. Listen tae it.',
        },
        // ── B1 Phase 4 expansion — first-time milestones for variants,
        //    routes, and daily clear. Each milestone fires once-per-save
        //    via `bumpFirstTimeEvent(eventId)`. Wiring lands at each
        //    call surface in follow-up commits per "hook with content"
        //    pattern (see BANTER_GAPS.md).
        // Variant unlocks (12 non-classic). Voice tilts variant-specific
        //  per Voice Card §Variant-scoped voices.
        variant_moor_runner_unlocked: {
          a: 'A moor runner — yer hooves never settle. Welcome.',
          b: 'Always nine yards ahead. Nice tae see ye, runner.',
        },
        variant_iron_belly_unlocked: {
          a: 'Iron belly, soft heart. The wall\'s yours, hen.',
          b: 'Built to take it. Take it then, ye legend.',
        },
        variant_glen_forager_unlocked: {
          a: 'A forager noo. Sticky-fingered, eagle-eyed.',
          b: 'Glen forager — somebody\'ll wonder where their tatties went.',
        },
        variant_surefoot_unlocked: {
          a: 'Surefoot. Slope, scree, scarp — same hooves.',
          b: 'Steady ye go. The mountain trusts ye noo.',
        },
        variant_pipe_breath_unlocked: {
          a: 'Pipe breath. Lung-volume, melodic intent.',
          b: 'Pibroch lungs. Music in every gasp.',
        },
        variant_wee_ghostie_unlocked: {
          a: 'A wee ghostie. Half here, half elsewhere — fully you.',
          b: 'Faintly, friend. Faintly does it.',
        },
        variant_laird_unlocked: {
          a: 'The Laird answers the moor\'s call. Tartan first.',
          b: 'A laird wi\' lambs in his estate — earned, mind.',
        },
        variant_glaswegian_unlocked: {
          a: 'Glesga haggis on the moor. Aye. Square go.',
          b: 'Pure-mental moor energy. The city walks tae work.',
        },
        variant_anticlockwise_unlocked: {
          a: 'Widdershins. Backwards. Lefty-loosey. Aye, fine.',
          b: 'Drift\'s mirrored noo. Sun rises in yir west.',
        },
        variant_cailleach_unlocked: {
          a: 'The Cailleach\'s line wakes. Winter watches through ye.',
          b: 'Hag-stane in yir blood noo. The mountain bows.',
        },
        variant_doric_quinie_unlocked: {
          a: 'Fit like, quinie. The Northeast joins the herd.',
          b: 'A Doric haggis. The fishing village remembers.',
        },
        variant_peerie_shetlander_unlocked: {
          a: 'A peerie haggis fae the Sound. Norse blood, salt breath.',
          b: 'Welcome fae the Voe, du. The skerries sent ye.',
        },
        variant_burns_wee_beastie_unlocked: {
          a: 'The Bard\'s wee beastie — quotation an thistle, both.',
          b: 'Sleekit, cow\'rin, glorious. Burns walks beside ye.',
        },
        // Route first-picks (6 W2 routes). Voice: hearth, shy
        //  acknowledgement of the choice — once-per-save accent.
        route_up_the_brae_first: {
          a: 'First time up the Brae. The hills owe ye nothin\' — yet.',
          b: 'Climbed it ance. Won\'t forget the air.',
        },
        route_round_the_loch_first: {
          a: 'First trip roond the Loch. Watter\'s long memory.',
          b: 'Loch road, first time. Reflections everywhere.',
        },
        route_through_the_kirkyard_first: {
          a: 'Walked through the kirkyard. The names stay polite, mostly.',
          b: 'First time through the deid lane. Tread soft.',
        },
        route_stand_yer_ground_first: {
          a: 'Stood ground first time. The moor felt the planted hooves.',
          b: 'Held it. The wind respects a wall, however small.',
        },
        route_run_for_the_hills_first: {
          a: 'First retreat. No shame — the hills hide kindly.',
          b: 'Ran for the hills, an the hills caught ye soft.',
        },
        route_buckie_pitstop_first: {
          a: 'Buckie pitstop, first round. The bottle\'s honest, even if the label\'s blue.',
          b: 'First taste o\' the tonic. Yir heid will discuss it later.',
        },
        // Daily challenge first clear.
        daily_first_clear: {
          a: 'First daily on the books. Aye — same code, fresh hooves.',
          b: 'Daily cleared. Tomorrow will be a different moor.',
        },
      },
      // ── Burns citations (B1 Phase 4 Task 22). Every line is a verified
      //    quotation from Robert Burns (1759-1796). Public domain.
      //    Attributions below reference the poem + first-publication year
      //    against the Kinsley 1968 critical edition (the canonical
      //    scholarly reference).
      //
      //    Scots orthography preserved as Burns wrote it; i18n.scs.ts
      //    carries the same line verbatim. The SCS pair is identical
      //    string — parity fence passes trivially.
      burns_citation: {
        a: 'Fair fa\' your honest, sonsie face.',
        b: 'Best-laid schemes gang aft a-gley.',
        // ── "Address to a Haggis" (1786). Burns's birthday-supper anthem.
        // Eight Habbie-stanzas total in Kinsley 1968 vol. I no. 136. The
        // sub-pool now ships a couplet from each stanza (a–h) so the
        // round-robin ring buffer (no-repeat depth ≈ 5) cycles through
        // the whole poem across a typical Burns Night run instead of
        // bouncing between the same two openers. Period spelling and
        // punctuation preserved per Kinsley.
        haggis_moment: {
          a: 'Fair fa\' your honest, sonsie face, / Great chieftain o\' the puddin\'-race!',
          b: 'His knife see rustic Labour dight, / An\' cut you up wi\' ready slight.',
          c: 'Trenching your gushing entrails bright, / Like onie ditch.',
          d: 'Then, horn for horn, they stretch an\' strive: / Deil tak the hindmost! on they drive.',
          e: 'Is there that owre his French ragout, / Or olio that wad staw a sow?',
          f: 'Poor devil! see him owre his trash, / As feckless as a wither\'d rash.',
          g: 'But mark the Rustic, haggis-fed, / The trembling earth resounds his tread.',
          h: 'Auld Scotland wants nae skinking ware / That jaups in luggies; / But, if ye wish her gratefu\' prayer, / Gie her a Haggis!',
        },
        // ── "To a Mouse" (1785). Ploughed mouse nest; ubiquitous.
        mouse_moment: {
          a: 'Wee, sleekit, cow\'rin, tim\'rous beastie.',
          b: 'The best-laid schemes o\' mice an\' men / Gang aft a-gley.',
        },
        // ── "The Banks o\' Doon" (1791) + "Sweet Afton" (1789). Water-song.
        loch_moment: {
          a: 'Ye banks and braes o\' bonie Doon, / How can ye bloom sae fresh and fair?',
          b: 'Flow gently, sweet Afton, amang thy green braes.',
        },
        // ── "My Heart\'s in the Highlands" (1789).
        highland_moment: {
          a: 'My heart\'s in the Highlands, my heart is not here.',
          b: 'My heart\'s in the Highlands, a-chasing the deer.',
        },
        // ── "Tam o\' Shanter" (1790) + "Scots Wha Hae" (1793) — triumph.
        victory_open: {
          a: 'Kings may be blest, but Tam was glorious, / O\'er a\' the ills o\' life victorious!',
          b: 'Now\'s the day, and now\'s the hour.',
        },
        // ── "Ae Fond Kiss" (1791) + "Open the Door to Me O" (1793).
        defeat_lament: {
          a: 'Ae fond kiss, and then we sever!',
          b: 'The wan moon is setting behind the white wave.',
        },
        // ── "Scots Wha Hae" (1793). Bruce at Bannockburn.
        charge: {
          a: 'Scots, wha hae wi\' Wallace bled.',
          b: 'Wha will be a traitor knave? / Wha can fill a coward\'s grave?',
        },
        // ── "Tam o\' Shanter" (1790). Time-won\'t-wait.
        nae_haste: {
          a: 'Nae man can tether time or tide.',
          b: 'When chapman billies leave the street.',
        },
        // ── "John Anderson My Jo" (1790). Elder-kinship.
        lineage_moment: {
          a: 'John Anderson my jo, John, / When we were first acquent.',
          b: 'We clamb the hill thegither, / An\' monie a canty day, John.',
        },
      },
      // ── Death reflections (B1 Phase 2 Task 12). Hearth, warmly-framed
      //    per DESIGN_SOUL §Warmth Audit. Tagged sub-pools match
      //    `DeathCauseTag` keys from `src/core/deathCauseClassifier.ts`.
      //    Never shaming — name the cause gently, offer a soft takeaway
      //    where natural, avoid duplicating the game-over screen's
      //    cause-tip sentence.
      death_reflection: {
        a: 'Moor-debt settled. Nae grudges held.',
        b: 'Every hoof stumbles. The glen\'s patient.',
        c: 'Dusk comes for us aw. Rest easy, wee yin.',
        d: 'Heather doesnae keep score, bonnie.',
        e: 'The land closed a page. Softly.',
        f: 'Run\'s dune. The fire\'ll keep.',
        g: 'Bracken makes its bed o ye. Sleep noo.',
        h: 'Cu Sith nae howled — ye went easy.',
        i: 'Granny\'s kettle still warm. Come back when yer ready.',
        j: 'The moor took ye gently. It\'s done that afore.',
        k: 'Nae name on the stane yet. Plenty time.',
        hazard: {
          a: 'The ground spoke louder than yer hooves. Worth a listen next time.',
          b: 'Aye — the moor hides teeth in the kindest fields.',
          c: 'The weather wasnae personal. It\'s weather aw the way doon.',
          // ── B1 Phase 4 expansion — extra leaves on existing tags so
          //    the no-repeat ring buffer has room to breathe.
          d: 'Heather-pit took ye. They keep their secrets close.',
          e: 'A hidden ruck o\' stane. Nae fault o\' yer hooves.',
          f: 'The bog spoke saft. Ye couldnae have heard it.',
        },
        boss_crushed: {
          a: 'A big yin caught ye. Nae disgrace in that, wee yin.',
          b: 'That one had weight. It\'ll keep fer the next run.',
          c: 'Ye met a proper menace the day. Fair play fer standin\' in front of it.',
          d: 'A heid-corp catch — ye stood when many would run. Mind that.',
          e: 'They wear the moor like armour. Ye\'ll find a seam next time.',
          f: 'Took it on the chin like an auld fighter. Nae shame, hen.',
        },
        elite_kill: {
          a: 'The glintin\' ones hit heavy. Mind the gold shine next time.',
          b: 'Elite\'s elite fer a reason. Respect earned.',
          c: 'Golden trouble — they work fer their shine.',
          d: 'The shiny ones learn yir style. Change it up.',
          e: 'Goldglow saw ye comin\'. Throw a feint next run.',
          f: 'Their golden hour was yours an aw — ye just blinked first.',
        },
        one_shot: {
          a: 'One clap — ye never had time tae flinch.',
          b: 'A fortnight of damage in a single breath. Hardly fair, that.',
          c: 'The moor disnae negotiate wi weight like yon. Next time, steer wider.',
          d: 'A blow oot the dark. The moor blinked an ye were doon.',
          e: 'Nothing tae be done — that one was reservin\' a slot fer ye.',
          f: 'A clean takin\'. Walk it off, hen.',
        },
        same_killer: {
          a: 'Same beastie, owre and owre. Kite it loose next run.',
          b: 'That one found yer rhythm. Break the beat next time.',
          c: 'Persistent bugger. Circle wide — it\'ll lose yer scent.',
          d: 'That same brute again — it\'s personal noo. Pay it forward.',
          e: 'Yer rhythm tells. Fake it next time, ye sneak.',
          f: 'The moor sent the same caller — answer different.',
        },
        swarmed: {
          a: 'The moor sent a whole chorus. Nae shame in gettin\' sung at.',
          b: 'Too many hands in the pot — that\'s ambushes fer ye.',
          c: 'Outflanked. The road\'s wide — use the room next run.',
          d: 'A hundred legs an\' nae kindness. Spin oot wider next run.',
          e: 'Crowd-killed. The moor doesnae always queue politely.',
          f: 'Numbers talked. Ye ken the rebuttal — keep movin\'.',
        },
        low_hp_neglect: {
          a: 'Bled doon too long. Healin\' gets shy near zero.',
          b: 'Red bar kept company. Come up earlier, bonnie.',
          c: 'Low flame burns short. Eat when the moor offers, wee yin.',
          d: 'Riding the line wears the line through. Eat earlier.',
          e: 'A red bar is the moor offerin\' ye chances. Next time, take ane.',
          f: 'Heroic at one HP, gone at zero. Different sums.',
        },
        unlucky: {
          a: 'Sometimes the dice bite. The moor\'s a fair court, mostly.',
          b: 'Weird deaths come and go. Nae mystery worth keepin\'.',
          c: 'Bad weather day. The next\'ll clear.',
          d: 'Aye, that was the moor in a mood.',
          e: 'Variance happens. Glen\'s patient.',
          f: 'A bad bounce, a bad day. Tomorrow\'s the moor\'s.',
        },
      },
      // ── Cailleach Whispers (B1 Phase 4 Task 21). Cailleach Bheur
      //    voice — the Winter Queen, elder hag, shaper of mountains and
      //    keeper of wild beasts. Per VOICE_CARD §Cailleach: stern,
      //    motherly, Gaelic-inflected. *Not* villainous; she expects
      //    better of ye. Sparing words; every one carries weight.
      //
      //    Voice register: EDGE / GRAVE per Voice Card. Priority 55 —
      //    fires at act intermissions, low-HP, Bargain events.
      //
      //    Cultural reference: SCOTTISH_RESEARCH.md §1.3 (Cailleach
      //    Bheur, Beira) and CULTURAL_SENSITIVITIES_RESEARCH.md §3.1
      //    + §4.2 (Gaelic — high care; native review required for any
      //    Gaelic phrase).
      //
      //    [GAELIC-REVIEW]: Lines flagged with this comment contain
      //    Gaelic fragments that REQUIRE native-speaker review before
      //    public release. Fragments authored against the precedent set
      //    by the existing Cailleach variant lines (`dè do bheachd?`
      //    "what do you think?", `cò às a tha thu?` "where are you
      //    from?" — flagged as well-chosen in cultural research §4.2).
      //    Each Gaelic line provides English-clause context so meaning
      //    survives review-bounce. See docs/top-10-tasks/blocked/
      //    06-blocked-on-human.md for the full review list.
      //
      //    Anti-patterns avoided:
      //    - No "spooky alien decoration" Gaelic — every fragment has
      //      English context or translation.
      //    - No witch-pastiche; she's elder, not crone-villain.
      //    - No mockery of Gaelic; lines treat it as living speech.
      cailleach_whisper: {
        a: 'Winter\'s patient. Ye won\'t be.',
        b: 'The mountain was here before ye, and after.',
        c: 'I shaped these stanes. Mind where ye stand.',
        d: 'Heid up, wee one. The frost respects posture.',
        // [GAELIC-REVIEW] `a chiall` — "sense / understanding"; vocative,
        //  used as a gentle scold from an elder. NEEDS NATIVE REVIEW.
        e: 'A chiall — sense, child. Ye keep losing it.',
        f: 'Cold sharpens what warmth softens. Walk on.',
        // [GAELIC-REVIEW] `mo nighean` — "my daughter / my girl"; warm
        //  vocative. NEEDS NATIVE REVIEW.
        g: 'Mo nighean. Ye carry yer own weather.',
        h: 'The hag-stane sees through ye. Stand still.',
        // [GAELIC-REVIEW] `is fada an oidhche` — "the night is long";
        //  proverb-fragment, common idiom. NEEDS NATIVE REVIEW.
        i: 'Is fada an oidhche. The night is long. Steady, then.',
        j: 'Ye are a small fire. I have warmed at smaller.',
        // [GAELIC-REVIEW] `tog ort` — "rouse yourself / get going";
        //  imperative. NEEDS NATIVE REVIEW.
        k: 'Tog ort. Not pity — instruction.',
        l: 'Frost remembers every footfall. So do I.',
        m: 'Beira watches. The herd hears it in the wind.',
        // [GAELIC-REVIEW] `cha mhór` — "almost / nearly"; common idiom.
        //  NEEDS NATIVE REVIEW.
        n: 'Cha mhór. Almost — but the mountain isn\'t fooled.',
        o: 'A blizzard taught me silence. I\'ll teach ye, if ye ask.',
        // [GAELIC-REVIEW] `a ghaoil` — "my dear / my beloved"; warm
        //  vocative from elder. NEEDS NATIVE REVIEW.
        p: 'A ghaoil. The world will not coddle ye.',
        q: 'Ye think the dark hates ye. It only outlasts ye.',
        // [GAELIC-REVIEW] `gabh air do shocair` — "take it easy /
        //  steady on"; imperative. NEEDS NATIVE REVIEW.
        r: 'Gabh air do shocair. Slow, child. Slow.',
        s: 'I have waited longer than these hills for less worthy weans.',
        // [GAELIC-REVIEW] `sgrìobhte sa chloich` — "written in the
        //  stone"; literary register. NEEDS NATIVE REVIEW.
        t: 'Sgrìobhte sa chloich. Written in stone — and read by the wind.',
      },
      // ── Seasonal Event pool (B1 Phase 5). Standalone graduation —
      //    the existing `gran_commentary.seasonal_event` sub-pool stays
      //    in place (used by E1 ceremony resolver), but this new pool
      //    fires for in-run seasonal moments where Gran isn't already
      //    speaking. Priority 65 per spec §2 / PENDING_POOL_METADATA.
      //
      //    Tone: HEARTH per voice register table (Hearth for warm
      //    seasonal moments, Cailleach-edged for Samhain). Sub-pools
      //    mix subtle tones to match each event's mood.
      //
      //    Tags align with `getActiveSeasonalEventKey` returns:
      //    - `burns_night` (Jan 18 - Feb 1) — Burns canon citations.
      //    - `hogmanay` (Dec 28 - Jan 3) — first-footing, year-turn.
      //    - `samhain` (Oct 28 - Nov 3) — boundary thinning.
      //    - `beltane` (Apr 28 - May 4) — fire festival, summer-start.
      //
      //    Burns Night lines that quote Burns directly are public-domain
      //    citations against Kinsley 1968 critical edition; inline
      //    comments cite poem + first-publication year.
      seasonal_event: {
        a: 'The wheel turns. The moor remembers.',
        b: 'Auld festival. New hooves on it.',
        burns_night: {
          // ── "Address to a Haggis" (1786). Kinsley 1968 vol. I no. 136.
          a: 'The Bard\'s night. "Fair fa\' your honest, sonsie face."',
          b: '"Great chieftain o\' the puddin\'-race!" — Address to a Haggis.',
          // ── "To a Mouse" (1785). Kinsley vol. I no. 69.
          c: 'It\'s the Bard\'s week — even mice walk lighter.',
          // ── "A Red, Red Rose" (1794). Kinsley vol. II no. 453.
          d: '"O my Luve\'s like a red, red rose." Burns is in the air.',
          // ── "Auld Lang Syne" (1788, pub. 1796). Kinsley no. 240.
          e: 'Should auld acquaintance be forgot — no\' the night, hen.',
          // ── "Tam o\' Shanter" (1790). Kinsley vol. II no. 321.
          f: 'Tam\'s ride is told by every fire this week.',
          // ── "Scots Wha Hae" (1793). Kinsley vol. II no. 425.
          g: '"Scots, wha hae wi\' Wallace bled" — pipes carry it.',
          // ── "A Man\'s a Man for A\' That" (1795). Kinsley no. 482.
          h: '"A man\'s a man for a\' that." Even a wee haggis.',
          // ── Conventional Burns Supper toast.
          i: 'Toast the Immortal Memory before ye charge.',
          // ── Burns Supper ritual: piping in the haggis.
          j: 'The haggis is piped in tonight. Ye\'re royalty.',
          // ── Selkirk Grace (popularised by Burns at Lord Selkirk\'s table).
          k: 'Selkirk Grace tonight — somebody\'s sayin\' it for us.',
          l: 'Kilt straightened, glass raised. The moor bows back.',
          m: 'The Address tonight — every word a wee fire.',
          n: 'The poet at Alloway is listening. Walk steady.',
          o: 'Burns night across the world. Ye\'re part of it, hen.',
          // ── "Ae Fond Kiss" (1791). Kinsley vol. II no. 337.
          p: '"Ae fond kiss, and then we sever" — soft yin tonight.',
          // ── "Green Grow the Rashes O" (1783). Kinsley vol. I no. 45.
          q: '"Green grow the rashes, O." Cheery toast.',
          // ── "Holy Willie\'s Prayer" (1785). Kinsley vol. I no. 53.
          r: 'The Bard had a wicked grin. Dust off yer own.',
          s: 'After the haggis, after the toasts — back tae the moor.',
          t: 'The Bard\'s lamp glints on every dram tonight. Aye.',
        },
        hogmanay: {
          a: 'Hogmanay. The year hinges. Walk through it bonnie.',
          b: 'Bells in the distance. New year takin\' a breath.',
          c: 'First-footing the moor — a coin, a coal, a kindness.',
          d: 'A dark-haired haggis at the door is best luck.',
          e: 'Auld Lang Syne hummed in the heather.',
          f: 'Stonehaven\'s fireballs whirled the dark away. Same idea here.',
          g: 'Edinburgh\'s street singin\'. The moor sings quieter.',
          h: 'Twelve bells, twelve futures. Pick a guid yin.',
          i: 'Out wi\' the auld year — gently, mind.',
          j: 'Black bun an\' a dram waitin\' fer the survivor.',
          k: 'A stranger\'s gift opens the year.',
          l: 'Year\'s last wind. Push through it.',
          m: 'Hogmanay\'s a long word fer "have a chance, hen."',
          n: 'Saining the threshold — the moor blesses its own.',
          o: 'A Hogmanay haggis is a lucky haggis.',
          p: 'Three knocks, three wishes — the door opens this night.',
        },
        samhain: {
          // ── Edge / Cailleach-adjacent tone: veil thins.
          a: 'Samhain. The boundary thins. Hooves walk between.',
          b: 'The dead nod tonight. Nod back, but keep movin\'.',
          c: 'Cailleach reigns again. Warmth is a memory.',
          d: 'Ancestors are nearer. Honour them by surviving.',
          e: 'Bone-fire, soul-light — older than the calendar.',
          f: 'A turnip wi\' a candle. A wee defiance.',
          g: 'The Wild Hunt rides somewhere far. Don\'t look up.',
          h: 'Soul-cake left out. Don\'t eat what\'s for the deid.',
          i: 'Last harvest in. The earth sleeps after this.',
          j: 'A name spoken in the dark stays heard.',
          k: 'The moor wears a different face this week.',
          l: 'Lantern in the kale-yard — for the ones who came.',
        },
        beltane: {
          a: 'Beltane fires lit. Cattle pass between them. So do you.',
          b: 'The young Cailleach today — May Queen wi\' the heather.',
          c: 'Two fires, one road through. Walk lucky.',
          d: 'Calton Hill flickers. Edinburgh remembers.',
          e: 'Summer\'s door swings open. Mind the threshold.',
          f: 'May-dew in the heather. Wash yer face fer luck.',
          g: 'Green Man in the bracken. Wave back.',
          h: 'Fire-jumpers tonight. Show \'em how a haggis hops.',
          i: 'Wells dressed wi\' rags an\' wishes. Make ane.',
          j: 'The birch is in leaf. The world\'s soft for a moment.',
          k: 'Dance the bealtain widdershins — joy, no curse.',
          l: 'Bonfire breath, sun-warm hooves. This is the bright half.',
        },
      },
    },
    toast: {
      screenshot_saved: 'Screenshot saved to downloads.',
      screenshot_failed: "Couldnae save the frame — gie it another go.",
      clip_saved: 'Clip saved to downloads.',
      clip_failed: "Couldnae save the clip — gie it a wee minute.",
      clip_empty: 'Play a wee bit longer before saving a clip.',
      frame_copied: 'Frame copied — paste it where ye like.',
      frame_copy_failed: "Couldnae copy the frame — try Save instead.",
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
    /** A1 M4 — level-up moment: player gained a level, cards open next. */
    level_up: 'Level up — pick a card.',
    /** A1 M4 — echo-card draw post-cap. */
    echo_ready: 'Echo offered — choose a small boon.',
    /** A1 M4 — boss enrage: music swells, enemies pressure up. */
    boss_enrage: 'Boss enrages — music swells.',
    /** Cu Sith Three-Bay telegraph captions (DESIGN_IDEAS §1). */
    cu_sith_bay_first: 'Cu Sith hools — first bay across the moor.',
    cu_sith_bay_second: 'Cu Sith hools — second bay closer in.',
    cu_sith_bay_third: 'Cu Sith hools — third bay; the charge locks on.',
  },
  biomes: {
    bog: {
      name: 'The Bog',
      entry: 'Intae the bog, wee man — watch yir hooves.',
      loreSnippet: 'Peat goes deep. Watch the peat hags an mind the midges.',
      lore: 'Peat lies deep here — wet, black, ancient. The bog has held things for thousands of years: bog cotton, sphagnum moss, the occasional bronze-age body preserved in the tannin. Watch the peat hags — gullies cut by water — and mind the midges at dusk. The smell of wet peat is the smell of Scotland boiled doon, and a peat fire warms whisky better than any electric. Sink up tae the knees if ye stop tae admire it.',
    },
    loch: {
      name: 'Loch Edge',
      entry: 'Loch\'s watchin\'. Somethin\' under there.',
      loreSnippet: 'By yon bonnie banks. Each-uisge minds the deep.',
      lore: 'By yon bonnie banks. Lochs run deep — Ness deeper than the North Sea, Lomond longer than London. They keep their old residents close: each-uisge, the water-horse that drowns the unwary; selkies who shed their seal-skins on rocks and dance under stars; kelpies who lure travellers in. Otter and osprey work the shallows in daylight. At dusk the surface goes flat as a black mirror, and ye mind the loch was here lang before ye arrived and will be here lang after.',
    },
    pine: {
      name: 'Pine Thicket',
      entry: 'Dark amang the pines. Stay sharp.',
      loreSnippet: 'Old Caledonian pines. Faerie folk hold court in the deepest groves.',
      lore: 'The Caledonian Forest aince covered maist o the Hielans — Pinus sylvestris, Scots pine, gnarled and twin-trunked. The remnant scraps (Black Wood o Rannoch, Glen Affric) are aulder than maist kingdoms. Listen for capercaillie tympani-thumping in spring, and watch the canopy for red squirrels and pine martens. Midges roost in the bracken. The faerie folk hold court in the deepest groves; if ye hear a fiddle and ye cannae find the player, walk briskly the other way.',
    },
    heather: {
      name: 'Heather Bloom',
      entry: 'The heather\'s singin\' — this is haggis country.',
      loreSnippet: 'Calluna vulgaris in flower. Pure haggis country.',
      lore: 'Calluna vulgaris — heather — flowers in August, and the hale moor turns purple to the horizon. White heather is held tae bring luck (the lucky-heather sellers in the Glasgow Barras still trade on it). Grouse strut and clatter; heather honey lies thick and dark in the hives. This is haggis country — Burns ca\'d the moor "wild an stern" but maist wha bide here ca\' it hame. Walk softly: a flowering moor in late summer is yin o the things Scotland is.',
    },
  },
  // ── C1 Highland Almanac — beastie lore (consumed by buildBeastieDetail). ──
  // Each entry covers one creature in the bestiary: Scottish folklore /
  // history / natural-history grounded, ~30-50 words. The Almanac's
  // detail panel reads `beastie.<key>.lore` directly — these strings are
  // the panel's primary content.
  beastie: {
    tourist: {
      lore: 'Bus parties from Edinburgh, cameras swung like censers. The wild haggis is shy of camera flashes; the camera flashes don\'t flinch. Off the bus, on the moor, asking the wrong questions of the wrong locals.',
    },
    chef: {
      lore: 'A Sunday-roast cook in striped apron and cleaver. Sees the haggis as Sunday lunch. Doesn\'t see itself as the haggis sees it. Comes from the kind of kitchen where the timer is also a weapon.',
    },
    midge: {
      lore: 'Culicoides impunctatus — the Highland midge. Smaller than memory, larger than reputation. Two thousand bites a minute on a bad day at Ben Nevis. The real predator of the West Highlands; the wild haggis eats bracken to keep them off.',
    },
    highland_cow: {
      lore: 'A heeland coo — Bos taurus, Highland breed. Russet, fringe-eyed, gentle until provoked. Slow as a glacier, hard as a horseshoe. Featured on every other shortbread tin in Scotland; she has earned it.',
    },
    eagle: {
      lore: 'Aquila chrysaetos in the Cairngorms; white-tailed sea eagle off Mull. Wingspan two metres, eyesight at twelve hundred yards. Hunts in slow downward gyres; the wild haggis stays close to bracken for a reason.',
    },
    haggis_hunter: {
      lore: 'The hunter with a net and a song. Wild-haggis season runs Aug 26 to Nov 30 by tradition; the hunters never read the dates. Knows two kinds of bait: oats and silence. Knows one kind of mercy: short.',
    },
    angry_scotsman: {
      lore: 'The man on the corner who took offence at something half a century back. Hasn\'t put it doon. Carries it like a kettle off the boil. His tartan is real but it is not his.',
    },
    deep_fryer: {
      lore: 'Deep-fried haggis is real and unmissable; the deep-fried Mars Bar arrived from Stonehaven 1995. The fryer here knows neither limit nor mercy. Comes through the moor in its own oil, hot enough to keep walking.',
    },
    piper: {
      lore: 'A solo piper. Three drones, one chanter, one breath. Walks slow. Bites slower. Used to play funerals and weddings; now plays on the moor and won\'t say which. The wild haggis is drawn to the drone.',
    },
    berserker: {
      lore: 'Caithness still echoes the Vikings. The berserker chews her shield rim and goes; the shield rim chews back. Pictish-tinged tartan; iron-rim eyes. Older than most kingdoms; angrier than most kingdoms deserve.',
    },
    ghost: {
      lore: 'A generic Scottish revenant. Grey-clad, sober, slightly resigned. Knows where it died. Hangs around politely. Will not move on without an argument; will not bear an argument without an audience.',
    },
    nest: {
      lore: 'An enemy spawner — eggs that hatch midgies and worse. Built of grey twigs and old fleece. Found in pine bracken at the foot of cairns. Older than the cairn. Outlives the cairn-builder.',
    },
    sheep: {
      lore: 'Blackface, Cheviot, North Country, who knows. Stares blankly. Doesn\'t move much. Will charge if you imply it doesn\'t belong. Owns more of Scotland than most of the people who are Scottish.',
    },
    kelpie: {
      lore: 'Each-uisge of the lochs. Looks like a horse on the bank, drinks like a horse — and you only realise what you\'ve petted when your hand sticks. Hauls victims under. The reins on its neck are skin, not leather.',
    },
    midgie_swarm: {
      lore: 'Cloud, not particle. A midgie swarm at peak season is not bites — it is atmosphere. The Glen Coe hikers\' lament. Some say the Cailleach raised them to keep visitors humble. No-one disputes it.',
    },
    buckfast_ned: {
      lore: 'A young man in a Lonsdale tracksuit holding a bottle of Buckfast Tonic Wine. Bucky comes from the Benedictines at Buckfast Abbey, Devon — somehow, the Lanarkshire weans claimed it. Drops a slick on death.',
    },
    barghest: {
      lore: 'A great black hound of the Border country. Black-shucks territory if you\'re south; barghest if you\'re north. Howls thrice; the third howl tells the future of someone. Best not to listen for whom.',
    },
    kelpie_foal: {
      lore: 'A young kelpie. Smaller, less drowning-power. Trots along the loch\'s edge looking for a hand to hold. The hand it holds, holds it. Don\'t.',
    },
    blue_man_of_minch: {
      lore: 'Na Fir Ghorma — the Blue Men of the Minch. Storm-spirits who challenge passing ships to a riddle-rhyme. Failed riddles, lost ships. The Sound of Shiant remembers; the haggis remembers; the moor remembers.',
    },
    haar_wraith: {
      lore: 'Spirit of the haar — the cold sea-fog that rolls over Edinburgh and the East Lothian coast in summer. Visibility goes from two miles to ten yards in seven minutes. Where the wraith breathes, the fog stays.',
    },
    ceilidh_caller: {
      lore: 'The voice of Strip the Willow — the ceilidh dance that hasn\'t lost a step in two centuries. Calls steps faster than ye can take them. The wild haggis can\'t ceilidh; three left feet, two right ones, and a drift.',
    },
    seelie_piper: {
      lore: 'The Seelie Court — the bright faeries who give before they take. Pale gold pipes, fair-of-face, generous in song. If they take you for a dance, the kingdom you return to has moved on by a hundred years.',
    },
    redcap: {
      lore: 'A Border-faerie of the bloody-cap tradition; he kept his cap red with travellers\' blood. Stocky, heavy-booted, iron-pike. Thirteen-foot reach from a standing pose. Will follow till he fails or fells.',
    },
    unseelie_fiddler: {
      lore: 'The Unseelie Court — the dark faeries who take and don\'t return. Violet-black robes; fiddle of unstrung yew. Plays a three-note pattern that breaks any clock that hears it. The clock\'s bones never reset.',
    },
    gale_wraith: {
      lore: 'Spirit of the Atlantic gale — the kind that flattens forestry from Skye to the Borders in one night. The haggis can\'t out-walk it. The haggis can sometimes get behind it; the haggis usually doesn\'t.',
    },
    edinburgh_ghost_guide: {
      lore: 'A Victorian-era spectre in top-hat and tails. Tells the wrong stories about Greyfriars; charges ten shillings for the privilege. Old Town content; cultural review still owed. The haggis carries him back to the bracken if it can.',
    },
    traffic_cone_totem: {
      lore: 'An accumulation of traffic cones around the Duke of Wellington statue at the foot of Royal Exchange Square, Glasgow. The city has tried to remove the cone since 1986. The cone has remained. A folk-monument by attrition.',
    },
    tome_wraith: {
      lore: 'Old College, Edinburgh, where bound books became legal libraries. A tome-wraith is what happens when a law book is burned but the binding survives. Floats; remembers; pages still flap on a still day.',
    },
    dean_apparition: {
      lore: 'A 19th-century university dean in mortarboard and gown. Has a clock to keep. Walks straight through students who haven\'t said sir. Did so in life; sees no reason to revise the practice in death.',
    },
    ledger_wraith: {
      lore: 'Edinburgh\'s Excise Office bred them. A ghost in green-shaded ledgers, fingers stained ink-black. Knows your debts; remembers them across generations. Forgets nothing; forgives less.',
    },
    auditor_priest: {
      lore: 'Half-Calvinist minister, half-treasury auditor. Censer in one hand, balance-sheet in the other. The Church and the Crown collected from the same drawer for centuries. The haggis remembers the drawer.',
    },
    cu_sith: {
      lore: 'Cù Sìth — the Highland fairy hound. Mossy green-coated, the size of a young bullock, ears tall and intact. Hools thrice across the moor; the third hool catches anyone caught in the open. Kill it before the third bay and the charge fails. SCOTTISH_RESEARCH §1.2; the Highland version of the death-hound — green, not black like the Border barghest.',
    },
    // ── Bosses (6) ──
    gordon: {
      lore: 'A chef of the Sunday-roast school who took the haggis personally. Loud, declarative, knife in each hand. The first boss of any run; the kind you remember after, not during.',
    },
    each_uisge: {
      lore: 'The deepest of the water-horses. The kelpie\'s elder. Found in the open lochs — Ness, Awe, Morar. When children went missing in the West Highlands, the each-uisge took the blame. Sometimes correctly.',
    },
    tour_bus: {
      lore: 'A Scottish-tour coach, full of distracted tourists, with Greyfriars Bobby ringtones. Drives over moor with the same disregard the moor drives over them. Boss of act 2 by sheer momentum.',
    },
    the_laird: {
      lore: 'An aristocrat with a freehold a hundred thousand acres wide that his grandfather got after Culloden. Wears tartan that doesn\'t belong to him. Owns a salmon river you can\'t fish.',
    },
    hunter_general: {
      lore: 'The supervising haggis-hunter. Has a rifle older than the Empire and a crew older than that. Treats the hunt as inheritance. Treats the haggis as a ledger entry.',
    },
    taxman: {
      lore: 'The final boss. The Excise Office wearing a face. Has a stamp; the stamp\'s older than the kingdom. Once you face it, the run is over either way — defeated or paid.',
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
      flavour: 'A hundred thistles where there was one. The bairn grew old; the thistles did not. She is buried in Alloway; her garden is everywhere.',
    },
    highland_fling: {
      name: 'The Highland Fling',
      description: 'A great sonic ring blooms outward. The moor sings; yir enemies come apart.',
      flavour: 'The dance steps are three centuries old; the drum beneath them older still. The Fling is not a fling at all — it is a promise, kept.',
    },
    highland_games: {
      name: 'Highland Games',
      description: 'The caber detonates on its final pierce, leaving a burning patch o\' grass. Heave, ho.',
      flavour: 'Twenty-two pounds of hammer; one-fourteen of stone; one haggis wielding the catalogue. The Braemar Gathering would have concerns.',
    },
    the_haar: {
      name: 'The Haar',
      description: 'The great Highland fog rolls in. Half the moor vanishes; anything caught in it dissolves.',
      flavour: 'Sea-fog named for the east coast, where Aberdeen fishermen watch it come. It lifts on its own time. The visibility is a courtesy.',
    },
    haggis_cannon: {
      name: 'Jobby Cannon',
      description: 'Rapid-fire wee jobbies — every bounce ends in a messy pop.',
      flavour: 'Every shot is a haggis; every haggis an eulogy. The range improves with practice; the flavour does not.',
    },
    nessie_unleashed: {
      name: 'Nessie Unleashed',
      description: 'Every tentacle, every angle. The loch herself comes to yir aid.',
      flavour: 'She is visible, for a moment. The moment ends badly for whomever she was looking at.',
    },
    william_blade: {
      name: 'William Blade',
      description: 'Legendary claymore — shockwaves tear across the moor like a battle-cry.',
      flavour: 'Blessed in his name, not his possession. Wallace never held it; the blade has pretended otherwise since 1305.',
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
    ach_relic_seeker: {
      title: 'Relic Seeker',
      description: 'Answered the hum off-path — claimed a Reliquary curio.',
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
    ach_cailleach_unlock: {
      title: 'Walked Through the Veil',
      description: 'Finish three cursed runs alive.',
    },
    ach_doric_unlock: {
      title: 'Survive on What Ye Caught Yesterday',
      description: 'Won a run wi\'oot standin\' in a single healin\' circle. The Doric way.',
    },
    ach_peerie_unlock: {
      title: 'The Sea Way Home',
      description: 'Won a run by coast an\' wood alone — voe and pine, no moor, no bog.',
    },
    ach_burns_beastie_unlock: {
      title: 'Earned When the Bard Is Honoured',
      description: 'Won a run wi\' all seven legends forged. Burns smiles.',
    },
  },
  tutorial: {
    move: 'WASD or stick to roam — weapons fire themselves. SPACE: a cheeky dash through trouble (and through enemies).',
    gem: 'Gather gems to level. Max a weapon plus its paired curio, then pop a treasure chest for a legendary glow-up.',
    drift: 'Yir wee haggis drifts clockwise — crooked legs! Lean into it.',
    /** Drift micro-practice (replaces the passive drift hint). Banner text
     *  while a marker glows nearby — player walks into the marker to clear,
     *  Enter / Space / tap to skip, 12s auto-timeout. Hearth register. */
    drift_practice: 'Yir wee haggis curves clockwise — wander into the gold ring tae feel it. Enter or tap tae skip.',
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
      flavour: "First thrown by a crofter's bairn who'd watched a Viking bare his sole on a thistle. \"If it kept a kingdom,\" she reasoned, \"it might keep me.\" Every thistle since remembers her.",
    },
    bagpipe_blast: {
      name: 'Bagpipe Blast',
      description: 'A wee shockwave to knock the breath oot o\' foes.',
      flavour: 'A note held too long. The drone has a name — no piper recalls it. The beasties scatter, as they did at Killiecrankie.',
    },
    caber_toss: {
      name: 'Caber Toss',
      description: 'A log the size of a door, thrown clean through a crowd.',
      flavour: 'Two-and-twenty feet of pine, tossed end-over-end for form, not distance. The judge at Braemar is never impressed. The haggis practices anyway.',
    },
    scotch_mist: {
      name: 'Scotch Mist',
      description: 'Trail a creeping fog. What wanders in doesnae wander oot.',
      flavour: "A trick of weather. A trick of poets. The mist \"scotches\" what it passes. Some say the word means nothing; some say it means everything.",
    },
    haggis_hurler: {
      name: 'Jobby Hurler',
      description: 'Bouncing wee jobbies that ricochet till they stick.',
      flavour: 'The old sport. Lorne Coltart threw one sixty-six metres, in 2011. A wild haggis throws itself further, given cause.',
    },
    nessie_tentacle: {
      name: "Nessie's Tentacle",
      description: 'A sweeping arm from the loch — wide reach, meatier knockback.',
      flavour: "She's never been seen whole. A wrinkle of the loch's surface. A shadow at Urquhart. The tentacle is what's visible; the rest is what's believed.",
    },
    claymore: {
      name: 'Highland Claymore',
      description: 'A sword the weight of a man. Slow to lift, enormous in the sweep.',
      flavour: "Too heavy for any creature save a legend. Wallace is said to have wielded one, though a haggis wouldn't know the difference. The blade remembers Falkirk. It does not forgive it.",
    },
    bagpipes: {
      name: 'Ceòl Mòr Bagpipes',
      description: 'A great drone that presses on yir enemies like weather.',
      flavour: "Drones older than speech. In the Highland tongue they are the \"great music\" — ceòl mòr. Enemies who know the old tunes keep their distance. Those who don't, learn.",
    },
  },
  boss: {
    gordon: { name: 'Gordon the Chef' },
    each_uisge: { name: 'The Each-Uisge' },
    tour_bus: { name: 'The Tour Bus' },
    the_laird: { name: 'The Laird' },
    hunter_general: { name: 'The Haggis Hunter General' },
    taxman: { name: 'Death (The Taxman)' },
  },
  /**
   * C2 — passive curios. Dark-Souls-style flavour text, domestic-mystical
   * register (croft-corner found objects). Mechanical descriptions live on
   * the `upgradeCard.add_*` entries; flavour sits alongside them here.
   */
  passive: {
    sporran: {
      flavour: 'Capacious beyond reason. Gran insists it\'s just well-organised. It holds the day\'s pickings and, sometimes, things the haggis doesn\'t remember collecting.',
    },
    whisky_flask: {
      flavour: 'Filled from a distillery that was drowned when the dam went up. The ten-year-old lasts forever. It is not quite the same as the ten-year-old one can buy.',
    },
    kilt: {
      flavour: 'The great kilt, the feileadh mòr — eighteen feet of wool, belted at the waist and thrown over the shoulder. Gran pinned it. Gran mends it.',
    },
    tam_o_shanter: {
      flavour: "Red toorie on a flat bonnet, named for Burns's drunk, who rode past Alloway Kirk one winter and saw what he oughtn't have. The haggis rides lighter.",
    },
    irn_bru: {
      flavour: "Cumbernauld's contribution to the canon. 1901. The recipe is secret; the caffeine is real. The orange stains of it have been known to save marriages.",
    },
    loch_water: {
      flavour: 'Drawn from a burn that feeds into a loch that no-one names. Peat-dark. Cold. The haggis holds it close; so does whatever else is in it.',
    },
    thistle_crown: {
      flavour: 'Woven by the bairn who invented the Thistle Shot. Gran says it has never been removed; the haggis is not sure who is wearing whom.',
    },
    highland_shield: {
      flavour: 'Round, oak-faced, oxhide-bound. The targe at Culloden. It saved some and not others. The haggis carries one anyway.',
    },
    tartan_sash: {
      flavour: 'Royal Stewart, by the design — though the wearer has no right to it. The moor does not mind. The sash is proud to be worn.',
    },
  },
  variant: {
    classic: {
      name: 'Classic Haggis',
      flavor: 'The baseline beast. Crooked legs, straight ambition.',
      lore: 'The baseline beast, before records began. What the moor was before it was named. Gran says every haggis comes home to this one in the end.',
    },
    moor_runner: {
      name: 'Moor Runner',
      flavor: 'Lean and wind-cut, built to skim the heather.',
      lore: 'Lean as a winter stoat. Skin taut to the frame; every ounce wedded to speed. The moor makes runners of those it cannot hold.',
    },
    iron_belly: {
      name: 'Iron Belly',
      flavor: 'Heavy, stubborn — an\' hard tae stop once it starts rollin\'.',
      lore: 'Slow-stepping kin of the bog, thick-ribbed and granite-sided. Gordon the Chef has tried, on three occasions, to put a knife through one. The knife lost.',
    },
    glen_forager: {
      name: 'Glen Forager',
      flavor: 'A scavenger of glens and glittering spoils.',
      lore: 'Tracks the glen by what it leaves behind. Every thistle-seed, every coin lost to the heather. Gran keeps one in the kitchen for the gleanings.',
    },
    surefoot: {
      name: 'Surefoot',
      flavor: 'The drift still whispers, aye, but it no longer decides.',
      lore: 'The drift still whispers in the crooked legs. The surefoot has learned to listen without obeying. The hill pays it no mind; it pays the hill the same.',
    },
    pipe_breath: {
      name: 'Pipe Breath',
      flavor: 'Wheesht — the moor exhales through this one.',
      lore: 'Born to the drone. Its heart keeps time to a ceòl mòr no other creature hears. The bagpipes are an echo; this haggis is the breath behind them.',
    },
    laird: {
      name: 'The Laird',
      flavor: 'Wears the tartan proper. Lordly swagger, heavier swing.',
      lore: 'Wears the Royal Stewart without permission and without apology. Tenants bow; rents never rise. The kilt is pinned straight; the swing is heavier.',
    },
    wee_ghostie: {
      name: 'Wee Ghostie',
      flavor: 'Pale an\' thin — here an\' no\' here. Hits hard, breaks easy.',
      lore: 'Pale at the edges, thin as a thought. Here and then not. The Cailleach keeps one in her shawl, or so it is said; the wee ghostie does not remember being kept.',
    },
    glaswegian: {
      name: 'Glaswegian',
      flavor: 'Urban punisher. Heavy swing, skin like rice paper. Aye, mental.',
      lore: 'From the city where the rain is horizontal. Skin like rice paper, swing like a hammer. Aye, mental — but the moor has learned respect.',
    },
    cailleach: {
      name: 'The Cailleach',
      flavor: 'Ancient as the moor itself. Moves slow, hoards the glen\'s secrets. Aye, she\'s been here longer than ye.',
      lore: 'She is older than the moor. The stones remember her. When the first frost comes down from the glen, it comes because she has asked it to.',
    },
    anticlockwise: {
      name: 'Widdershins Haggis',
      flavor: 'The other subspecies, from the glens where the hills lean left. Drift turns the wrong way — or the right way, dependin\' who ye ask.',
      lore: 'The other subspecies, from the glens where the hills lean widdershins. The drift mirrors. The clock in the kirk at Glen Lyon runs the right way; every haggis born there runs the other.',
    },
    doric_quinie: {
      name: 'Doric Quinie',
      flavor: 'Nor\'-east fisher-family wee beastie. Granite constitution, quick een, a heid for the haar. Fit like, min?',
      lore: 'Fae the nor\'-east, whaur the land drops tae the sea an the sea disnae forgive. Granite constitution, an een for the haar rollin aff Aiberdeen. Fit like, min?',
    },
    peerie_shetlander: {
      name: 'Peerie Shetlander',
      flavor: 'Fae the northern isles — Norn-tinged, peerie, sea-footed. The voe remembers ye, du. The wind\'s already up.',
      lore: 'Fae the northern isles, whaur Norn is still whispered in bairns\' names. Peerie — wee — but wind-tempered. The voe minds ye; du\'ll mind it back.',
    },
    burns_wee_beastie: {
      name: 'Burns\'s Wee Beastie',
      flavor: 'Wee, sleekit, cow\'rin, tim\'rous beastie — stepped oot the bard\'s poem. Smaller than the moor, fiercer than it looks.',
      lore: '"Wee, sleekit, cow\'rin, tim\'rous beastie, O what a panic\'s in thy breastie" — Burns spoke of mice, but the wild haggis listened. Smaller than the moor; braver than it should be.',
    },
    witch_hare: {
      name: 'Witch\'s Hare',
      flavor: 'Isobel\'s wirds, runner o the muirs. Sma\' siller, quick stop, quicker turn. Auld een that see ower the loch.',
      lore: '"I sall gae intill ane haire" — Isobel Gowdie of Auldearn, 1662. The covine\'s confession set tae verse: the wee silver-pelt hare is the witch when the witch is a hare. Five trials survived earn the hare-form for keeps.',
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
      crit: '{sign}{pct}% crit',
      size: '{sign}{pct}% size',
      drift_flip: 'Drift goes widdershins',
      baseline: 'Baseline stats',
    },
    unlock: {
      // These are short labels interpolated into a "Label: current/required" strip.
      // Kept terse so the line doesn't overflow the variant panel.
      survive: 'Survive',
      best_kills: 'Best kills',
      total_gold: 'Gold banked',
      victories: 'Victories',
      cursed_victories: 'Cursed wins',
      runs_without_healing: 'No-heal runs',
      runs_in_coastal_only: 'Coastal-only runs',
      runs_with_all_evolutions: 'Full-evo victories',
      burns_night_full_evo: 'Full-evo Burns Night wins',
      ready: 'Ye earned this one',
    },
  },
  permanentUpgrade: {
    thick_hide: {
      name: 'Thick Hide',
      description: 'A hide thick enough to shrug off the first wee knocks (+5% starting HP).',
      flavour: 'Passed down. Each generation thickens a little. The haggis in the shop mirror looks weathered; Gran says that\'s just the light.',
    },
    strong_legs: {
      name: 'Gallus Legs',
      description: 'Quicker hooves from the very first step — pure gallus (+3% speed).',
      flavour: 'Hill-walked since before memory. The uphill leg is shorter than the downhill. Or the other way. It depends on which side of the hill.',
    },
    sharp_thistles: {
      name: 'Sharp Thistles',
      description: 'Every thistle hits a shade harder (+5% damage).',
      flavour: 'Selection takes place in the soil. Each year\'s crop grows pricklier. Gran composts the herbaceous; the haggis composts the rest.',
    },
    magnetic_personality: {
      name: 'Magnetic Personality',
      description: 'Gems lean toward ye of their own accord (+10% pickup radius).',
      flavour: 'Some beasties lean closer without being asked. Gran calls it charm; the haggis suspects it\'s the smell of the sporran.',
    },
    lucky_heather: {
      name: 'Lucky Heather',
      description: 'The glen rolls kinder picks (+10% card rarity).',
      flavour: 'White heather, found in the peat below where a shepherd fell in 1820. Still fragrant. Still lucky — though not for him.',
    },
    drift_control: {
      name: 'Drift Control',
      description: 'Tighter turns, fewer tumbles (-15% clockwise drift).',
      flavour: 'Crooked legs cannot be straightened. They can be listened to. After enough hills, one learns which leg to trust on which slope.',
    },
    extra_choice: {
      name: 'Extra Choice',
      description: 'One more pick at every level-up, for when ye cannae decide.',
      flavour: 'Three roads and a riddle. The glen offers a fourth. It will not offer the riddle twice.',
    },
    battle_hardened: {
      name: 'Battle Hardened',
      description: 'Old scars become plate — start each run with +2 armor.',
      flavour: 'Old scars become plate. Gran mended them once; the haggis has since stopped counting.',
    },
    weapon_training: {
      name: 'Battle-Tested',
      description: 'Ye\'ve been oot before — yir Thistle Shot starts a level stronger.',
      flavour: 'The first thistle fires cleaner than it used to. Not from practice — from the ones fired before, remembering.',
    },
    crit_power: {
      name: 'Heid-the-Baw',
      description: 'Ye ken exactly where tae wallop them (+3% crit chance, +25% crit damage).',
      flavour: 'Where to strike is a question. When to strike is another. The haggis has begun asking both at once.',
    },
    xp_boost: {
      name: 'Scholar\'s Mind',
      description: 'The glen teaches ye faster (+8% XP gain).',
      flavour: 'The glen is a long book. It is kinder to those who have read it once.',
    },
    lucky_start: {
      name: 'Lucky Start',
      description: 'Start each run with a random curio already in yir pocket.',
      flavour: 'Some mornings the sporran is already heavier than it should be. Gran denies it. The pickings deny nothing.',
    },
    natural_recovery: {
      name: 'Moor\'s Mend',
      description: 'The moor patches ye up as ye run — slow and steady like (+0.3 HP/sec).',
      flavour: 'The peat closes over a wound the way it closes over a bog-body: slowly, and without comment.',
    },
    revival: {
      name: 'Second Wind',
      description: 'Once per run, shrug off death wi\' 50% HP and keep going.',
      flavour: 'Once, the haggis died before the run ended. The moor was displeased. It has since taken steps.',
    },
    double_dash: {
      name: 'Double Dash',
      description: 'Two dashes in the hoof instead of one.',
      flavour: 'Two breaths between, instead of one. The second one is for Gran.',
    },
    treasure_magnet: {
      name: 'Treasure Magnet',
      description: 'Chests and coins linger a few breaths longer (+5s).',
      flavour: 'Chests hesitate longer in the grass. Coins remember who has patience. The haggis has learned to wait — almost.',
    },
    dirk_hand: {
      name: 'Dirk Hand',
      description: 'A quicker draw on every weapon (+3% attack speed).',
      flavour: 'The dirk was worn inside the sleeve. The hand learned where to find it. So did every weapon since.',
    },
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
    // ── Post-cap echo cards ──
    // Small stat-boost whispers drawn after MAX_LEVEL. Voice register:
    // warmer Still-Game note than the combat cards — these are the
    // moor's memory, not a new weapon. Each copy leads with the echo /
    // whisper / glen / land metaphor so the set reads as one family.
    echo_damage: {
      name: 'Sharper Echo',
      description: 'A thistle-sharp whisper from the moor (+4% damage).',
    },
    echo_crit: {
      name: 'Sharp Eyes',
      description: 'The glen shows where it gives (+2% crit chance).',
    },
    echo_speed: {
      name: 'Quick Whisper',
      description: 'Light in the step, barely there (+3% move speed).',
    },
    echo_hp: {
      name: 'Bone Deep',
      description: 'The land lays iron in yir ribs (+5 max HP).',
    },
    echo_pickup: {
      name: 'Pull of the Glen',
      description: 'Gems lean in when called (+6 pickup radius).',
    },
    echo_armor: {
      name: 'Stone Skin',
      description: 'A fine layer o\' moor-grit on yir hide (+1 armor).',
    },
    echo_cooldown: {
      name: 'Quick Hands',
      description: 'Weapons snap back a shade sooner (-3% cooldowns).',
    },
    echo_lifesteal: {
      name: 'Hungry Thistle',
      description: 'Every cut feeds ye a wee bit back (+0.3 HP per kill).',
    },
    // Templates used by buildCardPool for level-up cards.
    // Space between "Lv" and the number to match ui.hud.level_fmt for visual
    // consistency across HUD + card + game-over weapon summaries.
    levelup: {
      name: '{weapon} Lv {level}',
      description: 'Hone {weapon} up tae level {level}. Every notch counts.',
    },
    evolution_hint: ' At Lv 5, crack a chest while carrying {passive} — somethin\' legendary stirs.',
    /**
     * T215 — appended to a passive card's description when picking it
     * would complete an evolution recipe (matching weapon already at
     * Lv 5, not yet evolved). Tells the player the next chest will
     * offer the named legendary form. Hearth-warm voice; no shouty caps.
     */
    evolution_ready_hint: ' ★ Evolves into {evolved} at the next chest.',
    /**
     * Phase B Endless — Overcharge mythic-tier card. Post-bell only,
     * once per evolved weapon per run. Voice: Edge register — the
     * weapon "remembers what it was; remember what it was for". Damage
     * + area scaled, but the line trades on the moment, not the math.
     */
    overcharge: {
      name: 'Overcharge {weapon}',
      description: '{weapon} burns hotter — +25% damage, +20% area. Once only.',
    },
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
  // ──────────────────────────────────────────────────────────────
  // M1 — Moor Road multi-node expansion.
  //
  // Voice mirror: Hearth-warm for rest / shrine / trader; Grave / Fey
  // for bargain / elite; wry Wild-Comedy for urban nodes in Act 3.
  // Names stay short (≤ 4 words) so they fit the HUD pill.
  // Prompts are one-line invitations. Toasts + prompt titles are
  // reserved at `nodes.ui.*` so scene code resolves them through `t()`.
  // ──────────────────────────────────────────────────────────────
  nodes: {
    ui: {
      progress: 'Act {act} · {current}/{total}',
      shrine_title: 'An old shrine stirs.',
      shrine_body: 'Offer a thought — claim a wee boon.',
      trader_title: 'The wee trader spreads a blanket.',
      trader_body: 'Pick one from the pack. (Sporran: {gold}g)',
      bargain_title: 'A cold voice on the wind.',
      bargain_body: '"Pay {hp} HP, take {offer}."',
      leave: 'Leave',
      accept: 'Accept',
      accept_cost: '(-{hp} HP)',
      /** Affordable price subLabel — worn on the option when balance covers it. */
      trader_price: '({price}g)',
      /** Unaffordable price subLabel — same text, disabled option handles the grey. */
      trader_price_short: '({price}g — short)',
      trader_item: {
        relic: 'Rare curio',
        passive: 'Passive charm',
        reroll: 'Reroll token',
      },
      toast: {
        rest: 'Hearth warmth — rested.',
        hidden_empty: 'A forgotten cairn — empty but for the wind.',
        bargain_refused: 'Refused the bargain.',
        bargain_relic: 'The bargain delivers a relic.',
        bargain_gold: 'The bargain: +10% gold for the rest of the run.',
        bargain_cooldown: 'The bargain: weapons cool 10% faster.',
        bargain_armor: 'The bargain: take 10% less damage.',
        bargain_token: 'The bargain: a token and a few coins.',
        trader_relic: 'A curio joins the sporran.',
        trader_empty_pack: 'The pack is empty — +40g on the house.',
        trader_no_passives: 'No passives in stock — kept your coin (+40g).',
        /** M1 F8 — trader passive pick that successfully delivered. */
        trader_passive_granted: '{name} tucked into the sporran.',
        trader_reroll: 'Reroll token pocketed.',
        shrine_boon: 'Shrine boon: {label}',
        /** M1 F4 — timed shrine buff toast. `{seconds}` is the duration tag. */
        shrine_buff_timed: 'Shrine boon: {label} — {seconds}s',
        shrine_gold: 'Shrine boon: +50 gold',
        shrine_xp: 'Shrine boon: +25 XP',
        shrine_luck_relic: 'Shrine boon: a relic glints in the cairn',
        shrine_luck_gold: 'Shrine boon: +30 gold (shelves bare)',
      },
    },
    boon: {
      buff_damage: { label: 'Sharpen your teeth' },
      buff_speed: { label: 'Quicken your trot' },
      buff_luck: { label: 'A turn of fortune' },
      buff_armor: { label: 'Harden your hide' },
      buff_regen: { label: 'Slow mending' },
      buff_pickup: { label: 'Wider gather' },
      buff_crit: { label: 'A lucky tusk' },
      buff_reflect: { label: 'The moor bites back' },
      buff_dodge: { label: 'A side-step ready' },
      buff_xp: { label: 'Quick wisdom' },
      buff_gold: { label: 'A handful of coin' },
    },
    offer: {
      rare_relic: 'a rare relic',
      buff_damage_run: 'less damage taken',
      buff_cooldown_run: 'faster weapons',
      buff_speed_run: 'a swifter foot',
      weapon_upgrade_token: 'a token of sharpening',
    },
    // --- Encounter names (act-scoped) ---
    a1: {
      thistle_ambush: { name: 'Thistle ambush' },
      hare_rush: { name: 'Hare rush' },
      midge_cloud: { name: 'Midge cloud' },
      wee_hunters: { name: 'Wee hunters' },
      chef_parade: { name: 'Chef parade' },
      cow_crossing: { name: 'Cow crossing' },
      eagle_sweep: { name: 'Eagle sweep' },
      piper_pair: { name: 'Piper pair' },
      scotsman_rabble: { name: 'Scotsman rabble' },
      ghostie_flit: { name: 'Ghostie flit' },
    },
    a2: {
      buckie_brawl: { name: 'Buckie brawl' },
      barghest_patrol: { name: 'Barghest patrol' },
      kelpie_shoals: { name: 'Kelpie shoals' },
      fae_courtiers: { name: 'Fae courtiers' },
      blue_men: { name: 'Blue men of the Minch' },
      haar_roll: { name: 'Haar roll' },
      redcap_raiders: { name: 'Redcap raiders' },
      deep_fryers: { name: 'Deep-fryer line' },
    },
    a3s1: {
      ghost_tour: { name: 'Ghost-tour ambush' },
      close_closure: { name: 'Close closure' },
      ceilidh_riot: { name: 'Ceilidh riot' },
      dean_procession: { name: 'Dean procession' },
    },
    a3s2: {
      wild_hunt: { name: 'Wild Hunt' },
      nest_sprawl: { name: 'Nest sprawl' },
      fae_war: { name: 'Fae war' },
      barghest_pack: { name: 'Barghest pack' },
    },
    a3s3: {
      ledger_column: { name: 'Ledger column' },
      audit_office: { name: 'Audit office' },
      ghost_assembly: { name: 'Ghost assembly' },
      fryers_riot: { name: 'Fryers\' riot' },
    },
    // --- Shared-category names + prompts (shrine / trader / rest / hidden / bargain / elite) ---
    shrine: {
      standing_stone: {
        name: 'Standing stone',
        prompt: 'Touch the stone. Choose a gift.',
      },
      cairn: {
        name: 'Wayside cairn',
        prompt: 'Add a stone. Take a boon.',
      },
      well: {
        name: 'Wishing well',
        prompt: 'Drop a thought. Pick a blessing.',
      },
      fairy_ring: {
        name: 'Fairy ring',
        prompt: 'Step lightly. Take the offering.',
      },
      rowan: {
        name: 'Rowan shrine',
        prompt: 'The red berries listen. Choose.',
      },
      loch_votive: {
        name: 'Loch-side votive',
        prompt: 'The water remembers. Accept its gift.',
      },
      old_town: {
        name: 'Close-wall shrine',
        prompt: 'Old stone holds old luck. Take one.',
      },
      wallace: {
        name: 'Wallace-mark shrine',
        prompt: 'Stand tall. Claim the boon.',
      },
      taxmans_eye: {
        name: 'Taxman\'s eye',
        prompt: 'The ledger watches. Pick quickly.',
      },
    },
    trader: {
      tinker: {
        name: 'Wandering tinker',
        prompt: 'Goods fer the brave, a reroll fer the wise.',
      },
      sheepdrover: {
        name: 'Sheep drover',
        prompt: 'Between herds, a wee swap?',
      },
      packman: {
        name: 'Packman',
        prompt: 'Roads are lonely. Fancy a trade?',
      },
      smith: {
        name: 'Roadside smith',
        prompt: 'Iron and sparks and a reroll token.',
      },
      close_hawker: {
        name: 'Close hawker',
        prompt: '"Git yer curios, git yer charms."',
      },
      traveller: {
        name: 'Highland traveller',
        prompt: 'Pipes on my back, goods in my bag.',
      },
      ferryman: {
        name: 'Taxman\'s ferryman',
        prompt: 'Crossing costs — but ye pick the cargo.',
      },
    },
    rest: {
      bothy: { name: 'Bothy hearth' },
      hearth: { name: 'Hearth fire' },
      crofters_hearth: { name: 'Crofter\'s hearth' },
      shielling: { name: 'Shielling hut' },
      close_hearth: { name: 'Close-corner hearth' },
      highland_pasture: { name: 'Highland pasture' },
      last_bothy: { name: 'Last bothy' },
    },
    hidden: {
      thistle_patch: {
        name: 'Thistle patch',
        prompt: 'Something glints among the thorns.',
      },
      pictish_stone: {
        name: 'Pictish stone',
        prompt: 'A carved stone — touch it?',
      },
      clootie_tree: {
        name: 'Clootie tree',
        prompt: 'Rags tied with wishes. Take one?',
      },
      vennel: {
        name: 'Forgotten vennel',
        prompt: 'A dead-end lane — worth a look?',
      },
      stone_circle: {
        name: 'Stone circle remnant',
        prompt: 'Old stones, older silence. Step in?',
      },
      sealed_archive: {
        name: 'Sealed archive',
        prompt: 'The seal is cracked. Read on?',
      },
    },
    bargain: {
      wee_folk: {
        name: 'Wee-folk bargain',
        prompt: 'The folk ask a little. Offer a little.',
      },
      cailleach_shadow: {
        name: 'Cailleach\'s shadow',
        prompt: 'The winter-crone counts yer breaths.',
      },
      unseelie_pact: {
        name: 'Unseelie pact',
        prompt: 'Sign in sweat, ask for favour.',
      },
      old_gentleman: {
        name: 'The Old Gentleman',
        prompt: 'A smile too sharp. A deal too clean.',
      },
      faerie_queen: {
        name: 'Faerie queen\'s terms',
        prompt: 'Her price is never gentle.',
      },
      taxmans_clerk: {
        name: 'Taxman\'s clerk',
        prompt: 'Figures in triplicate. Cost in blood.',
      },
    },
    elite: {
      wild_hunter: { name: 'Wild hunter' },
      angry_chef: { name: 'Angry head chef' },
      kelpie_prince: { name: 'Kelpie prince' },
      neds_boss: { name: 'The neds\' boss' },
      hunter_captain: { name: 'Hunter captain' },
      chief_auditor: { name: 'Chief auditor' },
    },
  },
  ancestor: {
    whisper: {
      '0': "Mind yer feet near the loch, pet.",
      '1': "The moor's a thief. Carry less.",
      '2': "Dinnae trust a tourist wi' a map.",
      '3': "The sheep ken more than ye think.",
      '4': "Ah died at minute twelve. Learn fae me.",
      '5': "Whit's fer ye'll no go by ye.",
      '6': "Keep an eye on the weather. Always.",
      '7': "Every haggis picks up where the last left aff.",
      '8': "The bell rings fer a reason, ye ken.",
      '9': "Kilt, pipes, patience — in that order.",
      '10': "If the midges stop biting, run.",
      '11': "Ah should've taken the left path.",
      '12': "Elites telegraph. Read the bloody glow.",
      '13': "Ye're no the first o' us tae try this.",
      '14': "The glen remembers ye. Make it a good memory.",
      // Extension batch (2026-04-29). Voice register: HEARTH per Voice
      // Card — fallen forebears speaking softly to the next runner.
      // Folkloric, sensory, kindly. Each leaf is a single-thought line:
      // a remembered detail (12), a small piece of moor wisdom (15-19),
      // a gentle correction (20-22), or a fond observation (23-29).
      '15': "The wee burns are aye colder than ye think.",
      '16': "If ye see a hare standing tall — that's a warning.",
      '17': "Cu Sith bays in threes. Ye'll only hear two if yer lucky.",
      '18': "Watch the haar move, no the thing it hides.",
      '19': "Selkies steal patience. Carry a wee bit extra.",
      '20': "Ye held the line too long. The line moves.",
      '21': "Drift's a friend. Stop fightin' her sae hard.",
      '22': "The first XP gem is the easiest. Aye, that\'s the trap.",
      '23': "Heather kens kindness. So does the haggis under it.",
      '24': "Loch water tells the truth. Drink only after a fight.",
      '25': "Crom Cruach\'s nae yer enemy — the silence after is.",
      '26': "I died wi the wrang weapon picked. Trust yer hooves first.",
      '27': "When the glen sings, sit still. Ye\'ll hear yer name in it.",
      '28': "I made it tae the bell. Couldnae make it past. Ye will.",
      '29': "Mind the corbies. They mind ye.",
    },
    kin: {
      'Great-great-gran': 'Great-great-gran',
      'Great-gran': 'Great-gran',
      'Gran': 'Gran',
      'Auntie': 'Auntie',
      'Uncle': 'Uncle',
      'Cousin': 'Cousin',
      'Elder': 'Elder',
      'Forebear': 'Forebear',
    },
    toast: '{kin} {name}: "{line}"',
  },
  /**
   * E1 M1 — Seasonal events (real-world-date-gated). Burns Night is
   * the first event; framework scaffolded in `SeasonalEventManager.ts`.
   * Chronicle stamps runs that started inside an event window with
   * the event's name; future events drop into this block.
   */
  seasonalEvent: {
    burns_night: {
      name: 'Burns Night',
      description: 'Jan 18 – Feb 1 — the bard\'s week on the moor.',
      badge_suffix: 'Burns Night',
      /** E1 T9/T22 — on-screen banner at run start / Croft re-entry. */
      ceremony_banner: '🕯 Burns Night is live — the bard keeps watch.',
    },
    hogmanay: {
      name: 'Hogmanay',
      description: 'Dec 28 – Jan 3 — kirk bells crack the year open.',
      badge_suffix: 'Hogmanay',
      ceremony_banner: '🔔 Hogmanay is live — a guid new year tae ye.',
    },
    samhain: {
      name: 'Samhain',
      description: 'Oct 28 – Nov 3 — the veil is thin; mind yer manners.',
      badge_suffix: 'Samhain',
      ceremony_banner: '🕯 Samhain is live — the Cailleach is watching.',
    },
    st_andrews: {
      name: 'St Andrew\'s Day',
      description: 'Nov 27 – Dec 3 — saltire weather on the moor.',
      badge_suffix: 'St Andrew\'s Day',
      ceremony_banner: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 St Andrew\'s Day is live — haud on fer hame.',
    },
    beltane: {
      name: 'Beltane',
      description: 'Apr 28 – May 4 — twin fires on the moor; the cattle run between.',
      badge_suffix: 'Beltane',
      ceremony_banner: '🔥 Beltane is live — pass between the twin fires.',
    },
    imbolc: {
      name: 'Imbolc',
      description: 'Feb 2 – Feb 8 — Brigid stirs; the lambing-sky leans warm.',
      badge_suffix: 'Imbolc',
      ceremony_banner: '🕯 Imbolc is live — Brigid\'s mantle is on the byre.',
    },
    lammas: {
      name: 'Lùnastal / Lammas',
      description: 'Jul 29 – Aug 4 — first sheaves cut; loaf-mass at the cairn.',
      badge_suffix: 'Lùnastal',
      ceremony_banner: '🌾 Lùnastal is live — the loaf is broken on the moor.',
    },
  },
  /**
   * R1 M4 Task 25 — Relic names, effects, flavour. 18 relics × 3
   * leaves = 54 EN keys. Voice tone per `docs/VOICE_CARD.md`:
   * - Common: Hearth register, warm + domestic ("Gran insists").
   * - Uncommon: Hearth + slight mystical.
   * - Rare: Dark-Souls-style flavour, quiet awe, long memory.
   */
  relics: {
    sporran_of_holding: {
      name: 'Sporran of Holding',
      effect: 'Every gold pickup yields +2.',
      flavour: 'The good sporran — the Sunday one. Lined in Loch Shin seal-skin before the ban. It holds what the day-sporran couldn\'t fit.',
    },
    oatcake_stash: {
      name: 'Oatcake Stash',
      effect: 'Healing orbs restore +2 HP.',
      flavour: 'One for each knee. Never knew when ye\'d need \'em.',
    },
    grans_thimble: {
      name: 'Gran\'s Thimble',
      effect: 'Critical hits deal +8% damage.',
      flavour: 'Silver, pitted from eight generations of mending. Gran wore it through the kilt, through the sash, through the thistle-crown\'s thorns. It has not missed a stitch.',
    },
    lucky_heather_sprig: {
      name: 'Lucky Heather Sprig',
      effect: '+3 luck on level-up card draws.',
      flavour: 'A twin to the heather in the shop-jar. Found at a different death. Still fragrant; still lucky — for all but the shepherd who led it.',
    },
    bronze_clasp: {
      name: 'Bronze Clasp',
      effect: 'First hit each second deals +15% damage.',
      flavour: 'A brooch once pinned a plaid at Bannockburn. The plaid is gone.',
    },
    ceilidh_dancers_ribbon: {
      name: 'Ceilidh Dancer\'s Ribbon',
      effect: 'Pickup-chain pulse every 5 kills, not 8.',
      flavour: 'Lost in the Strip the Willow of 1949. Never stopped spinning.',
    },
    damp_tinder: {
      name: 'Damp Tinder',
      effect: 'Fire hazards deal 40% less damage.',
      flavour: 'Won\'t burn for anything. Not for want of trying.',
    },
    whisky_dram: {
      name: 'Whisky Dram',
      effect: 'Once per run: sip to regain 20% max HP.',
      flavour: 'A wee sip for the road. Don\'t let Gran see.',
    },
    cairn_stone: {
      name: 'Cairn Stone',
      effect: 'Heather kills summon a magnet gem (once per 5s).',
      flavour: 'The top stone of a walker\'s cairn on the path to Ben Macdui. Still warm, somehow.',
    },
    pictish_compass: {
      name: 'Pictish Compass',
      effect: 'Chests and relic drops pin on the minimap.',
      flavour: 'Knotwork points home. Not always the same home.',
    },
    highland_torque: {
      name: 'Highland Torque',
      effect: '+100% damage to elites; elites spawn 20% more often.',
      flavour: 'Twisted gold from the Moray Firth. Clasps around the haggis like it was always meant to.',
    },
    bodhran_skin: {
      name: 'Bodhrán Skin',
      effect: 'Hits landed on the music beat deal +20%.',
      flavour: 'Tight as bone. Hum it to test the tuning.',
    },
    clootie_rag: {
      name: 'Clootie Rag',
      effect: 'Lifesteal doubled for 5s after taking damage.',
      flavour: 'Tied at a holy well in Easter Ross. The well has since dried.',
    },
    fishermens_net: {
      name: 'Fishermen\'s Net',
      effect: 'Enemies moving away take +30% damage.',
      flavour: 'Marked with the name of a boat that never came home.',
    },
    midgie_repellent: {
      name: 'Midgie Repellent',
      effect: 'Immune to midge-swarm stacking damage.',
      flavour: 'Formula lost. The bottle refills on its own between runs.',
    },
    grans_teapot: {
      name: 'Gran\'s Teapot',
      effect: 'After 5s unharmed, heal 5% max HP per second.',
      flavour: 'Warm. Always warm. The kettle has been on since 1951.',
    },
    fingals_horn: {
      name: 'Fingal\'s Horn',
      effect: 'Once per run: summon 3 Fianna for 10s.',
      flavour: 'Found in a cave on Staffa. It has been silent for eight centuries. Now it waits for one note.',
    },
    stone_of_destiny_shard: {
      name: 'Stone of Destiny (shard)',
      effect: '+50% XP from all sources. Boss HP +15%.',
      flavour: 'A splinter the size of a thumbnail. Nobody noticed it missing.',
    },
  },
  /** U1 Rune tier — 30 rule-stack upgrade cards. name + description (one-
   *  sentence rule: "When {condition}, {effect}.") + flavour
   *  (Dark-Souls-implied-history lore line). Pre-boss-kill the whole tier
   *  is gated out of the draw pool. */
  runes: {
    // ── 10 biome-conditional ──
    haar_rune: {
      name: 'Haar Rune',
      description: 'While the haar rolls in, every strike lands with twice the weight.',
      flavour: 'A fisherman\'s mark, carved the night his boat came home empty.',
    },
    peat_rune: {
      name: 'Peat Rune',
      description: 'In the bog, blows land harder — but the ground is heavier too.',
      flavour: 'Drawn on the side of a peat-cutter\'s spade. The spade rusted; the rune did not.',
    },
    heather_rune: {
      name: 'Heather Rune',
      description: 'Every kill in the heather tosses out one extra gem.',
      flavour: 'Burnt into the heath by a shepherd who had nowhere else to be.',
    },
    loch_rune: {
      name: 'Loch Rune',
      description: 'Standing near open water, your hide holds a tenth more.',
      flavour: 'The stone at the water\'s edge. Older than the name of the loch.',
    },
    cairn_rune: {
      name: 'Cairn Rune',
      description: 'Within arm\'s reach of a standing stone, luck runs thick.',
      flavour: 'Each traveller adds a stone. Each rune under a stone adds a prayer.',
    },
    gloaming_rune: {
      name: 'Gloaming Rune',
      description: 'In the dusk light, your strikes find the soft places more often.',
      flavour: 'Cut at the hour when two worlds are one — briefly, honestly.',
    },
    frost_rune: {
      name: 'Frost Rune',
      description: 'In cold country, foes move slower. They always did.',
      flavour: 'Tight, angular. The kind a hand makes when the hand is shaking.',
    },
    seawrack_rune: {
      name: 'Sea-Wrack Rune',
      description: 'By the coast, your pickup-chain holds on twice as long.',
      flavour: 'Kelp-shape, carved on driftwood. Wash-up from a wreck no one recorded.',
    },
    kirkyard_rune: {
      name: 'Kirkyard Rune',
      description: 'After the bell, foes below a fifth of their health simply stop.',
      flavour: 'Scraped onto a lychgate post. The bell-ringer left it there before he quit.',
    },
    edinburgh_rune: {
      name: 'Edinburgh Rune',
      description: 'In the urban places, coin drops come a quarter fatter.',
      flavour: 'Burnt into a close in the Old Town. The close is gone; the rune is the wall.',
    },
    // ── 10 state-conditional ──
    thirst_rune: {
      name: 'Thirst Rune',
      description: 'Under a third of your health, every blow bites a third deeper.',
      flavour: 'Set into a dry well. The farmer who cut it never drew water again.',
    },
    flush_rune: {
      name: 'Flush Rune',
      description: 'Above nine-tenths health, crit chance adds fifteen in the hundred.',
      flavour: 'For the ones who never come back bleeding — a rare mark, on rare folk.',
    },
    drover_rune: {
      name: 'Drover Rune',
      description: 'With three relics in hand, every stat lifts by a tenth.',
      flavour: 'Carved along the drove-road cairns between Crieff and Falkirk. Traded in silence.',
    },
    piper_rune: {
      name: 'Piper Rune',
      description: 'While the bagpipes are on your back, their aura reaches a quarter further.',
      flavour: 'The shape of a chanter-grip. Pipers cut it into their reeds.',
    },
    trek_rune: {
      name: 'Trek Rune',
      description: 'For the first minute of a run, you move a quarter faster.',
      flavour: 'Drawn at the start of every long walk. Worn off by the third mile.',
    },
    warden_rune: {
      name: 'Warden Rune',
      description: 'Past twenty minutes on the moor, every strike lands two-fifths harder.',
      flavour: 'Cut by the last man standing, on a watchtower stone. The tower fell. The rune did not.',
    },
    combo_rune: {
      name: 'Combo Rune',
      description: 'At a fifty-kill streak, every kill drops one extra pickup.',
      flavour: 'Five notches that became six, became ten. The count is the rune.',
    },
    lucky_streak_rune: {
      name: 'Lucky Streak Rune',
      description: 'While three or more chests sit unopened, the next kill drops another.',
      flavour: 'Scratched on the lid of a chest that nobody dared open. Still nobody has.',
    },
    fastburn_rune: {
      name: 'Fast-Burn Rune',
      description: 'Within two seconds of a dash, every strike lands half again as hard for one.',
      flavour: 'The dancer\'s mark. Cut into a kilt-pin in three strokes, at speed.',
    },
    evolved_rune: {
      name: 'Evolved Rune',
      description: 'Holding two or more evolved weapons, their ability cooldowns shed a fifth.',
      flavour: 'Layered glyphs — one rune redrawn over an older rune. Every evolution leaves its mark.',
    },
    // ── 10 action-chain ──
    echo_rune: {
      name: 'Echo Rune',
      description: 'Every tenth kill roots a healing thistle where the foe fell.',
      flavour: 'The shepherd\'s count-mark. Every tenth sheep, a prayer; every tenth kill, a mercy.',
    },
    cascade_rune: {
      name: 'Cascade Rune',
      description: 'Each kill within half a second of the last stacks five in the hundred damage, up to ten deep.',
      flavour: 'Cut in a single curl, no lifting of the knife. A rhythm rune — and rhythm is all it knows.',
    },
    chorus_rune: {
      name: 'Chorus Rune',
      description: 'Three different kinds of foe felled in five seconds — the moor grants a free card reroll.',
      flavour: 'A rune-of-three. Each stroke is a voice; the three together are the song.',
    },
    storm_rune: {
      name: 'Storm Rune',
      description: 'A crit on a weakened foe chains lightning to three more.',
      flavour: 'Cut on a post after Culloden. The post was struck by lightning three winters running.',
    },
    ceilidh_chain_rune: {
      name: 'Ceilidh Chain Rune',
      description: 'Hold a pickup-chain for five seconds — your health pool grows a fifth, for the run.',
      flavour: 'Drawn at a ceilidh that started before the war and ended after it. The dancers never stopped.',
    },
    drift_rune: {
      name: 'Drift Rune',
      description: 'Exactly five seconds after a dash, the first shot lands with twice the bite.',
      flavour: 'The haggis-mark. Cut in a spiral — the drift shape, the clockwise falter, the blessing.',
    },
    lairds_rune: {
      name: 'Laird\'s Rune',
      description: 'Fell a named elite and a shrine-buff descends, unbidden.',
      flavour: 'Only lairds could afford the carving. Only shrines remember the name of the laird.',
    },
    thistle_crown_rune: {
      name: 'Thistle-Crown Rune',
      description: 'Kill while standing on thistle and a bomb bursts from your feet.',
      flavour: 'Thistle-coil, folded into itself. The crown of the moor, given sharply.',
    },
    song_rune: {
      name: 'Song Rune',
      description: 'While the music\'s bass holds its line, your strikes match the tempo.',
      flavour: 'Cut on a fiddle-bridge. Broken in half. The half that sings is the one we held.',
    },
    pilgrim_rune: {
      name: 'Pilgrim Rune',
      description: 'Walk three Moor Road cairns and every scrap of XP grows half again for the rest of the run.',
      flavour: 'Three cairns, three carvings — and the walk between them. That is the whole rune.',
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
