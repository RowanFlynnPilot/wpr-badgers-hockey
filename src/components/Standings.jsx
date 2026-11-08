import React from 'react'
import { CONFIG } from '../config.js'
import Section from './Section.jsx'

// The conference's teams by OVERALL record. ESPN's college-hockey
// standings carry no conference record or points (see api.js), so the table
// says exactly what it shows rather than pretending to be the league table;
// Wisconsin's own conference record is in the Season pulse. Renders nothing
// before anyone has played.
export default function Standings({ team, entries }) {
  if (!entries || !entries.length) return null
  if (entries.every((e) => !e.played)) return null
  const program = CONFIG.TEAMS[team]

  return (
    <Section
      title={`${program.conference} teams`}
      sub="Ranked by overall record (W–L–T). Wisconsin highlighted."
    >
      <div className="tablewrap">
        <table className="table table--hover">
          <thead>
            <tr>
              <th>Team</th>
              <th className="num">W–L–T</th>
              <th className="num">Win %</th>
              <th className="num">GP</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((row) => (
              <tr
                key={row.teamId}
                className={row.teamId === CONFIG.TEAM_ID ? 'row--us' : undefined}
              >
                <td>
                  <span className="table__team">
                    {row.logo && <img src={row.logo} alt="" loading="lazy" />}
                    {row.short}
                  </span>
                </td>
                <td className="num">{row.overall.replace(/-/g, '–')}</td>
                <td className="num">{row.winPct.toFixed(3).replace(/^0/, '')}</td>
                <td className="num">{row.played}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}
