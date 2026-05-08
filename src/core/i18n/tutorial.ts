export const tutorial = {
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
} as const;
