import React, { useEffect, useState } from 'react'
import { CONFIG } from '../config.js'
import { fetchSchedule } from '../api.js'
import { useInquiry } from '../useInquiry.js'
import Masthead from './Masthead.jsx'

// The hosted media kit (sponsors.html) — one URL that sells the tracker.
// The inventory is drawn LIVE from config: the moment a slot is filled in
// config.js it flips to "Sold" here, so this page can never go stale the
// way a deck does. Live mini embeds prove the product works, ?demo links
// show each placement in situ, and every CTA lands on the sales desk.
// Linked from the tracker footer; the direct URL is what WPR sales sends.

const mailto = (subject) =>
  `mailto:${CONFIG.SPONSOR_INQUIRY}?subject=${encodeURIComponent(subject)}`

const INVENTORY = [
  {
    key: 'title',
    name: 'Title sponsorship — the flagship',
    desc: "Your lockup on the cardinal banner above every tab of BOTH programs — men's and women's — on every load, phones included (the slot wraps, never hides).",
    sold: () => !!CONFIG.TITLE_SPONSOR,
    demo: './?demo',
  },
  {
    key: 'schedule',
    name: 'Schedule section band',
    desc: 'A branded band anchored under the full 30-plus-game slate for each program — the tab readers return to all week for puck-drop times, streams and results.',
    sold: () => !!CONFIG.SCHEDULE_SPONSOR,
    demo: './?demo&tab=Schedule',
  },
  {
    key: 'minis',
    name: 'The mini card network',
    desc: "Your line at the foot of both compact cards — the sidebar scoreboard (whichever Badgers team plays next) and the men's + women's season card — wherever they run across Wausau Pilot & Review.",
    sold: () => !!CONFIG.MINI_SPONSOR,
    demo: './mini.html?demo',
  },
]

const WHY = [
  ['2 teams', "men's and women's hockey — two seasons of games under one placement"],
  ['Oct–Apr', 'the full arc — opening weekend through the Frozen Four, self-updating'],
  ['0', 'cookies — no consent banner between a reader and your brand'],
  ['Per-slot', 'reporting — impressions and clicks for your placement, measured cookieless'],
]

function Cta({ subject, slot, label, big }) {
  const { onClick, copied } = useInquiry(slot)
  return (
    <span className="sp-ctawrap">
      <a
        className={`sp-cta${big ? ' sp-cta--big' : ''}`}
        href={mailto(subject)}
        onClick={onClick}
      >
        {label}
      </a>
      {copied && (
        <span className="sp-copied">
          ✓ {CONFIG.SPONSOR_INQUIRY} copied — paste it into any email
        </span>
      )}
    </span>
  )
}

export default function SponsorsPage() {
  const [days, setDays] = useState(null)

  useEffect(() => {
    let alive = true
    Promise.all(['mens', 'womens'].map((t) => fetchSchedule(t).catch(() => [])))
      .then((all) => all.flat().sort((a, b) => a.date - b.date))
      .then((games) => {
        const opener = games.find((g) => g.state === 'pre')
        if (alive && opener)
          setDays(Math.ceil((opener.date - Date.now()) / 86_400_000))
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  // The embedded minis autosize like they do on WPR — same listener as the
  // README snippets, source-checked per frame.
  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin !== window.location.origin) return
      if (!e.data || e.data.type !== 'wpr-badgers-height') return
      for (const id of ['sp-demo-mini', 'sp-demo-season']) {
        const frame = document.getElementById(id)
        if (frame && e.source === frame.contentWindow)
          frame.style.height = `${e.data.height}px`
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return (
    <>
      <div className="wrap wrap--head">
        <Masthead />
        <div className="sp-band">
          <div className="sp-band__kicker">
            Sponsorships · {CONFIG.SEASON_LABEL} season
          </div>
          <h1 className="sp-band__title">
            Put your brand on Badgers hockey
          </h1>
          <p className="sp-band__sub">
            A live, season-long Wisconsin hockey experience — men's and women's — inside
            Wisconsin's most local news brand — with your name on it.
          </p>
          <div className="sp-band__row">
            <Cta
              subject={`Badgers hockey tracker sponsorship — ${CONFIG.SEASON_LABEL} season`}
              slot="media-kit-header"
              label="Start the conversation"
              big
            />
            {days > 0 && (
              <span className="sp-band__urgency">
                Next puck drop in {days} day{days === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="stripe" role="presentation" />

      <div className="wrap">
        <div className="sp-tiles">
          {WHY.map(([num, text]) => (
            <div className="sp-tile" key={num}>
              <div className="sp-tile__num">{num}</div>
              <div className="sp-tile__text">{text}</div>
            </div>
          ))}
        </div>

        <section className="section">
          <h2 className="section__title">What's on the board</h2>
          <p className="section__sub">
            Status is live from the widget's own config — when a slot sells,
            this page says so on its own.
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
                  <a
                    className="sp-see"
                    href={item.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    See it live →
                  </a>
                  {!sold && (
                    <Cta
                      subject={`Badgers hockey tracker sponsorship — ${item.name}`}
                      slot={`media-kit-${item.key}`}
                      label="Inquire"
                    />
                  )}
                </div>
              </div>
            )
          })}
        </section>

        <section className="section">
          <h2 className="section__title">This isn't a mockup</h2>
          <p className="section__sub">
            These are the real widgets pulling the same live ESPN data
            readers see, shown here in demo mode with the sponsor line
            filled. The same cards run across Wausau Pilot &amp; Review.
          </p>
          <div className="sp-embeds">
            <iframe
              id="sp-demo-mini"
              src="mini.html?demo"
              title="Live Badgers hockey scoreboard (demo sponsor line)"
              loading="lazy"
            />
            <iframe
              id="sp-demo-season"
              src="mini-season.html?demo"
              title="Live Badgers hockey season card (demo sponsor line)"
              loading="lazy"
            />
          </div>
        </section>

        <div className="sp-note">
          <div className="sp-note__title">Provable, not promised</div>
          <p className="sp-note__text">
            Every placement reports its own numbers — impressions and
            per-slot click-throughs, measured cookieless. Your link carries
            your campaign tags, so the traffic shows up in your own
            analytics too. Screenshots and a one-pager available on request.
          </p>
        </div>

        <div className="sp-close">
          <Cta
            subject={`Badgers hockey tracker sponsorship — ${CONFIG.SEASON_LABEL} season`}
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
              The tracker is not affiliated with or endorsed by the University
              of Wisconsin, the Big Ten Conference, the WCHA or ESPN. Data via ESPN's
              public feeds.{' '}
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
