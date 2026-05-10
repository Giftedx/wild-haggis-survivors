# Prompt #1 — A1 Accessibility Foundation Completion (M1–M4)

## Goal

Close the four remaining ship-blocker milestones of the A1 initiative so Wild Haggis Survivors meets the accessibility bar set by `docs/research/ACCESSIBILITY_RESEARCH.md` §8.3 Tier 1 and the WCAG 2.2 SC 2.3.1 (photosensitivity) requirement. M5 (reduceFlashing toggle + photosensitivity warning splash) and M6 (Curse/GameOver focus nav per T306) already shipped 2026-04-24. M1–M4 are the rest.

## Why this is #1

A1 is called out in `docs/HUGE_INITIATIVES_MASTER_PLAN.md` and `docs/PRD.md` as a public-ship blocker. WCAG SC 2.3.1 (no flashing >3 Hz) is non-negotiable for any web release. Six coordinated subsystems (audit + colour + remapping + captions + Assist + photosensitivity) touch every player-visible surface. Multiple human gates (PEAT tool run, disability consultant review, colorblind simulator audit). Estimated 5–6 person-weeks. Cannot ship public 1.0 without it.

## Source documents (read in this order)

1. `docs/superpowers/specs/2026-04-23-accessibility-foundation-design.md` — design spec (six sub-items).
2. `docs/superpowers/plans/2026-04-23-accessibility-foundation.md` — execution plan with milestone breakdown.
3. `docs/superpowers/plans/2026-04-24-a1-m5-manual-playtest-followups.md` — M5 follow-ups + open human gates.
4. `docs/research/ACCESSIBILITY_RESEARCH.md` — accessibility playbook; §8.3 has the WHS-specific gap audit.
5. `docs/DESIGN_SOUL.md` — a11y matrix at the bottom (north-star wording for player-facing copy).
6. `docs/ART_STYLE_BIBLE.md` — five tonal palettes (Hearth/Wild/Fey/Grave/Wild Comedy) that need colorblind validation.

## Scope by milestone

