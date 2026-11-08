import React, { useEffect, useState } from 'react'
import { CONFIG } from '../config.js'
import { fetchSchedule, fetchPoll } from '../api.js'
import { useInquiry } from '../useInquiry.js'
import { gameDate, vsAt } from '../format.js'
import { records, fmt } from '../record.js'
import Masthead from './Masthead.jsx'

// The hosted media kit (sponsors.html) — the one URL WPR sales sends.
// Everything a buyer reads is LIVE: rankings, records, games left and the
// marquee dates come from the same ESPN feeds as the tracker, and each
// placement's Open/Sold status reads config.js — so this page never goes
// stale the way a deck does. ?demo links show each placement in situ.

const PROGRAMS = Object.keys(CONFIG.TEAMS)
const subjectLine = (what) => `Badgers hockey tracker sponsorship — ${what}`
const mailto = (subject) =>
  `mailto:${CONFIG.SPONSOR_INQUIRY}?subject=${encodeURIComponent(subject)}`

const INVENTORY = [
  {
    key: 'title',
    name: 'Title sponsorship — the flagship',
    desc: "Your logo and line on the cardinal banner above every tab of BOTH programs — men's and women's — on every visit, phones included (the slot wraps, it never hides). One buy, two full seasons.",
    sold: () => !!CONFIG.TITLE_SPONSOR,
    demo: './?demo',
  },
  {
    key: 'schedule',
    name: 'Schedule presenting band',
    desc: "A branded band under the full men's and women's schedules — the tab fans check all week for puck-drop times, streams and results.",
    sold: () => !!CONFIG.SCHEDULE_SPONSOR,
    demo: './?demo&tab=Schedule',
  },
  {
    key: 'minis',
    name: 'Scoreboard + season cards',
    desc: "“Presented by” on both compact cards — the live scoreboard that follows whichever Badgers team plays next, and the men's + women's season card — wherever they run in Wausau Pilot & Review sidebars and articles.",
    sold: () => !!CONFIG.MINI_SPONSOR,
    demo: './mini.html?demo',
  },
]

function Cta({ subject, slot, label, big }) {
  const { onClick, copied } = useInquiry(slot)
  return (
    <span className="sp-ctawrap">
      <a className={`sp-cta${big ? ' sp-cta--big' : ''}`} href={mailto(subject)} onClick={onClick}>
        {label}
      </a>
      {copied && (
        <span className="sp-copied">✓ {CONFIG.SPONSOR_INQUIRY} copied — paste it into any email</span>
      )}
    </span>
  )
}

// Upcoming games worth attaching a brand to: named events (the Frozen
// Tundra Faceoff at Lambeau, holiday tournaments), rivalry games, ranked
// opponents. Computed, so they roll forward as the season does.
function marquee(data) {
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
  // within 2.5 days, keep ONE — the named game if either is named (both
  // Lambeau games are game 2 of a series: Kohl/LaBahn Friday, Lambeau
  // Saturday), else the first.
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
  // Named events (Lambeau, the holiday tournament) always make the list —
  // they're the headline moments — then the soonest rivalry/ranked games
  // fill it out. Shown in date order.
  const named = candidates.filter((x) => x.named)
  const rest = candidates.filter((x) => !x.named).slice(0, Math.max(0, 6 - named.length))
  return [...named, ...rest].sort((a, b) => a.g.date - b.g.date)
}

