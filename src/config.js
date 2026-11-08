// Single source of truth. Change teams/season/sponsors HERE and nowhere else.

export const CONFIG = {
  // ESPN's college-hockey season is keyed by its SPRING year:
  // 2027 = the 2026-27 season. SEASON_LABEL is what readers see.
  SEASON: 2027,
  SEASON_LABEL: '2026–27',

  TEAM_ID: '275', // Wisconsin Badgers — the same ESPN id in both leagues
  TEAM_SHORT: 'Wisconsin',

  // The two programs, one widget. `conferenceIds`: ESPN's women's
  // standings are one flat national list with NO conference groups, so WCHA
  // membership is listed here (verified against ESPN team ids Nov 2026; WCHA
  // realignment is rare — re-check each summer). Men's membership comes from
  // ESPN's own Big Ten group, so it's null here.
  // `newsCategory`: WPR WordPress category id for this team's coverage;
  // null hides "From the newsroom" (WPR has no hockey category yet — create
  // one in WordPress and put its id here to light the section up).
  TEAMS: {
    mens: {
      label: "Men's",
      league: 'mens-college-hockey',
      conference: 'Big Ten',
      conferenceIds: null,
      arena: 'Kohl Center',
      newsCategory: null,
    },
    womens: {
      label: "Women's",
      league: 'womens-college-hockey',
      conference: 'WCHA',
      conferenceIds: ['132', '134', '135', '2364', '194', '2594', '2900', '275'],
      // Bemidji St, Minnesota Duluth, Minnesota, Minnesota St, Ohio St,
      // St. Cloud St, St. Thomas, Wisconsin
      arena: 'LaBahn Arena',
      newsCategory: null,
    },
  },

  // Display the ESPN-hosted team mark in the banner. A team mark on a
  // sponsored surface can imply endorsement — confirm with WPR/UW before
  // going paid, or flip to false for a colors-only header.
  USE_TEAM_LOGO: true,
  TEAM_LOGO: 'https://a.espncdn.com/i/teamlogos/ncaa/500/275.png',

  // Puck-drop times shown in the newsroom's timezone.
  TIMEZONE: 'America/Chicago',
  TIMEZONE_LABEL: 'CT',

  // Border Battle: Minnesota is the rival in BOTH programs (same ESPN id).
  RIVALRIES: {
    135: 'Border Battle', // Minnesota
  },

  // WPR brand set — SELF-HOSTED from public/ (WPR's media library moved to
  // cdn.wausaupilotandreview.com in Sept 2026 and old wp-content URLs 404;
  // never hot-link WordPress uploads).
  WPR_BADGE: `${import.meta.env.BASE_URL}wpr-typewriter-badge.png`,
  WPR_LOGO: `${import.meta.env.BASE_URL}wpr-wordmark.png`,
  WPR_URL: 'https://wausaupilotandreview.com',
  // WPR's tagline, verbatim across every tool — don't rewrite it.
  WPR_TAGLINE: 'Where Locals Look First For News',

  // Where copy-link and the mini card send readers. No dedicated hockey page
  // exists on WPR yet — land on the Sports section until one does.
  CANONICAL_URL: 'https://wausaupilotandreview.com/category/sports/',

  // Sponsorship slots. null hides a slot. Each slot is an object:
  //   { text (required), name, logo (self-hosted in public/), href,
  //     tagline ('offer — place'), address, disclaimer }
  // — the same shape the football tracker uses (see Sponsor.jsx). All open
  // at launch: the media kit (sponsors.html) sells them.
  TITLE_SPONSOR: null, // banner lockup, visible on both programs/every tab
  SCHEDULE_SPONSOR: null, // band under the Schedule tab's slate
  MINI_SPONSOR: null, // "Presented by" credit on both mini cards

  // Where sponsorship inquiries land (the WPR sales desk — Chris).
  SPONSOR_INQUIRY: 'weber.chris@wausaupilotandreview.com',

  WPR_NEWS: {
    endpoint: 'https://wausaupilotandreview.com/wp-json/wp/v2/posts',
    count: 4,
  },

  // Plausible (opt-in, cookieless). null = no external script loads at all.
  ANALYTICS: {
    domain: null,
    src: 'https://plausible.io/js/script.js',
  },
}

// SALES DEMO MODE — append ?demo to any page (tracker or minis) and every
// OPEN sponsor slot renders a placeholder lockup, so a prospect can see the
// placement in situ. Sold slots are never overridden; plain URLs never show
// placeholders. The media kit (sponsors.html) links here.
if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo')) {
  const demo = { text: 'Presented by Your Business Here', demo: true }
  CONFIG.TITLE_SPONSOR = CONFIG.TITLE_SPONSOR || demo
  CONFIG.SCHEDULE_SPONSOR = CONFIG.SCHEDULE_SPONSOR || demo
  CONFIG.MINI_SPONSOR = CONFIG.MINI_SPONSOR || demo
}
