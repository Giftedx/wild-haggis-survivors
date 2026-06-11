# Banter Authoring

How to add a new boss line, variant voice, or banter context — no engine diffs required for the common cases.

**Prereq:** skim `docs/VOICE_CARD.md` first. Two registers (Hearth / Edge), vocabulary rules, anti-patterns.

## The model

`BanterSystem` picks a line when a context fires. Rules:

- Each **context** (`boss_warn`, `low_hp`, `route_picked`, …) has one **pool** in `src/data/banter.ts`.
- A pool has `tone`, `priority`, generic `keys`, and optional `keysByTag` sub-pools for per-boss / per-variant / per-weapon / per-curse / per-route character.
- Lines are **i18n keys** resolved by `t(...)` from `src/core/i18n.ts`. Adding a line never changes pool structure — it's a key push.
- Highest `priority` wins when two contexts fire in the same tick. Cooldown + no-repeat ring buffer live in the engine; authors don't touch them.

## Priority slots in use

| Priority | Context |
|----------|---------|
| 100 | `boss_warn` |
| 80  | `low_hp` |
| 70  | `boss_down` |
| 65  | `weapon_evolve` |
| 60  | `first_blood` |
| 59  | `curse_start` |
| 57  | `act_complete` |
| 52  | `act_intermission_enter` |
| 50  | `recover` |
| 48  | `route_picked` |
| 40  | `level_up` |
| 35  | `moor_moment` |
| 31  | `biome_change` |
| 30  | `kill_streak` |
| 10  | `idle` |

Open in the 30–60 band: 32–34, 36–39, 41–47, 49, 51, 53–56, 58, 61–64, 66–69. Plenty of room before anything crowds an existing pool.

## Recipe 1 — Add a line to an existing pool

Most common task. Two files.

1. Add the i18n key to **both** `EN_STRINGS` (in `src/core/i18n.ts`) and `SCS_STRINGS` (in `src/core/i18n.scs.ts`). The W18 Phase B completion guard (`src/core/i18n.locale.test.ts` → "every EN banter leaf has a Scots translation") fails if EN adds a banter leaf without a matching SCS entry:

   ```ts
   // EN_STRINGS — src/core/i18n.ts
   'ui.banter.boss_warn.gordon.d': 'Here comes Gordon. Brace yersel.',
   // SCS_STRINGS — src/core/i18n.scs.ts
   'ui.banter.boss_warn.gordon.d': 'Here comes Gordon. Brace yersel.',
   ```

   The SCS entry uses light-Glesga orthography (`tha` / `yer` / `ye` / `oot` / `aboot` / `doon` / `wi` / `nae` / `aye`) and stays in-register (hearth or edge per the parent pool's `tone`). Keep lines short — they ride the toast strip + caption bar.

2. In `src/data/banter.ts`, append the key to the matching `keys` or `keysByTag[tag]` array.

That's it. The engine picks it up on next run; round-robin + no-repeat window handle rotation.

## Recipe 2 — Give a new boss or variant its own voice

Any context with `keysByTag` supports a new tag silently. Unknown tag falls back to the generic pool, so you can ship the boss first and author lines later.

1. Pick the tag string the requester already passes (boss key from `SpawnSystem`, variant key from `MenuScene`, weapon key from `WeaponSystem`, etc.). Don't invent a new tag — grep for `request('context', { tag: ... })` to find the source.
2. Add 3–4 i18n keys under the tag namespace in **both locales** (EN in `i18n.ts`, SCS in `i18n.scs.ts`):

   ```ts
   // src/core/i18n.ts
   'ui.banter.boss_warn.new_boss.a': '…',
   'ui.banter.boss_warn.new_boss.b': '…',
   'ui.banter.boss_warn.new_boss.c': '…',

   // src/core/i18n.scs.ts
   'ui.banter.boss_warn.new_boss.a': '…',
   'ui.banter.boss_warn.new_boss.b': '…',
   'ui.banter.boss_warn.new_boss.c': '…',
   ```

3. Register the sub-pool in `src/data/banter.ts`:

   ```ts
   keysByTag: {
     // existing...
     new_boss: [
       'ui.banter.boss_warn.new_boss.a',
       'ui.banter.boss_warn.new_boss.b',
       'ui.banter.boss_warn.new_boss.c',
     ],
   },
   ```

**Minimum 3 lines per sub-pool.** The no-repeat window is 8, but back-to-back runs against the same boss exhaust a 2-line pool quickly.

## Recipe 3 — Add a new context

Needs an engine touch. Rare. Follow the pattern:

1. Extend the `BanterContext` union in `src/data/banter.ts`.
2. Add a pool entry with a free priority slot, a `tone`, and at least 3 generic keys.
3. Add the i18n keys to both locales.
4. Call `banter.request('new_context', { tag })` from the game surface that fires the moment. Use `scene.banter?.request(...)` — the system is deliberately optional so unit tests without a BanterSystem don't crash.
5. Add a `banter.test.ts` case that drives the new context through `BanterSystem` and asserts it fires with the right priority.

## Tone rules

- **Hearth** (Still Game warmth) → ambient, progression, ongoing-run feedback. Affectionate, pub-bench energy.
- **Edge** (Limmy bite) → failure, low-HP, boss warnings, last-gasp moments. Short, deadpan, dry.

Don't cross registers mid-pool. If a context mixes tones, split it into two contexts.

## Anti-patterns

- **Don't over-author.** 3–4 lines per sub-pool is plenty. The engine's no-repeat window is 8; padding pools past the window just dilutes the strongest lines.
- **Don't reuse keys across pools.** Each line should belong to exactly one context. If a line works for `boss_warn` and `boss_down`, write two different lines.
- **Don't tag-scope what should be generic.** If every boss says the same thing, it's a generic pool line, not a sub-pool.
- **Don't translate English puns literally into Scots.** Rewrite for register; the parity test verifies keys, not meaning.
- **Don't interpolate variables into banter.** These are static toasts. Dynamic text breaks the no-repeat cache and cheapens the voice.

## Verification

```
npm test -- --run src/data/banter.test.ts src/systems/BanterSystem.test.ts
npm test -- --run src/core/i18n.test.ts src/core/i18n.locale.test.ts   # parity fences
npm run build
```

Banter tests cover: every declared context has a pool; every key resolves under the default locale; priority ordering holds; cooldown + no-repeat window behave deterministically. The locale fence adds two directional guards — SCS→EN (no orphan overlays) and EN→SCS scoped to `ui.banter.*` (W18 Phase B completion). Adding a new `ui.banter.*` key without a matching Scots translation red-lines CI.
