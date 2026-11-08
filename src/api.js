// The ONLY place that talks to ESPN (and WPR's WordPress REST). Functions
// fail fast (throw on non-200); the calling component renders its own
// error/empty state. Every ESPN call takes a `team` key ('mens' | 'womens')
// — the two programs share one widget and one code path, and differ only by
// ESPN league slug (see CONFIG.TEAMS).
import { CONFIG } from './config.js'

const site = (team) =>
  `https://site.api.espn.com/apis/site/v2/sports/hockey/${CONFIG.TEAMS[team].league}`
const siteV2 = (team) =>
  `https://site.api.espn.com/apis/v2/sports/hockey/${CONFIG.TEAMS[team].league}`

async function getJSON(url) {
  // 45s cap (< the 60s poll) so a hung request can't straddle the next tick
  // and resolve late with stale data over a fresher poll's.
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 45_000)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`ESPN ${res.status} — ${url}`)
    return res.json()
  } finally {
    clearTimeout(timer)
  }
}

// Short-TTL promise memoization so toggles and tab flips are instant.
const store = new Map()
function cached(key, ttlMs, fn) {
  const hit = store.get(key)
  if (hit && Date.now() - hit.at < ttlMs) return hit.promise
  const promise = fn().catch((err) => {
    store.delete(key)
    throw err
  })
  store.set(key, { at: Date.now(), promise })
  return promise
}

// ---------------------------------------------------------------- schedule

// Unlike football, hockey's team schedule needs NO seasontype param: the
// default response already carries the NCAA tournament games (verified on
// the 2025-26 season). `season` is ESPN's spring year — 2027 = 2026-27.
export function fetchSchedule(team) {
  return cached(`schedule:${team}`, 30_000, async () => {
    const data = await getJSON(
      `${site(team)}/teams/${CONFIG.TEAM_ID}/schedule?season=${CONFIG.SEASON}`,
    )
    return data.events.map(normalizeEvent).sort((a, b) => a.date - b.date)
  })
}

function normalizeEvent(event) {
  const comp = event.competitions[0]
  const us = comp.competitors.find((c) => c.team.id === CONFIG.TEAM_ID)
  const them = comp.competitors.find((c) => c.team.id !== CONFIG.TEAM_ID)
  const status = comp.status
  const rank = (c) =>
    c.curatedRank && c.curatedRank.current !== 99 ? c.curatedRank.current : null
  const usScore = us.score ? Number(us.score.value) : null
  const themScore = them.score ? Number(them.score.value) : null
  const completed = status.type.completed
  return {
    id: event.id,
    date: new Date(comp.date),
    timeValid: comp.timeValid !== false,
    // Tournament games (conference playoffs, NCAA regionals, Frozen Four)
    // carry their name here; empty for regular-season games.
    note:
      comp.notes && comp.notes.length && comp.notes[0].headline
        ? comp.notes[0].headline
        : '',
    homeAway: us.homeAway, // 'home' | 'away'
    neutralSite: Boolean(comp.neutralSite),
    venue: comp.venue
      ? {
          name: comp.venue.fullName,
          city: comp.venue.address ? comp.venue.address.city : '',
        }
      : null,
    tv: (comp.broadcasts || [])
      .map((b) => b.media && b.media.shortName)
      .filter(Boolean)
      .join(' / '),
    state: status.type.state, // 'pre' | 'in' | 'post'
    completed,
    // ESPN's status strings are Eastern — never displayed; format.js builds
    // the live line from period + clock.
    period: status.period,
    displayClock: status.displayClock,
    intermission: /INTERMISSION|END_PERIOD/.test(status.type.name),
    us: side(us, rank(us), usScore),
    them: side(them, rank(them), themScore),
    // Hockey has ties: ESPN marks neither team the winner and the scores
    // match (a shootout after a tie is NOT exposed — the game stays a tie,
    // as it does in the NCAA record). period > 3 = went to overtime.
    result: !completed
      ? null
      : us.winner === true
        ? 'W'
        : them.winner === true
          ? 'L'
          : usScore === themScore
            ? 'T'
            : usScore > themScore
              ? 'W'
              : 'L',
    overtime: completed && status.period > 3,
  }
}

function side(competitor, rank, score) {
  return {
    id: competitor.team.id,
    name: competitor.team.displayName,
    short: competitor.team.shortDisplayName,
    abbrev: competitor.team.abbreviation,
    logo: competitor.team.logos ? competitor.team.logos[0].href : null,
    score,
    rank,
  }
}

// --------------------------------------------------------------- standings

// ESPN's college-hockey standings carry OVERALL records only (W-L-T, win%)
// — no conference record, and `points` is always 0. So this returns the
// conference's teams by overall record; Wisconsin's own conference record is
// computed from its results (record.js). Membership: men's comes from the
// ESPN group that contains Wisconsin (Big Ten); women's standings are one
// flat national list with no conference groups at all, so membership is the
// WCHA id list in config.
export function fetchStandings(team) {
  return cached(`standings:${team}`, 60_000, async () => {
    const data = await getJSON(`${siteV2(team)}/standings?season=${CONFIG.SEASON}`)
    const members = CONFIG.TEAMS[team].conferenceIds
    let entries
    if (members) {
      entries = (data.standings ? data.standings.entries : []).filter((e) =>
        members.includes(e.team.id),
      )
    } else {
      const block = (data.children || []).find((c) =>
        c.standings.entries.some((e) => e.team.id === CONFIG.TEAM_ID),
      )
      entries = block ? block.standings.entries : []
    }
    return entries
      .map((entry) => {
        const byType = {}
        for (const s of entry.stats) byType[s.type] = s
        const disp = (t) => (byType[t] ? byType[t].displayValue : '')
        const num = (t) => (byType[t] ? Number(byType[t].value) : 0)
        return {
          teamId: entry.team.id,
          name: entry.team.displayName,
          short: entry.team.shortDisplayName,
          logo: entry.team.logos ? entry.team.logos[0].href : null,
          overall: disp('total'), // "W-L-T"
          winPct: num('winpercent'),
          played: num('gamesplayed'),
        }
      })
      .sort((a, b) => b.winPct - a.winPct || b.played - a.played)
  })
}

