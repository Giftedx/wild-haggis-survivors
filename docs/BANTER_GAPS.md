# Banter coverage audit — 2026-04-23

**Current state:** Phase B shipped (2026-04-18). Phase C **Phase 1 infra** shipped (2026-04-23); authoring phases pending.

---

## What shipped in Phase C — Phase 1 (2026-04-23)

Infrastructure scaffolding, no player-facing change:

- `SAVE_SCHEMA_VERSION` **v6 → v7**. Adds `seenEnemies: string[]` + `firstTimeEventsFired: string[]` to `SaveData`. Migration is a pure version bump; `coerceStringArray` dedupes on load.
- `PENDING_POOL_METADATA` (`src/data/banter.ts`) — tone + priority for the 7 pools scheduled for Phase 2+ authoring. Entries graduate into `BANTER_POOLS` once their leaves land.
- `POOL_PRIORITIES` — single source of truth for the full priority ladder (live + pending). Unit tests lock spec §2 numbers.
- Parity fence (`i18n.locale.test.ts` "every EN banter leaf has a Scots translation") already scoped to `ui.banter.*` — no change needed; ready for Phase 2 authoring.

**Scope trim vs plan:** Phase 1 Tasks 3–6 (trigger wiring in `BanterSystem`) deferred to Phase 2. Wiring hooks before content is dead code, and the spec §3 trigger surface may reshape once authoring starts (run:end outcome fan-out, interval rebound, enemy-spawn semantics). Each hook will land alongside its pool's authored leaves.

---

## Phase C — planned (B1 flagship)

Spec: `docs/superpowers/specs/2026-04-23-banter-density-push-design.md`.
Plan: `docs/superpowers/plans/2026-04-23-banter-density-push.md`.

Adds ~780 leaf keys (EN + SCS) across 9 pools:

| Pool | New lines (EN) | Priority | Trigger context |
|------|----------|----------|-----------------|
| `gran_commentary` | 40 | 30 (new) | Run start / end, moor moments, seasonal events |
| `haggis_ambient` | 50 | 25 (new) | Quiet moor stretches every 45s±15s (HP > 75%, no combat) |
| `enemy_ambient` | 100 (2-5 per enemy) | 40 (new) | First-time + 1/20 re-spawns |
| `cailleach_whisper` | 20 | 55 (new) | Act intermissions, low HP, Bargain events |
| `burns_citation` | 20-30 | 45 (new) | Seasonal Burns Night, lineage, specific evolutions |
| `moor_moment` (expand) | +40 | 35 (existing) | Moor-moment triggers |
| `death_reflection` (expand) | +30 | 75 (existing) | Death screens, per `DeathCauseTracker` |
| `first_time` | 30 | 110 (new) | Reserved one-shots: each boss first-kill, each evolution, combo 100, etc. |
| `seasonal_event` | 60 (3 events × 20) | 65 (new) | Burns Night + Hogmanay + Samhain windows |

Phased delivery: Phase 1 infra → Phase 2 core pools → Phase 3 flavour → Phase 4 specialist voices → Phase 5 seasonal (coordinated with E1).

EN→SCS parity fence (`src/core/i18n.locale.test.ts` scoped to `ui.banter.*`) stays — every new EN leaf merge-blocks without its SCS pair.

---

## Phase B — complete (shipped 2026-04-18)

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

## Scots overlay — **complete (Phase B shipped 2026-04-18)**

Full Scots banter overlay is live. Every EN sub-pool has a matching SCS
entry — generic lines, per-boss, per-variant, per-weapon, per-curse,
per-biome, per-route, plus W2 act banter. Voice register per
`feedback_voice_register`: Still Game hearth for warmth, Limmy edge for
boss warnings / low-HP / decision moments.

| Locale | `ui.banter.*` tree | Notes |
|--------|--------------------|-------|
| EN     | Complete reference tree | Source of truth |
| SCS    | Full parity (generic + all tagged sub-pools) | W18 Phase B shipped 2026-04-18 |

The EN→SCS parity guard lives in `src/core/i18n.locale.test.ts`
("every EN banter leaf has a Scots translation") — scoped to
`ui.banter.*` only so future banter additions enforce bilingual ship,
while non-banter UI (level-up card descriptions, meta-item flavour,
etc.) stays under the existing one-way SCS→EN subset guard.

### What shipped in the Phase B pass

- `boss_warn` per-boss (5 bosses × 3 lines) — Limmy bite, one cold
  identity line per boss (Gordon / Tour Bus / Laird / General / Taxman).
- `low_hp` per-variant (7 variants × 4 lines) — edge, variant-tinted
  (iron belly cracks, moor runner's debt, wee ghostie veil).
- `boss_down` per-boss (5 × 3) — hearth celebration, dry-funny.
- `weapon_evolve` per-weapon (8 × 4) — hearth, each evolution gets
  its own voice (thistle crown, ceilidh violence, deep watter).
- `curse_start` per-curse (5 × 4) — hearth, acknowledging the trade.
- `level_up` / `first_blood` / `kill_streak` / `recover` / `idle`
  per non-classic variant (7 × 4 × 5 blocks = 140) — hearth tint
  per variant fantasy (iron wall, speed merchant, satchel thief,
  surefooted, pipe-breath, laird estate, wee ghostie faint).
- `biome_change` per-biome (4 × 4) — bog / loch / pine / heather
  with sensory tint per region.
- `moor_moment` per-home-biome and per-biome (4 home × 4 + 4 × 3) —
  warm gift tone with kin-discount for the variant's home biome.

Total Phase B additions: 294 leaf keys.

### Maintenance

When EN gains a new banter tag (new boss, new variant, new weapon),
`i18n.locale.test.ts` will fail until the matching SCS entry lands.
Keep SCS lines SHORT — they ride the toast strip + caption bar.
Orthography stays light-Glesga (tha, yer, ye, oot, aboot, doon, wi,
nae, aye) so the tone reads as Still Game warmth / Limmy edge without
alienating non-Glaswegian players.

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
