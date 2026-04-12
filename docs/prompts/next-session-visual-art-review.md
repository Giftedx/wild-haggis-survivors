# Next Session Prompt: Deep Visual & Art Soul Review

Copy everything below the line into a fresh Claude Code session in this project directory.

---

## The Soul

Read `docs/DESIGN_SOUL.md` before anything else. Internalize it. Everything in this review is measured against it.

The game must feel **handcrafted, warm, playful, and brave** in every player-facing moment. The **haggis fantasy** — scrappy drift, stubborn survival, cheeky Scottish flavor — is the emotional center. Failure is compassionate, never shaming. Progression feels celebratory and human, not transactional. No surface ships with placeholder-feeling art.

Five design principles guide every visual decision:
1. **Kindness in friction** — visual language explains, never confuses
2. **Joy in motion** — movement and combat feedback feel alive and characterful
3. **Pride in mastery** — improvements reward learning visually, not just numerically
4. **Cozy between storms** — non-combat spaces emotionally decompress the player
5. **Craft coherence** — colors, shapes, sizes, and effects feel like one authored world

## The Project

**Wild Haggis Survivors** — a Vampire Survivors-style browser game, Phaser 3 + TypeScript. **All art is procedurally generated in code** — there are no external image assets. Every sprite, projectile, particle, and visual flourish is drawn programmatically using Phaser Graphics API in `src/scenes/BootScene.ts`, stored as texture keys, and used throughout the codebase.

Read `CLAUDE.md` for technical conventions (Phaser gotchas, rendering notes, pixel art mode, system architecture).

The project just completed a full 114-file code review (commit 6935e86), 174/174 tests passing, deployed to Cloudflare Pages. The code is clean. This session is about whether the **visuals** are worthy of the soul.

## Your Mission

Do a **deep, loving, line-by-line review of every visual element in the project** — not as a QA tester checking boxes, but as a craftsperson asking: does this pixel serve the haggis fantasy? Does this color warm the player? Does this animation make someone smile? Does this effect make combat feel alive and brave?

The procedural art IS the art. There's no artist to defer to — the code must carry every ounce of visual intention. If something looks like it was drawn in 30 seconds by a programmer who needed a rectangle, redesign it until it feels like someone cared.

## Files to Review (read every line, don't skim)

### The Art Factory (start here — spend serious time)
- **`src/scenes/BootScene.ts`** — Every texture in the game is born here. Every `generateTexture`, every `fillStyle`, every pixel of every sprite. This is the foundation. Ask for each sprite: does the haggis look scrappy and lovable? Do enemies read as Scottish-flavored threats? Do weapons feel characterful? Are proportions right at gameplay zoom? Are outlines crisp and consistent? Does the palette breathe warmth?

### The Haggis Fantasy (weave matrix: run start + combat)
- **`src/entities/Player.ts`** — The haggis IS the game. Does it feel scrappy, stubborn, alive? Growth scaling, drift visual, damage flash, death — every state should reinforce the fantasy.
- **`src/entities/Enemy.ts`** — Tourists, chefs, terriers, highland cows, eagles — do they feel like a cheeky Scottish bestiary? Do elites feel like genuine threats (golden glow, bigger, bolder)? Do bosses feel imposing and memorable? Freeze tint, berserker rage, HP bars, death effects — all should serve readability AND character.
- **`src/entities/Projectile.ts`** — Thistles, bagpipe blasts, cabers, scotch mist — do weapon projectiles feel flavorful and readable, or like colored circles?
- **`src/entities/XPGem.ts`** — "Whisky drops" — do they feel like treasure? Does the glow aura on high-value gems feel magical? Does collection feel satisfying?

### Joy in Motion (weave matrix: combat feedback)
- **`src/systems/JuiceSystem.ts`** — The soul of combat feel. Screen shake, kill bursts, damage numbers, particle trails, hit freeze, boss death spectacle, combo counter, toasts, danger vignette. Every effect should make combat feel alive, never clinical. Ask: does a 50-kill streak FEEL different from kill #3? Does low HP feel dangerous without being punishing? Does a boss death feel spectacular?
- **`src/systems/GrowthSystem.ts`** — The haggis visually growing as it levels. Does it feel like progress, like the wee beastie is getting braver?
- **`src/systems/WeaponSystem.ts`** — Weapon-specific visual effects. Each of the 8 weapons should have a distinct visual personality. Arc sweeps should feel powerful. Trails should feel graceful. AoE pulses should feel impactful.
- **`src/systems/SpawnSystem.ts`** — Boss warning banner (centered, dramatic?), spawn flashes, elite golden flash at spawn.

