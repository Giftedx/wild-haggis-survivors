export const captions = {
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
} as const;
