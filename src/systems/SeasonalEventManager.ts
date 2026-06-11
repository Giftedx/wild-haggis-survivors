/**
 * E1 M1 — Seasonal events framework.
 *
 * Pure date-math activation: given a device-local Date, return which
 * seasonal events are currently active. No Phaser, no scene state, no
 * Date.now in hot paths — all logic routes through an explicit `now`
 * parameter so tests can clock-mock without monkey-patching globals.
 *
 * Event windows are MM-DD intervals. Same-year windows (Burns Night
 * 1/18 - 2/1) and year-wrap windows (Hogmanay 12/28 - 1/3) are both
 * supported. Overlaps are resolved by insertion order in `SEASONAL
 * _EVENTS`; the calendar is designed to avoid them, but if two
 * windows overlap the first-declared wins.
 *
 * Per spec `docs/superpowers/specs/2026-04-23-seasonal-events-burns-
 * night-design.md §5`: no server-time check, accepts device-local
 * time, no FOMO gates.
 */

export interface SeasonalEventDateWindow {
  /** 1-12. */
  startMonth: number;
  /** 1-31. */
  startDay: number;
  /** 1-12. */
  endMonth: number;
  /** 1-31. */
  endDay: number;
}

export interface SeasonalEventDef {
  /** Stable id used in save data + i18n keys. */
  key: string;
  /** i18n dot-path — display name for HUD / Chronicle badge. */
  nameKey: string;
  /** i18n dot-path — one-line description. */
  descriptionKey: string;
  /** Inclusive MM-DD window. */
  dateWindow: SeasonalEventDateWindow;
}

/**
 * Compare MM-DD pairs inclusively. Handles year-wrap: if the start
 * lies after the end (e.g. Dec 28 > Jan 3) the window is treated as
 * crossing the new year. Encodes MM-DD as M*100+D so ordinal compare
 * works without touching Date objects.
 */
export function isInWindow(
  today: { m: number; d: number },
  window: SeasonalEventDateWindow,
): boolean {
  const start = window.startMonth * 100 + window.startDay;
  const end = window.endMonth * 100 + window.endDay;
  const now = today.m * 100 + today.d;
  if (start <= end) {
    return now >= start && now <= end;
  }
  return now >= start || now <= end;
}

