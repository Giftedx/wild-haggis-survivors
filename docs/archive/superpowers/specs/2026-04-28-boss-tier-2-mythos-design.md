# N1 — Boss Tier 2: Mythos Design Spec

**Date:** 2026-04-28
**Initiative:** N1 (new)
**Status:** Draft — ship #1 (Each-Uisge) implementation begun 2026-04-28
**Word count:** ~2,400
**Prerequisite:** None strict. Fey bosses pair naturally with Fairy Pools / loch biome if that ships; Grave boss pairs with any existing moor biome with minor palette bias.

---

## 1. Problem Statement

The 25-minute run has five bosses at 5:00, 10:00, 15:00, 20:00, 25:00 (`src/data/enemies.ts:629-690`). Every slot is filled; the boss roster is complete in a mechanical sense. What is absent is **tonal range**. All five existing bosses — Gordon, Tour Bus, the Laird, the Hunter-General, the Taxman — sit inside the **Hearth** and **Wild Comedy** registers. They are funny, grounded, and warm. They are not the whole of Scotland.

The Soul Charter (`docs/DESIGN_SOUL.md:29-39`) names five registers and specifies that the run should *move* across them as a tonal journey. Two registers are dormant in the combat loop:

- **Fey** — otherworldly, tricksy, magical. Seelie/Unseelie courts seeded (`src/core/i18n.ts` references `unseelie_fiddler`, `seelie_piper`, `redcap` enemies) but nothing in the boss tier uses this register.
- **Grave** — heavy, historical, sombre. Referenced in the art bible and soul charter but never activated in a boss encounter.

The Cailleach variant voice (authored at `src/core/i18n.ts:1121-1126`) has no marquee narrative beat — a boss encounter she could witness or react to would justify her register landing.

This spec designs three bosses that activate the dormant registers. The pacing strategy inserts them into **inter-boss gaps** in the existing timeline rather than displacing any existing boss. The `taxman` remains the final boss and `BALANCE.run.FINAL_BOSS_KEY` (`src/core/BalanceConfig.ts:72`) is unchanged.

**New pacing timeline with three additions:**

| Time  | Boss                     | Register      |
|-------|--------------------------|---------------|
| 5:00  | Gordon                   | Wild Comedy   |
| **7:30**  | **Each-Uisge**       | **Fey**       |
| 10:00 | Tour Bus                 | Wild Comedy   |
| **12:30** | **Nicnevin**         | **Fey**       |
| 15:00 | The Laird                | Hearth/Comedy |
| **17:30** | **The Solway Remnant** | **Grave**   |
| 20:00 | Hunter-General           | Wild Comedy   |
| 25:00 | Taxman                   | Wild Comedy   |

---

## 2. Design Risks

These must be addressed before any boss ships.

**Risk 1 — Grave boss reads as Anglophobic.**
The Killing Times (1679-88, `SCOTTISH_RESEARCH_DEEP.md:814`, `CULTURAL_SENSITIVITIES_RESEARCH.md:2.4`) was Crown-imposed state violence against Scottish Presbyterians. A soldier-villain boss would read as anti-English. Mitigation in this spec: the Grave boss is the *victim's ghost*, not the perpetrator. The player is not fighting a redcoat — they are encountering grief made manifest. The boss warning and kill lines frame this explicitly as a lament, not a grudge.

**Risk 2 — Fey bosses reducing to generic witch/monster.**
The sensitivity doc (`CULTURAL_SENSITIVITIES_RESEARCH.md:1.4`) flags that reducing the Cailleach or Unseelie beings to generic fantasy-evil is the outsider trap. Mitigation: each Fey boss is sourced from a specific creature with specific Scottish folklore logic (Each-uisge's sticky-hide / devours everything except the liver; Nicnevin's white horse and wild procession). Their mechanics directly encode their folklore. They are not re-skinned skeletons.

