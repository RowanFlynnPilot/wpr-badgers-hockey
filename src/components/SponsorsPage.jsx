import React, { useEffect, useState } from 'react'
import { CONFIG } from '../config.js'
import { useInquiry } from '../useInquiry.js'
import { gameDate, vsAt } from '../format.js'
import { PROGRAMS, INVENTORY, loadPitchData, pitchNumbers, marquee } from '../pitch.js'
import Masthead from './Masthead.jsx'

// The hosted media kit (sponsors.html) — the one URL WPR sales sends.
// Everything a buyer reads is LIVE: rankings, records, games left and the
// marquee dates come from the same ESPN feeds as the tracker, and each
// placement's Open/Sold status reads config.js — so this page never goes
// stale the way a deck does. ?demo links show each placement in situ.

const subjectLine = (what) => `Badgers hockey tracker sponsorship — ${what}`
const mailto = (subject) =>
  `mailto:${CONFIG.SPONSOR_INQUIRY}?subject=${encodeURIComponent(subject)}`

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

export default function SponsorsPage() {
  const [data, setData] = useState({})

  useEffect(() => loadPitchData(setData), [])

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

  const { loaded, total, left, homeLeft, programs } = pitchNumbers(data)
  const tiles = [
    ...programs.map((p) =>
      p.rank
        ? [`No. ${p.rank}`, `${p.label} hockey in the national poll (USCHO) · ${p.record} this season`]
        : [p.record, `${p.label} hockey record this season`],
    ),
    loaded && [String(left), 'games still to play across both programs this season'],
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
            {loaded && left > 0 && (
              <span className="sp-band__urgency">
                {left} of {total} games still to play — through the Frozen Four
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
