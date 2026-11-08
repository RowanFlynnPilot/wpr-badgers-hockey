import React, { useEffect, useState } from 'react'
import { CONFIG } from '../config.js'
import { fetchLineScore } from '../api.js'
import { gameDate, periodLabel, resultLine, vsAt } from '../format.js'
import Section from './Section.jsx'

// The latest final as a period-by-period box. ESPN carries no goal log or
// box stats for college hockey — the line score is what exists. Fail-soft:
// without it, the section still shows the result line.
export default function LastGame({ team, games }) {
  const last = games.length ? games[games.length - 1] : null
  const [line, setLine] = useState(null)

  useEffect(() => {
    setLine(null)
    if (!last) return
    let alive = true
    fetchLineScore(team, last.id)
      .then((l) => {
        if (alive) setLine(l)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [team, last && last.id])

  if (!last) return null
  const periods = line ? Math.max(line.us.length, line.them.length) : 0

  const row = (side, goals, total, ours) => (
    <tr className={ours ? 'row--us' : undefined}>
      <td>
        <span className="table__team">
          {side.logo && <img src={side.logo} alt="" loading="lazy" />}
          {ours ? CONFIG.TEAM_SHORT : side.short}
        </span>
      </td>
      {Array.from({ length: periods }, (_, i) => (
        <td className="num" key={i}>
          {goals[i] ?? '–'}
        </td>
      ))}
      <td className="num linescore__total">{total}</td>
    </tr>
  )

  // Away team on top, as box scores read; neutral games keep Wisconsin first.
  const usFirst = last.homeAway === 'away' || last.neutralSite
  const usRow = row(last.us, line ? line.us : [], last.us.score, true)
  const themRow = row(last.them, line ? line.them : [], last.them.score, false)

  return (
    <Section
      title="Latest game"
      sub={`${resultLine(last)} ${vsAt(last)} ${last.them.name} · ${gameDate(last, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })}${last.note ? ` · ${last.note}` : ''}`}
    >
      {line && periods > 0 && (
        <div className="tablewrap">
          <table className="table linescore">
            <thead>
              <tr>
                <th>Team</th>
                {Array.from({ length: periods }, (_, i) => (
                  <th className="num" key={i}>
                    {periodLabel(i + 1)}
                  </th>
                ))}
                {/* "F" (final), not the box-score "T" — T means tie here */}
                <th className="num">F</th>
              </tr>
            </thead>
            <tbody>
              {usFirst ? usRow : themRow}
              {usFirst ? themRow : usRow}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  )
}