### Cozy Between Storms (weave matrix: meta & menus)
- **`src/scenes/MainMenuScene.ts`** — Parallax mountains, heather scatter, mist, campfire, sleeping haggis. Does it feel like a warm hearth inviting the player back? Is it cozy without being busy?
- **`src/scenes/MenuScene.ts`** — Loadout screen, variant cards. Does choosing a variant feel like picking your adventure, not filling a form?
- **`src/scenes/SettingsScene.ts`** — Ember glow, heather strip, slider widgets. Does the options screen feel like part of the same warm world?
- **`src/scenes/ShopScene.ts`** — Gold shop. Does spending currency feel like investing in your haggis's future, not like a spreadsheet?
- **`src/scenes/MetaShopScene.ts`** — Meta shop. Same warmth question.

### Compassionate Failure (weave matrix: failure & recovery)
- **`src/scenes/GameOverScene.ts`** — Result panel, stats, weapon damage breakdown. Does defeat feel informative and hopeful ("here's what you learned, here's why you'll do better") or clinical and cold? Does victory feel celebratory?

### Level-Up Excitement (weave matrix: level-up & evolution)
- **`src/ui/UpgradeCards.ts`** — Card layout, rarity borders/glow, legendary sparkle. Does picking a card feel exciting? Do legendary evolutions feel truly special? Does rarity read at a glance through color and effect, not just a label?

### Readability & Accessibility (weave matrix: accessibility as kindness)
- **`src/ui/HUD.ts`** — HP bar, XP bar, weapon slots, dash indicator, combo counter, boss HP bar. Can the player read their state in a glance during chaos? Does everything honor `uiScale` and `highContrastUi`?
- **`src/ui/Minimap.ts`** — Corner radar. Does the player triangle, enemy dots, boss diamonds, warning edge create a useful spatial picture without being distracting?
- **`src/ui/EdgeIndicators.ts`** — Off-screen threat arrows. Do they guide without alarming?
- **`src/ui/cameraViewport.ts`** — Zoom-aware UI positioning. Does everything stay in bounds at all zoom levels?

### The Palette
- **`src/config.ts`** — COLORS object. Is the palette coherent? Does every named color serve the highland mood? Are there any clinical or cold outliers?

## What to Feel For

Don't just check — **feel**. For each file, sit with these questions:

1. **Would I show this to someone I respect?** — Not "is it bug-free" but "am I proud of how this looks?"
2. **Does this serve the haggis fantasy?** — Scottish highland warmth, not generic game-dev defaults.
3. **Does color tell a story?** — Gold = elite, red = danger, green = health. Is this language consistent everywhere, or do meanings drift between files?
4. **Does motion have personality?** — Are tweens eased (not linear)? Do durations feel right (not too fast to notice, not so slow they drag)? Do things that should breathe/pulse actually do so?
5. **Can I read the screen during chaos?** — 200 enemies, 10 projectiles, particles flying — does the visual hierarchy hold or does everything compete?
6. **Does accessibility feel like kindness, not an afterthought?** — Does `highContrastUi` make things warm-bright, or cold-clinical? Does `uiScale` actually reach every text element? Does `reduceParticles` remove decoration without removing soul?
7. **Are there any dead pixels?** — Textures generated but never used? Colors defined but unreachable? Tweens that fire on invisible objects?
8. **Are there missing moments?** — A state that should have a visual indicator but doesn't? A transition that should fade but snaps? A celebration that should sparkle but just... happens?

## How to Work

1. Read `docs/DESIGN_SOUL.md` and `CLAUDE.md` — internalize, don't skim
2. Start with `src/scenes/BootScene.ts` — the art foundation. This file deserves more time than any other.
3. Move through entities → systems → UI → scenes → config
4. For each file, produce findings with: file:line, severity, observation, **which soul principle it violates or serves**, suggested fix
5. After reading ALL files, produce a **prioritized master report** with tiers:
   - **Tier A**: Breaks the visual identity or actively harms readability — the soul winces
   - **Tier B**: Noticeable polish gaps a careful player would spot — craft coherence holes
   - **Tier C**: Craft improvements that raise the ceiling — from good to delightful
   - **Tier D**: Experimental ideas worth exploring — brave new visual moments
6. **Present the report and wait for approval before touching any code**
7. When approved, fix methodically — one item at a time, test after each, commit in logical chunks, browser-verify visual changes with screenshots

## The Standard

Every pixel intentional. Every color serving the highland mood. Every animation handcrafted. Every effect making the player feel something. The haggis fantasy alive in every frame.

**Total and complete love touching everything.**
