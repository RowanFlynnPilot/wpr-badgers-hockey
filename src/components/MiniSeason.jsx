import React, { useEffect, useState } from 'react'
import { CONFIG } from '../config.js'
import { fetchSchedule, fetchStandings, fetchPoll } from '../api.js'
import { destination } from '../embed.js'
import { track } from '../analytics.js'
import { gameDate, vsAt } from '../format.js'
import { records, fmt } from '../record.js'
import Sponsor from './Sponsor.jsx'

const PROGRAMS = Object.keys(CONFIG.TEAMS)

// Both programs at a glance: USCHO rank, overall and conference record,
// and the next game. One row per program; the whole card is one link.
export default function MiniSeason() {
  const [data, setData] = useState({})

  useEffect(() => {
    const load = () =>
      PROGRAMS.forEach((team) => {
        const set = (field) => (v) =>
          setData((d) => ({ ...d, [team]: { ...d[team], [field]: v } }))
        fetchSchedule(team).then(set('schedule')).catch(() => {})
        fetchStandings(team).then(set('standings')).catch(() => {})
        fetchPoll(team).then(set('poll')).catch(() => {})
      })
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

  const rows = PROGRAMS.map((team) => {
    const d = data[team] || {}
    if (!d.schedule) return null
    const program = CONFIG.TEAMS[team]
    const ids = new Set(program.conferenceIds || (d.standings || []).map((s) => s.teamId))
    const rec = records(d.schedule, ids.size ? ids : null)
    const rank = d.poll ? (d.poll.ranks.find((r) => r.teamId === CONFIG.TEAM_ID) || {}).current : null
    const next = d.schedule.find((g) => g.state !== 'post')
    return { team, program, rec, rank, next }
  }).filter(Boolean)

  return (
    <a
      className="mini"
      href={destination(CONFIG.CANONICAL_URL)}
      target="_top"
      onClick={() => track('Mini Click', { widget: 'season' })}
    >
      <div className="mini__kicker">Badgers hockey · {CONFIG.SEASON_LABEL}</div>
      {!rows.length ? (
        <div className="mini__meta">Loading…</div>
      ) : (
        rows.map(({ team, program, rec, rank, next }) => (
          <div className="seasonrow" key={team}>
            <div className="seasonrow__head">
              <span className="seasonrow__name">
                {rank && <span className="seasonrow__rank">#{rank} </span>}
                {program.label}
              </span>
              <span className="seasonrow__rec">{rec.played ? fmt(rec.overall) : '0–0–0'}</span>
            </div>
            <div className="mini__meta">
              {rec.conf && rec.confPlayed ? `${program.conference} ${fmt(rec.conf)}` : program.conference}
              {next &&
                ` · ${next.state === 'in' ? 'Live now' : 'Next'} ${vsAt(next)} ${next.them.short}${
                  next.state === 'in' ? '' : `, ${gameDate(next, { month: 'short', day: 'numeric' })}`
                }`}
            </div>
          </div>
        ))
      )}
      <div className="mini__cta">Full Badgers hockey tracker →</div>
      <Sponsor
        slot={CONFIG.MINI_SPONSOR}
        placement="mini-season"
        className="mini__sponsor"
        variant="credit"
        linkless
      />
    </a>
  )
}