**Risk 3 — `behavior: 'chase'` hardcoded for all bosses in `SpawnSystem.ts:502`.**
The `spawnBoss` method constructs a `bossAsConfig` object with `behavior: 'chase'` hardcoded. Any non-chase boss behavior currently requires either (a) a `behaviorOverride` field on `BossConfig` that `spawnBoss` reads, or (b) a post-spawn hook in `GameScene` that overrides the spawned enemy's AI. This spec proposes option (a) — add an optional `behaviorOverride?: EnemyBehavior` to `BossConfig` — as the cleanest path. The field is optional so all existing bosses remain unaffected. See Implementation Map §6.

**Risk 4 — Boss count breaks `AchievementManager.ach_all_bosses` test.**
`AchievementManager.ts:84` unlocks `ach_all_bosses` when `runBossKills.size >= BOSSES.length`. Adding three bosses raises the threshold to 8. The achievement description text in `src/core/i18n.ts` (wherever `ach_all_bosses.description` is authored) likely hardcodes a number. Both the threshold test (`src/data/enemies.test.ts:56`) and the achievement copy need updating when any boss ships. Flagged here so it is not forgotten.

**Risk 5 — Gaelic text in Nicnevin banter.**
Nicnevin's name is attested Scots, not Gaelic, so no consultation gate applies to the name itself. But if banter lines include Gaelic words (e.g. *daoine sìth*), the `CULTURAL_SENSITIVITIES_RESEARCH.md:3.1` consultation requirement applies: any Gaelic in shipped copy must have native-speaker review. This spec marks Gaelic fragments in banter scaffolding as `[GAELIC — CONSULTATION REQUIRED]`.

---

## 3. Boss #1 — Each-Uisge, The Water-Horse

**Register:** Fey
**Pacing slot:** 7:30 (450 seconds) — the gap after Gordon before the comedy plateau of Tour Bus
**Folkloric source:** `SCOTTISH_RESEARCH.md:56` — *"The kelpie's sea-loch cousin, considered far more dangerous. Can shapeshift between horse, pony, and handsome man. Lures victims who touch it into deep water and devours them, leaving only the liver."* Tagged `[WHS: DEFERRED]` in the first Scottish research doc.
**Cultural sensitivity check:** Water-horse folklore is not historically traumatic. The Each-uisge is a creature of legend, not a representation of a real community. No consultation gate. Pronounce correctly in any audio: *ech-ooshkeh*.

### Encounter Beat

Ten seconds before the boss spawns, the moor undergoes a micro-palette shift: loch blues bleed into the ground under the player's feet as if the world is flooding slightly. The banter pool fires `boss_warn.each_uisge.a`. Then the boss arrives at the edge of screen as a beautiful black stallion — silent, unnervingly still, head turned toward the player. After 1.5 seconds of stillness, it breaks into a charge. At 60% HP it shapeshifts mid-field into a pale rider figure (the "handsome man" form) — faster, smaller hitbox, same damage. At 30% HP it reverts to horse form but wild, careening.

### Mechanics

- **HP:** 1200 base (falls between Gordon 500 and Tour Bus 2000, reflecting an early mid-tier threat)
- **Speed:** 140 base in horse form / 160 in rider form
- **Damage:** 22 per hit
- **Scale:** 2.1 horse / 1.7 rider
- **Behavior:** `phase` — already exists in `EnemyBehavior` (`src/data/enemies.ts:23`). The `phase` behavior causes the enemy to teleport (blink) short distances. In horse form this is suppressed (horse chases). In rider form the `phase` behavior activates, making the boss blink unpredictably. Implementation: `behaviorOverride: 'phase'` on the `BossConfig` kicks in when HP drops below 60%; `GameScene` or `SpawnSystem` reads the override and changes the live enemy's behavior flag. **No new behavior type required.** The blink cadence from existing `phase` enemies fits the "shapeshifter crossing fog" fantasy exactly.
- **Unique mechanic — sticky hide:** Any player who dashes into the Each-uisge suffers 1.5-second dash lockout (cannot re-dash). This is a single iFrame-gating check (`HazardsSystem.ts:301` pattern). The Each-uisge punishes the easiest escape move, forcing the player to kite properly.

### Palette + Visual Signature

