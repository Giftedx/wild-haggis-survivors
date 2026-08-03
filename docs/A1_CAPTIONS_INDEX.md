# A1 M4 — Caption catalogue

> **Status:** Living catalogue of every captioned event in WHS, plus
> the audio events that do NOT yet caption (gap list). Captions render
> through `CaptionManager` (`src/systems/a11y/CaptionManager.ts`) and
> are fed by every system that owns a player-facing audio cue.
>
> Toggle: Settings → Accessibility → "Captions". Size: caption text
> scale slider (0.8 – 1.4). Style: Hearth voice register per
> `docs/VOICE_CARD.md`.

## Architecture summary

- **Pure model:** `CaptionManager` (no Phaser dep) handles the queue,
  dedupe (800ms window per `id`), and timer.
- **Renderer:** `CaptionOverlay` (`src/systems/a11y/CaptionOverlay.ts`)
  renders the active list to the scene with `captionTextScale` from
  settings.
- **Formatter:** `CaptionFormatter` (`src/systems/a11y/CaptionFormatter.ts`)
  decorates events: `[bracketed sfx]`, `♪ music note`, `Speaker: text`.
- **Emit surface:** `GameScene.caption(id, message, tint, durationMs)`
  is the single public API; subsystems receive a `caption` hook in
  their `Hooks` interface (PlayerHitResolver, LevelUpFlow,
  MoorMomentScheduler, RunLifecycle, GameTickers, wireSceneEventBus,
  BanterSystem, etc.).

## Currently captioned events

Every entry below has a verified `caption(...)` emit in the source.

| ID | Trigger | Source path | Tint | i18n key |
|----|---------|-------------|------|----------|
| `low_hp` | HP drops below threshold | `src/scenes/game/GameTickers.ts:188` | DANGER_RED | `captions.low_hp` |
| `level_up` | Player levels up | `src/scenes/game/wireXpSystemListeners.ts:54` | `#ffdd66` | `captions.level_up` |
| `echo_ready` | Echo card available post-cap | `src/scenes/game/wireXpSystemListeners.ts:61` | `#c8a8e8` | `captions.echo_ready` |
| `evo_<weaponKey>` | Evolution becomes available in level-up pool | `src/scenes/game/LevelUpFlow.ts:223` | `#ffcc44` | dynamic msg |
| `victory` | Run victory (final boss kill) | `src/scenes/game/RunLifecycle.ts:216` | `#ffe08a` | `captions.victory_chorus` |
| `death` | Player death | `src/scenes/game/RunLifecycle.ts:437` | `#cc8866` | `captions.death_fall` |
| `achievement` | Achievement unlock | `src/scenes/game/wireSceneEventBus.ts:41` | TOAST_GOLD | `ui.game.achievement_unlock` |
| `boss_enrage` | Boss low-HP enrage | `src/scenes/game/wireSceneEventBus.ts:47` | DANGER_RED | `captions.boss_enrage` |
| `moor_<momentId>` | Moor moment fires | `src/scenes/game/MoorMomentScheduler.ts:114` | `#c9a86c` | per-moment captionKey |
| `standing_stones_warn` | Standing stones rising warning | `src/scenes/game/runtimeTickHooks.ts:120` | `#ffe080` | `ui.standingStones.warn_caption` |
| `standing_stones_announce` | Stones risen and ready | `src/scenes/game/moorMoments.ts:198` | `#ffe080` | `ui.standingStones.announce_caption` |
| `standing_stones_pick` | Boon picked from stones | `src/scenes/game/moorMoments.ts:191` | `#ffe080` | dynamic boon desc |
| `moor_mercy` | Moor mercy luck triggers | `src/scenes/game/moorMoments.ts:116` | `#c8a8e8` | `ui.game.moor_mercy_luck_caption` |
| `ancestral_echo_announce` | Echo entity spawns | `src/scenes/game/moorMoments.ts:167` | `#b0d4ff` | `ui.ancestralEcho.announce_caption` |
| `ancestral_echo_touch` | Player touches echo entity | `src/scenes/game/moorMoments.ts:149` | `#b0d4ff` | `ui.ancestralEcho.touch_caption` |
| `reliquary_pick` | Player picks a relic from reliquary | `src/scenes/game/moorMoments.ts:219` | `#ffb060` | `ui.reliquary.grant_caption` |
| `act_intermission_open` | Moor Road act intermission scene opens | `src/scenes/game/actIntermissionLauncher.ts:171` | TOAST_GOLD | `captions.act_intermission_open` |

## Gap list — events NOT yet captioned

These are gameplay-meaningful audio events that currently do NOT emit
captions. Each is a candidate for a follow-up emit. Voice-Card check
required for every new caption string (Hearth register, plain).