### M1 — PEAT photosensitivity audit
Run the [Photosensitive Epilepsy Analysis Tool (Trace Center)](https://trace.umd.edu/peat/) against video captures of:
- `JuiceSystem` kill bursts and damage numbers
- Crit-confirm flash + screen shake combo
- Boss death spectacle (`src/systems/JuiceSystem.ts` `bossDeathSpectacle`)
- Combo milestone toasts
- Haar shader transitions (F1 shipped 2026-04-24)
- Evolution chest pickup ceremony
- Level-up flash on `LevelUpFlow`

Capture 30 s clips at 60 fps, run PEAT, log any reading >3 flashes/s OR red-flash threshold. For each fail, file a sub-task: lower amplitude OR honour `Settings.reduceFlashing` to gate to a calm variant. M5 already added the toggle infrastructure — M1 is content audit + gates.

**Deliverable:** `docs/A1_PEAT_AUDIT.md` with one row per moment, PASS/FAIL, fix landed, retest pass.

### M2 — Colorblind palette audit + non-colour-alone visual cues
Two parts:
1. **Palette audit.** Render the five `ART_STYLE_BIBLE.md` palettes through Coblis or Color Oracle simulating Protan, Deutan, Tritan, Achroma. Audit:
   - Player vs enemy silhouettes (red enemies vs green player vs gold elites)
   - XP gem (cyan), gold pickup (yellow), HP heart (red)
   - Curse chip colour vs HUD chrome
   - Minimap dot colours (player green, elite gold, boss diamond)
   - Damage-number colour coding
   - Five biome palettes against each other and against the player

   For each fail, propose a secondary visual cue (shape, outline weight, icon glyph, motion) so meaning isn't carried by colour alone. Reference: WCAG 1.4.1.

2. **Non-colour-alone audit (systematic).** Walk every UI surface and HUD element. For each colour-coded signal, document the secondary cue. Fix gaps. The Haar shader / colorblind layer uses SVG `feColorMatrix` (per memory) — not a Phaser shader — so changes go in `src/systems/a11y/` not the shader registry.

**Deliverable:** `docs/A1_COLORBLIND_AUDIT.md` (palette matrix) + `docs/A1_NON_COLOUR_ALONE.md` (signal census). Code changes follow.

### M3 — Full keyboard + gamepad remapping UX
Audit reveals: settings persist some bindings but the remap UI is partial (per `2026-04-23-accessibility-foundation-design.md` §M3). Build a complete remap surface:
- Every game action (move 4-axis, attack-aim, pause, dash if any, inventory, accept, cancel, open menu, debug toggles in DEV) must be re-bindable.
- Conflict detection (no two actions share a binding).
- Reset-to-defaults button.
- Separate keyboard tab and gamepad tab.
- Save into the existing settings schema; bump save version if shape changes.
- Surface keyboard hints in HUD (already partial).

Existing infra to extend: `src/utils/GamepadMenuNav.ts`, `src/scenes/SettingsScene*` (find via grep), `src/core/InputManager` (similar). Cross-reference triple-audit T202 (gamepad E2E) — landing this needs new Playwright spec + synthetic gamepad. Use `e2e/gamepad-*.spec.ts` patterns.

**Deliverable:** Remap UI + persistent settings + Playwright spec covering rebind round-trip + chromium/firefox/webkit matrix.

### M4 — Caption scope expansion + Assist Mode wiring
Two parts:
1. **Captions.** `CaptionManager` + `CaptionOverlayLayout` already exist (`src/systems/a11y/CaptionManager.ts`). Audit which SFX + music cues currently emit captions vs which don't. Target list: every gameplay-meaningful audio event (boss warning, evolution chime, level-up, low-HP heartbeat onset, weapon pickup chimes, environmental cues, music phase shifts). For each missing one, route through CaptionManager. Style: respect Voice Card register (Hearth default, Edge for failures).
2. **Assist Mode wiring.** Per triple-audit T122, Assist Mode UI is currently HIDDEN because `src/core/AssistMode.ts` (or wherever the toggles persist) has zero call sites in `Player`, `GameScene`, `TimeManager`, or the damage pipeline. Decide one of:
   - **Wire it in.** Add readers in: damage pipeline (invincibility), TimeManager (game-speed slider), level-up timer (extended timing), weapon cooldowns (auto-pace). Keep each toggle independently functional.
   - **Keep hidden longer.** Ship M4 captions only; defer Assist UI un-hide to M4.5 with a separate plan.

   Memory says T122 = hide. If wiring is in scope here, this is the moment to flip it. Either way, document the call-site map.

**Deliverable:** Caption catalogue (`docs/A1_CAPTIONS_INDEX.md`), Assist call-site list, code changes.

## Sub-tasks / suggested execution order

1. PEAT audit (M1) — lowest variance, can start anywhere, no code prerequisite. ~3 days.
2. Colorblind palette audit (M2 part 1) — desk research + simulator, can run in parallel with M1. ~2 days.
3. Remap UI (M3) — biggest code chunk; build behind a feature flag, test-drive against existing scenes. ~5 days.
4. Non-colour-alone fixes (M2 part 2) — drops out of M2 audit; bundle with M3 since both touch HUD. ~3 days.
5. Captions audit + Assist decision (M4) — mostly content + small surgical wiring. ~3 days.
6. Manual playtest pass with disability consultant — gate, not work. ~1 day off-clock.

Total: ~17 working days plus human-gate cycles.

## Acceptance criteria

- All five A1 audit docs land in `docs/`.
- WCAG 2.2 SC 2.3.1 cleared on all moments (PEAT pass).
- Five palettes pass Protan/Deutan/Tritan/Achroma simulator with documented secondary cues.
- Every game action keyboard- and gamepad-rebindable; conflict detection + reset works; Playwright spec green on chromium/firefox/webkit.
- Caption catalogue covers every gameplay-meaningful audio cue; CaptionManager test in `src/systems/a11y/CaptionManager.test.ts` extended.
- Assist Mode either fully wired (with at least invincibility, game-speed, level-up timing) OR explicitly hidden with code comment + plan reference.
- `npm run ci:all` green.
- Disability consultant sign-off captured in `docs/A1_CONSULTANT_REVIEW.md`.

## Anti-patterns to avoid

- **Don't gate non-flashing UI through `reduceFlashing`** — that toggle is for high-frequency flashes; static high-contrast UI should not vary.
- **Don't add Phaser shader for colorblind** — memory: A1 colorblind uses SVG `feColorMatrix` overlay, not a Phaser PostFX. The shader registry (ADR-0003) is unrelated.
- **Don't bind keyboard listeners on `window`** — use `scene.input.keyboard.on` + shutdown cleanup. `UpgradeCardsUI` was found doing this in triple-audit T302 — match `ActIntermissionScene` pattern.
- **Don't persist Assist toggles silently** — if hidden, Settings should not show them. Currently it persists 7 unused toggles (Opus audit MF3); resolve.

## Verification path

```
npm run lint
npm run build           # tsc + vite, must pass
npm test                # vitest
npm run test:e2e        # playwright incl. new gamepad + remap specs
```

Plus manual:
- PEAT report with 0 fails
- Coblis screenshots for each palette × CVD type
- Disability consultant Loom video recording acceptance

## Related work in flight on the branch

`src/scenes/croftProgressiveDisclosure.ts` (T213 FTUE) and `src/scenes/lazyProductionScenes.ts` (T310 bundle) are landing now and unrelated to A1. Don't rebase on top of them; let them merge first, then start A1 from `main`.

## CLAUDE.md gotchas relevant here

- Scene reuse means `create()` resets transient state; remap UI must clear listeners on shutdown.
- Phaser ScenePlugin vs SceneManager — settings scene navigation must use `this.scene.launch` / `stop`.
- Overlay input blocking: any new full-screen a11y modal must `.setInteractive()` so the mobile virtual joystick doesn't activate through it.

## Soul checks

- Voice Card: a11y copy lives in Hearth register (warm, plain, never patronising). Photosensitivity warning already in Hearth — match it.
- Soul Check 6 questions on every player-facing string.
- Cite `ACCESSIBILITY_RESEARCH.md §8.3` in PR.

Done means: any player on any input + visual + cognitive profile can complete a full run. No-one excluded.