Fey palette (`ART_STYLE_BIBLE.md:65-73`): dominant violet-tinted stones and pale luminous heather; the boss glows with an iridescent loch-blue shimmer. Horse form: jet-black with white hooves and a cold blue mane shimmer. Rider form: pale silver-grey, no face visible, green dress hem. Both forms share a baseTint of `0x4a70ff` (loch-blue-shifted). The palette shift at warning time uses `biomeTimbre` nudge via `Conductor.smoothedBiomeTimbre` — loch weight increases.

### Voice and Banter Scaffolding (EN)

**Warning lines (Edge voice — `ui.bossWarning.each_uisge`):**
`"Something beautiful by the water. Dinnae touch it."`

**Boss warn banter pool (`ui.banter.boss_warn.each_uisge`):**
- a: `"That horse's hooves point backwards. Run."`
- b: `"Beautiful and deadly. The loch always sends the best ones."`
- c: `"Dinnae let it look ye in the eye."`

**Kill lines (`ui.game.boss_killed_each_uisge`):**
`"Oot the water and oot o' luck. The loch takes its ain."`

**Kill banter (`ui.banter.boss_down.each_uisge`):**
- a: `"Ye resisted the beautiful thing. That's the hardest skill."`
- b: `"Braw. Even the deep water kenned that was over."`
- c: `"Horse is doon. No' a horse."`

**Boss name (`boss.each_uisge.name`):** `"The Each-Uisge"`

### Music Shift

On boss spawn, `GameMusicState.biomeTimbre` shifts toward 0 (deep loch = darker, peat-grounded). `danger` ramps sharply as the player takes early hits. The `phase`-form transition triggers a 2-second `enragePressure` spike to 0.8, raising chaos. Kill drops all pressure axes to 0 with a clean resolution beat — the Conductor's Dorian melody has room to breathe for 4 bars.

### Drop / Progression Hook

On kill: standard boss heal (`game.boss_kill_heal`), 35 XP gems (between Gordon 25 and Tour Bus 50), 10% relic drop chance. Unique drop possibility: **Loch-Steel Charm** passive — grants 2-second dash-lockout immunity after every 5th dash (a direct counter to the boss's own mechanic, rewarding the fight's lesson).

---

## 4. Boss #2 — Nicnevin, Queen of the Unblessed

**Register:** Fey (Unseelie dark edge)
**Pacing slot:** 12:30 (750 seconds) — mid-game pressure break before the Laird
**Folkloric source:** `SCOTTISH_RESEARCH.md:126` — *"Queen of the Scottish witches, associated with the Unseelie court and the Wild Hunt of Scottish lore. Rides a white horse, leads unquiet spirits. Appears particularly in Fife folklore."* Tagged `[WHS: NEW]`. Cross-reference: `SCOTTISH_RESEARCH_DEEP.md` Part 22.
**Cultural sensitivity check:** Nicnevin is from the Scots poetic tradition, first recorded in Alexander Montgomerie's 16th-century poem *The Flyting of Montgomerie and Polwart*. She is not Gaelic; no Gaelic consultation is required for her name. Depiction as Unseelie court queen is consistent with her literary source — she is a court queen with agency, not a generic evil witch. Do not depict her as a burning-witch stereotype. She rides, she commands, she tests.

### Encounter Beat

At 12:20, the screen gains a subtle purple pulse on the ground — *the Unseelie host is approaching*. The banter fires `boss_warn.nicnevin.a`. She arrives at the top of screen on a white horse (non-interactive, cosmetic sprite), then dismounts and the horse sprite fades. She is attended by three `unseelie_fiddler` minions that spawn simultaneously with her. They are not elite but they are persistent — they do not stop spawning from her for the fight duration (capped at 6 active). She herself has large health but slow movement; her danger is the orchestration, not her direct contact.

### Mechanics

