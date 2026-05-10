# A1 M5 — manual playtest followups

> **STATUS:** Open. Created 2026-04-24 at M5 ship.
>
> M5 shipped the `reduceFlashing` toggle, the `HaarFog`/`JuiceSystem`
> compliance path, and the first-launch photosensitivity warning splash
> behind automated unit + e2e coverage. These followups require a human
> with a seizure-tool in the loop — vitest can't judge them.

## F1 — PEAT re-audit with reduceFlashing:ON

The plan's original M5 ship gate was: *"Re-run PEAT audit with
`reduceFlashing: true`. Confirm stricter bar passes."*

**Why deferred:** PEAT (Photosensitive Epilepsy Analysis Tool) needs a
screen capture + a Windows PEAT install. Not something automated CI
can touch. M5 shipped behind:

- JuiceSystem flash-compliance unit tests (alpha cap ≤ 0.4, duration
  floor ≥ 200ms when `reduceFlashing` is on).
- Haar fog a11y unit tests (density cap at MIN_CAP + MAX_RAMP_STRETCH
  under `reduceFlashing`, regardless of motionScale).
- E2e verifying the first-launch splash + persistence.

Those guarantee the compliance *knobs* work. They don't guarantee a
PEAT pass — PEAT measures the emitted pixels, not the intent.

**Do:**
1. Enable `reduceFlashing` via Settings → Accessibility → "Reduce flashing".
2. Capture a 5-minute high-density combat session via OBS (AoE weapon,
   act 2 peak spawn, multiple elites, evolution pickup, boss kill spectacle
   if the run reaches Gordon at 5:00).
3. Feed capture through PEAT. Record findings in
   `docs/ACCESSIBILITY_PEAT_AUDIT.md` (file does not yet exist — scaffold
   it per M1 Task 1 when running the audit).
4. If any flash category still trips the PEAT threshold with the toggle
   on, the corresponding flash emitter (likely `JuiceSystem.bossKillSpectacle`
   or `comboMilestoneBurst`) needs a further desaturate/cap beyond the
   shared `scaledFlashAlpha` path. File against M1 Task 3 / Task 4.

## F2 — Copy review with a disability consultant

M5's splash copy is written to the Soul Charter's Hearth register
(warm, direct, non-clinical). That's an *aesthetic* choice; a
consultant-review pass on the photosensitivity framing is the right
next gate before the splash reaches production-scale player volume.

Current copy:
- EN: "This game has flashing lights, rapid motion, and bright colour.
  If ye or someone near ye has had photosensitive seizures, turn on
  Reduce Flashing in Settings before ye play — it caps flashes and
  slows motion. Ye can change it any time."
- SCS: parallel, register-matched Scots overlay.

**Do:** Send both locales to a disability-consultant (or the
Accessibility reviewer listed in `docs/DESIGN_SOUL.md` if one is
identified for future A1 milestones). Adjust per feedback; keep the
dismiss button simple.

## F3 — Mobile screen-reader smoke

The splash is Phaser-canvas-rendered, so text is not in the DOM.
Screen-reader users on iOS / Android won't hear the warning through
VoiceOver / TalkBack. M5's e2e covers a sighted player's path
(keyboard Escape dismissal, mouse/touch click); the screen-reader
posture is a gap.

A1 M6 (Assist Mode) specs out a `captionBus` + DOM-visible caption
overlays. Once that infrastructure lands, a one-line follow-up bolts
the photosensitivity splash onto the caption bus so a SR-reader
delivery works without forking a DOM-overlay layer just for the
splash.

**Do:** defer to A1 M6; track here so the dependency is visible.

## F4 — Live-run feel check under reduceFlashing

Unit tests prove the alpha cap + duration floor apply. They don't
prove the resulting combat reads as satisfying. A 10-minute live run
with `reduceFlashing` on would catch cases where the floor turned a
punchy flash into a mushy ramp — worth a tweak of either the base
alpha (still lands a hit when capped) or the duration floor.

**Do:** one sighted-but-not-photosensitive playtester with the toggle
on for 10 minutes. Ask: *do kills still land? does the boss kill
spectacle still feel like a spectacle? does damage flash still read as
damage?*. Flag any flashes that feel "mushy" for per-emitter base-alpha
tuning.
