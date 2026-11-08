import React, { useEffect, useState } from 'react'
import { CONFIG } from '../config.js'
import { gameDate, vsAt } from '../format.js'
import { INVENTORY, loadPitchData, pitchNumbers, marquee, chartPrograms } from '../pitch.js'
import SeasonChart from './SeasonChart.jsx'

// The printable one-pager (one-pager.html): one US Letter sheet for the
// sales desk to print or attach. Same live numbers as sponsors.html
// (pitch.js). scripts/one-pager.mjs prints it to PDF and drops a QR code
// into #op-qr; opened in a browser, the URL under the QR spot is the
// fallback. `data-ready` tells the print script the live data has landed.
export default function OnePager() {
  const [data, setData] = useState({})
  useEffect(() => loadPitchData(setData), [])

  const { loaded, total, left, homeLeft, programs } = pitchNumbers(data)
  const pollsIn = programs.length === 2 && programs.every((p) => data[p.team].poll !== undefined)
  const moments = marquee(data, 5)
  const charts = chartPrograms(data)
  const ready = loaded && pollsIn
  const asOf = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: CONFIG.TIMEZONE,
  })

  return (
    <div className="op" data-ready={ready ? 'true' : undefined}>
      <header className="op-mast">
        <div className="op-flag">
          <img src={CONFIG.WPR_BADGE} alt="" />
          <img className="op-wordmark" src={CONFIG.WPR_LOGO} alt="Wausau Pilot & Review" />
        </div>
        <div className="op-tagline">{CONFIG.WPR_TAGLINE}</div>
      </header>

      <section className="op-band">
        <div className="op-kicker">Sponsorship opportunity · {CONFIG.SEASON_LABEL} season</div>
        <h1>Put your name on Badgers hockey</h1>
        <p>
          Two nationally ranked programs, one live tracker: men's and women's Wisconsin
          hockey from Wausau Pilot &amp; Review, with scores, schedules, polls and recaps
          that update on their own all season.
        </p>
      </section>
      <div className="op-stripe" />

      <section className="op-stats">
        {programs.map((p) => (
          <div className="op-stat" key={p.team}>
            <div className="op-stat__num">{p.rank ? `No. ${p.rank}` : p.record}</div>
            <div className="op-stat__label">
              {p.label} hockey{p.rank ? ', national poll' : ' record'}
              {p.rank && <span className="op-nowrap">{p.record} this season</span>}
            </div>
          </div>
        ))}
        <div className="op-stat">
          <div className="op-stat__num">{loaded ? left : '—'}</div>
          <div className="op-stat__label">of {total || '—'} games still to play</div>
        </div>
        <div className="op-stat">
          <div className="op-stat__num">{loaded ? homeLeft : '—'}</div>
          <div className="op-stat__label">home dates left in Madison</div>
        </div>
      </section>

      {charts.length > 0 && (
        <section className="op-charts">
          {charts.map(({ team, ...props }) => (
            <SeasonChart key={team} {...props} className="sc--print" />
          ))}
          <div className="op-charts__key">
            Each bar is a game: up for a win, down for a loss, height = goal margin. Light cardinal
            marks a home date still to come.
          </div>
        </section>
      )}

      <div className="op-cols">
        <section>
          <h2>The placements</h2>
          {INVENTORY.map((item) => (
            <div className="op-place" key={item.key}>
              <div className="op-place__head">
                <span>{item.short}</span>
                <span className={`op-status${item.sold() ? ' is-sold' : ''}`}>
                  {item.sold() ? 'Sold' : 'Open'}
                </span>
              </div>
              <p>{item.print}</p>
            </div>
          ))}
        </section>

        <section>
          <h2>The big dates ahead</h2>
          {moments.map(({ team, g, why }) => (
            <div className="op-moment" key={`${team}-${g.id}`}>
              <div className="op-moment__date">
                {gameDate(g, { month: 'short', day: 'numeric' })}
              </div>
              <div>
                <div className="op-moment__what">
                  {CONFIG.TEAMS[team].label} {vsAt(g)} {g.them.short}
                </div>
                <div className="op-moment__why">
                  {why}
                  {g.venue && g.venue.name ? ` · ${g.venue.name}` : ''}
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>

      <section className="op-why">
        <div>
          <h3>Live all season</h3>
          <p>
            Scores, standings and polls update every minute from ESPN. Your placement
            stays fresh from October through the Frozen Four with no one touching it.
          </p>
        </div>
        <div>
          <h3>Two teams, one buy</h3>
          <p>
            Men's and women's hockey share one tracker, so every placement covers all{' '}
            {total || 'of the'} games across two of the country's top programs.
          </p>
        </div>
        <div>
          <h3>Local and trusted</h3>
          <p>
            It runs on Wausau Pilot &amp; Review, where locals look first for news, and its
            cards appear in sidebars and hockey coverage across the site.
          </p>
        </div>
      </section>

      <section className="op-contact">
        <div>
          <div className="op-contact__kicker">Let's talk</div>
          <div className="op-contact__name">Chris Weber · Advertising</div>
          <div className="op-contact__line">{CONFIG.SPONSOR_INQUIRY}</div>
          <div className="op-contact__line">715-301-5539</div>
        </div>
        <div className="op-qrwrap">
          <div id="op-qr" className="op-qr" />
          <div className="op-qrlabel">
            See every placement live
            <span>
              rowanflynnpilot.github.io/
              <wbr />
              wpr-badgers-hockey/
              <wbr />
              sponsors.html
            </span>
          </div>
        </div>
      </section>

      <footer className="op-foot">
        Figures as of {asOf}, from live ESPN data. Wausau Pilot &amp; Review is not affiliated
        with or endorsed by the University of Wisconsin, the Big Ten Conference, the WCHA or
        ESPN. · Wausau Pilot &amp; Review · 715-301-5539
      </footer>
    </div>
  )
}