- **HP:** 3200 base
- **Speed:** 55 (slow, deliberate — queen presence)
- **Damage:** 28 per hit
- **Scale:** 2.4
- **Behavior:** `spawner` — already exists in `EnemyBehavior` (`src/data/enemies.ts:23`). Continuously summons `unseelie_fiddler` minions from her position every 6 seconds (cadence: BALANCE configurable). The minions' `orbit` behavior creates a defensive ring around her that the player must pierce. The `spawner` behavior requires no new code — it is already implemented for at least one existing enemy.
- **Unique mechanic — Wild Hunt pull:** At 50% HP, Nicnevin triggers a 3-second proc where all XP gems on screen are pulled toward her (not collected by her — they orbit her, blocking the player from collecting them). After 3 seconds they scatter randomly. This proc repeats every 20 seconds. Implementation: a `GameScene` timed event after boss spawn watches HP threshold and dispatches the gem-pull effect via `XPSystem`.

### Palette + Visual Signature

Fey palette pushed to dark edge: dominant iridescent purple-black, cold heather at maximum saturation, no warm tones. White horse silhouette at arrival is the brightest element; Nicnevin herself is almost a shadow-form with violet rim-light. Her minions' `orbit` ring creates a spinning crown visual. BaseTint: `0x9030c0` (deep Unseelie violet). Thistle accent: `sparking, glowing` as per art bible — her entry briefly saturates every on-screen heather particle to maximum.

### Voice and Banter Scaffolding (EN)

**Warning line (`ui.bossWarning.nicnevin`):**
`"The Unblessed court rides oot — and she's brought her parliament."`

**Boss warn banter pool (`ui.banter.boss_warn.nicnevin`):**
- a: `"The fiddlers are hers. All of them."`
- b: `"White horse. No good. No good at all."`
- c: `"The queen o' the wicked fae. Dinnae bow and dinnae run."`

**Kill lines (`ui.game.boss_killed_nicnevin`):**
`"Nicnevin's court dissolved. The moor breathes again."`

**Kill banter (`ui.banter.boss_down.nicnevin`):**
- a: `"The queen fell. The crown lands in the heather."`
- b: `"Even the Unseelie host goes quiet sometimes."`
- c: `"That was the hard wan. Ye earned the quiet."`

**Boss name (`boss.nicnevin.name`):** `"Nicnevin"`

**Cailleach variant cross-hook:** Cailleach's `low_hp` banter at `src/core/i18n.ts:1121-1126` lands perfectly here. When the Cailleach variant player fights Nicnevin, the existing lines (`"Ancient bones dinnae shatter easy"`) read as a peer-to-peer tension between old-Scottish-power figures. No new banter needed — the existing pool does the work.

### Music Shift

Nicnevin's spawn pushes `biomeTimbre` to 0.9 (bright open heath = more chaotic Conductor weight). Her `spawner` behavior drives `enemyCount` up rapidly, lifting `chaos`. The Wild Hunt pull proc should fire a one-shot `enragePressure = 1.0` spike (2 seconds) coordinated with the `GameMusicState` update in `GameScene`. Kill triggers `resolutionMode` for 3 bars — the held silence from the Great Moment Recipe (`DESIGN_SOUL.md:66`).

### Drop / Progression Hook