// ---------------------------------------------------------------- rankings

// The USCHO poll — returned ONLY if it belongs to CONFIG.SEASON (offseason
// ESPN serves last year's final poll, which we never show).
export function fetchPoll(team) {
  return cached(`poll:${team}`, 300_000, async () => {
    const data = await getJSON(`${site(team)}/rankings`)
    const poll = (data.rankings || []).find(
      (r) => /USCHO/.test(r.name) && r.season && r.season.year === CONFIG.SEASON,
    )
    if (!poll) throw new Error(`No ${CONFIG.SEASON} USCHO poll yet`)
    return {
      name: poll.name,
      ranks: poll.ranks.map((r) => ({
        current: r.current,
        previous: r.previous,
        teamId: r.team.id,
        name: r.team.location || r.team.nickname,
        logo: r.team.logos ? r.team.logos[0].href : null,
        record: r.recordSummary || '',
      })),
    }
  })
}

// ------------------------------------------------------------ game summary

// College-hockey summaries carry NO plays, goal log or box stats on ESPN —
// only the period-by-period line score, which is what the Last game section
// shows. Returns { us: [..], them: [..] } goals per period.
export function fetchLineScore(team, eventId) {
  return cached(`linescore:${team}:${eventId}`, 60_000, async () => {
    const data = await getJSON(`${site(team)}/summary?event=${eventId}`)
    const comp = data.header.competitions[0]
    const per = (c) => (c.linescores || []).map((l) => Number(l.displayValue))
    const us = comp.competitors.find((c) => c.team.id === CONFIG.TEAM_ID)
    const them = comp.competitors.find((c) => c.team.id !== CONFIG.TEAM_ID)
    return { us: per(us), them: per(them) }
  })
}

// ------------------------------------------------------------------ roster

const POSITIONS = [
  ['F', 'Forwards'],
  ['D', 'Defense'],
  ['G', 'Goalies'],
]

// Men's: a flat athlete list, grouped here by position. Women's: ESPN
// serves an EMPTY roster — returns [] and the section hides itself.
export function fetchRoster(team) {
  return cached(`roster:${team}`, 3_600_000, async () => {
    const data = await getJSON(`${site(team)}/teams/${CONFIG.TEAM_ID}/roster`)
    const athletes = (data.athletes || []).flatMap((a) => (a.items ? a.items : [a]))
    return POSITIONS.map(([abbr, label]) => ({
      side: label,
      players: athletes
        .filter((a) => a.position && a.position.abbreviation === abbr)
        .map((a) => ({
          id: a.id,
          name: a.displayName,
          jersey: a.jersey || '—',
          height: a.displayHeight || '',
          weight: a.displayWeight || '',
          hometown:
            a.birthPlace && a.birthPlace.city
              ? [a.birthPlace.city, a.birthPlace.state || a.birthPlace.country]
                  .filter(Boolean)
                  .join(', ')
              : '',
        }))
        .sort((a, b) => Number(a.jersey) - Number(b.jersey) || a.name.localeCompare(b.name)),
    })).filter((g) => g.players.length)
  })
}

// ------------------------------------------------------------ WPR newsroom

// WordPress serves titles/excerpts as HTML — render to plain text once, here.
function wpText(html) {
  return new DOMParser().parseFromString(html || '', 'text/html').body.textContent.trim()
}

// Live read of WPR's own CMS (WordPress REST), NOT a scraper. Hidden when
// the team's newsCategory is null.
export function fetchWprCoverage(team) {
  const categoryId = CONFIG.TEAMS[team].newsCategory
  if (!categoryId) return Promise.reject(new Error('no newsroom category'))
  const { endpoint, count } = CONFIG.WPR_NEWS
  return cached(`wpr-news:${categoryId}`, 300_000, async () => {
    const posts = await getJSON(
      `${endpoint}?categories=${categoryId}&per_page=${count}&_embed=wp:featuredmedia&_fields=id,link,title,date,excerpt,_links,_embedded`,
    )
    return posts.map((post) => {
      const media =
        post._embedded && post._embedded['wp:featuredmedia']
          ? post._embedded['wp:featuredmedia'][0]
          : null
      const sizes = media && media.media_details ? media.media_details.sizes : null
      return {
        id: post.id,
        link: post.link,
        date: new Date(post.date),
        title: wpText(post.title ? post.title.rendered : ''),
        excerpt: wpText(post.excerpt ? post.excerpt.rendered : '').replace(
          /\s*\[(?:…|\.{3})\]\s*$/,
          '…',
        ),
        image:
          sizes && sizes.medium && sizes.medium.source_url
            ? sizes.medium.source_url
            : media && media.source_url
              ? media.source_url
              : null,
        imageAlt: media && media.alt_text ? media.alt_text : '',
      }
    })
  })
}
