import React from 'react'
import { CONFIG } from '../config.js'
import { fmt } from '../record.js'
import Section from './Section.jsx'

// Season numbers, computed from Wisconsin's own results (record.js) —
// including the conference record ESPN's standings don't carry. Renders
// nothing until a game has been played.
export default function Pulse({ team, rec }) {
  if (!rec || !rec.played) return null
  const program = CONFIG.TEAMS[team]

  const cells = [[fmt(rec.overall), 'Overall']]
  if (rec.conf && rec.confPlayed) cells.push([fmt(rec.conf), program.conference])
  cells.push(
    [fmt(rec.home), 'Home'],
    [fmt(rec.away), 'Road'],
    [rec.gfPerGame.toFixed(2), 'Goals for / game'],
    [rec.gaPerGame.toFixed(2), 'Goals against / game'],
    [rec.streak, 'Streak'],
  )

  return (
    <Section title="Season pulse" sub="Records read W–L–T.">
      <div className="pulse">
        {cells.map(([num, label]) => (
          <div className="pulse__cell" key={label}>
            <div className="pulse__num">{num}</div>
            <div className="pulse__label">{label}</div>
          </div>
        ))}
      </div>
    </Section>
  )
}
