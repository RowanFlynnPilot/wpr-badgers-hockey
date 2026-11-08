import React, { useEffect, useRef, useState } from 'react'
import { CONFIG } from '../config.js'
import { fetchSchedule } from '../api.js'
import { destination } from '../embed.js'
import { track } from '../analytics.js'
import { gameDate, gameTime, liveLabel, vsAt } from '../format.js'
import { seriesInfo } from './Hero.jsx'
import Sponsor from './Sponsor.jsx'

const HOUR = 3_600_000
const DAY = 24 * HOUR
const PROGRAMS = Object.keys(CONFIG.TEAMS)

// Compact featured-game card for sidebars and articles, in the same family
// as the football/Packers/Brewers minis. It features ONE game across BOTH
// programs — whichever is live, else a final from the last 36 hours, else
// the sooner next puck drop — and says which program it is. `?team=mens` or
// `?team=womens` pins it to one program. The whole card is one real link.
const pinned = new URLSearchParams(window.location.search).get('team')
const programs = PROGRAMS.includes(pinned) ? [pinned] : PROGRAMS

export default function MiniGame() {
  const [schedules, setSchedules] = useState({})
  const [now, setNow] = useState(Date.now())
  const [pop, setPop] = useState(false)
  const prevScore = useRef(null)

  // Same cadence as every surface: 60s, skipped while hidden, refreshed on
  // return. A failed poll keeps the last good schedule.
  useEffect(() => {
    const load = () =>
      programs.forEach((team) =>
        fetchSchedule(team)
          .then((s) => setSchedules((prev) => ({ ...prev, [team]: s })))
          .catch(() => {}),
      )
    load()
    const tick = () => {
      if (!document.hidden) load()
    }
    const id = setInterval(tick, 60_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const pick = featured(schedules, now)
  const game = pick ? pick.game : null
  const team = pick ? pick.team : programs[0]
  const state = game ? game.state : null
  const live = state === 'in'
  const final = Boolean(game && game.completed)

  // Pop the score once whenever it changes during play (never on first paint).
  const scoreKey = game && state !== 'pre' ? `${game.id}:${game.us.score}-${game.them.score}` : null
  useEffect(() => {
    if (scoreKey == null) {
      prevScore.current = null
      return
    }
    if (prevScore.current != null && prevScore.current !== scoreKey && prevScore.current.split(':')[0] === scoreKey.split(':')[0]) {
      prevScore.current = scoreKey
      setPop(true)
      const t = setTimeout(() => setPop(false), 600)
      return () => clearTimeout(t)
    }
    prevScore.current = scoreKey
  }, [scoreKey])

  const linkProps = {
    href: destination(`${CONFIG.CANONICAL_URL}`),
    target: '_top',
    onClick: () => track('Mini Click', { widget: 'scoreboard', team, state: state || 'none' }),
  }
  const edge = (
    <div className="minigame__edge" aria-hidden="true">
      <span />
      <span />
    </div>
  )
  const footer = (
    <div className="minigame__footer">
      <Sponsor
        slot={CONFIG.MINI_SPONSOR}
        placement="mini-scoreboard"
        className="minigame__sponsor"
        variant="credit"
        linkless
      />
      <span className="minigame__cta">Full tracker →</span>
    </div>
  )

  if (!game) {
    return (
      <a {...linkProps} className="minigame">
        {edge}
        <div className="minigame__band">Badgers hockey</div>
        <div className="minigame__body">
          <div className="minigame__doorway">Badgers hockey, by the numbers</div>
          <div className="minigame__line">Men's &amp; women's scores, schedules and the USCHO poll</div>
          {footer}
        </div>
      </a>
    )
  }

  const program = CONFIG.TEAMS[team]
  const { us, them } = game
  const schedule = schedules[team]
  const series = state === 'pre' ? seriesInfo(schedule, game) : null
  const pill = state === 'pre' ? countdown(game, now) : null
  const venue =
    state === 'pre'
      ? game.note ||
        (game.homeAway === 'home' && !game.neutralSite
          ? program.arena
          : game.venue
            ? [game.venue.name, game.venue.city].filter(Boolean).join(' · ')
            : '')
      : ''
  const resultWord = final ? { W: 'Badgers win', L: 'Final', T: 'Tie' }[game.result] : null

  return (
    <a {...linkProps} className={`minigame${live ? ' is-live' : ''}`}>
      {edge}
      <div className="minigame__band">
        {live && <span className="minigame__dot" />}
        {program.label} hockey · {live ? 'Live' : final ? 'Final' : 'Next game'}
      </div>
      <div className="minigame__body">
        <div className="minigame__kicker">{kicker(game)}</div>
        {pill && <div className="minigame__pill">Puck drop in {pill}</div>}
        {final && game.result === 'W' && (
          <div className="minigame__win">
            <b>W</b>
            {resultWord}
            {game.overtime ? ' in OT' : ''}
          </div>
        )}

        <div className="minigame__matchup">
          <TeamCol side={us} name={CONFIG.TEAM_SHORT} winner={final && game.result === 'W'} />
          {live || final ? (
            <span className={`minigame__score${pop ? ' is-pop' : ''}`}>
              <span className={final && game.result === 'W' ? 'is-winner' : undefined}>
                {us.score}
              </span>
              <span className="minigame__dash"> – </span>
              {them.score}
            </span>
          ) : (
            <span className="minigame__vs">{vsAt(game)}</span>
          )}
          <TeamCol side={them} name={them.short} winner={final && game.result === 'L'} />
        </div>

        {final && game.result !== 'W' && (
          <div className="minigame__line">
            {game.result === 'T' ? 'Tie' : 'Loss'}
            {game.overtime ? ' in overtime' : ''}
          </div>
        )}
        {series && (
          <div className="minigame__line">Weekend series · game {series.index} of 2</div>
        )}
        {venue && <div className="minigame__line">{venue}</div>}
        {footer}
      </div>
    </a>
  )
}

function TeamCol({ side, name, winner }) {
  return (
    <span className="minigame__team">
      {side.logo && <img src={side.logo} alt="" />}
      <span className={`minigame__name${winner ? ' is-winner' : ''}`}>
        {side.rank && <span className="minigame__rank">#{side.rank} </span>}
        {name}
      </span>
    </span>
  )
}

// Across the programs: a live game first; else a final from the last 36
// hours (a Sunday reader still sees Saturday night's result); else the
// sooner next game; else the latest final.
function featured(schedules, now) {
  const entries = programs
    .filter((t) => schedules[t])
    .map((t) => ({ team: t, s: schedules[t] }))
  if (!entries.length) return null
  for (const { team, s } of entries) {
    const live = s.find((g) => g.state === 'in')
    if (live) return { team, game: live }
  }
  const recent = entries
    .map(({ team, s }) => ({ team, game: [...s].reverse().find((g) => g.completed) }))
    .filter((x) => x.game && now - x.game.date < 36 * HOUR)
    .sort((a, b) => b.game.date - a.game.date)[0]
  if (recent) return recent
  const next = entries
    .map(({ team, s }) => ({ team, game: s.find((g) => g.state === 'pre') }))
    .filter((x) => x.game)
    .sort((a, b) => a.game.date - b.game.date)[0]
  if (next) return next
  return entries
    .map(({ team, s }) => ({ team, game: [...s].reverse().find((g) => g.completed) }))
    .filter((x) => x.game)
    .sort((a, b) => b.game.date - a.game.date)[0] || null
}

// "Fri, Nov 13 · 7:00 PM CT · B1G+" (uppercased in CSS), "Today" on game day.
function kicker(game) {
  if (game.state === 'in') return liveLabel(game)
  const opts = { weekday: 'short', month: 'short', day: 'numeric' }
  const day = gameDate(game, opts)
  if (game.completed) return day
  const today = new Date().toLocaleDateString('en-US', { ...opts, timeZone: CONFIG.TIMEZONE })
  const time = gameTime(game)
  return [day === today ? 'Today' : day, time ? `${time} ${CONFIG.TIMEZONE_LABEL}` : 'Time TBA', game.tv]
    .filter(Boolean)
    .map((part) => part.replace(/ /g, ' '))
    .join(' · ')
}

// "4 days" until the last 12 hours, then "3h 31m" (real times only).
function countdown(game, now) {
  const ms = game.date - now
  if (ms <= 0) return null
  if (ms < 12 * HOUR) {
    if (!game.timeValid) return null
    const h = Math.floor(ms / HOUR)
    const m = Math.floor((ms % HOUR) / 60_000)
    return h ? `${h}h ${m}m` : `${m}m`
  }
  const days = Math.ceil(ms / DAY)
  return `${days} day${days === 1 ? '' : 's'}`
}