export const SEASONAL_EVENTS: Readonly<Record<string, SeasonalEventDef>> = {
  // Beltane — Gaelic fire festival marking the start of summer
  // (Apr 28 – May 4 around May 1). Bonfires, livestock driven
  // between twin fires for purification. Wild / Hearth tonal pair
  // depending on time of day; we frame it warm here.
  beltane: {
    key: 'beltane',
    nameKey: 'seasonalEvent.beltane.name',
    descriptionKey: 'seasonalEvent.beltane.description',
    dateWindow: { startMonth: 4, startDay: 28, endMonth: 5, endDay: 4 },
  },
  // Samhain — Gaelic festival marking the end of harvest / start of
  // winter. The veil between worlds thins; Cailleach ascendant.
  // Grave-tone per DESIGN_SOUL.md. Oct 28 – Nov 3 overlaps the modern
  // Halloween window and the older Gaelic reckoning.
  samhain: {
    key: 'samhain',
    nameKey: 'seasonalEvent.samhain.name',
    descriptionKey: 'seasonalEvent.samhain.description',
    dateWindow: { startMonth: 10, startDay: 28, endMonth: 11, endDay: 3 },
  },
  // St Andrew's Day — Scottish national day (Nov 30). Warm Hearth
  // tone; saltire imagery. ±3 days keeps the window forgiving
  // without stretching into the Hogmanay run-up.
  st_andrews: {
    key: 'st_andrews',
    nameKey: 'seasonalEvent.st_andrews.name',
    descriptionKey: 'seasonalEvent.st_andrews.description',
    dateWindow: { startMonth: 11, startDay: 27, endMonth: 12, endDay: 3 },
  },
  // Hogmanay — Scottish new year, traditionally bigger than Christmas.
  // First-footing, Auld Lang Syne, Stonehaven fireballs, Edinburgh
  // street party. Window straddles 31 Dec so both NYE and early-
  // January play sessions land inside the event; year-wrap is
  // handled by `isInWindow`'s ordinal compare.
  hogmanay: {
    key: 'hogmanay',
    nameKey: 'seasonalEvent.hogmanay.name',
    descriptionKey: 'seasonalEvent.hogmanay.description',
    dateWindow: { startMonth: 12, startDay: 28, endMonth: 1, endDay: 3 },
  },
  burns_night: {
    key: 'burns_night',
    nameKey: 'seasonalEvent.burns_night.name',
    descriptionKey: 'seasonalEvent.burns_night.description',
    // Burns's birthday is 25 January; ±7 days keeps the window
    // forgiving across time zones and weekend-play schedules.
    dateWindow: { startMonth: 1, startDay: 18, endMonth: 2, endDay: 1 },
  },
  // Imbolc / Brigid's Day — Gaelic first-of-spring, traditionally Feb 1.
  // Window starts the day after Burns Night closes (Feb 1 is Burns's
  // last day) so the two events stay disjoint, and runs through Feb 8
  // to give a full week — the older Gaelic reckoning treated Imbolc
  // as a season-edge several days wide, not a single date.
  imbolc: {
    key: 'imbolc',
    nameKey: 'seasonalEvent.imbolc.name',
    descriptionKey: 'seasonalEvent.imbolc.description',
    dateWindow: { startMonth: 2, startDay: 2, endMonth: 2, endDay: 8 },
  },
  // Lùnastal / Lammas — Gaelic harvest-start (Aug 1). Window Jul 29 –
  // Aug 4 mirrors the Beltane symmetry (Apr 28 – May 4 around May 1) —
  // these two cross-quarter days are the bookends of the agricultural
  // year. Sits comfortably between Beltane and the Aug 12 grouse-
  // shooting opening (`glorious_twelfth` below — the slot the older
  // comment promised).
  lammas: {
    key: 'lammas',
    nameKey: 'seasonalEvent.lammas.name',
    descriptionKey: 'seasonalEvent.lammas.description',
    dateWindow: { startMonth: 7, startDay: 29, endMonth: 8, endDay: 4 },
  },
  // Glorious Twelfth — Aug 12 opens the UK red-grouse-shooting season.
  // Window Aug 11–13 covers the named day plus a 24-hour grace either
  // side for time-zone shift. Slots cleanly between Lammas (Jul 29 –
  // Aug 4) and Bracken-turn (Nov 4 – Nov 26). Cultural framing is
  // diegetic and warm: tourists in tweed fan out, dogs in heather,
  // shotguns over the brae; the haggis answers by going to ground +
  // widening its arc. Existing tourist + haggis_hunter enemies carry
  // the comic register; banter rides the same warmth without anti-
  // hunter venom or class polemic.
  glorious_twelfth: {
    key: 'glorious_twelfth',
    nameKey: 'seasonalEvent.glorious_twelfth.name',
    descriptionKey: 'seasonalEvent.glorious_twelfth.description',
    dateWindow: { startMonth: 8, startDay: 11, endMonth: 8, endDay: 13 },
  },
  // Bannockburn anniversary — Robert the Bruce's victory over Edward II's
  // army on Jun 23–24, 1314. Window Jun 22–25 covers both medieval days
  // plus a 24-h grace either side for time-zone shift. Slots cleanly
  // between Beltane (Apr 28 – May 4) and Lammas (Jul 29 – Aug 4) — the
  // only summer-side seasonal in the cohort. Cultural framing is
  // celebratory of Scottish resilience, not anti-English; banter and
  // i18n stay focused on Bruce, the field, and Burns's "Scots, Wha Hae"
  // (1793) which the freshly-wired burns_citation `charge` sub-pool
  // already echoes from Drift Mastery's burst-edge.
  bannockburn: {
    key: 'bannockburn',
    nameKey: 'seasonalEvent.bannockburn.name',
    descriptionKey: 'seasonalEvent.bannockburn.description',
    dateWindow: { startMonth: 6, startDay: 22, endMonth: 6, endDay: 25 },
  },
  // Bracken-turn — autumn cusp (Nov 4 – Nov 26). Sits in the cohort's
  // quiet shoulder, between Samhain (Oct 28 – Nov 3) and St Andrew's
  // Day (Nov 27 – Dec 3). The moor's bracken fronds shift from green
  // through copper to bronze and the first frost edges through. 23
  // days — wider than the cross-quarter celebrations because the
  // colour shift is gradual, not a single date.
  bracken_turn: {
    key: 'bracken_turn',
    nameKey: 'seasonalEvent.bracken_turn.name',
    descriptionKey: 'seasonalEvent.bracken_turn.description',
    dateWindow: { startMonth: 11, startDay: 4, endMonth: 11, endDay: 26 },
  },
  // Simmer Dim — Shetlandic / Orcadian phrase for the perpetual
  // twilight of Scottish midsummer at high latitudes. North of 60°N
  // the sun barely sets between mid-June and early July; the night
  // never fully darkens, the gloaming holds. The phenomenon peaks
  // at the summer solstice (21 June). Window Jun 18–21 (4 days,
  // anchored on the solstice with a 3-day lead-in) — narrowed past
  // the typical 5-day single-anniversary band to dodge Bannockburn
  // (Jun 22–25), which sits the day after the solstice. Cultural
  // framing: hush, not festival. The simmer dim is a quiet
  // phenomenon — the moor doesn't go dark, the hares stay out, the
  // light waits at the horizon. Banter rides the held-light, the
  // solstice quiet, and the fey-ring caution that midsummer carries
  // across Scottish folklore. SCOTTISH_RESEARCH_DEEP §22.6
  // (solstice / simmer dim).
  simmer_dim: {
    key: 'simmer_dim',
    nameKey: 'seasonalEvent.simmer_dim.name',
    descriptionKey: 'seasonalEvent.simmer_dim.description',
    dateWindow: { startMonth: 6, startDay: 18, endMonth: 6, endDay: 21 },
  },
  // Culloden anniversary (Apr 16, 1746) — the last pitched battle on
  // British soil; the Jacobite defeat that ended the Rising. Window
  // Apr 13-18 (6 days, centred on the 16th). Tone: grave. NOT a
  // celebration — a memorial. No run-start buff; a quiet toast only.
  // Drizzle ambient (historically accurate — the day was cold and wet).
  // The Clearances of the clan system followed over the next decades.
  // Cultural framing: the haggis as moor-witness; no political stance;
  // no anti-English content; no Jacobite romanticism. Ref:
  // SCOTTISH_RESEARCH_DEEP.md §6.9 (Culloden / Jacobite Rising).
  culloden: {
    key: 'culloden',
    nameKey: 'seasonalEvent.culloden.name',
    descriptionKey: 'seasonalEvent.culloden.description',
    dateWindow: { startMonth: 4, startDay: 13, endMonth: 4, endDay: 18 },
  },
  // Tartan Day (Apr 6) — North-American diaspora's national-Scottish
  // holiday, the date of the Declaration of Arbroath signing in 1320.
  // Window Apr 4–8 (5 days) — wider than the single-anniversary
  // windows (Bannockburn 4 days, Glorious Twelfth 3 days) because the
  // diaspora spans every time zone and the celebration tends to land
  // across a weekend more often than not. Slots cleanly between
  // Imbolc (Feb 2 – Feb 8) and Beltane (Apr 28 – May 4) — months of
  // margin both ways. Cultural framing: warmth, not flag-waving;
  // Arbroath is 1320 context, no contemporary political stance, no
  // anti-English content. Banter rides the cloth, the cousins, and
  // "for freedom alone, which no honest man gives up but with life
  // itself". Bundles the two sketchpad rows DESIGN_IDEAS §12 named
  // separately (Tartan Day + Declaration of Arbroath anniversary) —
  // they share the date.
  tartan_day: {
    key: 'tartan_day',
    nameKey: 'seasonalEvent.tartan_day.name',
    descriptionKey: 'seasonalEvent.tartan_day.description',
    dateWindow: { startMonth: 4, startDay: 4, endMonth: 4, endDay: 8 },
  },
  // Up Helly Aa — Shetland fire festival cycle. The marquee Lerwick
  // event is the **last Tuesday of January** (Jan 25-31 across years),
  // but the wider Shetland season runs through February into early
  // March: Cunningsburgh, Cullivoe (Yell), Norwick (Unst), Bressay,
  // Nesting/Girlsta, Uyeasound — eleven outlying community fire
  // festivals dot the calendar. Window Feb 9-15 (7 days) honours the
  // broader Shetland season — the marquee Lerwick date sits SQUARELY
  // inside Burns Night (Jan 18 - Feb 1) in real life, and this code-
  // base resolves overlap by insertion order (Burns wins). Feb 9-15
  // sits cleanly between Imbolc (Feb 2-8) and Tartan Day (Apr 4-8) and
  // catches Cunningsburgh's mid-February event. Cultural framing:
  // torchlight + brotherhood + Norse heritage + the galley burns.
  // Hearth tone with one grave-edge bite for the longship's
  // commitment-to-flame. SCOTTISH_RESEARCH_DEEP §22.7. Sister surface
  // to the existing Peerie Shetlander variant, whose Up Helly Aa
  // passive was descoped to voice-only at variant ship time —
  // this seasonal is the first true Up Helly Aa surface.
  up_helly_aa: {
    key: 'up_helly_aa',
    nameKey: 'seasonalEvent.up_helly_aa.name',
    descriptionKey: 'seasonalEvent.up_helly_aa.description',
    dateWindow: { startMonth: 2, startDay: 9, endMonth: 2, endDay: 15 },
  },
  // Highland Games season — covers the Cowal Highland Gathering (last
  // weekend of August, world's largest Highland Games) and the Braemar
  // Gathering (first Saturday of September, Royal Family in attendance
  // since 1848). Window Aug 25 – Sep 7 (14 days) brackets both events
  // while sitting cleanly between Glorious Twelfth (Aug 11–13) and the
  // Bracken-turn (Nov 4–26). Cultural framing: strength + skill +
  // competition. Caber toss, hammer throw, stone put, sheaf toss,
  // Highland dancing, pipe-band competitions. The haggis spectates from
  // behind a thistle tussock, very quietly not volunteering. Hearth
  // tone — athletic warmth without national-chest-thumping.
  // SCOTTISH_RESEARCH_DEEP §22.3 (Braemar + Tailteann roots).
  highland_games: {
    key: 'highland_games',
    nameKey: 'seasonalEvent.highland_games.name',
    descriptionKey: 'seasonalEvent.highland_games.description',
    dateWindow: { startMonth: 8, startDay: 25, endMonth: 9, endDay: 7 },
  },
};

