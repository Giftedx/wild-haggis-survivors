# Next Session Prompt: Onboarding, Achievement Celebration & Final Bug Fixes

Copy everything below the line into a fresh Claude Code session in this project directory.

---

## Context

Read `CLAUDE.md` and `docs/DESIGN_SOUL.md` first. The game has been through five hardening sessions:

1. **Soul charter polish** (commit 32f7255) — i18n migration, design principles
2. **Visual art soul review** (commit 3c3cabc) — 15 visual polish items across 4 tiers
3. **Late-game performance & balance** (commit 8efacf1) — eliminated 31 `getChildren()` array copies/frame, rebalanced Claymore/bosses/Highland Cow
4. **Particle budget & lifecycle** (commit 182ad66) — pooled all VFX in JuiceSystem + WeaponSystem
5. **Correctness & lifecycle fixes** (commit 8253376) — 12 bug fixes across combat, settings, cleanup paths

Build is green. **174/174 tests pass.** All 7 Phase 6 visual bugs are fixed. Performance is hardened for 300+ enemies at 55+ FPS. The game looks good, runs smooth, and plays fair.

**What's missing now isn't engineering — it's player experience.** The game's core identity mechanic (The Drift) is never explained. Achievements are tracked silently. Two minor code bugs remain unfixed. The passive item system has a DRY violation across 3 files. These are the last rough edges before the game feels truly complete.

## The Problem (Three Faces)

### Face 1: The Drift Is Unexplained — Core Identity Lost on New Players

The Drift is the game's most distinctive mechanic — a constant 5-degree clockwise rotation bias on movement input, simulating the haggis's uneven legs. It's the emotional center of the "haggis fantasy." But:

- **No tutorial explains it.** A new player's first experience is "why is my character moving wrong?" — confusion, not delight.
- **No visual indicator shows the drift.** The player can't see the rotation being applied.
- **The `TutorialSystem` exists** (`src/systems/TutorialSystem.ts`) but only shows generic tips ("WASD to move", "collect XP gems"). It never mentions drift.

The soul charter says: **"Kindness in friction — visual language explains, never confuses."** The drift IS friction. Without explanation, it violates the first design principle.

**What to build:**

A gentle, non-intrusive first-run drift tutorial that fires in the first 10 seconds of a new player's first run:

1. A brief toast or overlay message: something like *"Your wee haggis drifts clockwise — crooked legs! Lean into it."* (warm, characterful, not clinical)
2. A subtle curved arrow indicator near the player sprite for 5-8 seconds showing the drift direction
3. Gated behind a `hasSeenDriftTutorial` flag in the save data (so it only shows once, ever)
4. Dismissable by moving (not by clicking a button — the player learns by doing)

Check `src/systems/TutorialSystem.ts` for how existing tutorials work, `src/utils/save.ts` for save schema, and `src/entities/Player.ts` for where drift is applied.

### Face 2: Achievements Are Earned Silently — No Celebration

The `AchievementManager` (`src/systems/AchievementManager.ts`) tracks 15+ achievements and gates variant unlocks behind them. But when an achievement is earned:

- **No in-game notification fires.** The player doesn't know they unlocked anything.
- **No sound plays.**
- **The unlock only becomes visible when the player returns to the menu** and checks variants.

The soul charter says: **"Pride in mastery — improvements reward learning visually, not just numerically."** Achievement unlocks are the purest form of mastery recognition, and they're silent.

**What to build:**

A celebratory achievement toast that fires when any achievement is earned during gameplay:

1. Read `AchievementManager` to understand how `unlock()` works and when it's called
2. Hook into the unlock event to trigger a `JuiceSystem` toast (the toast system already exists — see `juice.showToast()`)
3. The toast should show the achievement name with a distinctive style (gold border? trophy icon? different from normal toasts)
4. Play a short, satisfying SFX via `AudioSystem` — a bright chime or fanfare distinct from other sounds
5. If the achievement unlocks a variant, add a second line: *"New variant unlocked!"*
6. Don't interrupt gameplay — no pause, no overlay, just a toast that the player notices

Check how `JuiceSystem.showToast()` works, what parameters it takes, and whether it needs enhancement to support styled/special toasts.

### Face 3: Two Code Bugs + One DRY Violation

#### C3: SpawnSystem reads settings on every boss spawn (LOW)
- `src/systems/SpawnSystem.ts` line ~258: `showBossWarning()` calls `getSettingsManager().load()` every time a boss warning displays
- Impact: 5 calls per run — negligible, but the pattern is wrong
- Fix: Cache the settings value in the constructor or at run start; only re-read on a settings-changed event

