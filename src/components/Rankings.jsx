import React from 'react'
import { CONFIG } from '../config.js'
import Section from './Section.jsx'

// The USCHO poll (men's top 20, women's top 15). Renders nothing until the
// CONFIG.SEASON poll exists (api.js refuses a stale prior-season poll).
export default function Rankings({ poll, schedule }) {
  if (!poll) return null
  const opponentIds = new Set(schedule.map((g) => g.them.id))

  const move = (r) => {
    if (!r.previous) return { text: 'new', cls: 'up' }
    const d = r.previous - r.current
    if (d > 0) return { text: `▲${d}`, cls: 'up' }
    if (d < 0) return { text: `▼${-d}`, cls: 'down' }
    return { text: '–', cls: '' }
  }

  return (
    <Section
      title={poll.name.replace(/'s Poll$/, "'s poll")}
      sub="Badgers in cardinal; teams on the Wisconsin schedule tagged."
    >
      <div className="tablewrap">
        <table className="table table--hover">
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
                  <td className={`num pollmove pollmove--${m.cls}`}>{m.text}</td>
                  <td className="num">{row.record}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Section>
  )
}
