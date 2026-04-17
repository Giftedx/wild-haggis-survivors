# Banter coverage audit — 2026-04-17

Operational hygiene log of the banter pool state. Intended as a one-page
answer to *"where are the holes and what's blocking them?"* so the next
content or translation pass can target gaps without re-walking the tree.
Regenerate by re-running this audit (`npm test -- --run src/data/banter.test.ts`
plus a quick visual scan of the tagged sets below).

## English (reference locale) — **complete**

Every context declared in `BanterContext` has a `BanterPool` entry with
≥2 keys. Every tagged sub-pool has ≥2 keys. The `src/data/banter.test.ts`
suite enforces this and cross-checks tag coverage against the canonical
source-of-truth sets:

| Banter context | Tagged set | Covered? | Enforced by |
|----------------|------------|----------|-------------|
| `boss_warn`     | every `BOSSES` key | ✔ | `banter.test.ts` — "boss_warn and boss_down have keysByTag for every boss" |
| `boss_down`     | every `BOSSES` key | ✔ | same |
| `weapon_evolve` | every `WEAPON_DEFS` key | ✔ | `banter.test.ts` — "weapon_evolve has keysByTag for every weapon" |
| `curse_start`   | every `CURSES` key | ✔ | `banter.test.ts` — "curse_start has keysByTag for every curse" |
| `low_hp`        | every non-classic `VARIANTS` key | ✔ | `banter.test.ts` — "low_hp has keysByTag for every non-classic variant" |
| `first_blood`   | every non-classic `VARIANTS` key | ✔ | same |
| `kill_streak`   | every non-classic `VARIANTS` key | ✔ | same |
| `recover`       | every non-classic `VARIANTS` key | ✔ | same |
| `level_up`      | every non-classic `VARIANTS` key | ✔ | same |
| `idle`          | every non-classic `VARIANTS` key | ✔ | same |
| `biome_change`  | every `BIOMES` id | ✔ | `banter.test.ts` — "biome_change has keysByTag for every biome" |
| `route_picked`  | every `ROUTES` key | ✔ | `banter.test.ts` — "route_picked has keysByTag for every W2 route" (added 2026-04-17) |

`act_intermission_enter` and `act_complete` are generic-only pools (no
variant/boss differentiation intended).

## Scots overlay — **deferred (Phase B, VO-blocked)**

Scots banter is a Phase B translation task waiting on voice-register
review. Line count snapshot as of 2026-04-17:

| Locale | `ui.banter.*` block lines | Notes |
|--------|---------------------------|-------|
| EN     | ~577 | Complete reference tree |
| SCS    | ~124 | ~21% of EN — ambient / idle / biome-change tone pass, no boss/curse/weapon tags |

No regression guard on Scots banter — a test that enforced parity today
would go red on every commit because Phase B hasn't shipped. When VO
review unblocks Phase B, the hole-filling plan is:

1. Translate all `ui.banter.boss_warn.*` (16 keys — edge register, one
   cold line per boss + generic).
2. Translate `ui.banter.low_hp.*` (33 keys — variant-tagged + generic,
   edge register).
3. Translate `ui.banter.weapon_evolve.*` + `curse_start.*` (44 keys —
   hearth register, decision moments).
4. Translate `ui.banter.level_up.*` / `first_blood.*` / `kill_streak.*`
   / `recover.*` / `idle.*` (~120 keys — hearth register, variant tint
   per key).
5. Translate `ui.banter.boss_down.*`, `moor_moment.*`, `biome_change.*`
   (~60 keys — hearth register, warm celebration).
6. Translate W2 banter (`act_intermission_enter.*`, `act_complete.*`,
   `route_picked.*`) — ~20 keys.

Rough total: ~293 keys. At a Glesga-coached translator's working pace
of ~30 lines / hour, ~10 hours plus ~2 hours of register review per
block for consistency with the hearth / edge split.

## Automation hooks

- Structural coverage: `src/data/banter.test.ts` — already runs in CI.
- i18n parity: `src/core/i18nLiteralFieldGuard.test.ts` catches any key
  whose EN template uses placeholders the SCS overlay doesn't.
- Gap-to-file tracker: this doc — regenerate after each banter authoring
  pass by re-running the audit questions above.

## Not planned

- Adding more English lines per tag — current rotations (3–5 per tag)
  satisfy the no-repeat window (size 8).
- Third-locale coverage (Gaelic, etc.) — infrastructure is ready but
  the first two locales need to ship complete before a third is worth
  the maintenance cost.
- Music-event banter pool — out-of-band with the mood-driven conductor;
  music stays instrumental.
