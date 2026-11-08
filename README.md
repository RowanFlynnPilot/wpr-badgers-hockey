# Badgers hockey, by the numbers

Live Wisconsin Badgers **men's and women's hockey** tracker for
[Wausau Pilot & Review](https://wausaupilotandreview.com): one widget with a
Men's / Women's switch — puck-drop countdown and weekend-series context,
schedule with results (W–L–T, overtime), season pulse with the conference
record, conference teams, the USCHO poll, the latest game's period-by-period
line score, and the men's roster. Sibling of `wpr-badgers-tracker`
(football) — same architecture and WPR look.

Data comes straight from ESPN's public APIs **in the reader's browser** — no
scraper, no cron, no keys, nothing stored.

## Develop

```powershell
npm install
npm run dev
```

## Deploy

Push to `main`; GitHub Actions builds and publishes to GitHub Pages
(one-time: repo **Settings → Pages → Source: GitHub Actions**). There is no
scheduled workflow, so GitHub's 60-day inactivity rule doesn't apply.

Live URLs:

- Main tracker: `https://rowanflynnpilot.github.io/wpr-badgers-hockey/`
  - `?team=mens` / `?team=womens` opens a program (default: whichever plays
    next, or is live); `?tab=Schedule` / `?tab=Team` opens a tab.
- Game card: `…/wpr-badgers-hockey/mini.html` — features ONE game across
  both programs (live → final from the last 36 hours → sooner next game).
  `?team=mens` or `?team=womens` pins it to one program.
- Season card: `…/wpr-badgers-hockey/mini-season.html` — both programs side
  by side: USCHO rank, W–L–T, conference record, next game.
- Sponsorship media kit: `…/wpr-badgers-hockey/sponsors.html` — the URL for
  the sales desk. Status reads live from `src/config.js`; append `?demo` to
  the tracker or a mini to preview open placements.

## Embed on WPR (WordPress Custom HTML block)

**WPR's Cloudflare firewall blocks saving any post that contains a
`<script>` tag** (inline *or* `src=`) — the editor shows "Updating failed.
The response is not a valid JSON response." So every snippet below is a
**bare iframe** with a fixed height, measured against the widget's real
content at 250–340px sidebar widths.

Game card (sidebar / in-article) — 280px fits every state, sponsor logo
included:

```html
<iframe title="Badgers hockey scoreboard — tap for the full tracker"
  src="https://rowanflynnpilot.github.io/wpr-badgers-hockey/mini.html"
  style="width:100%;max-width:340px;border:0;height:280px" loading="lazy"></iframe>
```

Season card (both programs):

```html
<iframe title="Badgers hockey season card — tap for the full tracker"
  src="https://rowanflynnpilot.github.io/wpr-badgers-hockey/mini-season.html"
  style="width:100%;max-width:340px;border:0;height:310px" loading="lazy"></iframe>
```

Main tracker — its height swings from ~720px (women's Team tab) to 6,000px+
(a full schedule on a phone), which no fixed height fits. Without a script it
runs as a screen-tall window that scrolls inside itself:

```html
<iframe title="Wisconsin Badgers hockey tracker"
  src="https://rowanflynnpilot.github.io/wpr-badgers-hockey/"
  style="width:100%;border:0;height:85vh;min-height:640px" loading="lazy"
  allow="clipboard-write"></iframe>
```

If WPR's site admin adds a Cloudflare exception for logged-in post saves,
the main tracker can grow to fit instead (no inner scroll) with the shared
host script — the same `embed.js` the football tracker uses; one include
resizes every Badgers tracker frame on the page:

```html
<iframe title="Wisconsin Badgers hockey tracker"
  src="https://rowanflynnpilot.github.io/wpr-badgers-hockey/"
  style="width:100%;border:0;" height="900" loading="lazy"
  allow="clipboard-write"></iframe>
<script async src="https://rowanflynnpilot.github.io/wpr-badgers-hockey/embed.js"></script>
```

Add `?to=https://…` to a mini's `src` to change where a tap lands (default:
`CANONICAL_URL` in `src/config.js` — WPR's Sports section until a hockey
page exists).

## Configure

Everything lives in `src/config.js`:

- `SEASON` is ESPN's **spring** year (2027 = the 2026–27 season); bump it
  and `SEASON_LABEL` each fall.
- `TEAMS.womens.conferenceIds` — the WCHA member list (ESPN's women's
  standings have no conference groups). Re-check after any realignment.
- `TEAMS.*.newsCategory` — WPR WordPress category id for hockey coverage.
  WPR has none yet; create one and put its id here to light up "From the
  newsroom".
- Sponsor slots (`TITLE_SPONSOR`, `SCHEDULE_SPONSOR`, `MINI_SPONSOR`) — the
  same `{ text, name, logo, href, tagline, address, disclaimer }` object the
  football tracker uses; `null` hides a slot. Self-host sponsor art in
  `public/`.
- `ANALYTICS.domain` — opt-in Plausible; events are already wired.

The share image is `public/og.png`; regenerate with
`node scripts/og-card.mjs`.

## A note on trademarks

Team names and marks are referenced from ESPN's CDN for identification; the
footer carries a non-affiliation note. Before attaching a paid sponsor,
confirm comfort level or set `USE_TEAM_LOGO: false`.
