# Blocked on humans — A1 Accessibility foundation

> Charter: `docs/top-10-tasks/01-a1-accessibility-foundation.md`
>
> This iteration shipped:
> - Audit doc scaffolds (PEAT / colorblind / non-colour-alone) populated
>   with code-side cataloguing.
> - Captions catalogue (`docs/A1_CAPTIONS_INDEX.md`) + Assist Mode
>   call-site map (`docs/A1_ASSIST_MODE_CALLSITES.md`).
> - Assist Mode invincibility wired into `PlayerHitResolver` and
>   `HazardZones` (master-gated; UI stays hidden until M4.5).
>
> The remaining work needs human eyes / human tooling. None can be
> automated.

---

## Block 1 — PEAT photosensitivity tool runs (M1)

**Tool:** [Photosensitive Epilepsy Analysis Tool (Trace Center)](https://trace.umd.edu/peat/) — free for non-commercial. Windows only.

**Required artifacts to produce:**

For each row in `docs/A1_PEAT_AUDIT.md`'s "Per-VFX targets" table:

1. Set up a fresh dev session (`npm run dev`) on a Windows box with
   the PEAT desktop tool installed.
2. Capture a 30s OBS clip at 60fps, 1280×720 game viewport, of the
   scenario described in the row.
3. Run capture twice: once with `reduceFlashing: false` (default),
   once with `reduceFlashing: true`.
4. Feed each clip through PEAT.
5. Record the General-flash, Red-flash, and Spatial-pattern reading
   in the matrix. PASS or FAIL per row, per toggle state.
6. For any FAIL: file a sub-task that reduces the offending emitter
   (lower base alpha, lengthen duration, desaturate red component, or
   gate the entire emitter behind `reduceFlashing`).

**Acceptance:** every row in the matrix has a populated PEAT result
column. Every row passes WCAG 2.2 SC 2.3.1 with `reduceFlashing: true`;
any failure under `reduceFlashing: false` ships with a fix landed +
re-run PEAT result.

**Note:** the M5 follow-up plan (`docs/superpowers/plans/2026-04-24-a1-m5-manual-playtest-followups.md`)
already named this F1 task. It remains the primary block here.

---

## Block 2 — Coblis / Color Oracle palette walk (M2)

**Tool:**
- [Coblis](https://www.color-blindness.com/coblis-color-blindness-simulator/) — web, upload PNG.
- [Color Oracle](https://colororacle.org/) — desktop overlay, live application.

**Required artifacts to produce:**

For each cell in the matrix in `docs/A1_COLORBLIND_AUDIT.md`:

1. Capture an in-game screenshot of the palette in question (Hearth
   in Gran's croft, Wild on plateau, Fey at standing stones, Grave at
   Glencoe biome, Wild Comedy in Glasgow Close).
2. Run each image through Coblis for protanopia, deuteranopia,
   tritanopia, and achromatopsia simulations.
3. Record PASS / FAIL per hue pair listed in the table.
4. For any FAIL: confirm whether the existing non-colour cue
   (catalogued in `docs/A1_NON_COLOUR_ALONE.md`) is sufficient. If
   not, file a follow-up to add a shape / outline / motion cue.
5. Specifically verify the four "mitigations to verify on PEAT-walk"
   listed at the end of `A1_COLORBLIND_AUDIT.md`:
   - Bracken red on Grave palette.
   - Reliquary diamond vs boss diamond on minimap.
   - Curse chip mauve under achroma.
   - Lava hazard pulse amplitude under protan / achroma.

**Acceptance:** every cell in the matrix is populated. Documented
mitigations cover every FAIL; code follow-ups filed for any
mitigations that need new shape / icon / motion cues.

---

## Block 3 — Disability consultant sign-off

**Reviewer:** External accessibility consultant (e.g. AbleGamers,
SpecialEffect) or named WHS reviewer if identified.

**Required artifact to produce:**

`docs/A1_CONSULTANT_REVIEW.md` capturing:

1. Reviewer name + organisation + date of review.
2. Loom (or equivalent) recording of the consultant playing through
   the first run with `reduceFlashing: on`, `colorblindMode:
   deuteranopia` (most-common CVD), and `captionsEnabled: on`.
3. Written sign-off on:
   - Photosensitivity copy on the splash (currently in Hearth voice;
     M5 followup F2 deferred this).
   - Caption density (too much / too little / right).
   - Caption voice register (matches Hearth / Edge per Voice Card).
   - Remap UX (rebind flow, conflict messaging, reset).
   - Settings discoverability.
4. Any **must-fix** items list.

**Acceptance:** consultant sign-off captured; must-fix items either
landed before public ship or scheduled with named owner.

---

## Block 4 — Live feel-check playtest under reduceFlashing (M5 F4 carry-forward)

Already deferred from M5 (`2026-04-24-a1-m5-manual-playtest-followups.md`
F4). Track here so the dependency stays visible:

A sighted-but-not-photosensitive playtester runs 10 minutes with
`reduceFlashing: on`. Logs whether kill flashes still feel like
kill flashes after the alpha cap; flags any that feel "mushy" for
per-emitter base-alpha tuning.

**Acceptance:** report logged to
`docs/A1_REDUCED_FLASHING_FEEL_REPORT.md` with per-emitter notes; any
emitter flagged as "lost the punch" gets a base-alpha bump while
staying under the photosensitive bar.

---

## Block 5 — Mobile screen-reader smoke (M5 F3 carry-forward)

Already deferred from M5. Captions infrastructure is canvas-based and
not in the DOM, so VoiceOver / TalkBack don't read them.

**Required:** wire a DOM-overlay path for the photosensitivity warning
splash AND first-launch caption announcements. Path forward: bolt
onto the CaptionManager once the M4.5 unhide of Assist Mode lands
(both share the DOM-overlay infrastructure need).

**Acceptance:** screen-reader user on iOS or Android can hear the
photosensitivity warning. Verified manually with VoiceOver / TalkBack.

---

## How to dispatch

These five blocks are independent. They can be claimed by different
humans in any order:

- Block 1 — Windows-machine + PEAT installer access.
- Block 2 — any modern browser; Color Oracle download.
- Block 3 — external relationship (paid consultant or named reviewer).
- Block 4 — anyone willing to play 10 minutes; ideally someone
  unfamiliar with the visual change (so their feel calibration is
  fresh).
- Block 5 — iOS or Android device + VoiceOver / TalkBack toggled.

Once all five are unblocked, the A1 Accessibility Foundation is
publicly shippable per the charter's acceptance criteria.

## Next iteration scope (when blocks unblock)

- Land per-emitter PEAT failure fixes from Block 1.
- Land non-colour-alone fixes flagged by Block 2.
- Land consultant must-fix items from Block 3.
- Land base-alpha tuning from Block 4.
- Land DOM-overlay screen-reader path from Block 5.
- Then: `feat(a11y): A1 — accessibility foundation public-ship gate`.
