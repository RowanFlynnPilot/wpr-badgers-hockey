# CLAUDE.md — wpr-badgers-hockey

## What this is

A live **Wisconsin Badgers hockey tracker — men's AND women's in one widget**
— for Wausau Pilot & Review (WPR). React/Vite, deployed to GitHub Pages,
embedded on WPR via iframe. Sibling of `wpr-badgers-tracker` (football), from
which it was scaffolded in Nov 2026: same architecture, styles, masthead,
sponsor system and media kit. Kept separate from football on purpose —
different season (Oct–Apr), different data shapes, and the football tool is
finished and title-sponsored.

## Architecture

The browser fetches ESPN directly (keyless, CORS-open). **No scraper, no
cron, no committed data** — don't add one.

```
src/api.js       ← the ONLY file that talks to ESPN + WPR's WP REST. Every
                   ESPN call takes team = 'mens' | 'womens'
src/config.js    ← the ONLY place season/teams/sponsors/analytics live;
                   CONFIG.TEAMS holds per-program league slug, conference,
                   WCHA member ids, arena, newsroom category
src/record.js    ← Wisconsin's W–L–T / conference / home / road / streak,
                   computed from its own results
src/format.js    ← dates (TBA-in-Eastern rule), periods (1st/2nd/3rd/OT),
                   live and result lines
src/App.jsx      ← polls BOTH programs every 60s; ProgramToggle + 3 tabs
mini.html        ← game card: one game across both programs (?team= pins)
mini-season.html ← both programs side by side
sponsors.html    ← media kit; ?demo fills open sponsor slots
public/embed.js  ← optional host resize script (only usable on WPR if
                   Cloudflare gets an exception — see README)
```

## ESPN college-hockey data notes (verified Nov 2026)

- League slugs `mens-college-hockey` / `womens-college-hockey`; Wisconsin is
  team **275** in both. `season` is the **spring** year (2027 = 2026-27).
- Team schedule needs **no `seasontype`** (unlike football) — the default
  response already includes NCAA tournament games.
- **Ties exist**: both `winner` false, scores equal → result 'T'. Overtime
  = `status.period > 3` ("Final/OT"). Shootouts are NOT exposed — a
  shootout game stays a tie, as in the NCAA record.
- `conferenceCompetition` is absent from schedule events.
- **A `note` does NOT mean postseason.** Named regular-season events carry
  notes too — holiday tournaments ("Kwik Trip Holiday Face-Off") and the
  **Frozen Tundra Faceoff at Lambeau (Feb 2027), a CONFERENCE game for both
  programs** (men vs Michigan, women vs Ohio State). `postseason` =
  `event.seasonType.type === 3` (NCAA) OR a conference-playoff note
  ("WCHA - Semifinal", "Big Ten - Quarterfinal" — filed under seasonType 2).
  Only postseason games are excluded from the conference record.
- **Verify team ids against the standings/schedule feeds, never `/teams`:**
  the women's teams directory lists a stale Minnesota State (2364); the live
  program is **24059**. A wrong id silently drops a team from the WCHA table.
- **Standings carry OVERALL records only** (`total` = "W-L-T",
  `winpercent`); no conference record, `points` always 0. Men's standings
  have conference `children` (find the one containing 275 → Big Ten).
  **Women's standings are one flat national list with no conference
  groups**, and the core API's women's group is just "NCAA Women's Hockey" —
  so WCHA membership is `CONFIG.TEAMS.womens.conferenceIds`. Conference
  records are computed in record.js (non-`postseason` games vs members).
- Polls: `/rankings` → "USCHO Men's Poll" (20) / "USCHO Women's Poll" (15);
  api.js refuses a poll whose `season.year !== CONFIG.SEASON`.
- Summaries have **no plays, goal log or box stats** — only
  `header.competitions[0].competitors[].linescores` (goals per period).
- **Women's roster is EMPTY on ESPN** (`athletes: []`); men's is a flat list
  (F/D/G) with `experience.years` only (no class abbreviation), and it's
  PARTIAL (20 of ~28). Both Team tabs link `CONFIG.TEAMS.*.rosterUrl`
  (uwbadgers.com) for the full roster.
- Team objects carry no `color` and no `record` for hockey.

## WPR embed constraint

WPR's Cloudflare WAF blocks saving posts containing ANY `<script>` tag →
ship **bare-iframe** snippets with measured fixed heights (README). The main
tracker therefore runs as an 85vh inner-scrolling window unless the admin
adds a WAF exception.

## Engineering rules (same as every WPR repo)

One correct path, no fallbacks. Fail fast (`api.js` throws on non-200);
fail-soft *sections* render nothing on error. Surgical changes. No
overengineering. Self-host brand/sponsor art in `public/` (never hot-link
WordPress uploads — WPR's media library moved in Sept 2026).

## Each fall

Bump `SEASON` / `SEASON_LABEL`; re-check WCHA membership; re-check whether
ESPN started publishing the women's roster or conference standings.
