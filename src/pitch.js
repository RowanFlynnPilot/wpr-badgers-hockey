// The sales pitch numbers, shared by the hosted media kit (sponsors.html)
// and the printable one-pager (one-pager.html) so the two can never
// disagree. Everything is computed from the live ESPN feeds.
import { CONFIG } from './config.js'
import { fetchSchedule, fetchPoll } from './api.js'
import { records, fmt } from './record.js'

export const PROGRAMS = Object.keys(CONFIG.TEAMS)

export const INVENTORY = [
  {
    key: 'title',
    name: 'Title sponsorship — the flagship',
    short: 'Title sponsorship',
    desc: "Your logo and line on the cardinal banner above every tab of BOTH programs — men's and women's — on every visit, phones included (the slot wraps, it never hides). One buy, two full seasons.",
    print: "Your logo on the banner above every tab of both programs, every visit, phones included. One buy, two full seasons.",
    sold: () => !!CONFIG.TITLE_SPONSOR,
    demo: './?demo',
  },
  {
    key: 'schedule',
    name: 'Schedule presenting band',
    short: 'Schedule presenting band',
    desc: "A branded band under the full men's and women's schedules — the tab fans check all week for puck-drop times, streams and results.",
    print: "A branded band under both full schedules — the tab fans check all week for times, streams and results.",
    sold: () => !!CONFIG.SCHEDULE_SPONSOR,
    demo: './?demo&tab=Schedule',
  },
  {
    key: 'minis',
    name: 'Scoreboard + season cards',
    short: 'Scoreboard + season cards',
    desc: "“Presented by” on both compact cards — the live scoreboard that follows whichever Badgers team plays next, and the men's + women's season card — wherever they run in Wausau Pilot & Review sidebars and articles.",
    print: "“Presented by” on the live scoreboard and season cards that run in WPR sidebars and articles.",
    sold: () => !!CONFIG.MINI_SPONSOR,
    demo: './mini.html?demo',
  },
]

// { mens: { schedule, poll }, womens: {...} } — calls `onUpdate` as each
// piece lands so pages render progressively.
export function loadPitchData(onUpdate) {
  PROGRAMS.forEach((team) => {
    const set = (field) => (v) => onUpdate((d) => ({ ...d, [team]: { ...d[team], [field]: v } }))
    fetchSchedule(team).then(set('schedule')).catch(() => {})
    fetchPoll(team).then(set('poll')).catch(() => {})
  })
}

export function pitchNumbers(data) {
  const loaded = PROGRAMS.every((t) => data[t] && data[t].schedule)
  const all = loaded ? PROGRAMS.flatMap((t) => data[t].schedule) : []
  const left = all.filter((g) => g.state !== 'post')
  const homeLeft = left.filter((g) => g.homeAway === 'home' && !g.neutralSite).length
  const programs = PROGRAMS.map((team) => {
    const d = data[team]
    if (!d || !d.schedule) return null
    const rec = records(d.schedule, null)
    const rank = d.poll ? (d.poll.ranks.find((r) => r.teamId === CONFIG.TEAM_ID) || {}).current : null
    return { team, label: CONFIG.TEAMS[team].label, record: fmt(rec.overall), rank }
  }).filter(Boolean)
  return { loaded, total: all.length, left: left.length, homeLeft, programs }
}

// Upcoming games worth attaching a brand to: named events (the Frozen
// Tundra Faceoff at Lambeau, holiday tournaments), rivalry games, ranked
// opponents. Named events always make the list; the soonest others fill it.
export function marquee(data, limit = 6) {
  const games = PROGRAMS.flatMap((team) =>
    ((data[team] && data[team].schedule) || [])
      .filter((g) => g.state !== 'post')
      .map((g) => ({ team, g })),
  )
  const reason = ({ g }) =>
    (g.note && !g.postseason && g.note) ||
    CONFIG.RIVALRIES[g.them.id] ||
    (g.them.rank && `vs No. ${g.them.rank}`) ||
    null
  // A weekend series is one moment: of two games vs the same opponent
  // within 2.5 days keep ONE — the named game if either is named (both
  // Lambeau games are game 2 of a series), else the first.
  const sameSeries = (a, b) =>
    a.team === b.team &&
    a.g.them.id === b.g.them.id &&
    Math.abs(a.g.date - b.g.date) < 2.5 * 86_400_000
  const all = games
    .map((x) => ({ ...x, why: reason(x), named: Boolean(x.g.note && !x.g.postseason) }))
    .sort((a, b) => a.g.date - b.g.date)
  const candidates = all
    .filter((x) => x.why)
    .filter((x) => {
      const partner = all.find((p) => p !== x && sameSeries(p, x))
      if (!partner) return true
      if (x.named !== partner.named) return x.named
      return x.g.date < partner.g.date
    })
  const named = candidates.filter((x) => x.named)
  const rest = candidates.filter((x) => !x.named).slice(0, Math.max(0, limit - named.length))
  return [...named, ...rest].sort((a, b) => a.g.date - b.g.date)
}