| Audio event | Audio method | Why caption matters | Suggested id | Suggested copy (Hearth voice) |
|-------------|--------------|---------------------|--------------|--------------------------------|
| Boss warning (pre-spawn) | `audio.playBossWarning()` | Boss is the highest-stakes event in a run; deaf players need lead time | `boss_warning` | `[Boss approaching — pibroch swells.]` |
| Boss arrival (fanfare) | `audio.playBossArrival()` | Confirms the boss has spawned | `boss_arrival` | `[Boss arrives — fanfare hits.]` |
| Hazard appearance (lava / slick) | None currently — silent spawn | Player needs warning before stepping in | `hazard_lava` / `hazard_slick` | `[Lava bloom underfoot.]` / `[Slick patch glistens.]` |
| Chest spawn | None | Lets players know loot is available without an audio cue | `chest_spawn` | `[A chest settles into the heather.]` |
| Weapon pickup chime | `audio.playLevelUp()` overlap | Differentiates weapon pickup from level-up | `weapon_pickup` | `[Weapon: <name> obtained.]` |
| XP collect chain (vacuum pulse) | `audio.playXPCollect()` (gated) | The audio is gated; chain bursts read as silence — caption on burst trigger | (skip — too frequent) | n/a; intentionally silent |
| Pibroch pre-boss music swell | musicEngine layer transition | Diegetic music cue; deaf players miss boss tension build | `music_pibroch_swell` | `♪ Pibroch swells — pressure rises.` |
| Bodhrán low-HP music layer | musicEngine layer transition | Adds urgency; need parity with `low_hp` heartbeat caption | `music_bodhran` | `♪ Bodhrán enters — heartbeat thrums.` |
| Fiddle combo-100 music layer | musicEngine layer transition | Celebration cue | `music_fiddle` | `♪ Fiddle joins the dance.` |
| Burns Night pipes layer | musicEngine layer transition | Seasonal flavour — captions reinforce | `music_burns_pipes` | `♪ Burns pipes weave through.` |
| Croft hearth ambient (start menu) | Ambient audio | Atmospheric; not gameplay-critical | (skip) | n/a |
| Wind / sea / bird ambient | Ambient audio | Atmospheric; not gameplay-critical | (skip) | n/a |
| Ceilidh pulse (combat ambient) | `audio.playCeilidhPulse()` | Periodic moor-tension bump | `music_ceilidh_pulse` | `♪ Ceilidh pulse rolls.` |
| Stone grant accent | `audio.playStoneGrant()` | Already paired with `standing_stones_pick` caption | (already covered) | n/a |
| Burn leap | `audio.playBurnLeap()` | Player-driven; visual is sufficient | (skip) | n/a |
| Hogmanay bells stinger | `audio.playHogmanayBellsStinger()` | Seasonal celebration | `seasonal_hogmanay_bells` | `[Hogmanay bells ring midnight.]` |
| Burns piper accent | `audio.playBurnsPiperAccent()` | Seasonal accent | `seasonal_burns_piper` | `[Burns piper cuts the air.]` |
| Card-reveal chime | `audio.playCardReveal(idx)` | Level-up modal; visual is sufficient as the modal IS the cue | (skip) | n/a |
| Legendary card select | `audio.playLegendarySelect()` | Already covered by `evo_<weapon>` caption pre-pick | (already covered) | n/a |
| Boon select | `audio.playBoonSelect()` | Stone boon — covered by `standing_stones_pick` | (already covered) | n/a |
| Purchase (shop) | `audio.playPurchase()` | Shop scene has visible feedback | `shop_purchase` | `[Purchase confirmed.]` |
| Click (UI) | `audio.playClick()` | UI noise; do not caption | (skip) | n/a |
| Elite affix spawn | `audio.playEliteAffixSpawn(affix)` | Elite + affix is a gameplay-critical multi-property cue | `elite_affix_<affix>` | `[Elite enters — <affix> aura.]` |
| Elite chain (kill streak) | `audio.playEliteChain(count)` | Audio celebration of streak | `elite_chain` | `[Elite chain — <count> in a row.]` |
| Player hit (damage taken) | `audio.playPlayerHit()` | Already paired with `low_hp` and HP-bar drop | (skip — would spam) | n/a |
| Hit / kill (per-shot) | `audio.playHit()` / `audio.playKill()` | Far too frequent to caption per-event | (skip) | n/a |
| Volatile-elite death pulse | `audio.playEliteVolatileDeathImmediate()` | Distinct from regular kill | `elite_volatile_death` | `[Volatile elite ruptures.]` |

## Banter captions

Banter lines (Gran, Burns, Cailleach, Doric, Hebridean, Shetlandic
variants) all flow through BanterSystem which has a `caption?` hook
in its Hooks interface. Speech captions format as `Speaker: text` per
`CaptionFormatter.formatCaption({ type: 'speech', speaker, text })`.
Banter lines respect the `banterFrequency` setting independently of
the `captionsEnabled` toggle (so a player can have captions on but
banter low).

## Music cue captioning (M4 stretch)

The Conductor (`src/systems/music/Conductor.ts`) reads game-state mood
axes and triggers layer transitions. It does NOT currently emit
captions. Wiring a `caption?` hook on the Conductor and emitting on
each `layerEnter` / `layerExit` would close the music-cue gap above
in a single change. Estimated 30-line patch; deferred to a focused
follow-up to keep this milestone scoped.

## Voice register

Per `docs/VOICE_CARD.md`:

- **Hearth captions** (default): warm, plain, no clinical jargon. Avoid
  "indicator triggered"; use "heartbeat thrums" / "pibroch swells".
- **Edge captions** (boss enrage, death): cleaner, more direct;
  permission to be sharper. "Boss enrages." / "Hooves down."
- **Brackets are mandatory** for non-speech SFX captions. The square
  bracket signals "this is a sound, not a line of dialogue."
- **Music note ♪** prefix mandatory for music-cue captions.
- **Speaker: text** form mandatory for speech captions.

## Tests

- `src/systems/a11y/CaptionManager.test.ts` — queue + dedupe + timer.
- `src/systems/a11y/CaptionFormatter.test.ts` — formatting per type.
- `src/systems/a11y/captionOverlayLayout.test.ts` — render layout.

E2E coverage:
- `e2e/comfort-smoke.spec.ts` — captions enabled smoke verifies a
  caption appears within first run minute.

## Cross-references

- `docs/research/ACCESSIBILITY_RESEARCH.md` §4 — caption playbook.
- `docs/VOICE_CARD.md` — voice register for caption copy.
- `src/systems/a11y/CaptionManager.ts` — queue model.
- `src/systems/a11y/CaptionFormatter.ts` — format rules.
