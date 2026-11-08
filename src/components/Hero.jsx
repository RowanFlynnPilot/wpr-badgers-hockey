import React, { useEffect, useState } from 'react'
import { CONFIG } from '../config.js'
import { gameDate, gameTime, liveLabel, resultLine, vsAt } from '../format.js'
import { fmt } from '../record.js'

const HOUR = 3_600_000
const DAY = 24 * HOUR

function countdown(game) {
  const ms = game.date - Date.now()
  // Hours-mode only when the time is real; TBA stamps are midnight-Eastern
  // placeholders, only day-accurate.
  if (game.timeValid && ms < HOUR) return 'Puck drop within the hour'
  if (game.timeValid && ms < DAY) {
    const hours = Math.round(ms / HOUR)
    return `Puck drop in ${hours} hour${hours === 1 ? '' : 's'}`
  }
  const days = Math.ceil(ms / DAY)
  if (days < 1) return 'Game day'
  return `Puck drop in ${days} day${days === 1 ? '' : 's'}`
}

function venueLine(game) {
  if (!game.venue) return ''
  const place = [game.venue.name, game.venue.city].filter(Boolean).join(' · ')
  return game.neutralSite ? `${place} (neutral site)` : place
}

// College hockey plays weekend series: back-to-back games, same opponent,
// same rink. "Game 1 of 2" tells readers there's a rematch tomorrow.
export function seriesInfo(schedule, game) {
  const i = schedule.indexOf(game)
  const same = (g) => g && g.them.id === game.them.id && Math.abs(g.date - game.date) < 2.5 * DAY
  if (same(schedule[i + 1])) return { index: 1, of: 2 }
  if (same(schedule[i - 1])) return { index: 2, of: 2 }
  return null
}

function TeamChip({ team }) {
  return (
    <span className="hero__team">
      {team.logo && <img src={team.logo} alt="" />}
      {team.rank && <span className="rankchip">#{team.rank}</span>}
      {team.name}
    </span>
  )
}

export default function Hero({ team, schedule, ourRank, rec }) {
  // Re-render every minute so the countdown stays honest.
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const program = CONFIG.TEAMS[team]
  const live = schedule.find((g) => g.state === 'in')
  const next = schedule.find((g) => g.state === 'pre')
  const last = [...schedule].reverse().find((g) => g.completed)
  const us = (g) => ({ ...g.us, name: `Wisconsin ${program.label}`, rank: ourRank || g.us.rank })

  if (live) {
    return (
      <div className="hero">
        <div className="hero__kicker">
          <span className="hero__live">Live</span> {liveLabel(live)}
          {live.note && ` · ${live.note}`}
        </div>
        <div className="hero__matchup">
          <TeamChip team={us(live)} />
          {/* polite: announce goals, not every clock tick */}
          <span className="hero__score" aria-live="polite">
            {live.us.score}–{live.them.score}
          </span>
          <TeamChip team={live.them} />
        </div>
        <div className="hero__meta">
          {venueLine(live)}
          {live.tv && ` · ${live.tv}`}
        </div>
      </div>
    )
  }

  if (next) {
    const time = gameTime(next)
    const series = seriesInfo(schedule, next)
    const homeRink = next.homeAway === 'home' && !next.neutralSite
    return (
      <div className="hero">
        <div className="hero__kicker">
          {[
            next.note,
            series ? `Weekend series · game ${series.index} of ${series.of}` : '',
            homeRink ? program.arena : venueLine(next),
          ]
            .filter(Boolean)
            .join(' · ')}
        </div>
        <div className="hero__count">{countdown(next)}</div>
        <div className="hero__matchup">
          <TeamChip team={us(next)} />
          <span className="hero__vs">{vsAt(next).toUpperCase()}</span>
          <TeamChip team={next.them} />
        </div>
        <div className="hero__meta">
          {gameDate(next, { weekday: 'short', month: 'short', day: 'numeric' })}
          {time ? `, ${time} ${CONFIG.TIMEZONE_LABEL}` : ' · time TBA'}
          {next.tv && ` · ${next.tv}`}
        </div>
        {last && (
          <div className="hero__meta" style={{ marginTop: 10 }}>
            Last time out: {resultLine(last)} {vsAt(last)} {last.them.short}
            {rec && rec.played ? ` · ${fmt(rec.overall)} overall` : ''}
          </div>
        )}
      </div>
    )
  }

  if (last) {
    return (
      <div className="hero">
        <div className="hero__kicker">Season complete</div>
        <div className="hero__count">{fmt(rec.overall)}</div>
        <div className="hero__meta">
          Final game: {resultLine(last)} {vsAt(last)} {last.them.short}
          {last.note && ` · ${last.note}`}
        </div>
      </div>
    )
  }

  return null
}
