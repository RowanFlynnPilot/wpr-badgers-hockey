import React from 'react'
import { CONFIG } from '../config.js'
import Section from './Section.jsx'

// The USCHO poll (men's top 20, women's top 15). Renders nothing until the
// CONFIG.SEASON poll exists (api.js refuses a stale prior-season poll).
// Records are as of the poll's Monday release — labeled as such, because
// they will trail the live record elsewhere on the page by a weekend.
export default function Rankings({ poll, schedule }) {
  if (!poll) return null
  const opponentIds = new Set(schedule.map((g) => g.them.id))

  const move = (r) => {
    if (!r.previous) return { text: 'new', cls: 'up', label: 'new to the poll' }
    const d = r.previous - r.current
    if (d > 0) return { text: `▲${d}`, cls: 'up', label: `up ${d}` }
    if (d < 0) return { text: `▼${-d}`, cls: 'down', label: `down ${-d}` }
    return { text: '–', cls: '', label: 'unchanged' }
  }

  const released = poll.released
    ? poll.released.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: CONFIG.TIMEZONE,
      })
    : null

  return (
    <Section
      title={poll.name.replace(/^\d{4}\s*/, '').replace(/'s Poll$/, "'s poll")}
      sub={[poll.week, released && `released ${released}`, 'records as of release']
        .filter(Boolean)
        .join(' · ')
        .replace(/^./, (c) => c.toUpperCase())}
    >
      <div className="tablewrap">
        <table className="table table--hover">
          <thead>
            <tr>
              <th className="num" style={{ textAlign: 'left' }}>#</th>
              <th>Team</th>
              <th className="num">Move</th>
              <th className="num">W–L–T</th>
            </tr>
          </thead>
          <tbody>
            {poll.ranks.map((row) => {
              const m = move(row)
              return (
                <tr
                  key={row.teamId}
                  className={row.teamId === CONFIG.TEAM_ID ? 'row--us' : undefined}
                >
                  <td className="num" style={{ width: 40, textAlign: 'left' }}>
                    {row.current}
                  </td>
                  <td>
                    <span className="table__team">
                      {row.logo && <img src={row.logo} alt="" loading="lazy" />}
                      {row.name}
                      {row.teamId !== CONFIG.TEAM_ID && opponentIds.has(row.teamId) && (
                        <span className="tag">on the slate</span>
                      )}
                    </span>
                  </td>
                  <td className={`num pollmove pollmove--${m.cls}`}>
                    <span aria-label={m.label}>{m.text}</span>
                  </td>
                  <td className="num">{row.record.replace(/-/g, '–')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Section>
  )
}