On kill: 60 XP gems, 15% relic drop chance. Unique drop possibility: **Unseelie Fiddle** — a 45-second passive that causes nearby enemies to orbit the player (reversing the fiddler's orbit onto the enemy group, a combat-narrative echo of the boss mechanic).

---

## 5. Boss #3 — The Solway Remnant

**Register:** Grave
**Pacing slot:** 17:30 (1050 seconds) — the mid-to-late tonal pivot, between the Laird and the Hunter-General
**Folkloric / historical source:** The Killing Times (1679-88), `SCOTTISH_RESEARCH_DEEP.md:814`. Margaret Wilson, drowned in the Solway Firth at age 18 in 1685 for refusing to renounce the Covenant. `CULTURAL_SENSITIVITIES_RESEARCH.md:2.4` — *"Rare/respectful is the mode. If used: sombre Grave tone, respectful memorial framing."*
**Cultural sensitivity check:** This boss is a *revenant of the persecuted*, not a depiction of an oppressor. The boss is named "The Solway Remnant" — it refers to the geography (Solway Firth) and the historical period, not to Margaret Wilson by name. Naming the individual would create an obligation to represent her accurately; the abstraction as a collective remnant is the correct respectful distance. The encounter is memorialisation: the player's act of defeating the boss is framed as *releasing the grief*, not *conquering a villain*. The boss does not attack from malice — it attacks because it cannot stop. The kill line must honour this framing unconditionally.

No soldier imagery. No redcoat. No Claverhouse. No weaponised religion. The boss is a grief, not an argument.

### Encounter Beat

The moor darkens significantly — `biomeTimbre` drops to near-zero, the Grave palette bias activates, saturation drops 40% across the field. There is no dramatic arrival. The Remnant appears already present at mid-field: a tall, pale, translucent figure with hands pressed flat at its sides, facing away from the player. It is still for 2.5 seconds. The warning banter fires softly. Then it turns, and the fight begins. Camera shake is minimal — this is weight, not spectacle.

### Mechanics

- **HP:** 4500 base (high for the 17:30 slot — the Grave register demands endurance, not speed)
- **Speed:** 60 base (slow, inexorable — grief does not hurry)
- **Damage:** 35 per hit (high — its touch is devastating)
- **Scale:** 2.6
- **Behavior:** `chase` (no override needed) — slow, relentless, inevitable. The threat is not complexity; it is sustained presence. This is correct for the Grave register.
- **Unique mechanic — Lament Aura:** The Remnant broadcasts a 180px radius aura. Within the aura, the player's weapon cooldowns are increased by 20% and XP gem magnet radius shrinks by 30%. This is not a DoT — it is a *suppression* of the player's power. It communicates that grief slows everything down. Implementation: `GameScene` reads `isPlayerInRemnantAura()` flag set by the boss enemy's `update()` tick and applies the multipliers via `WeaponSystem.setCurseCooldownMul()` (the existing `RunModifiers` setter pattern from `CLAUDE.md` bag-vs-cached-field section). Aura ends on boss death.
- **No enrage phase** — The Remnant does not rage. At 25% HP it emits a brief visual pulse (pale shimmer, no gameplay change) and the final Grave banter line fires. The register demands dignity, not escalation.

### Palette + Visual Signature

Grave palette (`ART_STYLE_BIBLE.md:75-83`): heavily desaturated greys, bracken red accent on the edges of the aura, shadow peat. The Remnant figure is near-white with a faint `0x901818` (dried blood) trim on its hem — the only warm colour on screen. Thistle accent: drooping, subdued, per art bible. The aura radius is a near-invisible cold blue (`0x2a4a6a` at 15% alpha) — felt rather than seen.

### Voice and Banter Scaffolding (EN)

**Warning line (`ui.bossWarning.solway_remnant`):**
`"Something's oot there on the moor. Sombre. Dinnae look away."`

**Boss warn banter pool (`ui.banter.boss_warn.solway_remnant`):**
- a: `"Old grief walks the field. Tread careful."`
- b: `"The moor remembers some things too long."`
- c: `"Nae malice in it. Just… loss that couldnae find a door."`

**Kill lines (`ui.game.boss_killed_solway_remnant`):**
`"The Remnant rests. The moor lifts. Some things are done by being witnessed."`

**Kill banter (`ui.banter.boss_down.solway_remnant`):**
- a: `"Yer presence wis what it needed. Nae more, nae less."`
- b: `"Gone quiet noo. The field breathes."`
- c: `"Ye didnae conquer it. Ye released it. There's a difference."`

**Boss name (`boss.solway_remnant.name`):** `"The Solway Remnant"`

**Note on voice register:** All Solway Remnant warning lines are Edge register (clipped, sombre, no exclamation), but the kill lines lean Hearth (warm, reflective, earned rest). This shift — Edge through the fight, Hearth on resolution — mirrors the Soul Charter's `VOICE_CARD.md:164-165` trigger table exactly: boss warning → Edge; boss kill confirm → Hearth (celebration — warmth reasserts). The Grave register modulates *what* is said, not *which voice*. The warmth must still arrive on the kill.

### Music Shift

The Solway Remnant's spawn drives `biomeTimbre` to 0 (full peat-ground). `danger` rises as HP drops from the aura suppression making fights longer than expected. `triumph` is suppressed by the `danger` axis (`Conductor.ts:136`), so the melodic colour stays minor and hollow for the duration. On kill, `resolutionMode` fires for 5 bars — the longest post-boss silence in the game, honouring the Grave register's "held silence" requirement (`DESIGN_SOUL.md:66`). The Conductor's Dorian scale's natural mournfulness carries this without any new audio code.

### Drop / Progression Hook

On kill: 80 XP gems (matching the late-game slot), 18% relic drop chance. No unique drop — the Grave register does not reward cleverness or acquisition; the kill itself is the thing. Optional flavour: a one-time first-kill banter line from Gran's voice (`VOICE_CARD.md:56-61`): `"Yer grandpa spoke o' those fields. Mind the still places, hen."` This only fires once per save, and only if Gran's Croft is unlocked.

---

## 6. Implementation Map

### Files to Create

| File | Purpose |
|------|---------|
| `src/art/sprites/bosses/eachUisge.ts` | Sprite drawer for Each-uisge (horse form + rider form as separate texture keys: `boss_each_uisge` and `boss_each_uisge_rider`) |
| `src/art/sprites/bosses/nicnevin.ts` | Sprite drawer for Nicnevin |
| `src/art/sprites/bosses/solwayRemnant.ts` | Sprite drawer for Solway Remnant |

### Files to Modify

| File | Change |
|------|--------|
| `src/art/sprites/bosses/index.ts` | Add three new bake calls to `bakeBosses()` |
| `src/data/enemies.ts` | (1) Add optional `behaviorOverride?: EnemyBehavior` to `BossConfig` interface at line 620 area. (2) Push three new `BossConfig` entries to `BOSSES` array after line 688. |
| `src/systems/SpawnSystem.ts` | Line 502 area: read `boss.behaviorOverride ?? 'chase'` instead of hardcoded `'chase'` when building `bossAsConfig`. |
| `src/core/i18n.ts` | Add `bossWarning` keys, `boss.{key}.name` keys, `banter.boss_warn.{key}` pools, `banter.boss_down.{key}` pools, `game.boss_killed_{key}` strings for all three bosses. Approximately 30 new i18n leaves. |
| `src/data/enemies.test.ts` | Update `expect(BOSSES.length).toBeGreaterThanOrEqual(5)` lower bound to 8 once all three ship. |
| `src/core/BalanceConfig.ts` | Add `bossWarning` timing config entries for any configurable values (aura radius, minion spawn cadence). |

### GameScene additions (Each-uisge phase transition)

The `phase` behavior change at 60% HP and horse-to-rider texture swap require `GameScene` to watch the boss enemy's HP each tick and call `enemy.setTexture('boss_each_uisge_rider')` + `enemy.setBehavior('phase')` when the threshold is crossed. This is a `GameScene`-level extension, not a `SpawnSystem` change. Pattern: the existing `boss_enraged` toast path at `src/core/i18n.ts:914` shows how mid-fight boss state changes are handled.

---

## 7. Soul Check Pass

Per `DESIGN_SOUL.md:138-148`:

1. **Warmth** — Each boss kill has a warm resolution line. The Solway Remnant kill explicitly frames the act as compassionate release. Warmth audit passes.
2. **Clarity** — Each-uisge shapeshifts visibly with scale + texture change. Nicnevin's minion spawning is legible. Solway Remnant's aura is visible. Boss warning banners name the threat. Passes.
3. **Tone** — Each-uisge: Fey. Nicnevin: Fey (dark). Solway Remnant: Grave. All three are deliberate. Passes.
4. **Voice** — Warning lines are Edge (short, clipped). Kill lines are Hearth (warm, earned). Boss name keys route through `t()` per `CLAUDE.md` guidance on `nameKey`. Passes.
5. **Moment stack** — Each boss covers all 7 Great Moment Recipe ingredients: Pre-condition (time investment), Anticipation (banter + warning), Short peak (camera zoom pulse from existing `SpawnSystem.ts:557-563`), Multi-channel (audio + visual + input + music), Narrative reframe (each boss is a *type of Scotland*, not a fight for fighting's sake), Rest beat (post-kill resolution in `Conductor.resolutionMode`), First-time bonus (Cailleach variant cross-hook on Nicnevin; Gran whisper on Solway Remnant). Passes.
6. **Kindness** — No boss punishes the player unfairly. Each mechanic has a readable counter. Dash-lockout is telegraphed by folklore context. Passes.

**Palette check** — Each-uisge and Nicnevin: Fey palette (`ART_STYLE_BIBLE.md:65-73`). Solway Remnant: Grave palette (`ART_STYLE_BIBLE.md:75-83`). Both sourced from canonical hex values in `src/art/palettes.ts`. Passes.

**Moment check** — All three are "moments" in the DESIGN_SOUL sense. 7-ingredient recipe verified above.

---

## 8. Build Sequence

**Ship #1 — Each-uisge (proof of concept).**

Rationale: (1) Already tagged `[WHS: DEFERRED]` in `SCOTTISH_RESEARCH.md:56`, meaning it has design intent but no code — the idea is pre-validated. (2) Uses only existing `phase` behavior, so no new AI code. (3) The `behaviorOverride` field on `BossConfig` that this boss requires is a 3-line change to `SpawnSystem.ts` that also unblocks Nicnevin. (4) Fey register is tonally safe — no historical sensitivity consultation required. (5) Its 7:30 slot is the shortest gap in the run and the easiest to tune because it follows a well-understood boss (Gordon) and precedes a well-understood beat (Tour Bus at 10:00).

- [x] Add `behaviorOverride?: EnemyBehavior` to `BossConfig` in `src/data/enemies.ts:607-620`
- [x] Update `SpawnSystem.ts:502` to read `boss.behaviorOverride ?? 'chase'`
- [x] Create `src/art/sprites/bosses/eachUisge.ts` with horse and rider textures
- [x] Register in `src/art/sprites/bosses/index.ts`
- [x] Push `each_uisge` entry to `BOSSES` in `src/data/enemies.ts` after line 688
- [x] Add i18n leaves: `bossWarning.each_uisge`, `boss.each_uisge.name`, `banter.boss_warn.each_uisge.*`, `banter.boss_down.each_uisge.*`, `game.boss_killed_each_uisge`
- [x] Add `GameScene` phase-transition hook watching HP threshold for texture + behavior swap
- [x] Update `src/data/enemies.test.ts` lower bound to 6
- [x] `npm test` + `npm run build` green

**Ship #2 — Nicnevin.**

Unblocked once `behaviorOverride` lands. Uses existing `spawner` behavior and `unseelie_fiddler` enemy type. The Wild Hunt gem-pull is the only new `GameScene` logic needed.

**Ship #3 — The Solway Remnant.**

The most sensitive boss. Must pass an internal human review against `CULTURAL_SENSITIVITIES_RESEARCH.md:2.4` before merging. Aura suppression requires a `WeaponSystem.setCurseCooldownMul()` call pattern (already established in `CLAUDE.md` bag-vs-cached-field section). Gran whisper first-kill requires a `CroftTrophies`-style first-kill flag in save state.

---

## 9. Research Citations

- `docs/DESIGN_SOUL.md` — Soul charter, tonal spectrum, Great Moment Recipe, Soul Check
- `docs/ART_STYLE_BIBLE.md` — Fey palette (lines 65-73), Grave palette (lines 75-83)
- `docs/VOICE_CARD.md` — Edge/Hearth trigger table (lines 155-175), delivery notes
- `docs/research/SCOTTISH_RESEARCH.md` — Each-uisge (line 56), Unseelie Court / Nicnevin (lines 88, 126), Killing Times context
- `docs/research/SCOTTISH_RESEARCH_DEEP.md` — Killing Times / Covenanter martyrs (line 814)
- `docs/research/CULTURAL_SENSITIVITIES_RESEARCH.md` — Killing Times handling (lines 152-161), Culloden framing guidance (lines 140-150), outsider-trap test (lines 66-101)
- `docs/research/GAME_FEEL_RESEARCH.md` — §2 moment anatomy (for Great Moment Recipe verification)