#### C4: `lucky_start` permanent upgrade may push duplicate passive (LOW)
- `src/scenes/GameScene.ts` lines ~1080-1083: picks a random passive and pushes it to `ownedPassives` without checking for duplicates
- Impact: Rare edge case when player has other starting passives + lucky_start perk
- Fix: Check `this.ownedPassives.includes(randomPassive)` before pushing; if duplicate, re-roll or skip

#### DRY: Passive item keys hardcoded in 3 places
- `src/scenes/GameScene.ts` — `lucky_start` uses a hardcoded 6-passive array
- `src/data/upgrades.ts` — passive definitions
- `src/i18n/` — passive abbreviations
- Fix: Extract a canonical `PASSIVE_KEYS` constant from the upgrades data and import it where needed. The data file should be the single source of truth.

## Your Mission

Make the game explainable, celebratory, and clean.

### Phase 1: Drift Tutorial (Do First — Highest Player Impact)

1. Read `src/systems/TutorialSystem.ts` to understand the existing tutorial pattern
2. Read `src/utils/save.ts` to understand save schema and how to add a `hasSeenDriftTutorial` flag
3. Read `src/entities/Player.ts` to find where drift is applied to movement
4. Implement the drift tutorial:
   - Add `hasSeenDriftTutorial: boolean` to the save schema (default `false`, migrate existing saves)
   - In TutorialSystem (or as a new first-run hook in GameScene), trigger a drift tutorial in the first 10 seconds of the player's first-ever run
   - Show a warm, characterful message via toast or lightweight overlay — not a wall of text
   - Optionally draw a temporary curved arrow near the player sprite showing clockwise rotation
   - Set the flag after the tutorial is shown so it never repeats
   - Dismiss automatically after 5-8 seconds or when the player moves a threshold distance
5. The tutorial should feel like the game whispering a hint, not lecturing the player

### Phase 2: Achievement Celebration

1. Read `src/systems/AchievementManager.ts` — understand the unlock flow
2. Read `src/systems/JuiceSystem.ts` — understand `showToast()` capabilities
3. Read `src/systems/AudioSystem.ts` — understand how to add a new SFX
4. Hook achievement unlocks to a celebratory toast:
   - When `AchievementManager.unlock()` fires, emit an event or call a callback
   - GameScene catches it and calls `juice.showToast()` with the achievement name
   - Style the toast distinctively (gold tint, or prefixed with a trophy character like "Achievement: {name}")
   - Play a celebratory SFX — a bright ascending chime (synthesized, like other audio)
   - If a variant is unlocked, append a second toast or line: "New variant unlocked!"
5. Test by triggering an achievement condition during gameplay

### Phase 3: Bug Fixes & DRY Cleanup

1. **C3**: Cache settings in SpawnSystem constructor; remove per-boss `getSettingsManager().load()` call
2. **C4**: Add duplicate check in lucky_start passive selection
3. **DRY**: Extract `PASSIVE_KEYS` from upgrade definitions and import it in GameScene's lucky_start handler. The i18n abbreviation keys should also derive from the same source if practical.

### Phase 4: Verification

1. `npm run build` — type-check passes
2. `npm test` — 174/174 tests pass (or more if you add tests for new features)
3. `npm run dev` — play a full run and verify:
   - Drift tutorial appears on first run, doesn't appear on second run
   - Achievement toast fires when earning an achievement (trigger one manually if needed)
   - Achievement toast is visually distinct from normal toasts
   - Lucky_start doesn't grant duplicate passives
   - No console errors from SpawnSystem settings access
4. Clear localStorage and verify first-run experience is smooth

## Files You'll Touch

| File | Changes |
|------|---------|
| `src/systems/TutorialSystem.ts` | Drift tutorial logic (first-run gated) |
| `src/utils/save.ts` | Add `hasSeenDriftTutorial` to save schema + migration |
| `src/systems/AchievementManager.ts` | Emit event or callback on unlock |
| `src/systems/JuiceSystem.ts` | Possibly enhance `showToast()` for styled/achievement toasts |
| `src/systems/AudioSystem.ts` | Add achievement chime SFX |
| `src/scenes/GameScene.ts` | Wire achievement toast; fix lucky_start duplicate; connect drift tutorial |
| `src/systems/SpawnSystem.ts` | Cache settings in constructor |
| `src/data/upgrades.ts` | Export canonical passive key list (DRY) |

## The Standard

The drift tutorial should make a new player smile and think "oh, that's charming" — not "oh, another tutorial popup." The achievement toast should make a veteran player feel seen — a moment of recognition for what they've accomplished. The bug fixes should be invisible — the player never knew they were there, and now they never will.

The soul charter's north star: **warm, handcrafted, playful, brave.** These changes are small in code but large in feeling. They're the difference between a game that works and a game that cares.
