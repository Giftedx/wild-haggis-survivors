export const ui = {
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
      nicnevin: {
        a: 'The witch-queen herself. Yer name\'s threaded into the Hunt noo, hen.',
        b: 'Aye. Ma gran said to never bow tae the white-horse rider. Ye didnae.',
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
    /** Mobile Croft header hint — replaces Gran's longer desktop greeting where vertical space is tight. */
    mobile_hint: 'Rest a breath. Oot when ye\'re ready.',
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
    /**
     * Wild Living World Initiative — Croft surface (first slice). Each
     * entry has a short name + a one-line description in Hearth voice.
     * Surfaced via `buildLivingWorldTracks()` (pure view-model). The
     * actual Croft panel rendering is a follow-up slice; these strings
     * land first so EN + SCS parity stays locked.
     */
    livingWorld: {
      panel_title: 'THE LIVING MOOR',
      panel_subtitle: 'The braes are stirrin — here\'s wha\'s afoot.',
      status_shipped: 'OOT ON THE MOOR',
      status_introduced: 'JUST AWA',
      status_planned: 'NO YET',
      companions: {
        name: 'WHISTLE-CALL COMPANIONS',
        description: 'A wee collie at yir heel — the moor feels less lonely already.',
      },
      selkieForms: {
        name: 'SELKIE FORMS',
        description: 'Twa shapes in the wan run. The water-folk remember the dance.',
      },
      rhythm: {
        name: 'WAULKING MALLET',
        description: 'A heavy mallet — sing wi\' the beat an\' the bairn hits harder.',
      },
      atmosphere: {
        name: 'UP HELLY AA EMBERS',
        description: 'Embers risin\' fae the galley fire — Lerwick wears its tartan in flame.',
      },
      musicBridge: {
        name: 'A MOOR THAT LISTENS',
        description: 'The drone warms when the moor\'s alive aboot ye. Subtle, mind — but it\'s there.',
      },
      croftHome: {
        name: 'THIS VERY PANEL',
        description: 'A wee bench tae see wha\'s growin\'. More tae come — this is the front step.',
      },
      picker: {
        // Wild Living World Phase 2 — Croft companion picker. Hearth
        // voice; the title nods to the whistle-call ritual rather
        // than a cold "Select Companion" menu label.
        title: 'WHA\'S AT YIR HEEL?',
        no_companion: 'Gae alane',
      },
    },
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
    /** T7 — Old Drover Almanac entry. Hearth voice; surfaced in FindsBook (T11). */
    oldDrover: {
      title: 'The Old Drover',
      intro: 'There is another voice in the moor. Listen for him.',
      locked: '???',
      complete: 'He is quiet now. The moor is yours.',
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
    /** Loadout carousel — DOM/gamepad row labels (T407). */
    carousel_previous: 'Previous variant',
    carousel_next: 'Next variant',
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
    /** Locked variant of the Gold Shop button — shown when the active variant blocks shop access. */
    upgrades_locked: 'NAE SHOP',
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
    // W82 Shared-run URL — companion link to the rerun-seed action.
    // Copies a deep-link URL to the clipboard so a friend can paste it
    // and play the same starting conditions (seed + variant + curse).
    share_run_hint: 'share this run',
    share_run_copied: 'link copied · paste to share',
    share_run_shared: 'shared!',
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
    // W82 Phase 3 — save-highlight link. Appears below "Save clip"
    // when the player killed a boss this run. `{boss}` resolves to
    // the boss display name (e.g. "Gordon", "Tour Bus", "Death (The
    // Taxman)"). The clip itself is the rolling buffer at the moment
    // the boss died, not at click time.
    save_highlight: 'Save {boss} kill',
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
  /**
   * 2026-05-10 — first-launch cultural-content notice. Sister to
   * `photosensitivity` above; same depth, same dismissal pattern. Copy
   * leans warm + diegetic — this is a respect-signal to dialect speakers
   * that the project knows its drafted Scots/Doric/Shetlandic/Gaelic
   * voices need native review and is actively inviting feedback.
   */
  culturalContent: {
    title: 'Aboot the voices ye\'ll hear',
    body: 'The wee haggis speaks Scots, Doric, Shetlandic, and Gaelic in different places — drafted with care by one developer, but no\' yet checked by native speakers in every register. If ye hear something that disnae quite ring true, that\'s on me. Yer feedback is welcome at the project page.',
    hint: 'Native-speaker review is open — see docs/C2_DIALECT_REVIEW.md',
    dismiss: 'Aye, understood',
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
      hint: 'Click a held relic to mark it. Click again to let it go.',
      keep_new: 'Click a held relic to swap, or here to skip',
      keep_new_short: 'Skip new relic',
      discard: 'Let this go',
      discard_confirm: 'Click again to confirm',
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
  /** Clootie Rag Wager (DESIGN_IDEAS §1). One sacred-supplication tree
   *  per run; walking through the trunk wagers a slice of max-HP for a
   *  rolled boon. The banner above the tree always shows the cost +
   *  boon name, so the player commits eyes-open. Hearth + grave voice:
   *  the lines reference the folkloric act (cloth on the branch, water
   *  from the well, an offering for grace) without ironic varnish. */
  clootie: {
    announce_toast: 'A clootie tree, hung wi\' rags. The moor offers a trade.',
    announce_caption: 'Walkin\' through binds the wager — cloth o\' yer HP for the boon shown above.',
    banner: '−{cost} HP · {boon}',
    commit_toast: '{title} bound — {cost} HP given.',
    wrath: {
      title: 'Wrath',
      desc: 'A red rag knotted tight — yir blows bite a quarter harder.',
    },
    patience: {
      title: 'Patience',
      desc: 'A pale rag, slow-twirlin\' — the moor draws pickups in fae further.',
    },
    haste: {
      title: 'Haste',
      desc: 'A green rag whippin\' — weapons answer fifteen percent quicker.',
    },
    // Black Clootie — rare second wager (25 % of runs, late-game).
    second_announce_toast: 'A second tree — its rags are black. The moor asks more.',
    second_announce_caption: 'Another wager, deeper cost. Walk through and the moor takes twenty parts in a hundred.',
    second_commit_toast: '{title} bound deeply — {cost} HP given tae the dark tree.',
    deep_wrath: {
      title: 'Deep Wrath',
      desc: 'Black rags stained dark — yir blows bite two-fifths harder for the rest o\' the run.',
    },
    deep_patience: {
      title: 'Deep Patience',
      desc: 'The well pulls hard — pickups draw in fae ninety paces out.',
    },
    deep_haste: {
      title: 'Deep Haste',
      desc: 'The black rag snaps — weapons answer twenty-twa percent quicker.',
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
   * Bracken-turn Blessing — Nov 4 – Nov 26 seasonal hook
   * (DESIGN_IDEAS §12; the moor's bracken fronds shift through
   * copper to bronze, first frost edges through). +13 HP heal,
   * +5% additive crit chance — bronze hardness reads as a
   * sharper edge.
   */
  brackenTurn: {
    blessing_toast: 'Bracken bronzed, frost in the wind — the moor sharpens ye. +13 HP, crits land truer.',
  },
  /**
   * Bannockburn Anniversary Blessing — Jun 22 – Jun 25 seasonal hook
   * (DESIGN_IDEAS §12; Robert the Bruce's victory over Edward II's
   * army on Jun 23–24, 1314; Burns "Scots, Wha Hae" 1793). +22 HP
   * heal post-spawn (battlefield medic) + +0.5 lifesteal — the
   * Scots fed off the field. Cultural framing celebrates Scottish
   * resilience without contemporary politics.
   */
  bannockburn: {
    blessing_toast: 'Bruce held — every blow tastes of the field. +22 HP, half a HP back per kill.',
  },
  /**
   * Glorious Twelfth (Aug 11-13). Grouse-season opens; the moor on
   * the brae fills with tweed + tweed-clad dogs + shotguns. The haggis
   * goes to ground and walks wider — +16 HP heal post-spawn (stocking
   * up before the moor gets noisy) + +0.10 AoE multiplier (the haggis
   * answers the spread with spread). Tenth distinct mechanical slot
   * in the cohort. Cultural framing diegetic-warm; no anti-hunter
   * venom, no class polemic. SCOTTISH_RESEARCH_DEEP.md §6.10.
   */
  gloriousTwelfth: {
    blessing_toast: 'The Twelfth opens. Go to ground; walk wider. +16 HP, every weapon\'s arc widens.',
  },
  /**
   * Tartan Day (Apr 4-8). North-American diaspora's national-Scottish
   * day, anchored on Apr 6 — the date the Declaration of Arbroath was
   * signed in 1320. Window 5 days because the diaspora spans every
   * time zone and the celebration tends to land across a weekend more
   * often than not. +14 HP heal post-spawn (the haggis takes the
   * cloth) + +20 px additive pickup-radius — gems, coins, polaroids,
   * every world pickup pulls a touch farther all run. Eleventh
   * distinct mechanical slot in the cohort. Cultural framing warmth
   * without flag-waving; Arbroath is 1320 context, no contemporary
   * political stance. SCOTTISH_RESEARCH_DEEP.md §6.7 (Declaration of
   * Arbroath) + §14.5 (diaspora).
   */
  tartanDay: {
    blessing_toast: 'Tartan Day. Diaspora reach. +14 HP, every pickup pulls a touch farther.',
  },
  /**
   * Simmer Dim (Jun 18-21). Shetlandic / Orcadian phrase for the
   * perpetual twilight of Scottish midsummer at high latitudes; north
   * of 60°N the sun barely sets between mid-June and early July.
   * Window 4 days, anchored on the solstice (Jun 21) with a 3-day
   * lead-in — narrowed past the typical 5-day single-anniversary band
   * to dodge Bannockburn (Jun 22-25). +12 HP heal post-spawn (the
   * haggis takes the held light, modest heal — solstice is quiet not
   * abundant) + +0.25 additive crit-damage multiplier via
   * `Player.addCritDamageMultiplier`. Twelfth distinct mechanical
   * slot in the cohort, first to touch crit-DAMAGE (Bracken-turn
   * rides crit CHANCE — different stat). Cultural framing: hush,
   * not festival; held light, fey-ring caution. SCOTTISH_RESEARCH_
   * DEEP §22.6.
   */
  simmerDim: {
    blessing_toast: 'Simmer Dim. Held twilight. +12 HP, the strike lands harder when it lands.',
  },
  /**
   * Up Helly Aa (Feb 9-15). Shetland fire festival cycle. The marquee
   * Lerwick event is the **last Tuesday of January** but sits inside
   * Burns Night in real life; this codebase resolves overlap by
   * insertion order (Burns wins). Window Feb 9-15 honours the broader
   * Shetland season (Cunningsburgh, Cullivoe, Norwick, Bressay,
   * Nesting, Uyeasound — eleven outlying community fire festivals).
   * Mechanic: +18 HP heal post-spawn (longship-warmth) + +0.18
   * additive damage-multiplier via `Player.addDamageMultiplier` —
   * thirteenth distinct mechanical slot in the cohort, first to touch
   * generic damage-mult (Simmer Dim crit-DAMAGE only fires on crit
   * hits; Glorious Twelfth AoE widens arc not wallop). Cultural
   * framing: torchlight + brotherhood + Norse heritage + the galley
   * burns. SCOTTISH_RESEARCH_DEEP §22.7.
   */
  upHellyAa: {
    blessing_toast: 'Up Helly Aa. Galley afire. +18 HP, the haggis swings harder.',
  },
  /**
   * Culloden Memorial (Apr 13-18). No gameplay buff — a quiet slate-
   * grey toast marking the day. Grave register; no healing bonus; no
   * fanfare. The moor keeps its own count.
   */
  culloden: {
    memorial_toast: 'Sixteenth April. The field keeps its own count. Walk well.',
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
    /** Stance Toggle chip labels (DESIGN_IDEAS §1). Three postures the
     *  player cycles with Q: loose (neutral), braced (slow + drift
     *  halved, "set" stance), reeling (fast + drift amplified, "hot"
     *  stance). Chip width is fixed; labels are short enough to fit. */
    stance: {
      loose: 'LOOSE',
      braced: 'BRACED',
      reeling: 'REELING',
    },
    /** Shinty Parry chip labels (DESIGN_IDEAS §1). Defensive timed-window
     *  flick on E. Three states map to three labels: ready (idle, can
     *  press E), active (window open, commit), cooldown (recovering). */
    parry: {
      ready: 'PARRY',
      active: '!',
      cooldown: '···',
    },
    /** Race the Beithir HUD bar label (DESIGN_IDEAS §1). Top-centre
     *  live-tension widget; shown only while a sting is running. The
     *  label spells out the two cure paths so a first-time-stung
     *  player knows what to do. Short enough to fit a 168 px bar at
     *  10 px monospace. */
    beithir: {
      race: 'BEITHIR — HEAL OR KILL',
    },
    /** Whistle-Call companion chip (Wild Living World Initiative).
     *  Short names — chip is 56 px wide at 9 px monospace, so all
     *  registers must fit "SHEEPDOG"-length. New companions widen
     *  the union; keep labels at-most 9 characters. */
    companion: {
      sheepdog: 'SHEEPDOG',
      stoat_scout: 'STOAT',
      eagle: 'EAGLE',
      kelpie_foal: 'KELPIE',
    },
    /** Selkie Dual-Form chip (Wild Living World Initiative). Two
     *  forms toggled by dash. Short labels — fit the 56 px chip. */
    selkie: {
      haggis: 'HAGGIS',
      seal: 'SEAL',
    },
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
    keys_resume: 'ESC / P / Start — resume · Arrows or Tab — move · Enter — choose · 1–8 — jump to row',
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
    /** window.prompt() label when the player clicks the run name to rename. */
    rename_prompt: 'Name your haggis (24 chars max):',
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
    nicnevin: "The Unblessed court rides oot — and she's brought her parliament.",
    the_laird: 'The Laird strides oot — mind yir manners and yir hide.',
    hunter_general: "The Hunter-General — and they've brought pals.",
    /** Glamis ghost — plays cards with the Devil; deals them at you. */
    earl_beardie: "Earl Beardie's out o\' the sealed room. He's dealin\'. Dinnae sit doon.",
    /** Post-bell only — border raider whose name became a nursery threat. */
    black_douglas: "Hush. The Black Douglas is here — and he disnae keep the same peace.",
    taxman: "The Taxman's here — and he's no' takin' a cheque.",
    /** V2 — Cailleach Gauntlet boss walks the moor. */
    cailleach_boss: 'THE CAILLEACH WALKS — winter answers what ye called.',
    /** Post-bell Tier-3 — haar, ice, hail. The storm-form of the Blue Hag. */
    storm_cailleach: "The Old Wife rides the gale — haar, ice, and hail. She's here.",
    /** Orcadian mythos boss — no skin, one eye, breath is plague. */
    nuckelavee: 'Something comin\' fae the sea — no\' right, no\' human, no\' stopped.',
    /** Post-bell — Twin Stones of Callanish. They've been standing since before the language. */
    twin_stones: 'An Càraid stand apart no longer — the Callanish stones have memory, and the haggis is in it.',
    /** Post-bell — Wicker Haggis. The effigy is lit. The haggis inside has opinions about this. */
    wicker_haggis: 'The Wicker Haggis rises on the brae — Bealltainn\'s tribute is awake, and it is not happy about it.',
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
    /** N1 Tier-2 mythos — Nicnevin Wild Hunt gem-pull cycle toast.
     *  Fires on every pull-start (initial 50 % HP enrage + every 20 s
     *  re-proc). Edge voice: clipped, cold, queen-shaped. */
    nicnevin_wild_hunt: 'The Wild Hunt rides — gems lift tae the queen!',
    /** Per-boss kill celebrations — the big punchline after the big fight. */
    boss_killed_gordon: 'Gordon\'s DOON! Back tae the kitchen, big man!',
    boss_killed_each_uisge: 'Oot the water and oot o\' luck. The loch takes its ain.',
    boss_killed_tour_bus: 'Bus terminated! Next stop: the scrapyard via Yoker.',
    boss_killed_nicnevin: 'Nicnevin\'s court dissolved. The moor breathes again.',
    boss_killed_the_laird: 'The Laird\'s on his erse! Yer bum\'s oot the windae, pal!',
    boss_killed_nuckelavee: 'The Nuckelavee is doon! Back tae yer sea, ya skinless horror!',
    boss_killed_earl_beardie: 'Earl Beardie is doon! His cards are scattered on the moor — the wager is yours!',
    boss_killed_black_douglas: "The Black Douglas falls silent! The lullaby's over — nae mair hushing!",
    boss_killed_hunter_general: 'Hunter-General floored! Take yir medals and yir pith helmet!',
    boss_killed_taxman: 'THE TAXMAN IS DOON! Tax-free zone declared!',
    boss_killed_cailleach_boss: 'The Cailleach is doon! Stormcrown is yours.',
    boss_killed_storm_cailleach: 'The Storm Cailleach is doon! The gale died wi\' her!',
    boss_killed_twin_stones: 'An Càraid is doon! The heartstone goes cold — and the circle is yours.',
    boss_killed_wicker_haggis: 'The Wicker Haggis is doon! The moor smells of woodsmoke — and something worth celebrating.',
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
    max_level_toast: 'Max level — yir a walking storm. Beat the Taxman tae ring the bell; the moor\'s no\' done wi\' ye yet.',
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
    /** Field-note pickup (DESIGN_IDEAS §11) — haggis_hunter drops a
     *  Foundation notebook page; the haggis "accepts being catalogued"
     *  for a wee XP bonus. Sister-string to polaroid_pickup_float;
     *  voiced as the page's tag-line rather than the page's prose
     *  (the naturalist-voice quotes live in the banter pool, not on
     *  the float). Moss-green tint to match the specimen-tag cord
     *  on the sprite. */
    field_note_pickup_float: 'Catalogued! +XP',
    /** Cairn Stacking (DESIGN_IDEAS §1) — toast at stone-spawn time
     *  pointing the player at a moor-bound stone they can stack into a
     *  cairn. Hearth-warm, low-key — pilgrim-marker, not loot beacon. */
    cairn_stone_nearby: 'A stone on the path — leave one for the next traveller.',
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
   * Cairn Stacking (DESIGN_IDEAS §1) — three highland stones across a run;
   * third stone fires the Cairn's Blessing (full heal + 8 s pickup-radius
   * pulse). Voice: pilgrimage-warm, ceremonial, the kind of small rite a
   * Munro-walker performs without a thought. Distinct register from the
   * combat banter — no punch, all reverence.
   */
  cairn: {
    /** Per-stone collect toast — shows {count}/{cap} so the player tracks progress. */
    stack_toast: 'Stone laid on the cairn ({count}/{cap}).',
    /** Third stone — picker opens. Flash lands before the modal. */
    boon_toast: 'The cairn stands. Choose what the moor gives back.',
    boon_caption: 'Cairn\'s Blessing',
    /** Title strip on the 3-card boon picker modal. */
    picker_title: 'The Cairn Answers',
    /** Per-boon copy. Each has name (modal card title), desc (card body),
     *  toast (post-pick confirmation strip). */
    boon: {
      full_mend: {
        name: 'Full Mend',
        desc: 'The stone gives back what the moor has taken. Fully restored.',
        toast: 'Fully mended — the cairn knew.',
      },
      moor_sweep: {
        name: 'Moor Sweep',
        desc: 'Eight seconds of expanded reach. Sweep the moor clean.',
        toast: 'The moor draws in — gems and gold within reach.',
      },
      stone_vigour: {
        name: 'Stone Vigour',
        desc: 'A fieldstone\'s endurance — +20 to yer heart, right now.',
        toast: 'Bigger heart — the cairn grew ye.',
      },
      cairn_ward: {
        name: 'Cairn Ward',
        desc: 'The stones stand between ye and the moor. +12% damage this run.',
        toast: 'Cairn Ward — the old weight behind yer blows.',
      },
      glacial_calm: {
        name: 'Glacial Calm',
        desc: 'Still hands, faster fire. −15% weapon cooldown this run.',
        toast: 'Glacial calm — every strike finds its pace.',
      },
    },
    /** Stoat Scout companion unlock — fires after the third committed wager. */
    stoat_unlock_toast: 'A whitret watched fae the bracken. Stoat Scout companion unlocked.',
    stoat_unlock_caption: 'Three wagers bound. The moor sends a scout.',
    /** Golden Eagle companion unlock — fires on first Cailleach Gauntlet win. */
    eagle_unlock_toast: 'A golden eagle dropped from the summit sky. Eagle companion unlocked.',
    eagle_unlock_caption: 'The storm is felled. The moor sends its eyes.',
    /** Kelpie Foal companion unlock — fires on first Each Uisge kill. */
    kelpie_foal_unlock_toast: 'A young kelpie followed ye oot the loch. Kelpie Foal companion unlocked.',
    kelpie_foal_unlock_caption: 'The water horse is stilled. Its foal chose the moor.',
    /**
     * T7 — Cairn-of-Echoes whispers (distinct from Cairn Stacking above).
     * A spectral cairn marks the player's last-death location; touching it
     * surfaces a whisper from the player's past self or — once enough cairns
     * are stacked — from the Old Drover (grandfather voice).
     */
    whisper: {
      past_self: {
        first_death: "That's me, down there.",
        classic: 'Walked too far past the loch.',
        cailleach: "Winter took its own.",
        glaswegian: 'Got cocky. Got got.',
        doric_quinie: "Awa wi' the haar.",
        burns_wee_beastie: 'Wee, sleekit, and stilled.',
        morningside: 'Wholly avoidable, that. With more composure.',
        drouthy: 'Still thirsty. Aye, that\'ll do.',
        pibroch: 'The tune was still going when I stopped.',
        orcadian: 'The geo was here afore the score. It\'s aye here.',
        hebridean: 'A haggis fell here, on the machair.',
        iron_brew: 'A haggis fell here. Got back up three times first.',
        grans_best: 'A haggis fell here. Gran would have had words.',
        the_pict: 'A haggis fell here. The stone marks it. As always.',
        jacobite: 'A haggis fell here. The plaid could not hold forever.',
        tam_o_shanter: 'A haggis fell here. Near enough the Brig o\' Doon.',
        engineer: 'A haggis fell here. The turret still stands.',
        tufted: 'A haggis fell here. The pup waited — then moved on.',
      },
    },
    grandfather: {
      '01': "Hark, wee one. Stack the stones high enough and ye'll wake the Cailleach hersel'.",
      '02': "Yer grandmother's husband walked here every nicht for fifty years. She'll no have told ye.",
      '03': "Beneath the third loch, a thing the salt water fears. Mind ye dinna find it.",
      '04': "Some o' these stones are mine. Stacked them wi' frozen hands.",
      '05': "The Taxman came for me last. Came for everyone, in the end.",
      '06': "Yer Gran burned my pipes when I went. Said the moor had earned them.",
      '07': "Every cairn ye walk past was a man's last thought.",
      '08': "The Cailleach watches yer drift. She drifted, too, in her time.",
      '09': "I knew the each-uisge by name. Ye willnae.",
      '10': "Heather burns slow. So does grief.",
      '11': "Mind the fairy mounds. They mind ye.",
      '12': "I stacked one cairn for every season I walked. Forty-three, that wis.",
      '13': "Yer grandmother sings to the moor still. Listen for her in the wind.",
      '14': "The drovers' roads run under the new roads. We're still walkin' them.",
      '15': "Nicnevin's hounds remember a kindness. Try it some time.",
      '16': "There's a stone near the western burn that hums when the gloamin's right.",
      '17': "Burns kent the moor better than any man I met. Better than me.",
      '18': "The Laird's no a man. Mind that.",
      '19': "I died on a Tuesday. Just so ye know what day to fear.",
      '20': "Yer Gran cried for a week. Then she stopped. The moor goes on.",
      '21': "Ye'll meet the Taxman. He'll smile. Smile back, then strike.",
      '22': "The Stoor Worm sleeps under Orkney. Dinna wake it.",
      '23': "Three lochs deep, three lochs cold, three lochs old. Ye'll know the third.",
      '24': "I'm proud o' ye, wee one. I wish I'd said so when I could.",
      '25': "When ye've walked enough, I'll be quiet. And the moor'll be yours.",
    },
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
      // Nicnevin — Queen of the Unblessed. Edge voice on warning,
      // hearth on the post-kill pool. The fiddlers are hers, the white
      // horse is hers, and so is the air she settles in.
      nicnevin: {
        a: 'The fiddlers are hers. Aw o\' them.',
        b: 'White horse on the moor. No good. No good at all.',
        c: 'The queen o\' the wicked fae. Dinnae bow and dinnae run.',
      },
      the_laird: {
        a: 'The Laird\'s come tae collect.',
        b: 'Posh git on horseback. Snobby dunter.',
        c: 'Tweeds and teeth. Watch yer flanks.',
      },
      // Orcadian mythos — no skin, one eye, plague breath, hates fresh water.
      // Edge voice: horror register, short and bitten.
      nuckelavee: {
        a: 'No skin on it. No skin at aw.',
        b: 'Smells like plague. That\'s the breath o\' the thing.',
        c: 'One eye. Horse body. No\' right. No\' stopped.',
      },
      hunter_general: {
        a: 'The General\'s got yer scent.',
        b: 'Proper soldier noo. Nae mair eejits.',
        c: 'Musket an\' medals. Mind they\'re loaded.',
      },
      // Glamis ghost — sealed room, Sunday cards, devil's wager. Edge voice.
      earl_beardie: {
        a: 'Cards on the moor. That\'s no\' a game ye want tae win.',
        b: 'Earl Beardie\'s oot. Last wan that sat wi\' him never left the room.',
        c: 'Ghost fae Glamis. He dealt tae the Devil; noo he deals tae you.',
      },
      // Post-bell only — the Border raider English mothers used as a threat.
      black_douglas: {
        a: 'Hush. He\'s close. The lullaby said he wouldnae — the lullaby lied.',
        b: 'Black Douglas — raided the Border faster than a rumour.',
        c: 'Steel an\' silence. He hushed a kingdom; he\'ll try you next.',
      },
      taxman: {
        a: 'The Taxman\'s here. An\' he\'s no\' takin\' council tax.',
        b: 'Bureaucrat wi\' a scythe. Pure nightmare fuel.',
        c: 'Final demand. Brown envelope, black cloak.',
      },
      // V2 — Cailleach Gauntlet. Winter herself walks oot of the haar.
      // The fiddlers are gone; this is the goddess, no\' the queen.
      cailleach_boss: {
        a: 'She walks oot o\' the haar. Staff first. Eyes last.',
        b: 'The auld wife is here. Mind yer manners.',
        c: 'Winter is a woman. She\'s come for the count.',
      },
      // Post-bell Tier-3 — Storm Cailleach. The haar and hail incarnate.
      // Edge register; she doesn\'t explain, she arrives.
      storm_cailleach: {
        a: 'The haar has eyes tonight. Auld eyes.',
        b: 'Three phases. She gave ye the first one free.',
        c: 'The gale is a her. She\'s clocked ye.',
      },
      // Post-bell — Twin Stones of Callanish. Ancient, certain, unhurried.
      // Hearth register; the horror is the patience, not the rage.
      twin_stones: {
        a: 'Two stones. One fate. Walk into the circle.',
        b: 'They\'ve been standing there longer than the language. Now they\'re moving.',
        c: 'The Fir Bhreige — the False Men. Not so false today.',
      },
      // Post-bell — Wicker Haggis. Black comedy + alarm. The haggis is
      // disconcerted to be both the target AND the effigy.
      wicker_haggis: {
        a: 'That\'s a wicker structure. That\'s me inside it. This is not how Bealltainn was supposed to go.',
        b: 'The lattice is burning. The haggis is burning. The haggis has thoughts about this.',
        c: 'It\'s Bealltainn\'s tribute. The tribute is me. We have a conflict of interest here.',
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
        c: 'Doun isnae done. The pelt holds.',
        d: 'Sych and meikle care, but no done.',
      },
      selkie: {
        a: 'Salt in the cuts — keep tae the shore.',
        b: 'Seal-skin\'s thin, but the tide\'s no done wi\' ye.',
        c: 'One mair wave like that and we\'re driftwood.',
        d: 'Haud the borrowed skin tight. Breathe.',
      },
      morningside: {
        a: 'One\'s condition is becoming distinctly sub-optimal.',
        b: 'This is not how one anticipated the afternoon proceeding.',
        c: 'A brief recovery would be entirely in order. If the moor would permit.',
        d: 'One must simply press on. There is no other properly done option.',
      },
      drouthy: {
        a: 'Woozy. Mair frae the hit than the whisky. Mostly.',
        b: 'Haud on — the moor\'s tiltin\'. Or I am.',
        c: 'One mair dram tae steady the nerves. An\' one mair tae steady that one.',
        d: 'Dinnae worry. The haggis bends. Hic.',
      },
      pibroch: {
        a: 'The beat kens I\'m hurt. It\'s slowin\' wi\' me.',
        b: 'Nae panic. The ground-tune holds even when the hands shake.',
        c: 'Low — but the ùrlar\'s still in me. That\'s enough.',
        d: 'The moor disnae hurry the pibroch. Neither will I.',
      },
      orcadian: {
        a: 'Still standin. Like the stones.',
        b: 'The Ring stood twa thousand year. Ye\'ll manage.',
        c: 'Brodgar wasnae built in a day. Neither was this.',
        d: 'Breathe. The moor\'s been here longer than the wound.',
      },
      hebridean: {
        a: 'The sea takes, the machair holds. Breathe.',
        b: 'Water doesn\'t stop ye. Neither does this.',
        c: 'The stac stands through everything. So do ye.',
        d: 'The Minch never calmed for anyone. Neither does trouble.',
      },
      iron_brew: {
        a: 'Dunted again. Good. Getting harder.',
        b: 'That dunt counts. The bru stacks.',
        c: 'Take a hit. Add it to the pile.',
        d: 'Every wallop\'s a wee bit of iron. Keep going.',
      },
      grans_best: {
        a: 'Nearly there. Gran\'s watching. Get fiercer.',
        b: 'Low HP. Good. That\'s when we hit hardest.',
        c: 'Dinnae ye dare die gentle, hen.',
        d: 'This is Gran\'s territory. The low end. Hold on.',
      },
      the_pict: {
        a: 'Deid is a manner o\' speakin\'. Still standin\'.',
        b: 'The stone disna bleed. Neither dae I.',
        c: 'Aye battered. Aye here.',
        d: 'The Pict disna flee. Backs tae the bedrock, face tae the moor.',
      },
      jacobite: {
        a: 'For the Cause. Still for the Cause.',
        b: 'The plaid\'s comin\'. Hold twa mair seconds.',
        c: 'Culloden didnae finish it. This willnae either.',
        d: 'Flora walked beside worse odds than these.',
      },
      tam_o_shanter: {
        a: 'The Brig o\' Doon is close. Run, Meg, run.',
        b: 'Weel done, Cutty-sark — nae, dinnae say it. Just run.',
        c: 'The witches are gaining. The bridge is the anely answer.',
        d: 'Faster. The running water saves ye. Find it.',
      },
      engineer: {
        a: 'The turret is still firing. I am still moving. Both acceptable.',
        b: 'Structural integrity compromised. Continue anyway.',
        c: 'The cairn holds. So will I. Probably.',
        d: 'Watt\'s engine ran on pressure too.',
      },
      tufted: {
        a: 'The pup\'s watching. Don\'t make it watch this.',
        b: 'Wee beastie still fighting. I\'ll manage.',
        c: 'The pup bites harder when I\'m low. We agree on the urgency.',
        d: 'Not gone yet. The pup would not know what to do.',
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
      // Nicnevin — court dispersed; warmth reasserts after Edge.
      nicnevin: {
        a: 'The queen fell. The crown lands in the heather.',
        b: 'Even the Unseelie host goes quiet sometimes.',
        c: 'That was the hard wan. Ye earned the quiet.',
      },
      the_laird: {
        a: 'Laird\'s nae laird nae mair.',
        b: 'Land\'s back wi\' the moor.',
        c: 'Posher than a polished thistle, an\' just as flat noo.',
      },
      // Orcadian mythos — relief and fresh water held.
      nuckelavee: {
        a: 'Back tae the deep wi\' ye. The burn held.',
        b: 'That thing shouldnae have been on land. Glad it\'s no\' noo.',
        c: 'Never thought fresh water could dae that. Now ye ken.',
      },
      hunter_general: {
        a: 'General\'s off-duty. Permanently.',
        b: 'Outranked the big yin.',
        c: 'That\'s him decommissioned.',
      },
      // Glamis ghost — the wager is won; hearth warmth under the edge.
      earl_beardie: {
        a: 'His cards are on the moor. First time he\'s lost since 1435.',
        b: 'Oot o\' the sealed room an\' back intae it. The wager\'s done.',
        c: 'Never play cairds wi\' a ghaist. But if ye dae — win.',
      },
      // Post-bell only — the lullaby proved a lie; hearth warmth in the quiet after.
      black_douglas: {
        a: 'The Douglas is doon. The lullaby\'s safe again — for noo.',
        b: 'He hushed a kingdom once. The haggis got the last word.',
        c: 'Good Sir James, no\' so guid. But doon\'s doon.',
      },
      taxman: {
        a: 'Taxman took a loss fer once.',
        b: 'Death\'s back oan the books.',
        c: 'Owes us nothin\'. We owe him nothin\'. Sorted.',
      },
      // V2 — Cailleach Gauntlet, victory beat. The winter blinked.
      cailleach_boss: {
        a: 'The crown is mine. Winter blinked.',
        b: 'Seven stones gold. Seven names louder.',
        c: 'I\'ll carry her crown soft. She earned the cost.',
      },
      // Post-bell Tier-3 — Storm Cailleach doon. The gale unravelled.
      storm_cailleach: {
        a: 'Three phases and she still couldnae hold it.',
        b: 'The haar cleared. That\'s on her.',
        c: 'Post-bell, post-gale. The moor\'s got its weather back.',
      },
      // Post-bell — Twin Stones doon. The heartstone went cold.
      twin_stones: {
        a: 'The circle\'s quiet. The moor holds that, for a wee bit.',
        b: 'An Càraid. Both gone. The heartstone went cold at the haggis\'s feet.',
        c: 'Stood since before the Gaels named them. Now they lie. The moor minds it.',
      },
      // Post-bell — Wicker Haggis doon. The ceremony is complete.
      // The haggis survived what it was supposed to be consumed by.
      wicker_haggis: {
        a: 'The tribute fell. The haggis is still standing. That\'s not in the old books.',
        b: 'Bealltainn\'s effigy is ash. The haggis that was inside it is not ash. Ceremonially awkward.',
        c: 'The moor smells of woodsmoke. The haggis smells of it too. Worth it.',
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
      shinty_stick: {
        a: 'Caman storm. Newtonmore would be proud.',
        b: 'Ash blur — the field\'s nae safe noo.',
        c: 'Camanachd Cup energy. Naebody dodges this lot.',
        d: 'Wee balls everywhere — whaur\'s the goalie?',
      },
      sgian_dubh: {
        a: 'White knife oot. Every cut counts.',
        b: 'Sgian geal — Gran will have words aboot drawin\' it.',
        c: 'The bone grip kens its work. Nothin\' grazed; everythin\' opened.',
        d: 'Edge past sharp. The Whetstane held its end.',
      },
      stag_antler: {
        a: 'Croun\'s on. The herd parts.',
        b: 'Monarch\'s Charge — ivvery dash a sweep.',
        c: 'Antler turns the field. Naebody stands tae the king.',
        d: 'Velvet shed clean. The rut is mine.',
      },
      bagpipes: {
        a: 'The pipes woke up proper. Run.',
        b: 'Skirl turned slaughter — beautiful.',
        c: 'Every note a cut. Pure ceilidh violence.',
        d: 'Ceilidh\'s cancelled — fer them.',
      },
      waulking_mallet: {
        a: 'The pibroch lands — that\'s the echo finishing the song.',
        b: 'Mallet keeps the beat; pibroch answers from the hills.',
        c: 'Tuning fork hummed true. Now the bar drops on every fourth.',
        d: 'Hammer on the strong beat — the moor sings along.',
      },
      dirk_dance: {
        a: 'Three blades, one breath. The dance held.',
        b: 'Gillie\'s foot was right. The dirks knew where to be.',
        c: 'Centre, left, right — arrived together. No daylight.',
        d: 'The flurry. The moor learns a new word for "wall".',
      },
      grannies_curse: {
        a: 'Granny\'s curse, wrapped in the shawl. The wail finds anything.',
        b: 'The bean-sìth has somewhere to land now. Furthest first.',
        c: 'Five hex-screams, five throats — the edge of the field hears.',
        d: 'Wool against cold; wail against distance. Both warm in their way.',
      },
      wallace_sword: {
        a: 'The Stirling Medal pinned, the sword turns. The moor turns with it.',
        b: 'Three heartbeats. The cry from the bridge in each one.',
        c: 'Freedom\'s a heavy word for a heavy blade. Lifted clean.',
        d: 'The swing, then the answer, then the answer to the answer.',
      },
      bodhran: {
        a: 'The hoop\'s set. The drum speaks twice now.',
        b: 'Beltane fire in the skin. The moor leans in.',
        c: 'Double pulse — amber first, then crimson. The drum learned.',
        d: 'The willow hoop held true. Now the Beltane Drum answers.',
      },
      selkie_song: {
        a: 'The pelt held the song in. Shed, it carries three times as far.',
        b: 'One voice carries across the water. Three voices carry across the world.',
        c: 'Sandwood Bay, February. Three more voices answered from the skerries.',
        d: 'The sea held its breath. The Selkie Chorus rose.',
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
      selkie: {
        a: 'Tide lifts ye — new strength in the skin.',
        b: 'Seal or haggis, the sea approves.',
        c: 'Another song learnt under the waves.',
        d: 'Up ye rise, slick as kelp.',
      },
      morningside: {
        a: 'One has improved. One expected no less.',
        b: 'Ah. Rather satisfying, that. One notes the progress.',
        c: 'A considerable advancement. Quietly noted.',
        d: 'One continues to develop, as one should.',
      },
      drouthy: {
        a: 'Level up! The drams were workin\' the whole time.',
        b: 'Stronger wi\' every nip. I\'ve had a few.',
        c: 'Hic. That felt like a level or the ground movin\'.',
        d: 'Onward! The barrel\'s still on the moor somewhere.',
      },
      pibroch: {
        a: 'Up a bar. The music knew before I did.',
        b: 'A level gained on the strong beat. As it should be.',
        c: 'The ground-tune deepens. So do I.',
        d: 'The ceòl mòr lifts with every step forward.',
      },
      orcadian: {
        a: 'Aye. Another layer o\' the Broch.',
        b: 'The Skara Brae folk didnae hurry. Neither dae we.',
        c: 'Up a course. The tower holds.',
        d: 'Ancient things dinnae rush — but they get there.',
      },
      hebridean: {
        a: 'Taller by the hour. The machair watches ye grow.',
        b: 'The tide rises slowly. So do ye.',
        c: 'Another step out along the stac. Good.',
        d: 'The Calanais stones shift for no one. Ye\'re getting closer.',
      },
      iron_brew: {
        a: 'Every dunt adds a layer. Getting good this.',
        b: 'Levelled up. The bru is working.',
        c: 'Harder wi every hit — and now a bit stronger tae.',
        d: 'Dunted tae greatness. A very Scottish biography.',
      },
      grans_best: {
        a: 'Stronger noo. Gran can see it from the armchair.',
        b: 'Levelled up. Gran expected nothin less.',
        c: 'Ye\'re getting there, hen. Keep it tidy.',
        d: 'Gran\'s nod. That\'s the highest honour.',
      },
      the_pict: {
        a: 'Another notch in the stone.',
        b: 'The knotwork grows anither loop.',
        c: 'Aye — that ane goes intae the carving.',
        d: 'Strength handed doon fae the bedrock itsel.',
      },
      jacobite: {
        a: 'The Cause advances. The moor takes note.',
        b: 'Flora would approve. The road north is clearer.',
        c: 'A step closer tae the Cause.',
        d: 'Bonnie. Braw. Keep gaun.',
      },
      tam_o_shanter: {
        a: 'Kings may be blest, but Tam grows glorious.',
        b: 'Another dram o\' power. The bonnet sits truer.',
        c: 'O\'er a\' the ills o\' life victorious — that\'s the bard\'s line. That\'s mine tae.',
        d: 'Meg wid\'ve galloped harder. Keep up.',
      },
      engineer: {
        a: 'Spec updated. Output increased.',
        b: 'Improvement logged. Telford would nod.',
        c: 'The drawings are getting better. So is the haggis.',
        d: 'Watt improved the engine fourteen times. This is one.',
      },
      tufted: {
        a: 'Stronger. The pup notices.',
        b: 'Level up. The pup is unimpressed. Good — standard maintained.',
        c: 'Growing. The pup grows with me.',
        d: 'The moor teaches. The pup watches me learn.',
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
      selkie: {
        a: 'First splash o\' the hunt. Tide is wi\' us.',
        b: 'The shore heard that. Keep movin.',
        c: 'First blood under moonlit water.',
        d: 'Seal-skin shakes dry. Onward.',
      },
      morningside: {
        a: 'Well. That was necessary. One apologises to no one.',
        b: 'One\'s first encounter — conducted with appropriate briskness.',
        c: 'Dispatched. One notes the experience without comment.',
        d: 'Handled. One moves on without making a scene.',
      },
      drouthy: {
        a: 'First blude! Slainte mhath — the barrel\'s barely touched.',
        b: 'Away wi\' ye! Hic. The moor\'s mine the nicht.',
        c: 'That\'s the dram workin\'. Couldnae hae done it sober. Maybe.',
        d: 'Doon! The whisky kent it afore I did.',
      },
      pibroch: {
        a: 'First blood — on the downbeat. The tune asked; they answered.',
        b: 'One note struck. The ceòl mòr begins here.',
        c: 'They fell to the moor\'s own rhythm. Good a way as any.',
        d: 'Opening ground-note landed. The pibroch is moving now.',
      },
      orcadian: {
        a: 'First strike — like the first stone placed at Brodgar.',
        b: 'Ane doon. The field\'s aye there.',
        c: 'The Pech began wi\' ane stone tae. Same idea.',
        d: 'Ring started somewhere. This is that somewhere.',
      },
      hebridean: {
        a: 'First blood on the shore. The sea takes note.',
        b: 'The Minch didn\'t stop ye. They can\'t either.',
        c: 'Shore-side rule: the tide comes first; the rest follows.',
        d: 'The machair has seen harsher openings.',
      },
      iron_brew: {
        a: 'First one doon. Already been dunted twice — worth it.',
        b: 'The bru cracks the opener. Aye.',
        c: 'First blood — the stacking\'s already begun.',
        d: 'Hit first, hit back harder. That\'s the brew way.',
      },
      grans_best: {
        a: 'First yin. Gran wid have gone harder.',
        b: 'That\'s the opener. Nae sentimentality.',
        c: 'First blood — Gran approves. She disnae say so.',
        d: 'One doon. Gran\'s already moved on tae the next.',
      },
      the_pict: {
        a: 'First blood on the moor. The stone is satisfied.',
        b: 'Aye. There it is. The carving begins.',
        c: 'Nae gold tae be had. Jist this. Guid enough.',
        d: 'The Pict marks the first kill. As always.',
      },
      jacobite: {
        a: 'The Cause draws first blood. The moor will remember.',
        b: 'Flora would have smiled. Briefly, quietly, like that.',
        c: 'First blood for the Prince. Aye — that\'s the ane.',
        d: 'For every redcoat that came over the glen — this.',
      },
      tam_o_shanter: {
        a: 'First yin doon on the Alloway road.',
        b: 'The witches stirred at that. Good.',
        c: 'Weel aimed, ya beauty. The bard wid approve.',
        d: 'First blood, and the bonnet\'s still on.',
      },
      engineer: {
        a: 'First target acquired. Turret agrees.',
        b: 'The cairn fired first. I\'ll take the credit.',
        c: 'One down. The mechanism is satisfied.',
        d: 'First contact. The specifications were correct.',
      },
      tufted: {
        a: 'First blood. The pup already found the second.',
        b: 'First target down. The pup had the third in sight.',
        c: 'We opened the account. Both of us.',
        d: 'First kill — mine. Next kill — the pup\'s. We\'re counting separately.',
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
      selkie: {
        a: 'Like fish through foam — they cannae pin ye.',
        b: 'The tide is countin culls for ye.',
        c: 'Seal-slick, haggis-hard. Keep the rhythm.',
        d: 'A whole shoal doon. Braw work.',
      },
      morningside: {
        a: 'Quite a run. One doesn\'t boast, but one notices.',
        b: 'Consecutive eliminations. Efficiently achieved.',
        c: 'This level of efficiency is, one supposes, becoming.',
        d: 'A streak. One keeps one\'s composure, naturally.',
      },
      drouthy: {
        a: 'Stack \'em like drams — ane, twa, three, an\' the moor spins.',
        b: 'Cannae stop noo. The barrel\'s no empty yet.',
        c: 'Hic. Every kill\'s anither swig. This is braw.',
        d: 'They\'re fallin\' faster than I am. That\'s a guid sign.',
      },
      pibroch: {
        a: 'The streak is a bar repeat. Let it ring.',
        b: 'Same beat, again. The pibroch knows this road.',
        c: 'The theme is returning. They haven\'t learned it yet.',
        d: 'Each kill is a variation. The ground-tune stays true.',
      },
      orcadian: {
        a: 'Like the Ringers — each ane adds tae the circle.',
        b: 'The mounds grow slowly. This is faster.',
        c: 'Stack them up, like the Broch o\' Gurness.',
        d: 'Corrigall Farm — harvest at yer ain pace. Faster here.',
      },
      hebridean: {
        a: 'The tide culls what the shore won\'t hold. So do ye.',
        b: 'Running down the moor like the Minch running out.',
        c: 'Each one falls to the water-line.',
        d: 'The machair doesn\'t count. It just holds the record.',
      },
      iron_brew: {
        a: 'Stack on stack on stack. Unstoppable.',
        b: 'Every kill after a dunt — that\'s a bru kill.',
        c: 'Taken so many hits ye\'re dealing them back wi interest.',
        d: 'This is what the orange does. Fear the orange ane.',
      },
      grans_best: {
        a: 'They\'re dropping like Gran\'s patience. Entirely.',
        b: 'Gran would have done the same — faster.',
        c: 'Streak on. Gran\'s tallying.',
        d: 'That\'s the low-HP fury. Gran named it.',
      },
      the_pict: {
        a: 'Three — the column needs three.',
        b: 'The beast-panel fills itsel.',
        c: 'Aye — the knotwork is talkin noo.',
        d: 'Woad-marked an unstoppable.',
      },
      jacobite: {
        a: 'The glen kens the name. The streak grows.',
        b: 'Charlie himself couldna have done it better.',
        c: 'Each kill brings the Cause a step nearer.',
        d: 'The moor watches. The plaid hides the count.',
      },
      tam_o_shanter: {
        a: 'Tam was on a streak at Alloway tae. Ended badly.',
        b: 'Cutty-sark couldna catch him when he moved like this.',
        c: 'The bonnet\'s low, the speed is high, the streak is growin\'.',
        d: 'Meg wid\'ve kept up. Barely.',
      },
      engineer: {
        a: 'Throughput satisfactory. Streak logged.',
        b: 'Two shooters running. The moor cannat keep up.',
        c: 'Sequential elimination. The mechanism is efficient today.',
        d: 'Rennie would have called this good load-bearing.',
      },
      tufted: {
        a: 'Two of us. Half the time.',
        b: 'The pup is enjoying this. So am I.',
        c: 'Running tally: me and the pup, the moor and nothing.',
        d: 'Streak\'s ours. I\'ll split the credit with the pup.',
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
        a: 'Hame again, sma\' an\' hale.',
        b: 'The pelt mends. Auldwife\'s herbs.',
        c: 'Even the witch sleeps a wee.',
        d: 'Eldritch herbs ower the wound. Awa wi\' it.',
      },
      selkie: {
        a: 'Salt closes the scrape. Back in.',
        b: 'Tide washed the worst o\' it away.',
        c: 'Skin settles right again. Move.',
        d: 'A wee shore-breath, then back tae danger.',
      },
      morningside: {
        a: 'Good. One\'s reserves are restored to a more acceptable level.',
        b: 'The crisis has passed. One maintained composure throughout.',
        c: 'There. Rather better. One needn\'t mention the earlier difficulty.',
        d: 'Restored. One carries on as one always has.',
      },
      drouthy: {
        a: 'Better. The moor settles when ye stop spinnin\' a minute.',
        b: 'Right again. Or close enough tae right. Hic.',
        c: 'Healed? Grand. Anither dram tae celebrate?',
        d: 'On ma feet again. That\'s nae always a given.',
      },
      pibroch: {
        a: 'Back. The ùrlar was still going. It waits.',
        b: 'The heal came on the beat. Of course it did.',
        c: 'Steadied. The moor\'s rhythm never stopped.',
        d: 'Recovered — the ceòl mòr doesn\'t pause for wounds.',
      },
      orcadian: {
        a: 'The sea gives back. Always.',
        b: 'Maeshowe faces the midwinter sun. We find wir ain light.',
        c: 'Stones stand oot the worst o\' it. So dae I.',
        d: 'Still. The isle holds ye even when ye slip.',
      },
      hebridean: {
        a: 'The stac stands through every storm. So do ye.',
        b: 'Came through the crossing before. Come through this.',
        c: 'The machair renews after every tide. So does this.',
        d: 'Island folk know how to endure. Aye — just so.',
      },
      iron_brew: {
        a: 'Bounced back. Harder than before. Classic bru.',
        b: 'Still standing. Still stacking.',
        c: 'Every wee recovery adds to the pile.',
        d: 'Dunted doon and back up again. That\'s the whole recipe.',
      },
      grans_best: {
        a: 'Back up. Gran would expect nothing else.',
        b: 'Recovered. The bonus waits if ye need it again.',
        c: 'Colour back in the cheeks. Gran\'s satisfied.',
        d: 'Still here. Gran\'s still watching.',
      },
      the_pict: {
        a: 'The moor forgets naethin. Neither dae I.',
        b: 'Back tae the bedrock. Back tae it.',
        c: 'Dinnae mistake breathin for weakness.',
        d: 'Still carved. Still here.',
      },
      jacobite: {
        a: 'The plaid buys a moment. Use it.',
        b: 'Flora got him tae the shore. I\'ll get masel there tae.',
        c: 'Back on the Cause. The moor\'s no done wi me yet.',
        d: 'Still tae Skye. Still gaun.',
      },
      tam_o_shanter: {
        a: 'Back on the saddle. The bonnet\'s still on.',
        b: 'The Brig o\' Doon\'s behind me noo. Breathe.',
        c: 'Running water saved him. Speed saves me.',
        d: 'Tam survived worse — just. So did I.',
      },
      engineer: {
        a: 'Damage assessed. Repairs in progress. Turret unaffected.',
        b: 'The mechanism bent. It did not break.',
        c: 'Back within tolerances. The cairn never stopped.',
        d: 'Telford rebuilt the bridge three times. This is once.',
      },
      tufted: {
        a: 'The pup did not panic. Good example.',
        b: 'Back in it. The pup barely broke stride.',
        c: 'Recovered. The pup kept the pressure on.',
        d: 'Crisis passed. The pup kept biting through it.',
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
      coastal: {
        a: 'The wrack-line — what the tide left.',
        b: 'Selkie weather. Stay close tae the heather edge.',
        c: 'Seafoam at yir hooves. Salt in the air.',
        d: 'Corryvreckan\'s washing pot, miles oot. Mind the swell.',
      },
      haar: {
        a: 'Haar\'s in. Hooves first, eyes second.',
        b: 'Cobbles wet. Mind the slip.',
        c: 'Ten yards o\' world. Plenty.',
        d: 'Things move easier in the haar. Mostly them, mind.',
      },
      frost: {
        a: 'Frost on the air. Tighten yir hide.',
        b: 'Bracken\'s white. Winter\'s claimed it.',
        c: 'Snow-patches still on the ben. Cairngorms weather.',
        d: 'Cold takes the tired first. Keep moving.',
      },
      cairngorm: {
        a: 'Up on the tops. Wind\'s wi\' ye — but it\'ll turn.',
        b: 'Quartzite an thin air. Tha Bodach Glas walks here.',
        c: 'Subarctic plateau — snaw in July. Move careful.',
        d: 'Compass needle\'s swithering. The summit kens it\'s itsel.',
      },
      glen_coe: {
        a: 'Glen Coe. Walk respectful — the glen\'s no\' forgotten.',
        b: 'Red-black rock above, river quick below. A weight ye can taste.',
        c: 'Three miles o\' corrie. 1692 still in the wind.',
        d: 'Red deer in silence. The glen prefers the quiet.',
      },
      clyde_shipyard: {
        a: 'The Clyde\'s quiet now. Wasn\'t always.',
        b: 'Mind the slag — the ground\'s still warm here.',
        c: 'They built the QE2 here. The haggis keeps the faith.',
        d: 'Watch yir hooves on the clinker.',
      },
      black_bog: {
        a: 'Ink underfoot. Every hoofprint stays.',
        b: 'Blacker than a tax bill. Move careful.',
        c: 'The peat went past brown. Deep breath.',
        d: 'The drift\'s pulling worse here. Hold the line.',
      },
      // Ben Nevis Summit (2026-05-24) — exposed plateau, wind push, sparse.
      // Edge register: terse, elemental, no fuss. The Ben doesn't explain itself.
      ben_nevis: {
        a: 'Summit. The wind disnae ask permission.',
        b: 'Up here, everything\'s simpler. Survive or don\'t.',
        c: 'The Ben\'s been here longer than the word for it.',
        d: 'Three thousand miles of Atlantic. Nothing between you and it now.',
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
    // ── Cairn Stacking (DESIGN_IDEAS §1). Hearth, pilgrim-warm:
    //    ceremonial register, no punch, the kind of small rite a Munro-
    //    walker performs without a thought. Two sub-pools: `stack` per
    //    individual stone collect, `boon` for the third-stone Cairn's
    //    Blessing. Generic fallback covers the rare tagless request.
    cairn_moment: {
      generic: {
        a: 'Stone added — wee weight, big quiet.',
        b: 'A pebble for the path.',
      },
      stack: {
        a: 'Stone laid — moor remembers small things.',
        b: 'Wee weight added. Cairn nods.',
        c: 'A stone fer the next walker — fair pay.',
      },
      boon: {
        a: 'The cairn stands. The moor minds ye now.',
        b: 'Three stones, one blessing — auld arithmetic.',
        c: 'Pilgrim done — the glen pays its tithe.',
      },
      // First Cairn's Blessing ever (lifetime, v22). Pilgrim wonder beat
      // — the haggis discovers what three small stones can ask of the
      // glen, before it becomes a familiar rite. Sister to bound_first
      // (clootie) + cured_*_first (beithir). Hearth-warm, slightly
      // hushed; the cairn answered something the haggis didn't know
      // it had asked.
      boon_first: {
        a: 'Three stones, an answer — never kent the moor was listenin.',
        b: 'First cairn ever. Wee rite, lang echo.',
        c: 'A blessin frae three pebbles? Ye learn somethin every walk.',
      },
    },
    // ── Stance Toggle (DESIGN_IDEAS §1). Hearth — the haggis voicing
    //    its own posture shift, never commentary on the world. Three
    //    sub-pool tags mirror the cycle: loose / braced / reeling.
    //    Generic fallback covers the rare tagless request. Two leaves
    //    per tag clears the no-repeat ring so back-to-back cycles
    //    alternate. Lines stay terse — a stance shift is a small
    //    physical act, not a soliloquy.
    stance_change: {
      generic: {
        a: 'Different bones the day.',
        b: 'Posture\'s the wee thing that minds.',
      },
      loose: {
        a: 'Loose again. Legs ken the ordinar gait.',
        b: 'Easin\' off — let the drift dae what it does.',
      },
      braced: {
        a: 'Set. Slow an\' steady, drift held in.',
        b: 'Bracin\' — feet planted, every step counted.',
      },
      reeling: {
        a: 'Reelin\'. Faster, daftler, drift fair wild.',
        b: 'Hot foot — the moor blurs, an\' that\'s the point.',
      },
    },
    /** Shinty Parry (DESIGN_IDEAS §1). Fires on consume edge — the
     *  player flicked the caman at exactly the right moment and the
     *  projectile died on the ash. Two leaves keep the no-repeat
     *  ring honest on dense parry play. Hearth-warm tone, low-key
     *  pride; the parry already speaks loudly via VFX/SFX so the
     *  voice line stays a pleased murmur, not a celebration. */
    shinty_parry: {
      a: 'Caman flick — that\'s how it\'s done.',
      b: 'Aff the ash, easy as that.',
    },
    /** Clootie Rag Wager (DESIGN_IDEAS §1). Fires on commit edge — the
     *  player walked through the trunk and paid the HP cost. Hearth +
     *  grave register: ceremonial gravity, no celebration. The act is
     *  a folkloric supplication for healing or favour, real in
     *  Munlochy / Avoch / Culloden wells today; the haggis voices it
     *  as a quiet trade, eyes on the rags. Three sub-pool leaves clear
     *  the no-repeat ring on the rare same-run double-pass (impossible
     *  in v1 — one tree per run — but defensive against v2 expansions).
     *  Generic two-leaf fallback covers a tagless `request`. */
    clootie_wager: {
      generic: {
        a: 'Tied a wee piece o\' me to the branch.',
        b: 'Trade made. Fair price.',
      },
      bound: {
        a: 'Cloth on the bough — bargain bound.',
        b: 'Strip o\' me for a strip o\' grace.',
        c: 'The well takes its share. The moor pays back.',
      },
      // First wager ever (lifetime). Routed by clootieTree.commit when
      // bumpClootieWagerCommit() returns 0 — the haggis is *learning*
      // what the well asks. Wonder beat, hearth + grave; no repeat
      // across a save lifetime so all three carry the same supplication
      // weight. Sister to beithir_sting.cured_*_first.
      bound_first: {
        a: 'First time the bough\'s asked. Aye — a strip o\' me, then.',
        b: 'I felt the bough lean before I tied. So this is how it goes.',
        c: 'Auld stories said the rag did somethin\'. Now I ken what.',
      },
    },
    /** Cairn Walkover ("The Moor Remembers" feature). Fires when the player
     *  steps over a Cairn of Echoes. Seven sub-pool tags:
     *    past_self_first    — first cairn touched this run
     *    past_self          — subsequent cairn touches
     *    grandfather_first  — first grandfather whisper ever (lifetime)
     *    grandfather_revealed — subsequent grandfather whispers
     *    grandfather_complete — after the 25th grandfather leaf is revealed
     *    wreathed           — cairn has wreathedAt (Cailleach Gauntlet win)
     *    extinguished       — cairn has extinguishedAt (gauntlet lost)
     *  Hearth tone throughout: quiet, awed, never boastful. The moor speaks;
     *  the haggis only listens. Banter pool priority 34. */
    /** The Moor Remembers V2 (Cailleach Gauntlet). Five tag sub-pools
     *  mark the gauntlet's beats: 7th touch arms it (armed), 14:00
     *  candle-ring lights (candles_lit), 15:00 boss appears
     *  (cailleach_spawned), Cailleach falls (cailleach_down), Cailleach
     *  wins (cailleach_dominant). Edge tone throughout; the haggis is
     *  bracing herself for a folkloric reckoning, not boasting. Pool
     *  priority 95 — above beithir_sting (90), below boss_warn (100).
     *  Spec: docs/superpowers/specs/2026-05-22-moor-remembers-v2-design.md. */
    cailleach_gauntlet: {
      // Structural fallback (untagged) — keeps the every-pool-≥-2-keys
      // + globally-unique-keys fences honest. In practice the
      // scheduler always routes through a tagged sub-pool.
      a: 'The mountain notices.',
      b: 'Something is being counted.',
      armed: {
        a: 'Seven stones. Seven names. The mountain notices.',
        b: 'I\'ve counted too high. Something\'s counting back.',
        c: 'The cairns are quiet noo. That\'s the wrang kind o\' quiet.',
        d: 'The Cailleach disnae like a clever haggis.',
      },
      candles_lit: {
        a: 'Seven candles. Seven memories. The Cailleach is called.',
        b: 'The ring\'s lit. Nae backin oot.',
        c: 'I\'ve a minute. Maybe less.',
        d: 'Candles dinnae warn. They mark.',
      },
      cailleach_spawned: {
        a: 'She walks oot o\' the haar. Staff first. Eyes last.',
        b: 'The auld wife is here. Mind yer manners.',
        c: 'Winter is a woman. She\'s come for the count.',
      },
      cailleach_down: {
        a: 'The crown is mine. Winter blinked.',
        b: 'Seven stones gold. Seven names louder.',
        c: 'I\'ll carry her crown soft. She earned the cost.',
        d: 'The Cailleach went hame. So can I.',
      },
      cailleach_dominant: {
        a: 'The Cailleach claimed the candles. No\' the stones.',
        b: 'Snuffed oot. The cairns abide.',
        c: 'The mountain wins this nicht.',
      },
    },
    cairn_walkover: {
      past_self_first: {
        a: 'That stone wisnae here yesterday. It is now.',
        b: 'My stone. Still standing.',
      },
      past_self: {
        a: 'A wee thanks fae beneath.',
        b: 'The moor keeps its count.',
      },
      grandfather_first: {
        a: 'Who was that? That wisnae me.',
        b: 'The stone spoke. Not my voice.',
      },
      grandfather_revealed: {
        a: 'The old voice again. Listen.',
        b: 'He kent more than he should.',
      },
      grandfather_complete: {
        a: 'He is quiet now. The moor is mine.',
        b: 'Twenty-five. He\'s said his piece.',
      },
      wreathed: {
        a: 'Aye, that wis a guid day. Found the seven, beat the Cailleach. The stones remember.',
        b: 'A wreathed cairn. Past-me earned that. The gauntlet was won here.',
      },
      extinguished: {
        a: 'The Cailleach claimed the candles, nae the stones. They bide still.',
        b: 'Snuffed, but no\' gone. Past-me tried. The moor kept the count.',
      },
    },
    /** Lemmings Easter Egg (DESIGN_IDEAS §13). Fires once when the cliff-
     *  edge parade triggers — a quiet hearth-toned toast riding under
     *  the OH NO! SFX. Pays affectionate tribute to DMA Design / Dundee
     *  1991, Scotland's foundational games studio. Hearth tone — pleased,
     *  fond, the haggis acknowledging a small wonder it was patient
     *  enough to witness. Two leaves on the no-repeat ring give variety
     *  for the player who unlocks the parade across multiple variants;
     *  the homage stays gentle (no in-game "Lemmings"-the-trademark
     *  verbatim). Per CULTURAL_SENSITIVITIES_RESEARCH §trademark — the
     *  SCS overlay echoes the EN beats without quoting copyrighted
     *  audio or text. */
    lemmings_remember: {
      a: 'The lemmings remember ye. Aff they go.',
      b: 'Wee green-haired ones — they\'ve passed.',
    },
    /** Wild Living World Phase 2 — Selkie form-shift commentary. Hearth
     *  register, soft and considered: the seal is a relief; the haggis
     *  is a homecoming. Tag `seal` fires entering the seal form; tag
     *  `haggis` fires returning. The fallback `a` / `b` lines stay
     *  direction-agnostic so a caller without a tag still resolves
     *  copy without dropping the line. */
    form_shifted: {
      a: 'New shape. Same wee bones.',
      b: 'The skin slips. The heart stays.',
      seal: {
        a: 'Salt in the lungs again.',
        b: 'Sea-side body. Drift smoothed oot.',
        c: 'The water-folk nod once.',
        d: 'Smooth like the loch on a still mornin.',
      },
      haggis: {
        a: 'Hame in the moor-bones.',
        b: 'Wee legs back. Heather underneath.',
        c: 'Skin remembers the haggis way.',
        d: 'Salt washed off. Heart\'s in the heather.',
      },
    },
    /** Taxman Grudge Ledger (DESIGN_IDEAS §1). Fires once at run-end
     *  victory: the Taxman speaks in his own voice from beyond the
     *  ledger he just lost. Edge tone — bureaucrat-sneer, ink-cold,
     *  Lowland-stiff. Two leaves per verdict so the no-repeat ring
     *  stays honest across replays of the same finishing style; sub-
     *  pool tag = `GrudgeVerdict` (`coward` | `bruiser` | `precise` |
     *  `reckless` | `even`). Voice register: HE speaks here, not the
     *  haggis — first-person column-talk, paperwork metaphor, never
     *  panicked. Compare to `boss_warn.taxman.*` (haggis-voice
     *  *about* the Taxman) — that's a different speaker. */
    taxman_grudge: {
      coward: {
        a: 'Distance noted. The ledger files ye under "cautious".',
        b: 'Aye, ye kept yer haggis tidy. Mine paid the rent in red ink.',
      },
      bruiser: {
        a: 'Right in their teeth. No artistry — just appetite.',
        b: 'Brawler\'s column. None o\' mine retired comfortable.',
      },
      precise: {
        a: 'Untouched by the work. Suspicious clean books.',
        b: 'No\' a scratch on yer ledger. I\'ll audit that twice.',
      },
      reckless: {
        a: 'On the brink each time. Daft or daring — same column.',
        b: 'Ye finished mine the way ye\'ll finish yersel\'.',
      },
      even: {
        a: 'A column o\' middlin\' entries. Forgettable.',
        b: 'Nothin\' worth notin\' in the margin. Book\'s closed.',
      },
    },
    /** Race the Beithir (DESIGN_IDEAS §1). The Beithir's venom-fang
     *  opens an 8 s race window — reach a heal patch (folkloric
     *  "running water under a bridge") OR kill the beast before the
     *  timer expires. Edge tone for the urgency beats (`stung`,
     *  `expired`); hearth-warm relief for the cure beats (`cured_heal`,
     *  `cured_kill`). Two leaves per tag clear the no-repeat ring on
     *  the rare same-run double-sting. The top-level `keys` is the
     *  `stung` line set, doubling as the unknown-tag fallback per the
     *  pool contract (taxman_grudge mirror). Voice register: haggis
     *  diegetic — first-person under venom, with the moor as witness. */
    beithir_sting: {
      a: 'Bit. Eight seconds — heal water or its head.',
      b: 'Beithir fang. Run, or fight, or fall.',
      cured_heal: {
        a: 'Healing water — the venom lifts.',
        b: 'Bridge\'s blessing. Clean again.',
      },
      cured_heal_first: {
        a: 'Bridge water — folk werenae lyin\'. Clean.',
        b: 'First time the auld stories paid out.',
        c: 'Running water under a stane. Aye, true.',
      },
      cured_kill: {
        a: 'Kilt the beast. Venom dies wi\' it.',
        b: 'Head off, curse off. Fair trade.',
      },
      cured_kill_first: {
        a: 'Kilt it. Venom dies on its ain tongue. Aye.',
        b: 'First Beithir doun. The lore wis right.',
        c: 'Fang for fang. Auld debt settled.',
      },
      expired: {
        a: 'The venom found home. That hurt.',
        b: 'Eight seconds, an\' I wasted them. Lesson.',
      },
    },
    // ── Gran's commentary (B1 Phase 2). Hearth — Gran-voice: elder
    //    warmth *about* the run. Keep lines short and tender. Never
    //    shaming, especially in the defeat sub-pool. Generic pool is
    //    the fallback when no tag is
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
      l: 'They banned me in the States. Sheep-lung law, ken — flatterin\'.',
      m: 'Tourist crouched by the gorse. Took a snap. Smiled fer them.',
      n: 'Naturalist measured ma left leg. Then ma right. Smiled tae himsel\'.',
      o: 'Field guide says I\'m no\' real. Aye, an\' yet — here we are.',
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
      selkie: {
        a: 'Sea quiet in the lugs. Moor quiet underhoof.',
        b: 'If ye hear singin, it isnae all wind.',
        c: 'Kelp at the ankle, heather at the nose.',
        d: 'Borrowed skin, borrowed minute. Use it weel.',
      },
      morningside: {
        a: 'The moor appears to be taking rather a long time.',
        b: 'One is being patient. This is patience. One notes this.',
        c: 'One waits. Perfectly contentedly. One is fine.',
        d: 'Mm. The heather goes on somewhat, doesn\'t it.',
      },
      drouthy: {
        a: 'Quiet on the moor. Just me, the whisky, an\' seventeen degrees o\' drift.',
        b: 'A drouthy haggis is a patient haggis. He\'s got a flask.',
        c: 'Hic. The drift\'s worse when ye stand still an\' think aboot it.',
        d: 'Whit time is it? Doesnae matter. It\'s dram o\'clock.',
      },
      pibroch: {
        a: 'Still. The ùrlar runs underneath — I\'m just walking on top of it.',
        b: 'Even at rest, the moor has a tempo. I\'m listening.',
        c: 'The ceòl mòr doesn\'t need me moving to keep going.',
        d: 'Quarter-note. Quarter-note. The moor is a drum — if ye ken how to hear it.',
      },
      orcadian: {
        a: 'The Simmer Dim — the light that never quite gaes oot.',
        b: 'Skara Brae sat under the sand four thousand year. Patient.',
        c: 'Listen. The geo kens every sound that passes through.',
        d: 'The wind taks its time here, tae. I\'m learnin\' frae it.',
      },
      hebridean: {
        a: 'Nae rush. The islands have been here a good while.',
        b: 'The Atlantic does not hurry. Neither do I.',
        c: 'Listen — that\'s the Minch, not silence.',
        d: 'The machair holds its own counsel. Worth learning from.',
      },
      iron_brew: {
        a: 'Each dunt\'s a deposit. Compound interest is braw.',
        b: 'Just standing here being dunted. Doing great.',
        c: 'The moor\'s trying tae soften me. It\'s working backwards.',
        d: 'Orange. Indestructible. Scottish. That\'s the bru.',
      },
      grans_best: {
        a: 'Gran\'s quiet. That means she\'s pleased.',
        b: 'The armchair\'s warm. The moor isn\'t. Gran\'s oot here anyway.',
        c: 'She never rests. Neither should ye.',
        d: 'Gran watches every run. She\'s seen worse. She\'s seen ye.',
      },
      the_pict: {
        a: 'The stone is patient. Sae am I.',
        b: 'The Pict waits. The moor kens.',
        c: 'Woad disna wash aff easy.',
        d: 'They carved because they had time. I dae the same.',
      },
      jacobite: {
        a: 'The plaid will come again. Sixty seconds.',
        b: 'The loch is quiet. Ower the sea tae Skye.',
        c: 'Waiting is the Jacobite\'s trade. A patience born o\' defeat.',
        d: 'Flora counted redcoats. I count seconds.',
      },
      tam_o_shanter: {
        a: 'The lamp\'s still lit in the pub window. The pub\'s far awa noo.',
        b: 'Whisky\'s warmer than the moor. The moor disnae notice.',
        c: 'Alloway Kirk is quiet the nicht. For noo.',
        d: 'The bonnet sits true. The drift says otherwise.',
      },
      engineer: {
        a: 'The turret fires without me. It always does.',
        b: 'Watt\'s kettle worked without him watching. So does the cairn.',
        c: 'The mechanism runs. I observe. Both are useful.',
        d: 'A still haggis is a haggis reviewing the drawings.',
      },
      tufted: {
        a: 'The pup\'s found something. I should move.',
        b: 'Wee pause. The pup\'s circling.',
        c: 'Still as two stones. The pup\'s better at this than me.',
        d: 'Quiet on the moor. The pup smells something.',
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
      // Act-specific tags (2026-04-29). GameScene now requests with
      // `tag: 'act_${actN}'` so the round-robin can voice the
      // moment by which gate just fell instead of repeating the same
      // generic two-liner. 4 lines per act keeps the no-repeat ring
      // (size 8) loose enough that consecutive runs feel fresh.
      // Voice register: HEARTH per Voice Card — warm, exhale-after-
      // tension, never triumphalist.
      act_1: {
        a: 'First gate doon. Ye opened the moor.',
        b: 'Gordon\'s settled. Path widens noo.',
        c: 'Act one\'s a long mile, an ye walked it. Onwards.',
        d: 'Smoke clears. The road past the kitchen is yours.',
      },
      act_2: {
        a: 'Second gate doon. The auld road yields.',
        b: 'Bus tipped. Tour\'s telt a different tale this run.',
        c: 'Halfway song. The quiet bit comes neist — ready yer ears.',
        d: 'Two gates passed. Final hill\'s ahint the next mist.',
      },
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
      // First Reliquary curio ever (lifetime total across all curios, v22
      // cohort). Pilgrim wonder beat — before the haggis knows what a
      // curio *is*. Sister to cairn boon_first / clootie bound_first /
      // beithir cured_*_first. Hearth-warm, slightly hushed.
      first_curio: {
        a: 'First curio iver — didnae ken the moor kept gifts.',
        b: 'Wee thing, off the path. First time it\'s ever been mine.',
        c: 'A relic? An auld trade — an\' I just learnt the price.',
      },
    },
    /** Haggis Wildlife Foundation field-note pickup (DESIGN_IDEAS §11
     *  wild-haggis-myth). Fires on collect of a `pickup_field_note`
     *  dropped by a haggis_hunter. Voice tint: the page itself is in
     *  absurd-naturalist Foundation prose (Latin binomials, terrain
     *  footnotes, leg-asymmetry inventories); the haggis reads a
     *  fragment and reacts in his own voice. Six leaves on the no-
     *  repeat ring; hearth-warm, with the Foundation's footnotes
     *  carried as quoted snippets ("subject drifts clockwise" /
     *  "Haggis scoticus dextrogyrus" / "unfit for shores below 53°N").
     *  Pairs with the polaroid float text — tourists drop photos,
     *  hunters drop notebooks; the two factions read as kindred but
     *  voiced apart. */
    field_note_pickup: {
      a: 'Field note: "subject drifts clockwise." Aye, dae I noo.',
      b: 'Latin name says I\'m magnificent. I\'ll take it.',
      c: 'The Foundation\'s ink, dryin\' on the moor.',
      d: '"Haggis scoticus dextrogyrus." Means the wee right-leanin\' wan.',
      e: 'They\'ve measured ma legs. The wee man\'s pencil broke.',
      f: 'Footnote — "unfit for shores below 53°N." Aye, that\'s truth.',
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
      // Nicnevin first-kill — Fey-Grave register, queen-on-her-knees
      // gravity. The Unseelie court does not forget who broke its ring;
      // mark the first time without making light of it.
      boss_nicnevin_kill: {
        a: 'First Nicnevin felled. The Wild Hunt rides without its queen.',
        b: 'Unseelie crown bested ance. The fiddlers played the silence.',
      },
      boss_the_laird_kill: {
        a: 'Laird\'s fallen ance. The tenants are stunned quiet.',
        b: 'First stoon tae the tweed. Moor\'s cheerin\' low.',
      },
      // Nuckelavee first-kill — Grave register. The most feared creature
      // in the northern isles. Mark the weight; the fresh water held.
      boss_nuckelavee_kill: {
        a: 'First Nuckelavee driven aff. The burn between ye and it made aw the difference.',
        b: 'The skinless thing is back in the sea. First time any haggis came back tae say so.',
      },
      boss_hunter_general_kill: {
        a: 'Hunter-General met his match. First time. Worth a photo.',
        b: 'Nae more hunters\' general. First o kin tae say it.',
      },
      // Earl Beardie first-kill — Edge-Grave register. The wager was
      // supposed tae go the other way; mark the first upset of the house.
      boss_earl_beardie_kill: {
        a: 'First haggis tae beat Earl Beardie at cairds. The Devil haes noted it.',
        b: 'Glamis sealed room got a new silence. The ghost lost — first time since Bannockburn.',
      },
      // Post-bell first-kill — Edge register. The lullaby was always a lie;
      // first haggis to answer it with steel.
      boss_black_douglas_kill: {
        a: 'First haggis tae answer the lullaby wi\' steel. The Black Douglas disnae get ye.',
        b: 'Border raider stopped. The moor kept a mark for the first tae manage it.',
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
      //    pattern (see docs/archive/BANTER_GAPS.md).
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
      variant_witch_hare_unlocked: {
        // Isobel Gowdie's 1662 confession — "I shall go intill ane
        //  hare" — gives this variant her covenant cadence. Cursed-
        //  victories gate (5) means the line lands on a player who
        //  has chosen difficulty repeatedly; voice tilts mythic-grave
        //  accordingly.
        a: 'Five cursed victories. The hare watches frae the heather.',
        b: 'I shall go intill ane hare — and the moor lets ye.',
      },
      variant_morningside_unlocked: {
        // Survives 15 minutes in a single run. Voice: hearth-posh,
        //  entirely composed, refusing to acknowledge the achievement
        //  is notable. One managed.
        a: 'Fifteen minutes. One managed. The Morningside Haggis joins the roster.',
        b: 'Composure. Propriety. The moor is quite welcome.',
      },
      variant_drouthy_unlocked: {
        // 1,200 lifetime gold earned — spent most at the pub.
        // Voice: hearth, jolly, slightly slurred surprise.
        a: 'Twelve hundred gold banked — or spent. The Drouthy Haggis rolls in.',
        b: 'Aye, he was always comin\'. The moor smelled the whisky a mile oot.',
      },
      variant_pibroch_unlocked: {
        // 3 victories. Voice: hearth-warm, understated — the moor
        // acknowledging someone who has learned to listen.
        a: 'Three victories. The Pibroch Haggis steps out — the moor already knew its rhythm.',
        b: 'The ceòl mòr was always here. Now ye\'ve a haggis that hears it.',
      },
      variant_orcadian_unlocked: {
        // 3 coastal-only victories. Voice: hearth, ancient-patience —
        // the islands acknowledging someone who learned to stay.
        a: 'Three coastal runs. The Orcadian Haggis — patient as the Ring, small as the stones remember.',
        b: 'The isle grants passage. The Orcadian Haggis steps ashore.',
      },
      variant_hebridean_unlocked: {
        // 4 coastal-only victories. Voice: hearth, open-horizon calm —
        // the machair acknowledging someone who has truly learned the shore.
        a: 'Four coastal runs. The Hebridean Haggis answers — water-wise, machair-rooted.',
        b: 'The Minch knew ye\'d be back. The Hebridean Haggis steps out of the sea-fog.',
      },
      variant_iron_brew_unlocked: {
        // 2 cursed victories. Voice: edge — wry, battered, delighted.
        a: 'Two cursed runs survived. The Iron Brew Haggis steps oot — orange, indestructible, ready tae be dunted.',
        b: 'Ye took the curse twice and won. The bru respects that. Helps wi the dunts, tae.',
      },
      variant_grans_best_unlocked: {
        // 5 victories. Voice: hearth, dry, fond.
        a: 'Five victories. Gran\'s Best emerges — fiercer at the low end, and she\'s been watching the whole time.',
        b: 'Gran\'s nod granted. Gran\'s Best haggis takes the field. Skirl of approval.',
      },
      variant_the_pict_unlocked: {
        // 3 no-heal victories. Voice: hearth, ancient, spare.
        a: 'Three runs, nae healer touched. The Pict steps oot o\' the stone — woad-marked, moor-rooted, disna deal in gold.',
        b: 'The old ane wakes. The Pict: carved in stone, painted in woad, nae interest in the shop.',
      },
      variant_jacobite_unlocked: {
        // 7 victories. Voice: edge — tragic-romantic, lament tinged.
        a: 'Seven victories. The Jacobite steps oot — for the Cause, for Flora, for every moor they crossed wi nae map an\' nae hope.',
        b: 'Ye won seven times. The plaid unfolds. Flora\'s route is open; the redcoats are looking the ither way.',
      },
      variant_tam_o_shanter_unlocked: {
        // 10 victories. Voice: edge, Burns-citational, delighted.
        a: 'Ten victories. Tam o\' Shanter mounts up — fast as Meg, reckless as the bard, the bonnet on at a gallop. "Kings may be blest, but Tam was glorious."',
        b: 'Ye won ten times. The pub at Ayr sends ye off. The moor between here and the Brig o\' Doon is yours.',
      },
      variant_engineer_unlocked: {
        // 15 victories. Voice: dry, technical, quietly proud.
        a: 'Fifteen victories. The Engineer places the cairn — Watt measured, Telford bridged, Rennie spanned. This haggis builds. Then it goes to war.',
        b: 'Ye won fifteen times. The turret is stacked. The mechanism is armed. Two shooters on the moor.',
      },
      variant_tufted_unlocked: {
        // 10 victories. Voice: hearth-warm, gently proud, companion-focused.
        a: 'Ten victories. The Tufted Haggis earns the pup — the wee familiar that follows, finds, and fights on the moor.',
        b: 'Ye won ten times. The tuft-mark holds. The pup is yours — and it bites.',
      },
      variant_selkie_unlocked: {
        // 2 coastal-only runs. Voice: hearth, tidal-lyrical — the selkie
        // seal-folk myth (shed the skin, walk as human, always drawn back).
        a: 'Two coastal runs. The Selkie Haggis emerges — kelp-grey, shore-patient, one foot already in the tide.',
        b: 'Ye walked the coast twice and came back. Something came back wi ye. The selkie nods.',
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
    // ── Death reflections (B1 Phase 2 Task 12). Hearth, warmly-framed,
    //    never shaming. Tagged sub-pools match
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
      // ── St Andrew's Day (Nov 30 ± 3). National-day, saltire weather.
      //    Hearth tone with Edge bites about the cold-half winter front.
      //    SCOTTISH_RESEARCH §13 (national identity); ART_STYLE_BIBLE
      //    §Hearth + §Grave (saltire palette is cool-blue with warm
      //    backbone). 12 leaves.
      st_andrews: {
        a: 'St Andra\'s day. Saltire weather — blue an\' bracin\'.',
        b: 'The patron saint walks the moor wi\' a fisherman\'s rope.',
        c: 'X marks the cross. X marks the haggis still standing.',
        d: 'Saltire o\'er every kirk. The wind sings under it.',
        e: 'A flag\'s just cloth — \'til it\'s ower yer ain folk.',
        f: '"As lang as Scotland stands" — said wi\' a wee dram tonight.',
        g: 'Andrew\'s the fisher saint. We\'re the netted, fightin\' clear.',
        h: 'Auld days, new hooves. Same flag.',
        i: 'Cold wind off the Firth, but the heart\'s warmer.',
        j: 'Saint o\' the lost — keep walkin\', he kens the way.',
        k: 'White cross on blue, like frost on slate.',
        l: 'Pipes carry "Flower of Scotland" today. Walk straighter.',
      },
      // ── Imbolc (Feb 2-8). Brigid / Brìde — first stir of spring.
      //    Hearth tone, ewes-lactating, snowdrops, healing. Per
      //    SCOTTISH_RESEARCH §1 Brigid mythology + DESIGN_IDEAS §12.
      //    Voice register: warm, patient, just-after-the-cold.
      //    12 leaves.
      imbolc: {
        a: 'Imbolc — "i mbolg," in the belly. The lambing\'s comin\'.',
        b: 'Brìde\'s been here. Snowdrop pushed up in the cold.',
        c: 'First milk on the byre flagstones. The year sighs.',
        d: 'Brat Bríde left out tonight — for healing in the morn.',
        e: 'Her white wand touches the heather. Sleep loosens.',
        f: 'Ewes haud their lambs in. Brigid haulds the rest.',
        g: 'Cailleach gathers her firewood. Shorter winter or longer.',
        h: 'Candles in every window — "let the light find ye, hen."',
        i: 'Smith\'s fire, poet\'s fire, hearth\'s fire — three at once.',
        j: 'St Brigid\'s cross plaited fae rushes. The moor learns it tae.',
        k: 'A serpent stirs aneath the hill — auld weather waking.',
        l: 'The hag\'s grip eases. Walk lighter. Push.',
      },
      // ── Lùnastal / Lammas (Jul 29 - Aug 4). Harvest-start, loaf-mass,
      //    Lugh's funeral games for Tailtiu. Hearth tone — bounty,
      //    gratitude, first-fruits. SCOTTISH_RESEARCH §1 Lùnastal +
      //    SCOTTISH_RESEARCH_DEEP §13.4 (Lammas / cornkist). 12 leaves.
      lammas: {
        a: 'Lùnastal — Lugh\'s games. Run hard, the gods are watchin\'.',
        b: 'First sheaf cut tonight. Bread fae new grain.',
        c: 'Loaf-mass at the kirk. Loaf-mass at the cairn here.',
        d: 'Tailtiu cleared a plain an\' died of it. Honour the dirt.',
        e: 'A bannock o\' the first reaping — tear, share, eat.',
        f: 'Cornkist standin\' tall. The year owes ye plenty noo.',
        g: 'Lammas storms come in fast. Outrun \'em.',
        h: 'Hand-fasting weather. Promise nothing ye cannae keep.',
        i: 'Crom Dubh\'s horse trampled the grain. Lugh stopped him.',
        j: 'Hilltop fires fer the harvest. Smoke smells like home.',
        k: 'Last day o\' the green. Bronze creeping in.',
        l: 'A wee dram for Lugh — and one fer the next swing.',
      },
      // ── Bracken-turn (Nov 4 - Nov 26). The autumn cusp — fronds
      //    bronze, first frost, rooks gather. Hearth tone with Edge
      //    bites about the cold half closing in. SCOTTISH_RESEARCH §1
      //    moor phenology + folk markers. Voice: warm-melancholy,
      //    coat-pulled-tighter, the moor settling for sleep. 12 leaves.
      bracken_turn: {
        a: 'Bracken\'s gone copper. The moor\'s changed claes.',
        b: 'First frost in the heather. Crunches different.',
        c: 'Rooks gathering. They feel the cauld first.',
        d: 'Last apples on the rowan. Take ane, leave nine.',
        e: 'Sun barely lifts noo. Walk in its hour, ye\'ll feel it.',
        f: 'Smell the peat-smoke fae the steading? Fires lit early.',
        g: 'The moor\'s pullin\' its coat tighter. So should you.',
        h: 'Hallowe\'en\'s passed. The auld wirld settles.',
        i: 'Bronze underfoot. The year drops weight.',
        j: 'Fern-fronds rust-flecked — naebody painted them, mind.',
        k: 'Cauld snap comin\'. Dinnae linger by the burn.',
        l: 'The moor remembers warm. Hold the thocht.',
      },
      // ── Bannockburn anniversary (Jun 22-25). Bruce's victory in 1314;
      //    Burns wrote "Scots, Wha Hae" 1793 about it. Hearth tone with
      //    Edge bites about the field. SCOTTISH_RESEARCH_DEEP §6.3
      //    (Wars of Independence) + §17.2 (Burns canon). Voice: warm-
      //    proud, low-rumble pike-wall, kindred-with-Bruce. Cultural
      //    framing celebrates resilience, not anti-English politics.
      //    12 leaves.
      bannockburn: {
        a: 'Bannockburn weighs in. The field still kens its names.',
        b: 'Bruce held the line wi\' a haggis-fed army. Eat hard.',
        c: '"Scots, wha hae wi\' Wallace bled" — Burns kent the day.',
        d: 'Pike-wall stood. Ye stand the same way — feet planted.',
        e: 'Six hunner years past, an\' the moor still mind.',
        f: 'Bruce\'s heart\'s buried at Melrose. The body lies elsewhere.',
        g: 'Schiltron — auld word for a circle that does not break.',
        h: 'Twa days o\' the field. The third day, the ploughs returned.',
        i: 'A king kissed the soil after. Mark that — dirt is honest.',
        j: 'Spider on the wa\'? Bruce watched ane till he kent persistence.',
        k: 'Hold thy ground. The next charge minds the last.',
        l: 'Walk on the field. Walk softly. Then walk on.',
      },
      // ── Glorious Twelfth (Aug 11-13). Grouse-season opens; tweed
      //    fans out across the brae, dogs in the heather, shotguns
      //    cracking somewhere up the slope. The haggis goes to ground
      //    + widens its arc. Hearth tone with wry Edge bites about
      //    the noise. SCOTTISH_RESEARCH_DEEP §6.10 (sporting estates)
      //    + §22.3 (sporting calendar). Voice: warm-wry, not anti-
      //    hunter; the haggis isn't fighting them, it's outwaiting
      //    them. 12 leaves — lifts the cohort to 10/10.
      glorious_twelfth: {
        a: 'The Twelfth opens. Up by the brae, somebody\'s aiming.',
        b: 'Tweed an\' tweed an\' a wee bit dog. Goes-to-ground oclock.',
        c: 'Grouse season — the moor\'s loud. Walk wider; eat wider.',
        d: 'Haggis Wildlife Foundation guidance: lie still; nobody\'s found us yet.',
        e: 'The hunters open their season. The haggis opens its eyes.',
        f: 'Heather smells o\' powder for three days. Then the moor forgets.',
        g: 'Naebody\'s after a wild haggis. Just dinnae stand against the sky.',
        h: 'Shotgun crack — distant. The bracken stays bracken.',
        i: 'Twelve August. Auld word: "the moor on the Twelfth is no\' yours".',
        j: 'Dogs in the gully — not for ye. The haggis is no\' on the schedule.',
        k: 'A wider arc reads the moor better. Ye\'re no\' the only thing breathing.',
        l: 'When the slope\'s busy, walk slow. The slope forgets fast.',
      },
      // ── Tartan Day (Apr 4-8). The diaspora's national-Scottish day,
      //    anchored on Apr 6 — date of the Declaration of Arbroath
      //    (1320). Banter rides the cloth, the cousins, and the line
      //    "for freedom alone, which no honest man gives up but with
      //    life itself". Hearth tone with two grave-edge moments (c, i)
      //    for the Declaration's gravity. SCOTTISH_RESEARCH_DEEP §6.7
      //    + §14.5. No anti-English content; warmth without flag-
      //    waving. 12 leaves — lifts the cohort to 11/11.
      tartan_day: {
        a: 'Tartan Day. The moor reaches further today.',
        b: 'Six o\' April. Cousins in Cape Breton remember.',
        c: 'The Declaration\'s day. "For freedom alone."',
        d: 'Diaspora warmth. Every clan in one weave.',
        e: 'Saint Andrew\'s older cousin — when Scotland told the world.',
        f: 'A piper somewhere in Vermont. The moor hears.',
        g: 'The reach is longer today. The pickups know it.',
        h: 'Tartan Day — every wandering haggis comes home in the cloth.',
        i: '"Sae lang as a hunder o us bide alive…" — the Auld lines hold.',
        j: 'Six April thirteen-twenty. The Declaration. The moor minds it yet.',
        k: 'Cousins in Otago, Manitoba, Glasgow. Same blood; same moor-pull.',
        l: 'Walk wide. The cloth reaches as far as the heart wills.',
      },
      // ── Simmer Dim (Jun 18-21). Shetlandic / Orcadian phrase for the
      //    perpetual twilight of Scottish midsummer at high latitudes;
      //    north of 60°N the sun barely sets between mid-June and
      //    early July. The phenomenon peaks at the solstice (Jun 21).
      //    Window 4 days, anchored on the solstice with a 3-day lead-
      //    in — narrowed past the typical 5-day band to dodge
      //    Bannockburn (Jun 22-25). Cultural framing: hush, not
      //    festival. Held light, hares stay out, fey-ring caution.
      //    SCOTTISH_RESEARCH_DEEP §22.6. Hearth tone with one fey-
      //    edge bite (d) for midsummer-eve folklore. 12 leaves —
      //    lifts the cohort to 12/12.
      simmer_dim: {
        a: 'Simmer dim. The night never quite arrives.',
        b: 'Solstice held the light. The moor stays half-lit.',
        c: 'Twilight holds. The hares dinnae go in.',
        d: 'Mind the fey rings tonight — midsummer fae walk soft.',
        e: 'The Shetlanders ken — north o\' sixty, the dark forgets to come.',
        f: 'Held light. Held breath. The moor minds the longest day.',
        g: 'Solstice quiet. The strike, when it lands, lands harder.',
        h: 'Twenty-first of June. The sun barely set. Walk wide.',
        i: 'Gloaming for days. The bracken keeps watch.',
        j: 'Midsummer\'s e\'en — the auld folk left the hearth burning low.',
        k: 'Held twilight. The crit lands like the sun lingered.',
        l: 'The moor doesn\'t darken. The haggis keeps moving.',
      },
      // 2026-05-09 — Up Helly Aa (Feb 9-15) lifts the cohort banter
      // coverage to 13/13. Shetland fire-festival cycle; the marquee
      // Lerwick procession is the last Tuesday of January but sits
      // inside Burns Night in real life — this window honours the
      // broader Shetland season (Cunningsburgh mid-Feb, Cullivoe,
      // Norwick, Bressay, Nesting, Uyeasound). Banter rides the
      // torch-procession, the guizer brotherhood, the galley burning
      // at the harbour end, and the Norn echoes still in the dialect.
      // Hearth tone with one grave-edge bite (h) for the longship's
      // commitment-to-flame. SCOTTISH_RESEARCH_DEEP §22.7.
      up_helly_aa: {
        a: 'Up Helly Aa. The torches march. The wee one keeps low.',
        b: 'A thousand guizers in Lerwick the night. Steel a glance.',
        c: 'The galley waits at the harbour — they always burn the galley.',
        d: 'Norn echoes in the patter. Shetland\'s its own moor.',
        e: 'Bressay across the sound. The fire reaches.',
        f: 'Jarl\'s squad in helms and beards. Walk small.',
        g: 'The procession sings. The haggis swings the harder.',
        h: 'They put a longship to flame and call it a year. Mind that weight.',
        i: 'Cunningsburgh tonight. Then Cullivoe, then Norwick. The fire keeps moving.',
        j: 'Tar-barrels and torchlight. The auld yule burning, formalised.',
        k: 'Eighteen-eighty-one they made it formal. Older than that in the bone.',
        l: 'The galley sinks burning. The strike lands the harder for it.',
      },
      // 2026-05-24 — Culloden anniversary (Apr 13-18) closes the
      // seasonal calendar. Grave register throughout — no hearth
      // warmth, no comedic distance, no anti-English content, no
      // Jacobite romanticism. The haggis is a moor-witness: the
      // moor sees; the moor remembers; the moor does not editoralise.
      // SCOTTISH_RESEARCH_DEEP §6.9.
      culloden: {
        a: 'Sixteenth April. Three centuries or three minutes — the moor disnae measure time the way a calendar does.',
        b: 'Drumrossie Moor held them forty minutes. A haggis can cross Drumrossie in five. The ground keeps the difference.',
        c: 'Three thousand Jacobites marched in the cold. Not three thousand came home. The count is in the stones.',
        d: 'The pipes played until they couldn\'t. The music didn\'t die that day — it went somewhere quieter.',
        e: 'They buried them by clan. Somebody walked the field and kent which face belonged to which glen.',
        f: 'Some of the Jacobites hadn\'t slept. They\'d marched through the night to come at Cumberland by surprise. The morning didn\'t go their way.',
        g: 'The Clearances came after. Culloden is one date; the emptying of the glens was decades more.',
        h: 'The bonnie prince never came back. The glens that lit bonfires for him waited a long time.',
        i: 'A haggis disnae take sides. The moor disnae take sides. But they both take note.',
        j: 'The boulders are still on Drumrossie. The clan graves are still there. The wind still crosses both.',
        k: 'Three hundred years and the grass grew back. The cairns are still standing. Some things are harder tae kill than an army.',
        l: 'What changed at Culloden was more than who held the field. The tongue, the cloth, the name of the glen — all of it shifted after.',
      },
    },
  },
  toast: {
    screenshot_saved: 'Screenshot saved to downloads.',
    screenshot_failed: "Couldnae save the frame — gie it another go.",
    clip_saved: 'Clip saved to downloads.',
    clip_failed: "Couldnae save the clip — gie it a wee minute.",
    clip_empty: 'Play a wee bit longer before saving a clip.',
    clip_unsupported: 'Clip saving is not supported in this browser.',
    // W82 Phase 3 — feedback toasts for the save-highlight link.
    // Voice mirrors the existing clip family so the player reads a
    // consistent register across both download paths.
    highlight_saved: 'Highlight saved — keep that moment.',
    highlight_failed: "Couldnae save the highlight — gie it another go.",
    frame_copied: 'Frame copied — paste it where ye like.',
    frame_copy_failed: "Couldnae copy the frame — try Save instead.",
    // W82 Shared-run URL — banner shown on the recipient side when a
    // run launches from a `?run=...` deep link. `{variant}` and
    // `{curse}` are already i18n-resolved labels.
    shared_run_loaded: '↗ Shared run · {variant} · {curse}',
    shared_run_loaded_clean: '↗ Shared run · {variant}',
    // W82 V2 (challenge mode) — when the URL carries the sharer's
    // outcome (t + o params), the banner gains a friendly "time to
    // beat / outlast" tail. Voice register is Hearth: "to beat" /
    // "to outlast" framing puts the recipient alongside the sharer
    // (picking up a friend's run) rather than racing them. `{time}`
    // is already a formatted mm:ss string from formatClockTime.
    shared_run_challenge_victory: '↗ Shared run · {variant} · {curse} · {time} to beat',
    shared_run_challenge_death: '↗ Shared run · {variant} · {curse} · {time} to outlast',
    shared_run_challenge_victory_clean: '↗ Shared run · {variant} · {time} to beat',
    shared_run_challenge_death_clean: '↗ Shared run · {variant} · {time} to outlast',
  },
  /**
   * Wee Tales — single procedural prose epitaph that closes a run.
   *
   * Voice register: Hearth (per `docs/VOICE_CARD.md`).
   *   - Death lines are grave-warm, not maudlin. The moor is kind
   *     without pity. NO "rest in peace" or "may they find rest" —
   *     the haggis isn't dead, the *run* ended.
   *   - Victory lines are warm without being braggy. "Walked home"
   *     is the canonical phrase — the run survived, not the player
   *     conquered.
   *   - 1–2 sentences max; the panel has limited room.
   *
   * Slots: `{time}` is mm:ss-formatted; `{boss}` and `{source}` are
   * enemy keys that the render path resolves into display names via
   * `getEnemyDisplayName()`; `{variant}` is the variant key that the
   * render path resolves into a variant display name.
   */
  weeTale: {
    death: {
      // Generic fallbacks (1-tag specificity) — kindly, no specifics.
      fallback_a: 'The moor closed gently at {time}. There\'ll be another walk.',
      fallback_b: 'Down at {time}. The peat keeps its own counting.',
      fallback_c: 'Run ended at {time}. The hawthorn still bends where ye walked.',
      // Time-bucket lines — short / long / epic.
      short_a: 'A short walk: {time}. The moor was learning ye too.',
      long_a: 'A long walk: {time}. The boots remembered the road.',
      epic_a: 'A long, lit walk: {time}. The moor saw ye go far.',
      // Killer-flavoured death lines for the act-resolver bosses.
      gordon: 'Felled at {time} by Gordon\'s sergeants. Even a slow boss has a fast minute.',
      tour_bus: 'The tour bus came round the bend at {time}. Headlights, then nothing.',
      taxman: 'The Taxman closed the ledger at {time}. A debt only ever called once.',
      taxman_postbell: 'Past the bell-toll. The Taxman caught up at {time} — he always does, eventually.',
      nuckelavee: 'No skin on the thing. It came off the sea at {time}. The burn on the far brae held the rest.',
      earl_beardie: 'Earl Beardie dealt his hand at {time}. The last card was yours.',
      black_douglas: 'The hush came at {time}. Good Sir James did not need to speak.',
      each_uisge: 'The Each-Uisge came bonny from the loch at {time}. Touch it once and the grip doesnae let go.',
      nicnevin: 'Nicnevin\'s parliament closed at {time}. The moor offered nae appeal.',
      the_laird: 'The Laird made his claim at {time}. Auld deeds, auld rights. The haggis had nae title.',
      hunter_general: 'The Hunter-General closed the chase at {time}. The quarry ran oot of moor.',
      /** Cailleach Gauntlet — ritual failed; the winter returned. */
      cailleach_boss: 'Seven cairns lit — and then the storm. The moor went quiet at {time}.',
      /** Post-bell Tier-3 — Storm Cailleach. The haar closed at {time}. */
      storm_cailleach: 'The storm took it at {time}. Not weather — something older.',
      /** Post-bell — Twin Stones. The circle caught the haggis at {time}. */
      twin_stones: 'An Càraid caught it at {time}. The stones were standing when the islands had no name. They\'ll stand again.',
      /** Post-bell — Wicker Haggis. The tribute was completed at {time}. */
      wicker_haggis: 'The wicker effigy did its job at {time}. Bealltainn got its tribute. The haggis was not consulted.',
      // v2 — universal {name}-bearing death line (tier-2).
      with_name_a: '{name} laid doon by the heather. The moor remembers what it can.',
      // v2 — biome-contextual death lines (tier-2, no {name}).
      biome_bog: 'The bog at {time} — soft ground, and then softer.',
      biome_loch: 'Stood at the loch-edge at {time}. The loch does not give back what it takes.',
      biome_pine: 'The pine forest closed in at {time}. The old trees see a great deal.',
      biome_heather: 'The heather held a shape a while after {time}. Then the wind came.',
      biome_coastal: 'The cliff-wind at {time}. Too near the edge — or the edge came too near.',
      biome_haar: 'The haar closed in at {time}. Walked until there was no moor left to walk.',
      biome_frost: 'The frost-moor at {time} — slowed, and the moor did not.',
      biome_cairngorm: 'The plateau wind took the haggis at {time}. The cairngorm keeps its own cold.',
      biome_glen_coe: 'The glen holds its weather close. Out of moor at {time}.',
      biome_clyde_shipyard: 'The slag was still warm at {time}. The Clyde remembered.',
      biome_black_bog: 'The ink held the shape a moment at {time}. Then it closed over.',
      biome_ben_nevis: 'The wind took it at {time}. The Ben didn\'t notice.',
    },
    victory: {
      // Generic victory fallbacks (1-tag).
      fallback_a: 'Walked home at {time}. The kettle was on.',
      fallback_b: 'Made it back at {time}. Gran will hear the whole of it.',
      // Specific accomplishment lines.
      epic: 'Walked home at {time} with the moor singing behind. A long, lit road.',
      cursed: 'Bore the burden the whole way and still walked home at {time}. The hawthorn bends.',
      ironmoor: 'Ironmoor cleared at {time}. Once was enough — and once is plenty.',
      taxman_kill: 'Closed the Taxman\'s ledger at {time}. He won\'t forget; the haggis won\'t either.',
      three_bosses: 'Three boss-skulls in the heather behind. Home at {time}, walking light.',
      nuckelavee_kill: 'The Nuckelavee went back to the sea. {time} on the moor, and the burns held.',
      earl_beardie_kill: 'Earl Beardie\'s cards scattered on the moor at {time}. The wager was yours.',
      black_douglas_kill: 'The lullaby was a lie — but the haggis was not. {time} on the moor, and silence kept.',
      each_uisge_kill: 'The loch-horse went back to the water at {time}. The haggis kept its skin.',
      nicnevin_kill: 'Nicnevin\'s court dissolved at {time}. The moor breathes its ain air again.',
      the_laird_kill: 'The Laird went doon at {time}. The haggis disputes the deed — and won.',
      hunter_general_kill: 'The Hunter-General\'s medals are on the moor at {time}. The quarry went home.',
      /** Cailleach Gauntlet won — Stormcrown taken, winter answered. */
      cailleach_boss_kill: 'Stormcrown taken at {time}. The seven cairns hold the memory of it.',
      /** Post-bell Tier-3 — Storm Cailleach defeated; the gale unravelled. */
      storm_cailleach_kill: 'The Cailleach of the Storm unravelled at {time}. The gale remembered a different ending.',
      /** Post-bell — Twin Stones defeated; the heartstone is cold. */
      twin_stones_kill: 'An Càraid doon at {time}. The heartstone is cold. The circle is yours.',
      /** Post-bell — Wicker Haggis defeated; survived the tribute. */
      wicker_haggis_kill: 'The wicker fell at {time}. Bealltainn got its ceremony — the haggis got its moor back.',
      // v2 — universal {name}-bearing victory line (tier-2).
      with_name_a: '{name} walked back oot. The moor lets some go.',
      // v2 — biome-contextual victory lines (tier-2, no {name}).
      biome_bog: 'Walked the bog and came back knowing the smell of peat.',
      biome_loch: 'Kept back from the edge and walked home. The loch noted this.',
      biome_pine: 'Found a way through the pines. The trees are still there. The haggis too.',
      biome_heather: 'Walked through the purple at {time}. The heather bent both ways. Kept walking.',
      biome_coastal: 'Held the coast at {time}. The Atlantic is indifferent; that day it was wrong.',
      biome_haar: 'Walked the haar by feel — {time} of grey, and then blue sky again.',
      biome_frost: 'Walked home across the frost. It cracked underfoot the whole way. Home anyway.',
      biome_cairngorm: 'Crossed the cairngorm and came down the other side at {time}. The wind let it happen.',
      biome_glen_coe: 'Walked through the glen at {time}. The red hills watched without comment.',
      biome_clyde_shipyard: 'Crossed the dry-dock at {time}. The rivets held. The haggis held too.',
      biome_black_bog: 'Walked out of the black bog at {time}. The ink stayed on the boots but the haggis stayed on the moor.',
      biome_ben_nevis: 'Came down from the Ben at {time}. The cloud stayed up. The haggis came down.',
    },
    // v2 — variant-voiced lines. Voice registers per
    // `docs/VOICE_CARD.md` §"Variant-scoped voices".
    variant: {
      cailleach: {
        death_baseline: 'Winter is patient, {name}. Ye werena.',
        death_short: 'The mountain was here before {name}. And after.',
        death_cailleach_boss: 'Two winters met on the moor at {time}. {name} was the younger one.',
        victory_baseline: 'Ye did well, {name}. Winter expects more next time.',
        victory_taxman: 'The taxman bowed to {name} at last. Even the mountain blinked.',
        victory_cailleach_boss: '{name} walked into her ain storm and came back oot. The cairns remember it.',
      },
      glaswegian: {
        death_baseline: 'Aye, {name} swung hard. Swung harder than the moor would let.',
        death_short: '{name} didnae make it past the kerb. Get up. Try again.',
        death_nuckelavee: 'The Nuckelavee came in aff the coast at {time}. {name} gave it the look. The look didnae work.',
        victory_baseline: 'Right then. {name} walked it. Dinnae get a heid aboot it.',
        victory_taxman: '{name} bested the taxman. Even Glasgow keeps a wee receipt.',
      },
      doric_quinie: {
        death_baseline: 'Fit like, {name}? Awa hame nou. The sea minds its ain.',
        death_long: '{name} hauded weel. The quinie\'s bonnet bides on the harbour wa\'.',
        death_hunter_general: 'The Hunter-General found the quinie at {time}. She\'d been watching his dogs aw afternoon. She should\'ve watched him.',
        victory_baseline: 'Aye, {name}. The loons doun the pier will hear o\' this ane.',
        victory_epic: '{time} on the moor, {name}. The smokie\'s still warm at the kitchie.',
      },
      peerie_shetlander: {
        // Shetlandic register — "da" (the), "du" (thou/you), "peerie"
        // (small), "voe" (fjord-inlet), "skerry" (rocky reef), "muir"
        // (moor). Terse, Norse-inflected, stoic. C4 native review pending.
        death_baseline: 'Da voe makes nae record o\' {name}. That\'s all right. The moor does.',
        death_short: 'A peerie while, {name}. Even da skerries tak time tae form.',
        death_nuckelavee: 'Da Nuckelavee came aff da sea at {time}. {name} kent da name. Kening disnae keep it.',
        victory_baseline: '{name} held. Da simmer wind carried word back tae da voe.',
        victory_epic: '{time} on da muir, {name}. Da fulmar widnae believe du had da breath for it.',
      },
      burns_wee_beastie: {
        // Citations verbatim from Robert Burns — see
        // `docs/C2_BURNS_PROVENANCE.md` for source attribution.
        death_baseline: '"Wee, sleekit, cow\'rin, tim\'rous beastie" — and yet {name} ran. Aft the heather, oot the door.',
        death_short: '"The best-laid schemes o\' mice an\' men gang aft a-gley." {name} kent it before the end.',
        death_earl_beardie: 'Earl Beardie set a hand at {time}. {name} held wee pockets and high hopes. The cards were, as ever, a-gley.',
        victory_baseline: '"Fair fa\' your honest, sonsie face," {name}. The bard would tip his bonnet.',
        victory_epic: '{name} held the moor for {time}. Burns himself wrote shorter lines.',
      },
      moor_runner: {
        death_baseline: '{name} hit the moor at speed and ran oot o\' it. That kind of momentum doesnae stop clean.',
        death_short: 'Too fast, wrong direction. {name} ran aw the same.',
        death_hunter_general: 'The Hunt-General closed the chase at {time}. {name} had been leading aw morning — but speed has a far end.',
        victory_baseline: '{name} came hame under their ain steam. The moor logged the pace.',
        victory_epic: '{time} at full stride. {name} ran the moor like it asked to be run.',
      },
      iron_belly: {
        death_baseline: 'Even iron bends at the last. {name} held longer than the moor expected.',
        death_short: 'The belly took it. The rest o\' {name} couldnae follow.',
        death_nuckelavee: 'The Nuckelavee took eleven hits at {time} tae find the crease in {name}. The twelfth went through.',
        victory_baseline: '{name} absorbed aw o\' it and came hame dented. The dents are badges.',
        victory_taxman: 'The Taxman threw aw he had at {name}. {name} swallied it and walked aff.',
      },
      glen_forager: {
        death_baseline: 'The glen gives and the glen takes. {name} had a guid haul afore the end.',
        death_short: 'Wrang turn, wrang weather. {name} foraged their last.',
        death_hunter_general: 'The hunting party found the glen at {time}. {name} had the larder. They had the rifles.',
        victory_baseline: '{name} came hame wi\' full pockets and a story worth the telling.',
        victory_epic: '{time} through the glen. {name} knew every hollow, every bent branch, every wey hame.',
      },
      surefoot: {
        death_baseline: 'The ground shifted under {name}. Surefoot or no, some bogs dinnae forgive.',
        death_short: 'One bad step. {name} had been careful till then.',
        victory_baseline: '{name} found every footing and came hame without a slip. The moor notes this.',
        victory_epic: '{time} and nae a stumble. {name} read the ground better than it read them.',
      },
      pipe_breath: {
        death_baseline: 'The last note went long, {name}. The moor heard it oot.',
        death_short: 'Wind knocked oot — and wi\' it, {name}.',
        victory_baseline: '{name} played the moor hame. The tune held aw the wey through.',
        victory_epic: '{time} o\' unbroken breath. {name} played and the moor listened.',
      },
      witch_hare: {
        death_baseline: 'Awa in the hare\'s shape, {name}. The form undid afore the yard was gained.',
        death_short: '"Ay quhill I com hom againe." {name} didnae.',
        death_nicnevin: '{name} ran oot of shapes in Nicnevin\'s court at {time}. Even the hare kens when to kneel.',
        victory_baseline: '{name} ran oot a hare and cam hame a haggis. The confession held its end.',
        victory_epic: 'All the witch\'s miles at {time}. {name} kent baith hame and the hill.',
      },
      anticlockwise: {
        death_baseline: 'The brae went clockwise; {name} gaed the ither wey. Some hills dinnae compromise.',
        death_short: 'Wrang-leg, wrang hill, right idea. {name} ran.',
        death_each_uisge: 'The Each-Uisge spirals clockwise in the loch. {name} runs anticlockwise on the moor. At {time}, the spirals met.',
        victory_baseline: '{name} circled it left-weys and came hame onyway. The hill notes this.',
        victory_taxman: 'The Taxman expected a clockwise run. {name} took him frae ahint.',
      },
      wee_ghostie: {
        death_baseline: '{name} flickered and was gone. The moor doesnae count ghosts the same wey.',
        death_short: 'Even a wee ghostie has a final fade. {name}, briefly.',
        death_nicnevin: 'Nicnevin claimed {name} at {time}. Even ghosts need rank in the Queen\'s court — and a wee ghostie has nane.',
        victory_baseline: 'Hame at {time}. {name} walked through every wa\' that tried to stop it.',
        victory_epic: '{time} and still shinin. {name} hauded on past the point a ghost should.',
      },
      laird: {
        death_baseline: 'The estate closes at dusk. {name} miscounted the hours.',
        death_short: '{name} fell. The deer, naturally, scattered.',
        death_the_laird: 'The Laird\'s estate claimed its ain at {time}. Old land has long memory, {name}.',
        victory_baseline: '{name} walked the whole length o\' it. The Laird goes where the Laird goes.',
        victory_taxman: 'The Taxman sent a bill tae the Laird. {name} returned it — signed and dusted.',
      },
      selkie: {
        death_baseline: 'Somewhere between the water and the moor, {name}. The tide makes its ain decision.',
        death_short: 'The skin was left at the wrang stone. {name} couldnae mak the distance.',
        death_each_uisge: 'Two creatures of the deep water at {time}. {name} was the one who came ashore.',
        victory_baseline: '{name} came hame — which form, the moor disnae say.',
        victory_epic: '{time} between the tide-line and the heather. {name} held baith weys clean.',
      },
      morningside: {
        death_baseline: 'One encountered the moor\'s full schedule today. It was, on reflection, a bit much.',
        death_short: 'Rather abrupt ending. {name} had expected rather more time.',
        death_the_laird: 'The Laird made his claim at {time}. {name} disputed it in the Morningside manner — quietly, firmly, and then not at all.',
        victory_baseline: '{name} prevailed. One is quietly satisfied. One says no more.',
        victory_taxman: 'The taxman was seen off by {name}. Rather efficiently. One considers the matter closed.',
      },
      drouthy: {
        death_baseline: 'The bottle didnae help. {name} sleeps where he fell.',
        death_short: '{name} went doon fast. The flask rolled on.',
        death_each_uisge: 'The loch-horse waits for the ones who stray near water. {name} should\'ve kent better.',
        victory_baseline: '{name} staggered through. The barrel remembered him.',
        victory_taxman: '{name} outlasted the Taxman. The drams outlasted them baith.',
      },
      pibroch: {
        death_baseline: 'The ground-tune ran out before {name} did. The moor keeps playing.',
        death_short: '{name} fell mid-bar. The ceòl mòr doesn\'t stop for the player.',
        death_cailleach_boss: 'The Cailleach heard the pibroch at {time} and answered. {name} played into the storm — the storm played louder.',
        victory_baseline: '{name} walked the full pibroch — ground-note, variations, coda. The moor heard all of it.',
        victory_taxman: '{name} brought the Taxman\'s ledger to the final bar. The tune outlasted him.',
      },
      orcadian: {
        death_baseline: '{name} fell out there on the muir. The stones keep no score — they abide.',
        death_short: '{name} was down. Like the midwinter dark at Maeshowe — first the dark, then the solstice beam.',
        death_nuckelavee: 'The Nuckelavee rose from Orcadian waters at {time}. {name} kent the legend. The legend kent {name} back.',
        victory_baseline: '{name} walked the whole ring and came out the other side. The Brodgar Folk would\'ve nodded.',
        victory_taxman: '{name} settled the Taxman\'s ledger. Orcadians don\'t run from accounts.',
      },
      hebridean: {
        death_baseline: '{name} went out on the machair wind. The sea has seen this before — and the shore holds on.',
        death_short: 'Too brief, {name}. Even the stac takes a season to erode.',
        death_each_uisge: 'The water horse rose from Hebridean waters at {time}. {name} knew the sea in aw its moods — but no this one.',
        victory_baseline: '{name} came through it all. The Minch knows a survivor when it sees one.',
        victory_taxman: 'The Taxman found {name} on the shoreline. The island folk don\'t leave easy.',
      },
      iron_brew: {
        death_baseline: '{name} went doon in the end. But not before accumulating something fierce.',
        death_short: 'Too brief, {name}. Barely got the bru stacking.',
        death_nuckelavee: 'The Nuckelavee doesnae drink. {name} offered a swig at {time}. The gesture wasnae reciprocated.',
        victory_baseline: '{name} — dunted, stacked, indestructible. The orange haggis prevails.',
        victory_taxman: 'The Taxman dunted {name} plenty. Wasted effort. The bru only stacks.',
      },
      grans_best: {
        death_baseline: '{name} went low and swung hard. Gran would call it nearly enough.',
        death_short: '{name}. Gran\'s seen worse runs. Not many.',
        death_cailleach_boss: 'The Cailleach and {name} sat doon at {time}. {name} had shortbread. The Cailleach had winter. There wasnae a third option.',
        victory_baseline: '{name} got fierce at the low end and kept swinging. Gran expected nothing less.',
        victory_taxman: 'The Taxman met {name} on a low-HP rage. Gran was watching from somewhere.',
      },
      the_pict: {
        death_baseline: '{name} fell on the moor. The Pict carries nae gold — only marks in stone.',
        death_short: '{name}. The knotwork still hauds.',
        death_hunter_general: 'The woad-marked fell tae the pith-helmeted at {time}. {name} outlasted every army sent tae these hills — bar this ane.',
        victory_baseline: '{name} carved it oot. The moor kens wha won, even wi nae gold tae show.',
        victory_taxman: 'The Taxman had gold. The Pict had stone. The stone lasts.',
      },
      jacobite: {
        death_baseline: '{name} fell on the moor. The plaid couldnae hold. The Cause goes on.',
        death_short: '{name}. Flora will no forget.',
        death_black_douglas: 'The hush came for {name} at {time}. Good Sir James has nae politics — only the quiet.',
        victory_baseline: '{name} crossed the moor, for the Cause, and came oot the ither side.',
        victory_taxman: 'The Taxman found a Jacobite. The Jacobite had a plaid. The Taxman lost.',
      },
      tam_o_shanter: {
        death_baseline: '{name} fell on the Alloway road. Near enough the Brig o\' Doon.',
        death_short: '{name}. The bonnet rolled on.',
        death_earl_beardie: 'Earl Beardie dealt a hand at {time}. {name} rode into Glamis on a night like this one.',
        victory_baseline: '{name} made it ower the brig. The witches couldnae follow. Meg wid\'ve been proud.',
        victory_taxman: 'The Taxman tried tae stop {name} on the Alloway road. Tam was faster. Tam\'s aye faster.',
      },
      engineer: {
        death_baseline: '{name} fell. The turret kept firing. That\'s the mechanism: it doesn\'t care.',
        death_short: '{name}. The cairn stands. The barrel cools.',
        death_cailleach_boss: 'The weather model at {time} gave 73% storm probability. {name} had a cairn-turret. The Cailleach had winter. The model was right.',
        death_nuckelavee: 'The turret logged 47 hits on the Nuckelavee at {time}. {name} logged a death. The mechanism did not distinguish between outcomes.',
        victory_baseline: '{name} built once and won. Watt would have improved the design for the next run.',
        victory_taxman: 'The Taxman faced {name} and a cairn-turret. Two shooters. One ledger. Settled.',
      },
      tufted: {
        death_baseline: '{name} fell. The pup waited on the moor — still circling the spot, in case.',
        death_short: '{name} and the pup. One fell. The pup did not.',
        death_each_uisge: 'The pup went toward the water at {time}. {name} followed. The pup knew better than {name} about loch-horses.',
        death_earl_beardie: 'The pup hid under the table at {time}. {name} did not. The pup\'s instincts were correct about Earl Beardie.',
        victory_baseline: '{name} and the pup made it through. Two haggis by the end of it — or near enough.',
        victory_taxman: 'The Taxman faced {name} and the pup. Two against one. The ledger forgot to count the pup.',
      },
    },
  },
} as const;