function monthDay(now: Date): { m: number; d: number } {
  return { m: now.getMonth() + 1, d: now.getDate() };
}

/** True when the named event's window contains `now` (device-local). */
export function isSeasonalEventActive(eventKey: string, now: Date): boolean {
  const event = SEASONAL_EVENTS[eventKey];
  if (!event) return false;
  return isInWindow(monthDay(now), event.dateWindow);
}

/**
 * Keys of every event whose window currently contains `now`. The order
 * matches `SEASONAL_EVENTS` insertion (which is Object.keys-stable for
 * string keys in modern V8/SpiderMonkey — spec-compliant since ES2015).
 *
 * `disabled` (wired from `SettingsManager.disableSeasonalEvents` at call
 * sites) short-circuits to `[]` — players who opt out never see the
 * seasonal badge, ceremony, or variant gate regardless of real date.
 */
export function activeSeasonalEvents(now: Date, disabled: boolean = false): string[] {
  if (disabled) return [];
  const today = monthDay(now);
  return Object.keys(SEASONAL_EVENTS).filter((k) =>
    isInWindow(today, SEASONAL_EVENTS[k].dateWindow),
  );
}

/**
 * First active event's key, or `null` when none is active. The Chronicle
 * stamp uses this — one run belongs to one event even if windows ever
 * overlapped in the future. `disabled` respects the opt-out setting the
 * same way `activeSeasonalEvents` does.
 */
export function getActiveSeasonalEventKey(now: Date, disabled: boolean = false): string | null {
  const keys = activeSeasonalEvents(now, disabled);
  return keys.length > 0 ? keys[0] : null;
}