export default function SponsorsPage() {
  const [data, setData] = useState({})

  useEffect(() => {
    PROGRAMS.forEach((team) => {
      const set = (field) => (v) => setData((d) => ({ ...d, [team]: { ...d[team], [field]: v } }))
      fetchSchedule(team).then(set('schedule')).catch(() => {})
      fetchPoll(team).then(set('poll')).catch(() => {})
    })
  }, [])

  // The embedded cards autosize like they do on WPR (source-checked).
  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin !== window.location.origin) return
      if (!e.data || e.data.type !== 'wpr-badgers-height' || !(e.data.height > 0)) return
      for (const id of ['sp-demo-mini', 'sp-demo-season']) {
        const frame = document.getElementById(id)
        if (frame && e.source === frame.contentWindow) frame.style.height = `${e.data.height}px`
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const loaded = PROGRAMS.every((t) => data[t] && data[t].schedule)
  const all = loaded ? PROGRAMS.flatMap((t) => data[t].schedule) : []
  const left = all.filter((g) => g.state !== 'post')
  const homeLeft = left.filter((g) => g.homeAway === 'home' && !g.neutralSite).length

  const programTile = (team) => {
    const d = data[team]
    if (!d || !d.schedule) return null
    const rec = records(d.schedule, null)
    const rank = d.poll ? (d.poll.ranks.find((r) => r.teamId === CONFIG.TEAM_ID) || {}).current : null
    const label = `${CONFIG.TEAMS[team].label} hockey`
    return rank
      ? [`No. ${rank}`, `${label} in the national poll (USCHO) · ${fmt(rec.overall)} this season`]
      : [fmt(rec.overall), `${label} record this season`]
  }
  const tiles = [
    ...PROGRAMS.map(programTile).filter(Boolean),
    loaded && [String(left.length), `games still to play across both programs this season`],
    loaded && [String(homeLeft), 'home dates left at the Kohl Center and LaBahn Arena'],
  ].filter(Boolean)

  const moments = marquee(data)
  const reporting = Boolean(CONFIG.ANALYTICS.domain)

  return (
    <>
      <div className="wrap wrap--head">
        <Masthead />
        <div className="sp-band">
          <div className="sp-band__kicker">Sponsorships · {CONFIG.SEASON_LABEL} season</div>
          <h1 className="sp-band__title">Put your name on Badgers hockey</h1>
          <p className="sp-band__sub">
            Two nationally ranked programs, one live tracker — men's and women's Wisconsin
            hockey, inside central Wisconsin's local news source.
          </p>
          <div className="sp-band__row">
            <Cta
              subject={subjectLine(`${CONFIG.SEASON_LABEL} season`)}
              slot="media-kit-header"
              label="Start the conversation"
              big
            />
            {loaded && left.length > 0 && (
              <span className="sp-band__urgency">
                {left.length} of {all.length} games still to play — through the Frozen Four
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="stripe" role="presentation" />

      <div className="wrap">
        {tiles.length > 0 && (
          <div className="sp-tiles">
            {tiles.map(([num, text]) => (
              <div className="sp-tile" key={text}>
                <div className="sp-tile__num">{num}</div>
                <div className="sp-tile__text">{text}</div>
              </div>
            ))}
          </div>
        )}

        {moments.length > 0 && (
          <section className="section">
            <h2 className="section__title">The big dates ahead</h2>
            <p className="section__sub">
              Your brand rides along on every one of these — pulled live from the schedule.
            </p>
            <div className="sp-moments">
              {moments.map(({ team, g, why }) => (
                <div className="sp-moment" key={`${team}-${g.id}`}>
                  <div className="sp-moment__date">
                    {gameDate(g, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div>
                    <div className="sp-moment__what">
                      {CONFIG.TEAMS[team].label} {vsAt(g)} {g.them.short}
                      <span className="sp-moment__why">{why}</span>
                    </div>
                    <div className="sp-moment__where">
                      {[g.venue && g.venue.name, g.venue && g.venue.city].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="section">
          <h2 className="section__title">The placements</h2>
          <p className="section__sub">
            Status reads live from the tracker itself — when a placement sells, this page says so.
          </p>
          {INVENTORY.map((item) => {
            const sold = item.sold()
            return (
              <div className="sp-row" key={item.key}>
                <div className="sp-row__main">
                  <div className="sp-row__head">
                    <span className="sp-row__name">{item.name}</span>
                    <span className={`sp-status${sold ? ' sp-status--sold' : ''}`}>
                      {sold ? 'Sold' : 'Open'}
                    </span>
                  </div>
                  <p className="sp-row__desc">{item.desc}</p>
                </div>
                <div className="sp-row__actions">
                  <a className="sp-see" href={item.demo} target="_blank" rel="noopener noreferrer">
                    See it live →
                  </a>
                  {!sold && (
                    <Cta subject={subjectLine(item.name)} slot={`media-kit-${item.key}`} label="Inquire" />
                  )}
                </div>
              </div>
            )
          })}
        </section>

        <section className="section">
          <h2 className="section__title">This isn't a mockup</h2>
          <p className="section__sub">
            The real cards, on live ESPN data, shown with a sample sponsor line where yours would go.
          </p>
          <div className="sp-embeds">
            <iframe id="sp-demo-mini" src="mini.html?demo" title="Live Badgers hockey scoreboard (sample sponsor line)" />
            <iframe id="sp-demo-season" src="mini-season.html?demo" title="Live Badgers hockey season card (sample sponsor line)" />
          </div>
        </section>

        <div className="sp-note">
          <div className="sp-note__title">Built to be measured</div>
          <p className="sp-note__text">
            {reporting
              ? 'Every placement reports its own numbers — views and per-placement click-throughs, measured without cookies. '
              : 'Every placement is click-tracked on its own, and there are no cookies or consent banners between a reader and your brand. '}
            Your link carries your campaign tags, so visits from the tracker show up in your own
            analytics too. Screenshots on request.
          </p>
        </div>

        <div className="sp-close">
          <Cta
            subject={subjectLine(`${CONFIG.SEASON_LABEL} season`)}
            slot="media-kit-footer"
            label={`Book a placement for the ${CONFIG.SEASON_LABEL} season`}
            big
          />
          <div className="sp-close__contact">
            {CONFIG.SPONSOR_INQUIRY} · 715-301-5539 · Wausau Pilot &amp; Review
          </div>
        </div>

        <footer className="footer">
          <img
            className="footer__badge"
            src={CONFIG.WPR_BADGE}
            alt=""
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <div>
            <p>
              The tracker is not affiliated with or endorsed by the University of Wisconsin, the
              Big Ten Conference, the WCHA or ESPN. Data via ESPN's public feeds.{' '}
              <a className="sp-see" href="./">
                See the tracker →
              </a>
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
